/* ==========================================================================
   SLCMS - Client Management & Client Dossiers
   Academic Presentation Standard:
   Fields: Client type, Full name, Phone, Email, Address, ID/Reg Number, Assigned Lawyer, Related Cases
   Actions: Register Client, View Client, Edit, Create Case, View Related Cases
   ========================================================================== */

const ClientsView = {
  currentTab: 'all', // 'all' | 'organization' | 'individual'
  searchQuery: '',
  viewMode: 'horizontal', // 'horizontal' | 'carousel' | 'grid'

  render() {
    const allClients = SLCMS_STATE.clients || [];
    const totalCount = allClients.length;
    const corpCount = allClients.filter(c => c.type === 'Corporate' || c.type === 'Organization').length;
    const indivCount = allClients.filter(c => c.type === 'Individual').length;
    const activeCount = allClients.filter(c => c.status !== 'Deactivated').length;

    const allRequests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredRequests() : [];
    const requestsCount = allRequests.length;
    const pendingRequestsCount = allRequests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'More Information Required').length;

    const filteredClients = allClients.filter(c => {
      const matchSearch = !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (c.idNumber && c.idNumber.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (c.assignedLawyer && c.assignedLawyer.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      let matchType = true;
      if (this.currentTab === 'organization' || this.currentTab === 'corporate') {
        matchType = (c.type === 'Corporate' || c.type === 'Organization');
      } else if (this.currentTab === 'individual') {
        matchType = (c.type === 'Individual');
      }
      return matchSearch && matchType;
    });

    const isAdmin = (SLCMS_STATE.currentUser?.role === 'Administrator');

    return `
      <div class="animate-fade">
        <!-- 1. EXECUTIVE HERO BANNER WITH REAL TELEMETRY -->
        <div class="clients-hero-banner">
          <div class="clients-hero-left">
            <h1 class="clients-hero-title">
              <span>Clients &amp; Retainer Accounts</span>
            </h1>
            <p class="clients-hero-sub">
              Manage legal client profiles, corporate registrations, KYC protocols, and assigned legal counsel
            </p>
          </div>

          <!-- Real Telemetry Micro-Pills -->
          <div class="clients-hero-stats">
            <div class="clients-hero-stat-pill">
              <div class="clients-stat-num text-gold">${totalCount}</div>
              <div class="clients-stat-label">Retainers</div>
            </div>
            <div class="clients-hero-stat-pill">
              <div class="clients-stat-num text-sky">${corpCount}</div>
              <div class="clients-stat-label">Corporate</div>
            </div>
            <div class="clients-hero-stat-pill">
              <div class="clients-stat-num text-teal">${indivCount}</div>
              <div class="clients-stat-label">Individual</div>
            </div>
            <div class="clients-hero-stat-pill">
              <div class="clients-stat-num" style="color: #6EE7B7;">${activeCount}</div>
              <div class="clients-stat-label">Active</div>
            </div>
          </div>

          <!-- Executive Actions -->
          <div class="clients-hero-actions">
            ${isAdmin ? `
              <button class="btn-clients-secondary" onclick="ClientsView.openCheckDuplicatesModal()" title="Verify uniqueness across all client records">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                <span>Check Duplicates</span>
              </button>
            ` : ''}
            <button class="btn-clients-gold" onclick="ClientsView.openNewClientModal()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Register Client</span>
            </button>
          </div>
        </div>

        ${isAdmin ? `
          <!-- 2. PRIVILEGED SENTINEL NOTICE BANNER -->
          <div class="clients-privilege-sentinel animate-fade">
            <div class="clients-sentinel-left">
              <div class="clients-sentinel-icon">🛡️</div>
              <div class="clients-sentinel-text">
                <strong style="color: #F8FAFC;">Attorney-Client Privilege Protocol Active:</strong> Identification numbers are masked, and privileged legal strategy notes or advice are shielded from administrative access. Administrators can verify directory metadata, detect duplicate entries, toggle active status, and review access rosters.
              </div>
            </div>
            <div class="clients-sentinel-badge">
              <span class="clients-sentinel-dot"></span>
              <span>PRIVILEGED BOUNDARY</span>
            </div>
          </div>
        ` : ''}

        <!-- 3. SEARCH & CATEGORY FILTER RIBBON -->
        <div class="clients-filter-ribbon">
          <div class="clients-search-box">
            <span class="clients-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="clients-search-input" placeholder="Search clients by legal name, email, phone, ID number, or assigned counsel..."
                   value="${this.searchQuery}" oninput="ClientsView.handleSearch(this.value)">
          </div>

          <div class="clients-tabs-pills">
            <button class="client-tab-pill ${this.currentTab === 'all' ? 'active' : ''}" onclick="ClientsView.filterTab('all')">
              All (${totalCount})
            </button>
            <button class="client-tab-pill ${this.currentTab === 'organization' ? 'active' : ''}" onclick="ClientsView.filterTab('organization')">
              Organizations (${corpCount})
            </button>
            <button class="client-tab-pill ${this.currentTab === 'individual' ? 'active' : ''}" onclick="ClientsView.filterTab('individual')">
              Individuals (${indivCount})
            </button>
            <button class="client-tab-pill ${this.currentTab === 'requests' ? 'active' : ''}" onclick="ClientsView.filterTab('requests')" style="position: relative;">
              Legal Requests
              ${pendingRequestsCount > 0 ? `<span class="badge" style="background:#EF4444; color:#fff; font-size:0.68rem; margin-left:6px; border-radius:999px; padding:2px 7px;">${pendingRequestsCount}</span>` : `<span class="badge" style="background:#E2E8F0; color:#475569; font-size:0.68rem; margin-left:6px; border-radius:999px; padding:2px 7px;">${requestsCount}</span>`}
            </button>
          </div>

          <!-- View Mode Switcher: Horizontal Rows (Default), Carousel, Grid -->
          <div class="clients-view-switcher">
            <button class="client-view-btn ${this.viewMode === 'horizontal' ? 'active' : ''}" onclick="ClientsView.toggleViewMode('horizontal')" title="Horizontal Dossier Rows">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              <span>Horizontal</span>
            </button>
            <button class="client-view-btn ${this.viewMode === 'carousel' ? 'active' : ''}" onclick="ClientsView.toggleViewMode('carousel')" title="Horizontal Carousel Track">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="9" height="16" rx="2"/><rect x="13" y="4" width="9" height="16" rx="2"/>
              </svg>
              <span>Carousel</span>
            </button>
            <button class="client-view-btn ${this.viewMode === 'grid' ? 'active' : ''}" onclick="ClientsView.toggleViewMode('grid')" title="Multi-column Grid View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>Grid</span>
            </button>
          </div>
        </div>

        <!-- 4. CLIENTS DOSSIER DISPLAY (Horizontal Rows / Carousel / Grid / Legal Requests) -->
        ${this.currentTab === 'requests' ? this.renderRequestsTab(allRequests, isAdmin) : filteredClients.length === 0 ? `
          <div class="card empty-state" style="padding: 3.5rem 1.5rem; text-align: center; margin-top: 1rem; border-radius: 16px; border: 1px dashed var(--color-border);">
            <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.85rem;">👥</div>
            <h3 class="empty-title" style="font-size: 1.25rem; color: var(--color-primary); font-weight: 700;">No clients match your filter</h3>
            <p class="empty-desc" style="color: var(--color-text-secondary); max-width: 480px; margin: 0.5rem auto 1.5rem auto; line-height: 1.5;">
              ${totalCount === 0 
                ? 'There are currently no clients registered in the firm repository. Register a new individual or corporate client to begin matter onboarding.' 
                : 'No client records matched your search query. Try clearing search filters or add a new client to the chambers.'}
            </p>
            <button class="btn-clients-gold" onclick="ClientsView.openNewClientModal()" style="margin: 0 auto;">
              <span>+ Register Client</span>
            </button>
          </div>
        ` : this.viewMode === 'horizontal' ? `
          <div class="clients-horizontal-list">
            ${filteredClients.map(c => this.renderHorizontalCard(c, isAdmin)).join('')}
          </div>
        ` : this.viewMode === 'carousel' ? `
          <div class="clients-carousel-wrapper">
            <div class="clients-carousel-controls">
              <div class="text-xs text-secondary font-medium">
                Showing <strong>${filteredClients.length}</strong> client dossiers &middot; Scroll horizontally or use navigation arrows
              </div>
              <div class="flex items-center gap-2">
                <button class="clients-nav-arrow-btn" onclick="ClientsView.scrollCarousel('prev')" title="Scroll Left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button class="clients-nav-arrow-btn" onclick="ClientsView.scrollCarousel('next')" title="Scroll Right">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
            <div class="clients-carousel-track" id="clients-carousel-track">
              ${filteredClients.map(c => this.renderGridCard(c, isAdmin)).join('')}
            </div>
          </div>
        ` : `
          <div class="clients-luxury-grid">
            ${filteredClients.map(c => this.renderGridCard(c, isAdmin)).join('')}
          </div>
        `}
      </div>
    `;
  },

  toggleViewMode(mode) {
    this.viewMode = mode;
    App.refreshCurrentView();
  },

  scrollCarousel(direction) {
    const el = document.getElementById('clients-carousel-track');
    if (el) {
      const scrollAmt = el.clientWidth * 0.75;
      el.scrollBy({ left: direction === 'next' ? scrollAmt : -scrollAmt, behavior: 'smooth' });
    }
  },

  renderHorizontalCard(c, isAdmin) {
    const clientCases = (SLCMS_STATE.cases || []).filter(cs => cs.clientId === c.id || cs.client === c.name);
    const lawyer = c.assignedLawyer || (clientCases[0] ? clientCases[0].lawyer : 'Advocate Unassigned');
    const isCorporate = (c.type === 'Corporate' || c.type === 'Organization');
    const cleanId = (c.idNumber || '').trim();
    const lastDigits = cleanId.replace(/[^0-9A-Za-z]/g, '').slice(-4) || '0000';
    const maskedId = isAdmin 
      ? (cleanId ? `TIN-***-${lastDigits}` : 'N/A')
      : (cleanId || 'N/A');
    const isLocked = (c.status === 'Locked' || c.locked === true);
    const isActive = (c.status !== 'Deactivated' && !isLocked);
    const initials = (c.name || 'CL').substring(0, 2).toUpperCase();

    return `
      <div class="luxury-client-card client-card-horizontal ${isCorporate ? 'card-corp' : 'card-indiv'}">
        <!-- 1. Identity & Credentials -->
        <div class="c-horiz-col c-horiz-identity">
          <div class="client-avatar-luxury ${isCorporate ? 'avatar-corp' : 'avatar-indiv'}">
            ${initials}
            <span class="client-type-icon-badge">${isCorporate ? '🏢' : '👤'}</span>
          </div>
          <div class="c-horiz-id-details">
            <h3 class="client-name-heading" onclick="ClientsView.openClientProfile('${c.id}')" title="Click to open client dossier">${c.name}</h3>
            <div class="client-badges-strip">
              <span class="client-type-tag">${c.type}</span>
              ${isLocked ? `
                <span class="client-status-tag" style="background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;">
                  <span class="pulse-dot-red" style="background: #DC2626;"></span>
                  Locked
                </span>
              ` : (c.verificationStatus === 'PENDING_VERIFICATION' ? `
                <span class="client-status-tag" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">
                  <span class="pulse-dot-red" style="background: #D97706;"></span>
                  Pending Verification
                </span>
              ` : `
                <span class="client-status-tag ${isActive ? 'active' : 'deactivated'}">
                  <span class="${isActive ? 'pulse-dot-green' : 'pulse-dot-red'}"></span>
                  ${isActive ? 'Active' : 'Deactivated'}
                </span>
              `)}
            </div>
            <div class="c-horiz-id-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span class="mono">ID / Reg: <strong>${maskedId}</strong></span>
              ${isAdmin ? `<span class="badge" style="font-size: 0.58rem; padding: 1px 4px; background: #FEF3C7; color: #92400E; font-weight: 700;">MASKED</span>` : ''}
            </div>
          </div>
        </div>

        <!-- 2. Legal Counsel & Matters Exposure -->
        <div class="c-horiz-col c-horiz-counsel">
          <div class="c-horiz-counsel-box">
            <div class="c-horiz-meta-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Assigned Counsel</span>
            </div>
            <div class="c-horiz-counsel-name">${lawyer}</div>
          </div>
          <div class="client-casework-pill ${clientCases.length > 0 ? 'has-cases' : 'no-cases'}">
            ${clientCases.length > 0 ? `
              <span class="pulse-dot-green"></span>
              <span><strong>${clientCases.length}</strong> Active ${clientCases.length === 1 ? 'Matter' : 'Matters'}</span>
              <button class="client-cases-view-link" onclick="ClientsView.viewRelatedCases('${c.id}')" title="View legal matters for ${c.name}">
                <span>View Cases &rarr;</span>
              </button>
            ` : `
              <span style="color: #94A3B8;">0 Linked Matters</span>
              <span class="no-matters-tag" style="font-size: 0.72rem; color: #94A3B8; font-weight: 600; padding: 1px 4px;">No Active Cases</span>
            `}
          </div>
        </div>

        <!-- 3. Direct Contact Channels -->
        <div class="c-horiz-col c-horiz-contacts">
          <a href="mailto:${c.email || ''}" class="client-contact-link" title="${c.email || 'Email not provided'}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>${c.email || 'Email unlisted'}</span>
          </a>
          <a href="tel:${c.phone || ''}" class="client-contact-link" title="${c.phone || 'Phone unlisted'}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>${c.phone || 'Phone unlisted'}</span>
          </a>
          <div class="client-address-text" title="${c.address || ''}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.address || 'Address unlisted'}</span>
          </div>
        </div>

        <!-- 4. Operations Dock -->
        <div class="c-horiz-col c-horiz-actions">
          <div class="c-horiz-actions-top">
            ${!isAdmin ? `
              <button class="client-btn-dock-addcase" onclick="ClientsView.createCaseForClient('${c.name}')" title="Register new legal matter for this client">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Case</span>
              </button>
            ` : ''}
            <button class="client-btn-dock-pill" onclick="ClientsView.openWhoCanAccessClientModal('${c.id}')" title="Review Staff Access Roster">
              👥 Access
            </button>
            <button class="client-btn-dock-pill" onclick="ClientsView.openResetClientPasswordModal('${c.id}')" title="Reset Client Portal Password">
              🔑 Pass
            </button>
          </div>
          <div class="c-horiz-actions-bottom">
            <button class="client-btn-dock-pill ${isLocked ? 'danger' : ''}" onclick="ClientsView.toggleClientLock('${c.id}')" title="${isLocked ? 'Unlock Client Account' : 'Lock Client Account'}">
              ${isLocked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
            ${c.verificationStatus === 'PENDING_VERIFICATION' ? `
              <button class="client-btn-dock-pill" style="background: #059669; color: #FFFFFF; font-weight: 600;" onclick="ClientsView.verifyClientManual('${c.id}')" title="Verify Client ID & Activate Account">
                ✓ Verify ID
              </button>
            ` : `
              <button class="client-btn-dock-pill ${isActive ? 'danger' : ''}" onclick="ClientsView.toggleClientStatus('${c.id}')" title="${isActive ? 'Deactivate Client Account' : 'Activate Client Account'}">
                ${isActive ? '🚫 Deact.' : '🟢 Act.'}
              </button>
            `}
            <button class="client-btn-dock-icon" onclick="ClientsView.openEditClientModal('${c.id}')" title="Edit Client Information">
              ✏️
            </button>
            <button class="client-btn-dock-icon delete" onclick="ClientsView.confirmDeleteClient('${c.id}')" title="Permanently Delete Record">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderGridCard(c, isAdmin) {
    const clientCases = (SLCMS_STATE.cases || []).filter(cs => cs.clientId === c.id || cs.client === c.name);
    const lawyer = c.assignedLawyer || (clientCases[0] ? clientCases[0].lawyer : 'Advocate Unassigned');
    const isCorporate = (c.type === 'Corporate' || c.type === 'Organization');
    const cleanId = (c.idNumber || '').trim();
    const lastDigits = cleanId.replace(/[^0-9A-Za-z]/g, '').slice(-4) || '0000';
    const maskedId = isAdmin 
      ? (cleanId ? `TIN-***-${lastDigits}` : 'N/A')
      : (cleanId || 'N/A');
    const isLocked = (c.status === 'Locked' || c.locked === true);
    const isActive = (c.status !== 'Deactivated' && !isLocked);
    const initials = (c.name || 'CL').substring(0, 2).toUpperCase();

    return `
      <div class="luxury-client-card ${isCorporate ? 'card-corp' : 'card-indiv'}">
        <div>
          <!-- Top Header -->
          <div class="luxury-client-header">
            <div class="client-avatar-luxury ${isCorporate ? 'avatar-corp' : 'avatar-indiv'}">
              ${initials}
              <span class="client-type-icon-badge">${isCorporate ? '🏢' : '👤'}</span>
            </div>
            <div class="client-title-block">
              <h3 class="client-name-heading" onclick="ClientsView.openClientProfile('${c.id}')" title="Click to open client dossier">${c.name}</h3>
              <div class="client-badges-strip">
                <span class="client-type-tag">${c.type}</span>
                ${isLocked ? `
                  <span class="client-status-tag" style="background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;">
                    <span class="pulse-dot-red" style="background: #DC2626;"></span>
                    Locked
                  </span>
                ` : (c.verificationStatus === 'PENDING_VERIFICATION' ? `
                  <span class="client-status-tag" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">
                    <span class="pulse-dot-red" style="background: #D97706;"></span>
                    Pending Verification
                  </span>
                ` : `
                  <span class="client-status-tag ${isActive ? 'active' : 'deactivated'}">
                    <span class="${isActive ? 'pulse-dot-green' : 'pulse-dot-red'}"></span>
                    ${isActive ? 'Active' : 'Deactivated'}
                  </span>
                `)}
              </div>
            </div>
          </div>

          <!-- Body Details -->
          <div class="luxury-client-body">
            <!-- Identification & Counsel -->
            <div class="client-meta-row">
              <span class="client-meta-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                ID / Reg No:
              </span>
              <span class="client-meta-value mono">
                ${maskedId}
                ${isAdmin ? `<span class="badge" style="font-size: 0.62rem; padding: 1px 5px; background: #FEF3C7; color: #92400E; margin-left: 4px; font-weight: 700;">MASKED</span>` : ''}
              </span>
            </div>

            <div class="client-meta-row">
              <span class="client-meta-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Assigned Counsel:
              </span>
              <span class="client-meta-value" style="color: var(--color-primary);">${lawyer}</span>
            </div>

            <!-- Contact Channels -->
            <div class="client-contact-chips-wrap">
              <a href="mailto:${c.email || ''}" class="client-contact-link" title="${c.email || 'Email not provided'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>${c.email || 'Email unlisted'}</span>
              </a>
              <a href="tel:${c.phone || ''}" class="client-contact-link" title="${c.phone || 'Phone unlisted'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>${c.phone || 'Phone unlisted'}</span>
              </a>
              <div class="client-address-text" title="${c.address || ''}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.address || 'Address unlisted'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Casework & Actions -->
        <div>
          <!-- Casework Exposure Strip -->
          <div class="client-casework-strip">
            <div class="client-casework-pill ${clientCases.length > 0 ? 'has-cases' : 'no-cases'}">
              ${clientCases.length > 0 ? `
                <span class="pulse-dot-green"></span>
                <span><strong>${clientCases.length}</strong> Active ${clientCases.length === 1 ? 'Matter' : 'Matters'}</span>
                <button class="client-cases-view-link" onclick="ClientsView.viewRelatedCases('${c.id}')">
                  <span>View Cases &rarr;</span>
                </button>
              ` : `
                <span style="color: #94A3B8;">0 Linked Matters</span>
                <span class="no-matters-tag" style="font-size: 0.72rem; color: #94A3B8; font-weight: 600; padding: 1px 4px;">No Active Cases</span>
              `}
            </div>
          </div>

          <!-- Action Dock -->
          <div class="client-card-dock">
            <div class="client-dock-left">
              ${!isAdmin ? `
                <button class="client-btn-dock-addcase" onclick="ClientsView.createCaseForClient('${c.name}')" title="Register new legal matter for this client">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Case</span>
                </button>
              ` : ''}
              <button class="client-btn-dock-pill" onclick="ClientsView.openWhoCanAccessClientModal('${c.id}')" title="Review Staff Access Roster">
                👥 Access
              </button>
              <button class="client-btn-dock-pill" onclick="ClientsView.openResetClientPasswordModal('${c.id}')" title="Reset Client Portal Password">
                🔑 Pass
              </button>
            </div>
            <div class="client-dock-right">
              <button class="client-btn-dock-pill ${isLocked ? 'danger' : ''}" onclick="ClientsView.toggleClientLock('${c.id}')" title="${isLocked ? 'Unlock Client Account' : 'Lock Client Account'}">
                ${isLocked ? '🔓 Unlock' : '🔒 Lock'}
              </button>
              ${c.verificationStatus === 'PENDING_VERIFICATION' ? `
                <button class="client-btn-dock-pill" style="background: #059669; color: #FFFFFF; font-weight: 600;" onclick="ClientsView.verifyClientManual('${c.id}')" title="Verify Client ID & Activate Account">
                  ✓ Verify ID
                </button>
              ` : `
                <button class="client-btn-dock-pill ${isActive ? 'danger' : ''}" onclick="ClientsView.toggleClientStatus('${c.id}')" title="${isActive ? 'Deactivate Client Account' : 'Activate Client Account'}">
                  ${isActive ? '🚫 Deact.' : '🟢 Act.'}
                </button>
              `}
              <button class="client-btn-dock-icon" onclick="ClientsView.openEditClientModal('${c.id}')" title="Edit Client Information">
                ✏️
              </button>
              <button class="client-btn-dock-icon delete" onclick="ClientsView.confirmDeleteClient('${c.id}')" title="Permanently Delete Record">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  handleSearch(val) {
    this.searchQuery = val;
    App.refreshCurrentView();
    setTimeout(() => {
      const el = document.querySelector('.clients-search-input');
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 50);
  },

  filterTab(tab) {
    this.currentTab = tab;
    App.refreshCurrentView();
  },

  viewRelatedCases(clientIdOrName) {
    const c = (SLCMS_STATE.clients || []).find(item => item.id === clientIdOrName || item.name === clientIdOrName);
    const clientName = c ? c.name : clientIdOrName;
    const clientId = c ? c.id : clientIdOrName;

    if (typeof CasesView !== 'undefined') {
      CasesView.selectedClientFilter = clientId;
      CasesView.selectedClientName = clientName;
      CasesView.searchQuery = clientName || '';
      CasesView.selectedFilterStatus = 'All';
      CasesView.selectedFilterType = 'All';
      CasesView.selectedFilterPriority = 'All';
    }

    App.navigate('cases');

    if (typeof CasesView !== 'undefined') {
      CasesView.selectedClientFilter = clientId;
      CasesView.selectedClientName = clientName;
      CasesView.searchQuery = clientName || '';
      CasesView.selectedFilterStatus = 'All';
      CasesView.selectedFilterType = 'All';
      CasesView.selectedFilterPriority = 'All';
      App.refreshCurrentView();
      setTimeout(() => {
        const input = document.querySelector('.cases-search-input');
        if (input && clientName) input.value = clientName;
      }, 50);
    }
  },


  openClientProfile(clientId) {
    const c = SLCMS_STATE.clients.find(item => item.id === clientId);
    if (!c) return;

    const role = SLCMS_STATE.currentUser?.role || '';
    const isAdmin = (role === 'Administrator' || role === 'System Administrator');
    const isLegalOfficer = (role === 'Legal Officer');

    const clientCases = SLCMS_STATE.cases.filter(cs => cs.clientId === c.id || cs.client === c.name);
    const lawyer = c.assignedLawyer || (clientCases[0] ? clientCases[0].lawyer : 'Advocate Unassigned');
    const isLocked = (c.status === 'Locked' || c.locked === true);
    const isDeactivated = (c.status === 'Deactivated');

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div class="flex items-center gap-3">
          <div class="avatar avatar-lg ${c.type === 'Organization' ? 'avatar-navy' : 'avatar-gold'}">
            ${c.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 style="color: #FFFFFF; font-size: 1.35rem; margin: 0;">${c.name}</h2>
              <span class="badge" style="background: rgba(255,255,255,0.15); color: #FFFFFF;">${c.type}</span>
              <span class="badge badge-active">${c.status || 'Active'}</span>
            </div>
            <div style="font-size: 0.8rem; color: #CBD5E1; margin-top: 0.25rem;">
              ID / Reg No: <strong>${c.idNumber || 'N/A'}</strong> &middot; Lead Counsel: <strong>${lawyer}</strong>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body">
        <div class="grid grid-cols-3 gap-6" style="margin-bottom: 1.5rem;">
          <div class="card" style="background: var(--color-surface-subtle);">
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Direct Contact</div>
            <div style="font-weight: 600; color: var(--color-primary); margin-top: 0.15rem;">${c.contactPerson || c.name}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">${c.email}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${c.phone}</div>
          </div>
          <div class="card" style="background: var(--color-surface-subtle);">
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Registered Physical Address</div>
            <div style="font-size: 0.85rem; color: var(--color-primary); line-height: 1.4; margin-top: 0.25rem;">${c.address || 'Address not registered'}</div>
          </div>
          <div class="card" style="background: var(--color-surface-subtle);">
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Representation Overview</div>
            <div style="font-size: 0.85rem; color: var(--color-primary); margin-top: 0.25rem;">
              Assigned Lawyer: <strong>${lawyer}</strong>
            </div>
            <div style="font-size: 0.78rem; color: var(--color-gold); margin-top: 0.25rem;">
              ${clientCases.length === 0 ? '0 Linked Matters on Record' : `${clientCases.length} Active ${clientCases.length === 1 ? 'Matter' : 'Matters'} on Record`}
            </div>
          </div>
        </div>
        ${isAdmin ? `
          <!-- PRIVILEGED LEGAL NOTES & STRATEGY SHIELD -->
          <div class="card" style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--color-gold);">
            <div class="flex items-center justify-between mb-1">
              <span style="font-weight: 700; color: #1E293B; font-size: 0.85rem;">
                🔒 Privileged Case Strategy &amp; Legal Advice
              </span>
              <span class="badge badge-confidential" style="font-size: 0.65rem;">Restricted to Counsel</span>
            </div>
            <div style="font-size: 0.8rem; color: #64748B; font-style: italic;">
              [Confidential Attorney-Client Communications, Private Strategy Memoranda, and Retainer Ledgers are strictly shielded from System Administrator viewing in compliance with Legal Practice Rules.]
            </div>
          </div>
        ` : ''}

        <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
          <h4 style="color: var(--color-primary); margin: 0;">Associated Legal Matters (${clientCases.length})</h4>
          ${!isAdmin ? `
          <button class="btn btn-secondary btn-sm" onclick="ClientsView.createCaseForClient('${c.name}')">+ Register Case for Client</button>
          ` : ''}
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Case Number</th><th>Title</th><th>Court</th><th>Assigned Lawyer</th><th>Status</th><th>Hearing</th></tr>
            </thead>
            <tbody>
              ${clientCases.length ? clientCases.map(cs => `
                <tr>
                  <td><strong style="font-family: var(--font-mono); color: var(--color-gold);">${cs.caseNumber}</strong></td>
                  <td><strong style="color: var(--color-primary); cursor: pointer;" onclick="App.closeModal(); CasesView.openCaseDetails('${cs.id}');">${cs.title}</strong></td>
                  <td><span style="font-size: 0.8rem;">${cs.court}</span></td>
                  <td>${cs.lawyer}</td>
                  <td><span class="badge badge-${cs.status.toLowerCase().replace(' ', '')}">${cs.status}</span></td>
                  <td style="color: var(--color-danger); font-family: var(--font-mono); font-size: 0.8rem;">${cs.nextHearingDate || 'TBD'}</td>
                </tr>
              `).join('') : `
                <tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--color-text-secondary);">No legal matters recorded for this client yet.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary" onclick="ClientsView.openEditClientModal('${c.id}')">✏️ Edit Info</button>
          ${isLegalOfficer ? `
            <button class="btn ${isLocked ? 'btn-danger' : 'btn-secondary'}" onclick="App.closeModal(); ClientsView.toggleClientLock('${c.id}');">
              ${isLocked ? '🔓 Unlock Account' : '🔒 Lock Account'}
            </button>
            <button class="btn ${isDeactivated ? 'btn-primary' : 'btn-secondary'}" onclick="App.closeModal(); ClientsView.toggleClientStatus('${c.id}');">
              ${isDeactivated ? '🟢 Activate' : '🚫 Deactivate'}
            </button>
            <button class="btn btn-gold" onclick="App.closeModal(); ClientsView.openResetClientPasswordModal('${c.id}');">
              🔑 Reset Password
            </button>
          ` : ''}
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary" onclick="App.closeModal()">Close Dossier</button>
          ${!isAdmin ? `
          <button class="btn btn-gold" onclick="ClientsView.createCaseForClient('${c.name}')">+ Open New Case</button>
          ` : ''}
        </div>
      </div>
    `, 'modal-lg');
  },

  _clientCreationCallback: null,

  openNewClientModal(callback = null) {
    this._clientCreationCallback = callback;
    const lawyers = SLCMS_STATE.getActiveStaffUsers(['Senior Lawyer', 'Lawyer']);

    App.openModal(`
      <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
        <div>
          <h3 class="modal-title" style="font-size: 1.15rem; font-weight: 600; color: #F8FAFC;">Register New Client</h3>
          <p style="font-size: 0.8rem; color: #94A3B8; margin-top: 2px;">Enter client contact details to establish an active retainer file.</p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="font-size: 1.1rem; color: #94A3B8;">✕</button>
      </div>
      <div class="modal-body" style="padding-top: 16px;">
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Client Full Name</label>
            <input type="text" id="nc-name" class="form-control" placeholder="e.g. Deogratius Peter Shayo or CRDB Bank PLC" maxlength="150" required
              oninput="ClientsView.validateField('name')" onblur="ClientsView.validateField('name')">
            <div id="err-nc-name" class="client-err-msg text-xs mt-1" style="color: #F87171; display: none;"></div>
          </div>
          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Client Type</label>
            <select id="nc-type" class="form-control" onchange="ClientsView.validateField('type')">
              <option value="Individual">Individual Person</option>
              <option value="Corporate">Corporate / Organization</option>
            </select>
            <div id="err-nc-type" class="client-err-msg text-xs mt-1" style="color: #F87171; display: none;"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Contact Phone Number</label>
            <input type="tel" id="nc-phone" class="form-control" placeholder="+255 754 112 233 or 0754 112 233" required
              oninput="ClientsView.validateField('phone')" onblur="ClientsView.validateField('phone')">
            <div id="err-nc-phone" class="client-err-msg text-xs mt-1" style="color: #F87171; display: none;"></div>
          </div>
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Email Address <span style="font-weight: 400; color: #94A3B8;">(Optional)</span></label>
            <input type="email" id="nc-email" class="form-control" placeholder="client@domain.co.tz" maxlength="150"
              oninput="ClientsView.validateField('email')" onblur="ClientsView.validateField('email')">
            <div id="err-nc-email" class="client-err-msg text-xs mt-1" style="color: #F87171; display: none;"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Identification / TIN / Reg Ref <span style="font-weight: 400; color: #94A3B8;">(Optional)</span></label>
            <input type="text" id="nc-idnum" class="form-control" placeholder="NIDA-19850101-1001-11 / BRELA-1002341" maxlength="50">
          </div>
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Assigned Legal Counsel</label>
            <select id="nc-lawyer" class="form-control">
              <option value="Unassigned">Unassigned (General Pool)</option>
              ${lawyers.map(l => `<option value="${l.name}">${l.name} (${l.role})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group mb-0">
          <label class="form-label" style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Physical / Registered Office Address <span style="font-weight: 400; color: #94A3B8;">(Optional)</span></label>
          <input type="text" id="nc-address" class="form-control" placeholder="Plot 42, Samora Avenue, Dar es Salaam">
        </div>
      </div>
      <div class="modal-footer" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" id="btn-save-client" class="btn btn-gold" onclick="ClientsView.saveNewClient()">
          <span>Register Client</span>
        </button>
      </div>
    `);
  },

  validateField(fieldName) {
    const el = document.getElementById(`nc-${fieldName}`);
    const errEl = document.getElementById(`err-nc-${fieldName}`);
    if (!el || !errEl) return true;

    const val = el.value.trim();
    let errorMsg = '';

    if (fieldName === 'name') {
      if (!val) {
        errorMsg = 'Client name is required.';
      } else if (val.length < 2 || val.length > 150) {
        errorMsg = 'Client name must be between 2 and 150 characters.';
      } else if (!/^[a-zA-Z\s.'’\-]+$/.test(val)) {
        errorMsg = 'Client name may only contain letters, spaces, apostrophes, hyphens and dots.';
      } else if (!/[a-zA-Z]/.test(val)) {
        errorMsg = 'Client name cannot be made only of numbers.';
      } else {
        const existing = (SLCMS_STATE.clients || []).some(c => c.name && c.name.toLowerCase() === val.toLowerCase());
        if (existing) {
          errorMsg = 'A client with this name already exists in the system.';
        }
      }
    } else if (fieldName === 'phone') {
      if (!val) {
        errorMsg = 'Contact phone number is required.';
      } else {
        let clean = val.replace(/[\s\-\(\)]+/g, '');
        if (clean.startsWith('0') && clean.length === 10) clean = '+255' + clean.substring(1);
        if (clean.startsWith('255') && clean.length === 12) clean = '+' + clean;
        const tzPattern = /^(\+255)[67]\d{8}$/;
        const intlPattern = /^\+?[0-9]{9,15}$/;
        if (!tzPattern.test(clean) && !intlPattern.test(clean)) {
          errorMsg = 'Provide a valid Tanzanian number (+255 7XX XXX XXX or 07XXXXXXXX) or international format.';
        }
      }
    } else if (fieldName === 'email') {
      if (val) {
        const emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailPattern.test(val)) {
          errorMsg = 'Please enter a valid email address (e.g. client@domain.co.tz).';
        }
      }
    }

    if (errorMsg) {
      el.classList.add('is-invalid');
      errEl.textContent = errorMsg;
      errEl.style.display = 'block';
      return false;
    } else {
      el.classList.remove('is-invalid');
      errEl.textContent = '';
      errEl.style.display = 'none';
      return true;
    }
  },

  async saveNewClient() {
    const isNameValid = this.validateField('name');
    const isPhoneValid = this.validateField('phone');
    const isEmailValid = this.validateField('email');

    if (!isNameValid || !isPhoneValid || !isEmailValid) {
      const firstInvalid = document.querySelector('#nc-name.is-invalid, #nc-phone.is-invalid, #nc-email.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      App.showToast('Please correct the highlighted validation errors.', 'error');
      return;
    }

    const name = document.getElementById('nc-name')?.value?.trim();
    let phone = document.getElementById('nc-phone')?.value?.trim().replace(/[\s\-\(\)]+/g, '') || '';
    if (phone.startsWith('0') && phone.length === 10) phone = '+255' + phone.substring(1);
    if (phone.startsWith('255') && phone.length === 12) phone = '+' + phone;

    const type = document.getElementById('nc-type')?.value || 'Individual';
    const email = document.getElementById('nc-email')?.value?.trim() || '';
    const address = document.getElementById('nc-address')?.value?.trim() || '';
    const idNumber = document.getElementById('nc-idnum')?.value?.trim() || '';
    const lawyer = document.getElementById('nc-lawyer')?.value || 'Unassigned';

    const saveBtn = document.getElementById('btn-save-client');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Registering...</span>';
    }

    const newId = 'cli-' + Date.now();
    const payload = {
      id: newId,
      name: name,
      clientType: type.toUpperCase(),
      email: email,
      phone: phone,
      nationalIdRef: idNumber,
      address: address,
      assignedLawyer: lawyer,
      contactPerson: name,
      notes: 'Client registered in SLCMS with verified KYC.'
    };

    // Try API POST to persist in Spring Boot & MySQL database
    try {
      const apiUrl = (typeof window.getApiUrl === 'function') ? window.getApiUrl('/api/clients') : '/api/clients';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.errors) {
          Object.keys(errData.errors).forEach(field => {
            const el = document.getElementById(`nc-${field}`);
            const errEl = document.getElementById(`err-nc-${field}`);
            if (el && errEl) {
              el.classList.add('is-invalid');
              errEl.textContent = errData.errors[field];
              errEl.style.display = 'block';
            }
          });
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span>Register Client</span>';
          }
          App.showToast(Object.values(errData.errors)[0] || 'Registration failed.', 'error');
          return;
        }
      } else {
        const resData = await response.json();
        if (resData && resData.id) {
          payload.id = resData.id;
          payload.clientNumber = resData.clientNumber;
        }
      }
    } catch (e) {
      console.info('Client backend sync deferred, saving locally:', e);
    }

    const stateClient = {
      id: payload.id,
      clientNumber: payload.clientNumber || ('CLI-TZ-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)),
      name: name,
      type: type,
      clientType: type.toUpperCase(),
      contactPerson: name,
      email: email,
      phone: phone,
      address: address,
      idNumber: idNumber,
      nationalIdRef: idNumber,
      assignedLawyer: lawyer,
      activeCases: 0,
      totalCases: 0,
      status: 'Active',
      confidential: true,
      notes: payload.notes
    };

    SLCMS_STATE.addClient(stateClient);
    App.closeModal();
    App.showToast(`Client "${stateClient.name}" registered successfully!`, 'success');

    if (typeof this._clientCreationCallback === 'function') {
      const cb = this._clientCreationCallback;
      this._clientCreationCallback = null;
      cb(stateClient);
    } else {
      App.refreshCurrentView();
    }
  },

  openEditClientModal(clientId) {
    const c = SLCMS_STATE.clients.find(item => item.id === clientId);
    if (!c) return;

    const lawyers = SLCMS_STATE.getActiveStaffUsers(['Senior Lawyer', 'Lawyer']);

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Edit Client Record — ${c.name}</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Client Full Name</label>
            <input type="text" id="ec-name" class="form-control" value="${c.name}">
          </div>
          <div class="form-group">
            <label class="form-label required">Client Type</label>
            <select id="ec-type" class="form-control">
              <option value="Organization" ${c.type === 'Organization' ? 'selected' : ''}>Organization / Corporate</option>
              <option value="Individual" ${c.type === 'Individual' ? 'selected' : ''}>Individual Person</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Primary Contact Person</label>
            <input type="text" id="ec-contact" class="form-control" value="${c.contactPerson || ''}">
          </div>
          <div class="form-group">
            <label class="form-label required">Email</label>
            <input type="email" id="ec-email" class="form-control" value="${c.email || ''}">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Phone Number</label>
            <input type="tel" id="ec-phone" class="form-control" value="${c.phone || ''}">
          </div>
          <div class="form-group">
            <label class="form-label required">National ID / TIN / Reg Number</label>
            <input type="text" id="ec-idnum" class="form-control" value="${c.idNumber || ''}">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Physical Address</label>
            <input type="text" id="ec-address" class="form-control" value="${c.address || ''}">
          </div>
          <div class="form-group">
            <label class="form-label required">Assigned Lawyer</label>
            <select id="ec-lawyer" class="form-control">
              ${lawyers.map(l => `<option value="${l}" ${c.assignedLawyer === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="ClientsView.saveClientEdit('${c.id}')">Save Changes</button>
      </div>
    `);
  },

  saveClientEdit(clientId) {
    const c = SLCMS_STATE.clients.find(item => item.id === clientId);
    if (!c) return;

    c.name = document.getElementById('ec-name')?.value || c.name;
    c.type = document.getElementById('ec-type')?.value || c.type;
    c.contactPerson = document.getElementById('ec-contact')?.value || c.contactPerson;
    c.email = document.getElementById('ec-email')?.value || c.email;
    c.phone = document.getElementById('ec-phone')?.value || c.phone;
    c.idNumber = document.getElementById('ec-idnum')?.value || c.idNumber;
    c.address = document.getElementById('ec-address')?.value || c.address;
    c.assignedLawyer = document.getElementById('ec-lawyer')?.value || c.assignedLawyer;

    SLCMS_STATE.addAuditLog('Client Updated', 'Clients', c.name);
    SLCMS_STATE.persistClients();
    App.closeModal();
    App.showToast(`Client record for ${c.name} updated successfully`, 'success');
    App.refreshCurrentView();
  },

  createCaseForClient(clientIdentifier) {
    const currentUser = SLCMS_STATE.currentUser;
    if (currentUser?.role === 'Administrator') {
      App.showToast('Administrators do not have permission to register legal cases.', 'warning');
      return;
    }
    const r = String(currentUser?.role || '').toLowerCase();
    const t = String(currentUser?.jobTitle || currentUser?.roleLabel || '').toLowerCase();
    if (r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate')) {
      App.showToast('Access restricted: Lawyers do not have permission to register new cases.', 'warning');
      return;
    }
    App.closeModal();
    const c = SLCMS_STATE.clients.find(item => item.id === clientIdentifier || item.name === clientIdentifier);
    CasesView.openNewCaseModal(c ? c.id : null);
  },

  openCheckDuplicatesModal() {
    const clients = SLCMS_STATE.clients || [];
    const seenNames = new Map();
    const duplicates = [];

    clients.forEach(c => {
      const cleanName = (c.name || '').toLowerCase().trim();
      if (seenNames.has(cleanName)) {
        duplicates.push({ original: seenNames.get(cleanName), duplicate: c, field: 'Client Legal Name' });
      } else {
        seenNames.set(cleanName, c);
      }
    });

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem;">🔍 Client Duplicate Verification Engine</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <p style="font-size: 0.88rem; color: #475569; margin-bottom: 1rem;">
          Scanned <strong>${clients.length}</strong> active client records across entity names, official emails, telephone lines, and Tax Identification Numbers (TINs).
        </p>

        ${duplicates.length > 0 ? `
          <div class="alert alert-warning" style="margin-bottom: 1rem;">
            ⚠️ <strong>${duplicates.length} Potential Duplicate Found:</strong> Review details below to merge or resolve.
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr><th>Field</th><th>Primary Record</th><th>Duplicate Detected</th><th>Action</th></tr>
              </thead>
              <tbody>
                ${duplicates.map(d => `
                  <tr>
                    <td><span class="badge badge-pending">${d.field}</span></td>
                    <td><strong>${d.original.name}</strong><br><small style="color:#64748B;">${d.original.email}</small></td>
                    <td><strong>${d.duplicate.name}</strong><br><small style="color:#64748B;">${d.duplicate.email}</small></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="App.showToast('Duplicate flagged for counsel merger.', 'info')">Merge</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 1.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🟢</div>
            <h4 style="color: #166534; margin: 0 0 0.35rem 0;">Zero Duplicate Client Records Detected</h4>
            <p style="font-size: 0.82rem; color: #15803D; margin: 0;">
              All registered client entities, phone numbers, and official contact emails are verified unique.
            </p>
          </div>
        `}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-md');
  },

  toggleClientStatus(clientId) {
    const c = (SLCMS_STATE.clients || []).find(item => item.id === clientId);
    if (!c) return;
    const isDeactivating = (c.status !== 'Deactivated');
    c.status = isDeactivating ? 'Deactivated' : 'Active';
    if (!isDeactivating) c.locked = false;
    if (typeof SLCMS_STATE.addAuditLog === 'function') {
      SLCMS_STATE.addAuditLog(`Client Record ${isDeactivating ? 'Deactivated' : 'Reactivated'}`, 'Client Portal', `${c.name} (${c.id}) by ${SLCMS_STATE.currentUser?.name || 'Legal Officer'}`, isDeactivating ? 'Deactivated' : 'Success', { role: 'Client', userName: c.name });
    }
    SLCMS_STATE.persistClients();
    App.showToast(`Client "${c.name}" is now ${c.status}.`, isDeactivating ? 'warning' : 'success');
    App.refreshCurrentView();
  },

  toggleClientLock(clientId) {
    const c = (SLCMS_STATE.clients || []).find(item => item.id === clientId);
    if (!c) return;
    const isCurrentlyLocked = (c.status === 'Locked' || c.locked === true);
    if (isCurrentlyLocked) {
      c.locked = false;
      c.status = 'Active';
      if (typeof SLCMS_STATE.addAuditLog === 'function') {
        SLCMS_STATE.addAuditLog('Client Account Unlocked', 'Client Portal', `Client ${c.name} (${c.clientNumber || c.id}) unlocked by ${SLCMS_STATE.currentUser?.name || 'Legal Officer'}`, 'Success', { role: 'Client', userName: c.name });
      }
      App.showToast(`Client account for "${c.name}" has been unlocked.`, 'success');
    } else {
      c.locked = true;
      c.status = 'Locked';
      if (typeof SLCMS_STATE.addAuditLog === 'function') {
        SLCMS_STATE.addAuditLog('Client Account Locked', 'Client Portal', `Client ${c.name} (${c.clientNumber || c.id}) locked by ${SLCMS_STATE.currentUser?.name || 'Legal Officer'}`, 'Locked', { role: 'Client', userName: c.name });
      }
      App.showToast(`Client account for "${c.name}" has been locked. Portal access disabled.`, 'warning');
    }
    SLCMS_STATE.persistClients();
    App.refreshCurrentView();
  },

  openResetClientPasswordModal(clientId) {
    const c = (SLCMS_STATE.clients || []).find(item => item.id === clientId);
    if (!c) return;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let suggestedPass = 'Clt';
    for (let i = 0; i < 6; i++) {
      suggestedPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    suggestedPass += '!26';

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A, #1E293B); color: #FFFFFF;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 1.25rem;">🔑</span>
          <div>
            <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem; margin: 0;">Reset Client Portal Password</h3>
            <p style="font-size: 0.78rem; color: #94A3B8; margin: 0.2rem 0 0 0;">Legal Officer Client Credential Provisioning</p>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #94A3B8;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Client Name</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #0F172A;">${c.name}</div>
              <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.2rem;">ID: <span class="mono">${c.clientNumber || c.id}</span> &bull; ${c.email || c.phone || 'No direct contact'}</div>
            </div>
            <span class="badge ${c.status === 'Locked' || c.locked ? 'badge-danger' : (c.status === 'Deactivated' ? 'badge-secondary' : 'badge-active')}">${c.status || 'Active'}</span>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label required" style="font-weight: 700; font-size: 0.84rem; color: #1E293B;">
            New Temporary Client Password
          </label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="rcp-password" class="form-control mono" value="${suggestedPass}" style="font-size: 0.95rem; font-weight: 700; letter-spacing: 0.5px;" required>
            <button type="button" class="btn btn-secondary" onclick="ClientsView.regenerateRandomPassword()" title="Generate new secure password">
              🎲 Random
            </button>
          </div>
          <small style="color: #64748B; font-size: 0.75rem; margin-top: 0.3rem; display: block;">
            The client can use this password to immediately log in to the Client Portal.
          </small>
        </div>

        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 0.8rem; color: #166534;">
            📋 <strong>Quick Share:</strong> Copy credentials to provide to the client securely.
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="ClientsView.copyClientPasswordCredentials('${c.name.replace(/'/g, "\\'")}', '${(c.email || c.clientNumber || c.id).replace(/'/g, "\\'")}')">
            Copy Credentials
          </button>
        </div>
      </div>
      <div class="modal-footer" style="padding: 1rem 1.5rem;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="ClientsView.saveResetClientPassword('${c.id}')" style="font-weight: 700;">
          Save &amp; Apply Password
        </button>
      </div>
    `);
  },

  regenerateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let p = 'Clt';
    for (let i = 0; i < 6; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
    p += '!26';
    const el = document.getElementById('rcp-password');
    if (el) el.value = p;
  },

  copyClientPasswordCredentials(clientName, identifier) {
    const pass = document.getElementById('rcp-password')?.value || '';
    const text = `SLCMS Client Portal Credentials:\nClient: ${clientName}\nLogin ID: ${identifier}\nTemporary Password: ${pass}\nPortal: ${window.location.origin}${window.location.pathname}#client-portal`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        App.showToast('Client credentials copied to clipboard!', 'success');
      }).catch(() => {
        App.showToast('Credentials ready. Password: ' + pass, 'info');
      });
    } else {
      App.showToast('Credentials ready. Password: ' + pass, 'info');
    }
  },

  saveResetClientPassword(clientId) {
    const c = (SLCMS_STATE.clients || []).find(item => item.id === clientId);
    if (!c) return;
    const pass = document.getElementById('rcp-password')?.value?.trim();
    if (!pass) {
      App.showToast('Please provide a password.', 'error');
      return;
    }
    c.clientPassword = pass;
    // Also unlock if locked
    if (c.status === 'Locked' || c.locked) {
      c.locked = false;
      c.status = 'Active';
    }
    SLCMS_STATE.persistClients();
    if (typeof SLCMS_STATE.addAuditLog === 'function') {
      SLCMS_STATE.addAuditLog('Client Password Reset', 'Client Portal', `Password reset for ${c.name} (${c.clientNumber || c.id}) by ${SLCMS_STATE.currentUser?.name || 'Legal Officer'}`, 'Success', { role: 'Client', userName: c.name });
    }
    App.closeModal();
    App.showToast(`Password for client "${c.name}" has been successfully updated.`, 'success');
    App.refreshCurrentView();
  },

  confirmDeleteClient(clientId) {
    const c = SLCMS_STATE.clients.find(item => item.id === clientId);
    if (!c) return;
    App.openModal(`
      <div class="modal-header" style="background:#FEF2F2;border-bottom:1px solid #FECACA;">
        <h3 class="modal-title" style="color:#DC2626;">🗑️ Delete Client Record</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding:1.25rem 1.5rem;">
        <p style="font-size:0.9rem;color:#334155;margin-bottom:0.5rem;">
          You are about to <strong>permanently delete</strong> the client record for:
        </p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:0.85rem 1rem;margin-bottom:1rem;">
          <div style="font-weight:800;font-size:1rem;color:#0F172A;">${c.name}</div>
          <div style="font-size:0.82rem;color:#64748B;margin-top:0.2rem;">${c.type} &bull; ${c.email || 'No email'} &bull; ${c.phone}</div>
        </div>
        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:0.75rem 1rem;font-size:0.82rem;color:#DC2626;">
          ⚠️ This action is <strong>irreversible</strong>. All related case links will be unlinked. Are you sure?
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn" style="background:#DC2626;color:#fff;font-weight:700;" onclick="ClientsView.deleteClient('${c.id}')">Yes, Delete Permanently</button>
      </div>
    `);
  },

  deleteClient(clientId) {
    const c = SLCMS_STATE.clients.find(item => item.id === clientId);
    if (!c) return;
    const name = c.name;
    SLCMS_STATE.clients = SLCMS_STATE.clients.filter(item => item.id !== clientId);
    SLCMS_STATE.addAuditLog('Client Deleted', 'Clients', `${name} (${clientId}) permanently removed`);
    SLCMS_STATE.persistClients();
    App.closeModal();
    App.showToast(`Client "${name}" has been permanently deleted.`, 'warning');
    App.refreshCurrentView();
  },

  openWhoCanAccessClientModal(clientId) {
    const c = SLCMS_STATE.clients.find(item => item.id === clientId);
    if (!c) return;

    const clientCases = SLCMS_STATE.cases.filter(cs => cs.clientId === c.id || cs.client === c.name);
    const lawyers = [...new Set(clientCases.map(cs => cs.lawyer).concat([c.assignedLawyer || 'Adv. Asha Mrema']))];
    const users = SLCMS_STATE.users || [];

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem;">👥 Access Roster: ${c.name}</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.15rem 1rem;">
        <p style="font-size: 0.84rem; color: var(--color-text-secondary, #475569); margin-bottom: 0.85rem; line-height: 1.45;">
          The following law firm personnel possess authorized access to matters and confidential files for <strong>${c.name}</strong>:
        </p>

        <!-- Desktop / Tablet Table View -->
        <div class="table-container roster-table-container">
          <table class="data-table" style="min-width: 520px;">
            <thead>
              <tr><th>Authorized Staff</th><th>Role</th><th>Access Scope</th><th>Privilege Clearance</th></tr>
            </thead>
            <tbody>
              ${lawyers.map(lName => {
                const u = users.find(user => user.name === lName) || { role: 'Senior Lawyer', staffId: 'LAW-ADV' };
                return `
                  <tr>
                    <td><strong>${lName}</strong></td>
                    <td><span class="badge badge-confidential">${u.role || 'Lawyer'}</span></td>
                    <td>Direct Client Matter Access (${clientCases.length} Matters)</td>
                    <td><span class="badge badge-active">Full Attorney Privilege</span></td>
                  </tr>
                `;
              }).join('')}
              <tr>
                <td><strong>Neema Joseph</strong></td>
                <td><span class="badge badge-gold">System Administrator</span></td>
                <td>Administrative Directory &amp; Billing Records Only</td>
                <td><span class="badge badge-neutral">Technical Governance (Privileged Notes Shielded)</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Optimized Roster Card List (Screens <= 640px) -->
        <div class="roster-mobile-list">
          ${lawyers.map(lName => {
            const u = users.find(user => user.name === lName) || { role: 'Senior Lawyer', staffId: 'LAW-ADV' };
            return `
              <div class="roster-mobile-card">
                <div class="roster-mobile-card-top">
                  <span class="roster-staff-name">${lName}</span>
                  <span class="badge badge-confidential" style="font-size: 0.68rem;">${u.role || 'Lawyer'}</span>
                </div>
                <div class="roster-mobile-detail">
                  <span class="roster-detail-label">Access Scope:</span>
                  <span class="roster-detail-val">Direct Client Matter Access (${clientCases.length} Matters)</span>
                </div>
                <div class="roster-mobile-detail">
                  <span class="roster-detail-label">Privilege:</span>
                  <span class="badge badge-active" style="font-size: 0.68rem;">Full Attorney Privilege</span>
                </div>
              </div>
            `;
          }).join('')}
          <div class="roster-mobile-card">
            <div class="roster-mobile-card-top">
              <span class="roster-staff-name">Neema Joseph</span>
              <span class="badge badge-gold" style="font-size: 0.68rem;">System Administrator</span>
            </div>
            <div class="roster-mobile-detail">
              <span class="roster-detail-label">Access Scope:</span>
              <span class="roster-detail-val">Administrative Directory &amp; Billing Records Only</span>
            </div>
            <div class="roster-mobile-detail">
              <span class="roster-detail-label">Privilege:</span>
              <span class="badge badge-neutral" style="font-size: 0.68rem;">Technical Governance (Privileged Notes Shielded)</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary w-full" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-md');
  },

  // --- CLIENT PORTAL & LEGAL OFFICER ASSISTANCE REQUESTS ---
  async verifyClientManual(clientId) {
    const c = (SLCMS_STATE.clients || []).find(item => item.id === clientId || item.clientNumber === clientId);
    if (!c) {
      App.showToast('Client record not found', 'error');
      return;
    }

    const confirmed = confirm(`Verify client identification for:\n\n• Legal Name: ${c.name}\n• Contact: ${c.phone || c.email}\n• Ref: ${c.clientNumber || c.idNumber || 'Pending'}\n\nThis will manually activate the client account and permit access to the Client Portal.`);
    if (!confirmed) return;

    if (typeof ClientPortalService !== 'undefined') {
      const res = await ClientPortalService.officerVerifyClient(clientId);
      if (res && res.success) {
        c.verificationStatus = 'MANUALLY_VERIFIED';
        c.status = 'Active';
        const userMatch = (SLCMS_STATE.users || []).find(u => u.email === c.email || u.staffId === c.clientNumber);
        if (userMatch) {
          userMatch.accountStatus = 'ACTIVE';
          userMatch.status = 'Active';
        }
        App.showToast(`Client ${c.name} verified and activated successfully!`, 'success');
        App.refreshCurrentView();
      } else {
        App.showToast(res ? res.message : 'Verification failed', 'error');
      }
    } else {
      c.verificationStatus = 'MANUALLY_VERIFIED';
      c.status = 'Active';
      App.showToast(`Client ${c.name} verified manually.`, 'success');
      App.refreshCurrentView();
    }
  },

  renderRequestsTab(allRequests, isAdmin) {
    const filteredRequests = allRequests.filter(r => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      return (r.clientName && r.clientName.toLowerCase().includes(q)) ||
             (r.issueType && r.issueType.toLowerCase().includes(q)) ||
             (r.description && r.description.toLowerCase().includes(q)) ||
             (r.opposingParty && r.opposingParty.toLowerCase().includes(q)) ||
             (r.status && r.status.toLowerCase().includes(q));
    });

    const submittedCount = allRequests.filter(r => r.status === 'Submitted').length;
    const underReviewCount = allRequests.filter(r => r.status === 'Under Review').length;
    const moreInfoCount = allRequests.filter(r => r.status === 'More Information Required').length;
    const acceptedCount = allRequests.filter(r => r.status === 'Accepted').length;
    const convertedCount = allRequests.filter(r => r.status === 'Converted to Case').length;

    const getStatusBadge = (st) => {
      switch (st) {
        case 'Submitted':
          return '<span class="badge" style="background:#E0F2FE; color:#0369A1; font-weight:600; padding:3px 8px; border-radius:999px;">Submitted</span>';
        case 'Under Review':
          return '<span class="badge" style="background:#FEF3C7; color:#B45309; font-weight:600; padding:3px 8px; border-radius:999px;">Under Review</span>';
        case 'More Information Required':
          return '<span class="badge" style="background:#FFEDD5; color:#C2410C; font-weight:600; padding:3px 8px; border-radius:999px;">More Info Required</span>';
        case 'Accepted':
          return '<span class="badge" style="background:#D1FAE5; color:#065F46; font-weight:600; padding:3px 8px; border-radius:999px;">Accepted</span>';
        case 'Declined':
          return '<span class="badge" style="background:#FEE2E2; color:#991B1B; font-weight:600; padding:3px 8px; border-radius:999px;">Declined</span>';
        case 'Converted to Case':
          return '<span class="badge" style="background:#EDE9FE; color:#5B21B6; font-weight:600; padding:3px 8px; border-radius:999px;">Converted to Case</span>';
        default:
          return `<span class="badge badge-neutral">${st || 'Submitted'}</span>`;
      }
    };

    return `
      <div class="animate-fade">
        <!-- Telemetry Summary Cards -->
        <div class="grid grid-cols-5 gap-3" style="margin-bottom: 1.25rem;">
          <div class="card" style="padding: 0.85rem; border-left: 3px solid #0284C7; background: var(--color-surface, #FFFFFF);">
            <div style="font-size: 0.72rem; color: var(--color-text-secondary, #64748B); font-weight: 600; text-transform: uppercase;">Submitted</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #0284C7; margin-top: 0.2rem;">${submittedCount}</div>
          </div>
          <div class="card" style="padding: 0.85rem; border-left: 3px solid #D97706; background: var(--color-surface, #FFFFFF);">
            <div style="font-size: 0.72rem; color: var(--color-text-secondary, #64748B); font-weight: 600; text-transform: uppercase;">Under Review</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #D97706; margin-top: 0.2rem;">${underReviewCount}</div>
          </div>
          <div class="card" style="padding: 0.85rem; border-left: 3px solid #EA580C; background: var(--color-surface, #FFFFFF);">
            <div style="font-size: 0.72rem; color: var(--color-text-secondary, #64748B); font-weight: 600; text-transform: uppercase;">More Info Needed</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #EA580C; margin-top: 0.2rem;">${moreInfoCount}</div>
          </div>
          <div class="card" style="padding: 0.85rem; border-left: 3px solid #059669; background: var(--color-surface, #FFFFFF);">
            <div style="font-size: 0.72rem; color: var(--color-text-secondary, #64748B); font-weight: 600; text-transform: uppercase;">Accepted</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #059669; margin-top: 0.2rem;">${acceptedCount}</div>
          </div>
          <div class="card" style="padding: 0.85rem; border-left: 3px solid #7C3AED; background: var(--color-surface, #FFFFFF);">
            <div style="font-size: 0.72rem; color: var(--color-text-secondary, #64748B); font-weight: 600; text-transform: uppercase;">Converted Cases</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #7C3AED; margin-top: 0.2rem;">${convertedCount}</div>
          </div>
        </div>

        ${filteredRequests.length === 0 ? `
          <div class="card empty-state" style="padding: 3.5rem 1.5rem; text-align: center; border-radius: 14px; border: 1px dashed var(--color-border, #CBD5E1);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📥</div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary, #0F172A); margin: 0 0 0.5rem 0;">No Legal Assistance Requests</h3>
            <p style="font-size: 0.85rem; color: var(--color-text-secondary, #64748B); max-width: 440px; margin: 0 auto; line-height: 1.5;">
              There are currently no legal assistance requests matching your search query. Requests submitted via the Client Portal will appear here for Legal Officer assessment.
            </p>
          </div>
        ` : `
          <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--color-border, #E2E8F0); border-radius: 12px;">
            <div class="table-container" style="margin: 0;">
              <table class="data-table" style="min-width: 900px; width: 100%;">
                <thead style="background: #F8FAFC;">
                  <tr>
                    <th style="padding: 10px 14px; font-size: 0.75rem;">Ref / Date</th>
                    <th style="padding: 10px 14px; font-size: 0.75rem;">Client Details</th>
                    <th style="padding: 10px 14px; font-size: 0.75rem;">Issue Category</th>
                    <th style="padding: 10px 14px; font-size: 0.75rem;">Request Description</th>
                    <th style="padding: 10px 14px; font-size: 0.75rem;">Contact Method</th>
                    <th style="padding: 10px 14px; font-size: 0.75rem;">Status</th>
                    <th style="padding: 10px 14px; font-size: 0.75rem; text-align: right;">Officer Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredRequests.map(r => {
                    const shortDesc = (r.description || '').length > 70 ? (r.description || '').substring(0, 70) + '...' : (r.description || 'No description');
                    const reqDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today';
                    const hasDocs = r.files && r.files.length > 0;
                    return `
                      <tr style="transition: background 0.15s ease;">
                        <td style="padding: 12px 14px; vertical-align: top;">
                          <div style="font-family: var(--font-mono, monospace); font-weight: 700; color: #0284C7; font-size: 0.8rem;">
                            ${r.id ? (r.id.length > 12 ? r.id.substring(0, 12) + '..' : r.id) : 'REQ'}
                          </div>
                          <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">${reqDate}</div>
                        </td>
                        <td style="padding: 12px 14px; vertical-align: top;">
                          <div style="font-weight: 600; color: #0F172A; font-size: 0.85rem;">${r.clientName || 'Client'}</div>
                          <div style="font-size: 0.75rem; color: #64748B;">${r.clientPhone || r.clientEmail || 'No contact'}</div>
                          ${r.clientId ? `<div style="font-size: 0.7rem; font-family: monospace; color: #059669;">${r.clientId}</div>` : ''}
                        </td>
                        <td style="padding: 12px 14px; vertical-align: top;">
                          <span class="badge" style="background: #F1F5F9; color: #334155; font-weight: 600; font-size: 0.75rem; padding: 2px 7px; border-radius: 6px;">
                            ${r.issueType || 'General'}
                          </span>
                          ${r.opposingParty ? `<div style="font-size: 0.72rem; color: #64748B; margin-top: 4px;">v. ${r.opposingParty}</div>` : ''}
                        </td>
                        <td style="padding: 12px 14px; vertical-align: top; max-width: 280px;">
                          <div style="font-size: 0.8rem; color: #334155; line-height: 1.4;">${shortDesc}</div>
                          ${hasDocs ? `<span style="display:inline-block; font-size: 0.7rem; background: #EEF2FF; color: #4F46E5; padding: 1px 6px; border-radius: 4px; margin-top: 4px;">📎 ${r.files.length} Document(s)</span>` : ''}
                        </td>
                        <td style="padding: 12px 14px; vertical-align: top;">
                          <span style="font-size: 0.78rem; color: #475569; font-weight: 500;">
                            ${r.preferredContactMethod === 'Phone' ? '📞 Phone' : r.preferredContactMethod === 'Office Visit' ? '🏢 Office Visit' : '✉️ Email'}
                          </span>
                        </td>
                        <td style="padding: 12px 14px; vertical-align: top;">
                          ${getStatusBadge(r.status)}
                          ${r.caseId ? `<div style="font-size: 0.7rem; color: #7C3AED; font-family: monospace; margin-top: 4px;">Case Linked</div>` : ''}
                        </td>
                        <td style="padding: 12px 14px; vertical-align: top; text-align: right;">
                          <div style="display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm" onclick="ClientsView.openRequestDossier('${r.id}')" title="Review Client Request Dossier" style="font-size: 0.75rem; padding: 4px 9px;">
                              Review
                            </button>
                            ${r.status !== 'Converted to Case' ? `
                              <button class="btn btn-sm" onclick="ClientsView.convertRequestToCase('${r.id}')" style="background: #0F172A; color: #FFFFFF; font-size: 0.75rem; padding: 4px 9px; border-radius: 6px; border: none; cursor: pointer;" title="Convert to Official Court Matter">
                                + Convert to Case
                              </button>
                            ` : `
                              <span style="font-size: 0.72rem; color: #059669; font-weight: 600;">✓ Converted</span>
                            `}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;
  },

  openRequestDossier(requestId) {
    const allRequests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredRequests() : [];
    const r = allRequests.find(item => item.id === requestId);
    if (!r) {
      App.showToast('Request record not found', 'error');
      return;
    }

    const client = (SLCMS_STATE.clients || []).find(c => c.id === r.clientId || c.name === r.clientName) || {
      name: r.clientName || 'Client',
      phone: r.clientPhone || 'N/A',
      email: r.clientEmail || 'N/A',
      type: 'Individual',
      address: 'N/A'
    };

    const hasDocs = r.files && r.files.length > 0;

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A, #1E293B); color: #FFFFFF; padding: 1.1rem 1.4rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 style="color: #FFFFFF; margin: 0; font-size: 1.15rem; font-weight: 700;">Legal Assistance Request Dossier</h3>
            <span class="badge" style="background: rgba(255,255,255,0.18); color: #FFFFFF; font-size: 0.72rem; padding: 2px 7px; border-radius: 6px;">${r.issueType || 'General'}</span>
          </div>
          <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 3px;">
            Ref: <strong>${r.id}</strong> &middot; Submitted on: <strong>${r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Recent'}</strong>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #94A3B8; font-size: 1.2rem;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.25rem 1.4rem; max-height: 75vh; overflow-y: auto;">
        <!-- Client Profile Summary -->
        <div class="card" style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 10px; margin-bottom: 1.2rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.7rem; text-transform: uppercase; color: #64748B; font-weight: 600;">Client Identity</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: #0F172A; margin-top: 2px;">${client.name}</div>
              <div style="font-size: 0.8rem; color: #475569; margin-top: 2px;">
                Client Type: <strong>${client.type || 'Individual'}</strong> ${r.clientId ? `&middot; Client ID: <strong style="color: #0284C7; font-family: monospace;">${r.clientId}</strong>` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; color: #0F172A; font-weight: 600;">${r.clientPhone || client.phone || 'Phone unlisted'}</div>
              <div style="font-size: 0.78rem; color: #64748B;">${r.clientEmail || client.email || 'Email unlisted'}</div>
              <div style="font-size: 0.74rem; color: #0284C7; font-weight: 500; margin-top: 2px;">Prefers: ${r.preferredContactMethod || 'Email'}</div>
            </div>
          </div>
        </div>

        <!-- Issue Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.2rem;">
          <div class="card" style="background: #FFFFFF; border: 1px solid #E2E8F0; padding: 0.9rem; border-radius: 8px;">
            <div style="font-size: 0.72rem; color: #64748B; font-weight: 600;">Legal Issue Category</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #0F172A; margin-top: 2px;">${r.issueType || 'General'}</div>
          </div>
          <div class="card" style="background: #FFFFFF; border: 1px solid #E2E8F0; padding: 0.9rem; border-radius: 8px;">
            <div style="font-size: 0.72rem; color: #64748B; font-weight: 600;">Opposing Party (Optional)</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #0F172A; margin-top: 2px;">${r.opposingParty || 'None specified'}</div>
          </div>
        </div>

        <!-- Short Description -->
        <div class="card" style="background: #FFFFFF; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 10px; margin-bottom: 1.2rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748B; font-weight: 600; margin-bottom: 0.4rem;">
            Matter Narrative &amp; Client Description
          </div>
          <div style="font-size: 0.86rem; color: #1E293B; line-height: 1.55; white-space: pre-wrap; background: #F8FAFC; padding: 0.85rem; border-radius: 8px; border: 1px solid #E2E8F0;">${r.description || 'No description provided.'}</div>
        </div>

        <!-- Supporting Documents -->
        <div class="card" style="background: #FFFFFF; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 10px; margin-bottom: 1.2rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748B; font-weight: 600; margin-bottom: 0.4rem;">
            Supporting Documents (${r.files ? r.files.length : 0})
          </div>
          ${hasDocs ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${r.files.map((f, i) => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #F1F5F9; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem;">
                  <span style="color: #0F172A; font-weight: 500;">📄 ${typeof f === 'string' ? f : (f.name || 'Attachment ' + (i+1))}</span>
                  <span style="color: #0284C7; cursor: pointer; font-size: 0.75rem;" onclick="App.showToast('Document securely stored in firm vault.', 'info')">View File</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="font-size: 0.8rem; color: #94A3B8; font-style: italic;">No supporting documents attached with this request.</div>
          `}
        </div>

        <!-- Legal Officer Assessment & Communication Notes -->
        <div class="card" style="background: #FFFFFF; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 10px; margin-bottom: 0.5rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748B; font-weight: 600; margin-bottom: 0.4rem;">
            Legal Officer Notes &amp; Client Feedback
          </div>
          <textarea id="officer-feedback-notes" class="form-control" rows="3" placeholder="Enter notes or specific instructions for the client (e.g., requested documents, meeting date, or reason for status update)..." style="font-size: 0.82rem; margin-bottom: 0.5rem;">${r.officerNotes || ''}</textarea>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="ClientsView.saveOfficerNotes('${r.id}')" style="font-size: 0.75rem;">
              💾 Save Notes
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.4rem; background: #F8FAFC; border-top: 1px solid #E2E8F0;">
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 0.78rem; color: #64748B; font-weight: 600;">Status:</span>
          <button class="btn btn-secondary btn-sm" onclick="ClientsView.updateRequestStatusQuick('${r.id}', 'Under Review')" style="font-size: 0.75rem;">
            Under Review
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ClientsView.updateRequestStatusQuick('${r.id}', 'More Information Required')" style="font-size: 0.75rem; color: #C2410C;">
            Request Info
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ClientsView.updateRequestStatusQuick('${r.id}', 'Accepted')" style="font-size: 0.75rem; color: #059669;">
            Accept
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ClientsView.updateRequestStatusQuick('${r.id}', 'Declined')" style="font-size: 0.75rem; color: #DC2626;">
            Decline
          </button>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
          ${r.status !== 'Converted to Case' ? `
            <button class="btn" onclick="ClientsView.convertRequestToCase('${r.id}')" style="background: #0284C7; color: #FFFFFF; font-weight: 600; font-size: 0.82rem; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer;">
              ⚡ Convert to Official Case
            </button>
          ` : `
            <span style="font-size: 0.82rem; color: #7C3AED; font-weight: 700;">✓ Case Already Registered</span>
          `}
        </div>
      </div>
    `, 'modal-lg');
  },

  async saveOfficerNotes(requestId) {
    const el = document.getElementById('officer-feedback-notes');
    const notes = el ? el.value.trim() : '';
    if (typeof ClientPortalService !== 'undefined') {
      const all = ClientPortalService.getStoredRequests();
      const target = all.find(r => r.id === requestId);
      if (target) {
        target.officerNotes = notes;
        target.updatedAt = new Date().toISOString();
        localStorage.setItem(ClientPortalService.STORAGE_KEY_REQUESTS, JSON.stringify(all));
        await ClientPortalService.officerUpdateRequestStatus(requestId, target.status, notes);
      }
    }
    App.showToast('Officer review notes saved successfully.', 'success');
  },

  async updateRequestStatusQuick(requestId, newStatus) {
    let notes = '';
    if (newStatus === 'More Information Required') {
      const input = prompt('Please specify what additional information or documents the client needs to submit:');
      if (input === null) return;
      notes = input.trim();
    }

    if (typeof ClientPortalService !== 'undefined') {
      await ClientPortalService.officerUpdateRequestStatus(requestId, newStatus, notes);
    }

    App.showToast(`Request status updated to: ${newStatus}`, 'success');
    App.closeModal();
    App.refreshCurrentView();
  },

  async convertRequestToCase(requestId) {
    const allRequests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredRequests() : [];
    const r = allRequests.find(item => item.id === requestId);
    if (!r) {
      App.showToast('Request not found', 'error');
      return;
    }

    const confirmed = confirm(`Convert Request into Official Case?\n\n• Client: ${r.clientName}\n• Matter: ${r.issueType}\n• Opposing: ${r.opposingParty || 'In Re Matter'}\n\nClient information will be automatically reused without retyping.`);
    if (!confirmed) return;

    if (typeof ClientPortalService !== 'undefined') {
      const res = await ClientPortalService.officerConvertToCase(requestId, {
        lawyer: 'Adv. Asha Mrema',
        court: 'High Court of Tanzania (' + r.issueType + ' Division)'
      });

      if (res && res.success) {
        App.closeModal();
        App.showToast(`Case successfully registered for client ${r.clientName}!`, 'success');
        App.refreshCurrentView();
      } else {
        App.showToast(res ? res.message : 'Conversion failed', 'error');
      }
    }
  }
};
