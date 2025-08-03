# Database Setup Guide

This health tracker application uses Vercel Postgres with Prisma ORM for data management.

## Prerequisites

1. A Vercel account
2. Node.js installed
3. Environment variables configured

## Setup Steps

### 1. Create Vercel Postgres Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the "Storage" tab
3. Click "Create Database" and select "Postgres"
4. Choose your database region (select closest to your users)
5. Copy the connection strings provided

### 2. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Database URLs from Vercel
POSTGRES_PRISMA_URL="your-pooled-connection-string"
POSTGRES_URL_NON_POOLING="your-direct-connection-string"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="generate-a-secret-using-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Run Migrations (Production)

For production deployments:

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy
```

## Database Schema Overview

### Core Tables

1. **User** - Stores user authentication data
2. **UserProfile** - Extended user information (height, target weight, preferences)
3. **FastingSession** - Tracks fasting periods
4. **WeightRecord** - Weight tracking over time
5. **HealthMetric** - Flexible health data storage (blood pressure, heart rate, etc.)
6. **ScheduledFast** - Future fasting plans
7. **Reminder** - Notification scheduling

### Key Features

- **Multi-user support** with Google SSO
- **Cascade deletion** for data integrity
- **Optimized indexes** for common queries
- **Flexible JSON storage** for various health metrics
- **Timezone support** per user

## Development Tools

```bash
# Open Prisma Studio (GUI for database)
npm run db:studio

# Generate types
npm run db:generate

# Format schema file
npx prisma format
```

## API Endpoints

Example endpoints created:

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

## Service Layer

The application uses a service layer pattern for database operations:

- `UserService` - User and profile management
- `FastingService` - Fasting session tracking
- `HealthService` - Weight and health metrics
- `ScheduleService` - Scheduled fasts and reminders

## Best Practices

1. Always use the service layer for database operations
2. Handle errors gracefully in API routes
3. Use transactions for related operations
4. Keep sensitive data server-side only
5. Implement proper validation before database writes

## Troubleshooting

### Common Issues

1. **Connection errors**: Check your environment variables
2. **Migration failures**: Ensure database is accessible
3. **Type errors**: Run `npm run db:generate` after schema changes

### Useful Commands

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Validate schema
npx prisma validate
```

## Production Deployment

1. Set environment variables in Vercel dashboard
2. Add `postinstall` script to package.json (already configured)
3. Vercel will automatically run migrations on deploy

## Security Notes

- Never commit `.env` file
- Use connection pooling for production
- Implement rate limiting on API routes
- Validate all user inputs
- Use row-level security where applicable