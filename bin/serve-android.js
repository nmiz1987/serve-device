#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

console.log('🎮 Starting Serve Android...\n');

// Check if built client exists
const clientDist = path.join(clientDir, 'dist');
const clientExists = fs.existsSync(clientDist);

// Check if server is built
const serverDist = path.join(serverDir, 'dist');
const serverExists = fs.existsSync(serverDist);

let needsBuild = false;

if (!clientExists) {
  console.log('📦 Building client...');
  needsBuild = true;
}

if (!serverExists) {
  console.log('📦 Building server...');
  needsBuild = true;
}

if (needsBuild) {
  const build = spawnSync('bun', ['run', 'build'], {
    cwd: rootDir,
    stdio: 'inherit'
  });

  if (build.status !== 0) {
    console.error('\n❌ Build failed');
    process.exit(1);
  }
  console.log('');
}

startServer();

function startServer() {
  console.log('🚀 Starting server...');
  console.log('🌐 UI will be available on the port shown below');
  console.log('📱 Connect an Android device to control it\n');

  const server = spawn('bun', ['run', 'start'], {
    cwd: serverDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3000'
    }
  });

  server.on('close', (code) => {
    process.exit(code || 0);
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    process.exit(1);
  });

  // Handle signals
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
  });
}
