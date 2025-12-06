#!/bin/bash

##############################################################################
# Setup Testnet Environment
# Prepares the entire project for testnet deployment
##############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Qubic Smart Escrow - Testnet Setup          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT=$(pwd)

# ============================================================================
# Check Prerequisites
# ============================================================================
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required. Current: $(node --version)${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js $(node --version)${NC}"

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}✗ Python not found. Please install Python 3.9+${NC}"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)
echo -e "${GREEN}  ✓ Python $($PYTHON_CMD --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ npm $(npm --version)${NC}"

# ============================================================================
# Generate Wallets
# ============================================================================
echo ""
echo -e "${YELLOW}[2/8] Generating test wallets...${NC}"

if [ ! -f "config/wallets.json" ]; then
    node scripts/generate-wallets.js
    echo -e "${GREEN}  ✓ Wallets generated${NC}"
else
    echo -e "${CYAN}  ℹ Wallets already exist. Skipping...${NC}"
    read -p "  Regenerate wallets? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node scripts/generate-wallets.js
    fi
fi

# ============================================================================
# Setup Backend - AI Verification Service
# ============================================================================
echo ""
echo -e "${YELLOW}[3/8] Setting up AI Verification Service...${NC}"

cd "$PROJECT_ROOT/backend/ai-verification"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo -e "${CYAN}  Creating Python virtual environment...${NC}"
    $PYTHON_CMD -m venv venv
fi

# Activate and install
echo -e "${CYAN}  Installing Python dependencies...${NC}"
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo -e "${GREEN}  ✓ AI Service ready${NC}"
deactivate 2>/dev/null || true

# ============================================================================
# Setup Backend - Oracle Agent
# ============================================================================
echo ""
echo -e "${YELLOW}[4/8] Setting up Oracle Agent...${NC}"

cd "$PROJECT_ROOT/backend/oracle-agent"

if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}  Installing Node.js dependencies...${NC}"
    npm install --silent
else
    echo -e "${CYAN}  Updating dependencies...${NC}"
    npm update --silent
fi

echo -e "${CYAN}  Building TypeScript...${NC}"
npm run build

echo -e "${GREEN}  ✓ Oracle Agent ready${NC}"

# ============================================================================
# Setup Frontend
# ============================================================================
echo ""
echo -e "${YELLOW}[5/8] Setting up Frontend...${NC}"

cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}  Installing dependencies...${NC}"
    npm install --silent
else
    echo -e "${CYAN}  Dependencies already installed${NC}"
fi

echo -e "${GREEN}  ✓ Frontend ready${NC}"

# ============================================================================
# Setup Contract Environment
# ============================================================================
echo ""
echo -e "${YELLOW}[6/8] Preparing contract deployment...${NC}"

cd "$PROJECT_ROOT/contract"

# Create build directory
mkdir -p build
mkdir -p deploy

echo -e "${GREEN}  ✓ Contract environment ready${NC}"

# ============================================================================
# Setup Configuration Files
# ============================================================================
echo ""
echo -e "${YELLOW}[7/8] Creating configuration files...${NC}"

cd "$PROJECT_ROOT"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
# Qubic Network Configuration
QUBIC_RPC_ENDPOINT=https://testnet-rpc.qubic.org/
NETWORK_ID=1
CONTRACT_ID=

# AI Service
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_TIMEOUT=30000

# Oracle Configuration
POLLING_INTERVAL_MS=5000
MAX_RETRIES=3
BATCH_SIZE=10

# Server Configuration
PORT=8080
HOST=0.0.0.0
API_PORT=5000
API_HOST=0.0.0.0

# Logging
LOG_LEVEL=info
DEBUG=False
EOF
    echo -e "${GREEN}  ✓ Created .env file${NC}"
else
    echo -e "${CYAN}  ℹ .env file already exists${NC}"
fi

# Create config directory
mkdir -p config

# Create logs directory
mkdir -p logs
touch logs/.gitkeep

echo -e "${GREEN}  ✓ Configuration files ready${NC}"

# ============================================================================
# Verify Setup
# ============================================================================
echo ""
echo -e "${YELLOW}[8/8] Verifying setup...${NC}"

ERRORS=0

# Check AI Service
if [ -d "backend/ai-verification/venv" ]; then
    echo -e "${GREEN}  ✓ AI Service: Virtual environment${NC}"
else
    echo -e "${RED}  ✗ AI Service: Virtual environment missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Oracle Agent
if [ -d "backend/oracle-agent/dist" ]; then
    echo -e "${GREEN}  ✓ Oracle Agent: Built successfully${NC}"
else
    echo -e "${RED}  ✗ Oracle Agent: Build failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Frontend
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}  ✓ Frontend: Dependencies installed${NC}"
else
    echo -e "${RED}  ✗ Frontend: Dependencies missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Wallets
if [ -f "config/wallets.json" ]; then
    echo -e "${GREEN}  ✓ Wallets: Generated${NC}"
else
    echo -e "${RED}  ✗ Wallets: Not generated${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check .env
if [ -f ".env" ]; then
    echo -e "${GREEN}  ✓ Configuration: .env file present${NC}"
else
    echo -e "${RED}  ✗ Configuration: .env file missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Setup Summary                        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ Testnet setup complete!${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} Review generated wallets:"
    echo -e "   ${BLUE}cat config/wallets.json${NC}"
    echo ""
    echo -e "${YELLOW}2.${NC} Deploy smart contract:"
    echo -e "   ${BLUE}cd contract && ./deploy/deploy.sh testnet${NC}"
    echo ""
    echo -e "${YELLOW}3.${NC} Start all services:"
    echo -e "   ${BLUE}./scripts/start-all.sh${NC}"
    echo ""
    echo -e "${YELLOW}4.${NC} Run demo scenario:"
    echo -e "   ${BLUE}node scripts/demo-scenario.js${NC}"
    echo ""
    echo -e "${CYAN}Testnet Endpoints:${NC}"
    echo -e "  AI Service:    ${GREEN}http://localhost:5000${NC}"
    echo -e "  Oracle Agent:  ${GREEN}http://localhost:8080${NC}"
    echo -e "  Frontend:      ${GREEN}http://localhost:3000${NC}"
    echo ""
else
    echo -e "${RED}✗ Setup completed with $ERRORS error(s)${NC}"
    echo ""
    echo -e "${YELLOW}Please fix the errors above and run this script again.${NC}"
    echo ""
    exit 1
fi

# ============================================================================
# Optional: Fund wallets from faucet
# ============================================================================
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
read -p "Would you like to fund wallets from testnet faucet? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Opening testnet faucet...${NC}"
    echo -e "${CYAN}Faucet URL: https://testnet.qubic.org/faucet${NC}"
    echo ""
    echo -e "${YELLOW}Use these addresses:${NC}"
    
    # Extract public keys from wallets.json
    if command -v jq &> /dev/null; then
        echo -e "  Brand:      ${GREEN}$(jq -r '.brand.publicKey' config/wallets.json)${NC}"
        echo -e "  Influencer: ${GREEN}$(jq -r '.influencer.publicKey' config/wallets.json)${NC}"
        echo -e "  Oracle:     ${GREEN}$(jq -r '.oracle.publicKey' config/wallets.json)${NC}"
    else
        echo -e "${CYAN}  (Install jq to see addresses here)${NC}"
        echo -e "  Or view: ${YELLOW}cat config/wallets.json${NC}"
    fi
    
    # Try to open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://testnet.qubic.org/faucet" 2>/dev/null
    elif command -v open &> /dev/null; then
        open "https://testnet.qubic.org/faucet" 2>/dev/null
    fi
fi

echo ""
echo -e "${GREEN}Setup complete! Happy hacking! 🚀${NC}"
echo ""