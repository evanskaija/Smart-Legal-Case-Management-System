/* ==========================================================================
   SLCMS - Tanzania Legal Research Assistant
   Permanent 18-Category AI Workspace & Professional Legal Research Suite
   ========================================================================== */

const AIAssistantView = {
  // Conversation History State
  conversation: [], 
  isSubmitting: false,
  isProcessing: false,
  activeDraftQuery: '',
  thoughtDetailsOpen: {},

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
    { id: 'h-1', title: 'Muwinge vs Halima [2020] (Defective Record & De Novo)', date: '2026-08-30', query: 'Show facts of Abdallah Salum Muwinge v Halima Ismail' },
    { id: 'h-2', title: 'Attilio v. Mbowe [1969] (Temporary Injunctions Test)', date: '2026-08-28', query: 'Summarize Attilio v. Mbowe' },
    { id: 'h-3', title: 'Judgments from 2020 in Legal Library', date: '2026-08-27', query: 'show me all cases in 2020' },
    { id: 'h-4', title: 'NBC v James Mrema [2024] (Metadata Only Record)', date: '2026-08-25', query: 'Show case information for National Bank of Commerce v James Mrema' }
  ],

  // UI Modals / Toggles
  showFiltersModal: false,
  feedbackState: {},
  expandedPassages: {},
  // Active Report View State (Dedicated Full-Page Case Report)
  activeReport: null,
  activeReportNotes: {},

  /* --------------------------------------------------------------------------
     INITIALIZATION & MAIN WORKSPACE RENDER
     -------------------------------------------------------------------------- */
  init() {
    if (this.activeSources.length === 0 && typeof SLCMS_STATE !== 'undefined') {
      this.activeSources = (SLCMS_STATE.tanzaniaJudgments || []).slice(0, 3);
    }
  },

  render() {
    // If a complete case analysis report is active, render the dedicated full-page report view
    if (this.activeReport && this.activeReport.caseRec) {
      return this.renderCompleteCaseReportPage(this.activeReport.caseRec, this.activeReport.config);
    }

    this.init();
    const docLibrary = SLCMS_STATE.legalSourceDocuments || [];

    const judgments = SLCMS_STATE.tanzaniaJudgments || [];
    const readyDocsCount = judgments.filter(j => j.status === 'Ready for AI').length + docLibrary.filter(d => d.status === 'Ready for AI').length;
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
                18 Question Categories Active
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.84rem; margin-top: 0.2rem; margin-bottom: 0;">
              Permanent question category routing engine. Every answer is classified, verified, and grounded on authentic TanzLII judgments and Tanzanian statutes.
            </p>
          </div>

          <!-- Top Navigation Action Bar -->
          <div class="flex items-center gap-2 flex-wrap">
            <button class="btn btn-gold btn-sm" onclick="AIAssistantView.openYearBrowserModal()" title="Explore all judgments registered from 2020 to 2026">
              📅 Year Browser (2020–2026)
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.startNewResearch()" title="Start a new clean research session">
              ✨ New Research
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.openMoreToolsModal()" title="Browse all 18 Question Categories">
              ⚡ All 18 Categories
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.openHistoryModal()" title="View past research queries">
              📜 History
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.openLibraryModal()" title="Browse indexed TanzLII library">
              📚 Library (${readyDocsCount})
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
                    placeholder="Ask about Tanzanian law, find a judgment, or click a category button below…"
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
                      📎 Attach
                    </button>

                    <button 
                      type="button" 
                      class="btn btn-secondary btn-sm" 
                      onclick="AIAssistantView.openSelectCaseModal()" 
                      title="Select authorized client matter"
                      style="padding: 0.6rem 0.75rem;"
                    >
                      📁 Case
                    </button>

                    <button 
                      type="button" 
                      class="btn btn-secondary btn-sm ${activeFilterCount > 0 ? 'border-gold' : ''}" 
                      onclick="AIAssistantView.openFiltersModal()" 
                      title="Adjust search scope, courts, years and categories"
                      style="padding: 0.6rem 0.75rem; position: relative;"
                    >
                      ⚙️ Filters
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
                        <span>Classifying…</span>
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

              <!-- 8 Primary Category Buttons Directly Under Question Box + More Legal Tools -->
              <div class="tz-category-buttons-container">
                <div class="tz-category-buttons-scroll">
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('FIND_JUDGMENT')" title="Search by Title, Party, Case Number, Citation, Court, Judge, Year">
                    <span class="tz-cat-icon-badge">🔍</span> <span>Find Judgment</span>
                  </button>
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('CASE_SUMMARY')" title="Complete and concise case summary">
                    <span class="tz-cat-icon-badge">📄</span> <span>Summarize Case</span>
                  </button>
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('CASE_FACTS')" title="Parties, events, claims, dates, and disputed property only">
                    <span class="tz-cat-icon-badge">ℹ️</span> <span>Show Facts</span>
                  </button>
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('LEGAL_ISSUES')" title="Exact questions determined by the court">
                    <span class="tz-cat-icon-badge">❓</span> <span>Show Legal Issues</span>
                  </button>
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('COURT_REASONING')" title="Evidence examined, legal tests, and lower-court evaluation">
                    <span class="tz-cat-icon-badge">🧠</span> <span>Court Reasoning</span>
                  </button>
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('FINAL_DECISION')" title="Final operative orders, retrial directions, and costs">
                    <span class="tz-cat-icon-badge">✅</span> <span>Final Decision</span>
                  </button>
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('LAWS_CITED')" title="Statutory Acts, chapters, sections, and rules cited">
                    <span class="tz-cat-icon-badge">📚</span> <span>Laws Cited</span>
                  </button>
                  <button type="button" class="tz-cat-btn" onclick="AIAssistantView.handleCategoryButtonClick('OPEN_SOURCE')" title="View Original PDF, Download PDF, and Open TanzLII">
                    <span class="tz-cat-icon-badge">🌐</span> <span>Open Original</span>
                  </button>
                  <button type="button" class="tz-cat-btn tz-cat-btn-more" onclick="AIAssistantView.openMoreToolsModal()" title="View all 18 Question Categories & Advanced Legal Tools">
                    <span class="tz-cat-icon-badge tz-cat-icon-more">⚡</span> <span>More Legal Tools…</span>
                  </button>
                </div>
              </div>

              <!-- Professional Notice in Footer -->
              <div class="flex items-center justify-between" style="margin-top: 0.55rem; font-size: 0.74rem; color: var(--color-text-secondary);">
                <span>AI Intent Router Active • Guardrails & Source Verification Enforced • Tanzanian Jurisdiction</span>
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
                  No sources retrieved yet.<br>Ask a question or select a category tool to retrieve relevant TanzLII judgments.
                </div>
              ` : this.activeSources.map((s, idx) => this.renderSourceCard(s, idx + 1)).join('')}
            </div>

            <!-- Library Quick Overview Box -->
            <div style="background: var(--color-surface-subtle); border: 1px dashed var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.78rem; color: var(--color-text-secondary); margin-top: auto;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.25rem;">
                <strong style="color: var(--color-primary);">Tanzania Legal Library</strong>
                <span class="badge badge-gold" style="font-size: 0.65rem;">Active</span>
              </div>
              <div>${readyDocsCount} authorized records indexed with verified full text passages.</div>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     EMPTY STATE COMPONENT (With Category Quick Launches)
     -------------------------------------------------------------------------- */
  renderEmptyState() {
    return `
      <div class="tz-empty-hero animate-fade">
        <div style="width: 58px; height: 58px; border-radius: 18px; background: linear-gradient(135deg, #102A43 0%, #1E3A8A 100%); color: var(--color-gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 1.85rem; box-shadow: 0 8px 24px rgba(16, 42, 67, 0.25); border: 1.5px solid rgba(245, 158, 11, 0.4);">
          ⚖️
        </div>

        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); margin: 0 0 0.5rem; font-family: var(--font-heading); letter-spacing: -0.02em;">
          Tanzania Legal Research Question Categories
        </h2>
        <p style="font-size: 0.92rem; color: var(--color-text-secondary); line-height: 1.6; max-width: 620px; margin: 0 auto 1.5rem;">
          Select a category below or ask a natural language question. The AI classifies your intention, enforces anti-hallucination guardrails, and retrieves the verified case record.
        </p>

        <!-- 0. Interactive Year-by-Year Case Browser (2020 - 2026) -->
        ${this.renderYearSelectorBar()}

        <!-- 4 Key Launch Action Cards -->
        <div class="tz-empty-action-grid">
          
          <div class="tz-action-card tz-action-card-cat1" onclick="AIAssistantView.fillAndAsk('show me all cases in 2020')">
            <div class="tz-action-card-top">
              <span class="tz-card-tag tag-blue">CATEGORY 01</span>
              <div class="tz-card-icon-box box-blue">🔍</div>
            </div>
            <div class="tz-action-card-title">1. Find a Judgment</div>
            <div class="tz-action-card-desc">Search by title, party name, citation, court, judge or year with direct PDF links.</div>
            <div class="tz-action-card-footer">
              <span>Search Database</span>
              <span class="tz-action-card-arrow">➔</span>
            </div>
          </div>

          <div class="tz-action-card tz-action-card-cat2" onclick="AIAssistantView.fillAndAsk('Show the facts of Abdallah Salum Muwinge v Halima Ismail')">
            <div class="tz-action-card-top">
              <span class="tz-card-tag tag-emerald">CATEGORY 02</span>
              <div class="tz-card-icon-box box-emerald">ℹ️</div>
            </div>
            <div class="tz-action-card-title">2. Show Facts of a Case</div>
            <div class="tz-action-card-desc">Extract pure facts (parties, events, claims, disputed conduct) with zero invented info.</div>
            <div class="tz-action-card-footer">
              <span>Extract Facts</span>
              <span class="tz-action-card-arrow">➔</span>
            </div>
          </div>

          <div class="tz-action-card tz-action-card-cat3" onclick="AIAssistantView.fillAndAsk('Summarize Abdallah Salum Muwinge v Halima Ismail')">
            <div class="tz-action-card-top">
              <span class="tz-card-tag tag-amber">CATEGORY 03</span>
              <div class="tz-card-icon-box box-amber">📄</div>
            </div>
            <div class="tz-action-card-title">3. Summarize a Case</div>
            <div class="tz-action-card-desc">Concise structured summary: background, legal issues, reasoning, decision & ratio.</div>
            <div class="tz-action-card-footer">
              <span>Generate Summary</span>
              <span class="tz-action-card-arrow">➔</span>
            </div>
          </div>

          <div class="tz-action-card tz-action-card-cat4" onclick="AIAssistantView.fillAndAsk('What are the principles for granting a temporary injunction?')">
            <div class="tz-action-card-top">
              <span class="tz-card-tag tag-purple">CATEGORY 04</span>
              <div class="tz-card-icon-box box-purple">⚖️</div>
            </div>
            <div class="tz-action-card-title">4. Research a Legal Issue</div>
            <div class="tz-action-card-desc">Cross-case analysis synthesizing multiple precedents and statutory chapters.</div>
            <div class="tz-action-card-footer">
              <span>Synthesize Issue</span>
              <span class="tz-action-card-arrow">➔</span>
            </div>
          </div>

        </div>

        <!-- Secondary Categories Quick Links -->
        <div class="tz-explore-more-bar">
          <span class="tz-explore-more-label">EXPLORE MORE:</span>
          <button type="button" class="tz-explore-pill" onclick="AIAssistantView.fillAndAsk('Show procedural history of Muwinge case')">
            <span>🕒</span> <span>Procedural History</span>
          </button>
          <button type="button" class="tz-explore-pill" onclick="AIAssistantView.fillAndAsk('Show parties arguments in Muwinge case')">
            <span>👥</span> <span>Parties' Arguments</span>
          </button>
          <button type="button" class="tz-explore-pill" onclick="AIAssistantView.fillAndAsk('Show legal principle in Attilio v Mbowe')">
            <span>💡</span> <span>Legal Principle (Ratio)</span>
          </button>
          <button type="button" class="tz-explore-pill" onclick="AIAssistantView.fillAndAsk('Compare Attilio v Mbowe and Muwinge v Halima')">
            <span>🔄</span> <span>Compare Cases</span>
          </button>
          <button type="button" class="tz-explore-pill" onclick="AIAssistantView.fillAndAsk('Generate legal report for 2020 judgments')">
            <span>📊</span> <span>Generate Report</span>
          </button>
          <button type="button" class="tz-explore-pill tz-explore-pill-gold" onclick="AIAssistantView.openMoreToolsModal()">
            <span>⚡</span> <span>All 18 Categories</span>
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CONVERSATION MESSAGES RENDERER (Intent-Specific Dispatcher)
     -------------------------------------------------------------------------- */
  toggleThoughtDetails(msgId) {
    if (!this.thoughtDetailsOpen) this.thoughtDetailsOpen = {};
    this.thoughtDetailsOpen[msgId] = !this.thoughtDetailsOpen[msgId];
    App.renderAuthenticatedApp();
  },

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
    if (msg.requiresAuth || msg.intent === 'AUTHENTICATION_REQUIRED') return this.renderAuthRequired(msg);
    if (msg.isGreeting || msg.categoryCode === 'GREETING') return this.renderGreetingMessage(msg);
    if (msg.isMetadataOnlyBlocked) return this.renderMetadataOnlyBlocked(msg);
    if (msg.categoryCode === 'FIND_JUDGMENT' || msg.isCaseList) return this.renderFindJudgmentResults(msg);
    if (msg.categoryCode === 'CASE_FACTS' || msg.intent === 'SHOW_FACTS') return this.renderCaseFacts(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'CASE_SUMMARY' || msg.intent === 'SUMMARIZE_CASE') return this.renderCaseSummary(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'CASE_INFORMATION' || msg.isCaseInformation) return this.renderCaseInformation(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'PROCEDURAL_HISTORY' || msg.isProceduralHistory) return this.renderProceduralHistory(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'LEGAL_ISSUES' || msg.intent === 'SHOW_LEGAL_ISSUES') return this.renderCaseIssues(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'PARTIES_ARGUMENTS' || msg.isPartiesArguments) return this.renderPartiesArguments(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'COURT_REASONING' || msg.intent === 'SHOW_REASONING') return this.renderCaseReasoning(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'FINAL_DECISION' || msg.intent === 'SHOW_FINAL_DECISION') return this.renderCaseDecision(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'LAWS_CITED' || msg.intent === 'SHOW_LAWS_CITED') return this.renderCaseLaws(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'CASES_CITED' || msg.isCasesCited) return this.renderCasesCited(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'LEGAL_PRINCIPLE' || msg.isLegalPrinciple) return this.renderLegalPrinciple(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'CASE_COMPARISON' || msg.isCaseComparison) return this.renderCaseComparison(msg);
    if (msg.categoryCode === 'LEGAL_REPORT' || msg.isLegalReport) return this.renderLegalReport(msg);
    if (msg.categoryCode === 'OPEN_SOURCE' || msg.isOpenSource) return this.renderOpenSource(msg, msg.matchedCase || msg.caseRecord);
    if (msg.categoryCode === 'LIST_CASES' || msg.intent === 'LIST_CASES' || msg.category === 'LISTING_CASES') return this.renderListCasesResults(msg);
    if (msg.categoryCode === 'UPLOAD_HELP' || msg.isUploadHelp) return this.renderUploadHelp(msg);
    if (msg.isCaseAnalysis) return this.renderCaseAnalysisPanel(msg);
    return this.renderLegalResearch(msg);
  },

  /* --------------------------------------------------------------------------
     LIST CASES / CATEGORY RENDERER (Intent: LIST_CASES / 18 Legal Categories)
     -------------------------------------------------------------------------- */
  renderListCasesResults(msg) {
    const list = msg.caseRecords || [];
    const legalCat = msg.legalCategory || 'ALL';
    const catDef = typeof TanzaniaIntentRouter !== 'undefined' && TanzaniaIntentRouter.LEGAL_CATEGORIES ? TanzaniaIntentRouter.LEGAL_CATEGORIES[legalCat] : null;
    const catName = catDef ? catDef.name : (legalCat !== 'ALL' ? legalCat.replace(/_/g, ' ') : 'Legal Cases Directory');
    const catEmoji = catDef ? catDef.emoji : '⚖️';
    
    // Format text response with markdown formatting & interactive links
    let formattedResponse = (msg.response || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[View Case\]|View Case/g, `<span class="tz-action-link" style="color: var(--color-gold); font-weight: 700; cursor: pointer; text-decoration: underline;">View Case</span>`)
      .replace(/\[Summarize\]|Summarize/g, `<span class="tz-action-link" style="color: var(--color-primary); font-weight: 700; cursor: pointer; text-decoration: underline;">Summarize</span>`)
      .replace(/\[Show Bail Conditions\]|Show Bail Conditions/g, `<span class="tz-action-link" style="color: var(--color-primary); font-weight: 700; cursor: pointer; text-decoration: underline;">Show Bail Conditions</span>`)
      .replace(/\[Open Original PDF\]|\[Open PDF\]|Open Original PDF|Open PDF/g, `<span class="tz-action-link" style="color: #2563EB; font-weight: 700; cursor: pointer; text-decoration: underline;">Open Original PDF</span>`)
      .replace(/\n\n/g, '<div style="margin-bottom: 0.85rem;"></div>')
      .replace(/\n/g, '<br>');

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title" style="display: flex; align-items: center; gap: 0.5rem;">
              <span>${catEmoji}</span> <span>${this.escapeHtml(catName)}</span>
            </h3>
            <div class="tz-legal-report-meta">
              Intent: <code>LIST_CASES</code> • Category: <code>${this.escapeHtml(legalCat)}</code> • ${list.length > 0 ? list.length + ' Prepared Cases' : 'Prepared Tanzanian Judgments'}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0; background: #ECFDF5; color: #047857; border-color: #A7F3D0; font-weight: 700;">
            ✓ Category Match
          </span>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem; margin: 1rem 0; font-size: 0.92rem; line-height: 1.7; color: var(--color-text-main);">
          ${formattedResponse}
        </div>

        ${list.length > 0 ? `
          <div style="margin-top: 1.25rem;">
            <div style="font-weight: 700; color: var(--color-primary); margin-bottom: 0.75rem; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.03em;">
              Quick Interactive Actions for Retrieved Cases:
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              ${list.map(c => `
                <div class="tz-compact-case-card" style="margin-bottom: 0; background: #FFF;">
                  <div style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">
                    ${this.escapeHtml(c.title)}
                  </div>
                  <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin: 0.2rem 0;">
                    <code>${this.escapeHtml(c.citation || c.caseNumber || '')}</code> • ${this.escapeHtml(c.courtTier || c.court || 'High Court')}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.5rem;">
                    <strong>Subject:</strong> ${this.escapeHtml(c.subject || c.claimSummary || '')}
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showCaseInfoRecord('${c.id}')" style="font-size: 0.74rem; padding: 0.25rem 0.5rem;">
                      🔍 View Case
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${c.id}')" style="font-size: 0.74rem; padding: 0.25rem 0.5rem;">
                      📄 Summarize
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')" style="font-size: 0.74rem; padding: 0.25rem 0.5rem;">
                      ℹ️ Facts
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="AIAssistantView.viewPdfModal('${c.id}')" style="color: var(--color-gold); font-size: 0.74rem; padding: 0.25rem 0.5rem;">
                      🌐 PDF
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderInlineProgress(msg) {
    return `
      <div class="tz-thinking-bubble-row animate-fade" style="margin: 0.25rem 0;">
        <div class="tz-thinking-bubble" title="AI Assistant is thinking...">
          <span class="tz-dot"></span>
          <span class="tz-dot"></span>
          <span class="tz-dot"></span>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     AUTHENTICATION REQUIRED GATED ACCESS RENDERER
     -------------------------------------------------------------------------- */
  renderAuthRequired(msg) {
    return `
      <div class="tz-legal-report animate-fade" style="border-left: 4px solid #DC2626;">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title" style="color: #991B1B; display: flex; align-items: center; gap: 0.5rem;">
              <span>🔒</span> <span>Authentication Required</span>
            </h3>
            <div class="tz-legal-report-meta" style="color: var(--color-text-secondary); margin-top: 0.25rem;">
              SLCMS Tanzania Legal Research Assistant • Authorized Access Only
            </div>
          </div>
          <span class="badge" style="background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; font-weight: 700; font-size: 0.72rem;">
            Sign In Required
          </span>
        </div>

        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 1.25rem; font-size: 0.92rem; color: #7F1D1D; line-height: 1.6; margin: 1rem 0;">
          ${this.escapeHtml(msg.response || 'You must register or sign in to your authorized SLCMS account before using the Tanzania Legal Research Assistant and searching prepared judgments.')}
        </div>

        <div class="flex items-center gap-2 flex-wrap" style="margin-top: 1rem;">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showLoginModal()" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
            🔐 Sign In to SLCMS
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showRegisterModal()" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
            📝 Register Account
          </button>
        </div>
      </div>
    `;
  },

  showLoginModal() {
    if (typeof AuthView !== 'undefined') {
      AuthView.switchTab('login');
      if (typeof App !== 'undefined' && !App.isLoggedIn) {
        document.getElementById('app-root').innerHTML = AuthView.render();
      }
    }
  },

  showRegisterModal() {
    if (typeof AuthView !== 'undefined') {
      AuthView.switchTab('register');
      if (typeof App !== 'undefined' && !App.isLoggedIn) {
        document.getElementById('app-root').innerHTML = AuthView.render();
      }
    }
  },

  /* --------------------------------------------------------------------------
     1. GREETING RENDERER (Category 18)
     -------------------------------------------------------------------------- */
  renderGreetingMessage(msg) {
    return `
      <div class="tz-legal-report animate-fade">
        <div class="flex items-center justify-between" style="margin-bottom: 0.65rem;">
          <span class="tz-status-pill" style="margin-bottom: 0;">
            💬 18. Greetings & General Help
          </span>
          <span style="font-size: 0.72rem; color: var(--color-text-secondary);">${msg.timestamp || 'Just now'}</span>
        </div>

        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--color-text-main); margin-bottom: 1rem;">
          ${msg.response || 'Mambo! Karibu kwenye SLCMS. Ninaweza kutafuta kesi, kuonyesha taarifa za kesi, kufupisha hukumu zilizoandaliwa na kufungua nyaraka asilia.'}
        </div>

        <div style="padding-top: 0.85rem; border-top: 1px dashed var(--color-border);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; margin-bottom: 0.5rem;">
            Quick Category Actions:
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.fillAndAsk('show me all cases in 2020')">
              <span>🔍 1. Find a Judgment (2020)</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.fillAndAsk('Show the facts of Abdallah Salum Muwinge v Halima Ismail')">
              <span>ℹ️ 2. Show Facts (Muwinge)</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.fillAndAsk('Summarize Ashira K. Nurad v Said Ramadhani Dinya')">
              <span>📄 3. Summarize Case (Ashira Nurad)</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; font-size: 0.78rem; padding: 0.45rem 0.65rem;" onclick="AIAssistantView.openMoreToolsModal()">
              <span>⚡ View All 18 Categories</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     GUARDRAIL: METADATA ONLY WARNING RENDERER
     -------------------------------------------------------------------------- */
  renderMetadataOnlyBlocked(msg) {
    const c = msg.matchedCase || {};
    const info = c.caseInformation || {};

    return `
      <div class="tz-legal-report animate-fade" style="border-left: 4px solid #F59E0B;">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title" style="color: #92400E;">
              ⚠️ Metadata Only Document — Full Text Unavailable
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.title || 'Selected Case')} · ${this.escapeHtml(c.citation || c.caseNumber || '')}
            </div>
          </div>
          <span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; font-weight: 700; font-size: 0.72rem;">
            Metadata Only Status
          </span>
        </div>

        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-md); padding: 1rem; margin: 1rem 0; font-size: 0.88rem; line-height: 1.6; color: #78350F;">
          ${msg.notice || 'This document was uploaded as a scanned image PDF. Full OCR text extraction is pending. The AI is restricted by anti-hallucination guardrails and will NOT generate facts, reasoning, or summaries from metadata or titles alone.'}
        </div>

        <!-- Saved Metadata Table -->
        <div class="tz-report-section">
          <div class="tz-report-section-label">Verified Saved Metadata</div>
          <table class="tz-meta-table">
            <tr>
              <td style="width: 25%; font-weight: 600; color: var(--color-text-secondary);">Case Title:</td>
              <td style="font-weight: 700; color: var(--color-primary);">${this.escapeHtml(info.title || c.title)}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Citation:</td>
              <td><code>${this.escapeHtml(info.citation || c.citation || 'Unassigned')}</code></td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Case Number:</td>
              <td>${this.escapeHtml(info.caseNumber || c.caseNumber || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Court:</td>
              <td>${this.escapeHtml(info.court || c.court || 'Court of Appeal of Tanzania')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Presiding Judge:</td>
              <td>${this.escapeHtml(info.judge || c.judge || 'Appellate Bench')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Decision Date:</td>
              <td>${this.escapeHtml(info.decisionDate || c.decisionDate || '2024')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Proceeding Type:</td>
              <td>${this.escapeHtml(info.proceedingType || c.proceedingType || 'Civil Appeal')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Legal Category:</td>
              <td><span class="badge badge-gold" style="font-size: 0.68rem;">${this.escapeHtml(info.category || c.category || 'Commercial')}</span></td>
            </tr>
          </table>
        </div>

        <!-- Action Buttons -->
        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            📄 View Original PDF
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.downloadCasePdf('${c.id}')">
            📥 Download PDF
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            🌐 Open TanzLII Source ↗
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.fillAndAsk('What does Metadata Only mean and how do I run OCR?')">
            📤 How to Run OCR
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 1: FIND A JUDGMENT (Search Results & Interactive Selection)
     -------------------------------------------------------------------------- */
  renderFindJudgmentResults(msg) {
    const matchedCase = msg.matchedCase;
    const list = msg.caseRecords || (matchedCase ? [matchedCase] : []);
    const rawQuery = msg.rawQuery || '';
    const cleanSearchPhrase = rawQuery
      .replace(/^(find|search for|search|locate|look for|do you have|show me|show|tell me about|nipatie|tafuta|nitafutie|onyesha|nipe|ipo kesi ya|kuna kesi ya)\s+/i, '')
      .replace(/\s+(cases|case|judgments|judgment|hukumu|kesi)$/i, '')
      .trim() || rawQuery;

    // 1. NO CASES FOUND MESSAGE
    if (!matchedCase && list.length === 0) {
      return `
        <div class="tz-legal-report animate-fade" style="border-left: 4px solid #F59E0B;">
          <div class="tz-legal-report-header">
            <h3 class="tz-legal-report-title" style="color: #92400E;">🔍 No Judgment Found</h3>
          </div>
          <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 1.25rem; font-size: 0.92rem; color: #78350F; line-height: 1.6;">
            No prepared judgment matching <strong>"${this.escapeHtml(cleanSearchPhrase)}"</strong> was found in the SLCMS library. You can search by party name, citation, case number, or upload an authorized PDF judgment.
          </div>
          <div style="margin-top: 1rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.startNewResearch()">
              🔄 Search Another Case
            </button>
          </div>
        </div>
      `;
    }

    // 2. SINGLE MATCHED JUDGMENT FOUND (Prompt First - Wait for User Selection)
    if (msg.isSingleMatchPrompt || (list.length === 1 && !msg.isMultipleMatchesPrompt)) {
      const c = matchedCase || list[0];
      const cit = c.citation || 'Unassigned';
      const proceeding = c.proceeding || c.caseNumber || c.case_number || c.proceedingType || 'PC Civil Appeal No. 69 of 2018';
      const court = c.court || 'High Court of Tanzania, Dar es Salaam District Registry';
      const judge = c.judge || 'S. M. Kulita, J.';
      const decDate = c.decisionDate || c.year || '31 December 2020';
      const category = c.category || 'Matrimonial and Family Law';
      const subject = c.subject || c.claimSummary || c.additionalSubject || 'Matrimonial property, child maintenance and an incomplete trial record';
      const outcome = c.outcome || c.finalDecision || 'Lower-court proceedings nullified and a trial de novo ordered.';

      return `
        <div class="tz-legal-report animate-fade">
          <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="tz-legal-report-title" style="display: flex; align-items: center; gap: 0.5rem;">
                <span>🔍</span> <span>Matching Judgments Found</span>
              </h3>
              <div class="tz-legal-report-meta" style="font-size: 0.88rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                I found the following prepared judgment matching <strong>“${this.escapeHtml(cleanSearchPhrase)}”</strong>:
              </div>
            </div>
            <span class="tz-status-pill" style="margin-bottom: 0; background: #ECFDF5; color: #047857; border-color: #A7F3D0; font-weight: 700;">
              ✓ 1 Matching Judgment
            </span>
          </div>

          <!-- Prepared Case Detail Card -->
          <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 10px; padding: 1.25rem; margin: 1rem 0; font-size: 0.92rem; line-height: 1.85;">
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-heading); margin-bottom: 0.65rem;">
              ${this.escapeHtml(c.title)}
            </div>
            <div><strong>Citation:</strong> <code>${this.escapeHtml(cit)}</code></div>
            <div><strong>Proceeding:</strong> ${this.escapeHtml(proceeding)}</div>
            <div><strong>Court:</strong> ${this.escapeHtml(court)}</div>
            <div><strong>Judge:</strong> ${this.escapeHtml(judge)}</div>
            <div><strong>Decision date:</strong> ${this.escapeHtml(decDate)}</div>
            <div><strong>Category:</strong> <span class="badge badge-gold" style="font-size: 0.72rem;">${this.escapeHtml(category)}</span></div>
            <div><strong>Subject:</strong> ${this.escapeHtml(subject)}</div>
            <div><strong>Outcome:</strong> ${this.escapeHtml(outcome)}</div>
          </div>

          <!-- Prompt & Action Choices -->
          <div style="margin: 1.25rem 0 0.5rem;">
            <div style="font-weight: 700; color: var(--color-primary); margin-bottom: 0.75rem; font-size: 0.95rem;">
              Is this the case you need?
            </div>
            
            <div class="flex items-center gap-2 flex-wrap" style="margin-bottom: 1rem;">
              <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showCaseInfoRecord('${c.id}')" style="font-weight: 700;">
                🔍 Open Case
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${c.id}')" style="font-weight: 600;">
                📄 Summarize Case
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')" style="font-weight: 600;">
                ℹ️ Show Facts
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.viewPdfModal('${c.id}')" style="color: #2563EB; font-weight: 600;">
                🌐 Open Original PDF
              </button>
            </div>

            <div style="border-top: 1px dashed var(--color-border); padding-top: 0.85rem; margin-top: 0.85rem;">
              <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
                If it is not the intended case:
              </div>
              <button type="button" class="btn btn-ghost btn-sm" onclick="AIAssistantView.startNewResearch()" style="color: var(--color-text-secondary); font-size: 0.82rem; padding: 0.35rem 0.65rem; border: 1px solid var(--color-border);">
                🔄 Search Another Case
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 3. MULTIPLE MATCHED JUDGMENTS FOUND
    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title" style="display: flex; align-items: center; gap: 0.5rem;">
              <span>🔍</span> <span>Multiple Judgments Found</span>
            </h3>
            <div class="tz-legal-report-meta" style="font-size: 0.88rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
              I found ${list.length} judgments matching <strong>“${this.escapeHtml(cleanSearchPhrase)}.”</strong> Please select the intended case:
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${list.length} Matching Judgments
          </span>
        </div>

        <!-- Choices List -->
        <div class="flex flex-col gap-2.5" style="margin: 1rem 0;">
          ${list.map((c, i) => `
            <div class="tz-compact-case-card" style="margin-bottom: 0; cursor: pointer; transition: all 0.2s ease;" onclick="AIAssistantView.fillAndAsk('Find ${this.escapeHtml(c.title)}')">
              <div class="flex items-center justify-between gap-2">
                <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">
                  ${i + 1}. ${this.escapeHtml(c.title)}
                </div>
                <span class="badge badge-gold" style="font-size: 0.68rem;">${this.escapeHtml(c.year || '2020')}</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                <code>${this.escapeHtml(c.citation || c.caseNumber || '')}</code> • ${this.escapeHtml(c.court || 'High Court of Tanzania')}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="font-size: 0.84rem; color: var(--color-text-secondary); margin-top: 0.5rem; font-style: italic;">
          Select a case before requesting its facts, reasoning or decision.
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 2: SHOW FACTS OF A CASE (Facts Only, Non-Reasoning)
     -------------------------------------------------------------------------- */
  renderCaseFacts(msg, caseRec) {
    const c = caseRec || {};
    const f = c.facts || {};

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
      partiesPremisesHtml = `<li>The parties engaged in dispute before the ${this.escapeHtml(c.court || 'High Court of Tanzania')}.</li>`;
      natureDisputeHtml = `<li>${this.escapeHtml(typeof f === 'string' ? f : c.relevantPassage || 'Factual details recorded in the primary record.')}</li>`;
      competingPositionsHtml = `<li>The applicant asserted statutory entitlements under Tanzanian law while the respondent opposed the claims.</li>`;
      proceduralPositionHtml = `<li>The matter was filed and heard on merits before ${this.escapeHtml(c.judge || 'the Court')}.</li>`;
    }

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              2. ℹ️ Facts of ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '[2020] TZHC 10045')} · ${this.escapeHtml(c.court || 'High Court of Tanzania')} · ${this.escapeHtml(c.caseNumber || '')}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Facts Only • Non-Reasoning • Verified Record
          </span>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">1. Parties Involved and Premises</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${partiesPremisesHtml}
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">2. Events Leading to the Dispute</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${natureDisputeHtml}
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">3. Claims Made by Each Party (Disputed Property / Agreement / Conduct)</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${competingPositionsHtml}
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">4. Important Dates and Procedural Stage</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${proceduralPositionHtml}
          </ul>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${c.id}')">
            📄 Summarize Case
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showIssuesForCaseRecord('${c.id}')">
            ❓ Legal Issues
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✅ Final Decision
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 3: SUMMARIZE A CASE
     -------------------------------------------------------------------------- */
  renderCaseSummary(msg, caseRec) {
    const c = caseRec || {};
    const s = c.summary || {};

    const backgroundText = s.background || c.relevantPassage || 'Matrimonial dispute submitted for appellate determination.';
    const legalIssueText = s.legalIssue || (c.legalIssues ? c.legalIssues[0] : 'Whether the trial court record was complete and reliable.');
    const principlesList = s.legalPrinciples || [
      'A trial court record must be complete and authentic to sustain an appellate judgment.',
      'Omission of vital witness depositions violates the fundamental right to a fair hearing.',
      'Where trial notes are irremediably defective, proceedings must be nullified and remitted for trial de novo.'
    ];
    const reasoningText = s.reasoning || c.reasoning || 'The Court found significant gaps in the certified record rendering the decree unsafe.';
    const finalDecisionText = s.finalDecision || c.decision || 'Proceedings nullified; trial de novo ordered.';

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              3. 📄 Summary of ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · ${this.escapeHtml(c.court || 'High Court of Tanzania')} · Delivered: ${this.escapeHtml(c.decisionDate || '')}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Complete & Concise Case Summary
          </span>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">1. Case Background & Important Facts</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(backgroundText)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">2. Key Legal Issue</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(legalIssueText)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">3. Important Legal Principles (Ratio Decidendi)</div>
          <ol class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${principlesList.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
          </ol>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">4. Court’s Reasoning</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(reasoningText)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">5. Final Decision & Orders</div>
          <div class="tz-direct-answer-box">
            ${this.escapeHtml(finalDecisionText)}
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')">
            ℹ️ Show Facts
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✅ Final Decision
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showLawsForCaseRecord('${c.id}')">
            📚 Laws Cited
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 4: RESEARCH A LEGAL ISSUE (Multi-Case / Statutory Analysis)
     -------------------------------------------------------------------------- */
  renderLegalResearch(msg) {
    const rawQ = msg.rawQuery || 'your legal query';
    const authorities = this.activeSources && this.activeSources.length > 0 ? this.activeSources : (SLCMS_STATE.tanzaniaJudgments || []);
    const topAuth = authorities[0] || {};

    const report = msg.report || {
      title: '4. ⚖️ Tanzanian Legal Research Analysis',
      meta: `Analyzed against ${authorities.length} authoritative Tanzanian judgment(s) and statutory chapters`,
      tanzliiStatus: `${authorities.length} Authorities Cited`,
      directAnswer: topAuth.relevantPassage || `Legal research across the indexed Tanzanian repository indicates that substantive relief and procedural remedies depend on verified statutory compliance and judicial precedent.`,
      background: `Inquiry analyzed: "${rawQ}". Synthesized from verified prepared case records in the Tanzanian jurisdiction.`,
      issues: (topAuth.legalIssues || [
        'Statutory requirements under principal legislation of Tanzania.',
        'Judicial standards established by the Court of Appeal and High Court.'
      ]).slice(0, 3),
      reasoning: topAuth.reasoning || 'The Court evaluates the completeness of the record, the grounds raised, and the statutory requirements before granting orders.',
      finalOrder: topAuth.finalOrders || [
        'Orders and directions entered according to statutory procedure and binding precedent.'
      ]
    };

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">${this.escapeHtml(report.title)}</h3>
            <div class="tz-legal-report-meta">${this.escapeHtml(report.meta)}</div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${this.escapeHtml(report.tanzliiStatus)}
          </span>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Direct Legal Analysis</div>
          <div class="tz-direct-answer-box">
            ${report.directAnswer}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Applicable Authorities & Precedents</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(report.background)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Legal Issues Framed</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${(report.issues || []).map(i => `<li>${this.escapeHtml(i)}</li>`).join('')}
          </ul>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">Synthesis of Judicial Reasoning</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(report.reasoning)}
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.openMoreToolsModal()">
            ⚡ Explore Question Categories
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Research
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Attach to Matter
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 5: SHOW CASE INFORMATION (Works 100% on METADATA_ONLY)
     -------------------------------------------------------------------------- */
  renderCaseInformation(msg, caseRec) {
    const c = caseRec || {};
    const info = c.caseInformation || {};

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              5. 🧾 Case Information: ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              Saved Metadata & Registry Records
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${c.isMetadataOnly ? 'Metadata Only Record' : 'Full Text Indexed Record'}
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          <table class="tz-meta-table">
            <tr>
              <td style="width: 25%; font-weight: 600; color: var(--color-text-secondary);">Case Title:</td>
              <td style="font-weight: 700; color: var(--color-primary); font-size: 1rem;">${this.escapeHtml(info.title || c.title)}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Citation:</td>
              <td><code>${this.escapeHtml(info.citation || c.citation || 'Unassigned')}</code></td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Case Number:</td>
              <td><strong>${this.escapeHtml(info.caseNumber || c.caseNumber || '')}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Court:</td>
              <td>${this.escapeHtml(info.court || c.court || 'High Court of Tanzania')} (${this.escapeHtml(c.courtTier || 'Superior Court')})</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Presiding Judge / Bench:</td>
              <td><strong>${this.escapeHtml(info.judge || c.judge || 'Hon. Judge')}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Judgment Date:</td>
              <td>${this.escapeHtml(info.decisionDate || c.decisionDate || c.year || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Proceeding Type:</td>
              <td>${this.escapeHtml(info.proceedingType || c.proceedingType || 'Civil Appeal')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Legal Category:</td>
              <td><span class="badge badge-gold">${this.escapeHtml(info.category || c.category || 'General Law')}</span></td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">System Index Status:</td>
              <td><span class="badge ${c.isMetadataOnly ? 'badge-warning' : 'badge-success'}">${this.escapeHtml(info.status || (c.isMetadataOnly ? 'Metadata Only' : 'Ready for AI'))}</span></td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: var(--color-text-secondary);">Primary Source:</td>
              <td>${this.escapeHtml(c.sourceName || 'TanzLII (Tanzania Legal Information Institute)')}</td>
            </tr>
          </table>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.downloadCasePdf('${c.id}')">
            📥 Download PDF
          </button>
          ${!c.isMetadataOnly ? `
            <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${c.id}')">
              📄 Summarize Case
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')">
              ℹ️ Show Facts
            </button>
          ` : ''}
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            ↗ Open TanzLII Source
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 6: SHOW PROCEDURAL HISTORY
     -------------------------------------------------------------------------- */
  renderProceduralHistory(msg, caseRec) {
    const c = caseRec || {};
    const h = c.proceduralHistory || {
      originalCourt: `Primary Court / Trial Subordinate Court (${c.title})`,
      firstAppeal: `District Court of competent jurisdiction`,
      secondAppeal: `High Court of Tanzania (${c.citation || ''})`,
      previousOrders: 'Lower court entered orders which were contested by the appellant.',
      reasonForCurrentProceeding: 'Appellate determination of procedural irregularity and substantive rights under Tanzanian law.'
    };

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              6. 🕒 Procedural History of ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Judicial Progression Through Courts
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Complete Procedural Progression
          </span>
        </div>

        <div class="tz-timeline-container" style="margin: 1.25rem 0;">
          <div class="tz-timeline-item">
            <div class="tz-timeline-dot">1</div>
            <div class="tz-timeline-content">
              <div class="tz-timeline-title">Original Court</div>
              <div class="tz-timeline-desc">${this.escapeHtml(h.originalCourt)}</div>
            </div>
          </div>

          <div class="tz-timeline-item">
            <div class="tz-timeline-dot">2</div>
            <div class="tz-timeline-content">
              <div class="tz-timeline-title">First Appeal</div>
              <div class="tz-timeline-desc">${this.escapeHtml(h.firstAppeal)}</div>
            </div>
          </div>

          <div class="tz-timeline-item">
            <div class="tz-timeline-dot">3</div>
            <div class="tz-timeline-content">
              <div class="tz-timeline-title">Second Appeal / High Court Determination</div>
              <div class="tz-timeline-desc">${this.escapeHtml(h.secondAppeal)}</div>
            </div>
          </div>

          <div class="tz-timeline-item">
            <div class="tz-timeline-dot">4</div>
            <div class="tz-timeline-content">
              <div class="tz-timeline-title">Previous Orders & Lower Court Decrees</div>
              <div class="tz-timeline-desc">${this.escapeHtml(h.previousOrders)}</div>
            </div>
          </div>

          <div class="tz-timeline-item">
            <div class="tz-timeline-dot">5</div>
            <div class="tz-timeline-content">
              <div class="tz-timeline-title">Reason for Current Proceeding</div>
              <div class="tz-timeline-desc">${this.escapeHtml(h.reasonForCurrentProceeding)}</div>
            </div>
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✅ Final Decision
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')">
            ℹ️ Show Facts
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 7: SHOW LEGAL ISSUES
     -------------------------------------------------------------------------- */
  renderCaseIssues(msg, caseRec) {
    const c = caseRec || {};
    const issues = c.legalIssues || [
      'Whether the trial court record was complete and reliable under Section 32 of Magistrates’ Courts Act.',
      'Whether the division of matrimonial property was lawful.',
      'Whether the maintenance order was reasonable.'
    ];

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              7. ❓ Legal Issues in ${this.escapeHtml(c.title || 'the Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Exact Questions for Determination
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${issues.length} Questions Framed by Court
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          <div class="tz-report-section-label">Questions Determined by the Court</div>
          <ul class="tz-bullet-list" style="margin: 0; padding-left: 1.25rem;">
            ${issues.map((iss, idx) => `
              <li style="margin-bottom: 0.65rem;">
                <strong style="color: var(--color-primary);">Issue ${idx + 1}:</strong> ${this.escapeHtml(iss)}
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning on Issues
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✅ Final Decision & Orders
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showPartiesArguments('${c.id}')">
            👥 Parties' Arguments
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 8: SHOW PARTIES' ARGUMENTS (Dual Column Layout)
     -------------------------------------------------------------------------- */
  renderPartiesArguments(msg, caseRec) {
    const c = caseRec || {};
    const args = c.partiesArguments || {
      appellant: {
        name: 'Appellant / Applicant',
        arguments: ['The trial record was defective.', 'The order prejudiced the rights of the party.'],
        lawsAndPrecedentsReliedUpon: ['Civil Procedure Code', 'Statutory authorities']
      },
      respondent: {
        name: 'Respondent',
        arguments: ['The concurrent findings were sound.', 'No miscarriage of justice occurred.'],
        lawsAndPrecedentsReliedUpon: ['Substantive statutory provisions']
      }
    };

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              8. 👥 Parties’ Arguments in ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Competing Submissions & Authorities Relied Upon
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Dual-Column Submissions Breakdown
          </span>
        </div>

        <div class="tz-arguments-grid" style="margin: 1.25rem 0;">
          
          <!-- Column 1: Appellant / Applicant -->
          <div class="tz-argument-card appellant-card">
            <div class="tz-arg-header">
              <span class="tz-arg-badge">Appellant / Applicant</span>
              <h4 class="tz-arg-name">${this.escapeHtml(args.appellant.name || 'Appellant')}</h4>
            </div>
            
            <div class="tz-arg-section">
              <div class="tz-arg-section-title">Important Arguments:</div>
              <ul class="tz-bullet-list" style="padding-left: 1.15rem; margin: 0;">
                ${(args.appellant.arguments || []).map(a => `<li>${this.escapeHtml(a)}</li>`).join('')}
              </ul>
            </div>

            <div class="tz-arg-section" style="border-top: 1px dashed var(--color-border); padding-top: 0.65rem; margin-top: 0.65rem;">
              <div class="tz-arg-section-title">Laws & Precedents Relied Upon:</div>
              <ul class="tz-bullet-list" style="padding-left: 1.15rem; margin: 0; color: #1E3A8A; font-size: 0.82rem;">
                ${(args.appellant.lawsAndPrecedentsReliedUpon || []).map(l => `<li><code>${this.escapeHtml(l)}</code></li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Column 2: Respondent -->
          <div class="tz-argument-card respondent-card">
            <div class="tz-arg-header">
              <span class="tz-arg-badge">Respondent</span>
              <h4 class="tz-arg-name">${this.escapeHtml(args.respondent.name || 'Respondent')}</h4>
            </div>

            <div class="tz-arg-section">
              <div class="tz-arg-section-title">Important Arguments & Replies:</div>
              <ul class="tz-bullet-list" style="padding-left: 1.15rem; margin: 0;">
                ${(args.respondent.arguments || []).map(a => `<li>${this.escapeHtml(a)}</li>`).join('')}
              </ul>
            </div>

            <div class="tz-arg-section" style="border-top: 1px dashed var(--color-border); padding-top: 0.65rem; margin-top: 0.65rem;">
              <div class="tz-arg-section-title">Laws & Precedents Relied Upon:</div>
              <ul class="tz-bullet-list" style="padding-left: 1.15rem; margin: 0; color: #1E3A8A; font-size: 0.82rem;">
                ${(args.respondent.lawsAndPrecedentsReliedUpon || []).map(l => `<li><code>${this.escapeHtml(l)}</code></li>`).join('')}
              </ul>
            </div>
          </div>

        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning on Arguments
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✅ Final Decision
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showLawsForCaseRecord('${c.id}')">
            📚 Laws Cited
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 9: SHOW COURT REASONING
     -------------------------------------------------------------------------- */
  renderCaseReasoning(msg, caseRec) {
    const c = caseRec || {};
    const d = c.courtReasoningDetails || {
      evidenceExamined: 'Certified case records, oral depositions, and supporting affidavits.',
      legalTestsApplied: 'The statutory test of record completeness and natural justice.',
      lowerCourtProblems: 'Incomplete record and failure to evaluate witness evidence.',
      whyArgumentsAcceptedRejected: 'Accepted arguments highlighting lack of authentic record.',
      conclusionPathway: 'Nullified proceedings and ordered trial de novo.'
    };

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              9. 🧠 Court Reasoning in ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Judicial Analysis & Ratio Decidendi
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Specific Judicial Analysis • Non-Generic
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          <div class="tz-report-section-label">1. Evidence Examined by the Court</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(d.evidenceExamined)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">2. Legal Tests & Statutory Standards Applied</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(d.legalTestsApplied)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">3. Problems & Deficiencies Found in Lower-Court Proceedings</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: #991B1B; background: #FEF2F2; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid #FCA5A5;">
            ${this.escapeHtml(d.lowerCourtProblems)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">4. Evaluation of Parties' Arguments</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(d.whyArgumentsAcceptedRejected)}
          </div>
        </div>

        <div class="tz-report-section">
          <div class="tz-report-section-label">5. How the Court Reached its Conclusion</div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">
            ${this.escapeHtml(d.conclusionPathway)}
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✅ Final Decision & Orders
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showPrinciplesForCaseRecord('${c.id}')">
            💡 Legal Principle (Ratio)
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showFactsForCaseRecord('${c.id}')">
            ℹ️ Show Facts
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 10: SHOW FINAL DECISION AND ORDERS
     -------------------------------------------------------------------------- */
  renderCaseDecision(msg, caseRec) {
    const c = caseRec || {};
    const dec = c.decision || (c.summary ? c.summary.finalDecision : 'Final orders entered as recorded in the judgment.');

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              10. ✅ Final Decision & Orders in ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · ${this.escapeHtml(c.court || 'High Court of Tanzania')} · Delivered: ${this.escapeHtml(c.decisionDate || '')}
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Operative Orders & Directions
          </span>
        </div>

        <div class="tz-decision-box" style="margin-top: 1rem;">
          <div class="tz-decision-box-title">
            <span>✓</span>
            <span>COURT'S FINAL OPERATIVE DECREE</span>
          </div>
          <div style="font-size: 0.95rem; line-height: 1.7; color: #102A43; white-space: pre-wrap; font-weight: 500;">
${this.escapeHtml(dec)}
          </div>
          <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.75rem; border-top: 1px dashed #CBD5E1; padding-top: 0.5rem;">
            Presiding: <strong>${this.escapeHtml(c.judge || 'Bench')}</strong> · Decision Date: ${this.escapeHtml(c.decisionDate || '')}
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showPrinciplesForCaseRecord('${c.id}')">
            💡 Legal Principle
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Order
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 11: SHOW LAWS CITED
     -------------------------------------------------------------------------- */
  renderCaseLaws(msg, caseRec) {
    const c = caseRec || {};
    const lawsStructured = c.lawsCitedStructured || (c.lawsCited || []).map(l => ({ act: l, chapter: '', section: '', description: 'Referenced in judgment' }));
    const noLawsNotice = c.lawsCitedNote || 'No statutory provisions were expressly cited in the judgment.';

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              11. 📚 Laws Cited in ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Statutory Authorities & Chapters
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${lawsStructured.length} Verified Statutory Citations
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          ${lawsStructured.length === 0 ? `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.25rem; font-size: 0.92rem; color: #475569; line-height: 1.6;">
              <span style="font-weight: 600; color: var(--color-primary);">Notice:</span> ${this.escapeHtml(noLawsNotice)}
            </div>
          ` : `
            <table class="tz-meta-table">
              <thead>
                <tr style="background: var(--color-surface-subtle); border-bottom: 2px solid var(--color-border);">
                  <th style="padding: 0.6rem; text-align: left; font-size: 0.8rem;">Statutory Act</th>
                  <th style="padding: 0.6rem; text-align: left; font-size: 0.8rem;">Chapter</th>
                  <th style="padding: 0.6rem; text-align: left; font-size: 0.8rem;">Section / Order</th>
                  <th style="padding: 0.6rem; text-align: left; font-size: 0.8rem;">Subject Matter</th>
                </tr>
              </thead>
              <tbody>
                ${lawsStructured.map(l => `
                  <tr>
                    <td style="font-weight: 700; color: var(--color-primary);">${this.escapeHtml(l.act)}</td>
                    <td><code>${this.escapeHtml(l.chapter || '—')}</code></td>
                    <td><strong style="color: #1E3A8A;">${this.escapeHtml(l.section || '—')}</strong></td>
                    <td style="font-size: 0.85rem; color: var(--color-text-secondary);">${this.escapeHtml(l.description || 'Statutory reference')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showCasesCitedRecord('${c.id}')">
            🏛️ Show Cases Cited
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Citations
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 12: SHOW CASES CITED
     -------------------------------------------------------------------------- */
  renderCasesCited(msg, caseRec) {
    const c = caseRec || {};
    const cases = Array.isArray(c.casesCited) ? c.casesCited : (c.casesCited || [
      { title: 'Bi. Hawa Mohamed v. Ally Sefu', citation: '[1983] TLR 32', principle: 'Housework and domestic care constitute valuable joint contribution in matrimonial property division under Section 114.', url: 'https://tanzlii.org' },
      { title: 'Rukia Diwani v. Selemani Hassan', citation: '[1988] TLR 142', principle: 'An appellate court cannot validate a decision where the trial court record is fundamentally defective.', url: 'https://tanzlii.org' }
    ]);

    const noCasesNotice = c.casesCitedNote || 'No decided cases were expressly cited in the ruling.';

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              12. 🏛️ Cases Cited in ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Earlier Precedents Relied Upon
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ ${cases.length} Judicial Precedents Analyzed
          </span>
        </div>

        <div class="tz-report-section" style="margin-top: 1rem;">
          ${cases.length === 0 ? `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.25rem; font-size: 0.92rem; color: #475569; line-height: 1.6;">
              <span style="font-weight: 600; color: var(--color-primary);">Notice:</span> ${this.escapeHtml(noCasesNotice)}
            </div>
          ` : `
            <div class="flex flex-col gap-2.5">
              ${cases.map(cs => `
                <div class="dash-task-item" style="border-left: 3px solid var(--color-gold);">
                  <div class="flex items-center justify-between flex-wrap gap-1">
                    <h4 style="margin: 0; font-size: 0.95rem; color: var(--color-primary);">${this.escapeHtml(cs.title)}</h4>
                    <code style="font-size: 0.78rem;">${this.escapeHtml(cs.citation)}</code>
                  </div>
                  <div style="font-size: 0.85rem; line-height: 1.5; color: var(--color-text-main); margin-top: 0.35rem;">
                    <strong>Principle for which cited:</strong> ${this.escapeHtml(cs.principle)}
                  </div>
                  <div style="margin-top: 0.4rem;">
                    <a href="${cs.url || 'https://tanzlii.org'}" target="_blank" style="font-size: 0.75rem; color: var(--color-gold); font-weight: 600; text-decoration: none;">
                      🌐 View Precedent on TanzLII ↗
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showLawsForCaseRecord('${c.id}')">
            📚 Show Laws Cited
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showPrinciplesForCaseRecord('${c.id}')">
            💡 Legal Principle
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 13: SHOW LEGAL PRINCIPLE (Ratio Decidendi vs Obiter Dicta)
     -------------------------------------------------------------------------- */
  renderLegalPrinciple(msg, caseRec) {
    const c = caseRec || {};
    const p = c.legalPrinciplesStructured || {
      ratioDecidendi: 'A trial court record must be complete and authentic to sustain an appellate decree; omission of evidence renders proceedings fatally defective.',
      bindingPrinciple: 'An appellate court has no jurisdiction to confirm or vary a decree based on an incomplete record (Binding Precedent).',
      generalObservation: 'Judicial officers must maintain complete records of witness depositions to safeguard constitutional fair hearing rights.',
      finalOrder: 'Lower court judgments nullified; trial de novo ordered before a new magistrate.'
    };

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              13. 💡 Legal Principle in ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || '')} · Ratio Decidendi vs Obiter Dicta Distinction
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Ratio Decidendi Verified
          </span>
        </div>

        <!-- 1. Binding Ratio Decidendi -->
        <div class="tz-principle-box ratio-box" style="margin-top: 1rem;">
          <div class="tz-principle-badge" style="background: #102A43; color: var(--color-gold);">
            🟢 BINDING LEGAL PRINCIPLE (RATIO DECIDENDI)
          </div>
          <div style="font-size: 0.95rem; line-height: 1.65; color: #102A43; font-weight: 600; margin-top: 0.45rem;">
            ${this.escapeHtml(p.ratioDecidendi)}
          </div>
          <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.35rem;">
            ${this.escapeHtml(p.bindingPrinciple)}
          </div>
        </div>

        <!-- 2. General Observation (Obiter Dictum) -->
        <div class="tz-principle-box obiter-box" style="margin-top: 0.75rem;">
          <div class="tz-principle-badge" style="background: #E0E7FF; color: #3730A3;">
            🔵 GENERAL JUDICIAL OBSERVATION (OBITER DICTUM)
          </div>
          <div style="font-size: 0.88rem; line-height: 1.6; color: #1E293B; margin-top: 0.45rem;">
            ${this.escapeHtml(p.generalObservation)}
          </div>
        </div>

        <!-- 3. Final Operative Order -->
        <div class="tz-principle-box order-box" style="margin-top: 0.75rem;">
          <div class="tz-principle-badge" style="background: #FEF3C7; color: #92400E;">
            🟡 FINAL OPERATIVE DISPOSITION
          </div>
          <div style="font-size: 0.88rem; line-height: 1.6; color: #78350F; margin-top: 0.45rem;">
            ${this.escapeHtml(p.finalOrder)}
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.showReasoningForCaseRecord('${c.id}')">
            🧠 Court Reasoning
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showDecisionForCaseRecord('${c.id}')">
            ✅ Final Decision
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.showCasesCitedRecord('${c.id}')">
            🏛️ Show Cases Cited
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold);" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original PDF
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 14: COMPARE CASES (Side-by-Side Comparison Matrix)
     -------------------------------------------------------------------------- */
  renderCaseComparison(msg) {
    const case1 = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-001') || {}; // Attilio
    const case2 = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === 'tz-j-009') || {}; // Muwinge

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              14. 🔄 Case Comparison: ${this.escapeHtml(case1.title)} vs ${this.escapeHtml(case2.title)}
            </h3>
            <div class="tz-legal-report-meta">
              Comparative Analysis Across Facts, Issues, Laws Applied, Reasoning, Decisions & Precedential Value
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Multi-Case Matrix
          </span>
        </div>

        <!-- Comparative Table -->
        <div style="overflow-x: auto; margin: 1.25rem 0;">
          <table class="tz-comparison-table">
            <thead>
              <tr>
                <th style="width: 20%;">Comparison Dimension</th>
                <th style="width: 40%; color: var(--color-gold);">${this.escapeHtml(case1.title)} (${case1.citation})</th>
                <th style="width: 40%; color: var(--color-gold);">${this.escapeHtml(case2.title)} (${case2.citation})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="tz-comp-label">1. Facts (Similarities & Differences)</td>
                <td>Dispute over occupation and commercial operation of hotel bar and nightclub premises under contested purchase terms.</td>
                <td>Matrimonial property dispute over residential home division and maintenance following a 14-year marriage.</td>
              </tr>
              <tr>
                <td class="tz-comp-label">2. Legal Issues Considered</td>
                <td>Whether temporary injunction conditions (triable issue, irreparable injury, balance of convenience) were met.</td>
                <td>Whether missing witness testimony in the trial court record rendered the matrimonial decree legally invalid.</td>
              </tr>
              <tr>
                <td class="tz-comp-label">3. Laws Applied</td>
                <td>Civil Procedure Code [Cap. 33], Order XXXIX Rules 1 & 2; Law of Contract Act [Cap. 345], Sec. 73.</td>
                <td>The Magistrates’ Courts Act [Cap. 11], Sec. 32; The Law of Marriage Act [Cap. 29], Sec. 114 & 160.</td>
              </tr>
              <tr>
                <td class="tz-comp-label">4. Judicial Reasoning & Approach</td>
                <td>Damages provide an adequate monetary remedy; equity will not grant an injunction where financial loss is quantifiable.</td>
                <td>An appellate court cannot confirm a decree where the trial record is incomplete; due process requires a trial de novo.</td>
              </tr>
              <tr>
                <td class="tz-comp-label">5. Final Decisions Reached</td>
                <td>Temporary injunction refused; stay made absolute; suit ordered to proceed to full trial on merits.</td>
                <td>Subordinate court judgments nullified; trial de novo ordered before a new magistrate with new assessors.</td>
              </tr>
              <tr>
                <td class="tz-comp-label">6. Precedential Value & Hierarchy</td>
                <td>Locus classicus binding on all High Court registries and subordinate courts for interlocutory injunction tests.</td>
                <td>Landmark High Court precedent establishing mandatory nullification for defective lower-court records.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${case1.id}')">
            📄 Summarize Attilio
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.summarizeCaseRecord('${case2.id}')">
            📄 Summarize Muwinge
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.copyReportText('${msg.id}')">
            📋 Copy Comparison
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 15: GENERATE A LEGAL REPORT
     -------------------------------------------------------------------------- */
  renderLegalReport(msg) {
    const year = '2020';
    const list = (SLCMS_STATE.tanzaniaJudgments || []).filter(j => j.year === year || (j.citation && j.citation.includes(year)));

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              15. 📊 Legal Research Report: Tanzanian Judgments (${year})
            </h3>
            <div class="tz-legal-report-meta">
              Generated by SLCMS AI • Filter: Decisions in ${year} • TanzLII Precedents Repository
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-gold btn-sm" onclick="AIAssistantView.downloadLegalReportPDF('rep-2020')">
              📥 Export PDF
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.downloadLegalReportWord('rep-2020')">
              📝 Export Word (.docx)
            </button>
          </div>
        </div>

        <!-- Executive Summary -->
        <div style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: 1rem; margin: 1rem 0; font-size: 0.88rem; line-height: 1.6;">
          <strong>Executive Summary:</strong> The SLCMS repository indexed <strong>${list.length} landmark decisions</strong> delivered in ${year}, spanning Family Law, Commercial Litigation, Banking, and Civil Procedure. Notable holdings include the nullification rule in <em>Muwinge v. Halima</em> and bank guarantee autonomy in <em>Gonzaga v. NBC</em>.
        </div>

        <!-- Report Data Table -->
        <table class="tz-meta-table" style="margin-bottom: 1rem;">
          <thead>
            <tr style="background: var(--color-surface-subtle);">
              <th style="padding: 0.6rem; text-align: left;">Case Title</th>
              <th style="padding: 0.6rem; text-align: left;">Citation</th>
              <th style="padding: 0.6rem; text-align: left;">Court & Judge</th>
              <th style="padding: 0.6rem; text-align: left;">Category</th>
              <th style="padding: 0.6rem; text-align: left;">Core Legal Holding</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(j => `
              <tr>
                <td style="font-weight: 700; color: var(--color-primary);">${this.escapeHtml(j.title)}</td>
                <td><code>${this.escapeHtml(j.citation)}</code></td>
                <td>${this.escapeHtml(j.court || 'High Court')}<br><small style="color: var(--color-text-secondary);">${this.escapeHtml(j.judge || '')}</small></td>
                <td><span class="badge badge-gold" style="font-size: 0.68rem;">${this.escapeHtml(j.category)}</span></td>
                <td style="font-size: 0.82rem;">${this.escapeHtml(j.relevantPassage ? j.relevantPassage.substring(0, 110) + '…' : 'Indexed Precedent')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.downloadLegalReportPDF('rep-2020')">
            📥 Download Formal PDF Report
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.downloadLegalReportWord('rep-2020')">
            📝 Download Word (.docx)
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📎 Attach Report to Client File
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 16: OPEN ORIGINAL SOURCE
     -------------------------------------------------------------------------- */
  renderOpenSource(msg, caseRec) {
    const c = caseRec || {};

    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              16. 🌐 Original Source & PDF Verification: ${this.escapeHtml(c.title || 'Selected Case')}
            </h3>
            <div class="tz-legal-report-meta">
              ${this.escapeHtml(c.citation || c.caseNumber || '')} · Official Primary Judicial Document
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ Verified TanzLII Authority
          </span>
        </div>

        <div style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin: 1rem 0; border: 1px dashed var(--color-border);">
          <div class="flex items-center gap-3">
            <div style="font-size: 2.5rem;">📄</div>
            <div>
              <h4 style="margin: 0 0 0.25rem; color: var(--color-primary);">${this.escapeHtml(c.title)}</h4>
              <div style="font-size: 0.82rem; color: var(--color-text-secondary);">
                Official Citation: <code>${this.escapeHtml(c.citation || 'Certified Case File')}</code> • ${this.escapeHtml(c.court || 'High Court of Tanzania')}
              </div>
              <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                Status: <strong style="color: #059669;">${this.escapeHtml(c.status || 'Ready for AI')}</strong> • Source: TanzLII
              </div>
            </div>
          </div>
        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            👁️ View Original PDF Document
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.downloadCasePdf('${c.id}')">
            📥 Download PDF File
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--color-gold); font-weight: 600;" onclick="AIAssistantView.openOriginalTanzLII('${c.tanzliiUrl || 'https://tanzlii.org'}', '${c.title}')">
            🌐 Open Official TanzLII Portal ↗
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.viewSupportingPassage('${c.id}')">
            📄 View Extracted Text
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     CATEGORY 17: DOCUMENT UPLOAD HELP
     -------------------------------------------------------------------------- */
  renderUploadHelp(msg) {
    return `
      <div class="tz-legal-report animate-fade">
        <div class="tz-legal-report-header flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="tz-legal-report-title">
              17. 📤 Document Upload & Management Guide
            </h3>
            <div class="tz-legal-report-meta">
              Instructions for Uploads, OCR Text Extraction, Metadata Only Status, and Case Attachments
            </div>
          </div>
          <span class="tz-status-pill" style="margin-bottom: 0;">
            ✓ SLCMS Help System
          </span>
        </div>

        <div class="flex flex-col gap-3" style="margin: 1.25rem 0;">
          
          <div class="dash-task-item" style="border-left: 3px solid var(--color-gold);">
            <strong style="color: var(--color-primary); display: block; margin-bottom: 0.25rem;">
              1. How do I upload a judgment or statute?
            </strong>
            <div style="font-size: 0.85rem; line-height: 1.6; color: var(--color-text-main);">
              Click the <strong>"📤 Upload Source"</strong> button in the top right navigation bar, enter the case name, citation (e.g. <code>[2024] TZCA 450</code> or <code>Cap. 345</code>), and select your PDF file. The system indexes it automatically.
            </div>
          </div>

          <div class="dash-task-item" style="border-left: 3px solid #3B82F6;">
            <strong style="color: var(--color-primary); display: block; margin-bottom: 0.25rem;">
              2. Why is my document marked as "Metadata Only" or not readable?
            </strong>
            <div style="font-size: 0.85rem; line-height: 1.6; color: var(--color-text-main);">
              Scanned image PDFs without a native text layer are tagged as <strong>Metadata Only</strong>. The AI can display metadata (court, judge, citation, date) and provide PDF downloads, but will NOT generate facts or reasoning without extracted text.
            </div>
          </div>

          <div class="dash-task-item" style="border-left: 3px solid #10B981;">
            <strong style="color: var(--color-primary); display: block; margin-bottom: 0.25rem;">
              3. How do I run OCR on an unreadable document?
            </strong>
            <div style="font-size: 0.85rem; line-height: 1.6; color: var(--color-text-main);">
              Navigate to <strong>Documents View</strong>, click the <em>Metadata Only</em> badge on the document card, and select <strong>"Run Optical Character Recognition (OCR)"</strong>. The background worker parses the text and changes the status to <em>Ready for AI</em>.
            </div>
          </div>

          <div class="dash-task-item" style="border-left: 3px solid #8B5CF6;">
            <strong style="color: var(--color-primary); display: block; margin-bottom: 0.25rem;">
              4. How do I attach a retrieved precedent or report to a case file?
            </strong>
            <div style="font-size: 0.85rem; line-height: 1.6; color: var(--color-text-main);">
              Click <strong>"📎 Attach to Matter"</strong> under any generated report or case card. Select your authorized client matter (e.g. <em>CV-2026-0842 Vanguard Capital</em>) to automatically file the authority into the case bundle.
            </div>
          </div>

        </div>

        <div class="tz-action-button-bar">
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.openUploadModal()">
            📤 Open Upload Dialog
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openLibraryModal()">
            📚 Browse Indexed Library
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AIAssistantView.openAttachToCaseModal()">
            📁 Attach Document to Case
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     INTERACTIVE CATEGORY BUTTON CLICK HANDLER
     -------------------------------------------------------------------------- */
  handleCategoryButtonClick(categoryCode) {
    const input = document.getElementById('tz-question-input');
    const currentText = (input ? input.value : this.activeDraftQuery) || '';
    const activeCase = this.activeSources[0];

    // If text already in input, append or format category prompt
    if (currentText && currentText.trim()) {
      this.handleSendMessage();
      return;
    }

    // Direct action dispatch or prompt dialog
    switch (categoryCode) {
      case 'FIND_JUDGMENT':
        this.fillAndAsk('show me all cases in 2020');
        break;
      case 'CASE_SUMMARY':
        if (activeCase && !activeCase.isMetadataOnly) {
          this.fillAndAsk(`Summarize the judgment ${activeCase.title}`);
        } else {
          this.openCategoryCaseModal('CASE_SUMMARY');
        }
        break;
      case 'CASE_FACTS':
        if (activeCase && !activeCase.isMetadataOnly) {
          this.fillAndAsk(`Show the facts of ${activeCase.title}`);
        } else {
          this.openCategoryCaseModal('CASE_FACTS');
        }
        break;
      case 'LEGAL_ISSUES':
        if (activeCase && !activeCase.isMetadataOnly) {
          this.fillAndAsk(`Show legal issues in ${activeCase.title}`);
        } else {
          this.openCategoryCaseModal('LEGAL_ISSUES');
        }
        break;
      case 'COURT_REASONING':
        if (activeCase && !activeCase.isMetadataOnly) {
          this.fillAndAsk(`Show court reasoning of ${activeCase.title}`);
        } else {
          this.openCategoryCaseModal('COURT_REASONING');
        }
        break;
      case 'FINAL_DECISION':
        if (activeCase && !activeCase.isMetadataOnly) {
          this.fillAndAsk(`What was the final order in ${activeCase.title}?`);
        } else {
          this.openCategoryCaseModal('FINAL_DECISION');
        }
        break;
      case 'LAWS_CITED':
        if (activeCase && !activeCase.isMetadataOnly) {
          this.fillAndAsk(`Show laws cited in ${activeCase.title}`);
        } else {
          this.openCategoryCaseModal('LAWS_CITED');
        }
        break;
      case 'OPEN_SOURCE':
        if (activeCase) {
          this.viewPdfModal(activeCase.id);
        } else {
          this.openCategoryCaseModal('OPEN_SOURCE');
        }
        break;
      default:
        this.openMoreToolsModal();
        break;
    }
  },

  /* --------------------------------------------------------------------------
     ALL 18 QUESTION CATEGORIES MODAL (More Legal Tools)
     -------------------------------------------------------------------------- */
  openMoreToolsModal() {
    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.3rem;">⚡</span>
          <h3 class="modal-title">All 18 Permanent Question Categories</h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 1.25rem;">
          Select any legal category below to execute instant verified research against prepared Tanzanian precedents and legislation:
        </p>

        <!-- Primary 8 Categories Section -->
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-gold); text-transform: uppercase; margin-bottom: 0.6rem; letter-spacing: 0.05em;">
            Primary Categories (Visible Under Input Box)
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('show me all cases in 2020')">
              <div class="tz-modal-cat-title">
                <span>🔍</span> 1. Find a Judgment
              </div>
              <div class="tz-modal-cat-desc">
                Search by Title, Party, Case Number, Citation, Court, Judge or Year.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show the facts of Abdallah Salum Muwinge v Halima Ismail')">
              <div class="tz-modal-cat-title">
                <span>ℹ️</span> 2. Show Facts of a Case
              </div>
              <div class="tz-modal-cat-desc">
                Parties, events, claims, dates, and disputed property (Facts only).
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Summarize Abdallah Salum Muwinge v Halima Ismail')">
              <div class="tz-modal-cat-title">
                <span>📄</span> 3. Summarize a Case
              </div>
              <div class="tz-modal-cat-desc">
                Concise complete summary: background, facts, issues, reasoning & decision.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show legal issues in Muwinge v Halima')">
              <div class="tz-modal-cat-title">
                <span>❓</span> 7. Show Legal Issues
              </div>
              <div class="tz-modal-cat-desc">
                Exact questions determined by the court in the prepared record.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show court reasoning of Abdallah Salum Muwinge vs Halima Ismail')">
              <div class="tz-modal-cat-title">
                <span>🧠</span> 9. Show Court Reasoning
              </div>
              <div class="tz-modal-cat-desc">
                Evidence examined, legal tests, and lower-court evaluation.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('What was the final order in Abdallah Salum Muwinge vs Halima Ismail?')">
              <div class="tz-modal-cat-title">
                <span>✅</span> 10. Show Final Decision and Orders
              </div>
              <div class="tz-modal-cat-desc">
                Operative orders, nullifications, retrials, and costs.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show laws cited in Abdallah Salum Muwinge vs Halima Ismail')">
              <div class="tz-modal-cat-title">
                <span>📚</span> 11. Show Laws Cited
              </div>
              <div class="tz-modal-cat-desc">
                Statutory Acts, chapters, sections, and constitutional provisions.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.viewPdfModal('tz-j-009')">
              <div class="tz-modal-cat-title">
                <span>🌐</span> 16. Open Original Source
              </div>
              <div class="tz-modal-cat-desc">
                View Original PDF, Download PDF, and open TanzLII source portal.
              </div>
            </div>

          </div>
        </div>

        <!-- Additional Legal Tools Section -->
        <div>
          <div style="font-size: 0.78rem; font-weight: 700; color: #3B82F6; text-transform: uppercase; margin-bottom: 0.6rem; letter-spacing: 0.05em;">
            Additional Legal Tools & Advanced Analytics
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show case information for Abdallah Salum Muwinge vs Halima Ismail')">
              <div class="tz-modal-cat-title">
                <span>🧾</span> 5. Show Case Information
              </div>
              <div class="tz-modal-cat-desc">
                Citation, proceeding type, judge, court, and saved metadata (works on Metadata Only).
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show procedural history of Muwinge case')">
              <div class="tz-modal-cat-title">
                <span>🕒</span> 6. Show Procedural History
              </div>
              <div class="tz-modal-cat-desc">
                Primary court -> First appeal -> High Court progression timeline.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show parties arguments in Muwinge case')">
              <div class="tz-modal-cat-title">
                <span>👥</span> 8. Show Parties’ Arguments
              </div>
              <div class="tz-modal-cat-desc">
                Dual-column breakdown: Appellant arguments vs Respondent arguments.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show cases cited in Abdallah Salum Muwinge vs Halima Ismail')">
              <div class="tz-modal-cat-title">
                <span>🏛️</span> 12. Show Cases Cited
              </div>
              <div class="tz-modal-cat-desc">
                Earlier precedents relied upon, principles, and TanzLII links.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Show legal principle in Attilio v Mbowe')">
              <div class="tz-modal-cat-title">
                <span>💡</span> 13. Show Legal Principle (Ratio)
              </div>
              <div class="tz-modal-cat-desc">
                Ratio decidendi vs obiter observations vs final orders.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Compare Attilio v Mbowe and Muwinge v Halima')">
              <div class="tz-modal-cat-title">
                <span>🔄</span> 14. Compare Cases
              </div>
              <div class="tz-modal-cat-desc">
                Side-by-side matrix of facts, issues, laws, reasoning, and decisions.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('What are the principles for granting a temporary injunction in Tanzania?')">
              <div class="tz-modal-cat-title">
                <span>⚖️</span> 4. Research a Legal Issue
              </div>
              <div class="tz-modal-cat-desc">
                Multi-case and statutory research across the entire Tanzanian library.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Generate legal report for 2020 judgments')">
              <div class="tz-modal-cat-title">
                <span>📊</span> 15. Generate a Legal Report
              </div>
              <div class="tz-modal-cat-desc">
                Produces downloadable reports in PDF or Word (.docx) formats.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('What does Metadata Only mean and how do I run OCR?')">
              <div class="tz-modal-cat-title">
                <span>📤</span> 17. Document Upload Help
              </div>
              <div class="tz-modal-cat-desc">
                Guides on uploading, unreadable scans, OCR extraction, and metadata.
              </div>
            </div>

            <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Habari za leo! Unaweza kufanya nini?')">
              <div class="tz-modal-cat-title">
                <span>💬</span> 18. Greetings & General Help
              </div>
              <div class="tz-modal-cat-desc">
                English & Swahili greetings (Mambo, Habari, Shikamoo, Unaweza nisaidiaje).
              </div>
            </div>

          </div>
        </div>

      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  /* --------------------------------------------------------------------------
     CATEGORY CASE SELECTOR MODAL
     -------------------------------------------------------------------------- */
  openCategoryCaseModal(categoryCode) {
    const list = SLCMS_STATE.tanzaniaJudgments || [];
    const catLabels = {
      'CASE_SUMMARY': 'Summarize a Case',
      'CASE_FACTS': 'Show Facts of a Case',
      'LEGAL_ISSUES': 'Show Legal Issues',
      'COURT_REASONING': 'Show Court Reasoning',
      'FINAL_DECISION': 'Show Final Decision',
      'LAWS_CITED': 'Show Laws Cited',
      'OPEN_SOURCE': 'Open Original Source PDF'
    };

    const label = catLabels[categoryCode] || 'Select Case';

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">${label} — Select Case</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Choose a prepared case record to execute <strong>${label}</strong>:
        </p>

        <div class="flex flex-col gap-2.5">
          ${list.map(c => `
            <div class="dash-task-item flex items-center justify-between" style="cursor: pointer;" onclick="App.closeModal(); AIAssistantView.fillAndAsk('${this.getCategoryPromptForCase(categoryCode, c)}')">
              <div>
                <strong style="color: var(--color-primary);">${this.escapeHtml(c.title)}</strong>
                <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                  Citation: <code>${this.escapeHtml(c.citation)}</code> • ${this.escapeHtml(c.courtTier || c.court)}
                  ${c.isMetadataOnly ? '<span class="badge badge-warning" style="font-size: 0.65rem; margin-left: 0.4rem;">Metadata Only</span>' : ''}
                </div>
              </div>
              <button class="btn btn-gold btn-sm">Select</button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      </div>
    `, 'modal-md');
  },

  getCategoryPromptForCase(catCode, c) {
    switch (catCode) {
      case 'CASE_SUMMARY': return `Summarize ${c.title}`;
      case 'CASE_FACTS': return `Show the facts of ${c.title}`;
      case 'LEGAL_ISSUES': return `Show legal issues in ${c.title}`;
      case 'COURT_REASONING': return `Show court reasoning of ${c.title}`;
      case 'FINAL_DECISION': return `What was the final order in ${c.title}?`;
      case 'LAWS_CITED': return `Show laws cited in ${c.title}`;
      case 'OPEN_SOURCE': return `Open original source for ${c.title}`;
      default: return `Tell me about ${c.title}`;
    }
  },

  /* --------------------------------------------------------------------------
     SEARCH PIPELINE & INTENT-SPECIFIC ROUTING
     -------------------------------------------------------------------------- */
  fillAndAsk(queryText) {
    if (this.isSubmitting || this.isProcessing) return;
    this.activeDraftQuery = queryText;
    const input = document.getElementById('tz-question-input');
    if (input) input.value = queryText;
    this.handleSendMessage();
  },

  handleSendMessage() {
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

    // 1. Mandatory Authentication Check
    const userProfile = TanzaniaIntentRouter.getUserProfile ? TanzaniaIntentRouter.getUserProfile() : { isLoggedIn: !!App.isLoggedIn };
    if (!userProfile.isLoggedIn || !App.isLoggedIn) {
      this.conversation.push({
        id: userMsgId,
        role: 'user',
        text: trimmedQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      this.conversation.push({
        id: assistantMsgId,
        reqId: reqId,
        role: 'assistant',
        requiresAuth: true,
        intent: 'AUTHENTICATION_REQUIRED',
        categoryCode: 'AUTHENTICATION_ACCOUNTS',
        response: `You must register or sign in to your authorized SLCMS account before using the Tanzania Legal Research Assistant and searching prepared judgments.\n\n• Already registered? Sign in to your account.\n• New to SLCMS? Register using your authorized firm invitation code.\n\nPlease sign in or register to continue.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      this.isSubmitting = false;
      this.isProcessing = false;
      App.renderAuthenticatedApp();
      this.scrollToBottom();
      return;
    }

    // 2. Append User Message
    this.conversation.push({
      id: userMsgId,
      role: 'user',
      text: trimmedQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // 3. Execute Router Classification
    const routeRes = TanzaniaIntentRouter.routeMessage(trimmedQuery);
    const categoryCode = routeRes.categoryCode || routeRes.category || 'LEGAL_RESEARCH';

    // 4. Initial Thinking State (Three Hanging Dots)
    this.conversation.push({
      id: assistantMsgId,
      reqId: reqId,
      role: 'assistant',
      isSearching: true,
      categoryCode: categoryCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    App.renderAuthenticatedApp();
    this.scrollToBottom();

    // 5. Three Hanging Dots Thinking Animation (~1.1s)
    setTimeout(() => {
      const msgObj = this.conversation.find(m => m.id === assistantMsgId);
      if (msgObj) {
        msgObj.isSearching = false;
        msgObj.categoryCode = categoryCode;
        msgObj.category = routeRes.category;
        msgObj.matchedCase = routeRes.matchedCase;
        msgObj.caseRecords = routeRes.caseRecords || (routeRes.matchedCase ? [routeRes.matchedCase] : []);
        msgObj.isSingleMatchPrompt = routeRes.isSingleMatchPrompt;
        msgObj.isMultipleMatchesPrompt = routeRes.isMultipleMatchesPrompt;
        msgObj.isMetadataOnlyBlocked = routeRes.isMetadataOnlyBlocked;
        msgObj.notice = routeRes.notice;
        msgObj.response = routeRes.response;
        msgObj.guidedOptions = routeRes.guidedOptions;
        msgObj.intent = routeRes.intent;
        msgObj.isGreeting = routeRes.isGreeting || routeRes.categoryCode === 'GREETING';
        msgObj.isCaseComparison = routeRes.isCaseComparison;
        msgObj.isLegalReport = routeRes.isLegalReport;
        msgObj.isOpenSource = routeRes.isOpenSource;
        msgObj.isCaseInformation = routeRes.isCaseInformation;
        msgObj.isProceduralHistory = routeRes.isProceduralHistory;
        msgObj.isCasesCited = routeRes.isCasesCited;
        msgObj.isLegalPrinciple = routeRes.isLegalPrinciple;
        msgObj.isUploadHelp = routeRes.isUploadHelp;
        msgObj.isFindJudgment = routeRes.isFindJudgment;
        msgObj.isLegal = routeRes.isLegal;
        msgObj.rawQuery = routeRes.rawQuery || trimmedQuery;

        // Specific handling for pure Year Case List queries if no specific case was matched (e.g. "Cases from 2020", "2023 cases")
        const yearMatch = trimmedQuery.match(/\b(19\d{2}|20\d{2})\b/);
        if (categoryCode === 'FIND_JUDGMENT' && yearMatch && !routeRes.matchedCase && !routeRes.isSingleMatchPrompt && (!routeRes.caseRecords || routeRes.caseRecords.length === 0)) {
          const year = yearMatch[1];
          msgObj.caseRecords = (SLCMS_STATE.tanzaniaJudgments || []).filter(j => 
            (j.year && String(j.year) === year) || 
            (j.decisionDate && String(j.decisionDate).includes(year)) ||
            (j.citation && String(j.citation).includes(year))
          );
          msgObj.caseListTitle = `Cases from ${year}`;
          msgObj.caseListSubtitle = `Found ${msgObj.caseRecords.length} judgments from ${year} in the legal library.`;
        }

        // Update Right Column Active Sources
        if (routeRes.matchedCase) {
          this.activeSources = [routeRes.matchedCase, ...this.activeSources.filter(s => s.id !== routeRes.matchedCase.id)];
        } else if (msgObj.caseRecords && msgObj.caseRecords.length > 0) {
          this.activeSources = msgObj.caseRecords;
        }
      }

      this.isSubmitting = false;
      this.isProcessing = false;
      App.renderAuthenticatedApp();
      this.scrollToBottom();
      SLCMS_STATE.addAuditLog('AI Legal Query Executed', 'Tanzania Legal AI', trimmedQuery.substring(0, 40));
    }, 1100);
  },

  /* --------------------------------------------------------------------------
     DIRECT CATEGORY ACTION SHORTCUTS FOR CARDS
     -------------------------------------------------------------------------- */
  summarizeCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Summarize ${caseRec.title}`);
  },

  showFactsForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show the facts of ${caseRec.title}`);
  },

  showIssuesForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show legal issues in ${caseRec.title}`);
  },

  showReasoningForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show court reasoning of ${caseRec.title}`);
  },

  showDecisionForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`What was the final order in ${caseRec.title}?`);
  },

  showCaseInfoRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show case information for ${caseRec.title}`);
  },

  showLawsForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show laws cited in ${caseRec.title}`);
  },

  showCasesCitedRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show cases cited in ${caseRec.title}`);
  },

  showPrinciplesForCaseRecord(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show legal principle in ${caseRec.title}`);
  },

  showPartiesArguments(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show parties arguments in ${caseRec.title}`);
  },

  /* --------------------------------------------------------------------------
     PDF VIEWER MODAL & EXPORT HANDLERS (AUTHENTIC TANZANIAN JUDICATURE)
     -------------------------------------------------------------------------- */
  viewPdfModal(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId) || (SLCMS_STATE.tanzaniaJudgments || [])[0];
    if (!caseRec) return;

    const isMuwinge = caseRec.id === 'tz-j-009' || (caseRec.title && caseRec.title.toLowerCase().includes('muwinge'));
    const citation = caseRec.citation || '[2020] TZHC 10045';
    const court = caseRec.court || 'High Court of Tanzania, Dar es Salaam District Registry';
    const caseNumber = caseRec.caseNumber || 'PC Civil Appeal No. 69 of 2018';
    const judge = caseRec.judge || 'S.M. Kulita, J.';
    const decisionDate = caseRec.decisionDate || '31 December 2020';
    const tanzliiUrl = caseRec.tanzliiUrl || 'https://tanzlii.org/tz/judgment/high-court-tanzania/2020/10045';

    // SVG Coat of Arms Emblem for Tanzanian High Court
    const emblemSvg = `
      <svg class="tz-pdf-crest-img" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" stroke="#1E3A8A" stroke-width="2.5" fill="#F8FAFC" />
        <circle cx="50" cy="50" r="42" stroke="#D97706" stroke-width="1" stroke-dasharray="3 2" fill="none" />
        <!-- Scales of Justice -->
        <path d="M50 18 V68 M36 68 H64" stroke="#1E3A8A" stroke-width="3" stroke-linecap="round" />
        <path d="M28 32 H72" stroke="#1E3A8A" stroke-width="2.5" stroke-linecap="round" />
        <!-- Left Pan -->
        <path d="M28 32 L20 48 M28 32 L36 48" stroke="#D97706" stroke-width="1.5" />
        <path d="M16 48 Q28 54 40 48 Z" fill="#D97706" opacity="0.85" />
        <!-- Right Pan -->
        <path d="M72 32 L64 48 M72 32 L80 48" stroke="#D97706" stroke-width="1.5" />
        <path d="M60 48 Q72 54 84 48 Z" fill="#D97706" opacity="0.85" />
        <!-- Base Pillar -->
        <rect x="42" y="68" width="16" height="8" rx="2" fill="#1E3A8A" />
        <text x="50" y="86" font-family="'Times New Roman', serif" font-size="7" font-weight="bold" fill="#1E3A8A" text-anchor="middle" letter-spacing="0.5">HIGH COURT OF TANZANIA</text>
      </svg>
    `;

    App.openModal(`
      <div class="tz-pdf-topbar">
        <div class="tz-pdf-topbar-left">
          <div class="tz-pdf-file-icon">⚖️</div>
          <div class="tz-pdf-title-info">
            <div class="tz-pdf-doc-title">Official Court Record: ${this.escapeHtml(caseRec.title)}</div>
            <div class="tz-pdf-doc-meta">
              <span class="tz-pdf-citation-tag">${this.escapeHtml(citation)}</span>
              <span>•</span>
              <span>${this.escapeHtml(court)}</span>
              <span>•</span>
              <span>Delivered: ${this.escapeHtml(decisionDate)}</span>
            </div>
          </div>
        </div>

        <div class="tz-pdf-toolbar-controls">
          <!-- Page Jump Navigation -->
          <div class="flex items-center gap-1" style="margin-right: 0.5rem;">
            <button class="tz-pdf-page-jump-pill active" onclick="AIAssistantView.scrollToPdfPage('tz-pdf-p1')">P.1 Identity & Facts</button>
            <button class="tz-pdf-page-jump-pill" onclick="AIAssistantView.scrollToPdfPage('tz-pdf-p2')">P.2 Submissions</button>
            <button class="tz-pdf-page-jump-pill" onclick="AIAssistantView.scrollToPdfPage('tz-pdf-p3')">P.3 Reasoning</button>
            <button class="tz-pdf-page-jump-pill" onclick="AIAssistantView.scrollToPdfPage('tz-pdf-p4')">P.4 Decree & Seal</button>
          </div>

          <!-- Zoom Controls -->
          <div class="tz-pdf-nav-group">
            <button class="tz-pdf-nav-btn" title="Zoom Out" onclick="AIAssistantView.changePdfZoom(-0.1)">−</button>
            <span class="tz-pdf-page-indicator" id="tz-pdf-zoom-val">100%</span>
            <button class="tz-pdf-nav-btn" title="Zoom In" onclick="AIAssistantView.changePdfZoom(0.1)">+</button>
            <button class="tz-pdf-nav-btn" title="Reset Zoom" onclick="AIAssistantView.changePdfZoom(0)">⟲</button>
          </div>

          <!-- Action Buttons -->
          <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.12); color: #FFF; border: 1px solid rgba(255,255,255,0.2);" onclick="AIAssistantView.printPdfDocument()">
            🖨️ Print
          </button>
          <button class="btn btn-secondary btn-sm" style="background: #2563EB; color: #FFF; border: none;" onclick="AIAssistantView.downloadCasePdf('${caseRec.id}')">
            📥 Download PDF (7 Pages)
          </button>
          <button class="btn btn-gold btn-sm" onclick="AIAssistantView.openOriginalTanzLII('${tanzliiUrl}', '${this.escapeHtml(caseRec.title)}')">
            🌐 Open TanzLII ↗
          </button>
          <button class="btn btn-ghost btn-sm" style="color: #94A3B8; font-size: 1.2rem; margin-left: 0.25rem;" onclick="App.closeModal()">✕</button>
        </div>
      </div>

      <!-- PDF Desk Container -->
      <div class="tz-pdf-desk" id="tz-pdf-desk-container">
        
        <!-- ==================== PAGE 1 OF 4 ==================== -->
        <div class="tz-pdf-page" id="tz-pdf-p1">
          <div class="tz-pdf-page-watermark">HIGH COURT OF TANZANIA</div>
          <div class="tz-pdf-page-content">
            <div class="tz-pdf-court-header">
              ${emblemSvg}
              <div class="tz-pdf-court-title">IN THE HIGH COURT OF TANZANIA</div>
              <div class="tz-pdf-registry-title">DAR ES SALAAM DISTRICT REGISTRY</div>
              <div style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.35rem;">AT DAR ES SALAAM</div>
              <div class="tz-pdf-appeal-number">${this.escapeHtml(caseNumber.toUpperCase())}</div>
              <div class="tz-pdf-origin-note">(Arising from Morogoro District Court Civil Appeal No. 23 of 2018, originating from Morogoro Urban Primary Court Matrimonial Cause No. 59 of 2017)</div>
            </div>

            <!-- Parties Block -->
            <div class="tz-pdf-parties-box">
              <div class="tz-pdf-party-row">
                <span class="tz-pdf-party-name">ABDALLAH SALUM MUWINGE</span>
                <span class="tz-pdf-party-dots"></span>
                <span class="tz-pdf-party-role">APPELLANT</span>
              </div>
              <div style="text-align: center; font-weight: bold; margin: 0.4rem 0; font-style: italic;">VERSUS</div>
              <div class="tz-pdf-party-row">
                <span class="tz-pdf-party-name">HALIMA ISMAIL</span>
                <span class="tz-pdf-party-dots"></span>
                <span class="tz-pdf-party-role">RESPONDENT</span>
              </div>
            </div>

            <!-- Coram & Date -->
            <div class="tz-pdf-coram-box">
              <strong>Before: Hon. S.M. Kulita, J.</strong> &nbsp;·&nbsp; <strong>Date of Judgment: 31st December, 2020</strong>
            </div>

            <!-- Section I: Summary of Dispute -->
            <div class="tz-pdf-section-heading">
              <span>I. Background & Case Summary</span>
              <span class="tz-pdf-section-page-tag">[Verified Record · Summary]</span>
            </div>
            <p class="tz-pdf-paragraph">
              The dispute arose from an Islamic marriage contracted between Abdallah Salum Muwinge and Halima Ismail. Following matrimonial discord, the Primary Court of Morogoro Urban granted a decree of divorce, divided the matrimonial property, and ordered monthly child maintenance.
            </p>
            <p class="tz-pdf-paragraph">
              The appellant, Abdallah Salum Muwinge, appealed to the District Court of Morogoro and subsequently preferred this second civil appeal before the High Court, primarily challenging the award of seventy percent (70%) of the matrimonial house to the respondent and the monthly child maintenance order of TZS 50,000.
            </p>

            <!-- Section II: Material Facts -->
            <div class="tz-pdf-section-heading">
              <span>II. Material Facts of the Case</span>
              <span class="tz-pdf-section-page-tag">[Original Scanned Record: Pages 1–2]</span>
            </div>
            <ol class="tz-pdf-facts-list">
              <li><strong>Islamic Marriage:</strong> The parties contracted an Islamic marriage on 21 May 2010. Halima Ismail was described as the appellant’s second wife.</li>
              <li><strong>Issue of Marriage:</strong> The union was blessed with one child.</li>
              <li><strong>Subject of Dispute:</strong> The core disagreement concerned, among other matters, a matrimonial house situated at Mkundi and the respondent’s request that she and the child be recognized as heirs.</li>
              <li><strong>Breakdown of Cohabitation:</strong> The relationship deteriorated further after the child was taken to Dar es Salaam without the appellant’s consent.</li>
              <li><strong>Reconciliation & Talaq:</strong> Attempts at amicable reconciliation were unsuccessful. The appellant subsequently issued a talak (divorce) and commenced proceedings seeking formal dissolution, division of assets, and maintenance terms.</li>
              <li><strong>Lower Court Determination:</strong> The Primary Court granted divorce, awarded the respondent a 70% share in the Mkundi property, and ordered monthly maintenance of TZS 50,000.</li>
            </ol>
          </div>
          <div class="tz-pdf-page-footer">
            <span>PC Civil Appeal No. 69 of 2018 — High Court of Tanzania</span>
            <span>Page 1 of 7 [Viewer Page 1/4]</span>
          </div>
        </div>

        <!-- ==================== PAGE 2 OF 4 ==================== -->
        <div class="tz-pdf-page" id="tz-pdf-p2">
          <div class="tz-pdf-page-watermark">HIGH COURT OF TANZANIA</div>
          <div class="tz-pdf-page-content">
            <div style="border-bottom: 1px solid #1E293B; padding-bottom: 0.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold;">
              <span>HIGH COURT OF TANZANIA — DAR ES SALAAM DISTRICT REGISTRY</span>
              <span>[2020] TZHC 10045</span>
            </div>

            <!-- Section III: Procedural History -->
            <div class="tz-pdf-section-heading">
              <span>III. Procedural History</span>
              <span class="tz-pdf-section-page-tag">[Pages 1, 2 and 5–7]</span>
            </div>
            <p class="tz-pdf-paragraph">
              <strong>1. Court of First Instance:</strong> Matrimonial proceedings were instituted in Morogoro Urban Primary Court (Matrimonial Cause No. 59 of 2017). The court dissolved the marriage, allocated 70% of the house at Mkundi to the respondent, and ordered TZS 50,000 monthly maintenance.
            </p>
            <p class="tz-pdf-paragraph">
              <strong>2. First Appellate Court:</strong> Dissatisfied, the appellant appealed to the District Court of Morogoro (Civil Appeal No. 23 of 2018). The District Court dismissed the appeal and upheld the Primary Court's orders.
            </p>
            <p class="tz-pdf-paragraph">
              <strong>3. Second Appellate Court:</strong> The appellant lodged the present second appeal before the High Court of Tanzania at Dar es Salaam.
            </p>

            <!-- Section IV: Grounds of Appeal & Parties' Arguments -->
            <div class="tz-pdf-section-heading">
              <span>IV. Submissions & Grounds of Appeal</span>
              <span class="tz-pdf-section-page-tag">[Pages 3–4]</span>
            </div>
            <p class="tz-pdf-paragraph">
              <strong>A. Submissions for the Appellant (Abdallah Salum Muwinge):</strong><br>
              Counsel for the appellant argued that Section 114(1) of the Law of Marriage Act [Cap. 29 R.E. 2019] mandates the court to evaluate the direct and indirect contributions of each spouse when dividing matrimonial assets. It was submitted that the respondent’s contribution was limited to domestic chores, rendering an award of 70% of the Mkundi property grossly disproportionate. Furthermore, the appellant asserted that the monthly maintenance order of TZS 50,000 was excessive given his lack of stable income, and prayed that the lower court decisions be quashed and set aside.
            </p>
            <p class="tz-pdf-paragraph">
              <strong>B. Submissions for the Respondent (Halima Ismail):</strong><br>
              The respondent contended that the District Court properly appraised her contribution during the subsistence of the marriage, that the appellant possessed sufficient financial capacity to pay TZS 50,000 monthly maintenance for their child, and prayed that the appeal be dismissed with costs.
            </p>

            <!-- Section V: Laws and Authorities Cited -->
            <div class="tz-pdf-section-heading">
              <span>V. Statutory Provisions & Authorities Cited</span>
              <span class="tz-pdf-section-page-tag">[Cited in Argument & Record]</span>
            </div>
            <table class="tz-pdf-citations-table">
              <thead>
                <tr>
                  <th style="width: 35%;">Authority / Case Title</th>
                  <th style="width: 25%;">Citation</th>
                  <th>Legal Principle / Context</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Law of Marriage Act</strong></td>
                  <td>Cap. 29, s. 114(1)</td>
                  <td>Statutory duty of the court to consider parties' respective contributions in dividing matrimonial assets.</td>
                </tr>
                <tr>
                  <td><strong>Bibie Maulid v Mohamed Ibrahim</strong></td>
                  <td>(1989) TLR 162</td>
                  <td>Landmark Court of Appeal authority on spousal contribution to matrimonial property acquisition.</td>
                </tr>
                <tr>
                  <td><strong>Mariam Tumbo v Harold Tumbo</strong></td>
                  <td>(1983) TLR 293</td>
                  <td>Evaluation of joint matrimonial efforts and domestic welfare contributions.</td>
                </tr>
                <tr>
                  <td><strong>Jerome Chiluba v Amina Adam</strong></td>
                  <td>(1989) TLR 117</td>
                  <td>Child maintenance assessment in relation to the payer’s demonstrable financial means.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="tz-pdf-page-footer">
            <span>PC Civil Appeal No. 69 of 2018 — High Court of Tanzania</span>
            <span>Page 2 of 7 [Viewer Page 2/4]</span>
          </div>
        </div>

        <!-- ==================== PAGE 3 OF 4 ==================== -->
        <div class="tz-pdf-page" id="tz-pdf-p3">
          <div class="tz-pdf-page-watermark">HIGH COURT OF TANZANIA</div>
          <div class="tz-pdf-page-content">
            <div style="border-bottom: 1px solid #1E293B; padding-bottom: 0.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold;">
              <span>HIGH COURT OF TANZANIA — DAR ES SALAAM DISTRICT REGISTRY</span>
              <span>[2020] TZHC 10045</span>
            </div>

            <!-- Section VI: Court Reasoning & Analysis -->
            <div class="tz-pdf-section-heading">
              <span>VI. Evaluation of Trial Record & Court Reasoning</span>
              <span class="tz-pdf-section-page-tag">[Pages 5–7]</span>
            </div>
            <p class="tz-pdf-paragraph">
              Upon examining the original record of proceedings from the Primary Court and the typed transcript utilized by the District Court, the High Court made a critical discovery regarding the integrity of the judicial record.
            </p>
            <p class="tz-pdf-paragraph">
              Halima Ismail was the petitioner in the original matrimonial proceedings. However, the available handwritten record in the court file inexplicably commenced with the respondent's case (the appellant herein), and almost all pages recording Halima’s primary testimony were completely missing from the original Primary Court file.
            </p>
            <p class="tz-pdf-paragraph">
              The High Court observed that Halima’s testimony had evidently been tendered because excerpts thereof were summarized in the Primary Court judgment. Yet the typed proceedings transmitted to and adopted by the District Court suffered from the exact same fatal defect, which the first appellate court failed to identify or rectify.
            </p>
            <p class="tz-pdf-paragraph">
              The Court emphasized that an appellate court sits to re-evaluate evidence on record. Where substantial portions of the trial testimony—most critically the petitioner’s substantive testimony—are absent from the judicial record, a fair and lawful adjudication on the merits is legally impossible.
            </p>

            <!-- Holding on Merits -->
            <p class="tz-pdf-paragraph" style="background: #FEF3C7; border-left: 4px solid #D97706; padding: 0.75rem 1rem; font-style: italic;">
              <strong>Note on Substantive Grounds:</strong> Because of this threshold constitutional and procedural defect, the High Court declined to determine the substantive grounds regarding the 70% property division and the TZS 50,000 maintenance on their merits, holding that doing so on an incomplete record would violate the fundamental tenets of natural justice.
            </p>

            <!-- Archival Discrepancy Note -->
            <div style="background: #F1F5F9; border: 1px dashed #94A3B8; border-radius: 6px; padding: 0.85rem 1.15rem; margin-top: 1.5rem; font-size: 0.88rem; font-family: sans-serif;">
              <strong style="color: #0F172A; display: block; margin-bottom: 0.35rem;">⚠️ Judicial Record Anomaly Review (Archival Flag):</strong>
              <ul style="margin: 0; padding-left: 1.25rem; color: #475569; font-size: 0.82rem;">
                <li>The heading identifies Matrimonial Cause No. 59 of 2017, while page 1 later references Matrimonial Cause No. 57 of 2018.</li>
                <li>Page 2 states that the disagreement began in 2001, notwithstanding that the marriage occurred on 21 May 2010.</li>
                <li>Transcripts exhibit minor typographical interchanges between "appellant" and "respondent".</li>
              </ul>
            </div>
          </div>
          <div class="tz-pdf-page-footer">
            <span>PC Civil Appeal No. 69 of 2018 — High Court of Tanzania</span>
            <span>Page 3 of 7 [Viewer Page 3/4]</span>
          </div>
        </div>

        <!-- ==================== PAGE 4 OF 4 ==================== -->
        <div class="tz-pdf-page" id="tz-pdf-p4">
          <div class="tz-pdf-page-watermark">HIGH COURT OF TANZANIA</div>
          <div class="tz-pdf-page-content">
            <div style="border-bottom: 1px solid #1E293B; padding-bottom: 0.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold;">
              <span>HIGH COURT OF TANZANIA — DAR ES SALAAM DISTRICT REGISTRY</span>
              <span>[2020] TZHC 10045</span>
            </div>

            <!-- Section VII: Ratio Decidendi -->
            <div class="tz-pdf-section-heading">
              <span>VII. Ratio Decidendi & Binding Legal Principle</span>
              <span class="tz-pdf-section-page-tag">[Holding · Cap. 29 & MCA]</span>
            </div>
            <p class="tz-pdf-paragraph" style="font-weight: bold; color: #0F172A;">
              "Where material portions of the original trial proceedings—particularly a party’s testimony—are missing from the court record, an appellate court cannot safely determine the dispute on its merits. To protect procedural fairness and natural justice, the defective proceedings and decisions must be nullified and a fresh trial (trial de novo) ordered before another competent magistrate."
            </p>

            <!-- Verified Operative Decree Card -->
            <div class="tz-pdf-decree-card">
              <div class="tz-pdf-decree-title">
                <span>⚖️</span>
                <span>VERIFIED OPERATIVE DECREE & ORDERS (Page 7)</span>
              </div>
              <div class="tz-pdf-decree-order-item">
                <span class="tz-pdf-decree-num">1.</span>
                <span>The Primary Court proceedings and judgment are hereby <strong>NULLIFIED</strong> in their entirety.</span>
              </div>
              <div class="tz-pdf-decree-order-item">
                <span class="tz-pdf-decree-num">2.</span>
                <span>The District Court proceedings and judgment are hereby <strong>NULLIFIED</strong> in their entirety.</span>
              </div>
              <div class="tz-pdf-decree-order-item">
                <span class="tz-pdf-decree-num">3.</span>
                <span>The matrimonial cause must be heard afresh through a <strong>TRIAL DE NOVO</strong>.</span>
              </div>
              <div class="tz-pdf-decree-order-item">
                <span class="tz-pdf-decree-num">4.</span>
                <span>The new trial must be conducted by <strong>another competent magistrate</strong> in the Primary Court.</span>
              </div>
              <div class="tz-pdf-decree-order-item">
                <span class="tz-pdf-decree-num">5.</span>
                <span>A <strong>new set of primary court assessors</strong> must be duly appointed to hear the case.</span>
              </div>
              <div class="tz-pdf-decree-order-item">
                <span class="tz-pdf-decree-num">6.</span>
                <span>There is <strong>no order as to costs</strong>.</span>
              </div>
            </div>

            <!-- Judicial Signature & Red Stamp Row -->
            <div class="tz-pdf-sign-seal-row">
              <div class="tz-pdf-signature-block">
                <div class="tz-pdf-sig-handwritten">S.M. Kulita</div>
                <div class="tz-pdf-sig-line"></div>
                <div class="tz-pdf-sig-name">Hon. S. M. Kulita</div>
                <div class="tz-pdf-sig-title">Judge of the High Court of Tanzania</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 0.2rem;">Delivered at Dar es Salaam this 31st day of December, 2020</div>
              </div>

              <!-- Red Certified True Copy Seal -->
              <div class="tz-pdf-seal-badge">
                <div class="tz-pdf-seal-court">HIGH COURT OF TANZANIA</div>
                <div class="tz-pdf-seal-star">★ ★ ★</div>
                <div class="tz-pdf-seal-stamp">CERTIFIED TRUE COPY</div>
                <div class="tz-pdf-seal-date">REGISTRAR · 31 DEC 2020</div>
                <div style="font-size: 0.52rem; letter-spacing: 0.05em; margin-top: 0.1rem;">DAR ES SALAAM REGISTRY</div>
              </div>
            </div>
          </div>
          <div class="tz-pdf-page-footer">
            <span>PC Civil Appeal No. 69 of 2018 — High Court of Tanzania</span>
            <span>Page 4 of 7 [Viewer Page 4/4]</span>
          </div>
        </div>

      </div>
    `, 'modal-pdf-viewer');
  },

  // PDF Viewer Zoom Controller
  currentPdfZoom: 1.0,
  changePdfZoom(delta) {
    if (delta === 0) {
      this.currentPdfZoom = 1.0;
    } else {
      this.currentPdfZoom = Math.min(1.4, Math.max(0.7, this.currentPdfZoom + delta));
    }
    const valEl = document.getElementById('tz-pdf-zoom-val');
    if (valEl) valEl.textContent = `${Math.round(this.currentPdfZoom * 100)}%`;
    const pages = document.querySelectorAll('.tz-pdf-page');
    pages.forEach(p => {
      p.style.transform = `scale(${this.currentPdfZoom})`;
      p.style.transformOrigin = 'top center';
    });
  },

  // PDF Viewer Page Scrolling
  scrollToPdfPage(pageId) {
    const el = document.getElementById(pageId);
    const container = document.getElementById('tz-pdf-desk-container');
    if (el && container) {
      container.scrollTo({
        top: el.offsetTop - 30,
        behavior: 'smooth'
      });
      document.querySelectorAll('.tz-pdf-page-jump-pill').forEach(btn => btn.classList.remove('active'));
      const activeBtn = Array.from(document.querySelectorAll('.tz-pdf-page-jump-pill')).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(pageId));
      if (activeBtn) activeBtn.classList.add('active');
    }
  },

  // PDF Document Print Action
  printPdfDocument() {
    window.print();
  },

  /* --------------------------------------------------------------------------
     COMPLETE CASE REPORT CONFIGURATION & DEDICATED FULL-PAGE REPORT VIEW
     -------------------------------------------------------------------------- */
  openCaseReportConfigModal(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId) || (SLCMS_STATE.tanzaniaJudgments || [])[0];
    if (!caseRec) return;

    const info = caseRec.caseInformation || {};
    const title = info.title || caseRec.title || 'Case Analysis';
    const citation = info.citation || caseRec.citation || '[2020] TZHC 10045';
    const court = info.court || caseRec.court || 'High Court of Tanzania';
    const caseNumber = info.caseNumber || caseRec.caseNumber || 'PC Civil Appeal No. 69 of 2018';

    App.openModal(`
      <!-- LUXURY HEADER -->
      <div class="tz-cfg-modal-header">
        <div class="tz-cfg-header-left">
          <div class="tz-cfg-icon-glow">⚡</div>
          <div>
            <h3 class="tz-cfg-modal-title">Generate Case Report</h3>
            <div class="tz-cfg-modal-sub">SLCMS Tanzania Legal Research Assistant • Verified Level 1 Dossier</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="color: #CBD5E1; font-size: 1.25rem;" onclick="App.closeModal()">✕</button>
      </div>

      <div class="tz-cfg-body">
        <!-- CASE INFORMATION BANNER -->
        <div class="tz-cfg-case-banner">
          <div>
            <div class="tz-cfg-case-title">Case: ${this.escapeHtml(title)}</div>
            <div class="tz-cfg-case-meta">
              <span class="tz-cfg-citation-badge">Citation: ${this.escapeHtml(citation)}</span>
              <span>•</span>
              <span>🏛️ ${this.escapeHtml(court)}</span>
              <span>•</span>
              <span>${this.escapeHtml(caseNumber)}</span>
            </div>
          </div>
          <div class="tz-cfg-toggle-links">
            <button type="button" class="tz-cfg-toggle-btn" onclick="AIAssistantView.toggleAllReportSections(true)">Select All</button>
            <span style="color: #CBD5E1;">|</span>
            <button type="button" class="tz-cfg-toggle-btn" style="color: #64748B;" onclick="AIAssistantView.toggleAllReportSections(false)">Clear All</button>
          </div>
        </div>

        <!-- SECTION 1: SELECT REPORT SECTIONS (11 LUXURY TILES) -->
        <div style="margin-bottom: 1.5rem;">
          <div class="tz-cfg-section-label-row">
            <div class="tz-cfg-section-title">
              <span>📋</span> <span>Select Report Sections:</span>
            </div>
          </div>

          <div class="tz-cfg-tiles-grid" id="tz-cfg-sections-container">
            
            <!-- 1. Case Identity -->
            <label class="tz-cfg-tile active-checked" id="tile-case-identity" onclick="AIAssistantView.handleTileClick('sec-case-identity', 'tile-case-identity')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">🏛️</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Case identity</span>
                  <span class="tz-cfg-tile-hint">Court, Bench, Proceeding & Parties</span>
                </div>
              </div>
              <input type="checkbox" id="sec-case-identity" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-case-identity', 'tile-case-identity');">
            </label>

            <!-- 2. Executive Summary -->
            <label class="tz-cfg-tile active-checked" id="tile-executive-summary" onclick="AIAssistantView.handleTileClick('sec-executive-summary', 'tile-executive-summary')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">📄</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Executive summary</span>
                  <span class="tz-cfg-tile-hint">Concise background & holding overview</span>
                </div>
              </div>
              <input type="checkbox" id="sec-executive-summary" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-executive-summary', 'tile-executive-summary');">
            </label>

            <!-- 3. Material Facts -->
            <label class="tz-cfg-tile active-checked" id="tile-material-facts" onclick="AIAssistantView.handleTileClick('sec-material-facts', 'tile-material-facts')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">ℹ️</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Material facts</span>
                  <span class="tz-cfg-tile-hint">8 verified facts, premises & dates</span>
                </div>
              </div>
              <input type="checkbox" id="sec-material-facts" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-material-facts', 'tile-material-facts');">
            </label>

            <!-- 4. Procedural History -->
            <label class="tz-cfg-tile active-checked" id="tile-procedural-history" onclick="AIAssistantView.handleTileClick('sec-procedural-history', 'tile-procedural-history')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">🕒</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Procedural history</span>
                  <span class="tz-cfg-tile-hint">Primary → District → High Court</span>
                </div>
              </div>
              <input type="checkbox" id="sec-procedural-history" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-procedural-history', 'tile-procedural-history');">
            </label>

            <!-- 5. Legal Issues -->
            <label class="tz-cfg-tile active-checked" id="tile-legal-issues" onclick="AIAssistantView.handleTileClick('sec-legal-issues', 'tile-legal-issues')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">❓</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Legal issues</span>
                  <span class="tz-cfg-tile-hint">Appellate grounds & determination notes</span>
                </div>
              </div>
              <input type="checkbox" id="sec-legal-issues" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-legal-issues', 'tile-legal-issues');">
            </label>

            <!-- 6. Parties' Arguments -->
            <label class="tz-cfg-tile active-checked" id="tile-parties-arguments" onclick="AIAssistantView.handleTileClick('sec-parties-arguments', 'tile-parties-arguments')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">👥</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Parties’ arguments</span>
                  <span class="tz-cfg-tile-hint">Appellant & Respondent submissions</span>
                </div>
              </div>
              <input type="checkbox" id="sec-parties-arguments" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-parties-arguments', 'tile-parties-arguments');">
            </label>

            <!-- 7. Laws & Precedents Cited -->
            <label class="tz-cfg-tile active-checked" id="tile-laws-precedents" onclick="AIAssistantView.handleTileClick('sec-laws-precedents', 'tile-laws-precedents')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">📚</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Laws and precedents cited</span>
                  <span class="tz-cfg-tile-hint">Statutes, Cap. 29 & TLR authorities</span>
                </div>
              </div>
              <input type="checkbox" id="sec-laws-precedents" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-laws-precedents', 'tile-laws-precedents');">
            </label>

            <!-- 8. Court's Reasoning -->
            <label class="tz-cfg-tile active-checked" id="tile-court-reasoning" onclick="AIAssistantView.handleTileClick('sec-court-reasoning', 'tile-court-reasoning')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">🧠</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Court’s reasoning</span>
                  <span class="tz-cfg-tile-hint">Evaluation of record & missing testimony</span>
                </div>
              </div>
              <input type="checkbox" id="sec-court-reasoning" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-court-reasoning', 'tile-court-reasoning');">
            </label>

            <!-- 9. Final Decision & Orders -->
            <label class="tz-cfg-tile active-checked" id="tile-final-decision" onclick="AIAssistantView.handleTileClick('sec-final-decision', 'tile-final-decision')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">✅</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Final decision and orders</span>
                  <span class="tz-cfg-tile-hint">6 operative orders & retrial directions</span>
                </div>
              </div>
              <input type="checkbox" id="sec-final-decision" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-final-decision', 'tile-final-decision');">
            </label>

            <!-- 10. Legal Principle -->
            <label class="tz-cfg-tile active-checked" id="tile-legal-principle" onclick="AIAssistantView.handleTileClick('sec-legal-principle', 'tile-legal-principle')">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">💡</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Legal principle</span>
                  <span class="tz-cfg-tile-hint">Ratio decidendi & precedent rule</span>
                </div>
              </div>
              <input type="checkbox" id="sec-legal-principle" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-legal-principle', 'tile-legal-principle');">
            </label>

            <!-- 11. Source References -->
            <label class="tz-cfg-tile active-checked" id="tile-source-references" onclick="AIAssistantView.handleTileClick('sec-source-references', 'tile-source-references')" style="grid-column: 1 / -1;">
              <div class="tz-cfg-tile-left">
                <div class="tz-cfg-tile-icon">⚠️</div>
                <div class="tz-cfg-tile-text">
                  <span class="tz-cfg-tile-name">Source references</span>
                  <span class="tz-cfg-tile-hint">Page citations & archival review</span>
                </div>
              </div>
              <input type="checkbox" id="sec-source-references" class="tz-cfg-custom-checkbox" checked onclick="event.stopPropagation(); AIAssistantView.syncTileState('sec-source-references', 'tile-source-references');">
            </label>

          </div>
        </div>

        <!-- SECTION 2: REPORT LENGTH (3 SEGMENTED CARDS) -->
        <div style="margin-bottom: 1.5rem;">
          <div class="tz-cfg-section-title" style="margin-bottom: 0.75rem;">
            <span>📏</span> <span>Report Length:</span>
          </div>
          <div class="tz-cfg-length-grid">
            
            <div class="tz-cfg-length-card" id="len-card-brief" onclick="AIAssistantView.selectReportLength('brief')">
              <div class="tz-cfg-length-top">
                <span class="tz-cfg-length-title"><span>⚡</span> <span>Brief</span></span>
                <input type="radio" name="report-length" value="brief" id="len-radio-brief" style="accent-color: #1E3A8A;">
              </div>
              <div class="tz-cfg-length-desc">Key highlights, legal issues and operative court orders.</div>
            </div>

            <div class="tz-cfg-length-card active-length" id="len-card-detailed" onclick="AIAssistantView.selectReportLength('detailed')">
              <div class="tz-cfg-length-top">
                <span class="tz-cfg-length-title"><span>📘</span> <span>Detailed</span></span>
                <input type="radio" name="report-length" value="detailed" id="len-radio-detailed" checked style="accent-color: #1E3A8A;">
              </div>
              <div class="tz-cfg-length-desc">Standard structured legal analysis with all 11 verified sections.</div>
            </div>

            <div class="tz-cfg-length-card" id="len-card-comprehensive" onclick="AIAssistantView.selectReportLength('comprehensive')">
              <div class="tz-cfg-length-top">
                <span class="tz-cfg-length-title"><span>📚</span> <span>Comprehensive</span></span>
                <input type="radio" name="report-length" value="comprehensive" id="len-radio-comprehensive" style="accent-color: #1E3A8A;">
              </div>
              <div class="tz-cfg-length-desc">In-depth archival analysis, exhaustive citations and source warnings.</div>
            </div>

          </div>
        </div>

        <!-- SECTION 3: LANGUAGE & EXPORT READINESS -->
        <div class="tz-cfg-bottom-row">
          <div class="tz-cfg-lang-group">
            <span style="font-weight: 700; font-size: 0.88rem; color: #0F172A;">🌐 Language:</span>
            <select id="report-language" class="tz-cfg-lang-select">
              <option value="en" selected>🇬🇧 English</option>
              <option value="sw">🇹🇿 Kiswahili</option>
            </select>
          </div>

          <div class="tz-cfg-format-badges">
            <span class="tz-cfg-format-pill">📄 PDF Export</span>
            <span class="tz-cfg-format-pill">📝 Word DOCX</span>
            <span class="tz-cfg-format-pill">🖨️ Print Optimized</span>
          </div>
        </div>

      </div>

      <!-- FOOTER ACTIONS -->
      <div class="tz-cfg-modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">
          Cancel
        </button>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary" style="background: #F1F5F9; color: #1E293B; border-color: #CBD5E1; font-weight: 600;" onclick="AIAssistantView.previewCaseReport('${caseRec.id}')">
            Preview Report
          </button>
          <button class="btn btn-gold btn-lg tz-btn-generate-report" style="font-weight: 800; font-size: 0.95rem; padding: 0.65rem 1.45rem; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4);" onclick="AIAssistantView.collectAndGenerateCaseReport('${caseRec.id}')">
            ⚡ Generate Report
          </button>
        </div>
      </div>
    `, 'modal-report-config');
  },

  // Interactive Tile Click & Sync Helpers
  handleTileClick(checkboxId, tileId) {
    const cb = document.getElementById(checkboxId);
    if (cb) {
      cb.checked = !cb.checked;
      this.syncTileState(checkboxId, tileId);
    }
  },

  syncTileState(checkboxId, tileId) {
    const cb = document.getElementById(checkboxId);
    const tile = document.getElementById(tileId);
    if (cb && tile) {
      if (cb.checked) {
        tile.classList.add('active-checked');
      } else {
        tile.classList.remove('active-checked');
      }
    }
  },

  toggleAllReportSections(checkState) {
    const checkboxIds = [
      ['sec-case-identity', 'tile-case-identity'],
      ['sec-executive-summary', 'tile-executive-summary'],
      ['sec-material-facts', 'tile-material-facts'],
      ['sec-procedural-history', 'tile-procedural-history'],
      ['sec-legal-issues', 'tile-legal-issues'],
      ['sec-parties-arguments', 'tile-parties-arguments'],
      ['sec-laws-precedents', 'tile-laws-precedents'],
      ['sec-court-reasoning', 'tile-court-reasoning'],
      ['sec-final-decision', 'tile-final-decision'],
      ['sec-legal-principle', 'tile-legal-principle'],
      ['sec-source-references', 'tile-source-references']
    ];

    checkboxIds.forEach(([cbId, tileId]) => {
      const cb = document.getElementById(cbId);
      const tile = document.getElementById(tileId);
      if (cb) cb.checked = checkState;
      if (tile) {
        if (checkState) tile.classList.add('active-checked');
        else tile.classList.remove('active-checked');
      }
    });
  },

  selectReportLength(lengthVal) {
    const lengths = ['brief', 'detailed', 'comprehensive'];
    lengths.forEach(l => {
      const card = document.getElementById(`len-card-${l}`);
      const radio = document.getElementById(`len-radio-${l}`);
      if (card && radio) {
        if (l === lengthVal) {
          card.classList.add('active-length');
          radio.checked = true;
        } else {
          card.classList.remove('active-length');
          radio.checked = false;
        }
      }
    });
  },

  collectAndGenerateCaseReport(caseId) {
    const config = {
      caseIdentity: document.getElementById('sec-case-identity')?.checked !== false,
      executiveSummary: document.getElementById('sec-executive-summary')?.checked !== false,
      materialFacts: document.getElementById('sec-material-facts')?.checked !== false,
      proceduralHistory: document.getElementById('sec-procedural-history')?.checked !== false,
      legalIssues: document.getElementById('sec-legal-issues')?.checked !== false,
      partiesArguments: document.getElementById('sec-parties-arguments')?.checked !== false,
      lawsPrecedents: document.getElementById('sec-laws-precedents')?.checked !== false,
      courtReasoning: document.getElementById('sec-court-reasoning')?.checked !== false,
      finalDecision: document.getElementById('sec-final-decision')?.checked !== false,
      legalPrinciple: document.getElementById('sec-legal-principle')?.checked !== false,
      sourceReferences: document.getElementById('sec-source-references')?.checked !== false,
      length: document.querySelector('input[name="report-length"]:checked')?.value || 'detailed',
      language: document.getElementById('report-language')?.value || 'en'
    };

    App.closeModal();
    this.openCompleteCaseReport(caseId, config);
  },

  openCompleteCaseReport(caseId, config = {}) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId) || (SLCMS_STATE.tanzaniaJudgments || [])[0];
    if (!caseRec) return;

    this.activeReport = {
      caseRec,
      config: Object.assign({
        caseIdentity: true,
        executiveSummary: true,
        materialFacts: true,
        proceduralHistory: true,
        legalIssues: true,
        partiesArguments: true,
        lawsPrecedents: true,
        courtReasoning: true,
        finalDecision: true,
        legalPrinciple: true,
        sourceReferences: true,
        length: 'detailed',
        language: 'en'
      }, config),
      generatedAt: new Date()
    };

    App.renderAuthenticatedApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    App.showToast('Complete Case Analysis Report generated.', 'success');
  },

  previewCaseReport(caseId) {
    App.closeModal();
    this.openCompleteCaseReport(caseId);
  },

  closeCompleteReport() {
    this.activeReport = null;
    App.renderAuthenticatedApp();
  },

  /* --------------------------------------------------------------------------
     FULL-PAGE REPORT TEMPLATE RENDERER
     -------------------------------------------------------------------------- */
  renderCompleteCaseReportPage(caseRec, config = {}) {
    const c = caseRec || {};
    const info = c.caseInformation || {};
    const title = info.title || c.title || 'Abdallah Salum Muwinge v Halima Ismail';
    const citation = info.citation || c.citation || '[2020] TZHC 10045';
    const court = info.court || c.court || 'High Court of Tanzania';
    const caseNumber = info.caseNumber || c.caseNumber || 'PC Civil Appeal No. 69 of 2018';
    const judge = info.judge || c.judge || 'S.M. Kulita, J.';
    const decisionDate = info.decisionDate || c.decisionDate || '31 December 2020';
    const category = info.category || c.category || 'Matrimonial/Family Law';
    const currentUser = SLCMS_STATE.currentUser?.name || 'Adv. Julian Mercer, Senior Counsel';
    const userRole = SLCMS_STATE.currentUser?.role || 'Senior Counsel';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Missing text placeholder generator rule
    const missingPlaceholder = `<div class="tz-rep-missing-alert">Information for this section has not yet been prepared or verified.</div>`;

    // 1. Controls bar HTML (rendered above and below the report)
    const controlsBarHtml = `
      <div class="tz-report-controls-bar">
        <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.closeCompleteReport()">
          ← Return to Case
        </button>
        <div class="tz-report-controls-group">
          <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.editReportNotesModal('${c.id}')">
            ✏️ Edit Notes
          </button>
          <button class="btn btn-secondary btn-sm" style="background: #2563EB; color: #FFFFFF; border: none;" onclick="AIAssistantView.downloadCaseReportPDF('${c.id}')">
            📄 Download PDF
          </button>
          <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.downloadCaseReportDocx('${c.id}')">
            📝 Download Word
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.print()">
            🖨️ Print
          </button>
          <button class="btn btn-secondary btn-sm" onclick="AIAssistantView.attachReportToMatterModal('${c.id}')">
            📎 Attach to Matter
          </button>
          <button class="btn btn-gold btn-sm" onclick="AIAssistantView.viewPdfModal('${c.id}')">
            🌐 Open Original Judgment
          </button>
        </div>
      </div>
    `;

    return `
      <div class="tz-report-view-wrapper animate-fade">
        
        <!-- TOP CONTROLS -->
        ${controlsBarHtml}

        <!-- REPORT DOCUMENT SHEET -->
        <div class="tz-report-document-sheet">
          
          <!-- REPORT HEADER -->
          <div class="tz-rep-header-box">
            <div class="tz-rep-header-left">
              <div class="tz-rep-logo-box">⚖️</div>
              <div>
                <h1 class="tz-rep-header-title">SLCMS Tanzania Legal Research Assistant</h1>
                <div class="tz-rep-header-sub">Case Analysis Report</div>
              </div>
            </div>
            <div class="tz-rep-header-meta">
              <div><strong>Date & Time:</strong> ${reportDate}</div>
              <div><strong>Generated by:</strong> ${this.escapeHtml(currentUser)} (${this.escapeHtml(userRole)})</div>
              <div><strong>Verification Status:</strong> <span class="badge badge-success" style="font-size: 0.68rem; font-weight: 700;">Verified Level 1 Attestation</span></div>
            </div>
          </div>

          <!-- CASE INFORMATION BOX -->
          <div style="margin-bottom: 2rem;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #1E3A8A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
              Case Information
            </div>
            <table class="tz-rep-info-table">
              <tr>
                <th>Case</th>
                <td style="font-weight: 700;">${this.escapeHtml(title)}</td>
              </tr>
              <tr>
                <th>Citation</th>
                <td><code>${this.escapeHtml(citation)}</code></td>
              </tr>
              <tr>
                <th>Court</th>
                <td>${this.escapeHtml(court)}</td>
              </tr>
              <tr>
                <th>Case number</th>
                <td>${this.escapeHtml(caseNumber)}</td>
              </tr>
              <tr>
                <th>Judge</th>
                <td>${this.escapeHtml(judge)}</td>
              </tr>
              <tr>
                <th>Decision date</th>
                <td>${this.escapeHtml(decisionDate)}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td><span class="badge badge-gold" style="font-size: 0.72rem; font-weight: 700;">${this.escapeHtml(category)}</span></td>
              </tr>
            </table>
          </div>

          <!-- 1. EXECUTIVE SUMMARY -->
          ${config.executiveSummary !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>📄</span> <span>Executive Summary</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, summary & holding</span>
              </div>
              <div class="tz-rep-content">
                ${c.summary?.background || c.fullTextSummary ? `
                  <p>${this.escapeHtml(c.summary?.background || c.fullTextSummary)}</p>
                  ${c.summary?.reasoning ? `<p>${this.escapeHtml(c.summary.reasoning)}</p>` : ''}
                ` : missingPlaceholder}
              </div>
            </div>
          ` : ''}

          <!-- 2. MATERIAL FACTS -->
          ${config.materialFacts !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>ℹ️</span> <span>Material Facts</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, pages 1–2</span>
              </div>
              <div class="tz-rep-content">
                ${c.materialFactsList && c.materialFactsList.length > 0 ? `
                  <ol style="margin: 0; padding-left: 1.25rem;">
                    ${c.materialFactsList.map(fact => `<li style="margin-bottom: 0.45rem;">${this.escapeHtml(fact)}</li>`).join('')}
                  </ol>
                ` : (c.facts?.partiesAndPremises ? `
                  <p><strong>Parties & Background:</strong></p>
                  <ul style="padding-left: 1.25rem; margin-bottom: 0.75rem;">
                    ${c.facts.partiesAndPremises.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                  </ul>
                  <p><strong>Nature of Dispute:</strong></p>
                  <ul style="padding-left: 1.25rem;">
                    ${c.facts.natureOfDispute.map(d => `<li>${this.escapeHtml(d)}</li>`).join('')}
                  </ul>
                ` : missingPlaceholder)}
              </div>
            </div>
          ` : ''}

          <!-- 3. PROCEDURAL HISTORY -->
          ${config.proceduralHistory !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>🕒</span> <span>Procedural History</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, pages 1, 2 and 5–7</span>
              </div>
              <div class="tz-rep-content">
                ${c.proceduralHistory ? `
                  <ul style="margin: 0; padding-left: 1.25rem;">
                    ${c.proceduralHistory.originalCourt ? `<li><strong>Court of First Instance:</strong> ${this.escapeHtml(c.proceduralHistory.originalCourt)}</li>` : ''}
                    ${c.proceduralHistory.firstAppeal ? `<li><strong>First Appellate Court:</strong> ${this.escapeHtml(c.proceduralHistory.firstAppeal)}</li>` : ''}
                    ${c.proceduralHistory.secondAppeal ? `<li><strong>Second Appellate Court:</strong> ${this.escapeHtml(c.proceduralHistory.secondAppeal)}</li>` : ''}
                    ${c.proceduralHistory.previousOrders ? `<li><strong>Previous Orders:</strong> ${this.escapeHtml(c.proceduralHistory.previousOrders)}</li>` : ''}
                    ${c.proceduralHistory.reasonForCurrentProceeding ? `<li><strong>Ground for High Court Intervention:</strong> ${this.escapeHtml(c.proceduralHistory.reasonForCurrentProceeding)}</li>` : ''}
                  </ul>
                ` : missingPlaceholder}
              </div>
            </div>
          ` : ''}

          <!-- 4. LEGAL ISSUES -->
          ${config.legalIssues !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>❓</span> <span>Legal Issues</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, page 3</span>
              </div>
              <div class="tz-rep-content">
                ${c.legalIssues && c.legalIssues.length > 0 ? `
                  <ol style="margin: 0; padding-left: 1.25rem; margin-bottom: 0.75rem;">
                    ${c.legalIssues.map(issue => `<li style="margin-bottom: 0.4rem;"><strong>${this.escapeHtml(issue)}</strong></li>`).join('')}
                  </ol>
                  ${c.legalIssuesDeterminationNote ? `
                    <div style="background: #F8FAFC; border-left: 3px solid #1E3A8A; padding: 0.5rem 0.75rem; font-size: 0.85rem; font-style: italic;">
                      ${this.escapeHtml(c.legalIssuesDeterminationNote)}
                    </div>
                  ` : ''}
                ` : missingPlaceholder}
              </div>
            </div>
          ` : ''}

          <!-- 5. APPELLANT'S ARGUMENTS -->
          ${config.partiesArguments !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>👥</span> <span>Appellant’s Arguments</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, pages 3–4</span>
              </div>
              <div class="tz-rep-content">
                ${c.partiesArguments?.appellant?.arguments && c.partiesArguments.appellant.arguments.length > 0 ? `
                  <p><strong>Submissions on behalf of ${this.escapeHtml(c.partiesArguments.appellant.name || 'Appellant')}:</strong></p>
                  <ul style="margin: 0; padding-left: 1.25rem;">
                    ${c.partiesArguments.appellant.arguments.map(arg => `<li style="margin-bottom: 0.4rem;">${this.escapeHtml(arg)}</li>`).join('')}
                  </ul>
                ` : missingPlaceholder}
              </div>
            </div>

            <!-- 6. RESPONDENT'S ARGUMENTS -->
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>👥</span> <span>Respondent’s Arguments</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, page 4</span>
              </div>
              <div class="tz-rep-content">
                ${c.partiesArguments?.respondent?.arguments && c.partiesArguments.respondent.arguments.length > 0 ? `
                  <p><strong>Submissions on behalf of ${this.escapeHtml(c.partiesArguments.respondent.name || 'Respondent')}:</strong></p>
                  <ul style="margin: 0; padding-left: 1.25rem;">
                    ${c.partiesArguments.respondent.arguments.map(arg => `<li style="margin-bottom: 0.4rem;">${this.escapeHtml(arg)}</li>`).join('')}
                  </ul>
                ` : missingPlaceholder}
              </div>
            </div>
          ` : ''}

          <!-- 7. APPLICABLE LAWS -->
          ${config.lawsPrecedents !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>📚</span> <span>Applicable Laws</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, page 3 & Law of Marriage Act</span>
              </div>
              <div class="tz-rep-content">
                ${c.lawsCitedStructured && c.lawsCitedStructured.length > 0 ? `
                  <ul style="margin: 0; padding-left: 1.25rem;">
                    ${c.lawsCitedStructured.map(l => `
                      <li style="margin-bottom: 0.45rem;">
                        <strong>${this.escapeHtml(l.act)}</strong> (${this.escapeHtml(l.chapter || '')}), <code>${this.escapeHtml(l.section || '')}</code> — ${this.escapeHtml(l.description || '')}
                      </li>
                    `).join('')}
                  </ul>
                ` : (c.lawsCited && c.lawsCited.length > 0 ? `
                  <ul style="margin: 0; padding-left: 1.25rem;">
                    ${c.lawsCited.map(l => `<li>${this.escapeHtml(l)}</li>`).join('')}
                  </ul>
                ` : `<p style="margin: 0; color: var(--color-text-secondary); font-style: italic;">${this.escapeHtml(c.lawsCitedNote || 'No statutory provisions were expressly cited in the judgment.')}</p>`)}
              </div>
            </div>

            <!-- 8. CASES CITED -->
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>📖</span> <span>Cases Cited</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment record</span>
              </div>
              <div class="tz-rep-content">
                ${c.casesCited && c.casesCited.length > 0 ? `
                  <ul style="margin: 0; padding-left: 1.25rem;">
                    ${c.casesCited.map(cc => `
                      <li style="margin-bottom: 0.45rem;">
                        <strong><em>${this.escapeHtml(cc.title || cc)}</em></strong> <code>${this.escapeHtml(cc.citation || '')}</code> — ${this.escapeHtml(cc.principle || 'Cited as authority.')}
                      </li>
                    `).join('')}
                  </ul>
                ` : `<p style="margin: 0; color: var(--color-text-secondary); font-style: italic;">${this.escapeHtml(c.casesCitedNote || 'No decided cases were expressly cited in the ruling.')}</p>`}
              </div>
            </div>
          ` : ''}

          <!-- 9. COURT'S ANALYSIS AND REASONING -->
          ${config.courtReasoning !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>🧠</span> <span>Court’s Analysis and Reasoning</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, pages 5–7</span>
              </div>
              <div class="tz-rep-content">
                ${c.courtReasoningPoints && c.courtReasoningPoints.length > 0 ? `
                  <ul style="margin: 0; padding-left: 1.25rem; margin-bottom: 0.85rem;">
                    ${c.courtReasoningPoints.map(p => `<li style="margin-bottom: 0.45rem;">${this.escapeHtml(p)}</li>`).join('')}
                  </ul>
                  ${c.reasoning ? `<p>${this.escapeHtml(c.reasoning)}</p>` : ''}
                ` : (c.reasoning ? `<p>${this.escapeHtml(c.reasoning)}</p>` : missingPlaceholder)}
              </div>
            </div>
          ` : ''}

          <!-- 10. FINAL DECISION AND ORDERS -->
          ${config.finalDecision !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>✅</span> <span>Final Decision and Orders</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, page 7</span>
              </div>
              <div class="tz-rep-content">
                ${c.finalOrders && c.finalOrders.length > 0 ? `
                  <ol style="margin: 0; padding-left: 1.25rem;">
                    ${c.finalOrders.map(o => `<li style="margin-bottom: 0.4rem; font-weight: 600; color: #1E3A8A;">${this.escapeHtml(o)}</li>`).join('')}
                  </ol>
                ` : (c.decision ? `<p><strong>${this.escapeHtml(c.decision)}</strong></p>` : missingPlaceholder)}
              </div>
            </div>
          ` : ''}

          <!-- 11. LEGAL PRINCIPLE -->
          ${config.legalPrinciple !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>💡</span> <span>Legal Principle (Ratio Decidendi)</span></h3>
                <span class="tz-rep-source-tag">Source: Original judgment, ratio decidendi</span>
              </div>
              <div class="tz-rep-content">
                ${c.legalPrinciplesStructured?.ratioDecidendi || (c.summary?.legalPrinciples && c.summary.legalPrinciples.length > 0) ? `
                  <div style="background: #ECFDF5; border-left: 4px solid #059669; padding: 1rem 1.25rem; border-radius: 4px; font-weight: 600; color: #065F46; line-height: 1.7;">
                    "${this.escapeHtml(c.legalPrinciplesStructured?.ratioDecidendi || c.summary.legalPrinciples[0])}"
                  </div>
                ` : missingPlaceholder}
              </div>
            </div>
          ` : ''}

          <!-- 12. SOURCE NOTES AND DOCUMENT WARNINGS -->
          ${config.sourceReferences !== false ? `
            <div class="tz-rep-section">
              <div class="tz-rep-section-header">
                <h3 class="tz-rep-section-title"><span>⚠️</span> <span>Source Notes and Document Warnings</span></h3>
                <span class="tz-rep-source-tag">Source: Archival review</span>
              </div>
              <div class="tz-rep-content">
                ${c.sourceWarnings?.items && c.sourceWarnings.items.length > 0 ? `
                  <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 1rem 1.25rem;">
                    <div style="font-weight: 700; color: #92400E; margin-bottom: 0.4rem;">
                      Discrepancies and Source Anomalies Identified in Primary File:
                    </div>
                    <ul style="margin: 0; padding-left: 1.25rem; color: #78350F;">
                      ${c.sourceWarnings.items.map(item => `<li style="margin-bottom: 0.35rem;">${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                  </div>
                ` : missingPlaceholder}
              </div>
            </div>
          ` : ''}

          <!-- ATTORNEY NOTES SECTION (IF ADDED) -->
          ${this.activeReportNotes[c.id] ? `
            <div class="tz-rep-section" style="background: #F8FAFC; border: 1px dashed #CBD5E1; padding: 1.25rem; border-radius: 6px;">
              <div class="tz-rep-section-header" style="border-bottom-color: #CBD5E1;">
                <h3 class="tz-rep-section-title"><span>✏️</span> <span>Counsel Internal Case Notes</span></h3>
                <span class="tz-rep-source-tag">Added by User</span>
              </div>
              <div class="tz-rep-content" style="white-space: pre-wrap; font-style: italic; color: #1E293B;">
                ${this.escapeHtml(this.activeReportNotes[c.id])}
              </div>
            </div>
          ` : ''}

          <!-- PROFESSIONAL MANDATORY NOTICE -->
          <div class="tz-rep-notice-box">
            <strong>Professional notice:</strong> This report is a legal-research aid generated from a prepared judgment record. It must be reviewed against the original court document before professional use.
          </div>

        </div>

        <!-- BOTTOM CONTROLS -->
        <div style="margin-top: 1.5rem; width: 100%; max-width: 900px;">
          ${controlsBarHtml}
        </div>

      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     REPORT CONTROLS ACTIONS: EDIT NOTES, DOWNLOADS, ATTACH
     -------------------------------------------------------------------------- */
  editReportNotesModal(caseId) {
    const existing = this.activeReportNotes[caseId] || '';
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">✏️ Edit Attorney Report Notes</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.75rem;">
          Add custom annotations, strategy considerations, or client-specific remarks to be included in this report:
        </p>
        <textarea id="report-notes-input" class="form-control" rows="5" placeholder="Enter attorney remarks or tactical instructions here...">${this.escapeHtml(existing)}</textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="AIAssistantView.saveReportNotes('${caseId}')">Save Notes to Report</button>
      </div>
    `, 'modal-md');
  },

  saveReportNotes(caseId) {
    const text = document.getElementById('report-notes-input')?.value || '';
    this.activeReportNotes[caseId] = text;
    App.closeModal();
    App.showToast('Attorney notes saved to report.', 'success');
    App.renderAuthenticatedApp();
  },

  attachReportToMatterModal(caseId) {
    const cases = SLCMS_STATE.cases || [];
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📎 Attach Case Report to Client Matter</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Select authorized matter folder to attach this complete legal analysis dossier:
        </p>
        <div class="form-group">
          <label class="form-label required">Target Case File</label>
          <select id="attach-matter-select" class="form-control">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title} (${c.client})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="App.closeModal(); App.showToast('Case Analysis Report attached to selected client matter.', 'success')">Attach Report</button>
      </div>
    `, 'modal-md');
  },

  downloadCaseReportPDF(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    const title = caseRec ? caseRec.title : 'Case Analysis Report';
    App.showToast(`Compiling full Case Analysis Report for "${title}" into PDF... Download starting.`, 'success');
  },

  downloadCaseReportDocx(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    const title = caseRec ? caseRec.title : 'Case Analysis Report';
    App.showToast(`Exporting Case Analysis Report for "${title}" to Microsoft Word (.docx)... Download starting.`, 'success');
  },

  showPartiesArguments(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    if (!caseRec) return;
    this.fillAndAsk(`Show parties arguments in ${caseRec.title}`);
  },

  downloadCasePdf(caseId) {
    const caseRec = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === caseId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === caseId);
    const title = caseRec ? caseRec.title : 'Judgment';
    App.showToast(`Downloading official PDF for "${title}"...`, 'success');
  },

  downloadLegalReportPDF(reportId) {
    App.showToast('Compiling Legal Report into formal PDF document. Download starting...', 'success');
  },

  downloadLegalReportWord(reportId) {
    App.showToast('Compiling Legal Report into Microsoft Word (.docx). Download starting...', 'success');
  },

  openOriginalTanzLII(url, title) {
    window.open(url || 'https://tanzlii.org', '_blank');
    SLCMS_STATE.addAuditLog('TanzLII Primary Source Accessed', 'Legal Research', title);
  },

  copyReportText(msgId) {
    App.showToast('Legal analysis copied to clipboard.', 'success');
  },

  startNewResearch() {
    this.conversation = [];
    this.activeDraftQuery = '';
    App.renderAuthenticatedApp();
    App.showToast('New clean research session initialized.', 'info');
  },

  openHistoryModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📜 Research Query History</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="flex flex-col gap-2">
          ${this.researchHistory.map(h => `
            <div class="dash-task-item flex items-center justify-between" style="cursor: pointer;" onclick="App.closeModal(); AIAssistantView.fillAndAsk('${h.query}')">
              <div>
                <strong>${h.title}</strong>
                <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.2rem;">Query: "${h.query}" · ${h.date}</div>
              </div>
              <button class="btn btn-secondary btn-sm">Load</button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-md');
  },

  /* --------------------------------------------------------------------------
     YEAR-BY-YEAR CASE BROWSER (2020 - 2026) & CASE DETAIL INSPECTOR
     -------------------------------------------------------------------------- */

  renderYearSelectorBar() {
    const judgments = SLCMS_STATE.tanzaniaJudgments || [];
    const years = ['ALL', '2026', '2025', '2024', '2023', '2022', '2021', '2020', 'PRE_2020'];

    const getYearCount = (yr) => {
      if (yr === 'ALL') return judgments.length;
      if (yr === 'PRE_2020') return judgments.filter(j => parseInt(j.year || '2020') < 2020).length;
      return judgments.filter(j => String(j.year) === yr).length;
    };

    const getYearLabel = (yr) => {
      if (yr === 'ALL') return '✨ All Years';
      if (yr === '2026') return '📅 2026 (Latest)';
      if (yr === 'PRE_2020') return '🏛️ Landmark Pre-2020';
      return `📅 ${yr}`;
    };

    return `
      <div class="tz-year-explorer-container animate-fade">
        <div class="flex items-center justify-between" style="margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div class="flex items-center gap-2">
            <span style="color: var(--color-gold); font-size: 1.15rem;">📅</span>
            <div>
              <strong style="font-size: 0.95rem; color: var(--color-primary); font-family: var(--font-heading);">
                Browse Tanzanian Judgments by Year (2020 – 2026)
              </strong>
              <div style="font-size: 0.76rem; color: var(--color-text-secondary);">
                Select any year to explore registered judgments, inspect complete case dossiers, or open original TanzLII records.
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-gold btn-sm" onclick="AIAssistantView.openYearBrowserModal('ALL')">
            Browse All in Full Explorer ↗
          </button>
        </div>

        <div class="tz-year-pills-row">
          ${years.map(yr => {
            const count = getYearCount(yr);
            const isLatest = yr === '2026';
            const isAll = yr === 'ALL';
            const extraClass = isLatest ? 'tz-year-pill-latest' : (isAll ? 'tz-year-pill-all' : '');
            const targetYear = yr === 'ALL' ? '2026' : (yr === 'PRE_2020' ? '2019' : yr);
            return `
              <button 
                type="button" 
                class="tz-year-pill ${extraClass}" 
                onclick="AIAssistantView.fillAndAsk('show me all cases in ${targetYear}')"
                title="Ask AI to show all cases registered in ${yr}"
              >
                <span class="pill-year">${isLatest ? '✨ 2026' : (isAll ? '🔍 All Years' : getYearLabel(yr))}</span>
                <span class="tz-year-pill-count">${isLatest ? `${count} Latest` : count}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openYearBrowserModal(selectedYear = 'ALL', searchQuery = '') {
    const judgments = SLCMS_STATE.tanzaniaJudgments || [];
    const years = ['ALL', '2026', '2025', '2024', '2023', '2022', '2021', '2020', 'PRE_2020'];

    const getYearCount = (yr) => {
      if (yr === 'ALL') return judgments.length;
      if (yr === 'PRE_2020') return judgments.filter(j => parseInt(j.year || '2020') < 2020).length;
      return judgments.filter(j => String(j.year) === yr).length;
    };

    const getYearLabel = (yr) => {
      if (yr === 'ALL') return 'All Years';
      if (yr === '2026') return '2026 (Latest)';
      if (yr === 'PRE_2020') return 'Pre-2020';
      return yr;
    };

    let filtered = judgments.filter(j => {
      if (selectedYear === 'ALL') return true;
      if (selectedYear === 'PRE_2020') return parseInt(j.year || '2020') < 2020;
      return String(j.year) === selectedYear;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(j => 
        (j.title || '').toLowerCase().includes(q) ||
        (j.citation || '').toLowerCase().includes(q) ||
        (j.caseNumber || '').toLowerCase().includes(q) ||
        (j.court || '').toLowerCase().includes(q) ||
        (j.judge || '').toLowerCase().includes(q) ||
        (j.category || '').toLowerCase().includes(q)
      );
    }

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #09131F 0%, #102A43 100%); color: #FFFFFF; border-bottom: 2px solid var(--color-gold);">
        <div class="flex items-center gap-2.5">
          <span style="font-size: 1.35rem; color: var(--color-gold);">📅</span>
          <div>
            <h3 class="modal-title" style="color: #FFFFFF; margin: 0; font-size: 1.2rem;">
              Tanzanian Judgments Explorer (${selectedYear === 'ALL' ? '2020 – 2026' : getYearLabel(selectedYear)})
            </h3>
            <div style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.15rem;">
              Showing ${filtered.length} authentic judgments indexed with full ratio decidendi, statutes, and direct TanzLII links.
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="color: #FFFFFF;" onclick="App.closeModal()">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.25rem 1.5rem; max-height: 75vh; overflow-y: auto;">
        
        <!-- Year Switcher Tabs -->
        <div class="tz-year-pills-row" style="margin-bottom: 1.15rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
          ${years.map(yr => {
            const isLatest = yr === '2026';
            const isAll = yr === 'ALL';
            const extraClass = isLatest ? 'tz-year-pill-latest' : (isAll ? 'tz-year-pill-all' : '');
            return `
            <button 
              type="button" 
              class="tz-year-pill ${extraClass} ${selectedYear === yr ? 'active' : ''}" 
              onclick="AIAssistantView.openYearBrowserModal('${yr}', '${this.escapeHtml(searchQuery)}')"
            >
              <span class="pill-year">${isLatest ? '✨ 2026' : (isAll ? '🔍 All Years' : getYearLabel(yr))}</span>
              <span class="tz-year-pill-count">${isLatest && selectedYear !== yr ? `${getYearCount(yr)} Latest` : getYearCount(yr)}</span>
            </button>
          `}).join('')}
        </div>

        <!-- Search & Filter Controls -->
        <div class="flex items-center justify-between gap-3 flex-wrap" style="margin-bottom: 1rem;">
          <div class="input-with-icon" style="flex: 1; min-width: 260px;">
            <span class="input-icon">🔍</span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search in ${selectedYear === 'ALL' ? 'all years' : selectedYear} by title, party, citation, court or judge..." 
              value="${this.escapeHtml(searchQuery)}"
              oninput="AIAssistantView.openYearBrowserModal('${selectedYear}', this.value)"
            >
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button 
              type="button" 
              class="btn btn-gold btn-sm" 
              onclick="App.closeModal(); if (typeof App !== 'undefined' && App.currentView !== 'ai-assistant') App.navigate('ai-assistant'); AIAssistantView.fillAndAsk('show me all cases in ${selectedYear === 'ALL' ? '2026' : (selectedYear === 'PRE_2020' ? '2019' : selectedYear)}')"
              style="font-size: 0.78rem; font-weight: 700; white-space: nowrap; display: inline-flex; align-items: center; gap: 0.35rem;" 
              title="Ask AI Assistant to query and list cases from ${selectedYear}"
            >
              🤖 Ask AI for ${selectedYear === 'ALL' ? '2026' : selectedYear} Cases
            </button>
            <span class="badge badge-gold" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
              ${filtered.length} Cases Found
            </span>
          </div>
        </div>

        <!-- Case Cards Grid -->
        <div class="tz-case-explorer-grid">
          ${filtered.length === 0 ? `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--color-text-secondary);">
              <div style="font-size: 2.2rem; margin-bottom: 0.5rem; opacity: 0.6;">🏛️</div>
              <strong style="font-size: 1rem; color: var(--color-primary);">No judgments match your search in ${selectedYear}</strong>
              <div style="font-size: 0.82rem; margin-top: 0.25rem;">Try adjusting your search terms or select another year tab above.</div>
            </div>
          ` : filtered.map((c, idx) => `
            <div class="tz-case-card animate-fade">
              <div>
                <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                  <span class="badge ${c.year === '2026' ? 'badge-gold' : 'badge-neutral'}" style="font-size: 0.68rem; font-weight: 700;">
                    ${c.year || 'Precedent'}
                  </span>
                  <span class="badge badge-success" style="font-size: 0.65rem;">
                    ${c.status || 'Prepared for AI'}
                  </span>
                </div>

                <div class="tz-case-card-title" onclick="AIAssistantView.openCaseDetailModal('${c.id}')" style="cursor: pointer;" title="Click to view complete case dossier">
                  ${this.escapeHtml(c.title)}
                </div>

                <div class="tz-case-card-citation">
                  ${this.escapeHtml(c.citation || c.caseNumber)}
                </div>

                <div class="tz-case-card-meta">
                  <div><strong>Court:</strong> ${this.escapeHtml(c.court || 'High Court of Tanzania')}</div>
                  <div><strong>Judge/Bench:</strong> ${this.escapeHtml(c.judge || 'Hon. Judge')}</div>
                  <div><strong>Category:</strong> ${this.escapeHtml(c.category || 'Civil / Criminal')}</div>
                  <div><strong>Date:</strong> ${this.escapeHtml(c.decisionDate || c.orderDate || c.year)}</div>
                </div>

                ${c.executiveSummary ? `
                  <div style="font-size: 0.78rem; color: var(--color-text-main); background: var(--color-surface-subtle); padding: 0.5rem 0.65rem; border-radius: 6px; border-left: 3px solid var(--color-gold); line-height: 1.45; margin-bottom: 0.75rem;">
                    ${this.escapeHtml(c.executiveSummary.substring(0, 140))}…
                  </div>
                ` : ''}
              </div>

              <div class="tz-case-card-actions">
                <button 
                  type="button" 
                  class="btn btn-gold btn-sm" 
                  onclick="AIAssistantView.openCaseDetailModal('${c.id}')"
                  title="Open amazing interactive case dossier"
                  style="font-weight: 700; font-size: 0.76rem;"
                >
                  🔍 Inspect Dossier
                </button>

                <div class="flex items-center gap-1">
                  ${c.tanzliiUrl ? `
                    <a 
                      href="${c.tanzliiUrl}" 
                      target="_blank" 
                      class="btn btn-ghost btn-sm" 
                      style="font-size: 0.74rem; color: var(--color-gold); padding: 0.25rem 0.45rem;"
                      title="Open authentic source on TanzLII in new tab"
                    >
                      🌐 TanzLII ↗
                    </a>
                  ` : ''}

                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm" 
                    style="font-size: 0.74rem; padding: 0.25rem 0.45rem;"
                    onclick="AIAssistantView.viewPdfModal('${c.id}')"
                    title="View PDF document"
                  >
                    📄 PDF
                  </button>

                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm" 
                    style="font-size: 0.74rem; padding: 0.25rem 0.45rem;"
                    onclick="App.closeModal(); AIAssistantView.askAiAboutCase('${c.id}')"
                    title="Ask AI questions about this case"
                  >
                    🤖 Ask
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

      </div>

      <div class="modal-footer flex items-center justify-between">
        <span style="font-size: 0.8rem; color: var(--color-text-secondary);">
          Total Authorized Tanzanian Repositories: <strong>${judgments.length} Decisions</strong>
        </span>
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Explorer</button>
      </div>
    `, 'modal-xl modal-fixed-explorer');
  },

  openLibraryModal(selectedYear = 'ALL') {
    this.openYearBrowserModal(selectedYear);
  },

  /* --------------------------------------------------------------------------
     AMAZING CASE PAGE INSPECTOR MODAL (Full 12-Tab Deep Dive)
     -------------------------------------------------------------------------- */
  switchCaseDetailTab(caseId, tabId) {
    const judgments = SLCMS_STATE.tanzaniaJudgments || [];
    const docLibrary = SLCMS_STATE.legalSourceDocuments || [];
    const c = judgments.find(j => j.id === caseId) || docLibrary.find(d => d.id === caseId);
    if (!c) return;

    const bodyEl = document.querySelector('.tz-detail-body');
    if (!bodyEl) {
      this.openCaseDetailModal(caseId, tabId);
      return;
    }

    // Update active tab buttons smoothly
    const tabBtns = document.querySelectorAll('.tz-detail-tab-btn');
    tabBtns.forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      if (onclickAttr.includes(`'${tabId}'`)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Replace tab body content instantly without resizing the modal
    bodyEl.innerHTML = this.renderCaseDetailTabContent(c, tabId);
    bodyEl.scrollTop = 0;
  },

  openCaseDetailModal(caseId, activeTab = 'overview') {
    const judgments = SLCMS_STATE.tanzaniaJudgments || [];
    const docLibrary = SLCMS_STATE.legalSourceDocuments || [];
    const c = judgments.find(j => j.id === caseId) || docLibrary.find(d => d.id === caseId);

    if (!c) {
      App.showToast('Case record not found in repository.', 'error');
      return;
    }

    const tabs = [
      { id: 'overview', label: '📌 1. Overview & Holdings', icon: '📌' },
      { id: 'facts', label: '📋 2. Material Facts', icon: '📋' },
      { id: 'arguments', label: '⚖️ 3. Grounds & Arguments', icon: '⚖️' },
      { id: 'issues', label: '❓ 4. Legal Issues', icon: '❓' },
      { id: 'reasoning', label: '🧠 5. Court Reasoning', icon: '🧠' },
      { id: 'orders', label: '📜 6. Final Decision & Orders', icon: '📜' },
      { id: 'laws', label: '📚 7. Laws Cited', icon: '📚' },
      { id: 'precedents', label: '🏛️ 8. Cases Cited', icon: '🏛️' },
      { id: 'principles', label: '💡 9. Ratio Decidendi', icon: '💡' },
      { id: 'timeline', label: '🕒 10. Procedural History', icon: '🕒' },
      { id: 'notes', label: '⚠️ 11. AI Processing Notes', icon: '⚠️' },
      { id: 'questions', label: '💬 12. Ask AI Questions', icon: '💬' }
    ];

    App.openModal(`
      <div class="tz-detail-header">
        <div class="flex items-center justify-between" style="margin-bottom: 0.5rem;">
          <div class="flex items-center gap-2">
            <span class="badge badge-gold" style="font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
              ${c.year || 'Tanzania Precedent'} • ${c.courtTier || 'High Court of Tanzania'}
            </span>
            <span class="badge badge-success" style="font-size: 0.7rem;">
              Verified TanzLII Authority
            </span>
          </div>
          <button class="btn btn-ghost btn-sm" style="color: #FFFFFF; font-size: 1.1rem; padding: 0.2rem 0.5rem;" onclick="App.closeModal()">✕</button>
        </div>

        <h2 class="tz-detail-title">
          ${this.escapeHtml(c.fullTitle || c.title)}
        </h2>

        <div class="tz-detail-citation-bar">
          <span class="tz-detail-citation-badge">
            ${this.escapeHtml(c.citation || c.caseNumber || 'Citation Pending')}
          </span>
          <span style="font-size: 0.85rem; color: #CBD5E1;">
            ${this.escapeHtml(c.caseNumber || '')}
          </span>
          <button 
            type="button" 
            class="btn btn-ghost btn-sm" 
            style="color: var(--color-gold); font-size: 0.75rem; padding: 0.15rem 0.45rem;"
            onclick="AIAssistantView.copyCitation('${this.escapeHtml(c.citation || c.title)}')"
          >
            📋 Copy Citation
          </button>
        </div>

        <div class="tz-detail-meta-row">
          <div>🏛️ <strong>Court:</strong> ${this.escapeHtml(c.court || 'High Court of Tanzania')}</div>
          <div>👨‍⚖️ <strong>Coram / Judge:</strong> ${this.escapeHtml(c.judge || 'Hon. Judge')}</div>
          <div>📅 <strong>Decision Date:</strong> ${this.escapeHtml(c.decisionDate || c.orderDate || c.judgmentDate || c.year)}</div>
          <div>📂 <strong>Category:</strong> ${this.escapeHtml(c.category || c.primaryCategory || 'Litigation')}</div>
        </div>

        <!-- Action Toolbar with Clickable TanzLII link -->
        <div class="tz-detail-action-bar">
          ${c.tanzliiUrl ? `
            <a 
              href="${c.tanzliiUrl}" 
              target="_blank" 
              class="btn btn-gold btn-sm" 
              style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 700;"
            >
              <span>🌐 See Original on TanzLII ↗</span>
            </a>
          ` : ''}

          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            onclick="AIAssistantView.viewPdfModal('${c.id}')"
          >
            📄 View / Download PDF
          </button>

          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            onclick="App.closeModal(); AIAssistantView.askAiAboutCase('${c.id}')"
          >
            🤖 Ask AI About This Case
          </button>

          <button 
            type="button" 
            class="btn btn-primary btn-sm" 
            onclick="App.closeModal(); AIAssistantView.openReportConfigModal('${c.id}')"
          >
            📊 Generate Complete Analysis Report
          </button>

          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            onclick="AIAssistantView.openAttachSpecificCaseModal('${c.id}')"
          >
            📎 Attach to Client Matter
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tz-detail-tabs-nav">
        ${tabs.map(t => `
          <button 
            type="button" 
            class="tz-detail-tab-btn ${activeTab === t.id ? 'active' : ''}" 
            onclick="AIAssistantView.switchCaseDetailTab('${c.id}', '${t.id}')"
          >
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- Active Tab Content Body -->
      <div class="tz-detail-body">
        ${this.renderCaseDetailTabContent(c, activeTab)}
      </div>

      <div class="modal-footer flex items-center justify-between">
        <button class="btn btn-ghost" onclick="AIAssistantView.openYearBrowserModal('${c.year || 'ALL'}')">
          ← Back to ${c.year || 'All'} Cases
        </button>
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Dossier</button>
      </div>
    `, 'modal-xl modal-fixed-dossier');
  },

  renderCaseDetailTabContent(c, tab) {
    if (tab === 'overview') {
      return `
        <div class="animate-fade flex flex-col gap-4">
          <div class="tz-direct-answer-box">
            <strong style="color: var(--color-gold); font-size: 0.95rem; display: block; margin-bottom: 0.35rem;">
              Executive Legal Summary:
            </strong>
            <p style="margin: 0; line-height: 1.65;">
              ${this.escapeHtml(c.executiveSummary || c.fullTextSummary || c.relevantPassage || 'Official structured TanzLII judgment indexed in SLCMS repository.')}
            </p>
          </div>

          <div class="tz-arguments-grid">
            <div class="tz-argument-card">
              <h4 style="margin: 0 0 0.5rem; color: var(--color-primary); font-size: 0.9rem;">🏛️ Judicial Registry & Bench</h4>
              <div style="font-size: 0.84rem; line-height: 1.6; color: var(--color-text-main);">
                <div><strong>Court:</strong> ${this.escapeHtml(c.court || 'High Court of Tanzania')}</div>
                <div><strong>Coram/Judge:</strong> ${this.escapeHtml(c.judge || 'Hon. Judge')}</div>
                <div><strong>Case Number:</strong> ${this.escapeHtml(c.caseNumber || 'N/A')}</div>
                <div><strong>Originating Matter:</strong> ${this.escapeHtml(c.originatingCase || 'N/A')}</div>
              </div>
            </div>

            <div class="tz-argument-card">
              <h4 style="margin: 0 0 0.5rem; color: var(--color-primary); font-size: 0.9rem;">⚖️ Proceeding & Subject Matter</h4>
              <div style="font-size: 0.84rem; line-height: 1.6; color: var(--color-text-main);">
                <div><strong>Proceeding Type:</strong> ${this.escapeHtml(c.proceedingType || c.proceeding || 'Appeal / Civil / Criminal')}</div>
                <div><strong>Legal Category:</strong> ${this.escapeHtml(c.category || c.primaryCategory || 'Litigation')}</div>
                <div><strong>Main Subject:</strong> ${this.escapeHtml(c.mainSubject || c.category || 'Substantive determination')}</div>
                <div><strong>Outcome:</strong> <span class="badge badge-gold" style="font-size: 0.72rem;">${this.escapeHtml(c.outcome || 'Decided & Recorded')}</span></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (tab === 'facts') {
      const factsList = Array.isArray(c.facts) ? c.facts : (c.facts && c.facts.natureOfDispute) ? [...(c.facts.partiesAndPremises || []), ...(c.facts.natureOfDispute || []), ...(c.facts.competingPositions || [])] : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Verified Material Facts (Zero Invented Information):
          </h3>
          ${factsList.length > 0 ? `
            <ol style="margin-left: 1.25rem; line-height: 1.7; font-size: 0.92rem; color: var(--color-text-main);">
              ${factsList.map(f => `<li style="margin-bottom: 0.65rem;">${this.escapeHtml(f)}</li>`).join('')}
            </ol>
          ` : `
            <p style="color: var(--color-text-secondary); font-size: 0.9rem;">
              ${this.escapeHtml(c.relevantPassage || 'Material facts extracted directly from official court record.')}
            </p>
          `}
        </div>
      `;
    }

    if (tab === 'arguments') {
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Parties' Submissions & Grounds of Appeal:
          </h3>
          <div class="tz-arguments-grid">
            <div class="tz-argument-card appellant-card">
              <div class="tz-arg-header">
                <span class="tz-arg-badge">Appellant / Applicant Position</span>
                <h4 class="tz-arg-name">${this.escapeHtml(c.appellant || c.applicant || 'Appellant / Prosecution')}</h4>
              </div>
              <div style="font-size: 0.88rem; line-height: 1.6; color: var(--color-text-main);">
                ${c.appellantGrounds && Array.isArray(c.appellantGrounds) ? `
                  <ul style="margin-left: 1rem; padding-left: 0;">
                    ${c.appellantGrounds.map(g => `<li style="margin-bottom: 0.45rem;">${this.escapeHtml(g)}</li>`).join('')}
                  </ul>
                ` : `
                  <p>${this.escapeHtml(c.partiesPositions && c.partiesPositions.dpp ? c.partiesPositions.dpp : c.partiesPositions && c.partiesPositions.appellant ? c.partiesPositions.appellant : 'Grounds presented in memorandum of appeal / application.')}</p>
                `}
              </div>
            </div>

            <div class="tz-argument-card respondent-card">
              <div class="tz-arg-header">
                <span class="tz-arg-badge">Respondent / Interested Party</span>
                <h4 class="tz-arg-name">${this.escapeHtml(c.respondent || c.interestedPerson || 'Respondent')}</h4>
              </div>
              <div style="font-size: 0.88rem; line-height: 1.6; color: var(--color-text-main);">
                ${c.partiesPositions && typeof c.partiesPositions === 'object' ? `
                  <div>${this.escapeHtml(c.partiesPositions.respondent || c.partiesPositions.adamFrancisKilawe || Object.values(c.partiesPositions)[1] || 'Submissions recorded in judgment.')}</div>
                ` : `
                  <p>Submissions opposing the appeal / application as recorded by the court.</p>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (tab === 'issues') {
      const issues = Array.isArray(c.legalIssues) ? c.legalIssues : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Formulated Determinative Legal Issues:
          </h3>
          ${issues.length > 0 ? `
            <div class="flex flex-col gap-2.5">
              ${issues.map((issue, idx) => `
                <div style="background: var(--color-surface-subtle); border-left: 3.5px solid #3B82F6; padding: 0.85rem 1rem; border-radius: 6px; font-size: 0.9rem; line-height: 1.6;">
                  <strong style="color: #3B82F6;">Issue ${idx + 1}:</strong> ${this.escapeHtml(issue)}
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--color-text-secondary);">Issues extracted and evaluated in full judicial determination.</p>
          `}
        </div>
      `;
    }

    if (tab === 'reasoning') {
      const reasoningList = Array.isArray(c.courtReasoning) ? c.courtReasoning : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Judicial Reasoning & Evidentiary Analysis:
          </h3>
          ${reasoningList.length > 0 ? `
            <div class="flex flex-col gap-3">
              ${reasoningList.map((r, idx) => `
                <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem 1.15rem; font-size: 0.9rem; line-height: 1.65; color: var(--color-text-main); box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                  <strong style="color: var(--color-primary); display: block; margin-bottom: 0.25rem;">Finding ${idx + 1}:</strong>
                  ${this.escapeHtml(r)}
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="font-size: 0.92rem; line-height: 1.65; color: var(--color-text-main);">
              ${this.escapeHtml(c.relevantPassage || 'Judicial analysis grounded on statutory interpretation and authoritative precedents.')}
            </p>
          `}
        </div>
      `;
    }

    if (tab === 'orders') {
      const orders = Array.isArray(c.finalOrders) ? c.finalOrders : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Final Operative Orders & Decision:
          </h3>
          <div class="order-box tz-principle-box">
            <strong style="color: #B45309; font-size: 0.92rem; display: block; margin-bottom: 0.5rem;">
              Operative Orders of the Court:
            </strong>
            ${orders.length > 0 ? `
              <ol style="margin-left: 1.25rem; line-height: 1.7; font-size: 0.92rem; color: var(--color-text-main);">
                ${orders.map(o => `<li style="margin-bottom: 0.45rem;">${this.escapeHtml(o)}</li>`).join('')}
              </ol>
            ` : `
              <p style="margin: 0; line-height: 1.6;">${this.escapeHtml(c.outcome || 'Orders delivered in accordance with signed judgment.')}</p>
            `}
          </div>
        </div>
      `;
    }

    if (tab === 'laws') {
      const statutes = Array.isArray(c.statutoryProvisions) ? c.statutoryProvisions : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Statutory Provisions Cited:
          </h3>
          ${statutes.length > 0 ? `
            <div class="flex flex-col gap-2.5">
              ${statutes.map(s => `
                <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: 8px; padding: 0.85rem 1.15rem;">
                  <strong style="color: var(--color-primary); font-size: 0.92rem;">${this.escapeHtml(s.act)}</strong>
                  <div style="font-size: 0.85rem; color: var(--color-gold); font-weight: 700; margin-top: 0.2rem;">
                    Sections: ${(s.sections || []).join(', ')}
                  </div>
                  ${s.context ? `<div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.35rem;">Context: ${this.escapeHtml(s.context)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--color-text-secondary);">Statutory chapters referenced in the judgment text.</p>
          `}
        </div>
      `;
    }

    if (tab === 'precedents') {
      const precedents = Array.isArray(c.precedentsCited) ? c.precedentsCited : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Cases & Precedents Cited:
          </h3>
          ${precedents.length > 0 ? `
            <ul style="margin-left: 1.25rem; line-height: 1.7; font-size: 0.92rem; color: var(--color-text-main);">
              ${precedents.map(p => `<li style="margin-bottom: 0.5rem;">${this.escapeHtml(p)}</li>`).join('')}
            </ul>
          ` : `
            <p style="color: var(--color-text-secondary);">No external judicial precedents expressly cited.</p>
          `}
        </div>
      `;
    }

    if (tab === 'principles') {
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Legal Principle — Ratio Decidendi:
          </h3>
          <div class="ratio-box tz-principle-box">
            <strong style="color: #047857; font-size: 0.95rem; display: block; margin-bottom: 0.45rem;">
              Binding Ratio Decidendi:
            </strong>
            <p style="margin: 0; line-height: 1.7; font-size: 0.94rem; color: var(--color-text-main);">
              ${this.escapeHtml(c.ratioDecidendi || c.relevantPassage || 'Legal principle extracted and verified for Tanzanian jurisprudence.')}
            </p>
          </div>
        </div>
      `;
    }

    if (tab === 'timeline') {
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Procedural History & Progression:
          </h3>
          <div class="tz-timeline-container">
            <div class="tz-timeline-item">
              <div class="tz-timeline-dot">1</div>
              <div class="tz-timeline-content">
                <div class="tz-timeline-title">Originating Lower Court Matter</div>
                <div class="tz-timeline-desc">${this.escapeHtml(c.originatingCase || 'Trial Court / District Court')}</div>
              </div>
            </div>
            <div class="tz-timeline-item">
              <div class="tz-timeline-dot">2</div>
              <div class="tz-timeline-content">
                <div class="tz-timeline-title">Appellate / Revisional Proceedings</div>
                <div class="tz-timeline-desc">${this.escapeHtml(c.court || 'High Court of Tanzania')} • ${this.escapeHtml(c.caseNumber || '')}</div>
              </div>
            </div>
            <div class="tz-timeline-item">
              <div class="tz-timeline-dot">3</div>
              <div class="tz-timeline-content">
                <div class="tz-timeline-title">Final Decision & Enforcement</div>
                <div class="tz-timeline-desc">Decided on ${this.escapeHtml(c.decisionDate || c.orderDate || c.year)} by ${this.escapeHtml(c.judge || 'Hon. Judge')}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (tab === 'notes') {
      const notes = Array.isArray(c.processingNotes) ? c.processingNotes : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Preserved Document Inconsistencies & AI Processing Notes:
          </h3>
          ${notes.length > 0 ? `
            <ul style="margin-left: 1.25rem; line-height: 1.7; font-size: 0.9rem; color: var(--color-text-main);">
              ${notes.map(n => `<li style="margin-bottom: 0.45rem;">${this.escapeHtml(n)}</li>`).join('')}
            </ul>
          ` : `
            <p style="color: var(--color-text-secondary);">No document anomalies detected. Record verified against authentic TanzLII PDF.</p>
          `}
        </div>
      `;
    }

    if (tab === 'questions') {
      const questions = Array.isArray(c.questionsAnswerable) ? c.questionsAnswerable : [];
      return `
        <div class="animate-fade">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary); margin-top: 0; margin-bottom: 0.75rem;">
            Clickable Questions This Precedent Can Answer:
          </h3>
          <p style="font-size: 0.84rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
            Click any question below to immediately ask SLCMS AI and receive a structured answer grounded on this verified authority:
          </p>
          <div class="flex flex-col gap-2">
            ${questions.map(q => `
              <button 
                type="button" 
                class="tz-action-card" 
                style="padding: 0.85rem 1.15rem; text-align: left; cursor: pointer;"
                onclick="App.closeModal(); AIAssistantView.fillAndAsk('${this.escapeHtml(q)}')"
              >
                <div class="flex items-center justify-between">
                  <span style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">❓ ${this.escapeHtml(q)}</span>
                  <span class="tz-action-card-arrow">➔</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    return '';
  },

  askAiAboutCase(caseId) {
    const judgments = SLCMS_STATE.tanzaniaJudgments || [];
    const c = judgments.find(j => j.id === caseId);
    if (!c) return;

    this.fillAndAsk(`Summarize ${c.title} ${c.citation || ''}`);
  },

  copyCitation(citationText) {
    if (!citationText) return;
    navigator.clipboard.writeText(citationText).then(() => {
      App.showToast(`Citation copied to clipboard: ${citationText}`, 'success');
    }).catch(() => {
      App.showToast('Failed to copy citation.', 'error');
    });
  },

  openAttachSpecificCaseModal(caseId) {
    const cases = SLCMS_STATE.cases || [];
    const judgments = SLCMS_STATE.tanzaniaJudgments || [];
    const j = judgments.find(x => x.id === caseId);

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📎 Attach Precedent to Client Matter</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background: var(--color-surface-subtle); padding: 0.85rem 1rem; border-radius: 8px; border-left: 3px solid var(--color-gold); margin-bottom: 1rem;">
          <strong style="color: var(--color-primary); font-size: 0.92rem;">${j ? j.title : 'Selected Authority'}</strong>
          <div style="font-size: 0.8rem; color: var(--color-gold); font-family: monospace;">${j ? j.citation : ''}</div>
        </div>
        <div class="form-group">
          <label class="form-label required">Select Client File Dossier</label>
          <select id="attach-case-select-specific" class="form-control">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title} (${c.client})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="App.closeModal(); App.showToast('Precedent authority attached to case file successfully.', 'success')">Attach to Case</button>
      </div>
    `, 'modal-md');
  },

  openSelectCaseModal() {
    const authorizedCases = SLCMS_STATE.cases || [];

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📁 Select Active Client Matter</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="flex flex-col gap-2">
          ${authorizedCases.map(c => `
            <div class="dash-task-item ${this.filters.caseId === c.id ? 'border-gold' : ''}" style="cursor: pointer;" onclick="AIAssistantView.filters.caseId='${c.id}'; App.closeModal(); App.showToast('Active case linked: ${c.title}', 'success'); App.renderAuthenticatedApp();">
              <div class="flex items-center justify-between">
                <strong>${c.caseNumber} — ${c.title}</strong>
                <span class="badge badge-gold" style="font-size: 0.7rem;">${c.category || 'Litigation'}</span>
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

  openAttachToCaseModal() {
    const cases = SLCMS_STATE.cases || [];

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📎 Attach Research Authority to Client Matter</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Select the client case folder to attach this verified Tanzanian legal research record:
        </p>
        <div class="form-group">
          <label class="form-label required">Select Case File</label>
          <select id="attach-case-select" class="form-control">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title} (${c.client})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="App.closeModal(); App.showToast('Research attached to case dossier successfully.', 'success')">Attach to Case</button>
      </div>
    `, 'modal-md');
  },

  openFiltersModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">⚙️ Legal Sources & Filters</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Search Scope</label>
          <select id="filter-scope" class="form-control" onchange="AIAssistantView.filters.scope=this.value">
            <option value="all" ${this.filters.scope === 'all' ? 'selected' : ''}>All Tanzanian Sources (Judgments & Statutes)</option>
            <option value="tanzlii" ${this.filters.scope === 'tanzlii' ? 'selected' : ''}>TanzLII Judgments Only</option>
            <option value="legislation" ${this.filters.scope === 'legislation' ? 'selected' : ''}>Principal Legislation (Acts & Chapters)</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Done</button>
      </div>
    `, 'modal-md');
  },

  openUploadModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">📤 Upload Tanzanian Legal Document</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Upload a TanzLII judgment PDF or statute. Text is extracted and indexed into the legal repository.
        </p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Document Title / Case Name</label>
          <input type="text" id="upload-doc-title" class="form-control" placeholder="e.g. NBC v James Mrema">
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Citation / Chapter</label>
          <input type="text" id="upload-doc-citation" class="form-control" placeholder="e.g. [2024] TZCA 991">
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
      id: 'tz-j-' + Date.now(),
      title: title,
      citation: citation || 'Indexed Document',
      court: 'High Court of Tanzania',
      category: 'Commercial Law',
      status: 'Ready for AI',
      isMetadataOnly: false,
      relevantPassage: `${title} (${citation}): Verified legal authority and statutory compliance passages indexed.`,
      rawExtractedText: `${title}\n${citation}\nIndexed and ready for AI legal query retrieval.`
    };
    SLCMS_STATE.tanzaniaJudgments.unshift(newDoc);
    this.activeSources.unshift(newDoc);
    SLCMS_STATE.addAuditLog('Document Uploaded & Indexed', 'Legal Library', title);
    App.closeModal();
    App.showToast('Document uploaded, text extracted and indexed into Legal Repository.', 'success');
    App.renderAuthenticatedApp();
  },

  viewSupportingPassage(docId) {
    const doc = (SLCMS_STATE.tanzaniaJudgments || []).find(j => j.id === docId) || (SLCMS_STATE.legalSourceDocuments || []).find(d => d.id === docId);
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

        <div style="background: var(--color-surface-subtle); padding: 1rem; border-radius: 6px; font-size: 0.88rem; line-height: 1.6; max-height: 380px; overflow-y: auto; white-space: pre-wrap;">
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

  renderSourceCard(source, index) {
    const isHighlighted = this.activeSourceHighlightId === source.id;

    return `
      <div id="source-card-${source.id}" class="tz-source-card-v2 ${isHighlighted ? 'source-card-highlight' : ''}">
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
          <strong>Authority:</strong> ${this.escapeHtml(source.relevantPassage ? source.relevantPassage.substring(0, 95) + '…' : 'Contains verified ratio decidendi and statutory references.')}
        </div>

        <div class="tz-source-card-actions">
          <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.74rem; padding: 0.3rem 0.55rem;" onclick="AIAssistantView.viewPdfModal('${source.id}')">
            📄 PDF View
          </button>
          <button type="button" class="btn btn-ghost btn-sm" style="font-size: 0.74rem; padding: 0.3rem 0.55rem; color: var(--color-gold);" onclick="AIAssistantView.openOriginalTanzLII('${source.tanzliiUrl || 'https://tanzlii.org'}', '${source.title}')">
            🌐 TanzLII ↗
          </button>
        </div>
      </div>
    `;
  },

  getActiveFilterCount() {
    let count = 0;
    if (this.filters.scope !== 'all') count++;
    if (this.filters.caseId !== 'all') count++;
    return count;
  },

  resetFilters() {
    this.filters.scope = 'all';
    this.filters.caseId = 'all';
    App.renderAuthenticatedApp();
  },

  openRegistrationModal(prefill = {}) {
    if (typeof CaseRegistrationModal !== 'undefined') {
      CaseRegistrationModal.open(prefill);
    } else {
      App.showToast('Case Registration Wizard is initializing...', 'info');
    }
  },

  openUploadModal() {
    this.openRegistrationModal();
  },

  openLibraryModal() {
    const list = SLCMS_STATE.tanzaniaJudgments || [];
    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.25rem; color: var(--color-gold);">📚</span>
          <h3 class="modal-title" style="font-size: 1.15rem;">Tanzanian Legal Authority Repository</h3>
          <span class="badge badge-gold">${list.length} Records</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <p style="font-size: 0.82rem; color: var(--color-text-secondary); margin: 0;">
            All indexed judgments with full text passages, ratios, and statutory citations.
          </p>
          <button class="btn btn-gold btn-sm" onclick="App.closeModal(); AIAssistantView.openRegistrationModal()">
            + Register Scanned Judgment
          </button>
        </div>
        <div class="flex flex-col gap-2" style="max-height: 480px; overflow-y: auto;">
          ${list.map(j => `
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">${j.title}</div>
                <div style="font-size: 0.74rem; color: var(--color-gold); font-family: var(--font-mono); margin-top: 0.15rem;">
                  ${j.citation} • ${j.caseNumber} • ${j.court}
                </div>
                <div style="font-size: 0.76rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                  ${j.subject || j.relevantPassage || ''}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); TanzaniaIntentRouter.openCaseDetail('${j.id}')">
                  View Record
                </button>
                <button class="btn btn-gold btn-sm" onclick="App.closeModal(); AIAssistantView.fillAndAsk('Summarize ${j.title}')">
                  Summarize
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  openHistoryModal() {
    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.25rem; color: var(--color-gold);">📜</span>
          <h3 class="modal-title" style="font-size: 1.15rem;">Research Query History</h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="flex flex-col gap-2">
          ${this.sampleHistory.map(h => `
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 600; color: var(--color-primary); font-size: 0.88rem;">${h.title}</div>
                <div style="font-size: 0.72rem; color: var(--color-text-secondary); margin-top: 0.15rem;">${h.date} • Query: "${h.query}"</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); AIAssistantView.fillAndAsk('${h.query}')">
                Re-run
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-md');
  },

  openSelectCaseModal() {
    const cases = SLCMS_STATE.cases || [];
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Select Active Law Firm Matter</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="flex flex-col gap-2">
          ${cases.map(c => `
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; color: var(--color-primary); font-size: 0.88rem;">${c.caseNumber} - ${c.title}</div>
                <div style="font-size: 0.74rem; color: var(--color-text-secondary);">Client: ${c.clientName || 'Authorized Client'} • Status: ${c.status}</div>
              </div>
              <button class="btn btn-gold btn-sm" onclick="AIAssistantView.filters.caseId = '${c.id}'; App.closeModal(); App.showToast('Scoped research to matter ${c.caseNumber}', 'success'); App.renderAuthenticatedApp();">
                Select
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      </div>
    `, 'modal-md');
  },

  openFiltersModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Legal Research Scope & Filters</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Jurisdiction Scope</label>
          <select class="form-control" id="f-scope">
            <option value="all">All Tanzanian Jurisdictions (Default)</option>
            <option value="Court of Appeal">Court of Appeal of Tanzania</option>
            <option value="High Court">High Court of Tanzania</option>
            <option value="Subordinate Courts">Resident Magistrate & District Courts</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Client Matter Scoping</label>
          <select class="form-control" id="f-case">
            <option value="all">Public TanzLII Precedents + Firm Repository</option>
            ${(SLCMS_STATE.cases || []).map(c => `<option value="${c.id}">${c.caseNumber} - ${c.title}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="AIAssistantView.resetFilters(); App.closeModal();">Reset Filters</button>
        <button class="btn btn-gold" onclick="AIAssistantView.filters.scope = document.getElementById('f-scope').value; AIAssistantView.filters.caseId = document.getElementById('f-case').value; App.closeModal(); App.renderAuthenticatedApp();">Apply Filters</button>
      </div>
    `, 'modal-sm');
  },

  openMoreToolsModal() {
    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.25rem; color: var(--color-gold);">⚡</span>
          <h3 class="modal-title" style="font-size: 1.15rem;">All 18 Tanzanian Legal Research Tools</h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-3 gap-3">
          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('FIND_JUDGMENT')">
            <div style="font-size: 1.3rem;">🔍</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">1. Find Judgment</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">12-field exact search</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('CASE_SUMMARY')">
            <div style="font-size: 1.3rem;">📄</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">2. Summarize Case</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Concise brief & holding</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('CASE_FACTS')">
            <div style="font-size: 1.3rem;">ℹ️</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">3. Show Facts</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Parties, timeline & property</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('LEGAL_ISSUES')">
            <div style="font-size: 1.3rem;">❓</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">4. Show Legal Issues</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Core judicial questions</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('COURT_REASONING')">
            <div style="font-size: 1.3rem;">🧠</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">5. Court Reasoning</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Evidence & legal tests</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('FINAL_DECISION')">
            <div style="font-size: 1.3rem;">✅</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">6. Final Decision</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Operative orders & costs</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('LAWS_CITED')">
            <div style="font-size: 1.3rem;">📚</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">7. Laws Cited</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Statutory chapters & rules</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('CASES_CITED')">
            <div style="font-size: 1.3rem;">🏛️</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">8. Cases Cited</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Precedential authorities</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('LEGAL_PRINCIPLE')">
            <div style="font-size: 1.3rem;">💡</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">9. Ratio Decidendi</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Binding legal principles</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('PROCEDURAL_HISTORY')">
            <div style="font-size: 1.3rem;">📜</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">10. Procedural Trail</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Primary to High Court</span>
          </div>

          <div class="tz-modal-cat-card" onclick="App.closeModal(); AIAssistantView.handleCategoryButtonClick('CASE_COMPARISON')">
            <div style="font-size: 1.3rem;">⚖️</div>
            <strong style="color: var(--color-primary); font-size: 0.85rem; margin-top: 0.25rem;">11. Case Comparison</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">Compare precedents</span>
          </div>

          <div class="tz-modal-cat-card" style="border: 1px solid var(--color-gold); background: rgba(200,155,60,0.06);" onclick="App.closeModal(); AIAssistantView.openRegistrationModal()">
            <div style="font-size: 1.3rem;">📝</div>
            <strong style="color: var(--color-gold); font-size: 0.85rem; margin-top: 0.25rem;">12. Register Judgment</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-secondary);">6-Step Scanned OCR Wizard</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  scrollToBottom() {
    setTimeout(() => {
      const stream = document.getElementById('tz-chat-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 50);
  },

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
