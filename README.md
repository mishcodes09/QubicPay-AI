# 🛠 Qubic Smart Escrow - Complete Project Structure

## 📁 Directory Structure

```
qubic-smart-escrow/
│
├── contract/                           # Smart Contract (On-Chain)
│   ├── src/
│   │   └── escrow.qpi                 # Main escrow contract (C++)
│   ├── deploy/
│   │   ├── deploy.sh                  # Deployment script
│   │   └── config.json                # Network configuration
│   ├── test/
│   │   └── escrow.test.cpp           # Contract unit tests
│   └── README.md
│
├── backend/                            # Backend Services (Off-Chain)
│   │
│   ├── ai-verification/               # Python AI Service
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── ai_verifier.py        # Main AI scoring engine
│   │   │   ├── data_fetcher.py       # Social media data fetcher
│   │   │   ├── fraud_detector.py     # Fraud detection algorithms
│   │   │   ├── models/
│   │   │   │   ├── follower_check.py
│   │   │   │   ├── engagement_check.py
│   │   │   │   └── velocity_check.py
│   │   │   └── config.py             # Configuration
│   │   ├── tests/
│   │   │   └── test_ai_verifier.py
│   │   ├── requirements.txt          # Python dependencies
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── oracle-agent/                  # Node.js Oracle Service
│   │   ├── src/
│   │   │   ├── index.ts              # Main Oracle server
│   │   │   ├── qubicClient.ts        # Qubic network client
│   │   │   ├── transactionBuilder.ts # Build & sign transactions
│   │   │   ├── aiClient.ts           # AI service integration
│   │   │   ├── config.ts             # Oracle configuration
│   │   │   └── types.ts              # TypeScript types
│   │   ├── tests/
│   │   │   └── oracle.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── docker-compose.yml             # Run both services together
│
├── frontend/                           # React Dashboard
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── BrandDashboard.tsx
│   │   │   ├── InfluencerDashboard.tsx
│   │   │   ├── VerificationDisplay.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   └── ContractInteraction.tsx
│   │   ├── services/
│   │   │   ├── qubicService.ts       # Qubic blockchain interaction
│   │   │   ├── apiService.ts         # Backend API calls
│   │   │   └── walletService.ts      # Wallet management
│   │   ├── hooks/
│   │   │   ├── useQubicWallet.ts
│   │   │   └── useContractState.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── README.md
│
├── scripts/                            # Utility Scripts
│   ├── generate-wallets.js            # Generate Qubic wallets
│   ├── setup-testnet.sh               # Setup testnet environment
│   ├── demo-scenario.js               # Automated demo script
│   └── deploy-all.sh                  # Deploy all components
│
├── docs/                               # Documentation
│   ├── ARCHITECTURE.md                # System architecture
│   ├── API.md                         # API documentation
│   ├── DEPLOYMENT.md                  # Deployment guide
│   ├── DEMO.md                        # Demo script for judges
│   └── TROUBLESHOOTING.md
│
├── config/                             # Configuration Files
│   ├── wallets.json                   # Test wallet addresses
│   ├── contract-addresses.json        # Deployed contract info
│   └── ai-thresholds.json             # Verification score rules
│
├── tests/                              # Integration Tests
│   ├── integration/
│   │   ├── full-flow.test.js
│   │   └── fraud-detection.test.js
│   └── e2e/
│       └── user-flow.test.js
│
├── .env.example                        # Environment variables template
├── .gitignore
├── docker-compose.yml                  # Full stack setup
├── LICENSE
└── README.md                           # Project overview
```

---

## 🔧 Component Details

### 1️⃣ SMART CONTRACT (`/contract`)

**Technology:** C++ with Qubic Programming Interface (QPI)

**Key Files:**
- `escrow.qpi` - Main smart contract with 5 procedures
- `deploy.sh` - Automated deployment to Qubic testnet

**Functions:**
1. `depositFunds()` - Brand locks payment
2. `setVerificationScore()` - Oracle updates AI score
3. `releasePayment()` - Auto-release if verified
4. `refundFunds()` - Return funds if fraud detected
5. `setOracleId()` - One-time oracle authorization

**Setup:**
```bash
cd contract
# Install Qubic CLI
npm install -g @qubic-lib/cli

# Deploy to testnet
./deploy/deploy.sh --network testnet
```

---

### 2️⃣ AI VERIFICATION SERVICE (`/backend/ai-verification`)

**Technology:** Python 3.9+ with Pandas, NumPy, Scikit-learn

**Key Files:**
- `ai_verifier.py` - Main AI engine
- `data_fetcher.py` - Social media data collection
- `fraud_detector.py` - 4 fraud detection algorithms

**Features:**
- Fake follower detection (bot signals)
- Engagement quality analysis (spam comments)
- Velocity anomaly detection (sudden spikes)
- Geo-location mismatch detection

**Setup:**
```bash
cd backend/ai-verification
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run service
python src/ai_verifier.py
```

**API Endpoint:**
```
POST /verify
{
  "post_url": "https://instagram.com/p/...",
  "scenario": "legitimate"
}

Response:
{
  "overall_score": 96,
  "breakdown": {...},
  "fraud_flags": [],
  "recommendation": "APPROVED_FOR_PAYMENT"
}
```

---

### 3️⃣ ORACLE AGENT (`/backend/oracle-agent`)

**Technology:** Node.js 18+ with TypeScript

**Key Files:**
- `index.ts` - Main Oracle service
- `qubicClient.ts` - Blockchain interaction
- `transactionBuilder.ts` - Transaction signing

**Responsibilities:**
1. Monitor for new escrows
2. Call AI verification service
3. Sign transactions with Oracle key
4. Submit scores to smart contract

**Setup:**
```bash
cd backend/oracle-agent
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Run service
npm run dev
```

**Environment Variables:**
```env
QUBIC_RPC_ENDPOINT=https://testnet-rpc.qubic.org/
CONTRACT_ID=your_contract_id
ORACLE_PRIVATE_KEY=your_private_key
ORACLE_PUBLIC_KEY=your_public_key
AI_SERVICE_URL=http://localhost:5000
```

---

### 4️⃣ FRONTEND DASHBOARD (`/frontend`)

**Technology:** React 18 + TypeScript + TailwindCSS

**Key Features:**
- Wallet connection (Brand & Influencer)
- Contract deployment interface
- Real-time AI verification display
- Transaction history
- Payment settlement

**Setup:**
```bash
cd frontend
npm install

# Run development server
npm start

# Build for production
npm run build
```

**Available Scripts:**
- `npm start` - Development server (port 3000)
- `npm test` - Run tests
- `npm run build` - Production build

---

## 🚀 Quick Start Guide

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/your-org/qubic-smart-escrow.git
cd qubic-smart-escrow

# Start all services
docker-compose up

# Services will be available at:
# - Frontend: http://localhost:3000
# - AI Service: http://localhost:5000
# - Oracle Agent: http://localhost:8080
```

### Option 2: Manual Setup

```bash
# 1. Deploy Smart Contract
cd contract
./deploy/deploy.sh

# 2. Start AI Service
cd ../backend/ai-verification
python src/ai_verifier.py &

# 3. Start Oracle Agent
cd ../oracle-agent
npm run dev &

# 4. Start Frontend
cd ../../frontend
npm start
```

---

## 📋 Development Workflow

### Phase 1: Local Development (Hours 0-4)
```bash
# Generate test wallets
node scripts/generate-wallets.js

# This creates:
# - Brand wallet
# - Influencer wallet
# - Oracle wallet
```

### Phase 2: Contract Deployment (Hours 4-10)
```bash
# Deploy to Qubic testnet
cd contract
./deploy/deploy.sh --network testnet

# Test contract functions
npm test
```

### Phase 3: Backend Integration (Hours 10-28)
```bash
# Start AI service
cd backend/ai-verification
python src/ai_verifier.py

# Start Oracle agent
cd ../oracle-agent
npm run dev

# Test integration
npm run test:integration
```

### Phase 4: Frontend Demo (Hours 28-38)
```bash
# Build frontend
cd frontend
npm run build

# Test full flow
npm run test:e2e
```

### Phase 5: Presentation (Hours 38-48)
```bash
# Run demo scenario
node scripts/demo-scenario.js

# Record video
# Use OBS Studio or similar
```

---

## 🧪 Testing

### Unit Tests
```bash
# Contract tests
cd contract && npm test

# AI service tests
cd backend/ai-verification && pytest

# Oracle tests
cd backend/oracle-agent && npm test

# Frontend tests
cd frontend && npm test
```

### Integration Tests
```bash
# Full system test
npm run test:integration

# This tests:
# 1. Contract deployment
# 2. Fund deposit
# 3. AI verification
# 4. Oracle submission
# 5. Payment release
```

### E2E Tests
```bash
cd tests/e2e
npm run test:e2e

# Tests complete user flows:
# - Brand creates campaign
# - Influencer accepts
# - AI verifies
# - Payment releases
```

---

## 📊 Data Flow

```
┌─────────────────┐
│  Social Media   │
│     Post        │
└────────┬────────┘
         │
         ↓ (Scrape/API)
┌─────────────────┐
│  Data Fetcher   │
│   (Python)      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ AI Verification │
│    Service      │
│  (ai_verifier)  │
└────────┬────────┘
         │ (Score 0-100)
         ↓
┌─────────────────┐
│  Oracle Agent   │
│   (Node.js)     │
└────────┬────────┘
         │ (Signed TX)
         ↓
┌─────────────────┐
│ Qubic Network   │
│ Smart Contract  │
│   (escrow.qpi)  │
└────────┬────────┘
         │ (Zero-Fee)
         ↓
┌─────────────────┐
│   Influencer    │
│     Wallet      │
└─────────────────┘
```

---

## 🔑 Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contract | C++ (QPI) | On-chain escrow logic |
| AI Verification | Python | Fraud detection |
| Oracle | Node.js/TypeScript | Bridge to blockchain |
| Frontend | React/TailwindCSS | User interface |
| Blockchain | Qubic Testnet | Zero-fee transactions |

---

## 📈 Performance Metrics

- **Transaction Speed:** < 1 second (Qubic)
- **Transaction Fee:** 0 QUBIC (Zero fees)
- **AI Verification:** 2-3 seconds
- **Oracle Submission:** 1-2 seconds
- **Total Flow:** ~5-10 seconds end-to-end

---

## 🔒 Security Features

1. **Oracle Authorization:** Only authorized oracle can submit scores
2. **State Validation:** Smart contract validates all state transitions
3. **Threshold Enforcement:** 95/100 score required for payment
4. **Refund Protection:** Brand can reclaim funds if fraud detected
5. **Immutable Audit Trail:** All transactions on-chain

---

## 🎯 Demo Scenarios

### Scenario 1: Legitimate Campaign (Score: 96/100)
- Real followers with profile pictures
- Authentic, contextual comments
- Normal engagement velocity
- Geo-alignment with influencer
- **Result:** ✅ Payment released

### Scenario 2: Bot Fraud (Score: 42/100)
- Random username patterns
- Generic/spam comments
- Suspicious engagement spike
- Bot farm locations
- **Result:** ❌ Payment blocked, refund issued

### Scenario 3: Mixed Quality (Score: 78/100)
- Mix of real and fake engagement
- Some quality concerns
- Below 95 threshold
- **Result:** ⚠️ Manual review suggested

---

## 📝 Environment Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Qubic CLI
- Git

### Installation Steps

1. **Clone Repository**
```bash
git clone https://github.com/your-org/qubic-smart-escrow.git
cd qubic-smart-escrow
```

2. **Install Qubic CLI**
```bash
npm install -g @qubic-lib/cli
```

3. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Install Dependencies**
```bash
# Backend AI
cd backend/ai-verification && pip install -r requirements.txt

# Backend Oracle
cd ../oracle-agent && npm install

# Frontend
cd ../../frontend && npm install
```

5. **Start Services**
```bash
# Option 1: Docker
docker-compose up

# Option 2: Manual
npm run start:all
```

---

## 🏆 Hackathon Submission Checklist

- [ ] Smart contract deployed to Qubic testnet
- [ ] AI verification service running
- [ ] Oracle agent connected
- [ ] Frontend demo functional
- [ ] All 3 test scenarios working
- [ ] Video demo recorded (< 5 min)
- [ ] README with setup instructions
- [ ] GitHub repository public
- [ ] Live demo URL (optional)

---

## 📞 Support & Resources

- **Qubic Documentation:** https://docs.qubic.org
- **TypeScript Library:** https://github.com/qubic-lib/ts-library
- **Discord Community:** https://discord.gg/qubic
- **Testnet Faucet:** https://testnet.qubic.org/faucet

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Built with ❤️ for Qubic Hackathon**