// services/qubicPayments.js - Qubic Blockchain Payment Service (Complete Migration)
const { ethers } = require('ethers');
const axios = require('axios');

/**
 * QubicPaymentService - Complete replacement for Thirdweb on Arc
 * Handles instant transfers via PaymentRouter and decision logging via DecisionLogger
 * Fully backward-compatible with existing Thirdweb interface
 */
class QubicPaymentService {
  constructor() {
    this.initialized = false;
    this.provider = null;
    this.wallet = null;
    this.paymentRouter = null;
    this.decisionLogger = null;
    this.usdcContract = null;
    this.chainId = parseInt(process.env.QUBIC_CHAIN_ID || '42161');
  }

  async initialize() {
    if (this.initialized) {
      console.log('[QUBIC] ✅ Payment Service already initialized');
      return true;
    }

    try {
      console.log('[QUBIC] 🔗 Initializing Qubic Payment Service...');

      // Connect to Qubic network
      const rpcUrl = process.env.QUBIC_RPC_URL || 'https://testnet-rpc.qubic.xyz';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize wallet
      const privateKey = process.env.QUBIC_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('QUBIC_PRIVATE_KEY not found in environment');
      }
      
      if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        throw new Error('Invalid QUBIC_PRIVATE_KEY format (must be 0x... with 64 hex chars)');
      }

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      console.log('[QUBIC] 📍 Wallet Address:', this.wallet.address);

      // Load contract ABIs
      const PaymentRouterABI = [
        "function instantTransfer(address token, address recipient, uint256 amount, string decisionId) external returns (bool)",
        "function calculateFee(uint256 amount) view returns (uint256)",
        "function getPoolStats(address token) view returns (tuple(uint256 reserves, uint256 volume, uint256 transfers))",
        "function owner() view returns (address)",
        "event InstantTransfer(address indexed token, address indexed from, address indexed to, uint256 amount, uint256 fee, string decisionId)"
      ];

      const DecisionLoggerABI = [
        "function logDecision(string decisionId, string actionSummary, string rationaleCID, uint256 amount, uint8 riskScore) external returns (bool)",
        "function updateDecisionStatus(string decisionId, uint8 newStatus, string txRef) external returns (bool)",
        "function getDecision(string decisionId) external view returns (tuple(string decisionId, address agent, string actionSummary, string rationaleCID, uint256 timestamp, uint256 amount, uint8 riskScore, uint8 status, string txRef))",
        "function authorizedAgents(address) external view returns (bool)",
        "function totalDecisions() external view returns (uint256)"
      ];

      const ERC20ABI = [
        'function balanceOf(address owner) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)'
      ];

      // Get contract addresses
      const routerAddress = process.env.QUBIC_PAYMENT_ROUTER_ADDRESS;
      const loggerAddress = process.env.QUBIC_DECISION_LOGGER_ADDRESS;
      const usdcAddress = process.env.QUBIC_USDC_ADDRESS;

      if (!routerAddress || !loggerAddress || !usdcAddress) {
        console.error('[QUBIC] ❌ Missing contract addresses in .env:');
        console.error('  QUBIC_PAYMENT_ROUTER_ADDRESS:', routerAddress || 'NOT SET');
        console.error('  QUBIC_DECISION_LOGGER_ADDRESS:', loggerAddress || 'NOT SET');
        console.error('  QUBIC_USDC_ADDRESS:', usdcAddress || 'NOT SET');
        throw new Error('Contract addresses not configured. Deploy contracts first!');
      }

      // Initialize contracts
      this.paymentRouter = new ethers.Contract(routerAddress, PaymentRouterABI, this.wallet);
      this.decisionLogger = new ethers.Contract(loggerAddress, DecisionLoggerABI, this.wallet);
      this.usdcContract = new ethers.Contract(usdcAddress, ERC20ABI, this.wallet);

      // Verify network
      const network = await this.provider.getNetwork();
      const actualChainId = Number(network.chainId);
      console.log('[QUBIC] 🌐 Network:', network.name || 'Qubic Testnet');
      console.log('[QUBIC] 🔢 Chain ID:', actualChainId);

      if (actualChainId !== this.chainId) {
        console.warn(`[QUBIC] ⚠️ Chain ID mismatch: expected ${this.chainId}, got ${actualChainId}`);
      }

      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log('[QUBIC] 💰 Native balance:', ethers.formatEther(balance), 'tokens');

      const usdcBalance = await this.usdcContract.balanceOf(this.wallet.address);
      const decimals = await this.usdcContract.decimals();
      console.log('[QUBIC] 💵 USDC balance:', ethers.formatUnits(usdcBalance, decimals), 'USDC');

      // Check if agent is authorized
      const isAuthorized = await this.decisionLogger.authorizedAgents(this.wallet.address);
      console.log('[QUBIC] 🔐 Agent authorized:', isAuthorized);

      if (!isAuthorized) {
        console.warn('[QUBIC] ⚠️ Wallet not authorized in DecisionLogger!');
        console.warn('[QUBIC] Run: npx hardhat run scripts/authorizeAgent.js --network qubic-testnet');
      }

      this.initialized = true;
      console.log('[QUBIC] ✅ Payment Service initialized successfully');
      console.log('[QUBIC] 📦 Contracts:');
      console.log('  PaymentRouter:', routerAddress);
      console.log('  DecisionLogger:', loggerAddress);
      console.log('  USDC:', usdcAddress);

      return true;
    } catch (error) {
      console.error('[QUBIC] ❌ Initialization failed:', error.message);
      console.error('[QUBIC] Stack:', error.stack);
      this.initialized = false;
      throw error;
    }
  }

  // ==================== DECISION LOGGING ====================

  /**
   * Log AI decision on-chain with IPFS rationale
   */
  async logDecision(decisionData) {
    if (!this.initialized) await this.initialize();

    try {
      console.log('[QUBIC] 📝 Logging decision on-chain...');

      const {
        decisionId,
        actionSummary,
        rationaleCID = '',
        amount,
        riskScore
      } = decisionData;

      // Validate inputs
      if (!decisionId || !actionSummary) {
        throw new Error('decisionId and actionSummary are required');
      }

      // Convert amount to wei (USDC has 6 decimals)
      const amountWei = ethers.parseUnits(amount.toString(), 6);

      // Ensure risk score is 0-100
      const safeRiskScore = Math.min(Math.max(Math.floor(riskScore), 0), 100);

      console.log('[QUBIC] Decision details:');
      console.log('  ID:', decisionId);
      console.log('  Summary:', actionSummary);
      console.log('  Amount:', amount, 'USDC');
      console.log('  Risk Score:', safeRiskScore);
      console.log('  Rationale CID:', rationaleCID || 'none');

      // Call DecisionLogger contract
      const tx = await this.decisionLogger.logDecision(
        decisionId,
        actionSummary,
        rationaleCID,
        amountWei,
        safeRiskScore,
        {
          gasLimit: 200000 // Reasonable gas limit
        }
      );

      console.log('[QUBIC] ⏳ Decision TX sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('[QUBIC] ✅ Decision logged on-chain');
      console.log('  Block:', receipt.blockNumber);
      console.log('  Gas used:', receipt.gasUsed.toString());

      const explorerUrl = `${process.env.QUBIC_EXPLORER || 'https://testnet-explorer.qubic.xyz'}/tx/${receipt.hash}`;
      console.log('[QUBIC] 🔍 View on explorer:', explorerUrl);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl,
        decisionId
      };
    } catch (error) {
      console.error('[QUBIC] ❌ Decision logging failed:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('agent not authorized')) {
        console.error('[QUBIC] ⚠️ Agent not authorized. Run authorizeAgent script first!');
      }
      
      return {
        success: false,
        error: error.message,
        shortError: error.shortMessage || error.message
      };
    }
  }

  /**
   * Update decision status after payment execution
   */
  async updateDecisionStatus(decisionId, status, txRef = '') {
    if (!this.initialized) await this.initialize();

    try {
      console.log(`[QUBIC] 🔄 Updating decision ${decisionId} to ${status}`);

      // Map status to enum: PENDING=0, APPROVED=1, EXECUTED=2, FAILED=3, CANCELLED=4
      const statusMap = {
        'pending': 0,
        'approved': 1,
        'executed': 2,
        'failed': 3,
        'cancelled': 4
      };

      const statusCode = statusMap[status.toLowerCase()];
      
      if (statusCode === undefined) {
        throw new Error(`Invalid status: ${status}. Use: pending, approved, executed, failed, cancelled`);
      }

      const tx = await this.decisionLogger.updateDecisionStatus(
        decisionId,
        statusCode,
        txRef,
        {
          gasLimit: 100000
        }
      );

      const receipt = await tx.wait();

      console.log('[QUBIC] ✅ Decision status updated:', status);
      console.log('  TX:', receipt.hash);

      return { 
        success: true,
        txHash: receipt.hash,
        status: status
      };
    } catch (error) {
      console.error('[QUBIC] ❌ Status update failed:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Get decision from blockchain
   */
  async getDecision(decisionId) {
    if (!this.initialized) await this.initialize();

    try {
      const decision = await this.decisionLogger.getDecision(decisionId);
      
      const statusNames = ['PENDING', 'APPROVED', 'EXECUTED', 'FAILED', 'CANCELLED'];
      
      return {
        success: true,
        decision: {
          decisionId: decision.decisionId,
          agent: decision.agent,
          actionSummary: decision.actionSummary,
          rationaleCID: decision.rationaleCID,
          timestamp: new Date(Number(decision.timestamp) * 1000).toISOString(),
          amount: ethers.formatUnits(decision.amount, 6),
          riskScore: Number(decision.riskScore),
          status: statusNames[decision.status] || 'UNKNOWN',
          txRef: decision.txRef
        }
      };
    } catch (error) {
      console.error('[QUBIC] Error fetching decision:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== INSTANT PAYMENTS ====================

  /**
   * Execute instant transfer via PaymentRouter
   */
  async instantTransfer(transferData) {
    if (!this.initialized) await this.initialize();

    try {
      console.log('[QUBIC] 💸 Executing instant transfer via PaymentRouter...');

      const {
        recipient,
        amount,
        decisionId
      } = transferData;

      // Validate inputs
      if (!recipient || !ethers.isAddress(recipient)) {
        throw new Error(`Invalid recipient address: ${recipient}`);
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      // Convert amount to wei (USDC has 6 decimals)
      const amountWei = ethers.parseUnits(amount.toString(), 6);

      console.log('[QUBIC] Transfer details:');
      console.log('  Recipient:', recipient);
      console.log('  Amount:', amount, 'USDC');
      console.log('  Decision ID:', decisionId || 'none');

      // Check PaymentRouter liquidity
      const routerAddress = await this.paymentRouter.getAddress();
      const routerBalance = await this.usdcContract.balanceOf(routerAddress);

      console.log('[QUBIC] 💰 Router liquidity:', ethers.formatUnits(routerBalance, 6), 'USDC');

      if (routerBalance < amountWei) {
        throw new Error(`Insufficient liquidity in PaymentRouter pool. Available: ${ethers.formatUnits(routerBalance, 6)} USDC`);
      }

      // Calculate fee
      const fee = await this.paymentRouter.calculateFee(amountWei);
      const netAmount = amountWei - fee;

      console.log('[QUBIC] 📊 Transfer breakdown:');
      console.log('  Gross amount:', ethers.formatUnits(amountWei, 6), 'USDC');
      console.log('  Fee:', ethers.formatUnits(fee, 6), 'USDC');
      console.log('  Net amount:', ethers.formatUnits(netAmount, 6), 'USDC');

      // Execute instant transfer
      const usdcAddress = await this.usdcContract.getAddress();
      
      const tx = await this.paymentRouter.instantTransfer(
        usdcAddress,
        recipient,
        amountWei,
        decisionId || '',
        {
          gasLimit: 300000 // Reasonable gas limit
        }
      );

      console.log('[QUBIC] ⏳ Transfer TX sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('[QUBIC] ✅ Instant transfer completed');
      console.log('  Block:', receipt.blockNumber);
      console.log('  Gas used:', receipt.gasUsed.toString());

      const explorerUrl = `${process.env.QUBIC_EXPLORER || 'https://testnet-explorer.qubic.xyz'}/tx/${receipt.hash}`;
      console.log('[QUBIC] 🔍 View on explorer:', explorerUrl);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl,
        amounts: {
          gross: ethers.formatUnits(amountWei, 6),
          fee: ethers.formatUnits(fee, 6),
          net: ethers.formatUnits(netAmount, 6)
        }
      };
    } catch (error) {
      console.error('[QUBIC] ❌ Instant transfer failed:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('Insufficient liquidity')) {
        console.error('[QUBIC] ⚠️ PaymentRouter needs funding. Run prefundRouter script!');
      }
      
      return {
        success: false,
        error: error.message,
        shortError: error.shortMessage || error.message
      };
    }
  }

  /**
   * Direct USDC transfer (without PaymentRouter)
   * Use for simple wallet-to-wallet transfers
   */
  async directTransfer(recipient, amount) {
    if (!this.initialized) await this.initialize();

    try {
      console.log('[QUBIC] 💵 Executing direct USDC transfer...');

      const amountWei = ethers.parseUnits(amount.toString(), 6);

      // Check balance
      const balance = await this.usdcContract.balanceOf(this.wallet.address);
      if (balance < amountWei) {
        throw new Error('Insufficient USDC balance');
      }

      // Execute transfer
      const tx = await this.usdcContract.transfer(recipient, amountWei, {
        gasLimit: 100000
      });
      
      console.log('[QUBIC] ⏳ Transfer TX sent:', tx.hash);

      const receipt = await tx.wait();

      console.log('[QUBIC] ✅ Direct transfer completed');

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${process.env.QUBIC_EXPLORER || 'https://testnet-explorer.qubic.xyz'}/tx/${receipt.hash}`
      };
    } catch (error) {
      console.error('[QUBIC] ❌ Direct transfer failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== THIRDWEB-COMPATIBLE INTERFACE ====================

  /**
   * Create payment request (Thirdweb-compatible)
   * This allows existing code to work without changes
   */
  async createPaymentRequest(params) {
    try {
      await this.initialize();

      const {
        to,
        amount,
        currency = 'USDC',
        description,
        metadata = {}
      } = params;

      console.log(`[QUBIC] Creating payment request: ${amount} ${currency} to ${to}`);

      if (!to || !ethers.isAddress(to)) {
        throw new Error(`Invalid recipient address: ${to}`);
      }

      const paymentRequest = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: this.wallet.address,
        to: ethers.getAddress(to),
        amount: parseFloat(amount),
        currency,
        description,
        status: 'pending',
        blockchain: 'qubic',
        createdAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          aiAgent: 'QubicPay',
          version: '2.0.0'
        }
      };

      console.log(`[QUBIC] ✅ Payment request created: ${paymentRequest.id}`);
      
      return paymentRequest;
    } catch (error) {
      console.error('[QUBIC] Error creating payment request:', error.message);
      throw error;
    }
  }

  /**
   * Execute payment (Thirdweb-compatible wrapper)
   * Routes to instantTransfer for full audit trail
   */
  async executePayment(paymentRequest) {
    try {
      console.log(`[QUBIC] Executing payment: ${paymentRequest.amount} ${paymentRequest.currency} to ${paymentRequest.to}`);
      
      // Use instant transfer via PaymentRouter
      const result = await this.instantTransfer({
        recipient: paymentRequest.to,
        amount: paymentRequest.amount,
        decisionId: paymentRequest.id
      });

      if (result.success) {
        return {
          status: 'completed',
          id: paymentRequest.id,
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          explorerUrl: result.explorerUrl,
          blockchain: 'qubic',
          message: `Successfully transferred ${paymentRequest.amount} USDC`
        };
      } else {
        return {
          status: 'failed',
          id: paymentRequest.id,
          error: result.error,
          blockchain: 'qubic'
        };
      }
    } catch (error) {
      console.error('[QUBIC] Error executing payment:', error.message);
      return {
        status: 'failed',
        id: paymentRequest.id,
        error: error.message,
        blockchain: 'qubic'
      };
    }
  }

  // ==================== WALLET QUERIES ====================

  /**
   * Get balance (Thirdweb-compatible)
   */
  async getBalance(currency = 'USDC') {
    try {
      await this.initialize();

      let balance, decimals, symbol;

      if (currency === 'USDC') {
        balance = await this.usdcContract.balanceOf(this.wallet.address);
        decimals = await this.usdcContract.decimals();
        symbol = 'USDC';
      } else {
        // Native token balance
        balance = await this.provider.getBalance(this.wallet.address);
        decimals = 18;
        symbol = 'QUBIC';
      }

      const balanceFormatted = ethers.formatUnits(balance, decimals);

      return {
        currency: symbol,
        balance: parseFloat(balanceFormatted),
        displayValue: balanceFormatted,
        symbol: symbol,
        address: this.wallet.address,
        blockchain: 'qubic'
      };
    } catch (error) {
      console.error('[QUBIC] Error fetching balance:', error.message);
      throw error;
    }
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(amount, currency = 'USDC') {
    try {
      const balance = await this.getBalance(currency);
      const hasEnough = balance.balance >= parseFloat(amount);
      
      console.log(`[QUBIC] Balance check: ${balance.balance} >= ${amount} = ${hasEnough}`);
      
      return hasEnough;
    } catch (error) {
      console.error('[QUBIC] Error checking balance:', error.message);
      return false;
    }
  }

  /**
   * Get PaymentRouter pool statistics
   */
  async getPoolStats() {
    if (!this.initialized) await this.initialize();

    try {
      const usdcAddress = await this.usdcContract.getAddress();
      const stats = await this.paymentRouter.getPoolStats(usdcAddress);

      return {
        success: true,
        reserves: ethers.formatUnits(stats.reserves, 6),
        volume: ethers.formatUnits(stats.volume, 6),
        transfers: stats.transfers.toString(),
        blockchain: 'qubic'
      };
    } catch (error) {
      console.error('[QUBIC] ❌ Pool stats query failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== IPFS RATIONALE UPLOAD ====================

  /**
   * Upload decision rationale to IPFS via Pinata
   */
  async uploadRationaleToIPFS(rationaleText) {
    try {
      console.log('[IPFS] Uploading decision rationale...');

      const pinataKey = process.env.PINATA_API_KEY;
      const pinataSecret = process.env.PINATA_SECRET_KEY;

      if (!pinataKey || !pinataSecret) {
        console.warn('[IPFS] Pinata credentials not found, skipping upload');
        return { success: false, cid: '' };
      }

      const data = JSON.stringify({
        pinataContent: {
          rationale: rationaleText,
          timestamp: new Date().toISOString(),
          blockchain: 'qubic'
        },
        pinataMetadata: {
          name: `qubic-decision-rationale-${Date.now()}.json`
        }
      });

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': pinataKey,
            'pinata_secret_api_key': pinataSecret
          },
          timeout: 10000
        }
      );

      const cid = response.data.IpfsHash;
      console.log('[IPFS] ✅ Rationale uploaded, CID:', cid);

      return {
        success: true,
        cid,
        url: `${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${cid}`
      };
    } catch (error) {
      console.error('[IPFS] ❌ Upload failed:', error.message);
      return {
        success: false,
        error: error.message,
        cid: ''
      };
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    if (!this.initialized) await this.initialize();

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { success: false, error: 'Transaction not found' };
      }

      return {
        success: true,
        receipt: {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 1 ? 'success' : 'failed',
          gasUsed: receipt.gasUsed.toString(),
          blockchain: 'qubic'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    if (!this.initialized) await this.initialize();

    try {
      const feeData = await this.provider.getFeeData();
      
      return {
        success: true,
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'),
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null,
        blockchain: 'qubic'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress() {
    return this.wallet?.address;
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(tx) {
    try {
      if (!this.initialized) await this.initialize();
      
      const gasEstimate = await this.provider.estimateGas(tx);
      return gasEstimate.toString();
    } catch (error) {
      console.error('[QUBIC] Error estimating gas:', error.message);
      return '300000'; // Default fallback
    }
  }
}

// ==================== SINGLETON & EXPORTS ====================

// Singleton instance
let qubicPaymentServiceInstance = null;

function getQubicPaymentService() {
  if (!qubicPaymentServiceInstance) {
    qubicPaymentServiceInstance = new QubicPaymentService();
  }
  return qubicPaymentServiceInstance;
}

// Backward compatibility - allows existing code to work without changes
function getThirdwebPaymentService() {
  console.warn('[DEPRECATED] getThirdwebPaymentService() is deprecated. Use getQubicPaymentService() instead.');
  return getQubicPaymentService();
}

module.exports = {
  QubicPaymentService,
  getQubicPaymentService,
  getThirdwebPaymentService // Backward compatibility
};