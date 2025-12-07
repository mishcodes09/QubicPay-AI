/**
 * API Service - Real Backend Integration
 * Connects frontend to AI Verification Service and Oracle Agent
 */

const CONFIG = {
  AI_SERVICE_URL: process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:5000',
  ORACLE_URL: process.env.REACT_APP_ORACLE_URL || 'http://localhost:8080',
  TIMEOUT: 100000
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
  transactionId?: string;
  targetTick?: number;
  score?: number;
  recommendation?: string;
  confidence?: string;
  aiResult?: any;
  transaction?: any;
  error?: string;
}

class ApiService {
  /**
   * Verify a social media post using AI Service
   */
  static async verifyPost(postUrl: string, scenario: string): Promise<VerificationResult> {
    try {
      console.log('[API Service] Requesting AI verification...');
      
      const response = await fetch(`${CONFIG.AI_SERVICE_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_url: postUrl,  // Python expects snake_case
          scenario: scenario
        }),
        signal: AbortSignal.timeout(CONFIG.TIMEOUT)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[API Service] AI Verification complete:', data.overall_score);
      return data;
      
    } catch (error) {
      console.error('[API Service] AI Verification failed:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to connect to AI Service. Please ensure the backend is running.'
      );
    }
  }

  /**
   * Submit verification result to Oracle Agent and broadcast to blockchain
   */
  static async submitToOracle(postUrl: string, scenario: string): Promise<OracleSubmitResult> {
    try {
      console.log('[API Service] Submitting to Oracle Agent...');
      
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Oracle HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[API Service] Oracle submission successful:', data.transactionId);
      return data;
      
    } catch (error) {
      console.error('[API Service] Oracle submission failed:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to connect to Oracle Agent. Please ensure the backend is running.'
      );
    }
  }

  /**
   * Combined workflow: AI verification + Oracle submission
   */
  static async verifyAndSubmit(postUrl: string, scenario: string): Promise<{
    verification: VerificationResult;
    oracle: OracleSubmitResult;
  }> {
    console.log('[API Service] Starting complete verification workflow...');
    
    // Step 1: Get AI verification
    const verification = await this.verifyPost(postUrl, scenario);
    
    // Step 2: Submit to Oracle and broadcast to blockchain
    const oracle = await this.submitToOracle(postUrl, scenario);
    
    return { verification, oracle };
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
   * Get Oracle state
   */
  static async getOracleState(): Promise<any> {
    try {
      const response = await fetch(`${CONFIG.ORACLE_URL}/state`);
      return await response.json();
    } catch (error) {
      console.error('[API Service] Failed to get oracle state:', error);
      return null;
    }
  }

  /**
   * Get network information
   */
  static async getNetworkInfo(): Promise<any> {
    try {
      const response = await fetch(`${CONFIG.ORACLE_URL}/network`);
      return await response.json();
    } catch (error) {
      console.error('[API Service] Failed to get network info:', error);
      return null;
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
   * Get balance for an address
   */
  static async getBalance(address: string): Promise<number> {
    try {
      const response = await fetch(`${CONFIG.ORACLE_URL}/balance/${address}`);
      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('[API Service] Failed to get balance:', error);
      return 0;
    }
  }

  /**
   * Check if services are available
   */
  static async checkServicesAvailable(): Promise<{
    ai: boolean;
    oracle: boolean;
    bothOnline: boolean;
  }> {
    const [ai, oracle] = await Promise.all([
      this.healthCheckAI(),
      this.healthCheckOracle()
    ]);

    return {
      ai,
      oracle,
      bothOnline: ai && oracle
    };
  }
}

export default ApiService;