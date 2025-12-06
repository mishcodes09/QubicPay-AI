# 🔧 Troubleshooting Guide

Complete troubleshooting guide for Qubic Smart Escrow platform.

---

## 🚨 Quick Fixes

### Services Won't Start
```bash
./scripts/stop-all.sh
./scripts/start-all.sh
```

### TypeScript Errors
```bash
./scripts/final-fix.sh
# Then: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Port Conflicts
```bash
lsof -ti:5000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Complete Reset
```bash
./scripts/stop-all.sh
rm -rf backend/*/node_modules backend/*/venv frontend/node_modules
./setup.sh
```

---

## 📋 Common Issues

### Issue 1: Python Virtual Environment Not Found

**Symptoms**:
```
bash: venv/bin/activate: No such file or directory
```

**Solution**:
```bash
cd backend/ai-verification
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Issue 2: Module Not Found Errors (Python)

**Symptoms**:
```
ModuleNotFoundError: No module named 'flask'
ImportError: cannot import name 'FollowerAuthenticityChecker'
```

**Solution**:
```bash
cd backend/ai-verification
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
pip list | grep flask
```

**If still failing**:
```bash
# Make sure you're in the right directory
pwd  # Should be: .../backend/ai-verification

# Check Python version
python --version  # Should be 3.9+

# Reinstall everything
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Issue 3: npm Install Fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall with legacy peer deps
npm install --legacy-peer-deps
```

**Alternative**:
```bash
# Use npm 9 or higher
npm install -g npm@latest

# Or use yarn instead
npm install -g yarn
yarn install
```

---

### Issue 4: TypeScript Errors (axios types)

**Symptoms**:
```
Module 'axios' has no exported member 'AxiosInstance'
Property 'isAxiosError' does not exist
```

**Solution**:
```bash
# Run the fix script
./scripts/final-fix.sh

# Manual fix if needed
cd backend/oracle-agent
npm install axios@latest
npm run build

# Restart VS Code TypeScript server
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**If still broken**:
```typescript
// In aiClient.ts and qubicClient.ts, use:
private client: any;  // Instead of AxiosInstance

// And for response data:
const data: any = response.data;  // Explicit type
```

---

### Issue 5: Port Already in Use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
```bash
# Find what's using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or kill all matching processes
pkill -f "python.*ai_verifier.py"
pkill -f "node.*dist/index.js"
pkill -f "react-scripts start"
```

**Prevent future conflicts**:
```bash
# Use different ports in .env
API_PORT=5001
PORT=8081
```

---

### Issue 6: Contract Won't Deploy

**Symptoms**:
```
Error: Contract deployment failed
Could not connect to Qubic network
```

**Solution**:
```bash
# Check network connection
curl https://testnet-rpc.qubic.org/health

# Verify Qubic CLI installed
qubic-cli --version

# Check deployer wallet has funds
cat config/wallets.json | jq '.deployer'

# Check .env has correct keys
grep DEPLOYER config/.env
```

**Alternative approach**:
```bash
# Manual deployment
cd contract
qubic-cli deploy src/escrow.qpi \
  --network testnet \
  --key <DEPLOYER_PRIVATE_KEY>
```

---

### Issue 7: Services Start But Don't Respond

**Symptoms**:
```
curl http://localhost:5000/health
curl: (7) Failed to connect to localhost port 5000
```

**Solution**:
```bash
# Check if service is actually running
ps aux | grep ai_verifier
ps aux | grep "node.*dist"

# Check logs
tail -f logs/ai-service.log
tail -f logs/oracle-agent.log

# Look for error messages
grep ERROR logs/*.log
```

**Common causes**:
```bash
# Wrong directory
cd backend/ai-verification  # Must be here to run

# Missing dependencies
pip list | grep flask
npm list axios

# Port binding issue
netstat -tulpn | grep 5000
```

---

### Issue 8: Frontend Won't Compile

**Symptoms**:
```
Module not found: Can't resolve '@/services/walletService'
Failed to compile
```

**Solution**:
```bash
cd frontend

# Check if file exists
ls -la src/services/walletService.ts

# Clear cache
rm -rf node_modules/.cache

# Reinstall
rm -rf node_modules
npm install

# Restart
npm start
```

**If TypeScript errors**:
```bash
# Check tsconfig.json paths
cat tsconfig.json | grep paths

# Should have:
# "baseUrl": "src",
# "@/*": ["./*"]
```

---

### Issue 9: Wallet Generation Fails

**Symptoms**:
```
Cannot find module 'crypto'
ReferenceError: require is not defined
```

**Solution**:
```bash
# Make sure you're using Node.js
node --version  # Should be 18+

# Run with node explicitly
node scripts/generate-wallets.js

# Not with npm
# npm run generate-wallets  ← Wrong
```

**If still failing**:
```bash
# Check file permissions
chmod +x scripts/generate-wallets.js

# Run from project root
pwd  # Should be: .../qubic-smart-escrow
```

---

### Issue 10: Demo Script Fails

**Symptoms**:
```
Connection refused
AI Service not running
```

**Solution**:
```bash
# Start services first
./scripts/start-all.sh

# Wait 5 seconds for services to start
sleep 5

# Then run demo
node scripts/demo-scenario.js all
```

**Check services are up**:
```bash
curl http://localhost:5000/health
curl http://localhost:8080/health

# Both should return:
# {"status": "healthy", ...}
```

---

### Issue 11: Oracle Can't Submit Scores

**Symptoms**:
```
[Oracle] Failed to broadcast transaction
Transaction rejected by network
```

**Solution**:
```bash
# Check oracle is authorized
qubic-cli query <CONTRACT_ID> getContractState

# Should show:
# oracleId: <YOUR_ORACLE_KEY>
# oracleSet: true

# If not authorized:
qubic-cli call <CONTRACT_ID> setOracleId \
  --args <ORACLE_PUBLIC_KEY> \
  --key <DEPLOYER_PRIVATE_KEY>
```

**Check keys match**:
```bash
# Compare .env with wallets.json
grep ORACLE_PUBLIC_KEY .env
cat config/wallets.json | jq '.oracle.publicKey'

# Should be identical
```

---

### Issue 12: Frontend Can't Connect to Backend

**Symptoms**:
```
Network Error
Failed to fetch
CORS policy error
```

**Solution**:
```bash
# Check CORS is enabled
cd backend/ai-verification/src
grep CORS ai_verifier.py

# Should have:
# from flask_cors import CORS
# CORS(app)

# Check backend is running
curl http://localhost:5000/health

# Check ports in frontend
cd frontend/src/services
grep localhost apiService.ts
```

**Fix CORS**:
```python
# In ai_verifier.py
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*")  # Allow all origins for dev
```

---

### Issue 13: Tests Failing

**Symptoms**:
```
FAIL: test_ai_verifier
AssertionError: Expected 96, got 0
```

**Solution**:
```bash
# Make sure services are running
./scripts/start-all.sh

# Wait for startup
sleep 5

# Run tests
cd backend/ai-verification
pytest -v

# Check test configuration
cat tests/test_ai_verifier.py
```

**Common test issues**:
```bash
# Wrong base URL
# Should be: http://localhost:5000
# Not: https://... or http://127.0.0.1:5000

# Services not responding
curl http://localhost:5000/health

# Python path issues
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
```

---

### Issue 14: Docker Issues

**Symptoms**:
```
Cannot connect to Docker daemon
docker-compose command not found
```

**Solution**:
```bash
# Check Docker is running
docker --version
docker ps

# Start Docker daemon (Mac/Windows)
# Open Docker Desktop application

# Linux
sudo systemctl start docker

# Install docker-compose
sudo apt install docker-compose
```

**Container won't start**:
```bash
# Check logs
docker-compose logs ai-service
docker-compose logs oracle-agent

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

### Issue 15: Environment Variables Not Loading

**Symptoms**:
```
CONTRACT_ID is undefined
Configuration validation failed
```

**Solution**:
```bash
# Check .env file exists
ls -la .env

# Verify contents
cat .env | grep CONTRACT_ID

# Reload environment (if in active shell)
source .env
```

**Create .env if missing**:
```bash
# Copy from example
cp .env.example .env

# Or run setup
./setup.sh
```

---

## 🔍 Diagnostic Commands

### Check All Services
```bash
# Processes
ps aux | grep -E 'ai_verifier|dist/index|react-scripts'

# Ports
lsof -i :5000
lsof -i :8080
lsof -i :3000

# Health checks
curl http://localhost:5000/health
curl http://localhost:8080/health
```

### Check Dependencies
```bash
# Node.js
node --version  # >= 18
npm --version   # >= 9

# Python
python3 --version  # >= 3.9
pip --version

# Git
git --version
```

### Check Configuration
```bash
# Wallets
cat config/wallets.json | jq

# Contract addresses
cat config/contract-addresses.json | jq

# Environment
cat .env | grep -v '^#' | grep -v '^$'
```

### Check Logs
```bash
# Recent errors
grep -i error logs/*.log | tail -20

# Last 50 lines
tail -50 logs/ai-service.log
tail -50 logs/oracle-agent.log

# Follow live
tail -f logs/*.log
```

---

## 🆘 Emergency Procedures

### Complete System Reset
```bash
# 1. Stop everything
./scripts/stop-all.sh
pkill -9 -f python
pkill -9 -f node

# 2. Clean all builds
rm -rf backend/ai-verification/venv
rm -rf backend/oracle-agent/dist
rm -rf backend/oracle-agent/node_modules
rm -rf frontend/node_modules
rm -rf frontend/build

# 3. Clean logs
rm -rf logs/*
mkdir -p logs

# 4. Reset config (optional)
# rm config/wallets.json
# rm .env

# 5. Full reinstall
./setup.sh
```

### Factory Reset (Nuclear Option)
```bash
# ⚠️ THIS DELETES EVERYTHING ⚠️
git clean -fdx
git reset --hard HEAD
./setup.sh
```

---

## 📞 Getting Help

### Before Asking for Help

1. **Check this guide** - Your issue is probably here
2. **Check logs** - `tail -f logs/*.log`
3. **Try clean reinstall** - `./setup.sh`
4. **Search GitHub issues** - Someone might have had same issue

### What to Include in Bug Reports

```markdown
**Environment:**
- OS: [e.g., Ubuntu 22.04, macOS 13, Windows 11]
- Node version: [run: node --version]
- Python version: [run: python --version]
- Project version: [run: git rev-parse HEAD]

**Steps to Reproduce:**
1. Run `./setup.sh`
2. Run `./scripts/start-all.sh`
3. Error occurs

**Expected Behavior:**
Services should start without errors

**Actual Behavior:**
Error message: [paste error]

**Logs:**
[paste relevant logs]

**What I've Tried:**
- Reinstalled dependencies
- Checked ports are free
- etc.
```

---

## 🎓 Best Practices to Avoid Issues

### 1. Always Run from Project Root
```bash
# Good
cd /path/to/qubic-smart-escrow
./scripts/start-all.sh

# Bad
cd scripts
./start-all.sh  # ← Will fail
```

### 2. Check Prerequisites First
```bash
node --version  # >= 18
python3 --version  # >= 3.9
npm --version  # >= 9
```

### 3. Use Virtual Environments
```bash
# Python - always activate venv
source backend/ai-verification/venv/bin/activate

# Node - use local installs
npm install  # Not: npm install -g
```

### 4. Keep Logs Clean
```bash
# Rotate logs regularly
mv logs/ai-service.log logs/ai-service.$(date +%Y%m%d).log
> logs/ai-service.log
```

### 5. Use Scripts, Not Manual Commands
```bash
# Good
./scripts/start-all.sh

# Risky
cd backend/ai-verification && python src/ai_verifier.py &
cd ../oracle-agent && npm start &
# ... easy to forget steps
```

---

## 📊 Health Check Checklist

Run this before demos/presentations:

```bash
# Services running?
curl -s http://localhost:5000/health | jq
curl -s http://localhost:8080/health | jq

# Ports free?
lsof -i :5000 :8080 :3000

# Logs clean?
tail -5 logs/*.log

# Demo works?
node scripts/demo-scenario.js legitimate

# Frontend loads?
curl -s http://localhost:3000 | grep -q "Qubic"

# Contract deployed?
cat config/contract-addresses.json | jq '.testnet.contractId'

# Wallets exist?
cat config/wallets.json | jq '.brand.publicKey'
```

All checks pass? You're ready to go! 🚀

---

**Still stuck?** Open an issue on GitHub with your error message and logs.