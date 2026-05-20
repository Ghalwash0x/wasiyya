/**
 * Run once after pulling Phase 3 changes:
 *   cd backend && node migrate.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 3306,
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'wasiyya',
    });

    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcrypt');

    const steps = [
        {
            sql: `ALTER TABLE users MODIFY COLUMN role ENUM('admin','user','manager','developer') DEFAULT 'user'`,
            desc: 'Add manager + developer roles to users.role ENUM'
        },
        {
            sql: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT DEFAULT NULL`,
            desc: 'Add audit_logs.details for structured action metadata'
        },
        {
            sql: `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS email_status ENUM('pending','sent','failed') DEFAULT 'pending'`,
            desc: 'Add beneficiaries.email_status'
        },
        {
            sql: `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS email_attempts INT DEFAULT 0`,
            desc: 'Add beneficiaries.email_attempts'
        },
        {
            sql: `ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS last_attempt_at DATETIME DEFAULT NULL`,
            desc: 'Add beneficiaries.last_attempt_at'
        },
    ];

    for (const step of steps) {
        try {
            await conn.execute(step.sql);
            console.log(`✅ ${step.desc}`);
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`⏭️  Already exists — ${step.desc}`);
            } else {
                console.error(`❌ ${step.desc}: ${e.message}`);
            }
        }
    }

    // Seed developer account if none exists
    const [devRows] = await conn.execute(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'developer'`);
    if (parseInt(devRows[0].cnt) === 0) {
        const hashed = await bcrypt.hash('Dev@Secret#99', 12);
        await conn.execute(
            `INSERT INTO users (id, full_name, email, password, role) VALUES (?, ?, ?, ?, 'developer')`,
            [uuidv4(), 'Developer', 'dev@wasiyya.internal', hashed]
        );
        console.log('✅ Developer seed account created: dev@wasiyya.internal / Dev@Secret#99');
    } else {
        console.log('⏭️  Developer account already exists — skipping seed');
    }

    console.log('\n✅ Migration complete — restart the backend server');
    await conn.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });
