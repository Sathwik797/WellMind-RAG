@echo off
title eRTMAC-NWIS Startup Launcher
echo ==========================================================
echo    eRTMAC-NWIS : Nearby Wells Intelligence System
echo                  Oil India Limited - SIH26121
echo ==========================================================
echo.

set ROOT_DIR=%~dp0
set VENV_PY=%ROOT_DIR%.venv\Scripts\python.exe

if not exist "%VENV_PY%" (
    echo [ERROR] Python virtual environment not found at: %VENV_PY%
    echo Please create .venv first.
    pause
    exit /b 1
)

echo Starting ML Service (XGBoost + SHAP) on port 8000...
start "eRTMAC ML Service :8000" cmd /k "cd /d %ROOT_DIR%ml-service && "%VENV_PY%" -m uvicorn app:app --host 127.0.0.1 --port 8000"

echo Starting WellMind Service (RAG + Qdrant) on port 8001...
start "eRTMAC WellMind RAG :8001" cmd /k "cd /d %ROOT_DIR%wellMind && "%VENV_PY%" -m uvicorn app:app --host 127.0.0.1 --port 8001"

echo Starting Backend (Node.js + Express) on port 5000...
start "eRTMAC Backend :5000" cmd /k "cd /d %ROOT_DIR%backend && npm start"

echo Starting Frontend (React + Vite) on port 5173...
start "eRTMAC Frontend :5173" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

echo.
echo ==========================================================
echo  All 4 services started in dedicated windows.
echo  [1] Backend API      : http://localhost:5000
echo  [2] ML Service       : http://localhost:8000
echo  [3] WellMind RAG     : http://localhost:8001
echo  [4] Frontend UI      : http://localhost:5173
echo ==========================================================
echo.
echo Opening browser...
start http://localhost:5173
