# Health Tracker - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
2. **GitHub Account**: Push your code to a GitHub repository
3. **Google OAuth Credentials**: Set up at [Google Cloud Console](https://console.cloud.google.com)
4. **Vercel Postgres**: Will be set up during deployment

## Step 1: Prepare Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `https://your-app-name.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local development)
7. Save your Client ID and Client Secret

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to link/create project
```

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

## Step 3: Set Up Vercel Postgres

1. In your Vercel project dashboard, go to "Storage"
2. Click "Create Database" → Select "Postgres"
3. Choose region: Hong Kong (for best performance)
4. Create the database
5. Vercel will automatically add database environment variables

## Step 4: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (automatically added by Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NO_SSL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 5: Run Database Migrations

After deployment, run migrations using Vercel CLI:

```bash
# Connect to your project
vercel link

# Run migrations in production
vercel env pull .env.production.local
npx prisma migrate deploy
```

Or use the Vercel dashboard terminal:
1. Go to your project → Functions tab
2. Click on any function → "View Function Logs"
3. Open terminal and run:
```bash
npx prisma migrate deploy
```

## Step 6: Verify Deployment

1. Visit your deployed URL: `https://your-app-name.vercel.app`
2. Test authentication with Google
3. Create a test user profile
4. Verify all features work correctly

## Environment-Specific Settings

### Production Optimizations

The app is configured with:
- PWA support for offline functionality
- Service worker for caching
- Optimized build with code splitting
- Security headers in `vercel.json`

### Regional Deployment

The app is configured to deploy to Hong Kong region (`hkg1`) for optimal performance. You can change this in `vercel.json` if needed.

## Troubleshooting

### Database Connection Issues
- Ensure all Postgres environment variables are set
- Check if database is in same region as deployment
- Verify Prisma schema matches database

### Authentication Issues
- Verify Google OAuth redirect URIs match your domain
- Check NEXTAUTH_URL matches your deployment URL
- Ensure NEXTAUTH_SECRET is set

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript types are correct

### Runtime Errors
- Check Function logs in Vercel dashboard
- Enable detailed error pages in development
- Monitor browser console for client-side errors

## Post-Deployment Checklist

- [ ] Test Google authentication
- [ ] Verify database connectivity
- [ ] Check PWA installation
- [ ] Test offline functionality
- [ ] Verify all API routes work
- [ ] Test on mobile devices
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts (optional)

## Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
```

### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy
```

### Monitor Usage
- Check Vercel dashboard for:
  - Function invocations
  - Bandwidth usage
  - Database storage
  - Error rates

## Support

For issues specific to:
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Next.js**: [github.com/vercel/next.js](https://github.com/vercel/next.js)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)