#!/usr/bin/env node

/**
 * Debug Monitor Script for LibreChat Docker Development
 *
 * This script provides real-time monitoring of Docker containers,
 * log aggregation, and debugging utilities for LibreChat development.
 *
 * Usage:
 *   node scripts/debug-monitor.js [options]
 *
 * Options:
 *   --logs, -l      Show container logs
 *   --stats, -s     Show container stats
 *   --health, -h    Show container health
 *   --follow, -f    Follow logs in real-time
 *   --service <name> Monitor specific service
 *   --help          Show help
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DebugMonitor {
  constructor() {
    this.services = ['api', 'mongodb', 'meilisearch', 'vectordb', 'rag_api'];
    this.composeFiles = ['docker-compose.yml', 'docker-compose.dev.yml'];
    this.logColors = {
      api: '\x1b[36m', // Cyan
      mongodb: '\x1b[32m', // Green
      meilisearch: '\x1b[33m', // Yellow
      vectordb: '\x1b[35m', // Magenta
      rag_api: '\x1b[34m', // Blue
      reset: '\x1b[0m', // Reset
    };
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
      logs: false,
      stats: false,
      health: false,
      follow: false,
      service: null,
      help: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--logs':
        case '-l':
          options.logs = true;
          break;
        case '--stats':
        case '-s':
          options.stats = true;
          break;
        case '--health':
        case '-h':
          options.health = true;
          break;
        case '--follow':
        case '-f':
          options.follow = true;
          break;
        case '--service':
          options.service = args[++i];
          break;
        case '--help':
          options.help = true;
          break;
        default:
          console.log(`Unknown option: ${arg}`);
          options.help = true;
      }
    }

    return options;
  }

  showHelp() {
    console.log(`
LibreChat Debug Monitor

Usage: node scripts/debug-monitor.js [options]

Options:
  --logs, -l           Show container logs
  --stats, -s          Show container stats  
  --health, -h         Show container health
  --follow, -f         Follow logs in real-time
  --service <name>     Monitor specific service (${this.services.join(', ')})
  --help               Show this help message

Examples:
  node scripts/debug-monitor.js --logs --follow
  node scripts/debug-monitor.js --stats
  node scripts/debug-monitor.js --service api --logs --follow
  node scripts/debug-monitor.js --health
`);
  }

  async checkDockerCompose() {
    return new Promise((resolve) => {
      exec('docker-compose --version', (error) => {
        if (error) {
          exec('docker compose version', (error2) => {
            resolve(!error2);
          });
        } else {
          resolve(true);
        }
      });
    });
  }

  getComposeCommand() {
    return new Promise((resolve) => {
      exec('docker-compose --version', (error) => {
        if (error) {
          resolve('docker compose');
        } else {
          resolve('docker-compose');
        }
      });
    });
  }

  async getContainerStatus() {
    const composeCmd = await this.getComposeCommand();
    const composeArgs = this.composeFiles.map((f) => ['-f', f]).flat();

    return new Promise((resolve, reject) => {
      const cmd = spawn(composeCmd.split(' ')[0], [
        ...composeCmd.split(' ').slice(1),
        ...composeArgs,
        'ps',
        '--format',
        'json',
      ]);

      let output = '';
      cmd.stdout.on('data', (data) => {
        output += data.toString();
      });

      cmd.on('close', (code) => {
        if (code === 0) {
          try {
            const containers = output
              .trim()
              .split('\n')
              .filter((line) => line.trim())
              .map((line) => JSON.parse(line));
            resolve(containers);
          } catch (error) {
            resolve([]);
          }
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  async showContainerStats() {
    try {
      const containers = await this.getContainerStatus();

      console.log('\n📊 Container Statistics\n');
      console.log('Service'.padEnd(15) + 'Status'.padEnd(12) + 'Ports'.padEnd(30) + 'Health');
      console.log('─'.repeat(70));

      for (const container of containers) {
        const service = container.Service || 'unknown';
        const status = container.State || 'unknown';
        const ports = container.Publishers
          ? container.Publishers.map((p) => `${p.PublishedPort}:${p.TargetPort}`).join(', ')
          : 'none';
        const health = container.Health || 'unknown';

        const color = this.logColors[service] || '';
        const reset = this.logColors.reset;

        console.log(
          `${color}${service.padEnd(15)}${reset}` +
            `${status.padEnd(12)}` +
            `${ports.padEnd(30)}` +
            `${health}`,
        );
      }

      console.log('\n');
    } catch (error) {
      console.error('❌ Error getting container stats:', error.message);
    }
  }

  async showContainerHealth() {
    try {
      console.log('\n🏥 Container Health Check\n');

      const containers = await this.getContainerStatus();

      for (const container of containers) {
        const service = container.Service || 'unknown';
        const status = container.State || 'unknown';
        const color = this.logColors[service] || '';
        const reset = this.logColors.reset;

        console.log(`${color}${service}${reset}: ${status}`);

        // Check if container is running and accessible
        if (status === 'running') {
          await this.checkServiceHealth(service, container);
        }
      }

      console.log('\n');
    } catch (error) {
      console.error('❌ Error checking container health:', error.message);
    }
  }

  async checkServiceHealth(service, container) {
    const healthChecks = {
      api: () => this.checkHttpHealth('http://localhost:3080/health'),
      mongodb: () => this.checkPortHealth('localhost', 27017),
      meilisearch: () => this.checkHttpHealth('http://localhost:7700/health'),
      vectordb: () => this.checkPortHealth('localhost', 5432),
      rag_api: () => this.checkHttpHealth('http://localhost:8000/health'),
    };

    const healthCheck = healthChecks[service];
    if (healthCheck) {
      try {
        const isHealthy = await healthCheck();
        console.log(`  └─ Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      } catch (error) {
        console.log(`  └─ Health: ❌ Error (${error.message})`);
      }
    }
  }

  async checkHttpHealth(url) {
    return new Promise((resolve) => {
      const http = require('http');
      const urlObj = new URL(url);

      const req = http.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          timeout: 5000,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        },
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  async checkPortHealth(host, port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(5000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => resolve(false));
      socket.on('timeout', () => resolve(false));

      socket.connect(port, host);
    });
  }

  async showLogs(options) {
    const composeCmd = await this.getComposeCommand();
    const composeArgs = this.composeFiles.map((f) => ['-f', f]).flat();

    const args = [...composeCmd.split(' ').slice(1), ...composeArgs, 'logs'];

    if (options.follow) {
      args.push('-f');
    }

    if (options.service) {
      args.push(options.service);
    }

    console.log(`\n📋 Container Logs ${options.follow ? '(following)' : ''}\n`);

    const cmd = spawn(composeCmd.split(' ')[0], args, {
      stdio: 'inherit',
    });

    cmd.on('close', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Logs command failed with code ${code}`);
      }
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n\n👋 Stopping log monitoring...');
      cmd.kill('SIGTERM');
      process.exit(0);
    });
  }

  async run() {
    const options = this.parseArgs();

    if (options.help) {
      this.showHelp();
      return;
    }

    // Check if docker-compose is available
    const hasDockerCompose = await this.checkDockerCompose();
    if (!hasDockerCompose) {
      console.error('❌ Docker Compose not found. Please install Docker Compose.');
      process.exit(1);
    }

    // Validate service if specified
    if (options.service && !this.services.includes(options.service)) {
      console.error(`❌ Invalid service: ${options.service}`);
      console.error(`Available services: ${this.services.join(', ')}`);
      process.exit(1);
    }

    console.log('🐳 LibreChat Debug Monitor\n');

    try {
      if (options.stats) {
        await this.showContainerStats();
      }

      if (options.health) {
        await this.showContainerHealth();
      }

      if (options.logs) {
        await this.showLogs(options);
      }

      // If no specific action, show stats by default
      if (!options.stats && !options.health && !options.logs) {
        await this.showContainerStats();
        await this.showContainerHealth();
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run the monitor if this script is executed directly
if (require.main === module) {
  const monitor = new DebugMonitor();
  monitor.run().catch(console.error);
}

module.exports = DebugMonitor;
