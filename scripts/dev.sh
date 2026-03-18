#!/bin/bash
set -e

echo "Agent Hub - Development Helper"
echo ""
echo "Usage: ./scripts/dev.sh [command]"
echo ""
echo "Commands:"
echo "  start     - Start the registry server"
echo "  stop      - Stop all services"
echo "  status    - Show running services"
echo "  db        - Start PostgreSQL with Docker"
echo "  test      - Run all tests"
echo "  build     - Build all packages"
echo "  clean     - Clean build artifacts"
echo ""

case "$1" in
  start)
    bash scripts/start-registry.sh
    ;;
  stop)
    echo "Stopping services..."
    docker stop agent-hub-db 2>/dev/null || true
    echo "Services stopped"
    ;;
  status)
    echo "=== Docker Containers ==="
    docker ps --filter name=agent-hub
    echo ""
    echo "=== Node Processes ==="
    lsof -i :3000 2>/dev/null || echo "No processes on port 3000"
    ;;
  db)
    bash scripts/docker-db.sh
    ;;
  test)
    bash scripts/test.sh
    ;;
  build)
    bash scripts/build.sh
    ;;
  clean)
    echo "Cleaning build artifacts..."
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.log" -delete 2>/dev/null || true
    echo "Clean completed"
    ;;
  *)
    echo "Unknown command: $1"
    echo ""
    cat scripts/dev.sh | grep -A 20 "Usage:"
    exit 1
    ;;
esac
