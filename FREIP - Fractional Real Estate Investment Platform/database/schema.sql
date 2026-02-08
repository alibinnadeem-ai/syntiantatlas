-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  kyc_status VARCHAR(50) DEFAULT 'pending',
  kyc_level INT DEFAULT 0,
  kyc_document JSONB,
  wallet_balance DECIMAL(15,2) DEFAULT 0,
  bank_account JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_kyc_status CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  CONSTRAINT check_status CHECK (status IN ('active', 'suspended', 'banned'))
);

-- Roles Table
CREATE TABLE roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location JSONB,
  address VARCHAR(255),
  city VARCHAR(100),
  property_type VARCHAR(50),
  area_sqft DECIMAL(10,2),
  total_value DECIMAL(15,2),
  funding_target DECIMAL(15,2),
  funding_raised DECIMAL(15,2) DEFAULT 0,
  min_investment DECIMAL(10,2),
  max_investment DECIMAL(15,2),
  expected_returns_annual DECIMAL(5,2),
  rental_yield DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'draft',
  spv_id UUID,
  documents JSONB,
  images JSONB,
  video_tour_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_property_status CHECK (status IN ('draft', 'pending', 'active', 'funded', 'closed'))
);

-- Investments Table
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  amount_invested DECIMAL(15,2) NOT NULL,
  shares_owned DECIMAL(10,4),
  ownership_percentage DECIMAL(5,2),
  investment_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  returns_earned DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_investment_status CHECK (status IN ('active', 'exited', 'cancelled'))
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  gateway VARCHAR(100),
  payment_method VARCHAR(100),
  reference_number VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_transaction_type CHECK (type IN ('deposit', 'withdrawal', 'investment', 'dividend', 'refund')),
  CONSTRAINT check_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Dividends Table
CREATE TABLE dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  quarter INT,
  year INT,
  total_rental_income DECIMAL(15,2),
  total_expenses DECIMAL(15,2),
  net_income DECIMAL(15,2),
  distribution_per_share DECIMAL(10,4),
  distribution_date DATE,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_dividend_status CHECK (status IN ('scheduled', 'distributed', 'cancelled'))
);

-- Secondary Market Listing
CREATE TABLE secondary_market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  investment_id UUID NOT NULL REFERENCES investments(id),
  shares_for_sale DECIMAL(10,4),
  price_per_share DECIMAL(10,2),
  listing_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  buyer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_listing_status CHECK (status IN ('active', 'sold', 'expired', 'cancelled'))
);

-- KYC Verifications
CREATE TABLE kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  kyc_level INT,
  verification_type VARCHAR(100),
  verification_data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_kyc_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  subject VARCHAR(255),
  description TEXT,
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open',
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT check_ticket_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_properties_seller_id ON properties(seller_id);
CREATE INDEX idx_investments_investor_id ON investments(investor_id);
CREATE INDEX idx_investments_property_id ON investments(property_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_dividends_property_id ON dividends(property_id);
CREATE INDEX idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
