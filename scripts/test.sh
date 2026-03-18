#!/bin/bash
set -e

echo "Running Agent Hub tests..."

# Run tests for all packages
pnpm test
