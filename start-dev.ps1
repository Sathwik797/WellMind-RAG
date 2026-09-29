# eRTMAC-NWIS Startup Script for Windows (PowerShell)
# SIH26121 - Nearby Wells Intelligence System

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   eRTMAC-NWIS : Nearby Wells Intelligence System        " -ForegroundColor Cyan
Write-Host "                 Oil India Limited - SIH26121             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$ROOT_DIR = $PSScriptRoot
if (-not $ROOT_DIR) { $ROOT_DIR = Get-Location }

$VENV_PY = Join-Path $ROOT_DIR ".venv\Scripts\python.exe"
if (-not (Test-Path $VENV_PY)) {
    Write-Host "[ERROR] Python virtual environment not found at: $VENV_PY" -ForegroundColor Red
    Write-Host "Please create .venv and install dependencies first." -ForegroundColor Yellow
    exit 1
}

# 1. MongoDB Health / Detection
Write-Host "[1/5] Checking MongoDB availability..." -ForegroundColor Yellow
$mongoPortOpen = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $iar = $tcp.BeginConnect("127.0.0.1", 27017, $null, $null)
    $success = $iar.AsyncWaitHandle.WaitOne(1500, $false)
    if ($success -and $tcp.Connected) {
        $tcp.EndConnect($iar)
        $mongoPortOpen = $true
    }
    $tcp.Close()
} catch {
    $mongoPortOpen = $false
}

if ($mongoPortOpen) {
    Write-Host "  -> Local MongoDB is running on port 27017." -ForegroundColor Green
} else {
    Write-Host "  -> Local MongoDB port 27017 is not open." -ForegroundColor DarkYellow
    Write-Host "     If using MongoDB Atlas, ensure backend/.env contains your MONGO_URI." -ForegroundColor Gray
    Write-Host "     To seed data when MongoDB is running: cd backend; npm run seed" -ForegroundColor Gray
}

# Helper to check HTTP health
function WaitFor-Health([string]$name, [string]$url, [int]$maxAttempts = 30) {
    Write-Host "  Waiting for $name ($url)..." -NoNewline -ForegroundColor Gray
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 2 -ErrorAction Stop
            Write-Host " OK" -ForegroundColor Green
            return $true
        } catch {
            Start-Sleep -Seconds 1
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    Write-Host " TIMEOUT (service may still be initializing)" -ForegroundColor Yellow
    return $false
}

# 2. Start ML Service (Port 8000)
Write-Host ""
Write-Host "[2/5] Starting ML Service (XGBoost + SHAP) on http://localhost:8000..." -ForegroundColor Yellow
$mlCmd = "cd '$ROOT_DIR\ml-service'; & '$VENV_PY' -m uvicorn app:app --host 127.0.0.1 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$mlCmd" -WindowStyle Normal

# 3. Start WellMind RAG Service (Port 8001)
Write-Host "[3/5] Starting WellMind Service (RAG + Qdrant) on http://localhost:8001..." -ForegroundColor Yellow
$wellCmd = "cd '$ROOT_DIR\wellMind'; & '$VENV_PY' -m uvicorn app:app --host 127.0.0.1 --port 8001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$wellCmd" -WindowStyle Normal

# 4. Start Backend (Port 5000)
Write-Host "[4/5] Starting Backend (Node.js + Express + Socket.io) on http://localhost:5000..." -ForegroundColor Yellow
$backendCmd = "cd '$ROOT_DIR\backend'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$backendCmd" -WindowStyle Normal

# 5. Start Frontend (Port 5173)
Write-Host "[5/5] Starting Frontend (React + Vite) on http://localhost:5173..." -ForegroundColor Yellow
$frontendCmd = "cd '$ROOT_DIR\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$frontendCmd" -WindowStyle Normal

Write-Host ""
Write-Host "Checking service health..." -ForegroundColor Cyan
WaitFor-Health "ML Service" "http://127.0.0.1:8000/health" 25
WaitFor-Health "WellMind" "http://127.0.0.1:8001/health" 25
WaitFor-Health "Backend" "http://127.0.0.1:5000/health" 25

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  All eRTMAC-NWIS services launched successfully!         " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  [1] Backend API      : http://localhost:5000" -ForegroundColor White
Write-Host "  [2] ML Service       : http://localhost:8000" -ForegroundColor White
Write-Host "  [3] WellMind RAG     : http://localhost:8001" -ForegroundColor White
Write-Host "  [4] Frontend UI      : http://localhost:5173" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Default Login Accounts:" -ForegroundColor Cyan
Write-Host "  Field Role  -> Employee ID: EMP001 | Password: password123" -ForegroundColor White
Write-Host "  Office Role -> Employee ID: EMP002 | Password: password123" -ForegroundColor White
Write-Host ""

Start-Process "http://localhost:5173"
