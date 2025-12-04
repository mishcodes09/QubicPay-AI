const { ethers } = require('ethers');
require('dotenv').config();

// ABI for Qubic DecisionLogger contract
const DECISION_LOGGER_ABI = [
  "event DecisionLogged(string indexed decisionId, address indexed agent, uint256 amount, uint8 riskScore, uint256 timestamp)",
  "event DecisionStatusUpdated(string indexed decisionId, uint8 oldStatus, uint8 newStatus, string txRef)",
  "event AgentAuthorized(address indexed agent)",
  "event AgentRevoked(address indexed agent)",
  "function logDecision(string decisionId, string actionSummary, string rationaleCID, uint256 amount, uint8 riskScore) external returns (bool)",
  "function updateDecisionStatus(string decisionId, uint8 newStatus, string txRef) external returns (bool)",
  "function getDecision(string decisionId) external view returns (tuple(string decisionId, address agent, string actionSummary, string rationaleCID, uint256 timestamp, uint256 amount, uint8 riskScore, uint8 status, string txRef))",
  "function authorizeAgent(address agent) external",
  "function revokeAgent(address agent) external",
  "function authorizedAgents(address) external view returns (bool)",
  "function agentDecisionCount(address) external view returns (uint256)",
  "function totalDecisions() external view returns (uint256)",
  "function owner() external view returns (address)"
];

class DecisionLogger {
  constructor() {
    this.rpcUrl = process.env.QUBIC_RPC_URL;
    this.privateKey = process.env.QUBIC_PRIVATE_KEY;
    this.contractAddress = process.env.QUBIC_DECISION_LOGGER_ADDRESS;
    this.explorerUrl = process.env.QUBIC_EXPLORER || 'https://testnet-explorer.qubic.xyz';
    
    const isValidConfig = 
      this.rpcUrl && 
      this.privateKey && 
      this.contractAddress &&
      this.privateKey.startsWith('0x') &&
      this.privateKey.length === 66 &&
      this.contractAddress.startsWith('0x');
    
    this.enabled = isValidConfig;
    
    if (this.enabled) {
      try {
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        this.contract = new ethers.Contract(
          this.contractAddress,
          DECISION_LOGGER_ABI,
          this.wallet
        );
        
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║          🔗 QUBIC BLOCKCHAIN CONNECTED                ║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log('║ Network:  Qubic Testnet                                ║');
        console.log(`║ Contract: ${this.contractAddress.slice(0, 20)}...    ║`);
        console.log(`║ Agent:    ${this.wallet.address.slice(0, 20)}...    ║`);
        console.log(`║ Explorer: ${this.explorerUrl}                          ║`);
        console.log('╚════════════════════════════════════════════════════════╝');
      } catch (error) {
        console.log('[DECISION_LOGGER] ⚠️ Error:', error.message);
        this.enabled = false;
      }
    } else {
      console.log('[DECISION_LOGGER] ⚠️ Not configured properly');
      console.log('[DECISION_LOGGER] Required env vars:');
      console.log('  - QUBIC_RPC_URL');
      console.log('  - QUBIC_PRIVATE_KEY');
      console.log('  - QUBIC_DECISION_LOGGER_ADDRESS');
    }
  }
  
  async logDecision(decisionId, actionSummary, rationaleCID = '', amount = 0, riskScore = 0) {
    if (!this.enabled) {
      return { success: false, reason: 'Not configured' };
    }
    
    try {
      console.log(`[DECISION_LOGGER] 📝 Logging decision ${decisionId} to Qubic...`);
      
      // Convert amount to wei (USDC has 6 decimals)
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      
      // Ensure risk score is 0-100
      const safeRiskScore = Math.min(Math.max(Math.floor(riskScore), 0), 100);
      
      const tx = await this.contract.logDecision(
        decisionId,
        actionSummary || 'No description',
        rationaleCID || '',
        amountWei,
        safeRiskScore
      );
      
      console.log(`[DECISION_LOGGER] ⏳ TX sent: ${tx.hash}`);
      console.log(`[DECISION_LOGGER] 🔍 View: ${this.explorerUrl}/tx/${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`[DECISION_LOGGER] ✅ Confirmed in block ${receipt.blockNumber}`);
      console.log(`[DECISION_LOGGER] ⛽ Gas used: ${receipt.gasUsed.toString()}`);
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl: `${this.explorerUrl}/tx/${receipt.hash}`,
        contractUrl: `${this.explorerUrl}/address/${this.contractAddress}`
      };
      
    } catch (error) {
      console.error('[DECISION_LOGGER] ❌ Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async updateStatus(decisionId, newStatus, txRef = '') {
    if (!this.enabled) return { success: false };
    
    try {
      // Status enum: 0=PENDING, 1=APPROVED, 2=EXECUTED, 3=FAILED, 4=CANCELLED
      const statusMap = {
        'PENDING': 0,
        'APPROVED': 1,
        'EXECUTED': 2,
        'FAILED': 3,
        'CANCELLED': 4,
        'pending': 0,
        'approved': 1,
        'executed': 2,
        'failed': 3,
        'cancelled': 4
      };
      
      const statusCode = statusMap[newStatus] ?? 0;
      
      console.log(`[DECISION_LOGGER] 🔄 Updating decision ${decisionId} to ${newStatus}`);
      
      const tx = await this.contract.updateDecisionStatus(
        decisionId,
        statusCode,
        txRef || ''
      );
      
      const receipt = await tx.wait();
      
      console.log(`[DECISION_LOGGER] ✅ Status updated: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${this.explorerUrl}/tx/${receipt.hash}`
      };
    } catch (error) {
      console.error('[DECISION_LOGGER] Update status error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  async getStats() {
    if (!this.enabled) return { enabled: false };
    
    try {
      const agentCount = await this.contract.agentDecisionCount(this.wallet.address);
      const totalDecisions = await this.contract.totalDecisions();
      const isAuthorized = await this.contract.authorizedAgents(this.wallet.address);
      const balance = await this.provider.getBalance(this.wallet.address);
      const network = await this.provider.getNetwork();
      
      return {
        enabled: true,
        network: `Qubic Testnet (Chain ID: ${network.chainId})`,
        agentAddress: this.wallet.address,
        agentDecisions: agentCount.toString(),
        authorized: isAuthorized,
        totalSystemDecisions: totalDecisions.toString(),
        contractAddress: this.contractAddress,
        balance: ethers.formatEther(balance) + ' tokens',
        explorerUrl: `${this.explorerUrl}/address/${this.contractAddress}`
      };
    } catch (error) {
      return { enabled: true, error: error.message };
    }
  }
  
  async getDecision(decisionId) {
    if (!this.enabled) return null;
    
    try {
      const decision = await this.contract.getDecision(decisionId);
      
      // Status mapping
      const statusNames = ['PENDING', 'APPROVED', 'EXECUTED', 'FAILED', 'CANCELLED'];
      
      return {
        decisionId: decision.decisionId,
        agent: decision.agent,
        actionSummary: decision.actionSummary,
        rationaleCID: decision.rationaleCID,
        timestamp: new Date(Number(decision.timestamp) * 1000).toISOString(),
        amount: ethers.formatUnits(decision.amount, 6),
        riskScore: decision.riskScore,
        status: statusNames[decision.status] || 'UNKNOWN',
        txRef: decision.txRef,
        explorerUrl: `${this.explorerUrl}/address/${this.contractAddress}`
      };
    } catch (error) {
      console.error('[DECISION_LOGGER] Get decision error:', error.message);
      return null;
    }
  }
  
  async verifyAuthorization() {
    if (!this.enabled) return false;
    
    try {
      const isAuthorized = await this.contract.authorizedAgents(this.wallet.address);
      return isAuthorized;
    } catch (error) {
      console.error('[DECISION_LOGGER] Authorization check error:', error.message);
      return false;
    }
  }
  
  async getContractOwner() {
    if (!this.enabled) return null;
    
    try {
      return await this.contract.owner();
    } catch (error) {
      console.error('[DECISION_LOGGER] Get owner error:', error.message);
      return null;
    }
  }
}

// Singleton instance
const logger = new DecisionLogger();

// Exported functions for backward compatibility
async function logDecisionOnChain(decisionId, actionSummary, rationaleCID = '', txRef = '', amount = 0, riskScore = 0) {
  return await logger.logDecision(decisionId, actionSummary, rationaleCID, amount, riskScore);
}

async function updateDecisionStatus(decisionId, status, txRef = '') {
  return await logger.updateStatus(decisionId, status, txRef);
}

async function getContractInfo() {
  return await logger.getStats();
}

async function getDecisionFromChain(decisionId) {
  return await logger.getDecision(decisionId);
}

async function isAgentAuthorized() {
  return await logger.verifyAuthorization();
}

module.exports = {
  logDecisionOnChain,
  updateDecisionStatus,
  getContractInfo,
  getDecisionFromChain,
  isAgentAuthorized,
  DecisionLogger,
  logger
};