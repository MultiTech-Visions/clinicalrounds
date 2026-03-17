/* ===== ClinicalRounds - Client-Side Application ===== */

// ---------------------------------------------------------------------------
// Specialist Configuration
// ---------------------------------------------------------------------------
const SPECIALIST_CONFIG = {
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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let rawNotes = '';
let webSearchEnabled = true;
let intakeData = null;
let specialistResults = {};
let synthesisText = '';
let criticalAlerts = [];
const PHASES = ['intake', 'specialists', 'cross_consult', 'synthesis', 'complete'];

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

  buildSpecialistGrid();
  bindEvents();
  runPipeline();
})();

// ---------------------------------------------------------------------------
// Build UI
// ---------------------------------------------------------------------------
function buildSpecialistGrid() {
  const grid = document.getElementById('specialist-grid');
  grid.innerHTML = '';

  for (const [key, config] of Object.entries(SPECIALIST_CONFIG)) {
    const card = document.createElement('div');
    card.className = 'specialist-card';
    card.dataset.status = 'waiting';
    card.dataset.specialist = key;
    card.innerHTML =
      '<div class="specialist-header">' +
        '<span class="specialist-icon">' + config.icon + '</span>' +
        '<span class="specialist-name">' + config.name + '</span>' +
        '<span class="status-dot"></span>' +
      '</div>' +
      '<div class="specialist-body"></div>';
    grid.appendChild(card);
  }
}

// ---------------------------------------------------------------------------
// Event Binding
// ---------------------------------------------------------------------------
function bindEvents() {
  document.getElementById('shutdown-btn').addEventListener('click', async function () {
    try {
      await fetch('/api/shutdown', { method: 'POST' });
    } catch (e) { /* server may close */ }
    window.close();
  });

  document.getElementById('btn-new-case').addEventListener('click', function () {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('btn-ask-specialist').addEventListener('click', openChatModal);
  document.getElementById('modal-close').addEventListener('click', closeChatModal);
  document.getElementById('btn-chat-cancel').addEventListener('click', closeChatModal);
  document.getElementById('btn-chat-send').addEventListener('click', sendChatMessage);

  // Close modal on overlay click
  document.getElementById('chat-modal').addEventListener('click', function (e) {
    if (e.target === this) closeChatModal();
  });

  // Enter key in chat textarea
  document.getElementById('chat-question').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

// ---------------------------------------------------------------------------
// Phase Management
// ---------------------------------------------------------------------------
function updatePhase(phase) {
  const steps = document.querySelectorAll('.phase-step');
  const phaseIndex = PHASES.indexOf(phase);

  steps.forEach(function (step, i) {
    step.classList.remove('active', 'done');
    if (i < phaseIndex) {
      step.classList.add('done');
    } else if (i === phaseIndex) {
      step.classList.add('active');
    }
  });
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
async function runPipeline() {
  try {
    // Phase 1: Analyze (intake + specialists via SSE)
    updatePhase('intake');
    await runAnalyze();

    // Phase 2: Cross-consultation
    updatePhase('cross_consult');
    await runCrossConsult();

    // Phase 3: Synthesis
    updatePhase('synthesis');
    await runSynthesis();

    // Complete
    updatePhase('complete');
    document.getElementById('action-buttons').classList.add('visible');
  } catch (err) {
    console.error('Pipeline error:', err);
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Analyze (SSE stream)
// ---------------------------------------------------------------------------
async function runAnalyze() {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawNotes: rawNotes, webSearchEnabled: webSearchEnabled })
  });

  if (!response.ok) {
    throw new Error('Analyze request failed: ' + response.status);
  }

  await readSSEStream(response, handleAnalyzeEvent);
}

function handleAnalyzeEvent(event) {
  switch (event.type) {
    case 'intake_complete':
      intakeData = event.data;
      updatePatientSummary(event.data);
      updatePhase('specialists');
      // Set all specialists to analyzing
      setAllSpecialistsStatus('analyzing');
      break;

    case 'specialist_complete':
      specialistResults[event.specialist] = event.data;
      updateSpecialistCard(event.specialist, 'complete', event.data);
      checkCriticalAlerts(event.specialist, event.data);
      break;

    case 'specialist_error':
      updateSpecialistCard(event.specialist, 'error', { error: event.error || 'Analysis failed' });
      break;

    case 'analyze_done':
      // All specialists done; pipeline continues
      break;

    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Cross-Consultation (SSE stream)
// ---------------------------------------------------------------------------
async function runCrossConsult() {
  var panel = document.getElementById('cross-consult-panel');
  panel.style.display = 'block';

  var response = await fetch('/api/cross-consult', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeData: intakeData,
      specialistResults: specialistResults,
      webSearchEnabled: webSearchEnabled
    })
  });

  if (!response.ok) {
    throw new Error('Cross-consult request failed: ' + response.status);
  }

  await readSSEStream(response, handleCrossConsultEvent);
}

function handleCrossConsultEvent(event) {
  if (event.type === 'consult_message') {
    addCrossConsultMessage(event.data);
  } else if (event.type === 'specialist_update') {
    // Update specialist data after cross-consult round
    if (event.specialist && event.data) {
      specialistResults[event.specialist] = event.data;
      updateSpecialistCard(event.specialist, 'complete', event.data);
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 3: Synthesis (streaming text)
// ---------------------------------------------------------------------------
async function runSynthesis() {
  var view = document.getElementById('synthesis-view');
  view.style.display = 'block';

  var content = document.getElementById('synthesis-content');
  content.innerHTML = '<span class="synthesis-cursor"></span>';
  synthesisText = '';

  var response = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeData: intakeData,
      specialistResults: specialistResults,
      webSearchEnabled: webSearchEnabled
    })
  });

  if (!response.ok) {
    throw new Error('Synthesis request failed: ' + response.status);
  }

  var reader = response.body.getReader();
  var decoder = new TextDecoder();

  while (true) {
    var result = await reader.read();
    if (result.done) break;
    var chunk = decoder.decode(result.value, { stream: true });
    appendSynthesisText(chunk);
  }

  // Remove cursor after streaming completes
  var cursor = content.querySelector('.synthesis-cursor');
  if (cursor) cursor.remove();
}

// ---------------------------------------------------------------------------
// UI Update Functions
// ---------------------------------------------------------------------------
function updatePatientSummary(data) {
  var el = document.getElementById('patient-summary');
  var parts = [];

  if (data.demographics) parts.push('<strong>' + escapeHTML(data.demographics) + '</strong>');
  if (data.chiefComplaint) parts.push('CC: ' + escapeHTML(data.chiefComplaint));
  if (data.admitDate) parts.push('Admitted: ' + escapeHTML(data.admitDate));

  if (parts.length > 0) {
    el.innerHTML = parts.join(' &mdash; ');
    el.classList.add('visible');
  }
}

function setAllSpecialistsStatus(status) {
  var cards = document.querySelectorAll('.specialist-card');
  cards.forEach(function (card) {
    card.dataset.status = status;
    if (status === 'analyzing') {
      card.querySelector('.specialist-body').innerHTML = '';
    }
  });
}

function updateSpecialistCard(specialist, status, data) {
  var card = document.querySelector('.specialist-card[data-specialist="' + specialist + '"]');
  if (!card) return;

  card.dataset.status = status;
  var body = card.querySelector('.specialist-body');

  if (status === 'complete' && data) {
    var html = '';

    // Key findings count
    var findingsCount = 0;
    if (data.keyFindings && Array.isArray(data.keyFindings)) {
      findingsCount = data.keyFindings.length;
    } else if (data.findings && Array.isArray(data.findings)) {
      findingsCount = data.findings.length;
    }

    if (findingsCount > 0) {
      html += '<div class="findings-count">' + findingsCount + ' finding' + (findingsCount !== 1 ? 's' : '') + '</div>';
    }

    // Concern severity badges
    if (data.concerns && Array.isArray(data.concerns)) {
      data.concerns.forEach(function (concern) {
        var severity = (concern.severity || 'moderate').toLowerCase();
        html += '<span class="badge badge-' + severity + '">' + escapeHTML(severity) + '</span> ';
      });
    } else if (data.severity) {
      var sev = data.severity.toLowerCase();
      html += '<span class="badge badge-' + sev + '">' + escapeHTML(sev) + '</span>';
    }

    // Brief summary
    if (data.summary) {
      html += '<div style="margin-top:0.4rem;font-size:0.78rem;color:var(--text-muted);line-height:1.4;">' +
        escapeHTML(truncate(data.summary, 120)) + '</div>';
    }

    body.innerHTML = html;
  } else if (status === 'error') {
    body.innerHTML = '<span style="color:var(--danger);font-size:0.78rem;">' +
      escapeHTML(data.error || 'Error') + '</span>';
  }
}

function checkCriticalAlerts(specialist, data) {
  var hasCritical = false;
  var alertTexts = [];

  if (data.concerns && Array.isArray(data.concerns)) {
    data.concerns.forEach(function (concern) {
      if (concern.severity && concern.severity.toLowerCase() === 'critical') {
        hasCritical = true;
        var config = SPECIALIST_CONFIG[specialist];
        var label = config ? config.name : specialist;
        alertTexts.push(label + ': ' + (concern.text || concern.description || 'Critical concern'));
      }
    });
  }

  if (data.severity && data.severity.toLowerCase() === 'critical') {
    hasCritical = true;
    var config2 = SPECIALIST_CONFIG[specialist];
    var label2 = config2 ? config2.name : specialist;
    alertTexts.push(label2 + ': Critical severity finding');
  }

  if (hasCritical) {
    // Update card status to critical
    var card = document.querySelector('.specialist-card[data-specialist="' + specialist + '"]');
    if (card) card.dataset.status = 'critical';

    // Add to banner
    alertTexts.forEach(function (text) {
      criticalAlerts.push(text);
    });
    renderCriticalAlerts();
  }
}

function renderCriticalAlerts() {
  var banner = document.getElementById('critical-alert');
  var list = document.getElementById('critical-alert-list');

  if (criticalAlerts.length === 0) return;

  list.innerHTML = '';
  criticalAlerts.forEach(function (alert) {
    var li = document.createElement('li');
    li.textContent = alert;
    list.appendChild(li);
  });
  banner.classList.add('visible');
}

function addCrossConsultMessage(msg) {
  var container = document.getElementById('cross-consult-messages');

  var div = document.createElement('div');
  div.className = 'consult-message fade-in';

  var fromConfig = SPECIALIST_CONFIG[msg.from] || { name: msg.from };
  var toConfig = SPECIALIST_CONFIG[msg.to] || { name: msg.to };

  div.innerHTML =
    '<span class="consult-from">' + escapeHTML(fromConfig.name) + '</span>' +
    '<span class="consult-arrow">&rarr;</span>' +
    '<span class="consult-to">' + escapeHTML(toConfig.name) + '</span>' +
    '<span class="consult-text">' + escapeHTML(truncate(msg.text || msg.message || '', 200)) + '</span>';

  container.appendChild(div);

  // Auto-scroll
  var panel = document.getElementById('cross-consult-panel');
  panel.scrollTop = panel.scrollHeight;
}

function appendSynthesisText(text) {
  synthesisText += text;
  var content = document.getElementById('synthesis-content');

  // Render text, keeping cursor at end
  content.innerHTML = escapeHTML(synthesisText) + '<span class="synthesis-cursor"></span>';

  // Auto-scroll synthesis view into view
  var view = document.getElementById('synthesis-view');
  view.scrollTop = view.scrollHeight;
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
    buffer = lines.pop(); // keep incomplete line

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.startsWith('data: ')) {
        try {
          var event = JSON.parse(line.slice(6));
          handler(event);
        } catch (e) {
          console.warn('Failed to parse SSE event:', line, e);
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim().startsWith('data: ')) {
    try {
      var lastEvent = JSON.parse(buffer.trim().slice(6));
      handler(lastEvent);
    } catch (e) { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Specialist Chat
// ---------------------------------------------------------------------------
function openChatModal() {
  var modal = document.getElementById('chat-modal');
  var select = document.getElementById('chat-specialist-select');

  // Populate specialist options
  select.innerHTML = '<option value="">Select a specialist...</option>';
  for (var key in SPECIALIST_CONFIG) {
    if (specialistResults[key]) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = SPECIALIST_CONFIG[key].icon + ' ' + SPECIALIST_CONFIG[key].name;
      select.appendChild(opt);
    }
  }

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

  // Show user message
  var userMsg = document.createElement('div');
  userMsg.className = 'chat-msg chat-msg-user';
  userMsg.textContent = question;
  messagesEl.appendChild(userMsg);
  textarea.value = '';

  // Disable send button while waiting
  var sendBtn = document.getElementById('btn-chat-send');
  sendBtn.disabled = true;

  try {
    var response = await fetch('/api/specialist-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialist: specialist,
        question: question,
        intakeData: intakeData,
        specialistResult: specialistResults[specialist]
      })
    });

    if (!response.ok) throw new Error('Chat request failed');

    var data = await response.json();

    var specialistMsg = document.createElement('div');
    specialistMsg.className = 'chat-msg chat-msg-specialist fade-in';
    specialistMsg.textContent = data.response || data.answer || 'No response received.';
    messagesEl.appendChild(specialistMsg);
  } catch (e) {
    var errMsg = document.createElement('div');
    errMsg.className = 'chat-msg chat-msg-specialist';
    errMsg.style.color = 'var(--danger)';
    errMsg.textContent = 'Error: Could not reach specialist. ' + e.message;
    messagesEl.appendChild(errMsg);
  } finally {
    sendBtn.disabled = false;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------
function escapeHTML(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}
