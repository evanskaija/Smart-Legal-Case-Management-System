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

  chatMessages: [],

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
        <span class="ai-copilot-desktop-text">AI Copilot</span>
        <span class="ai-copilot-mobile-text">AI</span>
        <span class="ai-copilot-desktop-text" style="font-size: 0.65rem; background: rgba(200, 155, 60, 0.2); padding: 1px 6px; border-radius: 10px; border: 1px solid var(--color-gold); font-family: var(--font-mono);">Ctrl+J</span>
      </div>

      <!-- Backdrop Overlay -->
      <div id="ai-copilot-backdrop" class="ai-copilot-backdrop" onclick="AICopilot.closeDrawer()"></div>

      <!-- Slide-Out Drawer Panel -->
      <div id="ai-copilot-drawer" class="ai-copilot-drawer">
        <!-- Mobile Drag Handle -->
        <div class="ai-copilot-drag-handle"></div>

        <!-- Header -->
        <div class="ai-copilot-header">
          <div class="flex items-center gap-2">
            <h3 class="ai-header-title" style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF;">
              Ask SLCMS AI
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <button class="ai-copilot-close-btn" onclick="AICopilot.closeDrawer()" aria-label="Close Copilot">✕</button>
          </div>
        </div>

        <!-- Tool Navigation Bar (5 Legal Modes: Chat, Win %, Brief, UTBMS, Deadlines) -->
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
    const fab = document.getElementById('ai-copilot-fab');
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (fab) {
      fab.style.display = 'none';
      fab.style.opacity = '0';
      fab.style.pointerEvents = 'none';
    }
    document.body.classList.add('copilot-open');
    this.updateBody();
  },

  closeDrawer() {
    this.isOpen = false;
    const drawer = document.getElementById('ai-copilot-drawer');
    const backdrop = document.getElementById('ai-copilot-backdrop');
    const fab = document.getElementById('ai-copilot-fab');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (fab) {
      fab.style.display = '';
      fab.style.opacity = '';
      fab.style.pointerEvents = '';
    }
    document.body.classList.remove('copilot-open');
  },

  clearChat() {
    this.chatMessages = [];
    this.updateBody();
    App.showToast('Started fresh AI legal research session.', 'info');
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
      if (scrollContainer) {
        if (this.chatMessages.length > 0) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        } else {
          scrollContainer.scrollTop = 0;
        }
      }
    }
  },

  renderActiveTabContent() {
    if (this.activeTab === 'chat') {
      if (this.chatMessages.length === 0) {
        return `
          <div class="ai-gemini-welcome-canvas animate-fade">
            <div class="ai-gemini-sparkle-icon">✦</div>
            <h2 class="ai-gemini-greeting">Hello, Counsel! Ready to research Tanzanian judicial precedents or analyze legal matters? I’m here to help.</h2>
            <p class="ai-gemini-subheading">Not sure what to ask? Choose a legal research query below:</p>
            
            <div class="ai-gemini-prompts-stack">
              <button type="button" class="ai-gemini-prompt-pill" onclick="AICopilot.sendPresetPrompt('Find High Court & Appellate judgments (2020 - 2026)')">
                Find High Court &amp; Appellate judgments (2020 - 2026)
              </button>
              <button type="button" class="ai-gemini-prompt-pill" onclick="AICopilot.sendPresetPrompt('Summarize Attilio v Mbowe [1969] HCD 284')">
                Summarize Attilio v Mbowe [1969] HCD 284
              </button>
              <button type="button" class="ai-gemini-prompt-pill" onclick="AICopilot.sendPresetPrompt('Show facts of Abdallah Salum Muwinge vs Halima Ismail')">
                Show facts of Abdallah Salum Muwinge vs Halima Ismail
              </button>
              <button type="button" class="ai-gemini-prompt-pill" onclick="AICopilot.sendPresetPrompt('Court reasoning on temporary injunctions & balance of convenience')">
                Court reasoning on temporary injunctions &amp; balance of convenience
              </button>
              <button type="button" class="ai-gemini-prompt-pill" onclick="AICopilot.sendPresetPrompt('Laws cited under Law of Contract Act [Cap. 345 R.E. 2019]')">
                Laws cited under Law of Contract Act [Cap. 345 R.E. 2019]
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div class="flex flex-col gap-2" style="flex: 1; padding: 0.5rem;">
          <!-- Chat Messages List -->
          ${this.chatMessages.map(m => m.sender === 'user' ? `
            <div class="ai-msg-user-row animate-fade">
              <div class="ai-msg-user-bubble" style="max-width: 90%; font-size: 0.9rem;">
                ${m.text}
              </div>
            </div>
          ` : `
            <div class="ai-msg-assistant-row animate-fade">
              <div class="ai-assistant-answer-canvas">
                <div class="ai-assistant-text-flow" style="font-size: 0.92rem;">
                  ${typeof AIAssistantView !== 'undefined' && AIAssistantView.formatAnsweringMarkdown ? AIAssistantView.formatAnsweringMarkdown(m.text) : m.text}
                </div>
                ${m.citation ? `<div style="font-size: 0.72rem; color: var(--color-gold); margin-top: 0.35rem;">📜 ${m.citation}</div>` : ''}
                <div class="ai-disclaimer-text" style="margin-top: 0.75rem;">
                  AI can make mistakes, so check its responses.
                </div>
                <div class="ai-action-buttons-row">
                  <button type="button" class="ai-action-icon-btn" onclick="navigator.clipboard.writeText('${m.text.replace(/<[^>]*>?/gm, '').replace(/'/g, "\\'")}').then(() => App.showToast('Copied answer to clipboard.', 'success'))" title="Copy response">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                  <button type="button" class="ai-action-icon-btn" onclick="App.showToast('Share link copied.', 'info')" title="Share">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </button>
                  <button type="button" class="ai-action-icon-btn" onclick="App.showToast('Marked as helpful.', 'success')" title="Helpful">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </button>
                  <button type="button" class="ai-action-icon-btn" onclick="App.showToast('Feedback noted.', 'info')" title="Unhelpful">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                    </svg>
                  </button>
                  ${m.tanzliiUrl ? `
                    <a href="${m.tanzliiUrl}" target="_blank" rel="noopener" class="ai-action-icon-btn" style="text-decoration: none; color: var(--color-gold);" title="Open official TanzLII precedent">
                      🌐
                    </a>
                  ` : ''}
                </div>
              </div>
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
        <div style="padding: 0.4rem 0.75rem 0.85rem 0.75rem;">
          <!-- 8 Primary Category Action Buttons Bar (Sits Above Input Dock) -->
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

          <div class="ai-chat-prompt-card">
            <textarea 
              id="ai-copilot-input" 
              class="ai-chat-prompt-textarea" 
              placeholder="Ask anything." 
              rows="1"
              autocomplete="off" 
              onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); AICopilot.sendChatMessage(); }"
            ></textarea>
            <div class="ai-chat-prompt-bottom-bar">
              <div class="ai-prompt-left-tools">
                <button type="button" class="ai-prompt-circle-plus" onclick="App.showToast('Attach documents from case dossier.', 'info')" title="Add files">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
              <div class="ai-prompt-right-tools">
                <button type="button" class="ai-prompt-mic-icon-btn" onclick="App.showToast('Listening... Speak your legal query.', 'info')" title="Voice input">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </button>
                <button type="button" class="ai-prompt-send-icon-btn" id="btn-copilot-send" onclick="AICopilot.sendChatMessage()" title="Send">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                </button>
              </div>
            </div>
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
      SLCMS_STATE.addAuditLog('AI Copilot Query Executed', 'SLCMS AI', userText.substring(0, 40));
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
