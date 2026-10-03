import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import { env } from '../config/env.js';

// Cria um token JWT com dados basicos do usuario para autenticar proximas requisicoes.
function createToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

// Controller responsavel por criar uma nova conta de usuario.
export async function cadastro(req, res) {
  if (!env.allowPublicRegistration) {
    return res.status(403).json({ message: 'Cadastro publico desativado.' });
  }

  // Extrai os campos enviados pelo frontend no corpo da requisicao.
  const { nome, email, senha } = req.body || {};

  // Valida os campos obrigatorios antes de tentar salvar no banco.
  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Nome, email e senha sao obrigatorios.' });
  }

  // Criptografa a senha para que ela nao seja salva em texto puro.
  const senhaHash = await bcrypt.hash(senha, 10);

  // Salva o usuario no banco e gera um token para login automatico apos o cadastro.
  const usuario = await Usuario.create({ nome, email, senha: senhaHash });
  const token = createToken(usuario);

  // Retorna status 201 porque um novo recurso foi criado.
  return res.status(201).json({
    usuario,
    token,
  });
}

// Controller responsavel por autenticar um usuario ja cadastrado.
export async function login(req, res) {
  // Recebe email e senha enviados pela tela de login.
  const { email, senha } = req.body || {};

  // Sem esses dados, nao e possivel conferir as credenciais.
  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha sao obrigatorios.' });
  }

  // Busca o usuario pelo email informado.
  const usuario = await Usuario.findByEmail(email);

  if (!usuario) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  // Compara a senha digitada com a senha criptografada salva no banco.
  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  // Gera um token para o frontend guardar e usar nas rotas protegidas.
  const token = createToken(usuario);

  // Retorna apenas dados seguros do usuario, sem expor a senha.
  return res.json({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
    token,
  });
}
