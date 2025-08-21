@echo off
echo ========================================
echo Setting up LangSearch with LangExtract
echo ========================================
echo.

echo Step 1: Installing Python dependencies...
cd python-backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing Python dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Step 2: Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing Node dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup complete!
echo.
echo IMPORTANT: Before running, make sure to:
echo 1. Copy .env.local.example to .env.local
echo 2. Add your LANGSEARCH_API_KEY to .env.local
echo 3. Add your GEMINI_API_KEY to .env.local
echo.
echo To run the application:
echo 1. Run start-services.bat
echo 2. Open http://localhost:3000 in your browser
echo ========================================
pause
