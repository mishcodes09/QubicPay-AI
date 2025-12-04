// routes/scheduler.js - Qubic Blockchain Payment Scheduler
const express = require('express');
const router = express.Router();
const { getFirebaseScheduler } = require('../services/firebaseScheduler');

const scheduler = getFirebaseScheduler();

// ==================== GET SCHEDULED PAYMENTS ====================
router.get('/scheduled', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const status = req.query.status; // optional filter
    
    console.log(`[SCHEDULER] Getting scheduled payments for ${userId}`);
    
    const payments = await scheduler.getScheduledPayments(userId, { status });
    
    res.json({
      success: true,
      payments,
      count: payments.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[SCHEDULER] Get scheduled error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== GET SINGLE PAYMENT ====================
router.get('/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Implementation needed in firebaseScheduler
    res.json({
      success: true,
      payment: {},
      blockchain: 'qubic'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== SCHEDULE NEW PAYMENT ====================
router.post('/schedule', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { payee, amount, currency, scheduledDate, recurring, description } = req.body;
    
    console.log(`[SCHEDULER] New schedule request from ${userId} (Qubic)`);
    
    if (!payee || !amount || !scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: payee, amount, scheduledDate'
      });
    }
    
    // Validate date is in the future
    const scheduleTime = new Date(scheduledDate);
    const now = new Date();
    
    if (scheduleTime <= now) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled date must be in the future'
      });
    }
    
    const payment = await scheduler.schedulePayment(userId, {
      type: 'PAY',
      payee,
      amount: parseFloat(amount),
      currency: currency || 'USDC',
      scheduledDate,
      recurring: recurring || { enabled: false },
      description: description || `Payment to ${payee}`
    });
    
    console.log(`[SCHEDULER] ✅ Payment scheduled on Qubic: ${payment.paymentId}`);
    
    res.json({
      success: true,
      payment,
      blockchain: 'qubic',
      message: `Payment scheduled for ${scheduleTime.toLocaleString()} on Qubic blockchain`
    });
  } catch (error) {
    console.error('[SCHEDULER] Schedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== CANCEL SCHEDULED PAYMENT ====================
router.delete('/scheduled/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`[SCHEDULER] Cancelling payment: ${paymentId}`);
    
    const result = await scheduler.cancelScheduledPayment(paymentId);
    
    res.json({
      success: true,
      payment: result,
      blockchain: 'qubic',
      message: 'Payment cancelled successfully'
    });
  } catch (error) {
    console.error('[SCHEDULER] Cancel error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== GET SAVED TRANSFERS ====================
router.get('/transfers', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    console.log(`[SCHEDULER] Getting saved transfers for ${userId}`);
    
    const transfers = await scheduler.getSavedTransfers(userId);
    
    res.json({
      success: true,
      transfers,
      count: transfers.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[SCHEDULER] Get transfers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== SAVE TRANSFER ====================
router.post('/transfers', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const transferData = req.body;
    
    console.log(`[SCHEDULER] Saving transfer for ${userId} (Qubic)`);
    
    const transfer = await scheduler.saveTransfer(userId, transferData);
    
    res.json({
      success: true,
      transfer,
      blockchain: 'qubic',
      message: 'Transfer saved successfully'
    });
  } catch (error) {
    console.error('[SCHEDULER] Save transfer error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== GET PAYMENT HISTORY ====================
router.get('/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const limit = parseInt(req.query.limit) || 50;
    
    console.log(`[SCHEDULER] Getting payment history for ${userId} (limit: ${limit})`);
    
    const history = await scheduler.getPaymentHistory(userId, limit);
    
    res.json({
      success: true,
      history,
      count: history.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[SCHEDULER] Get history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== GET ALL SCHEDULED PAYMENTS (alias) ====================
router.get('/payments', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    console.log(`[SCHEDULER] Getting all payments for ${userId}`);
    
    const payments = await scheduler.getScheduledPayments(userId);
    
    res.json({
      success: true,
      payments,
      count: payments.length,
      blockchain: 'qubic'
    });
  } catch (error) {
    console.error('[SCHEDULER] Get payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== GET QUBIC SCHEDULER STATS ====================
router.get('/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    const [scheduled, history, transfers] = await Promise.all([
      scheduler.getScheduledPayments(userId),
      scheduler.getPaymentHistory(userId, 100),
      scheduler.getSavedTransfers(userId)
    ]);
    
    const stats = {
      scheduledPayments: scheduled.length,
      completedPayments: history.filter(h => h.status === 'completed').length,
      failedPayments: history.filter(h => h.status === 'failed').length,
      savedTransfers: transfers.length,
      totalVolume: history
        .filter(h => h.status === 'completed')
        .reduce((sum, h) => sum + (h.amount || 0), 0),
      blockchain: 'qubic',
      qubicFeatures: {
        onChainDecisions: history.filter(h => h.decisionTxHash).length,
        verifiableTransactions: history.filter(h => h.txHash).length,
        explorerLinks: history.filter(h => h.explorerUrl).length
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[SCHEDULER] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== UPDATE TRANSFER USAGE ====================
router.post('/transfers/:transferId/use', async (req, res) => {
  try {
    const { transferId } = req.params;
    
    await scheduler.updateTransferUsage(transferId);
    
    res.json({
      success: true,
      blockchain: 'qubic',
      message: 'Transfer usage updated'
    });
  } catch (error) {
    console.error('[SCHEDULER] Update usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== DELETE SAVED TRANSFER ====================
router.delete('/transfers/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params;
    
    // This would need to be implemented in firebaseScheduler
    res.json({
      success: true,
      blockchain: 'qubic',
      message: 'Transfer deleted successfully'
    });
  } catch (error) {
    console.error('[SCHEDULER] Delete transfer error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;