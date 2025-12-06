"""
Velocity Check
Detects suspicious engagement spikes and timing anomalies
"""
import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from config import Config

logger = logging.getLogger(__name__)

class VelocityChecker:
    """Analyzes engagement velocity for suspicious patterns"""
    
    def __init__(self):
        self.anomaly_threshold = Config.FRAUD_DETECTION.get('velocity_anomaly_max', 2.5)
    
    def analyze(self, engagement: Dict, historical_avg: float, post_timestamp: datetime) -> Dict[str, Any]:
        """
        Analyze engagement velocity
        Compares current engagement rate to historical average
        """
        current_engagement = self._calculate_engagement_rate(engagement)
        time_since_post = (datetime.now() - post_timestamp).total_seconds() / 3600  # hours
        
        if time_since_post < 1:
            time_since_post = 1  # Minimum 1 hour to avoid division issues
        
        # Calculate velocity (engagement per hour)
        current_velocity = current_engagement / time_since_post
        
        # Compare to historical average
        if historical_avg == 0:
            historical_avg = 1  # Avoid division by zero
        
        velocity_ratio = current_velocity / historical_avg
        
        # Calculate standard deviations from normal
        # Assuming normal engagement varies by ~30% (1 std dev)
        std_dev = historical_avg * 0.3
        deviation = abs(current_velocity - historical_avg) / std_dev if std_dev > 0 else 0
        
        flags = []
        is_anomalous = False
        
        # Check for suspicious patterns
        if deviation > self.anomaly_threshold:
            is_anomalous = True
            if current_velocity > historical_avg:
                flags.append(f'Unusually high engagement spike: {deviation:.1f}σ above normal')
            else:
                flags.append(f'Unusually low engagement: {deviation:.1f}σ below normal')
        
        # Check for instant spike (most engagement in first hour)
        if time_since_post < 2 and current_velocity > historical_avg * 2:
            flags.append('Suspicious instant spike pattern (possible bot purchase)')
        
        # Check for gradual dropoff pattern (sign of bought engagement wearing off)
        if time_since_post > 12:
            early_engagement = self._estimate_early_engagement(engagement, post_timestamp)
            if early_engagement > current_engagement * 1.5:
                flags.append('Engagement dropped significantly after initial spike')
        
        # Score calculation
        # Normal velocity (within 1σ) = 100
        # 1-2σ = 80
        # 2-3σ = 60
        # 3+σ = 40
        if deviation <= 1:
            score = 100
        elif deviation <= 2:
            score = 80
        elif deviation <= 3:
            score = 60
        else:
            score = 40
        
        # Bonus for sustained engagement over time
        if time_since_post > 6 and not is_anomalous:
            score = min(100, score + 10)
        
        logger.info(f"Velocity analysis: {current_velocity:.2f}/hr vs {historical_avg:.2f}/hr avg ({deviation:.2f}σ)")
        
        return {
            'score': round(score, 2),
            'current_velocity': round(current_velocity, 2),
            'historical_average': round(historical_avg, 2),
            'velocity_ratio': round(velocity_ratio, 2),
            'standard_deviations': round(deviation, 2),
            'time_since_post_hours': round(time_since_post, 2),
            'is_anomalous': is_anomalous,
            'flags': flags
        }
    
    def _calculate_engagement_rate(self, engagement: Dict) -> float:
        """Calculate total engagement"""
        likes = engagement.get('likes', 0)
        comments = len(engagement.get('comments', []))
        shares = engagement.get('shares', 0)
        saves = engagement.get('saves', 0)
        
        # Weighted engagement (comments and shares worth more)
        total_engagement = likes + (comments * 3) + (shares * 5) + (saves * 2)
        return total_engagement
    
    def _estimate_early_engagement(self, engagement: Dict, post_timestamp: datetime) -> float:
        """Estimate engagement in first few hours"""
        # In a real system, we'd have time-series data
        # For simulation, we'll analyze comment timestamps
        comments = engagement.get('comments', [])
        
        if not comments:
            return self._calculate_engagement_rate(engagement)
        
        early_cutoff = post_timestamp + timedelta(hours=2)
        early_comments = sum(1 for c in comments if c.get('timestamp', datetime.now()) < early_cutoff)
        
        # Estimate early engagement as proportional to early comments
        total_comments = len(comments)
        if total_comments == 0:
            early_ratio = 0.5
        else:
            early_ratio = early_comments / total_comments
        
        total_engagement = self._calculate_engagement_rate(engagement)
        return total_engagement * early_ratio / 0.2  # Normalize assuming early is ~20% of time