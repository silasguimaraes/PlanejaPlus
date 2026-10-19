import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import RedefinicaoSenha from '../models/RedefinicaoSenha.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

const SENHA_MIN = 8;
const SENHA_MAX_BYTES = 72;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isTokenFormatValid(token) {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

// Cria um token JWT com dados basicos do usuario para autenticar proximas requisicoes.
function createToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil || 'usuário',
      ativo: usuario.ativo ?? true,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

// Controller responsavel por criar uma nova conta de usuario.
export async function cadastro(req, res) {
  if (!env.allowPublicRegistration) {
    return res.status(403).json({ message: 'Cadastro público desativado.' });
  }

  // Extrai os campos enviados pelo frontend no corpo da requisicao.
  const { nome, email, senha } = req.body || {};

  // Valida os campos obrigatorios antes de tentar salvar no banco.
  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

//VALIDAÇÂO BACKEND


  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Informe um email válido com @ e domínio.' });
  }

  if (typeof senha !== 'string' || [...senha].length < 8) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  }

  if (!/[\p{P}\p{S}]/u.test(senha)) {
    return res.status(400).json({ message: 'A senha deve conter pelo menos um caractere especial.' });
  }

  // Criptografa a senha para que ela nao seja salva em texto puro.
  const senhaHash = await bcrypt.hash(senha, 10);

  // Salva o usuario no banco e gera um token para login automatico apos o cadastro.
  const usuario = await Usuario.create({ nome, email, senha: senhaHash });
  const usuarioSeguro = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: Boolean(usuario.ativo),
  };
  const token = createToken(usuarioSeguro);

  // Retorna status 201 porque um novo recurso foi criado.
  return res.status(201).json({
    usuario: usuarioSeguro,
    token,
  });
}

// Controller responsavel por autenticar um usuario ja cadastrado.
export async function login(req, res) {
  // Recebe email e senha enviados pela tela de login.
  const { email, senha } = req.body || {};

  // Sem esses dados, nao e possivel conferir as credenciais.
  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  // Busca o usuario pelo email informado.
  const usuario = await Usuario.findByEmail(email);

  if (!usuario) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  // Compara a senha digitada com a senha criptografada salva no banco.
  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  // Gera um token para o frontend guardar e usar nas rotas protegidas.
  const usuarioSeguro = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: Boolean(usuario.ativo),
  };
  const token = createToken(usuarioSeguro);

  // Retorna apenas dados seguros do usuario, sem expor a senha.
  return res.json({
    usuario: usuarioSeguro,
    token,
  });
}

// Sempre responde com a mesma mensagem para nao revelar se o email possui uma conta.
export async function esqueciSenha(req, res) {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Informe um email válido.' });
  }

  const resposta = {
    message: 'Se o email estiver cadastrado, você receberá um link para redefinir a senha.',
  };
  const usuario = await Usuario.findByEmail(email.trim());

  if (!usuario) {
    return res.json(resposta);
  }

  const token = crypto.randomBytes(32).toString('hex');
  await RedefinicaoSenha.create({
    usuarioId: usuario.id,
    tokenHash: hashToken(token),
    expiraEmMinutos: env.passwordResetExpiresMinutes,
  });

  const link = `${env.frontendUrl}/redefinir-senha.html?token=${token}`;
  sendPasswordResetEmail({ to: usuario.email, nome: usuario.nome, link }).catch((error) => {
    console.error('Falha ao enviar email de recuperação de senha:', error);
  });

  return res.json(resposta);
}

// Confere se o link ainda esta ativo antes de o usuario preencher a nova senha.
export async function validarTokenRedefinicao(req, res) {
  const { token } = req.params;

  if (!isTokenFormatValid(token) || !(await RedefinicaoSenha.isValid(hashToken(token)))) {
    return res.status(400).json({
      message: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.',
    });
  }

  return res.json({ valid: true });
}

export async function redefinirSenha(req, res) {
  const { token, senha } = req.body || {};

  if (!isTokenFormatValid(token) || typeof senha !== 'string') {
    return res.status(400).json({
      message: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.',
    });
  }

  if ([...senha].length < SENHA_MIN) {
    return res.status(400).json({ message: `A senha deve ter pelo menos ${SENHA_MIN} caracteres.` });
  }

  if (!/[\p{P}\p{S}]/u.test(senha)) {
    return res.status(400).json({ message: 'A senha deve conter pelo menos um caractere especial.' });
  }

  if (Buffer.byteLength(senha, 'utf8') > SENHA_MAX_BYTES) {
    return res.status(400).json({ message: 'A senha e muito longa.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const sucesso = await RedefinicaoSenha.redefinirSenha({
    tokenHash: hashToken(token),
    senhaHash,
  });

  if (!sucesso) {
    return res.status(400).json({
      message: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.',
    });
  }

  return res.json({ message: 'Senha redefinida com sucesso. Você já pode entrar.' });
}
