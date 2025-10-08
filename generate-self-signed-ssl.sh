#!/bin/bash

# Generate self-signed SSL certificates for testing
# WARNING: Self-signed certificates will show security warnings in browsers
# Use only for development/testing

echo "🔐 Generating self-signed SSL certificates..."

# Create certificates directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/private.key 2048

# Generate certificate
openssl req -new -x509 -key ssl/private.key -out ssl/certificate.crt -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=16.16.169.133"

echo "✅ SSL certificates generated in ./ssl/ directory"
echo "📝 Update your .env file with:"
echo "SSL_KEY_PATH=$(pwd)/ssl/private.key"
echo "SSL_CERT_PATH=$(pwd)/ssl/certificate.crt"

# Update .env file automatically
if [ -f .env ]; then
    sed -i 's|# SSL_KEY_PATH=.*|SSL_KEY_PATH='$(pwd)'/ssl/private.key|' .env
    sed -i 's|# SSL_CERT_PATH=.*|SSL_CERT_PATH='$(pwd)'/ssl/certificate.crt|' .env
    echo "✅ .env file updated"
else
    echo "⚠️ .env file not found. Please update manually."
fi

echo "🚀 Restart your Node.js server to use HTTPS on port 3443"