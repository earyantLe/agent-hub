#!/bin/bash
set -e

echo "Starting PostgreSQL with Docker..."

docker run -d --name agent-hub-db \
  -e POSTGRES_DB=agent_hub \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  postgres:15

echo "PostgreSQL started on port 5432"
echo "DATABASE_URL=postgresql://dev:dev@localhost:5432/agent_hub"
