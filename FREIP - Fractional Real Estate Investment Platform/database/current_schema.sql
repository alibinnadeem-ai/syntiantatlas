
-- Active Schema used in Neon PostgreSQL (referenced from setup_db.js)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL, -- Ensure to use hashed passwords in real usage
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id VARCHAR(50) DEFAULT 'investor', -- roles: 'investor', 'seller', 'admin', 'staff', 'operations_manager', etc.
  kyc_status VARCHAR(50) DEFAULT 'pending',
  kyc_level INT DEFAULT 1,
  wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  seller_id INT REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  property_type VARCHAR(50),
  area_sqft DECIMAL(10, 2),
  total_value DECIMAL(15, 2),
  funding_target DECIMAL(15, 2),
  min_investment DECIMAL(15, 2),
  max_investment DECIMAL(15, 2),
  expected_returns_annual DECIMAL(5, 2),
  rental_yield DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'active',
  funding_raised DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Investments Table
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  investor_id INT REFERENCES users(id),
  property_id INT REFERENCES properties(id),
  amount_invested DECIMAL(15, 2) NOT NULL,
  shares_owned DECIMAL(15, 4),
  ownership_percentage DECIMAL(5, 4),
  investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  gateway VARCHAR(50),
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Dividends Table
CREATE TABLE IF NOT EXISTS dividends (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id),
  quarter INT,
  year INT,
  total_rental_income DECIMAL(15, 2),
  total_expenses DECIMAL(15, 2),
  net_income DECIMAL(15, 2),
  distribution_per_share DECIMAL(10, 4),
  distribution_date DATE DEFAULT CURRENT_DATE
);

-- SEED DATA (Optional - For Testing)
-- Note: 'password123' hashed with bcrypt (cost 10) is typically: $2b$10$w....
-- For simplicity in manual testing, you might need to register these via the API or specific manual hash if your auth logic strictly requires it.

-- Insert Super Admin
INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
VALUES ('admin@freip.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Super', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert Seller
INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
VALUES ('seller@freip.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'John', 'Seller', 'seller')
ON CONFLICT (email) DO NOTHING;

-- Insert Staff (Operations Manager)
INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
VALUES ('staff@freip.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Sarah', 'Manager', 'operations_manager')
ON CONFLICT (email) DO NOTHING;

-- Insert Investor
INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
VALUES ('investor@freip.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Alice', 'Investor', 'investor')
ON CONFLICT (email) DO NOTHING;
