// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ==================== QUBIC IMPORTS (UPDATED) ====================
const { getQubicPaymentService } = require('./services/qubicPayments');
const { getRemittanceService } = require('./services/remittanceService');
const { getCrossBorderService } = require('./services/crossBorderService');
const { getExchangeRateService } = require('./services/exchangeRateService');
const { getFirebaseScheduler } = require('./services/firebaseScheduler');
const { getSecurityMonitor } = require('./services/securityMonitor');
const { parseInstructionWithScheduling, formatDateForDisplay } = require('./services/enhancedParser');
const { getWalletService } = require('./walletService');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// ==================== INITIALIZE SERVICES ====================

const paymentScheduler = getFirebaseScheduler();
const securityMonitor = getSecurityMonitor();
const walletService = getWalletService();
const qubicPayments = getQubicPaymentService();

let remittanceService = null;
let crossBorderService = null;
let exchangeRateService = null;

// YOUR WALLET ADDRESS
const USER_WALLET_ADDRESS = process.env.USER_WALLET_ADDRESS;
const QUBIC_USDC_CONTRACT = process.env.QUBIC_USDC_ADDRESS;

// Cache wallet data
let cachedWalletData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds
let fetchInProgress = false;

// ==================== WALLET DATA HELPERS ====================

async function getFreshWalletData(forceRefresh = false) {
  const now = Date.now();
  
  while (fetchInProgress) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!forceRefresh && cachedWalletData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedWalletData;
  }
  
  fetchInProgress = true;
  
  try {
    console.log('[WALLET] Fetching fresh wallet data from Qubic blockchain...');
    
    const walletInfo = await walletService.getWalletInfo(
      USER_WALLET_ADDRESS,
      QUBIC_USDC_CONTRACT
    );
    
    cachedWalletData = {
      id: 'demo-user',
      wallet: {
        address: USER_WALLET_ADDRESS,
        balance: walletInfo.balances.usdc || 0,
        qubicBalance: walletInfo.balances.qubic || 0,
        transactionCount: walletInfo.transactionCount,
        walletId: 'qubic_wallet_' + USER_WALLET_ADDRESS.slice(2, 10)
      },
      agent: {
        personality: 'balanced',
        dailyLimit: 500
      },
      network: walletInfo.network,
      blockchain: 'qubic',
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
    
    if (cachedWalletData) {
      console.log('[WALLET] Using cached data as fallback');
      return cachedWalletData;
    }
    
    return {
      id: 'demo-user',
      wallet: {
        address: USER_WALLET_ADDRESS,
        balance: 0,
        qubicBalance: 0,
        transactionCount: 0,
        walletId: 'qubic_wallet_error'
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

let mockUser = null;

// ==================== STARTUP INITIALIZATION ====================

(async () => {
  try {
    console.log('[STARTUP] Initializing QubicPay AI services...');
    
    // Initialize Firebase
    console.log('[FIREBASE] Initializing Firebase services...');
    await paymentScheduler.initialize();
    
    // Initialize Security Monitor
    console.log('[SECURITY] Initializing security monitor...');
    await securityMonitor.initialize();
    console.log('[SECURITY] ✅ Security Monitor ready');
    
    // Initialize Qubic Payments
    console.log('[QUBIC] Initializing Qubic blockchain integration...');
    await qubicPayments.initialize();
    console.log('[QUBIC] ✅ Qubic Payment Service ready');
    
    // Initialize Cross-Border Services
    console.log('[REMITTANCE] Initializing cross-border services...');
    exchangeRateService = getExchangeRateService();
    crossBorderService = getCrossBorderService(paymentScheduler);
    remittanceService = getRemittanceService();
    await remittanceService.initialize(paymentScheduler);
    console.log('[REMITTANCE] ✅ Cross-border services ready');
    console.log('[REMITTANCE] 🌍 6 countries supported (KE, NG, ZA, GH, UG, RW)');
    
    // Fetch wallet data
    mockUser = await getFreshWalletData();
    console.log('[WALLET] 🎯 Qubic wallet integrated successfully!');
    console.log('[STARTUP] ✅ All services initialized!');
  } catch (error) {
    console.error('[STARTUP] Failed to initialize:', error);
  }
})();

// In-memory instruction store
const STORE = {
  instructions: {},
  transactions: {}
};

// ==================== CORE ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    blockchain: 'qubic',
    firebase: paymentScheduler.initialized ? 'connected' : 'disconnected',
    qubicPayments: qubicPayments.initialized ? 'ready' : 'initializing',
    wallet: cachedWalletData ? 'connected' : 'initializing',
    security: securityMonitor.initialized ? 'ready' : 'initializing',
    timestamp: new Date().toISOString() 
  });
});

// Get user profile with wallet data
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

// ==================== QUBIC PAYMENT ROUTES ====================

// One-step payment (create + execute via Qubic)
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
    
    console.log(`[QUBIC API] Payment: ${amount} ${currency || 'USDC'} to ${to}`);
    
    // Check balance
    const user = await getFreshWalletData(true);
    if (amount > user.wallet.balance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance: ${user.wallet.balance} USDC`
      });
    }
    
    // Execute via Qubic
    const result = await qubicPayments.instantTransfer({
      recipient: to,
      amount: parseFloat(amount),
      decisionId: `direct_${Date.now()}`
    });
    
    if (result.success) {
      // Log to Firebase
      try {
        await paymentScheduler.logPaymentHistory(userId, {
          paymentId: `qubic_${Date.now()}`,
          type: 'direct',
          payee: to,
          amount: parseFloat(amount),
          currency: currency || 'USDC',
          status: 'completed',
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          blockchain: 'qubic'
        });
        console.log('[QUBIC API] ✅ Payment logged to Firebase');
      } catch (error) {
        console.warn('[QUBIC API] History logging failed:', error.message);
      }
      
      res.json({
        success: true,
        payment: result,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        blockchain: 'qubic',
        message: `Successfully sent ${amount} ${currency || 'USDC'} to ${to}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        payment: result
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
    const history = await remittanceService.getHistory(userId);
    res.json({ success: true, history });
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

// ==================== CHAT WITH AI MEMORY ====================

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    console.log(`[CHAT] User: ${userId}, Building context...`);
    
    const user = await getFreshWalletData(true);
    const wallet = user.wallet;
    const agent = user.agent;
    
    const memory = await buildAIMemoryContext(userId);
    
    const systemMessage = {
      role: "system",
      content: `You are QubicPay AI, an AI assistant for cross-border cryptocurrency payments on Qubic blockchain.

**CURRENT USER DATA:**
- Balance: ${wallet.balance} USDC
- Wallet: ${wallet.address}
- Blockchain: Qubic
- Today's Date: ${new Date().toISOString().split('T')[0]}

**PAYMENT REQUEST FORMAT:**
PAYMENT_REQUEST: {"recipient": "0xADDRESS", "amount": 10.50, "currency": "USDC", "description": "Payment description"}

**REMITTANCE REQUEST FORMAT:**
REMITTANCE_REQUEST: {"recipientId": "new", "recipientName": "John Doe", "country": "Kenya", "countryCode": "KE", "walletAddress": "0x1234...", "phoneNumber": "+254712345678", "amount": 50, "currency": "USDC"}

**SUPPORTED COUNTRIES & EXCHANGE RATES:**
1. 🇰🇪 Kenya (KES) - Rate: 1 USDC = 129 KES - M-Pesa (5-15 min)
2. 🇳🇬 Nigeria (NGN) - Rate: 1 USDC = 775 NGN - Bank Transfer (1-2 hours)
3. 🇿🇦 South Africa (ZAR) - Rate: 1 USDC = 18.5 ZAR - Bank Transfer (1-2 hours)
4. 🇬🇭 Ghana (GHS) - Rate: 1 USDC = 12 GHS - Mobile Money (5-15 min)
5. 🇺🇬 Uganda (UGX) - Rate: 1 USDC = 3,750 UGX - Mobile Money (5-15 min)
6. 🇷🇼 Rwanda (RWF) - Rate: 1 USDC = 1,100 RWF - Mobile Money (5-15 min)

**PAYMENT MEMORY:**
${memory.paymentMemory}

**STATISTICS:**
${memory.statistics}

**BLOCKCHAIN:**
All transactions are logged on Qubic blockchain with full transparency and auditability.

Be helpful, security-conscious, and guide users through cross-border payments.`
    };
    
    const chatMessages = [systemMessage, ...messages];
    
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
    
    if (!cloudflareWorkerUrl) {
      return res.status(500).json({ error: 'Cloudflare Worker not configured' });
    }
    
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
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error('[CHAT] Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// ==================== AI MEMORY BUILDER ====================

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
  ${p.txHash ? `TX: ${p.txHash}` : ''}
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

All transactions are verifiable on Qubic Explorer`;
    
  } catch (error) {
    console.error('[MEMORY] Error building context:', error.message);
    context.paymentMemory = '(Error loading payment history)';
  }
  
  return context;
}

// ==================== SECURITY ROUTES ====================

// Check transaction security
app.post('/api/security/check', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const result = await securityMonitor.checkTransaction(userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  console.log(`   Wallet: ${USER_WALLET_ADDRESS ? '✅ Connected' : '⚠️ Not configured'}`);
  console.log(`   Firebase: ${paymentScheduler.initialized ? '✅ Ready' : '⏳ Initializing...'}`);
  console.log(`   Qubic Payments: ${qubicPayments.initialized ? '✅ Ready' : '⏳ Initializing...'}`);
  console.log(`   Security: ${securityMonitor.initialized ? '✅ Ready' : '⏳ Initializing...'}`);
  console.log(`   Cross-Border: ✅ 6 countries supported`);
  console.log('============================================ 🚀\n');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  process.exit(0);
});

module.exports = app;