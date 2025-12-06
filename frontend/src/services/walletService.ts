/**
 * Wallet Service
 * Handles Qubic wallet connection and management
 * 
 * Location: frontend/src/services/walletService.ts
 */

export interface QubicWallet {
  publicKey: string;
  privateKey: string;
  address: string;
  balance: number;
  connected: boolean;
}

export interface WalletConnection {
  wallet: QubicWallet | null;
  isConnected: boolean;
  error: string | null;
}

class WalletService {
  private wallet: QubicWallet | null = null;
  private storageKey = 'qubic_wallet';

  /**
   * Connect wallet (demo mode)
   * In production, this would integrate with actual Qubic wallet
   */
  async connect(): Promise<QubicWallet> {
    try {
      // Check if wallet exists in storage
      const stored = this.getStoredWallet();
      if (stored) {
        this.wallet = stored;
        return stored;
      }

      // Generate new demo wallet
      const newWallet = this.generateDemoWallet();
      this.wallet = newWallet;
      
      // Store wallet (demo only - never store private keys in production!)
      this.storeWallet(newWallet);
      
      return newWallet;
    } catch (error) {
      throw new Error('Failed to connect wallet: ' + (error as Error).message);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.wallet = null;
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Get current wallet
   */
  getWallet(): QubicWallet | null {
    return this.wallet;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.wallet !== null && this.wallet.connected;
  }

  /**
   * Get wallet balance
   */
  async getBalance(_publicKey: string): Promise<number> {
    // In production, query actual blockchain
    // For demo, return mock balance
    return this.wallet?.balance || 0;
  }

  /**
   * Generate demo wallet for testing
   */
  private generateDemoWallet(): QubicWallet {
    // Generate Qubic-style addresses (60 characters uppercase)
    const publicKey = this.generateQubicAddress();
    const privateKey = this.generateQubicSeed();
    
    return {
      publicKey,
      privateKey,
      address: publicKey,
      balance: 1000000, // 1M QUBIC for demo
      connected: true
    };
  }

  /**
   * Generate Qubic public key (60 uppercase chars)
   */
  private generateQubicAddress(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let address = '';
    for (let i = 0; i < 60; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
  }

  /**
   * Generate Qubic seed (55 lowercase chars)
   */
  private generateQubicSeed(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let seed = '';
    for (let i = 0; i < 55; i++) {
      seed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return seed;
  }

  /**
   * Store wallet in localStorage (DEMO ONLY)
   */
  private storeWallet(wallet: QubicWallet): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(wallet));
    } catch (error) {
      console.error('Failed to store wallet:', error);
    }
  }

  /**
   * Get stored wallet from localStorage
   */
  private getStoredWallet(): QubicWallet | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const wallet = JSON.parse(stored) as QubicWallet;
      wallet.connected = true;
      return wallet;
    } catch (error) {
      console.error('Failed to retrieve stored wallet:', error);
      return null;
    }
  }

  /**
   * Sign transaction (mock for demo)
   */
  async signTransaction(transaction: any): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    // In production, use actual Qubic signing
    // For demo, return mock signature
    const txData = JSON.stringify(transaction);
    const signature = this.mockSign(txData);
    
    return signature;
  }

  /**
   * Mock signing function for demo
   */
  private mockSign(data: string): string {
    // Simple hash-like signature for demo
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * Validate Qubic address format
   */
  isValidAddress(address: string): boolean {
    // Qubic addresses are 60 uppercase letters
    return /^[A-Z]{60}$/.test(address);
  }

  /**
   * Format address for display (shortened)
   */
  formatAddress(address: string): string {
    if (!address || address.length < 60) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  /**
   * Format balance for display
   */
  formatBalance(balance: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(balance);
  }
}

// Export singleton instance
export const walletService = new WalletService();

// Export class for testing
export default WalletService;