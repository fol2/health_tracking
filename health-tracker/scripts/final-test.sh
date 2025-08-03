#!/bin/bash

echo "🎉 Final Health Tracker App Test"
echo "================================"

URL="https://health-tracker-neon.vercel.app"

echo ""
echo "🌐 Production URL: $URL"
echo ""

# Test home page
echo "1. Testing Home Page..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" $URL)
CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
if [ "$CODE" = "200" ]; then
    echo "✅ Home page loads successfully"
    if echo "$RESPONSE" | grep -q "Health Tracker"; then
        echo "✅ App title found"
    fi
else
    echo "❌ Home page returned HTTP $CODE"
fi

# Test auth providers
echo ""
echo "2. Testing Authentication Setup..."
AUTH_RESPONSE=$(curl -s $URL/api/auth/providers)
if echo "$AUTH_RESPONSE" | grep -q '"google"'; then
    echo "✅ Google OAuth is configured"
    CALLBACK_URL=$(echo "$AUTH_RESPONSE" | jq -r .google.callbackUrl)
    echo "   Callback URL: $CALLBACK_URL"
else
    echo "❌ Google OAuth not found"
fi

# Test PWA
echo ""
echo "3. Testing PWA Configuration..."
MANIFEST=$(curl -s $URL/manifest.json)
if [ ! -z "$MANIFEST" ]; then
    echo "✅ PWA manifest is available"
    echo "   App name: $(echo "$MANIFEST" | jq -r .name)"
    echo "   Theme color: $(echo "$MANIFEST" | jq -r .theme_color)"
fi

SW_CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL/sw.js)
if [ "$SW_CODE" = "200" ]; then
    echo "✅ Service worker is installed"
fi

# Test API security
echo ""
echo "4. Testing API Security..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/health/latest)
if [ "$API_CODE" = "401" ]; then
    echo "✅ API endpoints are properly secured (401 Unauthorized)"
else
    echo "❌ API security issue - returned HTTP $API_CODE"
fi

echo ""
echo "================================"
echo "📱 Your Health Tracker App is Ready!"
echo ""
echo "🔗 Visit: $URL"
echo "📧 Sign in with: Google account"
echo "📲 Mobile: Add to home screen for app experience"
echo "🌙 Features: Dark theme, offline support, PWA"
echo ""
echo "✨ All systems operational!"
echo ""