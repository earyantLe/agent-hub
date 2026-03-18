#!/bin/bash
set -e

echo "Building Agent Hub..."

# Build all packages
pnpm build

echo "Build completed successfully!"
