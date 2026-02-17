const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Sample menu data (in-memory for Vercel)
const menuData = {
  categories: [
    { id: 1, name: "Appetizers", display_order: 1 },
    { id: 2, name: "Main Course", display_order: 2 },
    { id: 3, name: "Desserts", display_order: 3 },
    { id: 4, name: "Beverages", display_order: 4 }
  ],
  items: [
    { id: 1, category_id: 1, name: "Tandoori Broccoli", description: "Charred broccoli with tahini yogurt", price: 595, is_available: 1, is_veg: 1, badge: "CHEF SPECIAL" },
    { id: 2, category_id: 1, name: "Truffle Arancini", description: "Crispy risotto balls with black truffle", price: 795, is_available: 1, is_veg: 1, badge: "SIGNATURE" },
    { id: 3, category_id: 1, name: "Galouti Kebab", description: "Melt-in-mouth lamb kebabs", price: 895, is_available: 1, is_veg: 0, badge: "HOUSE SPECIAL" },
    { id: 4, category_id: 2, name: "Butter Chicken", description: "Traditional tomato-cream gravy", price: 995, is_available: 1, is_veg: 0, badge: "SIGNATURE" },
    { id: 5, category_id: 2, name: "Dal Makhani", description: "Slow-cooked black lentils", price: 795, is_available: 1, is_veg: 1, badge: "HOUSE SPECIAL" },
    { id: 6, category_id: 2, name: "Lamb Rack", description: "Herb-crusted with rosemary jus", price: 2495, is_available: 1, is_veg: 0, badge: "PREMIUM" },
    { id: 7, category_id: 3, name: "Chocolate Soufflé", description: "With vanilla ice cream", price: 695, is_available: 1, is_veg: 1, badge: "SIGNATURE" },
    { id: 8, category_id: 3, name: "Gulab Jamun", description: "With rabri and saffron", price: 495, is_available: 1, is_veg: 1, badge: "" },
    { id: 9, category_id: 4, name: "Fresh Lime Soda", description: "Sweet/salted with mint", price: 195, is_available: 1, is_veg: 1, badge: "" },
    { id: 10, category_id: 4, name: "Cold Coffee", description: "With vanilla ice cream", price: 295, is_available: 1, is_veg: 1, badge: "" }
  ]
};

app.use(express.json());
app.use(express.static('public'));

// API endpoint to get menu
app.get('/api/menu', (req, res) => {
  const itemsWithCategories = menuData.items
    .filter(item => item.is_available === 1)
    .map(item => {
      const category = menuData.categories.find(c => c.id === item.category_id);
      return {
        ...item,
        category_name: category ? category.name : 'Other'
      };
    });
  res.json(itemsWithCategories);
});

// Simple admin login (for demo)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ token: 'demo-token', username: 'admin' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Toggle availability (admin)
app.post('/api/admin/menu/toggle', (req, res) => {
  const { id, is_available } = req.body;
  const item = menuData.items.find(i => i.id === id);
  if (item) {
    item.is_available = is_available;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Update price (admin)
app.post('/api/admin/menu/price', (req, res) => {
  const { id, price } = req.body;
  const item = menuData.items.find(i => i.id === id);
  if (item) {
    item.price = price;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;
