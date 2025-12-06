/**
 * Utility Helper Functions
 */

/**
 * Format Qubic address for display
 */
export const formatAddress = (address: string, startChars: number = 10, endChars: number = 8): string => {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Format QUBIC amount
 */
export const formatQubic = (amount: number, decimals: number = 0): string => {
  return `${formatNumber(Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals))} QUBIC`;
};

/**
 * Format transaction hash
 */
export const formatTxHash = (hash: string, startChars: number = 10, endChars: number = 8): string => {
  if (!hash || hash.length < startChars + endChars) return hash;
  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
};

/**
 * Format timestamp
 */
export const formatTimestamp = (timestamp: number | Date): string => {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (timestamp: number | Date): string => {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

/**
 * Calculate platform fee
 */
export const calculateFee = (amount: number, feePercent: number = 3): number => {
  return Math.round(amount * (feePercent / 100));
};

/**
 * Calculate net amount after fee
 */
export const calculateNetAmount = (amount: number, feePercent: number = 3): number => {
  return amount - calculateFee(amount, feePercent);
};

/**
 * Get score color based on value
 */
export const getScoreColor = (score: number): string => {
  if (score >= 95) return 'text-green-400';
  if (score >= 80) return 'text-yellow-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Get score background color
 */
export const getScoreBgColor = (score: number): string => {
  if (score >= 95) return 'bg-green-500';
  if (score >= 80) return 'bg-yellow-500';
  if (score >= 60) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-500' },
    pending: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-500' },
    error: { bg: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-500' },
    warning: { bg: 'bg-orange-900/20', text: 'text-orange-400', border: 'border-orange-500' },
    info: { bg: 'bg-blue-900/20', text: 'text-blue-400', border: 'border-blue-500' }
  };

  return statusColors[status] || statusColors.info;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Validate Qubic address format
 */
export const isValidQubicAddress = (address: string): boolean => {
  // Qubic addresses are 60 characters, all uppercase letters
  const pattern = /^[A-Z]{60}$/;
  return pattern.test(address);
};

/**
 * Validate transaction hash format
 */
export const isValidTxHash = (hash: string): boolean => {
  // Transaction hashes are 0x followed by 64 hex characters
  const pattern = /^0x[a-fA-F0-9]{64}$/;
  return pattern.test(hash);
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
};

/**
 * Get explorer URL for transaction
 */
export const getExplorerUrl = (txHash: string, network: 'testnet' | 'mainnet' = 'testnet'): string => {
  const baseUrl = network === 'testnet' 
    ? 'https://testnet-explorer.qubic.org'
    : 'https://explorer.qubic.org';
  return `${baseUrl}/tx/${txHash}`;
};

/**
 * Get explorer URL for address
 */
export const getAddressExplorerUrl = (address: string, network: 'testnet' | 'mainnet' = 'testnet'): string => {
  const baseUrl = network === 'testnet' 
    ? 'https://testnet-explorer.qubic.org'
    : 'https://explorer.qubic.org';
  return `${baseUrl}/address/${address}`;
};

/**
 * Parse error message for user display
 */
export const parseErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unknown error occurred';
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if mock mode is enabled
 */
export const isMockMode = (): boolean => {
  return process.env.REACT_APP_MOCK_MODE === 'true';
};

/**
 * Get environment variable with fallback
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  return process.env[key] || fallback;
};