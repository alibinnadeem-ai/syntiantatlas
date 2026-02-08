const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'freip_db',
    password: 'postgres',
    port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Connection Error:', err);
    } else {
        console.log('Connection Success:', res.rows[0]);
    }
    pool.end();
});
