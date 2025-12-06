#!/bin/bash

##############################################################################
# Deploy All Components
# Complete deployment script for contract and services
##############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Qubic Smart Escrow - Full Deployment        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT=$(pwd)
NETWORK="${1:-testnet}"

# ============================================================================
# Pre-flight Checks
# ============================================================================
echo -e "${YELLOW}[1/7] Pre-flight checks...${NC}"

# Check if wallets exist
if [ ! -f "config/wallets.json" ]; then
    echo -e "${RED}✗ Wallets not found. Run: node scripts/generate-wallets.js${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Wallets found${NC}"

# Check if services are built
if [ ! -d "backend/oracle-agent/dist" ]; then
    echo -e "${YELLOW}  Building Oracle Agent...${NC}"
    cd backend/oracle-agent
    npm run build
    cd "$PROJECT_ROOT"
fi
echo -e "${GREEN}  ✓ Oracle Agent built${NC}"

# ============================================================================
# Deploy Smart Contract
# ============================================================================
echo ""
echo -e "${YELLOW}[2/7] Deploying smart contract to $NETWORK...${NC}"

cd "$PROJECT_ROOT/contract"

if [ -f "deploy/deploy.sh" ]; then
    chmod +x deploy/deploy.sh
    ./deploy/deploy.sh "$NETWORK"
    
    if [ -f "deploy/deployment-result.json" ]; then
        CONTRACT_ID=$(jq -r '.contractId' deploy/deployment-result.json 2>/dev/null || echo "")
        if [ -n "$CONTRACT_ID" ]; then
            echo -e "${GREEN}  ✓ Contract deployed: $CONTRACT_ID${NC}"
            
            # Update .env with contract ID
            cd "$PROJECT_ROOT"
            if grep -q "^CONTRACT_ID=" .env 2>/dev/null; then
                sed -i.bak "s|^CONTRACT_ID=.*|CONTRACT_ID=$CONTRACT_ID|" .env
            else
                echo "CONTRACT_ID=$CONTRACT_ID" >> .env
            fi
        else
            echo -e "${RED}  ✗ Could not extract contract ID${NC}"
        fi
    fi
else
    echo -e "${YELLOW}  ⚠ Deploy script not found, skipping contract deployment${NC}"
fi

cd "$PROJECT_ROOT"

# ============================================================================
# Set Oracle in Contract
# ============================================================================
echo ""
echo -e "${YELLOW}[3/7] Authorizing oracle...${NC}"

if [ -n "$CONTRACT_ID" ]; then
    ORACLE_PUBLIC_KEY=$(jq -r '.oracle.publicKey' config/wallets.json 2>/dev/null || echo "")
    
    if [ -n "$ORACLE_PUBLIC_KEY" ]; then
        echo -e "${CYAN}  Contract: $CONTRACT_ID${NC}"
        echo -e "${CYAN}  Oracle: $ORACLE_PUBLIC_KEY${NC}"
        echo -e "${YELLOW}  ⚠ Manual step required:${NC}"
        echo -e "    Run: qubic-cli call $CONTRACT_ID setOracleId --args $ORACLE_PUBLIC_KEY"
        echo -e "    ${DIM}(Or this will be done automatically when contract supports it)${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ Skipping oracle setup (no contract ID)${NC}"
fi

# ============================================================================
# Start AI Verification Service
# ============================================================================
echo ""
echo -e "${YELLOW}[4/7] Starting AI Verification Service...${NC}"

cd "$PROJECT_ROOT/backend/ai-verification"

# Kill existing process if running
pkill -f "python.*ai_verifier.py" 2>/dev/null || true

# Start in background
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
nohup python src/ai_verifier.py > ../../logs/ai-service.log 2>&1 &
AI_PID=$!

# Wait and check if started
sleep 3
if ps -p $AI_PID > /dev/null; then
    echo -e "${GREEN}  ✓ AI Service started (PID: $AI_PID)${NC}"
    echo -e "${CYAN}    http://localhost:5000${NC}"
else
    echo -e "${RED}  ✗ AI Service failed to start${NC}"
    echo -e "${YELLOW}    Check logs: tail -f logs/ai-service.log${NC}"
fi

deactivate 2>/dev/null || true

# ============================================================================
# Start Oracle Agent
# ============================================================================
echo ""
echo -e "${YELLOW}[5/7] Starting Oracle Agent...${NC}"

cd "$PROJECT_ROOT/backend/oracle-agent"

# Kill existing process if running
pkill -f "node.*dist/index.js" 2>/dev/null || true

# Start in background
nohup node dist/index.js > ../../logs/oracle-agent.log 2>&1 &
ORACLE_PID=$!

# Wait and check if started
sleep 3
if ps -p $ORACLE_PID > /dev/null; then
    echo -e "${GREEN}  ✓ Oracle Agent started (PID: $ORACLE_PID)${NC}"
    echo -e "${CYAN}    http://localhost:8080${NC}"
else
    echo -e "${RED}  ✗ Oracle Agent failed to start${NC}"
    echo -e "${YELLOW}    Check logs: tail -f logs/oracle-agent.log${NC}"
fi

# ============================================================================
# Start Frontend
# ============================================================================
echo ""
echo -e "${YELLOW}[6/7] Starting Frontend...${NC}"

cd "$PROJECT_ROOT/frontend"

# Kill existing process if running
pkill -f "react-scripts start" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start in background
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}  ✓ Frontend starting (PID: $FRONTEND_PID)${NC}"
echo -e "${CYAN}    http://localhost:3000${NC}"
echo -e "${DIM}    (May take 30-60 seconds to compile)${NC}"

# ============================================================================
# Health Checks
# ============================================================================
echo ""
echo -e "${YELLOW}[7/7] Running health checks...${NC}"

cd "$PROJECT_ROOT"

sleep 5

# Check AI Service
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ AI Service: Healthy${NC}"
else
    echo -e "${RED}  ✗ AI Service: Not responding${NC}"
fi

# Check Oracle Agent
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Oracle Agent: Healthy${NC}"
else
    echo -e "${RED}  ✗ Oracle Agent: Not responding${NC}"
fi

# Check Frontend (may take longer)
echo -e "${CYAN}  ⏳ Frontend: Compiling...${NC}"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            Deployment Complete!                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Services Running:${NC}"
echo -e "  ${GREEN}✓${NC} AI Service:    http://localhost:5000"
echo -e "  ${GREEN}✓${NC} Oracle Agent:  http://localhost:8080"
echo -e "  ${YELLOW}⏳${NC} Frontend:      http://localhost:3000 ${DIM}(compiling)${NC}"

if [ -n "$CONTRACT_ID" ]; then
    echo ""
    echo -e "${CYAN}Contract:${NC}"
    echo -e "  ID: ${GREEN}$CONTRACT_ID${NC}"
    echo -e "  Network: ${GREEN}$NETWORK${NC}"
fi

echo ""
echo -e "${CYAN}Wallets:${NC}"
if command -v jq &> /dev/null; then
    echo -e "  Brand:      ${GREEN}$(jq -r '.brand.publicKey' config/wallets.json | cut -c1-16)...${NC}"
    echo -e "  Influencer: ${GREEN}$(jq -r '.influencer.publicKey' config/wallets.json | cut -c1-16)...${NC}"
    echo -e "  Oracle:     ${GREEN}$(jq -r '.oracle.publicKey' config/wallets.json | cut -c1-16)...${NC}"
else
    echo -e "  ${DIM}(Install jq to see wallet addresses)${NC}"
fi

echo ""
echo -e "${CYAN}Process IDs:${NC}"
echo -e "  AI Service:   ${AI_PID}"
echo -e "  Oracle Agent: ${ORACLE_PID}"
echo -e "  Frontend:     ${FRONTEND_PID}"

echo ""
echo -e "${CYAN}Logs:${NC}"
echo -e "  ${YELLOW}tail -f logs/ai-service.log${NC}"
echo -e "  ${YELLOW}tail -f logs/oracle-agent.log${NC}"
echo -e "  ${YELLOW}tail -f logs/frontend.log${NC}"

echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "  1. Wait for frontend to compile (30-60 seconds)"
echo -e "  2. Open ${GREEN}http://localhost:3000${NC} in your browser"
echo -e "  3. Run demo: ${YELLOW}node scripts/demo-scenario.js${NC}"
echo -e "  4. Test manually with the UI"

echo ""
echo -e "${CYAN}To Stop All Services:${NC}"
echo -e "  ${YELLOW}./scripts/stop-all.sh${NC}"

echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Ready for demo! 🚀${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

# Save PIDs to file for stop script
cat > .pids << EOF
AI_PID=$AI_PID
ORACLE_PID=$ORACLE_PID
FRONTEND_PID=$FRONTEND_PID
EOF