/**
 * Oracle Agent - Main Service (FIXED)
 * Gracefully handles RPC failures and continues in mock mode
 */
import express from 'express';
import cors from 'cors';
import { Config } from './config';
import { AIClient } from './aiClient';
import { QubicClient } from './qubicClient';
import { TransactionBuilder } from './transactionBuilder';
import { VerificationRequest, OracleState } from './types';

class OracleAgent {
  private aiClient: AIClient;
  private qubicClient: QubicClient;
  private txBuilder: TransactionBuilder;
  private state: OracleState;
  private app: express.Application;
  private isRunning: boolean = false;

  constructor() {
    this.aiClient = new AIClient();
    this.qubicClient = new QubicClient();
    this.txBuilder = new TransactionBuilder();
    
    this.state = {
      lastProcessedTick: 0,
      pendingVerifications: new Map(),
      completedVerifications: new Map()
    };

    this.app = express();
    this.setupExpress();
  }

  /**
   * Setup Express server
   */
  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Qubic Oracle Agent',
        isRunning: this.isRunning,
        mockMode: this.qubicClient.isMockMode(),
        lastProcessedTick: this.state.lastProcessedTick
      });
    });

    // Manual verification endpoint
    this.app.post('/verify', async (req, res) => {
      try {
        const request: VerificationRequest = req.body;
        
        if (!request.postUrl) {
          return res.status(400).json({ error: 'postUrl is required' });
        }

        console.log(`[Oracle] Manual verification request: ${request.postUrl}`);
        
        const result = await this.processVerification(request);
        
        res.json(result);
      } catch (error: any) {
        console.error('[Oracle] Verification error:', error);
        res.status(500).json({ 
          error: 'Verification failed',
          details: error.message 
        });
      }
    });

    // Get oracle state
    this.app.get('/state', (req, res) => {
      res.json({
        lastProcessedTick: this.state.lastProcessedTick,
        pendingCount: this.state.pendingVerifications.size,
        completedCount: this.state.completedVerifications.size,
        mockMode: this.qubicClient.isMockMode()
      });
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[Oracle] Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Start the oracle service (FIXED - doesn't fail on RPC error)
   */
  async start(): Promise<void> {
    console.log('═══════════════════════════════════════════');
    console.log('  Qubic Smart Escrow - Oracle Agent');
    console.log('═══════════════════════════════════════════');
    console.log();

    try {
      // Validate configuration
      Config.validate();
      console.log();

      // Test AI service connection
      console.log('[Oracle] Testing AI service connection...');
      await this.aiClient.testConnection();
      console.log();

      // Test Qubic RPC connection (FIXED - doesn't throw error)
      console.log('[Oracle] Testing Qubic RPC connection...');
      await this.qubicClient.healthCheck();
      
      if (this.qubicClient.isMockMode()) {
        console.log('[Oracle] ⚠️  Running in MOCK MODE (RPC unavailable)');
        console.log('[Oracle] All blockchain operations will be simulated');
      } else {
        console.log('[Oracle] ✓ Qubic RPC is healthy');
      }
      console.log();

      // Get initial tick (works in both real and mock mode)
      this.state.lastProcessedTick = await this.qubicClient.getCurrentTick();
      console.log(`[Oracle] Current network tick: ${this.state.lastProcessedTick}`);
      console.log();

      // Start Express server
      this.app.listen(Config.SERVER.port, Config.SERVER.host, () => {
        console.log(`[Oracle] HTTP server listening on ${Config.SERVER.host}:${Config.SERVER.port}`);
        console.log();
      });

      // Start monitoring loop
      this.isRunning = true;
      console.log('[Oracle] 🚀 Oracle agent started successfully');
      console.log('[Oracle] Monitoring for verification requests...');
      console.log();

      this.startMonitoring();

    } catch (error: any) {
      console.error('[Oracle] Failed to start:', error);
      console.error('[Oracle] Error details:', error.message);
      process.exit(1);
    }
  }

  /**
   * Start monitoring loop
   */
  private async startMonitoring(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.monitoringCycle();
      } catch (error: any) {
        console.error('[Oracle] Monitoring cycle error:', error.message);
      }

      // Wait before next cycle
      await this.sleep(Config.ORACLE.pollingIntervalMs);
    }
  }

  /**
   * Single monitoring cycle
   */
  private async monitoringCycle(): Promise<void> {
    // Get current tick (works in both real and mock mode)
    const currentTick = await this.qubicClient.getCurrentTick();

    if (currentTick > this.state.lastProcessedTick) {
      // Tick changed - in real system would check for new escrows
      this.state.lastProcessedTick = currentTick;
    }
  }

  /**
   * Process a verification request
   */
  async processVerification(request: VerificationRequest): Promise<any> {
    console.log(`[Oracle] Processing verification for: ${request.postUrl}`);

    try {
      // Step 1: Call AI service
      const aiResult = await this.aiClient.verifyPost(request);
      
      console.log(`[Oracle] AI Score: ${aiResult.overall_score}/100`);
      console.log(`[Oracle] Recommendation: ${aiResult.recommendation}`);

      // Step 2: Get current tick
      const currentTick = await this.qubicClient.getCurrentTick();

      // Step 3: Build transaction
      const tx = this.txBuilder.buildSetVerificationScoreTransaction(
        Config.QUBIC.contractId,
        aiResult.overall_score,
        currentTick
      );

      // Step 4: Sign transaction
      const signedTx = this.txBuilder.signTransaction(tx);

      // Step 5: Validate transaction
      const validation = this.txBuilder.validateTransaction(signedTx);
      if (!validation.valid) {
        throw new Error(`Invalid transaction: ${validation.errors.join(', ')}`);
      }

      // Step 6: Broadcast to network (works in both real and mock mode)
      const txId = await this.qubicClient.broadcastTransaction(signedTx);

      // Step 7: Wait for confirmation
      console.log(`[Oracle] Waiting for transaction confirmation...`);
      const confirmed = await this.qubicClient.waitForConfirmation(txId, 30000);

      if (confirmed) {
        console.log(`[Oracle] ✓ Score ${aiResult.overall_score} successfully submitted`);
        
        if (this.qubicClient.isMockMode()) {
          console.log(`[Oracle] (simulated - running in mock mode)`);
        }
        
        // Store result
        this.state.completedVerifications.set(request.postUrl, aiResult);
      } else {
        console.error(`[Oracle] ✗ Transaction confirmation failed`);
      }

      return {
        success: confirmed,
        txId,
        score: aiResult.overall_score,
        mockMode: this.qubicClient.isMockMode(),
        aiResult,
        transaction: {
          tick: tx.tick,
          inputType: tx.inputType
        }
      };

    } catch (error: any) {
      console.error('[Oracle] Verification processing error:', error.message);
      throw error;
    }
  }

  /**
   * Stop the oracle service
   */
  async stop(): Promise<void> {
    console.log('[Oracle] Stopping oracle agent...');
    this.isRunning = false;
    console.log('[Oracle] ✓ Oracle agent stopped');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
const oracle = new OracleAgent();

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n[Oracle] Received SIGINT signal');
  await oracle.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Oracle] Received SIGTERM signal');
  await oracle.stop();
  process.exit(0);
});

// Start the oracle
oracle.start().catch(error => {
  console.error('[Oracle] Fatal error:', error);
  process.exit(1);
});

export { OracleAgent };