#!/bin/bash

# Vercel Deployment Script for Health Tracker

echo "🚀 Starting Vercel deployment process..."

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel first:"
    vercel login
fi

echo "📦 Deploying to Vercel..."

# Deploy to Vercel (production)
if [ "$1" = "--prod" ]; then
    echo "🏭 Deploying to production..."
    vercel --prod
else
    echo "🔧 Deploying to preview..."
    vercel
fi

echo "✅ Deployment complete!"