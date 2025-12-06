/**
 * Influencer Dashboard Component
 */
import React, { useState } from 'react';
import { QubicWallet } from '../services/qubicService';
import VerificationDisplay from './VerificationDisplay';
import TransactionHistory from './TransactionHistory';
import { formatQubic, formatAddress } from '../utils/helpers';

interface InfluencerDashboardProps {
  wallet: QubicWallet;
  onBack: () => void;
}

type TabType = 'campaigns' | 'verify' | 'earnings' | 'history';

const InfluencerDashboard: React.FC<InfluencerDashboardProps> = ({ wallet, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');

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
            <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Influencer Dashboard</h1>
              <p className="text-gray-400">Manage campaigns and track earnings</p>
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Total Earnings</div>
          <div className="text-2xl font-bold text-white">{formatQubic(wallet.balance)}</div>
          <div className="text-xs text-gray-500 mt-1">{formatAddress(wallet.address)}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="Active Campaigns"
          value="0"
          subtitle="In progress"
          color="blue"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Completed"
          value="0"
          subtitle="Verified & paid"
          color="green"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Pending"
          value="0"
          subtitle="Awaiting verification"
          color="yellow"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          title="Avg Score"
          value="96/100"
          subtitle="Quality rating"
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-8">
        <div className="flex space-x-8">
          <Tab
            active={activeTab === 'campaigns'}
            onClick={() => setActiveTab('campaigns')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            label="My Campaigns"
          />
          
          <Tab
            active={activeTab === 'verify'}
            onClick={() => setActiveTab('verify')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Submit for Verification"
          />
          
          <Tab
            active={activeTab === 'earnings'}
            onClick={() => setActiveTab('earnings')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Earnings"
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
        {activeTab === 'campaigns' && <CampaignsTab />}
        {activeTab === 'verify' && <VerificationDisplay />}
        {activeTab === 'earnings' && <EarningsTab />}
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
        ? 'border-purple-500 text-purple-400'
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
  color: 'blue' | 'green' | 'yellow' | 'purple';
}> = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
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

// Campaigns Tab
const CampaignsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="card p-8 text-center">
      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No Active Campaigns</h3>
      <p className="text-gray-400 mb-6">
        You don't have any campaigns yet. Brands will create campaigns and add your wallet address.
      </p>
      <div className="inline-flex items-center space-x-2 text-blue-400 text-sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Share your wallet address with brands to receive campaigns</span>
      </div>
    </div>
  </div>
);

// Earnings Tab
const EarningsTab: React.FC = () => (
  <div className="max-w-4xl space-y-6">
    {/* Summary Card */}
    <div className="card p-8">
      <h3 className="text-xl font-bold text-white mb-6">Earnings Summary</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Earned</div>
          <div className="text-3xl font-bold text-green-400">0 QUBIC</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">This Month</div>
          <div className="text-3xl font-bold text-white">0 QUBIC</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-400">0 QUBIC</div>
        </div>
      </div>
    </div>

    {/* Benefits Card */}
    <div className="card p-8">
      <h3 className="text-xl font-bold text-white mb-4">Why Qubic Smart Escrow?</h3>
      <div className="space-y-3 text-gray-300">
        <BenefitItem icon="⚡" title="Instant Payments" description="Get paid immediately when verification passes" />
        <BenefitItem icon="💰" title="Zero Fees" description="Keep 100% of your earnings with Qubic's zero-fee blockchain" />
        <BenefitItem icon="🛡️" title="Protected" description="Smart contract ensures brands can't withhold payment" />
        <BenefitItem icon="✅" title="Fair Verification" description="AI scoring system (95% threshold) prevents disputes" />
      </div>
    </div>
  </div>
);

const BenefitItem: React.FC<{ icon: string; title: string; description: string }> = 
  ({ icon, title, description }) => (
  <div className="flex items-start space-x-3">
    <span className="text-2xl">{icon}</span>
    <div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </div>
);

export default InfluencerDashboard;