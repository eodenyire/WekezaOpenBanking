/**
 * Database Connection Pool
 */

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../src/utils/logger');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis
});

pool.on('connect', () => {
  logger.info('Database connected successfully');
});

pool.on('error', (err) => {
  logger.error('Database connection error:', err);
});

pool.query_one = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows[0];
};

module.exports = pool;
