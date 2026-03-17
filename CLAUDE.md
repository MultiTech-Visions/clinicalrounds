# ClinicalRounds

AI-powered multidisciplinary clinical case review tool.

## What This Is
A web app where clinicians paste Epic notes and get instant analysis
from a team of 16 AI specialist agents that reason collaboratively.

## Architecture
- Vanilla Node.js HTTP server — no frameworks, no build step
- No database. All state in browser. Sessions are ephemeral.
- No auth. No user accounts.
- No PHI storage. Notes exist only in browser memory.
- 16 parallel Claude API calls for specialist analysis.
- Cross-consultation rounds between specialists (keyword-routed).
- Opus for attending/synthesis, Sonnet for all other specialists.
- Voice Council via OpenAI Realtime API (WebRTC).

## Key Files
- /prompts/ — System prompts for each specialist. These are
  LARGE and contain embedded clinical expertise. Do not simplify them.
- /lib/orchestrator.js — Core logic for managing the multi-agent flow.
- /server.js — HTTP server with API routes.
- /public/ — Static frontend (HTML, CSS, JS).

## Code Standards
- Plain JavaScript (CommonJS for server, vanilla for browser)
- All specialist outputs must conform to SpecialistAnalysis shape
- Use streaming for the synthesis API route
- Parallel API calls via Promise.allSettled() — never sequential

## Clinical Disclaimer
Every page must show: "AI clinical reasoning aid. Does not replace
physician clinical judgment. Not for diagnostic or treatment decisions."
