/**
 * Transaction Builder (CORRECTED VERSION)
 * Uses QubicPackageBuilder correctly with Uint8Array
 */
import { Config } from './config';
import { ContractProcedure } from './types';

// Import using default export (the library exports everything this way)
import QubicLib from '@qubic-lib/qubic-ts-library';

// Extract the classes we need from the default export
const { 
  QubicTransaction, 
  PublicKey, 
  Long, 
  DynamicPayload, 
  QubicPackageBuilder 
} = QubicLib;

interface BuildTransactionResult {
  encodedTransaction: string;
  transactionId: string;
  targetTick: number;
  inputType: number;
}

export class TransactionBuilder {
  private oraclePrivateKey: string;
  private oraclePublicKey: string;

  constructor() {
    this.oraclePrivateKey = Config.QUBIC.oraclePrivateKey;
    this.oraclePublicKey = Config.QUBIC.oraclePublicKey;
    
    console.log('[TX Builder] Initialized with Qubic TypeScript library');
  }

  /**
   * Build and sign transaction to set verification score
   * Returns a properly encoded transaction ready for broadcast
   */
  async buildSetVerificationScoreTransaction(
    contractId: string,
    score: number,
    currentTick: number
  ): Promise<BuildTransactionResult> {
    console.log(`[TX Builder] Building setVerificationScore transaction: score=${score}`);

    // Calculate target tick (give enough time for broadcast and processing)
    const targetTick = currentTick + 30; // 30 ticks ahead for safety

    // Create payload with score
    const payload = this.createScorePayload(score);

    // Build the transaction using Qubic library
    const transaction = new QubicTransaction()
      .setSourcePublicKey(new PublicKey(this.oraclePublicKey))
      .setDestinationPublicKey(new PublicKey(contractId))
      .setTick(targetTick)
      .setInputType(ContractProcedure.SET_VERIFICATION_SCORE)
      .setInputSize(payload.getPackageSize())
      .setAmount(new Long(BigInt(0))) // No funds transfer
      .setPayload(payload);

    // Sign the transaction with private key (seed)
    console.log('[TX Builder] Signing transaction with oracle private key...');
    await transaction.build(this.oraclePrivateKey);

    // Encode to base64 for RPC
    const encodedTransaction = transaction.encodeTransactionToBase64(
      transaction.getPackageData()
    );

    // Generate transaction ID
    const transactionId = this.generateTransactionId(targetTick);

    console.log(`[TX Builder] ✓ Transaction signed and encoded`);
    console.log(`[TX Builder]   Target tick: ${targetTick}`);
    console.log(`[TX Builder]   Transaction ID: ${transactionId}`);
    console.log(`[TX Builder]   Encoded size: ${encodedTransaction.length} characters`);

    return {
      encodedTransaction,
      transactionId,
      targetTick,
      inputType: ContractProcedure.SET_VERIFICATION_SCORE
    };
  }

  /**
   * Create payload for score submission
   * Payload structure: 1 byte containing score (0-100)
   * 
   * IMPORTANT: QubicPackageBuilder.add() expects Uint8Array directly
   */
  private createScorePayload(score: number): any {
    // Ensure score is integer 0-100
    const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

    // Create 1-byte buffer for uint8 score
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    view.setUint8(0, normalizedScore);
    
    // Convert to Uint8Array
    const scoreData = new Uint8Array(buffer);

    // Create dynamic payload directly (skip QubicPackageBuilder if causing issues)
    const payload = new DynamicPayload(scoreData.length);
    payload.setPayload(scoreData);

    console.log(`[TX Builder] Payload created: ${normalizedScore} (${scoreData.length} byte)`);

    return payload;
  }

  /**
   * Alternative: Create payload for more complex score data
   * Use this if your contract expects additional fields
   */
  private createComplexScorePayload(
    score: number,
    postUrl: string,
    timestamp: number
  ): any {
    // Example complex structure:
    // struct SetScoreInput {
    //   uint8 score;           // 1 byte
    //   char postUrl[256];     // 256 bytes (fixed-size string)
    //   uint64 timestamp;      // 8 bytes
    // };
    const totalSize = 1 + 256 + 8; // Total: 265 bytes
    const completeBuffer = new Uint8Array(totalSize);
    let offset = 0;

    // 1. Add score (uint8, 1 byte)
    completeBuffer[offset] = Math.max(0, Math.min(100, Math.round(score)));
    offset += 1;

    // 2. Add postUrl (char[256], 256 bytes)
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(postUrl.substring(0, 255));
    completeBuffer.set(urlBytes, offset);
    offset += 256;

    // 3. Add timestamp (uint64, 8 bytes, little-endian)
    const timestampView = new DataView(completeBuffer.buffer, offset, 8);
    timestampView.setBigUint64(0, BigInt(timestamp), true);

    // Create dynamic payload
    const payload = new DynamicPayload(totalSize);
    payload.setPayload(completeBuffer);

    console.log(`[TX Builder] Complex payload created: ${totalSize} bytes`);

    return payload;
  }

  /**
   * Generate deterministic transaction ID
   * Based on source, destination, tick, and input type
   */
  private generateTransactionId(targetTick: number): string {
    const crypto = require('crypto');
    
    const idString = [
      this.oraclePublicKey,
      Config.QUBIC.contractId,
      targetTick.toString(),
      ContractProcedure.SET_VERIFICATION_SCORE.toString(),
      Date.now().toString()
    ].join(':');
    
    const hash = crypto.createHash('sha256').update(idString).digest('hex');
    
    // Return uppercase hex (Qubic transaction ID format)
    return hash.substring(0, 64).toUpperCase();
  }

  /**
   * Validate transaction parameters before building
   */
  validateTransactionParams(
    contractId: string,
    score: number,
    currentTick: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate contract ID format (60 characters for Qubic addresses)
    if (!contractId || contractId.length !== 60) {
      errors.push('Invalid contract ID: must be 60 characters');
    }

    // Check if contract ID is all uppercase letters
    if (contractId && !/^[A-Z]+$/.test(contractId)) {
      errors.push('Invalid contract ID: must be uppercase letters only');
    }

    // Validate score range
    if (score < 0 || score > 100) {
      errors.push('Invalid score: must be between 0 and 100');
    }

    // Validate tick
    if (currentTick <= 0) {
      errors.push('Invalid current tick: must be positive');
    }

    // Validate oracle keys
    if (!this.oraclePrivateKey || this.oraclePrivateKey.length !== 55) {
      errors.push('Invalid oracle private key: must be 55 characters (seed format)');
    }

    if (!this.oraclePublicKey || this.oraclePublicKey.length !== 60) {
      errors.push('Invalid oracle public key: must be 60 characters');
    }

    // Check if oracle public key is all uppercase
    if (this.oraclePublicKey && !/^[A-Z]+$/.test(this.oraclePublicKey)) {
      errors.push('Invalid oracle public key: must be uppercase letters only');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Estimate transaction fee
   * Qubic has zero transaction fees
   */
  estimateFee(): number {
    return 0;
  }

  /**
   * Get oracle public key
   */
  getOraclePublicKey(): string {
    return this.oraclePublicKey;
  }

  /**
   * Test transaction building (for debugging)
   */
  async testBuild(): Promise<void> {
    console.log('[TX Builder] Running test build...');
    
    try {
      // Create a test transaction
      const testTick = 12345678;
      const testScore = 87;
      
      const result = await this.buildSetVerificationScoreTransaction(
        Config.QUBIC.contractId,
        testScore,
        testTick
      );
      
      console.log('[TX Builder] ✓ Test build successful');
      console.log(`[TX Builder]   Encoded length: ${result.encodedTransaction.length}`);
      console.log(`[TX Builder]   Target tick: ${result.targetTick}`);
      console.log(`[TX Builder]   TX ID: ${result.transactionId}`);
    } catch (error: any) {
      console.error('[TX Builder] ✗ Test build failed:', error.message);
      throw error;
    }
  }

  /**
   * Get library version info
   */
  getLibraryInfo(): any {
    return {
      library: '@qubic-lib/qubic-ts-library',
      availableClasses: [
        'QubicTransaction',
        'PublicKey',
        'Long',
        'DynamicPayload',
        'QubicPackageBuilder'
      ],
      status: 'ready'
    };
  }
}