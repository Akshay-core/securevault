# setup.ps1 - SecureVault first-time setup
# Run from: securevault\ folder

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $Root "server"
$ClientDir = Join-Path $Root "client"

Write-Host ""
Write-Host "  SecureVault - First-time Setup" -ForegroundColor Cyan
Write-Host ""

# Check Node
Write-Host "  Checking Node.js..." -ForegroundColor White
try {
    $NodeVersion = node --version 2>&1
    Write-Host "  Node $NodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "  Checking Python..." -ForegroundColor White
try {
    $PyVersion = python --version 2>&1
    Write-Host "  $PyVersion found" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Python not found. Install from https://python.org" -ForegroundColor Red
    exit 1
}

# Backend venv + deps
Write-Host ""
Write-Host "  [1/3] Setting up Python virtual environment..." -ForegroundColor White

Set-Location $ServerDir

if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "  venv created" -ForegroundColor Green
} else {
    Write-Host "  venv already exists, skipping" -ForegroundColor DarkGray
}

Write-Host "  Installing Python dependencies..." -ForegroundColor White
& "venv\Scripts\pip.exe" install -r requirements.txt --quiet
Write-Host "  Python deps installed" -ForegroundColor Green

# Copy .env if missing
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  .env created from .env.example" -ForegroundColor Green
} else {
    Write-Host "  .env already exists" -ForegroundColor DarkGray
}

# Frontend npm install
Write-Host ""
Write-Host "  [2/3] Installing Node dependencies..." -ForegroundColor White

Set-Location $ClientDir
npm install --silent
Write-Host "  Node deps installed" -ForegroundColor Green

# Done
Set-Location $Root
Write-Host ""
Write-Host "  [3/3] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Run .\start.ps1 to launch SecureVault" -ForegroundColor Cyan
Write-Host ""