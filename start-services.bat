@echo off
echo ========================================
echo Starting LangSearch with LangExtract
echo ========================================
echo.

echo Starting Python LangExtract service...
start cmd /k "cd python-backend && set GEMINI_API_KEY=%GEMINI_API_KEY% && python langextract_service.py"

echo Waiting for Python service to start...
timeout /t 3 /nobreak > nul

echo Starting Next.js application...
start cmd /k "npm run dev"

echo.
echo ========================================
echo Services are starting...
echo.
echo Python LangExtract service: http://localhost:5000
echo Next.js application: http://localhost:3000
echo.
echo Both services should be running now.
echo Open http://localhost:3000 in your browser.
echo ========================================
pause
