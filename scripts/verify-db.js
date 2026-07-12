/**
 * scripts/verify-db.js
 * Quick script to verify database connection and seed data.
 * 
 * Usage: node scripts/verify-db.js
 * 
 * NOTE: Reads DATABASE_URL from .env.local
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Make sure .env.local is configured.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('✅ Tables:', tables.rows.map(r => r.table_name).join(', '));

  const users = await pool.query('SELECT name, email, role FROM users');
  console.log(`✅ Users seeded: ${users.rowCount}`);
  users.rows.forEach(r => console.log('  -', r.email, '|', r.role));

  const vehicles = await pool.query('SELECT vehicle_id, status FROM vehicles');
  console.log(`✅ Vehicles seeded: ${vehicles.rowCount}`);
  vehicles.rows.forEach(r => console.log('  -', r.vehicle_id, '|', r.status));

  pool.end();
}

check().catch(e => { console.error('❌', e.message); pool.end(); });
