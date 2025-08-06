#!/bin/bash

# Fix Vercel Environment Variables Script
# This script ensures all environment variables are set correctly without trailing newlines
# 
# IMPORTANT: Never commit real credentials to version control!
# Set these as environment variables in your shell or in a .env file that is gitignored

echo "🔧 Fixing Vercel Environment Variables..."
echo ""
echo "⚠️  WARNING: This script requires environment variables to be set."
echo "   Please ensure you have a .env.production file with your actual values."
echo ""

# Check if .env.production file exists
if [ ! -f ".env.production" ]; then
  echo "❌ Error: .env.production file not found!"
  echo ""
  echo "Please create a .env.production file with your actual values:"
  echo "GOOGLE_CLIENT_SECRET=your_actual_secret"
  echo "GOOGLE_CLIENT_ID=your_actual_client_id"
  echo "NEXTAUTH_SECRET=your_actual_nextauth_secret"
  echo "NEXTAUTH_URL=your_production_url"
  echo "DATABASE_URL=your_database_url"
  echo "# ... other environment variables"
  exit 1
fi

# Source the environment file
set -a
source .env.production
set +a

# List of environment variables to update (without values)
declare -a ENV_VARS=(
  "GOOGLE_CLIENT_SECRET"
  "GOOGLE_CLIENT_ID"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "DATABASE_URL"
  "POSTGRES_PRISMA_URL"
  "POSTGRES_URL"
  "POSTGRES_URL_NON_POOLING"
  "DIRECT_URL"
  "POSTGRES_URL_NO_SSL"
)

# Process each environment variable
for VAR_NAME in "${ENV_VARS[@]}"; do
  # Check if variable is set
  if [ -z "${!VAR_NAME}" ]; then
    echo "⚠️  Warning: $VAR_NAME is not set, skipping..."
    continue
  fi
  
  echo "📝 Processing $VAR_NAME..."
  
  # Remove existing variable
  vercel env rm "$VAR_NAME" production --yes 2>/dev/null || true
  
  # Add variable without newline
  echo -n "${!VAR_NAME}" | vercel env add "$VAR_NAME" production
  
  echo "✅ $VAR_NAME updated successfully"
done

echo ""
echo "🎉 All environment variables have been fixed!"
echo ""
echo "📦 Now redeploying to production..."
vercel --prod --force

echo ""
echo "✨ Deployment complete! Check your production URL"