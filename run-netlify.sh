#!/bin/bash

echo "🔍 Checking for existing processes..."

# Check for existing rollup processes
ROLLUP_PROCS=$(ps aux | grep rollup | grep -v grep | wc -l)
if [ $ROLLUP_PROCS -gt 0 ]; then
    echo "Found $ROLLUP_PROCS rollup processes - killing them..."
    pkill -f rollup
    sleep 2
fi

# Check for existing netlify processes
NETLIFY_PROCS=$(ps aux | grep netlify | grep -v grep | wc -l)
if [ $NETLIFY_PROCS -gt 0 ]; then
    echo "Found $NETLIFY_PROCS netlify processes - killing them..."
    pkill -f netlify
    sleep 2
fi

echo "✅ All processes cleaned up"

echo "🚀 Starting netlify dev..."
npx netlify dev --debug &
NETLIFY_PID=$!

echo "⏳ Waiting for services to start up..."
sleep 10

echo "🔧 Testing functions..."
FUNC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888/.netlify/functions/index?mode=broken")
if [ "$FUNC_RESPONSE" = "400" ]; then
    echo "✅ Functions are responding correctly (HTTP $FUNC_RESPONSE)"
else
    echo "❌ Functions not responding (HTTP $FUNC_RESPONSE)"
fi

echo "🌐 Testing Netlify dev server (port 8888)..."
PAGE_8888=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888/")
if [ "$PAGE_8888" = "200" ]; then
    echo "✅ Port 8888 serving pages (HTTP $PAGE_8888)"
else
    echo "❌ Port 8888 not working (HTTP $PAGE_8888)"
fi

echo "⚡ Testing Svelte dev server (port 5000)..."
PAGE_5000=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000")
if [ "$PAGE_5000" = "200" ]; then
    echo "✅ Port 5000 serving pages (HTTP $PAGE_5000)"
else
    echo "❌ Port 5000 not working (HTTP $PAGE_5000)"
fi

echo ""
echo "🎉 Setup complete! Services running at:"
echo "   Frontend: http://localhost:8888"
echo "   Functions: http://localhost:8888/.netlify/functions/index"
echo "   Svelte Dev: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for netlify dev process
wait $NETLIFY_PID