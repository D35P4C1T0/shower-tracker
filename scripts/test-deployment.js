#!/usr/bin/env node

/**
 * Test deployment builds for both GitHub Pages and Vercel
 */

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    return false;
  }
}

function checkBuildOutput() {
  const distPath = join(process.cwd(), 'dist');
  
  if (!existsSync(distPath)) {
    log('✗ Build output directory not found', 'red');
    return false;
  }

  const requiredFiles = [
    'index.html',
    'manifest.webmanifest',
    'sw.js'
  ];

  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = join(distPath, file);
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      log(`✓ ${file} (${Math.round(stats.size / 1024)}KB)`, 'green');
    } else {
      log(`✗ ${file} missing`, 'red');
      allFilesExist = false;
    }
  }

  return allFilesExist;
}

async function main() {
  log('🚀 Testing Deployment Builds', 'blue');
  
  // Test GitHub Pages build
  log('\n📦 Testing GitHub Pages Build', 'yellow');
  const githubSuccess = runCommand('npm run build:github', 'GitHub Pages build');
  
  if (githubSuccess) {
    log('\n📋 Checking GitHub Pages build output:', 'blue');
    checkBuildOutput();
  }

  // Clean and test Vercel build
  log('\n🧹 Cleaning build directory', 'blue');
  runCommand('rm -rf dist', 'Clean dist directory');
  
  log('\n📦 Testing Vercel Build', 'yellow');
  const vercelSuccess = runCommand('npm run build:vercel', 'Vercel build');
  
  if (vercelSuccess) {
    log('\n📋 Checking Vercel build output:', 'blue');
    checkBuildOutput();
  }

  // Run tests
  log('\n🧪 Running Tests', 'yellow');
  const testSuccess = runCommand('npm run test', 'Unit tests');
  
  // Summary
  log('\n📊 Deployment Test Summary:', 'blue');
  log(`GitHub Pages Build: ${githubSuccess ? '✓' : '✗'}`, githubSuccess ? 'green' : 'red');
  log(`Vercel Build: ${vercelSuccess ? '✓' : '✗'}`, vercelSuccess ? 'green' : 'red');
  log(`Tests: ${testSuccess ? '✓' : '✗'}`, testSuccess ? 'green' : 'red');
  
  if (githubSuccess && vercelSuccess && testSuccess) {
    log('\n🎉 All deployment tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some deployment tests failed', 'red');
    process.exit(1);
  }
}

main().catch(console.error);