@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   IT Help Desk System - Launcher
echo ============================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js and npm were not found in PATH.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
    if errorlevel 1 goto :install_failed
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    pushd server
    call npm install
    if errorlevel 1 (
        popd
        goto :install_failed
    )
    popd
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    pushd client
    call npm install
    if errorlevel 1 (
        popd
        goto :install_failed
    )
    popd
)

if not exist "server\.env" (
    copy "server\.env.example" "server\.env" >nul
    echo Created server\.env. Replace the example JWT_SECRET with a long random value.
)

echo Starting the application. SQLite will initialize automatically on first run.
start "" http://localhost:5173
call npm run dev
goto :end

:install_failed
echo ERROR: Dependency installation failed.
pause

:end
endlocal
