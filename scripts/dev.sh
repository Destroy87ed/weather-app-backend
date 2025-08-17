#!/bin/bash

# Weather App Development Script
echo "🌤️  Starting Weather App Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created .env file from template"
        echo "📝 Please edit backend/.env and add your API keys"
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Start development servers
echo "🚀 Starting development servers..."
npm run dev:parallel 