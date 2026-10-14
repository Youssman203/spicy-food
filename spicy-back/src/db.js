import pg from 'pg';
export function createPool() {
  return new pg.Pool({
    ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
      host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432),
      database: process.env.POSTGRES_DB || 'spicy', user: process.env.POSTGRES_USER || 'spicy', password: process.env.POSTGRES_PASSWORD,
    }), max: 10, connectionTimeoutMillis: 5000, statement_timeout: 15000,
  });
}
