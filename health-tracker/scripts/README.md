# Scripts Directory

This directory contains utility scripts for managing the health tracker application.

## fix-vercel-env.sh

This script updates Vercel environment variables for production deployment.

### Prerequisites

1. Create a `.env.production` file in the project root with your actual credentials:
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

2. Ensure you have the Vercel CLI installed and logged in:
   ```bash
   npm i -g vercel
   vercel login
   ```

### Usage

```bash
./scripts/fix-vercel-env.sh
```

The script will:
1. Read credentials from `.env.production`
2. Update all environment variables in Vercel
3. Trigger a production deployment

### Security Notes

- **NEVER** commit `.env.production` to version control
- The `.env.production` file is gitignored for security
- Use `.env.production.example` as a template for required variables
- Rotate credentials immediately if they are ever exposed