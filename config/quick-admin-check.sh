#!/bin/bash
# Quick script to check admin users in LibreChat running debug instance

echo "=============================="
echo "LibreChat Admin User Check"
echo "=============================="

# Check if MongoDB container is running
if ! docker ps | grep -q chat-mongodb-dev; then
    echo "❌ MongoDB container (chat-mongodb-dev) is not running!"
    echo "Please start LibreChat first with: docker compose up -d"
    exit 1
fi

echo "✅ MongoDB container is running"
echo

# Query for all users and their roles
echo "=== ALL USERS ==="
docker exec -it chat-mongodb-dev mongosh LibreChat --quiet --eval "
db.users.find({}).forEach(function(user) {
    const role = user.role || 'USER (default)';
    const isAdmin = user.role === 'ADMIN';
    const prefix = isAdmin ? '🔒 ADMIN' : '👤 USER';
    console.log(prefix + ': ' + (user.name || 'Unknown') + ' (' + user.email + ') - Role: ' + role);
});
"

echo
echo "=== ADMIN SUMMARY ==="
docker exec -it chat-mongodb-dev mongosh LibreChat --quiet --eval "
const adminCount = db.users.countDocuments({role: 'ADMIN'});
const totalCount = db.users.countDocuments({});
console.log('Total users: ' + totalCount);
console.log('Admin users: ' + adminCount);
console.log('Regular users: ' + (totalCount - adminCount));

if (adminCount === 0) {
    console.log('⚠️  WARNING: No admin users found!');
}
"

echo
echo "=============================="
