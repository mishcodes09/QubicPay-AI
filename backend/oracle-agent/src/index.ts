/**
 * Oracle Agent - Main Service (FIXED)
 * Connects to actual Qubic network and processes verification requests
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
   * Setup Express server with API endpoints
   */
  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const qubicHealthy = await this.qubicClient.healthCheck();
        const aiHealthy = await this.aiClient.healthCheck();
        
        res.json({
          status: qubicHealthy && aiHealthy ? 'healthy' : 'degraded',
          service: 'Qubic Oracle Agent',
          isRunning: this.isRunning,
          qubicConnected: qubicHealthy,
          aiConnected: aiHealthy,
          lastProcessedTick: this.state.lastProcessedTick,
          rpcEndpoint: this.qubicClient.getRpcEndpoint()
        });
      } catch (error: any) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
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
    this.app.get('/state', async (req, res) => {
      try {
        const currentTick = await this.qubicClient.getCurrentTick();
        
        res.json({
          lastProcessedTick: this.state.lastProcessedTick,
          currentTick,
          pendingCount: this.state.pendingVerifications.size,
          completedCount: this.state.completedVerifications.size,
          rpcEndpoint: this.qubicClient.getRpcEndpoint(),
          oraclePublicKey: this.txBuilder.getOraclePublicKey()
        });
      } catch (error: any) {
        res.status(500).json({
          error: 'Failed to get state',
          details: error.message
        });
      }
    });

    // Get network info
    this.app.get('/network', async (req, res) => {
      try {
        const tickInfo = await this.qubicClient.getTickInfo();
        const status = await this.qubicClient.getNetworkStatus();
        
        res.json({
          currentTick: tickInfo.tick,
          timestamp: tickInfo.timestamp,
          epoch: tickInfo.epoch,
          networkStatus: status
        });
      } catch (error: any) {
        res.status(500).json({
          error: 'Failed to get network info',
          details: error.message
        });
      }
    });

    // Get contract balance
    this.app.get('/balance/:address', async (req, res) => {
      try {
        const address = req.params.address;
        const balance = await this.qubicClient.getBalance(address);
        
        res.json({
          address,
          balance,
          unit: 'QU'
        });
      } catch (error: any) {
        res.status(500).json({
          error: 'Failed to get balance',
          details: error.message
        });
      }
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[Oracle] Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Start the oracle service
   */
  async start(): Promise<void> {
    console.log('═══════════════════════════════════════════');
    console.log('  Qubic Smart Escrow - Oracle Agent');
    console.log('  Real RPC Implementation');
    console.log('═══════════════════════════════════════════');
    console.log();

    try {
      // Validate configuration
      console.log('[Oracle] Validating configuration...');
      Config.validate();
      console.log('[Oracle] ✓ Configuration valid');
      console.log();

      // Test AI service connection
      console.log('[Oracle] Testing AI service connection...');
      const aiHealthy = await this.aiClient.healthCheck();
      
      if (!aiHealthy) {
        throw new Error('AI service is not available');
      }
      
      console.log('[Oracle] ✓ AI service is healthy');
      console.log();

      // Test Qubic RPC connection
      console.log('[Oracle] Connecting to Qubic RPC...');
      console.log(`[Oracle] RPC Endpoint: ${Config.QUBIC.rpcEndpoint}`);
      
      const qubicHealthy = await this.qubicClient.healthCheck();
      
      if (!qubicHealthy) {
        throw new Error('Cannot connect to Qubic RPC. Please check your network connection and RPC endpoint.');
      }
      
      console.log('[Oracle] ✓ Successfully connected to Qubic network');
      console.log();

      // Get initial tick
      this.state.lastProcessedTick = await this.qubicClient.getCurrentTick();
      console.log(`[Oracle] Starting from tick: ${this.state.lastProcessedTick}`);
      console.log();

      // Display Oracle identity
      console.log('[Oracle] Oracle Identity:');
      console.log(`[Oracle]   Public Key: ${this.txBuilder.getOraclePublicKey()}`);
      console.log(`[Oracle]   Contract ID: ${Config.QUBIC.contractId}`);
      console.log();

      // Start Express server
      this.app.listen(Config.SERVER.port, Config.SERVER.host, () => {
        console.log(`[Oracle] HTTP API listening on ${Config.SERVER.host}:${Config.SERVER.port}`);
        console.log('[Oracle] Available endpoints:');
        console.log(`[Oracle]   GET  /health     - Service health check`);
        console.log(`[Oracle]   POST /verify     - Manual verification`);
        console.log(`[Oracle]   GET  /state      - Oracle state`);
        console.log(`[Oracle]   GET  /network    - Network info`);
        console.log(`[Oracle]   GET  /balance/:address - Get balance`);
        console.log();
      });

      // Start monitoring loop
      this.isRunning = true;
      console.log('[Oracle] 🚀 Oracle agent started successfully');
      console.log('[Oracle] Monitoring for verification requests...');
      console.log();

      this.startMonitoring();

    } catch (error: any) {
      console.error('[Oracle] ✗ Failed to start:', error.message);
      console.error();
      console.error('[Oracle] Troubleshooting:');
      console.error('[Oracle]   1. Check your .env file has correct values');
      console.error('[Oracle]   2. Verify RPC endpoint is reachable');
      console.error('[Oracle]   3. Ensure AI service is running');
      console.error('[Oracle]   4. Check network connectivity');
      process.exit(1);
    }
  }

  /**
   * Start monitoring loop for new verification requests
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
   * In production, this would check for new escrow contracts requiring verification
   */
  private async monitoringCycle(): Promise<void> {
    try {
      // Get current tick
      const currentTick = await this.qubicClient.getCurrentTick();

      // Check if tick advanced
      if (currentTick > this.state.lastProcessedTick) {
        const ticksAdvanced = currentTick - this.state.lastProcessedTick;
        
        if (ticksAdvanced > 1) {
          console.log(`[Oracle] Network advanced ${ticksAdvanced} ticks (now at ${currentTick})`);
        }
        
        // In production, query contract for new escrows
        // For now, just update last processed tick
        this.state.lastProcessedTick = currentTick;
        
        // TODO: Query smart contract for pending verifications
        // const contractState = await this.qubicClient.getContractState(contractIndex);
        // Process any pending verifications...
      }
    } catch (error: any) {
      // Don't crash on monitoring errors, just log them
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('[Oracle] ⚠️ Lost connection to Qubic RPC, will retry...');
      } else {
        console.error('[Oracle] Monitoring error:', error.message);
      }
    }
  }

  /**
   * Process a verification request (REAL IMPLEMENTATION)
   */
  async processVerification(request: VerificationRequest): Promise<any> {
    console.log('─────────────────────────────────────────');
    console.log(`[Oracle] Processing Verification`);
    console.log(`[Oracle] Post URL: ${request.postUrl}`);
    console.log(`[Oracle] Scenario: ${request.scenario || 'default'}`);
    console.log('─────────────────────────────────────────');

    try {
      // Step 1: Call AI service for verification
      console.log('[Oracle] Step 1/6: Requesting AI verification...');
      const aiResult = await this.aiClient.verifyPost(request);
      
      console.log(`[Oracle] ✓ AI Analysis complete`);
      console.log(`[Oracle]   Overall Score: ${aiResult.overall_score}/100`);
      console.log(`[Oracle]   Recommendation: ${aiResult.recommendation}`);
      console.log(`[Oracle]   Confidence: ${aiResult.confidence}`);
      console.log();

      // Step 2: Get current network tick
      console.log('[Oracle] Step 2/6: Getting current network tick...');
      const currentTick = await this.qubicClient.getCurrentTick();
      console.log(`[Oracle] ✓ Current tick: ${currentTick}`);
      console.log();

      // Step 3: Validate transaction parameters
      console.log('[Oracle] Step 3/6: Validating transaction parameters...');
      const validation = this.txBuilder.validateTransactionParams(
        Config.QUBIC.contractId,
        aiResult.overall_score,
        currentTick
      );

      if (!validation.valid) {
        throw new Error(`Invalid transaction parameters: ${validation.errors.join(', ')}`);
      }
      console.log('[Oracle] ✓ Transaction parameters valid');
      console.log();

      // Step 4: Build and sign transaction
      console.log('[Oracle] Step 4/6: Building and signing transaction...');
      const txResult = await this.txBuilder.buildSetVerificationScoreTransaction(
        Config.QUBIC.contractId,
        aiResult.overall_score,
        currentTick
      );
      console.log(`[Oracle] ✓ Transaction built`);
      console.log(`[Oracle]   Target Tick: ${txResult.targetTick}`);
      console.log(`[Oracle]   TX ID: ${txResult.transactionId}`);
      console.log();

      // Step 5: Broadcast to network (FIXED - now passing encoded string)
      console.log('[Oracle] Step 5/6: Broadcasting transaction to network...');
      const txId = await this.qubicClient.broadcastTransaction(txResult.encodedTransaction);
      console.log(`[Oracle] ✓ Transaction broadcasted`);
      console.log(`[Oracle]   Transaction ID: ${txId}`);
      console.log();

      // Step 6: Wait for confirmation
      console.log('[Oracle] Step 6/6: Waiting for transaction confirmation...');
      console.log(`[Oracle] Target tick: ${txResult.targetTick}, Current tick: ${currentTick}`);
      
      const confirmed = await this.qubicClient.waitForConfirmation(
        txId,
        txResult.targetTick,
        60000 // 60 second timeout
      );

      if (confirmed) {
        console.log();
        console.log('[Oracle] ✓ VERIFICATION COMPLETE');
        console.log(`[Oracle]   Score ${aiResult.overall_score} successfully submitted to blockchain`);
        console.log(`[Oracle]   Transaction confirmed at tick ${txResult.targetTick}`);
        
        // Store result
        this.state.completedVerifications.set(request.postUrl, aiResult);
      } else {
        console.error();
        console.error('[Oracle] ✗ Transaction confirmation failed');
        console.error('[Oracle] The transaction may still be pending or was rejected');
      }

      console.log('─────────────────────────────────────────');
      console.log();

      return {
        success: confirmed,
        transactionId: txId,
        targetTick: txResult.targetTick,
        score: aiResult.overall_score,
        recommendation: aiResult.recommendation,
        confidence: aiResult.confidence,
        aiResult: {
          overall_score: aiResult.overall_score,
          passed: aiResult.passed,
          recommendation: aiResult.recommendation,
          confidence: aiResult.confidence,
          fraud_flags: aiResult.fraud_flags,
          summary: aiResult.summary
        },
        transaction: {
          id: txId,
          tick: txResult.targetTick,
          inputType: txResult.inputType,
          confirmed
        }
      };

    } catch (error: any) {
      console.error();
      console.error('[Oracle] ✗ Verification processing failed');
      console.error(`[Oracle] Error: ${error.message}`);
      console.error('─────────────────────────────────────────');
      console.error();
      throw error;
    }
  }

  /**
   * Stop the oracle service
   */
  async stop(): Promise<void> {
    console.log();
    console.log('[Oracle] Stopping oracle agent...');
    this.isRunning = false;
    console.log('[Oracle] ✓ Oracle agent stopped gracefully');
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

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n[Oracle] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[Oracle] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the oracle
oracle.start().catch(error => {
  console.error('[Oracle] Fatal error:', error);
  process.exit(1);
});

export { OracleAgent };