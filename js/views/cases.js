/* ==========================================================================
   SLCMS - Cases Management, 7-Step Wizard & 8-Tab Details View
   ========================================================================== */

const CasesView = {
  currentViewMode: 'table', // 'table' | 'cards'
  selectedFilterStatus: 'All',
  selectedFilterType: 'All',
  selectedFilterPriority: 'All',
  searchQuery: '',
  wizardCurrentStep: 1,
  wizardData: {},

  render() {
    const filteredCases = this.getFilteredCases();

    return `
      <div class="animate-fade">
        <!-- View Header -->
        <div class="view-header">
          <div>
            <h1 class="page-title" style="font-size: 1.65rem;">Legal Matters & Cases</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">
              Manage litigation proceedings, corporate advisory files, discovery records and court schedules
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn btn-secondary" onclick="CasesView.exportCasesCSV()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Export Case List</span>
            </button>
            <button class="btn btn-gold" onclick="CasesView.openNewCaseModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>New Case Wizard</span>
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="filter-bar">
          <div class="input-with-icon" style="flex: 1; min-width: 240px;">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control" placeholder="Search by case number, title, client, court or counsel..." 
                   value="${this.searchQuery}" oninput="CasesView.handleSearch(this.value)">
          </div>

          <div class="filter-group">
            <select class="form-control" style="width: 140px;" onchange="CasesView.handleFilterStatus(this.value)">
              <option value="All" ${this.selectedFilterStatus === 'All' ? 'selected' : ''}>All Statuses</option>
              <option value="Active" ${this.selectedFilterStatus === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Pending" ${this.selectedFilterStatus === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="On Hold" ${this.selectedFilterStatus === 'On Hold' ? 'selected' : ''}>On Hold</option>
              <option value="Won" ${this.selectedFilterStatus === 'Won' ? 'selected' : ''}>Won</option>
            </select>
          </div>

          <div class="filter-group">
            <select class="form-control" style="width: 160px;" onchange="CasesView.handleFilterType(this.value)">
              <option value="All">All Practice Areas</option>
              <option value="Commercial Litigation">Commercial Litigation</option>
              <option value="Intellectual Property">Intellectual Property</option>
              <option value="Employment Law">Employment Law</option>
              <option value="Real Estate & Zoning">Real Estate & Zoning</option>
              <option value="White Collar Defense">White Collar Defense</option>
              <option value="Corporate & Tax">Corporate & Tax</option>
            </select>
          </div>

          <div class="filter-group">
            <select class="form-control" style="width: 130px;" onchange="CasesView.handleFilterPriority(this.value)">
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <!-- View Mode Toggle -->
          <div class="view-toggle">
            <button class="view-toggle-btn ${this.currentViewMode === 'table' ? 'active' : ''}" onclick="CasesView.toggleViewMode('table')" title="Table View">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <button class="view-toggle-btn ${this.currentViewMode === 'cards' ? 'active' : ''}" onclick="CasesView.toggleViewMode('cards')" title="Card Grid View">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
            </button>
          </div>
        </div>

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

      const matchStatus = this.selectedFilterStatus === 'All' || c.status === this.selectedFilterStatus;
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
      <!-- Desktop & Tablet Table View -->
      <div class="desktop-table-view">
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
      </div>

      <!-- Mobile Phone Cards View (Optimized for Touch & Readability) -->
      <div class="mobile-cards-view">
        ${casesList.map(c => `
          <div class="case-card-mobile" onclick="CasesView.openCaseDetails('${c.id}')">
            <div class="case-card-mobile-header">
              <div class="case-card-mobile-title">${c.title}</div>
              <span class="badge badge-${c.status.toLowerCase().replace(' ', '')}" style="font-size: 0.72rem; flex-shrink: 0;">
                <span class="badge-dot"></span>
                ${c.status}
              </span>
            </div>
            <div class="case-card-mobile-meta">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-gold);">${c.caseNumber}</span>
                <span>🏛️ ${c.court}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                <span>Client: <strong>${c.client}</strong></span>
                <span style="font-weight: 600; color: ${c.nextHearingDate === 'Completed' ? 'var(--color-text-muted)' : 'var(--color-danger)'};">
                  📅 ${c.nextHearingDate}
                </span>
              </div>
            </div>
            <div class="case-card-mobile-actions" onclick="event.stopPropagation()">
              <button class="btn btn-secondary btn-sm" onclick="CasesView.openCaseDetails('${c.id}')">
                Open Matter
              </button>
              <button class="btn btn-ghost btn-sm" onclick="CasesView.quickAddTask('${c.id}')">
                +Task
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="flex items-center justify-between" style="margin-top: 1rem; font-size: 0.8rem; color: var(--color-text-secondary); flex-wrap: wrap; gap: 8px;">
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
  // 7-STEP CASE CREATION WIZARD (LUXURY EXECUTIVE DESIGN)
  // -------------------------------------------------------------
  openNewCaseModal() {
    this.wizardCurrentStep = 1;
    this.wizardData = {
      caseNumber: 'CV-2026-0' + Math.floor(100 + Math.random() * 900),
      title: '',
      caseType: 'Commercial Litigation',
      description: '',
      client: 'Vanguard Capital Partners',
      clientId: 'cli-01',
      clientType: 'Organization',
      opposingParty: '',
      opposingCounsel: '',
      court: 'Supreme Court of New York - Commercial Division',
      courtCaseNo: 'Index No. 65' + Math.floor(1000 + Math.random() * 9000) + '/2026',
      presidingOfficer: 'Hon. Justice Katherine Thorne',
      lawyer: 'Eleanor Vance, Esq.',
      lawyerAvatar: 'EV',
      supportingStaff: 'Marcus Bell',
      priority: 'High',
      openingDate: new Date().toISOString().substring(0, 10),
      nextHearingDate: '2026-09-30',
      expectedCompletion: '2027-06-30',
      status: 'Active',
      retainerAmount: 50000,
      notes: ''
    };
    this.renderWizardModal();
  },

  renderWizardModal() {
    const step = this.wizardCurrentStep;
    const steps = [
      { num: 1, label: 'Basic Info', icon: '📑' },
      { num: 2, label: 'Client & Parties', icon: '👥' },
      { num: 3, label: 'Court & Docket', icon: '🏛️' },
      { num: 4, label: 'Counsel & Priority', icon: '⚖️' },
      { num: 5, label: 'Dates & Schedule', icon: '📅' },
      { num: 6, label: 'Documents', icon: '🗄️' },
      { num: 7, label: 'Review & Activate', icon: '🚀' }
    ];

    const progressPct = Math.round(((step - 1) / (steps.length - 1)) * 100);

    const nextLabels = [
      '',
      'Next: Client & Parties →',
      'Next: Court & Docket →',
      'Next: Counsel & Priority →',
      'Next: Dates & Schedule →',
      'Next: Documents →',
      'Next: Review & Activate →',
      'Confirm & Open Case File'
    ];

    App.openModal(`
      <!-- Luxury Modal Header -->
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43 0%, #0B1F33 100%); color: #FFFFFF; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg); padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-gold);">
        <div class="flex items-center gap-3">
          <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: rgba(200, 155, 60, 0.2); border: 1.5px solid var(--color-gold); display: flex; align-items: center; justify-content: center; color: var(--color-gold); font-size: 1.2rem; flex-shrink: 0;">
            ⚖️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="modal-title" style="color: #FFFFFF; margin: 0; font-size: 1.2rem; font-family: var(--font-heading); font-weight: 700;">
                New Legal Case Registration Wizard
              </h3>
              <span class="badge badge-confidential" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">
                Matter Ingestion
              </span>
            </div>
            <div style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>Step <strong style="color: var(--color-gold);">${step} of 7</strong> — ${steps[step - 1].label}</span>
              <span>•</span>
              <span>NY Practice Rules Active</span>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #CBD5E1; font-size: 1.1rem;">✕</button>
      </div>

      <!-- Modern Interactive Stepper Bar with Connected Line -->
      <div style="background: #F8FAFC; padding: 1rem 1.5rem; border-bottom: 1px solid var(--color-border); position: relative; overflow-x: auto;">
        <!-- Connected Progress Bar Background Line -->
        <div style="position: absolute; top: 26px; left: 45px; right: 45px; height: 3px; background: #E2E8F0; z-index: 1;">
          <div style="width: ${progressPct}%; height: 100%; background: linear-gradient(90deg, #102A43 0%, #C89B3C 100%); transition: width 0.3s ease;"></div>
        </div>

        <div class="flex items-center justify-between" style="min-width: 660px; position: relative; z-index: 2;">
          ${steps.map(s => {
            const isDone = s.num < step;
            const isActive = s.num === step;
            return `
              <div class="flex flex-col items-center gap-1" style="cursor: ${isDone ? 'pointer' : 'default'};" onclick="${isDone ? `CasesView.goToWizardStep(${s.num})` : ''}">
                <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; background: ${isDone ? '#16A34A' : isActive ? 'linear-gradient(135deg, #102A43 0%, #C89B3C 100%)' : '#FFFFFF'}; color: ${isDone || isActive ? '#FFFFFF' : '#64748B'}; border: 2px solid ${isDone ? '#16A34A' : isActive ? 'var(--color-gold)' : '#CBD5E1'}; box-shadow: ${isActive ? '0 0 10px rgba(200, 155, 60, 0.4)' : 'none'}; transition: all var(--transition-fast);">
                  ${isDone ? '✓' : s.num}
                </div>
                <span style="font-size: 0.72rem; font-weight: ${isActive ? 700 : 600}; color: ${isActive ? 'var(--color-primary)' : isDone ? '#16A34A' : '#64748B'}; white-space: nowrap;">
                  ${s.label}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Step Body Content -->
      <div class="modal-body" id="wizard-step-container" style="padding: 1.5rem; max-height: 65vh; overflow-y: auto;">
        ${this.getWizardStepHTML(step)}
      </div>

      <!-- Modal Footer Action Bar -->
      <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--color-border-subtle); display: flex; align-items: center; justify-content: space-between; background: #FAFAFA;">
        <button class="btn btn-secondary" onclick="CasesView.saveWizardDraft()">
          <span>Save Draft</span>
        </button>

        <div class="flex items-center gap-2">
          ${step > 1 ? `
            <button class="btn btn-secondary" onclick="CasesView.goToWizardStep(${step - 1})">
              <span>← Previous</span>
            </button>
          ` : ''}

          ${step < 7 ? `
            <button class="btn btn-gold" onclick="CasesView.validateAndNext(${step})">
              <span>${nextLabels[step]}</span>
            </button>
          ` : `
            <button class="btn btn-gold btn-lg" onclick="CasesView.submitNewCase()">
              <span>🚀 Confirm & Register Case</span>
            </button>
          `}
        </div>
      </div>
    `, 'modal-lg');
  },

  getWizardStepHTML(step) {
    const d = this.wizardData;
    switch (step) {
      case 1:
        return `
          <div class="animate-fade">
            <!-- Step Header Banner -->
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.1rem;">📑</span>
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">Step 1: Basic Matter Identification</span>
              </div>
              <span class="badge badge-active" style="font-size: 0.7rem;">General Docketing</span>
            </div>

            <!-- Case Tracking Number & Practice Area -->
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                  <label class="form-label required" style="margin-bottom: 0;">Case Tracking Number</label>
                  <span class="badge badge-confidential" style="font-size: 0.65rem; padding: 1px 6px;">⚡ Auto-Generated</span>
                </div>
                <div class="input-with-icon">
                  <span class="input-icon" style="color: var(--color-gold); font-size: 0.9rem;">#</span>
                  <input type="text" id="wz-caseno" class="form-control" value="${d.caseNumber}" style="font-family: var(--font-mono); font-weight: 700; letter-spacing: 0.05em;" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">Practice Area / Case Type</label>
                <select id="wz-casetype" class="form-control" style="font-weight: 600;">
                  <option ${d.caseType === 'Commercial Litigation' ? 'selected' : ''}>Commercial Litigation</option>
                  <option ${d.caseType === 'Intellectual Property' ? 'selected' : ''}>Intellectual Property</option>
                  <option ${d.caseType === 'Employment Law' ? 'selected' : ''}>Employment Law</option>
                  <option ${d.caseType === 'Real Estate & Zoning' ? 'selected' : ''}>Real Estate & Zoning</option>
                  <option ${d.caseType === 'White Collar Defense' ? 'selected' : ''}>White Collar Defense</option>
                  <option ${d.caseType === 'Corporate & Tax' ? 'selected' : ''}>Corporate & Tax</option>
                </select>
              </div>
            </div>

            <!-- Case Formal Caption -->
            <div class="form-group" style="margin-top: 0.5rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                <label class="form-label required" style="margin-bottom: 0;">Case Formal Caption / Title</label>
                <div class="flex items-center gap-1.5">
                  <span style="font-size: 0.72rem; color: var(--color-text-muted);">Quick Templates:</span>
                  <span class="badge" style="cursor: pointer; background: var(--color-surface-subtle); color: var(--color-primary); border: 1px solid var(--color-border); font-size: 0.68rem;" onclick="CasesView.fillSampleCaption('Vanguard Capital vs. Apex Tech Holdings', 'Commercial Litigation')">
                    + Commercial
                  </span>
                  <span class="badge" style="cursor: pointer; background: var(--color-surface-subtle); color: var(--color-primary); border: 1px solid var(--color-border); font-size: 0.68rem;" onclick="CasesView.fillSampleCaption('AuraBio Pharmaceuticals Patent Infringement', 'Intellectual Property')">
                    + Patent
                  </span>
                </div>
              </div>
              <input type="text" id="wz-title" class="form-control" placeholder="e.g. Apex Global vs. Horizon Logistics Corp." value="${d.title}" style="font-size: 0.95rem; font-weight: 600;" required>
              <div class="form-hint" style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                Enter the full legal caption as formatted for court pleadings and docket records.
              </div>
            </div>

            <!-- Matter Summary & Fact Outline -->
            <div class="form-group" style="margin-top: 0.75rem;">
              <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                <label class="form-label" style="margin-bottom: 0;">Matter Summary & Fact Outline</label>
                <button type="button" class="btn btn-ghost btn-sm" style="font-size: 0.74rem; color: var(--color-gold); padding: 0;" onclick="CasesView.generateAISummaryDraft()">
                  ✨ AI Summarize Facts
                </button>
              </div>
              <textarea id="wz-description" class="form-control" rows="4" placeholder="Summarize background facts, contract terms, dispute origin and requested relief..." style="font-size: 0.88rem; line-height: 1.6;">${d.description}</textarea>
            </div>
          </div>
        `;

      case 2:
        return `
          <div class="animate-fade">
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.1rem;">👥</span>
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">Step 2: Client & Adversary Party Details</span>
              </div>
              <span class="badge badge-active" style="font-size: 0.7rem;">Party Configuration</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label required">Client Legal Name</label>
                <select id="wz-client" class="form-control">
                  ${SLCMS_STATE.clients.map(c => `<option value="${c.name}" ${d.client === c.name ? 'selected' : ''}>${c.name} (${c.type})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Client Entity Classification</label>
                <select id="wz-clienttype" class="form-control">
                  <option value="Organization" ${d.clientType === 'Organization' ? 'selected' : ''}>Corporate / Organization</option>
                  <option value="Individual" ${d.clientType === 'Individual' ? 'selected' : ''}>Individual Client</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4" style="margin-top: 0.5rem;">
              <div class="form-group">
                <label class="form-label required">Opposing Party Name</label>
                <input type="text" id="wz-opposingparty" class="form-control" placeholder="e.g. Zenith Tech AG" value="${d.opposingParty || 'Apex Tech Holdings'}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Opposing Legal Counsel</label>
                <input type="text" id="wz-opposingcounsel" class="form-control" placeholder="e.g. Cravath & Swaine LLP (Attn: J. Davis)" value="${d.opposingCounsel || 'Harrison & Cole LLP'}">
              </div>
            </div>
          </div>
        `;

      case 3:
        return `
          <div class="animate-fade">
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.1rem;">🏛️</span>
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">Step 3: Court Forum & Presiding Officer</span>
              </div>
              <span class="badge badge-confidential" style="font-size: 0.7rem;">Judicial Venue</span>
            </div>

            <div class="form-group">
              <label class="form-label required">Court Jurisdiction & Forum</label>
              <select id="wz-court" class="form-control">
                <option value="Supreme Court of New York - Commercial Division" ${d.court.includes('Commercial') ? 'selected' : ''}>Supreme Court of New York - Commercial Division (New York County)</option>
                <option value="Federal District Court - Southern District of New York (SDNY)" ${d.court.includes('SDNY') ? 'selected' : ''}>Federal District Court - Southern District of New York (SDNY)</option>
                <option value="Delaware Court of Chancery" ${d.court.includes('Delaware') ? 'selected' : ''}>Delaware Court of Chancery</option>
                <option value="U.S. Court of Appeals for the Second Circuit" ${d.court.includes('Second') ? 'selected' : ''}>U.S. Court of Appeals for the Second Circuit</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4" style="margin-top: 0.5rem;">
              <div class="form-group">
                <label class="form-label required">Court Docket / Index Number</label>
                <input type="text" id="wz-courtcaseno" class="form-control" placeholder="e.g. Index No. 652841/2026" value="${d.courtCaseNo}" style="font-family: var(--font-mono);">
              </div>
              <div class="form-group">
                <label class="form-label required">Presiding Judge / Magistrate</label>
                <input type="text" id="wz-judge" class="form-control" placeholder="e.g. Hon. Justice Katherine Thorne" value="${d.presidingOfficer}">
              </div>
            </div>
          </div>
        `;

      case 4:
        return `
          <div class="animate-fade">
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.1rem;">⚖️</span>
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">Step 4: Counsel Assignment & Retainer</span>
              </div>
              <span class="badge badge-active" style="font-size: 0.7rem;">Staffing</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label required">Lead Assigned Partner / Counsel</label>
                <select id="wz-lawyer" class="form-control">
                  <option value="Eleanor Vance, Esq.">Eleanor Vance, Esq. (Managing Partner)</option>
                  <option value="Julian Mercer, Esq.">Julian Mercer, Esq. (Senior Counsel)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Supporting Legal Clerk / Paralegal</label>
                <select id="wz-staff" class="form-control">
                  <option value="Marcus Bell">Marcus Bell (Senior Clerk)</option>
                  <option value="Sophia Chen">Sophia Chen (Paralegal)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4" style="margin-top: 0.5rem;">
              <div class="form-group">
                <label class="form-label required">Matter Priority Level</label>
                <select id="wz-priority" class="form-control">
                  <option value="High" ${d.priority === 'High' ? 'selected' : ''}>High (Expedited Court Filings)</option>
                  <option value="Medium" ${d.priority === 'Medium' ? 'selected' : ''}>Medium (Standard Litigation)</option>
                  <option value="Low" ${d.priority === 'Low' ? 'selected' : ''}>Low (Advisory & Compliance)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Initial Retainer Deposit ($ USD)</label>
                <input type="number" id="wz-retainer" class="form-control" value="${d.retainerAmount}" style="font-family: var(--font-mono); font-weight: 700;">
              </div>
            </div>
          </div>
        `;

      case 5:
        return `
          <div class="animate-fade">
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.1rem;">📅</span>
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">Step 5: Statutory Deadlines & Scheduling</span>
              </div>
              <span class="badge badge-confidential" style="font-size: 0.7rem;">Docket Calendar</span>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="form-group">
                <label class="form-label required">Matter Ingestion Date</label>
                <input type="date" id="wz-openingdate" class="form-control" value="${d.openingDate}">
              </div>
              <div class="form-group">
                <label class="form-label">Next Hearing / Return Date</label>
                <input type="date" id="wz-hearingdate" class="form-control" value="${d.nextHearingDate}">
              </div>
              <div class="form-group">
                <label class="form-label">Target Trial / Settlement Date</label>
                <input type="date" id="wz-expecteddate" class="form-control" value="${d.expectedCompletion}">
              </div>
            </div>

            <div class="alert alert-warning" style="margin-top: 1rem; font-size: 0.82rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <strong>Statute of Limitations Check:</strong> Verify all underlying breach-of-contract filing deadlines pursuant to NY CPLR 213(2) before filing initial summons.
              </div>
            </div>
          </div>
        `;

      case 6:
        return `
          <div class="animate-fade">
            <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div class="flex items-center gap-2">
                <span style="font-size: 1.1rem;">🗄️</span>
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">Step 6: Initial Pleadings & Vault Upload</span>
              </div>
              <span class="badge badge-active" style="font-size: 0.7rem;">AES-256 Vault</span>
            </div>

            <div class="dropzone-box" style="margin-bottom: 1.25rem; padding: 2rem 1.5rem; text-align: center; border: 2px dashed var(--color-gold); border-radius: var(--radius-md); background: #FDF8EC; cursor: pointer;" onclick="App.showToast('Select local pleading PDF to upload to encrypted vault.', 'info')">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="color: var(--color-gold); margin-bottom: 0.5rem;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">
                Drag & drop initial Summons, Verified Complaint or Discovery Exhibits
              </div>
              <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                Supported file formats: PDF, DOCX, TIFF up to 50MB (AES-256 Cloud Vault)
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Initial Document Access Classification</label>
              <select class="form-control">
                <option>Attorney-Client Privileged (Fed. R. Evid. 502 Shield)</option>
                <option>Confidential - Protective Order (Attorneys Eyes Only)</option>
                <option>Firm Internal Work-Product</option>
                <option>Public Court Record (NYSCEF / PACER Filed)</option>
              </select>
            </div>
          </div>
        `;

      case 7:
        return `
          <div class="animate-fade">
            <div class="alert alert-gold" style="margin-bottom: 1.25rem; font-size: 0.85rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
              </svg>
              <div>
                <strong>Pre-Activation Docket Summary:</strong> Verify all litigation parameters below before final cataloging into the firm's central docket.
              </div>
            </div>

            <div class="card" style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; font-size: 0.88rem; box-shadow: var(--shadow-xs);">
              <div class="flex items-center justify-between pb-3 mb-3" style="border-bottom: 1px solid var(--color-border-subtle);">
                <div>
                  <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">${d.caseNumber}</span>
                  <h4 style="color: var(--color-primary); font-size: 1.1rem; margin: 0.2rem 0 0 0; font-weight: 700;">${d.title || 'Untitled Legal Matter'}</h4>
                </div>
                <span class="badge badge-active">Ready for Activation</span>
              </div>

              <div class="grid grid-cols-2 gap-3" style="font-size: 0.82rem;">
                <div><strong>Practice Group:</strong> ${d.caseType}</div>
                <div><strong>Client Name:</strong> ${d.client} (${d.clientType})</div>
                <div><strong>Court Forum:</strong> ${d.court}</div>
                <div><strong>Presiding Judge:</strong> ${d.presidingOfficer || 'To Be Assigned'}</div>
                <div><strong>Lead Counsel:</strong> ${d.lawyer}</div>
                <div><strong>Priority Level:</strong> ${d.priority}</div>
                <div><strong>Next Hearing:</strong> ${d.nextHearingDate || 'TBD'}</div>
                <div><strong>Retainer Trust:</strong> $${d.retainerAmount?.toLocaleString() || '50,000'} (Chase IOLTA)</div>
              </div>

              <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border-subtle); font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.5;">
                <strong>Fact Outline:</strong> ${d.description || 'No additional fact outline provided.'}
              </div>
            </div>
          </div>
        `;
    }
  },

  fillSampleCaption(title, type) {
    const titleInput = document.getElementById('wz-title');
    const typeInput = document.getElementById('wz-casetype');
    if (titleInput) titleInput.value = title;
    if (typeInput) typeInput.value = type;
    this.wizardData.title = title;
    this.wizardData.caseType = type;
    App.showToast(`Applied preset caption: ${title}`, 'info');
  },

  generateAISummaryDraft() {
    const txt = document.getElementById('wz-description');
    if (!txt) return;
    txt.value = 'Action for breach of software licensing agreement and misappropriation of proprietary trade secret algorithms. Client alleges defendant unlawfully duplicated core microservice architecture in violation of Section 4.2 of the Master Licensing Agreement, causing liquidated monetary damages exceeding $450,000.00.';
    this.wizardData.description = txt.value;
    App.showToast('AI synthesized initial matter fact outline!', 'success');
  },

  validateAndNext(currentStep) {
    if (currentStep === 1) {
      const title = document.getElementById('wz-title')?.value;
      if (!title || title.trim() === '') {
        App.showToast('Please provide a formal Case Title before proceeding.', 'error');
        return;
      }
      this.wizardData.title = title;
      this.wizardData.caseNumber = document.getElementById('wz-caseno')?.value || this.wizardData.caseNumber;
      this.wizardData.caseType = document.getElementById('wz-casetype')?.value || this.wizardData.caseType;
      this.wizardData.description = document.getElementById('wz-description')?.value || '';
    } else if (currentStep === 2) {
      this.wizardData.client = document.getElementById('wz-client')?.value;
      this.wizardData.clientType = document.getElementById('wz-clienttype')?.value;
      this.wizardData.opposingParty = document.getElementById('wz-opposingparty')?.value || 'Pending Designation';
      this.wizardData.opposingCounsel = document.getElementById('wz-opposingcounsel')?.value || 'Unassigned';
    } else if (currentStep === 3) {
      this.wizardData.court = document.getElementById('wz-court')?.value || 'Supreme Court';
      this.wizardData.courtCaseNo = document.getElementById('wz-courtcaseno')?.value || 'Unassigned';
      this.wizardData.presidingOfficer = document.getElementById('wz-judge')?.value || 'Unassigned';
    } else if (currentStep === 4) {
      this.wizardData.lawyer = document.getElementById('wz-lawyer')?.value;
      this.wizardData.lawyerAvatar = this.wizardData.lawyer.includes('Eleanor') ? 'EV' : 'JM';
      this.wizardData.supportingStaff = document.getElementById('wz-staff')?.value;
      this.wizardData.priority = document.getElementById('wz-priority')?.value;
      this.wizardData.retainerAmount = parseInt(document.getElementById('wz-retainer')?.value) || 50000;
    } else if (currentStep === 5) {
      this.wizardData.openingDate = document.getElementById('wz-openingdate')?.value;
      this.wizardData.nextHearingDate = document.getElementById('wz-hearingdate')?.value;
      this.wizardData.expectedCompletion = document.getElementById('wz-expecteddate')?.value;
    }

    this.goToWizardStep(currentStep + 1);
  },

  goToWizardStep(stepNum) {
    this.wizardCurrentStep = stepNum;
    this.renderWizardModal();
  },

  saveWizardDraft() {
    App.closeModal();
    App.showToast('Case creation draft saved to pending queue.', 'info');
  },

  submitNewCase() {
    const newCase = {
      id: 'case-' + Date.now(),
      ...this.wizardData,
      progressPct: 15,
      totalBilled: 0,
      totalPaid: this.wizardData.retainerAmount || 0,
      notes: 'Case file newly registered and assigned.'
    };

    SLCMS_STATE.addCase(newCase);
    App.closeModal();
    App.showToast(`Legal matter ${newCase.caseNumber} registered successfully!`, 'success');
    App.refreshCurrentView();
  },

  // -------------------------------------------------------------
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

      <!-- 8 Tab Navigation Bar -->
      <div class="tabs-nav" style="padding: 0 1.5rem; margin-bottom: 0; background: var(--color-surface-subtle);">
        <button class="tab-btn ${this.activeCaseTab === 'overview' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('overview')">1. Overview</button>
        <button class="tab-btn ${this.activeCaseTab === 'parties' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('parties')">2. Parties & Counsel</button>
        <button class="tab-btn ${this.activeCaseTab === 'documents' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('documents')">3. Documents (${SLCMS_STATE.documents.filter(d => d.caseId === c.id).length})</button>
        <button class="tab-btn ${this.activeCaseTab === 'tasks' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('tasks')">4. Tasks (${SLCMS_STATE.tasks.filter(t => t.caseId === c.id).length})</button>
        <button class="tab-btn ${this.activeCaseTab === 'timeline' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('timeline')">5. Timeline</button>
        <button class="tab-btn ${this.activeCaseTab === 'communications' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('communications')">6. Communications</button>
        <button class="tab-btn ${this.activeCaseTab === 'billing' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('billing')">7. Retainer & Billing</button>
        <button class="tab-btn ${this.activeCaseTab === 'notes' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('notes')">8. Notes</button>
      </div>

      <div class="modal-body" id="case-tab-content-body" style="padding: 1.5rem;">
        ${this.renderCaseTabContent(c, this.activeCaseTab)}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Dossier</button>
        <button class="btn btn-gold" onclick="CasesView.quickAddDocument('${c.id}')">+ Upload Document</button>
      </div>
    `, 'modal-xl modal-fixed-dossier');
  },

  switchCaseDetailTab(tabName) {
    this.activeCaseTab = tabName;
    const c = SLCMS_STATE.cases.find(item => item.id === this.activeCaseId);
    const body = document.getElementById('case-tab-content-body');
    if (body && c) {
      body.innerHTML = this.renderCaseTabContent(c, tabName);
      // Update active state in tab buttons
      const tabBtns = document.querySelectorAll('.tabs-nav .tab-btn');
      tabBtns.forEach(btn => {
        if (btn.innerText.toLowerCase().includes(tabName)) {
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
        return `
          <div class="grid grid-cols-3 gap-6">
            <div style="grid-column: span 2;" class="flex flex-col gap-4">
              <div class="card">
                <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;">Matter Summary</h4>
                <p style="font-size: 0.9rem; line-height: 1.6;">${c.description}</p>
              </div>

              <div class="card">
                <h4 style="color: var(--color-primary); margin-bottom: 0.75rem;">Litigation Progress & Milestone Completion</h4>
                <div class="flex items-center justify-between" style="font-size: 0.8rem; margin-bottom: 0.35rem;">
                  <span>Stage: Discovery & Interrogatories</span>
                  <strong>${c.progressPct}% Complete</strong>
                </div>
                <div style="width: 100%; height: 8px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${c.progressPct}%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-gold));"></div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="card" style="background: var(--color-surface-subtle);">
                <h4 style="color: var(--color-primary); font-size: 0.95rem; margin-bottom: 0.75rem;">Key Matter Dates</h4>
                <div class="flex flex-col gap-2" style="font-size: 0.82rem;">
                  <div class="flex justify-between">
                    <span style="color: var(--color-text-secondary);">Opened:</span>
                    <strong>${c.openingDate}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span style="color: var(--color-text-secondary);">Next Hearing:</span>
                    <strong style="color: var(--color-danger);">${c.nextHearingDate}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span style="color: var(--color-text-secondary);">Est. Completion:</span>
                    <strong>${c.expectedCompletion}</strong>
                  </div>
                </div>
              </div>

              <div class="card" style="background: var(--color-surface-subtle);">
                <h4 style="color: var(--color-primary); font-size: 0.95rem; margin-bottom: 0.75rem;">Assigned Legal Team</h4>
                <div class="flex items-center gap-2.5" style="margin-bottom: 0.5rem;">
                  <div class="avatar avatar-sm avatar-navy">${c.lawyerAvatar}</div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">${c.lawyer}</div>
                    <div style="font-size: 0.7rem; color: var(--color-gold);">Lead Counsel</div>
                  </div>
                </div>
                <div class="flex items-center gap-2.5">
                  <div class="avatar avatar-sm avatar-teal">MB</div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">${c.supportingStaff}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-secondary);">Supporting Clerk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      case 'parties':
        return `
          <div class="grid grid-cols-2 gap-6">
            <div class="card">
              <h4 style="color: var(--color-primary); margin-bottom: 0.75rem;">Represented Client</h4>
              <div style="font-size: 0.88rem; line-height: 1.6;">
                <div><strong>Entity:</strong> ${c.client}</div>
                <div><strong>Client Type:</strong> ${c.clientType}</div>
                <div><strong>Status:</strong> Verified Corporate Retainer</div>
              </div>
            </div>
            <div class="card">
              <h4 style="color: var(--color-danger); margin-bottom: 0.75rem;">Opposing Parties & Counsel</h4>
              <div style="font-size: 0.88rem; line-height: 1.6;">
                <div><strong>Opposing Party:</strong> ${c.opposingParty}</div>
                <div><strong>Opposing Counsel:</strong> ${c.opposingCounsel}</div>
              </div>
            </div>
          </div>
        `;
      case 'documents':
        const caseDocs = SLCMS_STATE.documents.filter(d => d.caseId === c.id);
        return `
          <div>
            <div class="flex items-center justify-between" style="margin-bottom: 1rem;">
              <h4 style="color: var(--color-primary);">Pleadings, Exhibits & Evidence Files</h4>
              <button class="btn btn-secondary btn-sm" onclick="CasesView.quickAddDocument('${c.id}')">+ Upload</button>
            </div>
            ${caseDocs.length ? `
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr><th>Title</th><th>Category</th><th>Version</th><th>Access Level</th><th>Uploaded By</th></tr>
                  </thead>
                  <tbody>
                    ${caseDocs.map(doc => `
                      <tr>
                        <td><strong>${doc.title}</strong><div style="font-size: 0.72rem; color: var(--color-text-muted);">${doc.fileName}</div></td>
                        <td><span class="badge" style="background: #F1F5F9;">${doc.category}</span></td>
                        <td>${doc.version}</td>
                        <td><span class="badge badge-confidential">${doc.accessLevel}</span></td>
                        <td>${doc.uploadedBy}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `<p style="color: var(--color-text-secondary); text-align: center; padding: 2rem;">No documents uploaded to this matter yet.</p>`}
          </div>
        `;
      case 'tasks':
        const caseTasks = SLCMS_STATE.tasks.filter(t => t.caseId === c.id);
        return `
          <div class="flex flex-col gap-3">
            ${caseTasks.map(t => `
              <div class="card flex items-center justify-between p-3" style="border-left: 3px solid ${t.priority === 'High' ? 'var(--color-danger)' : 'var(--color-gold)'};">
                <div>
                  <div style="font-weight: 600; color: var(--color-primary);">${t.title}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Assigned to: ${t.assignedTo} • Due: <strong>${t.dueDate}</strong></div>
                </div>
                <span class="badge badge-priority-${t.priority.toLowerCase()}">${t.priority}</span>
              </div>
            `).join('')}
          </div>
        `;
      case 'timeline':
        return `
          <div class="timeline-feed">
            <div class="timeline-event">
              <div class="timeline-dot dot-gold"></div>
              <div style="font-weight: 600; color: var(--color-primary);">Motion for Summary Judgment Draft Completed</div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Aug 28, 2026 • Eleanor Vance, Esq.</div>
              <p style="font-size: 0.82rem; margin-top: 0.25rem;">Partner review finalized; citations cross-checked against 2nd Circuit precedents.</p>
            </div>
            <div class="timeline-event">
              <div class="timeline-dot dot-green"></div>
              <div style="font-weight: 600; color: var(--color-primary);">Protective Order Issued by Court</div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Aug 14, 2026 • Hon. Justice Katherine Thorne</div>
              <p style="font-size: 0.82rem; margin-top: 0.25rem;">Stipulated confidentiality agreement entered into record.</p>
            </div>
            <div class="timeline-event">
              <div class="timeline-dot"></div>
              <div style="font-weight: 600; color: var(--color-primary);">Formal Case Inception & Summons Issued</div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Feb 10, 2026 • Lead Counsel</div>
              <p style="font-size: 0.82rem; margin-top: 0.25rem;">Initial verified complaint filed with the commercial docket.</p>
            </div>
          </div>
        `;
      case 'communications':
        const caseComms = SLCMS_STATE.communications.filter(comm => comm.caseNumber === c.caseNumber);
        return `
          <div class="flex flex-col gap-3">
            ${caseComms.map(comm => `
              <div class="card p-3">
                <div class="flex justify-between items-center" style="margin-bottom: 0.35rem;">
                  <strong>${comm.subject}</strong>
                  <span style="font-size: 0.75rem; color: var(--color-text-muted);">${comm.timestamp}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${comm.summary}</div>
              </div>
            `).join('')}
          </div>
        `;
      case 'billing':
        return `
          <div class="grid grid-cols-3 gap-4" style="margin-bottom: 1.25rem;">
            <div class="card text-center">
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Retainer Held</div>
              <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-gold);">$${c.retainerAmount.toLocaleString()}</div>
            </div>
            <div class="card text-center">
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Total Billed to Date</div>
              <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-primary);">$${c.totalBilled.toLocaleString()}</div>
            </div>
            <div class="card text-center">
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Payments Received</div>
              <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-success);">$${c.totalPaid.toLocaleString()}</div>
            </div>
          </div>
        `;
      case 'notes':
        return `
          <div class="form-group">
            <label class="form-label">Confidential Work-Product & Strategy Notes</label>
            <textarea class="form-control" rows="8" placeholder="Privileged work-product notes...">${c.notes}</textarea>
          </div>
          <button class="btn btn-gold btn-sm" onclick="App.showToast('Work-product notes encrypted & saved', 'success')">Save Privileged Notes</button>
        `;
    }
  },

  quickAddTask(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    TasksView.openNewTaskModal(c);
  },

  quickAddDocument(caseId) {
    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    DocumentsView.openUploadModal(c);
  },

  exportCasesCSV() {
    App.promptSensitiveAuth('Export Confidential Firm Case Dossiers', () => {
      SLCMS_STATE.addAuditLog('Confidential Case Dossiers Exported', 'Case Management', `Exported ${SLCMS_STATE.cases.length} records to CSV`);
      App.showToast(`Export verified. Generating encrypted CSV archive for ${SLCMS_STATE.cases.length} matters...`, 'success');
    });
  }
};
