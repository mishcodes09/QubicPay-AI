"""
Geographic Location Check
Analyzes audience location alignment with influencer
"""
import logging
from typing import Dict, List, Any
from collections import Counter
from config import Config

logger = logging.getLogger(__name__)

class GeoLocationChecker:
    """Analyzes geographic distribution of engagement"""
    
    def __init__(self):
        self.suspicious_locations = Config.FRAUD_DETECTION.get('suspicious_locations', [])
        self.bot_farm_countries = ['Unknown', 'Bot Farm', 'Multiple']
        
        # Define target regions for different influencer locations
        self.expected_regions = {
            'United States': ['United States', 'Canada', 'UK', 'Australia'],
            'United Kingdom': ['UK', 'United States', 'Europe', 'Australia'],
            'Canada': ['Canada', 'United States', 'UK'],
            'Australia': ['Australia', 'UK', 'United States', 'New Zealand'],
            'Europe': ['UK', 'Germany', 'France', 'Spain', 'Italy']
        }
    
    def analyze(self, followers: List[Dict], engagement: Dict, 
                influencer_location: str) -> Dict[str, Any]:
        """
        Analyze geographic alignment
        Check if engagement comes from expected regions
        """
        # Analyze follower locations
        follower_locations = [f.get('location', 'Unknown') for f in followers]
        follower_location_counts = Counter(follower_locations)
        
        # Analyze engagement locations
        comments = engagement.get('comments', [])
        engagement_locations = [c.get('location', 'Unknown') for c in comments]
        engagement_location_counts = Counter(engagement_locations)
        
        # Get expected regions for this influencer
        expected = self.expected_regions.get(influencer_location, [influencer_location])
        
        flags = []
        
        # Calculate alignment scores
        follower_alignment = self._calculate_alignment(
            follower_location_counts, expected, len(followers)
        )
        
        engagement_alignment = self._calculate_alignment(
            engagement_location_counts, expected, len(comments)
        )
        
        # Check for bot farm locations
        bot_farm_followers = sum(
            count for loc, count in follower_location_counts.items() 
            if loc in self.bot_farm_countries
        )
        bot_farm_engagement = sum(
            count for loc, count in engagement_location_counts.items() 
            if loc in self.bot_farm_countries
        )
        
        # Flags
        if bot_farm_followers > len(followers) * 0.2:
            flags.append(f'High bot farm follower presence: {(bot_farm_followers/len(followers)*100):.1f}%')
        
        if bot_farm_engagement > len(comments) * 0.2:
            flags.append(f'High bot farm engagement: {(bot_farm_engagement/len(comments)*100):.1f}%')
        
        if follower_alignment['percentage'] < 50:
            flags.append(f'Poor follower location alignment: only {follower_alignment["percentage"]:.1f}% from target regions')
        
        if engagement_alignment['percentage'] < 50:
            flags.append(f'Poor engagement location alignment: only {engagement_alignment["percentage"]:.1f}% from target regions')
        
        # Check for suspicious concentration in single non-target country
        top_follower_location = follower_location_counts.most_common(1)[0] if follower_location_counts else ('Unknown', 0)
        if top_follower_location[0] not in expected and top_follower_location[1] > len(followers) * 0.5:
            flags.append(f'Suspicious concentration: {top_follower_location[1]} followers ({(top_follower_location[1]/len(followers)*100):.1f}%) from {top_follower_location[0]}')
        
        # Calculate overall score
        # Weight follower alignment 60%, engagement alignment 40%
        overall_score = (follower_alignment['score'] * 0.6) + (engagement_alignment['score'] * 0.4)
        
        # Penalty for bot farms
        bot_farm_penalty = min(30, (bot_farm_followers + bot_farm_engagement) / (len(followers) + len(comments)) * 100)
        overall_score = max(0, overall_score - bot_farm_penalty)
        
        logger.info(f"Geo analysis: Follower {follower_alignment['percentage']:.1f}% aligned, "
                   f"Engagement {engagement_alignment['percentage']:.1f}% aligned")
        
        return {
            'score': round(overall_score, 2),
            'follower_alignment': follower_alignment,
            'engagement_alignment': engagement_alignment,
            'bot_farm_followers': bot_farm_followers,
            'bot_farm_engagement': bot_farm_engagement,
            'top_follower_countries': dict(follower_location_counts.most_common(5)),
            'top_engagement_countries': dict(engagement_location_counts.most_common(5)),
            'influencer_location': influencer_location,
            'expected_regions': expected,
            'flags': flags
        }
    
    def _calculate_alignment(self, location_counts: Counter, 
                            expected_regions: List[str], total: int) -> Dict[str, Any]:
        """Calculate alignment score for location distribution"""
        if total == 0:
            return {
                'score': 50,
                'aligned_count': 0,
                'percentage': 0
            }
        
        aligned_count = sum(
            count for loc, count in location_counts.items() 
            if loc in expected_regions
        )
        
        percentage = (aligned_count / total) * 100
        
        # Score based on percentage aligned
        # 80%+ = 100
        # 60-80% = 90
        # 40-60% = 70
        # 20-40% = 50
        # <20% = 30
        if percentage >= 80:
            score = 100
        elif percentage >= 60:
            score = 90
        elif percentage >= 40:
            score = 70
        elif percentage >= 20:
            score = 50
        else:
            score = 30
        
        return {
            'score': score,
            'aligned_count': aligned_count,
            'percentage': round(percentage, 2),
            'total': total
        }