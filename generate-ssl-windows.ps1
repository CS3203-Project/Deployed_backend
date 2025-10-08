# PowerShell script to generate self-signed SSL certificates
# Run this in PowerShell as Administrator

Write-Host "🔐 Generating self-signed SSL certificates..." -ForegroundColor Green

# Create ssl directory
if (!(Test-Path "ssl")) {
    New-Item -ItemType Directory -Path "ssl"
}

# Generate self-signed certificate
$cert = New-SelfSignedCertificate -DnsName "16.16.169.133", "localhost" -CertStoreLocation "cert:\LocalMachine\My" -KeyLength 2048 -NotAfter (Get-Date).AddYears(1)

# Export certificate and private key
$certPath = Join-Path (Get-Location) "ssl\certificate.crt"
$keyPath = Join-Path (Get-Location) "ssl\private.key"

# Export certificate
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes($certPath, $certBytes)

# Export private key (requires additional steps in PowerShell)
# For simplicity, we'll use OpenSSL if available, otherwise manual steps needed

Write-Host "✅ Certificate generated at: $certPath" -ForegroundColor Green
Write-Host "📝 Private key location: $keyPath" -ForegroundColor Yellow
Write-Host "⚠️  For private key export, you may need OpenSSL or manual certificate export" -ForegroundColor Yellow

Write-Host "🚀 Your .env is already configured to use these certificates" -ForegroundColor Green
Write-Host "💡 Restart your Node.js server to enable HTTPS on port 3443" -ForegroundColor Cyan

# Instructions for manual private key export
Write-Host "`n📋 If you need to export private key manually:" -ForegroundColor Yellow
Write-Host "1. Run 'certmgr.msc'" -ForegroundColor White
Write-Host "2. Go to Personal > Certificates" -ForegroundColor White
Write-Host "3. Find your certificate and right-click > All Tasks > Export" -ForegroundColor White
Write-Host "4. Choose 'Yes, export the private key' and save as .pfx" -ForegroundColor White
Write-Host "5. Convert .pfx to .key using OpenSSL" -ForegroundColor White