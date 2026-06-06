const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');

const processes = [];
const devSessionId = crypto.randomUUID();

function start(command, args, name) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      DEV_SESSION_ID: devSessionId,
    },
  });

  child.on('exit', (code, signal) => {
    if (signal || code !== 0) {
      console.log(`[${name}] exited with ${signal || code}`);
    }
    process.exitCode = process.exitCode || code || 0;
    shutdown();
  });

  processes.push(child);
  return child;
}

function shutdown() {
  while (processes.length) {
    const child = processes.pop();
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  }
}

function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function probe() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(probe, 500);
      });
    }

    probe();
  });
}

async function openSafari(url) {
  try {
    await waitForUrl(url);
    if (process.platform === 'darwin') {
      spawn('open', ['-a', 'Safari', url], {
        stdio: 'ignore',
        detached: true,
      }).unref();
    }
  } catch (error) {
    console.log(`[browser] ${error.message}`);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

start(process.execPath, ['server/server.js'], 'server');
start(process.execPath, [viteBin], 'vite');
openSafari('http://localhost:3000');
