/**
 * Oracle Agent Configuration
 */
import dotenv from 'dotenv';
import { QubicConfig, AIServiceConfig } from './types';

dotenv.config();

export class Config {
  static readonly QUBIC: QubicConfig = {
    rpcEndpoint: process.env.QUBIC_RPC_ENDPOINT || 'https://testnet-rpc.qubic.org/',
    contractId: process.env.CONTRACT_ID || '',
    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY || '',
    oraclePublicKey: process.env.ORACLE_PUBLIC_KEY || '',
    networkId: parseInt(process.env.NETWORK_ID || '1', 10)
  };

  static readonly AI_SERVICE: AIServiceConfig = {
    baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10)
  };

  static readonly ORACLE = {
    pollingIntervalMs: parseInt(process.env.POLLING_INTERVAL_MS || '5000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '2000', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '10', 10)
  };

  static readonly SERVER = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || '0.0.0.0'
  };

  static readonly LOGGING = {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  };

  static validate(): void {
    const required = [
      'QUBIC_RPC_ENDPOINT',
      'CONTRACT_ID',
      'ORACLE_PRIVATE_KEY',
      'ORACLE_PUBLIC_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file'
      );
    }

    // Validate key formats (basic check)
    if (this.QUBIC.oraclePrivateKey.length !== 55) {
      console.warn('Warning: Oracle private key should be 55 characters (seed format)');
    }

    if (this.QUBIC.oraclePublicKey.length !== 60) {
      console.warn('Warning: Oracle public key should be 60 characters');
    }

    console.log('✓ Configuration validated successfully');
  }
}