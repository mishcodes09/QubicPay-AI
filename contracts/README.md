# 🔐 Qubic Smart Escrow Contract

This directory contains the on-chain smart contract for the AI-verified influencer marketing escrow system.

## 📁 Directory Structure

```
contract/
├── src/
│   └── escrow.qpi           # Main contract (C++)
├── deploy/
│   ├── deploy.sh            # Deployment script
│   ├── config.json          # Network configuration
│   └── deployment-result.json  # Deployment output
├── test/
│   └── escrow.test.cpp      # Contract test suite
└── README.md                # This file
```

## 🎯 Contract Overview

The Qubic Smart Escrow contract provides trustless, AI-verified payment settlement for influencer marketing campaigns.

### Key Features

- ✅ **Zero Transaction Fees** - Leveraging Qubic's feeless architecture
- ✅ **AI-Verified Payments** - Only releases funds if verification score ≥ 95/100
- ✅ **Fraud Protection** - Automatic refunds if bot activity detected
- ✅ **Trustless Escrow** - No intermediary needed
- ✅ **Authorized Oracle** - Only designated oracle can submit scores

### Contract Procedures

| Procedure | Description | Caller |
|-----------|-------------|--------|
| `setOracleId` | Authorize oracle (one-time) | Contract owner |
| `depositFunds` | Lock payment in escrow | Brand |
| `setVerificationScore` | Submit AI score (0-100) | Oracle only |
| `releasePayment` | Pay influencer if score ≥ 95 | Anyone |
| `refundFunds` | Refund brand if score < 95 | Anyone |
| `getContractState` | Query contract state | Anyone |

## 🚀 Quick Start

### Prerequisites

```bash
# Install Qubic CLI
npm install -g @qubic-lib/cli

# Or build from source
git clone https://github.com/qubic/qubic-cli
cd qubic-cli && npm install && npm run build
```

### Deploy Contract

```bash
# Make deploy script executable
chmod +x deploy/deploy.sh

# Deploy to testnet
./deploy/deploy.sh testnet

# Deploy to mainnet (use with caution!)
./deploy/deploy.sh mainnet
```

### Post-Deployment Setup

After deployment, you must authorize the oracle:

```bash
# Set the oracle ID (one-time operation)
qubic-cli call <CONTRACT_ID> setOracleId \
  --args <ORACLE_PUBLIC_KEY> \
  --key <DEPLOYER_PRIVATE_KEY> \
  --network testnet
```

## 📝 Contract State

The contract maintains the following state:

```cpp
struct CONTRACT_STATE {
    id brandId;              // Brand wallet address
    id influencerId;         // Influencer wallet address
    id oracleId;            // Authorized oracle
    sint64 escrowBalance;    // Locked payment (after fee)
    sint64 platformFee;      // 3% platform fee
    uint8 requiredScore;     // Threshold (default: 95)
    uint8 verificationScore; // AI score (0-100)
    uint32 retentionEndTick; // When retention period ends
    uint32 depositTick;      // When funds deposited
    bool isActive;           // Contract active
    bool isVerified;         // Score submitted
    bool isPaid;             // Payment released
    bool isRefunded;         // Funds refunded
    bool oracleSet;          // Oracle authorized
}
```

## 🔄 Complete Flow

### Success Case (Score ≥ 95)

```
1. Brand → depositFunds(100k QUBIC, influencerId, 7 days)
   ├─ Lock 97k in escrow (3k platform fee)
   └─ Set retention period end tick

2. Oracle → setVerificationScore(96)
   └─ AI analysis: 96/100 (APPROVED)

3. Wait for retention period (7 days)

4. Anyone → releasePayment()
   ├─ Transfer 97k QUBIC to influencer
   ├─ Transfer 3k fee to platform
   └─ Mark as paid
```

### Fraud Case (Score < 95)

```
1. Brand → depositFunds(100k QUBIC, influencerId, 7 days)
   └─ Lock funds in escrow

2. Oracle → setVerificationScore(42)
   └─ AI analysis: 42/100 (BOT FRAUD)

3. Anyone → refundFunds()
   ├─ Transfer 100k back to brand (full refund)
   └─ Mark as refunded
```

## 🧪 Testing

### Run Unit Tests

```bash
cd test
make test

# Or compile and run manually
g++ -o escrow_test escrow.test.cpp -lqpi_test
./escrow_test
```

### Test Scenarios

The test suite covers:

1. ✅ Oracle authorization
2. ✅ Fund deposit (success & failure cases)
3. ✅ Verification score submission (authorized & unauthorized)
4. ✅ Payment release (various score thresholds)
5. ✅ Refund processing (fraud detection)
6. ✅ State queries
7. ✅ Complete end-to-end flows

### Example Test Output

```
═══════════════════════════════════════════════════
  Qubic Smart Escrow - Contract Test Suite
═══════════════════════════════════════════════════

✓ TestSetOracleId passed
✓ TestDepositFundsSuccess passed
✓ TestDepositFundsNoOracle passed
✓ TestSetVerificationScoreSuccess passed
✓ TestSetVerificationScoreUnauthorized passed
✓ TestReleasePaymentSuccess passed
✓ TestReleasePaymentLowScore passed
✓ TestRefundFundsFraudDetected passed
✓ TestRefundFundsHighScore passed
✓ TestGetContractState passed
✓ TestCompleteFlowSuccess passed
✓ TestCompleteFlowFraud passed

═══════════════════════════════════════════════════
  Test Results: 12 passed, 0 failed
═══════════════════════════════════════════════════
```

## 🔐 Security Features

### 1. Oracle Authorization
- Oracle can only be set ONCE by contract deployer
- Only authorized oracle can submit verification scores
- Prevents unauthorized score manipulation

### 2. State Validation
- Strict checks on all state transitions
- Cannot pay and refund simultaneously
- Cannot change state after finalization

### 3. Score Threshold
- Hardcoded 95/100 minimum score
- No way to lower threshold after deployment
- Ensures consistent quality standards

### 4. Time Locks
- Retention period must be ≥7 days
- Payment cannot release before retention ends
- Gives influencer time to maintain engagement

### 5. Refund Protection
- Brand can recover funds if fraud detected
- Full refund including platform fee
- No loss of funds due to bot engagement

## 📊 Fee Structure

```
Deposit Amount:      100,000 QUBIC
Platform Fee (3%):    -3,000 QUBIC
Escrow Balance:       97,000 QUBIC
─────────────────────────────────
If Approved:
  → Influencer:       97,000 QUBIC
  → Platform:          3,000 QUBIC

If Fraud Detected:
  → Brand Refund:    100,000 QUBIC
  → Platform:              0 QUBIC
```

## 🎮 Manual Testing

### 1. Query Contract State

```bash
qubic-cli query <CONTRACT_ID> getContractState --network testnet
```

### 2. Simulate Brand Deposit

```bash
qubic-cli call <CONTRACT_ID> depositFunds \
  --args amount=100000,influencerId=<INFLUENCER_ID>,retentionDays=7 \
  --key <BRAND_PRIVATE_KEY> \
  --network testnet
```

### 3. Simulate Oracle Score Submission

```bash
qubic-cli call <CONTRACT_ID> setVerificationScore \
  --args score=96 \
  --key <ORACLE_PRIVATE_KEY> \
  --network testnet
```

### 4. Trigger Payment Release

```bash
# Wait until retention period ends, then:
qubic-cli call <CONTRACT_ID> releasePayment \
  --key <ANY_WALLET> \
  --network testnet
```

## 🔍 Monitoring & Events

The contract emits events for all major state changes:

```cpp
"Oracle authorized"
"Funds deposited successfully"
"Verification score set"
"Payment released to influencer"
"Funds refunded to brand"
```

Monitor these using Qubic's event system:

```bash
qubic-cli watch-events <CONTRACT_ID> --network testnet
```

## 🐛 Troubleshooting

### "Oracle not yet authorized"
```bash
# Solution: Set oracle first
qubic-cli call <CONTRACT_ID> setOracleId --args <ORACLE_KEY>
```

### "Contract already active"
```bash
# Solution: Wait for current escrow to complete or use new contract
```

### "Score too low"
```bash
# Solution: Score < 95, use refundFunds instead of releasePayment
qubic-cli call <CONTRACT_ID> refundFunds
```

### "Retention period not ended"
```bash
# Solution: Wait until retentionEndTick passes
qubic-cli query <CONTRACT_ID> getContractState
# Check current tick vs retentionEndTick
```

## 📈 Performance

- **Deployment Cost**: ~0 QUBIC (IPO-based)
- **Transaction Fee**: 0 QUBIC (feeless)
- **Confirmation Time**: ~1 second
- **State Size**: 256 bytes
- **Gas/Compute**: Minimal (simple logic)

## 🔗 Integration

### From Backend (Oracle Agent)

```typescript
import { QubicClient, TransactionBuilder } from './qubic-lib';

const client = new QubicClient(RPC_ENDPOINT);
const txBuilder = new TransactionBuilder();

// Build transaction
const tx = txBuilder.buildSetVerificationScoreTransaction(
  CONTRACT_ID,
  score,
  currentTick
);

// Sign and broadcast
const signedTx = txBuilder.signTransaction(tx);
await client.broadcastTransaction(signedTx);
```

### From Frontend (React)

```typescript
import { QubicService } from './services/qubicService';

const qubic = new QubicService();

// Query state
const state = await qubic.getContractState(CONTRACT_ID);

// Deposit funds
await qubic.depositFunds(
  CONTRACT_ID,
  amount,
  influencerId,
  retentionDays
);
```

## 📚 Additional Resources

- **Qubic Documentation**: https://docs.qubic.org
- **QPI Reference**: https://docs.qubic.org/qpi
- **TypeScript Library**: https://github.com/qubic-lib/ts-library
- **Example Contracts**: https://github.com/qubic/smart-contracts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - See LICENSE file

---

**Built for Qubic Hackathon** | Zero-Fee Smart Contracts | AI-Powered Verification