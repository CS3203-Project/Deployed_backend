# Deploy Nginx Configuration to AWS EC2

## Your Server Details
- **IP Address:** 16.16.169.133
- **Access URL:** http://16.16.169.133/

## Step-by-Step Deployment

### 1. Connect to Your EC2 Instance
```bash
# SSH into your server
ssh ubuntu@16.16.169.133

# If using a PEM key
ssh -i /path/to/your-key.pem ubuntu@16.16.169.133
```

### 2. Upload the Nginx Configuration

**Option A: Copy-Paste Method (Easiest)**
```bash
# On the server, backup existing config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d)

# Edit the config file
sudo nano /etc/nginx/sites-available/default
```

Then copy and paste the entire content from `nginx.conf` file.

**Option B: SCP Upload**
```bash
# From your Windows PowerShell (local machine)
scp -i "path\to\your-key.pem" "c:\Users\umesh\OneDrive\Desktop\New folder\Deployed_backend\nginx.conf" ubuntu@16.16.169.133:/tmp/nginx.conf

# Then on the server
ssh ubuntu@16.16.169.133
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/default
```

### 3. Test and Apply Configuration
```bash
# Test nginx configuration
sudo nginx -t

# Should output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Reload Nginx
```bash
# If test passed, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

### 5. Verify PM2 Backend is Running
```bash
# Check PM2 processes
pm2 list

# Should show 'backend' running

# Test backend directly
curl http://localhost:3000/health

# Should return: {"status":"healthy",...}
```

### 6. Test Through Nginx
```bash
# Test API endpoint
curl http://localhost/api/health

# Or from public IP
curl http://16.16.169.133/api/health

# Should return: {"status":"healthy",...}
```

## Quick Test Commands

### From your local machine (Windows PowerShell):
```powershell
# Test if server is accessible
curl http://16.16.169.133/

# Test API health endpoint
curl http://16.16.169.133/api/health

# Test a real API endpoint (example)
curl http://16.16.169.133/api/users
```

### On the server:
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check PM2 logs
pm2 logs backend --lines 50

# Check what's listening on port 80
sudo netstat -tulpn | grep :80

# Check what's listening on port 3000
sudo netstat -tulpn | grep :3000
```

## AWS Security Group Configuration

Make sure your EC2 Security Group allows:
- **Port 80** (HTTP) - Inbound from 0.0.0.0/0
- **Port 443** (HTTPS) - Inbound from 0.0.0.0/0 (for future SSL)
- **Port 22** (SSH) - Inbound from your IP only

### Check Security Group:
1. Go to AWS Console → EC2
2. Select your instance
3. Click on "Security" tab
4. Check "Security groups"
5. Edit inbound rules if needed

## Troubleshooting

### Issue: Connection Refused
```bash
# Check if nginx is running
sudo systemctl status nginx

# Start nginx if not running
sudo systemctl start nginx

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
```

### Issue: Still Getting 403 Forbidden
```bash
# Check nginx error logs
sudo tail -30 /var/log/nginx/error.log

# Check file permissions
ls -la /var/www/html

# Check nginx user
ps aux | grep nginx

# Make sure backend is running
pm2 list
pm2 restart backend
```

### Issue: Backend Not Running
```bash
# Check PM2 status
pm2 list

# If not running, start it
cd ~/actions-runner/_work/Deployed_backend/Deployed_backend
npm run build
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs backend
```

### Issue: Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if .env has correct DATABASE_URL
cat .env | grep DATABASE_URL
```

## Complete Health Check Script

Create this script on your server:

```bash
# Create health check script
cat > ~/check-backend.sh << 'EOF'
#!/bin/bash
echo "=== Backend Health Check ==="
echo ""
echo "1. Nginx Status:"
sudo systemctl status nginx --no-pager | head -5
echo ""
echo "2. PM2 Processes:"
pm2 list
echo ""
echo "3. Backend Direct Test:"
curl -s http://localhost:3000/health | jq '.' || echo "Backend not responding"
echo ""
echo "4. Nginx Proxy Test:"
curl -s http://localhost/api/health | jq '.' || echo "Nginx proxy not working"
echo ""
echo "5. Public IP Test:"
curl -s http://16.16.169.133/api/health | jq '.' || echo "Public access not working"
echo ""
echo "6. Recent Nginx Errors:"
sudo tail -5 /var/log/nginx/error.log
EOF

chmod +x ~/check-backend.sh
```

Run it:
```bash
./check-backend.sh
```

## Expected Results After Configuration

### ✅ Successful Setup:
- `http://16.16.169.133/` → Shows default nginx page or frontend
- `http://16.16.169.133/api/health` → Returns `{"status":"healthy",...}`
- `http://16.16.169.133/api/users` → Returns users API response
- No 403 Forbidden errors
- PM2 shows backend running with 0 restarts

### 📊 Monitoring:
```bash
# Real-time monitoring
pm2 monit

# Or watch logs
pm2 logs backend --lines 100 --timestamp
```

## Next Steps After Success

1. **Setup SSL/HTTPS:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

2. **Setup PM2 Auto-Startup:**
```bash
pm2 startup
pm2 save
```

3. **Configure Log Rotation:**
```bash
pm2 install pm2-logrotate
```

4. **Setup Monitoring:**
```bash
pm2 install pm2-server-monit
```

## Support

If you encounter issues:
1. Check nginx error log: `sudo tail -f /var/log/nginx/error.log`
2. Check PM2 logs: `pm2 logs backend`
3. Run health check script: `./check-backend.sh`
4. Verify Security Group allows port 80
5. Verify backend is running: `pm2 list`

Your backend should now be accessible at: **http://16.16.169.133/** 🚀
