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

function getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, full_name AS fullName, email, role, password_plain AS passwordPlain FROM users WHERE id = ?',
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

async function seedStaffAccounts() {
  const staffAccounts = [
    { fullName: 'מנהל חנות', email: 'manager@nevelat.co.il', password: 'Manager123!', role: 'manager' },
    { fullName: 'עובד חנות', email: 'employee@nevelat.co.il', password: 'Employee123!', role: 'employee' },
  ];

  for (const account of staffAccounts) {
    // Avoid reseeding if the account already exists.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      db.get('SELECT id FROM users WHERE email = ?', [account.email], async (err, row) => {
        if (err || row) return resolve();
        const passwordHash = await hashPassword(account.password);
        db.run(
          'INSERT INTO users (full_name, email, password_hash, password_plain, role) VALUES (?, ?, ?, ?, ?)',
          [account.fullName, account.email, passwordHash, account.password, account.role],
          () => resolve()
        );
      });
    });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'auth-api' });
});

app.get('/api/users', (_req, res) => {
  db.all(
    `SELECT id, full_name AS fullName, email, role, password_plain AS password, created_at AS createdAt
     FROM users
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch users' });
      res.json(rows);
    }
  );
});

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
          user: { id: row.id, fullName: row.fullName, email: row.email, role: row.role || 'customer' },
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

          db.run(
            'INSERT INTO orders (user_id, total_amount) VALUES (?, ?)',
            [numericUserId, total],
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
                            order: { id: orderId, userId: numericUserId, totalAmount: total, items },
                          });
                        });
                      }
                    }
                  );
                });
              });
            });
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
    `SELECT id, total_amount AS totalAmount, created_at AS createdAt
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
          }));

          return res.json(payload);
        }
      );
    }
  );
});

app.get('/api/inventory/public', (_req, res) => {
  db.all(
    `SELECT product_id AS productId, product_name AS productName, category, stock, min_stock, location, updated_at AS updatedAt
     FROM inventory_items
     ORDER BY category, product_name`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch inventory' });
      return res.json(rows);
    }
  );
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
      `SELECT product_id AS productId, product_name AS productName, category, stock, min_stock, location, updated_at AS updatedAt
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

async function bootstrap() {
  try {
    await seedStaffAccounts();
  } catch (_err) {
    // Seeding failure should not block the application startup.
  }

  app.listen(PORT, () => {
    console.log(`Auth server running at http://localhost:${PORT}`);
  });
}

bootstrap();
