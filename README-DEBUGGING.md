# LibreChat Docker Debugging Setup

This document provides a complete guide for debugging LibreChat while running in Docker containers. The setup includes full-stack debugging capabilities for both frontend and backend components.

## 🚀 Quick Start

### 1. Start Development Environment

```bash
# Start all services in development mode with debugging enabled
npm run docker:dev

# Or start in detached mode (background)
npm run docker:dev:detached
```

### 2. Attach VS Code Debugger

1. Open VS Code in the LibreChat project directory
2. Go to **Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D)
3. Select **"Attach to LibreChat (Docker)"** from the dropdown
4. Click the **Play button** or press **F5**

### 3. Set Breakpoints and Debug

- Open any backend file (e.g., `api/server/index.js`)
- Click in the gutter to set breakpoints
- Trigger the code path through the application
- Use VS Code's debugging features to step through code

## 📁 Files Created

This debugging setup includes the following new files:

### Docker Configuration
- **`Dockerfile.dev`** - Development Dockerfile with debugging support
- **`docker-compose.dev.yml`** - Development Docker Compose configuration

### VS Code Configuration
- **`.vscode/launch.json`** - Debug launch configurations (updated)
- **`.vscode/settings.json`** - Optimized VS Code settings for debugging
- **`.vscode/extensions.json`** - Recommended extensions for debugging

### Environment & Scripts
- **`.env.development`** - Development environment variables
- **`scripts/debug-monitor.js`** - Container monitoring and log aggregation script

### Documentation
- **`docs/debugging/docker-debugging-guide.md`** - Comprehensive debugging guide
- **`README-DEBUGGING.md`** - This quick start guide

## 🛠️ Available Debugging Scripts

```bash
# Docker Development Commands
npm run docker:dev              # Start all services in development mode
npm run docker:dev:detached     # Start in background
npm run docker:dev:down         # Stop all services
npm run docker:dev:logs         # View aggregated logs
npm run docker:dev:restart      # Restart API service

# Specific Debugging Commands
npm run docker:debug            # Start only API for debugging
npm run debug:backend           # Local backend debugging
npm run debug:backend:break     # Local backend with immediate break

# Frontend Development
npm run docker:frontend:dev     # Start frontend dev server in container

# Monitoring
node scripts/debug-monitor.js --help    # Show monitoring options
node scripts/debug-monitor.js --stats   # Show container statistics
node scripts/debug-monitor.js --logs -f # Follow logs in real-time
```

## 🎯 Debugging Capabilities

### Backend Debugging
- **Node.js Debugger**: Full breakpoint support with variable inspection
- **Port Forwarding**: Debug port 9229 exposed for VS Code attachment
- **Hot Reload**: Source code changes reflected without container rebuild
- **Environment Variables**: Development-specific debugging settings

### Frontend Debugging
- **React DevTools**: Browser-based component inspection
- **Source Maps**: Accurate debugging of TypeScript/JSX code
- **Hot Module Replacement**: Instant updates during development
- **Browser Debugging**: Chrome DevTools integration via VS Code

### Container Debugging
- **Log Aggregation**: Centralized logging from all services
- **Health Monitoring**: Container status and service health checks
- **Performance Monitoring**: Resource usage and performance metrics
- **Network Debugging**: Service connectivity and port mapping

## 🔧 VS Code Launch Configurations

The setup includes several pre-configured debugging options:

### Backend Debugging
- **"Attach to LibreChat (Docker)"** - Attach to running container
- **"Launch LibreChat (Local)"** - Run locally for debugging
- **"Debug API Tests"** - Debug backend test suite

### Frontend Debugging
- **"Launch Chrome for React (Docker)"** - Debug React app in Chrome
- **"Launch Chrome for React (Local)"** - Debug local React dev server

### Full-Stack Debugging
- **"Full Stack Debug (Docker)"** - Debug both frontend and backend simultaneously
- **"Full Stack Debug (Local)"** - Local full-stack debugging

## 🐳 Container Architecture

The development setup includes these services:

| Service | Port | Purpose | Debug Port |
|---------|------|---------|------------|
| **api** | 3080 | LibreChat API Server | 9229 |
| **client** | 3000 | React Development Server | - |
| **mongodb** | 27017 | Database | - |
| **meilisearch** | 7700 | Search Engine | - |
| **vectordb** | 5432 | PostgreSQL Vector DB | - |
| **rag_api** | 8000 | RAG API Service | - |

## 📊 Monitoring and Logs

### Real-time Monitoring
```bash
# Show container statistics
node scripts/debug-monitor.js --stats

# Show health status
node scripts/debug-monitor.js --health

# Follow logs from all services
node scripts/debug-monitor.js --logs --follow

# Monitor specific service
node scripts/debug-monitor.js --service api --logs --follow
```

### Log Locations
- **Container Logs**: `docker-compose logs -f [service]`
- **Application Logs**: `./logs/` directory (mounted volume)
- **Debug Output**: VS Code Debug Console

## 🔍 Debugging Workflow

### 1. Backend API Debugging
1. Start development environment: `npm run docker:dev`
2. Attach VS Code debugger: Select "Attach to LibreChat (Docker)"
3. Set breakpoints in API files (e.g., `api/server/routes/`)
4. Make API requests through the frontend or tools like Postman
5. Debug with full variable inspection and call stack

### 2. Frontend React Debugging
1. Ensure development environment is running
2. Launch Chrome debugging: Select "Launch Chrome for React (Docker)"
3. Set breakpoints in React components
4. Interact with the application to trigger breakpoints
5. Use React DevTools for component state inspection

### 3. Full-Stack Request Flow Debugging
1. Use "Full Stack Debug (Docker)" compound configuration
2. Set breakpoints in both frontend and backend code
3. Trigger a user action that involves API calls
4. Step through the complete request/response cycle

## 🚨 Troubleshooting

### Common Issues

#### Debugger Not Connecting
```bash
# Check if debug port is accessible
telnet localhost 9229

# Verify container is running with debug port
docker ps | grep LibreChat
docker logs LibreChat-Dev
```

#### Breakpoints Not Working
- Ensure source maps are enabled
- Verify `localRoot` and `remoteRoot` paths in launch.json
- Check that source files are mounted as volumes

#### Hot Reload Not Working
```bash
# Increase file watch limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### Container Performance Issues
```bash
# Monitor resource usage
docker stats LibreChat-Dev

# Check container logs for errors
npm run docker:dev:logs
```

### Getting Help

1. **Check the comprehensive guide**: `docs/debugging/docker-debugging-guide.md`
2. **Monitor container health**: `node scripts/debug-monitor.js --health`
3. **Review container logs**: `npm run docker:dev:logs`
4. **Verify VS Code extensions**: Install recommended extensions from `.vscode/extensions.json`

## 🔒 Security Notes

- **Development Only**: This debugging setup is for development environments only
- **Port Exposure**: Debug ports should never be exposed in production
- **Environment Variables**: Development secrets in `.env.development` are for local use only
- **Container Security**: Development containers run with relaxed security for debugging

## 📚 Additional Resources

- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Docker Debugging Best Practices](https://docs.docker.com/config/containers/logging/)

## 🎉 Happy Debugging!

This setup provides a comprehensive debugging environment for LibreChat development. The combination of Docker containerization with VS Code debugging tools offers a powerful and consistent development experience.

For detailed information about specific debugging scenarios, advanced configuration, and troubleshooting, refer to the complete guide at `docs/debugging/docker-debugging-guide.md`.