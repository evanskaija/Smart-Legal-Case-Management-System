/* ==========================================================================
   SLCMS - Cases Management, 7-Step Wizard & 8-Tab Details View
   ========================================================================== */

const CasesView = {
  currentViewMode: 'table', // 'table' | 'cards'
  selectedFilterStatus: 'All',
  selectedFilterType: 'All',
  selectedFilterPriority: 'All',
  searchQuery: '',
  newCaseStep: 1,
  newCaseViewMode: 'stepper',
  newCaseData: null,

  render() {
    const filteredCases = this.getFilteredCases();

    return `
      <div class="cases-view-container animate-fade">
        <!-- View Header -->
        <div class="view-header cases-view-header">
          <div>
            <h1 class="page-title cases-page-title">Legal Matters &amp; Cases</h1>
            <p class="cases-page-subtitle">
              Manage litigation proceedings, corporate advisory files, discovery records and court schedules
            </p>
          </div>
          <div class="cases-header-actions">
            <button class="btn btn-secondary cases-header-btn" onclick="CasesView.exportCasesCSV()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Export Case List</span>
            </button>
            <button class="btn btn-gold cases-header-btn" onclick="CasesView.openNewCaseModal()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Add New Case</span>
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="filter-bar cases-filter-bar">
          <div class="input-with-icon cases-search-input-wrap">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control cases-search-input" placeholder="Search cases, titles, clients, courts..." 
                   value="${this.searchQuery}" oninput="CasesView.handleSearch(this.value)">
          </div>

          <div class="cases-filters-grid">
            <div class="filter-group cases-filter-cell">
              <select class="form-control" onchange="CasesView.handleFilterStatus(this.value)">
                <option value="All" ${this.selectedFilterStatus === 'All' ? 'selected' : ''}>All Statuses</option>
                <option value="Attention" ${this.selectedFilterStatus === 'Attention' ? 'selected' : ''}>⚠️ Attention (3 Matters)</option>
                <option value="Active" ${this.selectedFilterStatus === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Pending" ${this.selectedFilterStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="On Hold" ${this.selectedFilterStatus === 'On Hold' ? 'selected' : ''}>On Hold</option>
                <option value="Won" ${this.selectedFilterStatus === 'Won' ? 'selected' : ''}>Won</option>
              </select>
            </div>

            <div class="filter-group cases-filter-cell">
              <select class="form-control" onchange="CasesView.handleFilterType(this.value)">
                <option value="All">All Practice Areas</option>
                <option value="Commercial Litigation">Commercial Litigation</option>
                <option value="Intellectual Property">Intellectual Property</option>
                <option value="Employment Law">Employment Law</option>
                <option value="Real Estate &amp; Zoning">Real Estate &amp; Zoning</option>
                <option value="White Collar Defense">White Collar Defense</option>
                <option value="Corporate &amp; Tax">Corporate &amp; Tax</option>
              </select>
            </div>

            <div class="filter-group cases-filter-cell">
              <select class="form-control" onchange="CasesView.handleFilterPriority(this.value)">
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <!-- View Mode Toggle -->
            <div class="view-toggle cases-view-toggle">
              <button class="view-toggle-btn ${this.currentViewMode === 'table' ? 'active' : ''}" onclick="CasesView.toggleViewMode('table')" title="Table View">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                <span class="cases-toggle-label">Table</span>
              </button>
              <button class="view-toggle-btn ${this.currentViewMode === 'cards' ? 'active' : ''}" onclick="CasesView.toggleViewMode('cards')" title="Card Grid View">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="7" height="7" x="3" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="14" rx="1"/>
                  <rect width="7" height="7" x="3" y="14" rx="1"/>
                </svg>
                <span class="cases-toggle-label">Cards</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ATTENTION PANEL: RENDERED WHEN FILTERED TO ATTENTION -->
        ${this.selectedFilterStatus === 'Attention' ? `
          <div class="alert alert-warning animate-fade" style="margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid #D97706; background: #FFFBEB; border: 1px solid #FDE68A; padding: 1rem 1.25rem; border-radius: 8px;">
            <div class="flex items-start gap-3">
              <span style="font-size: 1.35rem; line-height: 1;">⚠️</span>
              <div>
                <strong style="color: #92400E; font-size: 0.95rem;">3 Cases Requiring Administrative Attention</strong>
                <p style="font-size: 0.82rem; color: #78350F; margin: 0.25rem 0 0 0; line-height: 1.5;">
                  <strong>1. Greenfield Estate (MZB-2026-0155):</strong> Unassigned Staff &middot;
                  <strong>2. State vs. Jonathan Vance Jr. (FDC-2026-0098):</strong> Sensitive Matter Access Lock &middot;
                  <strong>3. Helios Energy (FTT-2025-0812):</strong> Metadata Verification &amp; Archive
                </p>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="CasesView.clearAttentionFilter()" style="white-space: nowrap; font-size: 0.8rem;">
              View All Cases
            </button>
          </div>
        ` : ''}

        <!-- ADMINISTRATOR CONTROL PANEL (When active session is Administrator) -->
        ${(SLCMS_STATE.currentUser?.role === 'Administrator') ? `
          <div class="card animate-fade cases-admin-suite-card">
            <div class="cases-admin-suite-header">
              <div class="cases-admin-suite-title-row">
                <div style="display: flex; align-items: center; gap: 0.55rem;">
                  <span class="cases-admin-crown-badge">👑</span>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                      <strong class="cases-admin-suite-title">Administrative Matter Governance Suite</strong>
                      <span class="badge badge-confidential cases-admin-suite-badge">LIMITED ADMIN</span>
                    </div>
                    <p class="cases-admin-suite-subtitle">Staffing assignments, sensitive matter seals, and archive protocol</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="cases-admin-actions-grid">
              <button class="btn btn-secondary btn-sm cases-admin-action-btn" onclick="CasesView.openAssignStaffModal()">
                <span>👤 Assign / Remove Staff</span>
              </button>
              <button class="btn btn-secondary btn-sm cases-admin-action-btn" onclick="CasesView.openMetadataCorrectionModal()">
                <span>📝 Correct Metadata</span>
              </button>
              <button class="btn btn-secondary btn-sm cases-admin-action-btn" onclick="CasesView.openSensitiveLockModal()">
                <span>🔒 Lock Sensitive Matter</span>
              </button>
              <button class="btn btn-secondary btn-sm cases-admin-action-btn" onclick="CasesView.openAccessListModal()">
                <span>👥 View Who Has Access</span>
              </button>
              <button class="btn btn-secondary btn-sm cases-admin-action-btn cases-admin-action-archive" onclick="CasesView.openArchiveModal()">
                <span>📦 Archive Matter</span>
              </button>
            </div>

            <div class="cases-admin-suite-notice">
              ⚖️ <strong>Separation of Legal Duties:</strong> Administrator manages staffing, metadata, sensitive locks, and archiving. Administrator <em>cannot</em> alter legal facts, change evidence, produce final legal advice, or approve court arguments.
            </div>
          </div>
        ` : ''}

        <!-- Render Table or Cards -->
        ${this.currentViewMode === 'table' ? this.renderCasesTable(filteredCases) : this.renderCasesCards(filteredCases)}
      </div>
    `;
  },

  getFilteredCases() {
    const user = SLCMS_STATE.currentUser;
    return SLCMS_STATE.cases.filter(c => {
      // Role & Assignment Access Control
      if (!SLCMS_STATE.canAccessCase(user, c.id)) {
        return false;
      }

      const matchSearch = !this.searchQuery || 
        c.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.client.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.lawyer.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.court.toLowerCase().includes(this.searchQuery.toLowerCase());

      let matchStatus = false;
      if (this.selectedFilterStatus === 'All') {
        matchStatus = true;
      } else if (this.selectedFilterStatus === 'Attention') {
        matchStatus = (c.id === 'case-103' || c.id === 'case-105' || c.id === 'case-106' || c.attentionRequired === true);
      } else {
        matchStatus = (c.status === this.selectedFilterStatus);
      }
      const matchType = this.selectedFilterType === 'All' || c.caseType === this.selectedFilterType;
      const matchPriority = this.selectedFilterPriority === 'All' || c.priority === this.selectedFilterPriority;

      return matchSearch && matchStatus && matchType && matchPriority;
    });
  },

  renderCasesTable(casesList) {
    if (casesList.length === 0) {
      return `
        <div class="card empty-state">
          <div class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h3 class="empty-title">No matching cases found</h3>
          <p class="empty-desc">Adjust your search parameters or practice area filters to view available legal matters.</p>
          <button class="btn btn-secondary" onclick="CasesView.clearFilters()">Clear Filters</button>
        </div>
      `;
    }

    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Case Title & Matter</th>
              <th>Client</th>
              <th>Practice Area</th>
              <th>Assigned Counsel</th>
              <th>Next Hearing</th>
              <th>Priority</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${casesList.map(c => `
              <tr>
                <td>
                  <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.82rem; color: var(--color-primary);">
                    ${c.caseNumber}
                  </span>
                </td>
                <td>
                  <div style="font-weight: 600; color: var(--color-primary); cursor: pointer;" onclick="CasesView.openCaseDetails('${c.id}')">
                    ${c.title}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${c.court}</div>
                </td>
                <td>
                  <div style="font-weight: 500;">${c.client}</div>
                  <span style="font-size: 0.72rem; color: var(--color-text-muted);">${c.clientType}</span>
                </td>
                <td>
                  <span class="badge" style="background: var(--color-surface-subtle); color: var(--color-primary); border: 1px solid var(--color-border);">
                    ${c.caseType}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="avatar avatar-sm avatar-navy">${c.lawyerAvatar}</div>
                    <span style="font-size: 0.82rem; font-weight: 500;">${c.lawyer.split(',')[0]}</span>
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; font-size: 0.82rem; color: ${c.nextHearingDate === 'Completed' ? 'var(--color-text-muted)' : 'var(--color-danger)'};">
                    ${c.nextHearingDate}
                  </div>
                </td>
                <td>
                  <span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span>
                </td>
                <td>
                  <span class="badge badge-${c.status.toLowerCase().replace(' ', '')}">
                    <span class="badge-dot"></span>
                    ${c.status}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="flex items-center justify-end gap-1">
                    <button class="btn btn-secondary btn-sm" onclick="CasesView.openCaseDetails('${c.id}')" title="View Deep Case Dossier">
                      View
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="CasesView.quickAddTask('${c.id}')" title="Add Task to Case">
                      +Task
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between" style="margin-top: 1rem; font-size: 0.8rem; color: var(--color-text-secondary);">
        <div>Showing <strong>${casesList.length}</strong> of <strong>${SLCMS_STATE.cases.length}</strong> legal matters</div>
        <div class="flex items-center gap-1">
          <button class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button class="btn btn-gold btn-sm">1</button>
          <button class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    `;
  },

  renderCasesCards(casesList) {
    return `
      <div class="cases-card-grid">
        ${casesList.map(c => `
          <div class="case-card-item" onclick="CasesView.openCaseDetails('${c.id}')">
            <div>
              <div class="flex items-center justify-between" style="margin-bottom: 0.65rem;">
                <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.8rem; color: var(--color-gold);">
                  ${c.caseNumber}
                </span>
                <span class="badge badge-${c.status.toLowerCase().replace(' ', '')}">
                  ${c.status}
                </span>
              </div>
              <h3 style="font-size: 1.05rem; color: var(--color-primary); margin-bottom: 0.5rem; line-height: 1.3;">
                ${c.title}
              </h3>
              <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 1rem; line-height: 1.4;">
                ${c.description.substring(0, 105)}...
              </p>
            </div>

            <div>
              <div style="background: var(--color-surface-subtle); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.78rem;">
                <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                  <span style="color: var(--color-text-muted);">Client:</span>
                  <strong>${c.client}</strong>
                </div>
                <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                  <span style="color: var(--color-text-muted);">Court:</span>
                  <span class="truncate" style="max-width: 170px;">${c.court}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span style="color: var(--color-text-muted);">Next Hearing:</span>
                  <strong style="color: var(--color-danger);">${c.nextHearingDate}</strong>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2" style="border-top: 1px solid var(--color-border-subtle);">
                <div class="flex items-center gap-2">
                  <div class="avatar avatar-sm avatar-navy">${c.lawyerAvatar}</div>
                  <span style="font-size: 0.78rem; font-weight: 600;">${c.lawyer.split(',')[0]}</span>
                </div>
                <span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  handleSearch(val) {
    this.searchQuery = val;
    App.refreshCurrentView();
  },

  handleFilterStatus(val) {
    this.selectedFilterStatus = val;
    App.refreshCurrentView();
  },

  handleFilterType(val) {
    this.selectedFilterType = val;
    App.refreshCurrentView();
  },

  handleFilterPriority(val) {
    this.selectedFilterPriority = val;
    App.refreshCurrentView();
  },

  toggleViewMode(mode) {
    this.currentViewMode = mode;
    App.refreshCurrentView();
  },

  clearFilters() {
    this.searchQuery = '';
    this.selectedFilterStatus = 'All';
    this.selectedFilterType = 'All';
    this.selectedFilterPriority = 'All';
    App.refreshCurrentView();
  },

  exportCasesCSV() {
    App.showToast('Exporting active case registers to encrypted CSV archive...', 'info');
  },

  // -------------------------------------------------------------
  // SIMPLE ADD NEW CASE FORM (5 BOXES, PROGRESS BAR & MOBILE FIT)
  // -------------------------------------------------------------
  newCaseStep: 1, // 1: Case Details, 2: Parties & Court, 3: Upload & Save
  newCaseViewMode: 'stepper', // 'stepper' | 'all'
  newCaseData: null,
  newCaseDuplicateMatch: null,

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  openNewCaseModal(preselectedClientId = null) {
    this.newCaseStep = 1;
    this.newCaseViewMode = 'stepper';
    this.newCaseDuplicateMatch = null;

    let clientName = '';
    let clientId = '';
    if (preselectedClientId) {
      const foundClient = (SLCMS_STATE.clients || []).find(c => c.id === preselectedClientId);
      if (foundClient) {
        clientName = foundClient.name;
        clientId = foundClient.id;
      }
    }

    this.newCaseData = {
      // Box 1: Basic Case Details
      title: '',
      caseNumber: '',
      caseType: 'Civil', // Civil, Criminal, Land, Matrimonial, Probate, Commercial, Miscellaneous Application, Other
      year: '2020',
      citation: '', // optional

      // Box 2: Parties and Court
      firstParty: { name: '', role: 'Appellant' },
      secondParty: { name: '', role: 'Respondent' },
      additionalParties: [],
      court: 'High Court of Tanzania',
      registry: 'Dar es Salaam District Registry',
      judge: '',
      decisionDate: '2020-12-31',

      // Box 3: Origin and Outcome
      originCourt: '', // optional
      originCaseNo: '', // optional
      subject: '',
      outcome: 'Pending',
      finalOrder: '',

      // Box 4: Assignment and Access
      client: clientName,
      clientId: clientId,
      seniorLawyer: 'Eleanor Vance, Esq.',
      seniorLawyerId: 'usr-003',
      lawyer: 'Julian Mercer, Esq.',
      lawyerId: 'usr-004',
      clerk: 'Marcus Bell',
      clerkId: 'usr-008',
      priority: 'High',
      status: 'Active',
      accessLevel: 'Assigned Team Only',

      // Box 5: Upload Original PDF
      pdfFile: null,
      processScannedForAI: true
    };

    this.renderNewCaseModal();
  },

  loadTanzaniaSampleCase() {
    this.newCaseData.title = 'Abdallah Salum Muwinge v Halima Ismail';
    this.newCaseData.caseNumber = 'PC Civil Appeal No. 69 of 2018';
    this.newCaseData.caseType = 'Matrimonial';
    this.newCaseData.year = '2020';
    this.newCaseData.citation = '[2020] TZHC 10045';
    this.newCaseData.firstParty = { name: 'Abdallah Salum Muwinge', role: 'Appellant' };
    this.newCaseData.secondParty = { name: 'Halima Ismail', role: 'Respondent' };
    this.newCaseData.additionalParties = [];
    this.newCaseData.court = 'High Court of Tanzania';
    this.newCaseData.registry = 'Dar es Salaam District Registry';
    this.newCaseData.judge = 'S. M. Kulita, J.';
    this.newCaseData.decisionDate = '2020-12-31';
    this.newCaseData.originCourt = 'Morogoro Urban Primary Court';
    this.newCaseData.originCaseNo = 'Matrimonial Cause No. 59 of 2017';
    this.newCaseData.subject = 'Matrimonial property, child maintenance and missing trial records.';
    this.newCaseData.outcome = 'Proceedings Nullified';
    this.newCaseData.finalOrder = 'The lower-court proceedings and judgments were nullified. A trial de novo was ordered before another magistrate with new assessors.';
    this.newCaseData.client = 'Halima Ismail';
    this.newCaseData.seniorLawyer = 'Eleanor Vance, Esq.';
    this.newCaseData.seniorLawyerId = 'usr-003';
    this.newCaseData.lawyer = 'Julian Mercer, Esq.';
    this.newCaseData.lawyerId = 'usr-004';
    this.newCaseData.clerk = 'Marcus Bell';
    this.newCaseData.clerkId = 'usr-008';
    this.newCaseData.priority = 'High';
    this.newCaseData.status = 'Closed';
    this.newCaseData.accessLevel = 'Assigned Team Only';
    this.newCaseData.pdfFile = {
      name: 'Abdallah_Salum_Muwinge_v_Halima_Ismail_PC_Civil_Appeal_69_2018.pdf',
      size: '2.4 MB',
      pages: 14,
      isScanned: true,
      ocrStatus: 'Scanned PDF detected'
    };
    this.newCaseData.processScannedForAI = true;
    this.renderNewCaseModal();
    App.showToast('Sample Tanzanian precedent (Muwinge v Ismail) loaded successfully!', 'success');
  },

  syncNewCaseFormData() {
    if (!this.newCaseData) return;
    const getVal = id => {
      const el = document.getElementById(id);
      return el ? el.value : null;
    };

    const t = getVal('new-case-title');
    if (t !== null) this.newCaseData.title = t;

    const cn = getVal('new-case-number');
    if (cn !== null) this.newCaseData.caseNumber = cn;

    const ct = getVal('new-case-type');
    if (ct !== null) this.newCaseData.caseType = ct;

    const yr = getVal('new-case-year');
    if (yr !== null) this.newCaseData.year = yr;

    const cit = getVal('new-case-citation');
    if (cit !== null) this.newCaseData.citation = cit;

    const p1n = getVal('new-case-p1-name');
    if (p1n !== null) this.newCaseData.firstParty.name = p1n;

    const p1r = getVal('new-case-p1-role');
    if (p1r !== null) this.newCaseData.firstParty.role = p1r;

    const p2n = getVal('new-case-p2-name');
    if (p2n !== null) this.newCaseData.secondParty.name = p2n;

    const p2r = getVal('new-case-p2-role');
    if (p2r !== null) this.newCaseData.secondParty.role = p2r;

    if (Array.isArray(this.newCaseData.additionalParties)) {
      this.newCaseData.additionalParties.forEach((ap, idx) => {
        const apn = getVal(`new-case-add-p-${idx}`);
        if (apn !== null) ap.name = apn;
        const apr = getVal(`new-case-add-r-${idx}`);
        if (apr !== null) ap.role = apr;
      });
    }

    const crt = getVal('new-case-court');
    if (crt !== null) this.newCaseData.court = crt;

    const reg = getVal('new-case-registry');
    if (reg !== null) this.newCaseData.registry = reg;

    const jdg = getVal('new-case-judge');
    if (jdg !== null) this.newCaseData.judge = jdg;

    const dt = getVal('new-case-decision-date');
    if (dt !== null) this.newCaseData.decisionDate = dt;

    const oc = getVal('new-case-orig-court');
    if (oc !== null) this.newCaseData.originCourt = oc;

    const ocn = getVal('new-case-orig-no');
    if (ocn !== null) this.newCaseData.originCaseNo = ocn;

    const subj = getVal('new-case-subject');
    if (subj !== null) this.newCaseData.subject = subj;

    const outc = getVal('new-case-outcome');
    if (outc !== null) this.newCaseData.outcome = outc;

    const fo = getVal('new-case-final-order');
    if (fo !== null) this.newCaseData.finalOrder = fo;

    const cli = getVal('new-case-client');
    if (cli !== null) this.newCaseData.client = cli;

    const snr = getVal('new-case-senior-lawyer');
    if (snr !== null) this.newCaseData.seniorLawyer = snr;

    const law = getVal('new-case-lawyer');
    if (law !== null) this.newCaseData.lawyer = law;

    const clk = getVal('new-case-clerk');
    if (clk !== null) this.newCaseData.clerk = clk;

    const pri = getVal('new-case-priority');
    if (pri !== null) this.newCaseData.priority = pri;

    const st = getVal('new-case-status');
    if (st !== null) this.newCaseData.status = st;

    const al = getVal('new-case-access-level');
    if (al !== null) this.newCaseData.accessLevel = al;

    const pai = document.getElementById('new-case-process-ai');
    if (pai) this.newCaseData.processScannedForAI = pai.checked;
  },

  updateLiveReviewCard() {
    const d = this.newCaseData;
    if (!d) return;
    const titleEl = document.getElementById('review-card-title');
    if (titleEl) titleEl.innerText = d.title || 'Abdallah Salum Muwinge v Halima Ismail';

    const statusEl = document.getElementById('review-card-status');
    if (statusEl) {
      statusEl.innerText = `Status: ${d.status || 'Active'}`;
      statusEl.className = `badge badge-${(d.status || 'Active').toLowerCase()}`;
    }

    const casenoEl = document.getElementById('review-card-caseno');
    if (casenoEl) casenoEl.innerText = d.caseNumber || 'PC Civil Appeal No. 69 of 2018';

    const courtYearEl = document.getElementById('review-card-court-year');
    if (courtYearEl) courtYearEl.innerText = `${d.court || 'High Court of Tanzania'} Â· ${d.caseType || 'Matrimonial'} Case Â· ${d.year || '2020'}`;

    const partiesEl = document.getElementById('review-card-parties');
    if (partiesEl) {
      partiesEl.innerHTML = `<strong>${this.escapeHtml(d.firstParty.name || 'Abdallah Salum Muwinge')}</strong> â€” ${this.escapeHtml(d.firstParty.role || 'Appellant')} &nbsp;â€¢&nbsp; <strong>${this.escapeHtml(d.secondParty.name || 'Halima Ismail')}</strong> â€” ${this.escapeHtml(d.secondParty.role || 'Respondent')}`;
    }

    const counselEl = document.getElementById('review-card-counsel');
    if (counselEl) counselEl.innerText = d.lawyer || 'Julian Mercer, Esq.';
  },

  goToNewCaseStep(stepNum) {
    this.syncNewCaseFormData();
    this.newCaseStep = stepNum;
    this.renderNewCaseModal();
  },

  setNewCaseViewMode(mode) {
    this.syncNewCaseFormData();
    this.newCaseViewMode = mode;
    this.renderNewCaseModal();
  },

  addAnotherParty() {
    this.syncNewCaseFormData();
    if (!Array.isArray(this.newCaseData.additionalParties)) {
      this.newCaseData.additionalParties = [];
    }
    this.newCaseData.additionalParties.push({ name: '', role: 'Interested Party' });
    this.renderNewCaseModal();
  },

  removeParty(idx) {
    this.syncNewCaseFormData();
    if (Array.isArray(this.newCaseData.additionalParties)) {
      this.newCaseData.additionalParties.splice(idx, 1);
    }
    this.renderNewCaseModal();
  },

  handleCasePdfUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const mbSize = (file.size / (1024 * 1024)).toFixed(1);
    const estPages = Math.max(1, Math.floor(file.size / 180000)) || 8;
    this.newCaseData.pdfFile = {
      name: file.name,
      size: `${mbSize} MB`,
      pages: estPages,
      isScanned: true,
      ocrStatus: 'Scanned PDF detected'
    };
    this.newCaseData.processScannedForAI = true;
    this.renderNewCaseModal();
    App.showToast(`Case document ${file.name} attached.`, 'info');
  },

  handleCasePdfDrop(event) {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) return;
    const mbSize = (file.size / (1024 * 1024)).toFixed(1);
    const estPages = Math.max(1, Math.floor(file.size / 180000)) || 8;
    this.newCaseData.pdfFile = {
      name: file.name,
      size: `${mbSize} MB`,
      pages: estPages,
      isScanned: true,
      ocrStatus: 'Scanned PDF detected'
    };
    this.newCaseData.processScannedForAI = true;
    this.renderNewCaseModal();
    App.showToast(`Judgment PDF ${file.name} uploaded.`, 'info');
  },

  removeCasePdf() {
    this.newCaseData.pdfFile = null;
    this.renderNewCaseModal();
  },

  quickRegisterClient() {
    const name = prompt('Enter Client Full Name / Corporate Entity:');
    if (name && name.trim()) {
      this.newCaseData.client = name.trim();
      const clientInput = document.getElementById('new-case-client');
      if (clientInput) clientInput.value = name.trim();
      App.showToast(`Client "${name.trim()}" selected for this matter.`, 'success');
    }
  },

  validateNewCase() {
    this.syncNewCaseFormData();
    const d = this.newCaseData;
    const errors = [];

    if (!d.title || !d.title.trim()) errors.push({ field: 'new-case-title', errId: 'err-title', step: 1, msg: 'Case title is required' });
    if (!d.caseNumber || !d.caseNumber.trim()) errors.push({ field: 'new-case-number', errId: 'err-caseno', step: 1, msg: 'Case number is required' });
    if (!d.caseType || !d.caseType.trim()) errors.push({ field: 'new-case-type', errId: 'err-type', step: 1, msg: 'Case type is required' });
    if (!d.year || !d.year.toString().trim()) errors.push({ field: 'new-case-year', errId: 'err-year', step: 1, msg: 'Decision year is required' });

    if (!d.firstParty.name || !d.firstParty.name.trim()) errors.push({ field: 'new-case-p1-name', errId: 'err-p1-name', step: 2, msg: 'First party name is required' });
    if (!d.secondParty.name || !d.secondParty.name.trim()) errors.push({ field: 'new-case-p2-name', errId: 'err-p2-name', step: 2, msg: 'Second party name is required' });

    if (!d.court || !d.court.trim()) errors.push({ field: 'new-case-court', errId: 'err-court', step: 2, msg: 'Court is required' });
    if (!d.judge || !d.judge.trim()) errors.push({ field: 'new-case-judge', errId: 'err-judge', step: 2, msg: 'Judge or coram is required' });
    if (!d.decisionDate || !d.decisionDate.trim()) errors.push({ field: 'new-case-decision-date', errId: 'err-decision-date', step: 2, msg: 'Decision date is required' });

    if (!d.status || !d.status.trim()) errors.push({ field: 'new-case-status', errId: 'err-status', step: 2, msg: 'Case status is required' });
    if (!d.lawyer || !d.lawyer.trim()) errors.push({ field: 'new-case-lawyer', errId: 'err-lawyer', step: 2, msg: 'Assigned lawyer is required' });

    if (!d.pdfFile) errors.push({ field: 'case-pdf-dropzone', errId: 'err-pdf', step: 3, msg: 'Original PDF document must be attached' });

    return errors;
  },

  checkForDuplicateCase(d) {
    const norm = str => (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCaseno = norm(d.caseNumber);
    const cleanCit = norm(d.citation);
    const cleanTitle = norm(d.title);
    const cleanPdf = norm(d.pdfFile?.name);

    for (const c of (SLCMS_STATE.cases || [])) {
      if (cleanCaseno && norm(c.caseNumber) === cleanCaseno) return c;
      if (cleanCit && c.citation && norm(c.citation) === cleanCit) return c;
      if (cleanTitle && norm(c.title) === cleanTitle && norm(c.court) === norm(d.court)) return c;
      if (cleanPdf && norm(c.pdfFilename || c.pdfDocument?.name) === cleanPdf) return c;
    }

    for (const j of (SLCMS_STATE.tanzaniaJudgments || [])) {
      if (cleanCaseno && norm(j.caseNumber) === cleanCaseno) return j;
      if (cleanCit && norm(j.citation) === cleanCit) return j;
      if (cleanTitle && norm(j.title) === cleanTitle) return j;
    }

    return null;
  },

  showDuplicateWarning(existingCase) {
    this.newCaseDuplicateMatch = existingCase;
    this.renderNewCaseModal();
  },

  dismissDuplicateWarning() {
    this.newCaseDuplicateMatch = null;
    this.renderNewCaseModal();
  },

  attachPdfToExistingCase(caseId) {
    const target = (SLCMS_STATE.cases || []).find(c => c.id === caseId);
    if (target && this.newCaseData.pdfFile) {
      target.pdfDocument = this.newCaseData.pdfFile;
      target.pdfFilename = this.newCaseData.pdfFile.name;
      target.ocrStatus = 'Review Required';
      SLCMS_STATE.persistCases();
      SLCMS_STATE.addAuditLog('Judgment PDF Attached', 'Case Repository', `${target.caseNumber} - Attached ${this.newCaseData.pdfFile.name}`);
      App.closeModal();
      App.showToast(`PDF document attached to existing case ${target.caseNumber}!`, 'success');
      App.refreshCurrentView();
    } else {
      App.showToast('Existing case updated with PDF attachment.', 'info');
      App.closeModal();
    }
  },

  openCaseFromDuplicate(caseId) {
    App.closeModal();
    this.openCaseDetails(caseId);
  },

  saveNewCaseDraft() {
    this.syncNewCaseFormData();
    try {
      localStorage.setItem('slcms_case_draft', JSON.stringify(this.newCaseData));
    } catch(e) {}
    App.closeModal();
    App.showToast('Case details saved to local draft queue.', 'info');
  },

  registerNewCaseAndProcessPdf(bypassDuplicateCheck = false) {
    const errors = this.validateNewCase();
    if (errors.length > 0) {
      const firstErr = errors[0];
      if (this.newCaseViewMode === 'stepper' && this.newCaseStep !== firstErr.step) {
        this.newCaseStep = firstErr.step;
        this.renderNewCaseModal();
      }
      setTimeout(() => {
        const el = document.getElementById(firstErr.field);
        if (el) {
          el.classList.add('is-invalid');
          el.focus();
        }
        const errLabel = document.getElementById(firstErr.errId);
        if (errLabel) errLabel.classList.add('visible');
      }, 50);
      App.showToast(firstErr.msg, 'error');
      return;
    }

    const d = this.newCaseData;

    if (!bypassDuplicateCheck) {
      const duplicate = this.checkForDuplicateCase(d);
      if (duplicate) {
        this.showDuplicateWarning(duplicate);
        return;
      }
    }

    const newId = 'case-' + Date.now();
    const newCase = {
      id: newId,
      caseNumber: d.caseNumber.trim(),
      title: d.title.trim(),
      caseType: d.caseType,
      year: d.year ? d.year.toString().trim() : '2020',
      citation: d.citation ? d.citation.trim() : '',
      parties: [
        { name: d.firstParty.name.trim(), role: d.firstParty.role },
        { name: d.secondParty.name.trim(), role: d.secondParty.role },
        ...((d.additionalParties || []).filter(p => p.name && p.name.trim()).map(p => ({ name: p.name.trim(), role: p.role })))
      ],
      client: (d.client && d.client.trim()) ? d.client.trim() : d.firstParty.name.trim(),
      clientId: d.clientId || 'cli-01',
      opposingParty: `${d.secondParty.name.trim()} (${d.secondParty.role})`,
      court: d.court,
      registry: d.registry,
      presidingOfficer: d.judge,
      decisionDate: d.decisionDate,
      originCourt: d.originCourt,
      originCaseNo: d.originCaseNo,
      subject: d.subject,
      outcome: d.outcome,
      finalOrder: d.finalOrder,
      seniorLawyer: d.seniorLawyer,
      seniorLawyerId: d.seniorLawyerId,
      lawyer: d.lawyer,
      lawyerId: d.lawyerId,
      lawyerAvatar: d.lawyer.includes('Eleanor') ? 'EV' : (d.lawyer.includes('Sarah') ? 'SM' : 'JM'),
      supportingStaff: d.clerk === 'None' ? '' : d.clerk,
      priority: d.priority,
      status: d.status,
      accessLevel: d.accessLevel,
      openingDate: d.decisionDate || new Date().toISOString().substring(0, 10),
      expectedCompletion: '2027-12-31',
      progressPct: 15,
      totalBilled: 0,
      totalPaid: 0,
      notes: d.finalOrder ? `Operative Order: ${d.finalOrder}` : 'Matter registered via Add New Case form.',
      description: d.subject || (d.finalOrder ? `Operative Order: ${d.finalOrder}` : `${d.title} (${d.court})`),
      // PDF & Ingestion Pipeline
      pdfDocument: d.pdfFile,
      pdfFilename: d.pdfFile ? d.pdfFile.name : '',
      isScanned: d.pdfFile ? d.pdfFile.isScanned : true,
      processScannedForAI: d.processScannedForAI,
      ocrStatus: 'Uploaded',
      aiStatus: 'OCR Processing',
      requiresAdminAttention: false
    };

    // Save and permanently persist
    SLCMS_STATE.addCase(newCase);
    App.closeModal();
    App.showToast(`Legal Case ${newCase.caseNumber} registered successfully! Ingestion status: Uploaded`, 'success');
    App.refreshCurrentView();

    // Async simulated progression for scanned PDFs:
    // Uploaded -> OCR Processing -> Review Required -> Ready for AI
    if (newCase.isScanned && newCase.processScannedForAI) {
      setTimeout(() => {
        const target = (SLCMS_STATE.cases || []).find(c => c.id === newCase.id);
        if (target) {
          target.ocrStatus = 'OCR Processing';
          target.aiStatus = 'OCR Processing';
          SLCMS_STATE.persistCases();
          if (App.currentView === 'cases') App.refreshCurrentView();
        }
      }, 2000);

      setTimeout(() => {
        const target = (SLCMS_STATE.cases || []).find(c => c.id === newCase.id);
        if (target) {
          target.ocrStatus = 'Review Required';
          target.aiStatus = 'Review Required';
          SLCMS_STATE.persistCases();
          if (App.currentView === 'cases') App.refreshCurrentView();
        }
      }, 4500);

      setTimeout(() => {
        const target = (SLCMS_STATE.cases || []).find(c => c.id === newCase.id);
        if (target) {
          target.ocrStatus = 'Completed';
          target.aiStatus = 'Ready for AI';
          SLCMS_STATE.persistCases();
          if (App.currentView === 'cases') App.refreshCurrentView();
        }
      }, 7500);
    }
  },

  confirmRemoveCase(caseId) {
    const c = (SLCMS_STATE.cases || []).find(item => item.id === caseId);
    if (!c) return;
    App.confirmAction({
      title: 'Remove Legal Case',
      message: `Are you sure you want to permanently remove <strong>${this.escapeHtml(c.caseNumber)} - ${this.escapeHtml(c.title)}</strong>? This will remove it from the system and update persistent storage.`,
      confirmText: 'Remove Case',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        SLCMS_STATE.deleteCase(caseId);
        App.closeModal();
        App.showToast(`Case ${c.caseNumber} was permanently removed.`, 'info');
        App.refreshCurrentView();
      }
    });
  },

  renderNewCaseModal() {
    const d = this.newCaseData;
    const step = this.newCaseStep;
    const isAllMode = this.newCaseViewMode === 'all';
    const dup = this.newCaseDuplicateMatch;

    App.openModal(`
      <!-- Modal Header -->
      <div class="add-case-header">
        <div class="add-case-header-left">
          <div class="add-case-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v18M6 8l6-5 6 5M3 13l3-5 3 5a3 3 0 0 1-6 0zm12 0l3-5 3 5a3 3 0 0 1-6 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="add-case-title">Add New Case</h2>
            <p class="add-case-subtitle">Enter the important case information and attach the related PDF document.</p>
          </div>
        </div>
        <div class="add-case-header-actions">
          <button type="button" class="btn-add-case-sample" onclick="CasesView.loadTanzaniaSampleCase()" title="Pre-fill with Tanzanian Precedent (Abdallah Salum Muwinge v Halima Ismail)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Load Tanzanian Judgment Precedent</span>
          </button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #CBD5E1; font-size: 1.15rem;">&times;</button>
        </div>
      </div>

      <!-- Short Progress Bar (1. Case Details -> 2. Parties & Court -> 3. Upload & Save) -->
      <div class="add-case-progress-wrap">
        <div class="add-case-stepper">
          <button type="button" class="add-case-step-btn ${step === 1 ? 'active' : (step > 1 ? 'completed' : '')}" onclick="CasesView.goToNewCaseStep(1)">
            <span class="add-case-step-num">${step > 1 ? '&#10003;' : '1'}</span>
            <span class="step-label-full">1. Case Details</span>
            <span class="step-label-short" style="display:none;">1. Details</span>
          </button>
          <span class="add-case-step-arrow">&rarr;</span>
          <button type="button" class="add-case-step-btn ${step === 2 ? 'active' : (step > 2 ? 'completed' : '')}" onclick="CasesView.goToNewCaseStep(2)">
            <span class="add-case-step-num">${step > 2 ? '&#10003;' : '2'}</span>
            <span class="step-label-full">2. Parties &amp; Court</span>
            <span class="step-label-short" style="display:none;">2. Parties</span>
          </button>
          <span class="add-case-step-arrow">&rarr;</span>
          <button type="button" class="add-case-step-btn ${step === 3 ? 'active' : ''}" onclick="CasesView.goToNewCaseStep(3)">
            <span class="add-case-step-num">3</span>
            <span class="step-label-full">3. Upload &amp; Save</span>
            <span class="step-label-short" style="display:none;">3. Upload</span>
          </button>
        </div>

        <div class="add-case-view-switch">
          <button type="button" class="add-case-view-switch-btn ${!isAllMode ? 'active' : ''}" onclick="CasesView.setNewCaseViewMode('stepper')">Step Mode</button>
          <button type="button" class="add-case-view-switch-btn ${isAllMode ? 'active' : ''}" onclick="CasesView.setNewCaseViewMode('all')">All 5 Boxes</button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="add-case-body">
        ${dup ? `
          <!-- Duplicate Case Warning Dialog -->
          <div class="case-duplicate-warning-modal animate-fade">
            <span class="case-duplicate-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle; margin-right:3px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
              Possible Duplicate Case
            </span>
            <h3 style="color: #991B1B; font-size: 1.15rem; font-weight: 700; margin: 0 0 0.35rem 0;">
              Possible Duplicate Case
            </h3>
            <p style="font-size: 0.9rem; color: #1E293B; margin-bottom: 0.75rem;">
              A case with the same citation or case number already exists in the SLCMS repository.
            </p>
            <div class="case-duplicate-match-box">
              <strong>Existing Matter:</strong> ${this.escapeHtml(dup.title)}<br>
              <strong>Case Number:</strong> ${this.escapeHtml(dup.caseNumber)}<br>
              <strong>Court &amp; Year:</strong> ${this.escapeHtml(dup.court)} (${this.escapeHtml(dup.year || '2020')})<br>
              ${dup.citation ? `<strong>Citation:</strong> ${this.escapeHtml(dup.citation)}<br>` : ''}
              ${dup.parties ? `<strong>Parties:</strong> ${dup.parties.map(p => this.escapeHtml(p.name)).join(' v ')}` : ''}
            </div>
            <p style="font-size: 0.78rem; color: #64748B; margin-bottom: 1.25rem;">
              This check prevents one judgment from appearing twice in Legal AI results. You may attach your PDF to the existing matter file or inspect its dossier.
            </p>
            <div class="flex gap-2 flex-wrap" style="justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="CasesView.dismissDuplicateWarning()">Cancel</button>
              <button type="button" class="btn btn-secondary" onclick="CasesView.attachPdfToExistingCase('${dup.id}')">Attach PDF to Existing Case</button>
              <button type="button" class="btn btn-gold" onclick="CasesView.openCaseFromDuplicate('${dup.id}')">Open Existing Case</button>
            </div>
          </div>
        ` : `
          ${isAllMode ? `
            <!-- All 5 Boxes in 1-column layout -->
            ${this.getBox1HTML(d)}
            ${this.getBox2HTML(d)}
            ${this.getBox3HTML(d)}
            ${this.getBox4HTML(d)}
            ${this.getBox5HTML(d)}
            ${this.getReviewCardHTML(d)}
          ` : `
            <!-- Stepper Mode (1 -> 2 -> 3) -->
            ${step === 1 ? `
              ${this.getBox1HTML(d)}
              ${this.getBox3HTML(d)}
            ` : ''}

            ${step === 2 ? `
              ${this.getBox2HTML(d)}
              ${this.getBox4HTML(d)}
            ` : ''}

            ${step === 3 ? `
              ${this.getBox5HTML(d)}
              ${this.getReviewCardHTML(d)}
            ` : ''}
          `}
        `}
      </div>

      <!-- Modal Footer Action Bar -->
      <div class="add-case-footer">
        <button type="button" class="btn-add-case-secondary" onclick="App.closeModal()">
          <span>Cancel</span>
        </button>

        <div class="add-case-footer-right">
          <button type="button" class="btn-add-case-secondary" onclick="CasesView.saveNewCaseDraft()">
            <span>Save as Draft</span>
          </button>

          ${!isAllMode && step > 1 ? `
            <button type="button" class="btn-add-case-secondary" onclick="CasesView.goToNewCaseStep(${step - 1})">
              <span>&larr; Back</span>
            </button>
          ` : ''}

          ${!isAllMode && step < 3 ? `
            <button type="button" class="btn-add-case-primary" onclick="CasesView.goToNewCaseStep(${step + 1})">
              <span>Next: ${step === 1 ? 'Parties &amp; Court' : 'Upload &amp; Save'} &rarr;</span>
            </button>
          ` : `
            <button type="button" class="btn-add-case-primary" onclick="CasesView.registerNewCaseAndProcessPdf()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Register Case &amp; Process PDF</span>
            </button>
          `}
        </div>
      </div>
    `, 'modal-add-case');
  },

  getBox1HTML(d) {
    const caseTypes = ['Civil', 'Criminal', 'Land', 'Matrimonial', 'Probate', 'Commercial', 'Miscellaneous Application', 'Other'];
    return `
      <div class="add-case-card">
        <div class="add-case-card-header">
          <h3 class="add-case-card-title">
            <span>Box 1: Basic Case Details</span>
          </h3>
          <span class="badge badge-active" style="font-size: 0.7rem;">Identification</span>
        </div>
        <p class="add-case-card-desc">This box identifies the case.</p>

        <!-- Case Title (Full Width) -->
        <div class="add-case-field">
          <label class="add-case-label" for="new-case-title">
            <span>Case Title <span class="add-case-req">*</span></span>
            <span class="add-case-opt">Full formal caption</span>
          </label>
          <input type="text" id="new-case-title" class="add-case-input" 
                 placeholder="e.g. Abdallah Salum Muwinge v Halima Ismail" 
                 value="${this.escapeHtml(d.title)}" 
                 oninput="CasesView.newCaseData.title = this.value; CasesView.updateLiveReviewCard();">
          <div class="add-case-err-msg" id="err-title">Case title is required</div>
        </div>

        <!-- Grid: Case Number, Type, Decision Year, Citation -->
        <div class="add-case-grid-4">
          <div class="add-case-field">
            <label class="add-case-label" for="new-case-number">
              <span>Case Number <span class="add-case-req">*</span></span>
            </label>
            <input type="text" id="new-case-number" class="add-case-input" 
                   placeholder="e.g. PC Civil Appeal No. 69 of 2018" 
                   value="${this.escapeHtml(d.caseNumber)}"
                   oninput="CasesView.newCaseData.caseNumber = this.value; CasesView.updateLiveReviewCard();">
            <div class="add-case-err-msg" id="err-caseno">Case number is required</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-type">
              <span>Case Type <span class="add-case-req">*</span></span>
            </label>
            <select id="new-case-type" class="add-case-select" 
                    onchange="CasesView.newCaseData.caseType = this.value; CasesView.updateLiveReviewCard();">
              ${caseTypes.map(t => `<option value="${t}" ${d.caseType === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-year">
              <span>Decision Year <span class="add-case-req">*</span></span>
            </label>
            <input type="text" id="new-case-year" class="add-case-input" 
                   placeholder="e.g. 2020" 
                   value="${this.escapeHtml(d.year)}"
                   oninput="CasesView.newCaseData.year = this.value; CasesView.updateLiveReviewCard();">
            <div class="add-case-err-msg" id="err-year">Decision year is required</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-citation">
              <span>Citation <span class="add-case-opt">&mdash; optional</span></span>
            </label>
            <input type="text" id="new-case-citation" class="add-case-input" 
                   placeholder="e.g. [2020] TZHC 10045" 
                   value="${this.escapeHtml(d.citation)}"
                   oninput="CasesView.newCaseData.citation = this.value;">
          </div>
        </div>
      </div>
    `;
  },

  getBox2HTML(d) {
    const partyRoles = ['Applicant', 'Respondent', 'Appellant', 'Plaintiff', 'Defendant', 'Petitioner', 'Accused', 'Republic', 'Interested Party'];
    return `
      <div class="add-case-card">
        <div class="add-case-card-header">
          <h3 class="add-case-card-title">
            <span>Box 2: Parties and Court</span>
          </h3>
          <span class="badge badge-confidential" style="font-size: 0.7rem;">Litigants &amp; Bench</span>
        </div>
        <p class="add-case-card-desc">This box records the people involved and the court that handled the case.</p>

        <!-- First Party -->
        <div class="add-case-party-row">
          <div>
            <label class="add-case-label" for="new-case-p1-name">First Party: Full Name <span class="add-case-req">*</span></label>
            <input type="text" id="new-case-p1-name" class="add-case-input" 
                   placeholder="e.g. Abdallah Salum Muwinge" 
                   value="${this.escapeHtml(d.firstParty.name)}"
                   oninput="CasesView.newCaseData.firstParty.name = this.value; CasesView.updateLiveReviewCard();">
            <div class="add-case-err-msg" id="err-p1-name">First party name is required</div>
          </div>
          <div>
            <label class="add-case-label" for="new-case-p1-role">Legal Role <span class="add-case-req">*</span></label>
            <select id="new-case-p1-role" class="add-case-select" 
                    onchange="CasesView.newCaseData.firstParty.role = this.value; CasesView.updateLiveReviewCard();">
              ${partyRoles.map(r => `<option value="${r}" ${d.firstParty.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div style="font-size: 0.74rem; color: #64748B; font-weight: 600; padding-bottom: 0.5rem;">
            First Party
          </div>
        </div>

        <!-- Second Party -->
        <div class="add-case-party-row">
          <div>
            <label class="add-case-label" for="new-case-p2-name">Second Party: Full Name <span class="add-case-req">*</span></label>
            <input type="text" id="new-case-p2-name" class="add-case-input" 
                   placeholder="e.g. Halima Ismail" 
                   value="${this.escapeHtml(d.secondParty.name)}"
                   oninput="CasesView.newCaseData.secondParty.name = this.value; CasesView.updateLiveReviewCard();">
            <div class="add-case-err-msg" id="err-p2-name">Second party name is required</div>
          </div>
          <div>
            <label class="add-case-label" for="new-case-p2-role">Legal Role <span class="add-case-req">*</span></label>
            <select id="new-case-p2-role" class="add-case-select" 
                    onchange="CasesView.newCaseData.secondParty.role = this.value; CasesView.updateLiveReviewCard();">
              ${partyRoles.map(r => `<option value="${r}" ${d.secondParty.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div style="font-size: 0.74rem; color: #64748B; font-weight: 600; padding-bottom: 0.5rem;">
            Second Party
          </div>
        </div>

        <!-- Additional Parties -->
        ${(d.additionalParties || []).map((ap, idx) => `
          <div class="add-case-party-row">
            <div>
              <label class="add-case-label" for="new-case-add-p-${idx}">Additional Party #${idx + 3}: Full Name</label>
              <input type="text" id="new-case-add-p-${idx}" class="add-case-input" 
                     placeholder="e.g. Attorney General / Interested Party" 
                     value="${this.escapeHtml(ap.name)}"
                     oninput="CasesView.newCaseData.additionalParties[${idx}].name = this.value; CasesView.updateLiveReviewCard();">
            </div>
            <div>
              <label class="add-case-label" for="new-case-add-r-${idx}">Legal Role</label>
              <select id="new-case-add-r-${idx}" class="add-case-select" 
                      onchange="CasesView.newCaseData.additionalParties[${idx}].role = this.value; CasesView.updateLiveReviewCard();">
                ${partyRoles.map(r => `<option value="${r}" ${ap.role === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div>
              <button type="button" class="btn-remove-party" onclick="CasesView.removeParty(${idx})" title="Remove Party">&times;</button>
            </div>
          </div>
        `).join('')}

        <!-- Add Another Party Button -->
        <div style="margin-top: 0.65rem; margin-bottom: 1.25rem;">
          <button type="button" class="btn-add-party" onclick="CasesView.addAnotherParty()">
            <span>+ Add Another Party</span>
          </button>
        </div>

        <!-- Court Information Section -->
        <div class="add-case-subheading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-7 10 7M12 3v2"/>
          </svg>
          <span>Court Information</span>
        </div>

        <div class="add-case-grid-4">
          <div class="add-case-field">
            <label class="add-case-label" for="new-case-court">
              <span>Court <span class="add-case-req">*</span></span>
            </label>
            <input type="text" id="new-case-court" class="add-case-input" 
                   list="tz-court-list" 
                   placeholder="e.g. High Court of Tanzania" 
                   value="${this.escapeHtml(d.court)}"
                   oninput="CasesView.newCaseData.court = this.value; CasesView.updateLiveReviewCard();">
            <datalist id="tz-court-list">
              <option value="High Court of Tanzania">
              <option value="Court of Appeal of Tanzania">
              <option value="High Court of Tanzania (Commercial Division)">
              <option value="High Court of Tanzania (Land Division)">
              <option value="Resident Magistrate Court">
              <option value="District Court">
              <option value="Primary Court">
            </datalist>
            <div class="add-case-err-msg" id="err-court">Court is required</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-registry">
              <span>Registry or station</span>
            </label>
            <input type="text" id="new-case-registry" class="add-case-input" 
                   placeholder="e.g. Dar es Salaam District Registry" 
                   value="${this.escapeHtml(d.registry)}"
                   oninput="CasesView.newCaseData.registry = this.value;">
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-judge">
              <span>Judge or coram <span class="add-case-req">*</span></span>
            </label>
            <input type="text" id="new-case-judge" class="add-case-input" 
                   placeholder="e.g. S. M. Kulita, J." 
                   value="${this.escapeHtml(d.judge)}"
                   oninput="CasesView.newCaseData.judge = this.value;">
            <div class="add-case-err-msg" id="err-judge">Judge or coram is required</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-decision-date">
              <span>Decision date <span class="add-case-req">*</span></span>
            </label>
            <input type="date" id="new-case-decision-date" class="add-case-input" 
                   value="${this.escapeHtml(d.decisionDate)}"
                   oninput="CasesView.newCaseData.decisionDate = this.value; CasesView.updateLiveReviewCard();">
            <div class="add-case-err-msg" id="err-decision-date">Decision date is required</div>
          </div>
        </div>
      </div>
    `;
  },

  getBox3HTML(d) {
    const outcomes = [
      'Appeal Allowed',
      'Appeal Dismissed',
      'Application Granted',
      'Application Dismissed',
      'Case Struck Out',
      'Proceedings Nullified',
      'Retrial Ordered',
      'Pending',
      'Other'
    ];
    return `
      <div class="add-case-card">
        <div class="add-case-card-header">
          <h3 class="add-case-card-title">
            <span>Box 3: Origin and Outcome</span>
          </h3>
          <span class="badge badge-active" style="font-size: 0.7rem;">Trial Court &amp; Ruling</span>
        </div>
        <p class="add-case-card-desc">Keep this box simple but useful.</p>

        <!-- Originating court & case number -->
        <div class="add-case-grid-2">
          <div class="add-case-field">
            <label class="add-case-label" for="new-case-orig-court">
              <span>Originating court or matter <span class="add-case-opt">&mdash; optional</span></span>
            </label>
            <input type="text" id="new-case-orig-court" class="add-case-input" 
                   placeholder="e.g. Morogoro Urban Primary Court" 
                   value="${this.escapeHtml(d.originCourt)}"
                   oninput="CasesView.newCaseData.originCourt = this.value;">
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-orig-no">
              <span>Originating case number <span class="add-case-opt">&mdash; optional</span></span>
            </label>
            <input type="text" id="new-case-orig-no" class="add-case-input" 
                   placeholder="e.g. Matrimonial Cause No. 59 of 2017" 
                   value="${this.escapeHtml(d.originCaseNo)}"
                   oninput="CasesView.newCaseData.originCaseNo = this.value;">
          </div>
        </div>

        <!-- Short Case Subject -->
        <div class="add-case-field">
          <label class="add-case-label" for="new-case-subject">
            <span>Short case subject</span>
            <span class="add-case-opt">Core dispute summary</span>
          </label>
          <input type="text" id="new-case-subject" class="add-case-input" 
                 placeholder="e.g. Matrimonial property, child maintenance and missing trial records." 
                 value="${this.escapeHtml(d.subject)}"
                 oninput="CasesView.newCaseData.subject = this.value;">
        </div>

        <!-- Outcome Dropdown -->
        <div class="add-case-field">
          <label class="add-case-label" for="new-case-outcome">
            <span>Outcome</span>
          </label>
          <select id="new-case-outcome" class="add-case-select" 
                  onchange="CasesView.newCaseData.outcome = this.value;">
            ${outcomes.map(o => `<option value="${o}" ${d.outcome === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>

        <!-- Important final order -->
        <div class="add-case-field">
          <label class="add-case-label" for="new-case-final-order">
            <span>Important final order</span>
            <span class="add-case-opt">Operative directions of the bench</span>
          </label>
          <textarea id="new-case-final-order" class="add-case-textarea" rows="2" 
                    placeholder="e.g. The lower-court proceedings and judgments were nullified. A trial de novo was ordered before another magistrate with new assessors." 
                    oninput="CasesView.newCaseData.finalOrder = this.value;">${this.escapeHtml(d.finalOrder)}</textarea>
        </div>
      </div>
    `;
  },

  getBox4HTML(d) {
    const clients = SLCMS_STATE.clients || [];
    const seniorLawyers = (SLCMS_STATE.users || []).filter(u => u.role === 'Senior Lawyer' || u.role === 'Administrator');
    const allLawyers = (SLCMS_STATE.users || []).filter(u => u.role === 'Lawyer' || u.role === 'Senior Lawyer');
    const allClerks = (SLCMS_STATE.users || []).filter(u => u.role === 'Legal Clerk');

    return `
      <div class="add-case-card">
        <div class="add-case-card-header">
          <h3 class="add-case-card-title">
            <span>Box 4: Assignment and Access</span>
          </h3>
          <span class="badge badge-confidential" style="font-size: 0.7rem;">Team &amp; Ethical Wall</span>
        </div>
        <p class="add-case-card-desc">This connects the case to the correct users.</p>

        <!-- Row 1: Related Client, Senior Lawyer, Assigned Lawyer -->
        <div class="add-case-grid-3">
          <div class="add-case-field">
            <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
              <label class="add-case-label" for="new-case-client" style="margin-bottom: 0;">Related client</label>
              <button type="button" class="btn btn-ghost btn-xs text-gold" style="font-size: 0.7rem; padding: 0 4px;" onclick="CasesView.quickRegisterClient()">+ Register Client</button>
            </div>
            <input type="text" id="new-case-client" class="add-case-input" list="client-options-list" 
                   placeholder="Search existing client or enter name" 
                   value="${this.escapeHtml(d.client)}" 
                   oninput="CasesView.newCaseData.client = this.value;">
            <datalist id="client-options-list">
              ${clients.map(c => `<option value="${c.name}">`).join('')}
              <option value="Abdallah Salum Muwinge">
              <option value="Halima Ismail">
              <option value="General Public / Precedent Record">
            </datalist>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-senior-lawyer">
              <span>Senior Lawyer</span>
              <span class="add-case-opt">Supervising</span>
            </label>
            <select id="new-case-senior-lawyer" class="add-case-select" 
                    onchange="CasesView.newCaseData.seniorLawyer = this.value;">
              ${seniorLawyers.map(u => `<option value="${u.name}" ${d.seniorLawyer === u.name ? 'selected' : ''}>${u.name} (${u.role})</option>`).join('')}
              <option value="Eleanor Vance, Esq." ${d.seniorLawyer === 'Eleanor Vance, Esq.' ? 'selected' : ''}>Eleanor Vance, Esq.</option>
              <option value="Adv. J. K. Rweyemamu" ${d.seniorLawyer === 'Adv. J. K. Rweyemamu' ? 'selected' : ''}>Adv. J. K. Rweyemamu</option>
            </select>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-lawyer">
              <span>Assigned Lawyer <span class="add-case-req">*</span></span>
              <span class="add-case-opt">Case Lead</span>
            </label>
            <select id="new-case-lawyer" class="add-case-select" 
                    onchange="CasesView.newCaseData.lawyer = this.value; CasesView.updateLiveReviewCard();">
              ${allLawyers.map(u => `<option value="${u.name}" ${d.lawyer === u.name ? 'selected' : ''}>${u.name} (${u.role})</option>`).join('')}
              <option value="Julian Mercer, Esq." ${d.lawyer === 'Julian Mercer, Esq.' ? 'selected' : ''}>Julian Mercer, Esq.</option>
              <option value="Adv. Sarah Mwangi" ${d.lawyer === 'Adv. Sarah Mwangi' ? 'selected' : ''}>Adv. Sarah Mwangi</option>
            </select>
            <div class="add-case-err-msg" id="err-lawyer">Assigned lawyer is required</div>
          </div>
        </div>

        <!-- Row 2: Legal Clerk, Priority, Status, Access Level -->
        <div class="add-case-grid-4" style="margin-top: 0.85rem;">
          <div class="add-case-field">
            <label class="add-case-label" for="new-case-clerk">
              <span>Legal Clerk <span class="add-case-opt">&mdash; optional</span></span>
            </label>
            <select id="new-case-clerk" class="add-case-select" 
                    onchange="CasesView.newCaseData.clerk = this.value;">
              <option value="None">-- None --</option>
              ${allClerks.map(u => `<option value="${u.name}" ${d.clerk === u.name ? 'selected' : ''}>${u.name}</option>`).join('')}
              <option value="Marcus Bell" ${d.clerk === 'Marcus Bell' ? 'selected' : ''}>Marcus Bell</option>
              <option value="Sophia Chen" ${d.clerk === 'Sophia Chen' ? 'selected' : ''}>Sophia Chen</option>
            </select>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-priority">
              <span>Priority</span>
            </label>
            <select id="new-case-priority" class="add-case-select" 
                    onchange="CasesView.newCaseData.priority = this.value;">
              <option value="Low" ${d.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Medium" ${d.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="High" ${d.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Urgent" ${d.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-status">
              <span>Status <span class="add-case-req">*</span></span>
            </label>
            <select id="new-case-status" class="add-case-select" 
                    onchange="CasesView.newCaseData.status = this.value; CasesView.updateLiveReviewCard();">
              <option value="Pending" ${d.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Active" ${d.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Closed" ${d.status === 'Closed' ? 'selected' : ''}>Closed</option>
              <option value="Archived" ${d.status === 'Archived' ? 'selected' : ''}>Archived</option>
            </select>
            <div class="add-case-err-msg" id="err-status">Case status is required</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-access-level">
              <span>Access level</span>
            </label>
            <select id="new-case-access-level" class="add-case-select" 
                    onchange="CasesView.newCaseData.accessLevel = this.value;">
              <option value="Assigned Team Only" ${d.accessLevel === 'Assigned Team Only' ? 'selected' : ''}>Assigned Team Only</option>
              <option value="All Lawyers" ${d.accessLevel === 'All Lawyers' ? 'selected' : ''}>All Lawyers</option>
              <option value="Restricted" ${d.accessLevel === 'Restricted' ? 'selected' : ''}>Restricted</option>
            </select>
          </div>
        </div>

        <div style="font-size: 0.76rem; color: #64748B; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.5rem 0.85rem; margin-top: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span><strong>Security Protocol:</strong> The system must allow only assigned users to open restricted cases.</span>
        </div>
      </div>
    `;
  },

  getBox5HTML(d) {
    const pdf = d.pdfFile;
    return `
      <div class="add-case-card">
        <div class="add-case-card-header">
          <h3 class="add-case-card-title">
            <span>Box 5: Upload Original PDF</span>
          </h3>
          <span class="badge badge-active" style="font-size: 0.7rem;">Document Ingestion</span>
        </div>
        <p class="add-case-card-desc">Attach the primary judgment or pleading PDF to feed the Legal AI precedent engine.</p>

        <!-- Large Upload Box -->
        <div class="case-upload-box" id="case-pdf-dropzone" 
             onclick="document.getElementById('case-pdf-file-input').click()"
             ondragover="event.preventDefault(); this.classList.add('drag-over');"
             ondragleave="this.classList.remove('drag-over');"
             ondrop="event.preventDefault(); this.classList.remove('drag-over'); CasesView.handleCasePdfDrop(event);">
          <div class="case-upload-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.6" style="margin:0 auto;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h4 class="case-upload-title">Upload Case PDF</h4>
          <p class="case-upload-sub">
            Drag and drop the judgment here<br>or select a file from your computer.
          </p>
          <button type="button" class="btn-case-choose-pdf">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Choose PDF</span>
          </button>
          <div class="case-upload-meta">PDF, DOCX, JPG or PNG &middot; Maximum 25 MB</div>
        </div>
        <input type="file" id="case-pdf-file-input" style="display:none;" accept=".pdf,.docx,.jpg,.jpeg,.png" onchange="CasesView.handleCasePdfUpload(event)">
        <div class="add-case-err-msg" id="err-pdf" style="margin-top: 0.5rem;">Original PDF document must be attached</div>

        <!-- Selected / Attached PDF Details -->
        ${pdf ? `
          <div class="case-uploaded-file-card animate-fade">
            <div class="case-file-summary-grid">
              <div class="case-file-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <div class="case-file-name">${this.escapeHtml(pdf.name)}</div>
                <div class="case-file-specs">
                  <span><strong>Size:</strong> ${pdf.size}</span>
                  <span>&bull;</span>
                  <span><strong>Pages:</strong> ${pdf.pages}</span>
                  <span>&bull;</span>
                  <span class="badge ${pdf.isScanned ? 'badge-warning' : 'badge-success'}">
                    ${pdf.isScanned ? 'Scanned PDF' : 'Searchable PDF'}
                  </span>
                  <span>&bull;</span>
                  <span style="color: #64748B;">OCR: <strong>${pdf.ocrStatus || 'Scanned PDF detected'}</strong></span>
                </div>
              </div>
              <div>
                <button type="button" class="btn btn-ghost btn-sm text-danger" onclick="CasesView.removeCasePdf()" title="Remove PDF">&times; Remove</button>
              </div>
            </div>

            ${pdf.isScanned ? `
              <div class="case-scanned-alert">
                <div class="case-scanned-alert-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div class="case-scanned-alert-title">Scanned PDF detected</div>
                  <p class="case-scanned-alert-desc">The system will use OCR to extract searchable text.</p>
                </div>
              </div>
            ` : ''}

            <div class="case-ai-checkbox-wrap">
              <input type="checkbox" id="new-case-process-ai" ${d.processScannedForAI ? 'checked' : ''} 
                     onchange="CasesView.newCaseData.processScannedForAI = this.checked">
              <label for="new-case-process-ai">&#9745; Process scanned PDF for Legal AI</label>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  getReviewCardHTML(d) {
    const isPdfAttached = !!d.pdfFile;
    return `
      <div class="case-final-review-card">
        <div class="case-review-header">
          <h4 class="case-review-title" id="review-card-title">
            ${this.escapeHtml(d.title || 'Abdallah Salum Muwinge v Halima Ismail')}
          </h4>
          <span class="badge badge-${(d.status || 'Active').toLowerCase()}" id="review-card-status">
            Status: ${d.status || 'Closed'}
          </span>
        </div>
        <div class="case-review-body">
          <div class="case-review-row" style="font-family: var(--font-mono); font-weight: 700; color: #0B1F33;" id="review-card-caseno">
            ${this.escapeHtml(d.caseNumber || 'PC Civil Appeal No. 69 of 2018')}
          </div>
          <div class="case-review-row" style="color: #475569;" id="review-card-court-year">
            ${this.escapeHtml(d.court || 'High Court of Tanzania')} &middot; ${this.escapeHtml(d.caseType || 'Matrimonial')} Case &middot; ${this.escapeHtml(d.year || '2020')}
          </div>
          <div class="case-review-row" id="review-card-parties">
            <strong>${this.escapeHtml(d.firstParty.name || 'Abdallah Salum Muwinge')}</strong> &mdash; ${this.escapeHtml(d.firstParty.role || 'Appellant')} &nbsp;&bull;&nbsp; 
            <strong>${this.escapeHtml(d.secondParty.name || 'Halima Ismail')}</strong> &mdash; ${this.escapeHtml(d.secondParty.role || 'Respondent')}
          </div>
          <div class="case-review-row" style="display: flex; gap: 1rem; align-items: center; margin-top: 0.35rem; flex-wrap: wrap;">
            <span>Counsel: <strong id="review-card-counsel">${this.escapeHtml(d.lawyer || 'Julian Mercer, Esq.')}</strong></span>
            <span>&bull;</span>
            <span id="review-card-pdf">
              PDF: ${isPdfAttached ? `<strong style="color: #16A34A;">Attached (${this.escapeHtml(d.pdfFile.name)})</strong>` : '<strong style="color: #DC2626;">Not Attached</strong>'}
            </span>
          </div>
        </div>
      </div>
    `;
  },
  // 8-TAB DEEP CASE DETAILS VIEW
  // -------------------------------------------------------------
  activeCaseTab: 'overview',
  activeCaseId: null,

  openCaseDetails(caseId) {
    if (!SLCMS_STATE.canAccessCase(SLCMS_STATE.currentUser, caseId)) {
      App.showAccessRestrictedModal('Matter Dossier Restricted', 'You are not assigned to this case. Access restricted under firm ethical wall protocol.');
      return;
    }

    this.activeCaseId = caseId;
    this.activeCaseTab = 'overview';
    const c = SLCMS_STATE.cases.find(item => item.id === caseId) || SLCMS_STATE.cases[0];

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <div class="flex items-center gap-2" style="margin-bottom: 0.35rem;">
            <span style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--color-gold);">
              ${c.caseNumber}
            </span>
            <span class="badge badge-${c.status.toLowerCase().replace(' ', '')}">${c.status}</span>
            <span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority} Priority</span>
          </div>
          <h2 style="color: #FFFFFF; font-size: 1.35rem; line-height: 1.2;">
            ${c.title}
          </h2>
          <div style="font-size: 0.8rem; color: #CBD5E1; margin-top: 0.25rem;">
            Client: <strong>${c.client}</strong> • Lead Counsel: <strong>${c.lawyer}</strong> • ${c.court}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <!-- 4 Tab Navigation Bar -->
      <div class="tabs-nav" style="padding: 0 1.5rem; margin-bottom: 0; background: var(--color-surface-subtle);">
        <button class="tab-btn ${this.activeCaseTab === 'overview' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('overview')">1. Overview</button>
        <button class="tab-btn ${this.activeCaseTab === 'documents' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('documents')">2. Documents (${SLCMS_STATE.documents.filter(d => d.caseId === c.id).length})</button>
        <button class="tab-btn ${this.activeCaseTab === 'tasks' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('tasks')">3. Tasks &amp; Deadlines (${SLCMS_STATE.tasks.filter(t => t.caseId === c.id).length})</button>
        <button class="tab-btn ${this.activeCaseTab === 'legal-research' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('legal-research')">4. Legal Research</button>
      </div>

      <div class="modal-body" id="case-tab-content-body" style="padding: 1.5rem;">
        ${this.renderCaseTabContent(c, this.activeCaseTab)}
      </div>

      <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div class="flex items-center gap-2 flex-wrap">
          <button class="btn btn-secondary btn-sm" onclick="CasesView.openEditCaseModal('${c.id}')">✏️ Edit Case</button>
          <button class="btn btn-secondary btn-sm" onclick="CasesView.openAssignLawyerModal('${c.id}')">👤 Assign Lawyer</button>
          <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); AIAssistantView.openDraftMode('${c.id}')">✍️ Draft with SLCMS AI</button>
          ${c.status !== 'Closed' ? `
            <button class="btn btn-ghost btn-sm text-danger" onclick="CasesView.openCloseCaseModal('${c.id}')">🔒 Close Case</button>
          ` : `
            <button class="btn btn-secondary btn-sm" onclick="CasesView.reopenCase('${c.id}')">🔓 Reopen Case</button>
          `}
          <button class="btn btn-ghost btn-sm text-danger" onclick="CasesView.confirmRemoveCase('${c.id}')" title="Permanently remove case from storage">🗑️ Remove Case</button>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary" onclick="App.closeModal()">Close Dossier</button>
          <button class="btn btn-gold" onclick="CasesView.quickAddDocument('${c.id}')">+ Upload Document</button>
        </div>
      </div>
    `, 'modal-xl modal-fixed-dossier');
  },

  switchCaseDetailTab(tabName) {
    this.activeCaseTab = tabName;
    const c = SLCMS_STATE.cases.find(item => item.id === this.activeCaseId);
    const body = document.getElementById('case-tab-content-body');
    if (body && c) {
      body.innerHTML = this.renderCaseTabContent(c, tabName);
      const tabBtns = document.querySelectorAll('.tabs-nav .tab-btn');
      tabBtns.forEach(btn => {
        if (btn.innerText.toLowerCase().includes(tabName.replace('-', ' '))) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  },

  renderCaseTabContent(c, tab) {
    switch (tab) {
      case 'overview':
        const caseDocsCount = SLCMS_STATE.documents.filter(d => d.caseId === c.id).length;
        const precedentsCount = (c.linkedPrecedents || []).length;
        const isClosed = c.status === 'Closed';

        return `
          <!-- End-to-End Case Progress & Milestone Tracker -->
          <div class="card" style="margin-bottom: 1.25rem; padding: 1.25rem; background: linear-gradient(135deg, rgba(16,42,67,0.03), rgba(200,155,60,0.04)); border: 1px solid var(--color-border);">
            <div class="flex items-center justify-between" style="margin-bottom: 0.85rem;">
              <div>
                <h4 style="margin:0;font-size:0.95rem;color:var(--color-primary);display:flex;align-items:center;gap:0.4rem;">
                  <span>📈</span> Case Progress &amp; Milestone Tracker
                </h4>
                <div style="font-size:0.75rem;color:var(--color-text-secondary);margin-top:0.15rem;">
                  Full Matter Lifecycle: Intake &rarr; Case Lodged &rarr; Lawyer Assigned &rarr; Documents &rarr; Tasks &rarr; Legal AI &rarr; Closure
                </div>
              </div>
              <span class="badge ${isClosed ? 'badge-active' : 'badge-gold'}" style="font-size:0.75rem;font-weight:700;">
                ${isClosed ? '✓ 100% Concluded' : (c.progressPct || 65) + '% Progress'}
              </span>
            </div>

            <!-- 6 Visual Milestone Pills -->
            <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:0.5rem;text-align:center;">
              <div style="background:rgba(16,185,129,0.12);border:1px solid #10B981;border-radius:8px;padding:0.6rem 0.35rem;">
                <div style="font-size:0.8rem;font-weight:700;color:#10B981;">✓ 1. Intake</div>
                <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:0.15rem;">Client Linked</div>
              </div>
              <div style="background:rgba(16,185,129,0.12);border:1px solid #10B981;border-radius:8px;padding:0.6rem 0.35rem;">
                <div style="font-size:0.8rem;font-weight:700;color:#10B981;">✓ 2. Lodged</div>
                <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:0.15rem;">${c.caseNumber}</div>
              </div>
              <div style="background:rgba(16,185,129,0.12);border:1px solid #10B981;border-radius:8px;padding:0.6rem 0.35rem;">
                <div style="font-size:0.8rem;font-weight:700;color:#10B981;">✓ 3. Assigned</div>
                <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:0.15rem;">${(c.lawyer || '').split(',')[0]}</div>
              </div>
              <div style="background:${caseDocsCount > 0 ? 'rgba(16,185,129,0.12);border:1px solid #10B981;' : 'var(--color-surface-subtle);border:1px solid var(--color-border);'};border-radius:8px;padding:0.6rem 0.35rem;">
                <div style="font-size:0.8rem;font-weight:700;color:${caseDocsCount > 0 ? '#10B981' : 'var(--color-primary)'};">
                  ${caseDocsCount > 0 ? '✓ ' : ''}4. Documents
                </div>
                <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:0.15rem;">${caseDocsCount} Files (OCR)</div>
              </div>
              <div style="background:${precedentsCount > 0 ? 'rgba(16,185,129,0.12);border:1px solid #10B981;' : 'rgba(200,155,60,0.1);border:1px solid var(--color-gold);'};border-radius:8px;padding:0.6rem 0.35rem;">
                <div style="font-size:0.8rem;font-weight:700;color:${precedentsCount > 0 ? '#10B981' : 'var(--color-gold)'};">
                  ${precedentsCount > 0 ? '✓ ' : ''}5. AI Research
                </div>
                <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:0.15rem;">${precedentsCount} Precedents</div>
              </div>
              <div style="background:${isClosed ? 'rgba(16,185,129,0.15);border:1px solid #10B981;' : 'var(--color-surface-subtle);border:1px solid var(--color-border);'};border-radius:8px;padding:0.6rem 0.35rem;">
                <div style="font-size:0.8rem;font-weight:700;color:${isClosed ? '#10B981' : 'var(--color-text-muted)'};">
                  ${isClosed ? '✓ ' : ''}6. Closure
                </div>
                <div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:0.15rem;">${isClosed ? 'Finalized' : 'In Progress'}</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-6">
            <!-- Left 2 Cols: Case Summary & Core Info -->
            <div style="grid-column: span 2;" class="flex flex-col gap-4">
              <!-- Matter Description Card -->
              <div class="card">
                <div class="flex items-center justify-between" style="margin-bottom: 0.5rem;">
                  <h4 style="color: var(--color-primary); margin: 0;">Case Description &amp; Fact Outline</h4>
                  <span class="badge badge-confidential">Privileged Matter</span>
                </div>
                <p style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main);">${c.description || 'No description provided.'}</p>
                ${c.closureOutcome ? `
                  <div style="margin-top: 0.75rem; padding: 0.75rem 1rem; background: rgba(16,185,129,0.1); border-left: 3px solid #10B981; border-radius: var(--radius-sm); font-size: 0.84rem;">
                    <strong style="color: #10B981;">Final Closure Outcome:</strong> ${c.closureOutcome}
                  </div>
                ` : ''}
              </div>

              <!-- Case Core Specifications Matrix -->
              <div class="card">
                <h4 style="color: var(--color-primary); margin-bottom: 0.85rem;">Case Details &amp; Court Forum</h4>
                <div class="grid grid-cols-2 gap-3" style="font-size: 0.85rem;">
                  <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">Case Title / Caption:</div>
                    <strong style="color: var(--color-primary);">${c.title}</strong>
                  </div>
                  <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">Case Number:</div>
                    <strong style="font-family: var(--font-mono); color: var(--color-gold);">${c.caseNumber}</strong>
                  </div>
                  <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">Case Type / Practice Area:</div>
                    <strong>${c.caseType || c.category || 'General Litigation'}</strong>
                  </div>
                  <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">Court / Jurisdiction:</div>
                    <strong>${c.court}</strong>
                  </div>
                  <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">Client:</div>
                    <strong style="color: var(--color-primary);">${c.client}</strong> (${c.clientType || 'Corporate'})
                  </div>
                  <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">Opposing Party:</div>
                    <strong style="color: var(--color-danger);">${c.opposingParty || 'Adverse Party'}</strong>
                    <div style="font-size: 0.72rem; color: var(--color-text-secondary); margin-top: 0.15rem;">Counsel: ${c.opposingCounsel || 'Not on record'}</div>
                  </div>
                </div>
              </div>

              <!-- Case Quick Actions Bar -->
              <div class="card" style="background: var(--color-surface-subtle); padding: 1rem;">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem;">
                  Quick Matter Management
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <button class="btn btn-secondary btn-sm" onclick="CasesView.openEditCaseModal('${c.id}')">✏️ Edit Case</button>
                  <button class="btn btn-secondary btn-sm" onclick="CasesView.openAssignLawyerModal('${c.id}')">👤 Reassign Lawyer</button>
                  <button class="btn btn-secondary btn-sm" onclick="CasesView.quickAddDocument('${c.id}')">📄 Upload Document</button>
                  <button class="btn btn-secondary btn-sm" onclick="CasesView.quickAddTask('${c.id}')">⏱️ Add Task</button>
                  <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); AIAssistantView.openDraftMode('${c.id}')">✍️ Draft with SLCMS AI</button>
                  <button class="btn btn-gold btn-sm" onclick="CasesView.switchCaseDetailTab('legal-research')">⚖️ Legal Research (${precedentsCount})</button>
                </div>
              </div>
            </div>

            <!-- Right 1 Col: Key Dates, Counsel & Status -->
            <div class="flex flex-col gap-4">
              <!-- Key Dates Card -->
              <div class="card" style="background: var(--color-surface-subtle);">
                <h4 style="color: var(--color-primary); font-size: 0.95rem; margin-bottom: 0.75rem;">Key Matter Dates</h4>
                <div class="flex flex-col gap-2.5" style="font-size: 0.84rem;">
                  <div class="flex justify-between" style="padding-bottom: 0.4rem; border-bottom: 1px solid var(--color-border-subtle);">
                    <span style="color: var(--color-text-secondary);">Case Status:</span>
                    <span class="badge badge-${c.status.toLowerCase().replace(' ', '')}">${c.status}</span>
                  </div>
                  <div class="flex justify-between" style="padding-bottom: 0.4rem; border-bottom: 1px solid var(--color-border-subtle);">
                    <span style="color: var(--color-text-secondary);">Date Opened:</span>
                    <strong>${c.openingDate || '2026-01-15'}</strong>
                  </div>
                  <div class="flex justify-between" style="padding-bottom: 0.4rem; border-bottom: 1px solid var(--color-border-subtle);">
                    <span style="color: var(--color-text-secondary);">Next Hearing:</span>
                    <strong style="color: var(--color-danger);">${c.nextHearingDate || 'TBD'}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span style="color: var(--color-text-secondary);">Important Deadline:</span>
                    <strong style="color: var(--color-gold);">${c.expectedCompletion || c.importantDeadline || '2026-10-15'}</strong>
                  </div>
                </div>
              </div>

              <!-- Assigned Legal Team Card -->
              <div class="card" style="background: var(--color-surface-subtle);">
                <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
                  <h4 style="color: var(--color-primary); font-size: 0.95rem; margin: 0;">Assigned Counsel</h4>
                  <button class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 0;" onclick="CasesView.openAssignLawyerModal('${c.id}')">Change</button>
                </div>
                <div class="flex items-center gap-2.5" style="margin-bottom: 0.75rem;">
                  <div class="avatar avatar-sm avatar-navy">${c.lawyerAvatar || 'EV'}</div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">${c.lawyer}</div>
                    <div style="font-size: 0.7rem; color: var(--color-gold); font-weight: 600;">Assigned Lead Lawyer</div>
                  </div>
                </div>
                <div class="flex items-center gap-2.5">
                  <div class="avatar avatar-sm avatar-teal">${c.supportingStaff ? c.supportingStaff.substring(0, 2).toUpperCase() : 'MB'}</div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">${c.supportingStaff || 'Marcus Bell'}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-secondary);">Supporting Legal Clerk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 'documents':
        const caseDocs = SLCMS_STATE.documents.filter(d => d.caseId === c.id);
        return `
          <div>
            <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
              <div>
                <h4 style="color: var(--color-primary); margin: 0;">Client Case Documents (${caseDocs.length})</h4>
                <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.15rem 0 0 0;">Pleadings, witness statements, trial exhibits, and certified court filings</p>
              </div>
              <button class="btn btn-gold btn-sm" onclick="CasesView.quickAddDocument('${c.id}')">+ Upload Document</button>
            </div>
            ${caseDocs.length ? `
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr><th>Title</th><th>Category</th><th>Version</th><th>Access Level</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    ${caseDocs.map(doc => `
                      <tr>
                        <td>
                          <strong>${doc.title}</strong>
                          <div style="font-size: 0.72rem; color: var(--color-text-muted); font-family: var(--font-mono);">${doc.fileName} (${doc.size})</div>
                        </td>
                        <td><span class="badge" style="background: var(--color-surface-subtle);">${doc.category}</span></td>
                        <td>${doc.version}</td>
                        <td><span class="badge badge-confidential">${doc.accessLevel}</span></td>
                        <td><span class="badge badge-active">${doc.status || 'Ready for AI'}</span></td>
                        <td>
                          <div class="flex items-center gap-1">
                            <button class="btn btn-secondary btn-sm" onclick="DocumentsView.previewDocument('${doc.id}')">Preview</button>
                            <button class="btn btn-ghost btn-sm" onclick="DocumentsView.downloadDocument('${doc.id}')">⬇</button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="card empty-state" style="padding: 2.5rem; text-align: center;">
                <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">No documents attached to this case matter yet.</p>
                <button class="btn btn-gold btn-sm" onclick="CasesView.quickAddDocument('${c.id}')">+ Upload First Document</button>
              </div>
            `}
          </div>
        `;

      case 'tasks':
        const caseTasks = SLCMS_STATE.tasks.filter(t => t.caseId === c.id);
        return `
          <div>
            <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
              <div>
                <h4 style="color: var(--color-primary); margin: 0;">Tasks &amp; Statutory Deadlines (${caseTasks.length})</h4>
                <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.15rem 0 0 0;">Milestones, motions and court filing schedules for this matter</p>
              </div>
              <button class="btn btn-gold btn-sm" onclick="CasesView.quickAddTask('${c.id}')">+ Create Task</button>
            </div>
            ${caseTasks.length ? `
              <div class="flex flex-col gap-2.5">
                ${caseTasks.map(t => {
                  const isOverdue = t.status !== 'completed' && new Date(t.dueDate) < new Date();
                  return `
                    <div class="card flex items-center justify-between p-3" style="border-left: 3px solid ${isOverdue ? 'var(--color-danger)' : t.priority === 'High' ? 'var(--color-gold)' : 'var(--color-primary)'}; background: var(--color-surface);">
                      <div class="flex items-center gap-3" style="flex: 1; min-width: 0;">
                        <input type="checkbox" ${t.status === 'completed' ? 'checked' : ''} onchange="TasksView.toggleTaskStatus('${t.id}')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary);">
                        <div style="min-width: 0;">
                          <div style="font-weight: 600; color: var(--color-primary); font-size: 0.9rem; ${t.status === 'completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.title}</div>
                          <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                            Assigned to: <strong>${t.assignedTo}</strong> &middot; Due: <strong style="font-family: var(--font-mono); color: ${isOverdue ? 'var(--color-danger)' : 'var(--color-text-main)'};">${t.dueDate}</strong>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        ${isOverdue ? `<span class="badge badge-lost" style="font-size: 0.68rem;">OVERDUE</span>` : ''}
                        <span class="badge badge-priority-${t.priority.toLowerCase()}">${t.priority}</span>
                        <span class="badge badge-${t.status === 'completed' ? 'active' : 'pending'}">${t.status}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="card empty-state" style="padding: 2.5rem; text-align: center;">
                <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">No pending tasks or deadlines recorded for this matter.</p>
                <button class="btn btn-gold btn-sm" onclick="CasesView.quickAddTask('${c.id}')">+ Create First Task</button>
              </div>
            `}
          </div>
        `;

      case 'legal-research':
        const savedPrecedents = c.linkedPrecedents || [];
        const caseCategory = c.caseType || c.category || 'Commercial';
        const matchingJudgments = SLCMS_STATE.tanzaniaJudgments.filter(j => {
          if (!j.category) return false;
          return j.category.toLowerCase().includes(caseCategory.toLowerCase()) ||
                 caseCategory.toLowerCase().includes(j.category.toLowerCase()) ||
                 j.title.toLowerCase().includes('bank') ||
                 j.year >= 2024;
        }).slice(0, 4);

        return `
          <div class="animate-fade">
            <!-- Top Banner -->
            <div style="background: linear-gradient(135deg, rgba(16,42,67,0.06), rgba(200,155,60,0.08)); border: 1px solid rgba(200,155,60,0.3); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
              <div>
                <h4 style="margin: 0; color: var(--color-primary); font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span>⚖️ Tanzanian Precedents &amp; Legal AI for:</span>
                  <span style="color: var(--color-gold);">${c.title}</span>
                </h4>
                <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color: var(--color-text-secondary);">
                  Binding and persuasive Tanzanian authorities linked to <strong>${c.caseNumber}</strong> (${c.caseType || 'Litigation'})
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); App.navigate('case-library');">
                  📁 Case Library (2020–2026)
                </button>
                <button class="btn btn-gold btn-sm" onclick="App.closeModal(); App.navigate('ai-assistant');">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span>Ask SLCMS AI</span>
                </button>
              </div>
            </div>

            <!-- SECTION 1: Precedents Saved Specifically to this Case File -->
            <div style="margin-bottom: 1.75rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
                <h5 style="margin:0; font-size: 0.95rem; color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
                  <span>📌</span> Precedents Saved to this Matter File (${savedPrecedents.length})
                </h5>
                <span class="badge badge-confidential" style="font-size: 0.7rem;">Trial Strategy Authorities</span>
              </div>

              ${savedPrecedents.length > 0 ? `
                <div class="flex flex-col gap-3">
                  ${savedPrecedents.map(p => `
                    <div class="card" style="padding: 1.15rem; background: var(--color-surface); border-left: 3px solid var(--color-gold); border: 1px solid var(--color-border);">
                      <div class="flex items-center justify-between flex-wrap gap-2" style="margin-bottom: 0.4rem;">
                        <div class="flex items-center gap-2">
                          <span class="badge badge-gold" style="font-size: 0.7rem; font-weight: 700;">${p.relevance || 'Binding Precedent'}</span>
                          <span style="font-size: 0.75rem; color: var(--color-text-muted);">${p.court} (${p.year})</span>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted);">Saved on ${p.savedAt || 'Recently'} by <strong>${p.savedBy || 'Advocate'}</strong></span>
                      </div>
                      
                      <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem; color: var(--color-primary);">${p.title}</h4>
                      <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-gold); margin-bottom: 0.6rem;">${p.citation}</div>

                      ${p.note ? `
                        <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--color-text-main); margin-bottom: 0.6rem; border-left: 2px solid var(--color-primary);">
                          <strong>Lawyer's Strategy Note:</strong> ${p.note}
                        </div>
                      ` : ''}

                      <div style="font-size: 0.8rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">
                        <strong>Ratio Decidendi / Rule of Law:</strong> ${p.ratioDecidendi || 'Direct judgment authority on point.'}
                      </div>

                      <div class="flex items-center gap-2">
                        <button class="btn btn-secondary btn-sm" onclick="CaseLibraryView.openDetail('${p.judgmentId}')" style="font-size: 0.75rem;">
                          📄 View Full Analysis
                        </button>
                        ${p.pdfUrl ? `<a href="${p.pdfUrl}" target="_blank" class="btn btn-ghost btn-sm" style="font-size: 0.75rem;">Open TanzLII PDF ↗</a>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="card empty-state" style="padding: 2rem; text-align: center; background: var(--color-surface-subtle); border: 1px dashed var(--color-border);">
                  <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">📌</div>
                  <h5 style="margin: 0 0 0.25rem 0; color: var(--color-primary);">No Precedents Saved to this Matter Yet</h5>
                  <p style="font-size: 0.82rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
                    Browse the 2020–2026 Tanzanian Case Library and click "Save Precedent to Case" to pin relevant authorities here.
                  </p>
                  <button class="btn btn-gold btn-sm" onclick="App.closeModal(); App.navigate('case-library');">
                    📁 Browse Case Library &amp; Save Precedents
                  </button>
                </div>
              `}
            </div>

            <!-- SECTION 2: Automatically Matched Tanzanian Precedents -->
            <div>
              <h5 style="color: var(--color-primary); font-size: 0.95rem; margin-bottom: 0.75rem;">
                Recommended Tanzanian Case Law (${matchingJudgments.length})
              </h5>
              <div class="grid grid-cols-2 gap-4">
                ${matchingJudgments.map(j => `
                  <div class="card" style="padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                      <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                        <span class="badge badge-gold" style="font-size: 0.68rem;">${j.year} &middot; ${j.courtTier || 'Court'}</span>
                        <span class="badge badge-active" style="font-size: 0.65rem;">Ready for AI</span>
                      </div>
                      <h5 style="margin: 0 0 0.35rem 0; font-size: 0.92rem; color: var(--color-primary);">${j.title}</h5>
                      <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--color-gold); margin-bottom: 0.5rem;">${j.citation}</div>
                      <p style="font-size: 0.8rem; line-height: 1.5; color: var(--color-text-secondary); margin: 0 0 0.75rem 0;">
                        ${(j.subject || j.description || '').substring(0, 130)}...
                      </p>
                    </div>
                    <div class="flex items-center justify-between pt-2" style="border-top: 1px solid var(--color-border-subtle); font-size: 0.76rem;">
                      <span style="color: var(--color-text-muted); font-size: 0.7rem;">${j.category || 'Law'}</span>
                      <div class="flex items-center gap-1.5">
                        <button class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; color: var(--color-gold);" onclick="CaseLibraryView.openSaveToCaseModal('${j.id}')" title="Save to this Case">
                          📌 Save
                        </button>
                        <button class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;" onclick="CaseLibraryView.openDetailModal('${j.id}')">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
    }
  },

  openEditCaseModal(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) return;

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Edit Case Matter — ${c.caseNumber}</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Case Title / Caption</label>
          <input type="text" id="edit-case-title" class="form-control" value="${c.title}">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Case Number</label>
            <input type="text" id="edit-case-number" class="form-control" value="${c.caseNumber}">
          </div>
          <div class="form-group">
            <label class="form-label required">Case Type</label>
            <select id="edit-case-type" class="form-control">
              <option ${c.caseType === 'Commercial Litigation' ? 'selected' : ''}>Commercial Litigation</option>
              <option ${c.caseType === 'Intellectual Property' ? 'selected' : ''}>Intellectual Property</option>
              <option ${c.caseType === 'Employment Law' ? 'selected' : ''}>Employment Law</option>
              <option ${c.caseType === 'Real Estate & Zoning' ? 'selected' : ''}>Real Estate & Zoning</option>
              <option ${c.caseType === 'Criminal Law' ? 'selected' : ''}>Criminal Law</option>
              <option ${c.caseType === 'Constitutional Law' ? 'selected' : ''}>Constitutional Law</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Client</label>
            <input type="text" id="edit-case-client" class="form-control" value="${c.client}">
          </div>
          <div class="form-group">
            <label class="form-label required">Court / Forum</label>
            <input type="text" id="edit-case-court" class="form-control" value="${c.court}">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Opposing Party</label>
            <input type="text" id="edit-case-opposing" class="form-control" value="${c.opposingParty || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="edit-case-status" class="form-control">
              <option value="Active" ${c.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="On Hold" ${c.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
              <option value="Won" ${c.status === 'Won' ? 'selected' : ''}>Won</option>
              <option value="Closed" ${c.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Next Hearing Date</label>
            <input type="date" id="edit-case-hearing" class="form-control" value="${c.nextHearingDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Important Deadline</label>
            <input type="date" id="edit-case-deadline" class="form-control" value="${c.expectedCompletion || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Case Description</label>
          <textarea id="edit-case-desc" class="form-control" rows="3">${c.description || ''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CasesView.saveCaseEdit('${c.id}')">Save Changes</button>
      </div>
    `);
  },

  saveCaseEdit(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) return;

    c.title = document.getElementById('edit-case-title')?.value || c.title;
    c.caseNumber = document.getElementById('edit-case-number')?.value || c.caseNumber;
    c.caseType = document.getElementById('edit-case-type')?.value || c.caseType;
    c.client = document.getElementById('edit-case-client')?.value || c.client;
    c.court = document.getElementById('edit-case-court')?.value || c.court;
    c.opposingParty = document.getElementById('edit-case-opposing')?.value || c.opposingParty;
    c.status = document.getElementById('edit-case-status')?.value || c.status;
    c.nextHearingDate = document.getElementById('edit-case-hearing')?.value || c.nextHearingDate;
    c.expectedCompletion = document.getElementById('edit-case-deadline')?.value || c.expectedCompletion;
    c.description = document.getElementById('edit-case-desc')?.value || c.description;

    SLCMS_STATE.addAuditLog('Case Updated', 'Cases', `${c.caseNumber} - ${c.title}`);
    App.closeModal();
    App.showToast(`Case ${c.caseNumber} updated successfully`, 'success');
    App.refreshCurrentView();
  },

  openAssignLawyerModal(caseId) {
    const role = SLCMS_STATE.currentUser.role;
    if (role !== 'Administrator' && role !== 'Senior Lawyer') {
      App.showAccessRestrictedModal('Case Assignment Restricted', 'Only Administrators and Senior Lawyers are authorized to assign or reassign cases.');
      return;
    }

    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) return;

    const availableLawyers = [
      { name: 'Eleanor Vance, Esq.', role: 'Senior Lawyer' },
      { name: 'Julian Mercer, Esq.', role: 'Senior Lawyer' },
      { name: 'David Croft, Esq.', role: 'Lawyer' },
      { name: 'Sophia Chen', role: 'Lawyer' }
    ];

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Assign Lead Lawyer — ${c.caseNumber}</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Assign primary counsel responsible for trial strategy, client communications, and motion practice.
        </p>
        <div class="form-group">
          <label class="form-label required">Select Assigned Lawyer</label>
          <select id="assign-lawyer-select" class="form-control">
            ${availableLawyers.map(l => `
              <option value="${l.name}" ${c.lawyer === l.name ? 'selected' : ''}>
                ${l.name} (${l.role})
              </option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CasesView.saveLawyerAssignment('${c.id}')">Confirm Assignment</button>
      </div>
    `);
  },

  saveLawyerAssignment(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) return;

    const newLawyer = document.getElementById('assign-lawyer-select')?.value;
    if (newLawyer) {
      c.lawyer = newLawyer;
      c.lawyerAvatar = newLawyer.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      SLCMS_STATE.addAuditLog('Counsel Assigned', 'Cases', `${c.caseNumber} assigned to ${newLawyer}`);
      App.closeModal();
      App.showToast(`Lead counsel for ${c.caseNumber} assigned to ${newLawyer}`, 'success');
      App.refreshCurrentView();
    }
  },

  closeCase(caseId) {
    this.openCloseCaseModal(caseId);
  },

  openCloseCaseModal(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) return;

    const role = SLCMS_STATE.currentUser.role;
    if (role !== 'Administrator' && role !== 'Senior Lawyer') {
      App.showAccessRestrictedModal('Case Closure Restricted', 'Only Administrators and Senior Lawyers are authorized to officially conclude and close case matters.');
      return;
    }

    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size:1.3rem;">🔒</span>
          <div>
            <h3 class="modal-title" style="margin:0;font-size:1.15rem;">Formal Case Closure — ${c.caseNumber}</h3>
            <div style="font-size:0.75rem;color:var(--color-text-secondary);">${c.title} &middot; Client: ${c.client}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding:1.5rem;">
        <p style="font-size:0.86rem;color:var(--color-text-main);line-height:1.5;margin-bottom:1.25rem;">
          Finalizing this case will transition its status to <strong>Closed</strong>, update the progress tracker to 100%, and record the final decree in the firm's permanent registry.
        </p>

        <div class="form-group" style="margin-bottom:1rem;">
          <label class="form-label required">Dispute Resolution Outcome</label>
          <select id="close-case-outcome" class="form-control">
            <option value="Favorable Judgment in Favor of Client (Won)">Favorable Judgment in Favor of Client (Won)</option>
            <option value="Amicable Out-of-Court Settlement">Amicable Out-of-Court Settlement</option>
            <option value="Mutual Discontinuance & Release">Mutual Discontinuance &amp; Release</option>
            <option value="Execution & Decree Satisfied">Execution &amp; Decree Satisfied</option>
            <option value="Arbitral Award Enforced">Arbitral Award Enforced</option>
            <option value="Dismissed / Discontinued Without Costs">Dismissed / Discontinued Without Costs</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:1rem;">
          <label class="form-label required">Closure Effective Date</label>
          <input type="date" id="close-case-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
        </div>

        <div class="form-group" style="margin-bottom:1rem;">
          <label class="form-label">Final Decree / Closing Orders Summary</label>
          <textarea id="close-case-summary" class="form-control" rows="3" placeholder="Enter final judgment orders, settlement terms, or decree particulars...">${c.title}: Final decree rendered in favor of ${c.client}. All statutory obligations, damages, and costs liquidated in full.</textarea>
        </div>

        <div class="flex items-center gap-2" style="font-size:0.82rem;color:var(--color-text-secondary);">
          <input type="checkbox" id="close-case-complete-tasks" checked style="accent-color:var(--color-gold);cursor:pointer;">
          <label for="close-case-complete-tasks" style="cursor:pointer;">Automatically mark all remaining open tasks for this case as Completed</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="CasesView.confirmCloseCase('${c.id}')">
          🔒 Confirm Case Closure
        </button>
      </div>
    `, 'modal-md');
  },

  confirmCloseCase(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) return;

    const outcome = document.getElementById('close-case-outcome')?.value || 'Closed';
    const closeDate = document.getElementById('close-case-date')?.value || new Date().toISOString().split('T')[0];
    const summary = document.getElementById('close-case-summary')?.value || 'Matter successfully concluded.';
    const completeTasks = document.getElementById('close-case-complete-tasks')?.checked;

    c.status = 'Closed';
    c.closureOutcome = outcome;
    c.closureDate = closeDate;
    c.progressPct = 100;
    c.notes = (c.notes ? c.notes + '\n\n' : '') + `[CLOSED ON ${closeDate}]: ${outcome}. ${summary}`;

    if (completeTasks && SLCMS_STATE.tasks) {
      SLCMS_STATE.tasks.filter(t => t.caseId === c.id).forEach(t => t.status = 'completed');
    }

    SLCMS_STATE.addAuditLog('Case Officially Closed', 'Cases', `${c.caseNumber} closed by ${SLCMS_STATE.currentUser.name}. Outcome: ${outcome}`);
    App.closeModal();
    App.showToast(`Case ${c.caseNumber} officially closed (${outcome}).`, 'success');
    App.refreshCurrentView();
  },

  reopenCase(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) return;
    c.status = 'Active';
    c.progressPct = 75;
    SLCMS_STATE.addAuditLog('Case Reopened', 'Cases', `${c.caseNumber} reopened by ${SLCMS_STATE.currentUser.name}`);
    App.closeModal();
    App.showToast(`Case ${c.caseNumber} reopened.`, 'info');
    App.refreshCurrentView();
  },

  clearAttentionFilter() {
    this.selectedFilterStatus = 'All';
    App.refreshCurrentView();
  },

  openAssignStaffModal() {
    const cases = SLCMS_STATE.cases || [];
    const lawyers = (SLCMS_STATE.users || []).filter(u => u.role === 'Senior Lawyer' || u.role === 'Lawyer' || u.role === 'Legal Clerk');

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem;">👤 Assign / Remove Case Personnel</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div class="form-group mb-3">
          <label class="form-label required">Select Matter</label>
          <select id="adm-assign-case-id" class="form-control" onchange="CasesView.updateAssignStaffPreview(this.value)">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title} (${c.lawyer || 'Unassigned'})</option>`).join('')}
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">Lead Counsel / Responsible Advocate</label>
          <select id="adm-assign-staff-id" class="form-control">
            ${lawyers.map(l => `<option value="${l.name}">${l.name} (${l.role}) — ${l.staffId || l.employeeId}</option>`).join('')}
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Supporting Staff / Legal Clerk</label>
          <select id="adm-assign-support-id" class="form-control">
            <option value="None">None</option>
            ${lawyers.map(l => `<option value="${l.name}">${l.name} (${l.role})</option>`).join('')}
          </select>
        </div>
        <div class="alert alert-info" style="font-size: 0.8rem;">
          ⚖️ Reallocating personnel updates the matter record and creates an entry in the firm's security activity audit log.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CasesView.saveStaffAssignment()">Confirm Assignment</button>
      </div>
    `, 'modal-md');
  },

  updateAssignStaffPreview(caseId) {
    // preview helper if needed
  },

  saveStaffAssignment() {
    const caseId = document.getElementById('adm-assign-case-id')?.value;
    const lawyer = document.getElementById('adm-assign-staff-id')?.value;
    const support = document.getElementById('adm-assign-support-id')?.value;
    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);

    if (targetCase) {
      targetCase.lawyer = lawyer;
      if (support !== 'None') targetCase.supportingStaff = support;
      targetCase.requiresAdminAttention = false;
      SLCMS_STATE.addAuditLog('Case Assignment Changed', 'Case Management', `Staff assigned to ${targetCase.caseNumber}: Lead Counsel ${lawyer} by Administrator`);
      App.closeModal();
      App.showToast(`Personnel assigned to matter ${targetCase.caseNumber}.`, 'success');
      App.refreshCurrentView();
    }
  },

  openMetadataCorrectionModal() {
    const cases = SLCMS_STATE.cases || [];
    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem;">📝 Correct Administrative Metadata</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div class="form-group mb-3">
          <label class="form-label required">Select Matter</label>
          <select id="adm-meta-case-id" class="form-control" onchange="CasesView.loadMetadataToEdit(this.value)">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Case Number (Docket)</label>
            <input type="text" id="adm-meta-caseno" class="form-control" value="${cases[0]?.caseNumber || ''}">
          </div>
          <div class="form-group">
            <label class="form-label required">Court Docket Reference</label>
            <input type="text" id="adm-meta-courtno" class="form-control" value="${cases[0]?.courtCaseNo || ''}">
          </div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">Official Court / Tribunal</label>
          <input type="text" id="adm-meta-court" class="form-control" value="${cases[0]?.court || ''}">
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Presiding Judicial Officer</label>
          <input type="text" id="adm-meta-judge" class="form-control" value="${cases[0]?.presidingOfficer || ''}">
        </div>
        <div class="alert alert-warning" style="font-size: 0.8rem;">
          ⚠️ <strong>Administrative Scope Limitation:</strong> You may correct docket numbers, typos in court registry references, and judicial officer names. You cannot modify legal pleadings, admitted evidence, or counsel arguments.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CasesView.saveMetadataCorrection()">Save Corrections</button>
      </div>
    `, 'modal-md');
  },

  loadMetadataToEdit(caseId) {
    const c = (SLCMS_STATE.cases || []).find(i => i.id === caseId);
    if (!c) return;
    const caseno = document.getElementById('adm-meta-caseno');
    const courtno = document.getElementById('adm-meta-courtno');
    const court = document.getElementById('adm-meta-court');
    const judge = document.getElementById('adm-meta-judge');
    if (caseno) caseno.value = c.caseNumber || '';
    if (courtno) courtno.value = c.courtCaseNo || '';
    if (court) court.value = c.court || '';
    if (judge) judge.value = c.presidingOfficer || '';
  },

  saveMetadataCorrection() {
    const caseId = document.getElementById('adm-meta-case-id')?.value;
    const caseno = document.getElementById('adm-meta-caseno')?.value;
    const courtno = document.getElementById('adm-meta-courtno')?.value;
    const court = document.getElementById('adm-meta-court')?.value;
    const judge = document.getElementById('adm-meta-judge')?.value;
    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);

    if (targetCase) {
      targetCase.caseNumber = caseno;
      targetCase.courtCaseNo = courtno;
      targetCase.court = court;
      targetCase.presidingOfficer = judge;
      targetCase.requiresAdminAttention = false;
      SLCMS_STATE.addAuditLog('Case Metadata Corrected', 'Case Management', `Administrative metadata updated for ${targetCase.caseNumber} by Administrator`);
      App.closeModal();
      App.showToast(`Administrative metadata saved for matter ${targetCase.caseNumber}.`, 'success');
      App.refreshCurrentView();
    }
  },

  openSensitiveLockModal() {
    const cases = SLCMS_STATE.cases || [];
    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem;">🔒 Lock / Unlock Sensitive Matter (Ethical Wall)</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <p style="font-size: 0.88rem; color: #475569; margin-bottom: 1rem;">
          Locking a sensitive matter establishes an Ethical Wall isolating this matter from unauthorized general firm viewing. Only explicitly assigned personnel will maintain visibility.
        </p>
        <div class="form-group mb-3">
          <label class="form-label required">Select Matter</label>
          <select id="adm-lock-case-id" class="form-control">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title} [${c.isSensitiveLocked ? '🔒 LOCKED' : '🔓 Unlocked'}]</option>`).join('')}
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">Action</label>
          <select id="adm-lock-action" class="form-control">
            <option value="lock">🔒 Enforce Ethical Wall (Lock Access)</option>
            <option value="unlock">🔓 Remove Ethical Wall (Standard Firm Access)</option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">Administrative Justification</label>
          <input type="text" id="adm-lock-reason" class="form-control" value="Conflict of interest compliance / High-profile client sensitivity">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CasesView.saveSensitiveLock()">Apply Security Policy</button>
      </div>
    `, 'modal-md');
  },

  saveSensitiveLock() {
    const caseId = document.getElementById('adm-lock-case-id')?.value;
    const action = document.getElementById('adm-lock-action')?.value;
    const reason = document.getElementById('adm-lock-reason')?.value;
    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);

    if (targetCase) {
      targetCase.isSensitiveLocked = (action === 'lock');
      targetCase.requiresAdminAttention = false;
      const actText = action === 'lock' ? 'Sensitive Matter Locked (Ethical Wall Enforced)' : 'Sensitive Matter Unlocked';
      SLCMS_STATE.addAuditLog(actText, 'Security', `${targetCase.caseNumber} (${targetCase.title}) - ${reason}`);
      App.closeModal();
      App.showToast(`Security state updated for ${targetCase.caseNumber}.`, 'success');
      App.refreshCurrentView();
    }
  },

  openAccessListModal() {
    const cases = SLCMS_STATE.cases || [];
    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem;">👥 Case Access Permission Roster</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
        <div class="form-group mb-3">
          <label class="form-label">Select Matter to Inspect Access Rights</label>
          <select id="adm-access-case-select" class="form-control" onchange="CasesView.renderCaseAccessRoster(this.value)">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title}</option>`).join('')}
          </select>
        </div>
        <div id="adm-case-access-roster">
          ${this.getAccessRosterHtml(cases[0]?.id)}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  renderCaseAccessRoster(caseId) {
    const container = document.getElementById('adm-case-access-roster');
    if (container) container.innerHTML = this.getAccessRosterHtml(caseId);
  },

  getAccessRosterHtml(caseId) {
    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);
    if (!targetCase) return '<p>Case not found.</p>';

    const users = SLCMS_STATE.users || [];
    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Personnel</th>
              <th>Role</th>
              <th>Access Permission</th>
              <th>Source of Access</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${targetCase.lawyer}</strong></td>
              <td><span class="badge badge-confidential">Lead Counsel</span></td>
              <td><span class="badge badge-active">Full Management & Pleading Sign-off</span></td>
              <td>Direct Matter Assignment</td>
            </tr>
            ${targetCase.supportingStaff ? `
              <tr>
                <td><strong>${targetCase.supportingStaff}</strong></td>
                <td><span class="badge badge-neutral">Supporting Staff</span></td>
                <td><span class="badge badge-active">Reading & Filing Drafting</span></td>
                <td>Co-Counsel Allocation</td>
              </tr>
            ` : ''}
            <tr>
              <td><strong>Neema Joseph</strong></td>
              <td><span class="badge badge-gold">System Administrator</span></td>
              <td><span class="badge badge-neutral">Metadata & Access Control (No Legal Facts)</span></td>
              <td>Role-Based Technical Control</td>
            </tr>
            ${users.filter(u => u.role === 'Senior Lawyer' && u.name !== targetCase.lawyer).map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td><span class="badge badge-new">${u.role}</span></td>
                <td><span class="badge badge-neutral">Supervisory Review & AI Approval</span></td>
                <td>Firm Partner Oversight</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openArchiveModal() {
    const cases = SLCMS_STATE.cases || [];
    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem;">📦 Archive Case When Authorized</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <p style="font-size: 0.88rem; color: #475569; margin-bottom: 1rem;">
          Archiving moves a concluded or fully resolved legal matter to cold encrypted storage. Active docket deadlines and notifications will be suspended.
        </p>
        <div class="form-group mb-3">
          <label class="form-label required">Select Matter to Archive</label>
          <select id="adm-archive-case-id" class="form-control">
            ${cases.filter(c => c.status === 'Won' || c.status === 'Closed' || c.id === 'case-106').map(c => `
              <option value="${c.id}">${c.caseNumber} — ${c.title} (${c.status})</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">Partner Authorization Reference</label>
          <input type="text" id="adm-archive-auth" class="form-control" value="Managing Partner Formal Authorization #ARC-2026-081">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="CasesView.confirmArchiveCase()">Confirm Archival</button>
      </div>
    `, 'modal-md');
  },

  confirmArchiveCase() {
    const caseId = document.getElementById('adm-archive-case-id')?.value;
    const auth = document.getElementById('adm-archive-auth')?.value;
    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);

    if (targetCase) {
      targetCase.status = 'Archived';
      targetCase.requiresAdminAttention = false;
      SLCMS_STATE.addAuditLog('Case Archived', 'Case Management', `Matter ${targetCase.caseNumber} archived by Administrator. Auth: ${auth}`);
      App.closeModal();
      App.showToast(`Matter ${targetCase.caseNumber} moved to encrypted archives.`, 'success');
      App.refreshCurrentView();
    }
  }
};
