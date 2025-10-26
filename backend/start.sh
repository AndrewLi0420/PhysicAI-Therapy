#!/bin/bash

# Physical Therapy Exercise Recommendation Backend Startup Script

echo "🏥 Starting Physical Therapy Exercise Recommendation Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Start the Flask application
echo "🚀 Starting Flask application on http://localhost:5001"
echo "📊 Health check available at: http://localhost:5001/health"
echo "🎯 Recommendations endpoint: http://localhost:5001/recommendations"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python app.py
