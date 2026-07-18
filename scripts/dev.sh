#!/bin/bash

# Find available ports
PORTS=$(node scripts/find-ports.js)
export $(echo $PORTS | tr ' ' '\n')

echo "🚀 Development Mode"
echo "📱 Server: http://localhost:$SERVER_PORT"
echo "🌐 Client: http://localhost:$CLIENT_PORT"
echo ""

# Run both dev servers with discovered ports
concurrently \
  "PORT=$SERVER_PORT bun run --cwd server dev" \
  "SERVER_PORT=$SERVER_PORT bun run --cwd client vite --host --port $CLIENT_PORT"
