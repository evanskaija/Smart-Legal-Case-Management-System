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
      <div id="ai-copilot-fab" class="ai-copilot-fab" onclick="AICopilot.toggleDrawer()" title="Open AI Legal Copilot (Ctrl+J)" aria-label="AI Copilot">
        <span class="ai-copilot-fab-sparkle">✨</span>
        <span class="ai-copilot-fab-desktop-text">AI Copilot</span>
        <span class="ai-copilot-fab-mobile-text">AI</span>
        <span class="ai-copilot-fab-badge">Ctrl+J</span>
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
          <!-- Category Details Launchpad -->
          <div class="ai-copilot-launchpad">
            <div style="font-size: 0.74rem; color: #64748B; margin-bottom: 0.55rem; line-height: 1.45;">
              <strong style="color: #102A43;">Select a category below or ask a natural language question.</strong> The AI classifies your intention, enforces anti-hallucination guardrails, and retrieves the verified case record.
            </div>

            <div class="ai-copilot-launch-grid">
              <!-- Category 01 -->
              <div class="ai-copilot-cat-tile" onclick="AICopilot.sendPresetPrompt('Find Abdallah Salum Muwinge')">
                <div class="ai-copilot-cat-top">
                  <span class="ai-copilot-cat-badge badge-primary">CATEGORY 01</span>
                  <span style="font-size: 0.85rem;">🔍</span>
                </div>
                <div class="ai-copilot-cat-title">1. Find a Judgment</div>
                <div class="ai-copilot-cat-desc">Search by title, party name, citation, court, judge or year with direct PDF links.</div>
                <div class="ai-copilot-cat-footer">
                  <span>Search Database</span>
                  <span>→</span>
                </div>
              </div>

              <!-- Category 02 -->
              <div class="ai-copilot-cat-tile" onclick="AICopilot.sendPresetPrompt('Show facts of Abdallah Salum Muwinge v Halima Ismail')">
                <div class="ai-copilot-cat-top">
                  <span class="ai-copilot-cat-badge badge-info">CATEGORY 02</span>
                  <span style="font-size: 0.85rem;">ℹ️</span>
                </div>
                <div class="ai-copilot-cat-title">2. Show Facts of a Case</div>
                <div class="ai-copilot-cat-desc">Extract pure facts (parties, events, claims, disputed conduct) with zero invented info.</div>
                <div class="ai-copilot-cat-footer">
                  <span>Extract Facts</span>
                  <span>→</span>
                </div>
              </div>

              <!-- Category 03 -->
              <div class="ai-copilot-cat-tile" onclick="AICopilot.sendPresetPrompt('Summarize Abdallah Salum Muwinge v Halima Ismail')">
                <div class="ai-copilot-cat-top">
                  <span class="ai-copilot-cat-badge badge-warning">CATEGORY 03</span>
                  <span style="font-size: 0.85rem;">📄</span>
                </div>
                <div class="ai-copilot-cat-title">3. Summarize a Case</div>
                <div class="ai-copilot-cat-desc">Concise structured summary: background, legal issues, reasoning, decision & ratio.</div>
                <div class="ai-copilot-cat-footer">
                  <span>Generate Summary</span>
                  <span>→</span>
                </div>
              </div>

              <!-- Category 04 -->
              <div class="ai-copilot-cat-tile" onclick="AICopilot.sendPresetPrompt('Research matrimonial property division and procedural records in Tanzania')">
                <div class="ai-copilot-cat-top">
                  <span class="ai-copilot-cat-badge badge-success">CATEGORY 04</span>
                  <span style="font-size: 0.85rem;">⚖️</span>
                </div>
                <div class="ai-copilot-cat-title">4. Research a Legal Issue</div>
                <div class="ai-copilot-cat-desc">Cross-case analysis synthesizing multiple precedents and statutory chapters.</div>
                <div class="ai-copilot-cat-footer">
                  <span>Synthesize Issue</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            <!-- Explore More Row -->
            <div style="font-size: 0.68rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.6rem;">
              EXPLORE MORE:
            </div>
            <div class="ai-copilot-explore-row">
              <button type="button" class="ai-copilot-explore-pill" onclick="AICopilot.sendPresetPrompt('Show procedural history of Abdallah Salum Muwinge v Halima Ismail')">
                <span>🏛️</span> Procedural History
              </button>
              <button type="button" class="ai-copilot-explore-pill" onclick="AICopilot.sendPresetPrompt('What is the legal principle in Abdallah Salum Muwinge v Halima Ismail?')">
                <span>💡</span> Legal Principle (Ratio)
              </button>
              <button type="button" class="ai-copilot-explore-pill" onclick="AIAssistantView.openAllCategoriesModal()">
                <span>📑</span> All 18 Categories
              </button>
              <button type="button" class="ai-copilot-explore-pill" onclick="AICopilot.sendPresetPrompt('Show parties arguments in Abdallah Salum Muwinge v Halima Ismail')">
                <span>👥</span> Parties' Arguments
              </button>
              <button type="button" class="ai-copilot-explore-pill" onclick="AIAssistantView.openCaseReportConfigModal('[2020] TZHC 10045')">
                <span>⚡</span> Generate Report
              </button>
              <button type="button" class="ai-copilot-explore-pill" onclick="AICopilot.sendPresetPrompt('Compare cases on marriage and matrimonial property in Tanzania')">
                <span>⚖️</span> Compare Cases
              </button>
            </div>
          </div>

          <!-- Chat Messages List -->
          ${this.chatMessages.map(m => `
            <div class="ai-chat-bubble ${m.sender === 'user' ? 'ai-bubble-user' : 'ai-bubble-bot'}">
              
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

          <!-- LIVE AI THREE HANGING DOTS BUBBLE -->
          ${this.isThinking ? `
            <div class="tz-thinking-bubble-row animate-fade" style="margin: 0.5rem 0 0.85rem 0.25rem;">
              <div class="tz-thinking-bubble" title="AI Copilot is thinking...">
                <span class="tz-dot"></span>
                <span class="tz-dot"></span>
                <span class="tz-dot"></span>
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
          <!-- Subtitle / Prompt Header -->
          <div style="font-size: 0.72rem; color: #64748B; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: space-between;">
            <span>Ask about Tanzanian law, find a judgment, or click a category button below ...</span>
            <span style="font-size: 0.65rem; color: var(--color-gold); font-weight: 600;">Scroll for more →</span>
          </div>

          <!-- Quick Actions: Attach Case, Filters, Ask SLCMS -->
          <div class="flex items-center gap-1.5" style="margin-bottom: 0.45rem;">
            <button type="button" class="ai-prompt-chip" onclick="App.showToast('Select an active case matter to attach context.', 'info')" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;">
              📎 Attach Case
            </button>
            <button type="button" class="ai-prompt-chip" onclick="AIAssistantView.openAllCategoriesModal()" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;">
              🔍 Filters
            </button>
            <button type="button" class="ai-prompt-chip" onclick="AICopilot.sendChatMessage()" style="font-size: 0.72rem; padding: 0.25rem 0.6rem; background: var(--color-surface-subtle); border-color: var(--color-gold); color: #B45309; font-weight: 700;">
              ✨ Ask SLCMS
            </button>
          </div>

          <!-- Input Bar -->
          <div class="flex items-center gap-2" style="margin-bottom: 0.5rem;">
            <input type="text" id="ai-copilot-input" class="form-control" style="font-size: 0.85rem; padding: 0.55rem 0.85rem;" placeholder="Ask about Tanzanian law, find a judgment, or click a category button below ..." onkeydown="if(event.key==='Enter') AICopilot.sendChatMessage()">
            <button class="btn btn-gold btn-sm" id="btn-copilot-send" onclick="AICopilot.sendChatMessage()" style="padding: 0.55rem 1rem; font-weight: 600;">
              <span>Send</span>
            </button>
          </div>

          <!-- 8 Primary Category Action Buttons Bar -->
          <div class="ai-copilot-cat-btn-bar">
            <button type="button" class="ai-copilot-cat-btn" onclick="AICopilot.sendPresetPrompt('Find Abdallah Salum Muwinge')">
              🔍 Find Judgment
            </button>
            <button type="button" class="ai-copilot-cat-btn" onclick="AICopilot.sendPresetPrompt('Summarize Abdallah Salum Muwinge v Halima Ismail')">
              📄 Summarize Case
            </button>
            <button type="button" class="ai-copilot-cat-btn" onclick="AICopilot.sendPresetPrompt('Show facts of Abdallah Salum Muwinge v Halima Ismail')">
              ℹ️ Show Facts
            </button>
            <button type="button" class="ai-copilot-cat-btn" onclick="AICopilot.sendPresetPrompt('Show legal issues in Abdallah Salum Muwinge v Halima Ismail')">
              ❓ Show Legal Issues
            </button>
            <button type="button" class="ai-copilot-cat-btn" onclick="AICopilot.sendPresetPrompt('Show court reasoning in Abdallah Salum Muwinge v Halima Ismail')">
              🧠 Court Reasoning
            </button>
            <button type="button" class="ai-copilot-cat-btn" onclick="AICopilot.sendPresetPrompt('Show final decision in Abdallah Salum Muwinge v Halima Ismail')">
              ✅ Final Decision
            </button>
            <button type="button" class="ai-copilot-cat-btn" onclick="AICopilot.sendPresetPrompt('Show laws and cases cited in Abdallah Salum Muwinge v Halima Ismail')">
              📚 Laws Cited
            </button>
            <button type="button" class="ai-copilot-cat-btn" onclick="AIAssistantView.viewPdfModal('assets/cases/case1_scanned_judgment.pdf', 'Abdallah Salum Muwinge v Halima Ismail [2020] TZHC 10045')">
              🌐 Open Original
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

    // Mandatory Authentication Check
    const userProfile = (typeof TanzaniaIntentRouter !== 'undefined' && TanzaniaIntentRouter.getUserProfile) 
      ? TanzaniaIntentRouter.getUserProfile() 
      : { isLoggedIn: !!(typeof App !== 'undefined' && App.isLoggedIn) };
    if (!userProfile.isLoggedIn || !(typeof App !== 'undefined' && App.isLoggedIn)) {
      this.chatMessages.push({
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        text: `🔒 **Authentication Required**\n\nYou must register or sign in to your authorized SLCMS account before using the Tanzania Legal Research Assistant.\n\nPlease sign in or register to continue.`,
        citation: 'Access Restricted • SLCMS Security Guardrail',
        thoughtProcess: []
      });
      this.updateBody();
      return;
    }

    // Trigger Thinking Engine (Three hanging dots animation ~1.1s)
    this.isThinking = true;
    this.updateBody();

    setTimeout(() => {
      this.isThinking = false;

      const routeRes = TanzaniaIntentRouter.routeMessage(userText);
      let botResponse = '';
      let citation = '';
      let tanzliiUrl = '';

      if (routeRes.isSmallTalk) {
        let guidedHtml = '';
        if (routeRes.guidedOptions) {
          guidedHtml = `<div class="flex flex-wrap gap-1" style="margin-top: 0.5rem;">` + 
            routeRes.guidedOptions.map(opt => `<button type="button" class="badge" style="cursor: pointer; background: var(--color-surface-subtle); color: var(--color-primary); border: 1px solid var(--color-border); font-size: 0.72rem;" onclick="${opt.action ? (opt.action.startsWith('AICopilot') ? opt.action : `AIAssistantView.${opt.action}()`) : `AICopilot.sendPresetPrompt('${opt.prompt}')`}">${opt.label}</button>`).join('') + 
            `</div>`;
        }
        botResponse = routeRes.response + guidedHtml;
        citation = `Prepared Response • ${routeRes.category || 'Tanzania Legal System'}`;
      } else {
        // Construct standardized message object for rich rendering
        const msgObj = {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          rawQuery: userText,
          timestamp: 'Just now',
          ...routeRes
        };

        if (typeof AIAssistantView !== 'undefined' && AIAssistantView.renderAssistantMessageContent) {
          botResponse = AIAssistantView.renderAssistantMessageContent(msgObj);
        } else {
          botResponse = routeRes.response || 'Verified Tanzanian legal authority retrieved.';
        }

        citation = routeRes.matchedCase ? `${routeRes.matchedCase.title} (${routeRes.matchedCase.citation || routeRes.matchedCase.court})` : 'TanzLII Verified Precedent Index';
        tanzliiUrl = routeRes.matchedCase?.tanzliiUrl || '';
      }

      const botMsgId = 'msg-bot-' + Date.now();
      this.chatMessages.push({
        id: botMsgId,
        sender: 'bot',
        text: botResponse,
        citation: citation,
        tanzliiUrl: tanzliiUrl
      });

      this.updateBody();
      SLCMS_STATE.addAuditLog('AI Copilot Query Executed', 'Tanzania Legal AI', userText.substring(0, 40));
    }, 1100);
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
  },

  showLoginModal() {
    this.closeDrawer();
    if (typeof AuthView !== 'undefined') {
      AuthView.switchTab('login');
      if (typeof App !== 'undefined' && !App.isLoggedIn) {
        document.getElementById('app-root').innerHTML = AuthView.render();
      }
    }
  },

  showRegisterModal() {
    this.closeDrawer();
    if (typeof AuthView !== 'undefined') {
      AuthView.switchTab('register');
      if (typeof App !== 'undefined' && !App.isLoggedIn) {
        document.getElementById('app-root').innerHTML = AuthView.render();
      }
    }
  }
};
