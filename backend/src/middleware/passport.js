const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool           = require('../config/database');

// OAuth login is find-only — no auto-registration.
// User must have an existing account (registered via email) to use OAuth.
const findOAuthUser = async (provider, profileId, email) => {
    // Already linked to this OAuth provider
    let result = await pool.query(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
        [provider, profileId]
    );
    if (result.rows.length > 0) return result.rows[0];

    // Link by email if account exists — then return it
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

    // No matching account — reject
    return null;
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
                const email = profile.emails?.[0]?.value;
                const user  = await findOAuthUser('google', profile.id, email);
                if (!user) return done(null, false);
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
                const email = profile.emails?.[0]?.value;
                const user  = await findOAuthUser('github', profile.id, email);
                if (!user) return done(null, false);
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
