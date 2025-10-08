#!/bin/bash

# SSL Setup Script for Ubuntu/Debian servers
# Run this on your backend server (16.16.169.133)

echo "🔒 Setting up SSL certificates with Let's Encrypt..."

# Update system
sudo apt update

# Install nginx (if not already installed)
sudo apt install -y nginx

# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Create nginx configuration for your domain
# Replace 'your-domain.com' with your actual domain
DOMAIN="api.zia-app.com"  # You'll need to set up this domain to point to 16.16.169.133

sudo tee /etc/nginx/sites-available/zia-api << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/zia-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "📝 Now you need to:"
echo "1. Point your domain '$DOMAIN' to IP 16.16.169.133 in your DNS settings"
echo "2. Wait a few minutes for DNS to propagate"
echo "3. Run: sudo certbot --nginx -d $DOMAIN"
echo "4. Update your frontend to use https://$DOMAIN instead of http://16.16.169.133"

echo "🚀 After DNS propagation, run this to get SSL certificate:"
echo "sudo certbot --nginx -d $DOMAIN"