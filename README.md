# Planeja+

PASSO A PASSO PLANEJA MAIS


1- ABRA O TERMINAL NO VSCODE

2-DIGITE cd planejamais TECLE TAB

3-DIGITE cd backend TECLE TAB

4-DIGITE npm run dev

5-RODAR O PROJETO NO INDEX.HTML 


- Frontend: HTML, CSS e JavaScript
- Backend: Node.js + Express
- Banco de dados: MySQL

## Pre-requisitos

- Node.js 18 ou superior
- npm
- MySQL rodando localmente
- Navegador moderno
  - Axios
  - Chart.js
  - jsPDF
  - ExcelJS
  - Nodemailer (recuperacao de senha por email)

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
<!-- O JWT SECRET PUXA INFORMAÇÕES SEM EXPOR O PROVEDOR -->
## Publicar a API

- Configure no servico do backend `NODE_ENV=production`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` com as credenciais do MySQL privado do provedor. Nao exponha a porta do banco publicamente.
- Configure um `JWT_SECRET` aleatorio com pelo menos 32 caracteres, `ALLOW_PUBLIC_REGISTRATION=false` e `FRONTEND_ORIGINS` com a origem HTTPS exata do frontend.
- O cadastro retorna 403 por padrao em producao. Login e cadastro possuem limites de tentativas por IP.
- Hospede o frontend por HTTPS e edite `frontend/js/api-config.js`: defina `API_BASE_URL` como a URL HTTPS da API terminada em `/api`.
- O `schema.sql` somente cria tabelas ausentes e nao importa usuarios/categorias de exemplo. Nao o aplique sobre um banco sem backup.

## Fluxo de uso

1. Abra `cadastro.html` e crie uma conta.
2. Ou abra `login.html` e entre com um usuario existente.
3. Se esquecer a senha, solicite um link de redefinicao na tela de login.
4. Cadastre categorias em `categorias.html`.
5. Cadastre movimentacoes em `movimentacoes.html`.
6. Veja os graficos em `dashboard.html`.
7. Consulte as respostas na página `faq.html` e gere relatórios em PDF ou Excel em `relatorios.html`.

## Validacao de cadastro

As regras sao verificadas pelo backend na rota `POST /api/auth/cadastro`, mesmo que a requisicao seja enviada sem usar as telas do frontend:

- O email deve ter um formato basico valido, com `@` e dominio.
- A senha deve ter pelo menos 8 caracteres e incluir ao menos um caractere especial (simbolo ou pontuacao).
- Dados invalidos retornam status HTTP `400` com uma mensagem indicando o problema.

## Recuperacao de senha

O fluxo envia um link para o email cadastrado e permite definir uma nova senha em `redefinir-senha.html`.

Para instrucoes passo a passo de teste e configuracao, consulte `GUIA_RECUPERACAO_SENHA.txt`.
Para um resumo geral das mudancas desde a exportacao PDF, consulte `GUIA_MUDANCAS_E_FUNCIONAMENTO.txt`.

- A tabela `redefinicoes_senha` guarda somente o hash SHA-256 do token. Cada link e aleatorio, expira apos 60 minutos por padrao, so pode ser usado uma vez e e invalidado ao solicitar um link novo.
- Para atualizar um banco existente, aplique `backend/database/schema.sql` novamente; a tabela nova e criada sem apagar os dados existentes.
- Em desenvolvimento, sem SMTP configurado, o link de redefinicao aparece no terminal da API. Sirva o frontend por HTTP (por exemplo, `python -m http.server 5500`) para abrir o link.
- Para enviar email, configure no `backend/.env` `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM`. Configure `FRONTEND_URL` como a URL publica do frontend.
- `PASSWORD_RESET_EXPIRES_MINUTES` define a validade do link; o padrao e 60 minutos.
- A resposta ao pedido de recuperacao e igual para emails cadastrados ou nao, evitando revelar quais contas existem.
- A nova senha segue as regras do cadastro: no minimo 8 caracteres, um simbolo ou pontuacao e no maximo 72 bytes para o bcrypt.

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
POST /api/auth/esqueci-senha
GET  /api/auth/redefinir-senha/:token
POST /api/auth/redefinir-senha
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

## Observações

- O frontend usa Axios em `frontend/js/apiService.js`.
- O dashboard usa Chart.js com dados vindos da API.
- As exportacoes PDF e Excel usam jsPDF e ExcelJS na tela de relatorios.
- As referencias de formatacao visual das exportacoes ficam em `frontend/formatacao-pdf.txt` e `frontend/formatacao-excel.txt`.
- Arquivos `.env` e `node_modules` nao devem ser enviados ao Git.
- Lembrar sempre que deve-se mudar a .env sempre que mudar a maquina e adicionar sua própia porta do banco de dados e senha


## GUIA DE RECUPERACAO DE SENHA - PLANEJA+

O QUE FOI ADICIONADO

1. Na tela de login existe o link "Esqueci minha senha".
2. O usuario informa o email e recebe um link para criar outra senha.
3. O link expira depois de 60 minutos por padrao e so pode ser usado uma vez.
4. A senha nova deve ter pelo menos 8 caracteres e conter um simbolo ou pontuacao.
5. Depois de trocar a senha, o usuario volta para a tela de login.


TESTAR NO COMPUTADOR (SEM CONFIGURAR EMAIL)

O modo local mostra o link no terminal do backend. Para esse link abrir corretamente,
rode o frontend por HTTP; nao abra somente o arquivo index.html diretamente.

TERMINAL 1 - API

1. Abra um terminal no VS Code na pasta principal do projeto.
2. Entre na pasta do backend:

   cd .\PlanejaMais-main\PlanejaMais-main\backend

3. Inicie a API:

   npm run dev

4. Deixe esse terminal aberto. Ele mostrara o link de recuperacao quando solicitado.

TERMINAL 2 - SITE

1. Abra um segundo terminal no VS Code, tambem na pasta principal do projeto.
2. Entre na pasta do frontend:

   cd .\PlanejaMais-main\PlanejaMais-main\frontend

3. Inicie um servidor local:

   python -m http.server 5500

4. No navegador, abra:

   http://localhost:5500/login.html

FAZER UM TESTE

1. Na tela de login, clique em "Esqueci minha senha".
2. Digite o email de uma conta existente e envie o formulario.
3. Volte ao terminal 1 e procure a linha "[DEV] Link de recuperacao de senha".
4. Abra o link no navegador. Se necessario, copie e cole o endereco completo.
5. Informe e confirme a nova senha. Ela precisa ter pelo menos 8 caracteres e um simbolo.
6. Depois da mensagem de sucesso, entre usando a nova senha.

O link e invalido depois de usado ou quando expira. Se pedir outro link, o anterior
deixa de funcionar.


ATUALIZAR O BANCO DE DADOS

A recuperacao usa a tabela "redefinicoes_senha". Para criar essa tabela em um banco
que ja existe, aplique novamente o arquivo backend\database\schema.sql. O script usa
CREATE TABLE IF NOT EXISTS e nao apaga os dados existentes.

Se o cliente MySQL estiver no PATH do Windows, a partir da pasta backend execute:

   cmd /c "mysql -u root -p planeja_plus < database\schema.sql"

O comando pedira a senha do MySQL. Faca backup antes de executar alteracoes no banco.


ENVIAR EMAIL DE VERDADE

Sem SMTP configurado, o link aparece somente no terminal do backend. Para enviar email:

1. Abra backend\.env.
2. Configure estas variaveis com os dados fornecidos pelo seu provedor de email:

   FRONTEND_URL=http://localhost:5500
   PASSWORD_RESET_EXPIRES_MINUTES=60
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=
   SMTP_PASS=
   MAIL_FROM=Planeja+ <seu-email@seudominio.com>

3. Salve o .env e reinicie a API.

Em producao, FRONTEND_URL deve ser o endereco HTTPS publico do site e o SMTP deve
estar configurado. Nunca publique o arquivo .env nem compartilhe a senha SMTP.


SE ALGO NAO FUNCIONAR

- Confira se a API continua rodando no terminal 1.
- Confira se o frontend continua rodando no terminal 2 na porta 5500.
- Se o backend indicar que a tabela redefinicoes_senha nao existe, aplique o schema.
- Se o link nao chegar por email durante o desenvolvimento, procure-o no terminal da API.
- Se o link expirou ou ja foi usado, solicite outro pela tela de login.
- O sistema mostra a mesma resposta para email cadastrado e nao cadastrado, para nao
  revelar quais enderecos possuem conta.


ARQUIVOS PRINCIPAIS

- frontend\login.html: link para iniciar a recuperacao.
- frontend\esqueci-senha.html: formulario do email.
- frontend\redefinir-senha.html: formulario da nova senha.
- backend\controllers\authController.js: validacao e fluxo das rotas.
- backend\models\RedefinicaoSenha.js: tokens de uso unico e atualizacao no banco.
- backend\services\emailService.js: envio SMTP ou exibicao local do link.
- backend\database\schema.sql: tabela de tokens de redefinicao.
