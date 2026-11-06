-- Guarda os usuarios que podem acessar o sistema.
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL CHECK (length(nome) <= 120),
  email TEXT NOT NULL UNIQUE CHECK (length(email) <= 160),
  senha TEXT NOT NULL CHECK (length(senha) <= 255),
  perfil TEXT NOT NULL DEFAULT 'usuario' CHECK (perfil IN ('usuario', 'admin')),
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guarda categorias de receita ou despesa criadas por cada usuario.
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nome TEXT NOT NULL CHECK (length(nome) <= 100),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_categorias_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Guarda cada entrada ou saida financeira registrada pelo usuario.
CREATE TABLE IF NOT EXISTS movimentacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  descricao TEXT NOT NULL CHECK (length(descricao) <= 180),
  valor NUMERIC NOT NULL CHECK (
    valor > 0 AND valor <= 99999999.99 AND round(valor, 2) = valor
  ),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  data_movimentacao DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimentacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_movimentacoes_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- Guarda informacoes de pagamento ligadas a uma movimentacao.
CREATE TABLE IF NOT EXISTS pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movimentacao_id INTEGER NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (length(forma_pagamento) <= 80),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  data_pagamento DATE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagamentos_movimentacao
    FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Guarda metadados de relatorios gerados para um usuario.
CREATE TABLE IF NOT EXISTS relatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  titulo TEXT NOT NULL CHECK (length(titulo) <= 140),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_relatorios_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Guarda apenas hashes dos tokens de redefinicao de senha, nunca o token original.
CREATE TABLE IF NOT EXISTS redefinicoes_senha (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  expira_em DATETIME NOT NULL,
  usado_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_redefinicoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Acelera a consulta de tokens ativos pertencentes a um usuario.
CREATE INDEX IF NOT EXISTS idx_redefinicoes_usuario
  ON redefinicoes_senha(usuario_id);
