-- Cria o banco de dados caso ele ainda nao exista.
CREATE DATABASE IF NOT EXISTS planeja_plus;

-- Seleciona o banco que recebera as tabelas e dados abaixo.
USE planeja_plus;

-- Remove tabelas antigas para permitir recriar a estrutura do zero.
DROP TABLE IF EXISTS relatorios;
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS movimentacoes;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;

-- Guarda os usuarios que podem acessar o sistema.
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Guarda categorias de receita ou despesa criadas por cada usuario.
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('receita', 'despesa') NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categorias_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Guarda cada entrada ou saida financeira registrada pelo usuario.
CREATE TABLE movimentacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  categoria_id INT NOT NULL,
  descricao VARCHAR(180) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  tipo ENUM('receita', 'despesa') NOT NULL,
  data_movimentacao DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
CREATE TABLE pagamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movimentacao_id INT NOT NULL,
  forma_pagamento VARCHAR(80) NOT NULL,
  status ENUM('pendente', 'pago', 'cancelado') NOT NULL DEFAULT 'pendente',
  data_pagamento DATE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagamentos_movimentacao
    FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Guarda metadados de relatorios gerados para um usuario.
CREATE TABLE relatorios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(140) NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_relatorios_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Insere usuarios de exemplo para testar o sistema.
INSERT INTO usuarios (nome, email, senha) VALUES
  ('Ana Silva', 'ana@planejamais.com', '$2b$10$dluqK2PPNxey7k4bnPBZ.e6njHagbeE.027Vi8BwUv5itie3ESmQi'),
  ('Bruno Costa', 'bruno@planejamais.com', '$2b$10$dluqK2PPNxey7k4bnPBZ.e6njHagbeE.027Vi8BwUv5itie3ESmQi');

-- Insere categorias iniciais para cada usuario de exemplo.
INSERT INTO categorias (usuario_id, nome, tipo) VALUES
  (1, 'Salario', 'receita'),
  (1, 'Alimentacao', 'despesa'),
  (1, 'Transporte', 'despesa'),
  (2, 'Freelance', 'receita'),
  (2, 'Moradia', 'despesa');

-- Insere movimentacoes iniciais para alimentar dashboard e relatorios.
INSERT INTO movimentacoes (
  usuario_id,
  categoria_id,
  descricao,
  valor,
  tipo,
  data_movimentacao
) VALUES
  (1, 1, 'Salario mensal', 4500.00, 'receita', '2026-05-05'),
  (1, 2, 'Compra no mercado', 320.50, 'despesa', '2026-05-07'),
  (1, 3, 'Passagem de metro', 48.00, 'despesa', '2026-05-08'),
  (2, 4, 'Projeto de landing page', 1800.00, 'receita', '2026-05-10'),
  (2, 5, 'Aluguel', 1400.00, 'despesa', '2026-05-12');

-- Insere exemplos de pagamentos relacionados as movimentacoes.
INSERT INTO pagamentos (
  movimentacao_id,
  forma_pagamento,
  status,
  data_pagamento
) VALUES
  (1, 'Transferencia bancaria', 'pago', '2026-05-05'),
  (2, 'Cartao de debito', 'pago', '2026-05-07'),
  (3, 'Pix', 'pago', '2026-05-08'),
  (4, 'Pix', 'pago', '2026-05-10'),
  (5, 'Boleto', 'pendente', NULL);

-- Insere exemplos de relatorios salvos por usuario.
INSERT INTO relatorios (
  usuario_id,
  titulo,
  periodo_inicio,
  periodo_fim
) VALUES
  (1, 'Relatorio mensal de maio', '2026-05-01', '2026-05-31'),
  (2, 'Resumo financeiro de maio', '2026-05-01', '2026-05-31');
