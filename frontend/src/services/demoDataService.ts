/**
 * Demo Data Service
 * Provides realistic mock data for demonstration to judges
 */

export interface DemoInfluencer {
  id: string;
  name: string;
  username: string;
  platform: 'instagram' | 'twitter' | 'tiktok';
  followers: number;
  avgEngagement: number;
  verified: boolean;
  profileImage: string;
  bio: string;
  wallet: string;
}

export interface DemoBrand {
  id: string;
  name: string;
  industry: string;
  wallet: string;
  budget: number;
  logo: string;
}

export interface DemoCampaign {
  id: string;
  brandId: string;
  brandName: string;
  influencerId: string;
  influencerName: string;
  amount: number;
  status: 'active' | 'pending' | 'completed' | 'rejected';
  postUrl: string;
  verificationScore?: number;
  createdAt: Date;
  verifiedAt?: Date;
  description: string;
  requirements: string[];
  contractId: string;
  txHash?: string;
}

export interface DemoPost {
  url: string;
  platform: 'instagram' | 'twitter' | 'tiktok';
  content: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
  thumbnail: string;
}

class DemoDataService {
  private static readonly DEMO_INFLUENCERS: DemoInfluencer[] = [
    {
      id: 'inf1',
      name: 'Sarah Martinez',
      username: '@sarahstyle',
      platform: 'instagram',
      followers: 250000,
      avgEngagement: 8.5,
      verified: true,
      profileImage: '👩‍💼',
      bio: 'Fashion & Lifestyle | NYC | Sponsored by top brands',
      wallet: 'SARAHMARTINEZQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXY'
    },
    {
      id: 'inf2',
      name: 'Mike Chen',
      username: '@miketech',
      platform: 'twitter',
      followers: 180000,
      avgEngagement: 6.2,
      verified: true,
      profileImage: '👨‍💻',
      bio: 'Tech Reviewer | Gadgets & Innovation | Honest Reviews',
      wallet: 'MIKECHENQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZAB'
    },
    {
      id: 'inf3',
      name: 'Emma Wilson',
      username: '@emmafitness',
      platform: 'instagram',
      followers: 320000,
      avgEngagement: 9.1,
      verified: true,
      profileImage: '💪',
      bio: 'Certified PT | Wellness Coach | Transform Your Life',
      wallet: 'EMMAWILSONQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },
    {
      id: 'inf4',
      name: 'Alex Rivera',
      username: '@alexgaming',
      platform: 'tiktok',
      followers: 450000,
      avgEngagement: 12.3,
      verified: true,
      profileImage: '🎮',
      bio: 'Pro Gamer | Content Creator | Twitch Partner',
      wallet: 'ALEXRIVERAQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },
    {
      id: 'inf5',
      name: 'Lisa Park',
      username: '@lisabeauty',
      platform: 'instagram',
      followers: 290000,
      avgEngagement: 7.8,
      verified: true,
      profileImage: '💄',
      bio: 'Makeup Artist | Beauty Tips | K-Beauty Enthusiast',
      wallet: 'LISAPARKQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZAB'
    }
  ];

  private static readonly DEMO_BRANDS: DemoBrand[] = [
    {
      id: 'brand1',
      name: 'TechVista',
      industry: 'Technology',
      wallet: 'TECHVISTAQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZ',
      budget: 5000000,
      logo: '📱'
    },
    {
      id: 'brand2',
      name: 'GlowUp Cosmetics',
      industry: 'Beauty',
      wallet: 'GLOWUPQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABC',
      budget: 3000000,
      logo: '✨'
    },
    {
      id: 'brand3',
      name: 'FitLife Pro',
      industry: 'Fitness',
      wallet: 'FITLIFEQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZAB',
      budget: 2500000,
      logo: '🏋️'
    },
    {
      id: 'brand4',
      name: 'EcoWear Fashion',
      industry: 'Fashion',
      wallet: 'ECOWEARQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZAB',
      budget: 4000000,
      logo: '👗'
    },
    {
      id: 'brand5',
      name: 'GameZone',
      industry: 'Gaming',
      wallet: 'GAMEZONEQUBICWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZAB',
      budget: 6000000,
      logo: '🎯'
    }
  ];

  private static readonly DEMO_CAMPAIGNS: DemoCampaign[] = [
    {
      id: 'camp1',
      brandId: 'brand1',
      brandName: 'TechVista',
      influencerId: 'inf2',
      influencerName: 'Mike Chen',
      amount: 50000,
      status: 'completed',
      postUrl: 'https://twitter.com/miketech/status/1234567890',
      verificationScore: 97,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      description: 'Review our new smartphone with 200MP camera',
      requirements: ['Minimum 5 photos', 'Honest review', 'Tag @TechVista'],
      contractId: 'CONTRACT1QUBICSMARTESCROWABCDEFGHIJKLMNOPQRSTUVWXYZAB',
      txHash: '0x4a7b9c2d8e3f1a5b6c9d0e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
    },
    {
      id: 'camp2',
      brandId: 'brand2',
      brandName: 'GlowUp Cosmetics',
      influencerId: 'inf5',
      influencerName: 'Lisa Park',
      amount: 35000,
      status: 'active',
      postUrl: 'https://instagram.com/p/lisabeauty_glowup',
      verificationScore: 96,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description: 'Showcase our new summer makeup collection',
      requirements: ['Tutorial video', 'Before/After photos', 'Use #GlowUpSummer'],
      contractId: 'CONTRACT2QUBICSMARTESCROWABCDEFGHIJKLMNOPQRSTUVWXYZAB',
      txHash: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d'
    },
    {
      id: 'camp3',
      brandId: 'brand3',
      brandName: 'FitLife Pro',
      influencerId: 'inf3',
      influencerName: 'Emma Wilson',
      amount: 45000,
      status: 'pending',
      postUrl: 'https://instagram.com/p/emmafitness_fitlife',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      description: 'Promote our new protein powder line',
      requirements: ['Workout video', 'Product demonstration', 'Share nutrition tips'],
      contractId: 'CONTRACT3QUBICSMARTESCROWABCDEFGHIJKLMNOPQRSTUVWXYZAB'
    },
    {
      id: 'camp4',
      brandId: 'brand4',
      brandName: 'EcoWear Fashion',
      influencerId: 'inf1',
      influencerName: 'Sarah Martinez',
      amount: 60000,
      status: 'active',
      postUrl: 'https://instagram.com/p/sarahstyle_ecowear',
      verificationScore: 42,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      description: 'Model our sustainable fashion collection',
      requirements: ['3 outfit photos', 'Behind-the-scenes', 'Sustainability message'],
      contractId: 'CONTRACT4QUBICSMARTESCROWABCDEFGHIJKLMNOPQRSTUVWXYZAB',
      txHash: '0x1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b'
    },
    {
      id: 'camp5',
      brandId: 'brand5',
      brandName: 'GameZone',
      influencerId: 'inf4',
      influencerName: 'Alex Rivera',
      amount: 80000,
      status: 'completed',
      postUrl: 'https://tiktok.com/@alexgaming/video/9876543210',
      verificationScore: 98,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      description: 'Stream gameplay of our new title',
      requirements: ['2-hour live stream', 'Honest gameplay', 'Engage with chat'],
      contractId: 'CONTRACT5QUBICSMARTESCROWABCDEFGHIJKLMNOPQRSTUVWXYZAB',
      txHash: '0x7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e'
    }
  ];

  private static readonly DEMO_POSTS: Record<string, DemoPost> = {
    'https://twitter.com/miketech/status/1234567890': {
      url: 'https://twitter.com/miketech/status/1234567890',
      platform: 'twitter',
      content: 'Just tested the new TechVista X200! 🔥 The 200MP camera is INSANE. Here are my thoughts after 1 week... #TechVista #SmartphoneReview',
      likes: 15420,
      comments: 892,
      shares: 1245,
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      thumbnail: '📱'
    },
    'https://instagram.com/p/lisabeauty_glowup': {
      url: 'https://instagram.com/p/lisabeauty_glowup',
      platform: 'instagram',
      content: 'Summer glow tutorial using @GlowUpCosmetics new collection! ✨ Swipe for before/after 👉 #GlowUpSummer #MakeupTutorial',
      likes: 28450,
      comments: 1523,
      shares: 892,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      thumbnail: '💄'
    },
    'https://instagram.com/p/emmafitness_fitlife': {
      url: 'https://instagram.com/p/emmafitness_fitlife',
      platform: 'instagram',
      content: 'My go-to post-workout fuel! 💪 @FitLifePro protein has been a game-changer. Here\'s why... #FitLifePro #FitnessJourney',
      likes: 31250,
      comments: 1876,
      shares: 1034,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      thumbnail: '🏋️'
    },
    'https://instagram.com/p/sarahstyle_ecowear': {
      url: 'https://instagram.com/p/sarahstyle_ecowear',
      platform: 'instagram',
      content: 'Styling @EcoWearFashion sustainable pieces! 🌿 Fashion can be beautiful AND eco-friendly. Check out these looks! #SustainableFashion',
      likes: 8420,
      comments: 234,
      shares: 145,
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      thumbnail: '👗'
    },
    'https://tiktok.com/@alexgaming/video/9876543210': {
      url: 'https://tiktok.com/@alexgaming/video/9876543210',
      platform: 'tiktok',
      content: '2 HOUR GAMEPLAY STREAM of the new @GameZone title! 🎮 This game is INCREDIBLE. Link in bio to watch full stream! #Gaming #GameZone',
      likes: 67890,
      comments: 3421,
      shares: 5234,
      timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      thumbnail: '🎮'
    }
  };

  /**
   * Get all demo influencers
   */
  static getInfluencers(): DemoInfluencer[] {
    return [...this.DEMO_INFLUENCERS];
  }

  /**
   * Get influencer by ID
   */
  static getInfluencer(id: string): DemoInfluencer | null {
    return this.DEMO_INFLUENCERS.find(inf => inf.id === id) || null;
  }

  /**
   * Get all demo brands
   */
  static getBrands(): DemoBrand[] {
    return [...this.DEMO_BRANDS];
  }

  /**
   * Get brand by ID
   */
  static getBrand(id: string): DemoBrand | null {
    return this.DEMO_BRANDS.find(brand => brand.id === id) || null;
  }

  /**
   * Get all demo campaigns
   */
  static getCampaigns(): DemoCampaign[] {
    return [...this.DEMO_CAMPAIGNS];
  }

  /**
   * Get campaigns for specific brand
   */
  static getBrandCampaigns(brandId: string): DemoCampaign[] {
    return this.DEMO_CAMPAIGNS.filter(c => c.brandId === brandId);
  }

  /**
   * Get campaigns for specific influencer
   */
  static getInfluencerCampaigns(influencerId: string): DemoCampaign[] {
    return this.DEMO_CAMPAIGNS.filter(c => c.influencerId === influencerId);
  }

  /**
   * Get campaign by ID
   */
  static getCampaign(id: string): DemoCampaign | null {
    return this.DEMO_CAMPAIGNS.find(c => c.id === id) || null;
  }

  /**
   * Get post details
   */
  static getPost(url: string): DemoPost | null {
    return this.DEMO_POSTS[url] || null;
  }

  /**
   * Get campaign statistics
   */
  static getCampaignStats() {
    const campaigns = this.DEMO_CAMPAIGNS;
    const completed = campaigns.filter(c => c.status === 'completed');
    const active = campaigns.filter(c => c.status === 'active');
    const pending = campaigns.filter(c => c.status === 'pending');
    
    const totalPaid = completed.reduce((sum, c) => sum + c.amount, 0);
    const totalEscrow = active.reduce((sum, c) => sum + c.amount, 0);
    
    const fraudDetected = campaigns.filter(c => 
      c.verificationScore !== undefined && c.verificationScore < 95
    ).length;

    return {
      total: campaigns.length,
      completed: completed.length,
      active: active.length,
      pending: pending.length,
      fraudDetected,
      totalPaid,
      totalEscrow,
      avgScore: campaigns
        .filter(c => c.verificationScore !== undefined)
        .reduce((sum, c) => sum + c.verificationScore!, 0) / 
        campaigns.filter(c => c.verificationScore !== undefined).length
    };
  }

  /**
   * Create a new demo campaign
   */
  static createCampaign(
    brandId: string,
    influencerId: string,
    amount: number,
    description: string,
    requirements: string[]
  ): DemoCampaign {
    const brand = this.getBrand(brandId);
    const influencer = this.getInfluencer(influencerId);

    if (!brand || !influencer) {
      throw new Error('Invalid brand or influencer');
    }

    const newCampaign: DemoCampaign = {
      id: `camp${Date.now()}`,
      brandId,
      brandName: brand.name,
      influencerId,
      influencerName: influencer.name,
      amount,
      status: 'pending',
      postUrl: `https://${influencer.platform}.com/p/demo_${Date.now()}`,
      createdAt: new Date(),
      description,
      requirements,
      contractId: `CONTRACT${Date.now()}QUBICSMARTESCROWDEMO`.padEnd(60, 'X')
    };

    this.DEMO_CAMPAIGNS.push(newCampaign);
    return newCampaign;
  }

  /**
   * Update campaign status
   */
  static updateCampaign(
    id: string,
    updates: Partial<DemoCampaign>
  ): DemoCampaign | null {
    const index = this.DEMO_CAMPAIGNS.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.DEMO_CAMPAIGNS[index] = {
      ...this.DEMO_CAMPAIGNS[index],
      ...updates
    };

    return this.DEMO_CAMPAIGNS[index];
  }

  /**
   * Get realistic scenario for demo
   */
  static getDemoScenario(campaignId: string): 'legitimate' | 'bot_fraud' | 'mixed_quality' {
    const campaign = this.getCampaign(campaignId);
    if (!campaign || !campaign.verificationScore) return 'legitimate';

    if (campaign.verificationScore >= 95) return 'legitimate';
    if (campaign.verificationScore < 60) return 'bot_fraud';
    return 'mixed_quality';
  }

  /**
   * Get demo presentation data
   */
  static getPresentationData() {
    return {
      influencers: this.getInfluencers(),
      brands: this.getBrands(),
      campaigns: this.getCampaigns(),
      stats: this.getCampaignStats(),
      successStories: this.getCampaigns()
        .filter(c => c.status === 'completed' && c.verificationScore! >= 95)
        .slice(0, 3),
      fraudCaught: this.getCampaigns()
        .filter(c => c.verificationScore !== undefined && c.verificationScore < 95)
        .slice(0, 2)
    };
  }
}

export default DemoDataService;