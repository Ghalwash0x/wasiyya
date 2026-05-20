/**
 * Integration tests — Wasiyya backend API
 * Run: cd backend && npm test
 *
 * Uses a real DB connection. Test users/wills are cleaned up after each suite.
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const request = require('supertest');
const app     = require('../src/app');
const pool    = require('../src/config/database');

/* ─── helpers ─── */
const TEST_EMAIL    = `jest_test_${Date.now()}@wasiyya.test`;
const TEST_PASSWORD = 'TestPass@123';
let   userToken     = '';
let   userId        = '';
let   willId        = '';

afterAll(async () => {
    // cleanup — cascade deletes assets/docs/beneficiaries/wills via FK
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
    await pool.end?.();
});

/* ══════════════════════════
   AUTH
══════════════════════════ */
describe('Auth', () => {

    it('GET /api/health → 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.phase).toBe(4);
    });

    it('POST /register → 201 with token', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ full_name: 'Jest User', email: TEST_EMAIL, password: TEST_PASSWORD });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeTruthy();
        userToken = res.body.data.token;
        userId    = res.body.data.user.id;
    });

    it('POST /register duplicate → 409', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ full_name: 'Jest User', email: TEST_EMAIL, password: TEST_PASSWORD });
        expect(res.status).toBe(409);
    });

    it('POST /register weak password → 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ full_name: 'X', email: 'weak@test.com', password: '1234' });
        expect(res.status).toBe(400);
    });

    it('POST /login valid → 200 with token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeTruthy();
        userToken = res.body.data.token; // refresh
    });

    it('POST /login wrong password → 401', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: 'WrongPass@1' });
        expect(res.status).toBe(401);
    });

    it('POST /login unknown email → 401', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@nowhere.com', password: TEST_PASSWORD });
        expect(res.status).toBe(401);
    });

    it('GET /me authenticated → 200', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(TEST_EMAIL);
        expect(res.body.data.role).toBe('user');
    });

    it('GET /me no token → 401', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('GET /me bad token → 401', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalid.token.here');
        expect(res.status).toBe(401);
    });

    it('GET /wallet-key user → 200', async () => {
        const res = await request(app)
            .get('/api/auth/wallet-key')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.key).toMatch(/^[0-9a-f]{64}$/);
    });
});

/* ══════════════════════════
   2FA
══════════════════════════ */
describe('2FA', () => {

    it('GET /2fa/setup → 200 with QR code', async () => {
        const res = await request(app)
            .get('/api/auth/2fa/setup')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.qr_code).toMatch(/^data:image\/png/);
        expect(res.body.data.secret).toBeTruthy();
    });

    it('GET /2fa/methods?tempToken= missing → 400', async () => {
        const res = await request(app).get('/api/auth/2fa/methods');
        expect(res.status).toBe(400);
    });

    it('GET /passkey/list authenticated → 200', async () => {
        const res = await request(app)
            .get('/api/auth/passkey/list')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.passkeys)).toBe(true);
    });
});

/* ══════════════════════════
   WILLS
══════════════════════════ */
describe('Wills', () => {

    it('GET /wills empty list → 200', async () => {
        const res = await request(app)
            .get('/api/wills')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /wills create → 201', async () => {
        const res = await request(app)
            .post('/api/wills')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ title: 'Test Will', description: 'Jest test', checkin_interval_days: 30, grace_period_days: 7 });
        expect(res.status).toBe(201);
        expect(res.body.data.id).toBeTruthy();
        willId = res.body.data.id;
    });

    it('POST /wills missing title → 400', async () => {
        const res = await request(app)
            .post('/api/wills')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ description: 'no title' });
        expect(res.status).toBe(400);
    });

    it('GET /wills list after create → has 1 item', async () => {
        const res = await request(app)
            .get('/api/wills')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /wills/:id update → 200', async () => {
        const res = await request(app)
            .put(`/api/wills/${willId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ title: 'Updated Will' });
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Updated Will');
    });

    it('PUT /wills/nonexistent → 404', async () => {
        const res = await request(app)
            .put('/api/wills/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ title: 'X' });
        expect(res.status).toBe(404);
    });
});

/* ══════════════════════════
   ASSETS
══════════════════════════ */
describe('Assets', () => {

    it('GET /assets/:willId → 200', async () => {
        const res = await request(app)
            .get(`/api/assets/${willId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /assets create → 201', async () => {
        const res = await request(app)
            .post('/api/assets')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ will_id: willId, asset_type: 'bank', title: 'Test Bank', content: 'acc-123' });
        expect(res.status).toBe(201);
    });

    it('POST /assets missing will_id → 400', async () => {
        const res = await request(app)
            .post('/api/assets')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ type: 'bank', label: 'No Will' });
        expect(res.status).toBe(400);
    });
});

/* ══════════════════════════
   BENEFICIARIES
══════════════════════════ */
describe('Beneficiaries', () => {

    it('GET /beneficiaries/:willId → 200', async () => {
        const res = await request(app)
            .get(`/api/beneficiaries/${willId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
    });

    it('POST /beneficiaries add → 201', async () => {
        const res = await request(app)
            .post('/api/beneficiaries')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ will_id: willId, name: 'Ali Test', email: 'ali@test.com', relationship: 'friend' });
        expect(res.status).toBe(201);
    });

    it('POST /beneficiaries missing name → 400', async () => {
        const res = await request(app)
            .post('/api/beneficiaries')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ will_id: willId, email: 'x@x.com' });
        expect(res.status).toBe(400);
    });
});

/* ══════════════════════════
   CHECKIN
══════════════════════════ */
describe('Checkin', () => {

    it('POST /checkin → 200', async () => {
        const res = await request(app)
            .post('/api/checkin')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

/* ══════════════════════════
   ADMIN — unauthorised access
══════════════════════════ */
describe('Admin — role guard', () => {

    it('GET /admin/users as user → 403', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
    });

    it('GET /admin/stats as user → 403', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
    });

    it('GET /admin/logs as user → 403', async () => {
        const res = await request(app)
            .get('/api/admin/logs')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
    });
});

/* ══════════════════════════
   DEVELOPER — unauthorised access
══════════════════════════ */
describe('Developer — role guard', () => {

    it('GET /developer/users as user → 403', async () => {
        const res = await request(app)
            .get('/api/developer/users')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
    });

    it('GET /developer/stats as user → 403', async () => {
        const res = await request(app)
            .get('/api/developer/stats')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
    });
});

/* ══════════════════════════
   MANAGER — unauthorised access
══════════════════════════ */
describe('Manager — role guard', () => {

    it('GET /manager/documents as user → 403', async () => {
        const res = await request(app)
            .get('/api/manager/documents')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
    });
});

/* ══════════════════════════
   WILLS — DELETE (cleanup)
══════════════════════════ */
describe('Wills — delete', () => {

    it('DELETE /wills/:id → 200', async () => {
        const res = await request(app)
            .delete(`/api/wills/${willId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
    });
});
