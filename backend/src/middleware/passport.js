const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool           = require('../config/database');

const findOAuthUser = async (provider, profileId, email) => {
    let result = await pool.query(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
        [provider, profileId]
    );
    if (result.rows.length > 0) return result.rows[0];

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

    return null;
};

const toOAuthProfile = (provider, profile) => {
    const email = (profile.emails?.[0]?.value || '').trim().toLowerCase();
    const full_name = profile.displayName
        || profile.username
        || profile.name?.givenName
        || (email ? email.split('@')[0] : 'User');

    return { provider, oauth_id: profile.id, email, full_name };
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
    passport.use(new GoogleStrategy(
        {
            clientID:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                done(null, toOAuthProfile('google', profile));
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
                done(null, toOAuthProfile('github', profile));
            } catch (err) {
                done(err);
            }
        }
    ));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;
module.exports.findOAuthUser = findOAuthUser;
