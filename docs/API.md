# 📡 API Documentation

Complete API reference for the Qubic Smart Escrow platform.

---

## Base URLs

| Environment | AI Service | Oracle Agent | Frontend |
|-------------|-----------|--------------|----------|
| Development | `http://localhost:5000` | `http://localhost:8080` | `http://localhost:3000` |
| Testnet | `https://ai.qubic-escrow.testnet` | `https://oracle.qubic-escrow.testnet` | `https://app.qubic-escrow.testnet` |
| Production | `https://ai.qubic-escrow.io` | `https://oracle.qubic-escrow.io` | `https://app.qubic-escrow.io` |

---

## 🤖 AI Verification Service

Base URL: `http://localhost:5000`

### Health Check

Check if the AI service is running.

**Endpoint**: `GET /health`

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "AI Verification Service",
  "version": "1.0.0"
}
```

**Example**:
```bash
curl http://localhost:5000/health
```

---

### Verify Post

Submit a social media post for AI verification.

**Endpoint**: `POST /verify`

**Request Body**:
```json
{
  "post_url": "https://instagram.com/p/ABC123",
  "scenario": "legitimate"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `post_url` | string | Yes | URL of the social media post |
| `scenario` | string | No | Test scenario: `legitimate`, `bot_fraud`, `mixed_quality` |

**Response**: `200 OK`
```json
{
  "overall_score": 96,
  "pass_threshold": 95,
  "passed": true,
  "recommendation": "APPROVED_FOR_PAYMENT",
  "confidence": "HIGH",
  "breakdown": {
    "follower_authenticity": {
      "score": 98,
      "weight": 0.30,
      "weighted_contribution": 29.4,
      "details": {
        "real_count": 980,
        "bot_count": 10,
        "suspicious_count": 10,
        "total_analyzed": 1000,
        "authenticity_percentage": 98.0,
        "flags": []
      }
    },
    "engagement_quality": {
      "score": 95,
      "weight": 0.35,
      "weighted_contribution": 33.25,
      "details": {
        "authentic_count": 85,
        "spam_count": 5,
        "generic_count": 10,
        "duplicate_count": 0,
        "total_analyzed": 100,
        "quality_percentage": 85.0,
        "flags": []
      }
    },
    "velocity_check": {
      "score": 100,
      "weight": 0.20,
      "weighted_contribution": 20.0,
      "details": {
        "current_velocity": 8.5,
        "historical_average": 8.2,
        "velocity_ratio": 1.04,
        "standard_deviations": 0.15,
        "time_since_post_hours": 12.0,
        "is_anomalous": false,
        "flags": []
      }
    },
    "geo_alignment": {
      "score": 90,
      "weight": 0.15,
      "weighted_contribution": 13.5,
      "details": {
        "follower_alignment": {
          "score": 95,
          "aligned_count": 850,
          "percentage": 85.0,
          "total": 1000
        },
        "engagement_alignment": {
          "score": 85,
          "aligned_count": 85,
          "percentage": 85.0,
          "total": 100
        },
        "bot_farm_followers": 20,
        "bot_farm_engagement": 5,
        "influencer_location": "United States",
        "expected_regions": ["United States", "Canada", "UK", "Australia"],
        "flags": []
      }
    }
  },
  "fraud_flags": [],
  "summary": "Excellent authenticity score (96.0/100). Campaign shows 980 genuine followers with 85 authentic interactions. All metrics within expected ranges.",
  "post_url": "https://instagram.com/p/ABC123",
  "scenario": "legitimate",
  "fetch_timestamp": "2024-12-06T10:30:00Z"
}
```

**Error Responses**:

`400 Bad Request`:
```json
{
  "error": "post_url is required"
}
```

`400 Bad Request`:
```json
{
  "error": "Unknown scenario: invalid_scenario"
}
```

`500 Internal Server Error`:
```json
{
  "error": "Internal server error"
}
```

**Example**:
```bash
curl -X POST http://localhost:5000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "post_url": "https://instagram.com/p/ABC123",
    "scenario": "legitimate"
  }'
```

---

### Get Scenarios

Get available test scenarios.

**Endpoint**: `GET /scenarios`

**Response**: `200 OK`
```json
{
  "scenarios": [
    {
      "name": "legitimate",
      "description": "Legitimate campaign with real engagement",
      "expected_score": "95-100"
    },
    {
      "name": "bot_fraud",
      "description": "Campaign with bot followers and fake engagement",
      "expected_score": "30-50"
    },
    {
      "name": "mixed_quality",
      "description": "Mixed campaign with some real and some fake engagement",
      "expected_score": "70-85"
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:5000/scenarios
```

---

### Get Thresholds

Get current verification thresholds and weights.

**Endpoint**: `GET /thresholds`

**Response**: `200 OK`
```json
{
  "thresholds": {
    "follower_authenticity_min": 85,
    "engagement_quality_min": 80,
    "velocity_anomaly_max": 2.5,
    "geo_alignment_min": 60,
    "overall_pass_score": 95
  },
  "weights": {
    "follower_authenticity": 0.30,
    "engagement_quality": 0.35,
    "velocity_check": 0.20,
    "geo_alignment": 0.15
  }
}
```

**Example**:
```bash
curl http://localhost:5000/thresholds
```

---

## 🔮 Oracle Agent

Base URL: `http://localhost:8080`

### Health Check

Check if the Oracle Agent is running.

**Endpoint**: `GET /health`

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "Qubic Oracle Agent",
  "isRunning": true,
  "lastProcessedTick": 123456789
}
```

**Example**:
```bash
curl http://localhost:8080/health
```

---

### Manual Verification

Manually trigger a verification (for testing).

**Endpoint**: `POST /verify`

**Request Body**:
```json
{
  "postUrl": "https://instagram.com/p/ABC123",
  "scenario": "legitimate"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "txId": "a1b2c3d4e5f6...",
  "score": 96,
  "aiResult": {
    "overall_score": 96,
    "passed": true,
    "recommendation": "APPROVED_FOR_PAYMENT"
  },
  "transaction": {
    "tick": 123456790,
    "inputType": 2
  }
}
```

**Error Responses**:

`400 Bad Request`:
```json
{
  "error": "postUrl is required"
}
```

`500 Internal Server Error`:
```json
{
  "error": "Verification failed"
}
```

**Example**:
```bash
curl -X POST http://localhost:8080/verify \
  -H "Content-Type: application/json" \
  -d '{
    "postUrl": "https://instagram.com/p/ABC123",
    "scenario": "legitimate"
  }'
```

---

### Get Oracle State

Get current oracle state and statistics.

**Endpoint**: `GET /state`

**Response**: `200 OK`
```json
{
  "lastProcessedTick": 123456789,
  "pendingCount": 2,
  "completedCount": 145
}
```

**Example**:
```bash
curl http://localhost:8080/state
```

---

## 🔗 Smart Contract Procedures

### setOracleId

Authorize the oracle (one-time operation).

**Caller**: Contract owner/deployer  
**Input Type**: 0  
**Payload**: Oracle public key (60 chars)

**Example**:
```bash
qubic-cli call <CONTRACT_ID> setOracleId \
  --args <ORACLE_PUBLIC_KEY> \
  --key <DEPLOYER_PRIVATE_KEY>
```

---

### depositFunds

Lock payment in escrow.

**Caller**: Brand  
**Input Type**: 1  
**Payload**:
```cpp
struct {
  sint64 amount;           // Payment amount
  id influencerId;         // Influencer address
  uint32 retentionDays;    // Post retention period
}
```

**Example**:
```bash
qubic-cli call <CONTRACT_ID> depositFunds \
  --args amount=100000,influencerId=<INFLUENCER_ID>,retentionDays=7 \
  --key <BRAND_PRIVATE_KEY>
```

---

### setVerificationScore

Submit AI verification score.

**Caller**: Oracle (authorized only)  
**Input Type**: 2  
**Payload**: `uint8 score` (0-100)

**Example**:
```bash
qubic-cli call <CONTRACT_ID> setVerificationScore \
  --args score=96 \
  --key <ORACLE_PRIVATE_KEY>
```

---

### releasePayment

Release funds to influencer (if score ≥95).

**Caller**: Anyone  
**Input Type**: 3  
**Payload**: None

**Conditions**:
- `verificationScore >= 95`
- `currentTick >= retentionEndTick`

**Example**:
```bash
qubic-cli call <CONTRACT_ID> releasePayment \
  --key <ANY_WALLET>
```

---

### refundFunds

Refund to brand (if score <95).

**Caller**: Anyone  
**Input Type**: 4  
**Payload**: None

**Conditions**:
- `verificationScore < 95`

**Example**:
```bash
qubic-cli call <CONTRACT_ID> refundFunds \
  --key <ANY_WALLET>
```

---

### getContractState

Query current contract state.

**Caller**: Anyone  
**Response**:
```cpp
struct {
  id brandId;
  id influencerId;
  id oracleId;
  sint64 escrowBalance;
  uint8 requiredScore;
  uint8 verificationScore;
  uint32 retentionEndTick;
  bool isActive;
  bool isVerified;
  bool isPaid;
  bool isRefunded;
}
```

**Example**:
```bash
qubic-cli query <CONTRACT_ID> getContractState
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing API key) |
| 404 | Not Found (endpoint doesn't exist) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (maintenance) |

---

## 🔐 Authentication

### Current Implementation (Testnet)
No authentication required. Services are public for demonstration.

### Future Implementation (Production)

**API Keys**:
```http
Authorization: Bearer <api_key>
```

**Wallet Signatures**:
```http
X-Signature: <signed_message>
X-Public-Key: <wallet_public_key>
X-Timestamp: <unix_timestamp>
```

---

## 🚦 Rate Limits

| Service | Limit | Window | Headers |
|---------|-------|--------|---------|
| AI Service | 100 req | 1 min | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| Oracle Agent | 50 req | 1 min | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |

**Example Response Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701878400
```

**Rate Limit Exceeded**:
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

---

## 📝 Request/Response Examples

### Complete Verification Flow

**Step 1: Create Campaign (Frontend)**
```typescript
const response = await fetch('http://localhost:8080/campaign/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brandId: 'BRAND...',
    influencerId: 'INFLUENCER...',
    amount: 100000,
    retentionDays: 7
  })
});
```

**Step 2: Submit Post (Frontend)**
```typescript
await fetch('http://localhost:8080/campaign/submit-post', {
  method: 'POST',
  body: JSON.stringify({
    campaignId: 'campaign_123',
    postUrl: 'https://instagram.com/p/ABC123'
  })
});
```

**Step 3: Verify (Automatic via Oracle)**
```
Oracle Agent detects new post submission
  ↓
Calls AI Service: POST /verify
  ↓
Receives score: 96/100
  ↓
Submits to contract: setVerificationScore(96)
  ↓
Transaction confirmed
```

**Step 4: Check Status (Frontend)**
```typescript
const status = await fetch('http://localhost:8080/campaign/status/campaign_123');
// Returns: { score: 96, passed: true, status: 'PAYMENT_PENDING' }
```

**Step 5: Release Payment (Anyone)**
```bash
# After retention period ends
qubic-cli call <CONTRACT_ID> releasePayment
```

---

## 🧪 Testing with cURL

### Run All Tests
```bash
# 1. Health checks
curl http://localhost:5000/health
curl http://localhost:8080/health

# 2. Get scenarios
curl http://localhost:5000/scenarios

# 3. Test legitimate campaign
curl -X POST http://localhost:5000/verify \
  -H "Content-Type: application/json" \
  -d '{"post_url": "https://test.com/p/1", "scenario": "legitimate"}'

# 4. Test bot fraud
curl -X POST http://localhost:5000/verify \
  -H "Content-Type: application/json" \
  -d '{"post_url": "https://test.com/p/2", "scenario": "bot_fraud"}'

# 5. Test mixed quality
curl -X POST http://localhost:5000/verify \
  -H "Content-Type: application/json" \
  -d '{"post_url": "https://test.com/p/3", "scenario": "mixed_quality"}'
```

---

## 📦 SDK Examples (Future)

### JavaScript/TypeScript
```typescript
import { QubicEscrow } from '@qubic-escrow/sdk';

const escrow = new QubicEscrow({
  network: 'testnet',
  apiKey: 'your_api_key'
});

// Create campaign
const campaign = await escrow.createCampaign({
  brandId: 'BRAND...',
  influencerId: 'INFLUENCER...',
  amount: 100000,
  retentionDays: 7
});

// Submit for verification
await campaign.submitPost('https://instagram.com/p/ABC123');

// Check status
const status = await campaign.getStatus();
console.log(status.score, status.passed);
```

### Python
```python
from qubic_escrow import EscrowClient

client = EscrowClient(
    network='testnet',
    api_key='your_api_key'
)

# Create campaign
campaign = client.create_campaign(
    brand_id='BRAND...',
    influencer_id='INFLUENCER...',
    amount=100000,
    retention_days=7
)

# Submit post
campaign.submit_post('https://instagram.com/p/ABC123')

# Get status
status = campaign.get_status()
print(f"Score: {status.score}, Passed: {status.passed}")
```

---

## 🐛 Error Handling

### Best Practices

```typescript
try {
  const response = await fetch('/verify', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unknown error');
  }
  
  const data = await response.json();
  return data;
  
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Service not running');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('Request timeout');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

**API Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Stable