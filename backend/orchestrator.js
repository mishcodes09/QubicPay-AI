const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { logDecisionOnChain, updateDecisionStatus } = require('./decisionLogger');

class PaymentOrchestrator {
  constructor() {
    this.qubicPayments = null;
    this.initialized = false;
    
    console.log('[ORCHESTRATOR] 🔗 Using Qubic blockchain');
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const { getQubicPaymentService } = require('./services/qubicPayments');
      this.qubicPayments = getQubicPaymentService();
      await this.qubicPayments.initialize();
      
      this.initialized = true;
      console.log('[ORCHESTRATOR] ✅ Qubic payment service connected');
    } catch (error) {
      console.error('[ORCHESTRATOR] Failed to initialize Qubic:', error.message);
    }
  }
  
  async executePlan(plan, context) {
    await this.initialize();
    
    const { userId, agent, wallet, instructionId } = context;
    
    console.log(`[ORCHESTRATOR] 🚀 Executing plan for user ${userId} via Qubic`);
    console.log(`[ORCHESTRATOR] Actions: ${plan.actions.length}`);
    
    const results = [];
    let totalAmount = 0;
    let allSuccess = true;
    
    // Calculate total amount and risk
    for (const action of plan.actions) {
      if (action.amount) totalAmount += action.amount;
    }
    
    const riskScore = this.calculateRiskScore(totalAmount, wallet, agent);
    
    // Log decision to Qubic blockchain BEFORE execution
    let blockchainTx = null;
    if (instructionId) {
      try {
        const actionSummary = plan.actions
          .map(a => `${a.type}: ${a.to} ${a.amount ? a.amount + ' USDC' : ''}`)
          .join(', ');
        
        blockchainTx = await logDecisionOnChain(
          instructionId,
          actionSummary,
          '', // rationaleCID - could upload to IPFS
          totalAmount,
          riskScore
        );
        
        if (blockchainTx.success) {
          console.log(`[ORCHESTRATOR] ✅ Decision logged on Qubic: ${blockchainTx.explorerUrl}`);
        }
      } catch (error) {
        console.warn('[ORCHESTRATOR] ⚠️ Blockchain logging failed:', error.message);
      }
    }
    
    // Execute each action via Qubic
    for (const action of plan.actions) {
      try {
        this.checkPolicy(action, agent, wallet);
        
        let result;
        if (action.type === 'TRANSFER' || action.type === 'payment') {
          result = await this.executeTransfer(action, wallet, instructionId);
        } else if (action.type === 'SAVE') {
          result = await this.executeSave(action, wallet, instructionId);
        } else {
          throw new Error(`Unknown action type: ${action.type}`);
        }
        
        results.push({
          actionId: action.actionId,
          ...result,
          status: 'confirmed',
          blockchain: 'qubic'
        });
        
        console.log(`[ORCHESTRATOR] ✅ Action ${action.actionId} completed`);
        
      } catch (error) {
        console.error(`[ORCHESTRATOR] ❌ Action ${action.actionId} failed:`, error.message);
        allSuccess = false;
        
        results.push({
          actionId: action.actionId,
          status: 'failed',
          error: error.message,
          blockchain: 'qubic'
        });
      }
    }
    
    // Update Qubic blockchain status after execution
    if (blockchainTx && blockchainTx.success && instructionId) {
      try {
        const qubicTxRefs = results
          .filter(r => r.txHash)
          .map(r => r.txHash)
          .join(',');
        
        await updateDecisionStatus(
          instructionId,
          allSuccess ? 'executed' : 'failed',
          qubicTxRefs
        );
        
        console.log(`[ORCHESTRATOR] ✅ Qubic status updated: ${allSuccess ? 'EXECUTED' : 'FAILED'}`);
      } catch (error) {
        console.warn('[ORCHESTRATOR] ⚠️ Status update failed:', error.message);
      }
    }
    
    return {
      results,
      executedAt: new Date().toISOString(),
      summary: this.generateSummary(results),
      blockchainTx,
      blockchain: 'qubic'
    };
  }
  
  checkPolicy(action, agent, wallet) {
    if (action.amount && action.amount > agent.dailyLimit) {
      throw new Error(`Amount ${action.amount} exceeds daily limit ${agent.dailyLimit}`);
    }
    
    if (action.amount && action.amount > wallet.balance) {
      throw new Error(`Insufficient balance: ${wallet.balance} < ${action.amount}`);
    }
    
    const blockedRecipients = ['scammer', 'fraud', 'blocked'];
    if (action.to && blockedRecipients.some(b => action.to.toLowerCase().includes(b))) {
      throw new Error(`Recipient ${action.to} is blocked`);
    }
  }
  
  calculateRiskScore(totalAmount, wallet, agent) {
    let risk = 0;
    
    if (totalAmount > wallet.balance * 0.5) risk += 0.3;
    if (totalAmount > wallet.balance) risk += 0.5;
    if (totalAmount > agent.dailyLimit * 0.5) risk += 0.2;
    if (totalAmount > agent.dailyLimit) risk += 0.4;
    
    return Math.min(risk, 1.0);
  }
  
  async executeTransfer(action, wallet, decisionId) {
    try {
      if (!this.qubicPayments || !this.initialized) {
        throw new Error('Qubic payment service not initialized');
      }
      
      console.log(`[ORCHESTRATOR] Executing transfer via Qubic`);
      console.log(`   To: ${action.to}`);
      console.log(`   Amount: ${action.amount} ${action.currency || 'USDC'}`);
      
      const result = await this.qubicPayments.instantTransfer({
        recipient: action.to,
        amount: action.amount,
        decisionId: decisionId || `action_${Date.now()}`
      });
      
      if (result.success) {
        return {
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          amount: action.amount,
          to: action.to,
          blockchain: 'qubic'
        };
      } else {
        throw new Error(result.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('[ORCHESTRATOR] Qubic transfer error:', error.message);
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }
  
  async executeSave(action, wallet, decisionId) {
    const saveAmount = wallet.balance * (action.percent / 100);
    
    // For savings, we'd transfer to a designated savings wallet
    const savingsAddress = process.env.SAVINGS_WALLET_ADDRESS || wallet.address;
    
    return await this.executeTransfer({
      ...action,
      amount: saveAmount,
      to: savingsAddress
    }, wallet, decisionId);
  }
  
  generateSummary(results) {
    const successful = results.filter(r => r.status === 'confirmed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalAmount = results
      .filter(r => r.amount)
      .reduce((sum, r) => sum + r.amount, 0);
    
    return {
      total: results.length,
      successful,
      failed,
      totalAmount,
      blockchain: 'qubic',
      message: `Executed ${successful}/${results.length} actions successfully via Qubic${
        totalAmount > 0 ? ` (${totalAmount.toFixed(2)} USDC)` : ''
      }`
    };
  }
}

const orchestrator = new PaymentOrchestrator();

async function executePlan(plan, context) {
  return await orchestrator.executePlan(plan, context);
}

module.exports = {
  executePlan,
  PaymentOrchestrator
};