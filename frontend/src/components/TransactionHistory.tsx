/**
 * Transaction History Component
 */
import React, { useState } from 'react';
import { QubicWallet } from '../services/qubicService';
import { formatQubic, formatRelativeTime, getExplorerUrl } from '../utils/helpers';

interface TransactionHistoryProps {
  wallet: QubicWallet;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund' | 'verification';
  amount?: number;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: number;
  txHash: string;
  from?: string;
  to?: string;
  verificationScore?: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ wallet }) => {
  // Mock transaction data
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: 1000,
      status: 'confirmed',
      timestamp: Date.now() - 3600000,
      txHash: '0x' + 'a'.repeat(64),
      from: wallet.address,
      to: 'CONTRACT'
    },
    {
      id: '2',
      type: 'verification',
      status: 'confirmed',
      timestamp: Date.now() - 1800000,
      txHash: '0x' + 'b'.repeat(64),
      verificationScore: 96
    },
    {
      id: '3',
      type: 'payment',
      amount: 970,
      status: 'confirmed',
      timestamp: Date.now() - 900000,
      txHash: '0x' + 'c'.repeat(64),
      from: 'CONTRACT',
      to: wallet.address
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'deposit' | 'payment' | 'refund' | 'verification'>('all');

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <span className="text-sm text-gray-400">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All"
            count={transactions.length}
          />
          <FilterButton
            active={filter === 'deposit'}
            onClick={() => setFilter('deposit')}
            label="Deposits"
            count={transactions.filter(tx => tx.type === 'deposit').length}
          />
          <FilterButton
            active={filter === 'payment'}
            onClick={() => setFilter('payment')}
            label="Payments"
            count={transactions.filter(tx => tx.type === 'payment').length}
          />
          <FilterButton
            active={filter === 'verification'}
            onClick={() => setFilter('verification')}
            label="Verifications"
            count={transactions.filter(tx => tx.type === 'verification').length}
          />
          <FilterButton
            active={filter === 'refund'}
            onClick={() => setFilter('refund')}
            label="Refunds"
            count={transactions.filter(tx => tx.type === 'refund').length}
          />
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-4">
          {filteredTransactions.map(tx => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Transactions</h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? 'You haven\'t made any transactions yet' 
              : `No ${filter} transactions found`}
          </p>
        </div>
      )}

      {/* Zero Fees Banner */}
      <div className="card p-6 bg-green-900/10 border-green-500/30">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-400 mb-1">Zero Transaction Fees</h4>
            <p className="text-sm text-gray-400">
              All transactions on Qubic are free. No gas fees, no hidden costs. 100% of your funds go where they should.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Filter Button Component
const FilterButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {label} ({count})
  </button>
);

// Transaction Card Component
const TransactionCard: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'deposit':
        return (
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'refund':
        return (
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
        );
      case 'verification':
        return (
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'confirmed':
        return <span className="badge badge-success text-xs">✓ Confirmed</span>;
      case 'pending':
        return <span className="badge badge-warning text-xs">⏱ Pending</span>;
      case 'failed':
        return <span className="badge badge-error text-xs">✗ Failed</span>;
    }
  };

  return (
    <div className="card p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {getTypeIcon()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-white capitalize">{transaction.type}</h4>
              {getStatusBadge()}
            </div>
            
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatRelativeTime(transaction.timestamp)}</span>
              </div>
              
              <div className="flex items-center space-x-2 font-mono text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="truncate">{transaction.txHash.slice(0, 20)}...</span>
                <a
                  href={getExplorerUrl(transaction.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {transaction.verificationScore !== undefined && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Score: {transaction.verificationScore}/100</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {transaction.amount !== undefined && (
          <div className="text-right ml-4">
            <div className={`text-xl font-bold ${
              transaction.type === 'payment' ? 'text-green-400' :
              transaction.type === 'refund' ? 'text-yellow-400' :
              'text-white'
            }`}>
              {transaction.type === 'payment' || transaction.type === 'refund' ? '+' : '-'}
              {formatQubic(transaction.amount)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Fee: 0 QUBIC</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;