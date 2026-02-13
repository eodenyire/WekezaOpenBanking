#!/usr/bin/env node

/**
 * Test Runner for Wekeza Open Banking API
 * Runs comprehensive tests and collects evidence
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  suites: []
};

console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════╗'));
console.log(chalk.blue.bold('║   WEKEZA OPEN BANKING - COMPREHENSIVE TEST SUITE       ║'));
console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════╝\n'));

// Test suites to run
const testSuites = [
  { name: 'API Endpoints', file: 'api.test.js', description: 'Core API functionality' },
  { name: 'Developer Portal', file: 'developer-portal.test.js', description: 'Developer registration and management' },
  { name: 'API Key Management', file: 'api-key-management.test.js', description: 'API key lifecycle' },
  { name: 'Core Banking', file: 'core-banking.test.js', description: 'Banking operations' },
  { name: 'Channels', file: 'channels.test.js', description: 'Multi-channel integration' },
  { name: 'ERMS', file: 'erms.test.js', description: 'Enterprise resource management' },
  { name: 'Fraud Management', file: 'fraud-management.test.js', description: 'Fraud detection and prevention' },
  { name: 'Payment Systems', file: 'payment-systems.test.js', description: 'Payment processing' },
  { name: 'Security & Compliance', file: 'security-compliance.test.js', description: 'Security and compliance' },
  { name: 'End-to-End Scenarios', file: 'end-to-end-scenarios.test.js', description: 'Complete workflows' },
  { name: 'Performance', file: 'performance.test.js', description: 'Performance benchmarks' }
];

console.log(chalk.cyan('📋 Test Suites to Execute:\n'));
testSuites.forEach((suite, index) => {
  console.log(chalk.gray(`   ${index + 1}. ${suite.name} - ${suite.description}`));
});
console.log('');

// Run individual test suite
function runTestSuite(suite) {
  console.log(chalk.yellow(`\n▶ Running: ${suite.name}`));
  console.log(chalk.gray(`   File: ${suite.file}`));
  console.log(chalk.gray(`   Description: ${suite.description}\n`));

  const startTime = Date.now();
  
  try {
    const output = execSync(
      `npm test -- tests/${suite.file} --verbose --no-coverage`,
      { 
        cwd: __dirname,
        encoding: 'utf-8',
        stdio: 'pipe'
      }
    );
    
    const duration = Date.now() - startTime;
    
    // Parse output for test counts
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);
    const totalMatch = output.match(/(\d+) total/);
    
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed + skipped;
    
    results.total += total;
    results.passed += passed;
    results.failed += failed;
    results.skipped += skipped;
    results.duration += duration;
    
    results.suites.push({
      name: suite.name,
      file: suite.file,
      passed,
      failed,
      skipped,
      total,
      duration,
      status: failed === 0 ? 'PASSED' : 'FAILED'
    });
    
    console.log(chalk.green(`✓ ${suite.name} completed in ${duration}ms`));
    console.log(chalk.gray(`   Tests: ${passed} passed, ${failed} failed, ${skipped} skipped, ${total} total\n`));
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    results.suites.push({
      name: suite.name,
      file: suite.file,
      passed: 0,
      failed: 1,
      skipped: 0,
      total: 1,
      duration,
      status: 'ERROR',
      error: error.message
    });
    
    results.failed += 1;
    results.total += 1;
    
    console.log(chalk.red(`✗ ${suite.name} failed`));
    console.log(chalk.gray(`   Error: ${error.message.split('\n')[0]}\n`));
  }
}

// Run all test suites
console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════\n'));
console.log(chalk.cyan('Starting test execution...\n'));

const overallStart = Date.now();

// Run tests one by one
for (const suite of testSuites) {
  runTestSuite(suite);
}

const overallDuration = Date.now() - overallStart;

// Print summary
console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════'));
console.log(chalk.blue.bold('                    TEST SUMMARY                           '));
console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════\n'));

console.log(chalk.cyan('Test Suites:'));
results.suites.forEach(suite => {
  const status = suite.status === 'PASSED' 
    ? chalk.green('✓ PASSED') 
    : suite.status === 'ERROR' 
    ? chalk.red('✗ ERROR') 
    : chalk.red('✗ FAILED');
  
  console.log(`  ${status} ${suite.name}`);
  console.log(chalk.gray(`    ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped (${suite.duration}ms)`));
});

console.log(chalk.cyan('\n\nOverall Statistics:'));
console.log(chalk.gray(`  Total Tests: ${results.total}`));
console.log(chalk.green(`  Passed: ${results.passed}`));
console.log(chalk.red(`  Failed: ${results.failed}`));
console.log(chalk.yellow(`  Skipped: ${results.skipped}`));
console.log(chalk.gray(`  Duration: ${overallDuration}ms (${(overallDuration / 1000).toFixed(2)}s)`));

const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;
console.log(chalk.cyan(`  Pass Rate: ${passRate}%`));

// Save results to file
const resultsPath = path.join(__dirname, 'test-results.json');
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(chalk.gray(`\n  Results saved to: ${resultsPath}`));

console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════\n'));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
