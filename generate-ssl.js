const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Generating self-signed SSL certificates...');

// Create ssl directory
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

const keyPath = path.join(sslDir, 'private.key');
const certPath = path.join(sslDir, 'certificate.crt');

try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=16.16.169.133"`, { stdio: 'inherit' });
    
    console.log('✅ SSL certificates generated successfully!');
    console.log(`📄 Certificate: ${certPath}`);
    console.log(`🔑 Private key: ${keyPath}`);
    console.log('🚀 Restart your server to enable HTTPS on port 3443');
    
} catch (error) {
    console.error('❌ Error generating certificates:', error.message);
    console.log('💡 You may need to install OpenSSL first');
    console.log('📝 Alternative: Use one of the cloud solutions (Cloudflare Tunnel, etc.)');
}