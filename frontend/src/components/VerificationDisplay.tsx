/**
 * Verification Display Component (Real Backend Integration)
 * Shows AI verification results and submits to Oracle/Blockchain
 */
import React, { useState } from 'react';
import ApiService, { VerificationResult, OracleSubmitResult } from '../services/apiService';
import { getScoreColor, getScoreBgColor } from '../utils/helpers';

const VerificationDisplay: React.FC = () => {
  const [postUrl, setPostUrl] = useState('');
  const [scenario, setScenario] = useState('legitimate');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [oracleResult, setOracleResult] = useState<OracleSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);
    setOracleResult(null);

    try {
      const result = await ApiService.verifyPost(postUrl, scenario);
      setVerificationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setIsSubmitting(true);
    setError(null);
    setVerificationResult(null);
    setOracleResult(null);

    try {
      // Combined workflow: AI verification + Oracle submission + Blockchain broadcast
      const { verification, oracle } = await ApiService.verifyAndSubmit(postUrl, scenario);
      setVerificationResult(verification);
      setOracleResult(oracle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification and submission failed');
    } finally {
      setIsVerifying(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Verification Form */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">AI Post Verification</h2>
        
        <form onSubmit={handleVerifyAndSubmit} className="space-y-6">
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
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleVerifyOnly}
              disabled={isVerifying}
              className="btn-secondary flex-1 py-4"
            >
              {isVerifying && !isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="spinner w-5 h-5" />
                  <span>Analyzing...</span>
                </div>
              ) : (
                'AI Verify Only'
              )}
            </button>

            <button
              type="submit"
              disabled={isVerifying}
              className="btn-primary flex-1 py-4"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="spinner w-5 h-5" />
                  <span>
                    {isSubmitting ? 'Broadcasting to Blockchain...' : 'Analyzing...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Verify & Submit to Blockchain</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Verification Results */}
      {verificationResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Overall Score */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Verification Result</h3>
              <span className={`badge ${verificationResult.passed ? 'badge-success' : 'badge-error'}`}>
                {verificationResult.passed ? '✓ PASSED' : '✗ FAILED'}
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
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - verificationResult.overall_score / 100)}`}
                    className={getScoreColor(verificationResult.overall_score)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor(verificationResult.overall_score)}`}>
                    {verificationResult.overall_score}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-xl font-bold text-white mb-2">
                  Overall Authenticity Score
                </h4>
                <p className="text-gray-400 mb-4">{verificationResult.summary}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Pass Threshold:</span>
                    <span className="text-white font-semibold">95/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Confidence:</span>
                    <span className={`font-semibold ${
                      verificationResult.confidence === 'HIGH' ? 'text-green-400' :
                      verificationResult.confidence === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {verificationResult.confidence}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Recommendation:</span>
                    <span className={`font-semibold ${
                      verificationResult.recommendation.includes('APPROVED') ? 'text-green-400' :
                      verificationResult.recommendation.includes('REVIEW') ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {verificationResult.recommendation.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fraud Flags */}
            {verificationResult.fraud_flags.length > 0 && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <h5 className="font-semibold text-red-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Fraud Flags Detected ({verificationResult.fraud_flags.length})
                </h5>
                <ul className="space-y-1 text-sm text-red-300">
                  {verificationResult.fraud_flags.map((flag, i) => (
                    <li key={i}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Oracle/Blockchain Result */}
          {oracleResult && (
            <div className={`card p-6 ${
              oracleResult.success 
                ? 'bg-green-900/10 border-green-500/30' 
                : 'bg-red-900/10 border-red-500/30'
            }`}>
              <div className="flex items-start space-x-3">
                {oracleResult.success ? (
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-2 ${
                    oracleResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {oracleResult.success ? '✓ Submitted to Blockchain' : '✗ Blockchain Submission Failed'}
                  </h4>
                  {oracleResult.success && oracleResult.transactionId && (
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>
                        <span className="text-gray-400">Transaction ID:</span>{' '}
                        <span className="font-mono">{oracleResult.transactionId.slice(0, 20)}...</span>
                      </p>
                      {oracleResult.targetTick && (
                        <p>
                          <span className="text-gray-400">Target Tick:</span>{' '}
                          <span className="font-semibold">{oracleResult.targetTick}</span>
                        </p>
                      )}
                      <p>
                        <span className="text-gray-400">Score Recorded:</span>{' '}
                        <span className="font-semibold">{oracleResult.score}/100</span>
                      </p>
                      {oracleResult.transaction?.confirmed && (
                        <p className="text-green-400 font-semibold mt-2">
                          ✓ Transaction confirmed on blockchain
                        </p>
                      )}
                    </div>
                  )}
                  {!oracleResult.success && (
                    <p className="text-sm text-red-300">{oracleResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="card p-8">
            <h3 className="text-xl font-bold text-white mb-6">Detailed Score Breakdown</h3>
            <div className="space-y-6">
              <ScoreBar
                label="Follower Authenticity"
                score={verificationResult.breakdown.follower_authenticity.score}
                weight={verificationResult.breakdown.follower_authenticity.weight}
                contribution={verificationResult.breakdown.follower_authenticity.weighted_contribution}
              />
              <ScoreBar
                label="Engagement Quality"
                score={verificationResult.breakdown.engagement_quality.score}
                weight={verificationResult.breakdown.engagement_quality.weight}
                contribution={verificationResult.breakdown.engagement_quality.weighted_contribution}
              />
              <ScoreBar
                label="Velocity Check"
                score={verificationResult.breakdown.velocity_check.score}
                weight={verificationResult.breakdown.velocity_check.weight}
                contribution={verificationResult.breakdown.velocity_check.weighted_contribution}
              />
              <ScoreBar
                label="Geographic Alignment"
                score={verificationResult.breakdown.geo_alignment.score}
                weight={verificationResult.breakdown.geo_alignment.weight}
                contribution={verificationResult.breakdown.geo_alignment.weighted_contribution}
              />
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