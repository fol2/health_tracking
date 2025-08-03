# Vercel Setup Guide - Step by Step

## What I Can Help With vs What You Need to Do

### ✅ What Claude Code Can Do:
- Install Vercel CLI ✓ (Already done)
- Create deployment scripts ✓ (Already done)
- Configure project files ✓ (Already done)
- Run deployment commands
- Set up environment variables via CLI (after you provide them)
- Run database migrations
- Test deployments

### 🔒 What You Need to Do Manually:
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Create storage instances (Postgres/KV) in Vercel dashboard
3. Get Google OAuth credentials
4. Provide API tokens and secrets

## Step-by-Step Setup Process

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended) or email
3. Verify your email

### Step 2: Login via CLI
```bash
vercel login
```
- Choose your login method
- A browser window will open
- Authorize the CLI

### Step 3: Deploy Initial Project
```bash
# From your project directory
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (Select your account)
# - Link to existing project? N
# - Project name? health-tracker (or your choice)
# - Directory? ./ (current directory)
# - Override settings? N
```

### Step 4: Set Up Vercel Postgres
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database" → "Postgres"
5. Choose region: `Hong Kong (hkg1)` for best performance
6. Name it: `health-tracker-db`
7. Click "Create"

Vercel will automatically add these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Step 5: Set Up Vercel KV (Optional - for caching)
1. In Storage tab, click "Create Database" → "KV"
2. Choose region: `Hong Kong (hkg1)`
3. Name it: `health-tracker-kv`
4. Click "Create"

Vercel will add:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### Step 6: Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`

### Step 7: Add Environment Variables

#### Option A: Via Vercel Dashboard
1. Project Settings → Environment Variables
2. Add each variable:
   ```
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   GOOGLE_CLIENT_ID=<from Google Console>
   GOOGLE_CLIENT_SECRET=<from Google Console>
   ```

#### Option B: Via CLI (I can help with this!)
```bash
# Pull existing env vars
vercel env pull .env.production.local

# Add new env vars
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
```

### Step 8: Run Database Migrations
After database is connected:
```bash
# Pull production env vars
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy
```

### Step 9: Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or use our script
./scripts/deploy.sh --prod
```

## Quick Commands Reference

```bash
# Login to Vercel
vercel login

# Deploy (preview)
vercel

# Deploy (production)
vercel --prod

# List deployments
vercel list

# View logs
vercel logs

# Manage environment variables
vercel env ls
vercel env add KEY_NAME production
vercel env rm KEY_NAME production

# Pull env vars locally
vercel env pull .env.production.local

# Link to existing project
vercel link

# Run with production env locally
vercel dev
```

## Troubleshooting

### Database Connection Issues
```bash
# Check env vars are set
vercel env ls

# Test connection
npx prisma db pull
```

### Build Failures
```bash
# Check build logs
vercel logs --output=raw

# Build locally with production env
vercel build
```

### Authentication Issues
- Verify Google OAuth redirect URIs
- Check NEXTAUTH_URL matches deployment URL
- Ensure NEXTAUTH_SECRET is set

## Next Steps After Setup

1. **Test Authentication**: Visit your deployment and test Google login
2. **Verify Database**: Create a test user profile
3. **Check PWA**: Install the app on mobile
4. **Monitor**: Set up monitoring in Vercel dashboard

## Using Vercel KV (Optional)

If you set up Vercel KV, you can use it for:
- Session storage
- Caching frequently accessed data
- Rate limiting

Example usage:
```typescript
import { kv } from '@vercel/kv';

// Set a value
await kv.set('key', 'value');

// Get a value
const value = await kv.get('key');
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Storage Docs](https://vercel.com/docs/storage)
- [Vercel Support](https://vercel.com/support)
- [Community Forum](https://github.com/vercel/next.js/discussions)