import { query } from '../config/database.js';

export const User = {
  async create(userData) {
    const { email, phone, password_hash, first_name, last_name, role_id } = userData;
    const result = await query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role_id, kyc_status, created_at`,
      [email, phone, password_hash, first_name, last_name, role_id]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async update(id, userData) {
    const { first_name, last_name, kyc_status, kyc_level, wallet_balance } = userData;
    const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           kyc_status = COALESCE($4, kyc_status),
           kyc_level = COALESCE($5, kyc_level),
           wallet_balance = COALESCE($6, wallet_balance),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, first_name, last_name, kyc_status, kyc_level, wallet_balance]
    );
    return result.rows[0];
  },

  async findByRole(roleId) {
    const result = await query(
      'SELECT * FROM users WHERE role_id = $1',
      [roleId]
    );
    return result.rows;
  }
};

export const Property = {
  async create(propertyData) {
    const {
      seller_id, title, description, location, address, city,
      property_type, area_sqft, total_value, funding_target,
      min_investment, max_investment, expected_returns_annual, rental_yield
    } = propertyData;

    const result = await query(
      `INSERT INTO properties (
        seller_id, title, description, location, address, city,
        property_type, area_sqft, total_value, funding_target,
        min_investment, max_investment, expected_returns_annual, rental_yield
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [seller_id, title, description, location, address, city,
       property_type, area_sqft, total_value, funding_target,
       min_investment, max_investment, expected_returns_annual, rental_yield]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM properties WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findAll(filters = {}) {
    let query_str = 'SELECT * FROM properties WHERE 1=1';
    const params = [];

    if (filters.city) {
      params.push(filters.city);
      query_str += ` AND city = $${params.length}`;
    }
    if (filters.property_type) {
      params.push(filters.property_type);
      query_str += ` AND property_type = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status);
      query_str += ` AND status = $${params.length}`;
    }

    query_str += ' ORDER BY created_at DESC';

    const result = await query(query_str, params);
    return result.rows;
  },

  async update(id, propertyData) {
    const { title, description, status, funding_raised } = propertyData;
    const result = await query(
      `UPDATE properties 
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           funding_raised = COALESCE($5, funding_raised),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, title, description, status, funding_raised]
    );
    return result.rows[0];
  }
};

export const Investment = {
  async create(investmentData) {
    const { investor_id, property_id, amount_invested, shares_owned, ownership_percentage } = investmentData;
    const result = await query(
      `INSERT INTO investments (investor_id, property_id, amount_invested, shares_owned, ownership_percentage, investment_date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [investor_id, property_id, amount_invested, shares_owned, ownership_percentage]
    );
    return result.rows[0];
  },

  async findByInvestor(investorId) {
    const result = await query(
      'SELECT * FROM investments WHERE investor_id = $1 ORDER BY investment_date DESC',
      [investorId]
    );
    return result.rows;
  },

  async findByProperty(propertyId) {
    const result = await query(
      'SELECT * FROM investments WHERE property_id = $1',
      [propertyId]
    );
    return result.rows;
  }
};

export const Transaction = {
  async create(transactionData) {
    const { user_id, type, amount, gateway, payment_method, reference_number, description } = transactionData;
    const result = await query(
      `INSERT INTO transactions (user_id, type, amount, gateway, payment_method, reference_number, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, type, amount, gateway, payment_method, reference_number, description]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async updateStatus(id, status) {
    const result = await query(
      'UPDATE transactions SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }
};

export const Dividend = {
  async create(dividendData) {
    const {
      property_id, quarter, year, total_rental_income,
      total_expenses, net_income, distribution_per_share
    } = dividendData;

    const result = await query(
      `INSERT INTO dividends (
        property_id, quarter, year, total_rental_income,
        total_expenses, net_income, distribution_per_share, distribution_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
       RETURNING *`,
      [property_id, quarter, year, total_rental_income, total_expenses, net_income, distribution_per_share]
    );
    return result.rows[0];
  },

  async findByProperty(propertyId) {
    const result = await query(
      'SELECT * FROM dividends WHERE property_id = $1 ORDER BY year DESC, quarter DESC',
      [propertyId]
    );
    return result.rows;
  }
};
