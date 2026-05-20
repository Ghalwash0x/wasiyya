#!/bin/bash
# OpenSSL self-signed cert for localhost (browsers will NOT trust without manual exception).
set -e
DIR="$(cd "$(dirname "$0")/../certs" && pwd)"
mkdir -p "$DIR"
CERT="$DIR/server.cert"
KEY="$DIR/server.key"

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$KEY" -out "$CERT" -days 825 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"

echo "✅ OpenSSL cert: $CERT"
echo "⚠️  Chrome will show NET::ERR_CERT_AUTHORITY_INVALID until you:"
echo "   - use mkcert instead: npm run ssl:trust && npm run ssl:generate -- --force"
echo "   - or Advanced → Proceed to localhost (dev only)"
