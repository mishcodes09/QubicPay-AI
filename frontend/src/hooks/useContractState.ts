/**
 * useContractState Hook
 * Manages smart contract state and polling
 */
import { useState, useEffect, useCallback } from 'react';
import QubicService from '../services/qubicService';

interface ContractState {
  isActive: boolean;
  escrowBalance: number;
  verificationScore: number;
  isVerified: boolean;
  isPaid: boolean;
  isRefunded: boolean;
  brandId?: string;
  influencerId?: string;
  retentionEndTick?: number;
}

interface UseContractStateReturn {
  contractState: ContractState | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useContractState = (contractId: string | null, pollingInterval: number = 5000): UseContractStateReturn => {
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContractState = useCallback(async () => {
    if (!contractId) {
      setContractState(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await QubicService.getContractState(contractId);
      setContractState(state);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contract state';
      setError(errorMessage);
      console.error('Contract state fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  // Initial fetch
  useEffect(() => {
    fetchContractState();
  }, [fetchContractState]);

  // Polling
  useEffect(() => {
    if (!contractId || pollingInterval <= 0) return;

    const interval = setInterval(() => {
      fetchContractState();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [contractId, pollingInterval, fetchContractState]);

  return {
    contractState,
    isLoading,
    error,
    refetch: fetchContractState
  };
};