const cron   = require('node-cron');
const crypto = require('crypto');
const pool   = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const emailService   = require('./email.service');

const isMinutes = process.env.TIME_UNIT === 'minutes';

const getElapsed = (lastCheckin) => {
    const diff = Date.now() - new Date(lastCheckin).getTime();
    return isMinutes
        ? Math.floor(diff / (1000 * 60))
        : Math.floor(diff / (1000 * 60 * 60 * 24));
};

const triggerWill = async (willId, userId) => {
    await pool.query(
        `UPDATE wills SET status = 'triggered', triggered_at = NOW() WHERE id = $1`,
        [willId]
    );

    const beneficiaries = await pool.query(
        'SELECT * FROM beneficiaries WHERE will_id = $1', [willId]
    );

    for (const ben of beneficiaries.rows) {
        const token   = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await pool.query(
            `UPDATE beneficiaries SET access_token = $1, token_expires = $2, notified_at = NOW() WHERE id = $3`,
            [token, expires, ben.id]
        );

        await emailService.sendBeneficiaryNotification(ben.email, ben.name, token, ben.id);
        console.log(`📧 Notified beneficiary: ${ben.email}`);
    }

    await pool.query(
        'INSERT INTO audit_logs (id, user_id, action) VALUES ($1, $2, $3)',
        [uuidv4(), userId, 'WILL_TRIGGERED']
    );

    console.log(`✅ Will triggered for user: ${userId}`);
};

const runCheckinCheck = async () => {
    console.log(`🔄 Running checkin check [${isMinutes ? 'MINUTES mode' : 'DAYS mode'}]...`);
    try {
        const result = await pool.query(`
            SELECT
                u.id AS user_id, u.email, u.last_checkin,
                w.id AS will_id, w.checkin_interval_days, w.grace_period_days
            FROM users u
            JOIN wills w ON w.user_id = u.id
            WHERE w.status = 'active' AND u.is_active = 1
        `);

        let triggered = 0, warned = 0;

        for (const row of result.rows) {
            const elapsed     = getElapsed(row.last_checkin);
            const warningAt   = row.checkin_interval_days;
            const triggerAt   = row.checkin_interval_days + row.grace_period_days;

            if (elapsed >= triggerAt) {
                await triggerWill(row.will_id, row.user_id);
                triggered++;
            } else if (elapsed === warningAt) {
                await emailService.sendWarningEmail(row.email, row.grace_period_days);
                await pool.query(
                    `INSERT INTO checkin_notifications (id, user_id, notification_type) VALUES ($1, $2, 'warning')`,
                    [uuidv4(), row.user_id]
                );
                warned++;
            } else if (elapsed === triggerAt - 1) {
                await emailService.sendFinalWarningEmail(row.email);
                await pool.query(
                    `INSERT INTO checkin_notifications (id, user_id, notification_type) VALUES ($1, $2, 'final_warning')`,
                    [uuidv4(), row.user_id]
                );
                warned++;
            }
        }

        console.log(`✅ Check done — triggered: ${triggered}, warned: ${warned}`);
        return { triggered, warned, checked: result.rows.length };
    } catch (error) {
        console.error('Checkin cron error:', error);
        throw error;
    }
};

const startCheckinCron = () => {
    const schedule = isMinutes ? '* * * * *' : '0 9 * * *';
    const label    = isMinutes ? 'كل دقيقة (وضع التيست)' : 'كل يوم الساعة 9 صبح (وضع الإنتاج)';

    cron.schedule(schedule, runCheckinCheck);
    console.log(`⏰ Checkin cron started — ${label}`);
    console.log(`   TIME_UNIT = ${isMinutes ? 'minutes' : 'days'}`);
};

module.exports = { startCheckinCron, runCheckinCheck };
