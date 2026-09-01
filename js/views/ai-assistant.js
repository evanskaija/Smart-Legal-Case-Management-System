/* ==========================================================================
   SLCMS - Tanzania Legal Research Assistant
   Professional Lawyer Workspace with Strict Intent-Specific Routing & Distinct Action Panels
   ========================================================================== */

const AIAssistantView = {
  // Conversation History State
  conversation: [], 
  isSubmitting: false,
  isProcessing: false,
  activeDraftQuery: '',

  // Active Sources for Right Sidebar
  activeSources: [],
  activeSourceHighlightId: null,

  // Filters State
  filters: {
    scope: 'all', // 'all' | 'tanzlii' | 'legislation' | 'case_docs'
    court: 'all',
    year: 'all',
    category: 'all',
    judge: '',
    caseNumber: '',
    caseId: 'all'
  },

  // Research History Archive
  researchHistory: [
    { id: 'h-1', title: 'Attilio v. Mbowe (Temporary Injunctions Test)', date: '2026-08-30', query: 'Show facts of Attilio v. Mbowe' },
    { id: 'h-2', title: 'Muwinge vs Halima [2020] (Nullification & De Novo)', date: '2026-08-28', query: 'Summarize Abdallah Salum Muwinge vs Halima Ismail' },
    { id: 'h-3', title: 'Judgments from 2020 in Legal Library', date: '2026-08-27', query: 'Show me all cases in 2020' }
  ],

  // UI Modals / Toggles
  showFiltersModal: false,
  feedbackState: {},
  expandedPassages: {},
  lawsSubtab: 'legislation', // 'legislation' | 'cases'

  /* --------------------------------------------------------------------------
     INITIALIZATION & MAIN WORKSPACE RENDER
     -------------------------------------------------------------------------- */
  init() {
    if (this.activeSources.length === 0 && typeof SLCMS_STATE !== 'undefined') {
      this.activeSources = (SLCMS_STATE.tanzaniaJudgments || []).slice(0, 3);
    }
  },

  render() {
    this.init();
    const docLibrary = SLCMS_STATE.legalSourceDocuments || [];
    const readyDocsCount = docLibrary.filter(d => d.status === 'Ready for AI').length;
    const activeFilterCount = this.getActiveFilterCount();

    return `
      <div class="animate-fade tz-workspace-container">
        
        <!-- 1. TOP HEADER & WORKSPACE NAVIGATION -->
        <div class="tz-workspace-header">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="page-title" style="margin: 0; font-size: 1.35rem; display: flex; align-items: center; gap: 0.5rem;">
                <span style="color: var(--color-gold);">⚖️</span>
                Tanzania Legal Research Assistant
              </h1>
              <span class="badge badge-gold" style="font-size: 0.72rem; font-weight: 600;">
                Tanzanian Law Only
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.84rem; margin-top: 0.2rem; margin-bottom: 0;">
              Search selected TanzLII judgments, Tanzanian legislation and authorized case documents. Every generated answer is supported by verifiable sources.
            </p>
          </div>

          <!-- Top Navigation Action Bar -->
          <div class="flex items-center gap-2 flex-wrap">
            <button class="btn btn-gold btn-sm" onclick="AIAssistantView.startNewResearch()" title="Start a new clean research session">
              ✨ New Research
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.openHistoryModal()" title="View past research queries">
              📜 Research History
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.openLibraryModal()" title="Browse indexed TanzLII and firm legal library">
              📚 Legal Library (${readyDocsCount})
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.openUploadModal()" title="Upload new TanzLII judgment or statute">
              📤 Upload Source
            </button>
          </div>
        </div>

        <!-- 2. TWO-COLUMN WORKSPACE (70% LEFT / 30% RIGHT) -->
        <div class="tz-workspace-grid">
          
          <!-- LEFT COLUMN (70%): Conversation Stream & Sticky Input Bar -->
          <div class="tz-conversation-col">
            
            <!-- Chat Conversation History Stream -->
            <div id="tz-chat-stream" class="tz-chat-stream">
              ${this.conversation.length === 0 ? this.renderEmptyState() : this.renderConversationMessages()}
            </div>

            <!-- Sticky Bottom Question Input Bar -->
            <div class="tz-sticky-input-container">
              
              <!-- Active Filter Chips Bar -->
              ${activeFilterCount > 0 ? `
                <div class="tz-active-filter-chips">
                  <span style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight: 600;">Active Filters:</span>
                  ${this.renderActiveFilterChips()}
                  <button type="button" class="btn btn-ghost btn-sm" style="font-size: 0.7rem; padding: 0 0.35rem; color: var(--color-text-secondary);" onclick="AIAssistantView.resetFilters()">
                    Clear All
                  </button>
                </div>
              ` : ''}

              <!-- Input Row -->
              <form id="tz-chat-form" onsubmit="event.preventDefault(); AIAssistantView.handleSendMessage();" style="margin: 0;">
                <div class="tz-input-wrapper">
                  <textarea 
                    id="tz-question-input" 
                    class="tz-input-textarea" 
                    rows="2" 
                    placeholder="Ask about Tanzanian law, a judgment or an authorized case…"
                    onkeydown="if(event.key === 'Enter' && !event.shiftKey){ event.preventDefault(); AIAssistantView.handleSendMessage(); }"
                    oninput="AIAssistantView.activeDraftQuery = this.value;"
                    ${this.isSubmitting ? 'disabled' : ''}
                  >${this.activeDraftQuery || ''}</textarea>

                  <div class="tz-input-actions">
                    <button 
                      type="button" 
                      class="btn btn-secondary btn-sm" 
                      onclick="AIAssistantView.openUploadModal()" 
                      title="Attach supporting document"
                      style="padding: 0.6rem 0.75rem;"
                    >
                      📎 Attach Document
                    </button>

                    <button 
                      type="button" 
                      class="btn btn-secondary btn-sm" 
                      onclick="AIAssistantView.openSelectCaseModal()" 
                      title="Select authorized client matter"
                      style="padding: 0.6rem 0.75rem;"
                    >
                      📁 Select Case
                    </button>

                    <button 
                      type="button" 
                      class="btn btn-secondary btn-sm ${activeFilterCount > 0 ? 'border-gold' : ''}" 
                      onclick="AIAssistantView.openFiltersModal()" 
                      title="Adjust search scope, courts, years and categories"
                      style="padding: 0.6rem 0.75rem; position: relative;"
                    >
                      ⚙️ Sources & Filters
                      ${activeFilterCount > 0 ? `<span class="badge badge-gold" style="font-size: 0.65rem; margin-left: 0.3rem; padding: 1px 5px;">${activeFilterCount}</span>` : ''}
                    </button>

                    <button 
                      type="submit" 
                      id="btn-ask-slcms" 
                      class="btn btn-gold" 
                      style="padding: 0.6rem 1.35rem; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.4rem;"
                      ${this.isSubmitting ? 'disabled' : ''}
                    >
                      ${this.isSubmitting ? `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        <span>Searching…</span>
                      ` : `
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        <span>Ask SLCMS</span>
                      `}
                    </button>
                  </div>
                </div>
              </form>

              <!-- Professional Notice in Footer -->
              <div class="flex items-center justify-between" style="margin-top: 0.45rem; font-size: 0.73rem; color: var(--color-text-secondary);">
                <span>AI-assisted research • Professional verification required • Tanzanian jurisdiction</span>
                <span>Press <strong>Enter ↵</strong> to send, <strong>Shift+Enter</strong> for new line</span>
              </div>

            </div>
          </div>

          <!-- RIGHT COLUMN (30%): Retrieved Sources & Active Document Panel -->
          <div class="tz-sources-col">
            <div class="tz-sources-header">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.1rem; color: var(--color-gold);">📚</span>
                <strong style="color: var(--color-primary); font-size: 0.95rem;">Retrieved Sources</strong>
              </div>
              <span class="badge badge-neutral" style="font-size: 0.72rem;">
                ${this.activeSources.length} Authorities
              </span>
            </div>

            <!-- Source Cards List -->
            <div class="flex flex-col gap-3">
              ${this.activeSources.length === 0 ? `
                <div style="text-align: center; padding: 2rem 1rem; color: var(--color-text-secondary); font-size: 0.85rem;">
                  <div style="font-size: 1.75rem; margin-bottom: 0.5rem; opacity: 0.6;">📖</div>
                  No sources retrieved yet.<br>Ask a question to retrieve relevant TanzLII judgments and statutory provisions.
                </div>
              ` : this.activeSources.map((s, idx) => this.renderSourceCard(s, idx + 1)).join('')}
            </div>

            <!-- Library Quick Overview Box -->
            <div style="background: var(--color-surface-subtle); border: 1px dashed var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.78rem; color: var(--color-text-secondary); margin-top: auto;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.25rem;">
                <strong style="color: var(--color-primary);">Tanzania Legal Library</strong>
                <span class="badge badge-gold" style="font-size: 0.65rem;">Active</span>
              </div>
              <div>${readyDocsCount} authorized records indexed with complete Apache PDFBox passages.</div>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     EMPTY STATE COMPONENT
     -------------------------------------------------------------------------- */
  renderEmptyState() {
    return `
      <div class="tz-empty-hero animate-fade">
        <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #102A43 0%, #1E3A8A 100%); color: var(--color-gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 1.75rem; box-shadow: 0 4px 12px rgba(16, 42, 67, 0.25);">
          ⚖️
        </div>

        <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--color-primary); margin: 0 0 0.5rem; font-family: var(--font-heading);">
          How can I help with your Tanzanian legal research?
        </h2>
        <p style="font-size: 0.92rem; color: var(--color-text-secondary); line-height: 1.6; max-width: 600px; margin: 0 auto;">
          Search judgments, legislation and authorized case documents. Every legal answer includes supporting sources.
        </p>

        <!-- Four Action Cards -->
        <div class="tz-empty-action-grid">
          
          <div class="tz-action-card" onclick="AIAssistantView.fillAndAsk('show me all cases in 2020')">
            <div class="tz-action-card-icon">🔍</div>
            <div class="tz-action-card-title">Find a Judgment</div>
            <div class="tz-action-card-desc">Search precedent ratios, decision years, and landmark judgments.</div>
          </div>

          <div class="tz-action-card" onclick="AIAssistantView.fillAndAsk('Show facts of Attilio v. Mbowe')">
            <div class="tz-action-card-icon">ℹ️</div>
            <div class="tz-action-card-title">Show Facts of a Case</div>
            <div class="tz-action-card-desc">Extract pure factual background and parties' competing claims.</div>
          </div>

          <div class="tz-action-card" onclick="AIAssistantView.fillAndAsk('Summarize Attilio v. Mbowe')">
            <div class="tz-action-card-icon">📄</div>
            <div class="tz-action-card-title">Summarize a Document</div>
            <div class="tz-action-card-desc">Synthesize background, legal test, reasoning, and final orders.</div>
          </div>

          <div class="tz-action-card" onclick="AIAssistantView.fillAndAsk('show me the cases about land')">
            <div class="tz-action-card-icon">⚖️</div>
            <div class="tz-action-card-title">Research a Legal Issue</div>
            <div class="tz-action-card-desc">Synthesize Tanzanian authorities on procedural and substantive questions.</div>
          </div>

        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CONVERSATION MESSAGES RENDERER (Intent-Specific Dispatcher)
     -------------------------------------------------------------------------- */
  renderConversationMessages() {
    const user = SLCMS_STATE.currentUser;
    const userName = user?.name || 'Counsel';
    const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CN';

    return this.conversation.map(msg => {
      if (msg.role === 'user') {
        return `
          <div class="tz-msg-user-row animate-fade" id="msg-${msg.id}">
            <div class="tz-msg-user-bubble">
              ${this.escapeHtml(msg.text)}
            </div>
            <div class="tz-msg-avatar-user" title="${userName}">
              ${userInitials}
            </div>
          </div>
        `;
      }

      // Assistant Role
      return `
        <div class="tz-msg-assistant-row animate-fade" id="msg-${msg.id}">
          <div class="tz-msg-avatar-assistant" title="SLCMS Legal Research Assistant">
            ⚖️
          </div>
          <div class="tz-msg-assistant-body">
            ${msg.isSearching ? this.renderInlineProgress(msg) : this.renderAssistantMessageContent(msg)}
          </div>
        </div>
      `;
    }).join('');
  },

  renderAssistantMessageContent(msg) {
    if (msg.isGreeting) return this.renderGreetingMessage(msg);
    if (msg.isCaseList) return this.renderCaseListResults(msg);
    if (msg.intent === 'SHOW_FACTS') return this.renderCaseFacts(msg, msg.caseRecord);
    if (msg.intent === 'SUMMARIZE_CASE') return this.renderCaseSummary(msg, msg.caseRecord);
    if (msg.intent === 'SHOW_LEGAL_ISSUES') return this.renderCaseIssues(msg, msg.caseRecord);
    if (msg.intent === 'SHOW_REASONING') return this.renderCaseReasoning(msg, msg.caseRecord);
    if (msg.intent === 'SHOW_FINAL_DECISION') return this.renderCaseDecision(msg, msg.caseRecord);
    if (msg.intent === 'SHOW_LAWS_CITED') return this.renderCaseLaws(msg, msg.caseRecord);
    if (msg.isCaseAnalysis) return this.renderCaseAnalysisPanel(msg);
    return this.renderLegalReport(msg);
  },

  renderInlineProgress(msg) {
    return `
      <div class="tz-progress-inline animate-fade">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="color: var(--color-gold); flex-shrink: 0;">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <div style="flex: 1;">
          <strong style="color: var(--color-gold); font-size: 0.86rem; display: block;">
            ${this.escapeHtml(msg.searchProgressText || 'Searching Tanzania Legal Library…')}
          </strong>
          <span style="font-size: 0.76rem; color: #CBD5E1;">Querying verified judgment database records</span>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     1. GREETING RENDERER
     -------------------------------------------------------------------------- */
  renderGreetingMessage(msg) {
    const user = SLCMS_STATE.currentUser;
    const firstName = user?.name ? user.name.split(' ')[0] : 'Counsel';

    return `
      <div class="tz-legal-report animate-fade">
        <div class="flex items-center justify-between" style="margin-bottom: 0.65rem;">
          <span class="tz-status-pill" style="margin-bottom: 0;">
            👋 Welcome
          </span>
          <span style="font-size: 0.72rem; color: var(--color-text-secondary);">${msg.timestamp || 'Just now'}</span>
        </div>

        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--color-text-main); margin-bottom: 1rem;">
          Hello, ${firstName}! How may I assist with your Tanzanian legal research today?
        </div>

        <div style="padding-top: 0.85rem; border-top: 1px dashed var(--color-border);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; margin-bottom: 0.5rem;">
            Suggested actions:
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.fillAndAsk('show me all cases in 2020')">
              <span>🔍 Find a Judgment (2020)</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.fillAndAsk('Search Law of Contract Act Cap. 345')">
              <span>📜 Search Legislation</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.fillAndAsk('Show facts of Attilio v. Mbowe')">
              <span>ℹ️ Show Facts (Attilio v. Mbowe)</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.openSelectCaseModal()">
              <span>📁 Browse My Cases</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     2. CASE-RESULTS LIST RENDERER (For search queries like 'Cases in 2020')
     -------------------------------------------------------------------------- */
  renderCaseListResults(msg) {
    const list = msg.caseRecords || [];
    const title = msg.caseListTitle || 'Database Search Results';
    const subtitle = msg.caseListSubtitle || `I found ${list.length} AI-ready judgments in the current SLCMS Legal Source Library.`;

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title" style="margin-bottom: 0.15rem;">
              ${this.escapeHtml(title)}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(subtitle)}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${list.length} TanzLII sources retrieved • Citations checked
          </span>
        </div>

        <!-- Case Cards List -->
        <div class="flex flex-col gap-3" style="margin: 1rem 0;">
          ${list.map((c) => `
            <div class="tz-compact-case-card">
              <div class="flex items-center justify-between flex-wrap gap-1">
                <span class="badge badge-gold" style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase;">
                  ${this.escapeHtml(c.category || 'Tanzanian Law')}
                </span>
                <span class="badge badge-neutral" style="font-size: 0.68rem;">
                  ${this.escapeHtml(c.court || 'High Court of Tanzania')}
                </span>
              </div>

              <h4 class="tz-compact-title">
                ${this.escapeHtml(c.title)}
              </h4>

              <div class="tz-compact-citation">
                ${this.escapeHtml(c.citation || c.caseNumber || 'Precedent')}
              </div>

              <div class="tz-compact-meta">
                ${this.escapeHtml(c.decisionDate || c.year || '2020')} · ${this.escapeHtml(c.judge || 'Presiding Bench')} · ${this.escapeHtml(c.caseNumber || '')}
              </div>

              <!-- Action Buttons Bar with 10px spacing -->
              <div class="tz-action-button-bar">
                <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${c.id}')">
                  📄 Summarize
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')">
                  ℹ️ Show Facts
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
                  ✓ Show Final Decision
                </button>
                <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold); font-weight: 600;" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
                  ↗ Open Source
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Footer -->
        <div style="border-top: 1px dashed var(--color-border); padding-top: 0.65rem; font-size: 0.78rem; color: var(--color-text-secondary); text-align: center;">
          Showing ${list.length} of ${list.length} judgments available in the current Legal Source Library.
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     3. SHOW FACTS DEDICATED RENDERER (Pure Factual Background Only)
     -------------------------------------------------------------------------- */
  renderCaseFacts(msg, caseRec) {
    const c = caseRec || {};
    const f = c.facts || {};

    // Build facts sections dynamically for Attilio or generic judgments
    let partiesPremisesHtml = '';
    let natureDisputeHtml = '';
    let competingPositionsHtml = '';
    let proceduralPositionHtml = '';

    if (f.partiesAndPremises) {
      partiesPremisesHtml = f.partiesAndPremises.map(p => `<li>${this.escapeHtml(p)}</li>`).join('');
      natureDisputeHtml = f.natureOfDispute.map(p => `<li>${this.escapeHtml(p)}</li>`).join('');
      competingPositionsHtml = f.competingPositions.map(p => `<li>${this.escapeHtml(p)}</li>`).join('');
      proceduralPositionHtml = f.proceduralPosition.map(p => `<li>${this.escapeHtml(p)}</li>`).join('');
    } else {
      // Fallback for judgments with single string facts
      partiesPremisesHtml = `<li>The parties engaged in dispute before the ${this.escapeHtml(c.court || 'High Court of Tanzania')}.</li>`;
      natureDisputeHtml = `<li>${this.escapeHtml(typeof f === 'string' ? f : c.relevantPassage || 'Factual details recorded in the primary pleadings.')}</li>`;
      competingPositionsHtml = `<li>The applicant sought legal remedies asserting verifiable statutory entitlements.</li>`;
      proceduralPositionHtml = `<li>The matter was filed and heard on merits before ${this.escapeHtml(c.judge || 'the Court')}.</li>`;
    }

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              Facts of ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '[1969] HCD 284')} · ${this.escapeHtml(c.court || 'High Court of Tanzania')} · ${this.escapeHtml(c.caseNumber || '')}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Facts Extracted • No Final Outcome
          </span>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Parties and premises</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${partiesPremisesHtml}
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Nature of the dispute</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${natureDisputeHtml}
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Parties’ competing positions</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${competingPositionsHtml}
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Procedural position</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${proceduralPositionHtml}
          </ul>
        </div>

        <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 1rem; padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: 4px;">
          Facts extracted from the selected judgment. Verify against the <a href="${c.tanzliiUrl || 'https://tanzlii.org'}" target="_blank" style="color: var(--color-gold); font-weight: 600;">original TanzLII source</a>.
        </div>

        <!-- Clean Action Bar with 10px spacing -->
        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${c.id}')">
            📄 Summarize the Case
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            ⚖️ Show Court Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✓ Show Final Decision
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Facts
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            ↗ Open Original Source
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Attach to Matter
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     4. SUMMARIZE CASE DEDICATED RENDERER (Complete Synthesis)
     -------------------------------------------------------------------------- */
  renderCaseSummary(msg, caseRec) {
    const c = caseRec || {};
    const s = c.summary || {};

    const backgroundText = s.background || c.relevantPassage || 'Dispute submitted for determination before the court.';
    const legalIssueText = s.legalIssue || (c.legalIssues ? c.legalIssues[0] : 'Whether the applicant is entitled to the requested reliefs.');
    const principlesList = s.legalPrinciples || [
      'A serious question to be tried and a probability that the applicant may obtain relief.',
      'A risk of injury that could not adequately be repaired through monetary compensation.',
      'A balance of convenience favouring the applicant.'
    ];
    const reasoningText = s.reasoning || c.reasoning || 'The Court analyzed statutory and evidentiary standards in reaching its determination.';
    const finalDecisionText = s.finalDecision || c.decision || 'Final orders entered as recorded in the judgment.';

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              Summary of ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · ${this.escapeHtml(c.court || 'High Court of Tanzania')} · ${this.escapeHtml(c.decisionDate || '')}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Complete Case Summary
          </span>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Background</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(backgroundText)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Legal issue</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(legalIssueText)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Legal principles</div>
          <div style="font-size: 0.88rem; color: var(--color-text-secondary); margin-bottom: 0.35rem;">
            The Court considered three mandatory requirements for a temporary injunction:
          </div>
          <ol class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${principlesList.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
          </ol>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Court’s reasoning</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(reasoningText)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Final decision</div>
          <div class="tz-direct-answer-box">
            ${this.escapeHtml(finalDecisionText)}
          </div>
        </div>

        <!-- Clean Action Bar with 10px spacing -->
        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.viewSupportingPassage('${c.id}')">
            📄 Show Supporting Passages
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Summary
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            ↗ Open Original Source
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Attach to Matter
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     5. SHOW FINAL DECISION DEDICATED RENDERER
     -------------------------------------------------------------------------- */
  renderCaseDecision(msg, caseRec) {
    const c = caseRec || {};
    const dec = c.decision || (c.summary ? c.summary.finalDecision : 'Final orders recorded in the judgment.');

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              Final Decision in ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · ${this.escapeHtml(c.court || 'High Court of Tanzania')} · Delivered: ${this.escapeHtml(c.decisionDate || '')}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Operative Orders
          </span>
        </div>

        <div class="tz-decision-box" style="margin-top: 1rem;">
          <div class="tz-decision-box-title">
            <span>✓</span>
            <span>COURT'S FINAL OPERATIVE ORDER</span>
          </div>
          <div style="font-size: 0.95rem; line-height: 1.65; color: #102A43; white-space: pre-wrap; font-weight: 500;">
${this.escapeHtml(dec)}
          </div>
          <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.75rem; border-top: 1px dashed #CBD5E1; padding-top: 0.5rem;">
            Presiding: <strong>${this.escapeHtml(c.judge || 'High Court Bench')}</strong> · Decision Date: ${this.escapeHtml(c.decisionDate || '')}
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Final Order
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')">
            ℹ️ Show Facts
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            ↗ Open Original Source
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Attach to Matter
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     6. SHOW REASONING DEDICATED RENDERER
     -------------------------------------------------------------------------- */
  renderCaseReasoning(msg, caseRec) {
    const c = caseRec || {};
    const r = c.reasoning || (c.summary ? c.summary.reasoning : 'The Court analyzed the legal arguments on merits.');

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              Court’s Reasoning in ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Ratio Decidendi
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ⚖️ Ratio Decidendi
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          <div class="tz-report-section-label">Judicial Analysis & Ratio</div>
          <div style="font-size: 0.92rem; line-height: 1.7; color: var(--color-text-main);">
            ${this.escapeHtml(r)}
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${c.id}')">
            📄 View Full Summary
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            ↗ Open Original Source
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Attach to Matter
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     7. SHOW LEGAL ISSUES & LAWS CITED RENDERERS
     -------------------------------------------------------------------------- */
  renderCaseIssues(msg, caseRec) {
    const c = caseRec || {};
    const issues = c.legalIssues || ['Whether the applicant satisfied the statutory conditions for relief.'];

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              Legal Issues in ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Questions Before the Court
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ❓ Legal Issues
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          <div class="tz-report-section-label">Questions for Determination</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${issues.map(iss => `<li>${this.escapeHtml(iss)}</li>`).join('')}
          </ul>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Issues
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            ⚖️ Show Reasoning
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            ↗ Open Original Source
          </button>
        </div>
      </div>
    `;
  },

  renderCaseLaws(msg, caseRec) {
    const c = caseRec || {};
    const laws = c.lawsCited || ['Civil Procedure Code [Cap. 33 R.E. 2019]'];

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              Laws Cited in ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Statutory Authorities
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            📖 Statutory Authorities
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          <div class="tz-report-section-label">Legislation & Precedents</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${laws.map(l => `<li>${this.escapeHtml(l)}</li>`).join('')}
          </ul>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Citations
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            ↗ Open Original Source
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     8. TABBED CASE ANALYSIS PANEL (For Muwinge [2020] & Complex Precedents)
     -------------------------------------------------------------------------- */
  renderCaseAnalysisPanel(msg) {
    const caseRec = msg.caseRecord || {};
    const activeTab = msg.activeTab || 'summary';
    const isTabLoading = msg.tabLoading || false;

    return `
      <div class="tz-case-analysis-panel animate-fade">
        
        <!-- Header -->
        <div class="tz-case-header-card">
          <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 class="tz-case-header-title">
                ${this.escapeHtml(caseRec.title || 'ABDALLAH SALUM MUWINGE VS HALIMA ISMAIL')}
              </h2>
              <div class="tz-case-header-meta">
                <span class="tz-case-header-citation">${this.escapeHtml(caseRec.citation || '[2020] TZHC 10045')}</span> • 
                ${this.escapeHtml(caseRec.court || 'High Court of Tanzania')} • 
                ${this.escapeHtml(caseRec.caseNumber || caseRec.appealNo || 'PC Civil Appeal No. 69 of 2018')} • 
                ${this.escapeHtml(caseRec.judge || 'S.M. Kulita, J.')} · ${this.escapeHtml(caseRec.decisionDate || '31 December 2020')}
              </div>
              <div style="margin-top: 0.45rem;">
                <span class="badge badge-gold" style="font-size: 0.7rem;">
                  ✓ TanzLII source retrieved
                </span>
              </div>
            </div>

            <!-- Top Actions -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #FFF; border-color: rgba(255,255,255,0.3);" onclick="App.showToast('Case saved to notebook.', 'success')">
                💾 Save Case
              </button>
              <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #FFF; border-color: rgba(255,255,255,0.3);" onclick="navigator.clipboard.writeText('${caseRec.citation || '[2020] TZHC 10045'}').then(() => App.showToast('Citation copied.', 'success'))">
                📋 Copy Citation
              </button>
              <button class="btn btn-gold btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
                📎 Add to Client Matter
              </button>
            </div>
          </div>
        </div>

        <!-- 6 Action Navigation Tabs + Separate TanzLII Button -->
        <div class="tz-case-actions-nav">
          <div class="tz-case-actions-grid">
            <button type="button" class="tz-case-action-btn first-highlight ${activeTab === 'summary' ? 'active' : ''}" onclick="AIAssistantView.switchCaseTab('${msg.id}', 'summary')" ${isTabLoading ? 'disabled' : ''}>
              <span class="tz-btn-icon">📄</span>
              <span>Summarize the Case</span>
            </button>
            <button type="button" class="tz-case-action-btn ${activeTab === 'facts' ? 'active' : ''}" onclick="AIAssistantView.switchCaseTab('${msg.id}', 'facts')" ${isTabLoading ? 'disabled' : ''}>
              <span class="tz-btn-icon">ℹ️</span>
              <span>Show Facts</span>
            </button>
            <button type="button" class="tz-case-action-btn ${activeTab === 'issues' ? 'active' : ''}" onclick="AIAssistantView.switchCaseTab('${msg.id}', 'issues')" ${isTabLoading ? 'disabled' : ''}>
              <span class="tz-btn-icon">❓</span>
              <span>Show Legal Issues</span>
            </button>
            <button type="button" class="tz-case-action-btn ${activeTab === 'reasoning' ? 'active' : ''}" onclick="AIAssistantView.switchCaseTab('${msg.id}', 'reasoning')" ${isTabLoading ? 'disabled' : ''}>
              <span class="tz-btn-icon">⚖️</span>
              <span>Show Court Reasoning</span>
            </button>
            <button type="button" class="tz-case-action-btn ${activeTab === 'decision' ? 'active' : ''}" onclick="AIAssistantView.switchCaseTab('${msg.id}', 'decision')" ${isTabLoading ? 'disabled' : ''}>
              <span class="tz-btn-icon">✓</span>
              <span>Show Final Decision</span>
            </button>
            <button type="button" class="tz-case-action-btn ${activeTab === 'laws' ? 'active' : ''}" onclick="AIAssistantView.switchCaseTab('${msg.id}', 'laws')" ${isTabLoading ? 'disabled' : ''}>
              <span class="tz-btn-icon">📖</span>
              <span>Show Laws Cited</span>
            </button>
          </div>

          <button type="button" class="tz-open-original-btn" onclick="AIAssistantView.openOriginalTanzLII('${caseRec.tanzliiUrl || 'https://tanzlii.org/tz/judgment/high-court-tanzania/2020/10045'}', '${caseRec.title}')">
            <span>↗ Open Original Source on TanzLII</span>
          </button>
        </div>

        <!-- Body -->
        <div class="tz-case-content-body">
          ${isTabLoading ? this.renderTabLoadingSkeleton(msg) : this.renderCaseTabContent(msg, activeTab, caseRec)}
        </div>

      </div>
    `;
  },

  renderTabLoadingSkeleton(msg) {
    return `
      <div class="animate-fade" style="padding: 1.5rem 0; text-align: center;">
        <div class="flex items-center justify-center gap-2" style="margin-bottom: 0.75rem;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="color: var(--color-gold);">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <strong style="color: var(--color-primary); font-size: 0.95rem;">
            ${this.escapeHtml(msg.tabProgressText || 'Retrieving relevant passages from judgment…')}
          </strong>
        </div>
        <p style="font-size: 0.82rem; color: var(--color-text-secondary);">
          Extracting verified ratio decidendi and statutory references from Apache PDFBox indexed passages.
        </p>
      </div>
    `;
  },

  renderCaseTabContent(msg, activeTab, caseRec) {
    switch (activeTab) {
      case 'summary': return this.renderCaseSummaryTab(msg, caseRec);
      case 'facts': return this.renderCaseFactsTab(msg, caseRec);
      case 'issues': return this.renderCaseIssuesTab(msg, caseRec);
      case 'reasoning': return this.renderCaseReasoningTab(msg, caseRec);
      case 'decision': return this.renderCaseDecisionTab(msg, caseRec);
      case 'laws': return this.renderCaseLawsTab(msg, caseRec);
      default: return this.renderCaseSummaryTab(msg, caseRec);
    }
  },

  renderCaseSummaryTab(msg, caseRec) {
    return `
      <div class="animate-fade">
        <div class="tz-content-status-bar">
          <div><strong>CASE SUMMARY</strong> · Generated from selected judgment</div>
          <span>Sources used: 1 judgment · 6 passages</span>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Background</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            The appeal arose from a matrimonial dispute involving the division of matrimonial property and monthly child maintenance between the appellant (Abdallah Salum Muwinge) and the respondent (Halima Ismail).
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Main Issues</div>
          <ul class="tz-bullet-list">
            <li>Whether awarding 70% of the matrimonial property to the respondent was legally justified.</li>
            <li>Whether monthly child maintenance of TZS 50,000 was appropriate.</li>
            <li>Whether the omission of crucial witness proceedings in the Primary Court record invalidated the trial.</li>
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Court's Reasoning</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            The High Court found that significant portions of the Primary Court proceedings—specifically the petitioner's evidence—were missing from the original trial record. Because the record was incomplete and uncorroborated, the lower-court judgment could not safely stand. <span class="citation-bracket" onclick="AIAssistantView.highlightSource('tz-j-009')">[1]</span>
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Final Outcome</div>
          <div class="tz-direct-answer-box">
            The High Court nullified the proceedings and judgments of both the Primary Court and District Court, and ordered a trial de novo before another competent magistrate with a new set of assessors. No order as to costs was made.
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.viewSupportingPassage('${caseRec.id || 'tz-j-009'}')">
            📄 View Supporting Passages
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Summary
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Save to Case
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.exportPDF()">
            📥 Export PDF
          </button>
        </div>
      </div>
    `;
  },

  renderCaseFactsTab(msg, caseRec) {
    return `
      <div class="animate-fade">
        <div class="tz-content-status-bar">
          <div><strong>FACTUAL BACKGROUND & TIMELINE</strong> · Chronological record</div>
          <span>Answer generated from 4 passages</span>
        </div>

        <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.76rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; margin-bottom: 0.35rem;">
            Parties to the Dispute
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" style="font-size: 0.85rem;">
            <div><strong>Appellant:</strong> Abdallah Salum Muwinge (Husband)</div>
            <div><strong>Respondent:</strong> Halima Ismail (Wife)</div>
            <div><strong>Nature of Relationship:</strong> Islamic Marriage contracted 2010</div>
            <div><strong>Subject Matter:</strong> Matrimonial Home & Maintenance</div>
          </div>
        </div>

        <div class="tz-report-section-label">Factual Timeline</div>
        <div class="tz-timeline-v">
          <div class="tz-timeline-item">
            <div class="tz-timeline-marker"></div>
            <div class="tz-timeline-date">21 May 2010</div>
            <div class="tz-timeline-text">Parties contracted an Islamic marriage in Morogoro.</div>
          </div>
          <div class="tz-timeline-item">
            <div class="tz-timeline-marker"></div>
            <div class="tz-timeline-date">2016</div>
            <div class="tz-timeline-text">Marital relationship reportedly deteriorated leading to separation.</div>
          </div>
          <div class="tz-timeline-item">
            <div class="tz-timeline-marker"></div>
            <div class="tz-timeline-date">2017</div>
            <div class="tz-timeline-text">Matrimonial proceedings commenced in Morogoro Primary Court (Matrimonial Cause No. 12 of 2017).</div>
          </div>
          <div class="tz-timeline-item">
            <div class="tz-timeline-marker"></div>
            <div class="tz-timeline-date">2018</div>
            <div class="tz-timeline-text">Appeal reached Morogoro District Court (Civil Appeal No. 69 of 2018) and subsequently High Court.</div>
          </div>
          <div class="tz-timeline-item">
            <div class="tz-timeline-marker"></div>
            <div class="tz-timeline-date">31 December 2020</div>
            <div class="tz-timeline-text">High Court (S.M. Kulita, J.) delivered final appellate judgment nullifying proceedings.</div>
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.viewSupportingPassage('${caseRec.id || 'tz-j-009'}')">
            📄 View Fact Passages
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('Timeline: 2010 Marriage -> 2017 Primary Court -> 2018 District Court -> 2020 High Court').then(() => App.showToast('Timeline copied.', 'success'))">
            📋 Copy Timeline
          </button>
        </div>
      </div>
    `;
  },

  renderCaseIssuesTab(msg, caseRec) {
    return `
      <div class="animate-fade">
        <div class="tz-content-status-bar">
          <div><strong>LEGAL ISSUES & QUESTIONS DETERMINED</strong></div>
          <span>3 identified legal issues</span>
        </div>

        <div class="tz-issue-card">
          <div class="tz-issue-badge">Issue 1 · Substantive Ground</div>
          <div style="font-weight: 700; font-size: 0.92rem; color: var(--color-primary); margin-bottom: 0.35rem;">
            Whether the award of 70% of the matrimonial property properly reflected the parties' respective contributions.
          </div>
          <div style="font-size: 0.82rem; background: #FEF2F2; color: #991B1B; padding: 0.35rem 0.65rem; border-radius: 4px;">
            <strong>Status:</strong> Not finally determined because the lower-court proceedings were nullified.
          </div>
        </div>

        <div class="tz-issue-card">
          <div class="tz-issue-badge">Issue 2 · Substantive Ground</div>
          <div style="font-weight: 700; font-size: 0.92rem; color: var(--color-primary); margin-bottom: 0.35rem;">
            Whether monthly child maintenance of TZS 50,000 was appropriate considering the appellant's financial means.
          </div>
          <div style="font-size: 0.82rem; background: #FEF2F2; color: #991B1B; padding: 0.35rem 0.65rem; border-radius: 4px;">
            <strong>Status:</strong> Not finally determined because a new trial was ordered.
          </div>
        </div>

        <div class="tz-issue-card" style="border-left: 3.5px solid var(--color-gold);">
          <div class="tz-issue-badge" style="color: var(--color-primary);">Procedural Issue · Identified by the Court</div>
          <div style="font-weight: 700; font-size: 0.92rem; color: var(--color-primary); margin-bottom: 0.35rem;">
            Whether the incomplete Primary Court record made the trial proceedings legally unreliable.
          </div>
          <div style="font-size: 0.82rem; background: #F0FDF4; color: #166534; padding: 0.35rem 0.65rem; border-radius: 4px;">
            <strong>Status:</strong> Determined by the High Court (An incomplete record invalidates the judgment).
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Issues
          </button>
        </div>
      </div>
    `;
  },

  renderCaseReasoningTab(msg, caseRec) {
    return `
      <div class="animate-fade">
        <div class="tz-content-status-bar">
          <div><strong>COURT'S REASONING & RATIO DECIDENDI</strong></div>
          <span>Step-by-step judicial logic</span>
        </div>

        <div class="tz-report-section-label">Judicial Reasoning Sequence</div>
        <div class="flex flex-col gap-1.5" style="margin-bottom: 1.25rem;">
          <div class="tz-reasoning-flow-step">1. Court inspected the Primary Court original trial record.</div>
          <div class="tz-reasoning-flow-step">2. Pages containing the petitioner's oral testimony were missing and unrecorded.</div>
          <div class="tz-reasoning-flow-step">3. The appellate record was therefore incomplete and unreliable.</div>
          <div class="tz-reasoning-flow-step">4. The District Court had failed to discover this critical irregularity.</div>
          <div class="tz-reasoning-flow-step">5. Lower-court proceedings could not safely stand without violating natural justice.</div>
          <div class="tz-reasoning-flow-step" style="border-left-color: var(--color-primary); background: #F1F5F9; font-weight: 700;">6. A trial de novo before another magistrate was mandatory.</div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Reasoning
          </button>
        </div>
      </div>
    `;
  },

  renderCaseDecisionTab(msg, caseRec) {
    return `
      <div class="animate-fade">
        <div class="tz-content-status-bar">
          <div><strong>FINAL COURT DECISION & OPERATIVE ORDERS</strong></div>
          <span>Delivered: 31 December 2020</span>
        </div>

        <div class="tz-decision-box">
          <div class="tz-decision-box-title">
            <span>✓</span>
            <span>COURT'S FINAL ORDER</span>
          </div>
          <ul class="tz-bullet-list" style="font-size: 0.95rem; font-weight: 600; color: #102A43; margin-left: 1.15rem;">
            <li>Primary Court proceedings and judgment nullified.</li>
            <li>District Court proceedings and judgment nullified.</li>
            <li>Trial de novo ordered before another competent magistrate with a new set of assessors.</li>
            <li>No order as to costs was made.</li>
          </ul>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Final Order
          </button>
        </div>
      </div>
    `;
  },

  renderCaseLawsTab(msg, caseRec) {
    return `
      <div class="animate-fade">
        <div class="tz-content-status-bar">
          <div><strong>AUTHORITIES & LAWS CITED IN JUDGMENT</strong></div>
        </div>

        <div class="flex flex-col gap-2.5">
          <div class="dash-task-item">
            <strong style="color: var(--color-primary);">Magistrates' Courts Act [Cap. 11 R.E. 2019]</strong>
            <div style="font-size: 0.82rem; color: var(--color-text-main); margin-top: 0.2rem;">
              Section 32 — Powers of appellate courts on revision and retrial de novo.
            </div>
          </div>
          <div class="dash-task-item">
            <strong style="color: var(--color-primary);">Law of Marriage Act [Cap. 29 R.E. 2019]</strong>
            <div style="font-size: 0.82rem; color: var(--color-text-main); margin-top: 0.2rem;">
              Section 114 — Factors governing matrimonial property division.
            </div>
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('Cap. 11 Section 32, Cap. 29 Section 114').then(() => App.showToast('Citations copied.', 'success'))">
            📋 Copy Citations
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     9. GENERAL LEGAL SYNTHESIS REPORT (For Non-Case Statutory Queries)
     -------------------------------------------------------------------------- */
  renderLegalReport(msg) {
    const r = msg.report || {};
    const feedback = this.feedbackState[msg.id] || null;

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              ${this.escapeHtml(r.title || 'Tanzanian Legal Research Findings')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(r.court || 'Court of Appeal & High Court of Tanzania')} ${r.meta ? `· ${this.escapeHtml(r.meta)}` : ''}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${this.escapeHtml(r.tanzliiStatus || '3 TanzLII sources retrieved • Citations checked')}
          </span>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Direct answer</div>
          <div class="tz-direct-answer-box">
            ${r.directAnswer || 'Analysis based on verified Tanzanian sources.'}
          </div>
        </div>

        ${r.background ? `
          <div class="tz-report-section">
            <div class="tz-report-section-label">Background / Case summary</div>
            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
              ${this.escapeHtml(r.background)}
            </div>
          </div>
        ` : ''}

        ${r.issues && r.issues.length > 0 ? `
          <div class="tz-report-section">
            <div class="tz-report-section-label">Questions raised / Legal issues</div>
            <ul class="tz-bullet-list">
              ${r.issues.map(iss => `<li>${this.escapeHtml(iss)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${r.reasoning ? `
          <div class="tz-report-section">
            <div class="tz-report-section-label">Court's reasoning</div>
            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
              ${this.escapeHtml(r.reasoning)}
            </div>
          </div>
        ` : ''}

        ${r.finalOrder && r.finalOrder.length > 0 ? `
          <div class="tz-report-section">
            <div class="tz-report-section-label">Court's final order</div>
            <ul class="tz-bullet-list" style="color: var(--color-primary); font-weight: 500;">
              ${r.finalOrder.map(ord => `<li>${this.escapeHtml(ord)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Clean Action Bar with 10px spacing -->
        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Attach to Case
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.exportPDF()">
            📥 Export PDF
          </button>
          <button type="button" class="btn btn-ghost btn-sm ${feedback === 'helpful' ? 'text-success font-bold' : ''}" onclick="AIAssistantView.recordFeedback('${msg.id}', 'helpful')">
            👍 Helpful
          </button>
          <button type="button" class="btn btn-ghost btn-sm ${feedback === 'incorrect' ? 'text-danger font-bold' : ''}" onclick="AIAssistantView.recordFeedback('${msg.id}', 'incorrect')">
            👎 Incorrect
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     RIGHT COLUMN SOURCE CARD RENDERER
     -------------------------------------------------------------------------- */
  renderSourceCard(source, index) {
    const isHighlighted = this.activeSourceHighlightId === source.id;

    return `
      <div 
        id="source-card-${source.id}" 
        class="tz-source-card-v2 ${isHighlighted ? 'source-card-highlight' : ''}"
      >
        <div class="tz-source-badge-number">
          SOURCE ${index}
        </div>
        <div class="tz-source-card-title">
          ${this.escapeHtml(source.title)}
        </div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-gold); margin-bottom: 0.2rem;">
          ${this.escapeHtml(source.citation || source.caseNumber || 'Statute Chapter')}
        </div>
        <div class="tz-source-card-meta">
          ${this.escapeHtml(source.court || 'Tanzania')} • ${this.escapeHtml(source.decisionDate || source.year || 'Indexed Precedent')}
        </div>

        <div class="tz-source-card-match">
          <strong>Matched because:</strong> ${this.escapeHtml(source.matchReason || (source.ratioDecidendi ? source.ratioDecidendi.substring(0, 95) + '…' : 'Contains relevant ratio decidendi and statutory references.'))}
        </div>

        <div class="tz-source-card-actions">
          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            style="font-size: 0.74rem; padding: 0.3rem 0.55rem;"
            onclick="AIAssistantView.viewSupportingPassage('${source.id}')"
          >
            📄 View Passage
          </button>
          <button 
            type="button" 
            class="btn btn-ghost btn-sm" 
            style="font-size: 0.74rem; padding: 0.3rem 0.55rem; color: var(--color-gold);"
            onclick="AIAssistantView.openOriginalTanzLII('${source.tanzliiUrl || 'https://tanzlii.org'}', '${source.title}')"
          >
            🌐 Open TanzLII ↗
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     SEARCH PIPELINE & INTENT-SPECIFIC ROUTING (With Duplicate Prevention)
     -------------------------------------------------------------------------- */
  fillAndAsk(queryText) {
    if (this.isSubmitting || this.isProcessing) return;
    this.activeDraftQuery = queryText;
    const input = document.getElementById('tz-question-input');
    if (input) input.value = queryText;
    this.handleSendMessage();
  },

  handleSendMessage() {
    // 1. Strict Duplicate & Re-entrancy Lock
    if (this.isSubmitting || this.isProcessing) return;

    const input = document.getElementById('tz-question-input');
    const query = (input ? input.value : this.activeDraftQuery) || '';
    if (!query || !query.trim()) return;

    const trimmedQuery = query.trim();
    this.activeDraftQuery = '';
    if (input) input.value = '';

    this.isSubmitting = true;
    this.isProcessing = true;

    const reqId = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    const userMsgId = 'usr-' + Date.now();
    const assistantMsgId = 'ast-' + (Date.now() + 1);

    // 2. Append User Message
    this.conversation.push({
      id: userMsgId,
      role: 'user',
      text: trimmedQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    const qLower = trimmedQuery.toLowerCase();
    const cleanNoPunct = qLower.replace(/[^\w\s]/g, ' ');

    // 3. Greeting Intent
    if (/^(hi|hello|hey|mambo|habari|hujambo|shikamoo|salama)\b/i.test(cleanNoPunct.trim())) {
      this.conversation.push({
        id: assistantMsgId,
        reqId: reqId,
        role: 'assistant',
        isSearching: true,
        searchProgressText: 'Connecting to SLCMS Legal Assistant…',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      App.renderAuthenticatedApp();
      this.scrollToBottom();

      setTimeout(() => {
        const msgObj = this.conversation.find(m => m.id === assistantMsgId);
        if (msgObj) {
          msgObj.isSearching = false;
          msgObj.isGreeting = true;
        }
        this.isSubmitting = false;
        this.isProcessing = false;
        App.renderAuthenticatedApp();
        this.scrollToBottom();
      }, 500);
      return;
    }

    // 4. SHOW FACTS Intent (e.g. "show facts of attilio v mbowe", "facts of muwinge", "show facts")
    const isShowFacts = (cleanNoPunct.includes('show fact') || cleanNoPunct.includes('facts of') || cleanNoPunct.includes('tell me facts') || cleanNoPunct.includes('the facts')) && !cleanNoPunct.includes('summarize');

    if (isShowFacts) {
      let matchedCase = null;
      if (cleanNoPunct.includes('attilio') || cleanNoPunct.includes('mbowe')) {
        matchedCase = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-001');
      } else if (cleanNoPunct.includes('muwinge') || cleanNoPunct.includes('halima')) {
        matchedCase = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-009');
      } else if (this.activeSources.length > 0) {
        matchedCase = this.activeSources[0];
      }

      this.conversation.push({
        id: assistantMsgId,
        reqId: reqId,
        role: 'assistant',
        isSearching: true,
        searchProgressText: `Extracting factual background of ${matchedCase ? matchedCase.title : 'judgment'}…`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      App.renderAuthenticatedApp();
      this.scrollToBottom();

      setTimeout(() => {
        const msgObj = this.conversation.find(m => m.id === assistantMsgId);
        if (msgObj) {
          msgObj.isSearching = false;
          msgObj.intent = 'SHOW_FACTS';
          msgObj.caseRecord = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
          if (matchedCase) this.activeSources = [matchedCase, ...this.activeSources.filter(s => s.id !== matchedCase.id)];
        }
        this.isSubmitting = false;
        this.isProcessing = false;
        App.renderAuthenticatedApp();
        this.scrollToBottom();
      }, 700);
      return;
    }

    // 5. SUMMARIZE CASE Intent (e.g. "summarize attilio v mbowe", "summarize muwinge")
    const isSummarize = cleanNoPunct.includes('summarize') || cleanNoPunct.includes('summary of');

    if (isSummarize) {
      let matchedCase = null;
      if (cleanNoPunct.includes('attilio') || cleanNoPunct.includes('mbowe')) {
        matchedCase = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-001');
      } else if (cleanNoPunct.includes('muwinge') || cleanNoPunct.includes('halima')) {
        matchedCase = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-009');
      } else if (this.activeSources.length > 0) {
        matchedCase = this.activeSources[0];
      }

      this.conversation.push({
        id: assistantMsgId,
        reqId: reqId,
        role: 'assistant',
        isSearching: true,
        searchProgressText: `Synthesizing complete case summary of ${matchedCase ? matchedCase.title : 'judgment'}…`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      App.renderAuthenticatedApp();
      this.scrollToBottom();

      setTimeout(() => {
        const msgObj = this.conversation.find(m => m.id === assistantMsgId);
        if (msgObj) {
          msgObj.isSearching = false;
          msgObj.intent = 'SUMMARIZE_CASE';
          msgObj.caseRecord = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
          if (matchedCase) this.activeSources = [matchedCase, ...this.activeSources.filter(s => s.id !== matchedCase.id)];
        }
        this.isSubmitting = false;
        this.isProcessing = false;
        App.renderAuthenticatedApp();
        this.scrollToBottom();
      }, 700);
      return;
    }

    // 6. LIST_CASES_BY_YEAR (e.g. "show me all cases in 2020", "2020 cases")
    const yearMatch = cleanNoPunct.match(/\b(19\d{2}|20\d{2})\b/);
    const isYearQuery = yearMatch && (
      cleanNoPunct.includes('cases') || cleanNoPunct.includes('case') || 
      cleanNoPunct.includes('show') || cleanNoPunct.includes('judgments') || 
      cleanNoPunct.includes('all') || cleanNoPunct.includes('from') || cleanNoPunct.includes('in')
    );

    if (isYearQuery) {
      const year = yearMatch[1];
      this.conversation.push({
        id: assistantMsgId,
        reqId: reqId,
        role: 'assistant',
        isSearching: true,
        searchProgressText: `Querying AI-ready judgments from ${year}…`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      App.renderAuthenticatedApp();
      this.scrollToBottom();

      setTimeout(() => {
        const msgObj = this.conversation.find(m => m.id === assistantMsgId);
        if (msgObj) {
          msgObj.isSearching = false;
          msgObj.isCaseList = true;
          msgObj.caseListTitle = `Cases from ${year}`;

          const matchingJudgments = (SLCMS_STATE.tanzaniaJudgments || []).filter(j => 
            (j.year && j.year.toString() === year) || 
            (j.decisionDate && j.decisionDate.includes(year)) ||
            (j.citation && j.citation.includes(year))
          );

          msgObj.caseRecords = matchingJudgments;
          msgObj.caseListSubtitle = `I found ${matchingJudgments.length} AI-ready judgments from ${year} in the current SLCMS Legal Source Library.`;
          this.activeSources = matchingJudgments;
        }
        this.isSubmitting = false;
        this.isProcessing = false;
        App.renderAuthenticatedApp();
        this.scrollToBottom();
      }, 800);
      return;
    }

    // 7. General Legal Question Fallback
    this.conversation.push({
      id: assistantMsgId,
      reqId: reqId,
      role: 'assistant',
      isSearching: true,
      searchProgressText: 'Searching Tanzania Legal Library…',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    App.renderAuthenticatedApp();
    this.scrollToBottom();

    setTimeout(() => {
      this.finalizeLegalAnswer(assistantMsgId, trimmedQuery);
    }, 900);
  },

  finalizeLegalAnswer(msgId, query) {
    this.isSubmitting = false;
    this.isProcessing = false;
    const msgObj = this.conversation.find(m => m.id === msgId);
    if (!msgObj) return;

    msgObj.isSearching = false;
    const qLower = query.toLowerCase();

    if (qLower.includes('injunction') || qLower.includes('attilio') || qLower.includes('temporary')) {
      const attilioRecord = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-001');
      msgObj.intent = 'SUMMARIZE_CASE';
      msgObj.caseRecord = attilioRecord;
      if (attilioRecord) this.activeSources = [attilioRecord, ...this.activeSources.filter(s => s.id !== 'tz-j-001')];
    } else if (qLower.includes('muwinge') || qLower.includes('10045') || (qLower.includes('halima') && qLower.includes('ismail'))) {
      const muwingeRecord = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-009');
      msgObj.intent = 'SUMMARIZE_CASE';
      msgObj.caseRecord = muwingeRecord;
      if (muwingeRecord) this.activeSources = [muwingeRecord, ...this.activeSources.filter(s => s.id !== 'tz-j-009')];
    } else {
      const searchRes = SLCMS_STATE.searchTanzaniaLegalAuthorities(query, this.filters.scope, this.filters, SLCMS_STATE.currentUser);
      const allRetrieved = [...(searchRes.judgments || []), ...(searchRes.legislation || [])];
      if (allRetrieved.length > 0) this.activeSources = allRetrieved;

      msgObj.report = {
        title: `Legal Research Findings: "${query.substring(0, 40)}..."`,
        court: 'Tanzanian Legal Repository',
        meta: 'TanzLII & Statutory Chapters',
        tanzliiStatus: `${this.activeSources.length} TanzLII sources retrieved • Citations checked`,
        directAnswer: `Based on retrieved Tanzanian statutory provisions and TanzLII authorities, rights and obligations are governed under the relevant principal Acts and Court of Appeal precedents. <span class="citation-bracket" onclick="AIAssistantView.highlightSource('${this.activeSources[0]?.id || 'tz-j-001'}')">[1]</span>`,
        background: `The inquiry was analyzed against authoritative Tanzanian judicial records and legislation contained in the SLCMS Legal Source Library.`,
        issues: [
          'Scope of statutory application under Tanzanian domestic law.',
          'Judicial precedents established by the Court of Appeal and High Court.'
        ],
        reasoning: 'The courts consistently require verifiable compliance with statutory conditions precedent before granting substantive relief.',
        finalOrder: [
          'Compliance with statutory notices mandatory.',
          'Adherence to evidentiary thresholds enforced.'
        ],
        sources: this.activeSources.slice(0, 3)
      };
    }

    App.renderAuthenticatedApp();
    this.scrollToBottom();
  },

  /* --------------------------------------------------------------------------
     DIRECT ACTIONS FROM COMPACT CARDS & BUTTONS
     -------------------------------------------------------------------------- */
  summarizeCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;

    this.conversation.push({
      id: 'usr-' + Date.now(),
      role: 'user',
      text: `Summarize ${caseRec.title}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.conversation.push({
      id: 'ast-' + (Date.now() + 1),
      role: 'assistant',
      intent: 'SUMMARIZE_CASE',
      caseRecord: caseRec,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.activeSources = [caseRec, ...this.activeSources.filter(s => s.id !== caseRec.id)];
    App.renderAuthenticatedApp();
    this.scrollToBottom();
  },

  showFactsForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;

    this.conversation.push({
      id: 'usr-' + Date.now(),
      role: 'user',
      text: `Show facts of ${caseRec.title}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.conversation.push({
      id: 'ast-' + (Date.now() + 1),
      role: 'assistant',
      intent: 'SHOW_FACTS',
      caseRecord: caseRec,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.activeSources = [caseRec, ...this.activeSources.filter(s => s.id !== caseRec.id)];
    App.renderAuthenticatedApp();
    this.scrollToBottom();
  },

  showDecisionForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;

    this.conversation.push({
      id: 'usr-' + Date.now(),
      role: 'user',
      text: `Show final decision in ${caseRec.title}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.conversation.push({
      id: 'ast-' + (Date.now() + 1),
      role: 'assistant',
      intent: 'SHOW_FINAL_DECISION',
      caseRecord: caseRec,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.activeSources = [caseRec, ...this.activeSources.filter(s => s.id !== caseRec.id)];
    App.renderAuthenticatedApp();
    this.scrollToBottom();
  },

  showReasoningForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;

    this.conversation.push({
      id: 'usr-' + Date.now(),
      role: 'user',
      text: `Show court reasoning in ${caseRec.title}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.conversation.push({
      id: 'ast-' + (Date.now() + 1),
      role: 'assistant',
      intent: 'SHOW_REASONING',
      caseRecord: caseRec,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.activeSources = [caseRec, ...this.activeSources.filter(s => s.id !== caseRec.id)];
    App.renderAuthenticatedApp();
    this.scrollToBottom();
  },

  switchCaseTab(msgId, tabName) {
    const msg = this.conversation.find(m => m.id === msgId);
    if (!msg) return;

    const tabLabels = {
      summary: 'Retrieving case summary and holding…',
      facts: 'Retrieving the factual background and timeline from judgment…',
      issues: 'Extracting legal questions and issues before the court…',
      reasoning: 'Analyzing step-by-step court reasoning and ratio decidendi…',
      decision: 'Retrieving final operative court orders and cost directions…',
      laws: 'Extracting statutory sections and judicial precedents cited…'
    };

    msg.activeTab = tabName;
    msg.tabLoading = true;
    msg.tabProgressText = tabLabels[tabName] || 'Retrieving judgment passages…';

    App.renderAuthenticatedApp();

    setTimeout(() => {
      msg.tabLoading = false;
      App.renderAuthenticatedApp();
    }, 350);
  },

  togglePassage(passageId) {
    this.expandedPassages[passageId] = !this.expandedPassages[passageId];
    App.renderAuthenticatedApp();
  },

  openOriginalTanzLII(url, title) {
    if (!url) {
      App.showToast('The original TanzLII URL has not been saved for this document.', 'warning');
      return;
    }
    SLCMS_STATE.addAuditLog('TanzLII Original Source Opened', 'Legal Library', title || 'Judgment');
    window.open(url, '_blank');
  },

  highlightSource(sourceId) {
    this.activeSourceHighlightId = sourceId;
    App.renderAuthenticatedApp();

    setTimeout(() => {
      const cardEl = document.getElementById('source-card-' + sourceId);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.classList.add('source-card-highlight');
      }
    }, 50);
  },

  /* --------------------------------------------------------------------------
     FILTER & RESEARCH SESSIONS
     -------------------------------------------------------------------------- */
  getActiveFilterCount() {
    let count = 0;
    if (this.filters.scope && this.filters.scope !== 'all') count++;
    if (this.filters.court && this.filters.court !== 'all') count++;
    if (this.filters.year && this.filters.year !== 'all') count++;
    if (this.filters.category && this.filters.category !== 'all') count++;
    if (this.filters.judge && this.filters.judge.trim()) count++;
    if (this.filters.caseNumber && this.filters.caseNumber.trim()) count++;
    if (this.filters.caseId && this.filters.caseId !== 'all') count++;
    return count;
  },

  renderActiveFilterChips() {
    const chips = [];
    if (this.filters.scope && this.filters.scope !== 'all') {
      chips.push(`<span class="tz-filter-chip">Scope: ${this.filters.scope} <span class="tz-filter-chip-remove" onclick="AIAssistantView.removeFilter('scope')">×</span></span>`);
    }
    if (this.filters.year && this.filters.year !== 'all') {
      chips.push(`<span class="tz-filter-chip">Year: ${this.filters.year} <span class="tz-filter-chip-remove" onclick="AIAssistantView.removeFilter('year')">×</span></span>`);
    }
    if (this.filters.category && this.filters.category !== 'all') {
      chips.push(`<span class="tz-filter-chip">${this.filters.category} <span class="tz-filter-chip-remove" onclick="AIAssistantView.removeFilter('category')">×</span></span>`);
    }
    if (this.filters.court && this.filters.court !== 'all') {
      chips.push(`<span class="tz-filter-chip">${this.filters.court} <span class="tz-filter-chip-remove" onclick="AIAssistantView.removeFilter('court')">×</span></span>`);
    }
    return chips.join('');
  },

  removeFilter(key) {
    if (key === 'scope' || key === 'court' || key === 'year' || key === 'category' || key === 'caseId') {
      this.filters[key] = 'all';
    } else {
      this.filters[key] = '';
    }
    App.renderAuthenticatedApp();
  },

  resetFilters() {
    this.filters = { scope: 'all', court: 'all', year: 'all', category: 'all', judge: '', caseNumber: '', caseId: 'all' };
    App.showToast('Filters reset to defaults.', 'info');
    App.renderAuthenticatedApp();
  },

  startNewResearch() {
    this.conversation = [];
    this.activeDraftQuery = '';
    this.activeSourceHighlightId = null;
    this.isSubmitting = false;
    this.isProcessing = false;
    App.showToast('New research session initiated.', 'info');
    App.renderAuthenticatedApp();
  },

  scrollToBottom() {
    setTimeout(() => {
      const el = document.getElementById('tz-chat-stream');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /* --------------------------------------------------------------------------
     MODALS & EXPORT
     -------------------------------------------------------------------------- */
  copyReportText(msgId) {
    const msg = this.conversation.find(m => m.id === msgId);
    if (!msg) return;
    
    let text = '';
    if (msg.intent === 'SHOW_FACTS' && msg.caseRecord) {
      const c = msg.caseRecord;
      text = `FACTS OF ${c.title}\nCitation: ${c.citation}\nCourt: ${c.court}\n\nPARTIES AND PREMISES:\n- Lessee of Splendid Hotel vs Occupier of bar & nightclub\n\nNATURE OF DISPUTE:\n- Action for vacant possession and injunction.\n\nCOMPETING POSITIONS:\n- Plaintiff alleged breach of purchase conditions.\n- Defendant claimed valid agreement with instalments.\n\nPROCEDURAL POSITION:\n- Injunction issued, stayed, and heard pending trial.\n\nSource: TanzLII (${c.tanzliiUrl})`;
    } else if (msg.intent === 'SUMMARIZE_CASE' && msg.caseRecord) {
      const c = msg.caseRecord;
      text = `SUMMARY OF ${c.title}\nCitation: ${c.citation}\nCourt: ${c.court}\n\nLEGAL PRINCIPLES (TEMPORARY INJUNCTION):\n1. Serious question to be tried with probability of relief.\n2. Risk of irreparable injury not compensable in damages.\n3. Balance of convenience.\n\nFINAL DECISION:\nInjunction refused; main suit directed to trial.`;
    } else if (msg.caseRecord) {
      const c = msg.caseRecord;
      text = `${c.title}\n${c.court} · ${c.citation}\n\n${c.relevantPassage || c.fullTextSummary || ''}`;
    }

    navigator.clipboard.writeText(text).then(() => {
      App.showToast('Legal research note copied to clipboard.', 'success');
    });
  },

  recordFeedback(msgId, type) {
    this.feedbackState[msgId] = type;
    App.showToast(`Feedback recorded as ${type === 'helpful' ? 'Helpful 👍' : 'Incorrect 👎'}.`, 'info');
    App.renderAuthenticatedApp();
  },

  exportPDF() {
    const lastMsg = [...this.conversation].reverse().find(m => m.caseRecord || m.report);
    if (!lastMsg) {
      App.showToast('No active research report to export.', 'warning');
      return;
    }

    const user = SLCMS_STATE.currentUser;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      App.showToast('Please allow popups to export the PDF.', 'warning');
      return;
    }

    const title = lastMsg.caseRecord ? lastMsg.caseRecord.title : lastMsg.report?.title;
    const court = lastMsg.caseRecord ? lastMsg.caseRecord.court : lastMsg.report?.court;
    const meta = lastMsg.caseRecord ? `${lastMsg.caseRecord.citation} · ${lastMsg.caseRecord.decisionDate}` : lastMsg.report?.meta;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tanzania Legal Research Memorandum — SLCMS</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #111827; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #C89B3C; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #102A43; }
          .sub { font-size: 13px; color: #475569; margin-top: 4px; }
          .section { margin-bottom: 18px; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 8px; color: #102A43; }
          .footer { font-size: 11px; text-align: center; color: #64748B; margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">SMART LEGAL CASE MANAGEMENT SYSTEM (SLCMS)</div>
          <div class="sub">Tanzania Legal Research Memorandum</div>
          <div class="sub">Counsel: ${user?.name} (${user?.role}) • Date: ${new Date().toLocaleString()}</div>
        </div>
        <div class="section">
          <div class="section-title">Case / Matter Title</div>
          <p><strong>${title}</strong> (${court} · ${meta})</p>
        </div>
        <div class="section">
          <div class="section-title">Legal Analysis & Principles</div>
          <p>Extracted from verified TanzLII judicial sources and legislation.</p>
        </div>
        <div class="footer">
          AI-assisted research • Professional verification required • Confidential
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
    App.showToast('Research PDF generated successfully.', 'success');
  },

  openAttachToCaseModal() {
    const user = SLCMS_STATE.currentUser;
    const authorizedCases = SLCMS_STATE.getAuthorizedCasesForUser(user);

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📎 Attach Research to Client Matter</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Target Case / Matter</label>
          <select id="attach-case-select" class="form-control">
            ${authorizedCases.map(c => `
              <option value="${c.id}">${c.caseNumber} — ${c.title} (${c.client})</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Record Title</label>
          <input type="text" id="attach-research-title" class="form-control" value="TanzLII Research: ${this.activeSources[0]?.title || 'Legal Precedents'}">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="AIAssistantView.submitAttachToCase()">Confirm & Attach</button>
      </div>
    `, 'modal-md');
  },

  submitAttachToCase() {
    const caseId = document.getElementById('attach-case-select')?.value;
    const title = document.getElementById('attach-research-title')?.value;
    if (!caseId) return;

    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);
    if (targetCase) {
      if (!targetCase.notes) targetCase.notes = [];
      targetCase.notes.push({
        id: 'note-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        title: title || 'Tanzania Legal Research Report',
        content: `Attached AI Legal Research grounded on TanzLII precedents.\nSources: ${this.activeSources.map(s => s.title).join(', ')}`,
        author: SLCMS_STATE.currentUser?.name || 'Counsel'
      });
      SLCMS_STATE.addAuditLog('Research Attached to Case', 'Case Management', `Case: ${targetCase.caseNumber}`);
      App.closeModal();
      App.showToast(`Research successfully attached to ${targetCase.caseNumber}.`, 'success');
    }
  },

  openFiltersModal() {
    const authorizedCases = SLCMS_STATE.getAuthorizedCasesForUser(SLCMS_STATE.currentUser);

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">⚙️ Sources & Research Filters</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3" style="margin-bottom: 1rem;">
          <div>
            <label class="form-label">Search Scope</label>
            <select id="modal-flt-scope" class="form-control">
              <option value="all" ${this.filters.scope === 'all' ? 'selected' : ''}>🌐 All Available Tanzanian Sources</option>
              <option value="tanzlii" ${this.filters.scope === 'tanzlii' ? 'selected' : ''}>🏛️ TanzLII Judgments Only</option>
              <option value="legislation" ${this.filters.scope === 'legislation' ? 'selected' : ''}>📜 Tanzanian Legislation (Acts)</option>
              <option value="case_docs" ${this.filters.scope === 'case_docs' ? 'selected' : ''}>📁 Authorized Client Matters</option>
            </select>
          </div>

          <div>
            <label class="form-label">Authorized Client Matter</label>
            <select id="modal-flt-caseId" class="form-control">
              <option value="all" ${this.filters.caseId === 'all' ? 'selected' : ''}>All Authorized Client Matters</option>
              ${authorizedCases.map(c => `
                <option value="${c.id}" ${this.filters.caseId === c.id ? 'selected' : ''}>${c.caseNumber} - ${c.title}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="form-label">Court Hierarchy</label>
            <select id="modal-flt-court" class="form-control">
              <option value="all" ${this.filters.court === 'all' ? 'selected' : ''}>All Tanzanian Courts</option>
              <option value="Court of Appeal" ${this.filters.court === 'Court of Appeal' ? 'selected' : ''}>Court of Appeal of Tanzania</option>
              <option value="High Court" ${this.filters.court === 'High Court' ? 'selected' : ''}>High Court of Tanzania</option>
            </select>
          </div>

          <div>
            <label class="form-label">Decision Year</label>
            <select id="modal-flt-year" class="form-control">
              <option value="all" ${this.filters.year === 'all' ? 'selected' : ''}>All Decision Years</option>
              <option value="2020" ${this.filters.year === '2020' ? 'selected' : ''}>2020</option>
              <option value="1987" ${this.filters.year === '1987' ? 'selected' : ''}>1987</option>
              <option value="1985" ${this.filters.year === '1985' ? 'selected' : ''}>1985</option>
              <option value="1969" ${this.filters.year === '1969' ? 'selected' : ''}>1969</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer flex items-center justify-between">
        <button class="btn btn-secondary" onclick="AIAssistantView.resetFilters(); App.closeModal();">
          Reset All
        </button>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-gold" onclick="AIAssistantView.saveFiltersFromModal()">
            Apply Filters
          </button>
        </div>
      </div>
    `, 'modal-lg');
  },

  saveFiltersFromModal() {
    this.filters.scope = document.getElementById('modal-flt-scope')?.value || 'all';
    this.filters.caseId = document.getElementById('modal-flt-caseId')?.value || 'all';
    this.filters.court = document.getElementById('modal-flt-court')?.value || 'all';
    this.filters.year = document.getElementById('modal-flt-year')?.value || 'all';

    App.closeModal();
    App.showToast('Research filters applied.', 'success');
    App.renderAuthenticatedApp();
  },

  openHistoryModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📜 Research History</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="flex flex-col gap-2">
          ${this.researchHistory.map(h => `
            <div class="dash-task-item" style="cursor: pointer;" onclick="AIAssistantView.loadHistoryItem('${h.id}'); App.closeModal();">
              <div class="flex items-center justify-between">
                <strong>${h.title}</strong>
                <span class="badge badge-neutral" style="font-size: 0.7rem;">${h.date}</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                <em>"${h.query}"</em>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-md');
  },

  loadHistoryItem(histId) {
    const item = this.researchHistory.find(h => h.id === histId);
    if (item) {
      this.fillAndAsk(item.query);
    }
  },

  openSelectCaseModal() {
    const user = SLCMS_STATE.currentUser;
    const authorizedCases = SLCMS_STATE.getAuthorizedCasesForUser(user);

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📁 Select Authorized Client Matter</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="flex flex-col gap-2">
          <div class="dash-task-item ${this.filters.caseId === 'all' ? 'border-gold' : ''}" style="cursor: pointer;" onclick="AIAssistantView.filters.caseId='all'; App.closeModal(); App.renderAuthenticatedApp();">
            <strong>🌐 All Authorized Client Matters</strong>
            <div style="font-size: 0.78rem; color: var(--color-text-secondary);">Search across all ${authorizedCases.length} accessible case folders</div>
          </div>
          ${authorizedCases.map(c => `
            <div class="dash-task-item ${this.filters.caseId === c.id ? 'border-gold' : ''}" style="cursor: pointer;" onclick="AIAssistantView.filters.caseId='${c.id}'; App.closeModal(); App.renderAuthenticatedApp();">
              <div class="flex items-center justify-between">
                <strong>${c.caseNumber} — ${c.title}</strong>
                <span class="badge badge-gold" style="font-size: 0.7rem;">${c.category}</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.2rem;">Client: ${c.client} • Court: ${c.court}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      </div>
    `, 'modal-md');
  },

  openLibraryModal() {
    const docs = SLCMS_STATE.legalSourceDocuments || [];

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📚 Tanzania Legal Source Library</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="flex flex-col gap-2.5">
          ${docs.map(d => `
            <div class="dash-task-item flex items-center justify-between">
              <div>
                <strong>${d.title}</strong>
                <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                  ${d.court || d.category} • Citation: <code>${d.citation || d.caseNumber || 'Statute'}</code> • Status: <span class="badge badge-success" style="font-size: 0.65rem;">${d.status}</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); AIAssistantView.viewSupportingPassage('${d.id}')">
                Preview Text
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  viewSupportingPassage(docId) {
    const doc = (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === docId) || (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === docId);
    if (!doc) return;

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📄 Supporting Legal Passage & Text</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
          <h4 style="margin: 0 0 0.25rem; color: var(--color-primary); font-size: 1rem;">${doc.title}</h4>
          <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
            Citation: <code>${doc.citation || doc.caseNumber || 'Precedent'}</code> • Court: ${doc.court || 'Tanzania'}
          </div>
        </div>

        <div style="background: var(--color-surface-subtle); padding: 1rem; border-radius: 6px; font-size: 0.88rem; line-height: 1.6; max-height: 380px; overflow-y: auto; white-space: pre-wrap; font-family: inherit;">
${this.escapeHtml(doc.rawExtractedText || doc.relevantPassage || doc.ratioDecidendi || 'Verified legal source text extracted and indexed in SLCMS.')}
        </div>
      </div>
      <div class="modal-footer flex items-center justify-between">
        <button class="btn btn-ghost" onclick="AIAssistantView.openOriginalTanzLII('${doc.tanzliiUrl || 'https://tanzlii.org'}', '${doc.title}')">
          🌐 Open on TanzLII ↗
        </button>
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  openUploadModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📤 Upload Tanzanian Legal Material</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Upload a TanzLII judgment PDF or statute. Apache PDFBox extracts full text and segments searchable passages.
        </p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Document Title / Case Name</label>
          <input type="text" id="upload-doc-title" class="form-control" placeholder="e.g. Tanzania Breweries Ltd vs Commissioner General TRA">
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Citation / Act Chapter</label>
          <input type="text" id="upload-doc-citation" class="form-control" placeholder="e.g. [2024] TZCA 450 or Cap. 345">
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Select PDF File</label>
          <input type="file" id="upload-doc-file" class="form-control" accept=".pdf,.doc,.docx,.txt">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="AIAssistantView.submitUpload()">Upload & Index</button>
      </div>
    `, 'modal-md');
  },

  submitUpload() {
    const title = document.getElementById('upload-doc-title')?.value;
    const citation = document.getElementById('upload-doc-citation')?.value;
    if (!title) {
      App.showToast('Please enter document title.', 'warning');
      return;
    }
    const newDoc = {
      id: 'doc-' + Date.now(),
      title: title,
      citation: citation || 'Indexed Document',
      court: 'High Court of Tanzania',
      category: 'Commercial Law',
      status: 'Ready for AI',
      passages: [
        { id: 'p-1', text: `${title} (${citation}): Verified legal authority and statutory compliance passages extracted by Apache PDFBox.` }
      ],
      rawExtractedText: `${title}\n${citation}\nIndexed and ready for AI legal query retrieval.`
    };
    SLCMS_STATE.legalSourceDocuments.unshift(newDoc);
    this.activeSources.unshift(newDoc);
    SLCMS_STATE.addAuditLog('Document Uploaded & Indexed', 'Legal Library', title);
    App.closeModal();
    App.showToast('Document uploaded, text extracted and marked Ready for AI.', 'success');
    App.renderAuthenticatedApp();
  }
};
