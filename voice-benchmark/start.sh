#!/bin/bash
echo "========================================"
echo " Starting Code-A-Nova Voice Benchmark..."
echo "========================================"

# Get the directory of the script and cd into it
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Check if port 3000 or 8000 is in use and kill if necessary
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start Python WebSocket Server
echo "Starting Python FastAPI Backend on port 8000..."
source venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8000 &
PYTHON_PID=$!

# Wait for python server to boot and load AI models
echo "Waiting for AI models to load (this can take up to 60 seconds)..."
while ! nc -z 127.0.0.1 8000; do   
  sleep 2
done
echo "Backend is ready!"

# Start Node.js UI Server
echo "Starting Node.js Express UI Server on port 3000..."
cd server
node index.js &
NODE_PID=$!

echo "Both servers are running."
echo "Press Ctrl+C to stop."

# Wait for Ctrl+C
trap "kill $PYTHON_PID $NODE_PID; exit" INT
wait
