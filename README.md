# PlanejaPlus

Repositório para o projeto PlanejaPlus (baseado em PlanejaMais).

Instruções rápidas:

- Inicializar Git local (já feito): `git init`
- Adicionar remoto do GitHub: `git remote add origin <URL_DO_REPO>`
- Enviar para o GitHub: `git push -u origin main`
# Planeja+

Projeto full stack de controle financeiro.

- Frontend: HTML, CSS e JavaScript
- Backend: Node.js + Express
- Banco de dados: MySQL

## Pre-requisitos

- Node.js 18 ou superior
- npm
- MySQL rodando localmente
- Navegador moderno
- Conexao com internet para carregar CDNs do frontend:
  - Axios
  - Chart.js
  - jsPDF

## Estrutura

```text
backend/
  config/
  controllers/
  database/
  middleware/
  models/
  routes/
  app.js
  server.js

frontend/
  css/
  js/
  index.html
  login.html
  cadastro.html
  dashboard.html
  categorias.html
  movimentacoes.html
  relatorios.html
```

## Configurar o backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependencias:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, se `cp` nao funcionar:

```powershell
Copy-Item .env.example .env
```

Edite `backend/.env` com suas credenciais do MySQL:

```env
PORT=3000
JWT_SECRET=troque_este_segredo_em_producao
JWT_EXPIRES_IN=1d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=planeja_plus
```

Crie o banco e as tabelas:

```bash
mysql -u root -p < database/schema.sql
```

Inicie a API:

```bash
npm run dev
```

No PowerShell, se houver bloqueio do `npm.ps1`, use:

```powershell
npm.cmd run dev
```

A API roda em:

```text
http://localhost:3000/api
```

Teste rapido:

```text
GET http://localhost:3000/api/health
```

## Rodar o frontend

Com o backend ligado, abra `frontend/index.html` no navegador.

Recomendado: servir a pasta por HTTP.

```bash
cd frontend
python -m http.server 5500
```

Acesse:

```text
http://localhost:5500
```

## Fluxo de uso

1. Abra `cadastro.html` e crie uma conta.
2. Ou abra `login.html` e entre com um usuario existente.
3. Cadastre categorias em `categorias.html`.
4. Cadastre movimentacoes em `movimentacoes.html`.
5. Veja os graficos em `dashboard.html`.
6. Gere PDF em `relatorios.html`.

O token JWT fica salvo no `localStorage` com a chave:

```text
planeja_token
```

## Rotas da API

Rotas publicas:

```text
GET  /api/health
POST /api/auth/cadastro
POST /api/auth/login
```

Rotas protegidas por JWT:

```text
GET    /api/categorias
POST   /api/categorias
GET    /api/movimentacoes
POST   /api/movimentacoes
PUT    /api/movimentacoes/:id
DELETE /api/movimentacoes/:id
```

Header para rotas protegidas:

```text
Authorization: Bearer seu_token_jwt
```

## Observacoes

- O frontend usa Axios em `frontend/js/apiService.js`.
- O dashboard usa Chart.js com dados vindos da API.
- A exportacao PDF usa jsPDF na tela de relatorios.
- Arquivos `.env` e `node_modules` nao devem ser enviados ao Git.
