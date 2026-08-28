const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'hortifruti.db');
const schemaPath = path.join(__dirname, '..', '..', 'db', 'hortifruti_basico.sql');

let db;

function initDatabase() {
  if (db) {
    return db;
  }

  fs.mkdirSync(dbDir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');

  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'produtos'")
    .get();

  if (!tableExists) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  return db;
}

function listProducts() {
  const database = initDatabase();

  return database
    .prepare(
      `
      SELECT
        p.id,
        p.nome,
        c.nome AS categoria,
        p.preco_unitario,
        p.quantidade_estoque,
        l.codigo_lote,
        l.data_validade
      FROM produtos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      INNER JOIN lotes l ON l.id = p.lote_id
      ORDER BY p.id ASC
      `
    )
    .all();
}

function ensureCategory(database, categoryName) {
  const normalized = String(categoryName).trim();
  database
    .prepare('INSERT OR IGNORE INTO categorias (nome, descricao) VALUES (?, ?)')
    .run(normalized, `Categoria ${normalized}`);

  const category = database
    .prepare('SELECT id FROM categorias WHERE nome = ?')
    .get(normalized);

  return category.id;
}

function ensureLote(database, code, validade, entrada) {
  const normalizedCode = String(code).trim();
  const entradaDate = entrada || new Date().toISOString().slice(0, 10);

  database
    .prepare(
      'INSERT OR IGNORE INTO lotes (codigo_lote, data_entrada, data_validade) VALUES (?, ?, ?)'
    )
    .run(normalizedCode, entradaDate, validade);

  const lote = database
    .prepare('SELECT id FROM lotes WHERE codigo_lote = ?')
    .get(normalizedCode);

  if (lote) {
    database
      .prepare('UPDATE lotes SET data_validade = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(validade, lote.id);
    return lote.id;
  }

  throw new Error('Failed to ensure lote');
}

function createProduct(payload) {
  const database = initDatabase();
  const categoryId = ensureCategory(database, payload.categoria);
  const loteId = ensureLote(
    database,
    payload.codigo_lote,
    payload.data_validade,
    payload.data_entrada
  );

  const result = database
    .prepare(
      `
      INSERT INTO produtos (nome, categoria_id, lote_id, preco_unitario, quantidade_estoque, perecivel)
      VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      payload.nome,
      categoryId,
      loteId,
      payload.preco_unitario,
      payload.quantidade_estoque,
      payload.perecivel ? 1 : 0
    );

  return database
    .prepare(
      `
      SELECT
        p.id,
        p.nome,
        c.nome AS categoria,
        p.preco_unitario,
        p.quantidade_estoque,
        l.codigo_lote,
        l.data_validade
      FROM produtos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      INNER JOIN lotes l ON l.id = p.lote_id
      WHERE p.id = ?
      `
    )
    .get(result.lastInsertRowid);
}

function updateProduct(productId, payload) {
  const database = initDatabase();
  const existing = database
    .prepare('SELECT id FROM produtos WHERE id = ?')
    .get(productId);

  if (!existing) {
    return null;
  }

  const categoryId = ensureCategory(database, payload.categoria);
  const loteId = ensureLote(
    database,
    payload.codigo_lote,
    payload.data_validade,
    payload.data_entrada
  );

  database
    .prepare(
      `
      UPDATE produtos
      SET
        nome = ?,
        categoria_id = ?,
        lote_id = ?,
        preco_unitario = ?,
        quantidade_estoque = ?,
        perecivel = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .run(
      payload.nome,
      categoryId,
      loteId,
      payload.preco_unitario,
      payload.quantidade_estoque,
      payload.perecivel ? 1 : 0,
      productId
    );

  return database
    .prepare(
      `
      SELECT
        p.id,
        p.nome,
        c.nome AS categoria,
        p.preco_unitario,
        p.quantidade_estoque,
        l.codigo_lote,
        l.data_validade
      FROM produtos p
      INNER JOIN categorias c ON c.id = p.categoria_id
      INNER JOIN lotes l ON l.id = p.lote_id
      WHERE p.id = ?
      `
    )
    .get(productId);
}

function deleteProduct(productId) {
  const database = initDatabase();
  database.exec('BEGIN TRANSACTION');

  try {
    database.prepare('DELETE FROM vendas WHERE produto_id = ?').run(productId);
    const result = database.prepare('DELETE FROM produtos WHERE id = ?').run(productId);
    database.exec('COMMIT');
    return result.changes > 0;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

module.exports = {
  initDatabase,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
