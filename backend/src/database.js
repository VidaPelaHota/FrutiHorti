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
      // DATE columns come back as 'YYYY-MM-DD' strings, so no time zone shifts the day.
      dateStrings: ['DATE'],
      // TIMESTAMP values are exchanged in UTC; the session time zone is set to match (see initDatabase).
      timezone: 'Z',
    },
  };
}

const UTC_SESSION_SQL = "SET time_zone = '+00:00'";

let pool;

async function initDatabase() {
  if (!pool) {
    const config = getDbConfig();
    pool = mysql.createPool(config.connection);
    // Without this, a MySQL server and a Node container in different time zones would shift every
    // TIMESTAMP (movement dates) by hours, and the monthly report would miss movements near midnight.
    pool.on('connection', (connection) => connection.query(UTC_SESSION_SQL));

    const connection = await pool.getConnection();
    try {
      await connection.query('SELECT 1');
    } finally {
      connection.release();
    }
  }

  return pool;
}

async function withTransaction(callback) {
  const database = await initDatabase();
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getDbConfig, initDatabase, withTransaction };
