/**
 * TypeScript Type Definitions for Oracle Agent
 */

export interface QubicConfig {
  rpcEndpoint: string;
  contractId: string;
  oraclePrivateKey: string;
  oraclePublicKey: string;
  networkId: number;
}

export interface AIServiceConfig {
  baseUrl: string;
  timeout: number;
}

export interface VerificationRequest {
  postUrl: string;
  scenario?: 'legitimate' | 'bot_fraud' | 'mixed_quality';
}

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
  post_url: string;
  scenario: string;
  fetch_timestamp: string;
}

export interface ScoreDetail {
  score: number;
  weight: number;
  weighted_contribution: number;
  details: any;
}

export interface EscrowContract {
  contractId: string;
  brandId: string;
  influencerId: string;
  escrowBalance: number;
  requiredScore: number;
  verificationScore: number;
  retentionEndTick: number;
  isActive: boolean;
}

export interface Transaction {
  sourceId: string;
  destId: string;
  amount: number;
  tick: number;
  inputType: number;
  inputSize: number;
  payload?: Uint8Array;
}

export interface TransactionStatus {
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  tick?: number;
  error?: string;
}

export interface OracleState {
  lastProcessedTick: number;
  pendingVerifications: Map<string, VerificationRequest>;
  completedVerifications: Map<string, VerificationResult>;
}

export enum ContractProcedure {
  DEPOSIT_FUNDS = 0,
  SET_VERIFICATION_SCORE = 1,
  RELEASE_PAYMENT = 2,
  REFUND_FUNDS = 3,
  SET_ORACLE_ID = 4
}

export interface OracleLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}