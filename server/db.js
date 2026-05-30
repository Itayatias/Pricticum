const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'auth.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_plain TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Backward-compatible migration for existing databases.
  db.run('ALTER TABLE users ADD COLUMN password_plain TEXT', () => {});
  db.run('ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT \'customer\'', () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL UNIQUE,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      location TEXT NOT NULL DEFAULT 'מחסן ראשי',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      user_id INTEGER,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const seedInventory = [
    ['paint-wall-white-18l', 'צבע לקיר לבן 18 ליטר', 'צבע', 42, 8],
    ['concrete-block', 'בלוק בנייה', 'חומרי בנייה', 480, 40],
    ['base-paint', 'צבע בסיס', 'צבע', 56, 10],
    ['faucet', 'ברז', 'אינסטלציה', 18, 6],
    ['silicone-adhesive', 'דבק סיליקון', 'חומרי בנייה', 74, 12],
    ['electrical-wire', 'חוטי חשמל', 'חשמל', 310, 50],
    ['extension-cable', 'כבל מאריך', 'חשמל', 24, 6],
    ['paint-brush-set', 'סט מברשות צבע', 'צבע', 65, 10],
    ['cement-bag', 'מלט', 'חומרי בנייה', 210, 20],
    ['electric-drill', 'מקדחה חשמלית', 'כלי עבודה', 14, 3],
    ['niroplast', 'נירופלסט', 'חומרי בנייה', 90, 12],
    ['super7-adhesive', 'סופר 7 - דבק', 'חומרי בנייה', 58, 10],
    ['super5-silicone', 'סופר 5 - דבק סיליקון', 'חומרי בנייה', 44, 10],
    ['plumbing-set', 'סט אינסטלציה', 'אינסטלציה', 16, 4],
    ['screw-set', 'סט ברגים', 'כלי עבודה', 120, 20],
    ['screwdriver-set', 'סט מברגים', 'כלי עבודה', 48, 10],
    ['putty-set', 'סט שפכטלים', 'כלי עבודה', 31, 6],
    ['lime-whitewash', 'סיד', 'צבע', 70, 10],
    ['sink-trap', 'סיפון', 'אינסטלציה', 25, 5],
    ['gypsum-board', 'פלטת גבס', 'חומרי בנייה', 64, 8],
    ['paint-roller', 'רולר צביעה', 'צבע', 36, 8],
    ['sand-bag', 'שק חול', 'חומרי בנייה', 130, 15],
    ['gravel-bag', 'שק חצץ', 'חומרי בנייה', 122, 15],
    ['garden-supplies', 'ציוד גינה', 'גינון', 26, 5],
  ];

  const seedInventoryStmt = db.prepare(
    `INSERT OR IGNORE INTO inventory_items (product_id, product_name, category, stock, min_stock)
     VALUES (?, ?, ?, ?, ?)`
  );

  seedInventory.forEach((item) => {
    seedInventoryStmt.run(item);
  });
  seedInventoryStmt.finalize();
});

module.exports = db;
