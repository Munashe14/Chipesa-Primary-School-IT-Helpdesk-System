# How to Run This Project on Another Computer

## Requirements
- Windows 10 or 11
- XAMPP installed in `C:\xampp`
- Node.js and npm installed

## Steps
1. Copy the whole project folder to the new computer.
2. Install XAMPP if it is not already installed.
3. Start MySQL by running the launcher file:
   - Double-click `launch-app.bat`
4. The script will:
   - check for XAMPP
   - start XAMPP services
   - install npm dependencies if needed
   - create the `helpdesk_db` database if it does not exist
   - launch the backend and frontend
   - open the app in the browser

## Browser URL
- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health

## Important note
The app expects MySQL to use the default XAMPP root user with no password.
If your XAMPP installation uses a different MySQL password, update the database configuration in `server/config/database.js` before running the app.

## If you want the app to run again later
Just double-click `launch-app.bat` again. It will skip the database setup if the database already exists.
