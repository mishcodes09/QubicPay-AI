/**
 * useQubicWallet Hook
 * Manages Qubic wallet connection and state
 */
import { useState, useEffect, useCallback } from 'react';
import QubicService, { QubicWallet } from '../services/qubicService';

interface WalletState {
  wallet: QubicWallet | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

export const useQubicWallet = () => {
  const [state, setState] = useState<WalletState>({
    wallet: null,
    isConnecting: false,
    isConnected: false,
    error: null
  });

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!state.isConnected || !state.wallet) return;

    const interval = setInterval(async () => {
      try {
        const balance = await QubicService.getBalance(state.wallet!.address);
        setState(prev => ({
          ...prev,
          wallet: prev.wallet ? { ...prev.wallet, balance } : null
        }));
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.isConnected, state.wallet]);

  const checkExistingConnection = async () => {
    try {
      // Check if wallet was previously connected (from localStorage)
      const savedAddress = localStorage.getItem('qubic_wallet_address');
      if (savedAddress) {
        // Attempt to reconnect
        await connect();
      }
    } catch (error) {
      console.error('Failed to check existing connection:', error);
    }
  };

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const wallet = await QubicService.connectWallet();
      
      // Save connection to localStorage
      localStorage.setItem('qubic_wallet_address', wallet.address);
      
      setState({
        wallet,
        isConnecting: false,
        isConnected: true,
        error: null
      });

      return wallet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      
      setState({
        wallet: null,
        isConnecting: false,
        isConnected: false,
        error: errorMessage
      });

      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    // Clear saved connection
    localStorage.removeItem('qubic_wallet_address');
    
    setState({
      wallet: null,
      isConnecting: false,
      isConnected: false,
      error: null
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.wallet) return;

    try {
      const balance = await QubicService.getBalance(state.wallet.address);
      setState(prev => ({
        ...prev,
        wallet: prev.wallet ? { ...prev.wallet, balance } : null
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.wallet]);

  return {
    wallet: state.wallet,
    isConnecting: state.isConnecting,
    isConnected: state.isConnected,
    error: state.error,
    connect,
    disconnect,
    refreshBalance
  };
};