/**
 * Contract Interaction Component
 * Deploy contracts, deposit funds, release payments
 */
import React, { useState } from 'react';
import QubicService, { QubicWallet } from '../services/qubicService';
import { useContractState } from '../hooks/useContractState';
import { formatQubic } from '../utils/helpers';

interface ContractInteractionProps {
  wallet: QubicWallet;
  role: 'brand' | 'influencer';
}

const ContractInteraction: React.FC<ContractInteractionProps> = ({ wallet, role }) => {
  const [contractId, setContractId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);

 const { contractState, refetch } = useContractState(contractId);

  const handleDeployContract = async () => {
    setIsDeploying(true);
    setTxResult(null);

    try {
      const oracleAddress = 'QUBIC' + 'A'.repeat(55); // Mock oracle address
      const result = await QubicService.deployContract(wallet.address, oracleAddress);
      
      setContractId(result.contractId);
      setTxResult({
        type: 'deploy',
        success: true,
        data: result
      });
    } catch (error) {
      setTxResult({
        type: 'deploy',
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDepositFunds = async (amount: number, influencerId: string) => {
    if (!contractId) return;

    setIsProcessing(true);
    setTxResult(null);

    try {
      const result = await QubicService.depositFunds(contractId, amount, influencerId);
      
      setTxResult({
        type: 'deposit',
        success: true,
        data: result
      });
      
      await refetch();
    } catch (error) {
      setTxResult({
        type: 'deposit',
        success: false,
        error: error instanceof Error ? error.message : 'Deposit failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!contractId) return;

    setIsProcessing(true);
    setTxResult(null);

    try {
      const result = await QubicService.releasePayment(contractId);
      
      setTxResult({
        type: 'release',
        success: true,
        data: result
      });
      
      await refetch();
    } catch (error) {
      setTxResult({
        type: 'release',
        success: false,
        error: error instanceof Error ? error.message : 'Release failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!contractId) return;

    setIsProcessing(true);
    setTxResult(null);

    try {
      const result = await QubicService.refundFunds(contractId);
      
      setTxResult({
        type: 'refund',
        success: true,
        data: result
      });
      
      await refetch();
    } catch (error) {
      setTxResult({
        type: 'refund',
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Contract Deployment */}
      {!contractId && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Deploy Smart Contract</h2>
          <p className="text-gray-400 mb-6">
            Deploy your escrow smart contract to the Qubic blockchain
          </p>
          <button
            onClick={handleDeployContract}
            disabled={isDeploying}
            className="btn-primary"
          >
            {isDeploying ? (
              <div className="flex items-center space-x-2">
                <div className="spinner w-5 h-5" />
                <span>Deploying...</span>
              </div>
            ) : (
              'Deploy Contract'
            )}
          </button>
        </div>
      )}

      {/* Contract Info */}
      {contractId && (
        <>
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Smart Contract</h2>
              <span className="badge badge-success">Active</span>
            </div>

            <div className="space-y-4">
              <InfoRow
                label="Contract ID"
                value={contractId}
                copyable
              />
              <InfoRow
                label="Network"
                value="Qubic Testnet"
              />
              <InfoRow
                label="Transaction Fee"
                value="0 QUBIC"
                highlight="Zero fees!"
              />
              {contractState && (
                <>
                  <InfoRow
                    label="Escrow Balance"
                    value={formatQubic(contractState.escrowBalance)}
                  />
                  <InfoRow
                    label="Verification Score"
                    value={`${contractState.verificationScore}/100`}
                  />
                  <InfoRow
                    label="Status"
                    value={
                      contractState.isPaid ? 'Paid' :
                      contractState.isRefunded ? 'Refunded' :
                      contractState.isVerified ? 'Verified - Ready' :
                      'Awaiting Verification'
                    }
                  />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {role === 'brand' && (
            <div className="card p-8">
              <h3 className="text-xl font-bold text-white mb-6">Brand Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={() => handleDepositFunds(1000, 'QUBIC' + 'B'.repeat(55))}
                  disabled={isProcessing}
                  className="btn-primary w-full"
                >
                  Deposit 1000 QUBIC to Escrow
                </button>
                <button
                  onClick={handleReleasePayment}
                  disabled={isProcessing || !contractState?.isVerified}
                  className="btn-success w-full"
                >
                  Release Payment to Influencer
                </button>
                <button
                  onClick={handleRefund}
                  disabled={isProcessing}
                  className="btn-danger w-full"
                >
                  Request Refund (Fraud Detected)
                </button>
              </div>
            </div>
          )}

          {/* Transaction Result */}
          {txResult && (
            <div className={`card p-6 ${
              txResult.success
                ? 'bg-green-900/10 border-green-500/30'
                : 'bg-red-900/10 border-red-500/30'
            }`}>
              <div className="flex items-start space-x-3">
                {txResult.success ? (
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    txResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {txResult.success ? 'Transaction Successful' : 'Transaction Failed'}
                  </h4>
                  {txResult.success && txResult.data.txHash && (
                    <p className="text-sm text-gray-400 font-mono">
                      TX: {txResult.data.txHash.slice(0, 20)}...
                    </p>
                  )}
                  {!txResult.success && (
                    <p className="text-sm text-red-300">{txResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contract Info Panel */}
      <div className="card p-6 bg-blue-900/10 border-blue-500/30">
        <h4 className="font-semibold text-blue-400 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Smart Contract Features
        </h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>✓ Automatic payment release when verification score ≥ 95</li>
          <li>✓ Automatic refund to brand if fraud detected (score {'<'} 95)</li>
          <li>✓ AI oracle updates verification scores on-chain</li>
          <li>✓ Zero transaction fees on Qubic network</li>
          <li>✓ Immutable audit trail for all transactions</li>
        </ul>
      </div>
    </div>
  );
};

// Info Row Component
const InfoRow: React.FC<{
  label: string;
  value: string;
  highlight?: string;
  copyable?: boolean;
}> = ({ label, value, highlight, copyable }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center space-x-2">
        <span className="text-white font-mono text-sm">
          {value.length > 40 ? `${value.slice(0, 20)}...${value.slice(-10)}` : value}
        </span>
        {highlight && (
          <span className="text-xs text-green-400 font-semibold">{highlight}</span>
        )}
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractInteraction;