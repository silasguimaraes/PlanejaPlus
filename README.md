 # Planeja+

## Inicializacao rapida

1. Instale o Node.js 20 ou superior.
2. No terminal do VS Code, entre na pasta `backend`.
3. Execute `npm install` e crie `backend/.env` a partir de `.env.example`.
4. Execute `npm run dev` e abra `http://localhost:3000` no navegador.


- Frontend: HTML, CSS e JavaScript
- Backend: Node.js + Express
- Banco de dados local: SQLite (arquivo em `backend/database/`)

## Pre-requisitos

- Node.js 20 ou superior
- npm
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

O projeto usa SQLite localmente e nao precisa de um servidor de banco separado.
Mantenha `SQLITE_PATH` sem configurar para usar o arquivo padrao do projeto.
O arquivo `.env` criado a partir do exemplo ja permite iniciar o backend.

```env
PORT=3000
JWT_SECRET=
JWT_EXPIRES_IN=1d
ALLOW_PUBLIC_REGISTRATION=true
FRONTEND_ORIGINS=http://localhost:5500
```

Configure o `.env` com o banco e inicie a API. As migrations sao executadas automaticamente antes de o servidor aceitar requisicoes:

```bash
npm run dev
```

Para executar migrations ou reaplicar o seed manualmente:

```bash
npm run db:migrate
npm run db:seed
```

As migrations versionadas ficam em `backend/database/migrations/` e sao registradas em `schema_migrations`. O seed cria categorias iniciais para contas existentes e nao duplica categorias com o mesmo nome e tipo. Novos cadastros tambem recebem suas categorias iniciais. Nenhum usuario, senha ou movimentacao de demonstracao e criado.

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

Inicie o backend e abra `http://localhost:3000`. O backend tambem serve o
frontend; nao e necessario abrir o arquivo HTML diretamente nem iniciar outro
servidor.

Se preferir usar o Live Server do VS Code, configure-o para aceitar conexoes da
rede local. O frontend nessa porta usa a API em `:3000`.

```bash
cd frontend
python -m http.server 5500
```

Acesse:

```text
http://localhost:5500
```

## Acessar em outro computador na mesma rede

O computador que hospeda o projeto deve permanecer ligado, conectado ao mesmo
Wi-Fi/rede e com o backend em execucao. O outro computador precisa apenas de um
navegador; os dois acessam o mesmo arquivo SQLite no computador hospedeiro.

1. No computador hospedeiro, abra o PowerShell e execute `ipconfig`. Anote o
   endereco IPv4 do adaptador Wi-Fi ou Ethernet, por exemplo `192.168.1.25`.
2. No VS Code, abra `backend/.env`. Se usar a pagina servida pelo proprio
   backend em `:3000`, nenhuma origem adicional e necessaria. Se usar Live Server
   na rede, inclua a origem dele, por exemplo:

   ```env
   FRONTEND_ORIGINS=http://localhost:5500,http://192.168.1.25:5500
   ```

   Troque o IP pelo endereco real do computador hospedeiro. Reinicie o backend
   depois de alterar o `.env`.
3. Execute `npm run dev` na pasta `backend`. Se o Windows perguntar, permita o
   Node.js somente em redes privadas. Se nao aparecer a pergunta e a conexao
   falhar, permita o Node.js na Firewall do Windows para redes privadas ou crie
   uma regra de entrada TCP para a porta `3000`, restrita a redes privadas.
4. No outro computador, abra `http://192.168.1.25:3000`, substituindo pelo IP
   anotado. Se estiver usando Live Server, abra `http://192.168.1.25:5500`.
5. Se o endereco IP mudar, atualize o endereco usado no navegador e, se
   necessario, `FRONTEND_ORIGINS`. Para evitar mudancas, configure uma reserva
   DHCP no roteador.

Use somente em uma rede privada confiavel. Nao configure encaminhamento de portas
no roteador para expor esse servidor a internet. Quando o computador desligar,
dormir ou o backend for encerrado, os outros dispositivos perderao o acesso.
<!-- O JWT SECRET PUXA INFORMAÇÕES SEM EXPOR O PROVEDOR -->
## Publicar a API

- Configure no servico do backend `NODE_ENV=production`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` com as credenciais do MySQL privado do provedor. Nao exponha a porta do banco publicamente.
- Para acessar os mesmos dados em varios dispositivos, publique a API e use um banco MySQL persistente compartilhado. O frontend em cada dispositivo deve apontar para essa mesma API; seed nao sincroniza bancos locais diferentes.
- Configure um `JWT_SECRET` aleatorio com pelo menos 32 caracteres, `ALLOW_PUBLIC_REGISTRATION=false` e `FRONTEND_ORIGINS` com a origem HTTPS exata do frontend.
- O cadastro retorna 403 por padrao em producao. Login e cadastro possuem limites de tentativas por IP.
- Hospede o frontend por HTTPS e edite `frontend/js/api-config.js`: defina `API_BASE_URL` como a URL HTTPS da API terminada em `/api`.
- Faca backup antes de atualizacoes de schema em producao; as migrations pendentes rodam automaticamente na inicializacao.

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
- Bancos existentes recebem as migrations pendentes automaticamente na inicializacao da API.
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
que ja existe, as migrations pendentes rodam automaticamente quando a API inicia.
Para executa-las manualmente, a partir da pasta backend rode:

   npm run db:migrate

Faca backup antes de atualizacoes de schema em producao.


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
- Se o backend indicar que a tabela redefinicoes_senha nao existe, rode
  "npm run db:migrate" na pasta backend.
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
- backend\database\migrations\: criacao e atualizacao versionada das tabelas.
