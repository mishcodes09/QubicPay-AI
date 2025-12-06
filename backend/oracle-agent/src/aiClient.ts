/**
 * AI Service Client (FIXED)
 * Handles communication with Python AI Verification Service
 */
import axios from 'axios';
import { Config } from './config';
import { VerificationRequest, VerificationResult } from './types';

export class AIClient {
  private client: any;

  constructor() {
    this.client = axios.create({
      baseURL: Config.AI_SERVICE.baseUrl,
      timeout: Config.AI_SERVICE.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Request verification from AI service
   * FIX: Convert camelCase to snake_case for Python API
   */
  async verifyPost(request: VerificationRequest): Promise<VerificationResult> {
    try {
      console.log(`[AI Client] Requesting verification for: ${request.postUrl}`);
      
      // FIXED: Convert to Python snake_case format
      const pythonRequest = {
        post_url: request.postUrl,    // Convert postUrl -> post_url
        scenario: request.scenario
      };
      
      const response = await this.client.post('/verify', pythonRequest);
      
      console.log(`[AI Client] Verification complete: Score ${response.data.overall_score}/100`);
      
      return response.data as VerificationResult;
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Unknown error';
      throw new Error(`AI Service error: ${message}`);
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('[AI Client] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get available test scenarios
   */
  async getScenarios(): Promise<any> {
    try {
      const response = await this.client.get('/scenarios');
      return response.data;
    } catch (error) {
      console.error('[AI Client] Failed to get scenarios:', error);
      return null;
    }
  }

  /**
   * Get current verification thresholds
   */
  async getThresholds(): Promise<any> {
    try {
      const response = await this.client.get('/thresholds');
      return response.data;
    } catch (error) {
      console.error('[AI Client] Failed to get thresholds:', error);
      return null;
    }
  }

  /**
   * Test AI service with a sample request
   */
  async testConnection(): Promise<void> {
    console.log('[AI Client] Testing connection to AI service...');
    
    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      throw new Error('AI Service health check failed');
    }

    console.log('[AI Client] ✓ AI Service is healthy');

    // Test with legitimate scenario
    const testRequest: VerificationRequest = {
      postUrl: 'https://instagram.com/p/test123',
      scenario: 'legitimate'
    };

    const result = await this.verifyPost(testRequest);
    console.log(`[AI Client] ✓ Test verification successful: ${result.overall_score}/100`);
  }
}