const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./menu.db');

// Initialize database tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_order INTEGER
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER,
        is_available BOOLEAN DEFAULT 1,
        is_veg BOOLEAN DEFAULT 1,
        badge TEXT,
        image_url TEXT,
        display_order INTEGER,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    
    // Insert default admin if not exists
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, ['admin', defaultPassword]);
    
    // Insert sample categories
    const categories = ['Appetizers', 'Main Course - Indian', 'Main Course - Continental', 'Breads & Rice', 'Desserts', 'Beverages'];
    categories.forEach((cat, index) => {
        db.run(`INSERT OR IGNORE INTO categories (name, display_order) VALUES (?, ?)`, [cat, index]);
    });
});

// ============ API ROUTES ============

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, username: user.username });
    });
});

// Get all menu items (public)
app.get('/api/menu', (req, res) => {
    db.all(`
        SELECT m.*, c.name as category_name 
        FROM menu_items m
        JOIN categories c ON m.category_id = c.id
        WHERE m.is_available = 1
        ORDER BY c.display_order, m.display_order
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// Get all menu items (admin)
app.get('/api/admin/menu', verifyToken, (req, res) => {
    db.all(`
        SELECT m.*, c.name as category_name 
        FROM menu_items m
        JOIN categories c ON m.category_id = c.id
        ORDER BY c.display_order, m.display_order
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Toggle item availability (admin)
app.post('/api/admin/menu/toggle', verifyToken, (req, res) => {
    const { id, is_available } = req.body;
    db.run('UPDATE menu_items SET is_available = ? WHERE id = ?', [is_available, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id, is_available });
    });
});

// Update price (admin)
app.post('/api/admin/menu/price', verifyToken, (req, res) => {
    const { id, price } = req.body;
    db.run('UPDATE menu_items SET price = ? WHERE id = ?', [price, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id, price });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
