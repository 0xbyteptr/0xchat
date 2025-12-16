#!/bin/bash
set -e

echo "🔧 Setting up MongoDB..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    echo "📦 Installing MongoDB for Debian/Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y mongodb-org
  elif command -v yum &> /dev/null; then
    # RedHat/CentOS
    echo "📦 Installing MongoDB for RedHat/CentOS..."
    sudo yum install -y mongodb-org
  fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo "📦 Installing MongoDB for macOS..."
  if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Please install Homebrew first."
    exit 1
  fi
  brew tap mongodb/brew
  brew install mongodb-community
fi

echo "✅ MongoDB installed"

# Start MongoDB service
if command -v systemctl &> /dev/null; then
  echo "🚀 Starting MongoDB service (systemctl)..."
  sudo systemctl start mongod
  sudo systemctl enable mongod
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "🚀 Starting MongoDB service (brew)..."
  brew services start mongodb-community
else
  echo "⚠️  Please start MongoDB manually with: mongod"
fi

# Wait for MongoDB to start
echo "⏳ Waiting for MongoDB to be ready..."
for i in {1..30}; do
  if mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ MongoDB failed to start after 30 seconds"
    exit 1
  fi
  sleep 1
done

# Create database and collections
echo "📊 Initializing database and collections..."
mongosh <<EOF
use 0xchat
db.createCollection("users")
db.createCollection("servers")
db.createCollection("channels")
db.createCollection("messages")
db.createCollection("dms")
db.createCollection("friend_invites")
db.users.createIndex({ "username": 1 }, { unique: true })
db.servers.createIndex({ "id": 1 }, { unique: true })
db.messages.createIndex({ "serverId": 1, "channelId": 1, "timestamp": 1 })
db.dms.createIndex({ "participants": 1 })
db.friend_invites.createIndex({ "from": 1, "to": 1 })
EOF

echo "✅ MongoDB setup complete!"
echo ""
echo "Connection string: mongodb://localhost:27017/0xchat"
