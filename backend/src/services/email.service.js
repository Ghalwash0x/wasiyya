const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendWarningEmail = async (email, graceDays) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '⚠️ وصيّة - تذكير بتجديد وجودك',
        html: `
            <div dir="rtl" style="font-family: Arial; padding: 20px;">
                <h2>⚠️ تذكير مهم</h2>
                <p>لم تقم بتجديد وجودك في منصة وصيّة منذ فترة.</p>
                <p>لديك <strong>${graceDays} أيام</strong> لتسجيل دخولك وتجديد وجودك.</p>
                <p>إذا لم تقم بذلك، سيتم تفعيل وصيتك تلقائياً وإرسالها للوصيّين.</p>
                <a href="${process.env.FRONTEND_URL}/dashboard"
                   style="background:#4F46E5;color:white;padding:10px 20px;
                          text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">
                    أنا بخير - تسجيل الدخول
                </a>
            </div>
        `
    });
};

const sendFinalWarningEmail = async (email) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '🚨 وصيّة - تحذير أخير',
        html: `
            <div dir="rtl" style="font-family: Arial; padding: 20px;">
                <h2 style="color:red;">🚨 تحذير أخير</h2>
                <p>سيتم تفعيل وصيتك <strong>غداً</strong> إذا لم تسجل دخولك.</p>
                <a href="${process.env.FRONTEND_URL}/dashboard"
                   style="background:#DC2626;color:white;padding:10px 20px;
                          text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">
                    تسجيل الدخول الآن
                </a>
            </div>
        `
    });
};

const sendBeneficiaryNotification = async (email, name, token) => {
    const accessUrl = `${process.env.FRONTEND_URL}/access/${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '📜 وصيّة - لديك وصية في انتظارك',
        html: `
            <div dir="rtl" style="font-family: Arial; padding: 20px;">
                <h2>📜 وصية رقمية</h2>
                <p>عزيزي/عزيزتي ${name}،</p>
                <p>تم تفعيل وصية رقمية موجهة إليك.</p>
                <p>يمكنك الوصول إليها من خلال الرابط التالي (صالح لمدة 7 أيام):</p>
                <a href="${accessUrl}"
                   style="background:#059669;color:white;padding:10px 20px;
                          text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">
                    الوصول للوصية
                </a>
            </div>
        `
    });
};

module.exports = { sendWarningEmail, sendFinalWarningEmail, sendBeneficiaryNotification };
