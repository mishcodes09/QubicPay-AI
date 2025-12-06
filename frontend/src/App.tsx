/**
 * Main Application Component
 */
import React, { useState, useEffect } from 'react';
import { useQubicWallet } from './hooks/useQubicWallet';
import WalletConnect from './components/WalletConnect';
import BrandDashboard from './components/BrandDashboard';
import InfluencerDashboard from './components/InfluencerDashboard';
import ApiService from './services/apiService';

type UserRole = 'brand' | 'influencer' | null;

const App: React.FC = () => {
  const { wallet, isConnected, isConnecting, error: walletError, connect, disconnect } = useQubicWallet();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [servicesOnline, setServicesOnline] = useState({ ai: false, oracle: false });

  // Check backend services health
  useEffect(() => {
    const checkServices = async () => {
      const [aiHealth, oracleHealth] = await Promise.all([
        ApiService.healthCheckAI(),
        ApiService.healthCheckOracle()
      ]);
      setServicesOnline({ ai: aiHealth, oracle: oracleHealth });
    };

    checkServices();
    const interval = setInterval(checkServices, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
  };

  const handleBackToRoleSelection = () => {
    setUserRole(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Qubic Smart Escrow</h1>
                <p className="text-xs text-gray-400">AI-Powered Influencer Marketing</p>
              </div>
            </div>

            {/* Service Status */}
            <div className="hidden md:flex items-center space-x-4">
              <ServiceStatus label="AI Service" online={servicesOnline.ai} />
              <ServiceStatus label="Oracle" online={servicesOnline.oracle} />
              <div className="h-6 w-px bg-gray-700" />
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Zero Fees</span>
              </div>
            </div>

            {/* Wallet */}
            <div>
              {isConnected && wallet ? (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>{wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="btn-primary"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <WalletConnect
            onConnect={async () => {
              await connect();
            }}
            isConnecting={isConnecting}
            error={walletError}
          />
        ) : !userRole ? (
          <RoleSelection onSelectRole={handleSelectRole} />
        ) : userRole === 'brand' ? (
          <BrandDashboard
            wallet={wallet!}
            onBack={handleBackToRoleSelection}
          />
        ) : (
          <InfluencerDashboard
            wallet={wallet!}
            onBack={handleBackToRoleSelection}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800/30 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-400">
            <div>
              <h3 className="font-bold text-white mb-2">About</h3>
              <p>AI-powered fraud detection for influencer marketing with instant, zero-fee payments on Qubic blockchain.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Features</h3>
              <ul className="space-y-1">
                <li>✓ Zero transaction fees</li>
                <li>✓ AI fraud detection (95% accuracy)</li>
                <li>✓ Instant settlements</li>
                <li>✓ Smart contract escrow</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Resources</h3>
              <ul className="space-y-1">
                <li><a href="https://docs.qubic.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Documentation</a></li>
                <li><a href="https://github.com/qubic-lib" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">GitHub</a></li>
                <li><a href="https://discord.gg/qubic" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-500 text-xs">
            <p>Built for Qubic Hackathon | Powered by Qubic Blockchain</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Service Status Indicator
const ServiceStatus: React.FC<{ label: string; online: boolean }> = ({ label, online }) => (
  <div className="flex items-center space-x-2 text-sm">
    <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
    <span className={online ? 'text-green-400' : 'text-red-400'}>{label}</span>
  </div>
);

// Role Selection Screen
const RoleSelection: React.FC<{ onSelectRole: (role: UserRole) => void }> = ({ onSelectRole }) => (
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-12 animate-fade-in">
      <h2 className="text-4xl font-bold text-white mb-4">Choose Your Role</h2>
      <p className="text-gray-400 text-lg">Select how you want to use the platform</p>
    </div>

    <div className="grid md:grid-cols-2 gap-8">
      {/* Brand Card */}
      <button
        onClick={() => onSelectRole('brand')}
        className="card-hover text-left p-8 group cursor-pointer"
      >
        <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">I'm a Brand</h3>
        <p className="text-gray-400 mb-4">
          Create campaigns, deposit funds, and work with verified influencers with zero risk of fraud.
        </p>
        <ul className="space-y-2 text-sm text-gray-500">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            AI-verified results
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Automatic refunds on fraud
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Only 3% platform fee
          </li>
        </ul>
        <div className="mt-6 text-blue-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center">
          Get Started
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Influencer Card */}
      <button
        onClick={() => onSelectRole('influencer')}
        className="card-hover text-left p-8 group cursor-pointer"
      >
        <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">I'm an Influencer</h3>
        <p className="text-gray-400 mb-4">
          Receive instant payments for verified campaigns. Get paid fairly, instantly, with zero fees.
        </p>
        <ul className="space-y-2 text-sm text-gray-500">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Instant settlements
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Zero transaction fees
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            100% earnings kept
          </li>
        </ul>
        <div className="mt-6 text-purple-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center">
          Get Started
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  </div>
);

export default App;