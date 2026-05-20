#!/bin/bash
# Run once in Terminal (will ask for your Mac password) to trust local HTTPS certs.
set -e
if ! command -v mkcert >/dev/null 2>&1; then
  echo "Install mkcert first: brew install mkcert"
  exit 1
fi
mkcert -install
echo ""
echo "✅ mkcert CA installed. Browsers should trust https://localhost now."
echo "   Regenerate app certs: cd backend && npm run ssl:generate"
