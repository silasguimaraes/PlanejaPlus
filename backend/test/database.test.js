import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

// Isola cada execucao de testes em um arquivo SQLite temporario.
const testDirectory = await mkdtemp(join(tmpdir(), 'planeja-plus-sqlite-'));
process.env.SQLITE_PATH = join(testDirectory, 'test.sqlite');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';

// Importa os modulos depois de definir o arquivo isolado e as configuracoes de teste.
const [{ default: app }, { pool }, { runMigrations }, { default: Admin }, { default: Usuario }, { default: Categoria }, { default: Movimentacao }, { default: RedefinicaoSenha }] =
  await Promise.all([
    import('../app.js'),
    import('../database/connection.js'),
    import('../database/migrationRunner.js'),
    import('../models/Admin.js'),
    import('../models/Usuario.js'),
    import('../models/Categoria.js'),
    import('../models/Movimentacao.js'),
    import('../models/RedefinicaoSenha.js'),
  ]);

// Executa os fluxos completos por HTTP e tambem as operacoes do modelo de dados.
test('SQLite mantém os fluxos atuais e permite excluir categorias sem perder movimentacoes', async (t) => {
  let server;

  try {
    await runMigrations();
    await runMigrations();

    // Confirma que as migrations podem ser reaplicadas sem duplicar schema ou dados.
    const [migrations] = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
    assert.deepEqual(
      migrations.map((migration) => migration.version),
      ['001-initial-schema', '002-user-access-columns', '003-seed-default-categories'],
    );

    server = app.listen(0);
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

    // Faz requisicoes JSON para exercitar autenticacao, rotas e tratamento de erros.
    async function request(path, { method = 'GET', token, body } = {}) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      return {
        response,
        data: response.status === 204 ? null : await response.json(),
      };
    }

    await t.test('cadastro, login e categorias padrão funcionam', async () => {
      const cadastro = await request('/auth/cadastro', {
        method: 'POST',
        body: { nome: 'Pessoa Teste', email: 'sqlite@example.com', senha: 'Senha#1234' },
      });
      assert.equal(cadastro.response.status, 201);
      assert.ok(cadastro.data.token);

      const duplicado = await request('/auth/cadastro', {
        method: 'POST',
        body: { nome: 'Pessoa Teste', email: 'sqlite@example.com', senha: 'Senha#1234' },
      });
      assert.equal(duplicado.response.status, 409);

      const login = await request('/auth/login', {
        method: 'POST',
        body: { email: 'sqlite@example.com', senha: 'Senha#1234' },
      });
      assert.equal(login.response.status, 200);
      assert.ok(login.data.token);

      const categorias = await request('/categorias', { token: login.data.token });
      assert.equal(categorias.response.status, 200);
      assert.equal(categorias.data.length, 9);
    });

    await t.test('categorias respeitam usuario, uso e exclusao', async () => {
      const owner = await Usuario.findByEmail('sqlite@example.com');
      const otherRegistration = await request('/auth/cadastro', {
        method: 'POST',
        body: { nome: 'Outra Pessoa', email: 'outra@example.com', senha: 'Senha#1234' },
      });
      const ownerLogin = await request('/auth/login', {
        method: 'POST',
        body: { email: 'sqlite@example.com', senha: 'Senha#1234' },
      });

      const criacao = await request('/categorias', {
        method: 'POST',
        token: ownerLogin.data.token,
        body: { nome: 'Categoria Teste', tipo: 'despesa' },
      });
      assert.equal(criacao.response.status, 201);

      const proibida = await request(`/categorias/${criacao.data.id}`, {
        method: 'DELETE',
        token: otherRegistration.data.token,
      });
      assert.equal(proibida.response.status, 404);

      const movimentacao = await request('/movimentacoes', {
        method: 'POST',
        token: ownerLogin.data.token,
        body: {
          categoria_id: criacao.data.id,
          descricao: 'Compra de teste',
          valor: 12.34,
          tipo: 'despesa',
          data_movimentacao: '2025-01-20',
        },
      });
      assert.equal(movimentacao.response.status, 201);
      assert.equal(Number(movimentacao.data.valor), 12.34);

      const emUso = await request(`/categorias/${criacao.data.id}`, {
        method: 'DELETE',
        token: ownerLogin.data.token,
      });
      assert.equal(emUso.response.status, 409);

      const listagem = await request('/movimentacoes', { token: ownerLogin.data.token });
      assert.equal(listagem.response.status, 200);
      assert.equal(listagem.data[0].categoria_nome, 'Categoria Teste');

      const edicao = await request(`/movimentacoes/${movimentacao.data.id}`, {
        method: 'PUT',
        token: ownerLogin.data.token,
        body: {
          categoria_id: criacao.data.id,
          descricao: 'Compra atualizada',
          valor: 15.129,
          tipo: 'despesa',
          data_movimentacao: '2025-01-21',
        },
      });
      assert.equal(edicao.response.status, 200);
      assert.equal(edicao.data.descricao, 'Compra atualizada');
      assert.equal(Number(edicao.data.valor), 15.13);

      const remocaoMovimentacao = await request(`/movimentacoes/${movimentacao.data.id}`, {
        method: 'DELETE',
        token: ownerLogin.data.token,
      });
      assert.equal(remocaoMovimentacao.response.status, 204);

      const remocaoCategoria = await request(`/categorias/${criacao.data.id}`, {
        method: 'DELETE',
        token: ownerLogin.data.token,
      });
      assert.equal(remocaoCategoria.response.status, 204);

      const categoriasRestantes = await request('/categorias', { token: ownerLogin.data.token });
      assert.equal(categoriasRestantes.data.some((item) => item.id === criacao.data.id), false);
      assert.ok(owner.id);
      assert.ok(otherRegistration.data.usuario.id);
    });

    await t.test('administracao, redefinicao de senha e cascatas funcionam', async () => {
      const owner = await Usuario.findByEmail('sqlite@example.com');
      const other = await Usuario.findByEmail('outra@example.com');

      const ownerCategories = await Categoria.findByUsuario(owner.id);
      const incomeCategory = ownerCategories.find((category) => category.tipo === 'receita');
      const expenseCategory = ownerCategories.find((category) => category.tipo === 'despesa');
      await Movimentacao.create({
        usuarioId: owner.id,
        categoriaId: incomeCategory.id,
        descricao: 'Receita para o painel admin',
        valor: 100,
        tipo: 'receita',
        dataMovimentacao: '2025-01-22',
      });
      await Movimentacao.create({
        usuarioId: owner.id,
        categoriaId: expenseCategory.id,
        descricao: 'Despesa para o painel admin',
        valor: 40,
        tipo: 'despesa',
        dataMovimentacao: '2025-01-23',
      });

      await pool.execute("UPDATE usuarios SET perfil = 'admin' WHERE id = ?", [owner.id]);
      const adminLogin = await request('/auth/login', {
        method: 'POST',
        body: { email: 'sqlite@example.com', senha: 'Senha#1234' },
      });

      const resumo = await request('/admin/resumo', { token: adminLogin.data.token });
      assert.equal(resumo.response.status, 200);
      assert.equal(Number(resumo.data.total_usuarios), 2);
      assert.equal(Number(resumo.data.usuarios_ativos), 2);
      assert.equal(Number(resumo.data.total_movimentacoes), 2);
      assert.equal(Number(resumo.data.total_receitas), 100);
      assert.equal(Number(resumo.data.total_despesas), 40);

      const usuarios = await request('/admin/usuarios', { token: adminLogin.data.token });
      assert.equal(usuarios.response.status, 200);
      assert.equal(usuarios.data.length, 2);
      assert.equal(
        Number(usuarios.data.find((user) => user.id === owner.id).total_movimentacoes),
        2,
      );

      const atualizacao = await request(`/admin/usuarios/${other.id}`, {
        method: 'PATCH',
        token: adminLogin.data.token,
        body: { ativo: false },
      });
      assert.equal(atualizacao.response.status, 200);
      const resumoComUsuarioInativo = await request('/admin/resumo', {
        token: adminLogin.data.token,
      });
      assert.equal(Number(resumoComUsuarioInativo.data.usuarios_ativos), 1);
      assert.equal(await Admin.atualizarUsuario({ id: other.id, ativo: true }), true);

      await RedefinicaoSenha.create({
        usuarioId: owner.id,
        tokenHash: 'a'.repeat(64),
        expiraEmMinutos: 10,
      });
      assert.equal(await RedefinicaoSenha.isValid('a'.repeat(64)), true);
      assert.equal(
        await RedefinicaoSenha.redefinirSenha({
          tokenHash: 'a'.repeat(64),
          senhaHash: 'novo-hash',
        }),
        true,
      );
      assert.equal(await RedefinicaoSenha.isValid('a'.repeat(64)), false);

      const outraCategoria = await Categoria.create({
        usuarioId: other.id,
        nome: 'Categoria cascata',
        tipo: 'receita',
      });
      assert.ok(outraCategoria.id);
      assert.equal(await Admin.excluirUsuario(other.id), true);

      const [categoriasRemanescentes] = await pool.execute(
        'SELECT id FROM categorias WHERE usuario_id = ?',
        [other.id],
      );
      assert.deepEqual(categoriasRemanescentes, []);
      assert.equal(await Admin.excluirUsuario(owner.id), true);
    });
  } finally {
    // Fecha o servidor e o arquivo SQLite para que o diretorio temporario possa ser removido.
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await pool.end();
    await rm(testDirectory, { recursive: true, force: true });
  }
});
