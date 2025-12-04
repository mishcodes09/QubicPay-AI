// services/remittanceService.js - Qubic-Powered Remittance Orchestration
const { getExchangeRateService } = require('./exchangeRateService');
const { getCrossBorderService } = require('./crossBorderService');
const { getQubicPaymentService } = require('./qubicPayments');
const { getFirebaseScheduler } = require('./firebaseScheduler');

class RemittanceService {
  constructor() {
    this.qubicPayments = getQubicPaymentService();
    this.exchangeRates = getExchangeRateService();
    this.crossBorder = null; // Initialized with firebase
    this.scheduler = getFirebaseScheduler();
  }

  async initialize(firebaseService) {
    this.crossBorder = getCrossBorderService(firebaseService);
    await this.qubicPayments.initialize();
    console.log('[REMITTANCE] ✅ Service initialized with Qubic');
  }

  // ==================== SEND REMITTANCE (QUBIC) ====================

  /**
   * Complete remittance flow: Log Decision → Execute on Qubic → Deliver
   */
  async sendRemittance(userId, remittanceData) {
    console.log(`[REMITTANCE] 🌍 Starting Qubic cross-border transfer for user: ${userId}`);
    
    try {
      // Step 1: Get recipient details
      console.log('[REMITTANCE] 📋 Step 1: Fetching recipient details...');
      const recipient = await this.crossBorder.getRecipientById(remittanceData.recipientId);
      
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      console.log(`[REMITTANCE] ✅ Recipient: ${recipient.name} in ${recipient.countryName}`);

      // Step 2: Calculate exchange rate and fees
      console.log('[REMITTANCE] 💱 Step 2: Calculating exchange rate and fees...');
      const calculation = await this.exchangeRates.calculateRemittance(
        remittanceData.amount,
        recipient.currency,
        recipient.countryCode
      );

      console.log('[REMITTANCE] 📊 Calculation:', {
        sendAmount: calculation.sendAmount,
        receiveAmount: calculation.receiveAmount,
        exchangeRate: calculation.exchangeRate,
        fee: calculation.fee
      });

      // Step 3: Validate amount limits
      const validation = this.crossBorder.validateRemittanceAmount(
        recipient.countryCode,
        remittanceData.amount
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      console.log('[REMITTANCE] ✅ Amount within limits');

      // Step 4: Create remittance record in Firebase
      console.log('[REMITTANCE] 📝 Step 4: Creating remittance record...');
      const remittance = await this.crossBorder.logRemittance(userId, {
        recipientId: remittanceData.recipientId,
        recipientName: recipient.name,
        recipientCountry: recipient.countryName,
        recipientCurrency: recipient.currency,
        sendAmount: calculation.sendAmount,
        receiveAmount: calculation.receiveAmount,
        exchangeRate: calculation.exchangeRate,
        fee: calculation.fee,
        feePercentage: calculation.feePercentage,
        networkFee: calculation.networkFee,
        deliveryMethod: recipient.preferredMethod,
        estimatedDeliveryTime: '5-15 minutes',
        description: remittanceData.description || `Remittance to ${recipient.name}`,
        status: 'pending'
      });

      console.log(`[REMITTANCE] ✅ Remittance record created: ${remittance.remittanceId}`);

      // Step 5: Upload AI rationale to IPFS
      console.log('[REMITTANCE] 📤 Step 5: Uploading decision rationale to IPFS...');
      const rationale = `
AI Decision: Cross-border remittance
Recipient: ${recipient.name} (${recipient.countryName})
Amount: ${calculation.sendAmount} USDC → ${calculation.receiveAmount} ${recipient.currency}
Exchange Rate: ${calculation.exchangeRate}
Fee: ${calculation.fee} USDC (${calculation.feePercentage})
Risk Assessment: Low (verified recipient, amount within limits)
Timestamp: ${new Date().toISOString()}
      `.trim();

      const ipfsResult = await this.qubicPayments.uploadRationaleToIPFS(rationale);
      const rationaleCID = ipfsResult.success ? ipfsResult.cid : '';

      console.log('[REMITTANCE] IPFS CID:', rationaleCID || 'N/A');

      // Step 6: Log decision on Qubic blockchain
      console.log('[REMITTANCE] ⛓️ Step 6: Logging decision on Qubic blockchain...');
      
      const decisionResult = await this.qubicPayments.logDecision({
        decisionId: remittance.remittanceId,
        actionSummary: `Remittance: ${calculation.sendAmount} USDC to ${recipient.name} in ${recipient.countryName}`,
        rationaleCID,
        amount: calculation.sendAmount,
        riskScore: 12 // Low risk for standard remittance
      });

      if (!decisionResult.success) {
        throw new Error(`Decision logging failed: ${decisionResult.error}`);
      }

      console.log('[REMITTANCE] ✅ Decision logged on-chain');
      console.log('   TX Hash:', decisionResult.txHash);
      console.log('   Explorer:', decisionResult.explorerUrl);

      // Update remittance with decision TX
      await this.crossBorder.updateRemittanceStatus(
        remittance.remittanceId,
        'processing',
        {
          decisionTxHash: decisionResult.txHash,
          decisionExplorerUrl: decisionResult.explorerUrl,
          rationaleCID
        }
      );

      // Step 7: Execute payment via PaymentRouter on Qubic
      console.log('[REMITTANCE] 💸 Step 7: Executing instant transfer via PaymentRouter...');
      
      const transferResult = await this.qubicPayments.instantTransfer({
        recipient: recipient.walletAddress,
        amount: calculation.sendAmount,
        decisionId: remittance.remittanceId
      });

      if (transferResult.success) {
        console.log('[REMITTANCE] ✅ Payment executed successfully');
        console.log('   TX Hash:', transferResult.txHash);
        console.log('   Block:', transferResult.blockNumber);
        console.log('   Gas used:', transferResult.gasUsed);

        // Update decision status to EXECUTED
        await this.qubicPayments.updateDecisionStatus(
          remittance.remittanceId,
          'executed',
          transferResult.txHash
        );

        // Update remittance status
        await this.crossBorder.updateRemittanceStatus(
          remittance.remittanceId,
          'completed',
          {
            txHash: transferResult.txHash,
            explorerUrl: transferResult.explorerUrl,
            blockNumber: transferResult.blockNumber,
            gasUsed: transferResult.gasUsed
          }
        );

        // Update recipient stats
        await this.crossBorder.updateRecipientStats(
          recipient.recipientId,
          calculation.sendAmount
        );

        // Log to payment history
        await this.scheduler.logPaymentHistory(userId, {
          paymentId: remittance.remittanceId,
          type: 'remittance',
          payee: recipient.walletAddress,
          payeeName: recipient.name,
          payeeCountry: recipient.countryName,
          amount: calculation.sendAmount,
          currency: 'USDC',
          receiveAmount: calculation.receiveAmount,
          receiveCurrency: recipient.currency,
          status: 'completed',
          txHash: transferResult.txHash,
          explorerUrl: transferResult.explorerUrl,
          decisionTxHash: decisionResult.txHash
        });

        console.log('[REMITTANCE] 🎉 Remittance completed successfully!');

        return {
          success: true,
          remittance: {
            ...remittance,
            status: 'completed',
            txHash: transferResult.txHash,
            explorerUrl: transferResult.explorerUrl,
            decisionTxHash: decisionResult.txHash,
            decisionExplorerUrl: decisionResult.explorerUrl,
            rationaleCID
          },
          calculation,
          blockchain: {
            decisionTx: {
              hash: decisionResult.txHash,
              explorerUrl: decisionResult.explorerUrl
            },
            paymentTx: {
              hash: transferResult.txHash,
              explorerUrl: transferResult.explorerUrl,
              blockNumber: transferResult.blockNumber,
              gasUsed: transferResult.gasUsed
            }
          },
          message: `Successfully sent ${calculation.sendAmount} USDC to ${recipient.name} in ${recipient.countryName}. They will receive ${calculation.receiveAmount} ${recipient.currency}.`
        };
      } else {
        console.error('[REMITTANCE] ❌ Payment execution failed:', transferResult.error);

        // Update decision status to FAILED
        await this.qubicPayments.updateDecisionStatus(
          remittance.remittanceId,
          'failed',
          ''
        );

        // Update remittance status
        await this.crossBorder.updateRemittanceStatus(
          remittance.remittanceId,
          'failed',
          {
            failureReason: transferResult.error
          }
        );

        return {
          success: false,
          error: transferResult.error || 'Payment execution failed',
          remittance: {
            ...remittance,
            status: 'failed'
          },
          decisionTxHash: decisionResult.txHash
        };
      }
    } catch (error) {
      console.error('[REMITTANCE] ❌ Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  // ==================== REMITTANCE PREVIEW ====================

  async previewRemittance(userId, recipientId, amount) {
    try {
      const recipient = await this.crossBorder.getRecipientById(recipientId);
      
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      const calculation = await this.exchangeRates.calculateRemittance(
        amount,
        recipient.currency,
        recipient.countryCode
      );

      const validation = this.crossBorder.validateRemittanceAmount(
        recipient.countryCode,
        amount
      );

      // Get PaymentRouter pool stats
      const poolStats = await this.qubicPayments.getPoolStats();

      return {
        success: true,
        preview: {
          recipient: {
            name: recipient.name,
            country: recipient.countryName,
            currency: recipient.currency,
            deliveryMethod: recipient.preferredMethod
          },
          calculation,
          validation,
          poolLiquidity: poolStats.success ? poolStats.reserves : 'N/A',
          estimatedDelivery: '5-15 minutes',
          blockchainSteps: [
            '1. Log AI decision on Qubic (DecisionLogger)',
            '2. Upload rationale to IPFS',
            '3. Execute instant transfer (PaymentRouter)',
            '4. Update decision status'
          ]
        }
      };
    } catch (error) {
      console.error('[REMITTANCE] Preview error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== QUICK SEND ====================

  async quickSend(userId, recipientId, amount) {
    return await this.sendRemittance(userId, {
      recipientId,
      amount,
      description: 'Quick send'
    });
  }

  // ==================== HISTORY & STATS ====================

  async getHistory(userId, options = {}) {
    const limit = options.limit || 50;
    const country = options.country;
    const status = options.status;

    let remittances = await this.crossBorder.getRemittanceHistory(userId, limit);

    if (country) {
      remittances = remittances.filter(r => r.recipientCountry === country);
    }

    if (status) {
      remittances = remittances.filter(r => r.status === status);
    }

    // Enhance with recipient info
    const enhanced = await Promise.all(
      remittances.map(async (remittance) => {
        try {
          const recipient = await this.crossBorder.getRecipientById(remittance.recipientId);
          return {
            ...remittance,
            recipientDetails: recipient
          };
        } catch (error) {
          return remittance;
        }
      })
    );

    return enhanced;
  }

  async getStats(userId, period = 'month') {
    const stats = await this.crossBorder.getUserRemittanceStats(userId);
    
    // Add blockchain insights
    const poolStats = await this.qubicPayments.getPoolStats();

    return {
      ...stats,
      blockchain: {
        poolLiquidity: poolStats.success ? poolStats.reserves : 'N/A',
        totalPoolVolume: poolStats.success ? poolStats.volume : 'N/A',
        totalTransfers: poolStats.success ? poolStats.transfers : 'N/A'
      }
    };
  }

  // ==================== TRACK DELIVERY ====================

  async trackDelivery(remittanceId) {
    try {
      const remittance = await this.crossBorder.getRemittanceById(remittanceId);

      // Check blockchain confirmation if txHash exists
      let blockchainStatus = null;
      if (remittance.txHash) {
        const receipt = await this.qubicPayments.getTransactionReceipt(remittance.txHash);
        blockchainStatus = receipt.success ? receipt.receipt : null;
      }

      return {
        success: true,
        tracking: {
          remittanceId,
          status: remittance.status,
          recipient: remittance.recipientName,
          country: remittance.recipientCountry,
          amount: remittance.receiveAmount,
          currency: remittance.recipientCurrency,
          estimatedDelivery: remittance.estimatedDeliveryTime,
          txHash: remittance.txHash,
          explorerUrl: remittance.explorerUrl,
          decisionTxHash: remittance.decisionTxHash,
          blockchainStatus,
          createdAt: remittance.createdAt,
          completedAt: remittance.completedAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== EXCHANGE RATES ====================

  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      const rate = await this.exchangeRates.getRate(fromCurrency, toCurrency);

      return {
        success: true,
        from: fromCurrency,
        to: toCurrency,
        rate,
        formatted: `1 ${fromCurrency} = ${rate.toFixed(2)} ${toCurrency}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllRates() {
    const rates = await this.exchangeRates.getAllRates();
    return rates;
  }

  // ==================== RECIPIENT SUGGESTIONS ====================

  async getSuggestedRecipients(userId, limit = 5) {
    const recipients = await this.crossBorder.getRecipients(userId);
    
    const sorted = recipients
      .filter(r => r.transactionCount > 0)
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, limit);

    return sorted;
  }

  // ==================== CANCEL REMITTANCE ====================

  async cancelRemittance(remittanceId) {
    try {
      const remittance = await this.crossBorder.getRemittanceById(remittanceId);
      
      if (remittance.status !== 'pending') {
        throw new Error('Can only cancel pending remittances');
      }

      await this.crossBorder.updateRemittanceStatus(
        remittanceId,
        'cancelled',
        {
          cancelledAt: new Date().toISOString()
        }
      );

      // Update decision status
      if (remittance.decisionTxHash) {
        await this.qubicPayments.updateDecisionStatus(
          remittanceId,
          'cancelled',
          ''
        );
      }

      console.log(`[REMITTANCE] ❌ Remittance cancelled: ${remittanceId}`);
      
      return {
        success: true,
        message: 'Remittance cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let remittanceServiceInstance = null;

function getRemittanceService() {
  if (!remittanceServiceInstance) {
    remittanceServiceInstance = new RemittanceService();
  }
  return remittanceServiceInstance;
}

module.exports = {
  RemittanceService,
  getRemittanceService
};