#!/usr/bin/env node

'use strict';

const { spawn, exec } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────
const PKG_VERSION = require('../package.json').version;
const DEFAULT_PORT = 5000;
const MAX_PORT_RETRIES = 10;
const READY_TIMEOUT_MS = 15_000;
const SHUTDOWN_TIMEOUT_MS = 3000;

// ─── CLI Argument Parsing (T006) ─────────────────────────────
function parseArgs(argv) {
  const opts = {
    port: DEFAULT_PORT,
    noOpen: false,
    help: false,
    version: false,
  };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--port' || a === '-p') {
      opts.port = parseInt(args[++i], 10);
      if (isNaN(opts.port) || opts.port < 1 || opts.port > 65535) {
        console.error('✗ Invalid port number. Must be between 1-65535.');
        process.exit(1);
      }
    } else if (a === '--no-open') {
      opts.noOpen = true;
    } else if (a === '--help' || a === '-h') {
      opts.help = true;
    } else if (a === '--version' || a === '-v') {
      opts.version = true;
    } else if (a.startsWith('-')) {
      console.error(`✗ Unknown option: ${a}`);
      console.error('Run with --help for usage information.');
      process.exit(1);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
  VisualKnowledge v${PKG_VERSION}

  Usage:
    npx visualknowledge [options]

  Options:
    -p, --port <port>   Specify starting port (default: ${DEFAULT_PORT})
    --no-open           Do not auto-open browser after startup
    -h, --help          Show this help message
    -v, --version       Show version number

  Examples:
    npx visualknowledge              # Start on default port 5000
    npx visualknowledge -p 8080      # Start on port 8080
    npx visualknowledge --no-open    # Start without opening browser
`.trimStart() + '\n');
}

// ─── Terminal Output Helpers ──────────────────────────────────
const OK = '✓';
const FAIL = '✗';
const WARN = '⚠';

function banner() {
  console.log(`\n  VisualKnowledge v${PKG_VERSION}\n`);
}

// ─── T003: Node.js Version Check ──────────────────────────────
function checkNodeVersion() {
  const ver = process.versions.node;
  const major = parseInt(ver.split('.')[0], 10);
  if (major < 16) {
    console.log(`${FAIL} Node.js version too old`);
    console.log(`    Installed: v${ver}`);
    console.log(`    Required: >= 16.0.0\n`);
    console.log('  Fix: Upgrade Node.js from https://nodejs.org/');
    process.exit(1);
  }
  console.log(`${OK} Node.js v${ver}`);
  return true;
}

// ─── T004: Python Detection ───────────────────────────────────
function findPython() {
  return new Promise((resolve) => {
    // Try python3 first, then python
    const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];
    let idx = 0;

    function tryNext() {
      if (idx >= candidates.length) {
        resolve(null);
        return;
      }
      const cmd = candidates[idx++];
      exec(`${cmd} --version`, (err, stdout, stderr) => {
        // python outputs version to stderr on some platforms
        const output = (stdout || stderr || '').trim();
        if (!err && output.toLowerCase().startsWith('python')) {
          resolve({ command: cmd, output });
        } else {
          tryNext();
        }
      });
    }

    tryNext();
  });
}

async function checkPython() {
  const py = await findPython();
  if (!py) {
    console.log(`${FAIL} Python 3.10+ not found`);
    console.log('\n  Fix: Install Python 3.10+ from https://www.python.org/downloads/\n'
      + '       Or via: brew install python@3.10  (macOS)\n'
      + '                sudo apt install python3.10  (Ubuntu)\n');
    process.exit(1);
  }

  // Parse version from output like "Python 3.10.12"
  const match = py.output.match(/(\d+\.\d+(\.\d+)?)/);
  const verStr = match ? match[1] : '0.0';
  const parts = verStr.split('.').map(Number);
  const [major, minor] = parts;

  if (major < 3 || (major === 3 && minor < 10)) {
    console.log(`${FAIL} Python version too old`);
    console.log(`    Installed: ${verStr}`);
    console.log(`    Required: >= 3.10.0\n`);
    console.log('  Fix: Upgrade Python from https://www.python.org/downloads/');
    process.exit(1);
  }

  console.log(`${OK} Python ${verStr}`);
  return py.command;
}

// ─── T005: Python Dependency Check ────────────────────────────
function checkDeps(pythonCmd) {
  return new Promise((resolve) => {
    const script = `
import importlib, sys
missing = []
for pkg in ('flask', 'anthropic'):
    try:
        importlib.import_module(pkg.replace('-', '_'))
    except ImportError:
        missing.append(pkg)
if missing:
    print('MISSING:' + ','.join(missing))
    sys.exit(1)
else:
    print('OK')
`;
    const child = spawn(pythonCmd, ['-c', script], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => {
      if (code !== 0) {
        const missing = (stdout.match(/MISSING:(.+)/) || [])[1];
        if (missing) {
          console.log(`${FAIL} Missing Python dependencies:`);
          missing.split(',').forEach((dep) => {
            console.log(`      - ${dep.trim()}`);
          });
          console.log(`\n  Fix: pip install ${missing}\n`);
        } else {
          console.log(`${FAIL} Dependency check failed`);
          if (stderr.trim()) console.log(`    ${stderr.trim()}`);
        }
        process.exit(1);
      }
      console.log(`${OK} Dependencies OK (flask, anthropic)`);
      resolve(true);
    });
  });
}

// ─── T007 + T013 + T014: Port Detection ──────────────────────
function findAvailablePort(startPort, maxRetries) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryPort(port) {
      attempt++;
      if (attempt > maxRetries) {
        reject(new Error('NO_PORTS'));
        return;
      }

      const server = net.createServer();
      server.once('error', () => {
        console.log(`${WARN} Port ${port} in use, trying ${port + 1}...`);
        tryPort(port + 1);
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });

      server.listen(port, '0.0.0.0');
    }

    tryPort(startPort);
  });
}

// ─── T010: Cross-platform Browser Opening ────────────────────
function openBrowser(url) {
  let cmd;
  switch (process.platform) {
    case 'darwin': cmd = `open "${url}"`; break;
    case 'win32': cmd = `start "" "${url}"`; break;
    default: cmd = `xdg-open "${url}"`; break;
  }

  exec(cmd, (err) => {
    if (err) {
      console.log(`${WARN} Could not open browser automatically`);
      console.log(`    Please navigate manually to: ${url}\n`);
    }
  });
}

// ─── Claude Code Config Loader ─────────────────────────────────
function loadClaudeEnv() {
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  if (!home) return null;

  const candidates = [
    path.join(home, '.claude', 'settings.json'),
  ];

  for (const configPath of candidates) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data.env === 'object' && data.env !== null) {
        return { env: data.env, source: configPath };
      }
    } catch (_) {
      // File not found or parse error — skip silently
    }
  }
  return null;
}

// ─── T008: Python Flask Subprocess Launch ────────────────────
function startServer(pythonCmd, port, mergedEnv) {
  const serverDir = path.resolve(__dirname, '..');

  const child = spawn(pythonCmd, ['server.py', '--port', String(port)], {
    cwd: serverDir,
    stdio: 'inherit',
    env: mergedEnv,
    detached: false,
  });

  return child;
}

// ─── T009: Server Ready Detection ─────────────────────────────
function waitForReady(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('READY_TIMEOUT'));
    }, timeoutMs);

    // Collect stdout to detect ready signal
    let output = '';
    const origWrite = process.stdout.write.bind(process.stdout);

    // We use stdio:'inherit' so we can't intercept stdout directly.
    // Instead, we wait briefly and assume success if the process is still running.
    setTimeout(() => {
      clearTimeout(timer);
      if (!child.killed && child.exitCode === null) {
        resolve(true);
      } else {
        reject(new Error('SERVER_EXIT'));
      }
    }, 2000); // Flask starts quickly; 2s is enough for local launch
  });
}

// ─── T016 + T017 + T018: Graceful Shutdown ───────────────────
function setupShutdownHandlers(child) {
  let shuttingDown = false;

  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n${signal} received, shutting down...`);

    if (child && !child.killed && child.exitCode === null) {
      // Send SIGTERM (or equivalent on Windows)
      try {
        process.kill(child.pid, process.platform === 'win32' ? undefined : 'SIGTERM');
      } catch (_) {
        // Process may have already exited
      }

      // Force kill after timeout
      setTimeout(() => {
        if (!child.killed) {
          try { child.kill('SIGKILL'); } catch (_) {}
        }
        process.exit(0);
      }, SHUTDOWN_TIMEOUT_MS);
    } else {
      process.exit(0);
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// ─── T011: Main Flow Assembly ─────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (opts.version) {
    console.log(`VisualKnowledge v${PKG_VERSION}`);
    process.exit(0);
  }

  // Banner
  banner();

  // Load Claude Code config (if available)
  const claudeConfig = loadClaudeEnv();
  // Claude config as base defaults, process.env always takes precedence
  const mergedEnv = { ...(claudeConfig ? claudeConfig.env : {}), ...process.env };
  if (claudeConfig) {
    const hasKey = mergedEnv.ANTHROPIC_AUTH_TOKEN || mergedEnv.ANTHROPIC_API_KEY;
    console.log(`${OK} Claude Code config loaded${hasKey ? '' : ' (no API key found)'}`);
  } else {
    const hasKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
    if (!hasKey) {
      console.log(`${WARN} No API key found (set ANTHROPIC_API_KEY or install Claude Code)`);
    }
  }

  // Environment checks (T003-T005)
  checkNodeVersion();
  const pythonCmd = await checkPython();
  await checkDeps(pythonCmd);

  // Port detection (T007 + T013 + T014)
  let actualPort;
  try {
    actualPort = await findAvailablePort(opts.port, MAX_PORT_RETRIES);
    console.log(`${OK} Port ${actualPort} available`);
  } catch (err) {
    if (err.message === 'NO_PORTS') {
      console.log(`\n${FAIL} No available port in range ${opts.port}-${opts.port + MAX_PORT_RETRIES - 1}\n`);
      console.log('  Fix: Stop other services using these ports,\n'
        + '       or use --port to specify a different start port.\n');
      process.exit(2); // Exit code 2 per contract
    }
    throw err;
  }

  // Start Python server (T008)
  console.log('\n  Starting server...');
  const child = startServer(pythonCmd, actualPort, mergedEnv);

  // Setup graceful shutdown (T016-T018)
  setupShutdownHandlers(child);

  // Wait for server ready (T009)
  try {
    await waitForReady(child, READY_TIMEOUT_MS);
  } catch (err) {
    if (err.message === 'READY_TIMEOUT') {
      console.log(`${FAIL} Server failed to start within ${READY_TIMEOUT_MS / 1000}s`);
      process.exit(1);
    }
    if (err.message === 'SERVER_EXIT') {
      console.log(`${FAIL} Server exited unexpectedly`);
      process.exit(1);
    }
    throw err;
  }

  // Build URL with actual port (T015)
  const url = `http://localhost:${actualPort}`;

  // Open browser unless --no-open (T010 + E1 fix)
  if (!opts.noOpen) {
    openBrowser(url);
  }

  // Output access address
  console.log(`\n  → ${url}\n`);

  // Keep process alive — Python child runs via inherit stdio
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${WARN} Server exited with code ${code}`);
    }
    process.exit(code || 0);
  });
}

// Run
main().catch((err) => {
  console.error(`${FAIL} Unexpected error: ${err.message}`);
  process.exit(1);
});
