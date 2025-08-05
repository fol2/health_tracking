# Vercel Deployment Troubleshooting

## Quick Diagnosis

**Production**: https://health-tracker-neon.vercel.app ✅  
**Issue**: New deployments failing (~12s duration)

## Troubleshooting Steps

### 1. Check Environment Variables
```bash
# Required in Vercel Dashboard → Settings → Environment Variables
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
```
⚠️ Common issues: Extra spaces, missing variables, wrong environment selected

### 2. Debug Failed Deployment
1. **View logs**: Vercel Dashboard → Failed deployment → Build Logs
2. **Common errors**:
   - `Module not found` → Missing dependency
   - `Environment variable not found` → Check step 1
   - `Database connection failed` → Verify POSTGRES_* variables

### 3. Quick Fixes
```bash
# Force redeploy with cleared cache
vercel --prod --force

# Build locally to test
npm run build

# Manual deployment
vercel --prod
```

### 4. Rollback If Needed
Vercel Dashboard → Last working deployment → "..." → "Promote to Production"

## Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["lhr1"]
}
```

- **Node**: 18.x+
- **Database**: Neon PostgreSQL (eu-west-2)
- **Region**: lhr1 (London)

## Resources
- [Vercel Status](https://www.vercel-status.com/)
- [Vercel Support](https://vercel.com/support)