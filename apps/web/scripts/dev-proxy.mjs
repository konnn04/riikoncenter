import http from 'http';
import httpProxy from 'http-proxy';
import { spawn } from 'child_process';
import net from 'net';

const GAME_GATEWAY_PORT = 3310;
const PROXY_PORT = 3309;

let unoState = 'stopped'; // 'stopped', 'starting', 'running'
let unoPromise = null;
let unoProcess = null;

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function waitForPort(port, maxWaitMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await checkPort(port)) return true;
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

function startUnoApp() {
  if (unoState === 'running') return Promise.resolve();
  if (unoState === 'starting') return unoPromise;

  unoState = 'starting';
  console.log('====================================================');
  console.log('[Lazy Boot Manager] 🚀 Spawning Vibe Card Game (UNO) in background...');
  console.log('[Lazy Boot Manager] Please wait 15-30s for the initial cold start!');
  console.log('====================================================');
  
  unoPromise = new Promise(async (resolve, reject) => {
    unoProcess = spawn('pnpm', ['run', 'dev:vibe'], {
      stdio: 'inherit',
      shell: true,
    });
    
    // Wait for Gateway to be up
    const isUp = await waitForPort(GAME_GATEWAY_PORT);
    if (isUp) {
      console.log('====================================================');
      console.log('[Lazy Boot Manager] ✅ Vibe Card Game is now READY!');
      console.log('====================================================');
      unoState = 'running';
      resolve();
    } else {
      console.error('[Lazy Boot Manager] ❌ Failed to start (Timeout).');
      unoState = 'stopped';
      reject(new Error('Timeout starting UNO'));
    }
    
    unoProcess.on('exit', () => {
      unoState = 'stopped';
      console.log('[Lazy Boot Manager] 🛑 Vibe Card Game has exited.');
    });
  });

  return unoPromise;
}

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({
  target: process.env.GAME_GATEWAY_URL || `http://127.0.0.1:${GAME_GATEWAY_PORT}`,
  ws: true,
  changeOrigin: true
});

// Intercept the response from the Game Gateway
proxy.on('proxyRes', function (proxyRes, req, res) {
  delete proxyRes.headers['content-security-policy'];
  delete proxyRes.headers['x-frame-options'];
});

proxy.on('error', function (err, req, res) {
  console.warn('[Dev Proxy Error]', err.message);
  if (res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Game Gateway is not running or starting up...');
  }
});

// Setup the HTTP Server
const server = http.createServer(async (req, res) => {
  // Health check endpoint for the React Dashboard to poll
  if (req.url === '/api/health') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' 
    });
    res.end(JSON.stringify({ state: unoState }));
    return;
  }

  try {
    await startUnoApp();
    proxy.web(req, res);
  } catch (err) {
    res.writeHead(500);
    res.end('Lazy Boot Failed');
  }
});

// Setup WebSocket Proxying
server.on('upgrade', async (req, socket, head) => {
  try {
    await startUnoApp();
    proxy.ws(req, socket, head);
  } catch (err) {
    socket.destroy();
  }
});

// Start listening
server.listen(PROXY_PORT, () => {
  console.log('====================================================');
  console.log(`[Lazy Boot Manager] Listening on http://localhost:${PROXY_PORT}`);
  console.log(`  -> Standing by to wake up Game Gateway on port ${GAME_GATEWAY_PORT} upon request!`);
  console.log('====================================================');
});
