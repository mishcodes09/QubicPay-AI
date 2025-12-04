// walletService.js - Qubic Blockchain Wallet Integration
const { ethers } = require('ethers');

// USDC ABI (standard ERC20)
const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

class QubicWalletService {
  constructor() {
    const rpcUrl = process.env.QUBIC_RPC_URL || 'https://testnet-rpc.qubic.xyz';
    
    // Create provider with secure HTTPS configuration
    const fetchRequest = new ethers.FetchRequest(rpcUrl);
    fetchRequest.timeout = 30000; // 30 seconds
    fetchRequest.setHeader('User-Agent', 'QubicPay-Wallet/1.0');
    
    // Create provider with secure fetch
    this.provider = new ethers.JsonRpcProvider(
      fetchRequest,
      undefined,
      {
        staticNetwork: true,
        batchMaxCount: 1
      }
    );
    
    this.chainId = parseInt(process.env.QUBIC_CHAIN_ID || '42161');
    
    console.log(`[WALLET] Connected to Qubic RPC: ${rpcUrl}`);
    console.log(`[WALLET] Chain ID: ${this.chainId}`);
  }

  /**
   * Validate address format
   */
  isValidAddress(address) {
    if (!address || typeof address !== 'string') return false;
    
    if (!address.toLowerCase().startsWith('0x')) return false;
    if (address.length !== 42) return false;
    
    const hexPart = address.slice(2);
    const isValidHex = /^[0-9a-fA-F]{40}$/.test(hexPart);
    
    return isValidHex;
  }

  /**
   * Get checksummed address
   */
  getChecksumAddress(address) {
    try {
      return ethers.getAddress(address);
    } catch (error) {
      console.warn('[WALLET] Checksum validation failed, using lowercase');
      return address.toLowerCase();
    }
  }

  /**
   * Get native Qubic token balance
   */
  async getNativeBalance(address) {
    try {
      if (!this.isValidAddress(address)) {
        throw new Error(`Invalid address format: ${address}`);
      }

      const checksumAddress = this.getChecksumAddress(address);
      
      const balance = await this.provider.getBalance(checksumAddress);
      const balanceInQubic = ethers.formatEther(balance);
      return parseFloat(balanceInQubic);
    } catch (error) {
      if (error.code === 'UNSUPPORTED_OPERATION' && error.operation === 'getEnsAddress') {
        console.error('[WALLET] ENS not supported on Qubic network. Use hex addresses only.');
        return 0;
      }
      console.error('[WALLET] Error fetching native balance:', error.message);
      return 0;
    }
  }

  /**
   * Get USDC token balance (ERC20)
   */
  async getUSDCBalance(address, usdcContractAddress) {
    try {
      if (!this.isValidAddress(address)) {
        console.error(`[WALLET] Invalid wallet address: ${address}`);
        return 0;
      }

      if (!usdcContractAddress || usdcContractAddress === '0x...' || !this.isValidAddress(usdcContractAddress)) {
        console.warn('[WALLET] USDC contract address not configured or invalid');
        console.warn(`[WALLET] Received: ${usdcContractAddress}`);
        console.warn('[WALLET] Set QUBIC_USDC_ADDRESS in .env file');
        return 0;
      }

      console.log(`[WALLET] Fetching USDC balance from contract: ${usdcContractAddress}`);

      const checksumWallet = this.getChecksumAddress(address);
      const checksumContract = this.getChecksumAddress(usdcContractAddress);

      const usdcContract = new ethers.Contract(
        checksumContract,
        USDC_ABI,
        this.provider
      );

      let decimals;
      try {
        decimals = await usdcContract.decimals();
        console.log(`[WALLET] USDC contract decimals: ${decimals}`);
      } catch (decimalError) {
        console.error('[WALLET] Failed to read decimals from contract:', decimalError.message);
        decimals = 6; // Default USDC decimals
        console.log('[WALLET] Using default USDC decimals: 6');
      }

      const balance = await usdcContract.balanceOf(checksumWallet);
      const balanceInUsdc = ethers.formatUnits(balance, decimals);
      const balanceNum = parseFloat(balanceInUsdc);
      
      console.log(`[WALLET] USDC Balance: ${balanceNum} (raw: ${balance.toString()}, decimals: ${decimals})`);
      
      return balanceNum;
    } catch (error) {
      if (error.code === 'UNSUPPORTED_OPERATION') {
        console.error('[WALLET] ENS not supported. Ensure you are using hex addresses.');
        return 0;
      }
      console.error('[WALLET] Error fetching USDC balance:', error.message);
      return 0;
    }
  }

  /**
   * Get complete wallet info
   */
  async getWalletInfo(address, usdcContractAddress = null) {
    try {
      console.log(`[WALLET] Fetching wallet info for: ${address}`);

      if (!this.isValidAddress(address)) {
        throw new Error(`Invalid wallet address format: ${address}. Use hex address (0x...)`);
      }

      const checksumAddress = this.getChecksumAddress(address);
      console.log(`[WALLET] Using checksummed address: ${checksumAddress}`);

      // Use Promise.allSettled for graceful failure handling
      const [qubicResult, usdcResult, txCountResult] = await Promise.allSettled([
        this.getNativeBalance(checksumAddress),
        usdcContractAddress ? this.getUSDCBalance(checksumAddress, usdcContractAddress) : Promise.resolve(0),
        this.provider.getTransactionCount(checksumAddress).catch(() => 0)
      ]);

      const qubicBalance = qubicResult.status === 'fulfilled' ? qubicResult.value : 0;
      const usdcBalance = usdcResult.status === 'fulfilled' ? usdcResult.value : 0;
      const transactionCount = txCountResult.status === 'fulfilled' ? txCountResult.value : 0;

      // Get network info
      let networkInfo = { name: 'Qubic Testnet', chainId: this.chainId };
      try {
        const network = await this.provider.getNetwork();
        const actualChainId = Number(network.chainId);
        
        networkInfo = {
          name: actualChainId === 42161 ? 'Qubic Testnet' : network.name || 'Qubic Testnet',
          chainId: actualChainId
        };
        
        if (actualChainId !== this.chainId) {
          console.warn(`[WALLET] Chain ID mismatch: expected ${this.chainId}, got ${actualChainId}`);
          console.warn('[WALLET] Update QUBIC_CHAIN_ID in .env to match the actual network');
        }
      } catch (networkError) {
        console.warn('[WALLET] Could not fetch network info, using defaults');
      }

      const walletInfo = {
        address: checksumAddress,
        balances: {
          qubic: qubicBalance,
          usdc: usdcBalance
        },
        transactionCount,
        network: networkInfo,
        blockchain: 'qubic',
        lastUpdated: new Date().toISOString()
      };

      console.log('[WALLET] ✅ Wallet info fetched:', {
        address: checksumAddress.slice(0, 10) + '...',
        qubic: qubicBalance,
        usdc: usdcBalance,
        txCount: transactionCount
      });

      return walletInfo;
    } catch (error) {
      console.error('[WALLET] Error fetching wallet info:', error.message);
      
      return {
        address,
        balances: {
          qubic: 0,
          usdc: 0
        },
        transactionCount: 0,
        network: {
          name: 'Qubic Testnet',
          chainId: this.chainId
        },
        blockchain: 'qubic',
        lastUpdated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(address, blocksToSearch = 1000) {
    try {
      if (!this.isValidAddress(address)) {
        console.error('[WALLET] Invalid address for transaction search');
        return [];
      }

      const checksumAddress = this.getChecksumAddress(address);
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - blocksToSearch);

      console.log(`[WALLET] Searching transactions from block ${fromBlock} to ${currentBlock}`);

      const transactions = [];
      
      for (let i = currentBlock; i > fromBlock && transactions.length < 10; i--) {
        try {
          const block = await this.provider.getBlock(i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && (tx.from === checksumAddress || tx.to === checksumAddress)) {
                transactions.push({
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  value: ethers.formatEther(tx.value || 0),
                  blockNumber: i,
                  timestamp: block.timestamp,
                  blockchain: 'qubic'
                });
                
                if (transactions.length >= 10) break;
              }
            }
          }
        } catch (blockError) {
          continue;
        }
      }

      console.log(`[WALLET] Found ${transactions.length} recent transactions`);
      return transactions;
    } catch (error) {
      console.error('[WALLET] Error fetching transactions:', error.message);
      return [];
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null
      };
    } catch (error) {
      console.error('[WALLET] Error fetching gas price:', error.message);
      return { gasPrice: '0', maxFeePerGas: null, maxPriorityFeePerGas: null };
    }
  }

  /**
   * Get block number
   */
  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('[WALLET] Error fetching block number:', error.message);
      return 0;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx) {
    try {
      if (tx.to) {
        if (!this.isValidAddress(tx.to)) {
          throw new Error('Invalid recipient address');
        }
        tx.to = this.getChecksumAddress(tx.to);
      }
      if (tx.from) {
        if (!this.isValidAddress(tx.from)) {
          throw new Error('Invalid sender address');
        }
        tx.from = this.getChecksumAddress(tx.from);
      }

      const gasEstimate = await this.provider.estimateGas(tx);
      return gasEstimate.toString();
    } catch (error) {
      console.error('[WALLET] Error estimating gas:', error.message);
      return '21000';
    }
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(address, amount, tokenType = 'usdc') {
    try {
      if (tokenType === 'qubic') {
        const balance = await this.getNativeBalance(address);
        return balance >= parseFloat(amount);
      } else if (tokenType === 'usdc') {
        const usdcContract = process.env.QUBIC_USDC_ADDRESS;
        if (!usdcContract) return false;
        
        const balance = await this.getUSDCBalance(address, usdcContract);
        return balance >= parseFloat(amount);
      }
      return false;
    } catch (error) {
      console.error('[WALLET] Error checking balance:', error.message);
      return false;
    }
  }
}

// Singleton instance
let walletServiceInstance = null;

function getWalletService() {
  if (!walletServiceInstance) {
    walletServiceInstance = new QubicWalletService();
  }
  return walletServiceInstance;
}

module.exports = {
  QubicWalletService,
  getWalletService
};