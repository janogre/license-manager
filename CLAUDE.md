# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NEAS License Manager** (formerly Juniper License & Asset Manager) is a comprehensive asset and license management system for Juniper Networks hardware, software licenses, and maintenance contracts. The project integrates with Observium for device discovery and Netbox for DCIM/rack visualization.

## Technology Stack

- **Backend**: Node.js + Express + TypeScript, PostgreSQL with Prisma ORM, JWT authentication
- **Frontend**: React 18 + TypeScript, Vite build tool, Tailwind CSS + shadcn/ui, TanStack Query & Table
- **Key Integrations**: Observium (device discovery), Netbox (DCIM/rack elevation), Juniper API (optional)

## Development Commands

### Backend (in `backend/` directory)

```bash
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production server
npm run prisma:generate  # Generate Prisma Client after schema changes
npm run prisma:migrate   # Create and apply database migrations
npm run prisma:studio    # Open Prisma Studio database GUI
npm run prisma:seed      # Seed database with sample data
```

### Frontend (in `frontend/` directory)

```bash
npm run dev      # Start Vite dev server (default: http://localhost:5173)
npm run build    # Build for production (runs tsc + vite build)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

### Database Setup

1. Copy `backend/.env.example` to `backend/.env` and configure `DATABASE_URL`
2. Run migrations: `cd backend && npm run prisma:migrate`
3. (Optional) Seed data: `npm run prisma:seed`

## Architecture

### Backend Structure

- **Controllers** (`backend/src/controllers/`): Request handlers for each domain (assets, licenses, contracts, models, dashboard, reports, sync, netbox, auth)
- **Routes** (`backend/src/routes/`): Express route definitions mapping to controllers
- **Services** (`backend/src/services/`): Business logic layer
  - `observium.service.ts`: Observium device sync logic
  - `netbox.service.ts`: Netbox DCIM integration (rack elevation, device data)
  - `alert.service.ts`: Contract/license expiry alerts
- **Middleware** (`backend/src/middleware/`): Authentication (JWT), validation
- **Prisma Schema** (`backend/prisma/schema.prisma`): Single source of truth for database models

### Key Database Models

The Prisma schema (`backend/prisma/schema.prisma`) defines:
- **HardwareModel**: Master catalog of Juniper device models (MX240, EX4300, etc.) with EOL/EOS dates
- **HardwareAsset**: Physical inventory (serial numbers, locations, rack positions, Observium links)
- **License**: Software licenses (perpetual/subscription/feature/trial)
- **MaintenanceContract**: Support contracts with coverage dates and auto-renewal tracking
- **AssetLicenseMapping** & **AssetContractMapping**: Many-to-many relationships
- **ObserviumSyncLog**: Audit trail for Observium sync operations
- **ContractAlert**: Scheduled alerts for expiring contracts/licenses
- **AuditLog**: Change tracking for all entities

### Frontend Structure

- **Pages** (`frontend/src/pages/`): Top-level route components (Dashboard, Assets, Licenses, Contracts, Models, Netbox, Reports, Sync, Login)
- **Components** (`frontend/src/components/`): Reusable UI components (built with shadcn/ui)
- **API Client** (`frontend/src/api/client.ts`): Centralized Axios instance for backend communication
- **Hooks** (`frontend/src/hooks/`): Custom React hooks (TanStack Query hooks for data fetching)

### Integration Points

- **Observium Sync**: Scheduled cron job (default 2 AM daily) fetches devices from Observium API and syncs to HardwareAssets. Configurable via `OBSERVIUM_ENABLED`, `OBSERVIUM_SYNC_CRON` env vars.
- **Netbox Sync**: Scheduled cron job (default 6 AM daily) syncs DCIM data (racks, devices, locations). Also provides real-time rack elevation visualization API. Configurable via `NETBOX_ENABLED`, `NETBOX_SYNC_CRON`.
- **Alert System**: Daily cron job (8 AM) checks for expiring contracts/licenses and sends notifications (configurable via `ALERT_CONTRACT_EXPIRY_DAYS`, `ALERT_LICENSE_EXPIRY_DAYS`).

### Authentication

- JWT-based authentication (tokens expire per `JWT_EXPIRES_IN` env var)
- Protected routes use `auth.middleware.ts` to verify tokens
- User roles: ADMIN, EDITOR, VIEWER (defined in Prisma schema)

## Environment Configuration

See `backend/.env.example` for all required environment variables including:
- Database connection (`DATABASE_URL`)
- JWT settings (`JWT_SECRET`, `JWT_EXPIRES_IN`)
- Observium integration (`OBSERVIUM_URL`, `OBSERVIUM_USERNAME`, `OBSERVIUM_PASSWORD`)
- Netbox integration (`NETBOX_URL`, `NETBOX_API_TOKEN`)
- Email/SMTP settings for alerts
- Cron schedules for sync jobs

## Important Notes

- **Prototype Mode**: Recent commit "Fix prototype mode - remove authentication for demo" suggests auth can be disabled for demos
- **Dual Integration Strategy**: System supports both Observium (monitoring-focused) and Netbox (DCIM-focused) integrations simultaneously
- **Scheduled Jobs**: Three cron jobs run in production (Observium sync, Netbox sync, alerts) - defined in `backend/src/index.ts:setupCronJobs()`
- **Graceful Shutdown**: Server handles SIGTERM/SIGINT to properly disconnect Prisma before exit
