# 🏗️ System Architecture

## Overview

The Qubic Smart Escrow platform is a decentralized, AI-powered system for fraud-proof influencer marketing payments. It combines on-chain smart contracts with off-chain AI verification to create a trustless payment settlement layer.

---

## 🎯 Core Design Principles

1. **Zero Trust**: Smart contracts enforce rules, not humans
2. **Zero Fees**: Leveraging Qubic's feeless architecture
3. **Real-Time Verification**: AI analysis in seconds
4. **Immutable Audit Trail**: All transactions on-chain
5. **Automatic Settlement**: No manual intervention required

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER LAYER                             │
│  ┌──────────────┐              ┌──────────────┐            │
│  │    Brand     │              │  Influencer  │            │
│  │   (Wallet)   │              │   (Wallet)   │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼──────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│              React Frontend (Port 3000)                     │
│  • Wallet Connection  • Campaign Creation                   │
│  • Verification Display  • Transaction History              │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   Qubic Service  │    │   API Service    │
│   (Blockchain)   │    │  (Backend API)   │
└─────────┬────────┘    └────────┬─────────┘
          │                      │
          │         ┌────────────┴────────────┐
          │         ▼                         ▼
          │  ┌──────────────┐      ┌──────────────────┐
          │  │ Oracle Agent │      │ AI Verification  │
          │  │ (Node.js)    │◄────►│    Service       │
          │  │ Port 8080    │      │   (Python)       │
          │  └──────┬───────┘      │   Port 5000      │
          │         │               └──────────────────┘
          │         │                        │
          ▼         ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                          │
│         Qubic Smart Contract (Escrow.qpi)                   │
│  • Fund Locking  • Score Validation  • Auto-Settlement     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  • Social Media APIs  • Historical Data  • ML Models       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Details

### 1. Smart Contract Layer (On-Chain)

**Technology**: C++ with Qubic Programming Interface (QPI)  
**Location**: `contract/src/escrow.qpi`  
**Network**: Qubic Blockchain

#### State Variables
```cpp
struct CONTRACT_STATE {
    id brandId;              // Brand wallet (60 chars)
    id influencerId;         // Influencer wallet (60 chars)
    id oracleId;            // Oracle wallet (60 chars)
    sint64 escrowBalance;    // Locked funds
    sint64 platformFee;      // 3% service fee
    uint8 requiredScore;     // 95/100 threshold
    uint8 verificationScore; // AI result (0-100)
    uint32 retentionEndTick; // Campaign end time
    bool isActive;           // Contract status
    bool isVerified;         // Score submitted
    bool isPaid;             // Payment released
    bool isRefunded;         // Funds returned
}
```

#### Key Procedures

| Procedure | Caller | Gas | Description |
|-----------|--------|-----|-------------|
| `setOracleId` | Owner | 0 | One-time oracle authorization |
| `depositFunds` | Brand | 0 | Lock payment in escrow |
| `setVerificationScore` | Oracle | 0 | Submit AI score (0-100) |
| `releasePayment` | Anyone | 0 | Pay influencer if score ≥95 |
| `refundFunds` | Anyone | 0 | Refund brand if score <95 |

#### State Transitions

```
┌─────────────┐
│   INITIAL   │
│ isActive=F  │
└──────┬──────┘
       │ depositFunds()
       ▼
┌─────────────┐
│   ACTIVE    │
│ isActive=T  │
│ isPaid=F    │
└──────┬──────┘
       │ setVerificationScore()
       ▼
┌─────────────┐
│  VERIFIED   │
│ isVerified=T│
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌─────┐
│PAID │ │REF. │
│=T   │ │=T   │
└─────┘ └─────┘
```

---

### 2. AI Verification Service (Off-Chain)

**Technology**: Python 3.9 + Flask + Pandas + NumPy  
**Location**: `backend/ai-verification/`  
**Port**: 5000

#### Architecture

```
┌──────────────────────────────────────────────┐
│          Flask REST API (Port 5000)          │
└────────────────┬─────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│  Data  │  │Fraud   │  │Score   │
│Fetcher │  │Detect  │  │Calc    │
└────────┘  └────────┘  └────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Follower │ │Engage   │ │Velocity │
│Checker  │ │Checker  │ │Checker  │
└─────────┘ └─────────┘ └─────────┘
                 │
                 ▼
           ┌─────────┐
           │   Geo   │
           │ Checker │
           └─────────┘
```

#### AI Models

**1. Follower Authenticity Check**
- Bot username patterns: `^user\d{6,}$`
- Profile completeness score
- Follower/following ratio analysis
- Account age verification
- Location anomaly detection

**2. Engagement Quality Check**
- Comment sentiment analysis
- Spam phrase detection (15+ patterns)
- Duplicate comment detection
- Emoji-only filter
- Comment length validation

**3. Velocity Anomaly Check**
- Historical baseline comparison
- Standard deviation analysis (2.5σ threshold)
- Time-series pattern recognition
- Spike detection algorithm
- Drop-off rate calculation

**4. Geo-Location Alignment**
- IP geolocation mapping
- Expected region matching
- Bot farm location detection
- Audience distribution analysis
- 60% target region threshold

#### Scoring Algorithm

```python
overall_score = (
    follower_score * 0.30 +      # 30% weight
    engagement_score * 0.35 +     # 35% weight
    velocity_score * 0.20 +       # 20% weight
    geo_score * 0.15              # 15% weight
)

recommendation = {
    >= 95: "APPROVED_FOR_PAYMENT",
    80-94: "MANUAL_REVIEW_RECOMMENDED",
    60-79: "HOLD_PAYMENT_PENDING_REVIEW",
    < 60: "REJECT_PAYMENT_FRAUD_DETECTED"
}
```

---

### 3. Oracle Agent (Bridge)

**Technology**: Node.js 18 + TypeScript + Express  
**Location**: `backend/oracle-agent/`  
**Port**: 8080

#### Responsibilities

1. **Monitor Smart Contract**
   - Poll for new escrow events
   - Track unverified campaigns
   - Maintain state synchronization

2. **Call AI Service**
   - Format verification requests
   - Handle retries (max 3 attempts)
   - Parse AI responses

3. **Submit to Blockchain**
   - Build Qubic transactions
   - Sign with Oracle private key
   - Broadcast to network
   - Confirm execution

#### Data Flow

```
1. Contract Event
   ↓
2. Fetch Campaign Data
   ↓
3. Call AI Service
   POST /verify {postUrl, scenario}
   ↓
4. Receive Score (0-100)
   ↓
5. Build Transaction
   inputType: SET_VERIFICATION_SCORE
   payload: score (uint8)
   ↓
6. Sign Transaction
   Using Oracle private key
   ↓
7. Broadcast to Qubic
   RPC: /broadcast
   ↓
8. Wait for Confirmation
   ~1 second average
   ↓
9. Update Local State
```

---

### 4. Frontend (User Interface)

**Technology**: React 18 + TypeScript + TailwindCSS  
**Location**: `frontend/`  
**Port**: 3000

#### Component Architecture

```
App.tsx
│
├─ WalletConnect.tsx
│  └─ useQubicWallet() hook
│
├─ BrandDashboard.tsx
│  ├─ CampaignCreator.tsx
│  ├─ EscrowManager.tsx
│  └─ TransactionHistory.tsx
│
├─ InfluencerDashboard.tsx
│  ├─ CampaignList.tsx
│  ├─ VerificationStatus.tsx
│  └─ PaymentHistory.tsx
│
└─ Services
   ├─ qubicService.ts      # Blockchain interaction
   ├─ apiService.ts        # Backend API calls
   └─ walletService.ts     # Wallet management
```

---

## 🔄 Complete User Flow

### Scenario: Legitimate Campaign

```
┌──────────┐
│  BRAND   │ Creates campaign with 100k QUBIC
└────┬─────┘
     │ 1. depositFunds(100k, influencerId, 7 days)
     ▼
┌──────────────────┐
│ SMART CONTRACT   │ Locks 97k (escrow) + 3k (fee)
│ State: ACTIVE    │
└────┬─────────────┘
     │ Event: NewEscrow(campaignId)
     ▼
┌──────────────────┐
│  ORACLE AGENT    │ Detects new escrow
└────┬─────────────┘
     │ 2. Monitors for post URL submission
     ▼
┌──────────────────┐
│  INFLUENCER      │ Submits post URL
└────┬─────────────┘
     │ 3. POST URL via frontend
     ▼
┌──────────────────┐
│  ORACLE AGENT    │ Receives notification
└────┬─────────────┘
     │ 4. Calls AI Service
     ▼
┌──────────────────┐
│ AI VERIFICATION  │ Analyzes post
│ • Followers: 98% │ • Engagement: 95%
│ • Velocity: 100% │ • Geo: 90%
│ Score: 96/100    │
└────┬─────────────┘
     │ 5. Returns score + breakdown
     ▼
┌──────────────────┐
│  ORACLE AGENT    │ Builds transaction
│ TX: setVerificationScore(96)
└────┬─────────────┘
     │ 6. Signs and broadcasts
     ▼
┌──────────────────┐
│ SMART CONTRACT   │ Validates score
│ State: VERIFIED  │ 96 >= 95 ✓
└────┬─────────────┘
     │ 7. Waits for retention period (7 days)
     ▼
┌──────────────────┐
│   ANYONE         │ Calls releasePayment()
└────┬─────────────┘
     │ 8. Triggers payment
     ▼
┌──────────────────┐
│ SMART CONTRACT   │ Transfers funds
│ • 97k → Influencer
│ • 3k → Platform
│ State: PAID      │
└──────────────────┘
```

---

## 🔐 Security Architecture

### 1. Smart Contract Security

**Authorization Model**
- Oracle: Only authorized oracle can submit scores
- Brand: Can only deposit funds for their campaigns
- Influencer: Cannot influence verification
- Anyone: Can trigger payment release (if conditions met)

**State Validation**
```cpp
// Cannot pay if already paid
if (state.isPaid) return;

// Cannot refund if already refunded  
if (state.isRefunded) return;

// Score must be from authorized oracle
if (caller != state.oracleId) return;

// Cannot change score after set
if (state.isVerified) return;
```

**Reentrancy Protection**
- Single-threaded execution model
- State updates before external calls
- No recursive callbacks

### 2. Oracle Security

**Private Key Management**
- Stored in `.env` (never committed)
- Required for transaction signing
- Rotatable if compromised

**Rate Limiting**
- Max 10 verifications per batch
- 5-second polling interval
- 3 retry attempts maximum

**Error Handling**
```typescript
try {
  await broadcastTransaction(tx);
} catch (error) {
  logError(error);
  retryCount++;
  if (retryCount < MAX_RETRIES) {
    await sleep(RETRY_DELAY);
    retry();
  }
}
```

### 3. AI Service Security

**Input Validation**
- URL format validation
- Scenario whitelist
- Request rate limiting
- CORS restrictions

**Data Privacy**
- No PII storage
- Anonymized metrics only
- No social media credentials
- GDPR compliant

---

## 📈 Performance Characteristics

### Latency Breakdown

| Operation | Time | Notes |
|-----------|------|-------|
| Deposit Funds | <1s | On-chain transaction |
| AI Verification | 2-3s | 4 ML models in parallel |
| Oracle Submission | 1-2s | Sign + broadcast |
| Transaction Confirm | ~1s | Qubic block time |
| **Total Flow** | **4-7s** | End-to-end |

### Scalability

**Throughput**
- AI Service: 100 req/min (single instance)
- Oracle Agent: 50 tx/min (rate limited)
- Smart Contract: Unlimited (Qubic capacity)

**Horizontal Scaling**
- AI Service: Load balancer + multiple instances
- Oracle Agent: Multiple agents with shared queue
- Smart Contract: Single instance (blockchain)

### Resource Usage

```
AI Service (Python):
- CPU: 10-20% average
- Memory: 200-500 MB
- Disk: <100 MB

Oracle Agent (Node.js):
- CPU: 5-10% average  
- Memory: 50-100 MB
- Disk: <50 MB

Smart Contract (Qubic):
- State: 256 bytes per escrow
- Compute: Minimal (<1ms per call)
```

---

## 🔗 Integration Points

### External Services

1. **Qubic RPC Endpoint**
   - URL: `https://testnet-rpc.qubic.org/`
   - Methods: `/tick`, `/broadcast`, `/query`
   - Auth: None (public testnet)

2. **Social Media APIs** (Future)
   - Instagram Graph API
   - Twitter API v2
   - TikTok API
   - YouTube Data API

3. **Analytics** (Future)
   - Google Analytics
   - Mixpanel
   - Custom metrics

### Internal APIs

**AI Service → Oracle**
```
POST /verify
Request: {postUrl, scenario}
Response: {overall_score, breakdown, flags}
```

**Frontend → Backend**
```
GET /contract/state
GET /verification/history
POST /campaign/create
```

---

## 🎯 Design Decisions

### Why Qubic?

1. **Zero Fees**: Perfect for microtransactions
2. **Fast Finality**: ~1 second confirmation
3. **Smart Contracts**: Turing-complete logic
4. **Feeless Oracle**: No cost for score submission

### Why Off-Chain AI?

1. **Complexity**: ML models too complex for on-chain
2. **Cost**: Would be expensive on fee-based chains
3. **Flexibility**: Easy to update/improve models
4. **Privacy**: Sensitive analysis off-chain

### Why Oracle Pattern?

1. **Bridge**: Connects off-chain data to on-chain logic
2. **Trust**: Single point of truth for verification
3. **Efficiency**: One transaction vs many
4. **Security**: Authorized entity only

---

## 🚀 Future Enhancements

### Phase 2 (Q1 2025)
- Multi-signature oracle (3-of-5)
- Real-time social media API integration
- Advanced ML models (GPT-4 for content analysis)
- Mobile app (React Native)

### Phase 3 (Q2 2025)
- Decentralized oracle network
- Cross-chain support (Ethereum, Polygon)
- Reputation system for influencers
- Automated campaign management

### Phase 4 (Q3 2025)
- DAO governance
- Staking mechanism
- Insurance fund for disputes
- White-label solution for agencies

---

**Architecture Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production-Ready for Hackathon Demo