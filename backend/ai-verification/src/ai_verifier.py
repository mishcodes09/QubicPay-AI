"""
AI Verifier - Main Service
Flask API for AI-powered fraud detection
"""
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any
from data_fetcher import DataFetcher
from fraud_detector import FraudDetector
from config import Config

# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format=Config.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
data_fetcher = DataFetcher()
fraud_detector = FraudDetector()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Verification Service',
        'version': '1.0.0'
    }), 200

@app.route('/verify', methods=['POST'])
def verify_post():
    """
    Main verification endpoint
    
    Request body:
    {
        "post_url": "https://instagram.com/p/xyz",
        "scenario": "legitimate|bot_fraud|mixed_quality"  # For demo purposes
    }
    
    Response:
    {
        "overall_score": 96,
        "passed": true,
        "recommendation": "APPROVED_FOR_PAYMENT",
        "breakdown": {...},
        "fraud_flags": [],
        "summary": "..."
    }
    """
    try:
        # Validate request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        post_url = data.get('post_url')
        scenario = data.get('scenario', 'legitimate')
        
        if not post_url:
            return jsonify({'error': 'post_url is required'}), 400
        
        logger.info(f"Verification request for: {post_url} (scenario: {scenario})")
        
        # Fetch post data
        post_data = data_fetcher.fetch_post_data(post_url, scenario)
        
        # Run fraud detection
        result = fraud_detector.detect(post_data)
        
        # Add request metadata
        result['post_url'] = post_url
        result['scenario'] = scenario
        result['fetch_timestamp'] = post_data['fetch_timestamp'].isoformat()
        
        logger.info(f"Verification complete: Score {result['overall_score']}, "
                   f"Recommendation: {result['recommendation']}")
        
        return jsonify(result), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/scenarios', methods=['GET'])
def get_scenarios():
    """Get available test scenarios"""
    return jsonify({
        'scenarios': [
            {
                'name': 'legitimate',
                'description': 'Legitimate campaign with real engagement',
                'expected_score': '95-100'
            },
            {
                'name': 'bot_fraud',
                'description': 'Campaign with bot followers and fake engagement',
                'expected_score': '30-50'
            },
            {
                'name': 'mixed_quality',
                'description': 'Mixed campaign with some real and some fake engagement',
                'expected_score': '70-85'
            }
        ]
    }), 200

@app.route('/thresholds', methods=['GET'])
def get_thresholds():
    """Get current verification thresholds"""
    return jsonify({
        'thresholds': Config.THRESHOLDS,
        'weights': Config.WEIGHTS
    }), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info(f"Starting AI Verification Service on {Config.API_HOST}:{Config.API_PORT}")
    logger.info(f"Debug mode: {Config.DEBUG}")
    
    app.run(
        host=Config.API_HOST,
        port=Config.API_PORT,
        debug=Config.DEBUG
    )