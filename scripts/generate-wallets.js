#!/usr/bin/env node

/**
 * Generate Qubic Wallets Script
 * Creates test wallets for Brand, Influencer, and Oracle
 * 
 * Usage: node scripts/generate-wallets.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
console.log(`${colors.bright}${colors.blue}    Qubic Smart Escrow - Wallet Generator${colors.reset}`);
console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);

/**
 * Generate a Qubic-style public key (60 uppercase characters)
 */
function generatePublicKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let key = '';
  for (let i = 0; i < 60; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Generate a Qubic-style private key/seed (55 lowercase characters)
 */
function generatePrivateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let key = '';
  for (let i = 0; i < 55; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Create a wallet object
 */
function createWallet(name, initialBalance = 1000000) {
  return {
    name: name,
    publicKey: generatePublicKey(),
    privateKey: generatePrivateKey(),
    balance: initialBalance,
    created: new Date().toISOString()
  };
}

/**
 * Display wallet info
 */
function displayWallet(wallet) {
  console.log(`${colors.cyan}${colors.bright}${wallet.name} Wallet:${colors.reset}`);
  console.log(`  Public Key:  ${colors.green}${wallet.publicKey}${colors.reset}`);
  console.log(`  Private Key: ${colors.yellow}${wallet.privateKey}${colors.reset}`);
  console.log(`  Balance:     ${colors.blue}${wallet.balance.toLocaleString()} QUBIC${colors.reset}`);
  console.log(`  Created:     ${wallet.created}\n`);
}

/**
 * Save wallets to file
 */
function saveWallets(wallets, filename = 'wallets.json') {
  const configDir = path.join(__dirname, '..', 'config');
  
  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const filepath = path.join(configDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(wallets, null, 2));
  
  return filepath;
}

/**
 * Update .env file with wallet keys
 */
function updateEnvFile(wallets) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove old wallet entries
  const lines = envContent.split('\n').filter(line => {
    return !line.startsWith('BRAND_PUBLIC_KEY=') &&
           !line.startsWith('BRAND_PRIVATE_KEY=') &&
           !line.startsWith('INFLUENCER_PUBLIC_KEY=') &&
           !line.startsWith('INFLUENCER_PRIVATE_KEY=') &&
           !line.startsWith('ORACLE_PUBLIC_KEY=') &&
           !line.startsWith('ORACLE_PRIVATE_KEY=') &&
           !line.startsWith('DEPLOYER_PUBLIC_KEY=') &&
           !line.startsWith('DEPLOYER_PRIVATE_KEY=');
  });
  
  // Add new wallet entries
  lines.push('');
  lines.push('# Generated Wallets');
  lines.push(`BRAND_PUBLIC_KEY=${wallets.brand.publicKey}`);
  lines.push(`BRAND_PRIVATE_KEY=${wallets.brand.privateKey}`);
  lines.push('');
  lines.push(`INFLUENCER_PUBLIC_KEY=${wallets.influencer.publicKey}`);
  lines.push(`INFLUENCER_PRIVATE_KEY=${wallets.influencer.privateKey}`);
  lines.push('');
  lines.push(`ORACLE_PUBLIC_KEY=${wallets.oracle.publicKey}`);
  lines.push(`ORACLE_PRIVATE_KEY=${wallets.oracle.privateKey}`);
  lines.push('');
  lines.push(`DEPLOYER_PUBLIC_KEY=${wallets.deployer.publicKey}`);
  lines.push(`DEPLOYER_PRIVATE_KEY=${wallets.deployer.privateKey}`);
  lines.push('');
  
  fs.writeFileSync(envPath, lines.join('\n'));
  
  return envPath;
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.yellow}Generating test wallets...${colors.reset}\n`);
  
  // Generate wallets
  const wallets = {
    brand: createWallet('Brand', 10000000),        // 10M QUBIC
    influencer: createWallet('Influencer', 1000000), // 1M QUBIC
    oracle: createWallet('Oracle', 100000),        // 100K QUBIC
    deployer: createWallet('Deployer', 5000000)    // 5M QUBIC
  };
  
  // Display all wallets
  Object.values(wallets).forEach(wallet => displayWallet(wallet));
  
  // Save to file
  console.log(`${colors.yellow}Saving wallets...${colors.reset}`);
  const walletFile = saveWallets(wallets);
  console.log(`${colors.green}✓ Saved to: ${walletFile}${colors.reset}\n`);
  
  // Update .env
  console.log(`${colors.yellow}Updating .env file...${colors.reset}`);
  const envFile = updateEnvFile(wallets);
  console.log(`${colors.green}✓ Updated: ${envFile}${colors.reset}\n`);
  
  // Summary
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}✓ Wallet Generation Complete!${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);
  
  console.log(`${colors.cyan}Next Steps:${colors.reset}`);
  console.log(`  1. Review wallets in: ${colors.yellow}config/wallets.json${colors.reset}`);
  console.log(`  2. Keys added to: ${colors.yellow}.env${colors.reset}`);
  console.log(`  3. Deploy contract: ${colors.yellow}cd contract && ./deploy/deploy.sh${colors.reset}`);
  console.log(`  4. Start services: ${colors.yellow}./scripts/start-all.sh${colors.reset}\n`);
  
  console.log(`${colors.red}${colors.bright}⚠️  IMPORTANT:${colors.reset}`);
  console.log(`${colors.red}  These are TEST wallets only!${colors.reset}`);
  console.log(`${colors.red}  Never use these keys on mainnet!${colors.reset}\n`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generatePublicKey, generatePrivateKey, createWallet };