#!/usr/bin/env node

/**
 * Stress Test Runner for Wekeza Open Banking API
 * Tests system under various load conditions
 */

const axios = require('axios');
const chalk = require('chalk');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const STRESS_LEVELS = {
  light: { concurrent: 10, duration: 5000, name: 'Light Load' },
  moderate: { concurrent: 50, duration: 10000, name: 'Moderate Load' },
  heavy: { concurrent: 100, duration: 15000, name: 'Heavy Load' },
  extreme: { concurrent: 500, duration: 20000, name: 'Extreme Load' }
};

console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════╗'));
console.log(chalk.blue.bold('║   WEKEZA OPEN BANKING - STRESS TEST SUITE              ║'));
console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════╝\n'));

// Mock data generators
const generateMockAccount = () => ({
  accountNumber: `ACC${Math.floor(Math.random() * 1000000000)}`,
  accountType: ['savings', 'current', 'fixed_deposit'][Math.floor(Math.random() * 3)],
  balance: Math.floor(Math.random() * 1000000)
});

const generateMockPayment = () => ({
  from_account: `ACC${Math.floor(Math.random() * 1000000000)}`,
  to_account: `ACC${Math.floor(Math.random() * 1000000000)}`,
  amount: Math.floor(Math.random() * 10000) + 100,
  currency: 'KES',
  description: `Test payment ${Date.now()}`
});

// Performance metrics
const metrics = {
  requests: 0,
  successful: 0,
  failed: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimes: [],
  errors: []
};

// Make a single request
async function makeRequest(endpoint, method = 'GET', data = null) {
  const startTime = Date.now();
  metrics.requests++;
  
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      timeout: 30000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    metrics.successful++;
    metrics.totalResponseTime += responseTime;
    metrics.responseTimes.push(responseTime);
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    metrics.failed++;
    metrics.errors.push({
      endpoint,
      error: error.message,
      responseTime
    });
    
    return { success: false, responseTime, error: error.message };
  }
}

// Run concurrent requests
async function runConcurrentRequests(count, endpoint, method = 'GET') {
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(makeRequest(endpoint, method));
  }
  
  return Promise.all(promises);
}

// Calculate percentiles
function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Run stress test scenario
async function runStressTest(level) {
  console.log(chalk.yellow(`\n▶ Running ${level.name}`));
  console.log(chalk.gray(`   Concurrent Requests: ${level.concurrent}`));
  console.log(chalk.gray(`   Duration: ${level.duration}ms\n`));
  
  // Reset metrics
  Object.assign(metrics, {
    requests: 0,
    successful: 0,
    failed: 0,
    totalResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    responseTimes: [],
    errors: []
  });
  
  const startTime = Date.now();
  const endTime = startTime + level.duration;
  
  // Run requests continuously until duration expires
  while (Date.now() < endTime) {
    await runConcurrentRequests(level.concurrent, '/health');
    
    // Small delay to prevent overwhelming
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Calculate statistics
  const avgResponseTime = metrics.totalResponseTime / metrics.successful || 0;
  const successRate = (metrics.successful / metrics.requests * 100).toFixed(2);
  const requestsPerSecond = (metrics.requests / (totalDuration / 1000)).toFixed(2);
  
  const p50 = calculatePercentile(metrics.responseTimes, 50);
  const p95 = calculatePercentile(metrics.responseTimes, 95);
  const p99 = calculatePercentile(metrics.responseTimes, 99);
  
  // Print results
  console.log(chalk.green(`✓ ${level.name} completed\n`));
  console.log(chalk.cyan('  Performance Metrics:'));
  console.log(chalk.gray(`    Total Requests: ${metrics.requests}`));
  console.log(chalk.green(`    Successful: ${metrics.successful}`));
  console.log(chalk.red(`    Failed: ${metrics.failed}`));
  console.log(chalk.cyan(`    Success Rate: ${successRate}%`));
  console.log(chalk.gray(`    Requests/Second: ${requestsPerSecond}`));
  
  console.log(chalk.cyan('\n  Response Times:'));
  console.log(chalk.gray(`    Average: ${avgResponseTime.toFixed(2)}ms`));
  console.log(chalk.gray(`    Minimum: ${metrics.minResponseTime}ms`));
  console.log(chalk.gray(`    Maximum: ${metrics.maxResponseTime}ms`));
  console.log(chalk.gray(`    P50: ${p50}ms`));
  console.log(chalk.gray(`    P95: ${p95}ms`));
  console.log(chalk.gray(`    P99: ${p99}ms`));
  
  if (metrics.errors.length > 0) {
    console.log(chalk.red('\n  Errors:'));
    metrics.errors.slice(0, 5).forEach(err => {
      console.log(chalk.gray(`    - ${err.error}`));
    });
    if (metrics.errors.length > 5) {
      console.log(chalk.gray(`    ... and ${metrics.errors.length - 5} more`));
    }
  }
  
  return {
    level: level.name,
    metrics: {
      requests: metrics.requests,
      successful: metrics.successful,
      failed: metrics.failed,
      successRate: parseFloat(successRate),
      requestsPerSecond: parseFloat(requestsPerSecond),
      avgResponseTime,
      minResponseTime: metrics.minResponseTime,
      maxResponseTime: metrics.maxResponseTime,
      p50,
      p95,
      p99
    }
  };
}

// Main execution
async function main() {
  console.log(chalk.cyan('Checking API availability...\n'));
  
  try {
    await makeRequest('/health');
    console.log(chalk.green('✓ API is responding\n'));
  } catch (error) {
    console.log(chalk.red('✗ API is not available'));
    console.log(chalk.yellow('  Make sure the API server is running at ' + API_BASE_URL));
    console.log(chalk.gray('  Start with: npm start\n'));
    process.exit(1);
  }
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════\n'));
  console.log(chalk.cyan('Starting stress tests...\n'));
  
  const results = [];
  
  // Run different load levels
  for (const [key, level] of Object.entries(STRESS_LEVELS)) {
    const result = await runStressTest(level);
    results.push(result);
  }
  
  // Print summary
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('                  STRESS TEST SUMMARY                       '));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════\n'));
  
  results.forEach(result => {
    console.log(chalk.cyan(`${result.level}:`));
    console.log(chalk.gray(`  Requests: ${result.metrics.requests}`));
    console.log(chalk.gray(`  Success Rate: ${result.metrics.successRate}%`));
    console.log(chalk.gray(`  Avg Response Time: ${result.metrics.avgResponseTime.toFixed(2)}ms`));
    console.log(chalk.gray(`  Requests/Second: ${result.metrics.requestsPerSecond}\n`));
  });
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════\n'));
  
  // Determine overall result
  const allPassed = results.every(r => r.metrics.successRate >= 95);
  
  if (allPassed) {
    console.log(chalk.green.bold('✓ STRESS TEST PASSED - System is stable under load!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('✗ STRESS TEST FAILED - System showed instability\n'));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('\nUnexpected error:'), error);
    process.exit(1);
  });
}

module.exports = { runStressTest, makeRequest };
