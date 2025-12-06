"""
Fraud Detector
Orchestrates all fraud detection checks and produces final verdict
"""
import logging
from typing import Dict, Any
from models.follower_check import FollowerAuthenticityChecker
from models.engagement_check import EngagementQualityChecker
from models.velocity_check import VelocityChecker
from models.geo_location_check import GeoLocationChecker
from config import Config

logger = logging.getLogger(__name__)

class FraudDetector:
    """Main fraud detection orchestrator"""
    
    def __init__(self):
        self.follower_checker = FollowerAuthenticityChecker()
        self.engagement_checker = EngagementQualityChecker()
        self.velocity_checker = VelocityChecker()
        self.geo_checker = GeoLocationChecker()
        self.weights = Config.WEIGHTS
        self.pass_threshold = Config.THRESHOLDS['overall_pass_score']
    
    def detect(self, post_data: Dict) -> Dict[str, Any]:
        """
        Run all fraud detection checks
        Returns comprehensive fraud analysis
        """
        logger.info("Starting fraud detection analysis")
        
        # Extract data
        followers = post_data.get('followers', [])
        engagement = post_data.get('engagement', {})
        historical_avg = post_data.get('historical_avg_engagement', 5.0)
        post_timestamp = post_data.get('post_timestamp')
        influencer_location = post_data.get('influencer_location', 'Unknown')
        
        # Run all checks
        follower_result = self.follower_checker.analyze(followers)
        engagement_result = self.engagement_checker.analyze(engagement)
        velocity_result = self.velocity_checker.analyze(engagement, historical_avg, post_timestamp)
        geo_result = self.geo_checker.analyze(followers, engagement, influencer_location)
        
        # Calculate weighted overall score
        overall_score = (
            follower_result['score'] * self.weights['follower_authenticity'] +
            engagement_result['score'] * self.weights['engagement_quality'] +
            velocity_result['score'] * self.weights['velocity_check'] +
            geo_result['score'] * self.weights['geo_alignment']
        )
        
        # Collect all flags
        all_flags = (
            follower_result.get('flags', []) +
            engagement_result.get('flags', []) +
            velocity_result.get('flags', []) +
            geo_result.get('flags', [])
        )
        
        # Determine recommendation
        recommendation = self._get_recommendation(overall_score, all_flags)
        
        # Calculate confidence
        confidence = self._calculate_confidence(follower_result, engagement_result, 
                                               velocity_result, geo_result)
        
        logger.info(f"Fraud detection complete: Score {overall_score:.2f}/100, "
                   f"Recommendation: {recommendation}")
        
        return {
            'overall_score': round(overall_score, 2),
            'pass_threshold': self.pass_threshold,
            'passed': overall_score >= self.pass_threshold,
            'recommendation': recommendation,
            'confidence': confidence,
            'breakdown': {
                'follower_authenticity': {
                    'score': follower_result['score'],
                    'weight': self.weights['follower_authenticity'],
                    'weighted_contribution': round(follower_result['score'] * self.weights['follower_authenticity'], 2),
                    'details': follower_result
                },
                'engagement_quality': {
                    'score': engagement_result['score'],
                    'weight': self.weights['engagement_quality'],
                    'weighted_contribution': round(engagement_result['score'] * self.weights['engagement_quality'], 2),
                    'details': engagement_result
                },
                'velocity_check': {
                    'score': velocity_result['score'],
                    'weight': self.weights['velocity_check'],
                    'weighted_contribution': round(velocity_result['score'] * self.weights['velocity_check'], 2),
                    'details': velocity_result
                },
                'geo_alignment': {
                    'score': geo_result['score'],
                    'weight': self.weights['geo_alignment'],
                    'weighted_contribution': round(geo_result['score'] * self.weights['geo_alignment'], 2),
                    'details': geo_result
                }
            },
            'fraud_flags': all_flags,
            'summary': self._generate_summary(overall_score, follower_result, 
                                             engagement_result, velocity_result, geo_result)
        }
    
    def _get_recommendation(self, score: float, flags: list) -> str:
        """Generate payment recommendation"""
        if score >= self.pass_threshold:
            if len(flags) == 0:
                return "APPROVED_FOR_PAYMENT"
            elif len(flags) <= 2:
                return "APPROVED_WITH_MINOR_CONCERNS"
            else:
                return "APPROVED_BUT_MONITOR"
        elif score >= 80:
            return "MANUAL_REVIEW_RECOMMENDED"
        elif score >= 60:
            return "HOLD_PAYMENT_PENDING_REVIEW"
        else:
            return "REJECT_PAYMENT_FRAUD_DETECTED"
    
    def _calculate_confidence(self, follower_result: Dict, engagement_result: Dict,
                             velocity_result: Dict, geo_result: Dict) -> str:
        """Calculate confidence level in the assessment"""
        scores = [
            follower_result['score'],
            engagement_result['score'],
            velocity_result['score'],
            geo_result['score']
        ]
        
        # Check variance in scores
        avg_score = sum(scores) / len(scores)
        variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
        std_dev = variance ** 0.5
        
        # Low variance = high confidence
        if std_dev < 10:
            return "HIGH"
        elif std_dev < 20:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_summary(self, overall_score: float, follower_result: Dict,
                         engagement_result: Dict, velocity_result: Dict,
                         geo_result: Dict) -> str:
        """Generate human-readable summary"""
        if overall_score >= 95:
            return (f"Excellent authenticity score ({overall_score:.1f}/100). "
                   f"Campaign shows {follower_result['real_count']} genuine followers "
                   f"with {engagement_result['authentic_count']} authentic interactions. "
                   f"All metrics within expected ranges.")
        
        elif overall_score >= 80:
            return (f"Good authenticity score ({overall_score:.1f}/100). "
                   f"Some quality concerns detected but overall legitimate. "
                   f"Manual review recommended before payment release.")
        
        elif overall_score >= 60:
            return (f"Moderate authenticity score ({overall_score:.1f}/100). "
                   f"Detected {follower_result['bot_count']} potential bot followers "
                   f"and {engagement_result['spam_count']} spam comments. "
                   f"Hold payment pending further investigation.")
        
        else:
            return (f"Low authenticity score ({overall_score:.1f}/100). "
                   f"Strong indicators of fraud: {follower_result['bot_count']} bot followers, "
                   f"{engagement_result['spam_count']} spam comments. "
                   f"Payment should be blocked and refunded to brand.")