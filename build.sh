#!/usr/bin/env bash
# Render Build Script for Personal Finance Advisor Bot
set -o errexit

echo "📦 Installing backend Python requirements..."
pip install -r requirements.txt

# If npm is installed in the container, build frontend fresh
if command -v npm &> /dev/null
then
    echo "⚡ Node.js detected. Building frontend assets..."
    npm --prefix frontend install
    npm --prefix frontend run build
else
    echo "ℹ️ Node.js not found in build image; using precompiled frontend/dist bundle."
fi

echo "✅ Build completed successfully!"
