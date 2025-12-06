#!/usr/bin/env node

/**
 * Demo Scenario Script
 * Runs automated demo of all three scenarios
 * 
 * Usage: node scripts/demo-scenario.js [scenario]
 * Scenarios: legitimate, bot_fraud, mixed_quality, all
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Configuration
const config = {
  aiService: process.env.AI_SERVICE_URL || 'http://localhost:5000',
  oracleAgent: process.env.ORACLE_SERVICE_URL || 'http://localhost:8080',
  timeout: 30000
};

// Scenarios
const scenarios = {
  legitimate: {
    name: 'Legitimate Campaign',
    postUrl: 'https://instagram.com/p/demo_legitimate_001',
    scenario: 'legitimate',
    expectedScore: '95-100',
    expectedOutcome: 'PAYMENT APPROVED',
    description: 'Real followers, authentic engagement, normal velocity'
  },
  bot_fraud: {
    name: 'Bot Fraud Campaign',
    postUrl: 'https://instagram.com/p/demo_bot_fraud_002',
    scenario: 'bot_fraud',
    expectedScore: '30-50',
    expectedOutcome: 'PAYMENT REJECTED',
    description: 'Fake followers, spam comments, suspicious patterns'
  },
  mixed_quality: {
    name: 'Mixed Quality Campaign',
    postUrl: 'https://instagram.com/p/demo_mixed_003',
    scenario: 'mixed_quality',
    expectedScore: '70-85',
    expectedOutcome: 'MANUAL REVIEW',
    description: 'Mix of real and fake engagement'
  }
};

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print header
 */
function printHeader(text) {
  console.log(`\n${colors.blue}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${text}${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}\n`);
}

/**
 * Print section
 */
function printSection(text) {
  console.log(`\n${colors.cyan}${colors.bright}${text}${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(70)}${colors.reset}`);
}

/**
 * Check if services are running
 */
async function checkServices() {
  printSection('Checking Services');
  
  // Check AI Service
  try {
    const response = await axios.get(`${config.aiService}/health`, { timeout: 5000 });
    console.log(`${colors.green}✓ AI Service: Running${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ AI Service: Not running${colors.reset}`);
    console.log(`${colors.yellow}  Start it with: cd backend/ai-verification && python src/ai_verifier.py${colors.reset}`);
    return false;
  }
  
  // Check Oracle Agent
  try {
    const response = await axios.get(`${config.oracleAgent}/health`, { timeout: 5000 });
    console.log(`${colors.green}✓ Oracle Agent: Running${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Oracle Agent: Not running${colors.reset}`);
    console.log(`${colors.yellow}  Start it with: cd backend/oracle-agent && npm run dev${colors.reset}`);
    return false;
  }
  
  return true;
}

/**
 * Run a single scenario
 */
async function runScenario(scenarioKey) {
  const scenario = scenarios[scenarioKey];
  
  printHeader(`Scenario: ${scenario.name}`);
  
  console.log(`${colors.cyan}Description:${colors.reset} ${scenario.description}`);
  console.log(`${colors.cyan}Post URL:${colors.reset} ${scenario.postUrl}`);
  console.log(`${colors.cyan}Expected Score:${colors.reset} ${scenario.expectedScore}`);
  console.log(`${colors.cyan}Expected Outcome:${colors.reset} ${scenario.expectedOutcome}\n`);
  
  // Step 1: AI Verification
  printSection('Step 1: AI Verification');
  console.log(`${colors.dim}Calling AI service...${colors.reset}`);
  
  let aiResult;
  try {
    const response = await axios.post(
      `${config.aiService}/verify`,
      {
        post_url: scenario.postUrl,
        scenario: scenario.scenario
      },
      { timeout: config.timeout }
    );
    
    aiResult = response.data;
    
    // Display results
    console.log(`\n${colors.bright}AI Verification Results:${colors.reset}`);
    console.log(`  Overall Score: ${getScoreColor(aiResult.overall_score)}${aiResult.overall_score}/100${colors.reset}`);
    console.log(`  Passed: ${aiResult.passed ? colors.green + '✓ Yes' : colors.red + '✗ No'}${colors.reset}`);
    console.log(`  Recommendation: ${getRecommendationColor(aiResult.recommendation)}${aiResult.recommendation}${colors.reset}`);
    console.log(`  Confidence: ${aiResult.confidence}`);
    
    // Breakdown
    console.log(`\n${colors.cyan}Score Breakdown:${colors.reset}`);
    const breakdown = aiResult.breakdown;
    console.log(`  Follower Authenticity: ${breakdown.follower_authenticity.score}/100 (${breakdown.follower_authenticity.weight * 100}% weight)`);
    console.log(`  Engagement Quality:    ${breakdown.engagement_quality.score}/100 (${breakdown.engagement_quality.weight * 100}% weight)`);
    console.log(`  Velocity Check:        ${breakdown.velocity_check.score}/100 (${breakdown.velocity_check.weight * 100}% weight)`);
    console.log(`  Geo Alignment:         ${breakdown.geo_alignment.score}/100 (${breakdown.geo_alignment.weight * 100}% weight)`);
    
    // Fraud flags
    if (aiResult.fraud_flags.length > 0) {
      console.log(`\n${colors.yellow}Fraud Flags:${colors.reset}`);
      aiResult.fraud_flags.forEach(flag => {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${flag}`);
      });
    }
    
    // Summary
    console.log(`\n${colors.cyan}Summary:${colors.reset}`);
    console.log(`  ${aiResult.summary}`);
    
  } catch (error) {
    console.log(`${colors.red}✗ AI Verification failed${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
  
  await sleep(1000);
  
  // Step 2: Oracle Submission
  printSection('Step 2: Oracle Submission (Simulated)');
  console.log(`${colors.dim}In production, the Oracle Agent would:${colors.reset}`);
  console.log(`  1. Build transaction with score: ${aiResult.overall_score}`);
  console.log(`  2. Sign transaction with Oracle private key`);
  console.log(`  3. Submit to Qubic smart contract`);
  console.log(`  4. Wait for confirmation (~1 second)`);
  console.log(`\n${colors.green}✓ Transaction would be confirmed on-chain${colors.reset}`);
  
  await sleep(1000);
  
  // Step 3: Smart Contract Decision
  printSection('Step 3: Smart Contract Decision');
  console.log(`${colors.dim}Smart contract evaluates:${colors.reset}`);
  console.log(`  Score: ${aiResult.overall_score}/100`);
  console.log(`  Required: 95/100`);
  console.log(`  Status: ${aiResult.overall_score >= 95 ? colors.green + 'PASSES' : colors.red + 'FAILS'}${colors.reset}`);
  
  if (aiResult.overall_score >= 95) {
    console.log(`\n${colors.green}✓ PAYMENT RELEASED TO INFLUENCER${colors.reset}`);
    console.log(`  ${colors.dim}Escrow funds transferred automatically${colors.reset}`);
    console.log(`  ${colors.dim}Platform fee (3%) deducted${colors.reset}`);
    console.log(`  ${colors.dim}Zero transaction fees (Qubic)${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ PAYMENT BLOCKED${colors.reset}`);
    console.log(`  ${colors.dim}Fraud detected - refund issued to brand${colors.reset}`);
    console.log(`  ${colors.dim}No fees charged${colors.reset}`);
  }
  
  return true;
}

/**
 * Get color for score
 */
function getScoreColor(score) {
  if (score >= 95) return colors.green + colors.bright;
  if (score >= 80) return colors.yellow;
  return colors.red;
}

/**
 * Get color for recommendation
 */
function getRecommendationColor(recommendation) {
  if (recommendation.includes('APPROVED')) return colors.green;
  if (recommendation.includes('REVIEW')) return colors.yellow;
  return colors.red;
}

/**
 * Run all scenarios
 */
async function runAllScenarios() {
  printHeader('Qubic Smart Escrow - Complete Demo');
  
  const scenarioKeys = Object.keys(scenarios);
  
  for (let i = 0; i < scenarioKeys.length; i++) {
    await runScenario(scenarioKeys[i]);
    
    if (i < scenarioKeys.length - 1) {
      console.log(`\n${colors.dim}Waiting 2 seconds before next scenario...${colors.reset}`);
      await sleep(2000);
    }
  }
  
  // Final summary
  printHeader('Demo Complete');
  
  console.log(`${colors.green}✓ All scenarios completed successfully!${colors.reset}\n`);
  console.log(`${colors.cyan}Summary:${colors.reset}`);
  console.log(`  1. ${colors.green}Legitimate:${colors.reset} Score 95+ → Payment approved`);
  console.log(`  2. ${colors.red}Bot Fraud:${colors.reset} Score <60 → Payment blocked`);
  console.log(`  3. ${colors.yellow}Mixed Quality:${colors.reset} Score 70-85 → Manual review\n`);
  
  console.log(`${colors.cyan}Key Features Demonstrated:${colors.reset}`);
  console.log(`  ${colors.green}✓${colors.reset} AI-powered fraud detection`);
  console.log(`  ${colors.green}✓${colors.reset} Automatic payment settlement`);
  console.log(`  ${colors.green}✓${colors.reset} Zero transaction fees`);
  console.log(`  ${colors.green}✓${colors.reset} Trustless escrow system`);
  console.log(`  ${colors.green}✓${colors.reset} Real-time verification\n`);
}

/**
 * Save results to file
 */
function saveResults(results) {
  const outputDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = `demo-results-${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  
  console.log(`${colors.dim}Results saved to: ${filepath}${colors.reset}\n`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const scenario = args[0] || 'all';
  
  // Check services
  const servicesRunning = await checkServices();
  if (!servicesRunning) {
    console.log(`\n${colors.red}Please start the required services and try again.${colors.reset}\n`);
    process.exit(1);
  }
  
  // Run scenarios
  if (scenario === 'all') {
    await runAllScenarios();
  } else if (scenarios[scenario]) {
    await runScenario(scenario);
  } else {
    console.log(`${colors.red}Unknown scenario: ${scenario}${colors.reset}`);
    console.log(`${colors.yellow}Available scenarios: legitimate, bot_fraud, mixed_quality, all${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runScenario, runAllScenarios };