/**
 * Brand Dashboard Component
 */
import React, { useState } from 'react';
import { QubicWallet } from '../services/qubicService';
import VerificationDisplay from './VerificationDisplay';
import ContractInteraction from './ContractInteraction';
import TransactionHistory from './TransactionHistory';
import { formatQubic, formatAddress } from '../utils/helpers';

interface BrandDashboardProps {
  wallet: QubicWallet;
  onBack: () => void;
}

type TabType = 'create' | 'verify' | 'contracts' | 'history';

const BrandDashboard: React.FC<BrandDashboardProps> = ({ wallet, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Role Selection</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Brand Dashboard</h1>
              <p className="text-gray-400">Create and manage influencer campaigns</p>
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Wallet Balance</div>
          <div className="text-2xl font-bold text-white">{formatQubic(wallet.balance)}</div>
          <div className="text-xs text-gray-500 mt-1">{formatAddress(wallet.address)}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Active Campaigns"
          value="0"
          subtitle="Running"
          color="blue"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Verified"
          value="0"
          subtitle="Approved"
          color="green"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Fraud Detected"
          value="0"
          subtitle="Blocked"
          color="red"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Total Spent"
          value="0 QUBIC"
          subtitle="This month"
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-8">
        <div className="flex space-x-8">
          <Tab
            active={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            label="Create Campaign"
          />
          
          <Tab
            active={activeTab === 'verify'}
            onClick={() => setActiveTab('verify')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            label="Verify Posts"
          />
          
          <Tab
            active={activeTab === 'contracts'}
            onClick={() => setActiveTab('contracts')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            label="Contracts"
          />
          
          <Tab
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="History"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'create' && <CreateCampaignTab wallet={wallet} />}
        {activeTab === 'verify' && <VerificationDisplay />}
        {activeTab === 'contracts' && <ContractInteraction wallet={wallet} role="brand" />}
        {activeTab === 'history' && <TransactionHistory wallet={wallet} />}
      </div>
    </div>
  );
};

// Tab Component
const Tab: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
      active
        ? 'border-blue-500 text-blue-400'
        : 'border-transparent text-gray-400 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}> = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400'
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
};

// Create Campaign Tab
const CreateCampaignTab: React.FC<{ wallet: QubicWallet }> = () => {
  const [formData, setFormData] = useState({
    amount: '',
    influencerId: '',
    retentionDays: '7',
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Simulate campaign creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      setFormData({ amount: '', influencerId: '', retentionDays: '7', description: '' });
    } catch (err) {
      setError('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Campaign</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Budget (QUBIC)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              placeholder="1000"
              required
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Platform fee: 3% • You'll pay: {formData.amount ? (parseFloat(formData.amount) * 1.03).toFixed(2) : '0'} QUBIC
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Influencer Wallet Address
            </label>
            <input
              type="text"
              value={formData.influencerId}
              onChange={(e) => setFormData({ ...formData, influencerId: e.target.value })}
              className="input font-mono text-sm"
              placeholder="QUBICAAAAAAAAAAAA..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Retention Period (Days)
            </label>
            <select
              value={formData.retentionDays}
              onChange={(e) => setFormData({ ...formData, retentionDays: e.target.value })}
              className="input"
            >
              <option value="3">3 days</option>
              <option value="7">7 days (Recommended)</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Post must remain live for this period for verification
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Describe your campaign goals and requirements..."
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg text-green-400 text-sm">
              Campaign created successfully! Contract deployed to Qubic network.
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="btn-primary w-full py-4"
          >
            {isCreating ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="spinner w-5 h-5" />
                <span>Creating Campaign...</span>
              </div>
            ) : (
              'Create Campaign & Deploy Contract'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BrandDashboard;