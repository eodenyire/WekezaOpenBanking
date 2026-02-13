#!/usr/bin/env node

/**
 * User Registration & API Key Generation Demo
 * 
 * This script demonstrates:
 * 1. Developer registration
 * 2. API key generation
 * 3. API key verification
 */

const crypto = require('crypto');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     WEKEZA OPEN BANKING - USER REGISTRATION DEMO             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Simulate developer registration
class DeveloperRegistration {
  constructor() {
    this.developers = [];
    this.apiKeys = [];
  }

  /**
   * Register a new developer
   */
  registerDeveloper(email, name, company) {
    const developer = {
      id: crypto.randomUUID(),
      email: email,
      name: name,
      company: company,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      emailVerified: false
    };

    this.developers.push(developer);
    
    console.log('✓ Developer Registration Initiated');
    console.log('─────────────────────────────────');
    console.log(`  Email:      ${developer.email}`);
    console.log(`  Name:       ${developer.name}`);
    console.log(`  Company:    ${developer.company}`);
    console.log(`  ID:         ${developer.id}`);
    console.log(`  Status:     ${developer.status}`);
    console.log(`  Created:    ${developer.createdAt}\n`);

    return developer;
  }

  /**
   * Verify developer email
   */
  verifyEmail(developerId, verificationCode) {
    const developer = this.developers.find(d => d.id === developerId);
    
    if (!developer) {
      console.log('✗ Developer not found\n');
      return false;
    }

    // Simulate verification
    developer.emailVerified = true;
    developer.status = 'active';
    developer.verifiedAt = new Date().toISOString();

    console.log('✓ Email Verification Successful');
    console.log('─────────────────────────────────');
    console.log(`  Developer:  ${developer.name}`);
    console.log(`  Status:     ${developer.status}`);
    console.log(`  Verified:   ${developer.verifiedAt}\n`);

    return true;
  }

  /**
   * Generate API key for developer
   */
  generateApiKey(developerId, name, scopes = []) {
    const developer = this.developers.find(d => d.id === developerId);
    
    if (!developer) {
      console.log('✗ Developer not found\n');
      return null;
    }

    if (!developer.emailVerified) {
      console.log('✗ Email must be verified before generating API keys\n');
      return null;
    }

    const apiKey = {
      id: crypto.randomUUID(),
      key: 'wkz_' + crypto.randomBytes(32).toString('hex'),
      secret: 'wks_' + crypto.randomBytes(32).toString('hex'),
      developerId: developerId,
      name: name,
      scopes: scopes.length > 0 ? scopes : ['accounts:read', 'payments:read', 'payments:write'],
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      rateLimit: 1000, // requests per hour
      lastUsedAt: null
    };

    this.apiKeys.push(apiKey);

    console.log('✓ API Key Generated Successfully');
    console.log('─────────────────────────────────');
    console.log(`  Key Name:   ${apiKey.name}`);
    console.log(`  API Key:    ${apiKey.key}`);
    console.log(`  Secret:     ${apiKey.secret.substring(0, 20)}...`);
    console.log(`  Scopes:     ${apiKey.scopes.join(', ')}`);
    console.log(`  Rate Limit: ${apiKey.rateLimit} req/hour`);
    console.log(`  Expires:    ${apiKey.expiresAt}`);
    console.log(`  Status:     ${apiKey.status}\n`);

    console.log('⚠️  IMPORTANT: Store these credentials securely!');
    console.log('   The secret will not be shown again.\n');

    return apiKey;
  }

  /**
   * List all API keys for a developer
   */
  listApiKeys(developerId) {
    const keys = this.apiKeys.filter(k => k.developerId === developerId);
    
    console.log('✓ API Keys List');
    console.log('─────────────────────────────────');
    console.log(`  Total Keys: ${keys.length}\n`);

    keys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key.name}`);
      console.log(`     Key ID:    ${key.id}`);
      console.log(`     Status:    ${key.status}`);
      console.log(`     Scopes:    ${key.scopes.join(', ')}`);
      console.log(`     Created:   ${key.createdAt}`);
      console.log(`     Last Used: ${key.lastUsedAt || 'Never'}\n`);
    });

    return keys;
  }

  /**
   * Get developer profile
   */
  getDeveloperProfile(developerId) {
    const developer = this.developers.find(d => d.id === developerId);
    
    if (!developer) {
      console.log('✗ Developer not found\n');
      return null;
    }

    const apiKeysCount = this.apiKeys.filter(k => k.developerId === developerId).length;

    console.log('✓ Developer Profile');
    console.log('─────────────────────────────────');
    console.log(`  Name:           ${developer.name}`);
    console.log(`  Email:          ${developer.email}`);
    console.log(`  Company:        ${developer.company}`);
    console.log(`  ID:             ${developer.id}`);
    console.log(`  Status:         ${developer.status}`);
    console.log(`  Email Verified: ${developer.emailVerified ? 'Yes' : 'No'}`);
    console.log(`  API Keys:       ${apiKeysCount}`);
    console.log(`  Created:        ${developer.createdAt}\n`);

    return developer;
  }
}

// Run the demo
async function runDemo() {
  const system = new DeveloperRegistration();

  console.log('🚀 Starting User Registration Demo\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1: Register a new developer
  console.log('STEP 1: Register New Developer\n');
  const developer = system.registerDeveloper(
    'john.developer@wekezabank.com',
    'John Developer',
    'Wekeza Bank'
  );

  await sleep(1000);

  // Step 2: Verify email
  console.log('STEP 2: Verify Email Address\n');
  system.verifyEmail(developer.id, 'VERIFICATION_CODE_123456');

  await sleep(1000);

  // Step 3: Generate API keys
  console.log('STEP 3: Generate API Keys\n');
  
  console.log('Generating Production API Key...\n');
  const prodKey = system.generateApiKey(
    developer.id,
    'Production Key',
    ['accounts:read', 'accounts:write', 'payments:read', 'payments:write', 'webhooks:write']
  );

  await sleep(1000);

  console.log('Generating Development API Key...\n');
  const devKey = system.generateApiKey(
    developer.id,
    'Development Key',
    ['accounts:read', 'payments:read']
  );

  await sleep(1000);

  console.log('Generating Testing API Key...\n');
  const testKey = system.generateApiKey(
    developer.id,
    'Testing Key',
    ['accounts:read', 'payments:read', 'payments:write']
  );

  await sleep(1000);

  // Step 4: List all API keys
  console.log('STEP 4: List All API Keys\n');
  system.listApiKeys(developer.id);

  await sleep(1000);

  // Step 5: Get developer profile
  console.log('STEP 5: View Developer Profile\n');
  system.getDeveloperProfile(developer.id);

  await sleep(1000);

  // Summary
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ Registration Demo Complete!\n');
  console.log('Summary:');
  console.log('─────────────────────────────────');
  console.log(`  Developer Registered:     ${developer.name}`);
  console.log(`  Email Verified:           ✓`);
  console.log(`  API Keys Generated:       3`);
  console.log(`  Status:                   ${developer.status}`);
  console.log('\n');

  console.log('Next Steps:');
  console.log('─────────────────────────────────');
  console.log('  1. Store API credentials securely');
  console.log('  2. Use API keys to authenticate requests');
  console.log('  3. Test all API endpoints');
  console.log('  4. Monitor API usage in dashboard');
  console.log('  5. Rotate keys periodically for security\n');

  console.log('📚 Documentation: https://developer.wekezabank.com');
  console.log('🆘 Support: developer-support@wekezabank.com\n');

  return {
    developer,
    apiKeys: [prodKey, devKey, testKey]
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if executed directly
if (require.main === module) {
  runDemo()
    .then(() => {
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║              Registration Demo Completed Successfully         ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('✗ Error running demo:', error.message);
      process.exit(1);
    });
}

module.exports = { DeveloperRegistration };
