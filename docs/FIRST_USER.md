# Creating the First Admin User in LibreChat

This guide explains how to create the first admin user in a LibreChat installation using Docker Compose.

## Quick Start

To create the first admin user, run the provided script from your LibreChat root directory:

```bash
./scripts/create-first-admin.sh
```

This script provides a user-friendly wrapper around the Docker command with built-in validation and error handling.

## Script Options

The `create-first-admin.sh` script supports several options:

```bash
./scripts/create-first-admin.sh [OPTIONS]
```

### Available Options:
- `-e, --email EMAIL`: Email address (default: admin@prometheusags.ai)
- `-n, --name NAME`: Display name (default: 'Admin User')
- `-u, --username USERNAME`: Username (default: admin)
- `-p, --password PASSWORD`: Password (if not provided, one will be generated)
- `--no-verify`: Don't mark email as verified
- `-h, --help`: Show help message

### Usage Examples:

```bash
# Use all defaults
./scripts/create-first-admin.sh

# Custom email
./scripts/create-first-admin.sh -e admin@example.com

# Custom email, name, and username
./scripts/create-first-admin.sh -e admin@example.com -n 'John Doe' -u john

# Create user without email verification
./scripts/create-first-admin.sh --no-verify
```

## Manual Command (Alternative)

If you prefer to run the Docker command directly without the script:

```bash
docker compose exec -T api npm run create-user admin@prometheusags.ai "Admin User" admin -- --email-verified=true
```

## Command Breakdown

Let's break down what this command does:

### `docker compose exec -T api`
- **`docker compose exec`**: Executes a command inside a running Docker container
- **`-T`**: Disables pseudo-TTY allocation (useful for non-interactive scripts)
- **`api`**: The name of the API service container defined in your docker-compose.yml

### `npm run create-user`
- Runs the user creation script defined in package.json
- This executes `node config/create-user.js`

### Command Arguments
The create-user script accepts the following positional arguments:
1. **Email**: `admin@prometheusags.ai` - The admin user's email address
2. **Name**: `"Admin User"` - The display name for the user
3. **Username**: `admin` - The username for login
4. **Password**: (optional) - If not provided, a random password will be generated

### Optional Flags
- **`--email-verified=true`**: Sets the user's email as already verified
  - This skips the email verification process
  - Essential for the first user when email services might not be configured yet

## What Happens During User Creation

1. **Validation**: The script validates the email format and checks if the user already exists
2. **Password Generation**: If no password is provided, a secure random password is generated
3. **User Registration**: The user is registered using LibreChat's authentication service
4. **Email Verification**: The email is marked as verified if the flag is set
5. **Database Storage**: The user record is saved to the MongoDB database

## Admin Role Assignment

**Important**: The user created with this command is a regular user, not an admin. To make them an admin, you'll need to:

1. Update the user's role in the database manually, or
2. Use the application's role management features after login

## Alternative Usage Patterns

### Interactive Mode
If you don't provide all arguments, the script will prompt you interactively:
```bash
docker compose exec -T api npm run create-user
```

### With Password (Not Recommended)
```bash
docker compose exec -T api npm run create-user admin@prometheusags.ai "Admin User" admin mypassword --email-verified=true
```
⚠️ **Security Warning**: Passing passwords via command line is not secure as they may be logged in shell history.

### Email Verification Options
- `--email-verified=true`: Email is marked as verified (default behavior)
- `--email-verified=false`: User will need to verify their email
  - Requires email service configuration
  - Or `ALLOW_UNVERIFIED_EMAIL_LOGIN=true` in environment variables

## Prerequisites

1. **Running Docker Environment**: Ensure your LibreChat containers are running
2. **Database Connection**: The API container must be connected to MongoDB
3. **Proper Configuration**: Environment variables should be properly set

## Troubleshooting

### Common Issues

**"User already exists" Error**
- Check if a user with that email or username already exists
- Use the list-users command: `docker compose exec -T api npm run list-users`

**Database Connection Issues**
- Ensure MongoDB container is running and accessible
- Check database connection settings in your environment variables

**Permission Issues**
- Ensure Docker has proper permissions
- Try running with `sudo` if necessary (though not recommended for production)

## Related Commands

### List Existing Users
```bash
docker compose exec -T api npm run list-users
```

### Delete a User
```bash
docker compose exec -T api npm run delete-user
```

### Reset User Password
```bash
docker compose exec -T api npm run reset-password
```

## Security Considerations

1. **Change Default Credentials**: After first login, change the password immediately
2. **Use Strong Passwords**: If manually setting passwords, ensure they are strong
3. **Regular User Audits**: Periodically review user accounts and permissions
4. **Backup User Data**: Regular backups of user data and configurations

## Next Steps

After creating your first user:

1. **Login**: Access the LibreChat web interface and login with the created credentials
2. **Configure Settings**: Set up your AI model configurations and API keys
3. **Create Additional Users**: Use the web interface or additional CLI commands
4. **Assign Roles**: Configure appropriate roles and permissions for different users

## Example Output

When the command runs successfully, you should see output similar to:
```
User created successfully!
Email verified: true
```

If a password was generated, it will be displayed:
```
Your password is: [generated-password]
```

**Important**: Save the generated password securely as it won't be shown again.
