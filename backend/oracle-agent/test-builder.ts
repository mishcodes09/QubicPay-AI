/**
 * Test Transaction Builder
 * Quick test to verify Qubic library integration works
 * Run with: ts-node test-builder.ts
 */

import { TransactionBuilder } from './src/transactionBuilder';
import { Config } from './src/config';

async function testTransactionBuilder() {
  console.log('═══════════════════════════════════════════');
  console.log('  Transaction Builder Test');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Load environment
    require('dotenv').config();

    // Create transaction builder
    console.log('1. Creating Transaction Builder...');
    const builder = new TransactionBuilder();
    console.log('   ✓ Builder created\n');

    // Show library info
    console.log('2. Library Information:');
    const info = builder.getLibraryInfo();
    console.log(`   Library: ${info.library}`);
    console.log(`   Status: ${info.status}`);
    console.log(`   Available classes: ${info.availableClasses.join(', ')}\n`);

    // Show oracle info
    console.log('3. Oracle Configuration:');
    console.log(`   Public Key: ${builder.getOraclePublicKey()}`);
    console.log(`   Contract ID: ${Config.QUBIC.contractId}`);
    console.log(`   RPC Endpoint: ${Config.QUBIC.rpcEndpoint}\n`);

    // Test validation
    console.log('4. Testing Parameter Validation...');
    const validation = builder.validateTransactionParams(
      Config.QUBIC.contractId,
      87,
      12345678
    );
    
    if (validation.valid) {
      console.log('   ✓ Parameters are valid\n');
    } else {
      console.log('   ✗ Validation errors:');
      validation.errors.forEach(err => console.log(`     - ${err}`));
      console.log();
    }

    // Test building a transaction
    console.log('5. Building Test Transaction...');
    const testTick = 12345678;
    const testScore = 87;
    
    const result = await builder.buildSetVerificationScoreTransaction(
      Config.QUBIC.contractId,
      testScore,
      testTick
    );

    console.log('   ✓ Transaction built successfully!\n');
    
    console.log('6. Transaction Details:');
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Target Tick: ${result.targetTick}`);
    console.log(`   Input Type: ${result.inputType}`);
    console.log(`   Encoded Length: ${result.encodedTransaction.length} characters`);
    console.log(`   Encoded (first 100 chars): ${result.encodedTransaction.substring(0, 100)}...\n`);

    console.log('═══════════════════════════════════════════');
    console.log('  ✓ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Start your Oracle agent: npm run dev');
    console.log('2. Test verification endpoint');
    console.log('3. Monitor transaction broadcasting\n');

  } catch (error: any) {
    console.error('\n═══════════════════════════════════════════');
    console.error('  ✗ TEST FAILED');
    console.error('═══════════════════════════════════════════\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testTransactionBuilder().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});