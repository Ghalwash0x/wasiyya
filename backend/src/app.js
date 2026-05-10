const express    = require('express');
const https      = require('https');
const fs         = require('fs');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

const authRoutes        = require('./routes/auth.routes');
const willRoutes        = require('./routes/will.routes');
const assetRoutes       = require('./routes/asset.routes');
const documentRoutes    = require('./routes/document.routes');
const beneficiaryRoutes = require('./routes/beneficiary.routes');
const checkinRoutes     = require('./routes/checkin.routes');
const adminRoutes       = require('./routes/admin.routes');

const { startCheckinCron } = require('./services/checkin.service');

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: 'طلبات كثيرة جداً، حاول لاحقاً' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          authRoutes);
app.use('/api/wills',         willRoutes);
app.use('/api/assets',        assetRoutes);
app.use('/api/documents',     documentRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/checkin',       checkinRoutes);
app.use('/api/admin',         adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        phase: 1,
        time_unit: process.env.TIME_UNIT || 'days',
        timestamp: new Date()
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'حجم الملف أكبر من المسموح' });
    }
    if (err.name === 'MulterError' || (typeof err.message === 'string' && err.message.includes('نوع الملف'))) {
        return res.status(400).json({ success: false, message: err.message || 'خطأ في الملف المرفوع' });
    }
    res.status(500).json({ success: false, message: 'خطأ داخلي في السيرفر' });
});

startCheckinCron();

const PORT = process.env.PORT || 3001;

const certPath = process.env.SSL_CERT_PATH || './certs/server.cert';
const keyPath  = process.env.SSL_KEY_PATH  || './certs/server.key';

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app)
        .listen(PORT, () => console.log(`🔐 HTTPS — https://localhost:${PORT}`));
} else {
    app.listen(PORT, () => {
        console.log(`🚀 Wasiyya backend — http://localhost:${PORT}`);
        console.log(`⏱️  TIME_UNIT = ${process.env.TIME_UNIT || 'days'}`);
    });
}
