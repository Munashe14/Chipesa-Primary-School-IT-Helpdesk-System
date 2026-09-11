@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

:: ============================================================
:: CONFIG - If your XAMPP is not installed at C:\xampp, change
:: this line to match your actual install path.
:: ============================================================
set "XAMPP_DIR=C:\xampp"
set "MYSQL_BIN=%XAMPP_DIR%\mysql\bin\mysql.exe"
set "MYSQLADMIN_BIN=%XAMPP_DIR%\mysql\bin\mysqladmin.exe"
set "XAMPP_START=%XAMPP_DIR%\xampp_start.exe"
set "XAMPP_CONTROL=%XAMPP_DIR%\xampp-control.exe"

echo ============================================
echo   IT Help Desk System - Launcher
echo ============================================
echo.

:: ------------------------------------------------------------
:: 1. Check XAMPP exists at the configured path
:: ------------------------------------------------------------
if not exist "%MYSQL_BIN%" (
    echo.
    echo ERROR: XAMPP was not found at %XAMPP_DIR%
    echo If you installed XAMPP somewhere else, edit the XAMPP_DIR
    echo line near the top of this file to match your actual path.
    echo Then run this file again.
    pause
    exit /b 1
)

:: ------------------------------------------------------------
:: 2. Check Node/npm exists
:: ------------------------------------------------------------
where npm >nul 2>nul
if errorlevel 1 (
    echo.
    echo ERROR: Node.js and npm were not found in PATH.
    echo Install Node.js first, then run this launcher again.
    pause
    exit /b 1
)

:: ------------------------------------------------------------
:: 3. Free port 5000 in case a previous Node process is stuck
:: ------------------------------------------------------------
echo Freeing port 5000 if it is already in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

:: ------------------------------------------------------------
:: 4. Install dependencies if missing
:: ------------------------------------------------------------
if not exist "%~dp0node_modules" (
    echo Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Root npm install failed. See output above.
        pause
        exit /b 1
    )
)

if not exist "%~dp0server\node_modules" (
    echo Installing server dependencies...
    pushd server
    call npm install
    if errorlevel 1 (
        echo ERROR: Server npm install failed. See output above.
        popd
        pause
        exit /b 1
    )
    popd
)

if not exist "%~dp0client\node_modules" (
    echo Installing client dependencies...
    pushd client
    call npm install
    if errorlevel 1 (
        echo ERROR: Client npm install failed. See output above.
        popd
        pause
        exit /b 1
    )
    popd
)

:: ------------------------------------------------------------
:: 5. Ensure server/.env exists (copy from example if missing)
:: ------------------------------------------------------------
if not exist "%~dp0server\.env" (
    if exist "%~dp0server\.env.example" (
        echo No server\.env found. Creating one from .env.example...
        copy "%~dp0server\.env.example" "%~dp0server\.env" >nul
        echo.
        echo IMPORTANT: server\.env was just created with default values.
        echo Review it and update DB credentials/JWT secret if needed.
        echo.
    ) else (
        echo.
        echo WARNING: server\.env is missing and no .env.example was found.
        echo The backend may fail to start without database configuration.
        echo.
    )
)

:: ------------------------------------------------------------
:: 6. Start XAMPP (Apache + MySQL)
:: ------------------------------------------------------------
echo.
echo Starting XAMPP MySQL and Apache...
if exist "%XAMPP_START%" (
    start "" "%XAMPP_START%"
) else if exist "%XAMPP_CONTROL%" (
    start "" "%XAMPP_CONTROL%"
) else (
    echo WARNING: XAMPP launcher not found. Please start XAMPP manually.
    echo Continuing anyway...
)

:: ------------------------------------------------------------
:: 7. Wait for MySQL to actually accept connections
:: (poll instead of a blind timeout, up to ~30s)
:: ------------------------------------------------------------
echo Waiting for MySQL to become ready...
set "MYSQL_READY="
for /l %%i in (1,1,15) do (
    "%MYSQLADMIN_BIN%" -u root ping >nul 2>nul
    if not errorlevel 1 (
        set "MYSQL_READY=1"
        goto :mysql_ready
    )
    timeout /t 2 /nobreak >nul
)

:mysql_ready
if not defined MYSQL_READY (
    echo.
    echo ERROR: MySQL did not become ready after 30 seconds.
    echo Open the XAMPP Control Panel and check the MySQL logs for details.
    echo Common cause: another MySQL process/service already using port 3306.
    pause
    exit /b 1
)
echo MySQL is ready.

:: ------------------------------------------------------------
:: 8. Create database + import schema/seed if not already set up
:: ------------------------------------------------------------
set "DB_EXISTS="
for /f %%i in ('%MYSQL_BIN% -u root -e "SHOW DATABASES;" 2^>nul ^| findstr /I /X "helpdesk_db"') do set "DB_EXISTS=1"

if not defined DB_EXISTS (
    if not exist "%~dp0database\schema.sql" (
        echo.
        echo ERROR: database\schema.sql not found. Cannot create the database.
        echo Make sure the database folder is present in the project.
        pause
        exit /b 1
    )

    echo Creating database from schema.sql...
    "%MYSQL_BIN%" -u root < "%~dp0database\schema.sql"
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to import schema.sql. Check the error above.
        pause
        exit /b 1
    )

    if exist "%~dp0database\seed.sql" (
        echo Seeding database from seed.sql...
        "%MYSQL_BIN%" -u root helpdesk_db < "%~dp0database\seed.sql"
        if errorlevel 1 (
            echo.
            echo WARNING: seed.sql import failed. Database schema was created
            echo but default users/data may be missing. Check the error above.
        ) else (
            echo Seed data imported successfully.
        )
    ) else (
        echo NOTE: No seed.sql found. Skipping seed data ^(no default users^).
    )

    echo Database setup complete.
) else (
    echo Database "helpdesk_db" already exists. Skipping database setup.
)

:: ------------------------------------------------------------
:: 9. Launch the app
:: ------------------------------------------------------------
echo.
echo Starting app...
start "" http://localhost:5173
call npm run dev

endlocal