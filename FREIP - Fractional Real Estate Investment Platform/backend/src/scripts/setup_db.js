
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🔌 Connecting to database...');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Neon requires SSL
    }
});

const createTables = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Connected successfully.');

        // Users Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role_id VARCHAR(50) DEFAULT 'investor',
        kyc_status VARCHAR(50) DEFAULT 'pending',
        kyc_level INT DEFAULT 1,
        wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Users table created.');

        // Properties Table
        await client.query(`
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
    `);
        console.log('✅ Properties table created.');

        // Investments Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        investor_id INT REFERENCES users(id),
        property_id INT REFERENCES properties(id),
        amount_invested DECIMAL(15, 2) NOT NULL,
        shares_owned DECIMAL(15, 4),
        ownership_percentage DECIMAL(5, 4),
        investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Investments table created.');

        // Transactions Table
        await client.query(`
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
    `);
        console.log('✅ Transactions table created.');

        // Dividends Table
        await client.query(`
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
    `);
        console.log('✅ Dividends table created.');

        console.log('🎉 Database setup completed!');
        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Database setup failed:', err);
        process.exit(1);
    }
};

createTables();
