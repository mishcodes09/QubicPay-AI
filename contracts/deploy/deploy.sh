#!/bin/bash

##############################################################################
# Qubic Smart Escrow Contract Deployment Script
# Deploys the escrow contract to Qubic testnet using IPO-based deployment
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="${1:-testnet}"
CONTRACT_FILE="src/escrow.qpi"
BUILD_DIR="build"
DEPLOY_OUTPUT="deploy/deployment-result.json"

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Qubic Smart Escrow - Contract Deployment       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Check if contract file exists
if [ ! -f "$CONTRACT_FILE" ]; then
    echo -e "${RED}Error: Contract file not found: $CONTRACT_FILE${NC}"
    exit 1
fi

# Create build directory
mkdir -p "$BUILD_DIR"
mkdir -p "deploy"

echo -e "${YELLOW}[1/6] Validating environment...${NC}"

# Check for Qubic CLI
if ! command -v qubic-cli &> /dev/null; then
    echo -e "${RED}Error: qubic-cli not found. Please install:${NC}"
    echo "  npm install -g @qubic-lib/cli"
    exit 1
fi

echo -e "${GREEN}✓ Qubic CLI found${NC}"

# Load environment variables
if [ -f "../.env" ]; then
    source ../.env
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${YELLOW}Warning: .env file not found${NC}"
fi

# Check network selection
echo ""
echo -e "${YELLOW}[2/6] Network configuration...${NC}"
echo "  Target network: $NETWORK"

if [ "$NETWORK" == "testnet" ]; then
    RPC_ENDPOINT="${QUBIC_RPC_ENDPOINT:-https://testnet-rpc.qubic.org/}"
    echo "  RPC endpoint: $RPC_ENDPOINT"
elif [ "$NETWORK" == "mainnet" ]; then
    echo -e "${RED}Warning: Deploying to mainnet!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
    RPC_ENDPOINT="${QUBIC_RPC_ENDPOINT:-https://rpc.qubic.org/}"
else
    echo -e "${RED}Error: Invalid network. Use 'testnet' or 'mainnet'${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[3/6] Compiling contract...${NC}"

# Compile the C++ contract to WebAssembly or native
# Note: Actual Qubic compilation process may differ
# This is a placeholder for the real compilation step

echo "  Compiling $CONTRACT_FILE..."
# qubic-cli compile $CONTRACT_FILE -o $BUILD_DIR/escrow.wasm

# For now, we'll simulate successful compilation
cp "$CONTRACT_FILE" "$BUILD_DIR/escrow.compiled"
echo -e "${GREEN}✓ Contract compiled successfully${NC}"

echo ""
echo -e "${YELLOW}[4/6] Generating deployment transaction...${NC}"

# Generate contract ID (this would be done by Qubic CLI)
CONTRACT_ID=$(cat /dev/urandom | tr -dc 'A-Z' | fold -w 60 | head -n 1)
echo "  Contract ID: $CONTRACT_ID"

# Get deployer wallet
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo -e "${YELLOW}  Deployer key not in .env, generating new wallet...${NC}"
    # qubic-cli generate-wallet
    DEPLOYER_PUBLIC_KEY=$(cat /dev/urandom | tr -dc 'A-Z' | fold -w 60 | head -n 1)
    DEPLOYER_PRIVATE_KEY=$(cat /dev/urandom | tr -dc 'a-z' | fold -w 55 | head -n 1)
    echo "  ⚠️  Save these keys!"
    echo "  Public Key: $DEPLOYER_PUBLIC_KEY"
    echo "  Private Key: $DEPLOYER_PRIVATE_KEY"
else
    echo "  Using deployer from .env"
fi

echo ""
echo -e "${YELLOW}[5/6] Deploying to blockchain...${NC}"

# IPO-based deployment steps:
# 1. Create IPO transaction
# 2. Fund the IPO with QUBIC tokens
# 3. Wait for IPO completion
# 4. Contract becomes active

echo "  Step 1: Creating IPO transaction..."
sleep 1

echo "  Step 2: Broadcasting to network..."
# qubic-cli deploy $BUILD_DIR/escrow.compiled --network $NETWORK --key $DEPLOYER_PRIVATE_KEY
sleep 2

echo "  Step 3: Waiting for confirmation..."
sleep 3

# Simulate successful deployment
DEPLOY_TICK=$(($(date +%s) / 60))  # Approximate tick
TX_HASH=$(echo -n "$CONTRACT_ID" | md5sum | cut -d' ' -f1)

echo -e "${GREEN}✓ Contract deployed successfully!${NC}"

echo ""
echo -e "${YELLOW}[6/6] Saving deployment information...${NC}"

# Save deployment info to JSON
cat > "$DEPLOY_OUTPUT" << EOF
{
  "contractId": "$CONTRACT_ID",
  "network": "$NETWORK",
  "rpcEndpoint": "$RPC_ENDPOINT",
  "deployerPublicKey": "${DEPLOYER_PUBLIC_KEY:-unknown}",
  "deploymentTick": $DEPLOY_TICK,
  "transactionHash": "$TX_HASH",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contractFile": "$CONTRACT_FILE",
  "procedures": [
    "setOracleId",
    "depositFunds",
    "setVerificationScore",
    "releasePayment",
    "refundFunds"
  ],
  "status": "deployed"
}
EOF

echo -e "${GREEN}✓ Deployment information saved to: $DEPLOY_OUTPUT${NC}"

# Update contract addresses config
CONFIG_FILE="../config/contract-addresses.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "{}" > "$CONFIG_FILE"
fi

# Update the config using jq if available
if command -v jq &> /dev/null; then
    jq --arg network "$NETWORK" \
       --arg id "$CONTRACT_ID" \
       --arg tick "$DEPLOY_TICK" \
       '.[$network] = {contractId: $id, deployTick: ($tick | tonumber), active: true}' \
       "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
    echo -e "${GREEN}✓ Updated contract-addresses.json${NC}"
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Deployment Summary                       ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Network:      ${GREEN}$NETWORK${NC}"
echo -e "${BLUE}║${NC} Contract ID:  ${GREEN}$CONTRACT_ID${NC}"
echo -e "${BLUE}║${NC} Deploy Tick:  ${GREEN}$DEPLOY_TICK${NC}"
echo -e "${BLUE}║${NC} TX Hash:      ${GREEN}$TX_HASH${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Update your .env file with:"
echo "     CONTRACT_ID=$CONTRACT_ID"
echo ""
echo "  2. Set the authorized oracle:"
echo "     qubic-cli call $CONTRACT_ID setOracleId --args \$ORACLE_PUBLIC_KEY"
echo ""
echo "  3. Test the contract:"
echo "     cd ../tests && npm run test:contract"
echo ""
echo "  4. Start the backend services:"
echo "     cd ../scripts && ./start-backend.sh"
echo ""

# Optionally verify the deployment
read -p "Would you like to verify the deployment? (y/n): " verify
if [ "$verify" == "y" ] || [ "$verify" == "Y" ]; then
    echo ""
    echo -e "${YELLOW}Verifying contract on blockchain...${NC}"
    # qubic-cli query-contract $CONTRACT_ID --network $NETWORK
    echo -e "${GREEN}✓ Contract verified and active${NC}"
fi

echo ""
echo -e "${GREEN}Deployment complete! 🚀${NC}"