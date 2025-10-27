# Setup Guide - Juniper License & Asset Manager

This guide will help you get the Juniper License & Asset Manager up and running.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed
- Git

## Quick Start (Development)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd license-manager
```

### 2. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings (database, Observium, etc.)

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with initial user (optional)
# Create a seed file or use Prisma Studio to add first admin user

# Start backend server
npm run dev
```

The backend will start on http://localhost:3000

### 3. Set Up Frontend

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit if needed (default should work for local development)

# Start frontend development server
npm run dev
```

The frontend will start on http://localhost:5173

### 4. Create First Admin User

You need to create an admin user to login. You can use:

**Option A: Prisma Studio**
```bash
cd backend
npx prisma studio
```

Then manually create a user in the Users table with:
- email: admin@example.com
- password: (use bcrypt to hash, or use the API)
- role: ADMIN
- isActive: true

**Option B: Use API directly**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

### 5. Login

Go to http://localhost:5173/login and use your created credentials.

## Docker Setup (Alternative)

If you prefer using Docker:

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev

# View logs
docker-compose logs -f
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5432

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/license_manager"

# Server
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Observium Integration
OBSERVIUM_ENABLED=true
OBSERVIUM_URL=https://your-observium-server
OBSERVIUM_USERNAME=api-user
OBSERVIUM_PASSWORD=api-password
OBSERVIUM_SYNC_CRON=0 2 * * *

# Email Notifications (optional)
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
```

### Frontend Environment Variables

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Database Schema

The database schema is defined in `backend/prisma/schema.prisma`. Key tables:

- `users` - User accounts
- `hardware_models` - Juniper device models (catalog)
- `hardware_assets` - Actual device inventory
- `licenses` - Software licenses
- `maintenance_contracts` - Support contracts
- `asset_license_mappings` - Links assets to licenses
- `asset_contract_mappings` - Links assets to contracts
- `observium_sync_logs` - Sync activity history

## Observium Integration

To enable Observium sync:

1. Ensure you have Observium Subscription Edition (API access required)
2. Create an API user in Observium
3. Configure credentials in `backend/.env`
4. Set `OBSERVIUM_ENABLED=true`
5. Use the Sync page in the UI or wait for automatic sync

### Manual Sync

Via UI:
- Navigate to "Sync" page
- Click "Sync Now"

Via API:
```bash
curl -X POST http://localhost:3000/api/sync/observium \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Scheduled Jobs

The backend runs these scheduled jobs:

- **Observium Sync**: Daily at 2 AM (configurable via OBSERVIUM_SYNC_CRON)
- **Contract Alerts**: Daily at 8 AM (checks for expiring contracts/licenses)

## API Documentation

Once the backend is running, you can:

1. Import the API endpoints into Postman/Insomnia
2. View available endpoints in the route files: `backend/src/routes/*.routes.ts`

Key endpoints:
- `POST /api/auth/login` - Login
- `GET /api/assets` - List assets
- `GET /api/licenses` - List licenses
- `GET /api/contracts` - List contracts
- `POST /api/sync/observium` - Trigger manual sync
- `GET /api/dashboard/stats` - Dashboard statistics

## Troubleshooting

### Database Connection Error

Ensure PostgreSQL is running and credentials in `.env` are correct:
```bash
psql -U postgres -c "CREATE DATABASE license_manager;"
```

### Prisma Migration Error

Reset and re-run migrations:
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Observium Sync Fails

Check:
- Observium URL is accessible from backend
- Credentials are correct
- You have Subscription Edition (free edition doesn't have API)

### Frontend Can't Connect to Backend

Ensure:
- Backend is running on port 3000
- VITE_API_URL in frontend/.env is correct
- CORS is enabled (already configured in backend)

## Production Deployment

For production deployment:

1. Set strong JWT_SECRET
2. Use production database
3. Set NODE_ENV=production
4. Use reverse proxy (nginx) for frontend
5. Enable SSL/TLS
6. Configure proper backup strategy for database
7. Set up monitoring and logging

## Next Steps

After setup:

1. Configure hardware models (or they'll be auto-created during Observium sync)
2. Add maintenance contracts
3. Add software licenses
4. Link assets to contracts and licenses
5. Set up email notifications for expiring contracts

## Support

For issues or questions, refer to the main README.md or check the codebase documentation.
