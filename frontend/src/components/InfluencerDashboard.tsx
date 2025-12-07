/**
 * Influencer Dashboard Component - With Demo Data
 */
import React, { useState, useEffect } from 'react';
import { QubicWallet } from '../services/qubicService';
import VerificationDisplay from './VerificationDisplay';
import TransactionHistory from './TransactionHistory';
import { formatQubic, formatAddress } from '../utils/helpers';
import DemoDataService, { DemoCampaign } from '../services/demoDataService';

interface InfluencerDashboardProps {
  wallet: QubicWallet;
  onBack: () => void;
}

type TabType = 'overview' | 'campaigns' | 'verify' | 'earnings' | 'history';

const InfluencerDashboard: React.FC<InfluencerDashboardProps> = ({ wallet, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [campaigns, setCampaigns] = useState<DemoCampaign[]>([]);

  useEffect(() => {
    // Load demo campaigns for this influencer (Mike Chen - inf2)
    const influencerCampaigns = DemoDataService.getInfluencerCampaigns('inf2');
    setCampaigns(influencerCampaigns);
  }, []);

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'pending').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const totalEarnings = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0);
  const avgScore = campaigns.filter(c => c.verificationScore).reduce((sum, c) => sum + (c.verificationScore || 0), 0) / 
                   Math.max(campaigns.filter(c => c.verificationScore).length, 1);

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
            <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center text-4xl">
              👨‍💻
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mike Chen (@miketech)</h1>
              <p className="text-gray-400">Tech Reviewer | 180K followers</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Total Earnings</div>
          <div className="text-2xl font-bold text-white">{formatQubic(totalEarnings)}</div>
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
          value={activeCampaigns.toString()}
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
          value={completedCampaigns.toString()}
          subtitle="Verified & paid"
          color="green"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="This Month"
          value={formatQubic(totalEarnings)}
          subtitle="Total earned"
          color="purple"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          title="Avg Score"
          value={`${Math.round(avgScore)}/100`}
          subtitle="Quality rating"
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-8">
        <div className="flex space-x-8">
          <Tab
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
            label="Overview"
          />
          
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
            label="Submit Post"
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
        {activeTab === 'overview' && <OverviewTab campaigns={campaigns} />}
        {activeTab === 'campaigns' && <CampaignsTab campaigns={campaigns} />}
        {activeTab === 'verify' && <VerificationDisplay />}
        {activeTab === 'earnings' && <EarningsTab campaigns={campaigns} />}
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
  color: 'blue' | 'green' | 'purple' | 'yellow';
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

// Overview Tab
const OverviewTab: React.FC<{ campaigns: DemoCampaign[] }> = ({ campaigns }) => {
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Active Campaigns */}
      {activeCampaigns.length > 0 ? (
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">Active Campaigns</h3>
          <div className="space-y-3">
            {activeCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🎯
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Campaigns</h3>
          <p className="text-gray-400">
            You don't have any active campaigns right now. Check back soon for new opportunities!
          </p>
        </div>
      )}

      {/* Benefits */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">💎 Why Qubic Smart Escrow?</h3>
          <div className="space-y-3 text-gray-300">
            <BenefitItem icon="⚡" title="Instant Payments" description="Get paid immediately when verification passes (score ≥95)" />
            <BenefitItem icon="💰" title="Zero Fees" description="Keep 100% of your earnings - no gas fees on Qubic" />
            <BenefitItem icon="🛡️" title="Protected" description="Smart contract ensures brands can't withhold payment" />
            <BenefitItem icon="✅" title="Fair AI Scoring" description="Objective fraud detection prevents disputes" />
          </div>
        </div>

        <div className="card p-6 bg-purple-900/10 border-purple-500/30">
          <h3 className="text-xl font-bold text-purple-400 mb-4">💡 Demo Mode</h3>
          <p className="text-gray-300 mb-4">
            Viewing demo campaigns for @miketech (Mike Chen):
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• {campaigns.length} total campaigns</li>
            <li>• {campaigns.filter(c => c.status === 'completed').length} successfully completed</li>
            <li>• {campaigns.filter(c => c.verificationScore && c.verificationScore >= 95).length} passed AI verification</li>
            <li>• All payments processed automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Campaigns Tab
const CampaignsTab: React.FC<{ campaigns: DemoCampaign[] }> = ({ campaigns }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-white">All My Campaigns ({campaigns.length})</h2>
    {campaigns.map(campaign => (
      <CampaignCard key={campaign.id} campaign={campaign} detailed />
    ))}
  </div>
);

// Campaign Card
const CampaignCard: React.FC<{ campaign: DemoCampaign; detailed?: boolean }> = ({ campaign, detailed }) => {
  const statusColors = {
    active: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    rejected: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-bold text-white">{campaign.description}</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[campaign.status]}`}>
              {campaign.status.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-400">by {campaign.brandName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{formatQubic(campaign.amount)}</div>
          {campaign.verificationScore !== undefined && (
            <div className={`text-sm font-semibold ${
              campaign.verificationScore >= 95 ? 'text-green-400' : 'text-red-400'
            }`}>
              Score: {campaign.verificationScore}/100
            </div>
          )}
        </div>
      </div>

      {detailed && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="text-gray-300">{campaign.description}</div>
          <div className="flex items-center space-x-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <a href={campaign.postUrl} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">
              View Post
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Earnings Tab
const EarningsTab: React.FC<{ campaigns: DemoCampaign[] }> = ({ campaigns }) => {
  const totalEarned = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0);
  const thisMonth = totalEarned; // Demo: assume all in this month
  const pending = campaigns.filter(c => c.status === 'active' || c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="card p-8">
        <h3 className="text-xl font-bold text-white mb-6">Earnings Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Earned</div>
            <div className="text-3xl font-bold text-green-400">{formatQubic(totalEarned)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">This Month</div>
            <div className="text-3xl font-bold text-white">{formatQubic(thisMonth)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-400">{formatQubic(pending)}</div>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h3 className="text-xl font-bold text-white mb-4">Recent Payouts</h3>
        <div className="space-y-3">
          {campaigns.filter(c => c.status === 'completed').map(campaign => (
            <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <div className="font-semibold text-white">{campaign.brandName}</div>
                <div className="text-sm text-gray-400">{campaign.verifiedAt?.toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-400">{formatQubic(campaign.amount)}</div>
                <div className="text-xs text-gray-500">Fee: 0 QUBIC</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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