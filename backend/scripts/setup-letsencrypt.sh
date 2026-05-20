#!/bin/bash
# Production: free globally-trusted certificate (Let's Encrypt).
# Usage: ./scripts/setup-letsencrypt.sh yourdomain.com admin@yourdomain.com
set -e

DOMAIN="${1:?Usage: $0 domain.com email@example.com}"
EMAIL="${2:?Usage: $0 domain.com email@example.com}"

if ! command -v certbot >/dev/null 2>&1; then
  echo "Install certbot: brew install certbot"
  exit 1
fi

echo "Issuing certificate for: $DOMAIN (and www.$DOMAIN)"
echo "Stop anything using port 80 during this step."
sudo certbot certonly --standalone \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive || certbot certonly --standalone \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos

LIVE="/etc/letsencrypt/live/$DOMAIN"
echo ""
echo "✅ Certificate issued. Add to backend/.env on the server:"
echo ""
echo "USE_HTTPS=true"
echo "DOMAIN=$DOMAIN"
echo "FRONTEND_URL=https://$DOMAIN"
echo "BACKEND_URL=https://$DOMAIN"
echo "SSL_CERT_PATH=$LIVE/fullchain.pem"
echo "SSL_KEY_PATH=$LIVE/privkey.pem"
echo ""
echo "Renewal: sudo certbot renew (add to cron)"
