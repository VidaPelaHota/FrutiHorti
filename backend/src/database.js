const mysql = require('mysql2/promise');

function getDbConfig() {
  return {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_DATABASE || 'hortifruti',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: process.env.DB_COLLATION || 'utf8mb4_general_ci',
      multipleStatements: true,
    },
  };
}

let pool;

async function initDatabase() {
  if (!pool) {
    const config = getDbConfig();
    pool = mysql.createPool(config.connection);

    const connection = await pool.getConnection();
    try {
      await connection.query('SELECT 1');
    } finally {
      connection.release();
    }
  }

  return pool;
}

async function listProducts() {
  const database = await initDatabase();

  const [rows] = await database.execute(`
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
  `);

  return rows;
}

async function ensureCategory(database, categoryName) {
  const normalized = String(categoryName).trim();

  const [rows] = await database.execute(
    'SELECT id FROM categorias WHERE nome = ? LIMIT 1',
    [normalized]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await database.execute(
    'INSERT INTO categorias (nome, descricao) VALUES (?, ?)',
    [normalized, `Categoria ${normalized}`]
  );

  return result.insertId;
}

async function ensureLote(database, code, validade, entrada) {
  const normalizedCode = String(code).trim();
  const entradaDate = entrada || new Date().toISOString().slice(0, 10);

  const [rows] = await database.execute(
    'SELECT id FROM lotes WHERE codigo_lote = ? LIMIT 1',
    [normalizedCode]
  );

  if (rows.length > 0) {
    const loteId = rows[0].id;
    await database.execute(
      'UPDATE lotes SET data_validade = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [validade, loteId]
    );
    return loteId;
  }

  const [result] = await database.execute(
    'INSERT INTO lotes (codigo_lote, data_entrada, data_validade) VALUES (?, ?, ?)',
    [normalizedCode, entradaDate, validade]
  );

  return result.insertId;
}

async function createProduct(payload) {
  const database = await initDatabase();
  const categoryId = await ensureCategory(database, payload.categoria);
  const loteId = await ensureLote(
    database,
    payload.codigo_lote,
    payload.data_validade,
    payload.data_entrada
  );

  const [result] = await database.execute(
    `
      INSERT INTO produtos (nome, categoria_id, lote_id, preco_unitario, quantidade_estoque, perecivel)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      payload.nome,
      categoryId,
      loteId,
      payload.preco_unitario,
      payload.quantidade_estoque,
      payload.perecivel ? 1 : 0,
    ]
  );

  const [rows] = await database.execute(
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
    `,
    [result.insertId]
  );

  return rows[0];
}

async function updateProduct(productId, payload) {
  const database = await initDatabase();
  const [existingRows] = await database.execute('SELECT id FROM produtos WHERE id = ? LIMIT 1', [productId]);

  if (existingRows.length === 0) {
    return null;
  }

  const categoryId = await ensureCategory(database, payload.categoria);
  const loteId = await ensureLote(
    database,
    payload.codigo_lote,
    payload.data_validade,
    payload.data_entrada
  );

  await database.execute(
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
    `,
    [
      payload.nome,
      categoryId,
      loteId,
      payload.preco_unitario,
      payload.quantidade_estoque,
      payload.perecivel ? 1 : 0,
      productId,
    ]
  );

  const [rows] = await database.execute(
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
    `,
    [productId]
  );

  return rows[0];
}

async function deleteProduct(productId) {
  const database = await initDatabase();
  await database.execute('START TRANSACTION');

  try {
    await database.execute('DELETE FROM vendas WHERE produto_id = ?', [productId]);
    const [result] = await database.execute('DELETE FROM produtos WHERE id = ?', [productId]);
    await database.execute('COMMIT');
    return result.affectedRows > 0;
  } catch (error) {
    await database.execute('ROLLBACK');
    throw error;
  }
}

module.exports = {
  getDbConfig,
  initDatabase,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
