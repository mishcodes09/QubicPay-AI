/**
 * Qubic Network Client (REAL RPC IMPLEMENTATION - FIXED)
 * Uses official Qubic RPC endpoints and proper transaction encoding
 */
import axios from 'axios';
import { Config } from './config';
import { TransactionStatus, EscrowContract } from './types';

interface TickInfo {
  tick: number;
  timestamp: number;
  epoch: number;
}

interface Balance {
  id: string;
  balance: string;
  validForTick: number;
  latestIncomingTransferTick: number;
  latestOutgoingTransferTick: number;
  incomingAmount: string;
  outgoingAmount: string;
  numberOfIncomingTransfers: number;
  numberOfOutgoingTransfers: number;
}

interface BroadcastResponse {
  peersBroadcasted: number;
  encodedTransaction: string;
  transactionId?: string;
}

interface NetworkStatus {
  lastProcessedTick: {
    tick: number;
    epoch: number;
  };
  lastProcessedTicksPerEpoch: any;
  skippedTicks: any[];
  processedTickIntervalsPerEpoch: any;
  numberOfEntities: number;
  numberOfTransactions: number;
  timestamp: string;
}

export class QubicClient {
  private rpcClient: any;
  private contractId: string;
  private connected: boolean = false; // FIXED: Renamed from isConnected

  constructor() {
    this.rpcClient = axios.create({
      baseURL: Config.QUBIC.rpcEndpoint,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    this.contractId = Config.QUBIC.contractId;
  }

  /**
   * Get current network tick (REAL)
   * Uses /v1/tick-info endpoint
   */
  async getCurrentTick(): Promise<number> {
    try {
      const response = await this.rpcClient.get('/v1/tick-info');
      const data = response.data;
      
      if (data?.tickInfo?.tick) {
        this.connected = true;
        console.log(`[Qubic Client] Current tick: ${data.tickInfo.tick}`);
        return data.tickInfo.tick;
      }
      
      throw new Error('Invalid tick response from RPC');
    } catch (error: any) {
      this.connected = false;
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to Qubic RPC. Please check network connection.');
      }
      
      throw new Error(`Failed to get current tick: ${error.message}`);
    }
  }

  /**
   * Get detailed tick information
   */
  async getTickInfo(): Promise<TickInfo> {
    try {
      const response = await this.rpcClient.get('/v1/tick-info');
      return {
        tick: response.data.tickInfo.tick,
        timestamp: response.data.tickInfo.timestamp,
        epoch: response.data.tickInfo.epoch
      };
    } catch (error: any) {
      throw new Error(`Failed to get tick info: ${error.message}`);
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const response = await this.rpcClient.get('/v1/status');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get network status: ${error.message}`);
    }
  }

  /**
   * Query contract state (REAL)
   * Uses /v1/querySmartContract endpoint
   */
  async querySmartContract(
    contractIndex: number,
    inputType: number,
    requestData: string
  ): Promise<any> {
    try {
      const requestDataSize = requestData ? Buffer.from(requestData, 'base64').length : 0;
      
      const response = await this.rpcClient.post('/v1/querySmartContract', {
        contractIndex,
        inputType,
        inputSize: requestDataSize,
        requestData: requestData || ''
      });

      if (response.data?.responseData) {
        // Return the base64 encoded response
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error('[Qubic Client] Failed to query contract:', error.message);
      throw error;
    }
  }

  /**
   * Get contract state by querying with empty payload
   */
  async getContractState(contractIndex: number): Promise<EscrowContract | null> {
    try {
      const response = await this.querySmartContract(contractIndex, 0, '');
      
      if (response?.responseData) {
        // Decode base64 response
        const stateData = Buffer.from(response.responseData, 'base64');
        return this.parseContractState(stateData);
      }

      return null;
    } catch (error: any) {
      console.error('[Qubic Client] Failed to get contract state:', error.message);
      return null;
    }
  }

  /**
   * Get account balance (REAL)
   * Uses /v1/balances/{identityId} endpoint
   */
  async getBalance(address: string): Promise<number> {
    try {
      const response = await this.rpcClient.get(`/v1/balances/${address}`);
      const balance: Balance = response.data.balance;
      
      // Convert balance string to number (balance is in QU)
      return parseInt(balance.balance, 10);
    } catch (error: any) {
      console.error('[Qubic Client] Failed to get balance:', error.message);
      return 0;
    }
  }

  /**
   * Broadcast transaction (REAL)
   * Uses /v1/broadcast-transaction endpoint
   * 
   * IMPORTANT: Expects a base64-encoded, signed transaction string
   */
  async broadcastTransaction(encodedTransaction: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected to Qubic RPC');
    }

    try {
      console.log('[Qubic Client] Broadcasting transaction to network...');
      
      const response = await this.rpcClient.post('/v1/broadcast-transaction', {
        encodedTransaction
      });

      const data: BroadcastResponse = response.data;
      
      console.log(`[Qubic Client] ✓ Transaction broadcasted to ${data.peersBroadcasted} peers`);
      
      // Extract transaction ID if available
      const txId = data.transactionId || this.extractTxIdFromEncoded(encodedTransaction);
      
      return txId;
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error.message;
      throw new Error(`Broadcast failed: ${errorMsg}`);
    }
  }

  /**
   * Get transaction status (REAL)
   * Uses /v1/transactions/{transactionId} endpoint
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    try {
      const response = await this.rpcClient.get(`/v1/transactions/${txId}`);
      const data = response.data;
      
      return {
        txId,
        status: data.transaction?.executed ? 'confirmed' : 'pending',
        tick: data.transaction?.tick,
        error: data.error
      };
    } catch (error: any) {
      // Transaction not found yet might just mean it's pending
      if (error.response?.status === 404) {
        return {
          txId,
          status: 'pending'
        };
      }
      
      return {
        txId,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Get transactions by tick
   * Uses /v2/ticks/{tick}/transactions endpoint
   */
  async getTransactionsByTick(tick: number): Promise<any[]> {
    try {
      const response = await this.rpcClient.get(`/v2/ticks/${tick}/transactions`);
      return response.data.transactions || [];
    } catch (error: any) {
      console.error(`[Qubic Client] Failed to get transactions for tick ${tick}:`, error.message);
      return [];
    }
  }

  /**
   * Wait for transaction confirmation (REAL)
   * Polls the network until the transaction is confirmed or timeout occurs
   */
  async waitForConfirmation(txId: string, targetTick: number, maxWaitMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    let lastCheckedTick = 0;
    
    console.log(`[Qubic Client] Waiting for confirmation at tick ${targetTick}...`);
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Get current tick
        const currentTick = await this.getCurrentTick();
        
        if (currentTick !== lastCheckedTick) {
          console.log(`[Qubic Client] Current tick: ${currentTick}, Target tick: ${targetTick}`);
          lastCheckedTick = currentTick;
        }
        
        // Check if we've reached or passed the target tick
        if (currentTick >= targetTick) {
          // Try to get transaction status
          const status = await this.getTransactionStatus(txId);
          
          if (status.status === 'confirmed') {
            console.log(`[Qubic Client] ✓ Transaction confirmed at tick ${status.tick}`);
            return true;
          }
          
          // Also check transactions in the target tick
          const transactions = await this.getTransactionsByTick(targetTick);
          const found = transactions.some((tx: any) => 
            tx.txId === txId || tx.id === txId
          );
          
          if (found) {
            console.log(`[Qubic Client] ✓ Transaction found in tick ${targetTick}`);
            return true;
          }
          
          // If we're more than 10 ticks past target, stop waiting
          if (currentTick > targetTick + 10) {
            console.warn(`[Qubic Client] Transaction not found ${currentTick - targetTick} ticks after target`);
            return false;
          }
        }
      } catch (error: any) {
        console.error(`[Qubic Client] Error checking confirmation: ${error.message}`);
      }
      
      // Wait 2 seconds before next check
      await this.sleep(2000);
    }
    
    throw new Error(`Transaction confirmation timeout after ${maxWaitMs}ms`);
  }

  /**
   * Health check (REAL)
   */
  async healthCheck(): Promise<boolean> {
    try {
      const status = await this.getNetworkStatus();
      const tick = await this.getCurrentTick();
      
      console.log(`[Qubic Client] ✓ Connected to Qubic RPC`);
      console.log(`[Qubic Client]   Network: ${Config.QUBIC.rpcEndpoint}`);
      console.log(`[Qubic Client]   Current tick: ${tick}`);
      console.log(`[Qubic Client]   Epoch: ${status.lastProcessedTick?.epoch || 'unknown'}`);
      
      return true;
    } catch (error: any) {
      console.error('[Qubic Client] ✗ RPC connection failed:', error.message);
      console.error('[Qubic Client] Please verify:');
      console.error(`[Qubic Client]   - RPC endpoint is correct: ${Config.QUBIC.rpcEndpoint}`);
      console.error('[Qubic Client]   - Network connection is available');
      console.error('[Qubic Client]   - RPC service is running');
      return false;
    }
  }

  /**
   * Extract transaction ID from encoded transaction
   * This is a helper for when the RPC doesn't return a txId
   */
  private extractTxIdFromEncoded(encodedTransaction: string): string {
    try {
      // Decode the base64 transaction
      const buffer = Buffer.from(encodedTransaction, 'base64');
      
      // Transaction ID is typically derived from the transaction hash
      // For now, return a deterministic ID based on the encoded data
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      
      return hash.substring(0, 64); // First 64 chars of hash
    } catch (error) {
      // Fallback to timestamp-based ID
      return `tx-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
  }

  /**
   * Parse contract state from raw binary data
   * This should match your contract's state structure
   */
  private parseContractState(rawData: Buffer): EscrowContract {
    // TODO: Implement proper binary parsing based on your contract's state structure
    // This is a placeholder that would need to match your actual contract
    
    try {
      // Example structure (adjust based on your actual contract):
      // struct EscrowState {
      //   id brandId;           // 32 bytes
      //   id influencerId;      // 32 bytes
      //   uint64 escrowBalance; // 8 bytes
      //   uint8 requiredScore;  // 1 byte
      //   uint8 verificationScore; // 1 byte
      //   uint32 retentionEndTick; // 4 bytes
      //   uint8 isActive;       // 1 byte
      // };
      
      let offset = 0;
      
      // Read brandId (32 bytes)
      const brandId = rawData.slice(offset, offset + 32).toString('hex');
      offset += 32;
      
      // Read influencerId (32 bytes)
      const influencerId = rawData.slice(offset, offset + 32).toString('hex');
      offset += 32;
      
      // Read escrowBalance (8 bytes, uint64)
      const escrowBalance = rawData.readBigUInt64LE(offset);
      offset += 8;
      
      // Read requiredScore (1 byte)
      const requiredScore = rawData.readUInt8(offset);
      offset += 1;
      
      // Read verificationScore (1 byte)
      const verificationScore = rawData.readUInt8(offset);
      offset += 1;
      
      // Read retentionEndTick (4 bytes)
      const retentionEndTick = rawData.readUInt32LE(offset);
      offset += 4;
      
      // Read isActive (1 byte)
      const isActive = rawData.readUInt8(offset) === 1;
      
      return {
        contractId: this.contractId,
        brandId,
        influencerId,
        escrowBalance: Number(escrowBalance),
        requiredScore,
        verificationScore,
        retentionEndTick,
        isActive
      };
    } catch (error) {
      console.error('[Qubic Client] Failed to parse contract state:', error);
      
      // Return default state on error
      return {
        contractId: this.contractId,
        brandId: '',
        influencerId: '',
        escrowBalance: 0,
        requiredScore: 95,
        verificationScore: 0,
        retentionEndTick: 0,
        isActive: false
      };
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get RPC endpoint being used
   */
  getRpcEndpoint(): string {
    return Config.QUBIC.rpcEndpoint;
  }
}