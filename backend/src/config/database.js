const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host:             process.env.DB_HOST     || 'localhost',
    port:             parseInt(process.env.DB_PORT) || 3306,
    user:             process.env.DB_USER     || 'root',
    password:         process.env.DB_PASSWORD || '',
    database:         process.env.DB_NAME     || 'wasiyya',
    waitForConnections: true,
    connectionLimit:  10,
    charset:          'utf8mb4',
});

// pg-compatible wrapper: converts $1,$2... → ? and returns { rows }
const db = {
    query: async (sql, params = []) => {
        const mysqlSql = sql.replace(/\$\d+/g, '?');
        const [result] = await pool.execute(mysqlSql, params || []);
        if (Array.isArray(result)) {
            return { rows: result };
        }
        return { rows: [], affectedRows: result.affectedRows };
    }
};

pool.getConnection()
    .then(conn => { console.log('✅ Connected to MySQL'); conn.release(); })
    .catch(err => { console.error('❌ MySQL connection failed:', err.message); process.exit(1); });

module.exports = db;
