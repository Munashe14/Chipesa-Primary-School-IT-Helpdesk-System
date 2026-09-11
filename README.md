<<<<<<< HEAD
# Chipesa-Primary-School-IT-Helpdesk-System
A web-based IT ticketing and helpdesk system designed for Chipesa Primary School to streamline technical support, manage classroom hardware requests, and track school software issues for teachers and staff.
=======
# IT Help Desk System

A comprehensive, production-ready IT fault reporting and management system for Chipesa Primary School in Zimbabwe.

## Features

- **Role-Based Access Control**: Staff, IT Technician, Administrator, and School Management roles
- **Ticket Management**: Create, track, assign, and resolve IT fault tickets
- **Dashboard Analytics**: Role-specific dashboards with charts and statistics
- **Notifications**: Real-time notifications for ticket events
- **Reports**: Generate and export reports (PDF, Excel)
- **File Uploads**: Attach screenshots to tickets
- **Search & Filtering**: Advanced search and filter capabilities
- **Complete History**: Track all ticket changes and repairs

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Recharts
- Zod

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcrypt
- Multer
- Joi

## Installation

1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install-all
   ```

3. Set up MySQL database:
   - Create a MySQL database named `helpdesk_db`
   - Run the schema file: `database/schema.sql`
   - Run the seed file: `database/seed.sql`

4. Configure environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Update database credentials and JWT secret

5. Start the development servers:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Default Users

After running the seed script, the following users will be available:

**Administrator:**
- Email: admin@chipesa.school.zw
- Password: Admin@123

**IT Technician:**
- Email: technician@chipesa.school.zw
- Password: Tech@123

**Staff User:**
- Email: staff@chipesa.school.zw
- Password: Staff@123

**School Management:**
- Email: management@chipesa.school.zw
- Password: Manage@123

## Project Structure

```
it-help-desk-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── layouts/        # Layout components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── routes/         # Route configuration
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Express backend
│   ├── controllers/        # Route controllers
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── config/             # Configuration files
│   ├── services/           # Business logic
│   ├── uploads/            # File uploads
│   └── utils/              # Utility functions
├── database/               # Database files
│   ├── schema.sql          # Database schema
│   └── seed.sql            # Seed data
└── package.json
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password

### User Endpoints

- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/disable` - Disable user (Admin)

### Ticket Endpoints

- `GET /api/tickets` - Get all tickets (filtered by role)
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `PUT /api/tickets/:id/assign` - Assign technician
- `PUT /api/tickets/:id/status` - Update status
- `POST /api/tickets/:id/comments` - Add comment
- `GET /api/tickets/:id/history` - Get ticket history

### Dashboard Endpoints

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/charts` - Get chart data

### Report Endpoints

- `GET /api/reports/tickets` - Generate ticket report
- `GET /api/reports/performance` - Generate performance report
- `GET /api/reports/export/pdf` - Export to PDF
- `GET /api/reports/export/excel` - Export to Excel

### Notification Endpoints

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-Based Access Control (RBAC)
- Input validation with Zod/Joi
- SQL injection protection
- XSS protection
- CSRF protection
- Session management

## License

MIT
>>>>>>> c7a21be (Initial commit - Chipesa Primary School IT Helpdesk System)
