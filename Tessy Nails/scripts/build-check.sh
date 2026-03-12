#!/bin/bash

echo "🔍 Tessy Nails - Production Build Check"
echo "=================================="

# Check Node.js version
echo "📦 Node.js version:"
node --version

# Check npm version  
echo "📦 npm version:"
npm --version

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check TypeScript
echo "🔍 Checking TypeScript..."
npx tsc --noEmit

# Check ESLint
echo "🔍 Checking ESLint..."
npm run lint

# Build project
echo "🏗️ Building project..."
npm run build

# Check build output
if [ -d ".next" ]; then
    echo "✅ Build successful - .next directory created"
    echo "📊 Build size:"
    du -sh .next
else
    echo "❌ Build failed - no .next directory"
    exit 1
fi

# Check required files
echo "🔍 Checking required files..."
required_files=("package.json" "next.config.ts" "src/app/layout.tsx" "src/app/page.tsx" ".env.example" ".gitignore")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo "🎉 Production build check complete!"
