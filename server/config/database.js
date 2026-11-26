const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const databasePath = path.resolve(
  process.env.SQLITE_PATH || path.join(__dirname, '../../database/helpdesk.sqlite')
);
const schemaPath = path.join(__dirname, '../../database/schema.sql');
const seedPath = path.join(__dirname, '../../database/seed.sql');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new sqlite3.Database(databasePath);

const execute = (sql, params = []) => new Promise((resolve, reject) => {
  database.run(sql, params, function onComplete(error) {
    if (error) {
      reject(error);
      return;
    }

    resolve({
      insertId: this.lastID,
      affectedRows: this.changes
    });
  });
});

const read = (sql, params = []) => new Promise((resolve, reject) => {
  database.all(sql, params, (error, rows) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(rows);
  });
});

const normalizeParameter = (value) => {
  if (value instanceof Date) {
    return value.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
};

const pool = {
  async query(sql, params = []) {
    const statement = sql.trimStart();
    const isRead = /^(SELECT|PRAGMA|WITH|EXPLAIN)\b/i.test(statement);
    const values = params.map(normalizeParameter);

    if (isRead) {
      return [await read(sql, values)];
    }
    return [await execute(sql, values)];
  },
  ready: (async () => {
    await new Promise((resolve, reject) => {
      database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      database.exec(fs.readFileSync(schemaPath, 'utf8'), (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const [users] = await pool.query('SELECT COUNT(*) AS count FROM users');
    if (users[0].count === 0) {
      await new Promise((resolve, reject) => {
        database.exec(fs.readFileSync(seedPath, 'utf8'), (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    console.log(`SQLite database ready at ${databasePath}`);
  })()
};

module.exports = pool;
