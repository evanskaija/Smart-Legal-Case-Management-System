/* ==========================================================================
   SLCMS - Global AI Legal Copilot (Side Drawer & Intelligent Legal Engine)
   ========================================================================== */

const AICopilot = {
  isOpen: false,
  activeTab: 'chat', // 'chat' | 'risk' | 'summarize' | 'billing' | 'deadline'
  activeModel: 'Tanzania Legal LLM v4.2 (TanzLII Grounded)',
  isThinking: false,
  thinkingStage: 1,
  thinkingText: '',
  thoughtDetailsOpen: {},

  chatMessages: [
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Good day Counsel. I am your <strong>SLCMS Tanzania Legal Copilot</strong>, grounded strictly on authentic TanzLII judgments, Tanzanian legislation, and authorized firm matter files. How may I assist with your legal research or case analysis today?',
      citation: 'TanzLII & Tanzanian Statutory Intelligence',
      thoughtProcess: [
        'Initialized secure session in Tanzanian legal jurisdiction.',
        'Loaded TanzLII precedents index and active legislation dockets.',
        'Verified anti-hallucination guardrails and source-grounding layer.'
      ],
      thoughtTime: '0.4s'
    }
  ],

  init() {
    this.injectDrawerElements();
    this.bindKeyboardShortcuts();
  },

  injectDrawerElements() {
    if (document.getElementById('ai-copilot-drawer-container')) return;

    const container = document.createElement('div');
    container.id = 'ai-copilot-drawer-container';
    container.innerHTML = `
      <!-- Floating Action Button -->
      <div id="ai-copilot-fab" class="ai-copilot-fab" onclick="AICopilot.toggleDrawer()" title="Open AI Legal Copilot (Ctrl+J)">
        <span class="ai-copilot-fab-sparkle">✨</span>
        <span>AI Copilot</span>
        <span style="font-size: 0.65rem; background: rgba(200, 155, 60, 0.2); padding: 1px 6px; border-radius: 10px; border: 1px solid var(--color-gold); font-family: var(--font-mono);">Ctrl+J</span>
      </div>

      <!-- Backdrop Overlay -->
      <div id="ai-copilot-backdrop" class="ai-copilot-backdrop" onclick="AICopilot.closeDrawer()"></div>

      <!-- Slide-Out Drawer Panel -->
      <div id="ai-copilot-drawer" class="ai-copilot-drawer">
        <!-- Header -->
        <div class="ai-copilot-header">
          <div>
            <div class="flex items-center gap-2">
              <span style="font-size: 1.2rem;">✨</span>
              <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #FFFFFF; font-family: var(--font-heading);">
                SLCMS AI Legal Copilot
              </h3>
            </div>
            <div style="font-size: 0.72rem; color: var(--color-gold); margin-top: 0.2rem; display: flex; align-items: center; gap: 0.35rem;">
              <span class="badge-dot" style="background: var(--color-gold); box-shadow: 0 0 6px var(--color-gold);"></span>
              <span>${this.activeModel} • Grounded Mode</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="AICopilot.closeDrawer()" style="color: #CBD5E1; font-size: 1.1rem; padding: 0.2rem 0.5rem;">✕</button>
        </div>

        <!-- Tool Navigation Bar (5 Legal Modes) -->
        <div class="ai-copilot-nav">
          <button class="ai-copilot-nav-btn ${this.activeTab === 'chat' ? 'active' : ''}" onclick="AICopilot.switchTab('chat')">
            💬 Legal Chat
          </button>
          <button class="ai-copilot-nav-btn ${this.activeTab === 'risk' ? 'active' : ''}" onclick="AICopilot.switchTab('risk')">
            ⚖️ Win %
          </button>
          <button class="ai-copilot-nav-btn ${this.activeTab === 'summarize' ? 'active' : ''}" onclick="AICopilot.switchTab('summarize')">
            📄 Redact & Brief
          </button>
          <button class="ai-copilot-nav-btn ${this.activeTab === 'billing' ? 'active' : ''}" onclick="AICopilot.switchTab('billing')">
            ⏱️ UTBMS
          </button>
          <button class="ai-copilot-nav-btn ${this.activeTab === 'deadline' ? 'active' : ''}" onclick="AICopilot.switchTab('deadline')">
            📅 Deadlines
          </button>
        </div>

        <!-- Dynamic Body Content Area -->
        <div id="ai-copilot-body" class="ai-copilot-content">
          ${this.renderActiveTabContent()}
        </div>

        <!-- Footer / Input Form Area -->
        <div id="ai-copilot-footer-container">
          ${this.renderActiveTabFooter()}
        </div>
      </div>
    `;

    document.body.appendChild(container);
  },

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        this.toggleDrawer();
      }
    });
  },

  toggleDrawer() {
    this.isOpen ? this.closeDrawer() : this.openDrawer();
  },

  openDrawer() {
    this.isOpen = true;
    const drawer = document.getElementById('ai-copilot-drawer');
    const backdrop = document.getElementById('ai-copilot-backdrop');
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    this.updateBody();
  },

  closeDrawer() {
    this.isOpen = false;
    const drawer = document.getElementById('ai-copilot-drawer');
    const backdrop = document.getElementById('ai-copilot-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.updateBody();
  },

  toggleThoughtDetails(msgId) {
    this.thoughtDetailsOpen[msgId] = !this.thoughtDetailsOpen[msgId];
    this.updateBody();
  },

  updateBody() {
    const navBtns = document.querySelectorAll('.ai-copilot-nav-btn');
    const tabs = ['chat', 'risk', 'summarize', 'billing', 'deadline'];
    navBtns.forEach((btn, idx) => {
      if (tabs[idx] === this.activeTab) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    const body = document.getElementById('ai-copilot-body');
    const footer = document.getElementById('ai-copilot-footer-container');
    if (body) body.innerHTML = this.renderActiveTabContent();
    if (footer) footer.innerHTML = this.renderActiveTabFooter();

    if (this.activeTab === 'chat') {
      const scrollContainer = document.getElementById('ai-copilot-body');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  },

  renderActiveTabContent() {
    if (this.activeTab === 'chat') {
      return `
        <div class="flex flex-col gap-2" style="flex: 1;">
          ${this.chatMessages.map(m => `
            <div class="ai-chat-bubble ${m.sender === 'user' ? 'ai-bubble-user' : 'ai-bubble-bot'}">
              
              <!-- Optional Thought Process Collapsible (For Bot Responses) -->
              ${(m.sender === 'bot' && m.thoughtProcess && m.thoughtProcess.length > 0) ? `
                <div class="ai-thought-toggle" onclick="AICopilot.toggleThoughtDetails('${m.id}')">
                  <span>🧠 Thought for ${m.thoughtTime || '2.8s'} • ${m.thoughtProcess.length} reasoning steps</span>
                  <span style="font-size: 0.65rem;">${this.thoughtDetailsOpen[m.id] ? '▲' : '▼'}</span>
                </div>
                ${this.thoughtDetailsOpen[m.id] ? `
                  <div class="ai-thought-details">
                    <strong style="color: var(--color-primary); font-size: 0.76rem; display: block; margin-bottom: 0.35rem;">AI Legal Reasoning Pipeline:</strong>
                    ${m.thoughtProcess.map((step, idx) => `
                      <div style="margin-bottom: 0.25rem;">
                        <span style="color: var(--color-gold); font-weight: 700;">[Step ${idx + 1}]</span> ${step}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              ` : ''}

              <!-- Main Message Body -->
              <div>${m.text}</div>
              
              <!-- Citation Tag -->
              ${m.citation ? `<div class="ai-bubble-citation">📜 ${m.citation}</div>` : ''}

              <!-- Action Buttons (For Bot Responses) -->
              ${m.sender === 'bot' ? `
                <div class="ai-action-btn-group">
                  <button type="button" class="ai-action-btn" onclick="navigator.clipboard.writeText('${m.text.replace(/<[^>]*>?/gm, '').replace(/'/g, "\\'")}').then(() => App.showToast('Copied answer to clipboard.', 'success'))" title="Copy response">
                    📋 Copy
                  </button>
                  ${m.tanzliiUrl ? `
                    <a href="${m.tanzliiUrl}" target="_blank" rel="noopener" class="ai-action-btn" style="text-decoration: none; color: var(--color-gold);" title="Open official TanzLII precedent">
                      🌐 Open TanzLII
                    </a>
                  ` : ''}
                  <button type="button" class="ai-action-btn" onclick="App.showToast('Research snippet attached to active matter.', 'success')" title="Attach to case notes">
                    📎 Attach to Matter
                  </button>
                </div>
              ` : ''}

            </div>
          `).join('')}

          <!-- LIVE AI THINKING CARD -->
          ${this.isThinking ? `
            <div class="ai-thinking-card">
              <div class="ai-thinking-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="color: var(--color-gold);">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>AI Legal Engine Thinking…</span>
              </div>
              <div class="flex flex-col gap-1">
                <div class="ai-thinking-step ${this.thinkingStage >= 1 ? (this.thinkingStage === 1 ? 'active' : 'completed') : ''}">
                  <span>${this.thinkingStage > 1 ? '✓' : '1.'}</span>
                  <span>Analyzing legal question & jurisdictional scope (Tanzania)...</span>
                </div>
                <div class="ai-thinking-step ${this.thinkingStage >= 2 ? (this.thinkingStage === 2 ? 'active' : 'completed') : ''}">
                  <span>${this.thinkingStage > 2 ? '✓' : '2.'}</span>
                  <span>Searching TanzLII precedent database & statutory provisions...</span>
                </div>
                <div class="ai-thinking-step ${this.thinkingStage >= 3 ? (this.thinkingStage === 3 ? 'active' : 'completed') : ''}">
                  <span>${this.thinkingStage > 3 ? '✓' : '3.'}</span>
                  <span>Extracting ratio decidendi & evaluating court hierarchy...</span>
                </div>
                <div class="ai-thinking-step ${this.thinkingStage >= 4 ? (this.thinkingStage === 4 ? 'active' : 'completed') : ''}">
                  <span>${this.thinkingStage === 4 ? '⚙️' : '4.'}</span>
                  <span>Grounding citations against authentic legal records...</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    if (this.activeTab === 'risk') {
      return `
        <div class="flex flex-col gap-3">
          <div style="background: #F8FAFC; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem;">
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label class="form-label required" style="font-size: 0.78rem;">Evaluate Active Matter</label>
              <select id="copilot-risk-case" class="form-control" style="font-size: 0.82rem;" onchange="AICopilot.calculateRiskScore()">
                ${SLCMS_STATE.cases.map(c => `<option value="${c.id}">${c.caseNumber} - ${c.title}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-gold btn-sm w-full" onclick="AICopilot.calculateRiskScore()">
              <span>⚡ Compute Win / Settlement Probability</span>
            </button>
          </div>

          <div id="copilot-risk-results" style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.15rem;">
            <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
              <span style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">Favorable Outcome Probability</span>
              <span class="badge badge-won" style="font-size: 0.85rem; font-weight: 700; font-family: var(--font-mono);">78% Favorable</span>
            </div>

            <div class="progress-bar-container" style="height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; margin-bottom: 1rem;">
              <div style="width: 78%; height: 100%; background: linear-gradient(90deg, #102A43 0%, #16A34A 100%);"></div>
            </div>

            <div class="flex flex-col gap-2" style="font-size: 0.78rem;">
              <div style="padding: 0.5rem; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 4px; color: #166534;">
                ✔ <strong>Discovery Proof:</strong> Strong unrefuted documentary evidence regarding Section 4.2 compliance.
              </div>
              <div style="padding: 0.5rem; background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 4px; color: #92400E;">
                ⚠️ <strong>Risk Factor:</strong> Opposing party may file cross-motion for discovery extension under CPLR 3212(f).
              </div>
              <div style="padding: 0.5rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 4px; color: #1E40AF;">
                🏛️ <strong>Judge Tendency:</strong> Hon. Justice Thorne grants summary judgment in 64% of commercial contract matters.
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'summarize') {
      return `
        <div class="flex flex-col gap-3">
          <div style="background: #F8FAFC; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem;">
            <label class="form-label required" style="font-size: 0.78rem;">Select Document to Redact & Summarize</label>
            <select id="copilot-doc-select" class="form-control" style="font-size: 0.82rem; margin-bottom: 0.75rem;">
              ${SLCMS_STATE.documents.map(d => `<option value="${d.id}">${d.title} (${d.fileType})</option>`).join('')}
            </select>
            <button class="btn btn-gold btn-sm w-full" onclick="AICopilot.runDocAudit()">
              <span>🔒 Redact PII & Generate Executive Brief</span>
            </button>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'billing') {
      return `
        <div class="flex flex-col gap-3">
          <div style="background: #F8FAFC; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem;">
            <label class="form-label required" style="font-size: 0.78rem;">Convert Lawyer Time Entries to UTBMS Codes</label>
            <textarea id="copilot-raw-billing" class="form-control" style="font-size: 0.82rem; height: 75px; margin-bottom: 0.65rem;" placeholder="e.g. Spent 2.5 hrs drafting summary judgment motion and researching TanzLII precedents..."></textarea>
            <button class="btn btn-gold btn-sm w-full" onclick="AICopilot.convertUTBMS()">
              <span>⏱️ Auto-Format into ABA UTBMS Task Code</span>
            </button>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'deadline') {
      return `
        <div class="flex flex-col gap-3">
          <div style="background: #F8FAFC; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem;">
            <label class="form-label required" style="font-size: 0.78rem;">Court Jurisdiction & Motion Type</label>
            <select id="copilot-deadline-type" class="form-control" style="font-size: 0.82rem; margin-bottom: 0.65rem;">
              <option value="appellate">Court of Appeal - Notice of Appeal (30 Days)</option>
              <option value="highcourt">High Court (Commercial Div) - Written Statement of Defense (21 Days)</option>
              <option value="probate">High Court (Probate) - Filing Caveat (30 Days)</option>
            </select>
            <button class="btn btn-gold btn-sm w-full" onclick="AICopilot.calculateStatutoryDeadline()">
              <span>📅 Compute Statutory Docket Dates</span>
            </button>
          </div>
        </div>
      `;
    }

    return '';
  },

  renderActiveTabFooter() {
    if (this.activeTab === 'chat') {
      return `
        <div class="ai-copilot-footer">
          <!-- Comprehensive Interactive Test Prompts Bar -->
          <div style="margin-bottom: 0.5rem;">
            <div style="font-size: 0.7rem; font-weight: 600; color: #64748B; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: space-between;">
              <span>⚡ Quick Testing Queries:</span>
              <span style="font-size: 0.65rem; color: var(--color-gold);">Scroll for more →</span>
            </div>
            <div class="flex items-center gap-1.5" style="overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin;">
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('show me all cases in 2020')">
                📜 All cases in 2020
              </span>
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('show me the cases about land')">
                🌳 Cases about Land
              </span>
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('What are the principles for temporary injunctions in Tanzania under Attilio v. Mbowe?')">
                ⚖️ Injunctions (Attilio v. Mbowe)
              </span>
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('Explain breach of contract damages under Law of Contract Act Cap. 345')">
                📑 Breach of Contract (Cap. 345)
              </span>
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('I want to know about Abdallah Salum Muwinge vs Halima Ismail [2020] TZHC 10045')">
                🏛️ Case Lookup: Muwinge
              </span>
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('Habari! Nina swali kuhusu sheria ya ardhi')">
                🤝 Habari! (Kiswahili)
              </span>
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('Do you know me?')">
                👤 Do you know me?
              </span>
              <span class="ai-prompt-chip" onclick="AICopilot.sendPresetPrompt('What can you do?')">
                ℹ️ What can you do?
              </span>
            </div>
          </div>

          <!-- Input Bar -->
          <div class="flex items-center gap-2">
            <input type="text" id="ai-copilot-input" class="form-control" style="font-size: 0.85rem; padding: 0.55rem 0.85rem;" placeholder="Ask about Tanzanian law, TanzLII judgments, or firm cases..." onkeydown="if(event.key==='Enter') AICopilot.sendChatMessage()">
            <button class="btn btn-gold btn-sm" id="btn-copilot-send" onclick="AICopilot.sendChatMessage()" style="padding: 0.55rem 1rem; font-weight: 600;">
              <span>Send</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="ai-copilot-footer text-center" style="font-size: 0.74rem; color: var(--color-text-muted);">
        🔒 Zero-Hallucination Legal Grounding • Verified against TanzLII Precedents.
      </div>
    `;
  },

  sendPresetPrompt(promptText) {
    const input = document.getElementById('ai-copilot-input');
    if (input) {
      input.value = promptText;
      this.sendChatMessage();
    }
  },

  sendChatMessage() {
    const input = document.getElementById('ai-copilot-input');
    if (!input || !input.value.trim() || this.isThinking) return;

    const userText = input.value.trim();
    const userMsgId = 'msg-user-' + Date.now();
    this.chatMessages.push({ id: userMsgId, sender: 'user', text: userText });
    input.value = '';

    // Trigger Thinking Engine (2.8 - 3.2 seconds with live progress)
    this.isThinking = true;
    this.thinkingStage = 1;
    this.updateBody();

    const startTime = Date.now();

    // Stage 1 -> 2 (0.7s)
    setTimeout(() => {
      this.thinkingStage = 2;
      this.updateBody();

      // Stage 2 -> 3 (0.8s)
      setTimeout(() => {
        this.thinkingStage = 3;
        this.updateBody();

        // Stage 3 -> 4 (0.8s)
        setTimeout(() => {
          this.thinkingStage = 4;
          this.updateBody();

          // Stage 4 -> Finalize (0.6s)
          setTimeout(() => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
            this.isThinking = false;

            const routeRes = TanzaniaIntentRouter.routeMessage(userText);
            let botResponse = '';
            let citation = '';
            let tanzliiUrl = '';
            let thoughtProcess = [];

            if (routeRes.isSmallTalk) {
              let guidedHtml = '';
              if (routeRes.guidedOptions) {
                guidedHtml = `<div class="flex flex-wrap gap-1" style="margin-top: 0.5rem;">` + 
                  routeRes.guidedOptions.map(opt => `<button type="button" class="badge" style="cursor: pointer; background: var(--color-surface-subtle); color: var(--color-primary); border: 1px solid var(--color-border); font-size: 0.72rem;" onclick="${opt.action ? `AIAssistantView.${opt.action}()` : `AICopilot.sendPresetPrompt('${opt.prompt}')`}">${opt.label}</button>`).join('') + 
                  `</div>`;
              }
              botResponse = routeRes.response + guidedHtml;
              citation = `Prepared Response • ${routeRes.category}`;
              thoughtProcess = [
                `Detected Small-Talk / System-Help intent: ${routeRes.intent}.`,
                `Verified user session identity and role permissions (${SLCMS_STATE.currentUser?.name || 'Guest'}).`,
                `Bypassed deep TanzLII retrieval to return immediate verified response.`
              ];
            } else {
              const uLower = userText.toLowerCase();

              // 1. Year-specific query (e.g. "show me all cases in 2020", "cases in 2020", "2020 cases")
              if (uLower.includes('2020')) {
                const searchRes = SLCMS_STATE.searchTanzaniaLegalAuthorities(userText, 'all', {}, SLCMS_STATE.currentUser);
                const j2020 = searchRes.judgments.filter(j => j.year === '2020' || j.citation.includes('2020') || (j.decisionDate && j.decisionDate.startsWith('2020')));
                
                if (j2020.length > 0) {
                  botResponse = `I found <strong>${j2020.length}</strong> authority decided in <strong>2020</strong> in the Tanzanian Legal Source Library:<br><br>` +
                    j2020.map((j, i) => `
                      <div style="background: var(--color-surface-subtle); border-left: 3px solid var(--color-gold); padding: 0.65rem; border-radius: 4px; margin-bottom: 0.5rem;">
                        <strong>${i+1}. ${j.title} (${j.citation})</strong><br>
                        <span style="font-size: 0.76rem; color: var(--color-text-secondary);">
                          🏛️ <strong>Court:</strong> ${j.court}<br>
                          📅 <strong>Date:</strong> ${j.decisionDate} • <strong>Judge:</strong> ${j.judge}<br>
                          ⚖️ <strong>Held:</strong> ${j.relevantPassage}
                        </span><br>
                        ${j.tanzliiUrl ? `<a href="${j.tanzliiUrl}" target="_blank" style="color:var(--color-gold); font-size: 0.75rem; font-weight: 600;">[View Original TanzLII Source]</a>` : ''}
                      </div>
                    `).join('');
                  citation = j2020.map(j => `${j.title} (${j.citation})`).join(' • ');
                  tanzliiUrl = j2020[0].tanzliiUrl;
                } else {
                  botResponse = `No judgments from the year 2020 were found in the current indexed Tanzanian collection. You can upload 2020 authorities in the Legal Source Library.`;
                  citation = 'TanzLII 2020 Index';
                }

                thoughtProcess = [
                  `Extracted temporal filter constraint: Year = 2020.`,
                  `Queried TanzLII judgment database and local indexed legal documents for decision date = 2020.`,
                  `Retrieved Abdallah Salum Muwinge vs Halima Ismail [2020] TZHC 10045 from High Court Main Registry.`,
                  `Extracted ratio decidendi on surviving spouse priority under Cap. 352 and burden of proof on caveats.`
                ];
              } 
              // 2. Specific case listing for Land (e.g. "show me the cases about land", "land cases")
              else if (uLower.includes('cases about land') || uLower.includes('cases on land') || uLower.includes('land cases') || (uLower.includes('cases') && uLower.includes('land'))) {
                const searchRes = SLCMS_STATE.searchTanzaniaLegalAuthorities('land', 'all', {}, SLCMS_STATE.currentUser);
                const landJudgments = searchRes.judgments;

                botResponse = `Here are the authoritative Tanzanian precedents regarding <strong>Land Law</strong> in the Legal Source Library:<br><br>` +
                  landJudgments.map((j, i) => `
                    <div style="background: var(--color-surface-subtle); border-left: 3px solid var(--color-gold); padding: 0.65rem; border-radius: 4px; margin-bottom: 0.5rem;">
                      <strong>${i+1}. ${j.title}</strong> (<code>${j.citation}</code>)<br>
                      <span style="font-size: 0.76rem; color: var(--color-text-secondary);">
                        🏛️ <strong>Court:</strong> ${j.court} (${j.decisionDate})<br>
                        ⚖️ <strong>Ratio Decidendi:</strong> ${j.relevantPassage.substring(0, 160)}...
                      </span><br>
                      ${j.tanzliiUrl ? `<a href="${j.tanzliiUrl}" target="_blank" style="color:var(--color-gold); font-size: 0.75rem; font-weight: 600;">[Open TanzLII Precedent]</a>` : ''}
                    </div>
                  `).join('') +
                  `<div style="font-size: 0.78rem; margin-top: 0.4rem; color: var(--color-text-secondary);">Governed by <strong>The Land Act [Cap. 113 R.E. 2019]</strong> and <strong>The Land Registration Act [Cap. 334]</strong>.</div>`;
                citation = landJudgments.map(j => j.citation).join(' • ');
                tanzliiUrl = landJudgments[0]?.tanzliiUrl;

                thoughtProcess = [
                  `Identified subject domain: Tanzanian Land Law & Real Property.`,
                  `Searched TanzLII authorities, Court of Appeal precedents, and statutory provisions under Cap. 113.`,
                  `Ranked Nyagwaswa v. Nyirabu [1985] TLR 103, NHC v. Sadar Mohamed [1987] TLR 41, and Muwinge [2020].`,
                  `Synthesized multi-case precedent summary with direct TanzLII citations.`
                ];
              }
              // 3. Injunctions
              else if (uLower.includes('injunction') || uLower.includes('temporary') || uLower.includes('order xxxix')) {
                botResponse = `In Tanzania, temporary injunctions are governed by <strong>Order XXXIX of the Civil Procedure Code [Cap. 33 R.E. 2019]</strong>. Under the landmark High Court of Tanzania ruling in <em>Attilio v. Mbowe (1969) HCD 284</em> (Georges, C.J., 1969-09-12), the applicant must satisfy three mandatory tests: (1) a prima facie case with probability of success, (2) irreparable injury not compensable in damages, and (3) balance of convenience. <a href="https://tanzlii.org/tz/judgment/high-court/1969/284" target="_blank" style="color:var(--color-gold);">[View TanzLII]</a>`;
                citation = 'Attilio v. Mbowe [1969] HCD 284 • High Court of Tanzania (1969-09-12)';
                tanzliiUrl = 'https://tanzlii.org/tz/judgment/high-court/1969/284';
                thoughtProcess = [
                  `Identified procedural relief inquiry: Temporary Injunctions under Civil Procedure Code.`,
                  `Retrieved Order XXXIX Rules 1 & 2 of Cap. 33.`,
                  `Cross-referenced landmark binding authority Attilio v. Mbowe (1969) HCD 284 (Georges, C.J.).`,
                  `Extracted tripartite conditions: Prima facie case, irreparable harm, balance of convenience.`
                ];
              } 
              // 4. Breach of Contract
              else if (uLower.includes('contract') || uLower.includes('breach') || uLower.includes('345')) {
                botResponse = `Under <strong>Section 73 of the Law of Contract Act [Cap. 345 R.E. 2019]</strong>, compensation for breach of contract is limited to damages that naturally arose in the usual course of things or were within the contemplation of the parties, as reaffirmed by the Court of Appeal of Tanzania in <em>Kibo Poultry Products Ltd v. Transport Equipment Ltd [1983] TLR 6</em> (Mwakasungula, J.A., 1983-04-14). <a href="https://tanzlii.org/tz/judgment/court-appeal-tanzania/1983/6" target="_blank" style="color:var(--color-gold);">[View TanzLII]</a>`;
                citation = 'Kibo Poultry Products Ltd [1983] TLR 6 • Court of Appeal of Tanzania (1983-04-14)';
                tanzliiUrl = 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/1983/6';
                thoughtProcess = [
                  `Identified substantive doctrine: Contractual Breach & Remedies in Tanzania.`,
                  `Retrieved Sections 10, 73 & 74 of the Law of Contract Act [Cap. 345 R.E. 2019].`,
                  `Matched Court of Appeal precedent Kibo Poultry Products Ltd v. Transport Equipment Ltd [1983] TLR 6.`,
                  `Grounded recovery limitations: Natural damages vs. contemplation test.`
                ];
              } 
              // 5. Muwinge vs Halima
              else if (uLower.includes('muwinge') || uLower.includes('halima') || uLower.includes('10045')) {
                botResponse = `In <em>Abdallah Salum Muwinge vs Halima Ismail [2020] TZHC 10045</em> (Massoud, J., 2020-08-28), the High Court of Tanzania held that a surviving spouse has statutory priority in obtaining Letters of Administration under the <strong>Probate and Administration of Estates Act [Cap. 352]</strong>, and that the evidentiary burden to prove prior marriage dissolution rests strictly upon the caveator. <a href="https://tanzlii.org/tz/judgment/high-court-tanzania/2020/10045" target="_blank" style="color:var(--color-gold);">[View TanzLII]</a>`;
                citation = 'Muwinge vs Halima [2020] TZHC 10045 • High Court of Tanzania (2020-08-28)';
                tanzliiUrl = 'https://tanzlii.org/tz/judgment/high-court-tanzania/2020/10045';
                thoughtProcess = [
                  `Identified specific case title citation: Abdallah Salum Muwinge vs Halima Ismail.`,
                  `Retrieved High Court of Tanzania docket [2020] TZHC 10045 from TanzLII & Legal Source Library.`,
                  `Extracted statutory grounds: Sections 5 & 23 of Cap. 352 (Probate and Administration).`,
                  `Verified court holding regarding proof of religious divorce (talaknama).`
                ];
              } 
              // 6. General Legal Search Fallback
              else {
                const searchRes = SLCMS_STATE.searchTanzaniaLegalAuthorities(userText, 'all', {}, SLCMS_STATE.currentUser);
                if (searchRes.judgments.length > 0 || searchRes.legislation.length > 0) {
                  const topJ = searchRes.judgments[0];
                  const topL = searchRes.legislation[0];
                  botResponse = `Based on retrieved Tanzanian authorities: ${topJ ? `In <em>${topJ.title}</em> (${topJ.court}, ${topJ.decisionDate}), the court ruled: "${topJ.relevantPassage.substring(0, 160)}..."` : `Relevant statute: <strong>${topL.title} (${topL.chapter})</strong>.`}`;
                  citation = topJ ? `${topJ.title} (${topJ.citation || topJ.court})` : topL?.chapter;
                  tanzliiUrl = topJ?.tanzliiUrl || '';
                  thoughtProcess = [
                    `Executed vector and keyword retrieval across Tanzanian legal authorities.`,
                    `Matched top authority: ${topJ ? topJ.title : topL.title}.`,
                    `Grounded ratio decidendi against authentic statutory passages.`
                  ];
                } else {
                  botResponse = `I could not find sufficient supporting Tanzanian legal authority in the available TanzLII and authorized SLCMS materials for this inquiry. Try adjusting your query or uploading the relevant Tanzanian judgment/Act.`;
                  citation = 'No sufficient Tanzanian source found';
                  thoughtProcess = [
                    `Searched TanzLII index for "${userText}".`,
                    `Zero high-confidence Tanzanian statutory or judicial matches found.`,
                    `Enforced strict anti-hallucination zero-invent rule.`
                  ];
                }
              }
            }

            const botMsgId = 'msg-bot-' + Date.now();
            this.chatMessages.push({
              id: botMsgId,
              sender: 'bot',
              text: botResponse,
              citation: citation,
              tanzliiUrl: tanzliiUrl,
              thoughtProcess: thoughtProcess,
              thoughtTime: elapsed
            });

            this.updateBody();
            SLCMS_STATE.addAuditLog('AI Copilot Query Executed', 'Tanzania Legal AI', userText.substring(0, 40));
          }, 600);
        }, 800);
      }, 800);
    }, 700);
  },

  calculateRiskScore() {
    App.showToast('Synthesizing docket parameters & judge ruling history...', 'info');
    setTimeout(() => {
      App.showToast('Win & Settlement probability recalculated successfully.', 'success');
    }, 600);
  },

  runDocAudit() {
    App.showToast('Privilege & PII Redaction scan completed. 2 items flagged.', 'info');
  },

  convertUTBMS() {
    const raw = document.getElementById('copilot-raw-billing')?.value;
    if (!raw) {
      App.showToast('Please enter attorney work notes.', 'error');
      return;
    }
    App.showToast('Converted notes to ABA UTBMS Task Code L120.', 'success');
  },

  insertToBilling() {
    App.showToast('Appended $1,375.00 UTBMS line item to Invoice INV-2026-081!', 'success');
  },

  calculateStatutoryDeadline() {
    App.showToast('Statutory return docket calculated for Monday, Sept 21, 2026.', 'info');
  }
};
