#!/bin/bash

echo "Fixing Vercel environment variables..."

# Remove and re-add GOOGLE_CLIENT_ID without any newlines
vercel env rm GOOGLE_CLIENT_ID production --yes 2>/dev/null
echo -n "805096516241-b0nkeulg0de279clilrn2njpb51j47oa.apps.googleusercontent.com" | vercel env add GOOGLE_CLIENT_ID production

# Ensure NEXTAUTH_URL is correct
vercel env rm NEXTAUTH_URL production --yes 2>/dev/null
echo -n "https://health-tracker-neon.vercel.app" | vercel env add NEXTAUTH_URL production

echo "Environment variables updated. Triggering new deployment..."

# Trigger a new deployment
vercel --prod

echo "Done! Please wait for deployment to complete."