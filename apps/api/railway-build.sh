#!/bin/bash
set -e

echo "📦 Installing dependencies from monorepo root..."
cd ../..
npm ci

echo "🔧 Generating Prisma client..."
npm run db:generate 

echo "📦 Building shared package..."
cd packages/shared
npm run build 2>/dev/null || true

echo "🏗️  Building API..."
cd ../../apps/api
npm run build

echo "✅ Build complete!"
