#!/usr/bin/env node

/**
 * NPM Script Runner for Static OG Build Process
 * This script mimics the build command integration since package.json is read-only
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMMANDS = {
  'build': 'node scripts/complete-build.js',
  'build:og': 'node scripts/generate-static-og.js',
  'build:spa': 'tsc && vite build',
  'dev': 'vite',
  'preview': 'vite preview',
  'lint': 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0'
};

function showHelp() {
  console.log('📦 Static OG Build Runner\n');
  console.log('Available commands:');
  Object.entries(COMMANDS).forEach(([cmd, script]) => {
    console.log(`  ${cmd.padEnd(12)} ${script}`);
  });
  console.log('\nUsage:');
  console.log('  node scripts/npm-runner.js build');
  console.log('  node scripts/npm-runner.js dev');
  console.log('  npm run build (if configured in package.json)');
}

function runCommand(command, args = []) {
  const script = COMMANDS[command];
  
  if (!script) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('\nAvailable commands:', Object.keys(COMMANDS).join(', '));
    process.exit(1);
  }
  
  console.log(`🚀 Running: ${script}`);
  console.log('─'.repeat(50));
  
  try {
    execSync(script, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, ...args.reduce((acc, arg) => {
        const [key, value] = arg.split('=');
        if (key && value) acc[key] = value;
        return acc;
      }, {}) }
    });
    
    console.log('\n✅ Command completed successfully');
  } catch (error) {
    console.error('\n❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const [,, command, ...args] = process.argv;

if (!command || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

runCommand(command, args);