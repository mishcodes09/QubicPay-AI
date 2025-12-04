// routes/remittanceRoutes.js - Qubic Blockchain Integration
// Cross-border remittance routes with Qubic on-chain logging

const express = require('express');
const router = express.Router();

// These services will be initialized in server.js and passed to routes
let remittanceService = null;
let crossBorderService = null;
let exchangeRateService = null;

// Middleware to ensure services are initialized
const ensureServicesInitialized = (req, res, next) => {
  if (!remittanceService || !crossBorderService || !exchangeRateService) {
    return res.status(503).json({
      success: false,
      error: 'Remittance services are still initializing. Please try again.'
    });
  }
  next();
};

router.use(ensureServicesInitialized);

// ==================== RECIPIENT MANAGEMENT ROUTES ====================

/**
 * Add a new recipient
 * POST /api/remittance/recipients
 */
router.post('/recipients', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const recipientData = req.body;
    
    console.log(`[REMITTANCE] Adding recipient for user ${userId}`);
    
    const recipient = await crossBorderService.addRecipient(userId, recipientData);
    
    res.json({
      success: true,
      recipient,
      blockchain: 'qubic',
      message: `Recipient ${recipient.name} added successfully`
    });
  } catch (error) {
    console.error('[API] Add recipient error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get all recipients
 * GET /api/remittance/recipients
 */
router.get('/recipients', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const filter = {
      countryCode: req.query.country,
      favorite: req.query.favorite === 'true'
    };
    
    const recipients = await crossBorderService.getRecipients(userId, filter);
    
    res.json({
      success: true,
      recipients,
      count: recipients.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get recipients error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get a specific recipient
 * GET /api/remittance/recipients/:recipientId
 */
router.get('/recipients/:recipientId', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const recipient = await crossBorderService.getRecipientById(recipientId);
    
    res.json({
      success: true,
      recipient,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get recipient error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Update recipient
 * PUT /api/remittance/recipients/:recipientId
 */
router.put('/recipients/:recipientId', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const updates = req.body;
    
    await crossBorderService.updateRecipient(recipientId, updates);
    
    res.json({
      success: true,
      message: 'Recipient updated successfully',
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Update recipient error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Toggle recipient favorite
 * POST /api/remittance/recipients/:recipientId/favorite
 */
router.post('/recipients/:recipientId/favorite', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const result = await crossBorderService.toggleFavorite(recipientId);
    
    res.json({
      success: true,
      favorite: result.favorite,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Toggle favorite error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Delete recipient
 * DELETE /api/remittance/recipients/:recipientId
 */
router.delete('/recipients/:recipientId', async (req, res) => {
  try {
    const { recipientId } = req.params;
    await crossBorderService.deleteRecipient(recipientId);
    
    res.json({
      success: true,
      message: 'Recipient deleted successfully',
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Delete recipient error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== EXCHANGE RATE ROUTES ====================

/**
 * Get current exchange rate
 * GET /api/remittance/rates?from=USD&to=KES
 */
router.get('/rates', async (req, res) => {
  try {
    const { from = 'USD', to } = req.query;
    
    if (!to) {
      return res.status(400).json({ 
        success: false,
        error: 'Target currency required' 
      });
    }
    
    const rateInfo = await remittanceService.getExchangeRate(from, to);
    
    res.json({
      ...rateInfo,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get rate error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get all available rates
 * GET /api/remittance/rates/all
 */
router.get('/rates/all', async (req, res) => {
  try {
    const rates = await remittanceService.getAllRates();
    
    res.json({
      success: true,
      rates,
      timestamp: new Date().toISOString(),
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get all rates error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get supported countries
 * GET /api/remittance/countries
 */
router.get('/countries', async (req, res) => {
  try {
    const countries = crossBorderService.getSupportedCountries();
    
    res.json({
      success: true,
      countries,
      count: countries.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get countries error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== REMITTANCE TRANSACTION ROUTES ====================

/**
 * Preview remittance (calculate fees, rates, etc.)
 * POST /api/remittance/preview
 */
router.post('/preview', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { recipientId, amount } = req.body;
    
    if (!recipientId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'recipientId and amount are required' 
      });
    }
    
    console.log(`[REMITTANCE] Preview: ${amount} USDC to ${recipientId}`);
    
    const preview = await remittanceService.previewRemittance(
      userId,
      recipientId,
      parseFloat(amount)
    );
    
    res.json({
      ...preview,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Preview remittance error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Send remittance via Qubic
 * POST /api/remittance/send
 * 
 * This will:
 * 1. Log decision on DecisionLogger contract
 * 2. Execute payment via PaymentRouter
 * 3. Update decision status
 * 4. Log to Firebase for history
 */
router.post('/send', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { recipientId, amount, description } = req.body;
    
    if (!recipientId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'recipientId and amount are required' 
      });
    }
    
    console.log(`[REMITTANCE] Sending ${amount} USDC to ${recipientId} via Qubic`);
    
    const result = await remittanceService.sendRemittance(userId, {
      recipientId,
      amount: parseFloat(amount),
      description: description || 'Cross-border remittance via Qubic'
    });
    
    if (result.success) {
      console.log(`[REMITTANCE] ✅ Sent successfully`);
      console.log(`[REMITTANCE] Decision TX: ${result.blockchain?.decisionTx?.hash}`);
      console.log(`[REMITTANCE] Payment TX: ${result.blockchain?.paymentTx?.hash}`);
      
      res.json({
        ...result,
        blockchain: 'qubic'
      });
    } else {
      res.status(400).json({
        ...result,
        blockchain: 'qubic'
      });
    }
  } catch (error) {
    console.error('[API] Send remittance error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      blockchain: 'qubic'
    });
  }
});

/**
 * Quick send to saved recipient
 * POST /api/remittance/quick-send
 */
router.post('/quick-send', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { recipientId, amount } = req.body;
    
    console.log(`[REMITTANCE] Quick send: ${amount} USDC to ${recipientId}`);
    
    const result = await remittanceService.quickSend(
      userId,
      recipientId,
      parseFloat(amount)
    );
    
    res.json({
      ...result,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Quick send error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      blockchain: 'qubic'
    });
  }
});

/**
 * Get remittance history
 * GET /api/remittance/history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const options = {
      limit: parseInt(req.query.limit) || 50,
      country: req.query.country,
      status: req.query.status
    };
    
    const history = await remittanceService.getHistory(userId, options);
    
    res.json({
      success: true,
      history,
      count: history.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get history error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Track delivery status
 * GET /api/remittance/track/:remittanceId
 */
router.get('/track/:remittanceId', async (req, res) => {
  try {
    const { remittanceId } = req.params;
    
    console.log(`[REMITTANCE] Tracking: ${remittanceId}`);
    
    const tracking = await remittanceService.trackDelivery(remittanceId);
    
    res.json({
      ...tracking,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Track delivery error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get remittance statistics
 * GET /api/remittance/stats?period=month
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const period = req.query.period || 'month';
    
    const stats = await remittanceService.getStats(userId, period);
    
    res.json({
      success: true,
      stats,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get suggested recipients (most frequent)
 * GET /api/remittance/suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const limit = parseInt(req.query.limit) || 5;
    
    const suggestions = await remittanceService.getSuggestedRecipients(userId, limit);
    
    res.json({
      success: true,
      suggestions,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get suggestions error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Cancel remittance (before execution)
 * POST /api/remittance/:remittanceId/cancel
 */
router.post('/:remittanceId/cancel', async (req, res) => {
  try {
    const { remittanceId } = req.params;
    
    console.log(`[REMITTANCE] Cancelling: ${remittanceId}`);
    
    const result = await remittanceService.cancelRemittance(remittanceId);
    
    res.json({
      ...result,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Cancel remittance error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get specific remittance details
 * GET /api/remittance/:remittanceId
 */
router.get('/:remittanceId', async (req, res) => {
  try {
    const { remittanceId } = req.params;
    
    const remittance = await crossBorderService.getRemittanceById(remittanceId);
    
    res.json({
      success: true,
      remittance,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get remittance error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== QUBIC-SPECIFIC ROUTES ====================

/**
 * Get Qubic pool stats for remittances
 * GET /api/remittance/qubic/pool
 */
router.get('/qubic/pool', async (req, res) => {
  try {
    // This would integrate with your qubicPayments service
    const qubicPayments = require('../services/qubicPayments').getQubicPaymentService();
    const poolStats = await qubicPayments.getPoolStats();
    
    res.json({
      success: true,
      ...poolStats,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get pool stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get decision from Qubic blockchain
 * GET /api/remittance/qubic/decision/:decisionId
 */
router.get('/qubic/decision/:decisionId', async (req, res) => {
  try {
    const { decisionId } = req.params;
    const qubicPayments = require('../services/qubicPayments').getQubicPaymentService();
    const decision = await qubicPayments.getDecision(decisionId);
    
    res.json({
      success: true,
      decision,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[API] Get decision error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== SERVICE INITIALIZATION ====================

/**
 * Initialize services (called from server.js)
 */
function initializeServices(services) {
  remittanceService = services.remittanceService;
  crossBorderService = services.crossBorderService;
  exchangeRateService = services.exchangeRateService;
  
  console.log('[REMITTANCE ROUTES] Services initialized with Qubic support');
}

module.exports = {
  router,
  initializeServices
};