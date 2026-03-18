/* ===== ClinicalRounds — Client-Side Application ===== */
/* Matches original Next.js visual behavior with vanilla JS */

// ---------------------------------------------------------------------------
// Specialist Configuration (mirrors server-side SPECIALIST_CONFIG)
// ---------------------------------------------------------------------------
var SPECIALIST_CONFIG = {
  attending:       { name: 'Attending',       icon: '\u{1F468}\u200D\u2695\uFE0F' },
  cardiologist:    { name: 'Cardiology',      icon: '\u2764\uFE0F' },
  pulmonologist:   { name: 'Pulm/CC',         icon: '\u{1FAC1}' },
  nephrologist:    { name: 'Nephrology',       icon: '\u{1F9EA}' },
  hepatologist:    { name: 'Hepatology',       icon: '\u{1F7E1}' },
  hematologist:    { name: 'Hematology',       icon: '\u{1FA78}' },
  id_specialist:   { name: 'ID',              icon: '\u{1F9A0}' },
  radiologist:     { name: 'Radiology',        icon: '\u{1F4E1}' },
  pharmacist:      { name: 'Pharmacy',         icon: '\u{1F48A}' },
  endocrinologist: { name: 'Endocrinology',    icon: '\u{1F9EC}' },
  neurologist:     { name: 'Neurology',        icon: '\u{1F9E0}' },
  intensivist:     { name: 'Critical Care',    icon: '\u{1F3E5}' },
  oncologist:      { name: 'Oncology',         icon: '\u{1F397}\uFE0F' },
  psychiatrist:    { name: 'Psychiatry',       icon: '\u{1F9E9}' },
  toxicologist:    { name: 'Toxicology',       icon: '\u2620\uFE0F' },
  palliative:      { name: 'Palliative Care',  icon: '\u{1F54A}\uFE0F' },
};

var SPECIALIST_ORDER = [
  'attending', 'cardiologist', 'pulmonologist', 'nephrologist',
  'hepatologist', 'hematologist', 'id_specialist', 'radiologist',
  'pharmacist', 'endocrinologist', 'neurologist', 'intensivist',
  'oncologist', 'psychiatrist', 'toxicologist', 'palliative',
];

// Thinking messages per specialist (rotating during analysis)
var THINKING_MESSAGES = {
  attending:       ['Reviewing the clinical timeline...', 'Correlating symptoms with labs...', 'Evaluating differential diagnoses...', 'Assessing overall acuity level...', 'Integrating multi-system findings...'],
  cardiologist:    ['Reviewing cardiac biomarkers...', 'Evaluating ECG findings...', 'Assessing heart failure criteria...', 'Checking troponin trends...', 'Analyzing hemodynamic status...'],
  pulmonologist:   ['Analyzing respiratory mechanics...', 'Reviewing ABG and ventilator settings...', 'Evaluating oxygenation indices...', 'Assessing ARDS criteria...', 'Calculating P/F ratio...'],
  nephrologist:    ['Calculating creatinine clearance...', 'Reviewing electrolyte panel...', 'Assessing acid-base status...', 'Evaluating fluid balance...', 'Staging AKI severity...'],
  hepatologist:    ['Reviewing hepatic function panel...', 'Assessing coagulation markers...', 'Calculating MELD score...', 'Evaluating portal hypertension signs...', 'Reviewing bilirubin trends...'],
  hematologist:    ['Reviewing CBC with differential...', 'Assessing coagulation cascade...', 'Evaluating DIC criteria...', 'Checking transfusion parameters...', 'Reviewing fibrinogen and D-dimer...'],
  id_specialist:   ['Reviewing culture and sensitivity data...', 'Evaluating antimicrobial coverage...', 'Assessing infection source control...', 'Checking for resistant organisms...', 'Reviewing procalcitonin trends...'],
  radiologist:     ['Reviewing available imaging studies...', 'Correlating radiographic findings...', 'Assessing interval changes...', 'Evaluating line and tube positions...', 'Checking for acute findings...'],
  pharmacist:      ['Checking drug interactions...', 'Reviewing renal dosing adjustments...', 'Evaluating antibiotic coverage...', 'Assessing medication reconciliation...', 'Checking therapeutic drug levels...'],
  endocrinologist: ['Reviewing glucose management...', 'Assessing thyroid function...', 'Evaluating adrenal status...', 'Checking insulin requirements...', 'Reviewing HbA1c and glycemic trends...'],
  neurologist:     ['Reviewing neurological exam findings...', 'Assessing level of consciousness...', 'Evaluating seizure risk factors...', 'Checking sedation and delirium scores...', 'Analyzing encephalopathy workup...'],
  intensivist:     ['Classifying shock type...', 'Reviewing vasopressor plan...', 'Calculating SOFA score...', 'Assessing sepsis bundle compliance...', 'Evaluating sedation depth...'],
  oncologist:      ['Screening for oncologic emergencies...', 'Calculating neutropenic fever risk...', 'Assessing tumor lysis criteria...', 'Reviewing immunotherapy toxicities...', 'Checking VTE prophylaxis...'],
  psychiatrist:    ['Screening for delirium...', 'Assessing decision-making capacity...', 'Reviewing psychotropic medications...', 'Evaluating withdrawal risk...', 'Checking CAM-ICU criteria...'],
  toxicologist:    ['Identifying toxidrome pattern...', 'Calculating anion and osmolal gaps...', 'Evaluating antidote indications...', 'Reviewing drug levels...', 'Checking enhanced elimination criteria...'],
  palliative:      ['Assessing goals of care status...', 'Evaluating symptom burden...', 'Reviewing advance directives...', 'Calculating prognostic indices...', 'Considering hospice eligibility...'],
};

// Specialist cross-consult colors
var CC_COLORS = {
  attending:       { bg: 'background:#eff6ff;', border: 'border-left:3px solid #2563eb;', text: 'color:#1d4ed8;' },
  cardiologist:    { bg: 'background:#fef2f2;', border: 'border-left:3px solid #ef4444;', text: 'color:#b91c1c;' },
  pulmonologist:   { bg: 'background:#f0f9ff;', border: 'border-left:3px solid #0ea5e9;', text: 'color:#0369a1;' },
  nephrologist:    { bg: 'background:#f5f3ff;', border: 'border-left:3px solid #8b5cf6;', text: 'color:#6d28d9;' },
  hepatologist:    { bg: 'background:#fefce8;', border: 'border-left:3px solid #eab308;', text: 'color:#a16207;' },
  hematologist:    { bg: 'background:#fff1f2;', border: 'border-left:3px solid #f43f5e;', text: 'color:#be123c;' },
  id_specialist:   { bg: 'background:#f0fdf4;', border: 'border-left:3px solid #22c55e;', text: 'color:#15803d;' },
  radiologist:     { bg: 'background:#ecfeff;', border: 'border-left:3px solid #06b6d4;', text: 'color:#0e7490;' },
  pharmacist:      { bg: 'background:#fdf2f8;', border: 'border-left:3px solid #ec4899;', text: 'color:#be185d;' },
  endocrinologist: { bg: 'background:#ecfdf5;', border: 'border-left:3px solid #10b981;', text: 'color:#047857;' },
  neurologist:     { bg: 'background:#faf5ff;', border: 'border-left:3px solid #a855f7;', text: 'color:#7e22ce;' },
  intensivist:     { bg: 'background:#eff6ff;', border: 'border-left:3px solid #3b82f6;', text: 'color:#1d4ed8;' },
  oncologist:      { bg: 'background:#fef2f2;', border: 'border-left:3px solid #ef4444;', text: 'color:#b91c1c;' },
  psychiatrist:    { bg: 'background:#faf5ff;', border: 'border-left:3px solid #a855f7;', text: 'color:#7e22ce;' },
  toxicologist:    { bg: 'background:#fefce8;', border: 'border-left:3px solid #eab308;', text: 'color:#a16207;' },
  palliative:      { bg: 'background:#f0fdf4;', border: 'border-left:3px solid #22c55e;', text: 'color:#15803d;' },
};

// Workflow steps
var WORKFLOW_STEPS = [
  { id: 'upload', label: 'Upload', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>' },
  { id: 'analysis', label: 'Analysis', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>' },
  { id: 'discussion', label: 'Discussion', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' },
  { id: 'assessment', label: 'Assessment', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>' },
  { id: 'qa', label: 'Q&A', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' },
];
var CHECK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
var rawNotes = '';
var webSearchEnabled = true;
var intakeData = null;
var specialistResults = {};
var specialistStatuses = {};
var crossConsultMessages = [];
var crossConsultRounds = [];
var synthesisText = '';
var criticalAlerts = [];
var activityEvents = [];
var seenActivityKeys = {};
var thinkingIntervals = {};
var thinkingIndices = {};
var currentStep = 'upload'; // upload, analyzing, cross_consulting, synthesizing, complete, chatting
var timerStart = 0;
var timerInterval = null;
var ccTotal = 0;
var expandedCards = {};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
(function init() {
  rawNotes = sessionStorage.getItem('rawNotes') || '';
  webSearchEnabled = sessionStorage.getItem('webSearchEnabled') !== 'false';

  if (!rawNotes) {
    window.location.href = 'index.html';
    return;
  }

  buildWorkflowNav();
  buildSpecialistGrid();
  buildCCRoster();
  bindEvents();
  runPipeline();
})();

// ---------------------------------------------------------------------------
// Build Workflow Nav
// ---------------------------------------------------------------------------
function buildWorkflowNav() {
  var container = document.getElementById('workflow-steps');
  container.innerHTML = '';

  WORKFLOW_STEPS.forEach(function (step, idx) {
    var li = document.createElement('li');
    li.className = 'workflow-step-item';

    // Connector before (not first)
    if (idx > 0) {
      var connBefore = document.createElement('div');
      connBefore.className = 'workflow-connector';
      connBefore.dataset.connectorIndex = idx - 1;
      li.appendChild(connBefore);
    }

    // Step button
    var btn = document.createElement('button');
    btn.className = 'workflow-step-btn';
    btn.dataset.step = step.id;
    btn.title = step.label;

    var circle = document.createElement('div');
    circle.className = 'workflow-step-circle future';
    circle.innerHTML = step.icon;

    var label = document.createElement('span');
    label.className = 'workflow-step-label';
    label.textContent = step.label;

    btn.appendChild(circle);
    btn.appendChild(label);
    li.appendChild(btn);

    // Connector after (not last)
    if (idx < WORKFLOW_STEPS.length - 1) {
      var connAfter = document.createElement('div');
      connAfter.className = 'workflow-connector';
      connAfter.dataset.connectorIndex = idx;
      li.appendChild(connAfter);
    }

    container.appendChild(li);
  });

  updateWorkflowNav('upload');
}

function updateWorkflowNav(step) {
  var stepIndex = WORKFLOW_STEPS.findIndex(function (s) { return s.id === step; });
  if (stepIndex < 0) stepIndex = 0;

  WORKFLOW_STEPS.forEach(function (s, idx) {
    var btn = document.querySelector('.workflow-step-btn[data-step="' + s.id + '"]');
    var circle = btn.querySelector('.workflow-step-circle');
    var label = btn.querySelector('.workflow-step-label');

    circle.className = 'workflow-step-circle';
    label.className = 'workflow-step-label';

    if (idx < stepIndex) {
      circle.classList.add('completed');
      circle.innerHTML = CHECK_ICON;
      label.classList.add('completed');
    } else if (idx === stepIndex) {
      circle.classList.add('active');
      circle.innerHTML = s.icon;
      label.classList.add('active');
    } else {
      circle.classList.add('future');
      circle.innerHTML = s.icon;
    }
  });

  // Update connectors
  document.querySelectorAll('.workflow-connector').forEach(function (conn) {
    var ci = parseInt(conn.dataset.connectorIndex, 10);
    conn.className = 'workflow-connector';
    if (ci < stepIndex) conn.classList.add('completed');
    else if (ci === stepIndex - 1) conn.classList.add('active');
  });
}

// ---------------------------------------------------------------------------
// Build Specialist Grid
// ---------------------------------------------------------------------------
function buildSpecialistGrid() {
  var grid = document.getElementById('specialist-grid');
  grid.innerHTML = '';

  SPECIALIST_ORDER.forEach(function (key) {
    var config = SPECIALIST_CONFIG[key];
    specialistStatuses[key] = 'waiting';

    var card = document.createElement('div');
    card.className = 'specialist-card hover-lift';
    card.dataset.specialist = key;
    card.dataset.status = 'waiting';

    // Header (clickable to expand/collapse)
    var header = document.createElement('div');
    header.className = 'specialist-header';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.onclick = function () { toggleCard(key); };

    var iconBox = document.createElement('div');
    iconBox.className = 'specialist-icon-box waiting';
    iconBox.innerHTML = '<span>' + config.icon + '</span>';

    var nameArea = document.createElement('div');
    nameArea.className = 'specialist-name-area';
    var nameEl = document.createElement('span');
    nameEl.className = 'specialist-name';
    nameEl.textContent = config.name;
    var subtitle = document.createElement('div');
    subtitle.className = 'specialist-subtitle';
    subtitle.id = 'subtitle-' + key;
    nameArea.appendChild(nameEl);
    nameArea.appendChild(subtitle);

    var statusArea = document.createElement('div');
    statusArea.className = 'specialist-status-area';
    var countBadge = document.createElement('span');
    countBadge.className = 'concern-count-badge';
    countBadge.id = 'badge-' + key;
    var dot = document.createElement('div');
    dot.className = 'status-dot waiting';
    dot.id = 'dot-' + key;
    var chevron = document.createElement('div');
    chevron.className = 'chevron-icon';
    chevron.id = 'chevron-' + key;
    chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

    statusArea.appendChild(countBadge);
    statusArea.appendChild(dot);
    statusArea.appendChild(chevron);

    header.appendChild(iconBox);
    header.appendChild(nameArea);
    header.appendChild(statusArea);

    // Body (collapsible)
    var body = document.createElement('div');
    body.className = 'specialist-body';
    body.id = 'body-' + key;

    card.appendChild(header);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function toggleCard(key) {
  var body = document.getElementById('body-' + key);
  var chevron = document.getElementById('chevron-' + key);
  var card = document.querySelector('.specialist-card[data-specialist="' + key + '"]');
  var header = card.querySelector('.specialist-header');

  if (expandedCards[key]) {
    body.classList.remove('open');
    chevron.querySelector('svg').style.transform = '';
    card.classList.remove('expanded');
    header.setAttribute('aria-expanded', 'false');
    expandedCards[key] = false;
  } else {
    body.classList.add('open');
    chevron.querySelector('svg').style.transform = 'rotate(180deg)';
    card.classList.add('expanded');
    header.setAttribute('aria-expanded', 'true');
    expandedCards[key] = true;
  }
}

// ---------------------------------------------------------------------------
// Build CC Roster
// ---------------------------------------------------------------------------
function buildCCRoster() {
  var roster = document.getElementById('cc-roster');
  roster.innerHTML = '';
  SPECIALIST_ORDER.forEach(function (key) {
    var config = SPECIALIST_CONFIG[key];
    var badge = document.createElement('span');
    badge.className = 'cc-roster-badge';
    badge.dataset.specialist = key;
    badge.innerHTML = '<span>' + config.icon + '</span><span class="badge-name">' + escapeHTML(config.name) + '</span>';
    roster.appendChild(badge);
  });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function bindEvents() {
  document.getElementById('btn-new-case').addEventListener('click', resetCase);
  document.getElementById('btn-new-case-2').addEventListener('click', resetCase);

  document.getElementById('btn-copy').addEventListener('click', function () {
    navigator.clipboard.writeText(synthesisText).then(function () {
      var btn = document.getElementById('btn-copy');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Copied!';
      setTimeout(function () {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copy for Epic';
      }, 2000);
    });
  });

  document.getElementById('btn-chat-open').addEventListener('click', openChatModal);
  document.getElementById('modal-close').addEventListener('click', closeChatModal);
  document.getElementById('btn-chat-cancel').addEventListener('click', closeChatModal);
  document.getElementById('btn-chat-send').addEventListener('click', sendChatMessage);
  document.getElementById('chat-modal').addEventListener('click', function (e) {
    if (e.target === this) closeChatModal();
  });
  document.getElementById('chat-question').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  document.getElementById('btn-proceed-synthesis').addEventListener('click', function () {
    document.getElementById('steering-panel').classList.add('hidden');
    runSynthesis();
  });
}

function resetCase() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
async function runPipeline() {
  try {
    // Show analysis view, hide others
    show('analysis-view');
    show('phase-banner');
    updateWorkflowNav('analysis');
    document.getElementById('btn-new-case').classList.remove('hidden');
    startTimer();

    await runAnalyze();

    stopTimer();
    hide('phase-banner');
    hide('progress-container');

    // Cross-consultation
    updateWorkflowNav('discussion');
    show('cross-consult-view');
    await runCrossConsult();

    // Show steering or auto-proceed
    document.getElementById('cc-ping').classList.add('hidden');
    show('steering-panel');
  } catch (err) {
    console.error('Pipeline error:', err);
    showError(err.message || String(err));
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Analyze (SSE stream)
// ---------------------------------------------------------------------------
async function runAnalyze() {
  var response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawNotes: rawNotes, webSearchEnabled: webSearchEnabled })
  });

  if (!response.ok) throw new Error('Analyze request failed: ' + response.status);

  await readSSEStream(response, function (event) {
    switch (event.type) {
      case 'intake_complete':
        intakeData = event.intakeData;
        show('progress-container');
        setAllSpecialistsAnalyzing();
        updatePhaseBanner('Specialist Analysis in Progress', '0 of 16 complete');
        break;

      case 'specialist_complete':
        specialistResults[event.specialist] = event.analysis;
        specialistStatuses[event.specialist] = hasCriticalConcerns(event.analysis) ? 'critical' : 'complete';
        updateSpecialistUI(event.specialist);
        updateProgress();
        checkCriticalAlerts(event.specialist, event.analysis);
        addActivity('complete', event.specialist);
        break;

      case 'specialist_error':
        specialistStatuses[event.specialist] = 'error';
        updateSpecialistUI(event.specialist);
        updateProgress();
        addActivity('critical', event.specialist, 'Error: ' + (event.error || 'Analysis failed'));
        break;

      case 'specialist_search':
        addActivity('search', event.specialist, 'Searching: "' + truncate(event.query, 50) + '"');
        showSearchOnCard(event.specialist, event.query);
        break;

      case 'specialist_calculation':
        addActivity('calculation', event.specialist, 'Calculating: ' + truncate((event.code || '').split('\n')[0], 40));
        break;

      case 'analyze_done':
        break;
    }
  });
}

function setAllSpecialistsAnalyzing() {
  SPECIALIST_ORDER.forEach(function (key) {
    specialistStatuses[key] = 'analyzing';
    updateSpecialistUI(key);
    addActivity('start', key);
    startThinking(key);
  });
}

function startThinking(key) {
  thinkingIndices[key] = 0;
  var msgs = THINKING_MESSAGES[key] || ['Analyzing...'];
  updateThinkingText(key, msgs[0]);
  thinkingIntervals[key] = setInterval(function () {
    thinkingIndices[key] = (thinkingIndices[key] + 1) % msgs.length;
    updateThinkingText(key, msgs[thinkingIndices[key]]);
  }, 3500);
}

function stopThinking(key) {
  if (thinkingIntervals[key]) {
    clearInterval(thinkingIntervals[key]);
    delete thinkingIntervals[key];
  }
}

function updateThinkingText(key, text) {
  var sub = document.getElementById('subtitle-' + key);
  if (sub && specialistStatuses[key] === 'analyzing') {
    sub.className = 'specialist-subtitle analyzing';
    sub.innerHTML = '<span class="loading-spinner sm" style="margin-right:0.25rem;border-color:var(--primary);border-right-color:transparent;"></span>' + escapeHTML(text);
  }
}

function showSearchOnCard(key, query) {
  var body = document.getElementById('body-' + key);
  // Only show during analyzing
  if (specialistStatuses[key] !== 'analyzing') return;
  var existing = body.querySelector('.search-activity');
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.className = 'search-activity';
  div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><span>Searching: <span class="search-query">' + escapeHTML(truncate(query, 40)) + '</span></span>';
  body.insertBefore(div, body.firstChild);
  // Auto-expand card to show search
  if (!expandedCards[key]) toggleCard(key);
}

function updateSpecialistUI(key) {
  var status = specialistStatuses[key];
  var card = document.querySelector('.specialist-card[data-specialist="' + key + '"]');
  if (!card) return;
  card.dataset.status = status;

  var iconBox = card.querySelector('.specialist-icon-box');
  iconBox.className = 'specialist-icon-box ' + status;

  var dot = document.getElementById('dot-' + key);
  dot.className = 'status-dot ' + status;

  var sub = document.getElementById('subtitle-' + key);
  var badge = document.getElementById('badge-' + key);
  var body = document.getElementById('body-' + key);
  var analysis = specialistResults[key];

  if (status === 'complete' || status === 'critical') {
    stopThinking(key);
    var findings = (analysis && Array.isArray(analysis.findings)) ? analysis.findings : [];
    var recommendations = (analysis && Array.isArray(analysis.recommendations)) ? analysis.recommendations : [];
    var concerns = (analysis && Array.isArray(analysis.concerns)) ? analysis.concerns : [];

    sub.className = 'specialist-subtitle ' + (status === 'critical' ? 'critical' : 'complete');
    if (status === 'critical') {
      var critCount = concerns.filter(function (c) { return c.severity === 'critical'; }).length;
      sub.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ' + critCount + ' critical';
    } else {
      sub.textContent = findings.length + ' findings, ' + recommendations.length + ' recommendations';
    }

    if (concerns.length > 0) {
      badge.textContent = concerns.length;
      badge.style.display = '';
    }

    // Build body content
    renderSpecialistBody(key, analysis);
  } else if (status === 'error') {
    stopThinking(key);
    sub.className = 'specialist-subtitle critical';
    sub.textContent = 'Analysis unavailable';
  }
}

function renderSpecialistBody(key, analysis) {
  var body = document.getElementById('body-' + key);
  body.innerHTML = '';

  var findings = analysis.findings || [];
  var concerns = analysis.concerns || [];
  var recommendations = analysis.recommendations || [];
  var citations = analysis.web_search_citations || [];
  var calculations = analysis.calculations_performed || [];

  // Findings
  if (findings.length > 0) {
    body.innerHTML += '<div class="section-label">Findings</div>';
    findings.forEach(function (f) {
      body.innerHTML += '<div class="finding-item"><span class="finding-bullet">&bull;</span><span>' + escapeHTML(f) + '</span></div>';
    });
  }

  // Concerns
  if (concerns.length > 0) {
    body.innerHTML += '<div class="separator"></div><div class="section-label">Concerns</div>';
    concerns.forEach(function (c) {
      var sev = (c.severity || 'medium').toLowerCase();
      body.innerHTML += '<div class="concern-badge ' + sev + '"><span class="severity-label">' + escapeHTML(sev) + '</span><span class="severity-sep">|</span>' + escapeHTML(c.detail || c.text || c.description || '') + '</div>';
    });
  }

  // Recommendations
  if (recommendations.length > 0) {
    body.innerHTML += '<div class="separator"></div><div class="section-label">Recommendations</div>';
    recommendations.forEach(function (r) {
      var html = '<div class="recommendation-item"><span class="rec-text">' + escapeHTML(r.recommendation || r) + '</span>';
      if (r.rationale) html += '<span class="rec-rationale"> — ' + escapeHTML(r.rationale) + '</span>';
      html += '</div>';
      body.innerHTML += html;
    });
  }

  // Citations
  if (citations.length > 0) {
    body.innerHTML += '<div class="separator"></div><div class="section-label">Sources</div>';
    citations.forEach(function (c) {
      var html = '<div style="margin-bottom:0.375rem;"><a href="' + escapeAttr(c.url) + '" target="_blank" rel="noopener noreferrer" class="citation-link"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>' + escapeHTML(c.title) + '</a>';
      if (c.page_age) html += '<span class="citation-age">(' + escapeHTML(c.page_age) + ')</span>';
      html += '</div>';
      body.innerHTML += html;
    });
  }

  // Calculations
  if (calculations.length > 0) {
    body.innerHTML += '<div class="separator"></div><div class="section-label">Calculations</div>';
    calculations.forEach(function (calc) {
      var html = '<div class="calc-result"><div style="display:flex;align-items:center;gap:0.375rem;margin-bottom:0.25rem;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="' + (calc.success ? '#d97706' : '#ef4444') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg><span style="font-weight:500;color:' + (calc.success ? '#a16207' : '#b91c1c') + ';">' + (calc.success ? 'Computed' : 'Error') + '</span></div>';
      if (calc.result) html += '<pre>' + escapeHTML(calc.result) + '</pre>';
      html += '</div>';
      body.innerHTML += html;
    });
  }
}

function updateProgress() {
  var completed = 0;
  SPECIALIST_ORDER.forEach(function (key) {
    var s = specialistStatuses[key];
    if (s === 'complete' || s === 'critical' || s === 'error') completed++;
  });
  var total = SPECIALIST_ORDER.length;
  document.getElementById('progress-count').textContent = completed + '/' + total;
  document.getElementById('progress-fill').style.width = Math.round((completed / total) * 100) + '%';
  updatePhaseBanner('Specialist Analysis in Progress', completed + ' of ' + total + ' complete');
}

function hasCriticalConcerns(analysis) {
  if (!analysis || !Array.isArray(analysis.concerns)) return false;
  return analysis.concerns.some(function (c) { return c.severity === 'critical'; });
}

function checkCriticalAlerts(specialist, analysis) {
  if (!analysis || !Array.isArray(analysis.concerns)) return;
  analysis.concerns.forEach(function (c) {
    if (c.severity === 'critical') {
      var config = SPECIALIST_CONFIG[specialist];
      criticalAlerts.push((config ? config.name : specialist) + ': ' + (c.detail || c.text || c.description || 'Critical concern'));
    }
  });
  if (criticalAlerts.length > 0) {
    var list = document.getElementById('critical-alert-list');
    list.innerHTML = '';
    criticalAlerts.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
    document.getElementById('critical-alert').classList.add('visible');
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Cross-Consultation (SSE stream)
// ---------------------------------------------------------------------------
async function runCrossConsult() {
  document.getElementById('cc-ping').classList.remove('hidden');

  var response = await fetch('/api/cross-consult', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analyses: specialistResults, intakeData: intakeData })
  });

  if (!response.ok) throw new Error('Cross-consult request failed: ' + response.status);

  await readSSEStream(response, function (event) {
    switch (event.type) {
      case 'round_start':
        document.getElementById('cc-round-badge').classList.remove('hidden');
        document.getElementById('cc-round-badge').textContent = 'Round ' + event.round + '/3';
        break;

      case 'cross_consult_message':
        var msg = event.message;
        crossConsultMessages.push(msg);
        renderCCExchange(msg);
        updateCCRoster(msg);
        document.getElementById('cc-waiting').style.display = 'none';
        document.getElementById('cc-count').textContent = crossConsultMessages.length + '/' + Math.max(crossConsultMessages.length, ccTotal || crossConsultMessages.length);
        break;

      case 'round_done':
        crossConsultRounds.push({ round: event.round, count: event.count });
        break;

      case 'all_rounds_complete':
        ccTotal = event.totalConsults;
        document.getElementById('cc-count').textContent = crossConsultMessages.length + '/' + ccTotal;
        break;
    }
  });
}

function renderCCExchange(ex) {
  var feed = document.getElementById('cc-exchange-feed');
  var fromConfig = SPECIALIST_CONFIG[ex.from] || { name: ex.from, icon: '' };
  var toConfig = SPECIALIST_CONFIG[ex.to] || { name: ex.to, icon: '' };
  var colors = CC_COLORS[ex.from] || { bg: '', border: 'border-left:3px solid var(--primary);', text: 'color:var(--primary);' };

  var card = document.createElement('div');
  card.className = 'cc-exchange-card';
  card.style.animationDelay = (crossConsultMessages.length * 80) + 'ms';

  card.innerHTML =
    '<div class="cc-exchange-header" style="' + colors.bg + '">' +
      '<span>' + fromConfig.icon + '</span>' +
      '<span class="from-name" style="' + colors.text + '">' + escapeHTML(fromConfig.name) + '</span>' +
      '<span class="arrow-icon">&rarr;</span>' +
      '<span>' + toConfig.icon + '</span>' +
      '<span class="to-name">' + escapeHTML(toConfig.name) + '</span>' +
    '</div>' +
    '<div class="cc-exchange-body">' +
      '<div class="cc-question" style="' + colors.border + '"><p>' + escapeHTML(ex.message) + '</p></div>' +
      (ex.response ? (
        '<div class="cc-response-label"><span>' + toConfig.icon + '</span><span>' + escapeHTML(toConfig.name) + ' responds:</span></div>' +
        '<p class="cc-response-text">' + escapeHTML(ex.response) + '</p>'
      ) : '') +
    '</div>';

  feed.appendChild(card);
  feed.scrollTop = feed.scrollHeight;
}

function updateCCRoster(msg) {
  [msg.from, msg.to].forEach(function (key) {
    var badge = document.querySelector('.cc-roster-badge[data-specialist="' + key + '"]');
    if (badge) badge.classList.add('participated');
  });
  // Highlight latest
  document.querySelectorAll('.cc-roster-badge.latest').forEach(function (b) { b.classList.remove('latest'); });
  [msg.from, msg.to].forEach(function (key) {
    var badge = document.querySelector('.cc-roster-badge[data-specialist="' + key + '"]');
    if (badge) badge.classList.add('latest');
  });
}

// ---------------------------------------------------------------------------
// Phase 3: Synthesis (streaming text)
// ---------------------------------------------------------------------------
async function runSynthesis() {
  currentStep = 'synthesizing';
  updateWorkflowNav('assessment');
  hide('cross-consult-view');
  show('assessment-view');
  document.getElementById('synthesis-ping').classList.remove('hidden');
  document.getElementById('synthesis-text').style.display = 'none';
  document.getElementById('synthesis-loading').style.display = '';

  synthesisText = '';

  var response = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analyses: specialistResults, crossConsults: crossConsultMessages, intakeData: intakeData })
  });

  if (!response.ok) throw new Error('Synthesis request failed: ' + response.status);

  document.getElementById('synthesis-loading').style.display = 'none';
  var textEl = document.getElementById('synthesis-text');
  textEl.style.display = '';

  var reader = response.body.getReader();
  var decoder = new TextDecoder();

  while (true) {
    var result = await reader.read();
    if (result.done) break;
    var chunk = decoder.decode(result.value, { stream: true });
    synthesisText += chunk;
    textEl.textContent = synthesisText;
    // Auto-scroll
    var container = document.getElementById('assessment-content');
    container.scrollTop = container.scrollHeight;
  }

  // Complete
  document.getElementById('synthesis-ping').classList.add('hidden');
  document.getElementById('btn-copy').disabled = false;
  updateWorkflowNav('qa');
  show('complete-actions');
  currentStep = 'complete';
}

// ---------------------------------------------------------------------------
// Activity Feed
// ---------------------------------------------------------------------------
function addActivity(type, specialist, message) {
  var config = SPECIALIST_CONFIG[specialist];
  if (!config) return;

  var key = type + ':' + specialist + ':' + (message || '');
  if (seenActivityKeys[key]) return;
  seenActivityKeys[key] = true;

  if (!message) {
    switch (type) {
      case 'start': message = config.name + ' is analyzing the case...'; break;
      case 'complete':
        var a = specialistResults[specialist];
        var fc = (a && a.findings) ? a.findings.length : 0;
        var cc = (a && a.concerns) ? a.concerns.length : 0;
        message = config.name + ' complete \u2014 ' + fc + ' finding' + (fc !== 1 ? 's' : '') + ', ' + cc + ' concern' + (cc !== 1 ? 's' : '');
        break;
      case 'critical': message = 'CRITICAL: ' + config.name + ' flagged an issue'; break;
    }
  }

  activityEvents.push({ type: type, specialist: specialist, message: message });

  var list = document.getElementById('activity-feed-list');
  // Clear placeholder
  if (activityEvents.length === 1) list.innerHTML = '';

  var item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = '<div class="activity-dot ' + type + '"></div><p class="activity-text ' + type + '"><span style="margin-right:0.25rem;">' + config.icon + '</span>' + escapeHTML(message) + '</p>';
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------
function startTimer() {
  timerStart = Date.now();
  timerInterval = setInterval(function () {
    var elapsed = Math.floor((Date.now() - timerStart) / 1000);
    var mins = Math.floor(elapsed / 60);
    var secs = elapsed % 60;
    document.getElementById('phase-timer').textContent = mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updatePhaseBanner(title, subtitle) {
  document.getElementById('phase-banner-title').textContent = title;
  document.getElementById('phase-banner-subtitle').textContent = subtitle;
}

// ---------------------------------------------------------------------------
// Chat Modal
// ---------------------------------------------------------------------------
function openChatModal() {
  var modal = document.getElementById('chat-modal');
  var select = document.getElementById('chat-specialist-select');

  select.innerHTML = '<option value="">Select a specialist...</option>';
  SPECIALIST_ORDER.forEach(function (key) {
    if (specialistResults[key]) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = SPECIALIST_CONFIG[key].icon + ' ' + SPECIALIST_CONFIG[key].name;
      select.appendChild(opt);
    }
  });

  document.getElementById('chat-question').value = '';
  document.getElementById('chat-messages').innerHTML = '';
  modal.classList.add('visible');
}

function closeChatModal() {
  document.getElementById('chat-modal').classList.remove('visible');
}

async function sendChatMessage() {
  var select = document.getElementById('chat-specialist-select');
  var textarea = document.getElementById('chat-question');
  var messagesEl = document.getElementById('chat-messages');
  var specialist = select.value;
  var question = textarea.value.trim();

  if (!specialist || !question) return;

  var userMsg = document.createElement('div');
  userMsg.className = 'chat-msg chat-msg-user';
  userMsg.textContent = question;
  messagesEl.appendChild(userMsg);
  textarea.value = '';

  var sendBtn = document.getElementById('btn-chat-send');
  sendBtn.disabled = true;

  try {
    var response = await fetch('/api/specialist-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialist: specialist,
        message: question,
        chatHistory: [],
        intakeData: intakeData,
        analyses: specialistResults,
        crossConsults: crossConsultMessages,
        synthesizedPlan: synthesisText,
      })
    });

    if (!response.ok) throw new Error('Chat request failed');

    var data = await response.json();

    var specMsg = document.createElement('div');
    specMsg.className = 'chat-msg chat-msg-specialist animate-fade-in';
    specMsg.textContent = data.response || 'No response received.';
    messagesEl.appendChild(specMsg);
  } catch (e) {
    var errMsg = document.createElement('div');
    errMsg.className = 'chat-msg chat-msg-specialist';
    errMsg.style.color = 'var(--destructive)';
    errMsg.textContent = 'Error: ' + e.message;
    messagesEl.appendChild(errMsg);
  } finally {
    sendBtn.disabled = false;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

// ---------------------------------------------------------------------------
// SSE Stream Reader
// ---------------------------------------------------------------------------
async function readSSEStream(response, handler) {
  var reader = response.body.getReader();
  var decoder = new TextDecoder();
  var buffer = '';

  while (true) {
    var result = await reader.read();
    if (result.done) break;

    buffer += decoder.decode(result.value, { stream: true });
    var lines = buffer.split('\n');
    buffer = lines.pop();

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.startsWith('data: ')) {
        try {
          var event = JSON.parse(line.slice(6));
          handler(event);
        } catch (e) {
          console.warn('SSE parse error:', e);
        }
      }
    }
  }

  if (buffer.trim().startsWith('data: ')) {
    try {
      handler(JSON.parse(buffer.trim().slice(6)));
    } catch (e) { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function escapeHTML(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length <= maxLen ? str : str.substring(0, maxLen) + '...';
}

function show(id) {
  document.getElementById(id).classList.remove('hidden');
}

function hide(id) {
  document.getElementById(id).classList.add('hidden');
}

function showError(message) {
  var banner = document.getElementById('error-banner');
  banner.innerHTML = '<strong style="color:var(--destructive);">Error:</strong> ' + escapeHTML(message);
  banner.classList.add('visible');
}
