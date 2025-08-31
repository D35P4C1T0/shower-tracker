#!/usr/bin/env node

/**
 * Lighthouse audit script for performance optimization
 * This script runs Lighthouse audits and provides recommendations
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const LIGHTHOUSE_CONFIG = {
  // Focus on performance, accessibility, best practices, and SEO
  categories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
  // Mobile-first audit
  formFactor: 'mobile',
  // Throttling settings for realistic conditions
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4
  }
};

function checkLighthouseInstalled() {
  try {
    execSync('lighthouse --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function installLighthouse() {
  console.log('📦 Installing Lighthouse CLI...');
  try {
    execSync('npm install -g lighthouse', { stdio: 'inherit' });
    console.log('✅ Lighthouse installed successfully');
  } catch (error) {
    console.error('❌ Failed to install Lighthouse:', error.message);
    process.exit(1);
  }
}

function runLighthouseAudit(url) {
  console.log(`🔍 Running Lighthouse audit on ${url}...`);
  
  const outputDir = 'lighthouse-reports';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(outputDir, `lighthouse-report-${timestamp}.html`);
  const jsonPath = join(outputDir, `lighthouse-report-${timestamp}.json`);
  
  // Create output directory if it doesn't exist
  try {
    execSync(`mkdir -p ${outputDir}`, { stdio: 'ignore' });
  } catch (error) {
    // Directory might already exist
  }
  
  const lighthouseCmd = [
    'lighthouse',
    url,
    '--output=html,json',
    `--output-path=${reportPath.replace('.html', '')}`,
    '--form-factor=mobile',
    '--throttling-method=simulate',
    '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"',
    '--quiet'
  ].join(' ');
  
  try {
    execSync(lighthouseCmd, { stdio: 'inherit' });
    console.log(`✅ Lighthouse audit completed`);
    console.log(`📊 HTML Report: ${reportPath}`);
    console.log(`📋 JSON Report: ${jsonPath}`);
    
    // Try to parse and display key metrics
    if (existsSync(jsonPath)) {
      try {
        const report = JSON.parse(require('fs').readFileSync(jsonPath, 'utf8'));
        displayKeyMetrics(report);
      } catch (error) {
        console.log('⚠️  Could not parse JSON report for metrics display');
      }
    }
    
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error.message);
    process.exit(1);
  }
}

function displayKeyMetrics(report) {
  console.log('\n📈 Key Performance Metrics:');
  console.log('================================');
  
  const audits = report.audits;
  const categories = report.categories;
  
  // Display category scores
  Object.entries(categories).forEach(([key, category]) => {
    const score = Math.round(category.score * 100);
    const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    console.log(`${emoji} ${category.title}: ${score}/100`);
  });
  
  console.log('\n⚡ Core Web Vitals:');
  console.log('==================');
  
  // Core Web Vitals
  const coreWebVitals = {
    'largest-contentful-paint': 'LCP (Largest Contentful Paint)',
    'first-input-delay': 'FID (First Input Delay)',
    'cumulative-layout-shift': 'CLS (Cumulative Layout Shift)',
    'first-contentful-paint': 'FCP (First Contentful Paint)',
    'speed-index': 'Speed Index',
    'total-blocking-time': 'TBT (Total Blocking Time)'
  };
  
  Object.entries(coreWebVitals).forEach(([auditId, label]) => {
    const audit = audits[auditId];
    if (audit) {
      const value = audit.displayValue || audit.numericValue;
      const score = Math.round((audit.score || 0) * 100);
      const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
      console.log(`${emoji} ${label}: ${value} (${score}/100)`);
    }
  });
  
  console.log('\n💡 Top Opportunities:');
  console.log('=====================');
  
  // Display top opportunities for improvement
  const opportunities = Object.values(audits)
    .filter(audit => audit.details && audit.details.type === 'opportunity')
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
    .slice(0, 5);
    
  if (opportunities.length > 0) {
    opportunities.forEach(audit => {
      const savings = audit.displayValue || `${Math.round(audit.numericValue || 0)}ms`;
      console.log(`• ${audit.title}: ${savings} potential savings`);
    });
  } else {
    console.log('🎉 No major optimization opportunities found!');
  }
}

function main() {
  console.log('🚀 Shower Tracker - Lighthouse Performance Audit');
  console.log('================================================\n');
  
  // Check if Lighthouse is installed
  if (!checkLighthouseInstalled()) {
    console.log('⚠️  Lighthouse CLI not found');
    installLighthouse();
  }
  
  // Get URL from command line or use default
  const url = process.argv[2] || 'http://localhost:4173';
  
  console.log(`🎯 Target URL: ${url}`);
  console.log('📱 Device: Mobile (simulated)');
  console.log('🌐 Network: Slow 4G (simulated)\n');
  
  // Run the audit
  runLighthouseAudit(url);
  
  console.log('\n🎯 Performance Optimization Tips:');
  console.log('=================================');
  console.log('• Ensure images are optimized and use modern formats (WebP, AVIF)');
  console.log('• Minimize unused JavaScript and CSS');
  console.log('• Use code splitting to reduce initial bundle size');
  console.log('• Implement proper caching strategies');
  console.log('• Optimize Core Web Vitals (LCP, FID, CLS)');
  console.log('• Test on real devices and networks when possible');
}

// Run the script
main();