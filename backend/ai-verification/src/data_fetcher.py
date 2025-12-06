"""
Social Media Data Fetcher
Simulates fetching real data from social media platforms
"""
import re
import random
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DataFetcher:
    """Fetches and simulates social media data"""
    
    def __init__(self):
        self.scenarios = self._load_scenarios()
    
    def _load_scenarios(self) -> Dict[str, Dict]:
        """Load predefined test scenarios"""
        return {
            'legitimate': {
                'followers': self._generate_legitimate_followers(1000),
                'engagement': self._generate_legitimate_engagement(100),
                'historical_avg_engagement': 8.5,
                'post_timestamp': datetime.now() - timedelta(hours=12),
                'influencer_location': 'United States',
                'influencer_language': 'English'
            },
            'bot_fraud': {
                'followers': self._generate_bot_followers(1000),
                'engagement': self._generate_bot_engagement(200),
                'historical_avg_engagement': 2.1,
                'post_timestamp': datetime.now() - timedelta(hours=2),
                'influencer_location': 'United States',
                'influencer_language': 'English'
            },
            'mixed_quality': {
                'followers': self._generate_mixed_followers(1000),
                'engagement': self._generate_mixed_engagement(150),
                'historical_avg_engagement': 6.2,
                'post_timestamp': datetime.now() - timedelta(hours=8),
                'influencer_location': 'United Kingdom',
                'influencer_language': 'English'
            }
        }
    
    def fetch_post_data(self, post_url: str, scenario: str = 'legitimate') -> Dict[str, Any]:
        """
        Fetch post data from social media
        In production, this would call real APIs
        """
        logger.info(f"Fetching data for post: {post_url} (scenario: {scenario})")
        
        if scenario not in self.scenarios:
            raise ValueError(f"Unknown scenario: {scenario}")
        
        data = self.scenarios[scenario].copy()
        data['post_url'] = post_url
        data['fetch_timestamp'] = datetime.now()
        
        return data
    
    def _generate_legitimate_followers(self, count: int) -> List[Dict]:
        """Generate realistic follower profiles"""
        followers = []
        for i in range(count):
            followers.append({
                'username': self._generate_real_username(),
                'has_profile_pic': random.random() > 0.05,
                'post_count': random.randint(10, 500),
                'following_count': random.randint(100, 1000),
                'follower_count': random.randint(50, 5000),
                'bio_length': random.randint(20, 150),
                'account_age_days': random.randint(180, 2000),
                'is_verified': random.random() > 0.95,
                'location': random.choice(['United States', 'Canada', 'UK', 'Australia'])
            })
        return followers
    
    def _generate_bot_followers(self, count: int) -> List[Dict]:
        """Generate suspicious bot profiles"""
        followers = []
        for i in range(count):
            is_bot = random.random() > 0.3  # 70% bots
            if is_bot:
                followers.append({
                    'username': f"user{random.randint(100000, 999999)}",
                    'has_profile_pic': False,
                    'post_count': 0,
                    'following_count': random.randint(2000, 5000),
                    'follower_count': random.randint(0, 50),
                    'bio_length': 0,
                    'account_age_days': random.randint(1, 30),
                    'is_verified': False,
                    'location': random.choice(['Unknown', 'Bot Farm', 'Multiple'])
                })
            else:
                followers.append({
                    'username': self._generate_real_username(),
                    'has_profile_pic': True,
                    'post_count': random.randint(10, 200),
                    'following_count': random.randint(200, 1500),
                    'follower_count': random.randint(100, 2000),
                    'bio_length': random.randint(30, 100),
                    'account_age_days': random.randint(90, 1000),
                    'is_verified': False,
                    'location': random.choice(['India', 'Bangladesh', 'Philippines'])
                })
        return followers
    
    def _generate_mixed_followers(self, count: int) -> List[Dict]:
        """Generate mixed quality follower profiles"""
        legitimate = self._generate_legitimate_followers(int(count * 0.6))
        bots = self._generate_bot_followers(int(count * 0.4))
        followers = legitimate + bots
        random.shuffle(followers)
        return followers
    
    def _generate_legitimate_engagement(self, count: int) -> Dict:
        """Generate realistic engagement data"""
        comments = []
        for _ in range(count):
            comment_type = random.choice(['thoughtful', 'positive', 'question'])
            if comment_type == 'thoughtful':
                comment = random.choice([
                    "This is exactly what I needed to see today! Your perspective is refreshing.",
                    "I've been following your journey and this post really resonates with me.",
                    "The way you explain complex topics is incredible. Thank you!",
                    "This reminds me of my own experience with this. Great insights!"
                ])
            elif comment_type == 'positive':
                comment = random.choice([
                    "Love this content! Keep it coming!",
                    "You always deliver amazing posts!",
                    "This is why I follow you. Quality content.",
                    "Absolutely brilliant work as always!"
                ])
            else:
                comment = random.choice([
                    "How did you get started with this?",
                    "What tools do you recommend for beginners?",
                    "Could you make a tutorial on this topic?",
                    "Where can I learn more about this?"
                ])
            
            comments.append({
                'text': comment,
                'username': self._generate_real_username(),
                'timestamp': datetime.now() - timedelta(hours=random.randint(1, 12)),
                'location': random.choice(['United States', 'Canada', 'UK', 'Australia'])
            })
        
        return {
            'likes': random.randint(800, 1200),
            'comments': comments,
            'shares': random.randint(50, 150),
            'saves': random.randint(100, 300)
        }
    
    def _generate_bot_engagement(self, count: int) -> Dict:
        """Generate suspicious bot engagement"""
        comments = []
        spam_phrases = ['Great post!', 'Nice!', 'Cool!', '🔥', '❤️', '👍', 
                       'Check my bio', 'Follow me back', 'DM me']
        
        for _ in range(count):
            comments.append({
                'text': random.choice(spam_phrases),
                'username': f"user{random.randint(100000, 999999)}",
                'timestamp': datetime.now() - timedelta(minutes=random.randint(1, 60)),
                'location': random.choice(['Unknown', 'Bot Farm', 'India', 'Bangladesh'])
            })
        
        return {
            'likes': random.randint(1500, 2500),  # Suspiciously high
            'comments': comments,
            'shares': random.randint(10, 30),
            'saves': random.randint(20, 50)
        }
    
    def _generate_mixed_engagement(self, count: int) -> Dict:
        """Generate mixed quality engagement"""
        legit = self._generate_legitimate_engagement(int(count * 0.6))
        bot = self._generate_bot_engagement(int(count * 0.4))
        
        all_comments = legit['comments'] + bot['comments']
        random.shuffle(all_comments)
        
        return {
            'likes': legit['likes'] + bot['likes'],
            'comments': all_comments,
            'shares': legit['shares'] + bot['shares'],
            'saves': legit['saves'] + bot['saves']
        }
    
    def _generate_real_username(self) -> str:
        """Generate realistic username"""
        prefixes = ['the', 'real', 'official', 'just', 'its']
        names = ['sarah', 'mike', 'emma', 'john', 'alex', 'maria', 
                'david', 'lisa', 'james', 'anna']
        suffixes = ['_', '.', '']
        numbers = ['', str(random.randint(1, 99)), '']
        
        prefix = random.choice([''] + prefixes)
        name = random.choice(names)
        suffix = random.choice(suffixes)
        number = random.choice(numbers)
        
        username = f"{prefix}{suffix}{name}{number}".replace('..', '.').strip('._')
        return username if username else 'user123'