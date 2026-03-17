'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const orchestrator = require('./lib/orchestrator');

// ─── Configuration ───────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT, 10) || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJSON(res, statusCode, data) {
  setCorsHeaders(res);
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendSSE(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function startSSE(res) {
  setCorsHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message });
}

// ─── Static file serving ─────────────────────────────────────────────────────

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0]; // strip query string
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(__dirname, 'public', urlPath));
  const publicDir = path.resolve(path.join(__dirname, 'public'));

  // Security: prevent directory traversal
  if (!filePath.startsWith(publicDir)) {
    sendError(res, 403, 'Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA fallback: serve index.html for non-file routes
      const indexPath = path.join(publicDir, 'index.html');
      fs.readFile(indexPath, (err2, html) => {
        if (err2) {
          sendError(res, 404, 'Not found');
          return;
        }
        setCorsHeaders(res);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });
      return;
    }

    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ─── API route handlers ──────────────────────────────────────────────────────

async function handleAnalyze(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendError(res, 400, 'Invalid JSON body');
  }

  const { rawNotes, webSearchEnabled } = body;
  if (!rawNotes) {
    return sendError(res, 400, 'rawNotes is required');
  }

  startSSE(res);

  try {
    // Step 1: Intake parsing
    const intakeData = await orchestrator.runIntake(rawNotes);
    sendSSE(res, { type: 'intake_complete', intakeData });

    // Step 2: Run all specialists in parallel
    await orchestrator.runSpecialistsStreaming(
      intakeData,
      (specialist, analysis) => {
        sendSSE(res, { type: 'specialist_complete', specialist, analysis });
      },
      (specialist, error) => {
        sendSSE(res, { type: 'specialist_error', specialist, error });
      },
      { webSearchEnabled: !!webSearchEnabled }
    );

    sendSSE(res, { type: 'analyze_done' });
  } catch (err) {
    sendSSE(res, { type: 'error', error: err.message || String(err) });
  }

  res.end();
}

async function handleCrossConsult(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendError(res, 400, 'Invalid JSON body');
  }

  const { analyses, intakeData } = body;
  if (!analyses || !intakeData) {
    return sendError(res, 400, 'analyses and intakeData are required');
  }

  startSSE(res);

  try {
    await orchestrator.runCrossConsultStreaming(analyses, intakeData, (message) => {
      sendSSE(res, { type: 'cross_consult_message', message });
    });

    sendSSE(res, { type: 'cross_consult_done' });
  } catch (err) {
    sendSSE(res, { type: 'error', error: err.message || String(err) });
  }

  res.end();
}

async function handleSynthesize(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendError(res, 400, 'Invalid JSON body');
  }

  const { analyses, crossConsults, intakeData } = body;
  if (!analyses || !intakeData) {
    return sendError(res, 400, 'analyses and intakeData are required');
  }

  setCorsHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked',
  });

  try {
    for await (const chunk of orchestrator.runSynthesis(analyses, crossConsults || [], intakeData)) {
      res.write(chunk);
    }
  } catch (err) {
    res.write(`\n\n[ERROR: ${err.message || String(err)}]`);
  }

  res.end();
}

async function handleSpecialistChat(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendError(res, 400, 'Invalid JSON body');
  }

  const { specialist, message, chatHistory, intakeData, analyses, crossConsults, synthesizedPlan } = body;
  if (!specialist || !message) {
    return sendError(res, 400, 'specialist and message are required');
  }

  try {
    const fullContext = {
      chatHistory: chatHistory || [],
      intakeData: intakeData || {},
      analyses: analyses || {},
      crossConsults: crossConsults || [],
      synthesizedPlan: synthesizedPlan || '',
    };

    const result = await orchestrator.runSpecialistChat(specialist, message, fullContext);
    sendJSON(res, 200, result);
  } catch (err) {
    sendError(res, 500, err.message || String(err));
  }
}

async function handleShutdown(req, res) {
  sendJSON(res, 200, { ok: true });
  setTimeout(() => process.exit(0), 500);
}

async function handleRealtimeToken(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return sendError(res, 500, 'OPENAI_API_KEY not configured');
  }

  const payload = JSON.stringify({
    model: 'gpt-4o-mini-realtime-preview-2024-12-17',
    voice: 'verse',
    modalities: ['audio', 'text'],
    input_audio_transcription: { model: 'gpt-4o-mini-transcribe' },
  });

  const https = require('https');

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/realtime/sessions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const chunks = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      try {
        const data = JSON.parse(body);
        sendJSON(res, proxyRes.statusCode || 200, data);
      } catch {
        sendError(res, 502, 'Invalid response from OpenAI');
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[server] OpenAI proxy error:', err.message);
    sendError(res, 502, 'Failed to reach OpenAI API');
  });

  proxyReq.write(payload);
  proxyReq.end();
}

// ─── Router ──────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  try {
    // API routes
    if (pathname === '/api/analyze' && req.method === 'POST') {
      await handleAnalyze(req, res);
    } else if (pathname === '/api/cross-consult' && req.method === 'POST') {
      await handleCrossConsult(req, res);
    } else if (pathname === '/api/synthesize' && req.method === 'POST') {
      await handleSynthesize(req, res);
    } else if (pathname === '/api/specialist-chat' && req.method === 'POST') {
      await handleSpecialistChat(req, res);
    } else if (pathname === '/api/shutdown' && req.method === 'POST') {
      await handleShutdown(req, res);
    } else if (pathname === '/api/realtime-token' && req.method === 'GET') {
      await handleRealtimeToken(req, res);
    } else if (pathname.startsWith('/api/')) {
      sendError(res, 404, 'API route not found');
    } else {
      // Serve static files from public/
      serveStatic(req, res);
    }
  } catch (err) {
    console.error('[server] Unhandled error:', err);
    if (!res.headersSent) {
      sendError(res, 500, 'Internal server error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`ClinicalRounds server running at http://localhost:${PORT}`);
  console.log('');
  console.log('AI clinical reasoning aid. Does not replace physician clinical judgment.');
  console.log('Not for diagnostic or treatment decisions.');
});
