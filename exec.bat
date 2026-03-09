@echo off
title Deploy Backend and Frontend

:: ========================
:: Start Backend
:: ========================
echo Starting Backend...
cd backend

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Run FastAPI backend with uvicorn in a separate window
start "Backend" cmd /k "uvicorn main:app --reload --host 127.0.0.1 --port 8000"

:: Go back to root folder for frontend
cd ..

:: ========================
:: Start Frontend
:: ========================
echo Starting Frontend...
:: Run npm dev server in a separate window
start "Frontend" cmd /k "npm run dev"

:: Wait a few seconds for frontend to start, then open in browser
timeout /t 5 >nul
start http://localhost:5173

echo Deployment complete!
pause