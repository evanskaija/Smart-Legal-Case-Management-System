/* ==========================================================================
   SLCMS - AI Draft Assistant View
   Generates initial drafts of letters, case notes, legal reports and other
   documents from lawyer instructions. All drafts require lawyer review.
   ========================================================================== */

const AIDraftAssistantView = {
  selectedCaseId: '',
  selectedDraftType: 'demand_letter',
  currentDraftText: '',
  draftStatus: 'idle', // 'idle' | 'generating' | 'review_required' | 'approved'
  lawyerInstructions: '',
  tone: 'formal', // 'formal' | 'assertive' | 'conciliatory' | 'advisory'
  language: 'en', // 'en' | 'sw'
  includeStatutes: true,
  lastGeneratedDraftId: null,

  // Saved Drafts Archive
  draftsArchive: [
    {
      id: 'drf-001',
      caseId: 'case-101',
      caseNumber: 'CV-2026-0842',
      caseTitle: 'Vanguard Capital vs. Apex Tech Holdings',
      client: 'Vanguard Capital Partners',
      draftType: 'demand_letter',
      title: 'Formal Demand Notice for Contractual Default & Software Licensing Warranty Breach',
      date: '2026-08-28',
      status: 'approved',
      approvedBy: 'Eleanor Vance, Esq.',
      preview: 'DEMAND FOR IMMEDIATE CURE OF MATERIAL BREACH OF SOFTWARE LICENSING AGREEMENT...'
    },
    {
      id: 'drf-002',
      caseId: 'case-104',
      caseNumber: 'EM-2026-0774',
      caseTitle: 'Dr. Clara Thorne vs. St. Jude Medical Network',
      client: 'Dr. Clara Thorne, MD',
      draftType: 'case_note',
      title: 'Litigation Strategy Note: Retaliatory Termination & Hospital Whistleblower Defense',
      date: '2026-08-30',
      status: 'review_required',
      approvedBy: null,
      preview: 'INTERNAL MEMORANDUM & STRATEGY ASSESSMENT FOR HIGH COURT CIVIL LITIGATION...'
    }
  ],

  // Preset instructions per draft type
  templates: {
    demand_letter: {
      label: 'Formal Demand Letter / Notice of Intention to Sue',
      icon: '✉️',
      defaultPrompt: 'Demand immediate payment of outstanding contractual sums and cure of contractual warranty breach within fourteen (14) statutory days, failing which legal proceedings will commence in the High Court of Tanzania (Commercial Division) for damages, compound interest, and legal costs.',
      description: 'Formal pre-action letter citing statutory default and setting 14-day cure deadline.'
    },
    case_note: {
      label: 'Case Note & Litigation Strategy Memo',
      icon: '📝',
      defaultPrompt: 'Draft an internal legal memorandum analyzing the strengths, evidence gaps, procedural risks, and preliminary objection vulnerabilities for the upcoming hearing before the High Court.',
      description: 'Internal tactical roadmap evaluating evidence, cause of action, and defenses.'
    },
    legal_opinion: {
      label: 'Legal Opinion & Statutory Risk Assessment',
      icon: '⚖️',
      defaultPrompt: 'Prepare a formal written legal opinion advising the client on statutory compliance, contractual exposure under the Law of Contract Act [Cap. 345 R.E. 2019], and chances of securing temporary injunctive relief.',
      description: 'Comprehensive advisory opinion analyzing statutes and appellate precedents.'
    },
    injunction_grounds: {
      label: 'Chamber Summons Grounds (Injunction / Stay)',
      icon: '🏛️',
      defaultPrompt: 'Draft formal grounds for Chamber Summons seeking an interim injunction under Order XXXVII of the Civil Procedure Code, establishing prima facie case, irreparable loss, and balance of convenience as settled in Attilio v. Mbowe.',
      description: 'Court application grounds establishing the triple legal test for injunctions.'
    },
    client_report: {
      label: 'Client Status Update & Next Steps Briefing',
      icon: '📄',
      defaultPrompt: 'Draft a professional client status report briefing the client on recent court filings, outcomes of the last chamber mention, upcoming deadline, and requested instructions.',
      description: 'Client correspondence communicating court milestones and tactical next steps.'
    },
    settlement_letter: {
      label: 'Without Prejudice Settlement Proposal',
      icon: '🤝',
      defaultPrompt: 'Draft a without prejudice settlement proposal exploring mutual release of liabilities, payment restructuring over 6 months, and discontinuance of commercial proceedings without admission of fault.',
      description: 'Privileged negotiation draft aimed at amicable dispute resolution.'
    }
  },

  openForCase(caseId) {
    this.selectedCaseId = caseId;
    App.navigate('ai-draft-assistant');
  },

  render() {
    const cases = (SLCMS_STATE.cases || []).filter(c => c.status !== 'Closed');
    if (!this.selectedCaseId && cases.length > 0) {
      this.selectedCaseId = cases[0].id;
    }

    const activeCase = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || cases[0] || {};
    const tpl = this.templates[this.selectedDraftType] || this.templates.demand_letter;

    if (!this.lawyerInstructions) {
      this.lawyerInstructions = tpl.defaultPrompt;
    }

    return `
      <div class="animate-fade">
        <!-- Header -->
        <div class="page-header" style="margin-bottom: 1.5rem;">
          <div>
            <div class="flex items-center gap-2">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,rgba(200,155,60,0.2),rgba(200,155,60,0.05));border:1px solid rgba(200,155,60,0.3);font-size:1.3rem;">
                ✍️
              </span>
              <div>
                <h1 class="page-title" style="margin: 0; font-size: 1.45rem;">AI Draft Assistant</h1>
                <p class="page-subtitle" style="margin: 0.15rem 0 0 0;">
                  Synthesizes initial legal documents, demand letters, strategy memos and opinions from lawyer instructions.
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-gold" style="font-size: 0.76rem; padding: 0.35rem 0.75rem;">
              ⚖️ Mandatory Lawyer Review Active
            </span>
            <button class="btn btn-secondary btn-sm" onclick="AIDraftAssistantView.resetWorkspace()">
              ✨ New Draft
            </button>
          </div>
        </div>

        <!-- Mandatory Review Notice Alert Banner -->
        <div style="background: linear-gradient(135deg, rgba(200,155,60,0.12), rgba(16,42,67,0.05)); border: 1px solid var(--color-gold); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div class="flex items-center gap-3">
            <div style="font-size: 1.5rem; flex-shrink: 0;">🛡️</div>
            <div style="font-size: 0.84rem; color: var(--color-text-main); line-height: 1.5;">
              <strong>Advocate Oversight Protocol:</strong> All legal drafts generated by SLCMS AI are initial working versions. An authorized Advocate (Senior Lawyer or Lawyer) must review, refine, and approve the text before issuing to clients or filing in court.
            </div>
          </div>
          <span class="badge badge-confidential" style="font-size: 0.7rem;">Legal Practice Rule Compliant</span>
        </div>

        <!-- 2-Column Drafting Hub -->
        <div class="grid grid-cols-12 gap-6">
          
          <!-- LEFT PANEL: Configuration & Instructions (5 Cols) -->
          <div style="grid-column: span 5;" class="flex flex-col gap-4">
            
            <!-- 1. Case Selection Card -->
            <div class="card" style="padding: 1.25rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
                <h4 style="margin: 0; font-size: 0.95rem; color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
                  <span>📁</span> 1. Select Case Matter
                </h4>
                <span style="font-size: 0.72rem; color: var(--color-gold); font-family: var(--font-mono); font-weight: 600;">
                  ${activeCase.caseNumber || 'Matter File'}
                </span>
              </div>
              
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <select id="draft-case-select" class="form-control" onchange="AIDraftAssistantView.handleCaseChange(this.value)">
                  ${cases.map(c => `
                    <option value="${c.id}" ${c.id === activeCase.id ? 'selected' : ''}>
                      ${c.caseNumber} — ${c.title} (${c.client})
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Matter Context Snippet -->
              <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.8rem;">
                <div class="flex justify-between" style="margin-bottom: 0.3rem;">
                  <span style="color: var(--color-text-secondary);">Client:</span>
                  <strong style="color: var(--color-primary);">${activeCase.client || 'Client Name'}</strong>
                </div>
                <div class="flex justify-between" style="margin-bottom: 0.3rem;">
                  <span style="color: var(--color-text-secondary);">Court / Forum:</span>
                  <strong>${activeCase.court || 'High Court of Tanzania'}</strong>
                </div>
                <div class="flex justify-between" style="margin-bottom: 0.3rem;">
                  <span style="color: var(--color-text-secondary);">Opposing Party:</span>
                  <strong style="color: var(--color-danger);">${activeCase.opposingParty || 'Adverse Party'}</strong>
                </div>
                <div class="flex justify-between">
                  <span style="color: var(--color-text-secondary);">Assigned Counsel:</span>
                  <strong style="color: var(--color-gold);">${activeCase.lawyer || 'Assigned Advocate'}</strong>
                </div>
              </div>
            </div>

            <!-- 2. Document Type Card -->
            <div class="card" style="padding: 1.25rem;">
              <h4 style="margin: 0 0 0.85rem 0; font-size: 0.95rem; color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
                <span>📄</span> 2. Document Template
              </h4>
              <div class="flex flex-col gap-2">
                ${Object.entries(this.templates).map(([key, item]) => `
                  <div class="p-2.5 flex items-center justify-between" 
                       style="border: 1px solid ${this.selectedDraftType === key ? 'var(--color-gold)' : 'var(--color-border)'}; 
                              background: ${this.selectedDraftType === key ? 'rgba(200,155,60,0.08)' : 'var(--color-surface)'}; 
                              border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s;"
                       onclick="AIDraftAssistantView.handleTemplateChange('${key}')">
                    <div class="flex items-center gap-2.5">
                      <span style="font-size: 1.2rem;">${item.icon}</span>
                      <div>
                        <div style="font-size: 0.84rem; font-weight: 600; color: ${this.selectedDraftType === key ? 'var(--color-gold)' : 'var(--color-primary)'};">
                          ${item.label}
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-secondary); margin-top: 0.1rem;">
                          ${item.description}
                        </div>
                      </div>
                    </div>
                    <input type="radio" name="draft_type" value="${key}" ${this.selectedDraftType === key ? 'checked' : ''} style="accent-color: var(--color-gold); cursor:pointer;">
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 3. Instructions & Generation Controls -->
            <div class="card" style="padding: 1.25rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
                <span>💬</span> 3. Lawyer's Drafting Instructions
              </h4>
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <textarea id="draft-instructions" class="form-control" rows="4" 
                          placeholder="Provide specific facts, claimed amounts, dates, relevant contractual clauses, or procedural orders..."
                          oninput="AIDraftAssistantView.lawyerInstructions = this.value"
                          style="font-size: 0.85rem; line-height: 1.5;">${this.lawyerInstructions}</textarea>
              </div>

              <!-- Options Grid -->
              <div class="grid grid-cols-2 gap-2" style="font-size: 0.8rem; margin-bottom: 1rem;">
                <div>
                  <label class="form-label" style="font-size: 0.72rem; margin-bottom: 0.2rem;">Tone & Style</label>
                  <select id="draft-tone-select" class="form-control" style="font-size: 0.8rem; padding: 0.35rem 0.5rem;" onchange="AIDraftAssistantView.tone = this.value">
                    <option value="formal" ${this.tone === 'formal' ? 'selected' : ''}>Formal & Resolute</option>
                    <option value="assertive" ${this.tone === 'assertive' ? 'selected' : ''}>Strict Legal Notice</option>
                    <option value="advisory" ${this.tone === 'advisory' ? 'selected' : ''}>Objective Advisory</option>
                    <option value="conciliatory" ${this.tone === 'conciliatory' ? 'selected' : ''}>Amicable Negotiation</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.72rem; margin-bottom: 0.2rem;">Language</label>
                  <select id="draft-lang-select" class="form-control" style="font-size: 0.8rem; padding: 0.35rem 0.5rem;" onchange="AIDraftAssistantView.language = this.value">
                    <option value="en" ${this.language === 'en' ? 'selected' : ''}>English (Legal Std)</option>
                    <option value="sw" ${this.language === 'sw' ? 'selected' : ''}>Swahili (Kiswahili)</option>
                  </select>
                </div>
              </div>

              <div class="flex items-center gap-2" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-bottom: 1.25rem;">
                <input type="checkbox" id="draft-statutes-check" ${this.includeStatutes ? 'checked' : ''} onchange="AIDraftAssistantView.includeStatutes = this.checked" style="accent-color: var(--color-gold); cursor:pointer;">
                <label for="draft-statutes-check" style="cursor: pointer;">Cite Tanzanian Statutes &amp; Judgments</label>
              </div>

              <button class="btn btn-gold w-full" onclick="AIDraftAssistantView.generateDraft()" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 700;">
                <span>✨ Generate Initial AI Draft</span>
              </button>
            </div>

          </div>

          <!-- RIGHT PANEL: Draft Workspace & Review Workflow (7 Cols) -->
          <div style="grid-column: span 7;" class="flex flex-col gap-4">
            
            <div class="card" style="padding: 1.5rem; min-height: 640px; display: flex; flex-direction: column;">
              
              <!-- Draft Workspace Header -->
              <div class="flex items-center justify-between" style="padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem;">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--color-primary);">
                      Document Review Canvas
                    </h3>
                    ${this.renderStatusBadge()}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                    ${tpl.label} &middot; Matter Ref: <strong style="color: var(--color-gold); font-family: var(--font-mono);">${activeCase.caseNumber || 'N/A'}</strong>
                  </div>
                </div>

                <!-- Action Bar -->
                <div class="flex items-center gap-2">
                  ${this.currentDraftText ? `
                    <button class="btn btn-secondary btn-sm" onclick="AIDraftAssistantView.copyDraftText()" title="Copy draft to clipboard">
                      📋 Copy Text
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AIDraftAssistantView.downloadDraft()" title="Download text draft">
                      ⬇ Download
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- Dynamic Document Body Area -->
              <div style="flex: 1; display: flex; flex-direction: column;">
                ${this.renderDraftContent(activeCase)}
              </div>

              <!-- Draft Footer & Mandatory Approval Action -->
              ${this.currentDraftText ? `
                <div style="padding-top: 1.25rem; border-top: 1px solid var(--color-border); margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
                  <div style="font-size: 0.78rem; color: var(--color-text-secondary);">
                    ${this.draftStatus === 'approved' ? `
                      <span style="color: #10B981; font-weight: 600;">✓ Approved by Lead Advocate and attached to Case Documents.</span>
                    ` : `
                      <span style="color: #F59E0B; font-weight: 600;">⚠️ Review text carefully. Edit any section before approving.</span>
                    `}
                  </div>

                  <div class="flex items-center gap-2">
                    <button class="btn btn-ghost btn-sm" onclick="AIDraftAssistantView.openRevisionModal()">
                      ⚡ Request AI Revision
                    </button>

                    ${this.draftStatus !== 'approved' ? `
                      <button class="btn btn-gold" onclick="AIDraftAssistantView.approveAndAttachToCase('${activeCase.id}')" style="display: flex; align-items: center; gap: 0.4rem;">
                        <span>✓ Approve &amp; Attach to Case</span>
                      </button>
                    ` : `
                      <button class="btn btn-secondary" onclick="CasesView.openCaseDetails('${activeCase.id}')">
                        📂 View in Case Dossier
                      </button>
                    `}
                  </div>
                </div>
              ` : ''}

            </div>

          </div>

        </div>

        <!-- Recent Drafts Archive Table -->
        <div class="card" style="margin-top: 2rem; padding: 1.5rem;">
          <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
            <div>
              <h3 style="margin: 0; font-size: 1.05rem; color: var(--color-primary);">Recent AI Drafts &amp; Memoranda</h3>
              <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color: var(--color-text-secondary);">Firm records of generated drafts, lawyer approvals and case attachments</p>
            </div>
            <span class="badge badge-confidential">${this.draftsArchive.length} Draft Records</span>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Draft Title &amp; Document Type</th>
                  <th>Related Matter</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Review Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.draftsArchive.map(drf => `
                  <tr>
                    <td>
                      <strong style="color: var(--color-primary);">${drf.title}</strong>
                      <div style="font-size: 0.72rem; color: var(--color-gold); font-weight: 600; text-transform: uppercase;">
                        ${this.templates[drf.draftType]?.label || drf.draftType}
                      </div>
                    </td>
                    <td>
                      <strong style="font-family: var(--font-mono); font-size: 0.8rem;">${drf.caseNumber}</strong>
                      <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${drf.caseTitle}</div>
                    </td>
                    <td>${drf.client}</td>
                    <td style="font-size: 0.8rem;">${drf.date}</td>
                    <td>
                      ${drf.status === 'approved' ? `
                        <span class="badge badge-active">Approved (${drf.approvedBy || 'Advocate'})</span>
                      ` : `
                        <span class="badge badge-onhold">Pending Review</span>
                      `}
                    </td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="AIDraftAssistantView.loadArchivedDraft('${drf.id}')">
                        Load in Canvas
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  renderStatusBadge() {
    if (this.draftStatus === 'generating') {
      return `<span class="badge badge-gold" style="font-size: 0.72rem;">⚡ Generating Draft...</span>`;
    }
    if (this.draftStatus === 'review_required') {
      return `<span class="badge badge-onhold" style="font-size: 0.72rem;">⚠️ Pending Lawyer Review</span>`;
    }
    if (this.draftStatus === 'approved') {
      return `<span class="badge badge-active" style="font-size: 0.72rem;">✓ Approved by Advocate</span>`;
    }
    return `<span class="badge" style="background: var(--color-surface-subtle); font-size: 0.72rem;">Ready to Draft</span>`;
  },

  renderDraftContent(activeCase) {
    if (this.draftStatus === 'generating') {
      return `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center;">
          <div class="ai-copilot-thinking-spinner" style="width: 44px; height: 44px; border: 3px solid rgba(200,155,60,0.2); border-top-color: var(--color-gold); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1.25rem;"></div>
          <h4 style="color: var(--color-primary); margin: 0 0 0.5rem 0;">Synthesizing Initial Legal Draft...</h4>
          <p style="color: var(--color-text-secondary); font-size: 0.85rem; max-width: 460px; line-height: 1.5; margin: 0;">
            Grounding instructions against Tanzanian legal practice standards, case metadata for <strong>${activeCase.caseNumber}</strong>, and mandatory statutory citations.
          </p>
        </div>
      `;
    }

    if (!this.currentDraftText) {
      return `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: var(--color-surface-subtle); border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">✍️</div>
          <h4 style="color: var(--color-primary); margin: 0 0 0.5rem 0;">No Draft Generated Yet</h4>
          <p style="color: var(--color-text-secondary); font-size: 0.85rem; max-width: 440px; line-height: 1.5; margin-bottom: 1.25rem;">
            Select a matter, choose your document template, customize your instructions on the left, and click <strong>Generate Initial AI Draft</strong>.
          </p>
          <button class="btn btn-gold btn-sm" onclick="AIDraftAssistantView.generateDraft()">
            ✨ Generate Sample Draft
          </button>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; flex: 1;">
        <div style="background: rgba(200,155,60,0.06); border-left: 3px solid var(--color-gold); padding: 0.6rem 0.85rem; font-size: 0.78rem; color: var(--color-text-main); margin-bottom: 0.75rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
          <strong>Interactive Editing Mode:</strong> You can edit the text directly in the box below before approving.
        </div>
        <textarea id="active-draft-editor" class="form-control" 
                  style="flex: 1; min-height: 480px; font-family: 'JetBrains Mono', monospace; font-size: 0.84rem; line-height: 1.7; padding: 1.25rem; background: var(--color-surface); color: var(--color-text-main); resize: vertical;"
                  oninput="AIDraftAssistantView.currentDraftText = this.value">${this.currentDraftText}</textarea>
      </div>
    `;
  },

  handleCaseChange(caseId) {
    this.selectedCaseId = caseId;
    App.refreshCurrentView();
  },

  handleTemplateChange(type) {
    this.selectedDraftType = type;
    this.lawyerInstructions = this.templates[type]?.defaultPrompt || '';
    App.refreshCurrentView();
  },

  resetWorkspace() {
    this.currentDraftText = '';
    this.draftStatus = 'idle';
    this.lawyerInstructions = this.templates[this.selectedDraftType]?.defaultPrompt || '';
    App.refreshCurrentView();
  },

  generateDraft() {
    const c = (SLCMS_STATE.cases || []).find(item => item.id === this.selectedCaseId) || SLCMS_STATE.cases[0] || {};
    const instructions = this.lawyerInstructions || this.templates[this.selectedDraftType]?.defaultPrompt || '';
    
    this.draftStatus = 'generating';
    App.refreshCurrentView();

    setTimeout(() => {
      this.currentDraftText = this.buildDraftText(c, this.selectedDraftType, instructions);
      this.draftStatus = 'review_required';
      this.lastGeneratedDraftId = 'drf-' + Date.now();
      App.refreshCurrentView();
      App.showToast('Initial draft generated. Ready for lawyer review.', 'info');
    }, 800);
  },

  buildDraftText(c, type, instructions) {
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const advocate = SLCMS_STATE.currentUser.name;
    const client = c.client || 'Client';
    const caseNo = c.caseNumber || 'CV-2026-0842';
    const court = c.court || 'High Court of Tanzania (Commercial Division)';
    const opposing = c.opposingParty || 'The Adverse Party';
    const opposingCounsel = c.opposingCounsel || 'Advocates on Record';

    if (type === 'demand_letter') {
      return `SLCMS LAW FIRM & ADVOCATES
Advocates, Notaries Public & Commissioners for Oaths
14th Floor, Posta & Telecommunications House, Ohio Street
P.O. Box 78901, Dar es Salaam, Tanzania
Tel: +255 22 211 5500 | Email: litigation@slcms-law.co.tz

OUR REF: SLCMS/LIT/${caseNo}/2026
DATE: ${dateStr}

TO:
${opposing}
c/o ${opposingCounsel}
Dar es Salaam, United Republic of Tanzania

BY REGISTERED DISPATCH & URGENT HAND DELIVERY

RE: FORMAL DEMAND NOTICE PRIOR TO LEGAL ACTION (NOTICE OF INTENTION TO SUE)
MATTER: ${c.title || 'COMMERCIAL CONTRACTUAL DISPUTE'}
CLIENT: ${client}

Dear Sir / Madam,

We act for and on behalf of our client, ${client} (hereinafter referred to as "our Client"), on whose firm and unequivocal instructions we address you as hereunder:

1. BACKGROUND & CONTRACTUAL BREACH
Under the terms of the binding commercial agreement executed between yourselves and our Client, you were contractually mandated to fulfill your statutory and financial warranties, perform all milestones in good faith, and discharge all payment liabilities without set-off or unmerited deductions.

2. PARTICULARS OF DEFAULT
In flagrant breach of your covenants, you have failed, neglected, and refused to cure material non-performance, despite repeated written demands and amicable requests from our Client. 

3. STATUTORY GROUNDING (TANZANIAN LAW)
TAKE NOTICE that your conduct constitutes a breach of contract under the Law of Contract Act [Cap. 345 R.E. 2019] and actionable nonfeasance. As affirmed by the Court of Appeal of Tanzania in binding precedents, failure to adhere to commercial stipulations entitles an aggrieved party to immediate relief, consequential damages, and commercial interest at commercial lending rates.

4. DEMAND
ACCORDINGLY, WE HEREBY DEMAND of you, which we hereby do, that within FOURTEEN (14) DAYS from the date of receipt of this notice, you:
   (a) Forthwith remit and liquidate the full outstanding sum together with accrued interest; and
   (b) Compensate our Client for legal costs incurred to date amounting to reasonable fees.

5. CONSEQUENCES OF NON-COMPLIANCE
TAKE FURTHER NOTICE that should you fail, refuse, or neglect to comply with the legitimate demands herein within the stipulated 14-day timeline, our strict instructions are to institute civil proceedings against you in the ${court}, WITHOUT ANY FURTHER NOTICE TO YOU WHATSOEVER, at your sole peril as to costs, interest, and ancillary damages.

Yours faithfully,
FOR: SLCMS LAW FIRM & ADVOCATES

___________________________________________
${advocate}
Lead Advocate for the Plaintiff / Complainant
Roll of Advocates No. T-BAR/2014/0821
CC: Client File: ${caseNo}`;
    }

    if (type === 'case_note') {
      return `CONFIDENTIAL ATTORNEY WORK PRODUCT — PRIVILEGED & CONFIDENTIAL
INTERNAL LITIGATION STRATEGY MEMORANDUM

DATE: ${dateStr}
TO: Litigation Team & Trial Partners
FROM: ${advocate}
MATTER: ${c.title}
CASE NUMBER: ${caseNo}
COURT: ${court}
CLIENT: ${client}
OPPOSING PARTY: ${opposing}

1. EXECUTIVE SUMMARY & PROCEDURAL STATUS
This memorandum outlines trial strategy, evidentiary strengths, and anticipated preliminary objections for the upcoming court date. The matter is currently pending before the ${court}.

2. LAWYER'S INSTRUCTIONS & FACTUAL THEMES
${instructions}

3. PRIMARY LEGAL ISSUES FOR DETERMINATION
Issue 1: Whether the opposing party's conduct constitutes a material contractual default under Tanzanian law.
Issue 2: Whether our Client has complied with all condition precedents and statutory notice requirements.
Issue 3: Whether an interim measure of protection or stay of execution is necessary to prevent irreparable injury to our Client.

4. APPLICABLE TANZANIAN STATUTES & CASE LAW
- Law of Contract Act [Cap. 345 R.E. 2019], Sections 28, 37 & 73.
- Civil Procedure Code [Cap. 33 R.E. 2019], Order XXXVII on interlocutory orders.
- Relevant Precedent: Attilio v. Mbowe [1969] H.C.D. 284 (Test for temporary injunctions: prima facie case, irreparable injury, and balance of convenience).

5. TACTICAL RECOMMENDATIONS & NEXT STEPS
(a) Secure supplementary affidavits from primary witnesses before statutory cutoff.
(b) File Chamber Summons for discovery and inspection of electronic documents.
(c) Prepare oral arguments addressing anticipated jurisdictional objections.

Prepared by: ${advocate}, Advocate
Status: Initial Draft (Internal Review)`;
    }

    if (type === 'legal_opinion') {
      return `LEGAL OPINION & STATUTORY ADVISORY ASSESSMENT
PRIVILEGED ATTORNEY-CLIENT COMMUNICATION

DATE: ${dateStr}
ATTENTION: Board of Directors & Managing Counsel, ${client}
FROM: SLCMS Law Firm & Advocates (Litigation & Advisory Practice)
MATTER REFERENCE: ${caseNo}
SUBJECT: LEGAL OPINION ON LIABILITY, JURISDICTION, AND DEFENSE STRATEGY

1. INTRODUCTION & SCOPE OF INQUIRY
We have been retained by ${client} to furnish a comprehensive legal opinion concerning contractual risks, statutory exposure, and potential litigation outcomes arising out of the matter involving ${opposing}.

2. FACTUAL BASIS OF OPINION
Our analysis is predicated upon instructions furnished to us, including:
"${instructions}"

3. STATUTORY FRAMEWORK & TANZANIAN JURISPRUDENCE
Pursuant to the laws of the United Republic of Tanzania:
- Under Section 73 of the Law of Contract Act [Cap. 345], compensation for breach is recoverable for loss naturally arising in the usual course of things.
- Under established Court of Appeal jurisprudence, commercial contracts must be construed strictly according to the expressed intent of the parties without rewriting contractual covenants.

4. RISK EVALUATION & PROBABILITY OF SUCCESS
In our professional assessment:
- Likelihood of Successful Relief: Favorable (Approximately 75% to 80%).
- Primary Vulnerability: Evidentiary proof of liquidated damages and strict adherence to notice provisions.
- Exposure: Limited risk of adverse costs provided filings comply with timelines set under the Civil Procedure Code.

5. CONCLUSION & ADVOCATE RECOMMENDATION
We strongly advise instituting proceedings without delay while simultaneously leaving open a structured "Without Prejudice" commercial negotiation channel.

Respectfully submitted,
SLCMS LAW FIRM & ADVOCATES
Per: ${advocate}`;
    }

    // Default template fallback (Chamber Summons / Client brief)
    return `SLCMS LAW FIRM & ADVOCATES
IN THE ${court.toUpperCase()}
AT DAR ES SALAAM

MISCELLANEOUS CAUSE / SUIT NO. ${caseNo}
BETWEEN:
${client} ................................................................. PLAINTIFF / APPLICANT
AND
${opposing} ............................................................. DEFENDANT / RESPONDENT

GROUNDS IN SUPPORT OF CHAMBER SUMMONS / APPLICATION
(Under Order XXXVII Rules 1 & 2 of the Civil Procedure Code [Cap. 33 R.E. 2019] and Inherent Powers of the Court)

TAKE NOTICE that this Honorable Court shall be moved on behalf of the Applicant for Orders that:
1. An order of interim injunction do issue restraining the Respondent from interfering with the suit subject matter.
2. Costs of this application be provided for.

THE APPLICATION IS GROUNDED ON THE FOLLOWING:
1. That the Applicant has established a strong prima facie case with a high probability of success at trial.
2. That unless this Honorable Court grants the interim orders prayed for, the Applicant will suffer severe and irreparable damage that cannot be adequately compensated in monetary damages.
3. That the balance of convenience decisively tilts in favor of preserving the status quo ante.
4. That it is just, equitable, and in the interests of justice that the prayers sought herein be granted.

DATED at DAR ES SALAAM this ${dateStr}.

__________________________________________
${advocate}
Advocate for the Applicant
Presented for Filing: Registrar, ${court}`;
  },

  copyDraftText() {
    if (!this.currentDraftText) return;
    navigator.clipboard.writeText(this.currentDraftText).then(() => {
      App.showToast('Draft text copied to clipboard.', 'success');
    }).catch(() => {
      App.showToast('Unable to copy automatically. Please select text and copy manually.', 'warning');
    });
  },

  downloadDraft() {
    if (!this.currentDraftText) return;
    const blob = new Blob([this.currentDraftText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLCMS_Draft_${this.selectedDraftType}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.showToast('Draft downloaded successfully.', 'success');
  },

  openRevisionModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Request AI Revision</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Specify how the AI should adjust the draft (e.g. adjust statutory citations, change demand timeline, make tone firmer, or add specific evidence).
        </p>
        <div class="form-group">
          <label class="form-label required">Revision Instructions</label>
          <textarea id="ai-revision-prompt" class="form-control" rows="3" placeholder="e.g. Shorten the demand period to 7 statutory days and explicitly reference Section 73 of the Law of Contract Act..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="AIDraftAssistantView.applyRevision()">Apply AI Revision</button>
      </div>
    `, 'modal-md');
  },

  applyRevision() {
    const prompt = document.getElementById('ai-revision-prompt')?.value?.trim();
    if (!prompt) {
      App.showToast('Please enter revision instructions.', 'error');
      return;
    }
    App.closeModal();
    this.draftStatus = 'generating';
    App.refreshCurrentView();

    setTimeout(() => {
      this.currentDraftText += `\n\n[REVISION NOTE: Revised by AI per advocate instruction: "${prompt}"]\nADDENDUM: The statutory timeline and legal demands set forth above shall be strictly construed in accordance with Section 73 of the Law of Contract Act [Cap. 345 R.E. 2019].`;
      this.draftStatus = 'review_required';
      App.refreshCurrentView();
      App.showToast('Draft revised per your instructions.', 'success');
    }, 600);
  },

  approveAndAttachToCase(caseId) {
    const c = (SLCMS_STATE.cases || []).find(item => item.id === caseId) || SLCMS_STATE.cases[0];
    if (!c) {
      App.showToast('Please select a valid case to attach document.', 'error');
      return;
    }

    const tpl = this.templates[this.selectedDraftType] || this.templates.demand_letter;
    const reviewer = SLCMS_STATE.currentUser.name;
    const docId = 'doc-draft-' + Date.now();
    const docTitle = `${tpl.label} (Approved Draft)`;

    // Create official document record attached to this case
    const newDoc = {
      id: docId,
      caseId: c.id,
      caseNumber: c.caseNumber,
      title: docTitle,
      fileName: `${this.selectedDraftType}_${c.caseNumber.replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
      category: 'Pleadings & Drafts',
      fileType: 'TXT',
      size: `${(this.currentDraftText.length / 1024).toFixed(1)} KB`,
      version: 'v1.0 (Approved)',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: reviewer,
      accessLevel: 'Confidential',
      status: 'Ready for AI',
      extractedText: this.currentDraftText,
      verified: true
    };

    if (!SLCMS_STATE.documents) SLCMS_STATE.documents = [];
    SLCMS_STATE.documents.unshift(newDoc);

    // Update archive record
    this.draftsArchive.unshift({
      id: 'drf-' + Date.now(),
      caseId: c.id,
      caseNumber: c.caseNumber,
      caseTitle: c.title,
      client: c.client,
      draftType: this.selectedDraftType,
      title: docTitle,
      date: new Date().toISOString().split('T')[0],
      status: 'approved',
      approvedBy: reviewer,
      preview: this.currentDraftText.substring(0, 80) + '...'
    });

    this.draftStatus = 'approved';
    SLCMS_STATE.addAuditLog('AI Draft Approved & Attached', 'Documents', `Draft "${docTitle}" approved by ${reviewer} and attached to ${c.caseNumber}`);
    
    App.showToast(`Draft approved and attached to Case ${c.caseNumber} documents!`, 'success');
    App.refreshCurrentView();
  },

  loadArchivedDraft(draftId) {
    const drf = this.draftsArchive.find(d => d.id === draftId);
    if (!drf) return;
    this.selectedCaseId = drf.caseId;
    this.selectedDraftType = drf.draftType;
    const c = SLCMS_STATE.cases.find(x => x.id === drf.caseId) || {};
    this.currentDraftText = this.buildDraftText(c, drf.draftType, 'Reviewing archived version.');
    this.draftStatus = drf.status === 'approved' ? 'approved' : 'review_required';
    App.refreshCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    App.showToast(`Loaded draft: ${drf.title}`, 'info');
  }
};
