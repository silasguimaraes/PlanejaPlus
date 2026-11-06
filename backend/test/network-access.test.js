import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const testDirectory = await mkdtemp(join(tmpdir(), 'planeja-plus-network-'));
process.env.SQLITE_PATH = join(testDirectory, 'test.sqlite');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
process.env.FRONTEND_ORIGINS = 'http://localhost:5500,http://192.168.1.25:5500';

const [{ default: app }, { pool }] = await Promise.all([
  import('../app.js'),
  import('../database/connection.js'),
]);

test('frontend local e frontend da rede acessam a API; outras origens nao recebem CORS', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await pool.end();
    await rm(testDirectory, { recursive: true, force: true });
  });

  const apiUrl = `http://127.0.0.1:${server.address().port}/api/health`;

  for (const origin of ['http://localhost:5500', 'http://192.168.1.25:5500']) {
    const response = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
      },
    });

    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  }

  const rejectedResponse = await fetch(apiUrl, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://untrusted.example',
      'Access-Control-Request-Method': 'GET',
    },
  });

  assert.equal(rejectedResponse.headers.get('access-control-allow-origin'), null);

  const frontendResponse = await fetch(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(frontendResponse.status, 200);
  assert.match(await frontendResponse.text(), /<!DOCTYPE html>/i);
});
