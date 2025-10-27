# Juniper License & Asset Manager

A comprehensive asset and license management system for Juniper Networks hardware, software licenses, and maintenance contracts.

## Features

- Hardware Asset Tracking (Juniper devices)
- Software License Management
- Maintenance Contract Management
- Observium Integration (automatic device discovery)
- Juniper API Integration
- EOL/EOS Tracking
- Automated Alerts & Notifications
- Compliance Reporting

## Technology Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (database)
- Prisma ORM
- JWT Authentication

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query & Table

## Project Structure

```
license-manager/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation, etc.
│   │   ├── integrations/    # Observium, Juniper APIs
│   │   ├── utils/           # Helper functions
│   │   └── index.ts         # App entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── api/             # API client
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml       # Docker setup
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Set up environment variables (see .env.example)

5. Run database migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

6. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Integrations

### Observium
Configure Observium connection in `.env`:
```
OBSERVIUM_URL=https://your-observium-server
OBSERVIUM_USERNAME=api-user
OBSERVIUM_PASSWORD=api-password
```

### Juniper Networks API
Configure Juniper API credentials in `.env`:
```
JUNIPER_API_KEY=your-api-key
JUNIPER_API_SECRET=your-api-secret
```

## License

MIT
