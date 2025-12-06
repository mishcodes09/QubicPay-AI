"""
Follower Authenticity Check
Detects fake followers and bot accounts
"""
import re
import logging
from typing import Dict, List, Any
from config import Config

logger = logging.getLogger(__name__)

class FollowerAuthenticityChecker:
    """Analyzes followers for bot signals"""
    
    def __init__(self):
        self.bot_patterns = [re.compile(p) for p in Config.FRAUD_DETECTION['bot_username_patterns']]
    
    def analyze(self, followers: List[Dict]) -> Dict[str, Any]:
        """
        Analyze follower list for authenticity
        Returns score and detailed breakdown
        """
        if not followers:
            return {
                'score': 0,
                'real_count': 0,
                'bot_count': 0,
                'suspicious_count': 0,
                'flags': ['No followers to analyze']
            }
        
        total = len(followers)
        bot_count = 0
        suspicious_count = 0
        flags = []
        
        for follower in followers:
            bot_signals = self._check_bot_signals(follower)
            if bot_signals['is_definite_bot']:
                bot_count += 1
            elif bot_signals['is_suspicious']:
                suspicious_count += 1
        
        real_count = total - bot_count - suspicious_count
        authenticity_percentage = (real_count / total) * 100
        
        # Scoring: Real followers = 100%, Suspicious = 50%, Bots = 0%
        weighted_score = ((real_count + (suspicious_count * 0.5)) / total) * 100
        
        # Add flags
        if bot_count > total * 0.3:
            flags.append(f'High bot presence: {bot_count} bots ({(bot_count/total)*100:.1f}%)')
        if suspicious_count > total * 0.2:
            flags.append(f'Many suspicious accounts: {suspicious_count} ({(suspicious_count/total)*100:.1f}%)')
        
        logger.info(f"Follower analysis: {real_count} real, {suspicious_count} suspicious, {bot_count} bots")
        
        return {
            'score': round(weighted_score, 2),
            'real_count': real_count,
            'bot_count': bot_count,
            'suspicious_count': suspicious_count,
            'total_analyzed': total,
            'authenticity_percentage': round(authenticity_percentage, 2),
            'flags': flags
        }
    
    def _check_bot_signals(self, follower: Dict) -> Dict[str, bool]:
        """Check individual follower for bot signals"""
        signals = {
            'is_definite_bot': False,
            'is_suspicious': False,
            'reasons': []
        }
        
        username = follower.get('username', '')
        
        # Check 1: Bot username pattern
        if any(pattern.match(username) for pattern in self.bot_patterns):
            signals['reasons'].append('Bot username pattern')
            signals['is_definite_bot'] = True
        
        # Check 2: No profile picture
        if not follower.get('has_profile_pic', True):
            signals['reasons'].append('No profile picture')
            signals['is_suspicious'] = True
        
        # Check 3: Zero posts
        if follower.get('post_count', 1) == 0:
            signals['reasons'].append('Zero posts')
            signals['is_definite_bot'] = True
        
        # Check 4: Following/Follower ratio
        following = follower.get('following_count', 0)
        followers_count = follower.get('follower_count', 1)
        if following > 0 and followers_count > 0:
            ratio = following / followers_count
            if ratio > 10:  # Following 10x more than followers
                signals['reasons'].append('Suspicious follow ratio')
                signals['is_suspicious'] = True
        
        # Check 5: New account with high activity
        age_days = follower.get('account_age_days', 1000)
        if age_days < 30 and following > 1000:
            signals['reasons'].append('New account, high following')
            signals['is_suspicious'] = True
        
        # Check 6: No bio
        if follower.get('bio_length', 1) == 0:
            signals['reasons'].append('No bio')
            signals['is_suspicious'] = True
        
        # Check 7: Suspicious location
        location = follower.get('location', '')
        if location in Config.FRAUD_DETECTION['suspicious_locations']:
            signals['reasons'].append('Suspicious location')
            signals['is_definite_bot'] = True
        
        # If multiple suspicious signals, upgrade to definite bot
        if len(signals['reasons']) >= 3:
            signals['is_definite_bot'] = True
        
        return signals