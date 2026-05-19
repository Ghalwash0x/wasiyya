const passport      = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool           = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt         = require('bcrypt');

const findOrCreateOAuthUser = async (provider, profileId, email, fullName) => {
    // Try to find by oauth_provider + oauth_id
    let result = await pool.query(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
        [provider, profileId]
    );

    if (result.rows.length > 0) return result.rows[0];

    // Try to find by email (link existing account)
    if (email) {
        result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            await pool.query(
                'UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3',
                [provider, profileId, user.id]
            );
            return { ...user, oauth_provider: provider, oauth_id: profileId };
        }
    }

    // Create new user
    const id           = uuidv4();
    const randomPass   = await bcrypt.hash(uuidv4(), 12); // unusable password
    const userEmail    = email || `${provider}_${profileId}@oauth.wasiyya`;

    await pool.query(
        `INSERT INTO users (id, full_name, email, password, role, oauth_provider, oauth_id)
         VALUES ($1, $2, $3, $4, 'user', $5, $6)`,
        [id, fullName, userEmail, randomPass, provider, profileId]
    );

    await pool.query(
        'INSERT INTO audit_logs (id, user_id, action) VALUES ($1, $2, $3)',
        [uuidv4(), id, `OAUTH_REGISTER_${provider.toUpperCase()}`]
    );

    result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

// Only register strategies if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
    passport.use(new GoogleStrategy(
        {
            clientID:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email    = profile.emails?.[0]?.value;
                const fullName = profile.displayName || email;
                const user     = await findOrCreateOAuthUser('google', profile.id, email, fullName);
                done(null, user);
            } catch (err) {
                done(err);
            }
        }
    ));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id') {
    passport.use(new GitHubStrategy(
        {
            clientID:     process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/github/callback`,
            scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email    = profile.emails?.[0]?.value;
                const fullName = profile.displayName || profile.username;
                const user     = await findOrCreateOAuthUser('github', profile.id, email, fullName);
                done(null, user);
            } catch (err) {
                done(err);
            }
        }
    ));
}

// Stateless — no session serialization needed
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;
