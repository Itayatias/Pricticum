const express = require('express');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const hashBuffer = Buffer.from(hash, 'hex');
      resolve(
        hashBuffer.length === derivedKey.length &&
          crypto.timingSafeEqual(hashBuffer, derivedKey)
      );
    });
  });
}

async function runDbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, full_name AS fullName, email, role, customer_type AS customerType, password_plain AS passwordPlain FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

async function isStaffUser(userId) {
  const user = await getUserById(userId);
  return user ? ['employee', 'manager'].includes(user.role) : false;
}

async function seedDemoAccounts() {
  const password = '123456';
  const passwordHash = await hashPassword(password);
  const demoAccounts = [
    { fullName: 'מנהל חנות', email: 'manager@nevelat.co.il', role: 'manager' },
    { fullName: 'עובד חנות', email: 'employee@nevelat.co.il', role: 'employee' },
    { fullName: 'לקוח קבלן', email: 'customer1@nevelat.co.il', role: 'customer' },
    { fullName: 'לקוחה פרטית', email: 'customer2@nevelat.co.il', role: 'customer' },
    { fullName: 'לקוח עסקי', email: 'customer3@nevelat.co.il', role: 'customer' },
  ];

  for (const account of demoAccounts) {
    // Keep demo accounts stable across runs so the dashboards are always usable.
    // eslint-disable-next-line no-await-in-loop
    await runDbRun(
      `INSERT INTO users (full_name, email, password_hash, password_plain, role)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         full_name = excluded.full_name,
         password_hash = excluded.password_hash,
         password_plain = excluded.password_plain,
         role = excluded.role`,
      [account.fullName, account.email, passwordHash, password, account.role]
    );
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'auth-api' });
});

app.get('/api/dev-session', (_req, res) => {
  res.json({
    devSessionId: process.env.DEV_SESSION_ID || null,
  });
});

app.get('/api/users', (_req, res) => {
  db.all(
    `SELECT id, full_name AS fullName, email, role, customer_type AS customerType, password_plain AS password, created_at AS createdAt
     FROM users
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch users' });
      res.json(rows);
    }
  );
});

async function authorizeUser(userId, allowedRoles) {
  const user = await getUserById(userId);
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  return user;
}

function mapWorkHoursRow(row) {
  const checkIn = row.checkIn || row.check_in;
  const checkOut = row.checkOut || row.check_out || null;
  return {
    id: row.id,
    userId: row.userId || row.user_id,
    fullName: row.fullName || row.full_name,
    email: row.email || null,
    checkIn,
    checkOut,
    notes: row.notes || '',
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
  };
}

function getDateKey(value) {
  return String(value || '').slice(0, 10);
}

function formatDateKey(value) {
  return new Date(value).toLocaleDateString('he-IL');
}

function normalizePurchaseOrderStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (['new', 'in_progress', 'picking', 'done'].includes(normalized)) {
    return normalized;
  }
  if (normalized === 'draft' || normalized === 'sent') {
    return 'new';
  }
  return 'new';
}

function normalizeCustomerOrderStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (['new', 'in_progress', 'sent', 'done'].includes(normalized)) {
    return normalized;
  }
  return 'new';
}

app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password } = req.body || {};

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email and password are required' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const passwordHash = await hashPassword(String(password));

    db.run(
      'INSERT INTO users (full_name, email, password_hash, password_plain, role) VALUES (?, ?, ?, ?, ?)',
      [String(fullName).trim(), String(email).trim().toLowerCase(), passwordHash, String(password), 'customer'],
      function onInsert(err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'User with this email already exists' });
          }
          return res.status(500).json({ message: 'Failed to register user' });
        }

        return res.status(201).json({
          message: 'Registered successfully',
          user: {
            id: this.lastID,
            fullName: String(fullName).trim(),
            email: String(email).trim().toLowerCase(),
            role: 'customer',
            customerType: 'private',
          },
        });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to hash password' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  db.get(
    `SELECT id, full_name AS fullName, email, password_hash AS passwordHash, password_plain AS passwordPlain
            , role
     FROM users
     WHERE email = ?`,
    [String(email).trim().toLowerCase()],
    async (err, row) => {
      if (err) return res.status(500).json({ message: 'Failed to login' });
      if (!row) return res.status(401).json({ message: 'Invalid email or password' });

      try {
        const isPlainMatch = row.passwordPlain && String(password) === String(row.passwordPlain);
        const isHashMatch = await verifyPassword(String(password), row.passwordHash);
        const isValid = Boolean(isPlainMatch || isHashMatch);
        if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });

        if (!row.passwordPlain && isHashMatch) {
          db.run('UPDATE users SET password_plain = ? WHERE id = ?', [String(password), row.id]);
        }

        return res.json({
          message: 'Login successful',
          user: {
            id: row.id,
            fullName: row.fullName,
            email: row.email,
            role: row.role || 'customer',
            customerType: row.customerType || 'private',
          },
        });
      } catch (_err) {
        return res.status(500).json({ message: 'Failed to verify password' });
      }
    }
  );
});

app.get('/api/cart/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  db.all(
    `SELECT id, product_id AS productId, product_name AS productName, price, quantity
     FROM cart_items
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch cart' });

      const total = rows.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return res.json({ items: rows, total });
    }
  );
});

app.post('/api/cart/add', (req, res) => {
  const { userId, productId, productName, price, quantity } = req.body || {};
  const qty = Number(quantity || 1);
  const numericPrice = Number(price);

  if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!productId || !productName || !Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: 'productId, productName and price are required' });
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  db.run(
    `INSERT INTO cart_items (user_id, product_id, product_name, price, quantity)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, product_id)
     DO UPDATE SET
       quantity = quantity + excluded.quantity,
       price = excluded.price,
       updated_at = CURRENT_TIMESTAMP`,
    [Number(userId), String(productId), String(productName), numericPrice, qty],
    (err) => {
      if (err) return res.status(500).json({ message: 'Failed to add product to cart' });
      return res.status(201).json({ message: 'Product added to cart' });
    }
  );
});

app.post('/api/cart/update-quantity', (req, res) => {
  const { userId, productId, quantity } = req.body || {};
  const numericUserId = Number(userId);
  const numericQuantity = Number(quantity);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!productId) {
    return res.status(400).json({ message: 'productId is required' });
  }
  if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  db.run(
    `UPDATE cart_items
     SET quantity = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND product_id = ?`,
    [numericQuantity, numericUserId, String(productId)],
    function onUpdate(err) {
      if (err) return res.status(500).json({ message: 'Failed to update quantity' });
      if (this.changes === 0) return res.status(404).json({ message: 'Cart item not found' });
      return res.json({ message: 'Quantity updated successfully' });
    }
  );
});

app.post('/api/cart/remove', (req, res) => {
  const { userId, productId } = req.body || {};
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!productId) {
    return res.status(400).json({ message: 'productId is required' });
  }

  db.run(
    'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
    [numericUserId, String(productId)],
    function onDelete(err) {
      if (err) return res.status(500).json({ message: 'Failed to remove item from cart' });
      if (this.changes === 0) return res.status(404).json({ message: 'Cart item not found' });
      return res.json({ message: 'Item removed successfully' });
    }
  );
});

app.post('/api/cart/checkout', (req, res) => {
  const { userId } = req.body || {};
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  db.all(
    `SELECT product_id AS productId, product_name AS productName, price, quantity
     FROM cart_items
     WHERE user_id = ?`,
    [numericUserId],
    (fetchErr, items) => {
      if (fetchErr) return res.status(500).json({ message: 'Failed to fetch cart for checkout' });
      if (!items.length) return res.status(400).json({ message: 'Cart is empty' });

      const productIds = items.map((item) => item.productId);
      const placeholders = productIds.map(() => '?').join(', ');

      db.all(
        `SELECT product_id AS productId, stock
         FROM inventory_items
         WHERE product_id IN (${placeholders})`,
        productIds,
        (inventoryErr, inventoryRows) => {
          if (inventoryErr) return res.status(500).json({ message: 'Failed to verify inventory' });

          const inventoryMap = new Map(inventoryRows.map((row) => [row.productId, row.stock]));
          const unavailable = items.filter((item) => {
            const stock = inventoryMap.get(item.productId);
            return typeof stock !== 'number' || stock < item.quantity;
          });

          if (unavailable.length) {
            return res.status(409).json({
              message: 'Some items are out of stock',
              unavailable: unavailable.map((item) => item.productName),
            });
          }

          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const initialStatus = normalizeCustomerOrderStatus('new');

          db.run(
            `INSERT INTO orders (user_id, total_amount, status, staff_notes)
             VALUES (?, ?, ?, ?)`,
            [numericUserId, total, initialStatus, ''],
            function onOrderInsert(orderErr) {
              if (orderErr) return res.status(500).json({ message: 'Failed to create order' });

              const orderId = this.lastID;
              const stmt = db.prepare(
                `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
                 VALUES (?, ?, ?, ?, ?)`
              );

              for (const item of items) {
                stmt.run(orderId, item.productId, item.productName, item.price, item.quantity);
              }

              stmt.finalize((finalizeErr) => {
                if (finalizeErr) return res.status(500).json({ message: 'Failed to finalize order items' });

                let remainingUpdates = items.length;
                let updateFailed = false;

                items.forEach((item) => {
                  db.run(
                    `UPDATE inventory_items
                     SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
                     WHERE product_id = ?`,
                    [item.quantity, item.productId],
                    (updateErr) => {
                      if (updateErr) {
                        updateFailed = true;
                        return res.status(500).json({ message: 'Failed to update inventory after checkout' });
                      }

                      db.run(
                        `INSERT INTO inventory_movements (product_id, user_id, delta, reason)
                         VALUES (?, ?, ?, ?)`,
                        [item.productId, numericUserId, -item.quantity, 'רכישת לקוח'],
                        () => {}
                      );

                      remainingUpdates -= 1;
                      if (!remainingUpdates && !updateFailed) {
                        db.run('DELETE FROM cart_items WHERE user_id = ?', [numericUserId], (clearErr) => {
                          if (clearErr) {
                            return res.status(500).json({ message: 'Order saved but failed to clear cart' });
                          }

                          return res.status(201).json({
                            message: 'Checkout completed successfully',
                            order: { id: orderId, userId: numericUserId, totalAmount: total, status: initialStatus, staffNotes: '', items },
                          });
                        });
                      }
                    }
                  );
                });
              });
            }
          );
        }
      );
    }
  );
});

app.get('/api/orders/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  db.all(
    `SELECT id, total_amount AS totalAmount, status, staff_notes AS staffNotes, created_at AS createdAt, updated_at AS updatedAt
     FROM orders
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId],
    (ordersErr, orders) => {
      if (ordersErr) return res.status(500).json({ message: 'Failed to fetch orders' });
      if (!orders.length) return res.json([]);

      const orderIds = orders.map((order) => order.id);
      const placeholders = orderIds.map(() => '?').join(', ');

      db.all(
        `SELECT order_id AS orderId, product_id AS productId, product_name AS productName, price, quantity
         FROM order_items
         WHERE order_id IN (${placeholders})
         ORDER BY id DESC`,
        orderIds,
        (itemsErr, items) => {
          if (itemsErr) return res.status(500).json({ message: 'Failed to fetch order items' });

          const itemsByOrderId = {};
          for (const item of items) {
            if (!itemsByOrderId[item.orderId]) {
              itemsByOrderId[item.orderId] = [];
            }
            itemsByOrderId[item.orderId].push(item);
          }

          const payload = orders.map((order) => ({
            ...order,
            items: itemsByOrderId[order.id] || [],
            status: normalizeCustomerOrderStatus(order.status),
          }));

          return res.json(payload);
        }
      );
    }
  );
});

app.get('/api/inventory/public', (_req, res) => {
  db.all(
      `SELECT product_id AS productId,
              product_name AS productName,
              category,
              stock,
              min_stock AS minStock,
              location,
              supplier_id AS supplierId,
              s.supplier_name AS supplierName,
              s.supplier_code AS supplierCode,
              s.email AS supplierEmail,
              product_price AS price,
              product_image_url AS imageUrl,
              updated_at AS updatedAt
       FROM inventory_items
       LEFT JOIN suppliers s ON s.id = inventory_items.supplier_id
       ORDER BY category, product_name`,
      [],
      (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch inventory' });
      return res.json(rows);
    }
  );
});

app.get('/api/staff/customer-orders', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.all(
      `SELECT o.id,
              o.total_amount AS totalAmount,
              o.status,
              o.staff_notes AS staffNotes,
              o.created_at AS createdAt,
              o.updated_at AS updatedAt,
              u.full_name AS customerName,
              u.email AS customerEmail,
              u.customer_type AS customerType,
              COUNT(oi.id) AS itemCount
       FROM orders o
       INNER JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.id DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch customer orders' });
        return res.json(rows.map((row) => ({
          ...row,
          status: normalizeCustomerOrderStatus(row.status),
          staffNotes: row.staffNotes || '',
        })));
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/staff/customer-orders/:id', async (req, res) => {
  const userId = Number(req.body?.userId);
  const orderId = Number(req.params.id);
  const status = normalizeCustomerOrderStatus(req.body?.status);
  const staffNotes = String(req.body?.notes ?? '').trim();

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: 'Valid order id is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.run(
      `UPDATE orders
       SET status = ?, staff_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, staffNotes, orderId],
      function onUpdate(err) {
        if (err) return res.status(500).json({ message: 'Failed to update customer order' });
        if (this.changes === 0) return res.status(404).json({ message: 'Order not found' });
        return res.json({
          message: 'Customer order updated successfully',
          orderId,
          status,
          staffNotes,
        });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/suppliers', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.all(
      `SELECT id AS supplierId,
              supplier_name AS supplierName,
              supplier_code AS supplierCode,
              product_category AS productCategory,
              email,
              phone,
              notes
       FROM suppliers
       ORDER BY supplier_name ASC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch suppliers' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/products/custom', (_req, res) => {
  db.all(
    `SELECT product_id AS productId,
            product_name AS productName,
            category,
            stock,
            min_stock AS minStock,
            location,
            product_price AS price,
            product_image_url AS imageUrl,
            updated_at AS updatedAt
     FROM inventory_items
     WHERE product_image_url IS NOT NULL AND TRIM(product_image_url) <> ''
     ORDER BY updated_at DESC, id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch custom products' });
      return res.json(rows);
    }
  );
});

app.get('/api/admin/dashboard', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.get(
      `SELECT
         COUNT(*) AS totalUsers,
         SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) AS customerCount,
         SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) AS employeeCount,
         SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) AS managerCount,
         SUM(CASE WHEN role = 'customer' AND customer_type = 'business' THEN 1 ELSE 0 END) AS businessCustomerCount,
         SUM(CASE WHEN role = 'customer' AND customer_type = 'private' THEN 1 ELSE 0 END) AS privateCustomerCount,
         SUM(CASE WHEN role = 'customer' AND customer_type = 'contractor' THEN 1 ELSE 0 END) AS contractorCustomerCount
       FROM users`,
      [],
      (usersErr, userStats) => {
        if (usersErr) return res.status(500).json({ message: 'Failed to load user stats' });

        db.get(
          `SELECT
             COUNT(*) AS totalOrders,
             COALESCE(SUM(total_amount), 0) AS totalRevenue
           FROM orders`,
          [],
          (ordersErr, orderStats) => {
            if (ordersErr) return res.status(500).json({ message: 'Failed to load order stats' });

            db.get(
              `SELECT
                 COUNT(*) AS totalItems,
                 SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) AS outOfStockCount,
                 SUM(CASE WHEN stock > 0 AND stock <= min_stock THEN 1 ELSE 0 END) AS lowStockCount
               FROM inventory_items`,
              [],
              (inventoryErr, inventoryStats) => {
                if (inventoryErr) return res.status(500).json({ message: 'Failed to load inventory stats' });

                db.get(
                  `SELECT COUNT(*) AS totalSuppliers FROM suppliers`,
                  [],
                  (supplierErr, supplierStats) => {
                    if (supplierErr) return res.status(500).json({ message: 'Failed to load supplier stats' });

                    db.get(
                      `SELECT COUNT(*) AS openPurchaseOrders
                       FROM purchase_orders
                       WHERE status IN ('new', 'in_progress', 'picking')`,
                      [],
                      (purchaseOrderErr, purchaseOrderStats) => {
                        if (purchaseOrderErr) return res.status(500).json({ message: 'Failed to load purchase order stats' });

                        db.all(
                          `SELECT o.id,
                                  o.total_amount AS totalAmount,
                                  o.created_at AS createdAt,
                                  u.full_name AS customerName
                           FROM orders o
                           LEFT JOIN users u ON u.id = o.user_id
                           ORDER BY o.id DESC
                           LIMIT 5`,
                          [],
                          (recentOrdersErr, recentOrders) => {
                            if (recentOrdersErr) return res.status(500).json({ message: 'Failed to load recent orders' });

                            db.all(
                              `SELECT i.product_id AS productId,
                                      i.product_name AS productName,
                                      i.category,
                                      i.stock,
                                      i.min_stock AS minStock,
                                      i.location,
                                      s.supplier_name AS supplierName,
                                      s.supplier_code AS supplierCode,
                                      s.email AS supplierEmail
                               FROM inventory_items i
                               LEFT JOIN suppliers s ON s.id = i.supplier_id
                               WHERE i.stock > 0 AND i.stock <= i.min_stock
                               ORDER BY i.stock ASC, i.product_name ASC
                               LIMIT 10`,
                              [],
                              (criticalErr, criticalStock) => {
                                if (criticalErr) return res.status(500).json({ message: 'Failed to load critical stock items' });

                                db.all(
                                  `SELECT
                                     COALESCE(i.category, 'ללא קטגוריה') AS category,
                                     COALESCE(SUM(oi.quantity), 0) AS unitsSold,
                                     COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
                                   FROM order_items oi
                                   LEFT JOIN inventory_items i ON i.product_id = oi.product_id
                                   GROUP BY COALESCE(i.category, 'ללא קטגוריה')
                                   ORDER BY revenue DESC`,
                                  [],
                                  (categoryErr, categorySales) => {
                                    if (categoryErr) return res.status(500).json({ message: 'Failed to load category sales' });

                                    db.all(
                                      `WITH monthly AS (
                                         SELECT strftime('%Y-%m', created_at) AS monthKey,
                                                COALESCE(SUM(total_amount), 0) AS revenue
                                         FROM orders
                                         WHERE created_at >= date('now', '-5 months')
                                         GROUP BY strftime('%Y-%m', created_at)
                                       )
                                       SELECT monthKey AS month,
                                              revenue
                                       FROM monthly
                                       ORDER BY monthKey ASC`,
                                      [],
                                      (monthlyErr, monthlyRevenue) => {
                                        if (monthlyErr) return res.status(500).json({ message: 'Failed to load monthly revenue' });

                                        return res.json({
                                          users: userStats,
                                          orders: orderStats,
                                          inventory: inventoryStats,
                                          suppliers: supplierStats,
                                          purchaseOrders: purchaseOrderStats,
                                          recentOrders,
                                          criticalStock,
                                          categorySales,
                                          monthlyRevenue,
                                        });
                                      }
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.all(
      `SELECT id, full_name AS fullName, email, role, customer_type AS customerType, password_plain AS password, created_at AS createdAt
       FROM users
       ORDER BY id DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch users' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  const { userId, fullName, email, password, role, customerType } = req.body || {};
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email and password are required' });
  }

  const normalizedRole = ['customer', 'employee', 'manager'].includes(role) ? role : 'customer';
  const normalizedCustomerType = normalizedRole === 'customer'
    ? ['private', 'business', 'contractor'].includes(customerType)
      ? customerType
      : 'private'
    : 'private';

  try {
    const user = await authorizeUser(numericUserId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    const passwordHash = await hashPassword(String(password));
    db.run(
      `INSERT INTO users (full_name, email, password_hash, password_plain, role, customer_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(fullName).trim(),
        String(email).trim().toLowerCase(),
        passwordHash,
        String(password),
        normalizedRole,
        normalizedCustomerType,
      ],
      function onInsert(err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Email already exists' });
          }
          return res.status(500).json({ message: 'Failed to create user' });
        }

        return res.status(201).json({
          message: 'User created successfully',
          user: {
            id: this.lastID,
            fullName: String(fullName).trim(),
            email: String(email).trim().toLowerCase(),
            role: normalizedRole,
            customerType: normalizedCustomerType,
          },
        });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/admin/users/:id', async (req, res) => {
  const targetId = Number(req.params.id);
  const { userId, fullName, email, role, password, customerType } = req.body || {};
  const numericUserId = Number(userId);

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return res.status(400).json({ message: 'Valid user id is required' });
  }
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(numericUserId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    const fields = [];
    const values = [];

    if (fullName) {
      fields.push('full_name = ?');
      values.push(String(fullName).trim());
    }
    if (email) {
      fields.push('email = ?');
      values.push(String(email).trim().toLowerCase());
    }
    if (role && ['customer', 'employee', 'manager'].includes(role)) {
      fields.push('role = ?');
      values.push(role);
    }

    if (role === 'customer') {
      fields.push('customer_type = ?');
      values.push(['private', 'business', 'contractor'].includes(customerType) ? customerType : 'private');
    } else if (role && role !== 'customer') {
      fields.push('customer_type = ?');
      values.push('private');
    }

    if (password) {
      const passwordHash = await hashPassword(String(password));
      fields.push('password_hash = ?');
      values.push(passwordHash);
      fields.push('password_plain = ?');
      values.push(String(password));
    }

    if (!fields.length) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    values.push(targetId);
    db.run(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values,
      function onUpdate(err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Email already exists' });
          }
          return res.status(500).json({ message: 'Failed to update user' });
        }
        if (this.changes === 0) return res.status(404).json({ message: 'User not found' });
        return res.json({ message: 'User updated successfully' });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/inventory', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.all(
      `SELECT product_id AS productId,
              product_name AS productName,
              category,
              stock,
              min_stock,
              location,
              product_price AS price,
              product_image_url AS imageUrl,
              updated_at AS updatedAt
       FROM inventory_items
       ORDER BY category, product_name`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch inventory' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/inventory/movements', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.all(
      `SELECT product_id AS productId, user_id AS userId, delta, reason, created_at AS createdAt
       FROM inventory_movements
       ORDER BY id DESC
       LIMIT 25`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch inventory movements' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/inventory/upsert', async (req, res) => {
  const { userId, productId, productName, category, stock, minStock, location, supplierId, price, imageUrl } = req.body || {};
  const numericUserId = Number(userId);
  const numericStock = Number(stock);
  const numericMinStock = Number(minStock);
  const numericSupplierId = supplierId === undefined || supplierId === null || supplierId === ''
    ? null
    : Number(supplierId);
  const hasPrice = price !== undefined && price !== null && String(price).trim() !== '';
  const numericPrice = hasPrice ? Number(price) : null;
  const normalizedImageUrl = String(imageUrl || '').trim();

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!productId || !productName || !category) {
    return res.status(400).json({ message: 'productId, productName and category are required' });
  }
  if (!Number.isInteger(numericStock) || numericStock < 0) {
    return res.status(400).json({ message: 'Stock must be a non-negative integer' });
  }
  if (!Number.isInteger(numericMinStock) || numericMinStock < 0) {
    return res.status(400).json({ message: 'minStock must be a non-negative integer' });
  }
  if (numericSupplierId !== null && (!Number.isInteger(numericSupplierId) || numericSupplierId <= 0)) {
    return res.status(400).json({ message: 'supplierId must be a valid integer' });
  }
  if (hasPrice && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
    return res.status(400).json({ message: 'Price must be a positive number' });
  }
  if (normalizedImageUrl && !/^(data:image\/|https?:\/\/|\.{1,2}\/|\/)/i.test(normalizedImageUrl)) {
    return res.status(400).json({ message: 'Image URL must be a valid link or data URL' });
  }

  try {
    const user = await authorizeUser(numericUserId, ['employee', 'manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    const productIdValue = String(productId).trim();
    const baseValues = [
      productIdValue,
      String(productName).trim(),
      String(category).trim(),
      numericStock,
      numericMinStock,
      String(location || 'מחסן ראשי').trim(),
    ];
    const hasPriceColumn = hasPrice;
    const hasImageColumn = Boolean(normalizedImageUrl);
    const hasSupplier = numericSupplierId !== null;
    const insertColumns = ['product_id', 'product_name', 'category', 'stock', 'min_stock', 'location'];
    const insertPlaceholders = ['?', '?', '?', '?', '?', '?'];
    insertColumns.push('product_price');
    insertPlaceholders.push('?');
    baseValues.push(hasPriceColumn ? numericPrice : null);
    insertColumns.push('product_image_url');
    insertPlaceholders.push('?');
    baseValues.push(hasImageColumn ? normalizedImageUrl : null);
    if (hasSupplier) {
      insertColumns.push('supplier_id');
      insertPlaceholders.push('?');
      baseValues.push(numericSupplierId);
    }

    const updateColumns = [
      'product_name = excluded.product_name',
      'category = excluded.category',
      'stock = excluded.stock',
      'min_stock = excluded.min_stock',
      'location = excluded.location',
      'product_price = COALESCE(excluded.product_price, inventory_items.product_price)',
      'product_image_url = COALESCE(excluded.product_image_url, inventory_items.product_image_url)',
      'updated_at = CURRENT_TIMESTAMP',
    ];
    if (hasSupplier) {
      updateColumns.splice(updateColumns.length - 1, 0, 'supplier_id = excluded.supplier_id');
    }

    db.run(
      `INSERT INTO inventory_items (${insertColumns.join(', ')}, updated_at)
       VALUES (${insertPlaceholders.join(', ')}, CURRENT_TIMESTAMP)
       ON CONFLICT(product_id) DO UPDATE SET
         ${updateColumns.join(', ')}`,
      baseValues,
      function onUpsert(err) {
        if (err) return res.status(500).json({ message: 'Failed to save inventory item' });

        db.run(
          `INSERT INTO inventory_movements (product_id, user_id, delta, reason)
           VALUES (?, ?, ?, ?)`,
          [String(productId).trim(), numericUserId, 0, 'עדכון פרטי מוצר'],
          () => {}
        );

        return res.status(201).json({
          message: 'Inventory item saved successfully',
          item: {
            productId: String(productId).trim(),
            productName: String(productName).trim(),
            category: String(category).trim(),
            stock: numericStock,
            minStock: numericMinStock,
            location: String(location || 'מחסן ראשי').trim(),
            supplierId: numericSupplierId,
          },
        });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/inventory/create-product', async (req, res) => {
  const {
    userId,
    productId,
    productName,
    category,
    stock,
    minStock,
    location,
    supplierId,
    price,
    imageUrl,
  } = req.body || {};

  const numericUserId = Number(userId);
  const numericStock = Number(stock);
  const numericMinStock = Number(minStock);
  const numericSupplierId = supplierId === undefined || supplierId === null || supplierId === ''
    ? null
    : Number(supplierId);
  const numericPrice = Number(price);
  const normalizedImageUrl = String(imageUrl || '').trim();

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!productId || !productName || !category) {
    return res.status(400).json({ message: 'productId, productName and category are required' });
  }
  if (!Number.isInteger(numericStock) || numericStock < 0) {
    return res.status(400).json({ message: 'Stock must be a non-negative integer' });
  }
  if (!Number.isInteger(numericMinStock) || numericMinStock < 0) {
    return res.status(400).json({ message: 'minStock must be a non-negative integer' });
  }
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: 'Price must be a positive number' });
  }
  if (!Number.isInteger(numericSupplierId) || numericSupplierId <= 0) {
    return res.status(400).json({ message: 'supplierId is required' });
  }
  if (!normalizedImageUrl) {
    return res.status(400).json({ message: 'An image URL or uploaded image is required' });
  }
  if (!/^(data:image\/|https?:\/\/|\.{1,2}\/|\/)/i.test(normalizedImageUrl)) {
    return res.status(400).json({ message: 'Image URL must be a valid link or data URL' });
  }

  try {
    const user = await authorizeUser(numericUserId, ['employee', 'manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.run(
      `INSERT INTO inventory_items (
         product_id,
         product_name,
         category,
         stock,
         min_stock,
         location,
         supplier_id,
         product_price,
         product_image_url,
         updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        String(productId).trim(),
        String(productName).trim(),
        String(category).trim(),
        numericStock,
        numericMinStock,
        String(location || 'מחסן ראשי').trim(),
        numericSupplierId,
        numericPrice,
        normalizedImageUrl,
      ],
      function onInsert(err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Product with this ID already exists' });
          }
          return res.status(500).json({ message: 'Failed to create product' });
        }

        db.run(
          `INSERT INTO inventory_movements (product_id, user_id, delta, reason)
           VALUES (?, ?, ?, ?)`,
          [String(productId).trim(), numericUserId, 0, 'הוספת מוצר חדש עם תמונה'],
          () => {}
        );

        return res.status(201).json({
          message: 'Product created successfully',
          item: {
            productId: String(productId).trim(),
            productName: String(productName).trim(),
            category: String(category).trim(),
            stock: numericStock,
            minStock: numericMinStock,
            location: String(location || 'מחסן ראשי').trim(),
            supplierId: numericSupplierId,
            price: numericPrice,
            imageUrl: normalizedImageUrl,
          },
        });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/inventory/adjust', async (req, res) => {
  const { userId, productId, delta, reason } = req.body || {};
  const numericUserId = Number(userId);
  const numericDelta = Number(delta);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!productId || !Number.isInteger(numericDelta) || numericDelta === 0) {
    return res.status(400).json({ message: 'productId and non-zero delta are required' });
  }

  try {
    const user = await getUserById(numericUserId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.get(
      `SELECT stock FROM inventory_items WHERE product_id = ?`,
      [String(productId)],
      (fetchErr, row) => {
        if (fetchErr) return res.status(500).json({ message: 'Failed to load inventory item' });
        if (!row) return res.status(404).json({ message: 'Inventory item not found' });

        const nextStock = row.stock + numericDelta;
        if (nextStock < 0) {
          return res.status(409).json({ message: 'Stock cannot go below zero' });
        }

        db.run(
          `UPDATE inventory_items
           SET stock = ?, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [nextStock, String(productId)],
          function onUpdate(updateErr) {
            if (updateErr) return res.status(500).json({ message: 'Failed to update inventory' });
            db.run(
              `INSERT INTO inventory_movements (product_id, user_id, delta, reason)
               VALUES (?, ?, ?, ?)`,
              [String(productId), numericUserId, numericDelta, String(reason || 'התאמת מלאי')],
              () => {}
            );

            return res.json({
              message: 'Inventory updated successfully',
              item: { productId: String(productId), stock: nextStock },
            });
          }
        );
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

function buildLowStockQuantity(item) {
  return Math.max(1, (item.minStock || 0) * 2 - (item.stock || 0));
}

function buildPurchaseDraft(supplier, items) {
  const subject = `הזמנת רכש - ${supplier.supplierName}`;
  const lines = [
    `שלום ${supplier.supplierName},`,
    '',
    'מצורפת בקשת הזמנה עבור מוצרים במלאי נמוך:',
    ...items.map((item) => `- ${item.productName}: כמות מוצעת ${item.suggestedQuantity} (מלאי נוכחי ${item.stock}, מינימום ${item.minStock})`),
    '',
    'נשמח לאישור והמשך טיפול.',
    '',
    'בברכה,',
    'צוות נבלט בע"מ',
  ];

  const body = lines.join('\n');
  const mailtoHref = `mailto:${encodeURIComponent(supplier.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoHref };
}

app.get('/api/admin/suppliers', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.all(
      `SELECT s.id AS supplierId,
              s.supplier_name AS supplierName,
              s.email,
              s.phone,
              s.notes,
              i.product_id AS productId,
              i.product_name AS productName,
              i.category,
              i.stock,
              i.min_stock AS minStock,
              i.location
       FROM suppliers s
       LEFT JOIN inventory_items i ON i.supplier_id = s.id
       ORDER BY s.supplier_name ASC, i.product_name ASC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch suppliers' });

        const grouped = new Map();
        for (const row of rows) {
          if (!grouped.has(row.supplierId)) {
            grouped.set(row.supplierId, {
              supplierId: row.supplierId,
              supplierName: row.supplierName,
              email: row.email,
              phone: row.phone || '',
              notes: row.notes || '',
              products: [],
              lowStockProducts: [],
              totalProducts: 0,
              lowStockCount: 0,
            });
          }

          const group = grouped.get(row.supplierId);
          if (row.productId) {
            const item = {
              productId: row.productId,
              productName: row.productName,
              category: row.category,
              stock: row.stock,
              minStock: row.minStock,
              location: row.location,
              suggestedQuantity: buildLowStockQuantity(row),
            };
            group.products.push(item);
            group.totalProducts += 1;
            if (row.stock <= row.minStock) {
              group.lowStockProducts.push(item);
              group.lowStockCount += 1;
            }
          }
        }

        const suppliers = [...grouped.values()].map((supplier) => {
          const draft = buildPurchaseDraft(supplier, supplier.lowStockProducts);
          return {
            ...supplier,
            draftSubject: draft.subject,
            draftBody: draft.body,
            mailtoHref: draft.mailtoHref,
          };
        });

        return res.json(suppliers);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/admin/suppliers', async (req, res) => {
  const { userId, supplierId, supplierName, email, phone, notes } = req.body || {};
  const numericUserId = Number(userId);
  const numericSupplierId = supplierId === undefined || supplierId === null || supplierId === ''
    ? null
    : Number(supplierId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!supplierName || !email) {
    return res.status(400).json({ message: 'supplierName and email are required' });
  }
  if (numericSupplierId !== null && (!Number.isInteger(numericSupplierId) || numericSupplierId <= 0)) {
    return res.status(400).json({ message: 'supplierId must be a valid integer' });
  }

  try {
    const user = await authorizeUser(numericUserId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    const normalizedName = String(supplierName).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim();
    const normalizedNotes = String(notes || '').trim();

    if (numericSupplierId) {
      db.run(
        `UPDATE suppliers
         SET supplier_name = ?, email = ?, phone = ?, notes = ?
         WHERE id = ?`,
        [normalizedName, normalizedEmail, normalizedPhone, normalizedNotes, numericSupplierId],
        function onUpdate(err) {
          if (err) {
            if (err.message && err.message.includes('UNIQUE constraint failed')) {
              return res.status(409).json({ message: 'Supplier name already exists' });
            }
            return res.status(500).json({ message: 'Failed to save supplier' });
          }
          if (this.changes === 0) return res.status(404).json({ message: 'Supplier not found' });
          return res.json({
            message: 'Supplier updated successfully',
            supplier: {
              id: numericSupplierId,
              supplierName: normalizedName,
              email: normalizedEmail,
              phone: normalizedPhone,
              notes: normalizedNotes,
            },
          });
        }
      );
      return;
    }

    db.run(
      `INSERT INTO suppliers (supplier_name, email, phone, notes)
       VALUES (?, ?, ?, ?)`,
      [normalizedName, normalizedEmail, normalizedPhone, normalizedNotes],
      function onInsert(err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Supplier name already exists' });
          }
          return res.status(500).json({ message: 'Failed to save supplier' });
        }
        return res.status(201).json({
          message: 'Supplier saved successfully',
          supplier: {
            id: this.lastID,
            supplierName: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            notes: normalizedNotes,
          },
        });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/admin/purchase-orders', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.all(
      `SELECT po.id,
              po.subject,
              po.body,
              po.status,
              po.created_at AS createdAt,
              s.id AS supplierId,
              s.supplier_name AS supplierName,
              s.email,
              s.phone,
              u.full_name AS createdBy
       FROM purchase_orders po
       INNER JOIN suppliers s ON s.id = po.supplier_id
       INNER JOIN users u ON u.id = po.created_by_user_id
       ORDER BY po.id DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch purchase orders' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/admin/purchase-orders', async (req, res) => {
  const { userId, supplierId, status, subject, body, items } = req.body || {};
  const numericUserId = Number(userId);
  const numericSupplierId = Number(supplierId);
  const normalizedStatus = normalizePurchaseOrderStatus(status);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!Number.isInteger(numericSupplierId) || numericSupplierId <= 0) {
    return res.status(400).json({ message: 'Valid supplierId is required' });
  }

  try {
    const user = await authorizeUser(numericUserId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.get(
      `SELECT id, supplier_name AS supplierName, email, phone, notes
       FROM suppliers
       WHERE id = ?`,
      [numericSupplierId],
      (supplierErr, supplier) => {
        if (supplierErr) return res.status(500).json({ message: 'Failed to load supplier' });
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

        const finalizeInsert = (orderSubject, orderBody, orderItems) => {
          db.run(
            `INSERT INTO purchase_orders (supplier_id, created_by_user_id, subject, body, status)
             VALUES (?, ?, ?, ?, ?)`,
            [numericSupplierId, numericUserId, orderSubject, orderBody, normalizedStatus],
            function onInsert(orderErr) {
              if (orderErr) return res.status(500).json({ message: 'Failed to create purchase order' });

              const purchaseOrderId = this.lastID;
              const stmt = db.prepare(
                `INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, quantity, stock, min_stock)
                 VALUES (?, ?, ?, ?, ?, ?)`
              );
              orderItems.forEach((item) => {
                stmt.run(
                  purchaseOrderId,
                  item.productId,
                  item.productName,
                  item.quantity,
                  item.stock,
                  item.minStock
                );
              });
              stmt.finalize((finalizeErr) => {
                if (finalizeErr) return res.status(500).json({ message: 'Failed to save order items' });
                return res.status(201).json({
                  message: 'Purchase order created successfully',
                  order: {
                    id: purchaseOrderId,
                    supplierId: numericSupplierId,
                    supplierName: supplier.supplierName,
                    subject: orderSubject,
                    body: orderBody,
                    status: normalizedStatus,
                  },
                });
              });
            }
          );
        };

        if (Array.isArray(items) && items.length) {
          const normalizedItems = items
            .map((item) => ({
              productId: String(item.productId || '').trim(),
              productName: String(item.productName || '').trim(),
              quantity: Number(item.quantity || 0),
              stock: Number(item.stock || 0),
              minStock: Number(item.minStock || 0),
            }))
            .filter((item) => item.productId && item.productName && Number.isInteger(item.quantity) && item.quantity > 0);

          if (!normalizedItems.length) {
            return res.status(400).json({ message: 'No valid items were provided' });
          }

          const orderSubject = String(subject || `הזמנת רכש - ${supplier.supplierName}`).trim();
          const orderBody = String(body || '').trim() || buildPurchaseDraft(
            { supplierName: supplier.supplierName, email: supplier.email },
            normalizedItems.map((item) => ({ ...item, suggestedQuantity: item.quantity }))
          ).body;
          return finalizeInsert(orderSubject, orderBody, normalizedItems);
        }

        db.all(
          `SELECT i.product_id AS productId,
                  i.product_name AS productName,
                  i.stock,
                  i.min_stock AS minStock,
                  i.category
           FROM inventory_items i
           WHERE i.supplier_id = ? AND i.stock <= i.min_stock
           ORDER BY i.stock ASC, i.product_name ASC`,
          [numericSupplierId],
          (itemsErr, lowStockItems) => {
            if (itemsErr) return res.status(500).json({ message: 'Failed to load low stock items' });
            if (!lowStockItems.length) {
              return res.status(400).json({ message: 'No low stock items found for this supplier' });
            }

            const orderItems = lowStockItems.map((item) => ({
              ...item,
              quantity: buildLowStockQuantity(item),
            }));
            const draft = buildPurchaseDraft(
              { supplierName: supplier.supplierName, email: supplier.email },
              orderItems
            );
            finalizeInsert(subject ? String(subject).trim() : draft.subject, body ? String(body).trim() : draft.body, orderItems);
          }
        );
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/staff/purchase-orders', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.all(
      `SELECT po.id,
              po.subject,
              po.body,
              po.status,
              po.created_at AS createdAt,
              po.updated_at AS updatedAt,
              s.id AS supplierId,
              s.supplier_name AS supplierName,
              s.supplier_code AS supplierCode,
              s.product_category AS productCategory,
              s.email,
              s.phone,
              u.full_name AS createdBy,
              (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) AS itemCount
       FROM purchase_orders po
       INNER JOIN suppliers s ON s.id = po.supplier_id
       INNER JOIN users u ON u.id = po.created_by_user_id
       ORDER BY po.id DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch staff purchase orders' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/staff/purchase-orders/:id/status', async (req, res) => {
  const userId = Number(req.body?.userId);
  const purchaseOrderId = Number(req.params.id);
  const status = normalizePurchaseOrderStatus(req.body?.status);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!Number.isInteger(purchaseOrderId) || purchaseOrderId <= 0) {
    return res.status(400).json({ message: 'Valid purchase order id is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.run(
      `UPDATE purchase_orders
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, purchaseOrderId],
      function onUpdate(err) {
        if (err) return res.status(500).json({ message: 'Failed to update purchase order status' });
        if (this.changes === 0) return res.status(404).json({ message: 'Purchase order not found' });
        return res.json({
          message: 'Purchase order status updated successfully',
          status,
        });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/admin/reports/work-hours', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.all(
      `SELECT wh.id,
              wh.user_id AS userId,
              u.full_name AS fullName,
              u.email,
              wh.check_in AS checkIn,
              wh.check_out AS checkOut,
              wh.notes,
              wh.created_at AS createdAt,
              wh.updated_at AS updatedAt
       FROM work_hours wh
       LEFT JOIN users u ON u.id = wh.user_id
       ORDER BY wh.check_in DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch work hours' });
        return res.json(rows.map(mapWorkHoursRow));
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/admin/reports/customers', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.all(
      `SELECT id,
              full_name AS fullName,
              email,
              role,
              customer_type AS customerType,
              created_at AS createdAt
       FROM users
       WHERE role = 'customer'
       ORDER BY id DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch customer report' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/admin/reports/products', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.all(
      `SELECT i.product_id AS productId,
              i.product_name AS productName,
              i.category,
              i.stock,
              i.min_stock AS minStock,
              i.location,
              i.product_price AS price,
              i.product_image_url AS imageUrl,
              s.supplier_name AS supplierName,
              s.email AS supplierEmail,
              i.updated_at AS updatedAt
       FROM inventory_items i
       LEFT JOIN suppliers s ON s.id = i.supplier_id
       ORDER BY i.category, i.product_name`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch product report' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/admin/reports/purchase-orders', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await authorizeUser(userId, ['manager']);
    if (!user) return res.status(403).json({ message: 'Not authorized' });

    db.all(
      `SELECT po.id,
              po.subject,
              po.body,
              po.status,
              po.created_at AS createdAt,
              s.supplier_name AS supplierName,
              s.email AS supplierEmail,
              u.full_name AS createdBy
       FROM purchase_orders po
       INNER JOIN suppliers s ON s.id = po.supplier_id
       INNER JOIN users u ON u.id = po.created_by_user_id
       ORDER BY po.id DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch purchase order report' });
        return res.json(rows);
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.get('/api/work-hours', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await getUserById(userId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const isManager = user.role === 'manager' && String(req.query.scope || '') === 'all';
    const params = isManager ? [] : [userId];
    const whereClause = isManager ? '' : 'WHERE wh.user_id = ?';

    db.all(
      `SELECT wh.id,
              wh.user_id AS userId,
              u.full_name AS fullName,
              u.email,
              wh.check_in AS checkIn,
              wh.check_out AS checkOut,
              wh.notes,
              wh.created_at AS createdAt,
              wh.updated_at AS updatedAt
       FROM work_hours wh
       LEFT JOIN users u ON u.id = wh.user_id
       ${whereClause}
       ORDER BY wh.check_in DESC`,
      params,
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch work hours' });
        return res.json(rows.map(mapWorkHoursRow));
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/work-hours/start', async (req, res) => {
  const { userId, checkIn, notes } = req.body || {};
  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }

  try {
    const user = await getUserById(numericUserId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.get(
      `SELECT id FROM work_hours WHERE user_id = ? AND check_out IS NULL ORDER BY id DESC LIMIT 1`,
      [numericUserId],
      (findErr, existing) => {
        if (findErr) return res.status(500).json({ message: 'Failed to open shift' });
        if (existing) return res.status(409).json({ message: 'Shift already active' });

        db.run(
          `INSERT INTO work_hours (user_id, check_in, notes, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [numericUserId, String(checkIn || new Date().toISOString()), String(notes || '').trim()],
          function onInsert(err) {
            if (err) return res.status(500).json({ message: 'Failed to start shift' });
            return res.status(201).json({
              message: 'Shift started successfully',
              shift: {
                id: this.lastID,
                userId: numericUserId,
                checkIn: String(checkIn || new Date().toISOString()),
                checkOut: null,
                notes: String(notes || '').trim(),
              },
            });
          }
        );
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/work-hours/finish', async (req, res) => {
  const { userId, shiftId, checkOut, notes } = req.body || {};
  const numericUserId = Number(userId);
  const numericShiftId = Number(shiftId);
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!Number.isInteger(numericShiftId) || numericShiftId <= 0) {
    return res.status(400).json({ message: 'Valid shiftId is required' });
  }

  try {
    const user = await getUserById(numericUserId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.run(
      `UPDATE work_hours
       SET check_out = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND check_out IS NULL`,
      [String(checkOut || new Date().toISOString()), String(notes || '').trim(), numericShiftId, numericUserId],
      function onUpdate(err) {
        if (err) return res.status(500).json({ message: 'Failed to finish shift' });
        if (this.changes === 0) return res.status(404).json({ message: 'Shift not found' });
        return res.json({ message: 'Shift finished successfully' });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

app.post('/api/work-hours/note', async (req, res) => {
  const { userId, shiftId, notes } = req.body || {};
  const numericUserId = Number(userId);
  const numericShiftId = Number(shiftId);
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'Valid userId is required' });
  }
  if (!Number.isInteger(numericShiftId) || numericShiftId <= 0) {
    return res.status(400).json({ message: 'Valid shiftId is required' });
  }

  try {
    const user = await getUserById(numericUserId);
    if (!user || !['employee', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.run(
      `UPDATE work_hours
       SET notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [String(notes || '').trim(), numericShiftId, numericUserId],
      function onUpdate(err) {
        if (err) return res.status(500).json({ message: 'Failed to save shift note' });
        if (this.changes === 0) return res.status(404).json({ message: 'Shift not found' });
        return res.json({ message: 'Shift note saved successfully' });
      }
    );
  } catch (_err) {
    return res.status(500).json({ message: 'Failed to verify access' });
  }
});

async function bootstrap() {
  try {
    await seedDemoAccounts();
  } catch (_err) {
    // Seeding failure should not block the application startup.
  }

  app.listen(PORT, () => {
    console.log(`Auth server running at http://localhost:${PORT}`);
  });
}

bootstrap();
