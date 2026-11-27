const test = require('node:test');
const assert = require('node:assert/strict');

const database = require('../src/database');
const reportRepository = require('../src/repositories/reportRepository');
const productService = require('../src/services/productService');
const { buildWasteReport, getWasteReport } = require('../src/services/wasteReportService');
const { getStoreMonthRange, getCurrentStoreMonth } = require('../src/storePeriod');

const NOVEMBER = getStoreMonthRange('2026-11');

function exit(overrides) {
  return {
    produto_id: 1,
    nome: 'Banana',
    categoria: 'Fruta',
    subtipo: 'perda',
    quantidade: 1,
    preco_unitario: '6.50',
    percentual_desconto: '0.00',
    preco_atual: '6.50',
    ...overrides,
  };
}

test('losses are summed per product and per category, highest value first', () => {
  const report = buildWasteReport({
    period: NOVEMBER,
    rows: [
      exit({ quantidade: 2 }),
      exit({ quantidade: 3 }),
      exit({ produto_id: 2, nome: 'Alface', categoria: 'Verdura', quantidade: 10, preco_unitario: '3.50', preco_atual: '3.50' }),
    ],
  });

  assert.equal(report.mes, '2026-11');
  assert.deepEqual(report.periodo, { inicio: '2026-11-01', fim: '2026-11-30' });
  assert.equal(report.resumo.quantidade_perdida, 15);
  assert.equal(report.resumo.valor_perdido, 67.5);
  assert.equal(report.resumo.produtos_com_perda, 2);
  assert.deepEqual(report.por_produto.map(({ nome, quantidade, valor }) => [nome, quantidade, valor]), [
    ['Alface', 10, 35],
    ['Banana', 5, 32.5],
  ]);
  assert.deepEqual(report.por_categoria.map(({ categoria, valor }) => [categoria, valor]), [['Verdura', 35], ['Fruta', 32.5]]);
});

test('losses are valued at the price recorded on the exit, not at the current price', () => {
  const report = buildWasteReport({ period: NOVEMBER, rows: [exit({ quantidade: 2, preco_unitario: '5.00', preco_atual: '9.00' })] });
  assert.equal(report.resumo.valor_perdido, 10);
  assert.equal(report.resumo.valor_estimado, false);
});

test('exits recorded before migration 002 use the current price and flag the value as estimated', () => {
  const report = buildWasteReport({ period: NOVEMBER, rows: [exit({ quantidade: 2, preco_unitario: null, preco_atual: '9.00' })] });
  assert.equal(report.resumo.valor_perdido, 18);
  assert.equal(report.resumo.valor_estimado, true);
});

test('sales with the automatic discount are reported as revenue saved from waste', () => {
  const report = buildWasteReport({
    period: NOVEMBER,
    rows: [
      exit({ subtipo: 'venda', quantidade: 10, preco_unitario: '10.00', percentual_desconto: '30.00' }),
      exit({ subtipo: 'venda', quantidade: 4, preco_unitario: '10.00', percentual_desconto: '0.00' }),
    ],
  });

  assert.equal(report.resumo.quantidade_vendida_com_desconto, 10);
  assert.equal(report.resumo.receita_com_desconto, 70);
  assert.equal(report.resumo.desconto_concedido, 30);
  assert.equal(report.resumo.quantidade_perdida, 0, 'sales are never counted as waste');
});

test('a month without exits returns zeros and empty lists', () => {
  const report = buildWasteReport({ period: NOVEMBER, rows: [] });
  assert.equal(report.resumo.valor_perdido, 0);
  assert.deepEqual(report.por_produto, []);
  assert.equal(report.estoque_vencido_pendente, null);
});

test('stock still sitting in expired lots is listed as pending write-off, inactive products excluded', () => {
  const report = buildWasteReport({
    period: NOVEMBER,
    rows: [],
    pendingProducts: [
      { id: 1, nome: 'Banana', categoria: 'Fruta', status: 'vencido', preco_unitario: '6.50', quantidade_vencida: 4 },
      { id: 2, nome: 'Tomate', categoria: 'Legume', status: 'ativo', preco_unitario: '8.90', quantidade_vencida: 0 },
      { id: 3, nome: 'Uva', categoria: 'Fruta', status: 'inativo', preco_unitario: '9.00', quantidade_vencida: 7 },
    ],
  });

  assert.equal(report.estoque_vencido_pendente.quantidade, 4);
  assert.equal(report.estoque_vencido_pendente.valor, 26);
  assert.deepEqual(report.estoque_vencido_pendente.produtos.map((product) => product.nome), ['Banana']);
});

test('getWasteReport queries the store month and adds pending stock only for the current month', async (t) => {
  const executor = {};
  const queriedPeriods = [];
  t.mock.method(database, 'initDatabase', async () => executor);
  t.mock.method(reportRepository, 'listExitMovements', async (received, period) => {
    assert.equal(received, executor);
    queriedPeriods.push(period);
    return [];
  });
  const listProducts = t.mock.method(productService, 'listProducts', async () => []);

  const past = await getWasteReport('2026-01');
  assert.equal(past.estoque_vencido_pendente, null);
  assert.equal(listProducts.mock.callCount(), 0);
  assert.equal(queriedPeriods[0].start.toISOString(), '2026-01-01T03:00:00.000Z');

  const current = await getWasteReport();
  assert.equal(current.mes, getCurrentStoreMonth());
  assert.notEqual(current.estoque_vencido_pendente, null);
  assert.deepEqual(listProducts.mock.calls[0].arguments, [{ includeInactive: true }]);
});
