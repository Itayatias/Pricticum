const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'database.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Could not connect to SQLite database:', err);
    process.exit(1);
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.get('SELECT COUNT(*) AS count FROM messages', (err, row) => {
    if (!err && row.count === 0) {
      db.run('INSERT INTO messages (text) VALUES (?)', [
        'This site is now using SQLite!'
      ]);
    }
  });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js, Express and SQLite!' });
});

app.get('/api/messages', (req, res) => {
  db.all('SELECT id, text, created_at FROM messages ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ messages: rows });
  });
});

app.post('/api/messages', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  db.run('INSERT INTO messages (text) VALUES (?)', [text.trim()], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database insert error' });
    }
    res.status(201).json({ id: this.lastID, text: text.trim() });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
