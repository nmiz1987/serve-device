#!/bin/bash

set -e

echo "🚀 Setting up serve-device project..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo "✅ Setup complete! You can now run:"
echo "  bun run dev        - Start both server and client"
echo "  bun run build      - Build for production"
echo ""
echo "Make sure you have ADB installed: adb --version"
