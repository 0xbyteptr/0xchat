#!/bin/bash
set -e

echo "📊 Migrating JSON data to MongoDB..."

# MongoDB connection
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017}"
MONGODB_DB="${MONGODB_DB:-0xchat}"

# Paths to JSON files
DATA_DIR="./data"

echo "🔗 Connecting to MongoDB at $MONGODB_URI"

# Check if MongoDB is running
if ! mongosh --eval "db.adminCommand('ping')" "$MONGODB_URI" &> /dev/null; then
  echo "❌ MongoDB is not running. Start it with: mongod --dbpath=/data/db &"
  exit 1
fi

echo "✅ MongoDB is running"

# Migrate using mongosh
mongosh "$MONGODB_URI/$MONGODB_DB" << 'EOF'
const fs = require('fs');
const path = require('path');

const DATA_DIR = './data';

console.log('📊 Starting migration...');

// Migrate users
if (fs.existsSync(path.join(DATA_DIR, 'users.json'))) {
  const users = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8'));
  if (users.length > 0) {
    db.users.deleteMany({});
    db.users.insertMany(users);
    console.log(`✅ Migrated ${users.length} users`);
  }
}

// Migrate servers
if (fs.existsSync(path.join(DATA_DIR, 'servers.json'))) {
  const servers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'servers.json'), 'utf8'));
  if (servers.length > 0) {
    db.servers.deleteMany({});
    db.servers.insertMany(servers);
    console.log(`✅ Migrated ${servers.length} servers`);
  }
}

// Migrate messages
if (fs.existsSync(path.join(DATA_DIR, 'messages.json'))) {
  const messages = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'messages.json'), 'utf8'));
  if (messages.length > 0) {
    db.messages.deleteMany({});
    db.messages.insertMany(messages);
    console.log(`✅ Migrated ${messages.length} messages`);
  }
}

// Migrate DMs
if (fs.existsSync(path.join(DATA_DIR, 'dms.json'))) {
  const dms = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'dms.json'), 'utf8'));
  if (dms.length > 0) {
    db.dms.deleteMany({});
    db.dms.insertMany(dms);
    console.log(`✅ Migrated ${dms.length} DM conversations`);
  }
}

// Migrate friend invites
if (fs.existsSync(path.join(DATA_DIR, 'friend_invites.json'))) {
  const invites = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'friend_invites.json'), 'utf8'));
  if (invites.length > 0) {
    db.friend_invites.deleteMany({});
    db.friend_invites.insertMany(invites);
    console.log(`✅ Migrated ${invites.length} friend invites`);
  }
}

// Create indexes
console.log('\n📇 Creating indexes...');
db.users.createIndex({ username: 1 }, { unique: true });
db.servers.createIndex({ id: 1 }, { unique: true });
db.messages.createIndex({ serverId: 1, channelId: 1, timestamp: 1 });
db.dms.createIndex({ participants: 1 });
db.friend_invites.createIndex({ from: 1, to: 1 });
console.log('✅ Indexes created');

console.log('\n✅ Migration complete!');
EOF

echo ""
echo "✅ Migration script completed!"
