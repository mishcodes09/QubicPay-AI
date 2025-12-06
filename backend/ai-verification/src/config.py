"""
AI Verification Service Configuration
"""
import os
from typing import Dict, Any

class Config:
    """Configuration settings for AI Verification Service"""
    
    # API Settings
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # AI Verification Thresholds
    THRESHOLDS = {
        'follower_authenticity_min': 85,  # Minimum % of real followers
        'engagement_quality_min': 80,     # Minimum % authentic engagement
        'velocity_anomaly_max': 2.5,      # Max standard deviations
        'geo_alignment_min': 60,          # Minimum % target audience
        'overall_pass_score': 95          # Minimum overall score to pass
    }
    
    # Scoring Weights (must sum to 1.0)
    WEIGHTS = {
        'follower_authenticity': 0.30,
        'engagement_quality': 0.35,
        'velocity_check': 0.20,
        'geo_alignment': 0.15
    }
    
    # Fraud Detection Settings
    FRAUD_DETECTION = {
        'min_sample_size': 50,            # Min followers to analyze
        'bot_username_patterns': [
            r'^[a-z]+\d{4,}$',            # username1234
            r'^\d+[a-z]+\d+$',            # 123user456
            r'^user\d{6,}$'               # user123456
        ],
        'spam_comment_phrases': [
            'great post', 'nice', 'cool', 'awesome',
            '❤️', '🔥', '👍', '😍',
            'check my bio', 'follow me', 'dm me'
        ],
        'velocity_window_hours': 24,
        'suspicious_locations': [
            'Unknown', 'Bot Farm', 'Multiple'
        ]
    }
    
    # Social Media API Settings (placeholders for real APIs)
    INSTAGRAM_API = {
        'enabled': os.getenv('INSTAGRAM_API_ENABLED', 'False').lower() == 'true',
        'access_token': os.getenv('INSTAGRAM_ACCESS_TOKEN', ''),
        'rate_limit': 200  # requests per hour
    }
    
    TWITTER_API = {
        'enabled': os.getenv('TWITTER_API_ENABLED', 'False').lower() == 'true',
        'api_key': os.getenv('TWITTER_API_KEY', ''),
        'api_secret': os.getenv('TWITTER_API_SECRET', ''),
        'rate_limit': 300
    }
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration settings"""
        weight_sum = sum(cls.WEIGHTS.values())
        if abs(weight_sum - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {weight_sum}")
        return True

# Validate on import
Config.validate()