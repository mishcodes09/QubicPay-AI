"""
Engagement Quality Check
Analyzes comments and interactions for authenticity
"""
import re
import logging
from typing import Dict, List, Any
from collections import Counter
from config import Config

logger = logging.getLogger(__name__)

class EngagementQualityChecker:
    """Analyzes engagement for spam and bot activity"""
    
    def __init__(self):
        self.spam_phrases = [p.lower() for p in Config.FRAUD_DETECTION['spam_comment_phrases']]
    
    def analyze(self, engagement: Dict) -> Dict[str, Any]:
        """
        Analyze engagement quality
        Returns score and detailed breakdown
        """
        comments = engagement.get('comments', [])
        
        if not comments:
            return {
                'score': 50,  # Neutral score if no comments
                'authentic_count': 0,
                'spam_count': 0,
                'generic_count': 0,
                'total_analyzed': 0,
                'flags': ['No comments to analyze']
            }
        
        total = len(comments)
        spam_count = 0
        generic_count = 0
        duplicate_count = 0
        
        comment_texts = [c.get('text', '').lower() for c in comments]
        duplicates = self._find_duplicates(comment_texts)
        duplicate_count = sum(duplicates.values())
        
        flags = []
        
        for comment in comments:
            text = comment.get('text', '').lower().strip()
            
            # Check for spam
            if self._is_spam(text):
                spam_count += 1
            # Check for generic
            elif self._is_generic(text):
                generic_count += 1
        
        authentic_count = total - spam_count - generic_count
        quality_percentage = (authentic_count / total) * 100
        
        # Scoring: Authentic = 100%, Generic = 40%, Spam = 0%
        weighted_score = ((authentic_count + (generic_count * 0.4)) / total) * 100
        
        # Penalty for duplicates
        if duplicate_count > total * 0.1:
            duplicate_penalty = min(20, (duplicate_count / total) * 50)
            weighted_score -= duplicate_penalty
            flags.append(f'High duplicate comments: {duplicate_count} ({(duplicate_count/total)*100:.1f}%)')
        
        # Add flags
        if spam_count > total * 0.3:
            flags.append(f'High spam presence: {spam_count} comments ({(spam_count/total)*100:.1f}%)')
        if generic_count > total * 0.4:
            flags.append(f'Many generic comments: {generic_count} ({(generic_count/total)*100:.1f}%)')
        
        # Check for bot comment patterns
        bot_pattern_flags = self._check_bot_patterns(comments)
        flags.extend(bot_pattern_flags)
        
        weighted_score = max(0, min(100, weighted_score))
        
        logger.info(f"Engagement analysis: {authentic_count} authentic, {generic_count} generic, {spam_count} spam")
        
        return {
            'score': round(weighted_score, 2),
            'authentic_count': authentic_count,
            'spam_count': spam_count,
            'generic_count': generic_count,
            'duplicate_count': duplicate_count,
            'total_analyzed': total,
            'quality_percentage': round(quality_percentage, 2),
            'flags': flags
        }
    
    def _is_spam(self, text: str) -> bool:
        """Check if comment is spam"""
        # Check for exact spam phrases
        if any(phrase in text for phrase in self.spam_phrases):
            return True
        
        # Check for promotional content
        spam_keywords = ['check my bio', 'follow me', 'dm me', 'link in bio', 
                        'click here', 'visit my', 'free followers']
        if any(keyword in text for keyword in spam_keywords):
            return True
        
        # Check for only emojis (3+ emojis, no words)
        emoji_pattern = re.compile(r'[^\w\s]')
        text_without_emoji = emoji_pattern.sub('', text)
        if len(text_without_emoji.strip()) < 3 and len(text) > 3:
            return True
        
        return False
    
    def _is_generic(self, text: str) -> bool:
        """Check if comment is generic/low effort"""
        # Very short comments
        if len(text) < 10:
            return True
        
        # Only one or two words
        words = text.split()
        if len(words) <= 2:
            return True
        
        # Generic positive phrases
        generic_patterns = [
            r'^(nice|cool|awesome|great|amazing|love it|perfect)!*$',
            r'^(this is|so) (nice|cool|awesome|great|amazing)!*$',
            r'^love (this|it)!*$'
        ]
        
        if any(re.match(pattern, text) for pattern in generic_patterns):
            return True
        
        return False
    
    def _find_duplicates(self, comment_texts: List[str]) -> Counter:
        """Find duplicate comments"""
        counter = Counter(comment_texts)
        return Counter({text: count - 1 for text, count in counter.items() if count > 1})
    
    def _check_bot_patterns(self, comments: List[Dict]) -> List[str]:
        """Check for bot activity patterns"""
        flags = []
        
        if not comments:
            return flags
        
        # Check for rapid-fire comments from same users
        user_comments = {}
        for comment in comments:
            username = comment.get('username', '')
            if username not in user_comments:
                user_comments[username] = []
            user_comments[username].append(comment)
        
        # Flag users with multiple comments
        multi_commenters = sum(1 for user, cmts in user_comments.items() if len(cmts) > 2)
        if multi_commenters > len(user_comments) * 0.1:
            flags.append(f'{multi_commenters} users posted multiple comments (bot behavior)')
        
        # Check for suspicious usernames in comments
        bot_username_pattern = re.compile(r'^user\d{5,}$')
        bot_commenters = sum(1 for c in comments if bot_username_pattern.match(c.get('username', '')))
        if bot_commenters > len(comments) * 0.2:
            flags.append(f'{bot_commenters} comments from bot-like usernames')
        
        # Check for timing patterns (all within short window)
        if len(comments) >= 10:
            timestamps = [c.get('timestamp') for c in comments if c.get('timestamp')]
            if timestamps:
                timestamps.sort()
                time_span = (timestamps[-1] - timestamps[0]).total_seconds() / 60
                if time_span < 5 and len(comments) > 20:
                    flags.append(f'Suspicious timing: {len(comments)} comments in {time_span:.1f} minutes')
        
        return flags