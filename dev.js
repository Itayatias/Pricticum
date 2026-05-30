const path = require('path');
const { spawn } = require('child_process');

const processes = [];

function start(command, args, name) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
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

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

start(process.execPath, ['server/server.js'], 'server');
start(process.execPath, [viteBin], 'vite');
