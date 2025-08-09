const path = require('path');
const mongoose = require(path.resolve(__dirname, '..', 'api', 'node_modules', 'mongoose'));
const { User } = require('@librechat/data-schemas').createModels(mongoose);
const { SystemRoles } = require('librechat-data-provider');
require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const { silentExit } = require('./helpers');
const connect = require('./connect');

(async () => {
  await connect();

  /**
   * Check admin users
   */
  console.purple('-----------------------------');
  console.purple('Admin User Status Check');
  console.purple('-----------------------------');

  // Get all users
  const allUsers = await User.find({});
  const adminUsers = await User.find({ role: SystemRoles.ADMIN });
  const regularUsers = await User.find({
    $or: [{ role: SystemRoles.USER }, { role: { $exists: false } }],
  });

  console.cyan(`\nTotal Users: ${allUsers.length}`);
  console.cyan(`Admin Users: ${adminUsers.length}`);
  console.cyan(`Regular Users: ${regularUsers.length}`);

  if (adminUsers.length > 0) {
    console.green('\n=== ADMIN USERS ===');
    for (const user of adminUsers) {
      console.green(`✓ ${user.name || 'Unknown'} (${user.email}) - Role: ${user.role}`);
    }
  } else {
    console.yellow('\n⚠️  No admin users found!');
  }

  if (regularUsers.length > 0) {
    console.blue('\n=== REGULAR USERS ===');
    for (const user of regularUsers) {
      console.blue(
        `• ${user.name || 'Unknown'} (${user.email}) - Role: ${user.role || 'USER (default)'}`,
      );
    }
  }

  // If you want to check a specific user by email, uncomment and modify this:
  // const specificEmail = 'user@example.com'; // Replace with the email you want to check
  // const specificUser = await User.findOne({ email: specificEmail });
  // if (specificUser) {
  //   const isAdmin = specificUser.role === SystemRoles.ADMIN;
  //   console.cyan(`\n=== SPECIFIC USER CHECK: ${specificEmail} ===`);
  //   console.cyan(`Name: ${specificUser.name || 'Unknown'}`);
  //   console.cyan(`Email: ${specificUser.email}`);
  //   console.cyan(`Role: ${specificUser.role || 'USER (default)'}`);
  //   console[isAdmin ? 'green' : 'yellow'](`Admin Status: ${isAdmin ? '✓ ADMIN' : '✗ NOT ADMIN'}`);
  // } else {
  //   console.red(`\n❌ User with email ${specificEmail} not found`);
  // }

  silentExit(0);
})();

process.on('uncaughtException', (err) => {
  if (!err.message.includes('fetch failed')) {
    console.error('There was an uncaught error:');
    console.error(err);
  }

  if (!err.message.includes('fetch failed')) {
    process.exit(1);
  }
});
