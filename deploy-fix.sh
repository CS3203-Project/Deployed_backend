#!/bin/bash

# Backend Deployment Fix Script
# This script fixes the PM2 backend startup issues

echo "======================================"
echo "Backend Deployment Fix"
echo "======================================"

# Navigate to backend directory
cd ~/Deployed_backend || cd /home/ubuntu/Deployed_backend || {
    echo "Error: Cannot find backend directory"
    exit 1
}

echo "✓ Found backend directory: $(pwd)"

# Stop and remove the broken backend-dev process
echo ""
echo "Stopping broken backend-dev process..."
pm2 stop backend-dev 2>/dev/null || true
pm2 delete backend-dev 2>/dev/null || true
echo "✓ Cleaned up old processes"

# Pull latest code
echo ""
echo "Pulling latest code from git..."
git pull origin main
echo "✓ Code updated"

# Install/update dependencies
echo ""
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Build TypeScript code
echo ""
echo "Building TypeScript..."
npm run build
echo "✓ Build complete"

# Start backend in production mode
echo ""
echo "Starting backend in production mode..."
pm2 start ecosystem.config.cjs --only backend
echo "✓ Backend started"

# Save PM2 configuration
echo ""
echo "Saving PM2 configuration..."
pm2 save
echo "✓ PM2 configuration saved"

# Show status
echo ""
echo "======================================"
echo "PM2 Status:"
echo "======================================"
pm2 status

echo ""
echo "======================================"
echo "Recent Logs:"
echo "======================================"
pm2 logs backend --lines 30 --nostream

echo ""
echo "======================================"
echo "✓ Deployment complete!"
echo "======================================"
echo ""
echo "To monitor logs in real-time, run:"
echo "  pm2 logs backend"
echo ""
echo "To check status:"
echo "  pm2 status"
echo ""
