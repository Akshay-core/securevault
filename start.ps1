# start.ps1 - SecureVault dev launcher
# Run from: securevault\ folder

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $Root "server"
$ClientDir = Join-Path $Root "client"

$VenvPython = Join-Path $ServerDir "venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
} else {
    $PythonExe = "python"
}

Write-Host ""
Write-Host "  SecureVault - Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend in new window
$BackendCmd = "Set-Location '$ServerDir'; Write-Host 'Backend: http://localhost:8000' -ForegroundColor Green; & '$PythonExe' main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd -WindowStyle Normal

Start-Sleep -Seconds 2

# Start frontend in new window
$FrontendCmd = "Set-Location '$ClientDir'; Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Cyan; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd -WindowStyle Normal

Write-Host "  Frontend  ->  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend   ->  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs  ->  http://localhost:8000/docs" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Close the two new windows to stop." -ForegroundColor DarkGray