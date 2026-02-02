#!/bin/bash

# Development script - runs React dev server and FastAPI backend concurrently

echo "🌍 Global Populism Database - Development Mode"
echo "=================================================="

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Install React dependencies
cd frontend-react
if [ ! -d "node_modules" ]; then
    echo "📥 Installing React dependencies..."
    npm install
fi

echo ""
echo "=================================================="
echo "Starting development servers..."
echo ""
echo "  • FastAPI backend: http://localhost:8000"
echo "  • React frontend:  http://localhost:5173"
echo ""
echo "Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop both servers"
echo "=================================================="
echo ""

# Start both servers concurrently
cd ..
# Start FastAPI in background
(cd backend && python main.py) &
BACKEND_PID=$!

# Start React dev server
(cd frontend-react && npm run dev)

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
