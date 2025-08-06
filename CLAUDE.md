# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a health tracking PWA application. The main project is located in the `health-tracker` subdirectory:

```
/health-tracker/           # Main Next.js 15 application
├── src/                  # Source code
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks  
│   ├── lib/            # Utilities and services
│   ├── store/          # Zustand state stores
│   └── types/          # TypeScript definitions
├── prisma/              # Database schema and migrations
├── tests/               # Playwright E2E tests
└── public/              # Static assets and PWA files
```

**IMPORTANT**: Always `cd health-tracker` before running any commands.

## Development Commands

### Essential Commands
```bash
cd health-tracker          # Navigate to project directory (ALWAYS DO THIS FIRST)
npm run dev               # Start development server (http://localhost:3000)
npm run build             # Build for production and type-check
npm run lint              # Run ESLint checks
npm run format            # Format code with Prettier
```

### Database Commands
```bash
npm run db:generate       # Generate Prisma client after schema changes
npm run db:push          # Push schema to development database
npm run db:migrate       # Create and apply migrations
npm run db:studio        # Open Prisma Studio GUI
npx prisma migrate deploy # Apply migrations in production
```

### Testing Commands
```bash
npm run test             # Run all Playwright tests
npm run test:ui          # Interactive test UI
npm run test:debug       # Debug tests with Playwright Inspector
npm run test:headed      # Run tests with visible browser
npm run test tests/e2e/auth.spec.ts  # Run specific test file
npm run test -- -g "should login"    # Run test by name pattern
```

### Deployment Commands
```bash
vercel --prod            # Deploy directly to production
vercel env pull .env.production.local  # Pull production env vars
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.4.5 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Hosting**: Vercel (London region) + Neon Postgres
- **Auth**: NextAuth.js v5 with Google OAuth
- **State**: Zustand stores with persistence
- **UI**: Tailwind CSS + shadcn/ui components
- **PWA**: next-pwa for offline functionality
- **Testing**: Playwright for E2E tests

### Core Services Pattern

All database operations go through service classes in `src/lib/services/`:

- `UserService`: User profiles and preferences
- `FastingService`: Fasting sessions and statistics  
- `HealthService`: Weight records and health metrics
- `ScheduleService`: Scheduled fasts and recurring patterns
- `MealService`: Meal logging and nutrition tracking

Example service usage:
```typescript
import { FastingService } from '@/lib/services/fasting.service'
const session = await FastingService.startSession(userId, type, targetHours)
```

### Authentication Flow (NextAuth.js v5)

1. **Configuration**: `src/lib/auth.ts` - Main NextAuth config
2. **API Route**: `src/app/api/auth/[...nextauth]/route.ts`
3. **Middleware**: Protects routes and handles redirects
4. **Profile Check**: Always verify `session.user.hasProfile` before app access

### State Management (Zustand)

Global stores in `src/store/`:
- `useAuthStore`: Authentication state
- `useFastingStore`: Active fasting session
- `useHealthStore`: Health metrics cache
- `useScheduleStore`: Scheduled fasts
- `useOfflineStore`: Offline queue management

### API Routes Pattern

All routes follow RESTful conventions with proper error handling:
```typescript
// GET /api/resource
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Implementation
}
```

### Next.js 15 Important Changes

Dynamic route params are now Promises:
```typescript
// Old (Next.js 14)
export async function GET(request, { params }) {
  const { id } = params
}

// New (Next.js 15)
export async function GET(request, { params }) {
  const { id } = await params  // Must await!
}
```

## CRITICAL SECURITY GUIDELINES

### Never Commit Secrets (HIGHEST PRIORITY!)

**Before ANY code change or commit:**

1. **Security Scan** - Run this command:
```bash
grep -r "GOCSPX\|sk-\|pk-\|Bearer\|postgres://\|mongodb://\|mysql://\|redis://" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.sh" --include="*.env" --include="*.json" .
```

2. **Environment Variables** - ONLY store credentials in:
   - `.env.local` (local development)
   - `.env.production` (production testing, never commit)
   - Vercel Dashboard (production deployment)

3. **Gitignore Verification**:
```bash
git status --ignored | grep ".env"  # Should show .env files as ignored
```

### Security Checklist
- [ ] No hardcoded API keys, OAuth secrets, or passwords
- [ ] All credentials in `.env` files
- [ ] `.env.example` has dummy values only
- [ ] No base64 encoded secrets
- [ ] Run `git diff --cached` before commit

## Environment Configuration

### Required Environment Variables

```env
# Database (Auto-set by Vercel Postgres)
POSTGRES_PRISMA_URL=       # Pooled connection with ?pgbouncer=true
POSTGRES_URL_NON_POOLING=  # Direct connection for migrations

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app  # Production URL
NEXTAUTH_SECRET=           # Generate: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=          # From Google Cloud Console
GOOGLE_CLIENT_SECRET=      # From Google Cloud Console

# Optional
USE_DEMO_AUTH=true         # Enable demo mode for testing
```

### Google OAuth Setup

1. Create OAuth 2.0 Client ID in Google Cloud Console
2. Add redirect URIs:
   - Production: `https://your-app.vercel.app/api/auth/callback/google`
   - Development: `http://localhost:3000/api/auth/callback/google`
3. Enable Google+ API in your project

## Common Issues and Solutions

### TypeScript/Build Errors
- **Zod validation**: v4 uses `.issues` not `.errors`
- **Prisma types**: Run `npm run db:generate` after schema changes
- **CSS errors**: Use direct properties instead of `@apply` with custom values

### Database Issues
- **Connection failed**: Verify all `POSTGRES_*` env vars are set
- **Schema drift**: Run `npx prisma migrate deploy` in production
- **Type errors**: Regenerate Prisma client with `npm run db:generate`

### Authentication Issues
- **OAuth redirect mismatch**: Exact URI match required (including protocol)
- **Profile not found**: Check `session.user.hasProfile` before app access
- **Demo mode**: Set `USE_DEMO_AUTH=true` for testing without Google

### Deployment Issues
- **Push blocked**: Scan for hardcoded credentials
- **Build fails**: Run `npm run build` locally first
- **Runtime errors**: Check Vercel Function Logs

## PWA Configuration

The app is configured as a Progressive Web App with:
- Offline functionality via service worker
- App manifest for installation
- Automatic caching strategies
- Icons for all platforms

Configuration in `next.config.ts`:
- Service worker disabled in development
- Auto-registration enabled
- Skip waiting for immediate updates

## Testing Strategy

### Test Organization
```
tests/
├── e2e/           # End-to-end user flows
├── components/    # Component-specific tests
└── helpers/       # Test utilities
```

### Running Specific Tests
```bash
# Test authentication flow
npm run test tests/e2e/auth.spec.ts

# Test in headed mode (see browser)
npm run test:headed

# Test mobile viewports
npm run test:mobile

# Test against production
npm run test:prod
```

## Performance Optimizations

1. **Database Queries**: Use Prisma's `select` to fetch only needed fields
2. **Image Optimization**: Use Next.js Image component
3. **Code Splitting**: Dynamic imports for heavy components
4. **Caching**: Zustand persistence for offline support
5. **API Responses**: Return minimal data, paginate lists

## Deployment Workflow

### Quick Deploy
```bash
cd health-tracker
vercel --prod     # Deploy directly to production
```

### Full Deployment Process
```bash
# 1. Test locally
npm run build
npm run test

# 2. Security check
grep -r "GOCSPX\|sk-\|pk-" --include="*.ts" --include="*.js" .

# 3. Deploy
vercel --prod

# 4. Verify
# Visit production URL and test critical paths
```

## Code Style Guidelines

1. **TypeScript**: Strict mode enabled, prefer type inference
2. **Components**: Functional components with hooks
3. **Async/Await**: Preferred over promises
4. **Error Handling**: Always handle errors in API routes
5. **Imports**: Use `@/` alias for src directory
6. **State Updates**: Use Immer for complex state mutations
7. **Forms**: React Hook Form with Zod validation

## Key Dependencies Versions

- Next.js: 15.4.5
- React: 19.1.0
- Prisma: 6.13.0
- NextAuth: 5.0.0-beta.29
- Zustand: 5.0.7
- Playwright: 1.54.2

## Quick Debugging Tips

1. **Check auth session**: Add `console.log(session)` in components
2. **Database queries**: Use Prisma Studio: `npm run db:studio`
3. **API errors**: Check Network tab and Vercel Function Logs
4. **State issues**: Install Zustand devtools
5. **Build errors**: Clear `.next` folder and rebuild

## Emergency Recovery

### If credentials exposed:
1. Rotate ALL exposed credentials immediately
2. `git commit --amend` to fix commit
3. `git push --force-with-lease`
4. Check logs for unauthorized access

### If production is down:
1. Check Vercel deployment status
2. Verify environment variables
3. Run database migrations if needed
4. Rollback to previous deployment if critical