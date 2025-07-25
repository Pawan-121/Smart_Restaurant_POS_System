-- Create the database
CREATE DATABASE IF NOT EXISTS restaurant_pos_system;
USE restaurant_pos_system;

-- Users table (Admin/Staff)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('starter', 'main', 'dessert', 'drinks') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  order_type ENUM('dine-in', 'take-out', 'delivery') NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  order_date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user VARCHAR(50) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  FOREIGN KEY (created_by_user) REFERENCES users(username)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);
-- Payments table
CREATE TABLE payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  card_id VARCHAR(100),
  card_holder_name VARCHAR(100),
  card_last4 VARCHAR(4),
  card_expiry VARCHAR(10),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
-- Optional: Insert demo users (you can change password logic later)
INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin'),
('staff', 'staff123', 'staff');

use restaurant_pos_system;
ALTER TABLE orders ADD COLUMN payment_mode ENUM('cash', 'card') NOT NULL DEFAULT 'cash';

ALTER TABLE menu_items ADD COLUMN image_url VARCHAR(2000);
-- =====================================================
-- Restaurant POS System Database
-- Complete MySQL Database Setup
-- =====================================================
-- 
-- Instructions:
-- 1. Open MySQL Workbench
-- 2. Connect to your MySQL server
-- 3. File → Run SQL Script
-- 4. Select this file and execute
-- 
-- Login Credentials:
-- Admin: username=admin, password=admin123
-- Staff: username=staff, password=staff123
-- =====================================================

-- Reset settings for clean import
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- Create database
DROP DATABASE IF EXISTS restaurant_pos_system;
CREATE DATABASE restaurant_pos_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurant_pos_system;

-- =====================================================
-- TABLE CREATION
-- =====================================================

-- Users table (Admin/Staff)
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL
) ENGINE=InnoDB;

-- Menu items table
CREATE TABLE menu_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('starter', 'main', 'dessert', 'drinks') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Customers table
CREATE TABLE customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT
) ENGINE=InnoDB;

-- Orders table
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  order_type ENUM('dine-in', 'take-out', 'delivery') NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  order_date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user VARCHAR(50) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user) REFERENCES users(username) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Order Items table
CREATE TABLE order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Payments table
CREATE TABLE payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  card_id VARCHAR(100),
  card_holder_name VARCHAR(100),
  card_last4 VARCHAR(4),
  card_expiry VARCHAR(10),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert demo users
INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin'),
('staff', 'staff123', 'staff');

-- Insert sample menu items
INSERT INTO menu_items (name, category, price, is_available) VALUES
('Chicken Burger', 'main', 12.99, TRUE),
('Fish & Chips', 'main', 14.99, TRUE),
('Caesar Salad', 'starter', 8.99, TRUE),
('Garlic Bread', 'starter', 5.99, TRUE),
('Chocolate Cake', 'dessert', 6.99, TRUE),
('Ice Cream', 'dessert', 4.99, TRUE),
('Coffee', 'drinks', 3.99, TRUE),
('Fresh Juice', 'drinks', 4.99, TRUE),
('Coca Cola', 'drinks', 2.99, TRUE);

-- Insert sample customers
INSERT INTO customers (name, phone, address) VALUES
('John Doe', '123-456-7890', '123 Main St, City'),
('Jane Smith', '098-765-4321', '456 Oak Ave, City'),
('Bob Johnson', '555-123-4567', '789 Pine St, City');

-- Restore settings
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all tables created
SHOW TABLES;

-- Show sample data
SELECT 'Users Table:' as info;
SELECT * FROM users;

SELECT 'Menu Items:' as info;
SELECT * FROM menu_items;

SELECT 'Customers:' as info;  
SELECT * FROM customers;

-- Success message
SELECT 'Database setup completed successfully!' as status;
SELECT 'Login with: admin/admin123 or staff/staff123' as login_info;
