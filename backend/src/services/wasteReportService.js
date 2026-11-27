const database = require('../database');
const reportRepository = require('../repositories/reportRepository');
const productService = require('./productService');
const { SALE_SUBTYPE } = require('../stockRules');
const { applyDiscount, toCents, fromCents } = require('../discountRules');
const { getCurrentStoreMonth, getStoreMonthRange } = require('../storePeriod');

const LOSS_SUBTYPE = 'perda';

// Exits recorded before migration 002 have no stored price; the current price is used instead.
function recordedPrice(row) {
  return row.preco_unitario ?? row.preco_atual;
}

function accumulate(groups, key, seed, quantity, cents) {
  const group = groups.get(key) || { ...seed, quantidade: 0, valorCents: 0 };
  group.quantidade += quantity;
  group.valorCents += cents;
  groups.set(key, group);
}

function sortedByValue(groups) {
  return [...groups.values()]
    .sort((first, second) => second.valorCents - first.valorCents || second.quantidade - first.quantidade)
    .map(({ valorCents, ...group }) => ({ ...group, valor: fromCents(valorCents) }));
}

// N3: losses ("perda" exits) valued at the list price recorded at the moment of the loss.
function summarizeLosses(lossRows) {
  const byProduct = new Map();
  const byCategory = new Map();
  let estimated = false;

  for (const row of lossRows) {
    const quantity = Number(row.quantidade);
    const cents = toCents(recordedPrice(row)) * quantity;
    estimated = estimated || row.preco_unitario === null || row.preco_unitario === undefined;
    accumulate(byProduct, row.produto_id, { produto_id: row.produto_id, nome: row.nome, categoria: row.categoria }, quantity, cents);
    accumulate(byCategory, row.categoria, { categoria: row.categoria }, quantity, cents);
  }

  return { byProduct: sortedByValue(byProduct), byCategory: sortedByValue(byCategory), estimated };
}

// N2 effect: units that were sold with the automatic discount instead of becoming waste.
function summarizeDiscountedSales(saleRows) {
  const discounted = saleRows.filter((row) => Number(row.percentual_desconto) > 0);
  return discounted.reduce(
    (totals, row) => {
      const quantity = Number(row.quantidade);
      const fullCents = toCents(recordedPrice(row));
      const soldCents = toCents(applyDiscount(recordedPrice(row), Number(row.percentual_desconto)));
      return {
        quantidade: totals.quantidade + quantity,
        receitaCents: totals.receitaCents + soldCents * quantity,
        descontoCents: totals.descontoCents + (fullCents - soldCents) * quantity,
      };
    },
    { quantidade: 0, receitaCents: 0, descontoCents: 0 }
  );
}

// Snapshot of stock sitting in expired lots that was not written off yet (only for the current month).
function summarizePendingExpired(products) {
  const pending = products
    .filter((product) => product.status !== 'inativo' && product.quantidade_vencida > 0)
    .map((product) => ({
      produto_id: product.id,
      nome: product.nome,
      categoria: product.categoria,
      quantidade: product.quantidade_vencida,
      valorCents: toCents(product.preco_unitario) * product.quantidade_vencida,
    }));
  const valorCents = pending.reduce((total, item) => total + item.valorCents, 0);

  return {
    quantidade: pending.reduce((total, item) => total + item.quantidade, 0),
    valor: fromCents(valorCents),
    produtos: pending.map(({ valorCents: cents, ...item }) => ({ ...item, valor: fromCents(cents) })),
  };
}

function buildWasteReport({ period, rows, pendingProducts }) {
  const losses = summarizeLosses(rows.filter((row) => row.subtipo === LOSS_SUBTYPE));
  const sales = summarizeDiscountedSales(rows.filter((row) => row.subtipo === SALE_SUBTYPE));
  const lossCents = losses.byProduct.reduce((total, item) => total + toCents(item.valor), 0);

  return {
    mes: period.month,
    periodo: { inicio: period.firstDay, fim: period.lastDay },
    resumo: {
      quantidade_perdida: losses.byProduct.reduce((total, item) => total + item.quantidade, 0),
      valor_perdido: fromCents(lossCents),
      produtos_com_perda: losses.byProduct.length,
      quantidade_vendida_com_desconto: sales.quantidade,
      receita_com_desconto: fromCents(sales.receitaCents),
      desconto_concedido: fromCents(sales.descontoCents),
      valor_estimado: losses.estimated,
    },
    por_produto: losses.byProduct,
    por_categoria: losses.byCategory,
    estoque_vencido_pendente: pendingProducts ? summarizePendingExpired(pendingProducts) : null,
  };
}

async function getWasteReport(month = getCurrentStoreMonth()) {
  const period = getStoreMonthRange(month);
  const executor = await database.initDatabase();
  const rows = await reportRepository.listExitMovements(executor, period);
  const isCurrentMonth = month === getCurrentStoreMonth();
  const pendingProducts = isCurrentMonth ? await productService.listProducts({ includeInactive: true }) : null;

  return buildWasteReport({ period, rows, pendingProducts });
}

module.exports = { buildWasteReport, getWasteReport };
