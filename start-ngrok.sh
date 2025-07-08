#!/bin/bash

# CUHK Course Planner - ngrok Public Testing Script
echo "🚀 Starting CUHK Course Planner with ngrok for public testing..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first:"
    echo "   Visit: https://ngrok.com/download"
    echo "   Or run: npm install -g ngrok"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID $NGROK_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📡 Starting backend server..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

# Start ngrok tunnel to frontend
echo "🔗 Starting ngrok tunnel..."
ngrok http 5173 &
NGROK_PID=$!

# Wait for ngrok to start and get the URL
sleep 3

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📱 Your application is now available at:"
echo "   Local: http://localhost:5173"
echo "   Public: Check the ngrok URL above"
echo ""
echo "🔧 Backend API: http://localhost:3002"
echo "📊 ngrok Dashboard: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait 