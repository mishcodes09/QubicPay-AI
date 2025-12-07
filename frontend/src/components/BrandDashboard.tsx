/**
 * Brand Dashboard Component - With Demo Data (Fixed)
 */
import React, { useState, useEffect } from 'react';
import { QubicWallet } from '../services/qubicService';
import VerificationDisplay from './VerificationDisplay';
import TransactionHistory from './TransactionHistory';
import { formatQubic, formatAddress } from '../utils/helpers';
import DemoDataService, { DemoCampaign } from '../services/demoDataService';

interface BrandDashboardProps {
  wallet: QubicWallet;
  onBack: () => void;
}

type TabType = 'overview' | 'create' | 'campaigns' | 'verify' | 'history';

const BrandDashboard: React.FC<BrandDashboardProps> = ({ wallet, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [campaigns, setCampaigns] = useState<DemoCampaign[]>([]);

  useEffect(() => {
    // Load demo data
    const allCampaigns = DemoDataService.getCampaigns();
    setCampaigns(allCampaigns);
  }, []);

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const fraudDetected = campaigns.filter(c => c.verificationScore !== undefined && c.verificationScore < 95).length;
  const totalSpent = campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0);

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
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center text-4xl">
              📱
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">TechVista Dashboard</h1>
              <p className="text-gray-400">Manage influencer campaigns</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Campaign Budget</div>
          <div className="text-2xl font-bold text-white">{formatQubic(5000000)}</div>
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
          value={activeCampaigns.toString()}
          subtitle="Running now"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          title="Fraud Detected"
          value={fraudDetected.toString()}
          subtitle="Refunded"
          color="red"
        />
        
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Total Spent"
          value={formatQubic(totalSpent)}
          subtitle="This month"
          color="purple"
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
            label="All Campaigns"
          />
          
          <Tab
            active={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            label="Create New"
          />
          
          <Tab
            active={activeTab === 'verify'}
            onClick={() => setActiveTab('verify')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Verify Posts"
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
        {activeTab === 'campaigns' && <CampaignsListTab campaigns={campaigns} />}
        {activeTab === 'create' && <CreateCampaignTab wallet={wallet} />}
        {activeTab === 'verify' && <VerificationDisplay />}
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

// Overview Tab
const OverviewTab: React.FC<{ campaigns: DemoCampaign[] }> = ({ campaigns }) => {
  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Recent Campaigns */}
      <div className="card p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Campaigns</h3>
        <div className="space-y-3">
          {recentCampaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} compact />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">✨ Why Choose Qubic Smart Escrow?</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start space-x-3">
              <span className="text-green-400">✓</span>
              <span><strong>AI Fraud Detection:</strong> 95% accuracy catches fake followers</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-400">✓</span>
              <span><strong>Zero Fees:</strong> Qubic blockchain means no transaction costs</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-400">✓</span>
              <span><strong>Instant Settlements:</strong> Automatic payment on verification</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-400">✓</span>
              <span><strong>Protected Budget:</strong> Automatic refund if fraud detected</span>
            </li>
          </ul>
        </div>

        <div className="card p-6 bg-blue-900/10 border-blue-500/30">
          <h3 className="text-xl font-bold text-blue-400 mb-4">💡 Demo Mode Active</h3>
          <p className="text-gray-300 mb-4">
            This is a demonstration with pre-loaded campaigns showing:
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Successful verified campaigns (Score ≥95)</li>
            <li>• Fraud detection examples (Score {'<'}95)</li>
            <li>• Real-time blockchain integration</li>
            <li>• Complete payment workflow</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Campaigns List Tab
const CampaignsListTab: React.FC<{ campaigns: DemoCampaign[] }> = ({ campaigns }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  const filteredCampaigns = filter === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">All Campaigns ({filteredCampaigns.length})</h2>
        <div className="flex space-x-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterButton active={filter === 'active'} onClick={() => setFilter('active')} label="Active" />
          <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')} label="Completed" />
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label="Pending" />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCampaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
};

// Campaign Card Component
const CampaignCard: React.FC<{ campaign: DemoCampaign; compact?: boolean }> = ({ campaign, compact }) => {
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
          <p className="text-sm text-gray-400">with @{campaign.influencerName}</p>
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

      {!compact && (
        <>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-400">Created:</span>
              <span className="ml-2 text-white">{campaign.createdAt.toLocaleDateString()}</span>
            </div>
            {campaign.verifiedAt && (
              <div>
                <span className="text-gray-400">Verified:</span>
                <span className="ml-2 text-white">{campaign.verifiedAt.toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <a href={campaign.postUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              {campaign.postUrl.slice(0, 50)}...
            </a>
          </div>
        </>
      )}
    </div>
  );
};

// Filter Button
const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {label}
  </button>
);

// Create Campaign Tab
const CreateCampaignTab: React.FC<{ wallet: QubicWallet }> = () => {
  const [formData, setFormData] = useState({
    influencer: '',
    amount: '',
    description: '',
    requirements: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const influencers = DemoDataService.getInfluencers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setFormData({ influencer: '', amount: '', description: '', requirements: '' });
    setIsCreating(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Campaign</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Influencer
            </label>
            <select
              value={formData.influencer}
              onChange={(e) => setFormData({ ...formData, influencer: e.target.value })}
              className="input"
              required
            >
              <option value="">Choose an influencer...</option>
              {influencers.map(inf => (
                <option key={inf.id} value={inf.id}>
                  {inf.profileImage} {inf.name} (@{inf.username}) - {inf.followers.toLocaleString()} followers
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Campaign Budget (QUBIC)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              placeholder="50000"
              required
              min="1000"
            />
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
              placeholder="Describe your campaign goals..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Requirements (one per line)
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="input"
              rows={3}
              placeholder="- Minimum 3 photos&#10;- Tag our brand&#10;- Use #YourHashtag"
              required
            />
          </div>

          {success && (
            <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg text-green-400 text-sm">
              ✓ Campaign created successfully! Smart contract deployed to Qubic blockchain.
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