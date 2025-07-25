// Add global error handlers at the top
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'restaurant_pos_system',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Utility
const runQuery = async (query, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    connection.release();
  }
};

// ================= LOGIN =================
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const result = await runQuery(
      'SELECT * FROM users WHERE username = ? AND password = ? AND role = ?',
      [username, password, role]
    );
    if (result.length > 0) {
      res.json({ success: true, user: result[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= MENU =================

// Get all menu items
app.get('/api/menu', async (_, res) => {
  try {
    const items = await runQuery('SELECT * FROM menu_items');
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add menu item
app.post('/api/menu', async (req, res) => {
  const { name, category, price, is_available, image_url } = req.body;
  try {
    console.log('POST /api/menu', { name, category, price, is_available, image_url });
    await runQuery(
      'INSERT INTO menu_items (name, category, price, is_available, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, category, price, is_available, image_url]
    );
    res.json({ message: 'Menu item added' });
  } catch (err) {
    console.error('POST ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update menu item
app.patch('/api/menu/:id', async (req, res) => {
  const itemId = req.params.id;
  const { name, category, price, is_available, image_url } = req.body;
  try {
    console.log('PATCH /api/menu/:id', { itemId, name, category, price, is_available, image_url });
    await runQuery(
      'UPDATE menu_items SET name = ?, category = ?, price = ?, is_available = ?, image_url = ? WHERE item_id = ?',
      [name, category, price, is_available, image_url, itemId]
    );
    res.json({ message: 'Menu item updated' });
  } catch (err) {
    console.error('PATCH ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle availability (if PATCH sends only is_available)
app.patch('/api/menu/:id/toggle', async (req, res) => {
  const itemId = req.params.id;
  const { is_available } = req.body;
  try {
    console.log('TOGGLE PATCH /api/menu/:id/toggle', { itemId, is_available });
    await runQuery(
      'UPDATE menu_items SET is_available = ? WHERE item_id = ?',
      [is_available, itemId]
    );
    res.json({ message: 'Availability updated' });
  } catch (err) {
    console.error('TOGGLE PATCH ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete menu item
app.delete('/api/menu/:id', async (req, res) => {
  const itemId = req.params.id;
  try {
    console.log('DELETE /api/menu/:id', { itemId });
    await runQuery('DELETE FROM menu_items WHERE item_id = ?', [itemId]);
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    console.error('DELETE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================= CUSTOMERS =================
// Get all customers
app.get('/api/customers', async (_, res) => {
  try {
    const customers = await runQuery('SELECT * FROM customers');
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get customer details by ID (orders by customer_id)
app.get('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;
  try {
    // Get customer basic info
    const result = await runQuery('SELECT * FROM customers WHERE customer_id = ?', [customerId]);
    if (!result || result.length === 0) {
      console.warn(`Customer not found for id: ${customerId}`);
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = result[0];

    // Get customer orders by customer_id
    const orders = await runQuery('SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date_time DESC', [customerId]);

    // Get total spent
    const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);

    // Get last order date
    const lastOrder = orders.length > 0 ? orders[0].order_date_time : null;

    res.json({
      ...customer,
      orders,
      totalSpent,
      lastOrder
    });
  } catch (err) {
    console.error('GET CUSTOMER DETAILS ERROR:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ================= ORDERS =================
app.post('/api/orders', async (req, res) => {
  const { customer, orderType, paymentMode, total, createdBy, cart } = req.body;
  try {
    let customerId;
    const [existing] = await runQuery(
      'SELECT customer_id FROM customers WHERE name = ? AND phone = ?',
      [customer.name, customer.phone]
    );

    if (existing) {
      customerId = existing.customer_id;
    } else {
      const result = await runQuery(
        'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
        [customer.name, customer.phone, customer.address]
      );
      customerId = result.insertId;
    }

    const orderRes = await runQuery(
      'INSERT INTO orders (customer_id, order_type, payment_mode, total_price, order_date_time, created_by_user) VALUES (?, ?, ?, ?, NOW(), ?)',
      [customerId, orderType, paymentMode, total, createdBy]
    );
    const orderId = orderRes.insertId;

    for (const item of cart) {
      await runQuery(
        'INSERT INTO order_items (order_id, item_id, quantity) VALUES (?, ?, ?)',
        [orderId, item.item_id, item.quantity]
      );
    }

    res.json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('ORDER POST ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================= PAYMENT =================
app.post('/api/payment', async (req, res) => {
  const { customer, card } = req.body;
  try {
    // Validate card number
    if (!card.card_number || !/^\d{16}$/.test(card.card_number)) {
      return res.status(400).json({ error: 'Card number must be exactly 16 digits.' });
    }

    const [existing] = await runQuery(
      'SELECT customer_id FROM customers WHERE name = ? AND phone = ?',
      [customer.name, customer.phone]
    );

    if (!existing) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const customerId = existing.customer_id;
    const last4 = card.card_number?.slice(-4) || '';

    await runQuery(
      'INSERT INTO payment (customer_id, card_id, card_holder_name, card_last4, card_expiry) VALUES (?, ?, ?, ?, ?)',
      [customerId, card.card_id || '', card.card_holder_name || '', last4, card.card_expiry || '']
    );

    res.json({ message: 'Payment recorded' });
  } catch (err) {
    console.error('PAYMENT POST ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================= ORDER LIST =================
app.get('/api/orders', async (_, res) => {
  try {
    const orders = await runQuery(
      'SELECT o.*, c.name AS customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id ORDER BY o.order_date_time DESC'
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= SERVER LISTEN =================
app.listen(port, () => {
  console.log(`✅ SmartPOS server running on http://localhost:${port}`);
});