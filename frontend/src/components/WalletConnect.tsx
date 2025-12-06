/**
 * Wallet Connect Component
 * Landing page with wallet connection
 * 
 * Location: frontend/src/components/WalletConnect.tsx
 */
import React from 'react';

interface WalletConnectProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, isConnecting, error }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-block mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto glow-blue">
            <span className="text-white font-bold text-4xl">Q</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 gradient-text">
          Qubic Smart Escrow
        </h1>
        
        <p className="text-xl text-gray-300 mb-2">
          AI-Powered Influencer Marketing Platform
        </p>
        
        <p className="text-gray-500">
          Fraud-proof campaigns • Instant payments • Zero fees
        </p>
      </div>

      {/* Main Connection Card */}
      <div className="card max-w-md mx-auto text-center p-8 mb-12 animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">
          Connect your Qubic wallet to get started with creating campaigns or receiving payments
        </p>

        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="spinner w-5 h-5" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Connect Qubic Wallet</span>
            </div>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Demo mode: Auto-generates a test wallet for demonstration
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          title="AI Fraud Detection"
          description="4 advanced algorithms detect fake followers and bot engagement with 95%+ accuracy"
        />
        
        <FeatureCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="Instant Settlements"
          description="Automatic payment release when verification passes. No delays, no disputes"
        />
        
        <FeatureCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Zero Fees"
          description="Qubic blockchain means zero transaction fees. Keep 100% of your earnings"
        />
      </div>

      {/* How It Works */}
      <div className="card p-8">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h3>
        
        <div className="space-y-6">
          <Step
            number={1}
            title="Brand Creates Campaign"
            description="Brand deposits funds into smart contract escrow with campaign requirements"
          />
          
          <Step
            number={2}
            title="Influencer Delivers"
            description="Influencer creates content and submits post URL for verification"
          />
          
          <Step
            number={3}
            title="AI Verifies Quality"
            description="Our AI analyzes followers, engagement, velocity, and location for fraud"
          />
          
          <Step
            number={4}
            title="Instant Payment"
            description="If score ≥95%, smart contract releases payment instantly. If fraud detected, brand gets refund"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
        <StatCard value="0%" label="Transaction Fees" />
        <StatCard value="<10s" label="Verification Time" />
        <StatCard value="95%" label="Fraud Detection" />
        <StatCard value="$1.3B" label="Fraud Prevented" />
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = 
  ({ icon, title, description }) => (
  <div className="card text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-xl mb-4 text-blue-400">
      {icon}
    </div>
    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

// Step Component
const Step: React.FC<{ number: number; title: string; description: string }> = 
  ({ number, title, description }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
      {number}
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </div>
);

// Stat Card Component
const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="card text-center p-4">
    <div className="text-3xl font-bold text-blue-400 mb-1">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

export default WalletConnect;