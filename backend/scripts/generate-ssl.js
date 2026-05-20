#!/usr/bin/env node
/**
 * Generate trusted local TLS certs (mkcert) or fallback to OpenSSL self-signed.
 * Output: backend/certs/server.cert + server.key
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '../certs');
const certPath = path.join(certsDir, 'server.cert');
const keyPath = path.join(certsDir, 'server.key');

const hosts = ['localhost', '127.0.0.1', '::1'];

function hasMkcert() {
    try {
        execSync('mkcert -version', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

function mkcertCaInstalled() {
    try {
        const caroot = execSync('mkcert -CAROOT', { encoding: 'utf8' }).trim();
        return fs.existsSync(path.join(caroot, 'rootCA.pem'));
    } catch {
        return false;
    }
}

function generateMkcert() {
    if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
    const args = [
        '-key-file', keyPath,
        '-cert-file', certPath,
        ...hosts,
    ];
    const r = spawnSync('mkcert', args, { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status || 1);
}

function generateOpenssl() {
    if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
    const subj = '/CN=localhost';
    const san = 'subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1';
    execSync(
        `openssl req -x509 -newkey rsa:2048 -nodes ` +
        `-keyout "${keyPath}" -out "${certPath}" -days 825 ` +
        `-subj "${subj}" -addext "${san}"`,
        { stdio: 'inherit' }
    );
}

function main() {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const stat = fs.statSync(certPath);
        const ageDays = (Date.now() - stat.mtimeMs) / 86400000;
        if (process.argv.includes('--force')) {
            fs.unlinkSync(certPath);
            fs.unlinkSync(keyPath);
        } else {
            console.log('✅ SSL certs already exist:', certPath);
            if (hasMkcert() && !mkcertCaInstalled()) {
                console.log('⚠️  mkcert CA not installed — run: npm run ssl:trust');
            }
            return;
        }
    }

    if (process.argv.includes('--openssl')) {
        console.log('🔐 Generating OpenSSL self-signed certificate');
        generateOpenssl();
        console.log('✅ Created:', certPath, keyPath);
        console.log('⚠️  Browsers will NOT trust this without mkcert or Let\'s Encrypt (see docs/SSL.md)');
        return;
    }

    if (hasMkcert()) {
        console.log('🔐 Generating mkcert certificate for', hosts.join(', '));
        generateMkcert();
        console.log('✅ Created:', certPath, keyPath);
        if (!mkcertCaInstalled()) {
            console.log('');
            console.log('⚠️  Trust the local CA (one time, needs Mac password):');
            console.log('   npm run ssl:trust');
            console.log('   or: ./scripts/install-mkcert-ca.sh');
        } else {
            console.log('✅ mkcert CA is present — restart backend/frontend if they were running.');
        }
    } else {
        console.log('⚠️  mkcert not found — using OpenSSL self-signed (browser warning).');
        console.log('   Install: brew install mkcert && npm run ssl:trust && npm run ssl:generate -- --force');
        generateOpenssl();
        console.log('✅ Created:', certPath, keyPath);
    }

    console.log('');
    console.log('Use in .env: USE_HTTPS=true, FRONTEND_URL=https://localhost:3000, BACKEND_URL=https://localhost:3001');
}

main();
