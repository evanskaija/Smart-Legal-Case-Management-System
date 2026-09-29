/* ==========================================================================
   SLCMS - Cases Management, Streamlined 3-Step Modal & Case Dossier View
   ========================================================================== */

const CasesView = {
  currentViewMode: 'table', // 'table' | 'cards'
  viewScope: 'all', // 'all' | 'assigned'
  selectedFilterStatus: 'All',
  selectedFilterType: 'All',
  selectedFilterPriority: 'All',
  searchQuery: '',
  selectedClientFilter: null,
  selectedClientName: null,
  newCaseStep: 1,
  newCaseData: null,

  setViewScope(scope) {
    this.viewScope = scope;
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    } else if (typeof App !== 'undefined' && App.refreshCurrentView) {
      App.refreshCurrentView();
    }
  },

  /**
   * Reusable text normalizer.
   * Safely coerces null/undefined values to empty string and returns trimmed lowercase text.
   */
  normalizeText(value) {
    return String(value ?? '').trim().toLowerCase();
  },

  /**
   * Supply safe default values for case records before rendering or filtering.
   * Bridges frontend & backend naming conventions (caseTitle vs title, caseType vs type, clientName vs client).
   */
  prepareCase(caseItem = {}) {
    return this.normalizeCase(caseItem);
  },

  normalizeCase(caseItem = {}) {
    if (!caseItem || typeof caseItem !== 'object') {
      caseItem = {};
    }
    const rawId = caseItem.id ?? caseItem.caseId ?? null;
    const title = String(caseItem.caseTitle ?? caseItem.title ?? 'Untitled Case');
    const caseNumber = String(caseItem.caseNumber ?? caseItem.officialCaseNumber ?? 'Not provided');
    const caseType = String(caseItem.caseType ?? caseItem.type ?? 'Other');
    const status = String(caseItem.status ?? caseItem.caseStatus ?? 'Unassigned');
    const priority = String(caseItem.priority ?? 'Medium');

    let clientNameStr = 'No client linked';
    if (typeof caseItem.clientName === 'string' && caseItem.clientName.trim()) {
      clientNameStr = caseItem.clientName;
    } else if (typeof caseItem.client === 'string' && caseItem.client.trim()) {
      clientNameStr = caseItem.client;
    } else if (typeof caseItem.client === 'object' && caseItem.client !== null) {
      clientNameStr = caseItem.client.fullName || caseItem.client.name || 'No client linked';
    }

    let assignedCounselStr = 'Unassigned';
    if (typeof caseItem.assignedCounsel === 'string' && caseItem.assignedCounsel.trim()) {
      assignedCounselStr = caseItem.assignedCounsel;
    } else if (typeof caseItem.assignedCounsel === 'object' && caseItem.assignedCounsel !== null) {
      assignedCounselStr = caseItem.assignedCounsel.name || caseItem.assignedCounsel.fullName || 'Unassigned';
    } else if (typeof caseItem.leadCounsel === 'string' && caseItem.leadCounsel.trim()) {
      assignedCounselStr = caseItem.leadCounsel;
    } else if (typeof caseItem.leadCounsel === 'object' && caseItem.leadCounsel !== null) {
      assignedCounselStr = caseItem.leadCounsel.fullName || caseItem.leadCounsel.name || 'Unassigned';
    } else if (typeof caseItem.lawyer === 'string' && caseItem.lawyer.trim()) {
      assignedCounselStr = caseItem.lawyer;
    } else if (typeof caseItem.lawyer === 'object' && caseItem.lawyer !== null) {
      assignedCounselStr = caseItem.lawyer.name || caseItem.lawyer.fullName || 'Unassigned';
    }

    const court = String(caseItem.court ?? 'Not provided');
    const registry = String(caseItem.registry ?? '');
    const decisionYear = String(caseItem.decisionYear ?? caseItem.year ?? 'Not provided');

    let avatarLetter = 'U';
    if (typeof caseItem.lawyerAvatar === 'string' && caseItem.lawyerAvatar.trim()) {
      avatarLetter = caseItem.lawyerAvatar.trim();
    } else if (typeof assignedCounselStr === 'string' && assignedCounselStr.trim()) {
      const cleanName = assignedCounselStr.replace(/^(adv\.|dr\.|mr\.|mrs\.|ms\.)\s+/i, '').trim();
      avatarLetter = cleanName.charAt(0).toUpperCase() || 'U';
    }

    return {
      ...caseItem,
      id: rawId,
      caseTitle: title,
      title: title,
      caseNumber: caseNumber,
      officialCaseNumber: caseNumber,
      caseType: caseType,
      type: caseType,
      status: status,
      priority: priority,
      clientName: clientNameStr,
      client: clientNameStr,
      clientType: String(caseItem.clientType || 'Individual'),
      court: court,
      registry: registry,
      decisionYear: decisionYear,
      assignedCounsel: assignedCounselStr,
      lawyer: assignedCounselStr,
      lawyerAvatar: avatarLetter,
      nextHearingDate: String(caseItem.nextHearingDate || 'TBD'),
      description: String(caseItem.description || 'No description provided.'),
      facts: String(caseItem.facts || ''),
      pendingTasks: Array.isArray(caseItem.pendingTasks) ? caseItem.pendingTasks : [],
      documents: Array.isArray(caseItem.documents) ? caseItem.documents : [],
      linkedPrecedents: Array.isArray(caseItem.linkedPrecedents) ? caseItem.linkedPrecedents : []
    };
  },

  /**
   * Safe case search and filtering function.
   * Handles missing/undefined fields, searches across all case metadata, and guards dropdown filters.
   */
  filterCases(cases, searchValue, statusFilter, typeFilter, priorityFilter) {
    const query = this.normalizeText(searchValue !== undefined ? searchValue : this.searchQuery);
    const selectedStatus = this.normalizeText(statusFilter !== undefined ? statusFilter : this.selectedFilterStatus);
    const selectedType = this.normalizeText(typeFilter !== undefined ? typeFilter : this.selectedFilterType);
    const selectedPriority = this.normalizeText(priorityFilter !== undefined ? priorityFilter : this.selectedFilterPriority);

    const safeList = (Array.isArray(cases) ? cases : [])
      .filter(Boolean)
      .map(item => this.normalizeCase(item));

    return safeList.filter(item => {
      if (!item) return false;

      // Access Control
      if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.canAccessCase && !SLCMS_STATE.canAccessCase(SLCMS_STATE.currentUser, item.id)) {
        return false;
      }

      const title = this.normalizeText(item.caseTitle ?? item.title);
      const number = this.normalizeText(item.caseNumber ?? item.officialCaseNumber);
      const client = this.normalizeText(item.clientName ?? item.client);
      const lawyer = this.normalizeText(item.assignedCounsel ?? item.lawyer);
      const court = this.normalizeText(item.court);
      const registry = this.normalizeText(item.registry);
      const type = this.normalizeText(item.caseType ?? item.type ?? 'OTHER');
      const status = this.normalizeText(item.status ?? 'UNASSIGNED');
      const priority = this.normalizeText(item.priority ?? 'MEDIUM');

      // Client-specific filter
      if (this.selectedClientFilter || this.selectedClientName) {
        const targetId = this.selectedClientFilter;
        const targetName = this.normalizeText(this.selectedClientName);
        const matchesClient = (targetId && item.clientId === targetId) ||
          (targetName && (client === targetName || client.includes(targetName) || title.includes(targetName)));
        if (!matchesClient) return false;
      }

      const matchesSearch = (!query || (this.selectedClientName && query === this.selectedClientName.toLowerCase())) ? true : [
        title,
        number,
        type,
        status,
        client,
        court,
        registry,
        lawyer
      ].some(val => val.includes(query));

      let matchesStatus = false;
      if (selectedStatus === 'all' || !selectedStatus) {
        matchesStatus = true;
      } else if (selectedStatus === 'attention') {
        matchesStatus = (item.id === 'case-103' || item.id === 'case-105' || item.id === 'case-106' || item.attentionRequired === true);
      } else {
        matchesStatus = (status === selectedStatus);
      }

      const matchesType = selectedType === 'all' || !selectedType || type === selectedType;
      const matchesPriority = selectedPriority === 'all' || !selectedPriority || priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  },

  clearClientFilter() {
    this.selectedClientFilter = null;
    this.selectedClientName = null;
    this.searchQuery = '';
    this.selectedFilterStatus = 'All';
    this.selectedFilterType = 'All';
    this.selectedFilterPriority = 'All';
    App.refreshCurrentView();
  },

  getFilteredCases(sourceCases) {
    const rawList = sourceCases || (Array.isArray(SLCMS_STATE?.cases) ? SLCMS_STATE.cases : []);
    return this.filterCases(rawList, this.searchQuery, this.selectedFilterStatus, this.selectedFilterType, this.selectedFilterPriority);
  },

  renderEmptyCasesState() {
    const rawCases = Array.isArray(SLCMS_STATE?.cases) ? SLCMS_STATE.cases : [];
    const scope = this.viewScope || 'all';

    if (scope === 'assigned') {
      return `
        <div class="card empty-state" style="padding: 3.5rem 1.5rem; text-align: center; margin: 1rem 0;">
          <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.85rem;">👤</div>
          <h3 class="empty-title" style="font-size: 1.25rem; color: var(--color-primary); font-weight: 700;">No Assigned Matters Found</h3>
          <p class="empty-desc" style="color: var(--color-text-secondary); max-width: 520px; margin: 0.5rem auto 1.5rem auto; line-height: 1.5;">
            No legal proceedings are currently assigned specifically to your user profile (${SLCMS_STATE.currentUser?.name || 'User'}).
            You can switch to <strong>All Firm Matters (${rawCases.length})</strong> to view all active proceedings across the organization.
          </p>
          <button class="btn btn-gold" onclick="CasesView.setViewScope('all')">
            📂 View All ${rawCases.length} Firm Matters
          </button>
        </div>
      `;
    }

    if (this.searchQuery || this.selectedFilterStatus !== 'All' || this.selectedFilterType !== 'All' || this.selectedFilterPriority !== 'All' || this.selectedClientFilter || this.selectedClientName) {
      return `
        <div class="card empty-state" style="padding: 3rem 1.5rem; text-align: center; margin: 1rem 0;">
          <div class="empty-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 class="empty-title" style="font-size: 1.15rem; color: var(--color-primary); font-weight: 700;">No matching cases found</h3>
          <p class="empty-desc" style="color: var(--color-text-secondary); max-width: 480px; margin: 0.5rem auto 1.25rem auto;">
            Adjust your search parameters, status filters, or client selection to view available legal matters.
          </p>
          <button class="btn btn-secondary" onclick="CasesView.clearFilters()">Clear Filters</button>
        </div>
      `;
    }

    const isAdmin = SLCMS_STATE.currentUser?.role === 'Administrator';
    return `
      <div class="card empty-state" style="padding: 3.5rem 1.5rem; text-align: center; margin: 1rem 0;">
        <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.85rem;">⚖️</div>
        <h3 class="empty-title" style="font-size: 1.25rem; color: var(--color-primary); font-weight: 700;">No cases registered yet</h3>
        <p class="empty-desc" style="color: var(--color-text-secondary); max-width: 480px; margin: 0.5rem auto 1.5rem auto; line-height: 1.5;">
          ${isAdmin ? 'Register the first case to begin managing assignments and documents.' : 'Legal matters will appear here once added to the system.'}
        </p>
        <button class="btn btn-gold" onclick="CasesView.openNewCaseModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>+ Add New Case</span>
        </button>
      </div>
    `;
  },

  renderPageError(message) {
    return `
      <div class="cases-view-container animate-fade">
        <div class="view-header cases-view-header">
          <div>
            <h1 class="page-title cases-page-title">Legal Matters &amp; Cases</h1>
            <p class="cases-page-subtitle">
              Manage litigation proceedings, corporate advisory files, discovery records and court schedules
            </p>
          </div>
        </div>
        <div class="card error-state" style="padding: 3.5rem 1.5rem; text-align: center; margin: 1.5rem 0; border: 1px solid #FCA5A5; background: #FEF2F2; border-radius: var(--radius-md);">
          <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.85rem;">⚠️</div>
          <h3 class="empty-title" style="font-size: 1.25rem; color: #991B1B; font-weight: 700; margin-bottom: 0.5rem;">Matter Service Notice</h3>
          <p class="empty-desc" style="color: #7F1D1D; max-width: 500px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
            ${message || 'Cases could not be displayed. Please refresh or contact the system administrator.'}
          </p>
          <div class="flex items-center justify-center gap-2">
            <button class="btn btn-secondary btn-sm" onclick="location.reload()">Refresh Page</button>
            <button class="btn btn-gold btn-sm" onclick="CasesView.clearFilters(); App.navigate('cases');">Reset Filters</button>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    try {
      const rawCases = Array.isArray(SLCMS_STATE?.cases) ? SLCMS_STATE.cases : [];
      const currentUser = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      const userRole = String(currentUser?.role || '').toLowerCase();
      const userTitle = String(currentUser?.roleTitle || currentUser?.jobTitle || '').toLowerCase();
      const isLawyerRole = userRole.includes('lawyer') || userRole.includes('advocate') || userRole.includes('associate') || userTitle.includes('associate') || userTitle.includes('lawyer');

      // Compute assigned cases specifically for current user
      const assignedCases = rawCases.filter(c => {
        if (!c || !currentUser) return false;
        const userId = currentUser.id;
        const userName = (currentUser.name || '').toLowerCase();
        const assignedIds = new Set(Array.isArray(currentUser.assignedCaseIds) ? currentUser.assignedCaseIds : []);
        if (assignedIds.has(c.id)) return true;
        if (c.assignedLawyerId === userId || c.lawyerId === userId || c.seniorLawyerId === userId || c.clerkId === userId) return true;
        const lawyerStr = typeof c.lawyer === 'string' ? c.lawyer.toLowerCase() : (typeof c.lawyer === 'object' && c.lawyer ? (c.lawyer.name || c.lawyer.fullName || '').toLowerCase() : '');
        const leadCounselStr = typeof c.leadCounsel === 'string' ? c.leadCounsel.toLowerCase() : (typeof c.leadCounsel === 'object' && c.leadCounsel ? (c.leadCounsel.fullName || c.leadCounsel.name || '').toLowerCase() : '');
        const assignedCounselStr = typeof c.assignedCounsel === 'string' ? c.assignedCounsel.toLowerCase() : (typeof c.assignedCounsel === 'object' && c.assignedCounsel ? (c.assignedCounsel.name || c.assignedCounsel.fullName || '').toLowerCase() : '');

        if (userName && (lawyerStr.includes(userName) || leadCounselStr.includes(userName) || assignedCounselStr.includes(userName))) return true;
        return false;
      });

      const scope = this.viewScope || 'all';

      let baseCases = rawCases;
      if (scope === 'assigned') {
        baseCases = assignedCases;
      }

      const safeCases = baseCases.filter(Boolean).map(c => this.prepareCase(c));
      const filteredCases = this.getFilteredCases(safeCases);
      const isLawyer = isLawyerRole;

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
            <button class="btn btn-secondary cases-header-btn" onclick="App.navigate('case-library')" style="background: rgba(2, 132, 199, 0.08); border-color: rgba(2, 132, 199, 0.3); color: #0284C7; font-weight: 700;" title="Open 77 TanzLII Precedents Library">
              <span>🏛️ TanzLII Cases (77)</span>
            </button>
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

        <!-- Mode switcher between All Firm Matters, My Assigned Matters, and TanzLII Cases -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem; background: #F1F5F9; padding: 0.25rem; border-radius: 8px;">
            <button type="button" class="btn btn-sm" onclick="CasesView.setViewScope('all')" 
                    style="${scope === 'all' ? 'background: #0F172A; color: #FFFFFF; font-weight: 700;' : 'background: transparent; color: #475569; font-weight: 600;'} font-size: 0.8rem; border-radius: 6px; padding: 0.35rem 0.85rem; border: none; cursor: pointer;">
              📂 All Firm Matters (${rawCases.length})
            </button>
            <button type="button" class="btn btn-sm" onclick="CasesView.setViewScope('assigned')" 
                    style="${scope === 'assigned' ? 'background: #0F172A; color: #FFFFFF; font-weight: 700;' : 'background: transparent; color: #475569; font-weight: 600;'} font-size: 0.8rem; border-radius: 6px; padding: 0.35rem 0.85rem; border: none; cursor: pointer;">
              👤 My Assigned Matters (${assignedCases.length})
            </button>
            <button type="button" class="btn btn-sm btn-ghost" onclick="App.navigate('case-library')" style="color: #0284C7; font-weight: 700; font-size: 0.8rem; border-radius: 6px; padding: 0.35rem 0.85rem; cursor: pointer;">
              🏛️ 77 Cases from TanzLII ➔
            </button>
          </div>
          <div style="font-size: 0.8rem; color: #64748B;">
            Looking for judicial precedent? <a href="javascript:void(0)" onclick="App.navigate('case-library')" style="color: #0284C7; font-weight: 700; text-decoration: none;">Browse 77 TanzLII Precedents &rarr;</a>
          </div>
        </div>

        <!-- CLIENT MATTERS FILTER ACTIVE BANNER -->
        ${(this.selectedClientFilter || this.selectedClientName) ? `
          <div class="alert alert-info animate-fade" style="margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; background: rgba(14, 165, 233, 0.08); border: 1.5px solid rgba(14, 165, 233, 0.35); border-radius: 12px; padding: 0.85rem 1.25rem; box-shadow: 0 2px 10px rgba(14, 165, 233, 0.08);">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.35rem;">🏢</span>
              <div>
                <strong style="color: #0369A1; font-size: 0.95rem;">Filtered by Client: ${this.selectedClientName || 'Selected Client'}</strong>
                <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.15rem;">Showing active proceedings, litigation filings, and commercial matters connected to this client profile.</div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="CasesView.clearClientFilter()" style="font-size: 0.78rem; padding: 0.35rem 0.85rem; font-weight: 700; white-space: nowrap;">
              ✕ Show All Cases
            </button>
          </div>
        ` : ''}

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
                <option value="Attention" ${this.selectedFilterStatus === 'Attention' ? 'selected' : ''}>⚠️ Attention (${(typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.getCasesRequiringAttentionCount) ? SLCMS_STATE.getCasesRequiringAttentionCount() : 0} Matters)</option>
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
        ${(this.selectedFilterStatus === 'Attention' && (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.getCasesRequiringAttentionCount && SLCMS_STATE.getCasesRequiringAttentionCount() > 0)) ? `
          <div class="alert alert-warning animate-fade" style="margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid #D97706; background: #FFFBEB; border: 1px solid #FDE68A; padding: 1rem 1.25rem; border-radius: 8px;">
            <div class="flex items-start gap-3">
              <span style="font-size: 1.35rem; line-height: 1;">⚠️</span>
              <div>
                <strong style="color: #92400E; font-size: 0.95rem;">${SLCMS_STATE.getCasesRequiringAttentionCount()} Case${SLCMS_STATE.getCasesRequiringAttentionCount() === 1 ? '' : 's'} Requiring Administrative Attention</strong>
                <p style="font-size: 0.82rem; color: #78350F; margin: 0.25rem 0 0 0; line-height: 1.5;">
                  Matters flagged for staff assignment, sensitive seals, or procedural verification.
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
              <button class="btn btn-secondary btn-sm cases-admin-action-archive" onclick="CasesView.openArchiveModal()">
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
    } catch (error) {
      console.error('Admin Cases rendering failed:', error);
      return this.renderPageError('Cases could not be displayed. Please refresh or contact the system administrator.');
    }
  },

  renderCasesTable(casesList) {
    if (!Array.isArray(casesList) || casesList.length === 0) {
      return this.renderEmptyCasesState();
    }

    const isLawyer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate') || r.includes('associate') || t.includes('associate');
    })();

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
              ${casesList.map(rawC => {
                const c = this.normalizeCase(rawC);
                const priorityClass = this.normalizeText(c.priority);
                const statusClass = this.normalizeText(c.status).replace(/\s+/g, '');
                const leadCounselName = (typeof c.lawyer === 'string' ? c.lawyer : String(c.lawyer || '')).split(',')[0].trim() || 'Unassigned';
                const avatarLetter = (typeof c.lawyerAvatar === 'string' && c.lawyerAvatar.trim()) ? c.lawyerAvatar.trim() : (leadCounselName.replace(/^(adv\.|dr\.|mr\.|mrs\.|ms\.)\s+/i, '').charAt(0).toUpperCase() || 'U');

                return `
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
                      <div class="avatar avatar-sm avatar-navy">${avatarLetter}</div>
                      <span style="font-size: 0.82rem; font-weight: 500;">${leadCounselName}</span>
                    </div>
                  </td>
                  <td>
                    <div style="font-weight: 600; font-size: 0.82rem; color: ${c.nextHearingDate === 'Completed' ? 'var(--color-text-muted)' : 'var(--color-danger)'};">
                      ${c.nextHearingDate}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-priority-${priorityClass}">${c.priority}</span>
                  </td>
                  <td>
                    <span class="badge badge-${statusClass}">
                      <span class="badge-dot"></span>
                      ${c.status}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div class="flex items-center justify-end gap-1">
                      <button class="btn btn-secondary btn-sm" onclick="CasesView.openCaseDetails('${c.id}')" title="View Deep Case Dossier">
                        View
                      </button>
                      <button class="btn btn-ghost btn-sm" onclick="App.navigate('client-messages'); setTimeout(() => ClientMessagesView.handleSelectCase('${c.id}'), 100);" title="Draft Client Message with Case Generator">
                        ✉️ Msg
                      </button>
                      ${isLawyer ? '' : `
                      <button class="btn btn-ghost btn-sm" onclick="CasesView.quickAddTask('${c.id}')" title="Add Task to Case">
                        +Task
                      </button>
                      `}
                      <button class="btn btn-ghost btn-sm text-danger" onclick="CasesView.confirmRemoveCase('${c.id}')" title="Permanently Remove Case">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Phone Cards View (Optimized for Touch & Readability) -->
      <div class="mobile-cards-view">
        ${casesList.map(rawC => {
          const c = this.normalizeCase(rawC);
          const statusClass = this.normalizeText(c.status).replace(/\s+/g, '');
          return `
          <div class="case-card-mobile" onclick="CasesView.openCaseDetails('${c.id}')">
            <div class="case-card-mobile-header">
              <div class="case-card-mobile-title">${c.title}</div>
              <span class="badge badge-${statusClass}" style="font-size: 0.72rem; flex-shrink: 0;">
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
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('client-messages'); setTimeout(() => ClientMessagesView.handleSelectCase('${c.id}'), 100);" title="Message Client">
                ✉️ Msg
              </button>
              ${isLawyer ? '' : `
              <button class="btn btn-ghost btn-sm" onclick="CasesView.quickAddTask('${c.id}')">
                +Task
              </button>
              `}
            </div>
          </div>
        `;
        }).join('')}
      </div>

      <div class="flex items-center justify-between" style="margin-top: 1rem; font-size: 0.8rem; color: var(--color-text-secondary); flex-wrap: wrap; gap: 8px;">
        <div>Showing <strong>${casesList.length}</strong> of <strong>${Array.isArray(SLCMS_STATE?.cases) ? SLCMS_STATE.cases.length : 0}</strong> legal matters</div>
        <div class="flex items-center gap-1">
          <button class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button class="btn btn-gold btn-sm">1</button>
          <button class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    `;
  },

  renderCasesCards(casesList) {
    if (!Array.isArray(casesList) || casesList.length === 0) {
      return this.renderEmptyCasesState();
    }

    return `
      <div class="cases-card-grid">
        ${casesList.map(rawC => {
          const c = this.normalizeCase(rawC);
          const priorityClass = this.normalizeText(c.priority);
          const statusClass = this.normalizeText(c.status).replace(/\s+/g, '');
          const leadCounselName = (typeof c.lawyer === 'string' ? c.lawyer : String(c.lawyer || '')).split(',')[0].trim() || 'Unassigned';
          const avatarLetter = (typeof c.lawyerAvatar === 'string' && c.lawyerAvatar.trim()) ? c.lawyerAvatar.trim() : (leadCounselName.replace(/^(adv\.|dr\.|mr\.|mrs\.|ms\.)\s+/i, '').charAt(0).toUpperCase() || 'U');
          const descriptionText = String(c.description || '');
          const descSnippet = descriptionText.substring(0, 105);

          return `
          <div class="case-card-item" onclick="CasesView.openCaseDetails('${c.id}')">
            <div>
              <div class="flex items-center justify-between" style="margin-bottom: 0.65rem;">
                <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.8rem; color: var(--color-gold);">
                  ${c.caseNumber}
                </span>
                <span class="badge badge-${statusClass}">
                  ${c.status}
                </span>
              </div>
              <h3 style="font-size: 1.05rem; color: var(--color-primary); margin-bottom: 0.5rem; line-height: 1.3;">
                ${c.title}
              </h3>
              <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 1rem; line-height: 1.4;">
                ${descSnippet}${descriptionText.length > 105 ? '...' : ''}
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
                  <div class="avatar avatar-sm avatar-navy">${avatarLetter}</div>
                  <span style="font-size: 0.78rem; font-weight: 600;">${leadCounselName}</span>
                </div>
                <span class="badge badge-priority-${priorityClass}">${c.priority}</span>
              </div>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;
  },

  handleSearch(val) {
    this.searchQuery = String(val ?? '');
    App.refreshCurrentView();
  },

  handleFilterStatus(val) {
    this.selectedFilterStatus = String(val ?? 'All');
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    } else if (typeof App !== 'undefined' && App.refreshCurrentView) {
      App.refreshCurrentView();
    }
  },

  handleFilterType(val) {
    this.selectedFilterType = String(val ?? 'All');
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    } else if (typeof App !== 'undefined' && App.refreshCurrentView) {
      App.refreshCurrentView();
    }
  },

  handleFilterPriority(val) {
    this.selectedFilterPriority = String(val ?? 'All');
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    } else if (typeof App !== 'undefined' && App.refreshCurrentView) {
      App.refreshCurrentView();
    }
  },

  toggleViewMode(mode) {
    this.currentViewMode = mode;
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    } else if (typeof App !== 'undefined' && App.refreshCurrentView) {
      App.refreshCurrentView();
    }
  },

  clearFilters() {
    this.searchQuery = '';
    this.selectedFilterStatus = 'All';
    this.selectedFilterType = 'All';
    this.selectedFilterPriority = 'All';
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    } else if (typeof App !== 'undefined' && App.refreshCurrentView) {
      App.refreshCurrentView();
    }
  },

  exportCasesCSV() {
    App.showToast('Exporting active case registers to encrypted CSV archive...', 'info');
  },

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // STREAMLINED 3-STEP ADD NEW CASE WORKFLOW & VALIDATION
  // Step 1: Case Information -> Step 2: Parties & Client -> Step 3: Upload & Register
  // -------------------------------------------------------------
  newCaseStep: 1,
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

  getRolesForCaseType(caseType, title = '', caseNumber = '') {
    const combined = `${caseType || ''} ${title || ''} ${caseNumber || ''}`.toLowerCase();
    if (combined.includes('appeal')) {
      return ['Appellant', 'Respondent', 'Interested Party'];
    }
    if (combined.includes('application')) {
      return ['Applicant', 'Respondent', 'Interested Party'];
    }
    const ct = (caseType || '').toLowerCase();
    if (ct === 'criminal') {
      return ['Republic', 'Accused', 'Complainant', 'Interested Party'];
    }
    if (ct === 'matrimonial') {
      return ['Petitioner', 'Respondent', 'Applicant', 'Interested Party'];
    }
    if (ct === 'probate') {
      return ['Petitioner', 'Respondent', 'Objector', 'Interested Party'];
    }
    if (ct === 'civil' || ct === 'commercial' || ct === 'land') {
      return ['Plaintiff', 'Defendant', 'Claimant', 'Interested Party'];
    }
    return ['Plaintiff', 'Defendant', 'Claimant', 'Applicant', 'Respondent', 'Interested Party'];
  },

  getDefaultRoles(caseType, title = '', caseNumber = '') {
    const combined = `${caseType || ''} ${title || ''} ${caseNumber || ''}`.toLowerCase();
    if (combined.includes('appeal')) {
      return { p1: 'Appellant', p2: 'Respondent' };
    }
    if (combined.includes('application')) {
      return { p1: 'Applicant', p2: 'Respondent' };
    }
    const ct = (caseType || '').toLowerCase();
    if (ct === 'criminal') {
      return { p1: 'Republic', p2: 'Accused' };
    }
    if (ct === 'matrimonial') {
      return { p1: 'Petitioner', p2: 'Respondent' };
    }
    if (ct === 'probate') {
      return { p1: 'Petitioner', p2: 'Respondent' };
    }
    return { p1: 'Plaintiff', p2: 'Defendant' };
  },

  openNewCaseModal(preselectedClientId = null) {
    const currentUser = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
    const isLawyer = (function(u) {
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })(currentUser);

    if (isLawyer) {
      App.showToast('Access restricted: Lawyers do not have permission to register new cases. Case intake is handled by the Legal Officer.', 'warning');
      return;
    }

    this.newCaseStep = 1;
    this.newCaseDuplicateMatch = null;

    let clientName = '';
    let clientId = '';
    if (preselectedClientId) {
      const foundClient = (SLCMS_STATE.clients || []).find(c => c.id === preselectedClientId);
      if (foundClient) {
        clientName = foundClient.name;
        clientId = foundClient.id;
      }
    } else if (Array.isArray(SLCMS_STATE.clients) && SLCMS_STATE.clients.length > 0) {
      clientName = SLCMS_STATE.clients[0].name;
      clientId = SLCMS_STATE.clients[0].id;
    }

    const defaultType = 'Civil';
    const defRoles = this.getDefaultRoles(defaultType);

    this.newCaseData = {
      // Step 1: Case Information
      title: '',
      caseNumber: '',
      caseType: defaultType, // Civil, Criminal, Land, Matrimonial, Probate, Commercial or Other
      court: 'High Court of Tanzania',
      decisionDate: '',
      year: new Date().getFullYear().toString(),
      citation: '',

      // Step 2: Parties and Client
      firstParty: { name: '', role: defRoles.p1 },
      secondParty: { name: '', role: defRoles.p2 },
      additionalParties: [],
      client: clientName,
      clientId: clientId,
      priority: 'Medium', // Low, Medium, High or Urgent

      // Step 3: Upload and Register
      pdfFile: null,
      fileUploadError: null,
      ocrStatus: 'None'
    };

    this.renderNewCaseModal();
  },

  syncNewCaseFormData() {
    if (!this.newCaseData) return;
    const getVal = id => {
      const el = document.getElementById(id);
      return el ? el.value : null;
    };

    // Step 1
    const t = getVal('new-case-title');
    if (t !== null) this.newCaseData.title = t;

    const cn = getVal('new-case-number');
    if (cn !== null) this.newCaseData.caseNumber = cn;

    const ct = getVal('new-case-type');
    if (ct !== null && ct !== this.newCaseData.caseType) {
      this.newCaseData.caseType = ct;
      const defRoles = this.getDefaultRoles(ct, this.newCaseData.title, this.newCaseData.caseNumber);
      const roles = this.getRolesForCaseType(ct, this.newCaseData.title, this.newCaseData.caseNumber);
      if (!roles.includes(this.newCaseData.firstParty.role)) {
        this.newCaseData.firstParty.role = defRoles.p1;
      }
      if (!roles.includes(this.newCaseData.secondParty.role)) {
        this.newCaseData.secondParty.role = defRoles.p2;
      }
    }

    const crt = getVal('new-case-court');
    if (crt !== null) this.newCaseData.court = crt;

    const dt = getVal('new-case-decision-date');
    if (dt !== null) {
      this.newCaseData.decisionDate = dt;
      if (dt.trim()) {
        try {
          const yr = new Date(dt).getFullYear();
          if (!isNaN(yr)) this.newCaseData.year = yr.toString();
        } catch (e) {}
      } else {
        this.newCaseData.year = new Date().getFullYear().toString();
      }
    }

    const cit = getVal('new-case-citation');
    if (cit !== null) this.newCaseData.citation = cit;

    // Step 2
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

    const cli = getVal('new-case-client');
    if (cli !== null) {
      this.newCaseData.client = cli;
      const found = (SLCMS_STATE.clients || []).find(c => c.name === cli);
      if (found) this.newCaseData.clientId = found.id;
    }

    const pri = getVal('new-case-priority');
    if (pri !== null) this.newCaseData.priority = pri;
  },

  handleCaseTypeChanged(val) {
    this.syncNewCaseFormData();
    this.newCaseData.caseType = val;
    const defRoles = this.getDefaultRoles(val, this.newCaseData.title, this.newCaseData.caseNumber);
    this.newCaseData.firstParty.role = defRoles.p1;
    this.newCaseData.secondParty.role = defRoles.p2;
    this.renderNewCaseModal();
  },

  handleDecisionDateChanged(val) {
    this.syncNewCaseFormData();
    this.newCaseData.decisionDate = val;
    if (val && val.trim()) {
      try {
        const yr = new Date(val).getFullYear();
        if (!isNaN(yr)) {
          this.newCaseData.year = yr.toString();
        }
      } catch (e) {}
    } else {
      this.newCaseData.year = new Date().getFullYear().toString();
    }
    this.renderNewCaseModal();
  },

  goToNewCaseStep(targetStep) {
    this.syncNewCaseFormData();
    // Validate current step before advancing
    if (targetStep > this.newCaseStep) {
      for (let s = this.newCaseStep; s < targetStep; s++) {
        const stepErrors = this.validateStep(s);
        if (stepErrors.length > 0) {
          // Highlight and show error messages for ALL invalid fields on this step
          stepErrors.forEach(err => {
            const el = document.getElementById(err.field);
            if (el) el.classList.add('is-invalid');
            const errEl = document.getElementById(err.errId);
            if (errEl) {
              errEl.textContent = err.msg;
              errEl.classList.add('visible');
            }
          });
          const banner = document.getElementById(`step${s}-validation-alert`);
          if (banner) {
            banner.innerHTML = `⚠️ <span>Please correct the highlighted fields before proceeding: <strong>${this.escapeHtml(stepErrors[0].msg)}</strong></span>`;
            banner.style.display = 'flex';
          }
          App.showToast(stepErrors[0].msg, 'error');
          const firstEl = document.getElementById(stepErrors[0].field);
          if (firstEl) firstEl.focus();
          return;
        }
      }
    }

    this.newCaseStep = targetStep;
    this.renderNewCaseModal();
  },

  addAnotherParty() {
    this.syncNewCaseFormData();
    if (!Array.isArray(this.newCaseData.additionalParties)) {
      this.newCaseData.additionalParties = [];
    }
    const roles = this.getRolesForCaseType(this.newCaseData.caseType, this.newCaseData.title, this.newCaseData.caseNumber);
    this.newCaseData.additionalParties.push({ name: '', role: roles[roles.length - 1] || 'Interested Party' });
    this.renderNewCaseModal();
  },

  removeParty(idx) {
    this.syncNewCaseFormData();
    if (Array.isArray(this.newCaseData.additionalParties)) {
      this.newCaseData.additionalParties.splice(idx, 1);
    }
    this.renderNewCaseModal();
  },

  async handleCaseFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    await this.processAttachedFile(file);
  },

  async handleCaseFileDrop(event) {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) return;
    await this.processAttachedFile(file);
  },

  async processAttachedFile(file) {
    this.newCaseData.fileUploadError = null;

    // 1. File size validation (Max 25 MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size === 0) {
      this.newCaseData.fileUploadError = 'File is empty (0 bytes). Please upload a valid document.';
      App.showToast(this.newCaseData.fileUploadError, 'error');
      this.renderNewCaseModal();
      return;
    }
    if (file.size > MAX_SIZE) {
      this.newCaseData.fileUploadError = `File exceeds maximum limit of 25 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
      App.showToast(this.newCaseData.fileUploadError, 'error');
      this.renderNewCaseModal();
      return;
    }

    // 2. File extension check
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExts = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
    if (!allowedExts.includes(ext)) {
      this.newCaseData.fileUploadError = `Unsupported file format (.${ext}). Accepted formats: PDF, DOCX, JPG, PNG.`;
      App.showToast(this.newCaseData.fileUploadError, 'error');
      this.renderNewCaseModal();
      return;
    }

    // 3. Real file type verification (MIME & magic bytes)
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png'
    ];
    if (file.type && !validMimes.includes(file.type.toLowerCase())) {
      this.newCaseData.fileUploadError = `File MIME type "${file.type}" is unsupported.`;
      App.showToast(this.newCaseData.fileUploadError, 'error');
      this.renderNewCaseModal();
      return;
    }

    // Check header signature for PDF, DOCX, PNG, JPG via FileReader
    try {
      const headerBytes = await this.readFirstBytes(file, 4);
      if (ext === 'pdf' && headerBytes !== '%PDF') {
        this.newCaseData.fileUploadError = 'File has a .pdf extension but is damaged or not a valid PDF header.';
        App.showToast(this.newCaseData.fileUploadError, 'error');
        this.renderNewCaseModal();
        return;
      }
      if (ext === 'png' && !headerBytes.startsWith('\x89PNG') && !headerBytes.includes('PNG')) {
        this.newCaseData.fileUploadError = 'File has a .png extension but is damaged or not a valid PNG image.';
        App.showToast(this.newCaseData.fileUploadError, 'error');
        this.renderNewCaseModal();
        return;
      }
      if (ext === 'docx' && !headerBytes.startsWith('PK')) {
        this.newCaseData.fileUploadError = 'File has a .docx extension but is damaged or not a valid Word document.';
        App.showToast(this.newCaseData.fileUploadError, 'error');
        this.renderNewCaseModal();
        return;
      }
    } catch (e) {
      // Proceed gracefully
    }

    // Safe ID generation and file renaming
    const safeGeneratedId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cleanOrigName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeStoredFilename = `${safeGeneratedId}_${cleanOrigName}`;
    const mbSize = (file.size / (1024 * 1024)).toFixed(2);
    const estPages = ext === 'pdf' ? Math.max(1, Math.floor(file.size / 180000)) : 1;

    this.newCaseData.pdfFile = {
      name: file.name,
      storedFilename: safeStoredFilename,
      storagePath: `uploads/case-documents/${safeStoredFilename}`,
      size: `${mbSize} MB`,
      sizeBytes: file.size,
      pages: estPages,
      format: ext.toUpperCase(),
      rawFile: file,
      ocrStatus: ext === 'pdf' ? 'OCR Pending' : 'Metadata Only'
    };

    this.renderNewCaseModal();
    App.showToast(`Document "${file.name}" attached successfully (${mbSize} MB).`, 'success');
  },

  readFirstBytes(file, count) {
    return new Promise((resolve) => {
      const slice = file.slice(0, count);
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const arr = new Uint8Array(reader.result);
          let str = '';
          for (let i = 0; i < arr.length; i++) {
            str += String.fromCharCode(arr[i]);
          }
          resolve(str);
        } catch (e) {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsArrayBuffer(slice);
    });
  },

  removeCasePdf() {
    this.newCaseData.pdfFile = null;
    this.newCaseData.fileUploadError = null;
    this.renderNewCaseModal();
  },

  openRegisterClientFromCase() {
    this.syncNewCaseFormData();
    ClientsView.openNewClientModal((newClient) => {
      this.newCaseData.client = newClient.name;
      this.newCaseData.clientId = newClient.id;
      this.renderNewCaseModal();
      App.showToast(`Client "${newClient.name}" registered and linked to case.`, 'success');
    });
  },

  validateFieldRealtime(fieldName) {
    this.syncNewCaseFormData();
    const d = this.newCaseData;
    const today = new Date().toISOString().substring(0, 10);
    const errors = this.validateStep(this.newCaseStep);

    const markField = (inputElId, errElId, fieldKey) => {
      const inputEl = document.getElementById(inputElId);
      const errEl = document.getElementById(errElId);
      if (!inputEl || !errEl) return;

      const fieldErr = errors.find(e => e.field === inputElId);
      if (fieldErr) {
        inputEl.classList.add('is-invalid');
        errEl.textContent = fieldErr.msg;
        errEl.classList.add('visible');
      } else {
        inputEl.classList.remove('is-invalid');
        errEl.classList.remove('visible');
      }
    };

    if (this.newCaseStep === 1) {
      if (fieldName === 'title' || !fieldName) markField('new-case-title', 'err-title');
      if (fieldName === 'caseno' || !fieldName) markField('new-case-number', 'err-caseno');
      if (fieldName === 'court' || !fieldName) markField('new-case-court', 'err-court');
      if (fieldName === 'date' || !fieldName) markField('new-case-decision-date', 'err-decision-date');
      if (fieldName === 'citation' || !fieldName) markField('new-case-citation', 'err-citation');
    } else if (this.newCaseStep === 2) {
      if (fieldName === 'p1name' || !fieldName) markField('new-case-p1-name', 'err-p1-name');
      if (fieldName === 'p1role' || !fieldName) markField('new-case-p1-role', 'err-p1-role');
      if (fieldName === 'p2name' || !fieldName) markField('new-case-p2-name', 'err-p2-name');
      if (fieldName === 'p2role' || !fieldName) markField('new-case-p2-role', 'err-p2-role');
      if (fieldName === 'client' || !fieldName) markField('new-case-client', 'err-client');
    }

    const banner = document.getElementById(`step${this.newCaseStep}-validation-alert`);
    if (banner) {
      if (errors.length === 0) {
        banner.style.display = 'none';
      } else {
        banner.innerHTML = `⚠️ <span>Please correct the highlighted fields before proceeding: <strong>${this.escapeHtml(errors[0].msg)}</strong></span>`;
      }
    }
  },

  validateStep(stepNum) {
    this.syncNewCaseFormData();
    const d = this.newCaseData;
    const errors = [];
    const today = new Date().toISOString().substring(0, 10);

    if (stepNum === 1) {
      // 1. Case Title: 5–200 characters; letters, numbers, spaces and normal punctuation only
      const title = (d.title || '').trim();
      const titlePattern = /^[a-zA-Z0-9\s.,'"`:;()\-–—?!]+$/;
      if (!title) {
        errors.push({ field: 'new-case-title', errId: 'err-title', msg: 'Case Title is required.' });
      } else if (title.length < 5 || title.length > 200) {
        errors.push({ field: 'new-case-title', errId: 'err-title', msg: 'Case Title must be between 5 and 200 characters.' });
      } else if (!titlePattern.test(title) || !/[a-zA-Z0-9]/.test(title)) {
        errors.push({ field: 'new-case-title', errId: 'err-title', msg: 'Case Title may only contain letters, numbers, spaces, and normal punctuation.' });
      } else if (!title.includes(' ') && !title.includes('.')) {
        errors.push({ field: 'new-case-title', errId: 'err-title', msg: 'Case Title must contain a full caption with multiple words (e.g. "Kilombero Sugar v Mara Logistics").' });
      } else if (!/[aeiouAEIOU]/.test(title)) {
        errors.push({ field: 'new-case-title', errId: 'err-title', msg: 'Case Title must contain valid legal party names (cannot be random consonants).' });
      } else if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/.test(title.replace(/[\s.,'"`:;()\-–—?!]/g, ''))) {
        errors.push({ field: 'new-case-title', errId: 'err-title', msg: 'Case Title cannot contain random keyboard mash strings.' });
      }

      // 2. Case Number: Required; must be unique & follow formal docket format
      const caseNumber = (d.caseNumber || '').trim();
      if (!caseNumber) {
        errors.push({ field: 'new-case-number', errId: 'err-caseno', msg: 'Case Number is required.' });
      } else if (caseNumber.length < 4) {
        errors.push({ field: 'new-case-number', errId: 'err-caseno', msg: 'Case Number must be at least 4 characters long.' });
      } else if (!/\d/.test(caseNumber)) {
        errors.push({ field: 'new-case-number', errId: 'err-caseno', msg: 'Case Number must contain official court docket digits or reference numbers (e.g. "CV/2026/0142" or "No. 69 of 2018").' });
      } else {
        const normNum = caseNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const duplicate = (SLCMS_STATE.cases || []).some(c => (c.caseNumber || c.officialCaseNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normNum);
        if (duplicate) {
          errors.push({ field: 'new-case-number', errId: 'err-caseno', msg: `Case Number "${caseNumber}" already exists in the system. Case numbers must be unique.` });
        }
      }

      // 3. Case Type: Select: Civil, Criminal, Land, Matrimonial, Probate, Commercial or Other
      const allowedTypes = ['Civil', 'Criminal', 'Land', 'Matrimonial', 'Probate', 'Commercial', 'Other'];
      if (!d.caseType || !allowedTypes.includes(d.caseType)) {
        errors.push({ field: 'new-case-type', errId: 'err-type', msg: 'Please select a valid Case Type.' });
      }

      // 4. Court: Required
      if (!d.court || !d.court.trim()) {
        errors.push({ field: 'new-case-court', errId: 'err-court', msg: 'Court is required.' });
      }

      // 5. Decision Date: Cannot be a future date for a decided judgment
      if (d.decisionDate && d.decisionDate.trim()) {
        if (d.decisionDate > today) {
          errors.push({ field: 'new-case-decision-date', errId: 'err-decision-date', msg: 'Decision Date cannot be a future date for a decided judgment.' });
        }
      }

      // 6. Citation: Optional; must be unique when provided
      if (d.citation && d.citation.trim()) {
        const normCit = d.citation.toLowerCase().replace(/[^a-z0-9]/g, '');
        const duplicateCit = (SLCMS_STATE.cases || []).some(c => c.citation && c.citation.toLowerCase().replace(/[^a-z0-9]/g, '') === normCit);
        if (duplicateCit) {
          errors.push({ field: 'new-case-citation', errId: 'err-citation', msg: `Citation "${d.citation}" is already registered on another matter. Citations must be unique when provided.` });
        }
      }
    }

    if (stepNum === 2) {
      const isValidPartyName = (name) => {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 150) return false;
        if (!/^[a-zA-Z\s.'’\-]+$/.test(trimmed)) return false;
        if (!/[a-zA-Z]/.test(trimmed)) return false; // Reject names made only of numbers or symbols
        // Must contain vowels or recognized corporate suffix
        if (!/[aeiouAEIOU]/.test(trimmed) && !/(ltd|plc|co|inc|corp|bank|rep)/i.test(trimmed)) return false;
        // Reject 5 or more consecutive consonants (unpronounceable keyboard mashing)
        if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/.test(trimmed)) return false;
        return true;
      };

      // 1. First Party Name & Role
      const p1Name = (d.firstParty?.name || '').trim();
      if (!p1Name) {
        errors.push({ field: 'new-case-p1-name', errId: 'err-p1-name', msg: 'First party name is required.' });
      } else if (!isValidPartyName(p1Name)) {
        errors.push({ field: 'new-case-p1-name', errId: 'err-p1-name', msg: 'First party name must be a valid personal or entity name (2–150 letters, spaces, hyphens, dots; cannot be numbers or random consonants).' });
      }

      if (!d.firstParty?.role || !d.firstParty.role.trim()) {
        errors.push({ field: 'new-case-p1-role', errId: 'err-p1-role', msg: 'First party role is required.' });
      }

      // 2. Second Party Name & Role
      const p2Name = (d.secondParty?.name || '').trim();
      if (!p2Name) {
        errors.push({ field: 'new-case-p2-name', errId: 'err-p2-name', msg: 'Second party name is required.' });
      } else if (!isValidPartyName(p2Name)) {
        errors.push({ field: 'new-case-p2-name', errId: 'err-p2-name', msg: 'Second party name must be a valid personal or entity name (2–150 letters, spaces, hyphens, dots; cannot be numbers or random consonants).' });
      }

      if (!d.secondParty?.role || !d.secondParty.role.trim()) {
        errors.push({ field: 'new-case-p2-role', errId: 'err-p2-role', msg: 'Second party role is required.' });
      }

      // First and second parties cannot have identical names and roles
      if (p1Name && p2Name && p1Name.toLowerCase() === p2Name.toLowerCase() &&
          d.firstParty?.role?.toLowerCase() === d.secondParty?.role?.toLowerCase()) {
        errors.push({ field: 'new-case-p2-name', errId: 'err-p2-name', msg: 'First and second parties cannot have identical names and roles.' });
      }

      // Selected roles must fit the case:
      // appeal: Appellant and Respondent;
      // criminal trial: Republic and Accused;
      // civil trial: Plaintiff and Defendant;
      // application: Applicant and Respondent.
      const validRoles = this.getRolesForCaseType(d.caseType, d.title, d.caseNumber);
      if (d.firstParty?.role && !validRoles.includes(d.firstParty.role)) {
        errors.push({ field: 'new-case-p1-role', errId: 'err-p1-role', msg: `Selected role "${d.firstParty.role}" does not fit a ${d.caseType} matter.` });
      }
      if (d.secondParty?.role && !validRoles.includes(d.secondParty.role)) {
        errors.push({ field: 'new-case-p2-role', errId: 'err-p2-role', msg: `Selected role "${d.secondParty.role}" does not fit a ${d.caseType} matter.` });
      }

      // 3. Related Client: Must exist in Clients table
      const clientName = (d.client || '').trim();
      const existingClient = (SLCMS_STATE.clients || []).find(c => (c.name && c.name.toLowerCase() === clientName.toLowerCase()) || c.id === d.clientId);
      if (!clientName || !existingClient) {
        errors.push({ field: 'new-case-client', errId: 'err-client', msg: 'The related client must exist in the Clients table.' });
      }

      // Additional Parties validation
      if (Array.isArray(d.additionalParties)) {
        d.additionalParties.forEach((ap, idx) => {
          const apName = (ap.name || '').trim();
          if (apName && !isValidPartyName(apName)) {
            errors.push({ field: `new-case-add-p-${idx}`, errId: `err-add-p-${idx}`, msg: `Additional party #${idx + 3} has an invalid name format.` });
          }
        });
      }
    }

    return errors;
  },

  validateNewCase() {
    const errs1 = this.validateStep(1);
    if (errs1.length > 0) return { step: 1, errors: errs1 };
    const errs2 = this.validateStep(2);
    if (errs2.length > 0) return { step: 2, errors: errs2 };
    return { step: 0, errors: [] };
  },

  saveNewCaseDraft() {
    this.syncNewCaseFormData();
    try {
      localStorage.setItem('slcms_case_draft', JSON.stringify(this.newCaseData));
    } catch(e) {}
    App.closeModal();
    App.showToast('Case details saved as draft.', 'info');
  },

  registerNewCase() {
    const validation = this.validateNewCase();
    if (validation.errors.length > 0) {
      this.newCaseStep = validation.step;
      this.renderNewCaseModal();
      const firstErr = validation.errors[0];
      setTimeout(() => {
        validation.errors.forEach(err => {
          const el = document.getElementById(err.field);
          if (el) el.classList.add('is-invalid');
          const errLabel = document.getElementById(err.errId);
          if (errLabel) {
            errLabel.textContent = err.msg;
            errLabel.classList.add('visible');
          }
        });
        const banner = document.getElementById(`step${validation.step}-validation-alert`);
        if (banner) {
          banner.innerHTML = `⚠️ <span>Please correct the highlighted fields before registering: <strong>${this.escapeHtml(firstErr.msg)}</strong></span>`;
          banner.style.display = 'flex';
        }
        const el = document.getElementById(firstErr.field);
        if (el) el.focus();
      }, 60);
      App.showToast(firstErr.msg, 'error');
      return;
    }

    const d = this.newCaseData;
    const nowIso = new Date().toISOString();
    const newId = 'case-' + Date.now();
    const currentUserName = SLCMS_STATE.currentUser?.name || 'Administrator';

    // Automatic System Values per specification:
    // Case status: Open, Assignment status: Unassigned, Created by: Logged-in user, Created at: Current server time
    const newCase = {
      id: newId,
      caseNumber: d.caseNumber.trim(),
      title: d.title.trim(),
      caseTitle: d.title.trim(),
      caseType: d.caseType,
      type: d.caseType,
      year: d.year || new Date().getFullYear().toString(),
      decisionYear: d.year || new Date().getFullYear().toString(),
      decisionDate: d.decisionDate ? d.decisionDate.trim() : '',
      citation: d.citation ? d.citation.trim() : '',
      parties: [
        { name: d.firstParty.name.trim(), role: d.firstParty.role },
        { name: d.secondParty.name.trim(), role: d.secondParty.role },
        ...((d.additionalParties || []).filter(p => p.name && p.name.trim()).map(p => ({ name: p.name.trim(), role: p.role })))
      ],
      firstPartyName: d.firstParty.name.trim(),
      firstPartyRole: d.firstParty.role,
      secondPartyName: d.secondParty.name.trim(),
      secondPartyRole: d.secondParty.role,
      client: d.client.trim(),
      clientName: d.client.trim(),
      clientId: d.clientId || 'cli-001',
      opposingParty: `${d.secondParty.name.trim()} (${d.secondParty.role})`,
      court: d.court.trim(),
      registry: 'Main Registry',
      presidingOfficer: '',
      originCourt: '',
      originCaseNo: '',
      subject: '',
      outcome: 'Pending',
      finalOrder: '',
      priority: d.priority || 'Medium',
      // Automatic System Values
      status: 'Open',
      statusLabel: 'Open',
      assignmentStatus: 'Unassigned',
      assignedCounsel: 'Unassigned',
      leadCounsel: 'Unassigned',
      lawyer: 'Unassigned',
      lawyerId: '',
      lawyerAvatar: 'UN',
      createdBy: currentUserName,
      createdAt: nowIso,
      openingDate: nowIso.substring(0, 10),
      expectedCompletion: '',
      progressPct: 0,
      totalBilled: 0,
      totalPaid: 0,
      notes: `Matter registered on ${new Date().toLocaleDateString('en-GB')}. Status: Open. Assignment: Unassigned.`,
      description: `${d.title.trim()} (${d.court.trim()})`,
      // Document Metadata & Safe Storage Path
      pdfDocument: d.pdfFile,
      pdfFilename: d.pdfFile ? d.pdfFile.name : '',
      storagePath: d.pdfFile ? d.pdfFile.storagePath : '',
      isScanned: d.pdfFile ? (d.pdfFile.format === 'PDF' && d.pdfFile.ocrStatus === 'OCR Pending') : false,
      ocrStatus: d.pdfFile ? (d.pdfFile.ocrStatus || 'Metadata Only') : 'None',
      aiStatus: d.pdfFile ? 'OCR Pending' : 'None',
      requiresAdminAttention: false
    };

    // Save and permanently persist
    SLCMS_STATE.addCase(newCase);
    App.closeModal();

    const successMsg = d.pdfFile
      ? `Case ${newCase.caseNumber} registered and document "${d.pdfFile.name}" attached.`
      : `Case ${newCase.caseNumber} registered successfully with status "Open".`;
    App.showToast(successMsg, 'success');
    App.refreshCurrentView();

    // Staff assignment prompt
    setTimeout(() => {
      CasesView.openAssignCaseModal(newCase.id);
    }, 450);
  },

  // Legacy alias for registerNewCase
  registerNewCaseAndProcessPdf() {
    this.registerNewCase();
  },

  renderNewCaseModal() {
    const d = this.newCaseData;
    const step = this.newCaseStep;
    const hasDoc = !!d.pdfFile;

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
            <p class="add-case-subtitle">Register a matter in 3 simple steps with verified client and party details.</p>
          </div>
        </div>
        <div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #CBD5E1; font-size: 1.25rem;">&times;</button>
        </div>
      </div>

      <!-- 3-Step Simple Progress Stepper -->
      <div class="add-case-progress-wrap" style="background: #FFFFFF; border-bottom: 1px solid var(--color-border); padding: 0.75rem 1.5rem;">
        <div class="add-case-stepper" style="display: flex; align-items: center; justify-content: center; gap: 1rem; width: 100%;">
          <button type="button" class="add-case-step-btn ${step === 1 ? 'active' : (step > 1 ? 'completed' : '')}" onclick="CasesView.goToNewCaseStep(1)">
            <span class="add-case-step-num">${step > 1 ? '&#10003;' : '1'}</span>
            <span class="step-label-full">1. Case Information</span>
          </button>
          <span class="add-case-step-arrow" style="color: var(--color-gold); font-size: 1.1rem;">&rarr;</span>
          <button type="button" class="add-case-step-btn ${step === 2 ? 'active' : (step > 2 ? 'completed' : '')}" onclick="CasesView.goToNewCaseStep(2)">
            <span class="add-case-step-num">${step > 2 ? '&#10003;' : '2'}</span>
            <span class="step-label-full">2. Parties &amp; Client</span>
          </button>
          <span class="add-case-step-arrow" style="color: var(--color-gold); font-size: 1.1rem;">&rarr;</span>
          <button type="button" class="add-case-step-btn ${step === 3 ? 'active' : ''}" onclick="CasesView.goToNewCaseStep(3)">
            <span class="add-case-step-num">3</span>
            <span class="step-label-full">3. Upload &amp; Register</span>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="add-case-body" style="padding: 1.25rem 1.5rem; overflow-y: auto; max-height: calc(88vh - 190px);">
        ${step === 1 ? this.getStep1HTML(d) : ''}
        ${step === 2 ? this.getStep2HTML(d) : ''}
        ${step === 3 ? this.getStep3HTML(d) : ''}
      </div>

      <!-- Modal Footer -->
      <div class="add-case-footer" style="padding: 1rem 1.5rem; background: #FFFFFF; border-top: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between;">
        ${step === 1 ? `
          <button type="button" class="btn-add-case-secondary" onclick="App.closeModal()">
            <span>Cancel</span>
          </button>
        ` : `
          <button type="button" class="btn-add-case-secondary" onclick="CasesView.goToNewCaseStep(${step - 1})">
            <span>&larr; Back</span>
          </button>
        `}

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button type="button" class="btn-add-case-secondary" onclick="CasesView.saveNewCaseDraft()">
            <span>Save as Draft</span>
          </button>

          ${step < 3 ? `
            <button type="button" class="btn-add-case-primary" onclick="CasesView.goToNewCaseStep(${step + 1})">
              <span>Next: ${step === 1 ? 'Parties &amp; Client' : 'Upload &amp; Register'} &rarr;</span>
            </button>
          ` : `
            <button type="button" class="btn-add-case-primary" onclick="CasesView.registerNewCase()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>${hasDoc ? 'Register Case &amp; Upload Document' : 'Register Case'}</span>
            </button>
          `}
        </div>
      </div>
    `, 'modal-add-case');
  },

  getStep1HTML(d) {
    const caseTypes = ['Civil', 'Criminal', 'Land', 'Matrimonial', 'Probate', 'Commercial', 'Other'];
    const today = new Date().toISOString().substring(0, 10);

    return `
      <div class="add-case-card" style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 10px; padding: 1.25rem;">
        <h3 style="margin: 0 0 1rem 0; font-size: 1.05rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
          <span>⚖️</span> Step 1: Case Information
        </h3>

        <!-- Step 1 Validation Alert Banner -->
        <div id="step1-validation-alert" class="add-case-step-err-banner" style="display:none;"></div>

        <!-- Case Title -->
        <div class="add-case-field" style="margin-bottom: 1rem;">
          <label class="add-case-label" for="new-case-title">
            <span>Case Title <span class="add-case-req">*</span></span>
            <span class="add-case-opt">5–200 characters; letters, numbers, spaces &amp; normal punctuation only</span>
          </label>
          <input type="text" id="new-case-title" class="add-case-input" 
                 placeholder="e.g. Kilombero Sugar Co. Ltd v Mara Logistics Ltd" 
                 maxlength="200"
                 value="${this.escapeHtml(d.title)}" 
                 oninput="CasesView.newCaseData.title = this.value; CasesView.validateFieldRealtime('title');"
                 onblur="CasesView.validateFieldRealtime('title');">
          <div class="add-case-err-msg" id="err-title">Case Title must be 5–200 characters (letters, numbers, spaces and normal punctuation only)</div>
        </div>

        <!-- Grid 1: Case Number & Case Type -->
        <div class="add-case-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div class="add-case-field">
            <label class="add-case-label" for="new-case-number">
              <span>Case Number <span class="add-case-req">*</span></span>
              <span class="add-case-opt">Required; must be unique</span>
            </label>
            <input type="text" id="new-case-number" class="add-case-input" 
                   placeholder="e.g. CV/2026/0142" 
                   value="${this.escapeHtml(d.caseNumber)}"
                   oninput="CasesView.newCaseData.caseNumber = this.value; CasesView.validateFieldRealtime('caseno');"
                   onblur="CasesView.validateFieldRealtime('caseno');">
            <div class="add-case-err-msg" id="err-caseno">Case Number is required and must be unique</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-type">
              <span>Case Type <span class="add-case-req">*</span></span>
            </label>
            <select id="new-case-type" class="add-case-select" 
                    onchange="CasesView.handleCaseTypeChanged(this.value)">
              ${caseTypes.map(t => `<option value="${t}" ${d.caseType === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Grid 2: Court, Decision Date, Citation -->
        <div class="add-case-grid-3" style="display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 1rem;">
          <div class="add-case-field">
            <label class="add-case-label" for="new-case-court">
              <span>Court <span class="add-case-req">*</span></span>
            </label>
            <input type="text" id="new-case-court" class="add-case-input" 
                   list="tz-court-list" 
                   placeholder="e.g. High Court of Tanzania (Commercial Division)" 
                   value="${this.escapeHtml(d.court)}"
                   oninput="CasesView.newCaseData.court = this.value; CasesView.validateFieldRealtime('court');"
                   onblur="CasesView.validateFieldRealtime('court');">
            <datalist id="tz-court-list">
              <option value="Court of Appeal of Tanzania">
              <option value="High Court of Tanzania">
              <option value="High Court of Tanzania (Commercial Division)">
              <option value="High Court of Tanzania (Land Division)">
              <option value="Resident Magistrate Court">
              <option value="District Court">
              <option value="Primary Court">
              <option value="Tax Appeals Tribunal of Tanzania">
            </datalist>
            <div class="add-case-err-msg" id="err-court">Court is required</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-decision-date">
              <span>Decision Date</span>
              <span class="add-case-opt">Decision Year: <strong>${d.year || new Date().getFullYear()}</strong></span>
            </label>
            <input type="date" id="new-case-decision-date" class="add-case-input" 
                   max="${today}"
                   value="${this.escapeHtml(d.decisionDate)}"
                   onchange="CasesView.handleDecisionDateChanged(this.value)">
            <div class="add-case-err-msg" id="err-decision-date">Decision Date cannot be a future date for a decided judgment</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-citation">
              <span>Citation <span class="add-case-opt">optional</span></span>
            </label>
            <input type="text" id="new-case-citation" class="add-case-input" 
                   placeholder="e.g. [2026] TZHC 0142" 
                   value="${this.escapeHtml(d.citation)}"
                   oninput="CasesView.newCaseData.citation = this.value; CasesView.validateFieldRealtime('citation');"
                   onblur="CasesView.validateFieldRealtime('citation');">
            <div class="add-case-err-msg" id="err-citation">Citation must be unique when provided</div>
          </div>
        </div>
      </div>
    `;
  },

  getStep2HTML(d) {
    const roles = this.getRolesForCaseType(d.caseType, d.title, d.caseNumber);
    const clients = SLCMS_STATE.clients || [];

    return `
      <div class="add-case-card" style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 10px; padding: 1.25rem;">
        <h3 style="margin: 0 0 1rem 0; font-size: 1.05rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
          <span>👥</span> Step 2: Parties and Client
        </h3>

        <!-- Step 2 Validation Alert Banner -->
        <div id="step2-validation-alert" class="add-case-step-err-banner" style="display:none;"></div>

        <!-- First Party -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 0.85rem;">
          <div style="font-size: 0.76rem; font-weight: 700; color: var(--color-gold); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
            First Party Name &amp; Role <span class="add-case-req">*</span>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.85rem;">
            <div class="add-case-field" style="margin-bottom: 0;">
              <label class="add-case-label" for="new-case-p1-name">First Party Name <span class="add-case-req">*</span></label>
              <input type="text" id="new-case-p1-name" class="add-case-input" 
                     placeholder="e.g. Kilombero Sugar Co. Ltd" 
                     maxlength="150"
                     value="${this.escapeHtml(d.firstParty.name)}"
                     oninput="CasesView.newCaseData.firstParty.name = this.value; CasesView.validateFieldRealtime('p1name');"
                     onblur="CasesView.validateFieldRealtime('p1name');">
              <div class="add-case-err-msg" id="err-p1-name">Name must be 2–150 chars (letters, spaces, dots, hyphens; no numbers only)</div>
            </div>
            <div class="add-case-field" style="margin-bottom: 0;">
              <label class="add-case-label" for="new-case-p1-role">Role <span class="add-case-req">*</span></label>
              <select id="new-case-p1-role" class="add-case-select" 
                      onchange="CasesView.newCaseData.firstParty.role = this.value; CasesView.validateFieldRealtime('p1role');">
                ${roles.map(r => `<option value="${r}" ${d.firstParty.role === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
              <div class="add-case-err-msg" id="err-p1-role">Role is required and must fit the case</div>
            </div>
          </div>
        </div>

        <!-- Second Party -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 0.85rem;">
          <div style="font-size: 0.76rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
            Second Party Name &amp; Role <span class="add-case-req">*</span>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.85rem;">
            <div class="add-case-field" style="margin-bottom: 0;">
              <label class="add-case-label" for="new-case-p2-name">Second Party Name <span class="add-case-req">*</span></label>
              <input type="text" id="new-case-p2-name" class="add-case-input" 
                     placeholder="e.g. Mara Logistics Ltd" 
                     maxlength="150"
                     value="${this.escapeHtml(d.secondParty.name)}"
                     oninput="CasesView.newCaseData.secondParty.name = this.value; CasesView.validateFieldRealtime('p2name');"
                     onblur="CasesView.validateFieldRealtime('p2name');">
              <div class="add-case-err-msg" id="err-p2-name">Name must be 2–150 chars (letters, spaces, dots, hyphens; no numbers only)</div>
            </div>
            <div class="add-case-field" style="margin-bottom: 0;">
              <label class="add-case-label" for="new-case-p2-role">Role <span class="add-case-req">*</span></label>
              <select id="new-case-p2-role" class="add-case-select" 
                      onchange="CasesView.newCaseData.secondParty.role = this.value; CasesView.validateFieldRealtime('p2role');">
                ${roles.map(r => `<option value="${r}" ${d.secondParty.role === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
              <div class="add-case-err-msg" id="err-p2-role">Role is required and must fit the case</div>
            </div>
          </div>
        </div>

        <!-- Additional Parties List -->
        ${(d.additionalParties || []).map((ap, idx) => `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: flex-end; gap: 0.75rem;">
            <div style="flex: 2;">
              <label class="add-case-label" for="new-case-add-p-${idx}">Additional Party #${idx + 3} Name</label>
              <input type="text" id="new-case-add-p-${idx}" class="add-case-input" 
                     placeholder="e.g. Attorney General" 
                     value="${this.escapeHtml(ap.name)}"
                     oninput="CasesView.newCaseData.additionalParties[${idx}].name = this.value;">
              <div class="add-case-err-msg" id="err-add-p-${idx}">Invalid name format</div>
            </div>
            <div style="flex: 1;">
              <label class="add-case-label" for="new-case-add-r-${idx}">Role</label>
              <select id="new-case-add-r-${idx}" class="add-case-select" 
                      onchange="CasesView.newCaseData.additionalParties[${idx}].role = this.value;">
                ${roles.map(r => `<option value="${r}" ${ap.role === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div>
              <button type="button" class="btn btn-ghost btn-sm text-danger" style="height: 38px; padding: 0 10px;" onclick="CasesView.removeParty(${idx})" title="Remove Party">&times;</button>
            </div>
          </div>
        `).join('')}

        <!-- Add Another Party button -->
        <div style="margin-bottom: 1.25rem;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="CasesView.addAnotherParty()">
            <span>+ Add Another Party</span>
          </button>
        </div>

        <!-- Related Client & Priority -->
        <div class="add-case-grid-2" style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
          <div class="add-case-field">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
              <label class="add-case-label" for="new-case-client" style="margin-bottom: 0;">
                Related Client <span class="add-case-req">*</span>
              </label>
              <button type="button" class="btn btn-ghost btn-xs text-gold" style="font-size: 0.72rem; padding: 2px 6px;" onclick="CasesView.openRegisterClientFromCase()">
                + Quick Register Client
              </button>
            </div>
            <select id="new-case-client" class="add-case-select" 
                    onchange="CasesView.syncNewCaseFormData(); document.getElementById('err-client')?.classList.remove('visible');">
              <option value="">-- Select Client from Clients Table --</option>
              ${clients.map(c => `<option value="${c.name}" ${d.client === c.name ? 'selected' : ''}>${c.name} (${c.type || 'Client'})</option>`).join('')}
            </select>
            <div class="add-case-err-msg" id="err-client">The related client must exist in the Clients table</div>
          </div>

          <div class="add-case-field">
            <label class="add-case-label" for="new-case-priority">
              <span>Priority <span class="add-case-req">*</span></span>
            </label>
            <select id="new-case-priority" class="add-case-select" 
                    onchange="CasesView.newCaseData.priority = this.value;">
              <option value="Low" ${d.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Medium" ${d.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="High" ${d.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Urgent" ${d.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
        </div>
      </div>
    `;
  },

  getStep3HTML(d) {
    const pdf = d.pdfFile;
    const hasDoc = !!pdf;

    return `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Upload Box -->
        <div class="add-case-card" style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 10px; padding: 1.25rem;">
          <h3 style="margin: 0 0 0.85rem 0; font-size: 1.05rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; justify-content: space-between;">
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              <span>📄</span> Upload PDF or Scanned Judgment (Optional)
            </span>
            <span class="badge ${hasDoc ? 'badge-active' : 'badge-neutral'}" style="font-size: 0.72rem;">
              ${hasDoc ? 'Document Attached' : 'Optional'}
            </span>
          </h3>

          <div class="case-upload-box" id="case-file-dropzone" 
               style="border: 2px dashed #CBD5E1; border-radius: 10px; padding: 1.5rem 1rem; text-align: center; cursor: pointer; transition: all 0.2s ease; background: #F8FAFC;"
               onclick="document.getElementById('case-file-input').click()"
               ondragover="event.preventDefault(); this.style.borderColor='var(--color-gold)';"
               ondragleave="this.style.borderColor='#CBD5E1';"
               ondrop="event.preventDefault(); this.style.borderColor='#CBD5E1'; CasesView.handleCaseFileDrop(event);">
            <div style="font-size: 2.2rem; color: #64748B; margin-bottom: 0.5rem;">📁</div>
            <h4 style="margin: 0 0 0.25rem 0; font-size: 0.96rem; font-weight: 700; color: var(--color-primary);">Click or Drag Document Here</h4>
            <p style="margin: 0 0 0.65rem 0; font-size: 0.82rem; color: #64748B;">
              Accepts PDF, DOCX, JPG, and PNG (Maximum 25 MB).
            </p>
            <button type="button" class="btn btn-secondary btn-sm" style="pointer-events: none;">
              Choose File
            </button>
          </div>
          <input type="file" id="case-file-input" style="display:none;" accept=".pdf,.docx,.jpg,.jpeg,.png" onchange="CasesView.handleCaseFileUpload(event)">

          ${d.fileUploadError ? `
            <div style="color: #DC2626; font-size: 0.82rem; margin-top: 0.5rem; font-weight: 600;">
              ⚠️ ${this.escapeHtml(d.fileUploadError)}
            </div>
          ` : ''}

          <!-- File preview card if attached -->
          ${hasDoc ? `
            <div style="margin-top: 1rem; padding: 0.85rem 1rem; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">📄</span>
                <div>
                  <div style="font-weight: 700; color: #166534; font-size: 0.88rem;">${this.escapeHtml(pdf.name)}</div>
                  <div style="font-size: 0.75rem; color: #4B5563;">
                    <span>Size: <strong>${pdf.size}</strong></span> &bull; 
                    <span>Type: <strong>${pdf.format}</strong></span> &bull; 
                    <span class="badge badge-success" style="font-size: 0.68rem;">${pdf.ocrStatus}</span>
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-ghost btn-sm text-danger" onclick="CasesView.removeCasePdf()">
                Remove
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Final Case Summary Card -->
        <div class="add-case-card" style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 10px; padding: 1.25rem;">
          <h4 style="margin: 0 0 0.85rem 0; font-size: 0.95rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.04em;">
            Final Case Summary
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.84rem;">
            <div>
              <span style="color: #64748B;">Case Title:</span>
              <div style="font-weight: 700; color: var(--color-primary);">${this.escapeHtml(d.title || 'Untitled Case')}</div>
            </div>
            <div>
              <span style="color: #64748B;">Case Number:</span>
              <div style="font-family: var(--font-mono); font-weight: 700; color: var(--color-gold);">${this.escapeHtml(d.caseNumber || 'Not provided')}</div>
            </div>
            <div>
              <span style="color: #64748B;">Case Type &amp; Court:</span>
              <div style="font-weight: 600;">${this.escapeHtml(d.caseType)} &bull; ${this.escapeHtml(d.court)}</div>
            </div>
            <div>
              <span style="color: #64748B;">Parties:</span>
              <div style="font-weight: 600;">
                ${this.escapeHtml(d.firstParty.name || 'First Party')} (${this.escapeHtml(d.firstParty.role)}) v ${this.escapeHtml(d.secondParty.name || 'Second Party')} (${this.escapeHtml(d.secondParty.role)})
              </div>
            </div>
            <div>
              <span style="color: #64748B;">Related Client:</span>
              <div style="font-weight: 700; color: var(--color-primary);">${this.escapeHtml(d.client || 'None')}</div>
            </div>
            <div>
              <span style="color: #64748B;">Priority &amp; Status:</span>
              <div>
                <span class="badge badge-priority-${(d.priority || 'medium').toLowerCase()}">${d.priority || 'Medium'} Priority</span>
                <span class="badge badge-active" style="margin-left: 4px;">Status: Open</span>
                <span class="badge badge-pending" style="margin-left: 4px;">Unassigned</span>
              </div>
            </div>
            ${d.decisionDate ? `
              <div>
                <span style="color: #64748B;">Decision Date:</span>
                <div>${this.escapeHtml(d.decisionDate)} (Year: ${d.year})</div>
              </div>
            ` : ''}
            ${d.citation ? `
              <div>
                <span style="color: #64748B;">Citation:</span>
                <div>${this.escapeHtml(d.citation)}</div>
              </div>
            ` : ''}
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
    const rawCase = (Array.isArray(SLCMS_STATE.cases) ? SLCMS_STATE.cases : []).find(item => item && item.id === caseId) || SLCMS_STATE.cases?.[0] || {};
    const c = this.normalizeCase(rawCase);
    const currentUser = SLCMS_STATE.currentUser || {};
    const role = currentUser.role || '';

    // Step 11 Access Control:
    // Only the assigned Lawyer, supervising Senior Lawyer and authorized support staff should access the case.
    const isSupervisingSenior = (role === 'Senior Lawyer' || role === 'Administrator');
    const isAssignedLawyer = (role === 'Lawyer' && (
      (c.lawyer && currentUser.name && c.lawyer.toLowerCase().includes(currentUser.name.toLowerCase())) ||
      (c.assignedLawyerId && String(c.assignedLawyerId) === String(currentUser.id)) ||
      (c.leadCounselId && String(c.leadCounselId) === String(currentUser.id)) ||
      (currentUser.assignedCaseIds && currentUser.assignedCaseIds.includes(caseId))
    ));
    const isAuthorizedSupportStaff = (role === 'Legal Clerk' || role === 'Paralegal' || role === 'Registrar' || role === 'Legal Officer');
    const isClientOwner = (role === 'Client' && (String(currentUser.id) === String(c.clientId) || (currentUser.email && c.clientEmail && currentUser.email.toLowerCase() === c.clientEmail.toLowerCase())));

    if (role === 'Lawyer' && !isAssignedLawyer) {
      App.showAccessRestrictedModal('Matter Dossier Restricted', 'You are not assigned to this case. Per firm protocol, only the assigned Lawyer, supervising Senior Lawyer, and authorized support staff can access this case.');
      return;
    }

    if (!isSupervisingSenior && !isAssignedLawyer && !isAuthorizedSupportStaff && !isClientOwner) {
      App.showAccessRestrictedModal('Matter Dossier Restricted', 'Access restricted under firm ethical wall protocol.');
      return;
    }

    this.activeCaseId = caseId;
    this.activeCaseTab = 'overview';
    const statusClass = this.normalizeText(c.status).replace(/\s+/g, '');
    const priorityClass = this.normalizeText(c.priority);

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <div class="flex items-center gap-2" style="margin-bottom: 0.35rem;">
            <span style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--color-gold);">
              ${c.caseNumber}
            </span>
            <span class="badge badge-${statusClass}">${c.status}</span>
            <span class="badge badge-priority-${priorityClass}">${c.priority} Priority</span>
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
        <button class="tab-btn ${this.activeCaseTab === 'documents' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('documents')">2. Documents (${(Array.isArray(SLCMS_STATE.documents) ? SLCMS_STATE.documents : []).filter(d => d && d.caseId === c.id).length})</button>
        <button class="tab-btn ${this.activeCaseTab === 'tasks' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('tasks')">3. Tasks &amp; Deadlines (${(Array.isArray(SLCMS_STATE.tasks) ? SLCMS_STATE.tasks : []).filter(t => t && t.caseId === c.id).length})</button>
        <button class="tab-btn ${this.activeCaseTab === 'legal-research' ? 'active' : ''}" onclick="CasesView.switchCaseDetailTab('legal-research')">4. Legal Research</button>
      </div>

      <div class="modal-body" id="case-tab-content-body" style="padding: 1.5rem;">
        ${this.renderCaseTabContent(c, this.activeCaseTab)}
      </div>

      <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div class="flex items-center gap-2 flex-wrap">
          <button class="btn btn-secondary btn-sm" onclick="CasesView.openEditCaseModal('${c.id}')">✏️ Edit Case</button>
          ${isSupervisingSenior ? `
            <button class="btn btn-secondary btn-sm" onclick="CasesView.openAssignLawyerModal('${c.id}')">👤 Assign Lawyer</button>
          ` : ''}
          <button class="btn btn-gold btn-sm" onclick="CasesView.openCaseChat('${c.id}')" title="Open privileged attorney-client chat">💬 Privileged Case Chat</button>
          <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); AIAssistantView.openForCase('${c.id}')">✦ Document Generator</button>
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
    const rawCase = (Array.isArray(SLCMS_STATE.cases) ? SLCMS_STATE.cases : []).find(item => item && item.id === this.activeCaseId) || {};
    const c = this.normalizeCase(rawCase);
    const body = document.getElementById('case-tab-content-body');
    if (body && c) {
      body.innerHTML = this.renderCaseTabContent(c, tabName);
      const tabBtns = document.querySelectorAll('.tabs-nav .tab-btn');
      tabBtns.forEach(btn => {
        if (String(btn?.innerText ?? '').toLowerCase().includes(String(tabName || '').replace('-', ' '))) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  },

  renderCaseTabContent(c, tab) {
    const isLawyer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })();

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

              <!-- Step 11: Invoice & Payment Confirmation Card -->
              <div class="card" style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 1.15rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                  <h4 style="color: var(--color-primary); margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span>🧾</span> Invoice &amp; Payment Confirmation
                  </h4>
                  <span class="badge" style="background: #D1FAE5; color: #065F46; font-weight: 700; border: 1px solid #A7F3D0; font-size: 0.74rem;">
                    ● PAID &bull; VERIFIED
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-3" style="font-size: 0.84rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
                  <div>Invoice Ref: <strong style="font-family: monospace; color: #0284C7;">${c.invoiceNumber || 'SLCMS-2026-000124'}</strong></div>
                  <div>Amount Paid: <strong style="color: #047857;">TZS ${(c.amountPaid || 150000).toLocaleString()}</strong></div>
                  <div>Payment Reference: <strong style="font-family: monospace; color: #334155;">${c.paymentReference || 'CRDB-2026-VERIFIED'}</strong></div>
                  <div>Audit Status: <strong style="color: #10B981;">Confirmed by Legal Officer</strong></div>
                </div>
              </div>

              <!-- Step 11: Assignment Instructions & Directive Card -->
              <div class="card" style="background: #FFFBEB; border: 1px solid #FCD34D; padding: 1.15rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <h4 style="color: #92400E; margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span>⚖️</span> Senior Counsel Assignment Directives
                  </h4>
                  <span class="badge" style="background: #FEF3C7; color: #92400E; font-weight: 700; font-size: 0.74rem;">
                    ${c.responsibility || 'Lead Counsel & Trial Strategist'}
                  </span>
                </div>
                <p style="font-size: 0.88rem; color: #78350F; line-height: 1.5; margin: 0 0 0.5rem 0;">
                  ${this.escapeHtml(c.internalInstructions || 'Review case pleadings, examine client evidence documents, and establish trial strategy within statutory deadlines.')}
                </p>
                <div style="font-size: 0.76rem; color: #B45309;">
                  Assigned Date: <strong>${c.assignmentDate || c.openingDate || '2026-09-27'}</strong> &bull; Supervised by: <strong>Senior Counsel Chambers</strong>
                </div>
              </div>

              <!-- Case Quick Actions Bar (Strict: Legal Officer must NOT see Assign Lawyer) -->
              <div class="card" style="background: var(--color-surface-subtle); padding: 1rem;">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem;">
                  Quick Matter Management
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <button class="btn btn-secondary btn-sm" onclick="CasesView.openEditCaseModal('${c.id}')">✏️ Edit Case</button>
                  ${(SLCMS_STATE.currentUser?.role === 'Senior Lawyer' || SLCMS_STATE.currentUser?.role === 'Administrator') ? `
                    <button class="btn btn-secondary btn-sm" onclick="CasesView.openAssignLawyerModal('${c.id}')">👤 Reassign Lawyer</button>
                  ` : ''}
                  <button class="btn btn-gold btn-sm" onclick="CasesView.openCaseChat('${c.id}')" title="Open privileged attorney-client chat">💬 Privileged Case Chat</button>
                  <button class="btn btn-secondary btn-sm" onclick="CasesView.quickAddDocument('${c.id}')">📄 Upload Document</button>
                  ${isLawyer ? '' : `<button class="btn btn-secondary btn-sm" onclick="CasesView.quickAddTask('${c.id}')">⏱️ Add Task</button>`}
                  <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); AIAssistantView.openForCase('${c.id}')">✦ Document Generator</button>
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
                    <span class="badge badge-${this.normalizeText(c.status).replace(/\s+/g, '')}">${c.status}</span>
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
                  ${(SLCMS_STATE.currentUser?.role === 'Senior Lawyer' || SLCMS_STATE.currentUser?.role === 'Administrator') ? `
                    <button class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 0;" onclick="CasesView.openAssignLawyerModal('${c.id}')">Change</button>
                  ` : ''}
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
              ${isLawyer ? '' : `
              <button class="btn btn-gold btn-sm" onclick="CasesView.quickAddTask('${c.id}')">+ Create Task</button>
              `}
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
                        <span class="badge badge-priority-${this.normalizeText(t.priority)}">${t.priority || 'Medium'}</span>
                        <span class="badge badge-${this.normalizeText(t.status) === 'completed' ? 'active' : 'pending'}">${t.status || 'Pending'}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="card empty-state" style="padding: 2.5rem; text-align: center;">
                <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">No pending tasks or deadlines recorded for this matter.</p>
                ${isLawyer ? '' : `
                <button class="btn btn-gold btn-sm" onclick="CasesView.quickAddTask('${c.id}')">+ Create First Task</button>
                `}
              </div>
            `}
          </div>
        `;

      case 'legal-research':
        const savedPrecedents = Array.isArray(c.linkedPrecedents) ? c.linkedPrecedents : [];
        const caseCategory = this.normalizeText(c.caseType || c.category || 'Commercial');
        const matchingJudgments = (Array.isArray(SLCMS_STATE.tanzaniaJudgments) ? SLCMS_STATE.tanzaniaJudgments : []).filter(j => {
          if (!j || !j.category) return false;
          const jCat = this.normalizeText(j.category);
          const jTitle = this.normalizeText(j.title);
          return jCat.includes(caseCategory) ||
                 caseCategory.includes(jCat) ||
                 jTitle.includes('bank') ||
                 (j.year && j.year >= 2024);
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

  /* ==========================================================================
     STEP 10 & 11: AUTHORIZED ROLE ASSIGNS LAWYER (Senior Lawyer / Administrator)
     Validation:
     - invoice.status = PAID
     - payment.status = VERIFIED
     - case.status = ACTIVE_AWAITING_ASSIGNMENT
     - lawyer.account_status = ACTIVE
     Otherwise, assignment must be blocked.
     Status changes to: ASSIGNED, IN_PROGRESS
     ========================================================================== */
  openAssignLawyerModal(caseId) {
    const role = SLCMS_STATE.currentUser?.role || '';
    if (role !== 'Senior Lawyer' && role !== 'Administrator' && role !== 'Legal Officer') {
      App.showAccessRestrictedModal('Case Assignment Restricted', 'The Legal Officer and unauthorized roles cannot assign lawyers. Lawyer assignment belongs exclusively to Senior Lawyers.');
      return;
    }

    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) {
      App.showToast('Case record not found.', 'error');
      return;
    }

    // Check associated invoice & payment status
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    const inv = invoices.find(i => i.caseId === c.id || i.requestId === c.requestId || (i.clientName && c.client && i.clientName.toLowerCase() === c.client.toLowerCase())) || {};

    const isInvoicePaid = (inv.status === 'PAID' || inv.status === 'DEMO_PAID' || c.invoiceStatus === 'PAID');
    const isPaymentVerified = (inv.paymentStatus === 'VERIFIED' || c.paymentStatus === 'VERIFIED');
    const isCaseAwaiting = (c.status === 'ACTIVE_AWAITING_ASSIGNMENT' || (c.statusLabel && c.statusLabel.includes('AWAITING ASSIGNMENT')) || c.status === 'READY_FOR_ASSIGNMENT');

    // Retrieve active lawyers only
    const allUsers = SLCMS_STATE.users || [];
    const activeLawyers = allUsers.filter(u => {
      const isLawyerRole = (u.role === 'Senior Lawyer' || u.role === 'Lawyer');
      const isActive = (u.accountStatus || u.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
      return isLawyerRole && isActive;
    });

    const todayStr = new Date().toISOString().split('T')[0];

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="font-size: 0.74rem; color: #F59E0B; font-weight: 700; text-transform: uppercase;">
            Step 10: Authorized Role Assigns Lawyer (Senior Counsel Suite)
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.15rem; margin-top: 2px;">
            Assign Lead Counsel — ${c.caseNumber || c.id}
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        
        <!-- Case Eligibility Verification Banner -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #64748B;">Active Case Matter</div>
              <h4 style="margin: 0; color: #0F172A; font-size: 1.05rem; font-weight: 700;">${this.escapeHtml(c.title || c.caseTitle)}</h4>
              <div style="font-size: 0.82rem; color: #64748B; margin-top: 2px;">Client: <strong style="color: #1E293B;">${this.escapeHtml(c.client || c.clientName)}</strong> &bull; Category: ${this.escapeHtml(c.caseType || 'Civil')}</div>
            </div>
            <span style="font-family: monospace; font-size: 0.82rem; font-weight: 700; color: #0284C7; background: #EFF6FF; padding: 2px 8px; border-radius: 6px;">
              ${c.caseNumber}
            </span>
          </div>

          <!-- Step 10 Pre-conditions Status Indicators -->
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.78rem; font-weight: 700;">
            <span style="padding: 3px 8px; border-radius: 9999px; ${isInvoicePaid ? 'background:#ECFDF5; color:#059669;' : 'background:#FEF2F2; color:#DC2626;'}">
              ${isInvoicePaid ? '✓' : '✕'} invoice.status = ${isInvoicePaid ? 'PAID' : (inv.status || 'UNPAID')}
            </span>
            <span style="padding: 3px 8px; border-radius: 9999px; ${isPaymentVerified ? 'background:#ECFDF5; color:#059669;' : 'background:#FEF2F2; color:#DC2626;'}">
              ${isPaymentVerified ? '✓' : '✕'} payment.status = ${isPaymentVerified ? 'VERIFIED' : (inv.paymentStatus || 'PENDING')}
            </span>
            <span style="padding: 3px 8px; border-radius: 9999px; ${isCaseAwaiting ? 'background:#ECFDF5; color:#059669;' : 'background:#FEF2F2; color:#DC2626;'}">
              ${isCaseAwaiting ? '✓' : '✕'} case.status = ACTIVE_AWAITING_ASSIGNMENT
            </span>
          </div>
        </div>

        <form id="form-assign-lawyer" onsubmit="event.preventDefault(); CasesView.saveLawyerAssignment('${c.id}');">
          
          <div class="grid grid-cols-2 gap-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label required" style="font-weight: 600;">Select Assigned Lawyer (Must be ACTIVE) *</label>
              <select id="assign-lawyer-select" class="form-control" required style="font-weight: 600; font-size: 0.9rem;">
                <option value="">-- Choose Active Counsel --</option>
                ${activeLawyers.map(l => `
                  <option value="${l.id}" data-name="${this.escapeHtml(l.name)}" ${c.lawyer === l.name ? 'selected' : ''}>
                    ${l.name} (${l.role}) — ACTIVE [${(l.activeCases || (l.assignedCaseIds ? l.assignedCaseIds.length : 0))} cases]
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required" style="font-weight: 600;">Assignment Date *</label>
              <input type="date" id="assign-date-input" class="form-control" value="${todayStr}" required>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600;">Practitioner Responsibility *</label>
            <select id="assign-responsibility-select" class="form-control" required>
              <option value="Lead Counsel & Trial Strategist" selected>Lead Counsel &amp; Trial Strategist</option>
              <option value="Co-Counsel & Research Lead">Co-Counsel &amp; Research Lead</option>
              <option value="Lead Pleadings & Motion Drafter">Lead Pleadings &amp; Motion Drafter</option>
              <option value="Senior Supervisory Advocate">Senior Supervisory Advocate</option>
            </select>
          </div>

          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600;">Internal Instructions &amp; Directive *</label>
            <textarea id="assign-internal-instructions" class="form-control" rows="3" required placeholder="Provide clear strategic guidelines, evidence review targets, deadline expectations, and initial client consultation directives..."></textarea>
            <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">Delivered directly to assigned advocate upon case dispatch.</div>
          </div>

          <div class="modal-footer" style="padding: 1rem 0 0 0; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-gold" style="font-weight: 700; padding: 0.55rem 1.4rem;">
              Confirm Assignment &amp; Activate (ASSIGNED / IN_PROGRESS) &rarr;
            </button>
          </div>
        </form>

      </div>
    `, 'modal-lg');
  },

  saveLawyerAssignment(caseId) {
    const role = SLCMS_STATE.currentUser?.role || '';
    if (role !== 'Senior Lawyer' && role !== 'Administrator' && role !== 'Legal Officer') {
      App.showToast('Validation Error: Only an authorized role can assign lawyers.', 'error');
      return;
    }

    const c = SLCMS_STATE.cases.find(i => i.id === caseId);
    if (!c) {
      App.showToast('Case record not found.', 'error');
      return;
    }

    const lawyerSelect = document.getElementById('assign-lawyer-select');
    const lawyerId = lawyerSelect?.value;
    const selectedOption = lawyerSelect ? lawyerSelect.options[lawyerSelect.selectedIndex] : null;
    const lawyerName = selectedOption ? selectedOption.dataset.name : '';
    const assignmentDate = document.getElementById('assign-date-input')?.value || new Date().toISOString().split('T')[0];
    const responsibility = document.getElementById('assign-responsibility-select')?.value || 'Lead Counsel';
    const internalInstructions = document.getElementById('assign-internal-instructions')?.value?.trim() || '';

    if (!lawyerId || !lawyerName) {
      App.showToast('Please select an active lawyer.', 'error');
      return;
    }

    if (!internalInstructions) {
      App.showToast('Please provide internal instructions for the assigned advocate.', 'error');
      return;
    }

    // Check associated invoice & payment status
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    const inv = invoices.find(i => i.caseId === c.id || i.requestId === c.requestId || (i.clientName && c.client && i.clientName.toLowerCase() === c.client.toLowerCase())) || {};

    // STEP 10 VALIDATIONS:
    // 1. invoice.status = PAID
    const isInvoicePaid = (inv.status === 'PAID' || inv.status === 'DEMO_PAID' || c.invoiceStatus === 'PAID');
    if (!isInvoicePaid) {
      App.showToast('Assignment Blocked: Associated invoice must be PAID before a lawyer can be assigned.', 'error', 6000);
      return;
    }

    // 2. payment.status = VERIFIED
    const isPaymentVerified = (inv.paymentStatus === 'VERIFIED' || c.paymentStatus === 'VERIFIED');
    if (!isPaymentVerified) {
      App.showToast('Assignment Blocked: Payment status must be VERIFIED before a lawyer can be assigned.', 'error', 6000);
      return;
    }

    // 3. case.status = ACTIVE_AWAITING_ASSIGNMENT
    const isCaseAwaiting = (c.status === 'ACTIVE_AWAITING_ASSIGNMENT' || (c.statusLabel && c.statusLabel.includes('AWAITING ASSIGNMENT')) || c.status === 'READY_FOR_ASSIGNMENT' || c.status === 'Submitted' || c.status === 'Active');
    if (!isCaseAwaiting) {
      App.showToast('Assignment Blocked: Case status must be ACTIVE_AWAITING_ASSIGNMENT.', 'error', 6000);
      return;
    }

    // 4. lawyer.account_status = ACTIVE
    const lawyerUser = (SLCMS_STATE.users || []).find(u => u.id === lawyerId || u.name === lawyerName);
    const isLawyerActive = lawyerUser && ((lawyerUser.accountStatus || lawyerUser.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    if (!isLawyerActive) {
      App.showToast('Assignment Blocked: The selected lawyer account is not ACTIVE. Suspended or inactive lawyers cannot be assigned.', 'error', 6000);
      return;
    }

    // STEP 11: Lawyer Receives Case -> Status changes to: ASSIGNED, IN_PROGRESS
    c.status = 'ASSIGNED';
    c.statusLabel = 'ASSIGNED / IN PROGRESS';
    c.progressStatus = 'IN_PROGRESS';
    c.progressPct = 25;
    c.lawyer = lawyerName;
    c.assignedLawyer = lawyerName;
    c.leadCounsel = lawyerName;
    c.assignedCounsel = lawyerName;
    c.lawyerId = lawyerId;
    c.assignedLawyerId = lawyerId;
    c.assignmentDate = assignmentDate;
    c.responsibility = responsibility;
    c.internalInstructions = internalInstructions;
    c.assignedAt = new Date().toISOString();
    c.lawyerAvatar = lawyerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Link in lawyer user object
    if (lawyerUser) {
      if (!lawyerUser.assignedCaseIds) lawyerUser.assignedCaseIds = [];
      if (!lawyerUser.assignedCaseIds.includes(caseId)) {
        lawyerUser.assignedCaseIds.push(caseId);
      }
      lawyerUser.activeCases = lawyerUser.assignedCaseIds.length;
      if (typeof SLCMS_STATE.persistUsers === 'function') SLCMS_STATE.persistUsers();
    }

    if (typeof SLCMS_STATE.persistCases === 'function') SLCMS_STATE.persistCases();
    if (typeof SLCMS_STATE.syncUsersWithCases === 'function') SLCMS_STATE.syncUsersWithCases();

    // Also update legal requests if applicable
    if (typeof LegalRequestsView !== 'undefined' && typeof LegalRequestsView.getRequests === 'function') {
      const reqList = LegalRequestsView.getRequests();
      const r = reqList.find(req => req.id === c.requestId || req.clientName === c.client);
      if (r) {
        r.status = 'ASSIGNED';
        r.assignedLawyer = lawyerName;
        LegalRequestsView.persistRequests(reqList);
      }
    }

    // Audit log
    if (typeof SLCMS_STATE.addAuditLog === 'function') {
      SLCMS_STATE.addAuditLog(
        'Case Assigned to Counsel',
        'Case Allocation',
        `Senior Lawyer assigned matter ${c.caseNumber} (${c.title}) to Adv. ${lawyerName}. Status updated to ASSIGNED and IN_PROGRESS. Instructions: ${internalInstructions.substring(0, 60)}...`,
        'Success'
      );
    }

    App.closeModal();
    App.showToast(`Matter ${c.caseNumber} successfully assigned to Adv. ${lawyerName}! Status is now ASSIGNED / IN_PROGRESS.`, 'success', 7000);
    App.refreshCurrentView();
    if (typeof App.renderSidebarNav === 'function') {
      App.renderSidebarNav();
    }
  },

  openCaseChat(caseId) {
    if (typeof CaseChatView !== 'undefined' && typeof CaseChatView.renderChatView === 'function') {
      App.openModal(`
        <div style="padding: 0;">
          ${CaseChatView.renderChatView(caseId)}
        </div>
      `, 'modal-xl');
    } else {
      App.navigate('client-messages');
    }
  },

  renderCaseAssignmentsView() {
    const allCases = SLCMS_STATE.cases || [];
    const awaitingCases = allCases.filter(c => c.status === 'ACTIVE_AWAITING_ASSIGNMENT' || (c.statusLabel && c.statusLabel.includes('AWAITING ASSIGNMENT')) || (c.status === 'READY_FOR_ASSIGNMENT'));
    const assignedCases = allCases.filter(c => c.status === 'ASSIGNED' || c.status === 'Active' || c.progressStatus === 'IN_PROGRESS');

    const activeLawyers = (SLCMS_STATE.users || []).filter(u => (u.role === 'Senior Lawyer' || u.role === 'Lawyer') && (u.accountStatus || u.status || 'ACTIVE').toUpperCase() === 'ACTIVE');

    return `
      <div class="case-assignments-suite animate-fade" style="padding-bottom: 2.5rem;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff; border-radius: 12px; padding: 1.75rem 2rem; margin-bottom: 1.75rem; border: 1px solid rgba(255,255,255,0.08);">
          <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem;">
            <span style="background: rgba(200, 155, 60, 0.2); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 10px; border-radius: 9999px;">
              Senior Lawyer Allocation Suite
            </span>
            <span style="color: #94A3B8; font-size: 0.75rem;">Step 10 &amp; 11 Case Assignment</span>
          </div>
          <h1 style="font-size: 1.6rem; font-weight: 700; margin: 0 0 0.35rem 0; font-family: var(--font-heading, sans-serif); color: #F8FAFC;">
            Senior Counsel Case Assignment Queue
          </h1>
          <p style="margin: 0; color: #94A3B8; font-size: 0.88rem; max-width: 720px; line-height: 1.5;">
            Authorize and allocate verified active matters to designated lead advocates. Assignment strictly validated against invoice payment settlement and account active status.
          </p>
        </div>

        <!-- Awaiting Assignment Queue -->
        <div class="card" style="padding: 1.5rem; border-radius: 12px; background: #FFF; border: 1.5px solid #0284C7; margin-bottom: 1.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <div>
              <h3 style="margin: 0; color: #0369A1; font-size: 1.15rem; font-weight: 700;">
                ⚖️ Active Cases Awaiting Counsel Assignment (${awaitingCases.length})
              </h3>
              <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #64748B;">
                Invoices paid &bull; Payments verified &bull; Ready for Senior Lawyer counsel dispatch
              </p>
            </div>
          </div>

          ${awaitingCases.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem; color: #64748B; background: #F8FAFC; border-radius: 8px; border: 1px dashed #CBD5E1;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
              <div style="font-weight: 700; color: #0F172A;">No cases currently awaiting lawyer assignment</div>
              <div style="font-size: 0.8rem; color: #94A3B8; margin-top: 0.25rem;">When the Legal Officer verifies client fee payment, the active matter appears here for assignment.</div>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${awaitingCases.map(c => `
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.15rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <span style="font-family: monospace; font-weight: 700; color: #0284C7; font-size: 0.85rem; background: #EFF6FF; padding: 2px 6px; border-radius: 4px;">
                        ${c.caseNumber}
                      </span>
                      <span style="background: #ECFDF5; color: #059669; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px;">
                        ● ACTIVE — AWAITING ASSIGNMENT
                      </span>
                    </div>
                    <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem;">${c.title}</div>
                    <div style="font-size: 0.8rem; color: #64748B; margin-top: 2px;">Client: <strong style="color: #1E293B;">${c.client}</strong> &bull; Category: ${c.caseType || 'Civil'} &bull; Payment: <strong style="color: #059669;">VERIFIED</strong></div>
                  </div>
                  <div>
                    <button class="btn btn-gold btn-sm" onclick="CasesView.openAssignLawyerModal('${c.id}')" style="font-weight: 700; padding: 0.5rem 1.15rem;">
                      ⚖️ Assign Lead Lawyer &rarr;
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Active Lawyers Workload Directory -->
        <div class="card" style="padding: 1.5rem; border-radius: 12px; background: #FFF; border: 1px solid #E2E8F0;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 700; color: #0F172A;">
            Active Practice Lawyers &amp; Active Dockets (${activeLawyers.length})
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${activeLawyers.map(l => {
              const count = l.activeCases || (l.assignedCaseIds ? l.assignedCaseIds.length : 0);
              return `
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; color: #0F172A; font-size: 0.9rem;">${l.name}</div>
                    <div style="font-size: 0.76rem; color: #64748B;">${l.role} &bull; ${l.email || ''}</div>
                    <span style="background: #ECFDF5; color: #059669; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 3px;">
                      ● Account Status: ACTIVE
                    </span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 1.25rem; font-weight: 800; color: #0284C7;">${count}</div>
                    <div style="font-size: 0.72rem; color: #64748B;">Active Cases</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
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

  openAssignStaffModal(preselectedCaseId = null) {
    const cases = SLCMS_STATE.cases || [];
    if (cases.length === 0) {
      App.showToast('No cases available to assign. Please register a case first.', 'info');
      return;
    }

    if (preselectedCaseId) {
      this.openAssignCaseModal(preselectedCaseId);
      return;
    }

    // If only one case exists, open it directly
    if (cases.length === 1) {
      this.openAssignCaseModal(cases[0].id);
      return;
    }

    // Otherwise show a quick matter selector that forwards to openAssignCaseModal
    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <div style="font-size: 0.75rem; color: var(--color-gold); font-weight: 700; text-transform: uppercase;">Staff Allocation Suite</div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem; margin-top: 0.2rem;">👤 Select Legal Matter to Assign</h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div class="form-group mb-3">
          <label class="form-label required" style="font-weight: 600;">Choose Legal Matter</label>
          <select id="sel-matter-to-assign" class="form-control">
            ${cases.map(c => `<option value="${c.id}">${c.caseNumber} — ${c.title} (${c.status || 'Unassigned'})</option>`).join('')}
          </select>
        </div>
        <div class="alert alert-info" style="font-size: 0.82rem; line-height: 1.45;">
          ⚖️ Selecting a matter will open the dedicated Case Assignment Protocol with active staff roster and role permissions confirmation.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="const cid = document.getElementById('sel-matter-to-assign')?.value; App.closeModal(); if (cid) CasesView.openAssignCaseModal(cid);">
          Open Assignment Panel &rarr;
        </button>
      </div>
    `, 'modal-md');
  },

  // -------------------------------------------------------------
  // STEP 3: OPEN ASSIGNMENT PANEL
  // -------------------------------------------------------------
  openAssignCaseModal(caseId) {
    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);
    if (!targetCase) {
      App.showToast('Target case matter not found.', 'error');
      return;
    }

    // Important rule: Only staff accounts with active status can be selected.
    // Locked, suspended, or deactivated accounts must never appear.
    const activeLawyers = SLCMS_STATE.getActiveStaffUsers(['Senior Lawyer', 'Lawyer']);
    const activeClerks = SLCMS_STATE.getActiveStaffUsers('Legal Clerk');

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <div style="font-size: 0.75rem; color: var(--color-gold); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
            Step 3 of Assignment Flow
          </div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem; margin-top: 0.2rem;">
            👤 Assign Staff to Case
          </h3>
          <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); margin-top: 0.15rem;">
            ${targetCase.caseNumber} &middot; ${targetCase.title}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem;">
        <div class="alert alert-info" style="margin-bottom: 1.25rem; font-size: 0.82rem; line-height: 1.45;">
          ℹ️ <strong>Assignment Protocol:</strong> Only staff accounts with <strong>Active</strong> status can be selected. Locked, suspended, or deactivated accounts are automatically excluded from assignment.
        </div>

        <div class="form-group mb-3">
          <label class="form-label required" style="font-weight: 600;">
            Lead Lawyer <span style="color: var(--color-danger);">*</span>
          </label>
          <select id="wf-assign-lead-lawyer" class="form-control" required>
            <option value="">-- Select Active Lead Counsel (Mandatory) --</option>
            ${activeLawyers.map(l => `
              <option value="${l.id}" ${targetCase.lawyer === l.name ? 'selected' : ''}>
                ${l.name} (${l.role}) — ${l.staffId || l.employeeId}
              </option>
            `).join('')}
          </select>
          <div class="form-help-text" style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
            Responsible for primary litigation strategy, court appearances, and client representation.
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" style="font-weight: 600;">
            Supporting Lawyer <span style="font-size: 0.75rem; color: var(--color-text-muted);">(Optional)</span>
          </label>
          <select id="wf-assign-support-lawyer" class="form-control">
            <option value="">-- None (No Supporting Counsel) --</option>
            ${activeLawyers.map(l => `
              <option value="${l.id}" ${targetCase.seniorLawyer === l.name ? 'selected' : ''}>
                ${l.name} (${l.role}) — ${l.staffId || l.employeeId}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" style="font-weight: 600;">
            Legal Clerk <span style="font-size: 0.75rem; color: var(--color-text-muted);">(Optional)</span>
          </label>
          <select id="wf-assign-clerk" class="form-control">
            <option value="">-- None (No Clerk Assigned) --</option>
            ${activeClerks.map(c => `
              <option value="${c.id}" ${targetCase.supportingStaff === c.name ? 'selected' : ''}>
                ${c.name} (${c.role}) — ${c.staffId || c.employeeId}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label required" style="font-weight: 600;">Access Level</label>
          <div class="grid grid-cols-3 gap-3" style="margin-top: 0.35rem;">
            <label style="border: 1px solid var(--color-border); padding: 0.65rem 0.75rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: var(--color-surface);">
              <input type="radio" name="wf-access-level" value="Standard" ${targetCase.accessLevel === 'Standard' || !targetCase.accessLevel ? 'checked' : ''} style="accent-color: var(--color-gold);">
              <div>
                <strong style="display: block; font-size: 0.84rem;">Standard</strong>
                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Assigned team &amp; general practice</span>
              </div>
            </label>

            <label style="border: 1px solid var(--color-border); padding: 0.65rem 0.75rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: var(--color-surface);">
              <input type="radio" name="wf-access-level" value="Confidential" ${targetCase.accessLevel === 'Confidential' ? 'checked' : ''} style="accent-color: var(--color-gold);">
              <div>
                <strong style="display: block; font-size: 0.84rem;">Confidential</strong>
                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Strict assigned counsel only</span>
              </div>
            </label>

            <label style="border: 1px solid var(--color-border); padding: 0.65rem 0.75rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: var(--color-surface);">
              <input type="radio" name="wf-access-level" value="Restricted" ${targetCase.accessLevel === 'Restricted' ? 'checked' : ''} style="accent-color: var(--color-gold);">
              <div>
                <strong style="display: block; font-size: 0.84rem;">Restricted</strong>
                <span style="font-size: 0.72rem; color: var(--color-text-muted);">High-security sealed file</span>
              </div>
            </label>
          </div>
        </div>

        <div class="form-group mb-2">
          <label class="form-label" style="font-weight: 600;">
            Assignment Note <span style="font-size: 0.75rem; color: var(--color-text-muted);">(Optional instructions or context)</span>
          </label>
          <textarea id="wf-assign-note" class="form-control" rows="2" placeholder="e.g. Please prioritize client consultation and file petition within statutory time limit.">${targetCase.assignmentNote || ''}</textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CasesView.proceedToConfirmPermissions('${targetCase.id}')">
          Continue to Confirmation &rarr;
        </button>
      </div>
    `, 'modal-lg');
  },

  proceedToConfirmPermissions(caseId) {
    const leadLawyerId = document.getElementById('wf-assign-lead-lawyer')?.value;
    if (!leadLawyerId) {
      App.showToast('Please select a Lead Lawyer (mandatory).', 'error');
      return;
    }

    const supportLawyerId = document.getElementById('wf-assign-support-lawyer')?.value;
    const clerkId = document.getElementById('wf-assign-clerk')?.value;
    const accessLevel = document.querySelector('input[name="wf-access-level"]:checked')?.value || 'Standard';
    const assignmentNote = document.getElementById('wf-assign-note')?.value?.trim() || '';

    const leadLawyer = (SLCMS_STATE.users || []).find(u => u.id === leadLawyerId);
    const supportingLawyer = supportLawyerId ? (SLCMS_STATE.users || []).find(u => u.id === supportLawyerId) : null;
    const clerk = clerkId ? (SLCMS_STATE.users || []).find(u => u.id === clerkId) : null;

    const assignmentData = {
      leadLawyer,
      supportingLawyer,
      clerk,
      accessLevel,
      assignmentNote
    };

    CasesView.openConfirmPermissionsModal(caseId, assignmentData);
  },

  // -------------------------------------------------------------
  // STEP 4: CONFIRM PERMISSIONS & UPDATE STATUS
  // -------------------------------------------------------------
  openConfirmPermissionsModal(caseId, assignmentData) {
    const targetCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId);
    if (!targetCase) return;

    const { leadLawyer, supportingLawyer, clerk, accessLevel, assignmentNote } = assignmentData;
    window._slcms_pending_assignment = { caseId, assignmentData };

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <div style="font-size: 0.75rem; color: var(--color-gold); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
            Step 4 of Assignment Flow
          </div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem; margin-top: 0.2rem;">
            ⚖️ Confirm Role Permissions &amp; Update Status
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem;">
        <!-- Mandatory User Statement -->
        <div style="background: rgba(200, 155, 60, 0.1); border-left: 4px solid var(--color-gold); padding: 1rem 1.25rem; border-radius: 6px; margin-bottom: 1.25rem;">
          <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--color-primary); line-height: 1.45;">
            “You are assigning this case to the selected staff members. They will only access the case information and actions permitted by their roles.”
          </p>
        </div>

        <!-- Assignment Summary Card -->
        <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: var(--color-gold); margin-bottom: 0.6rem;">
            Matter Assignment Summary
          </div>
          <div class="grid grid-cols-2 gap-3" style="font-size: 0.85rem;">
            <div>
              <span style="color: var(--color-text-muted);">Legal Matter:</span><br>
              <strong>${targetCase.caseNumber} — ${targetCase.title}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted);">Lead Counsel:</span><br>
              <strong style="color: var(--color-primary);">${leadLawyer.name} (${leadLawyer.role})</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted);">Supporting Counsel:</span><br>
              <strong>${supportingLawyer ? supportingLawyer.name : 'None'}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted);">Legal Clerk:</span><br>
              <strong>${clerk ? clerk.name : 'None'}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted);">Access Level:</span><br>
              <span class="badge badge-confidential" style="font-size: 0.72rem;">${accessLevel}</span>
            </div>
            <div>
              <span style="color: var(--color-text-muted);">New Status:</span><br>
              <span class="badge badge-active" style="font-size: 0.72rem;">Active (Assigned / Active)</span>
            </div>
          </div>
          ${assignmentNote ? `
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border); font-size: 0.8rem;">
              <span style="color: var(--color-text-muted);">Assignment Instructions:</span>
              <p style="margin: 0.2rem 0 0 0; color: var(--color-text-main); font-style: italic;">“${assignmentNote}”</p>
            </div>
          ` : ''}
        </div>

        <!-- Mandatory Role Definitions -->
        <div>
          <h4 style="font-size: 0.88rem; color: var(--color-primary); margin-bottom: 0.65rem; font-weight: 700;">
            Role Definitions &amp; System Capabilities
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.55rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.65rem; font-size: 0.82rem; line-height: 1.45;">
              <span style="background: #102A43; color: #FFFFFF; font-weight: 700; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; white-space: nowrap;">Administrator</span>
              <span><strong>Full administrative control and audit logs.</strong> Manages access provisioning, metadata integrity, and system-wide security.</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 0.65rem; font-size: 0.82rem; line-height: 1.45;">
              <span style="background: #C89B3C; color: #0B1F33; font-weight: 700; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; white-space: nowrap;">Senior Lawyer</span>
              <span><strong>Full legal management and approval authority.</strong> Directs trial strategy, signs off on major pleadings, and manages counsel.</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 0.65rem; font-size: 0.82rem; line-height: 1.45;">
              <span style="background: #1E3A8A; color: #FFFFFF; font-weight: 700; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; white-space: nowrap;">Lawyer</span>
              <span><strong>Daily handling, filing, and case updates.</strong> Prepares briefs, conducts depositions, drafts submissions, and tracks hearings.</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 0.65rem; font-size: 0.82rem; line-height: 1.45;">
              <span style="background: #334155; color: #FFFFFF; font-weight: 700; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; white-space: nowrap;">Clerk</span>
              <span><strong>Scheduling, document preparation, and record maintenance.</strong> Handles registry filings, calendar coordination, and case indexing.</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="CasesView.openAssignCaseModal('${targetCase.id}')">
          &larr; Back
        </button>
        <button class="btn btn-gold" onclick="CasesView.executeConfirmAssignment('${targetCase.id}')">
          ✓ Confirm &amp; Grant Access
        </button>
      </div>
    `, 'modal-lg');
  },

  executeConfirmAssignment(caseId) {
    const pending = window._slcms_pending_assignment;
    const assignmentData = (pending && pending.caseId === caseId) ? pending.assignmentData : null;
    if (!assignmentData) {
      App.showToast('Assignment parameters missing.', 'error');
      return;
    }

    const success = SLCMS_STATE.assignCaseWithWorkflow(caseId, assignmentData);
    if (!success) {
      App.showToast('Assignment execution failed.', 'error');
      return;
    }

    const c = (SLCMS_STATE.cases || []).find(item => item.id === caseId);
    App.closeModal();
    App.showToast(`Case ${c ? c.caseNumber : ''} status changed to Active!`, 'success');
    App.refreshCurrentView();

    // Trigger Step 5: Prompt to create related work
    setTimeout(() => {
      CasesView.openPromptForNextActionModal(caseId);
    }, 400);
  },

  // -------------------------------------------------------------
  // STEP 5: PROMPT TO CREATE RELATED WORK
  // -------------------------------------------------------------
  openPromptForNextActionModal(caseId) {
    const c = (SLCMS_STATE.cases || []).find(item => item.id === caseId) || { id: caseId, caseNumber: 'Matter', title: 'Legal Case' };
    const isLawyer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })();

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <div style="font-size: 0.75rem; color: var(--color-gold); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
            Step 5 of Assignment Flow
          </div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem; margin-top: 0.2rem;">
            📌 Next Action for ${c.caseNumber}
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal(); App.navigate('dashboard');" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 2rem 1.5rem; text-align: center;">
        <div style="font-size: 2.6rem; margin-bottom: 0.75rem;">📋</div>
        <!-- Exact User Quotation -->
        <h3 style="font-size: 1.3rem; color: var(--color-primary); font-weight: 700; margin-bottom: 0.6rem;">
          “Would you like to add the first task or deadline?”
        </h3>
        <p style="font-size: 0.88rem; color: var(--color-text-secondary); max-width: 520px; margin: 0 auto 1.75rem auto; line-height: 1.5;">
          Matter <strong>${c.title}</strong> is now officially Active and assigned to counsel. You can establish initial litigation milestones immediately or return to the dashboard.
        </p>

        <div class="grid ${isLawyer ? 'grid-cols-1' : 'grid-cols-2'} gap-4" style="text-align: left; margin-bottom: 1.5rem;">
          ${isLawyer ? '' : `
          <!-- Option 1: Create Task -->
          <div class="card" style="padding: 1.25rem; border: 1px solid var(--color-border); border-top: 3px solid var(--color-primary); cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; background: var(--color-surface);"
               onclick="App.closeModal(); TasksView.openNewTaskModal('${c.id}');"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.08)';"
               onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-size: 1.5rem;">📝</span>
              <span class="badge badge-active" style="font-size: 0.7rem;">Action Item</span>
            </div>
            <h4 style="font-size: 1rem; color: var(--color-primary); margin-bottom: 0.35rem; font-weight: 700;">Create Task</h4>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0; line-height: 1.45;">
              Initial client consultation, filing preparation, or discovery review for the assigned advocate.
            </p>
            <div style="margin-top: 0.85rem; font-weight: 600; font-size: 0.82rem; color: var(--color-primary);">
              + Open Task Builder &rarr;
            </div>
          </div>
          `}

          <!-- Option 2: Schedule Deadline -->
          <div class="card" style="padding: 1.25rem; border: 1px solid var(--color-border); border-top: 3px solid var(--color-gold); cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; background: var(--color-surface);"
               onclick="App.closeModal(); TasksView.openScheduleAppearanceModal('${c.id}');"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.08)';"
               onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-size: 1.5rem;">📅</span>
              <span class="badge badge-gold" style="font-size: 0.7rem;">Court Calendar</span>
            </div>
            <h4 style="font-size: 1rem; color: var(--color-primary); margin-bottom: 0.35rem; font-weight: 700;">Schedule Deadline</h4>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0; line-height: 1.45;">
              Court filing cutoff, motion hearing, or scheduled appearance date before the presiding judge.
            </p>
            <div style="margin-top: 0.85rem; font-weight: 600; font-size: 0.82rem; color: var(--color-gold);">
              + Open Court Docket &rarr;
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="justify-content: center;">
        <button class="btn btn-secondary" onclick="App.closeModal(); App.navigate('dashboard');">
          Skip for now (Go to Dashboard)
        </button>
      </div>
    `, 'modal-lg');
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
  },

  quickAddTask(caseId) {
    const isLawyer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })();
    if (isLawyer) {
      App.showToast('Access restricted: Lawyers do not have permission to create tasks.', 'warning');
      return;
    }
    if (typeof TasksView !== 'undefined' && TasksView.openNewTaskModal) {
      TasksView.openNewTaskModal(caseId);
    }
  }
};
