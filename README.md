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
JWT_SECRET=
JWT_EXPIRES_IN=1d
ALLOW_PUBLIC_REGISTRATION=true
FRONTEND_ORIGINS=http://localhost:5500
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=planeja_plus
```

Crie o banco local (se ainda nao existir) e as tabelas. O schema nao apaga tabelas nem insere dados de exemplo:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS planeja_plus"
mysql -u root -p planeja_plus < database/schema.sql
```

No Windows PowerShell, a importacao pode ser feita pelo `cmd`:

```powershell
cmd /c "mysql -u root -p planeja_plus < database\schema.sql"
```

`CREATE TABLE IF NOT EXISTS` protege tabelas existentes contra recriacao, mas nao atualiza estruturas antigas. Use migracoes versionadas para evoluir o schema e faça backup antes de qualquer alteracao estrutural.

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

O health check retorna `503` se o banco nao estiver acessivel.

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

## Publicar a API

- Configure no servico do backend `NODE_ENV=production`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` com as credenciais do MySQL privado do provedor. Nao exponha a porta do banco publicamente.
- Configure um `JWT_SECRET` aleatorio com pelo menos 32 caracteres, `ALLOW_PUBLIC_REGISTRATION=false` e `FRONTEND_ORIGINS` com a origem HTTPS exata do frontend.
- O cadastro retorna 403 por padrao em producao. Login e cadastro possuem limites de tentativas por IP.
- Hospede o frontend por HTTPS e edite `frontend/js/api-config.js`: defina `API_BASE_URL` como a URL HTTPS da API terminada em `/api`.
- O `schema.sql` somente cria tabelas ausentes e nao importa usuarios/categorias de exemplo. Nao o aplique sobre um banco sem backup.

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
