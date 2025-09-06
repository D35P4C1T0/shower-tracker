#!/bin/bash

# Simple deployment test script
set -e

echo "🚀 Testing deployment readiness..."

echo "📦 Installing dependencies..."
npm ci --silent

echo "🧪 Running unit tests (critical for deployment)..."
npm run test

echo "🏗️  Building for GitHub Pages..."
export NODE_ENV=production
npm run build:github

echo "✅ Checking build output..."
if [ -f "dist/index.html" ] && [ -f "dist/manifest.webmanifest" ] && [ -f "dist/sw.js" ]; then
    echo "✅ All critical PWA files generated"
    
    # Check if base path is correct for GitHub Pages
    if grep -q "/shower-tracker/" dist/index.html; then
        echo "✅ GitHub Pages base path correctly set"
    else
        echo "❌ GitHub Pages base path not found"
        exit 1
    fi
    
    # Check if PWA manifest has correct scope
    if grep -q '"/shower-tracker/"' dist/manifest.webmanifest; then
        echo "✅ PWA manifest scope correctly set"
    else
        echo "❌ PWA manifest scope incorrect"
        exit 1
    fi
    
else
    echo "❌ Missing critical files"
    exit 1
fi

echo ""
echo "🎉 Deployment test PASSED!"
echo "📁 Build size: $(du -sh dist | cut -f1)"
echo "📄 Files generated: $(find dist -type f | wc -l)"
echo ""
echo "✅ Ready to deploy to GitHub Pages!"
echo "   Just push to main branch and enable GitHub Pages in repo settings"