import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import Admin from '../models/Admin.js';
import { pool } from '../database/connection.js';
import { runMigrations } from '../database/migrationRunner.js';
import Usuario from '../models/Usuario.js';

const SENHA_MIN = 8;
const SENHA_MAX_BYTES = 72;

function perguntarSenha(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Execute este comando em um terminal interativo para digitar a senha com segurança.');
  }

  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let senha = '';

    function restaurarTerminal() {
      stdin.removeListener('data', receberTecla);
      stdin.setRawMode(false);
      stdin.pause();
    }

    function receberTecla(tecla) {
      const caractere = tecla.toString('utf8');

      if (caractere === '\u0003') {
        restaurarTerminal();
        stdout.write('\n');
        reject(new Error('Operação cancelada.'));
        return;
      }

      if (caractere === '\r' || caractere === '\n') {
        restaurarTerminal();
        stdout.write('\n');
        resolve(senha);
        return;
      }

      if (caractere === '\u007f' || caractere === '\b') {
        if (senha.length > 0) {
          senha = senha.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }

      if (!/[\u0000-\u001f\u007f]/.test(caractere)) {
        senha += caractere;
        stdout.write('*');
      }
    }

    stdin.on('data', receberTecla);
  });
}

async function criarAdministrador() {
  const interfacePrompt = readline.createInterface({ input: stdin, output: stdout });

  try {
    const nome = (await interfacePrompt.question('Nome do administrador: ')).trim();
    const email = (await interfacePrompt.question('E-mail do administrador: ')).trim().toLowerCase();
    interfacePrompt.close();

    if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Informe um nome e um e-mail valido.');
    }

    const senha = await perguntarSenha('Senha (minimo 8 caracteres e um simbolo): ');

    if (
      [...senha].length < SENHA_MIN ||
      !/[\p{P}\p{S}]/u.test(senha) ||
      Buffer.byteLength(senha, 'utf8') > SENHA_MAX_BYTES
    ) {
      throw new Error('A senha deve ter ao menos 8 caracteres, incluir um simbolo e ter no maximo 72 bytes.');
    }

    await runMigrations();

    const [administradores] = await pool.execute(
      "SELECT id FROM usuarios WHERE perfil = 'admin' AND ativo = 1 LIMIT 1",
    );

    if (administradores.length > 0) {
      throw new Error('Ja existe um administrador ativo. Faca a promocao pelo painel administrativo.');
    }

    const usuarioExistente = await Usuario.findByEmail(email);

    if (usuarioExistente) {
      const senhaValida = await bcrypt.compare(senha, usuarioExistente.senha);

      if (!senhaValida) {
        throw new Error('A senha informada nao confere com a conta existente.');
      }

      await Admin.atualizarUsuario({
        id: usuarioExistente.id,
        perfil: 'admin',
        ativo: true,
      });
      console.log(`A conta existente ${email} agora e administradora.`);
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({ nome, email, senha: senhaHash });
    await Admin.atualizarUsuario({ id: usuario.id, perfil: 'admin', ativo: true });
    console.log(`Administrador ${email} criado com sucesso.`);
  } finally {
    interfacePrompt.close();
    await pool.end();
  }
}

criarAdministrador().catch((error) => {
  console.error(`Nao foi possivel criar o administrador: ${error.message}`);
  process.exitCode = 1;
});
