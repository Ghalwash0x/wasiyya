const nodemailer = require('nodemailer');

const isEmailConfigured = () =>
    process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your@gmail.com' &&
    process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password';

const getTransporter = () => nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendMail = async (options) => {
    if (!isEmailConfigured()) {
        console.log(`📧 [EMAIL SKIPPED — not configured] To: ${options.to} | Subject: ${options.subject}`);
        return;
    }
    try {
        await getTransporter().sendMail(options);
        console.log(`📧 Email sent → ${options.to}`);
    } catch (err) {
        console.error(`❌ Email failed → ${options.to}: ${err.message}`);
    }
};

const sendWarningEmail = (email, gracePeriod) => sendMail({
    from:    process.env.EMAIL_FROM || 'wasiyya <noreply@wasiyya.com>',
    to:      email,
    subject: '⚠️ وصيّة - تذكير بتجديد وجودك',
    html: `
        <div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#d97706;">⚠️ تذكير مهم</h2>
            <p>لم تقم بتجديد وجودك في منصة <strong>وصيّة</strong> منذ فترة.</p>
            <p>لديك <strong>${gracePeriod} فترة إضافية</strong> لتسجيل دخولك وتأكيد وجودك.</p>
            <p>إذا لم تفعل ذلك، سيتم تفعيل وصيتك تلقائياً وإرسالها للورثة المحددين.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard"
               style="display:inline-block;margin-top:16px;background:#4F46E5;color:white;
                      padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                أنا بخير — تسجيل الدخول
            </a>
        </div>
    `
});

const sendFinalWarningEmail = (email) => sendMail({
    from:    process.env.EMAIL_FROM || 'wasiyya <noreply@wasiyya.com>',
    to:      email,
    subject: '🚨 وصيّة - تحذير أخير قبل تفعيل الوصية',
    html: `
        <div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:24px;border:1px solid #fca5a5;border-radius:12px;background:#fff7f7;">
            <h2 style="color:#dc2626;">🚨 تحذير أخير</h2>
            <p>ستُفعَّل وصيتك قريباً جداً إذا لم تسجل دخولك وتجدد وجودك الآن.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard"
               style="display:inline-block;margin-top:16px;background:#dc2626;color:white;
                      padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                تسجيل الدخول الآن — عاجل
            </a>
        </div>
    `
});

const sendBeneficiaryNotification = (email, name, token) => sendMail({
    from:    process.env.EMAIL_FROM || 'wasiyya <noreply@wasiyya.com>',
    to:      email,
    subject: '📜 وصيّة — لديك وصية رقمية في انتظارك',
    html: `
        <div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:24px;border:1px solid #d1fae5;border-radius:12px;background:#f0fdf4;">
            <h2 style="color:#059669;">📜 وصية رقمية موجهة إليك</h2>
            <p>عزيزي/عزيزتي <strong>${name}</strong>،</p>
            <p>تم تفعيل وصية رقمية موجهة إليك شخصياً من منصة <strong>وصيّة</strong>.</p>
            <p>يمكنك الاطلاع على محتواها من خلال الرابط أدناه. <strong>الرابط صالح لمدة 7 أيام فقط</strong> ولا تشاركه مع أحد.</p>
            <a href="${process.env.FRONTEND_URL}/access/${token}"
               style="display:inline-block;margin-top:16px;background:#059669;color:white;
                      padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                الوصول للوصية
            </a>
            <p style="margin-top:16px;font-size:12px;color:#6b7280;">
                أو انسخ هذا الرابط: ${process.env.FRONTEND_URL}/access/${token}
            </p>
        </div>
    `
});

module.exports = { sendWarningEmail, sendFinalWarningEmail, sendBeneficiaryNotification };
