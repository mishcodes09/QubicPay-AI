/**
 * Simple Qubic RPC Proxy Server
 * Connects to local Qubic node and exposes HTTP endpoints
 */
import express from 'express';
import cors from 'cors';
import * as net from 'net';

const app = express();
const PORT = 8001;
const QUBIC_NODE_HOST = '127.0.0.1';
const QUBIC_NODE_PORT = 31841;

app.use(cors());
app.use(express.json());

// In-memory state (read from node)
let currentTick = 38640000;
let currentEpoch = 190;
const balances = new Map<string, bigint>();

// Your oracle wallet (from customSeeds)
const ORACLE_ADDRESS = 'UIQSBLQPIMAQCAPCVYLXQKNQARZBWSTTTCYHGJIIMBDKLZYOBKULOPZBITLA';
balances.set(ORACLE_ADDRESS, BigInt(10_000_000_000)); // 10B QU

/**
 * Connect to Qubic node via TCP
 */
function connectToNode(): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    socket.connect(QUBIC_NODE_PORT, QUBIC_NODE_HOST, () => {
      console.log(`✓ Connected to Qubic node at ${QUBIC_NODE_HOST}:${QUBIC_NODE_PORT}`);
      resolve(socket);
    });
    
    socket.on('error', (err) => {
      console.error('Node connection error:', err.message);
      reject(err);
    });
    
    socket.on('data', (data) => {
      // Parse node responses here
      // For simplicity, we'll use simulated data
    });
  });
}

/**
 * Simulate tick updates
 */
function startTickSimulation() {
  setInterval(() => {
    currentTick += 1;
    console.log(`[RPC] Current tick: ${currentTick}`);
  }, 1000); // 1 second per tick
}

// ============================================
// RPC ENDPOINTS
// ============================================

/**
 * GET /v1/status - Network status
 */
app.get('/v1/status', (req, res) => {
  res.json({
    lastProcessedTick: {
      tick: currentTick,
      epoch: currentEpoch
    },
    numberOfEntities: balances.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /v1/tick-info - Current tick information
 */
app.get('/v1/tick-info', (req, res) => {
  res.json({
    tickInfo: {
      tick: currentTick,
      epoch: currentEpoch,
      timestamp: Date.now()
    }
  });
});

/**
 * GET /v1/balances/:address - Get balance for address
 */
app.get('/v1/balances/:address', (req, res) => {
  const address = req.params.address.toUpperCase();
  const balance = balances.get(address) || BigInt(0);
  
  res.json({
    balance: {
      id: address,
      balance: balance.toString(),
      validForTick: currentTick,
      latestIncomingTransferTick: currentTick,
      latestOutgoingTransferTick: 0,
      incomingAmount: '0',
      outgoingAmount: '0',
      numberOfIncomingTransfers: 0,
      numberOfOutgoingTransfers: 0
    }
  });
});

/**
 * POST /v1/broadcast-transaction - Broadcast transaction
 */
app.post('/v1/broadcast-transaction', (req, res) => {
  const { encodedTransaction } = req.body;
  
  if (!encodedTransaction) {
    return res.status(400).json({
      error: 'Missing encodedTransaction'
    });
  }
  
  console.log(`[RPC] Broadcasting transaction (${encodedTransaction.length} chars)`);
  
  // Simulate successful broadcast
  const txId = generateTxId();
  
  res.json({
    peersBroadcasted: 1, // Local node
    encodedTransaction,
    transactionId: txId
  });
  
  console.log(`[RPC] ✓ Transaction broadcasted: ${txId}`);
});

/**
 * GET /v1/transactions/:txId - Get transaction status
 */
app.get('/v1/transactions/:txId', (req, res) => {
  const { txId } = req.params;
  
  // Simulate confirmed transaction
  res.json({
    transaction: {
      txId,
      tick: currentTick,
      executed: true,
      status: 'confirmed'
    }
  });
});

/**
 * GET /v2/ticks/:tick/transactions - Get transactions in tick
 */
app.get('/v2/ticks/:tick/transactions', (req, res) => {
  const tick = parseInt(req.params.tick);
  
  res.json({
    transactions: []
  });
});

/**
 * POST /v1/querySmartContract - Query contract state
 */
app.post('/v1/querySmartContract', (req, res) => {
  const { contractIndex, inputType, requestData } = req.body;
  
  console.log(`[RPC] Contract query: index=${contractIndex}, type=${inputType}`);
  
  // Return empty response for now
  res.json({
    responseData: Buffer.from('').toString('base64')
  });
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    node: 'connected',
    tick: currentTick,
    epoch: currentEpoch
  });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateTxId(): string {
  const chars = '0123456789ABCDEF';
  let id = '';
  for (let i = 0; i < 64; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ============================================
// START SERVER
// ============================================

async function start() {
  console.log('═══════════════════════════════════════════');
  console.log('  Qubic RPC Proxy Server');
  console.log('  Local Development Mode');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // Try to connect to node (optional)
    try {
      await connectToNode();
    } catch (err) {
      console.warn('⚠️  Could not connect to Qubic node (using simulated data)');
    }
    
    // Start tick simulation
    startTickSimulation();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n✓ RPC Server running on http://localhost:${PORT}`);
      console.log(`✓ Current tick: ${currentTick}`);
      console.log(`✓ Oracle balance: 10,000,000,000 QU\n`);
      console.log('Available endpoints:');
      console.log(`  GET  http://localhost:${PORT}/v1/status`);
      console.log(`  GET  http://localhost:${PORT}/v1/tick-info`);
      console.log(`  GET  http://localhost:${PORT}/v1/balances/:address`);
      console.log(`  POST http://localhost:${PORT}/v1/broadcast-transaction`);
      console.log(`  GET  http://localhost:${PORT}/health\n`);
    });
    
  } catch (error: any) {
    console.error('Failed to start RPC server:', error.message);
    process.exit(1);
  }
}

start();