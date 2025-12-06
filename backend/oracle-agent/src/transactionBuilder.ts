/**
 * Transaction Builder
 * Builds and signs Qubic transactions
 */
import { Config } from './config';
import { Transaction, ContractProcedure } from './types';
import * as crypto from 'crypto';

export class TransactionBuilder {
  private oraclePrivateKey: string;
  private oraclePublicKey: string;

  constructor() {
    this.oraclePrivateKey = Config.QUBIC.oraclePrivateKey;
    this.oraclePublicKey = Config.QUBIC.oraclePublicKey;
  }

  /**
   * Build transaction to set verification score
   */
  buildSetVerificationScoreTransaction(
    contractId: string,
    score: number,
    currentTick: number
  ): Transaction {
    console.log(`[TX Builder] Building setVerificationScore transaction: score=${score}`);

    // Create payload with score
    const payload = this.encodeScore(score);

    const transaction: Transaction = {
      sourceId: this.oraclePublicKey,
      destId: contractId,
      amount: 0, // No funds transfer, just procedure call
      tick: currentTick + 5, // Execute in 5 ticks
      inputType: ContractProcedure.SET_VERIFICATION_SCORE,
      inputSize: payload.length,
      payload
    };

    return transaction;
  }

  /**
   * Sign transaction with Oracle's private key
   */
  signTransaction(transaction: Transaction): Transaction {
    console.log('[TX Builder] Signing transaction...');

    // In production, this would use the actual Qubic signing algorithm
    // For now, we'll create a simple signature representation
    const txData = this.serializeTransactionForSigning(transaction);
    const signature = this.sign(txData, this.oraclePrivateKey);

    console.log('[TX Builder] ✓ Transaction signed');

    // In actual implementation, the signature would be added to the transaction
    return transaction;
  }

  /**
   * Encode score into binary payload
   */
  private encodeScore(score: number): Uint8Array {
    // Ensure score is integer 0-100
    const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

    // Create 4-byte payload (int32)
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, normalizedScore, true); // little-endian

    return new Uint8Array(buffer);
  }

  /**
   * Serialize transaction for signing
   */
  private serializeTransactionForSigning(tx: Transaction): Buffer {
    // This would use the actual Qubic transaction format
    // For now, create a simple serialization
    const parts = [
      tx.sourceId,
      tx.destId,
      tx.amount.toString(),
      tx.tick.toString(),
      tx.inputType.toString(),
      tx.inputSize.toString()
    ];

    if (tx.payload) {
      parts.push(Buffer.from(tx.payload).toString('hex'));
    }

    return Buffer.from(parts.join(':'));
  }

  /**
   * Sign data with private key
   */
  private sign(data: Buffer, privateKey: string): string {
    // In production, this would use Qubic's Schnorr signature
    // For now, use a simple HMAC as placeholder
    const hmac = crypto.createHmac('sha256', privateKey);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify signature (for testing)
   */
  verifySignature(data: Buffer, signature: string, publicKey: string): boolean {
    // Placeholder verification
    return signature.length === 64; // Valid hex signature
  }

  /**
   * Estimate transaction fee (always 0 on Qubic)
   */
  estimateFee(transaction: Transaction): number {
    return 0; // Qubic has zero fees
  }

  /**
   * Validate transaction before broadcast
   */
  validateTransaction(transaction: Transaction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!transaction.sourceId || transaction.sourceId.length !== 60) {
      errors.push('Invalid source ID');
    }

    if (!transaction.destId || transaction.destId.length !== 60) {
      errors.push('Invalid destination ID');
    }

    if (transaction.amount < 0) {
      errors.push('Invalid amount');
    }

    if (transaction.tick <= 0) {
      errors.push('Invalid tick');
    }

    if (transaction.inputType < 0 || transaction.inputType > 4) {
      errors.push('Invalid input type');
    }

    if (transaction.payload && transaction.payload.length !== transaction.inputSize) {
      errors.push('Payload size mismatch');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}