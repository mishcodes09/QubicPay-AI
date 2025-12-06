/**
 * API Service - Backend Integration
 * Connects frontend to AI Verification Service and Oracle Agent
 */

const CONFIG = {
  AI_SERVICE_URL: process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:5000',
  ORACLE_URL: process.env.REACT_APP_ORACLE_URL || 'http://localhost:8080',
  TIMEOUT: 30000
};

export interface VerificationResult {
  overall_score: number;
  passed: boolean;
  recommendation: string;
  confidence: string;
  breakdown: {
    follower_authenticity: ScoreDetail;
    engagement_quality: ScoreDetail;
    velocity_check: ScoreDetail;
    geo_alignment: ScoreDetail;
  };
  fraud_flags: string[];
  summary: string;
}

export interface ScoreDetail {
  score: number;
  weight: number;
  weighted_contribution: number;
  details?: any;
}

export interface OracleSubmitResult {
  success: boolean;
  txId?: string;
  score?: number;
  error?: string;
}

class ApiService {
  /**
   * Verify a social media post using AI Service
   */
  static async verifyPost(postUrl: string, scenario: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${CONFIG.AI_SERVICE_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_url: postUrl,
          scenario: scenario
        }),
        signal: AbortSignal.timeout(CONFIG.TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[API Service] AI Verification complete:', data.overall_score);
      return data;
      
    } catch (error) {
      console.error('[API Service] AI Verification failed:', error);
      
      // Fallback to mock data if service is unavailable
      console.warn('[API Service] Using mock data as fallback');
      return this.getMockVerification(scenario);
    }
  }

  /**
   * Submit verification result to Oracle Agent
   */
  static async submitToOracle(postUrl: string, scenario: string): Promise<OracleSubmitResult> {
    try {
      const response = await fetch(`${CONFIG.ORACLE_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postUrl,
          scenario
        }),
        signal: AbortSignal.timeout(CONFIG.TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Oracle HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[API Service] Oracle submission successful');
      return data;
      
    } catch (error) {
      console.warn('[API Service] Oracle submission failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check for AI Service
   */
  static async healthCheckAI(): Promise<boolean> {
    try {
      const response = await fetch(`${CONFIG.AI_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Health check for Oracle Agent
   */
  static async healthCheckOracle(): Promise<boolean> {
    try {
      const response = await fetch(`${CONFIG.ORACLE_URL}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get verification thresholds from AI Service
   */
  static async getThresholds(): Promise<any> {
    try {
      const response = await fetch(`${CONFIG.AI_SERVICE_URL}/thresholds`);
      return await response.json();
    } catch (error) {
      console.error('[API Service] Failed to get thresholds:', error);
      return {
        thresholds: { overall_pass_score: 95 },
        weights: {
          follower_authenticity: 0.30,
          engagement_quality: 0.35,
          velocity_check: 0.20,
          geo_alignment: 0.15
        }
      };
    }
  }

  /**
   * Get available test scenarios
   */
  static async getScenarios(): Promise<any> {
    try {
      const response = await fetch(`${CONFIG.AI_SERVICE_URL}/scenarios`);
      return await response.json();
    } catch (error) {
      console.error('[API Service] Failed to get scenarios:', error);
      return {
        scenarios: [
          { name: 'legitimate', description: 'Legitimate campaign', expected_score: '95-100' },
          { name: 'bot_fraud', description: 'Bot fraud detected', expected_score: '30-50' },
          { name: 'mixed_quality', description: 'Mixed quality', expected_score: '70-85' }
        ]
      };
    }
  }

  /**
   * Mock verification data (fallback when services are offline)
   */
  private static getMockVerification(scenario: string): VerificationResult {
    const scenarios: Record<string, VerificationResult> = {
      legitimate: {
        overall_score: 96,
        passed: true,
        recommendation: 'APPROVED_FOR_PAYMENT',
        confidence: 'HIGH',
        breakdown: {
          follower_authenticity: {
            score: 98,
            weight: 0.30,
            weighted_contribution: 29.4
          },
          engagement_quality: {
            score: 95,
            weight: 0.35,
            weighted_contribution: 33.25
          },
          velocity_check: {
            score: 94,
            weight: 0.20,
            weighted_contribution: 18.8
          },
          geo_alignment: {
            score: 97,
            weight: 0.15,
            weighted_contribution: 14.55
          }
        },
        fraud_flags: [],
        summary: 'Excellent authenticity score. Campaign shows genuine followers with authentic interactions. All metrics within expected ranges.'
      },
      bot_fraud: {
        overall_score: 42,
        passed: false,
        recommendation: 'REJECT_PAYMENT_FRAUD_DETECTED',
        confidence: 'HIGH',
        breakdown: {
          follower_authenticity: {
            score: 35,
            weight: 0.30,
            weighted_contribution: 10.5
          },
          engagement_quality: {
            score: 45,
            weight: 0.35,
            weighted_contribution: 15.75
          },
          velocity_check: {
            score: 40,
            weight: 0.20,
            weighted_contribution: 8.0
          },
          geo_alignment: {
            score: 48,
            weight: 0.15,
            weighted_contribution: 7.2
          }
        },
        fraud_flags: [
          'FAKE_FOLLOWERS_DETECTED',
          'INAUTHENTIC_ENGAGEMENT',
          'SUSPICIOUS_ENGAGEMENT_SPIKE',
          'GEO_LOCATION_MISMATCH'
        ],
        summary: 'Low authenticity score. Strong indicators of fraud: bot followers, spam comments, and suspicious engagement patterns. Payment should be blocked and refunded to brand.'
      },
      mixed_quality: {
        overall_score: 78,
        passed: false,
        recommendation: 'MANUAL_REVIEW_RECOMMENDED',
        confidence: 'MEDIUM',
        breakdown: {
          follower_authenticity: {
            score: 75,
            weight: 0.30,
            weighted_contribution: 22.5
          },
          engagement_quality: {
            score: 80,
            weight: 0.35,
            weighted_contribution: 28.0
          },
          velocity_check: {
            score: 82,
            weight: 0.20,
            weighted_contribution: 16.4
          },
          geo_alignment: {
            score: 76,
            weight: 0.15,
            weighted_contribution: 11.4
          }
        },
        fraud_flags: ['SUSPICIOUS_ENGAGEMENT_SPIKE'],
        summary: 'Good authenticity score but below 95 threshold. Some quality concerns detected. Mix of real and potentially fake engagement. Manual review recommended before payment release.'
      }
    };

    return scenarios[scenario] || scenarios.legitimate;
  }
}

export default ApiService;