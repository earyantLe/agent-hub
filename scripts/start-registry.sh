#!/bin/bash
set -e

echo "Starting Agent Hub Registry..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Default values
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}
export LOG_LEVEL=${LOG_LEVEL:-info}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is required"
    echo "Please copy .env.example to .env and configure your database"
    exit 1
fi

# Start the registry
cd registry
pnpm dev
