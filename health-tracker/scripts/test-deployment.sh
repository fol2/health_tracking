#!/bin/bash

echo "🧪 Testing Health Tracker Deployment"
echo "===================================="

URL="https://health-tracker-je9md0w4i-fol2s-projects.vercel.app"

echo ""
echo "1. Testing Home Page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)
if [ $STATUS -eq 200 ]; then
    echo "✅ Home page is accessible (HTTP $STATUS)"
else
    echo "❌ Home page returned HTTP $STATUS"
fi

echo ""
echo "2. Testing Login Page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/login)
if [ $STATUS -eq 200 ]; then
    echo "✅ Login page is accessible (HTTP $STATUS)"
else
    echo "❌ Login page returned HTTP $STATUS"
fi

echo ""
echo "3. Testing PWA Manifest..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/manifest.json)
if [ $STATUS -eq 200 ]; then
    echo "✅ PWA manifest is accessible (HTTP $STATUS)"
    echo "   App name: $(curl -s $URL/manifest.json | jq -r .name)"
else
    echo "❌ PWA manifest returned HTTP $STATUS"
fi

echo ""
echo "4. Testing Service Worker..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/sw.js)
if [ $STATUS -eq 200 ]; then
    echo "✅ Service worker is accessible (HTTP $STATUS)"
else
    echo "❌ Service worker returned HTTP $STATUS"
fi

echo ""
echo "5. Testing Auth Session (Expected 401)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/auth/session)
if [ $STATUS -eq 401 ]; then
    echo "✅ Auth endpoint properly secured (HTTP $STATUS)"
else
    echo "❌ Auth endpoint returned unexpected HTTP $STATUS"
fi

echo ""
echo "6. Testing Database Connection..."
# This will fail with 401 which is expected since we're not authenticated
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/health/latest)
if [ $STATUS -eq 401 ]; then
    echo "✅ API endpoints are secured (HTTP $STATUS)"
else
    echo "❌ API endpoint returned HTTP $STATUS"
fi

echo ""
echo "===================================="
echo "🎯 Deployment URL: $URL"
echo "📱 Install as PWA: Visit on mobile and 'Add to Home Screen'"
echo "🔐 Login: Use Google Sign-In"
echo ""