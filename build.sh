#!/bin/bash

# Build and Deploy Script
# Builds the React frontend and updates the start.sh to serve the production build

echo "🏗️  Building Global Populism Database for Production"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Navigate to React frontend and install dependencies
cd frontend-react

echo "📥 Installing React dependencies..."
npm install

echo "🔨 Building React frontend..."
npm run build

# Copy build output to frontend folder (replacing old HTML)
echo "📂 Copying build to frontend folder..."
rm -rf ../frontend-dist
mv dist ../frontend-dist

cd ..

echo ""
echo "✓ Build complete!"
echo ""
echo "The production build is now in frontend-dist/"
echo "Update backend/main.py to serve from frontend-dist/ for production"
echo ""
echo "To run production mode:"
echo "  ./start.sh"
