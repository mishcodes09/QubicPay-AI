const mongoose = require('mongoose');
const cron = require('node-cron');

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qubicpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully (QubicPay)');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Scheduled Payment Schema with Qubic support
const ScheduledPaymentSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true, unique: true },
  
  type: { type: String, enum: ['PAY', 'TRANSFER', 'SAVE', 'REMITTANCE'], required: true },
  payee: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USDC' },
  
  scheduledDate: { type: Date, required: true },
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    endDate: Date
  },
  
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Qubic blockchain fields
  blockchain: { type: String, default: 'qubic' },
  decisionId: String,
  decisionTxHash: String,
  decisionExplorerUrl: String,
  paymentTxHash: String,
  paymentExplorerUrl: String,
  blockNumber: Number,
  gasUsed: String,
  rationaleCID: String,
  
  description: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  executedAt: Date,
  failureReason: String
});

// Saved Transfer Schema with Qubic support
const SavedTransferSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  transferId: { type: String, required: true, unique: true },
  
  payee: { type: String, required: true },
  nickname: String,
  amount: Number,
  currency: { type: String, default: 'USDC' },
  
  category: { type: String, enum: ['subscription', 'personal', 'savings', 'bills', 'other', 'remittance'] },
  favorite: { type: Boolean, default: false },
  
  // Qubic specific
  blockchain: { type: String, default: 'qubic' },
  qubicAddress: String,
  onChainVerified: { type: Boolean, default: false },
  
  lastUsed: Date,
  useCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const ScheduledPayment = mongoose.model('ScheduledPayment', ScheduledPaymentSchema);
const SavedTransfer = mongoose.model('SavedTransfer', SavedTransferSchema);

// Payment Scheduler Service with Qubic Integration
class PaymentSchedulerService {
  constructor() {
    this.qubicPayments = null;
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    const { getQubicPaymentService } = require('./qubicPayments');
    this.qubicPayments = getQubicPaymentService();
    await this.qubicPayments.initialize();
    
    this.initializeCronJobs();
    this.initialized = true;
    
    console.log('✅ Payment Scheduler initialized with Qubic');
  }
  
  initializeCronJobs() {
    // Check for scheduled payments every minute
    cron.schedule('* * * * *', async () => {
      await this.executeScheduledPayments();
    });
    
    console.log('✅ Cron jobs initialized (Qubic)');
  }
  
  async schedulePayment(userId, paymentData) {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduledPayment = new ScheduledPayment({
      userId,
      paymentId,
      type: paymentData.type,
      payee: paymentData.payee,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USDC',
      scheduledDate: new Date(paymentData.scheduledDate),
      recurring: paymentData.recurring || { enabled: false },
      description: paymentData.description,
      tags: paymentData.tags || [],
      blockchain: 'qubic'
    });
    
    await scheduledPayment.save();
    console.log(`✅ Payment scheduled: ${paymentId} via Qubic`);
    return scheduledPayment;
  }
  
  async executeScheduledPayments() {
    const now = new Date();
    
    const duePayments = await ScheduledPayment.find({
      scheduledDate: { $lte: now },
      status: 'scheduled'
    });
    
    for (const payment of duePayments) {
      await this.executePayment(payment);
    }
  }
  
  async executePayment(payment) {
    try {
      console.log(`💸 Executing payment via Qubic: ${payment.paymentId}`);
      console.log(`   To: ${payment.payee}`);
      console.log(`   Amount: ${payment.amount} ${payment.currency}`);
      
      // Step 1: Log decision on Qubic
      const decisionId = `scheduled_${payment.paymentId}`;
      const decisionResult = await this.qubicPayments.logDecision({
        decisionId,
        actionSummary: `Scheduled payment: ${payment.amount} USDC to ${payment.payee}`,
        rationaleCID: '',
        amount: payment.amount,
        riskScore: 5
      });
      
      if (!decisionResult.success) {
        throw new Error(`Decision logging failed: ${decisionResult.error}`);
      }
      
      payment.decisionId = decisionId;
      payment.decisionTxHash = decisionResult.txHash;
      payment.decisionExplorerUrl = decisionResult.explorerUrl;
      
      // Step 2: Execute payment via PaymentRouter
      const transferResult = await this.qubicPayments.instantTransfer({
        recipient: payment.payee,
        amount: payment.amount,
        decisionId
      });
      
      if (transferResult.success) {
        // Update decision status
        await this.qubicPayments.updateDecisionStatus(decisionId, 'executed', transferResult.txHash);
        
        payment.status = 'completed';
        payment.executedAt = new Date();
        payment.paymentTxHash = transferResult.txHash;
        payment.paymentExplorerUrl = transferResult.explorerUrl;
        payment.blockNumber = transferResult.blockNumber;
        payment.gasUsed = transferResult.gasUsed;
        await payment.save();
        
        console.log(`✅ Payment executed: ${transferResult.txHash}`);
        
        if (payment.recurring.enabled) {
          await this.scheduleRecurringPayment(payment);
        }
        
        return { success: true, payment };
      } else {
        throw new Error(transferResult.error || 'Payment execution failed');
      }
    } catch (error) {
      console.error('❌ Error executing payment:', error);
      
      payment.status = 'failed';
      payment.failureReason = error.message;
      await payment.save();
      
      // Update decision status
      if (payment.decisionId) {
        await this.qubicPayments.updateDecisionStatus(payment.decisionId, 'failed', '');
      }
      
      return { success: false, error: error.message };
    }
  }
  
  async scheduleRecurringPayment(payment) {
    const nextDate = this.calculateNextDate(
      payment.scheduledDate, 
      payment.recurring.frequency
    );
    
    if (payment.recurring.endDate && nextDate > payment.recurring.endDate) {
      console.log(`⏹️ Recurring payment series ended: ${payment.paymentId}`);
      return;
    }
    
    const nextPayment = new ScheduledPayment({
      userId: payment.userId,
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: payment.type,
      payee: payment.payee,
      amount: payment.amount,
      currency: payment.currency,
      scheduledDate: nextDate,
      recurring: payment.recurring,
      description: payment.description,
      tags: payment.tags,
      blockchain: 'qubic'
    });
    
    await nextPayment.save();
    console.log(`🔁 Next recurring payment scheduled for ${nextDate.toISOString()}`);
    return nextPayment;
  }
  
  calculateNextDate(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date;
  }
  
  async saveTransfer(userId, transferData) {
    const transferId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const savedTransfer = new SavedTransfer({
      userId,
      transferId,
      payee: transferData.payee,
      nickname: transferData.nickname,
      amount: transferData.amount,
      currency: transferData.currency || 'USDC',
      category: transferData.category || 'other',
      favorite: transferData.favorite || false,
      blockchain: 'qubic',
      qubicAddress: transferData.qubicAddress || transferData.payee
    });
    
    await savedTransfer.save();
    console.log(`✅ Transfer saved: ${transferId}`);
    return savedTransfer;
  }
  
  async getUserScheduledPayments(userId, filter = {}) {
    const query = { userId, ...filter };
    return await ScheduledPayment.find(query).sort({ scheduledDate: 1 });
  }
  
  async getUserSavedTransfers(userId) {
    return await SavedTransfer.find({ userId }).sort({ favorite: -1, lastUsed: -1 });
  }
  
  async cancelScheduledPayment(paymentId) {
    const payment = await ScheduledPayment.findOne({ paymentId });
    if (!payment) throw new Error('Payment not found');
    
    payment.status = 'cancelled';
    await payment.save();
    
    // Update decision status if it exists
    if (payment.decisionTxHash && this.qubicPayments) {
      await this.qubicPayments.updateDecisionStatus(payment.decisionId, 'cancelled', '');
    }
    
    console.log(`❌ Payment cancelled: ${paymentId}`);
    return payment;
  }
  
  async getPaymentStats(userId) {
    const payments = await ScheduledPayment.find({ userId });
    
    return {
      total: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      scheduled: payments.filter(p => p.status === 'scheduled').length,
      failed: payments.filter(p => p.status === 'failed').length,
      totalVolume: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      blockchain: {
        network: 'qubic',
        withDecisionLogs: payments.filter(p => p.decisionTxHash).length,
        onChainVerified: payments.filter(p => p.blockNumber).length
      }
    };
  }
}

// Singleton instance
let schedulerInstance = null;

function getPaymentScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new PaymentSchedulerService();
  }
  return schedulerInstance;
}

module.exports = {
  connectDB,
  PaymentSchedulerService,
  ScheduledPayment,
  SavedTransfer,
  getPaymentScheduler
};