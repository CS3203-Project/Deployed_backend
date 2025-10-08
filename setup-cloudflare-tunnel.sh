#!/bin/bash

# Cloudflare Tunnel Setup
# This creates a secure tunnel from Cloudflare to your server
# No domain or SSL certificates needed on your server

echo "🌩️ Setting up Cloudflare Tunnel..."

# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

echo "📝 Next steps:"
echo "1. Login to Cloudflare: cloudflared tunnel login"
echo "2. Create tunnel: cloudflared tunnel create zia-api"
echo "3. Route tunnel: cloudflared tunnel route dns zia-api api.yourdomain.com"
echo "4. Run tunnel: cloudflared tunnel run zia-api"

echo "💡 Or use quick tunnel (temporary): cloudflared tunnel --url http://localhost:3001"

# Create service file for persistent tunnel
sudo tee /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:3001
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

echo "🚀 To start as service:"
echo "sudo systemctl enable cloudflared"
echo "sudo systemctl start cloudflared"