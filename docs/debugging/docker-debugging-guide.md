# Docker Debugging Guide for LibreChat

This guide provides comprehensive instructions for debugging LibreChat while running in Docker containers, including both frontend and backend debugging capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Backend Debugging](#backend-debugging)
5. [Frontend Debugging](#frontend-debugging)
6. [Full-Stack Debugging](#full-stack-debugging)
7. [Debugging Scripts](#debugging-scripts)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Debugging](#advanced-debugging)

## Overview

The LibreChat debugging setup provides:

- **Backend Debugging**: Node.js debugger with breakpoints and variable inspection
- **Frontend Debugging**: React DevTools, source maps, and hot reload
- **Container Debugging**: Log aggregation and container inspection
- **VS Code Integration**: Launch configurations for seamless debugging experience

## Prerequisites

- Docker and Docker Compose installed
- VS Code with the following extensions:
  - Docker
  - JavaScript Debugger
  - React Developer Tools (browser extension)
- Node.js 20+ (for local debugging fallback)

## Quick Start

### 1. Start Development Environment

```bash
# Start all services in development mode
npm run docker:dev

# Or start in detached mode
npm run docker:dev:detached
```

### 2. Attach Debugger

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Attach to LibreChat (Docker)"
4. Click the play button or press F5

### 3. Set Breakpoints

- Open any backend file (e.g., `api/server/index.js`)
- Click in the gutter to set breakpoints
- Trigger the code path through the application

## Backend Debugging

### Docker-based Backend Debugging

The development Docker setup exposes the Node.js debugger on port 9229.

#### Available Launch Configurations

- **Attach to LibreChat (Docker)**: Attach to running container
- **Attach to LibreChat Dev (Docker)**: Attach with environment variables
- **Launch LibreChat (Local)**: Run locally for debugging

#### Debugging Steps

1. **Start the development container:**
   ```bash
   npm run docker:debug
   ```

2. **Attach VS Code debugger:**
   - Press F5 or use Run → Start Debugging
   - Select "Attach to LibreChat (Docker)"

3. **Set breakpoints:**
   - Open backend files in VS Code
   - Click in the gutter next to line numbers
   - Breakpoints will appear as red dots

4. **Debug features:**
   - Step through code (F10, F11)
   - Inspect variables in the Variables panel
   - Evaluate expressions in the Debug Console
   - View call stack in the Call Stack panel

### Local Backend Debugging

For faster iteration, you can debug locally:

```bash
# Debug with immediate break
npm run debug:backend:break

# Debug without immediate break
npm run debug:backend
```

### Environment Variables for Debugging

Key debugging environment variables in `.env.development`:

```env
DEBUG=librechat:*          # Enable debug logging
NODE_ENV=development       # Development mode
LOG_LEVEL=debug           # Detailed logging
DETAILED_ERRORS=true      # Show full error details
STACK_TRACE=true          # Include stack traces
```

## Frontend Debugging

### React Development Server

The frontend can be debugged using browser developer tools with source maps.

#### Start Frontend Development Server

```bash
# Start frontend dev server in container
npm run docker:frontend:dev

# Or include in full development setup
npm run docker:dev
```

#### Browser Debugging

1. **Open browser developer tools** (F12)
2. **Navigate to Sources tab**
3. **Find your React components** under `webpack://`
4. **Set breakpoints** in your React code
5. **Use React DevTools** browser extension for component inspection

#### VS Code Browser Debugging

Use the Chrome launch configuration:

1. Select "Launch Chrome for React (Docker)" in VS Code
2. This will open Chrome with debugging enabled
3. Set breakpoints in VS Code in your React files
4. Breakpoints will be hit when the code executes

### Hot Reload Configuration

The development setup includes hot reload for immediate feedback:

```yaml
# In docker-compose.dev.yml
environment:
  - CHOKIDAR_USEPOLLING=true
  - WATCHPACK_POLLING=true
volumes:
  - ./client:/app/client  # Mount source for hot reload
```

## Full-Stack Debugging

### Compound Launch Configuration

Use the "Full Stack Debug (Docker)" compound configuration to debug both frontend and backend simultaneously:

1. Select "Full Stack Debug (Docker)" in VS Code
2. This starts both backend and frontend debugging
3. Set breakpoints in both React and Node.js code
4. Debug the complete request/response cycle

### Debugging Workflow

1. **Set backend breakpoint** in an API endpoint
2. **Set frontend breakpoint** in a React component
3. **Trigger action** in the browser
4. **Step through** the complete flow:
   - Frontend → API call → Backend processing → Response → Frontend update

## Debugging Scripts

### Available NPM Scripts

```bash
# Docker Development
npm run docker:dev              # Start all services
npm run docker:dev:detached     # Start in background
npm run docker:dev:down         # Stop all services
npm run docker:dev:logs         # View logs
npm run docker:dev:restart      # Restart API service

# Debugging Specific
npm run docker:debug            # Start only API for debugging
npm run debug:backend           # Local backend debugging
npm run debug:backend:break     # Local backend with immediate break

# Frontend Development
npm run docker:frontend:dev     # Start frontend dev server
```

### Log Monitoring

```bash
# View all logs
npm run docker:dev:logs

# View specific service logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f client
```

## Troubleshooting

### Common Issues

#### Debugger Not Connecting

1. **Check port availability:**
   ```bash
   netstat -an | grep 9229
   ```

2. **Verify container is running:**
   ```bash
   docker ps | grep LibreChat
   ```

3. **Check debugger is listening:**
   ```bash
   docker logs LibreChat-Dev
   ```

#### Breakpoints Not Working

1. **Verify source maps:**
   - Check that `localRoot` and `remoteRoot` are correctly configured
   - Ensure source files are mounted as volumes

2. **Check file paths:**
   - VS Code path: `/workspaceFolder/api/server/index.js`
   - Container path: `/app/api/server/index.js`

#### Hot Reload Not Working

1. **Check file watching:**
   ```bash
   # Increase file watch limit on Linux
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Verify volume mounts:**
   - Ensure source directories are properly mounted
   - Check for permission issues

### Performance Issues

#### Slow Container Startup

1. **Use node_modules cache:**
   ```yaml
   volumes:
     - librechat_node_modules:/app/node_modules
   ```

2. **Optimize Docker build:**
   ```bash
   # Use BuildKit for faster builds
   DOCKER_BUILDKIT=1 docker-compose build
   ```

#### Memory Usage

1. **Monitor container resources:**
   ```bash
   docker stats LibreChat-Dev
   ```

2. **Adjust Node.js memory:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096"
   ```

## Advanced Debugging

### Database Debugging

MongoDB and PostgreSQL ports are exposed in development:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/LibreChat

# Connect to PostgreSQL
psql -h localhost -p 5432 -U myuser -d mydatabase
```

### Network Debugging

```bash
# Inspect Docker network
docker network ls
docker network inspect librechat_default

# Check service connectivity
docker exec LibreChat-Dev ping mongodb
docker exec LibreChat-Dev ping meilisearch
```

### Performance Profiling

#### Node.js Profiling

```bash
# Start with profiling
node --inspect --prof api/server/index.js

# Generate profile report
node --prof-process isolate-*.log > profile.txt
```

#### Memory Debugging

```bash
# Enable heap snapshots
node --inspect --expose-gc api/server/index.js
```

### Custom Debug Configuration

Create `.vscode/launch.json` entries for specific debugging scenarios:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Debug Specific Service",
  "address": "localhost",
  "port": 9229,
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app",
  "skipFiles": [
    "<node_internals>/**",
    "**/node_modules/**"
  ]
}
```

## Best Practices

1. **Use meaningful breakpoints** - Set breakpoints at decision points and error boundaries
2. **Leverage conditional breakpoints** - Right-click breakpoints to add conditions
3. **Use logpoints** - Add logging without modifying code
4. **Monitor performance** - Watch for memory leaks and performance bottlenecks
5. **Test error scenarios** - Debug error handling paths
6. **Use debug console** - Evaluate expressions and test fixes interactively

## Security Considerations

- Development debugging configurations should never be used in production
- Debug ports should not be exposed in production environments
- Development secrets in `.env.development` are for local use only
- Always use proper authentication and authorization in production

## Additional Resources

- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Docker Debugging Best Practices](https://docs.docker.com/config/containers/logging/)