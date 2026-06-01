#!/bin/sh
# Roda antes do build — gera .env.local com BUILD_ID único
BUILD_ID=$(git rev-parse --short HEAD 2>/dev/null || echo "b$(date +%s)")
echo "NEXT_PUBLIC_BUILD_ID=$BUILD_ID" > .env.local.generated
echo "✓ BUILD_ID gerado: $BUILD_ID"
