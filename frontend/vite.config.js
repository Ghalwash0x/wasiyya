import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certDir = path.resolve(__dirname, '../backend/certs');
const certFile = path.join(certDir, 'server.cert');
const keyFile = path.join(certDir, 'server.key');
const useHttps = process.env.VITE_HTTPS === 'true' || (
    fs.existsSync(certFile) && fs.existsSync(keyFile)
);

const httpsOpts = useHttps
    ? { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }
    : false;

const apiTarget = useHttps ? 'https://127.0.0.1:3001' : 'http://127.0.0.1:3001';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        https: httpsOpts,
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
            },
        },
    },
    preview: {
        port: 3000,
        https: httpsOpts,
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
