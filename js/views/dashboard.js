/* ==========================================================================
   SLCMS - Clean Executive Dashboard View
   Unified, elegant, minimalist design for Lawyers and Legal Officers
   ========================================================================== */

const DashboardView = {
  _caseCategoryFilter: 'all',
  _caseSearchQuery: '',

  setCaseCategoryFilter(cat) {
    this._caseCategoryFilter = cat;
    const el = document.getElementById('lawyer-cases-grid');
    if (el) el.innerHTML = this.renderCasesGrid();
    document.querySelectorAll('.dash-cat-tab').forEach(btn => {
      if (btn.dataset.cat === cat) {
        btn.classList.add('active');
        btn.style.background = '#0F172A';
        btn.style.color = '#FFFFFF';
      } else {
        btn.classList.remove('active');
        btn.style.background = '#F1F5F9';
        btn.style.color = '#64748B';
      }
    });
  },

  filterCasesSearch(q) {
    this._caseSearchQuery = (q || '').trim().toLowerCase();
    const el = document.getElementById('lawyer-cases-grid');
    if (el) el.innerHTML = this.renderCasesGrid();
  },

  renderCasesGrid() {
    const realCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];
    const isLegalOfficer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const role = String(u.role || '').toUpperCase().replace(/[\s_-]+/g, '');
      const title = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toUpperCase().replace(/[\s_-]+/g, '');
      return role.includes('LEGALOFFICER') || title.includes('LEGALOFFICER');
    })();
    
    let filtered = realCases;
    if (this._caseCategoryFilter === 'commercial') {
      filtered = filtered.filter(c => /commercial|bank|financ|corp/i.test(c.caseType || c.type || c.category || c.title || ''));
    } else if (this._caseCategoryFilter === 'civil') {
      filtered = filtered.filter(c => /civil|contract|tort|dispute/i.test(c.caseType || c.type || c.category || c.title || ''));
    } else if (this._caseCategoryFilter === 'land') {
      filtered = filtered.filter(c => /land|property|real/i.test(c.caseType || c.type || c.category || c.title || ''));
    }

    if (this._caseSearchQuery) {
      filtered = filtered.filter(c => {
        const title = (c.title || c.caseTitle || '').toLowerCase();
        const num = (c.caseNumber || '').toLowerCase();
        const client = (c.client || c.clientName || '').toLowerCase();
        const court = (c.court || '').toLowerCase();
        return title.includes(this._caseSearchQuery) || num.includes(this._caseSearchQuery) || client.includes(this._caseSearchQuery) || court.includes(this._caseSearchQuery);
      });
    }

    if (filtered.length === 0) {
      return `
        <div style="grid-column: 1 / -1; padding: 2.5rem 1.5rem; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 14px; text-align: center;">
          <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">📂</div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0 0 0.25rem 0;">No Legal Matters Found</h4>
          <p style="font-size: 0.8rem; color: #64748B; margin: 0 0 1rem 0;">
            No cases match the selected filter. Register a new matter or change the search query.
          </p>
          ${isLegalOfficer ? `
          <button type="button" class="btn" onclick="CasesView.openNewCaseModal()" style="background: #0F172A; color: #FFFFFF; font-size: 0.8rem; font-weight: 600; padding: 0.45rem 1rem; border-radius: 8px; border: none; cursor: pointer;">
            + Register New Case
          </button>
          ` : ''}
        </div>
      `;
    }

    return filtered.slice(0, 6).map(c => {
      const caseNumber = c.caseNumber || 'TZ/HC/2026/01';
      const title = c.title || c.caseTitle || 'Untitled Legal Proceeding';
      const client = c.client || c.clientName || 'Private Client';
      const court = c.court || 'High Court of Tanzania';
      const status = (c.status || 'Active').toUpperCase();
      const progress = c.progressPct || 45;
      const isClosed = status.includes('CLOSED') || status.includes('RESOLVED');

      return `
        <div class="dash-clean-case-card" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.15rem; display: flex; flex-direction: column; justify-content: space-between; transition: border-color 0.15s, box-shadow 0.15s;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; gap: 0.5rem;">
              <span style="font-family: monospace; font-size: 0.74rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.2rem 0.5rem; border-radius: 5px;">
                ${caseNumber}
              </span>
              <span style="font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 9999px; background: ${isClosed ? '#F1F5F9' : '#ECFDF5'}; color: ${isClosed ? '#64748B' : '#059669'};">
                ● ${status}
              </span>
            </div>

            <h4 style="font-size: 0.92rem; font-weight: 700; color: #0F172A; margin: 0 0 0.35rem 0; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; cursor: pointer;" onclick="CasesView.openCaseDetails('${c.id}')" title="${title}">
              ${title}
            </h4>

            <div style="font-size: 0.78rem; color: #64748B; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.35rem;">
              <span>Client:</span>
              <strong style="color: #334155; font-weight: 600;">${client}</strong>
            </div>

            <div style="font-size: 0.74rem; color: #94A3B8; margin-bottom: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${court}
            </div>

            <!-- Clean progress bar -->
            <div style="margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 600; color: #64748B; margin-bottom: 0.2rem;">
                <span>Preparation</span>
                <span style="color: #0F172A;">${progress}%</span>
              </div>
              <div style="height: 4px; width: 100%; background: #F1F5F9; border-radius: 9999px; overflow: hidden;">
                <div style="width: ${progress}%; height: 100%; background: #0284C7; border-radius: 9999px;"></div>
              </div>
            </div>
          </div>

          <!-- Clean Case Actions -->
          <div style="display: flex; align-items: center; gap: 0.45rem; border-top: 1px solid #F1F5F9; padding-top: 0.65rem;">
            <button type="button" onclick="CasesView.openCaseDetails('${c.id}')" style="flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; color: #0F172A; font-size: 0.74rem; font-weight: 600; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer;">
              View Details
            </button>
            ${isLegalOfficer ? `
              <button type="button" onclick="App.navigate('documents', { caseId: '${c.id}' })" style="flex: 1; background: #FFFFFF; border: 1px solid #CBD5E1; color: #0284C7; font-size: 0.74rem; font-weight: 600; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer;">
                Documents
              </button>
            ` : `
              <button type="button" onclick="App.navigate('tasks', { caseId: '${c.id}' })" style="flex: 1; background: #FFFFFF; border: 1px solid #CBD5E1; color: #0284C7; font-size: 0.74rem; font-weight: 600; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer;">
                Tasks
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  render() {
    const user = SLCMS_STATE.currentUser || {};
    const activeCasesCount = SLCMS_STATE.getActiveCasesCount();
    const clientsCount = SLCMS_STATE.getClientsCount();
    const pendingTasksCount = SLCMS_STATE.getPendingTasksCount();
    const upcomingDeadlinesCount = SLCMS_STATE.getUpcomingDeadlinesCount();

    const realCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];
    const totalCasesCount = realCases.length;
    const realTasks = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.tasks)) ? SLCMS_STATE.tasks : [];

    const unreadMessagesCount = (typeof SLCMS_STATE.clientMessages !== 'undefined' && Array.isArray(SLCMS_STATE.clientMessages)) 
      ? SLCMS_STATE.clientMessages.length 
      : 0;

    const isLegalOfficer = (function(u) {
      if (!u) return false;
      const role = String(u.role || '').toUpperCase().replace(/[\s_-]+/g, '');
      const title = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toUpperCase().replace(/[\s_-]+/g, '');
      return role.includes('LEGALOFFICER') || title.includes('LEGALOFFICER');
    })(user);

    const isLawyer = (function(u) {
      if (!u) return false;
      const role = String(u.role || '').toLowerCase();
      const title = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return role.includes('lawyer') || title.includes('lawyer') || role.includes('advocate') || title.includes('advocate');
    })(user);

    const documentsCount = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.documents)) 
      ? SLCMS_STATE.documents.length 
      : 12;

    return `
      <!-- MINIMAL EXECUTIVE STYLING -->
      <style id="dash-clean-executive-styles">
        .dash-kpi-grid-6 {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
        }
        .dash-kpi-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }
        .dash-kpi-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 1200px) {
          .dash-kpi-grid-6 { grid-template-columns: repeat(3, 1fr); }
          .dash-kpi-grid-5 { grid-template-columns: repeat(3, 1fr); }
          .dash-kpi-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .dash-kpi-grid-6 { grid-template-columns: repeat(2, 1fr); }
          .dash-kpi-grid-5 { grid-template-columns: 1fr; }
          .dash-kpi-grid-4 { grid-template-columns: 1fr; }
        }
        .dash-clean-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 1.1rem;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
          transition: border-color 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .dash-clean-card:hover {
          border-color: #0284C7;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
        }
        .dash-cases-grid-3col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 1050px) {
          .dash-cases-grid-3col { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .dash-cases-grid-3col { grid-template-columns: 1fr; }
        }
        .dash-two-col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 860px) {
          .dash-two-col { grid-template-columns: 1fr; }
        }
      </style>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">

        <!-- 1. SLEEK EXECUTIVE HEADER -->
        <div style="background: #0F172A; border-radius: 14px; padding: 1.35rem 1.65rem; color: #FFFFFF; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.2rem;">
              <h1 style="font-size: 1.35rem; font-weight: 700; margin: 0; color: #FFFFFF; letter-spacing: -0.01em;">
                Welcome, ${user.name ? (isLegalOfficer ? user.name : (user.name.startsWith('Adv.') ? user.name : 'Adv. ' + user.name)) : (isLegalOfficer ? 'Legal Officer' : 'Counsel')}
              </h1>
              <span style="font-size: 0.7rem; font-weight: 600; background: rgba(255, 255, 255, 0.12); color: #E2E8F0; padding: 0.15rem 0.55rem; border-radius: 4px;">
                ${isLegalOfficer ? (user.roleLabel || user.role || 'Legal Officer') : (user.role || 'Senior Lawyer')}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: #94A3B8;">
              ${isLegalOfficer 
                ? 'Corporate Legal Affairs, Case Intake &amp; Document Governance' 
                : 'Commercial &amp; Civil Litigation • High Court of Tanzania'}
            </div>
          </div>

          <!-- Quick Action Buttons in Header -->
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            ${isLegalOfficer ? `
              <button type="button" class="btn" onclick="CasesView.openNewCaseModal()" style="background: #0284C7; color: #FFFFFF; font-size: 0.8rem; font-weight: 600; padding: 0.45rem 0.95rem; border-radius: 8px; border: none; cursor: pointer;">
                + Register Case
              </button>
              <button type="button" class="btn" onclick="App.navigate('reports')" style="background: rgba(255, 255, 255, 0.1); color: #FFFFFF; font-size: 0.8rem; font-weight: 600; padding: 0.45rem 0.85rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;">
                Reports
              </button>
            ` : `
              <button type="button" class="btn" onclick="App.navigate('case-library')" style="background: rgba(255, 255, 255, 0.15); color: #FFFFFF; font-size: 0.8rem; font-weight: 600; padding: 0.45rem 0.85rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.3); cursor: pointer;" title="Explore 77 cases from TanzLII">
                🏛️ TanzLII Cases (77)
              </button>
              <button type="button" class="btn" onclick="App.navigate('reports')" style="background: rgba(255, 255, 255, 0.1); color: #FFFFFF; font-size: 0.8rem; font-weight: 600; padding: 0.45rem 0.85rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;">
                Reports
              </button>
            `}
          </div>
        </div>

        <!-- 2. CLEAN UNIFIED KPI METRIC CARDS -->
        ${isLegalOfficer ? `
          <div class="dash-kpi-grid-6">
            <!-- 1. Clients -->
            <div class="dash-clean-card" onclick="App.navigate('clients')" title="Open Clients Directory">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Clients</span>
                <span style="font-size: 1rem;">👥</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${clientsCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Directory ➔</div>
            </div>

            <!-- 2. Case Registration -->
            <div class="dash-clean-card" onclick="CasesView.openNewCaseModal()" title="Register New Case">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Case Registration</span>
                <span style="font-size: 1rem;">📝</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${totalCasesCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">+ Register ➔</div>
            </div>

            <!-- 3. Documents -->
            <div class="dash-clean-card" onclick="App.navigate('documents')" title="Open Document Vault">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Documents</span>
                <span style="font-size: 1rem;">📄</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${documentsCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Vault ➔</div>
            </div>

            <!-- 4. Tasks & Deadlines -->
            <div class="dash-clean-card" onclick="App.navigate('tasks')" title="View Tasks & Deadlines">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Tasks &amp; Deadlines</span>
                <span style="font-size: 1rem;">⏱️</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${pendingTasksCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Milestones ➔</div>
            </div>

            <!-- 5. Client Messages -->
            <div class="dash-clean-card" onclick="App.navigate('client-messages')" title="Open Client Messages">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Client Messages</span>
                <span style="font-size: 1rem;">💬</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${unreadMessagesCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Messages ➔</div>
            </div>

            <!-- 6. Reports -->
            <div class="dash-clean-card" onclick="App.navigate('reports')" title="View Reports">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Reports</span>
                <span style="font-size: 1rem;">📊</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                Active
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Analytics ➔</div>
            </div>
          </div>
        ` : `
          <div class="dash-kpi-grid-5">
            <!-- 1. Active Cases -->
            <div class="dash-clean-card" onclick="App.navigate('cases')" title="View Active Cases">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Active Cases</span>
                <span style="font-size: 1rem;">📂</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${activeCasesCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">${totalCasesCount} Total Registered ➔</div>
            </div>

            <!-- 2. Pending Tasks -->
            <div class="dash-clean-card" onclick="App.navigate('tasks')" title="View Pending Tasks">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Pending Tasks</span>
                <span style="font-size: 1rem;">⏱️</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${pendingTasksCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Actionable Items ➔</div>
            </div>

            <!-- 3. Court Deadlines -->
            <div class="dash-clean-card" onclick="App.navigate('tasks')" title="View Court Hearings">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Court Deadlines</span>
                <span style="font-size: 1rem;">🏛️</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${upcomingDeadlinesCount || 2}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Hearings &amp; Mentions ➔</div>
            </div>

            <!-- 4. Client Messages -->
            <div class="dash-clean-card" onclick="App.navigate('client-messages')" title="Open Client Messages">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748B;">Client Messages</span>
                <span style="font-size: 1rem;">💬</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                ${unreadMessagesCount}
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">Inquiries ➔</div>
            </div>

            <!-- 5. TanzLII Cases -->
            <div class="dash-clean-card" onclick="App.navigate('case-library')" title="Explore 77 TanzLII Precedents" style="border-left: 3px solid #0284C7;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #0284C7;">TanzLII Cases</span>
                <span style="font-size: 1rem;">⚖️</span>
              </div>
              <div style="font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.3rem;">
                77
              </div>
              <div style="font-size: 0.72rem; font-weight: 600; color: #0284C7;">77 Cases from TanzLII ➔</div>
            </div>
          </div>
        `}

        <!-- 3. CASE DOCKET (CLEAN, FOCUSED) -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.35rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.55rem;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #0F172A; margin: 0;">
                ${isLegalOfficer ? 'Case Registration &amp; Docket' : 'Active Cases &amp; Docket'}
              </h3>
              <span style="font-size: 0.7rem; font-weight: 700; background: #F1F5F9; color: #475569; padding: 0.15rem 0.5rem; border-radius: 9999px;">
                ${realCases.length}
              </span>
            </div>

            <!-- Filter Tabs & Search & Add Button -->
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; background: #F1F5F9; padding: 0.2rem; border-radius: 7px; gap: 0.2rem;">
                <button type="button" class="dash-cat-tab active" data-cat="all" onclick="DashboardView.setCaseCategoryFilter('all')" style="background: #0F172A; color: #FFFFFF; border: none; font-size: 0.74rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer;">
                  All
                </button>
                <button type="button" class="dash-cat-tab" data-cat="commercial" onclick="DashboardView.setCaseCategoryFilter('commercial')" style="background: #F1F5F9; color: #64748B; border: none; font-size: 0.74rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer;">
                  Commercial
                </button>
                <button type="button" class="dash-cat-tab" data-cat="civil" onclick="DashboardView.setCaseCategoryFilter('civil')" style="background: #F1F5F9; color: #64748B; border: none; font-size: 0.74rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer;">
                  Civil
                </button>
                <button type="button" class="dash-cat-tab" data-cat="land" onclick="DashboardView.setCaseCategoryFilter('land')" style="background: #F1F5F9; color: #64748B; border: none; font-size: 0.74rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer;">
                  Land
                </button>
                <button type="button" class="dash-cat-tab" data-cat="tanzlii" onclick="App.navigate('case-library')" style="background: #EFF6FF; color: #0284C7; border: 1px solid #BFDBFE; font-size: 0.74rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer;" title="Browse 77 cases from TanzLII">
                  🏛️ TanzLII Cases (77)
                </button>
              </div>

              <input type="text" placeholder="Search cases..." oninput="DashboardView.filterCasesSearch(this.value)" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 7px; padding: 0.35rem 0.65rem; font-size: 0.78rem; width: 150px; color: #0F172A; outline: none;">

              ${isLegalOfficer ? `
              <button type="button" class="btn" onclick="CasesView.openNewCaseModal()" style="background: #0284C7; color: #FFFFFF; font-size: 0.78rem; font-weight: 600; padding: 0.4rem 0.85rem; border-radius: 7px; border: none; cursor: pointer;">
                + Register Case
              </button>
              ` : ''}
            </div>
          </div>

          <!-- Cases Grid -->
          <div class="dash-cases-grid-3col" id="lawyer-cases-grid">
            ${this.renderCasesGrid()}
          </div>
        </div>

        <!-- 4. TASKS & COURT DEADLINES (2-COLUMN FOCUSED VIEW) -->
        <div class="dash-two-col">
          <!-- Left: Scheduled Court Appearances -->
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.35rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                  <span style="font-size: 1.05rem;">🏛️</span>
                  <h3 style="font-size: 0.96rem; font-weight: 700; color: #0F172A; margin: 0;">Upcoming Court Hearings</h3>
                </div>
                <button type="button" onclick="App.navigate('tasks')" style="background: none; border: none; color: #0284C7; font-size: 0.74rem; font-weight: 600; cursor: pointer;">
                  Calendar ➔
                </button>
              </div>

              ${(() => {
                const events = (typeof TasksView !== 'undefined' && Array.isArray(TasksView.courtEvents) && TasksView.courtEvents.length > 0)
                  ? TasksView.courtEvents
                  : [
                    { title: 'Hearing of Chamber Summons', date: 'Oct 14, 2026', court: 'High Court Commercial Division', caseNumber: 'HC/COMM/2026/049', priority: 'HIGH', monthShort: 'OCT', dayNum: '14' },
                    { title: 'Filing of Written Statement of Defence', date: 'Oct 19, 2026', court: 'High Court Land Division', caseNumber: 'HC/LAND/2026/012', priority: 'URGENT', monthShort: 'OCT', dayNum: '19' }
                  ];

                return events.slice(0, 2).map(e => `
                  <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 0.55rem;">
                    <div style="width: 38px; height: 38px; border-radius: 6px; background: #0F172A; color: #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="font-size: 0.55rem; font-weight: 700;">${e.monthShort || 'DUE'}</span>
                      <span style="font-size: 0.95rem; font-weight: 800; line-height: 1;">${e.dayNum || '14'}</span>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 0.82rem; font-weight: 700; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${e.title}
                      </div>
                      <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.1rem;">
                        ${e.caseNumber || 'HC/2026'} • ${e.court || 'High Court of Tanzania'}
                      </div>
                    </div>
                    <span style="font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; background: #F1F5F9; color: #475569; flex-shrink: 0;">
                      ${e.priority || 'HEARING'}
                    </span>
                  </div>
                `).join('');
              })()}
            </div>
            
            ${isLawyer ? '' : `
            <button type="button" onclick="TasksView.openNewTaskModal()" style="margin-top: 0.5rem; width: 100%; background: #F8FAFC; border: 1px dashed #CBD5E1; color: #475569; font-size: 0.76rem; font-weight: 600; padding: 0.45rem; border-radius: 6px; cursor: pointer;">
              + Schedule Hearing
            </button>
            `}
          </div>

          <!-- Right: Actionable Tasks Checklist -->
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.35rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                  <span style="font-size: 1.05rem;">✅</span>
                  <h3 style="font-size: 0.96rem; font-weight: 700; color: #0F172A; margin: 0;">Actionable Tasks</h3>
                </div>
                <button type="button" onclick="App.navigate('tasks')" style="background: none; border: none; color: #0284C7; font-size: 0.74rem; font-weight: 600; cursor: pointer;">
                  All Tasks ➔
                </button>
              </div>

              ${realTasks.length === 0 ? `
                <div style="padding: 1.25rem; text-align: center; color: #64748B;">
                  <div style="font-size: 0.82rem;">All casework tasks are up to date.</div>
                </div>
              ` : realTasks.slice(0, 2).map(t => {
                const isCompleted = (t.status || '').toLowerCase() === 'completed';
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.65rem; padding: 0.7rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 0.55rem;">
                    <div style="display: flex; align-items: center; gap: 0.55rem; flex: 1; min-width: 0;">
                      <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="TasksView.toggleTaskStatus('${t.id}')" style="cursor: pointer; width: 16px; height: 16px; accent-color: #0284C7; flex-shrink: 0;">
                      <div style="min-width: 0;">
                        <div style="font-size: 0.82rem; font-weight: 600; color: #0F172A; ${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                          ${t.title}
                        </div>
                        <div style="font-size: 0.7rem; color: #64748B;">
                          ${t.caseTitle || t.caseNumber || 'Matter'}
                        </div>
                      </div>
                    </div>
                    <span style="font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 4px; background: #F1F5F9; color: #475569; flex-shrink: 0;">
                      ${t.priority || 'Normal'}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>

            ${isLawyer ? '' : `
            <button type="button" onclick="TasksView.openNewTaskModal()" style="margin-top: 0.5rem; width: 100%; background: #F8FAFC; border: 1px dashed #CBD5E1; color: #475569; font-size: 0.76rem; font-weight: 600; padding: 0.45rem; border-radius: 6px; cursor: pointer;">
              + Create Task
            </button>
            `}
          </div>
        </div>

      </div>
    `;
  },

  initCharts() {
    // Clean dashboard uses streamlined cards without bloated heavy canvas charts
  }
};
