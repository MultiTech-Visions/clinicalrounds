'use strict';

const Anthropic = require('@anthropic-ai/sdk').default;

const {
  INTAKE_PARSER_PROMPT,
  ATTENDING_PROMPT,
  CARDIOLOGIST_PROMPT,
  PULMONOLOGIST_PROMPT,
  NEPHROLOGIST_PROMPT,
  HEPATOLOGIST_PROMPT,
  HEMATOLOGIST_PROMPT,
  ID_SPECIALIST_PROMPT,
  RADIOLOGIST_PROMPT,
  PHARMACIST_PROMPT,
  ENDOCRINOLOGIST_PROMPT,
  NEUROLOGIST_PROMPT,
  INTENSIVIST_PROMPT,
  ONCOLOGIST_PROMPT,
  PSYCHIATRIST_PROMPT,
  TOXICOLOGIST_PROMPT,
  PALLIATIVE_PROMPT,
} = require('../prompts/index');

const anthropic = new Anthropic();

// ─── Constants ───────────────────────────────────────────────────────────────

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const OPUS_MODEL = 'claude-opus-4-6';

const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 3,
  allowed_domains: [
    'pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'nih.gov', 'who.int', 'cdc.gov',
    'acc.org', 'heart.org', 'idsociety.org', 'ashp.org', 'kidney.org', 'aasld.org',
    'thoracic.org', 'aan.com', 'endocrine.org', 'hematology.org', 'acr.org',
    'nejm.org', 'thelancet.com', 'jamanetwork.com', 'bmj.com', 'cochranelibrary.com',
    'nice.org.uk', 'uptodate.com',
    'aahpm.org', 'asco.org', 'nccn.org', 'aact.org',
  ],
};

const CODE_EXECUTION_TOOL = {
  type: 'code_execution_20250522',
  name: 'code_execution',
};

const SPECIALIST_LIST = [
  'attending',
  'cardiologist',
  'pulmonologist',
  'nephrologist',
  'hepatologist',
  'hematologist',
  'id_specialist',
  'radiologist',
  'pharmacist',
  'endocrinologist',
  'neurologist',
  'intensivist',
  'oncologist',
  'psychiatrist',
  'toxicologist',
  'palliative',
];

const SPECIALIST_CONFIG = {
  attending:       { name: 'Attending',       icon: '\u{1F468}\u200D\u2695\uFE0F', model: 'opus' },
  cardiologist:    { name: 'Cardiology',      icon: '\u2764\uFE0F', model: 'sonnet' },
  pulmonologist:   { name: 'Pulm/CC',         icon: '\u{1FAC1}', model: 'sonnet' },
  nephrologist:    { name: 'Nephrology',      icon: '\u{1F9EA}', model: 'sonnet' },
  hepatologist:    { name: 'Hepatology',      icon: '\u{1F7E1}', model: 'sonnet' },
  hematologist:    { name: 'Hematology',      icon: '\u{1FA78}', model: 'sonnet' },
  id_specialist:   { name: 'ID',              icon: '\u{1F9A0}', model: 'sonnet' },
  radiologist:     { name: 'Radiology',       icon: '\u{1F4E1}', model: 'sonnet' },
  pharmacist:      { name: 'Pharmacy',        icon: '\u{1F48A}', model: 'sonnet' },
  endocrinologist: { name: 'Endocrinology',   icon: '\u{1F9EC}', model: 'sonnet' },
  neurologist:     { name: 'Neurology',       icon: '\u{1F9E0}', model: 'sonnet' },
  intensivist:     { name: 'Critical Care',   icon: '\u{1F3E5}', model: 'sonnet' },
  oncologist:      { name: 'Oncology',        icon: '\u{1F397}\uFE0F', model: 'sonnet' },
  psychiatrist:    { name: 'Psychiatry',      icon: '\u{1F9E9}', model: 'sonnet' },
  toxicologist:    { name: 'Toxicology',      icon: '\u2620\uFE0F', model: 'sonnet' },
  palliative:      { name: 'Palliative Care', icon: '\u{1F54A}\uFE0F', model: 'sonnet' },
};

const SPECIALIST_PROMPTS = {
  attending:       ATTENDING_PROMPT,
  cardiologist:    CARDIOLOGIST_PROMPT,
  pulmonologist:   PULMONOLOGIST_PROMPT,
  nephrologist:    NEPHROLOGIST_PROMPT,
  hepatologist:    HEPATOLOGIST_PROMPT,
  hematologist:    HEMATOLOGIST_PROMPT,
  id_specialist:   ID_SPECIALIST_PROMPT,
  radiologist:     RADIOLOGIST_PROMPT,
  pharmacist:      PHARMACIST_PROMPT,
  endocrinologist: ENDOCRINOLOGIST_PROMPT,
  neurologist:     NEUROLOGIST_PROMPT,
  intensivist:     INTENSIVIST_PROMPT,
  oncologist:      ONCOLOGIST_PROMPT,
  psychiatrist:    PSYCHIATRIST_PROMPT,
  toxicologist:    TOXICOLOGIST_PROMPT,
  palliative:      PALLIATIVE_PROMPT,
};

const SPECIALTY_KEYWORDS = {
  // Cardiology
  cardiac: 'cardiologist', heart: 'cardiologist', echo: 'cardiologist',
  troponin: 'cardiologist', stemi: 'cardiologist', nstemi: 'cardiologist',
  arrhythmia: 'cardiologist', afib: 'cardiologist', gdmt: 'cardiologist',
  ejection: 'cardiologist', bnp: 'cardiologist', valvular: 'cardiologist',
  // Pulmonology
  pulmonary: 'pulmonologist', respiratory: 'pulmonologist', ventilat: 'pulmonologist',
  abg: 'pulmonologist', oxygen: 'pulmonologist', ards: 'pulmonologist',
  pneumonia: 'pulmonologist', sepsis: 'pulmonologist', intubat: 'pulmonologist',
  // Nephrology
  renal: 'nephrologist', kidney: 'nephrologist', creatinine: 'nephrologist',
  dialysis: 'nephrologist', electrolyte: 'nephrologist', potassium: 'nephrologist',
  sodium: 'nephrologist', 'acid-base': 'nephrologist', gfr: 'nephrologist',
  // Hepatology
  liver: 'hepatologist', hepat: 'hepatologist', cirrhosis: 'hepatologist',
  meld: 'hepatologist', ascites: 'hepatologist', bilirubin: 'hepatologist',
  encephalopathy: 'hepatologist',
  // Hematology
  coagul: 'hematologist', platelet: 'hematologist', anemia: 'hematologist',
  transfus: 'hematologist', hit: 'hematologist', ttp: 'hematologist',
  dic: 'hematologist', anticoagul: 'hematologist', inr: 'hematologist',
  // Infectious Disease
  antibiotic: 'id_specialist', infection: 'id_specialist', culture: 'id_specialist',
  'c. diff': 'id_specialist', septic: 'id_specialist', fever: 'id_specialist',
  antimicrobial: 'id_specialist', mrsa: 'id_specialist',
  // Radiology
  imaging: 'radiologist', 'ct ': 'radiologist', mri: 'radiologist',
  xray: 'radiologist', 'x-ray': 'radiologist', ultrasound: 'radiologist',
  // Pharmacy
  drug: 'pharmacist', medication: 'pharmacist', dose: 'pharmacist',
  dosing: 'pharmacist', interaction: 'pharmacist', pharmacok: 'pharmacist',
  // Endocrinology
  insulin: 'endocrinologist', glucose: 'endocrinologist', diabet: 'endocrinologist',
  dka: 'endocrinologist', thyroid: 'endocrinologist', adrenal: 'endocrinologist',
  a1c: 'endocrinologist', glycemic: 'endocrinologist',
  // Neurology
  neuro: 'neurologist', stroke: 'neurologist', seizure: 'neurologist',
  'mental status': 'neurologist', nihss: 'neurologist', gcs: 'neurologist',
  // Critical Care
  shock: 'intensivist', vasopressor: 'intensivist', norepinephrine: 'intensivist',
  sofa: 'intensivist', resuscitat: 'intensivist', pressors: 'intensivist',
  sedation: 'intensivist', 'icu bundle': 'intensivist', inotrope: 'intensivist',
  'post-arrest': 'intensivist', ttm: 'intensivist', prone: 'intensivist',
  // Oncology
  cancer: 'oncologist', tumor: 'oncologist', malignancy: 'oncologist', chemo: 'oncologist',
  neutropenic: 'oncologist', 'tumor lysis': 'oncologist', immunotherapy: 'oncologist',
  metasta: 'oncologist', oncolog: 'oncologist', iraes: 'oncologist',
  // Psychiatry
  delirium: 'psychiatrist', agitat: 'psychiatrist', capacity: 'psychiatrist',
  psych: 'psychiatrist', hallucin: 'psychiatrist', suicid: 'psychiatrist',
  catatoni: 'psychiatrist', ciwa: 'psychiatrist', cows: 'psychiatrist',
  antipsychotic: 'psychiatrist', 'substance withdrawal': 'psychiatrist',
  // Toxicology
  overdose: 'toxicologist', poison: 'toxicologist', ingestion: 'toxicologist',
  toxidrome: 'toxicologist', antidote: 'toxicologist', 'osmolal gap': 'toxicologist',
  acetaminophen: 'toxicologist', 'toxic alcohol': 'toxicologist', methanol: 'toxicologist',
  'ethylene glycol': 'toxicologist', envenomation: 'toxicologist', naloxone: 'toxicologist',
  fomepizole: 'toxicologist',
  // Palliative Care
  'goals of care': 'palliative', comfort: 'palliative', hospice: 'palliative',
  'code status': 'palliative', prognos: 'palliative', 'advance directive': 'palliative',
  'end of life': 'palliative', dnr: 'palliative', 'withdrawal of care': 'palliative',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractJSON(text) {
  const jsonStart = text.indexOf('{');
  if (jsonStart === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = jsonStart; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(jsonStart, i + 1);
    }
  }
  return null;
}

function routeTeamQuestion(question, fromSpecialist) {
  const q = question.toLowerCase();
  for (const [keyword, target] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (q.includes(keyword) && target !== fromSpecialist) {
      return target;
    }
  }
  return null;
}

function buildToolsArray(options) {
  const tools = [CODE_EXECUTION_TOOL];
  if (options && options.webSearchEnabled) {
    tools.push(WEB_SEARCH_TOOL);
  }
  return tools;
}

// ─── Intake ──────────────────────────────────────────────────────────────────

async function runIntake(rawText) {
  const response = await anthropic.messages.create({
    model: SONNET_MODEL,
    max_tokens: 8192,
    system: INTAKE_PARSER_PROMPT,
    messages: [{ role: 'user', content: rawText }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonStr = extractJSON(text);
  if (!jsonStr) throw new Error('Failed to parse intake data');

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Failed to parse intake data: invalid JSON');
  }
  parsed.raw_text = rawText;

  // Ensure temporal fields have defaults for backward compatibility
  if (!parsed.encounters) parsed.encounters = [];
  if (!parsed.timeline_summary) parsed.timeline_summary = '';
  if (!parsed.date_range) parsed.date_range = { start: '', end: '' };

  return parsed;
}

// ─── Single specialist ──────────────────────────────────────────────────────

async function runSingleSpecialist(specialist, intakeData, options) {
  const config = SPECIALIST_CONFIG[specialist];
  if (!config) throw new Error(`Unknown specialist: ${specialist}`);
  const model = config.model === 'opus' ? OPUS_MODEL : SONNET_MODEL;

  const createParams = {
    model,
    max_tokens: 8192,
    system: SPECIALIST_PROMPTS[specialist],
    messages: [{
      role: 'user',
      content: `Analyze the following patient data:\n\n${JSON.stringify(intakeData, null, 2)}`,
    }],
    tools: buildToolsArray(options),
    betas: ['code-execution-2025-05-22'],
  };

  const response = await anthropic.beta.messages.create(createParams);

  // Extract text and citations from response content blocks
  let text = '';
  const citations = [];
  const calculations = [];
  const pendingCodeExecution = new Map();

  for (const block of response.content) {
    if (block.type === 'text') {
      text += block.text;
    } else if (block.type === 'server_tool_use' && block.name === 'web_search') {
      const input = block.input;
      if (options && options.onSearch && input && input.query) {
        options.onSearch(specialist, input.query);
      }
    } else if (block.type === 'web_search_tool_result') {
      const content = block.content;
      if (Array.isArray(content)) {
        for (const result of content) {
          if (result.type === 'web_search_result' && result.url && result.title) {
            citations.push({
              title: result.title,
              url: result.url,
              page_age: result.page_age,
            });
          }
        }
      }
    } else if (block.type === 'server_tool_use' && block.name === 'code_execution') {
      const input = block.input;
      pendingCodeExecution.set(block.id, (input && input.code) || '');
      if (options && options.onCalculation && input && input.code) {
        options.onCalculation(specialist, input.code);
      }
    } else if (block.type === 'code_execution_tool_result') {
      const content = block.content;
      const code = pendingCodeExecution.get(block.tool_use_id) || '';
      if (content && content.type === 'code_execution_result') {
        calculations.push({
          specialist,
          code,
          result: content.stdout || '',
          success: content.return_code === 0,
          timestamp: Date.now(),
        });
      }
    }
  }

  const jsonStr = extractJSON(text);
  if (!jsonStr) {
    console.error(`[orchestrator] ${specialist} no JSON found. Response starts with:`, text.slice(0, 200));
    throw new Error(`Failed to parse ${specialist} analysis`);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error(`[orchestrator] ${specialist} JSON parse error:`, e.message, 'First 200 chars:', jsonStr.slice(0, 200));
    throw new Error(`Failed to parse ${specialist} analysis: invalid JSON`);
  }

  const analysis = { specialist, ...parsed };

  if (citations.length > 0) {
    analysis.web_search_citations = citations;
  }

  if (calculations.length > 0) {
    analysis.calculations_performed = calculations;
  }

  return analysis;
}

// ─── Run all specialists (streaming callbacks) ──────────────────────────────

async function runSpecialistsStreaming(intakeData, onResult, onError, options) {
  const specialists = Object.keys(SPECIALIST_CONFIG);
  const analyses = {};

  await Promise.allSettled(
    specialists.map(async (s) => {
      try {
        const analysis = await runSingleSpecialist(s, intakeData, options);
        analyses[s] = analysis;
        onResult(s, analysis);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[orchestrator] ${s} failed:`, errorMsg);
        const fallback = {
          specialist: s,
          findings: ['Analysis unavailable \u2014 specialist returned an error.'],
          concerns: [],
          recommendations: [],
          questions_for_user: [],
          questions_for_team: [],
          cross_consults: [],
          scoring_systems_applied: [],
        };
        analyses[s] = fallback;
        onError(s, errorMsg);
      }
    })
  );

  return analyses;
}

// ─── Cross-consult (streaming) ──────────────────────────────────────────────

async function runCrossConsultStreaming(analyses, intakeData, onMessage) {
  // 1. Collect explicit cross-consult requests
  const requests = [];
  for (const [specialist, analysis] of Object.entries(analyses)) {
    if (Array.isArray(analysis.cross_consults)) {
      for (const cc of analysis.cross_consults) {
        requests.push({ from: specialist, to: cc.to, question: cc.question });
      }
    }
  }

  // 2. Convert questions_for_team into cross-consult requests via keyword routing
  for (const [specialist, analysis] of Object.entries(analyses)) {
    const teamQs = Array.isArray(analysis.questions_for_team) ? analysis.questions_for_team : [];
    for (const q of teamQs) {
      if (typeof q !== 'string' || !q.trim()) continue;
      const target = routeTeamQuestion(q, specialist);
      if (target) {
        const alreadyRouted = requests.some(
          (r) => r.from === specialist && r.to === target && r.question === q
        );
        if (!alreadyRouted) {
          requests.push({ from: specialist, to: target, question: q });
        }
      }
    }
  }

  if (requests.length === 0) return [];

  const allMessages = [];

  await Promise.allSettled(
    requests.map(async (req) => {
      const targetAnalysis = analyses[req.to];
      if (!targetAnalysis) return;

      const response = await anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: 2048,
        system: SPECIALIST_PROMPTS[req.to],
        messages: [{
          role: 'user',
          content: `A colleague in ${req.from} asks: "${req.question}"\n\nYour previous analysis: ${JSON.stringify(targetAnalysis)}\n\nPatient data: ${JSON.stringify(intakeData)}\n\nRespond to their question concisely.`,
        }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const msg = {
        from: req.from,
        to: req.to,
        message: req.question,
        response: text,
      };
      allMessages.push(msg);
      onMessage(msg);
    })
  );

  return allMessages;
}

// ─── Multi-round cross consultation ─────────────────────────────────────────

async function runMultiRoundCrossConsult(analyses, intakeData, callbacks, maxRounds) {
  if (maxRounds === undefined) maxRounds = 3;
  const { onRoundStart, onMessage, onRoundDone, onComplete } = callbacks || {};
  const allConsults = [];

  for (let round = 0; round < maxRounds; round++) {
    if (onRoundStart) onRoundStart(round + 1);

    const roundResults = await runCrossConsultStreaming(analyses, intakeData, (msg) => {
      if (onMessage) onMessage({ ...msg, round: round + 1 });
    });

    allConsults.push(...roundResults);

    if (onRoundDone) onRoundDone(round + 1, roundResults);

    // Stop if no new consults were generated this round
    if (roundResults.length === 0) break;

    // Check if there are any follow-up questions in the results
    let hasFollowUp = false;
    for (const r of roundResults) {
      if (r.response) {
        const parsed = extractJSON(r.response);
        if (parsed && Array.isArray(parsed.additional_recommendations) && parsed.additional_recommendations.length > 0) {
          hasFollowUp = true;
          break;
        }
      }
    }
    if (!hasFollowUp) break;
  }

  if (onComplete) onComplete(allConsults);
  return allConsults;
}

// ─── Synthesis (async generator) ────────────────────────────────────────────

function condenseSynthesisInput(analyses, crossConsults, intakeData) {
  // Compact patient data - drop raw notes, keep structured fields
  const patientSummary = JSON.stringify({
    demographics: intakeData.demographics,
    chief_complaint: intakeData.chief_complaint,
    hpi: intakeData.hpi,
    active_problems: intakeData.active_problems,
    medications: intakeData.medications,
    vitals: intakeData.vitals,
    labs: intakeData.labs,
  });

  // Compact each specialist to findings/concerns/recommendations only
  const analystSummaries = Object.entries(analyses)
    .map(([specialist, analysis]) => {
      const config = SPECIALIST_CONFIG[specialist];
      const parts = [`## ${config ? config.name : specialist}`];
      if (analysis.findings && analysis.findings.length) {
        parts.push(`Findings: ${analysis.findings.join('; ')}`);
      }
      if (analysis.concerns && analysis.concerns.length) {
        parts.push(`Concerns: ${analysis.concerns.map(c => `[${c.severity}] ${c.detail}`).join('; ')}`);
      }
      if (analysis.recommendations && analysis.recommendations.length) {
        parts.push(`Recommendations: ${analysis.recommendations.map(r => {
          let s = r.recommendation;
          if (r.rationale) s += ` (${r.rationale})`;
          return s;
        }).join('; ')}`);
      }
      if (analysis.evidence_basis) parts.push(`Evidence: ${analysis.evidence_basis}`);
      return parts.join('\n');
    })
    .join('\n\n');

  // Compact cross-consults
  const consultNotes = crossConsults
    .map(cc => {
      const fromName = SPECIALIST_CONFIG[cc.from] ? SPECIALIST_CONFIG[cc.from].name : cc.from;
      const toName = SPECIALIST_CONFIG[cc.to] ? SPECIALIST_CONFIG[cc.to].name : cc.to;
      return `${fromName} \u2192 ${toName}: ${cc.message}`;
    })
    .join('\n');

  return { patientSummary, analystSummaries, consultNotes };
}

async function* runSynthesis(analyses, crossConsults, intakeData) {
  const { patientSummary, analystSummaries, consultNotes } = condenseSynthesisInput(analyses, crossConsults, intakeData);

  const stream = anthropic.messages.stream({
    model: OPUS_MODEL,
    max_tokens: 8192,
    system: ATTENDING_PROMPT,
    messages: [{
      role: 'user',
      content: `SYNTHESIZE the following specialist analyses into a unified Assessment & Plan organized by problem.

PATIENT DATA:
${patientSummary}

SPECIALIST ANALYSES:
${analystSummaries}

${consultNotes ? `CROSS-CONSULTATION NOTES:\n${consultNotes}` : ''}

Generate a problem-oriented A/P. For each problem:
- List the assessment
- List specific recommendations with the specialist who suggested them in parentheses
- Include guideline citations inline
- Flag areas of specialist disagreement
- Note confidence levels

Format as plain text suitable for pasting into Epic. Do NOT use markdown formatting.`,
    }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

// ─── Specialist chat ────────────────────────────────────────────────────────

async function runSpecialistChat(specialist, question, fullContext) {
  const config = SPECIALIST_CONFIG[specialist];
  if (!config) throw new Error(`Unknown specialist: ${specialist}`);
  const model = config.model === 'opus' ? OPUS_MODEL : SONNET_MODEL;

  // Build chat history context
  const chatHistoryContext = (fullContext.chatHistory || [])
    .map((msg) => {
      const role = msg.role === 'user'
        ? 'Clinician'
        : (SPECIALIST_CONFIG[msg.specialist] ? SPECIALIST_CONFIG[msg.specialist].name : msg.specialist);
      return `${role}: ${msg.content}`;
    })
    .join('\n');

  // Build relevant cross-consult context for this specialist
  const relevantConsults = (fullContext.crossConsults || []).filter(
    (cc) => cc.from === specialist || cc.to === specialist
  );

  const userMessage = `You are being asked a follow-up question by the clinician reviewing this case.

PATIENT SUMMARY:
Demographics: ${JSON.stringify(fullContext.intakeData.demographics)}
Chief Complaint: ${fullContext.intakeData.chief_complaint}
HPI: ${fullContext.intakeData.hpi}

YOUR PREVIOUS ANALYSIS:
${JSON.stringify(fullContext.analyses[specialist], null, 2)}

${relevantConsults.length > 0 ? `RELEVANT CROSS-CONSULTATION HISTORY:\n${JSON.stringify(relevantConsults, null, 2)}` : ''}

${fullContext.synthesizedPlan ? `SYNTHESIZED PLAN SUMMARY:\n${fullContext.synthesizedPlan.slice(0, 2000)}` : ''}

${chatHistoryContext ? `PREVIOUS CHAT MESSAGES:\n${chatHistoryContext}` : ''}

CLINICIAN'S QUESTION:
${question}

Respond with a JSON object:
{
  "response": "Your detailed answer to the clinician's question",
  "new_questions": [{"to": "specialist_enum_value", "question": "question for that specialist"}]
}

The "new_questions" array should contain questions for other specialists ONLY if the clinician's question raises cross-specialty concerns that need input from another team member. Usually this array will be empty.

Respond ONLY with the JSON object.`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: SPECIALIST_PROMPTS[specialist],
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  const jsonStr = extractJSON(text);
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return {
        response: parsed.response || text,
        triggeredQuestions: Array.isArray(parsed.new_questions) ? parsed.new_questions : [],
      };
    } catch {
      // Fall through to plain text response
    }
  }

  return { response: text, triggeredQuestions: [] };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  extractJSON,
  runIntake,
  runSingleSpecialist,
  runSpecialistsStreaming,
  runCrossConsultStreaming,
  runMultiRoundCrossConsult,
  runSynthesis,
  runSpecialistChat,
  routeTeamQuestion,
  condenseSynthesisInput,
  SPECIALIST_LIST,
  SPECIALIST_CONFIG,
  SPECIALIST_PROMPTS,
  SPECIALTY_KEYWORDS,
  SONNET_MODEL,
  OPUS_MODEL,
  WEB_SEARCH_TOOL,
  CODE_EXECUTION_TOOL,
};
