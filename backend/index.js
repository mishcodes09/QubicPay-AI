// Load environment variables FIRST
require('dotenv').config();

// Debug environment variables
console.log('=== ENVIRONMENT CHECK ===');
console.log('USER_WALLET_ADDRESS from env:', process.env.USER_WALLET_ADDRESS);
console.log('USER_WALLET_ADDRESS length:', process.env.USER_WALLET_ADDRESS?.length);
console.log('QUBIC_USDC_ADDRESS from env:', process.env.QUBIC_USDC_ADDRESS);
console.log('QUBIC_USDC_ADDRESS length:', process.env.QUBIC_USDC_ADDRESS?.length);
console.log('FIREBASE_CREDENTIALS_PATH:', process.env.FIREBASE_CREDENTIALS_PATH);

// Validate addresses
const { ethers } = require('ethers');
console.log('USER_WALLET_ADDRESS valid?', ethers.isAddress(process.env.USER_WALLET_ADDRESS));
console.log('QUBIC_USDC_ADDRESS valid?', ethers.isAddress(process.env.QUBIC_USDC_ADDRESS));

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ==================== QUBIC IMPORTS (UPDATED) ====================
const { getRemittanceService } = require('./services/remittanceService');
const { getCrossBorderService } = require('./services/crossBorderService');
const { getExchangeRateService } = require('./services/exchangeRateService');
const { getFirebaseScheduler } = require('./services/firebaseScheduler');
const { getSecurityMonitor } = require('./services/securityMonitor');
const { executePlan } = require('./orchestrator');
const { logDecisionOnChain, getContractInfo, getDecisionFromChain, updateDecisionStatus } = require('./services/decisionLogger');
const { parseInstructionWithScheduling, formatDateForDisplay } = require('./services/enhancedParser');
const { getWalletService } = require('./services/walletService');
const { getQubicPaymentService } = require('./services/qubicPayments'); // Changed from thirdwebPayments

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Initialize Services
const paymentScheduler = getFirebaseScheduler();
const securityMonitor = getSecurityMonitor();
const walletService = getWalletService();
const qubicPayments = getQubicPaymentService(); // Changed from thirdwebPayments

let remittanceService = null;
let crossBorderService = null;
let exchangeRateService = null;

// Wallet Configuration - UPDATED FOR QUBIC
const USER_WALLET_ADDRESS = process.env.USER_WALLET_ADDRESS;
const QUBIC_USDC_CONTRACT = process.env.QUBIC_USDC_ADDRESS; // Changed from ARC_USDC_CONTRACT

// Cache wallet data to avoid excessive RPC calls
let cachedWalletData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds
let fetchInProgress = false;

// Helper function to get fresh wallet data
async function getFreshWalletData(forceRefresh = false) {
  const now = Date.now();
  
  // Wait if fetch is in progress (race condition fix)
  while (fetchInProgress) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Return cached data if fresh enough
  if (!forceRefresh && cachedWalletData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedWalletData;
  }
  
  fetchInProgress = true;
  
  try {
    console.log('[WALLET] Fetching fresh wallet data from Qubic blockchain...'); // Updated log
    
    const walletInfo = await walletService.getWalletInfo(
      USER_WALLET_ADDRESS,
      QUBIC_USDC_CONTRACT
    );
    
    cachedWalletData = {
      id: 'demo-user',
      wallet: {
        address: USER_WALLET_ADDRESS,
        balance: walletInfo.balances.usdc || 0, // USDC balance
        qubicBalance: walletInfo.balances.qubic, // Changed from arcBalance
        transactionCount: walletInfo.transactionCount,
        circleWalletId: 'qubic_wallet_' + USER_WALLET_ADDRESS.slice(2, 10) // Changed prefix
      },
      agent: {
        personality: 'balanced',
        dailyLimit: 500
      },
      network: walletInfo.network,
      blockchain: 'qubic', // Added blockchain field
      lastUpdated: walletInfo.lastUpdated
    };
    
    lastFetchTime = now;
    
    console.log('[WALLET] ✅ Wallet data updated:', {
      address: USER_WALLET_ADDRESS.slice(0, 10) + '...',
      usdcBalance: cachedWalletData.wallet.balance,
      qubicBalance: cachedWalletData.wallet.qubicBalance,
      txCount: cachedWalletData.wallet.transactionCount
    });
    
    return cachedWalletData;
  } catch (error) {
    console.error('[WALLET] ❌ Error fetching wallet data:', error.message);
    
    // Return fallback data if fetch fails
    if (cachedWalletData) {
      console.log('[WALLET] Using cached data as fallback');
      return cachedWalletData;
    }
    
    // Return mock data as last resort
    return {
      id: 'demo-user',
      wallet: {
        address: USER_WALLET_ADDRESS,
        balance: 0,
        qubicBalance: 0, // Changed from arcBalance
        transactionCount: 0,
        circleWalletId: 'qubic_wallet_error'
      },
      agent: {
        personality: 'balanced',
        dailyLimit: 500
      },
      blockchain: 'qubic',
      error: 'Failed to fetch wallet data'
    };
  } finally {
    fetchInProgress = false;
  }
}

// Update mockUser to use real wallet data
let mockUser = null;

// Initialize wallet data on startup
(async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          QubicPay AI - Initializing Services          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    // Initialize Firebase first
    console.log('[1/5] 🔥 Initializing Firebase services...');
    await paymentScheduler.initialize();
    console.log('      ✅ Firebase ready');
    
    // Initialize Security Monitor                          
    console.log('[2/5] 🔐 Initializing security monitor...');  
    await securityMonitor.initialize();                     
    console.log('      ✅ Security Monitor ready');
    
    // Initialize Qubic Payments
    console.log('[3/5] ⛓️  Initializing Qubic blockchain integration...');
    await qubicPayments.initialize();
    console.log('      ✅ Qubic Payment Service ready');
    
    // Initialize Cross-Border Services
    console.log('[4/5] 🌍 Initializing cross-border services...');
    exchangeRateService = getExchangeRateService();
    crossBorderService = getCrossBorderService(paymentScheduler);
    remittanceService = getRemittanceService();
    await remittanceService.initialize(paymentScheduler);
    console.log('      ✅ Cross-border services ready');
    console.log('      🌍 6 countries supported (KE, NG, ZA, GH, UG, RW)');
    
    // Then fetch wallet data
    console.log('[5/5] 💰 Connecting to wallet...');
    mockUser = await getFreshWalletData();
    console.log('      ✅ Qubic wallet integrated successfully!');
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          ✅ All Services Initialized!                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('[STARTUP] Failed to initialize:', error);
    console.error('Stack:', error.stack);
  }
})();

// In-memory instruction store
const STORE = {
  instructions: {},
  transactions: {}
};

// ==================== ROUTES ====================

// Health check - UPDATED FOR QUBIC
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      blockchain: 'qubic', // Changed from 'arc'
      firebase: paymentScheduler.initialized ? 'connected' : 'disconnected',
      cloudflare: process.env.CLOUDFLARE_WORKER_URL ? 'configured' : 'not configured',
      qubicPayments: qubicPayments.initialized ? 'ready' : 'initializing',
      wallet: cachedWalletData ? 'connected' : 'initializing',
      security: securityMonitor.initialized ? 'ready' : 'initializing',
      remittance: remittanceService ? 'ready' : 'initializing',
      timestamp: new Date().toISOString()
    };
    
    // Add pool stats if available
    if (qubicPayments.initialized) {
      const poolStats = await qubicPayments.getPoolStats();
      if (poolStats.success) {
        health.poolLiquidity = poolStats.reserves + ' USDC';
      }
    }
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get user profile with REAL wallet data
app.get('/api/me', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const walletData = await getFreshWalletData(forceRefresh);
    res.json(walletData);
  } catch (error) {
    console.error('[API] /me error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wallet data',
      message: error.message 
    });
  }
});

// Get detailed wallet info
app.get('/api/wallet/details', async (req, res) => {
  try {
    const walletInfo = await walletService.getWalletInfo(
      USER_WALLET_ADDRESS,
      QUBIC_USDC_CONTRACT
    );
    
    const gasPrice = await walletService.getGasPrice();
    
    res.json({
      ...walletInfo,
      gasPrice,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] /wallet/details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get wallet transactions
app.get('/api/wallet/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const transactions = await walletService.getRecentTransactions(
      USER_WALLET_ADDRESS,
      limit
    );
    
    res.json({
      address: USER_WALLET_ADDRESS,
      transactions,
      count: transactions.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] /wallet/transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh wallet balance
app.post('/api/wallet/refresh', async (req, res) => {
  try {
    const freshData = await getFreshWalletData(true);
    res.json({
      success: true,
      wallet: freshData.wallet,
      blockchain: 'qubic',
      message: 'Wallet data refreshed successfully'
    });
  } catch (error) {
    console.error('[API] /wallet/refresh error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== QUBIC PAYMENT ROUTES (UPDATED) ====================

// One-step payment with full audit trail - MIGRATED TO QUBIC
app.post('/api/qubic/payment/send', async (req, res) => {
  try {
    const { to, amount, currency, description } = req.body;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    if (!to || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, amount'
      });
    }
    
    console.log(`[QUBIC API] Payment request: ${amount} ${currency || 'USDC'} to ${to}`);
    console.log(`[QUBIC API] User: ${userId}`);
    
    // Check balance
    const user = await getFreshWalletData(true);
    if (amount > user.wallet.balance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance: ${user.wallet.balance} USDC available, ${amount} USDC required`
      });
    }
    
    // Step 1: Log decision on Qubic blockchain
    const decisionId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const decisionResult = await qubicPayments.logDecision({
      decisionId,
      actionSummary: description || `Payment: ${amount} USDC to ${to.slice(0, 10)}...`,
      rationaleCID: '',
      amount: parseFloat(amount),
      riskScore: 10
    });
    
    if (!decisionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to log decision on blockchain: ' + decisionResult.error
      });
    }
    
    console.log('[QUBIC API] ✅ Decision logged:', decisionResult.txHash);
    
    // Step 2: Execute via PaymentRouter
    const result = await qubicPayments.instantTransfer({
      recipient: to,
      amount: parseFloat(amount),
      decisionId
    });
    
    if (result.success) {
      // Step 3: Update decision status
      await qubicPayments.updateDecisionStatus(decisionId, 'executed', result.txHash);
      
      // Step 4: Log to Firebase
      try {
        await paymentScheduler.logPaymentHistory(userId, {
          paymentId: decisionId,
          type: 'direct',
          payee: to,
          amount: parseFloat(amount),
          currency: currency || 'USDC',
          status: 'completed',
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          decisionTxHash: decisionResult.txHash,
          decisionExplorerUrl: decisionResult.explorerUrl,
          blockchain: 'qubic',
          description: description || `Payment to ${to}`
        });
        console.log('[QUBIC API] ✅ Payment logged to Firebase history');
      } catch (historyError) {
        console.error('[QUBIC API] ⚠️ Failed to log to history:', historyError.message);
      }
      
      // Step 5: Save/update transfer for future use
      try {
        const existingTransfers = await paymentScheduler.getSavedTransfers(userId);
        const existing = existingTransfers.find(t => t.payee.toLowerCase() === to.toLowerCase());
        
        if (existing) {
          await paymentScheduler.updateTransferUsage(existing.transferId);
          console.log('[QUBIC API] ✅ Updated transfer usage count');
        } else {
          await paymentScheduler.saveTransfer(userId, {
            payee: to,
            nickname: description || `Payment to ${to.slice(0, 6)}...`,
            amount: parseFloat(amount),
            currency: currency || 'USDC',
            category: 'general',
            favorite: false
          });
          console.log('[QUBIC API] ✅ Saved new transfer');
        }
      } catch (transferError) {
        console.error('[QUBIC API] ⚠️ Failed to save transfer:', transferError.message);
      }
      
      res.json({
        success: true,
        payment: result,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        decisionTxHash: decisionResult.txHash,
        decisionExplorerUrl: decisionResult.explorerUrl,
        blockchain: 'qubic',
        message: `Successfully sent ${amount} ${currency || 'USDC'} to ${to}`
      });
    } else {
      // Update decision status to failed
      await qubicPayments.updateDecisionStatus(decisionId, 'failed', '');
      
      res.status(400).json({
        success: false,
        error: result.error,
        payment: result,
        decisionTxHash: decisionResult.txHash
      });
    }
  } catch (error) {
    console.error('[API] Qubic payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Backward compatibility endpoint - redirects to Qubic
app.post('/api/thirdweb/payment/send', async (req, res) => {
  console.log('[API] ⚠️ Deprecated endpoint used. Redirecting to /api/qubic/payment/send');
  req.url = '/api/qubic/payment/send';
  return app._router.handle(req, res);
});

// Get pool stats
app.get('/api/qubic/pool/stats', async (req, res) => {
  try {
    const stats = await qubicPayments.getPoolStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get decision from blockchain
app.get('/api/qubic/decision/:decisionId', async (req, res) => {
  try {
    const result = await qubicPayments.getDecision(req.params.decisionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== REMITTANCE ROUTES ====================

// Send international remittance
app.post('/api/remittance/send', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { recipientId, amount, description } = req.body;
    
    if (!recipientId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: recipientId, amount'
      });
    }
    
    console.log(`[REMITTANCE API] Send: ${amount} USDC to recipient ${recipientId}`);
    
    const result = await remittanceService.sendRemittance(userId, {
      recipientId,
      amount: parseFloat(amount),
      description: description || `Remittance to ${recipientId}`
    });
    
    res.json(result);
  } catch (error) {
    console.error('[API] Remittance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Preview remittance
app.post('/api/remittance/preview', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { recipientId, amount } = req.body;
    
    const preview = await remittanceService.previewRemittance(userId, recipientId, amount);
    res.json(preview);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get remittance history
app.get('/api/remittance/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const history = await remittanceService.getHistory(userId, req.query);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get remittance stats
app.get('/api/remittance/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const stats = await remittanceService.getStats(userId, req.query.period);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track delivery
app.get('/api/remittance/track/:remittanceId', async (req, res) => {
  try {
    const { remittanceId } = req.params;
    const tracking = await remittanceService.trackDelivery(remittanceId);
    res.json(tracking);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RECIPIENT MANAGEMENT ====================

// Add recipient
app.post('/api/recipients/add', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const recipient = await crossBorderService.addRecipient(userId, req.body);
    res.json({ success: true, recipient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recipients
app.get('/api/recipients', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const recipients = await crossBorderService.getRecipients(userId, req.query);
    res.json({ success: true, recipients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recipient by ID
app.get('/api/recipients/:recipientId', async (req, res) => {
  try {
    const recipient = await crossBorderService.getRecipientById(req.params.recipientId);
    res.json({ success: true, recipient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update recipient
app.put('/api/recipients/:recipientId', async (req, res) => {
  try {
    await crossBorderService.updateRecipient(req.params.recipientId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete recipient
app.delete('/api/recipients/:recipientId', async (req, res) => {
  try {
    await crossBorderService.deleteRecipient(req.params.recipientId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get supported countries
app.get('/api/countries', (req, res) => {
  const countries = crossBorderService.getSupportedCountries();
  res.json({ success: true, countries });
});

// ==================== EXCHANGE RATES ====================

// Get exchange rate
app.get('/api/rates/:currency', async (req, res) => {
  try {
    const rate = await remittanceService.getExchangeRate('USD', req.params.currency);
    res.json(rate);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all rates
app.get('/api/rates', async (req, res) => {
  try {
    const rates = await remittanceService.getAllRates();
    res.json({ success: true, rates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CHAT WITH AI MEMORY - UPDATED FOR QUBIC ====================

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    console.log(`[CHAT/MEMORY] User: ${userId}, Building context...`);
    
    // Get fresh wallet data
    const user = await getFreshWalletData(true);
    const wallet = user.wallet;
    const agent = user.agent;
    
    // Get comprehensive AI memory context
    const memory = await buildAIMemoryContext(userId);
    
    // Enhanced system message with QUBIC support
const systemMessage = {
  role: "system",
  content: `You are QubicPay AI, an AI assistant with PERFECT MEMORY for cryptocurrency payments on Qubic blockchain.

**CURRENT USER DATA:**
- Balance: ${wallet.balance} USDC (EXACT: ${wallet.balance})
- Wallet: ${wallet.address}
- Blockchain: Qubic
- Today's Date: ${new Date().toISOString().split('T')[0]}

**CRITICAL: PAYMENT REQUEST FORMAT**

When the user asks you to send/pay/transfer money, you MUST respond with this EXACT format:

PAYMENT_REQUEST: {"recipient": "0xADDRESS", "amount": 10.50, "currency": "USDC", "description": "Payment description"}

Example conversation:
User: "Send 0.001 USDC to 0x64EEA87b4737Eafa46c9B4661d534AF7307d7C5c"

You respond:
"I'll prepare that payment for you via Qubic.

PAYMENT_REQUEST: {"recipient": "0x64EEA87b4737Eafa46c9B4661d534AF7307d7C5c", "amount": 0.001, "currency": "USDC", "description": "Payment to 0x64EE...7C5c"}

Please review the details and click 'Approve Payment' when ready."

**🌍 REMITTANCE REQUEST FORMAT**

When user wants to send money to another country, respond with:

REMITTANCE_REQUEST: {"recipientId": "new", "recipientName": "John Doe", "country": "Kenya", "countryCode": "KE", "walletAddress": "0x1234...", "phoneNumber": "+254712345678", "amount": 50, "currency": "USDC", "receiveAmount": 6387.5, "receiveCurrency": "KES", "exchangeRate": 129, "platformFee": 0.5, "networkFee": 0.25, "totalFees": 0.75, "deliveryMethod": "mobile_money", "description": "Family support"}

**SUPPORTED COUNTRIES & EXCHANGE RATES:**

1. 🇰🇪 **Kenya (KES)** - Rate: 1 USDC = 129 KES - M-Pesa (5-15 min)
2. 🇳🇬 **Nigeria (NGN)** - Rate: 1 USDC = 775 NGN - Bank Transfer (1-2 hours)
3. 🇿🇦 **South Africa (ZAR)** - Rate: 1 USDC = 18.5 ZAR - Bank Transfer (1-2 hours)
4. 🇬🇭 **Ghana (GHS)** - Rate: 1 USDC = 12 GHS - Mobile Money (5-15 min)
5. 🇺🇬 **Uganda (UGX)** - Rate: 1 USDC = 3,750 UGX - Mobile Money (5-15 min)
6. 🇷🇼 **Rwanda (RWF)** - Rate: 1 USDC = 1,100 RWF - Mobile Money (5-15 min)

**PAYMENT MEMORY (Last 30 Days):**
${memory.paymentMemory}

**STATISTICS:**
${memory.statistics}

**BLOCKCHAIN FEATURES:**
All transactions are logged on Qubic blockchain with:
- DecisionLogger: On-chain audit trail with IPFS rationale
- PaymentRouter: Instant transfers via protocol liquidity pool
- Full transparency: Every decision is verifiable on Qubic Explorer

**YOUR CAPABILITIES:**
1. **Execute Payments** - Via Qubic PaymentRouter with on-chain logging
2. **Schedule Payments** - Recurring and one-time scheduled payments
3. **🌍 International Remittances** - 6 countries with instant delivery
4. **Memory Recall** - Perfect memory of all past transactions
5. **Security** - AI-powered fraud detection and risk scoring

Ready to assist with payments on Qubic blockchain!`
};
    
    const chatMessages = [systemMessage, ...messages];
    
    // Forward to Cloudflare AI
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
    
    if (!cloudflareWorkerUrl) {
      return res.status(500).json({ 
        error: 'Cloudflare Worker not configured'
      });
    }
    
    console.log(`[CHAT/MEMORY] Forwarding to Cloudflare AI...`);
    
    const response = await axios.post(
      `${cloudflareWorkerUrl}/api/chat`,
      { messages: chatMessages },
      {
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        timeout: 30000
      }
    );
    
    // Stream response back
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let buffer = '';
    
    response.data.on('data', (chunk) => {
      try {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                res.write(`data: ${JSON.stringify({ content: parsed.response })}\n\n`);
              } else if (parsed.content) {
                res
                // CONTINUATION OF server.js - Additional Routes and Functions

.write(`data: ${JSON.stringify(parsed)}\n\n`);
              }
            } catch (e) {
              if (line.startsWith('data: ')) {
                res.write(line + '\n');
              }
            }
          }
        }
      } catch (error) {
        console.error('[CHAT/MEMORY] Stream error:', error);
      }
    });
    
    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
      console.log('[CHAT/MEMORY] ✅ Stream completed');
    });
    
    response.data.on('error', (error) => {
      console.error('[CHAT/MEMORY] Stream error:', error.message);
      res.end();
    });
    
  } catch (error) {
    console.error('[CHAT/MEMORY] Error:', error.message);
    
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Build AI Memory Context
async function buildAIMemoryContext(userId) {
  const context = {
    paymentMemory: '',
    conversationMemory: '',
    statistics: ''
  };
  
  try {
    const history = await paymentScheduler.getPaymentHistory(userId, 100);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentPayments = history.filter(p => {
      const paymentDate = p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp);
      return paymentDate >= thirtyDaysAgo;
    });
    
    if (recentPayments.length > 0) {
      context.paymentMemory = recentPayments.map(p => {
        const date = p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        return `- ${dateStr}: Sent ${p.amount} ${p.currency} to ${p.payee}
  Status: ${p.status}
  Blockchain: Qubic
  ${p.decisionTxHash ? `Decision TX: ${p.decisionTxHash}` : ''}
  ${p.txHash ? `Payment TX: ${p.txHash}` : ''}
  ${p.explorerUrl ? `Explorer: ${p.explorerUrl}` : ''}`;
      }).join('\n\n');
    } else {
      context.paymentMemory = '(No payment history in last 30 days)';
    }
    
    const totalAmount = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    context.statistics = `
Total Payments (30 days): ${recentPayments.length}
Total Volume: ${totalAmount.toFixed(2)} USDC
Blockchain: Qubic

All transactions are verifiable on Qubic Explorer with on-chain decision logs`;
    
  } catch (error) {
    console.error('[MEMORY] Error building context:', error.message);
    context.paymentMemory = '(Error loading payment history)';
  }
  
  return context;
}

// ==================== SECURITY ROUTES ====================

app.get('/api/security/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const profile = await securityMonitor.getUserSecurityProfile(userId);
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/security/check', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const result = await securityMonitor.checkTransaction(userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCHEDULED PAYMENTS ====================

app.get('/api/scheduler/payments', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const payments = await paymentScheduler.getScheduledPayments(userId, req.query);
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/scheduler/schedule', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const payment = await paymentScheduler.schedulePayment(userId, req.body);
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/scheduler/payments/:paymentId', async (req, res) => {
  try {
    const result = await paymentScheduler.cancelScheduledPayment(req.params.paymentId);
    res.json({ success: true, payment: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PAYMENT HISTORY ====================

app.get('/api/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await paymentScheduler.getPaymentHistory(userId, limit);
    
    res.json({
      success: true,
      history,
      count: history.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PAYMENT EXECUTION ====================

app.post('/api/payment/execute', async (req, res) => {
  try {
    const { recipient, amount, currency, description } = req.body;
    
    if (!recipient || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: recipient, amount'
      });
    }
    
    console.log(`[PAYMENT] Executing via Qubic: ${amount} ${currency || 'USDC'} to ${recipient}`);
    
    const user = await getFreshWalletData(true);
    
    if (amount > user.wallet.balance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance: ${user.wallet.balance} USDC`
      });
    }
    
    // Log decision
    const decisionId = `payment_${Date.now()}`;
    const decisionResult = await qubicPayments.logDecision({
      decisionId,
      actionSummary: description || `Payment to ${recipient}`,
      rationaleCID: '',
      amount: parseFloat(amount),
      riskScore: 10
    });
    
    if (!decisionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to log decision'
      });
    }
    
    // Execute payment
    const result = await qubicPayments.instantTransfer({
      recipient,
      amount: parseFloat(amount),
      decisionId
    });
    
    if (result.success) {
      await qubicPayments.updateDecisionStatus(decisionId, 'executed', result.txHash);
      
      // Log to Firebase
      try {
        await paymentScheduler.logPaymentHistory(user.id, {
          paymentId: decisionId,
          type: 'direct',
          payee: recipient,
          amount: parseFloat(amount),
          currency: currency || 'USDC',
          status: 'completed',
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          decisionTxHash: decisionResult.txHash,
          blockchain: 'qubic'
        });
      } catch (error) {
        console.warn('[PAYMENT] History logging failed:', error.message);
      }
      
      res.json({
        success: true,
        payment: result,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        decisionTxHash: decisionResult.txHash,
        blockchain: 'qubic',
        message: `Successfully sent ${amount} ${currency || 'USDC'} to ${recipient}`,
        newBalance: user.wallet.balance - amount
      });
    } else {
      await qubicPayments.updateDecisionStatus(decisionId, 'failed', '');
      
      res.status(400).json({
        success: false,
        error: result.error,
        payment: result
      });
    }
  } catch (error) {
    console.error('[PAYMENT] Execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('\n🚀 ============================================');
  console.log('   QubicPay AI Backend');
  console.log('============================================');
  console.log(`   Port: ${PORT}`);
  console.log(`   Blockchain: Qubic`);
  console.log(`   Wallet: ${USER_WALLET_ADDRESS ? '✅ Connected' : '⚠️  Not configured'}`);
  console.log(`   Firebase: ${paymentScheduler.initialized ? '✅ Ready' : '⏳ Initializing...'}`);
  console.log(`   Qubic Payments: ${qubicPayments.initialized ? '✅ Ready' : '⏳ Initializing...'}`);
  console.log(`   Security: ${securityMonitor.initialized ? '✅ Ready' : '⏳ Initializing...'}`);
  console.log(`   Remittances: ${remittanceService ? '✅ 6 countries' : '⏳ Initializing...'}`);
  console.log(`   Explorer: ${process.env.QUBIC_EXPLORER || 'https://testnet-explorer.qubic.xyz'}`);
  console.log('============================================ 🚀\n');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  process.exit(0);
});

module.exports = app;