const nodemailer = require('nodemailer');

// In-memory store: beneficiaryId → Ethereal preview URL
const previews = new Map();

const isGmailConfigured = () =>
    process.env.EMAIL_USER &&
    process.env.EMAIL_USER !== 'your@gmail.com' &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_PASS !== 'your_app_password';

let etherealTransporter = null;

const getTransporter = async () => {
    if (isGmailConfigured()) {
        return nodemailer.createTransport({
            host:   'smtp.gmail.com',
            port:   587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Fallback: Ethereal test account (auto-created, no config needed)
    if (!etherealTransporter) {
        const account = await nodemailer.createTestAccount();
        etherealTransporter = nodemailer.createTransport({
            host:   'smtp.ethereal.email',
            port:   587,
            secure: false,
            auth: { user: account.user, pass: account.pass }
        });
        console.log(`📧 Ethereal test account ready: ${account.user}`);
    }
    return etherealTransporter;
};

const sendMail = async (options) => {
    try {
        const transporter = await getTransporter();
        const info        = await transporter.sendMail(options);
        const previewUrl  = nodemailer.getTestMessageUrl(info);

        if (previewUrl) {
            console.log(`\n📧 ══════════════════════════════════════`);
            console.log(`   إيميل تيست → ${options.to}`);
            console.log(`   رابط المعاينة: ${previewUrl}`);
            console.log(`📧 ══════════════════════════════════════\n`);
        } else {
            console.log(`📧 إيميل حقيقي أُرسل → ${options.to}`);
        }

        return { previewUrl: previewUrl || null };
    } catch (err) {
        console.error(`❌ فشل إرسال الإيميل → ${options.to}: ${err.message}`);
        return { error: err.message };
    }
};

const sendWarningEmail = async (email, gracePeriod) => {
    await sendMail({
        from:    process.env.EMAIL_FROM || 'wasiyya <noreply@wasiyya.com>',
        to:      email,
        subject: '⚠️ وصيّة - تذكير بتجديد وجودك',
        html: `
            <div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:24px;
                                  border:1px solid #fde68a;border-radius:12px;background:#fffbeb;">
                <h2 style="color:#d97706;">⚠️ تذكير مهم</h2>
                <p>لم تقم بتجديد وجودك في منصة <strong>وصيّة</strong> منذ فترة.</p>
                <p>لديك <strong>${gracePeriod} فترة إضافية</strong> لتجديد وجودك.</p>
                <p>إذا لم تفعل ذلك، ستُفعَّل وصيتك تلقائياً وتُرسَل للورثة.</p>
                <a href="${process.env.FRONTEND_URL}/dashboard"
                   style="display:inline-block;margin-top:16px;background:#4F46E5;color:white;
                          padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                    أنا بخير — تسجيل الدخول
                </a>
            </div>`
    });
};

const sendFinalWarningEmail = async (email) => {
    await sendMail({
        from:    process.env.EMAIL_FROM || 'wasiyya <noreply@wasiyya.com>',
        to:      email,
        subject: '🚨 وصيّة - تحذير أخير قبل تفعيل الوصية',
        html: `
            <div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:24px;
                                  border:1px solid #fca5a5;border-radius:12px;background:#fff7f7;">
                <h2 style="color:#dc2626;">🚨 تحذير أخير</h2>
                <p>ستُفعَّل وصيتك قريباً جداً إذا لم تسجل دخولك وتجدد وجودك الآن.</p>
                <a href="${process.env.FRONTEND_URL}/dashboard"
                   style="display:inline-block;margin-top:16px;background:#dc2626;color:white;
                          padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                    تسجيل الدخول الآن — عاجل
                </a>
            </div>`
    });
};

const sendBeneficiaryNotification = async (email, name, token, beneficiaryId) => {
    const accessUrl = `${process.env.FRONTEND_URL}/access/${token}`;

    const result = await sendMail({
        from:    process.env.EMAIL_FROM || 'wasiyya <noreply@wasiyya.com>',
        to:      email,
        subject: '📜 وصيّة — لديك وصية رقمية في انتظارك',
        html: `
            <div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:24px;
                                  border:1px solid #a7f3d0;border-radius:12px;background:#f0fdf4;">
                <h2 style="color:#059669;">📜 وصية رقمية موجهة إليك</h2>
                <p>عزيزي/عزيزتي <strong>${name}</strong>،</p>
                <p>تم تفعيل وصية رقمية موجهة إليك شخصياً من منصة <strong>وصيّة</strong>.</p>
                <p>يمكنك الاطلاع على محتواها من خلال الرابط أدناه.</p>
                <p style="color:#dc2626;font-weight:bold;">⚠️ الرابط صالح لمدة 7 أيام فقط — لا تشاركه مع أحد.</p>
                <a href="${accessUrl}"
                   style="display:inline-block;margin-top:16px;background:#059669;color:white;
                          padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                    الوصول للوصية
                </a>
                <p style="margin-top:20px;font-size:12px;color:#6b7280;word-break:break-all;">
                    أو انسخ هذا الرابط:<br>${accessUrl}
                </p>
            </div>`
    });

    // Store preview URL for admin panel display
    if (result.previewUrl && beneficiaryId) {
        previews.set(String(beneficiaryId), result.previewUrl);
    }

    return result;
};

const getPreview    = (beneficiaryId) => previews.get(String(beneficiaryId)) || null;
const getAllPreviews = () => Object.fromEntries(previews);

module.exports = {
    sendWarningEmail,
    sendFinalWarningEmail,
    sendBeneficiaryNotification,
    getPreview,
    getAllPreviews,
    isGmailConfigured,
};
