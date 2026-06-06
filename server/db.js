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
      customer_type TEXT NOT NULL DEFAULT 'private',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Backward-compatible migration for existing databases.
  db.run('ALTER TABLE users ADD COLUMN password_plain TEXT', () => {});
  db.run('ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT \'customer\'', () => {});
  db.run('ALTER TABLE users ADD COLUMN customer_type TEXT NOT NULL DEFAULT \'private\'', () => {});

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
      supplier_id INTEGER,
      product_price REAL,
      product_image_url TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )
  `);

  db.run('ALTER TABLE inventory_items ADD COLUMN supplier_id INTEGER', () => {});
  db.run('ALTER TABLE inventory_items ADD COLUMN product_price REAL', () => {});
  db.run('ALTER TABLE inventory_items ADD COLUMN product_image_url TEXT', () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL UNIQUE,
      supplier_code TEXT NOT NULL UNIQUE,
      product_category TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run('ALTER TABLE suppliers ADD COLUMN supplier_code TEXT NOT NULL DEFAULT \'\'', () => {});
  db.run('ALTER TABLE suppliers ADD COLUMN product_category TEXT NOT NULL DEFAULT \'\'', () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      created_by_user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(created_by_user_id) REFERENCES users(id)
    )
  `);

  db.run('ALTER TABLE purchase_orders ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP', () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      min_stock INTEGER NOT NULL,
      FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id)
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

  db.run(`
    CREATE TABLE IF NOT EXISTS work_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  const seedSuppliers = [
    ['נירלט', 'NIRLAT', 'צבע', 'nirlat@suppliers.co.il', '03-5550001', 'ספק צבע ראשי'],
    ['פארנשר', 'PARNESHER', 'חומרי בנייה', 'parnesher@suppliers.co.il', '03-5550002', 'ספק חומרי בנייה כלליים'],
    ['סיקה', 'SIKA', 'חומרי בנייה', 'sika@suppliers.co.il', '03-5550003', 'ספק דבקים ואיטום'],
    ['SP', 'SPPIPE', 'אינסטלציה', 'sp@suppliers.co.il', '03-5550004', 'ספק אביזרי אינסטלציה'],
    ['תרמוקיר', 'THERMOKIR', 'חומרי בנייה', 'thermokir@suppliers.co.il', '03-5550005', 'ספק בידוד וחומרים משלימים'],
    ['מטרפיקס', 'MRFIX', 'חומרי בנייה', 'mrfix@suppliers.co.il', '03-5550006', 'ספק חומרי בנייה ותחזוקה'],
    ['יעקובי', 'YAACOB', 'צבע', 'yaacob@suppliers.co.il', '03-5550007', 'ספק צבע ואביזרי צביעה'],
    ['ניסקו', 'NISKO', 'חשמל', 'nisko@suppliers.co.il', '03-5550008', 'ספק חשמל'],
    ['ספדיני', 'SPADINI', 'כלי עבודה', 'spadini@suppliers.co.il', '03-5550009', 'ספק כלים ואביזרים'],
    ['ביגיבונד', 'BIGIBOND', 'גינון', 'bigibond@suppliers.co.il', '03-5550010', 'ספק גינון'],
    ['דשדש', 'DASHEDASH', 'חומרי בנייה', 'deshadesh@suppliers.co.il', '03-5550011', 'ספק גמר ובנייה'],
    ['פלאד', 'FLOOD', 'אינסטלציה', 'flood@suppliers.co.il', '03-5550012', 'ספק אינסטלציה'],
    ['חמת', 'HAMAT', 'אינסטלציה', 'hamat@suppliers.co.il', '03-5550013', 'ספק ברזים ואביזרים'],
    ['סאג', 'SAG', 'אינסטלציה', 'sag@suppliers.co.il', '03-5550014', 'ספק אינסטלציה משלים'],
    ['אורבונד', 'ORBOND', 'חומרי בנייה', 'orbond@suppliers.co.il', '03-5550015', 'ספק חומרי הדבקה ובנייה'],
    ['בוש', 'BOSCH', 'כלי עבודה', 'bosch@suppliers.co.il', '03-5550016', 'ספק כלי עבודה חשמליים'],
    ['מקיטה', 'MAKITA', 'כלי עבודה', 'makita@suppliers.co.il', '03-5550017', 'ספק כלי עבודה חשמליים'],
    ['סטנלי', 'STANLEY', 'כלי עבודה', 'stanley@suppliers.co.il', '03-5550018', 'ספק כלי עבודה ואביזרים'],
    ['שטל', 'STTL', 'כלי עבודה', 'shtal@suppliers.co.il', '03-5550019', 'ספק כלי עבודה ידניים'],
  ];

  const normalizeLegacySuppliersStmt = db.prepare(
    `UPDATE suppliers
     SET supplier_name = ?,
         supplier_code = ?,
         product_category = ?,
         email = ?,
         phone = ?,
         notes = ?
     WHERE supplier_name = ? OR supplier_code = ?`
  );
  seedSuppliers.forEach(([supplierName, supplierCode, productCategory, email, phone, notes]) => {
    normalizeLegacySuppliersStmt.run([supplierName, supplierCode, productCategory, email, phone, notes, supplierCode, supplierCode]);
  });
  normalizeLegacySuppliersStmt.finalize();

  const seedSuppliersStmt = db.prepare(
    `INSERT OR IGNORE INTO suppliers (supplier_name, supplier_code, product_category, email, phone, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  seedSuppliers.forEach((supplier) => {
    seedSuppliersStmt.run(supplier);
  });
  seedSuppliersStmt.finalize();

  const seedSuppliersBackfillStmt = db.prepare(
    `UPDATE suppliers
     SET supplier_code = ?,
         product_category = ?,
         email = ?,
         phone = ?,
         notes = ?
     WHERE supplier_name = ?`
  );
  seedSuppliers.forEach(([supplierName, supplierCode, productCategory, email, phone, notes]) => {
    seedSuppliersBackfillStmt.run([supplierCode, productCategory, email, phone, notes, supplierName]);
  });
  seedSuppliersBackfillStmt.finalize();

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

  const supplierAssignmentsByProductId = {
    'paint-wall-white-18l': 'NIRLAT',
    'base-paint': 'YAACOB',
    'paint-brush-set': 'YAACOB',
    'paint-roller': 'YAACOB',
    'lime-whitewash': 'NIRLAT',
    'concrete-block': 'PARNESHER',
    'cement-bag': 'THERMOKIR',
    'sand-bag': 'PARNESHER',
    'gravel-bag': 'PARNESHER',
    'gypsum-board': 'ORBOND',
    'silicone-adhesive': 'SIKA',
    'super7-adhesive': 'MRFIX',
    'super5-silicone': 'MRFIX',
    'niroplast': 'MRFIX',
    'faucet': 'HAMAT',
    'sink-trap': 'FLOOD',
    'plumbing-set': 'SPPIPE',
    'electrical-wire': 'NISKO',
    'extension-cable': 'NISKO',
    'electric-drill': 'MAKITA',
    'screw-set': 'STANLEY',
    'screwdriver-set': 'STANLEY',
    'putty-set': 'STTL',
    'garden-supplies': 'BIGIBOND',
  };

  Object.entries(supplierAssignmentsByProductId).forEach(([productId, supplierCode]) => {
    db.run(
      `UPDATE inventory_items
       SET supplier_id = (
         SELECT id FROM suppliers WHERE supplier_code = ?
       )
       WHERE product_id = ?`,
      [supplierCode, productId],
      () => {}
    );
  });
});

module.exports = db;
