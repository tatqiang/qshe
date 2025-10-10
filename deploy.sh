#!/bin/bash

# QSHE Quick Deploy Script
# This script helps deploy your QSHE app quickly

echo "🚀 QSHE App Quick Deploy Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if build works
echo "📦 Testing build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Preview locally first
echo "🔍 Starting local preview..."
echo "👀 Check http://localhost:4173 to test before deploying"
echo "Press Ctrl+C when ready to deploy"

npm run preview &
PREVIEW_PID=$!

# Wait for user input
read -p "📤 Ready to deploy? (y/N): " -n 1 -r
echo

if [[ ! $RACKET =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    kill $PREVIEW_PID 2>/dev/null
    exit 0
fi

# Kill preview
kill $PREVIEW_PID 2>/dev/null

# Ask for deployment platform
echo "🎯 Choose deployment platform:"
echo "1) Vercel (Recommended)"
echo "2) Netlify" 
echo "3) Manual build only"

read -p "Enter choice (1-3): " CHOICE

case $CHOICE in
    1)
        echo "🚀 Deploying to Vercel..."
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo "📥 Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        echo "🎯 Deploying with Vercel..."
        vercel --prod
        ;;
        
    2)
        echo "🚀 Deploying to Netlify..."
        
        # Check if Netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            echo "📥 Installing Netlify CLI..."
            npm install -g netlify-cli
        fi
        
        echo "🎯 Deploying with Netlify..."
        netlify deploy --prod --dir=dist
        ;;
        
    3)
        echo "📦 Build completed! You can find the files in the 'dist' folder."
        echo "📤 Upload the 'dist' folder contents to your hosting provider."
        ;;
        
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo "🎉 Deployment process completed!"
echo "🔗 Your QSHE app should now be live!"
echo ""
echo "📋 Post-deployment checklist:"
echo "  ✅ Test user registration"
echo "  ✅ Test face recognition"
echo "  ✅ Test PWA installation"
echo "  ✅ Test QR code generation"
echo "  ✅ Test on mobile devices"
echo ""
echo "🐛 If you encounter issues, check the DEPLOYMENT_GUIDE.md"
