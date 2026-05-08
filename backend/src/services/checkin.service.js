const cron = require('node-cron');
const pool = require('../config/database');
const emailService = require('./email.service');

const triggerWill = async (willId, userId) => {
    await pool.query(
        `UPDATE wills SET status = 'triggered', triggered_at = NOW() WHERE id = $1`,
        [willId]
    );

    const beneficiaries = await pool.query(
        'SELECT * FROM beneficiaries WHERE will_id = $1',
        [willId]
    );

    for (const ben of beneficiaries.rows) {
        const token = require('crypto').randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await pool.query(
            `UPDATE beneficiaries SET access_token = $1, token_expires = $2, notified_at = NOW() WHERE id = $3`,
            [token, expires, ben.id]
        );

        await emailService.sendBeneficiaryNotification(ben.email, ben.name, token);
    }

    await pool.query(
        'INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)',
        [userId, 'WILL_TRIGGERED']
    );

    console.log(`✅ Will triggered for user: ${userId}`);
};

const startCheckinCron = () => {
    cron.schedule('0 9 * * *', async () => {
        console.log('🔄 Running daily checkin check...');

        try {
            const result = await pool.query(`
                SELECT
                    u.id AS user_id, u.email, u.last_checkin,
                    w.id AS will_id, w.checkin_interval_days, w.grace_period_days
                FROM users u
                JOIN wills w ON w.user_id = u.id
                WHERE w.status = 'active' AND u.is_active = true
            `);

            for (const row of result.rows) {
                const daysSince = Math.floor(
                    (new Date() - new Date(row.last_checkin)) / (1000 * 60 * 60 * 24)
                );
                const warningDay  = row.checkin_interval_days;
                const triggerDay  = row.checkin_interval_days + row.grace_period_days;

                if (daysSince >= triggerDay) {
                    await triggerWill(row.will_id, row.user_id);
                } else if (daysSince === warningDay) {
                    await emailService.sendWarningEmail(row.email, row.grace_period_days);
                    await pool.query(
                        `INSERT INTO checkin_notifications (user_id, notification_type) VALUES ($1, 'warning')`,
                        [row.user_id]
                    );
                } else if (daysSince === triggerDay - 1) {
                    await emailService.sendFinalWarningEmail(row.email);
                    await pool.query(
                        `INSERT INTO checkin_notifications (user_id, notification_type) VALUES ($1, 'final_warning')`,
                        [row.user_id]
                    );
                }
            }
        } catch (error) {
            console.error('Checkin cron error:', error);
        }
    });

    console.log('⏰ Checkin cron job started');
};

module.exports = { startCheckinCron };
