// End-to-end checks against a real MySQL database, through the HTTP API.
// Run with: INTEGRATION_DB=1 DB_HOST=... DB_PORT=... DB_USERNAME=... DB_PASSWORD=... DB_DATABASE=... npm run test:integration
// The database must have the current schema (db/hortifruti_basico.sql). CI runs this job with a MySQL service.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const ENABLED = process.env.INTEGRATION_DB === '1';
const RUN_ID = Date.now().toString(36);

let server;
let baseUrl;
let database;

async function api(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

function storeDatePlusDays(days) {
  const { getStoreToday } = require('../../src/productStatus');
  const [year, month, day] = getStoreToday().split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

async function createProduct(name, { lotCode, expiration, quantity, price }) {
  const { status, body } = await api('POST', '/products', {
    nome: `${name} ${RUN_ID}`,
    categoria: 'Fruta',
    codigo_lote: `${lotCode}-${RUN_ID}`,
    data_validade: expiration,
    preco_unitario: price,
    quantidade_estoque: quantity,
  });
  assert.equal(status, 201, JSON.stringify(body));
  return body.item;
}

before(async () => {
  if (!ENABLED) return;
  process.env.PORT = process.env.PORT || '39123';
  server = require('../../src/server');
  await new Promise((resolve) => (server.listening ? resolve() : server.once('listening', resolve)));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  database = await require('../../src/database').initDatabase();
});

after(async () => {
  if (!ENABLED) return;
  await new Promise((resolve) => server.close(resolve));
  await database.end();
});

test('N2: a lot close to expiration is sold with the automatic discount, lot by lot (FEFO)', { skip: !ENABLED }, async () => {
  const product = await createProduct('Morango', { lotCode: 'MOR-A', expiration: storeDatePlusDays(2), quantity: 10, price: 10 });
  assert.equal(product.percentual_desconto, 30);
  assert.equal(product.preco_com_desconto, 7);

  await api('POST', `/products/${product.id}/stock/entries`, {
    quantidade: 5, codigo_lote: `MOR-B-${RUN_ID}`, data_validade: storeDatePlusDays(20),
  });
  const sale = await api('POST', `/products/${product.id}/stock/exits`, { quantidade: 12, subtipo: 'venda' });
  assert.equal(sale.status, 200);
  assert.equal(sale.body.item.percentual_desconto, 0, 'only the fresh lot is left');

  const { body } = await api('GET', `/products/${product.id}/movements`);
  const sales = body.items.filter((movement) => movement.subtipo === 'venda').reverse();
  assert.deepEqual(sales.map((movement) => [movement.quantidade, Number(movement.percentual_desconto)]), [[10, 30], [2, 0]]);
});

test('N3: losses of the month appear in the waste report, valued at the recorded price', { skip: !ENABLED }, async () => {
  const product = await createProduct('Alface', { lotCode: 'ALF', expiration: storeDatePlusDays(10), quantity: 8, price: 3.5 });
  const loss = await api('POST', `/products/${product.id}/stock/exits`, { quantidade: 3, subtipo: 'perda', motivo: 'Murcha' });
  assert.equal(loss.status, 200);

  const { status, body } = await api('GET', '/reports/waste');
  assert.equal(status, 200);
  const line = body.report.por_produto.find((item) => item.produto_id === product.id);
  assert.deepEqual([line.quantidade, line.valor], [3, 10.5]);
  assert.ok(body.report.resumo.quantidade_vendida_com_desconto >= 10, 'the discounted sale of the previous test counts');
});

test('N3: a loss at 23:30 on the last day of a month belongs to that month in the store time zone', { skip: !ENABLED }, async () => {
  const product = await createProduct('Kiwi', { lotCode: 'KIW', expiration: storeDatePlusDays(10), quantity: 5, price: 4 });
  // 2026-10-31 23:30 in Brasília is 2026-11-01 02:30 UTC.
  await database.execute(
    `INSERT INTO movimentacoes_estoque
       (produto_id, tipo, subtipo, quantidade, quantidade_anterior, quantidade_atual, preco_unitario, percentual_desconto, data_movimentacao)
     VALUES (?, 'saida', 'perda', 1, 5, 4, 4.00, 0, '2026-11-01 02:30:00')`,
    [product.id]
  );

  const october = await api('GET', '/reports/waste?month=2026-10');
  const november = await api('GET', '/reports/waste?month=2026-11');
  assert.ok(october.body.report.por_produto.some((item) => item.produto_id === product.id));
  assert.ok(!november.body.report.por_produto.some((item) => item.produto_id === product.id));
});

test('critical rule: a lot that expires today cannot be sold, but can be written off', { skip: !ENABLED }, async () => {
  const product = await createProduct('Uva', { lotCode: 'UVA', expiration: storeDatePlusDays(5), quantity: 0, price: 9 });
  const [lotResult] = await database.execute(
    'INSERT INTO lotes (codigo_lote, data_entrada, data_validade) VALUES (?, ?, ?)',
    [`UVA-HOJE-${RUN_ID}`, storeDatePlusDays(-3), storeDatePlusDays(0)]
  );
  await database.execute('INSERT INTO estoque_lote (produto_id, lote_id, quantidade) VALUES (?, ?, 4)', [product.id, lotResult.insertId]);

  const sale = await api('POST', `/products/${product.id}/stock/exits`, { quantidade: 1, subtipo: 'venda' });
  assert.equal(sale.status, 422);
  const loss = await api('POST', `/products/${product.id}/stock/exits`, { quantidade: 4, subtipo: 'perda' });
  assert.equal(loss.status, 200);
});

test('regression: PUT with a new expiration date is rejected instead of silently ignored', { skip: !ENABLED }, async () => {
  const product = await createProduct('Pera', { lotCode: 'PER', expiration: storeDatePlusDays(10), quantity: 2, price: 5 });
  const update = await api('PUT', `/products/${product.id}`, {
    nome: product.nome, categoria: 'Fruta', preco_unitario: 6, data_validade: storeDatePlusDays(30),
  });
  assert.equal(update.status, 400);
  assert.match(update.body.error, /data_validade/);

  const valid = await api('PUT', `/products/${product.id}`, { nome: product.nome, categoria: 'Fruta', preco_unitario: 6 });
  assert.equal(valid.status, 200);
  assert.equal(valid.body.item.preco_unitario, '6.00');
});

test('a product with stock history is inactivated on delete and leaves the catalog', { skip: !ENABLED }, async () => {
  const product = await createProduct('Caqui', { lotCode: 'CAQ', expiration: storeDatePlusDays(10), quantity: 2, price: 5 });
  const removal = await api('DELETE', `/products/${product.id}`);
  assert.deepEqual(removal.body, { deleted: false, deactivated: true });

  const catalog = await api('GET', '/products');
  assert.ok(!catalog.body.items.some((item) => item.id === product.id));
  const stock = await api('GET', '/stock');
  assert.equal(stock.body.items.find((item) => item.id === product.id).status, 'inativo');
});
