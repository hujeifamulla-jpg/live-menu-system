const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Create database and tables
const db = new sqlite3.Database('./menu.db');

db.serialize(() => {
    console.log('Creating database tables...');
    
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
        display_order INTEGER
    )`);
    
    // Insert sample categories
    const categories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages'];
    categories.forEach((name, index) => {
        db.run(`INSERT OR IGNORE INTO categories (name, display_order) VALUES (?, ?)`, [name, index]);
    });
    
    // Get category IDs
    db.all(`SELECT * FROM categories`, (err, cats) => {
        if (err) {
            console.error('Error getting categories:', err);
            return;
        }
        
        const catMap = {};
        cats.forEach(c => catMap[c.name] = c.id);
        
        // Insert sample items
        const items = [
            ['Tandoori Broccoli', 'Charred broccoli with tahini yogurt', 595, 1, 1, 'CHEF SPECIAL', catMap['Appetizers']],
            ['Truffle Arancini', 'Crispy risotto balls', 795, 1, 1, 'SIGNATURE', catMap['Appetizers']],
            ['Butter Chicken', 'Creamy tomato gravy', 995, 1, 0, 'SIGNATURE', catMap['Main Course']],
            ['Dal Makhani', 'Slow-cooked lentils', 795, 1, 1, 'HOUSE SPECIAL', catMap['Main Course']],
            ['Gulab Jamun', 'With rabri', 495, 1, 1, '', catMap['Desserts']],
            ['Fresh Lime Soda', 'Sweet/salted', 195, 1, 1, '', catMap['Beverages']]
        ];
        
        items.forEach(item => {
            db.run(
                `INSERT INTO menu_items (name, description, price, is_available, is_veg, badge, category_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [item[0], item[1], item[2], item[3], item[4], item[5], item[6]]
            );
        });
        
        console.log('Sample items inserted successfully');
    });
});

// API endpoint to get menu
app.get('/api/menu', (req, res) => {
    db.all(`
        SELECT m.*, c.name as category_name 
        FROM menu_items m
        JOIN categories c ON m.category_id = c.id
        WHERE m.is_available = 1
        ORDER BY c.display_order, m.display_order
    `, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Sending ${rows.length} menu items`);
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📱 Menu API: http://localhost:${PORT}/api/menu`);
});
