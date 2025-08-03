# Vercel Environment Variables Setup Guide

## ⚠️ CRITICAL: Follow these steps EXACTLY to fix OAuth

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project: `health-tracker`

### 2. Navigate to Environment Variables
- Click on **Settings** tab
- Click on **Environment Variables** in the left sidebar

### 3. Add/Update these variables EXACTLY (NO SPACES OR NEWLINES!)

#### GOOGLE_CLIENT_ID
```
805096516241-b0nkeulg0de279clilrn2njpb51j47oa.apps.googleusercontent.com
```
⚠️ Make sure there are NO spaces or newlines before or after!

#### GOOGLE_CLIENT_SECRET
```
[Your secret from Google Console - check the screenshot you provided]
```

#### NEXTAUTH_URL
```
https://health-tracker-neon.vercel.app
```

#### NEXTAUTH_SECRET
Generate one using:
```bash
openssl rand -base64 32
```
Or use this example (but generate your own for security):
```
K7xYm9z3PQr8vN2wL5hT6jF4aG1bC0eD9sR7uM3nX8=
```

### 4. Database Variables (Get from Vercel Postgres/Neon)
- DATABASE_URL
- POSTGRES_PRISMA_URL  
- POSTGRES_URL_NON_POOLING

### 5. After adding all variables:
1. Click **Save** for each variable
2. Wait for auto-redeploy or click **Redeploy**
3. Deployment takes 1-2 minutes

### 6. Test the app:
1. Open incognito/private browser window
2. Visit: https://health-tracker-neon.vercel.app
3. Click "Sign In"
4. Click "Continue with Google"
5. Should redirect to Google login successfully!

## 🔍 How to verify variables are correct:
- No error messages when clicking Google login
- Redirects to accounts.google.com (not error page)
- After login, redirects back to your app

## ❌ Common mistakes to avoid:
- Extra spaces in environment variables
- Newlines at the end of values
- Missing variables
- Wrong NEXTAUTH_URL (must match your domain exactly)