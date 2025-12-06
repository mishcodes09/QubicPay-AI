/**
 * Verification Display Component
 * Shows AI verification results and fraud detection
 */
import React, { useState } from 'react';
import ApiService, { VerificationResult } from '../services/apiService';
import { getScoreColor, getScoreBgColor } from '../utils/helpers';

const VerificationDisplay: React.FC = () => {
  const [postUrl, setPostUrl] = useState('');
  const [scenario, setScenario] = useState('legitimate');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const verificationResult = await ApiService.verifyPost(postUrl, scenario);
      setResult(verificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Verification Form */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">AI Post Verification</h2>
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Social Media Post URL
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="input"
              placeholder="https://instagram.com/p/..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the full URL of the Instagram, Twitter, or TikTok post
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Test Scenario (Demo Mode)
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="input"
            >
              <option value="legitimate">✅ Legitimate Campaign (Score: 95-100)</option>
              <option value="bot_fraud">❌ Bot Fraud (Score: 30-50)</option>
              <option value="mixed_quality">⚠️ Mixed Quality (Score: 70-85)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a test scenario to simulate different verification outcomes
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="btn-primary w-full py-4"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="spinner w-5 h-5" />
                <span>Analyzing with AI...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Verify Post with AI</span>
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Verification Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Overall Score */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Verification Result</h3>
              <span className={`badge ${result.passed ? 'badge-success' : 'badge-error'}`}>
                {result.passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
            </div>

            <div className="flex items-center space-x-8 mb-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - result.overall_score / 100)}`}
                    className={getScoreColor(result.overall_score)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor(result.overall_score)}`}>
                    {result.overall_score}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-xl font-bold text-white mb-2">
                  Overall Authenticity Score
                </h4>
                <p className="text-gray-400 mb-4">{result.summary}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Pass Threshold:</span>
                    <span className="text-white font-semibold">95/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Confidence:</span>
                    <span className={`font-semibold ${
                      result.confidence === 'HIGH' ? 'text-green-400' :
                      result.confidence === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {result.confidence}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Recommendation:</span>
                    <span className={`font-semibold ${
                      result.recommendation.includes('APPROVED') ? 'text-green-400' :
                      result.recommendation.includes('REVIEW') ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {result.recommendation.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fraud Flags */}
            {result.fraud_flags.length > 0 && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <h5 className="font-semibold text-red-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Fraud Flags Detected ({result.fraud_flags.length})
                </h5>
                <ul className="space-y-1 text-sm text-red-300">
                  {result.fraud_flags.map((flag, i) => (
                    <li key={i}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="card p-8">
            <h3 className="text-xl font-bold text-white mb-6">Detailed Score Breakdown</h3>
            <div className="space-y-6">
              <ScoreBar
                label="Follower Authenticity"
                score={result.breakdown.follower_authenticity.score}
                weight={result.breakdown.follower_authenticity.weight}
                contribution={result.breakdown.follower_authenticity.weighted_contribution}
              />
              <ScoreBar
                label="Engagement Quality"
                score={result.breakdown.engagement_quality.score}
                weight={result.breakdown.engagement_quality.weight}
                contribution={result.breakdown.engagement_quality.weighted_contribution}
              />
              <ScoreBar
                label="Velocity Check"
                score={result.breakdown.velocity_check.score}
                weight={result.breakdown.velocity_check.weight}
                contribution={result.breakdown.velocity_check.weighted_contribution}
              />
              <ScoreBar
                label="Geographic Alignment"
                score={result.breakdown.geo_alignment.score}
                weight={result.breakdown.geo_alignment.weight}
                contribution={result.breakdown.geo_alignment.weighted_contribution}
              />
            </div>
          </div>

          {/* AI Analysis Info */}
          <div className="card p-6 bg-blue-900/10 border-blue-500/30">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">AI Verification Process</h4>
                <p className="text-sm text-gray-400">
                  Our AI analyzed follower profiles, engagement patterns, velocity anomalies, and geographic distribution. 
                  This verification is recorded on the Qubic blockchain and used by the smart contract for automatic payment decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Score Bar Component
const ScoreBar: React.FC<{
  label: string;
  score: number;
  weight: number;
  contribution: number;
}> = ({ label, score, weight, contribution }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <div className="flex items-center space-x-4 text-sm">
        <span className="text-gray-500">Weight: {(weight * 100).toFixed(0)}%</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>{score}/100</span>
      </div>
    </div>
    <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 ${getScoreBgColor(score)} transition-all duration-500`}
        style={{ width: `${score}%` }}
      />
    </div>
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>Contribution: +{contribution.toFixed(2)} points</span>
    </div>
  </div>
);

export default VerificationDisplay;