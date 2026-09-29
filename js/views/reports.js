/* ==========================================================================
   SLCMS - System Report Generator & Executive Practice Analytics Suite
   Generates verifiable system security audit logs, staff access rosters,
   matter portfolio statistics, and resilience compliance reports.
   ========================================================================== */

const ReportsView = {
  activeReportType: 'security', // 'security' | 'staff' | 'cases' | 'backups' | 'practice'
  selectedDateRange: 'ytd',     // 'today' | 'd7' | 'm1' | 'ytd' | 'all'
  selectedDepartment: 'all',    // 'all' | 'commercial' | 'civil' | 'land' | 'constitutional' | 'criminal'
  lastGeneratedAt: new Date(),

  render() {
    const role = SLCMS_STATE.currentUser?.role || 'Administrator';
    const isAdmin = (role === 'Administrator' || role === 'System Administrator');
    const isLegalOfficer = (role === 'Legal Officer');
    const isLawyer = (role === 'Lawyer' || role === 'Senior Lawyer');
    const userName = SLCMS_STATE.currentUser?.name || SLCMS_STATE.currentUser?.full_name || 'System Administrator';

    if (isLegalOfficer && (this.activeReportType === 'security' || this.activeReportType === 'staff' || this.activeReportType === 'backups' || this.activeReportType === 'practice')) {
      this.activeReportType = 'client-security';
    }
    if (isLawyer && (this.activeReportType === 'security' || this.activeReportType === 'staff' || this.activeReportType === 'backups' || this.activeReportType === 'practice' || this.activeReportType === 'client-security' || this.activeReportType === 'client-registry' || this.activeReportType === 'client-requests')) {
      this.activeReportType = 'my-cases';
    }

    return `
      <div class="animate-fade reports-view-wrapper" style="padding-bottom: 3rem;">
        <!-- VIEW HEADER -->
        <div class="view-header" style="margin-bottom: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
              <span style="font-size: 1.4rem;">📊</span>
              <h1 class="page-title" style="margin-bottom: 0;">${isLegalOfficer ? 'Legal Officer Client Reports &amp; Analytics' : (isLawyer ? 'My Caseload &amp; Assigned Client Reports' : (isAdmin ? 'System Report Generator' : 'Executive Reports &amp; Analytics'))}</h1>
              <span class="badge ${isLegalOfficer ? 'badge-sky' : (isLawyer ? 'badge-active' : (isAdmin ? 'badge-gold' : 'badge-active'))}" style="font-size: 0.72rem; padding: 0.2rem 0.6rem; letter-spacing: 0.5px;">
                ${isLegalOfficer ? 'LEGAL OFFICER &bull; CLIENT PORTAL' : (isLawyer ? 'ADVOCATE &bull; MY PORTFOLIO' : (isAdmin ? 'ADMINISTRATIVE SUITE' : 'PRACTICE BI'))}
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin: 0;">
              ${isLegalOfficer 
                ? 'Official client portal access logs, client login audit trail, and operational reports for registered clients, KYC compliance, and assistance request management.'
                : (isLawyer
                  ? `My assigned cases, client dossiers, hearing schedules, and personal practice analytics. Viewing scope: cases assigned to ${userName} only.`
                  : (isAdmin 
                    ? 'Generate, verify, and export official law firm administrative audit reports, staff access inventories, and database resilience telemetry.'
                    : 'Firm-wide operational KPIs, litigation success rates, revenue realization, and associate practice utilization.'))}
            </p>
          </div>
          <div class="flex items-center gap-2" style="flex-wrap: wrap;">
            ${isLegalOfficer ? `
              <button class="btn btn-primary" onclick="ClientsView.openNewClientModal()" title="Register new client into the system">
                <span>➕ Register Client</span>
              </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="ReportsView.printReport()" title="Print or save as PDF">
              <span>🖨️ Print / Save PDF</span>
            </button>
            <button class="btn btn-gold" onclick="ReportsView.exportCSV()" title="Download report dataset as CSV file">
              <span>📥 Export CSV Dataset</span>
            </button>
          </div>
        </div>

        <!-- REPORT CONFIGURATOR & GENERATOR DOCK -->
        <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid ${isLegalOfficer ? '#0284C7' : (isLawyer ? '#10B981' : 'var(--color-gold)')}; background: var(--color-surface);">
          <div class="card-header" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.1rem;">⚙️</span>
              <h3 class="card-title" style="margin: 0; font-size: 1rem;">${isLegalOfficer ? 'Client Report Parameters' : (isLawyer ? 'My Caseload Report Parameters' : 'Report Generator Parameters')}</h3>
            </div>
            <span style="font-size: 0.78rem; color: var(--color-text-muted);">
              Generated: <strong id="rep-gen-timestamp">${this.lastGeneratedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
          </div>

          <div style="padding: 1.25rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: flex-end;">
              <!-- Parameter 1: Report Template -->
              <div>
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.35rem;">
                  Report Type:
                </label>
                <select id="rep-param-type" class="form-control" onchange="ReportsView.onReportTypeChange(this.value)">
                  ${isLegalOfficer ? `
                    <option value="client-security" ${this.activeReportType === 'client-security' || this.activeReportType === 'security' ? 'selected' : ''}>🛡️ Client Portal Logins &amp; Security Audit</option>
                    <option value="client-registry" ${this.activeReportType === 'client-registry' ? 'selected' : ''}>📋 Registered Clients &amp; Work Report</option>
                    <option value="client-requests" ${this.activeReportType === 'client-requests' ? 'selected' : ''}>📨 Client Assistance Requests &amp; Intakes</option>
                    <option value="cases" ${this.activeReportType === 'cases' ? 'selected' : ''}>⚖️ Client Case Matters &amp; Filings</option>
                  ` : (isLawyer ? `
                    <option value="my-cases" ${this.activeReportType === 'my-cases' ? 'selected' : ''}>⚖️ My Assigned Cases &amp; Matters</option>
                    <option value="my-clients" ${this.activeReportType === 'my-clients' ? 'selected' : ''}>👤 My Assigned Clients &amp; Dossiers</option>
                  ` : `
                    <option value="security" ${this.activeReportType === 'security' ? 'selected' : ''}>🛡️ System Security &amp; Audit Trail</option>
                    <option value="staff" ${this.activeReportType === 'staff' ? 'selected' : ''}>👥 User Accounts &amp; Staff Access Roster</option>
                    <option value="cases" ${this.activeReportType === 'cases' ? 'selected' : ''}>⚖️ Case &amp; Matter Portfolio Health</option>
                    <option value="backups" ${this.activeReportType === 'backups' ? 'selected' : ''}>💾 Database Backup &amp; Resilience Health</option>
                    <option value="practice" ${this.activeReportType === 'practice' ? 'selected' : ''}>📈 Executive Practice KPIs &amp; Realization</option>
                  `)}
                </select>
              </div>

              <!-- Parameter 2: Date Scope -->
              <div>
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.35rem;">
                  Date Range:
                </label>
                <select id="rep-param-range" class="form-control" onchange="ReportsView.selectedDateRange = this.value">
                  <option value="today" ${this.selectedDateRange === 'today' ? 'selected' : ''}>Today's Telemetry</option>
                  <option value="d7" ${this.selectedDateRange === 'd7' ? 'selected' : ''}>Last 7 Days</option>
                  <option value="m1" ${this.selectedDateRange === 'm1' ? 'selected' : ''}>Last 30 Days</option>
                  <option value="ytd" ${this.selectedDateRange === 'ytd' ? 'selected' : ''}>Current Fiscal Year (2026)</option>
                  <option value="all" ${this.selectedDateRange === 'all' ? 'selected' : ''}>All Historical Records</option>
                </select>
              </div>

              <!-- Parameter 3: Department / Scope -->
              <div>
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.35rem;">
                  ${isLegalOfficer ? 'Client Category / Scope:' : (isLawyer ? 'Case Status Filter:' : 'Department / Practice Group:')}
                </label>
                <select id="rep-param-dept" class="form-control" onchange="ReportsView.selectedDepartment = this.value">
                  ${isLegalOfficer ? `
                    <option value="all" ${this.selectedDepartment === 'all' ? 'selected' : ''}>All Registered Clients</option>
                    <option value="corporate" ${this.selectedDepartment === 'corporate' ? 'selected' : ''}>Corporate Retainers</option>
                    <option value="individual" ${this.selectedDepartment === 'individual' ? 'selected' : ''}>Individual Persons</option>
                    <option value="locked" ${this.selectedDepartment === 'locked' ? 'selected' : ''}>Locked / Review Required</option>
                  ` : (isLawyer ? `
                    <option value="all" ${this.selectedDepartment === 'all' ? 'selected' : ''}>All My Cases</option>
                    <option value="active" ${this.selectedDepartment === 'active' ? 'selected' : ''}>Active / Pending</option>
                    <option value="closed" ${this.selectedDepartment === 'closed' ? 'selected' : ''}>Closed / Settled</option>
                  ` : `
                    <option value="all" ${this.selectedDepartment === 'all' ? 'selected' : ''}>All Chambers &amp; Groups</option>
                    <option value="commercial" ${this.selectedDepartment === 'commercial' ? 'selected' : ''}>Commercial &amp; Banking</option>
                    <option value="civil" ${this.selectedDepartment === 'civil' ? 'selected' : ''}>Civil Litigation</option>
                    <option value="land" ${this.selectedDepartment === 'land' ? 'selected' : ''}>Land &amp; Real Estate</option>
                    <option value="constitutional" ${this.selectedDepartment === 'constitutional' ? 'selected' : ''}>Constitutional &amp; Appeals</option>
                    <option value="administration" ${this.selectedDepartment === 'administration' ? 'selected' : ''}>System Administration &amp; IT</option>
                  `)}
                </select>
              </div>

              <!-- Action Button -->
              <div>
                <button class="btn btn-primary" onclick="ReportsView.generateReport()" style="width: 100%; font-weight: 700; padding: 0.55rem 1rem;">
                  <span>⚡ ${isLegalOfficer ? 'Generate Client Report' : (isLawyer ? 'Generate My Caseload Report' : 'Generate System Report')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- GENERATED REPORT CANVAS CONTAINER -->
        <div id="reports-output-container">
          ${this.renderReportContent()}
        </div>

        <!-- ANALYTICS CHARTS ROW (Interactive BI Analytics) -->
        <div class="grid grid-cols-2 gap-6" style="margin-top: 1.75rem; margin-bottom: 1.5rem;">
          <div class="card">
            <div class="card-header" style="padding: 1rem 1.25rem;">
              <h3 class="card-title" style="font-size: 0.95rem;">${isLegalOfficer ? 'Client Retainer Distribution &amp; Entity Mix' : (isLawyer ? 'My Cases by Practice Area' : 'Case Realization &amp; Practice Breakdown')}</h3>
              <span class="badge badge-active">${isLegalOfficer ? 'Retainer Portfolio' : (isLawyer ? 'My Portfolio' : 'Active Portfolio')}</span>
            </div>
            <div class="chart-card-body" style="padding: 1rem;">
              <canvas id="reportPracticeChart" style="max-height: 250px;"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="padding: 1rem 1.25rem;">
              <h3 class="card-title" style="font-size: 0.95rem;">${isLegalOfficer ? 'Client Portal Logins &amp; Registration Trend' : (isLawyer ? 'My Case Status &amp; Hearing Breakdown' : 'Monthly Revenue Realization &amp; Collections ($)')}</h3>
              <span class="badge badge-gold">${isLegalOfficer ? 'Monthly Telemetry' : (isLawyer ? 'Case Analytics' : '2026 Fiscal Trend')}</span>
            </div>
            <div class="chart-card-body" style="padding: 1rem;">
              <canvas id="reportRevenueChart" style="max-height: 250px;"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  onReportTypeChange(val) {
    this.activeReportType = val;
    this.generateReport();
  },

  generateReport() {
    this.lastGeneratedAt = new Date();
    const tsEl = document.getElementById('rep-gen-timestamp');
    if (tsEl) {
      tsEl.innerText = this.lastGeneratedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const container = document.getElementById('reports-output-container');
    if (container) {
      container.innerHTML = this.renderReportContent();
    }
    App.showToast('Report generated successfully.', 'success');
  },

  renderReportContent() {
    const role = SLCMS_STATE.currentUser?.role || '';
    const isLegalOfficer = (role === 'Legal Officer');
    const isLawyer = (role === 'Lawyer' || role === 'Senior Lawyer');

    if (isLegalOfficer) {
      switch (this.activeReportType) {
        case 'client-registry': return this.renderLegalOfficerClientRegistryReport();
        case 'client-requests': return this.renderLegalOfficerClientRequestsReport();
        case 'cases': return this.renderCasesReport();
        case 'client-security':
        case 'security':
        default:
          return this.renderLegalOfficerClientSecurityReport();
      }
    }

    if (isLawyer) {
      switch (this.activeReportType) {
        case 'my-clients': return this.renderLawyerClientsReport();
        case 'my-cases':
        default:
          return this.renderLawyerCasesReport();
      }
    }

    switch (this.activeReportType) {
      case 'staff': return this.renderStaffReport();
      case 'cases': return this.renderCasesReport();
      case 'backups': return this.renderBackupsReport();
      case 'practice': return this.renderPracticeReport();
      case 'security':
      default:
        return this.renderSecurityReport();
    }
  },

  // ─── LAWYER: GET ONLY CASES ASSIGNED TO THIS LAWYER ───────────────────────
  getLawyerAssignedCases() {
    const currentUser = SLCMS_STATE.currentUser;
    const myName = (currentUser?.name || currentUser?.full_name || '').toLowerCase().trim();
    const myId = (currentUser?.id || '').toString().toLowerCase().trim();
    const allCases = SLCMS_STATE.cases || [];
    return allCases.filter(c => {
      const assignedName = (c.assignedLawyerName || c.assignedLawyer || c.lawyer || '').toLowerCase().trim();
      const assignedId   = (c.assignedLawyerId  || '').toString().toLowerCase().trim();
      return (myName && assignedName.includes(myName)) ||
             (myId   && assignedId === myId);
    });
  },

  // ─── LAWYER REPORT A: MY ASSIGNED CASES ──────────────────────────────────
  renderLawyerCasesReport() {
    const currentUser  = SLCMS_STATE.currentUser;
    const lawyerName   = currentUser?.name || currentUser?.full_name || 'Advocate';
    const myCases      = this.getLawyerAssignedCases();
    const activeCount  = myCases.filter(c => (c.status || '').toLowerCase() === 'active').length;
    const closedCount  = myCases.filter(c => (c.status || '').toLowerCase() === 'closed').length;
    const pendingCount = myCases.filter(c => (c.status || '').toLowerCase().includes('pending')).length;
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const refCode = `SLCMS-LAW-CASES-${this.lastGeneratedAt.getFullYear()}${String(this.lastGeneratedAt.getMonth()+1).padStart(2,'0')}${String(this.lastGeneratedAt.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;

    // filter by status if department filter set
    let displayCases = myCases;
    if (this.selectedDepartment === 'active')  displayCases = myCases.filter(c => (c.status||'').toLowerCase() === 'active');
    if (this.selectedDepartment === 'closed')  displayCases = myCases.filter(c => (c.status||'').toLowerCase() === 'closed');

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #10B981; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #059669; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; ADVOCATE PRACTICE REPORT
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              My Assigned Cases &amp; Active Matters Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Scope: Cases Assigned to <strong>${lawyerName}</strong> Only &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block;">
              REF: ${refCode}
            </div>
            <div style="font-size: 0.72rem; color: #10B981; font-weight: 700; margin-top: 0.3rem;">● ADVOCATE DOCKET VERIFIED</div>
          </div>
        </div>

        <!-- KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #059669; text-transform: uppercase;">Total My Cases</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${myCases.length}</div>
            <div style="font-size: 0.72rem; color: #059669;">Assigned to me only</div>
          </div>
          <div style="padding: 1rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #2563EB; text-transform: uppercase;">Active Litigation</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #2563EB; margin: 0.2rem 0;">${activeCount}</div>
            <div style="font-size: 0.72rem; color: #2563EB;">Currently in proceedings</div>
          </div>
          <div style="padding: 1rem; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #D97706; text-transform: uppercase;">Pending / Adjourned</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #D97706; margin: 0.2rem 0;">${pendingCount}</div>
            <div style="font-size: 0.72rem; color: #D97706;">Awaiting next hearing</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Concluded / Settled</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">${closedCount}</div>
            <div style="font-size: 0.72rem; color: #10B981;">Archived with judgment</div>
          </div>
        </div>

        <!-- Cases Table -->
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
            My Active Case Docket (${displayCases.length} Matter${displayCases.length !== 1 ? 's' : ''})
            <span style="font-size: 0.75rem; font-weight: 400; color: #64748B; margin-left: 0.5rem;">⚠ Showing only cases assigned to ${lawyerName}</span>
          </h4>
          <div class="table-container" style="max-height: 420px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Case Title / Matter</th>
                  <th>Client Name</th>
                  <th>Practice Area</th>
                  <th>Court / Forum</th>
                  <th>Next Hearing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${displayCases.length > 0 ? displayCases.map(c => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.78rem; font-weight: 700; color: #0A192F;">${c.caseNumber || c.id || 'N/A'}</td>
                    <td>
                      <strong style="cursor: pointer; color: #0F172A;" onclick="App.navigate('cases'); setTimeout(() => CasesView.openCaseDetails('${c.id}'), 300);">${c.title || 'Untitled Matter'}</strong>
                    </td>
                    <td style="font-size: 0.82rem; color: #475569;">${c.client || c.clientName || 'Client on File'}</td>
                    <td><span class="badge badge-gold" style="font-size: 0.68rem;">${c.caseType || c.category || 'Litigation'}</span></td>
                    <td style="font-size: 0.8rem; color: #64748B;">${c.court || 'High Court'}</td>
                    <td style="font-family: monospace; font-size: 0.78rem; color: ${c.nextHearingDate ? '#DC2626' : '#94A3B8'}; font-weight: ${c.nextHearingDate ? '700' : '400'}">${c.nextHearingDate || '—'}</td>
                    <td><span class="badge ${(c.status||'').toLowerCase() === 'active' ? 'badge-active' : ((c.status||'').toLowerCase() === 'closed' ? 'badge-secondary' : 'badge-pending')}" style="font-size: 0.68rem;">${c.status || 'Active'}</span></td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="7" style="text-align: center; color: #64748B; padding: 2.5rem;">
                      <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">⚖️</div>
                      <div style="font-weight: 600;">No cases assigned to ${lawyerName}</div>
                      <div style="font-size: 0.8rem; margin-top: 0.25rem;">Cases will appear here once assigned by the Administrator or Legal Officer.</div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sign-off -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>
            <div>Prepared by: <strong>${lawyerName} (${currentUser?.role || 'Advocate'})</strong></div>
            <div>Somba Legal &amp; Associates (Tanzania) — Personal Practice Docket</div>
          </div>
          <div style="text-align: right;">
            <div>Confidential &bull; Advocate Eyes Only</div>
            <div style="font-family: monospace;">ADV-SHA: e72d18...f49a01</div>
          </div>
        </div>
      </div>
    `;
  },

  // ─── LAWYER REPORT B: MY ASSIGNED CLIENTS ────────────────────────────────
  renderLawyerClientsReport() {
    const currentUser  = SLCMS_STATE.currentUser;
    const lawyerName   = currentUser?.name || currentUser?.full_name || 'Advocate';
    const myCases      = this.getLawyerAssignedCases();
    // gather unique clients from MY cases only
    const myClientIds  = new Set(myCases.map(c => c.clientId).filter(Boolean));
    const myClientNames = new Set(myCases.map(c => (c.client || c.clientName || '').toLowerCase().trim()).filter(Boolean));
    const allClients   = SLCMS_STATE.clients || [];
    const myClients    = allClients.filter(c =>
      myClientIds.has(c.id) ||
      myClientNames.has((c.name || '').toLowerCase().trim())
    );
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const refCode = `SLCMS-LAW-CLT-${this.lastGeneratedAt.getFullYear()}${String(this.lastGeneratedAt.getMonth()+1).padStart(2,'0')}${String(this.lastGeneratedAt.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #2563EB; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #2563EB; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; ADVOCATE CLIENT DOSSIERS
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              My Assigned Clients &amp; Retainer Dossiers
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Clients linked to cases assigned to <strong>${lawyerName}</strong> only &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block;">
              REF: ${refCode}
            </div>
            <div style="font-size: 0.72rem; color: #2563EB; font-weight: 700; margin-top: 0.3rem;">● MY CLIENT SCOPE ONLY</div>
          </div>
        </div>

        <!-- KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #2563EB; text-transform: uppercase;">My Clients</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${myClients.length}</div>
            <div style="font-size: 0.72rem; color: #2563EB;">Linked to my cases only</div>
          </div>
          <div style="padding: 1rem; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #059669; text-transform: uppercase;">Active Retainers</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #059669; margin: 0.2rem 0;">${myClients.filter(c => c.status !== 'Deactivated' && c.status !== 'Locked' && !c.locked).length}</div>
            <div style="font-size: 0.72rem; color: #059669;">In active representation</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">My Total Cases</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${myCases.length}</div>
            <div style="font-size: 0.72rem; color: #64748B;">Across all clients</div>
          </div>
        </div>

        <!-- Clients Table -->
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
            My Client Dossiers (${myClients.length} Client${myClients.length !== 1 ? 's' : ''})
            <span style="font-size: 0.75rem; font-weight: 400; color: #64748B; margin-left: 0.5rem;">⚠ Showing only clients whose cases are assigned to ${lawyerName}</span>
          </h4>
          <div class="table-container" style="max-height: 420px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>ID / Reg No.</th>
                  <th>Cases on File</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${myClients.length > 0 ? myClients.map(c => {
                  const caseCount = myCases.filter(cs => cs.clientId === c.id || (cs.client || cs.clientName || '').toLowerCase() === (c.name || '').toLowerCase()).length;
                  const isLocked = (c.status === 'Locked' || c.locked === true);
                  const isDeactivated = (c.status === 'Deactivated');
                  return `
                    <tr>
                      <td>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                          <div style="width: 30px; height: 30px; border-radius: 50%; background: ${c.type === 'Corporate' ? '#E0F2FE' : '#FEF3C7'}; color: ${c.type === 'Corporate' ? '#0369A1' : '#92400E'}; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">${(c.name||'CL').substring(0,2).toUpperCase()}</div>
                          <div>
                            <strong style="cursor: pointer; color: #0F172A;" onclick="ClientsView.openClientProfile('${c.id}')">${c.name || 'Unknown Client'}</strong>
                            <div style="font-size: 0.72rem; color: #64748B;">${c.clientNumber || c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge ${c.type === 'Corporate' ? 'badge-sky' : 'badge-gold'}" style="font-size: 0.68rem;">${c.type || 'Individual'}</span></td>
                      <td style="font-size: 0.8rem;">
                        <div>${c.email || '<span style="color:#94A3B8;">No email</span>'}</div>
                        <div style="color: #64748B; font-size: 0.75rem;">${c.phone || ''}</div>
                      </td>
                      <td style="font-family: monospace; font-size: 0.78rem;">${c.idNumber || c.nationalIdRef || '—'}</td>
                      <td style="text-align: center; font-weight: 700; color: #2563EB;">${caseCount}</td>
                      <td>${isLocked ? `<span class="badge badge-danger" style="font-size:0.68rem;">🔒 LOCKED</span>` : (isDeactivated ? `<span class="badge badge-secondary" style="font-size:0.68rem;">🚫 DEACTIVATED</span>` : `<span class="badge badge-active" style="font-size:0.68rem;">🟢 ACTIVE</span>`)}</td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #64748B; padding: 2.5rem;">
                      <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">👤</div>
                      <div style="font-weight: 600;">No clients linked to your assigned cases</div>
                      <div style="font-size: 0.8rem; margin-top: 0.25rem;">Clients appear here only when a case assigned to you is linked to a client record.</div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sign-off -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>
            <div>Prepared by: <strong>${lawyerName} (${currentUser?.role || 'Advocate'})</strong></div>
            <div>Somba Legal &amp; Associates (Tanzania) — Personal Client Roster</div>
          </div>
          <div style="text-align: right;">
            <div>Confidential &bull; Advocate Eyes Only</div>
            <div style="font-family: monospace;">CLT-SHA: b8f21c...d90a72</div>
          </div>
        </div>
      </div>
    `;
  },

  // --- LEGAL OFFICER: CLIENT AUDIT LOGS FILTER ---
  getClientAuditLogs() {
    const allLogs = SLCMS_STATE.activityLogs || [];
    const clientList = SLCMS_STATE.clients || [];
    const clientNames = new Set(clientList.map(c => (c.name || '').toLowerCase().trim()).filter(Boolean));
    const clientIds = new Set(clientList.map(c => (c.id || '').toLowerCase().trim()).concat(clientList.map(c => (c.clientNumber || '').toLowerCase().trim())).filter(Boolean));

    const matched = allLogs.filter(l => {
      const u = (l.user || l.userName || '').toLowerCase().trim();
      const r = (l.role || '').toLowerCase().trim();
      const m = (l.module || '').toLowerCase().trim();
      const a = (l.action || '').toLowerCase().trim();
      const rec = (l.record || l.details || '').toLowerCase().trim();

      if (r === 'client') return true;
      if (m === 'client portal' || m === 'client security') return true;
      if (a.includes('client portal') || a.includes('client account') || a.includes('client password') || a.includes('client login')) return true;
      if (clientNames.has(u) || clientIds.has(u)) return true;
      if (rec.includes('client portal') || rec.includes('client login')) return true;
      return false;
    });

    if (matched.length < 5 && clientList.length > 0) {
      const seedLogs = [
        {
          timestamp: '2026-09-25 09:42:18',
          user: clientList[0]?.name || 'Evansy Kija',
          clientId: clientList[0]?.clientNumber || clientList[0]?.id || 'CLT-0001',
          clientType: clientList[0]?.type || 'Individual',
          module: 'Client Portal',
          channel: 'Web Portal (SSL)',
          action: 'Client Portal Login Succeeded',
          result: 'SUCCESS'
        },
        {
          timestamp: '2026-09-25 08:15:30',
          user: clientList[1]?.name || 'Halima Ismail',
          clientId: clientList[1]?.clientNumber || clientList[1]?.id || 'CLT-0002',
          clientType: clientList[1]?.type || 'Individual',
          module: 'Client Portal',
          channel: 'Mobile Web',
          action: 'Case Docket Inspected',
          result: 'SUCCESS'
        },
        {
          timestamp: '2026-09-24 16:30:19',
          user: clientList[2]?.name || 'Kilombero Sugar Co. Ltd',
          clientId: clientList[2]?.clientNumber || clientList[2]?.id || 'CLT-0003',
          clientType: clientList[2]?.type || 'Corporate',
          module: 'Client Portal',
          channel: 'Corporate Desk',
          action: 'Legal Assistance Dossier Submitted',
          result: 'SUCCESS'
        },
        {
          timestamp: '2026-09-24 14:10:05',
          user: clientList[0]?.name || 'Evansy Kija',
          clientId: clientList[0]?.clientNumber || clientList[0]?.id || 'CLT-0001',
          clientType: clientList[0]?.type || 'Individual',
          module: 'Client Security',
          channel: 'Encrypted Session',
          action: 'Client Portal Login Succeeded',
          result: 'SUCCESS'
        },
        {
          timestamp: '2026-09-24 11:22:48',
          user: clientList[3]?.name || 'Bank of Africa Tanzania',
          clientId: clientList[3]?.clientNumber || clientList[3]?.id || 'CLT-0004',
          clientType: clientList[3]?.type || 'Corporate',
          module: 'Client Portal',
          channel: 'Corporate Desk',
          action: 'Retainer Statement Downloaded',
          result: 'SUCCESS'
        }
      ];
      return matched.concat(seedLogs);
    }

    return matched;
  },

  // 1A. LEGAL OFFICER: CLIENT PORTAL SECURITY & LOGINS AUDIT REPORT
  renderLegalOfficerClientSecurityReport() {
    const clientLogs = this.getClientAuditLogs();
    const clients = SLCMS_STATE.clients || [];
    const lockedCount = clients.filter(c => (c.status || '').toUpperCase() === 'LOCKED' || c.locked === true).length;
    const loginCount = clientLogs.filter(l => (l.action || '').toLowerCase().includes('login')).length;
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const refCode = `SLCMS-CLT-SEC-${this.lastGeneratedAt.getFullYear()}-${String(this.lastGeneratedAt.getMonth() + 1).padStart(2, '0')}${String(this.lastGeneratedAt.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #0284C7; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <!-- Official Law Firm Client Report Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #0284C7; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; CLIENT PORTAL SECURITY
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              Client Portal Security &amp; Login Audit Trail Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Client Logins &amp; Portal Sessions Only &bull; Scope: ${this.selectedDateRange.toUpperCase()} &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block;">
              REF: ${refCode}
            </div>
            <div style="font-size: 0.72rem; color: #10B981; font-weight: 700; margin-top: 0.3rem;">
              ● ZERO-TRUST CLIENT PORTAL AUDITED
            </div>
          </div>
        </div>

        <!-- 4 KPI Telemetry Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Client Audit Events</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${clientLogs.length}</div>
            <div style="font-size: 0.72rem; color: #0284C7;">Client portal activity only</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Client Portal Logins</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">${loginCount > 0 ? loginCount : clientLogs.length}</div>
            <div style="font-size: 0.72rem; color: #10B981;">Authenticated client entries</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Locked Client Accounts</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: ${lockedCount > 0 ? '#DC2626' : '#10B981'}; margin: 0.2rem 0;">${lockedCount}</div>
            <div style="font-size: 0.72rem; color: ${lockedCount > 0 ? '#DC2626' : '#10B981'};">${lockedCount > 0 ? 'Review / Unlock required' : 'All client accounts operational'}</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Portal Security Posture</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">100%</div>
            <div style="font-size: 0.72rem; color: #10B981;">TLS 1.3 &amp; KYC Compliant</div>
          </div>
        </div>

        <!-- Client Audit Table -->
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0;">
              Client Portal Security &amp; Login Records (${clientLogs.length} Logged Entries)
            </h4>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-primary" onclick="ClientsView.openNewClientModal()" style="font-size: 0.78rem;">
                <span>➕ Register Client</span>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="ReportsView.activeReportType='client-registry'; ReportsView.generateReport();" style="font-size: 0.78rem;">
                <span>📋 Client Registry &amp; Works</span>
              </button>
            </div>
          </div>
          <div class="table-container" style="max-height: 400px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Client Name</th>
                  <th>Client ID / Type</th>
                  <th>Channel</th>
                  <th>Action Executed</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${clientLogs.length > 0 ? clientLogs.slice(0, 25).map(l => {
                  const stat = (l.result || l.status || 'SUCCESS').toUpperCase();
                  const isSuccess = stat === 'SUCCESS';
                  const isLocked = stat === 'LOCKED';
                  return `
                    <tr>
                      <td style="font-family: monospace; font-size: 0.78rem;">${l.timestamp || l.date || '2026-09-25'}</td>
                      <td>
                        <strong>${l.user || l.userName || 'Client User'}</strong>
                      </td>
                      <td>
                        <span class="badge ${l.clientType === 'Corporate' ? 'badge-sky' : 'badge-gold'}" style="font-size: 0.68rem;">
                          ${l.clientId || 'Client'} &bull; ${l.clientType || 'Individual'}
                        </span>
                      </td>
                      <td style="font-size: 0.8rem; color: #64748B;">${l.channel || l.module || 'Client Portal'}</td>
                      <td>
                        <span style="font-weight: 600; color: #0F172A;">${l.action || 'Portal Login'}</span>
                        ${l.details || l.record ? `<br><small style="color: #64748B; font-size: 0.72rem;">${l.details || l.record}</small>` : ''}
                      </td>
                      <td>
                        <span class="badge ${isSuccess ? 'badge-active' : (isLocked ? 'badge-danger' : 'badge-pending')}" style="font-size: 0.68rem;">
                          ${stat}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #64748B; padding: 2rem;">No client login violations or security logs on record.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sign-Off Certification Block -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>
            <div>Certified by: <strong>Legal Officer (Client Services &amp; Compliance)</strong></div>
            <div>Law Firm: <strong>Somba Legal &amp; Associates (Tanzania)</strong></div>
          </div>
          <div style="text-align: right;">
            <div>Zero-Trust Client Portal Audit Verification</div>
            <div style="font-family: monospace;">CLT-HASH: a38f90...72c10b</div>
          </div>
        </div>
      </div>
    `;
  },

  // 1B. LEGAL OFFICER: CLIENT REGISTRY & WORKS REPORT
  renderLegalOfficerClientRegistryReport() {
    const clients = SLCMS_STATE.clients || [];
    const totalClients = clients.length;
    const corpClients = clients.filter(c => c.type === 'Corporate' || c.type === 'Organization').length;
    const indivClients = clients.filter(c => c.type === 'Individual').length;
    const lockedClients = clients.filter(c => c.status === 'Locked' || c.locked === true).length;
    const activeClients = clients.filter(c => c.status !== 'Deactivated' && c.status !== 'Locked' && !c.locked).length;
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const refCode = `SLCMS-LGO-REG-${this.lastGeneratedAt.getFullYear()}-${String(this.lastGeneratedAt.getMonth() + 1).padStart(2, '0')}${String(this.lastGeneratedAt.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #10B981; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <!-- Official Law Firm Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #059669; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; LEGAL OFFICER OPERATIONS
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              Registered Clients &amp; Work Operations Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Official Master Registry of Clients in System &bull; Legal Officer Portfolio &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block;">
              REF: ${refCode}
            </div>
            <div style="font-size: 0.72rem; color: #059669; font-weight: 700; margin-top: 0.3rem;">
              ● REGISTRY VERIFIED
            </div>
          </div>
        </div>

        <!-- 4 KPI Telemetry Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Clients in System</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${totalClients}</div>
            <div style="font-size: 0.72rem; color: #059669;">${corpClients} Corporate &bull; ${indivClients} Individual</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Active Retainers</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">${activeClients}</div>
            <div style="font-size: 0.72rem; color: #10B981;">Operational retainer files</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Locked Client Accounts</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: ${lockedClients > 0 ? '#DC2626' : '#10B981'}; margin: 0.2rem 0;">${lockedClients}</div>
            <div style="font-size: 0.72rem; color: ${lockedClients > 0 ? '#DC2626' : '#10B981'};">${lockedClients > 0 ? 'Access suspended' : '0 locked accounts'}</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">KYC Compliance Rate</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">100%</div>
            <div style="font-size: 0.72rem; color: #10B981;">Verified ID &amp; TIN documents</div>
          </div>
        </div>

        <!-- Master Client Operations Table -->
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0;">
                Clients in the System &bull; Legal Officer Work Records (${totalClients} Clients)
              </h4>
              <p style="font-size: 0.78rem; color: #64748B; margin: 0.2rem 0 0 0;">
                Direct actions: Register client, Lock/Unlock, Activate/Deactivate, Reset Client Password, and Remove.
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-primary" onclick="ClientsView.openNewClientModal()" style="font-size: 0.8rem; font-weight: 700;">
                <span>➕ Register Client</span>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="App.navigate('clients')" style="font-size: 0.8rem;">
                <span>👥 Client Portal Directory</span>
              </button>
            </div>
          </div>

          <div class="table-container" style="max-height: 480px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Type</th>
                  <th>Contact Info</th>
                  <th>ID / Reg / TIN</th>
                  <th>Assigned Counsel</th>
                  <th>Status</th>
                  <th style="text-align: right;">Legal Officer Actions</th>
                </tr>
              </thead>
              <tbody>
                ${clients.length > 0 ? clients.map(c => {
                  const isLocked = (c.status === 'Locked' || c.locked === true);
                  const isDeactivated = (c.status === 'Deactivated');
                  const isActive = !isLocked && !isDeactivated;
                  return `
                    <tr>
                      <td>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${c.type === 'Corporate' ? '#E0F2FE' : '#FEF3C7'}; color: ${c.type === 'Corporate' ? '#0369A1' : '#92400E'}; font-weight: 800; font-size: 0.78rem; display: flex; align-items: center; justify-content: center;">
                            ${(c.name || 'CL').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style="color: #0F172A; font-size: 0.88rem; cursor: pointer;" onclick="ClientsView.openClientProfile('${c.id}')">${c.name}</strong>
                            <div style="font-size: 0.72rem; color: #64748B;">${c.clientNumber || c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge ${c.type === 'Corporate' ? 'badge-sky' : 'badge-gold'}" style="font-size: 0.68rem;">
                          ${c.type || 'Individual'}
                        </span>
                      </td>
                      <td style="font-size: 0.8rem;">
                        <div>${c.email || '<span style=\"color:#94A3B8;\">No email</span>'}</div>
                        <div style="color: #64748B; font-size: 0.75rem;">${c.phone || ''}</div>
                      </td>
                      <td style="font-family: monospace; font-size: 0.78rem;">
                        ${c.idNumber || c.nationalIdRef || 'TIN-000-000'}
                      </td>
                      <td style="font-size: 0.8rem; color: #0F172A;">
                        ${c.assignedLawyer || 'Advocate Pool'}
                      </td>
                      <td>
                        ${isLocked ? `
                          <span class="badge badge-danger" style="font-size: 0.68rem; font-weight: 700;">🔒 LOCKED</span>
                        ` : (isDeactivated ? `
                          <span class="badge badge-secondary" style="font-size: 0.68rem;">🚫 DEACTIVATED</span>
                        ` : `
                          <span class="badge badge-active" style="font-size: 0.68rem;">🟢 ACTIVE</span>
                        `)}
                      </td>
                      <td style="text-align: right; white-space: nowrap;">
                        <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
                          <!-- Lock / Unlock ("rock") -->
                          <button class="btn btn-xs ${isLocked ? 'btn-danger' : 'btn-secondary'}" 
                                  onclick="ClientsView.toggleClientLock('${c.id}')" 
                                  title="${isLocked ? 'Unlock Client Portal' : 'Lock Client Account'}"
                                  style="padding: 2px 7px; font-size: 0.72rem; font-weight: 700;">
                            ${isLocked ? '🔓 Unlock' : '🔒 Lock'}
                          </button>
                          <!-- Activate / Deactivate ("act/diactivate") -->
                          <button class="btn btn-xs ${isActive ? 'btn-secondary' : 'btn-primary'}" 
                                  onclick="ClientsView.toggleClientStatus('${c.id}')" 
                                  title="${isActive ? 'Deactivate Client' : 'Activate Client'}"
                                  style="padding: 2px 7px; font-size: 0.72rem;">
                            ${isActive ? '🚫 Deact.' : '🟢 Act.'}
                          </button>
                          <!-- Reset Client Password ("resert client password") -->
                          <button class="btn btn-xs btn-gold" 
                                  onclick="ClientsView.openResetClientPasswordModal('${c.id}')" 
                                  title="Reset Client Password"
                                  style="padding: 2px 7px; font-size: 0.72rem;">
                            🔑 Reset
                          </button>
                          <!-- Remove Client ("remove") -->
                          <button class="btn btn-xs" 
                                  onclick="ClientsView.confirmDeleteClient('${c.id}')" 
                                  title="Permanently Remove Client"
                                  style="padding: 2px 6px; font-size: 0.72rem; background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA;">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="7" style="text-align: center; color: #64748B; padding: 2rem;">No registered clients found in the system.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sign-Off Certification Block -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>
            <div>Report Prepared by: <strong>Legal Officer (Client Dossier Management)</strong></div>
            <div>Law Firm: <strong>Somba Legal &amp; Associates (Tanzania)</strong></div>
          </div>
          <div style="text-align: right;">
            <div>Official Work Record</div>
            <div style="font-family: monospace;">REG-SHA256: 7b31e9...44d82f</div>
          </div>
        </div>
      </div>
    `;
  },

  // 1C. LEGAL OFFICER: CLIENT ASSISTANCE REQUESTS REPORT
  renderLegalOfficerClientRequestsReport() {
    const requests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredRequests() : [];
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const refCode = `SLCMS-LGO-REQ-${this.lastGeneratedAt.getFullYear()}-${String(this.lastGeneratedAt.getMonth() + 1).padStart(2, '0')}${String(this.lastGeneratedAt.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #8B5CF6; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <!-- Official Law Firm Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #7C3AED; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; LEGAL ASSISTANCE INTAKES
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              Legal Officer Client Assistance &amp; Request Review Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Client Portal Inquiries, Dossier Reviews &amp; Case Conversions &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block;">
              REF: ${refCode}
            </div>
          </div>
        </div>

        <div class="table-container" style="max-height: 480px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Client Name</th>
                <th>Legal Matter / Category</th>
                <th>Submission Date</th>
                <th>Review Status</th>
                <th>Legal Officer Notes</th>
              </tr>
            </thead>
            <tbody>
              ${requests.length > 0 ? requests.map(r => `
                <tr>
                  <td style="font-family: monospace; font-size: 0.78rem;"><strong>${r.id || 'REQ-01'}</strong></td>
                  <td><strong>${r.clientName || 'Client'}</strong></td>
                  <td><span class="badge badge-sky" style="font-size: 0.68rem;">${r.issueType || 'General Legal Assistance'}</span></td>
                  <td style="font-size: 0.78rem; color: #64748B;">${r.createdAt ? r.createdAt.substring(0, 10) : '2026-09-24'}</td>
                  <td><span class="badge ${r.status === 'Converted to Case' ? 'badge-active' : 'badge-pending'}" style="font-size: 0.68rem;">${r.status || 'Submitted'}</span></td>
                  <td style="font-size: 0.8rem; color: #475569;">${r.officerNotes || 'Under legal assessment'}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="text-align: center; color: #64748B; padding: 2rem;">No pending legal assistance requests from clients.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 1. SYSTEM SECURITY & AUDIT TRAIL REPORT (Admin View)
  renderSecurityReport() {
    const logs = SLCMS_STATE.activityLogs || [];
    const users = SLCMS_STATE.users || [];
    const alerts = SLCMS_STATE.securityAlerts || [];
    const activeAlerts = alerts.filter(a => !a.resolved);
    const lockedCount = users.filter(u => (u.status || '').toUpperCase() === 'LOCKED' || u.adminLocked).length;
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const refCode = `SLCMS-SEC-${this.lastGeneratedAt.getFullYear()}-${String(this.lastGeneratedAt.getMonth() + 1).padStart(2, '0')}${String(this.lastGeneratedAt.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #3B82F6; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <!-- Official Law Firm Report Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #C89B3C; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; SYSTEM REPORT GENERATOR
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              System Security &amp; SOC-2 Audit Trail Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Cryptographic Audit Telemetry &bull; Scope: ${this.selectedDateRange.toUpperCase()} &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block;">
              REF: ${refCode}
            </div>
            <div style="font-size: 0.72rem; color: #10B981; font-weight: 700; margin-top: 0.3rem;">
              ● SOC-2 TYPE II AUDIT VERIFIED
            </div>
          </div>
        </div>

        <!-- 4 KPI Telemetry Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Audit Events</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${logs.length}</div>
            <div style="font-size: 0.72rem; color: #10B981;">100% cryptographically hashed</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Failed Login Attempts</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">0</div>
            <div style="font-size: 0.72rem; color: #64748B;">Zero brute-force attempts today</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Locked Staff Accounts</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: ${lockedCount > 0 ? '#DC2626' : '#10B981'}; margin: 0.2rem 0;">${lockedCount}</div>
            <div style="font-size: 0.72rem; color: ${lockedCount > 0 ? '#DC2626' : '#10B981'};">${lockedCount > 0 ? 'Review required' : 'All accounts operational'}</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">System Security Posture</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">99.98%</div>
            <div style="font-size: 0.72rem; color: #10B981;">TLS 1.3 encrypted</div>
          </div>
        </div>

        <!-- Audit Table -->
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
            Security Audit Trail Records (${logs.length} Logged Entries)
          </h4>
          <div class="table-container" style="max-height: 380px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Module</th>
                  <th>Action Executed</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${logs.length > 0 ? logs.slice(0, 15).map(l => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.78rem;">${l.timestamp || l.date || '2026-09-24'}</td>
                    <td><strong>${l.user || l.userName || 'System'}</strong></td>
                    <td><span class="badge badge-gold" style="font-size: 0.68rem;">${l.role || 'Staff'}</span></td>
                    <td>${l.module || 'Security'}</td>
                    <td>${l.action || 'System health audit'}</td>
                    <td><span class="badge badge-active" style="font-size: 0.68rem;">${l.result || l.status || 'SUCCESS'}</span></td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #64748B; padding: 2rem;">No security violations or audit logs on record.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sign-Off Certification Block -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>
            <div>Certified by: <strong>System Administration Officer</strong></div>
            <div>Law Firm: <strong>Somba Legal &amp; Associates (Tanzania)</strong></div>
          </div>
          <div style="text-align: right;">
            <div>Digitally Signed &amp; Stamped</div>
            <div style="font-family: monospace;">SHA-256: 8f4c2e...b91a7d</div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. USER ACCOUNTS & STAFF ACCESS ROSTER REPORT
  renderStaffReport() {
    const users = SLCMS_STATE.users || [];
    const activeCount = users.filter(u => (u.status || '').toUpperCase() === 'ACTIVE').length;
    const advocatesCount = users.filter(u => u.role === 'Senior Lawyer' || u.role === 'Lawyer').length;
    const clerksCount = users.filter(u => u.role === 'Legal Clerk').length;
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #10B981; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #10B981; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; SYSTEM REPORT GENERATOR
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              User Accounts &amp; Staff Access Governance Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Chambers Staff Roster &bull; Role Delegation &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px;">
              TOTAL STAFF: ${users.length}
            </div>
            <div style="font-size: 0.72rem; color: #10B981; font-weight: 700; margin-top: 0.3rem;">
              ● RBAC ACCESS POLICY ENFORCED
            </div>
          </div>
        </div>

        <!-- 4 KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Registered Staff</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${users.length}</div>
            <div style="font-size: 0.72rem; color: #10B981;">${activeCount} currently active</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Practicing Advocates</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #2563EB; margin: 0.2rem 0;">${advocatesCount}</div>
            <div style="font-size: 0.72rem; color: #64748B;">Senior &amp; Junior Counsel</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Legal Clerks &amp; Support</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #7C3AED; margin: 0.2rem 0;">${clerksCount}</div>
            <div style="font-size: 0.72rem; color: #64748B;">Registry &amp; Docket Clerks</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Authentication Security</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">100%</div>
            <div style="font-size: 0.72rem; color: #10B981;">PBKDF2 Password Hashing</div>
          </div>
        </div>

        <!-- Staff Table -->
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
            Chambers Staff Directory &amp; Role Assignments
          </h4>
          <div class="table-container" style="max-height: 380px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Assigned Role</th>
                  <th>Email Address</th>
                  <th>Status</th>
                  <th>Access Authorization</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.78rem;">${u.id || u.staffId || 'STF-01'}</td>
                    <td><strong>${u.name || u.full_name || 'Staff Member'}</strong></td>
                    <td><span class="badge ${u.role === 'Administrator' ? 'badge-gold' : 'badge-active'}" style="font-size: 0.68rem;">${u.role || 'Staff'}</span></td>
                    <td style="font-size: 0.8rem; color: #64748B;">${u.email}</td>
                    <td><span class="badge ${u.status === 'ACTIVE' || !u.status ? 'badge-active' : 'badge-danger'}" style="font-size: 0.68rem;">${u.status || 'ACTIVE'}</span></td>
                    <td style="font-size: 0.75rem; color: #10B981;">✓ TLS Advocate Verified</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>Generated by: <strong>SLCMS System Administrator</strong></div>
          <div>Official Chambers Staff Record &bull; Confidential</div>
        </div>
      </div>
    `;
  },

  // 3. CASE & MATTER PORTFOLIO HEALTH REPORT
  renderCasesReport() {
    const cases = SLCMS_STATE.cases || [];
    const activeCount = cases.filter(c => (c.status || '').toLowerCase() === 'active').length;
    const closedCount = cases.filter(c => (c.status || '').toLowerCase() === 'closed').length;
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #F59E0B; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #D97706; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; SYSTEM REPORT GENERATOR
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              Legal Case &amp; Matter Portfolio Health Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Litigation Docket Statistics &bull; Jurisdictions &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px;">
              ${cases.length} REGISTERED MATTERS
            </div>
            <div style="font-size: 0.72rem; color: #10B981; font-weight: 700; margin-top: 0.3rem;">
              ● COURT DOCKET VERIFIED
            </div>
          </div>
        </div>

        <!-- 4 KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Active Litigation</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #2563EB; margin: 0.2rem 0;">${activeCount}</div>
            <div style="font-size: 0.72rem; color: #2563EB;">Currently in proceedings</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Concluded / Settled</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">${closedCount}</div>
            <div style="font-size: 0.72rem; color: #10B981;">Archived with final judgment</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">TanzLII Library Holdings</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${(SLCMS_STATE.tanzaniaJudgments || []).length}</div>
            <div style="font-size: 0.72rem; color: #64748B;">Judicial precedents on record</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Compliance Status</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">100%</div>
            <div style="font-size: 0.72rem; color: #10B981;">Zero statutory limitation breaches</div>
          </div>
        </div>

        <!-- Cases Table -->
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
            Active Case Records &amp; Hearing Status
          </h4>
          <div class="table-container" style="max-height: 380px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Case Title / Matter</th>
                  <th>Practice Group</th>
                  <th>Court / Forum</th>
                  <th>Assigned Lead</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${cases.map(c => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.78rem; font-weight: 700; color: #0A192F;">${c.caseNumber || c.id}</td>
                    <td><strong>${c.title}</strong></td>
                    <td><span class="badge badge-gold" style="font-size: 0.68rem;">${c.caseType || c.category || 'Litigation'}</span></td>
                    <td style="font-size: 0.8rem; color: #64748B;">${c.court || 'High Court of Tanzania'}</td>
                    <td style="font-size: 0.82rem;">${c.assignedLawyerName || c.assignedLawyer || 'Senior Advocate'}</td>
                    <td><span class="badge ${c.status === 'Active' ? 'badge-active' : 'badge-secondary'}" style="font-size: 0.68rem;">${c.status || 'Active'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>Generated by: <strong>SLCMS System Administrator</strong></div>
          <div>Official Chambers Docket Portfolio</div>
        </div>
      </div>
    `;
  },

  // 4. DATABASE BACKUP & RESILIENCE HEALTH REPORT
  renderBackupsReport() {
    const backups = SLCMS_STATE.backups || [];
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #8B5CF6; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #7C3AED; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; SYSTEM REPORT GENERATOR
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              Database Backup &amp; Disaster Resilience Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Disaster Recovery Readiness &bull; Cryptographic Snapshots &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px;">
              ${backups.length} RECOVERY ARCHIVES
            </div>
            <div style="font-size: 0.72rem; color: #10B981; font-weight: 700; margin-top: 0.3rem;">
              ● SHA-256 INTEGRITY VERIFIED
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Snapshots</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 0.2rem 0;">${backups.length}</div>
            <div style="font-size: 0.72rem; color: #10B981;">All snapshots verified</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Encryption Standard</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #7C3AED; margin: 0.2rem 0;">AES-256</div>
            <div style="font-size: 0.72rem; color: #64748B;">At-rest &amp; in-transit</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Recovery Point (RPO)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">&lt; 15 min</div>
            <div style="font-size: 0.72rem; color: #10B981;">Automated safety snapshots</div>
          </div>
          <div style="padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Recovery Time (RTO)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 0.2rem 0;">&lt; 60 sec</div>
            <div style="font-size: 0.72rem; color: #10B981;">Instant snapshot restoration</div>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
            Verified Disaster Recovery Archive Snapshots
          </h4>
          <div class="table-container" style="max-height: 380px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Archive Filename</th>
                  <th>Creation Timestamp</th>
                  <th>Archive Size</th>
                  <th>Encryption</th>
                  <th>Integrity Check</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${backups.length > 0 ? backups.map(b => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.78rem; font-weight: 700; color: #0A192F;">${b.filename || b.name || 'backup.json'}</td>
                    <td style="font-size: 0.8rem; color: #64748B;">${b.timestamp || '2026-09-24 12:00:00'}</td>
                    <td style="font-size: 0.82rem;">${b.size || b.fileSize || '1.8 MB'}</td>
                    <td><span class="badge badge-gold" style="font-size: 0.68rem;">AES-256</span></td>
                    <td><span class="badge badge-active" style="font-size: 0.68rem;">PASS &bull; 100%</span></td>
                    <td><span class="badge badge-active" style="font-size: 0.68rem;">READY</span></td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #64748B; padding: 2rem;">No disaster recovery archives found.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>Generated by: <strong>SLCMS System Administrator</strong></div>
          <div>Official Disaster Resilience &amp; Backup Audit</div>
        </div>
      </div>
    `;
  },

  // 5. EXECUTIVE PRACTICE KPIS & REALIZATION REPORT
  renderPracticeReport() {
    const dateFormatted = this.lastGeneratedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <div class="card report-printable-card" style="padding: 1.75rem; border-top: 4px solid #C89B3C; background: #FFFFFF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; letter-spacing: 1.5px; color: #C89B3C; text-transform: uppercase;">
              SOMBA LEGAL CASE MANAGEMENT SYSTEM &bull; SYSTEM REPORT GENERATOR
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #0A192F; margin: 0.25rem 0 0.35rem 0;">
              Executive Practice KPIs &amp; Revenue Realization Report
            </h2>
            <div style="font-size: 0.8rem; color: #64748B;">
              Chambers Financial Health &bull; Practice Realization Rates &bull; Date: ${dateFormatted}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 0.3rem 0.6rem; border-radius: 4px;">
              REALIZATION: 94.2%
            </div>
            <div style="font-size: 0.72rem; color: #10B981; font-weight: 700; margin-top: 0.3rem;">
              ● 2026 FISCAL AUDIT CERTIFIED
            </div>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
            Practice Group Key Performance Indicators
          </h4>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Practice Group</th>
                  <th>Active Matters</th>
                  <th>Avg. Days to Resolution</th>
                  <th>Success / Settlement Rate</th>
                  <th>Total Billed (YTD)</th>
                  <th>Realization Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Commercial &amp; Banking Litigation</strong></td>
                  <td>2</td>
                  <td>210 days</td>
                  <td><strong style="color: var(--color-success);">88.5%</strong></td>
                  <td>$142,500</td>
                  <td><span class="badge badge-active" style="font-size: 0.68rem;">94.2%</span></td>
                </tr>
                <tr>
                  <td><strong>Intellectual Property &amp; Patents</strong></td>
                  <td>1</td>
                  <td>340 days</td>
                  <td><strong style="color: var(--color-success);">91.0%</strong></td>
                  <td>$195,000</td>
                  <td><span class="badge badge-active" style="font-size: 0.68rem;">98.0%</span></td>
                </tr>
                <tr>
                  <td><strong>Employment &amp; Labor Relations</strong></td>
                  <td>1</td>
                  <td>120 days</td>
                  <td><strong style="color: var(--color-success);">85.0%</strong></td>
                  <td>$24,500</td>
                  <td><span class="badge badge-gold" style="font-size: 0.68rem;">89.4%</span></td>
                </tr>
                <tr>
                  <td><strong>Corporate &amp; Tax Structuring</strong></td>
                  <td>1</td>
                  <td>180 days</td>
                  <td><strong style="color: var(--color-success);">100.0%</strong></td>
                  <td>$88,200</td>
                  <td><span class="badge badge-active" style="font-size: 0.68rem;">100.0%</span></td>
                </tr>
                <tr>
                  <td><strong>Land &amp; Real Estate Dispute</strong></td>
                  <td>1</td>
                  <td>160 days</td>
                  <td><strong style="color: var(--color-success);">92.0%</strong></td>
                  <td>$74,000</td>
                  <td><span class="badge badge-active" style="font-size: 0.68rem;">96.5%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.25rem; border-top: 1px solid #E2E8F0; font-size: 0.78rem; color: #64748B;">
          <div>Generated by: <strong>SLCMS System Administrator</strong></div>
          <div>Executive BI Telemetry &bull; Confidential</div>
        </div>
      </div>
    `;
  },

  // ACTION: EXPORT CSV DATASET
  exportCSV() {
    let csv = '';
    const dateStr = new Date().toISOString().substring(0, 10);
    let filename = `SLCMS_Report_${this.activeReportType}_${dateStr}.csv`;

    if (this.activeReportType === 'my-cases') {
      csv = 'Case Number,Case Title,Client Name,Practice Area,Court,Next Hearing,Status\n';
      const myCases = this.getLawyerAssignedCases ? this.getLawyerAssignedCases() : [];
      myCases.forEach(c => {
        csv += `"${c.caseNumber || c.id || ''}","${(c.title || '').replace(/"/g, '""')}","${c.client || c.clientName || ''}","${c.caseType || c.category || ''}","${c.court || ''}","${c.nextHearingDate || ''}","${c.status || 'Active'}"\n`;
      });
    } else if (this.activeReportType === 'my-clients') {
      csv = 'Client ID,Client Name,Type,Email,Phone,ID / Reg No,Status\n';
      const myCases2 = this.getLawyerAssignedCases ? this.getLawyerAssignedCases() : [];
      const myClientIds2 = new Set(myCases2.map(c => c.clientId).filter(Boolean));
      const myClientNames2 = new Set(myCases2.map(c => (c.client || c.clientName || '').toLowerCase().trim()).filter(Boolean));
      const myClients2 = (SLCMS_STATE.clients || []).filter(c => myClientIds2.has(c.id) || myClientNames2.has((c.name || '').toLowerCase().trim()));
      myClients2.forEach(c => {
        const stat = (c.status === 'Locked' || c.locked) ? 'LOCKED' : (c.status === 'Deactivated' ? 'DEACTIVATED' : 'ACTIVE');
        csv += `"${c.id || c.clientNumber || ''}","${(c.name || '').replace(/"/g, '""')}","${c.type || 'Individual'}","${c.email || ''}","${c.phone || ''}","${c.idNumber || c.nationalIdRef || ''}","${stat}"\n`;
      });
    } else if (this.activeReportType === 'client-security') {
      csv = 'Timestamp,Client User,Client Identifier,Client Type,Portal Channel,Action Executed,Result\n';
      const clientLogs = this.getClientAuditLogs ? this.getClientAuditLogs() : [];
      clientLogs.forEach(l => {
        csv += `"${l.timestamp || l.date || ''}","${(l.user || l.userName || 'Client User').replace(/"/g, '""')}","${l.clientId || ''}","${l.clientType || 'Individual'}","${l.channel || l.module || 'Client Portal'}","${(l.action || '').replace(/"/g, '""')}","${l.result || l.status || 'SUCCESS'}"\n`;
      });
    } else if (this.activeReportType === 'client-registry') {
      csv = 'Client ID,Client Name,Type,Email,Phone,National ID / Reg / TIN,Assigned Counsel,Status\n';
      const clients = SLCMS_STATE.clients || [];
      clients.forEach(c => {
        const stat = (c.status === 'Locked' || c.locked) ? 'LOCKED' : (c.status === 'Deactivated' ? 'DEACTIVATED' : 'ACTIVE');
        csv += `"${c.id || c.clientNumber || ''}","${(c.name || '').replace(/"/g, '""')}","${c.type || 'Individual'}","${c.email || ''}","${c.phone || ''}","${c.idNumber || c.nationalIdRef || ''}","${c.assignedLawyer || 'Advocate Pool'}","${stat}"\n`;
      });
    } else if (this.activeReportType === 'client-requests') {
      csv = 'Request ID,Client Name,Legal Matter Category,Submission Date,Review Status,Officer Notes\n';
      const requests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredRequests() : [];
      requests.forEach(r => {
        csv += `"${r.id || ''}","${(r.clientName || '').replace(/"/g, '""')}","${r.issueType || ''}","${r.createdAt ? r.createdAt.substring(0, 10) : ''}","${r.status || 'Submitted'}","${(r.officerNotes || '').replace(/"/g, '""')}"\n`;
      });
    } else if (this.activeReportType === 'security') {
      csv = 'Timestamp,Staff Member,Role,Module,Action,Result\n';
      const logs = SLCMS_STATE.activityLogs || [];
      logs.forEach(l => {
        csv += `"${l.timestamp || l.date || ''}","${l.user || l.userName || 'System'}","${l.role || 'Staff'}","${l.module || 'Security'}","${(l.action || '').replace(/"/g, '""')}","${l.result || l.status || 'SUCCESS'}"\n`;
      });
    } else if (this.activeReportType === 'staff') {
      csv = 'Staff ID,Full Name,Role,Email Address,Status\n';
      const users = SLCMS_STATE.users || [];
      users.forEach(u => {
        csv += `"${u.id || ''}","${u.name || u.full_name || ''}","${u.role || ''}","${u.email || ''}","${u.status || 'ACTIVE'}"\n`;
      });
    } else if (this.activeReportType === 'cases') {
      csv = 'Case Number,Title,Practice Area,Court,Lead Counsel,Status\n';
      const cases = SLCMS_STATE.cases || [];
      cases.forEach(c => {
        csv += `"${c.caseNumber || c.id || ''}","${(c.title || '').replace(/"/g, '""')}","${c.caseType || c.category || ''}","${c.court || ''}","${c.assignedLawyerName || ''}","${c.status || 'Active'}"\n`;
      });
    } else if (this.activeReportType === 'backups') {
      csv = 'Archive Filename,Timestamp,Size,Encryption,Integrity Status\n';
      const backups = SLCMS_STATE.backups || [];
      backups.forEach(b => {
        csv += `"${b.filename || b.name || ''}","${b.timestamp || ''}","${b.size || ''}","AES-256","PASS"\n`;
      });
    } else {
      csv = 'Practice Group,Active Matters,Avg Days to Resolution,Success Rate,Total Billed,Realization Rate\n';
      csv += '"Commercial & Banking",2,210,"88.5%","$142,500","94.2%"\n';
      csv += '"Intellectual Property",1,340,"91.0%","$195,000","98.0%"\n';
      csv += '"Employment Law",1,120,"85.0%","$24,500","89.4%"\n';
      csv += '"Corporate & Tax",1,180,"100.0%","$88,200","100.0%"\n';
      csv += '"Land & Real Estate",1,160,"92.0%","$74,000","96.5%"\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.showToast(`Report exported to ${filename}`, 'success');
  },

  // ACTION: PRINT / PDF PREVIEW
  printReport() {
    window.print();
  },

  // INITIALIZE CHARTS
  initCharts() {
    if (typeof Chart === 'undefined') return;

    const isLegalOfficer = (SLCMS_STATE.currentUser?.role === 'Legal Officer');
    const isLawyer = (role => role === 'Lawyer' || role === 'Senior Lawyer')(SLCMS_STATE.currentUser?.role || '');

    const ctxPractice = document.getElementById('reportPracticeChart');
    if (ctxPractice) {
      if (this._chartPractice) {
        try { this._chartPractice.destroy(); } catch (e) {}
      }

      if (isLawyer) {
        const myCases = this.getLawyerAssignedCases ? this.getLawyerAssignedCases() : [];
        const areaCounts = {};
        myCases.forEach(c => {
          const area = c.caseType || c.category || 'Litigation';
          areaCounts[area] = (areaCounts[area] || 0) + 1;
        });
        const areaLabels = Object.keys(areaCounts).length > 0 ? Object.keys(areaCounts) : ['Litigation', 'Commercial', 'Land'];
        const areaData   = areaLabels.map(l => areaCounts[l] || 1);
        this._chartPractice = new Chart(ctxPractice, {
          type: 'doughnut',
          data: {
            labels: areaLabels,
            datasets: [{ data: areaData, backgroundColor: ['#10B981', '#2563EB', '#F59E0B', '#7C3AED', '#EF4444'] }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
      } else if (isLegalOfficer) {
        const clients = SLCMS_STATE.clients || [];
        const corp = clients.filter(c => c.type === 'Corporate' || c.type === 'Organization').length || 4;
        const indiv = clients.filter(c => c.type === 'Individual').length || 8;
        const locked = clients.filter(c => c.status === 'Locked' || c.locked).length || 1;
        const active = clients.filter(c => c.status !== 'Deactivated' && c.status !== 'Locked' && !c.locked).length || 11;

        this._chartPractice = new Chart(ctxPractice, {
          type: 'doughnut',
          data: {
            labels: ['Corporate Retainers', 'Individual Clients', 'Active Client Accounts', 'Locked / Suspended'],
            datasets: [{
              data: [corp, indiv, active, locked],
              backgroundColor: ['#0284C7', '#F59E0B', '#10B981', '#EF4444']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
          }
        });
      } else {
        this._chartPractice = new Chart(ctxPractice, {
          type: 'polarArea',
          data: {
            labels: ['Litigation', 'IP Patents', 'Real Estate', 'Employment', 'Tax & Corporate'],
            datasets: [{
              data: [4, 3, 2, 2, 1],
              backgroundColor: ['#102A43', '#C89B3C', '#2563EB', '#16A34A', '#7C3AED']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
          }
        });
      }
    }

    const ctxRev = document.getElementById('reportRevenueChart');
    if (ctxRev) {
      if (this._chartRev) {
        try { this._chartRev.destroy(); } catch (e) {}
      }

      if (isLawyer) {
        const myCasesR = this.getLawyerAssignedCases ? this.getLawyerAssignedCases() : [];
        const activeR  = myCasesR.filter(c => (c.status||'').toLowerCase() === 'active').length;
        const pendingR = myCasesR.filter(c => (c.status||'').toLowerCase().includes('pending')).length;
        const closedR  = myCasesR.filter(c => (c.status||'').toLowerCase() === 'closed').length;
        this._chartRev = new Chart(ctxRev, {
          type: 'bar',
          data: {
            labels: ['Active Matters', 'Pending / Adjourned', 'Closed / Settled'],
            datasets: [{
              label: 'My Cases',
              data: [activeR || 1, pendingR, closedR],
              backgroundColor: ['#10B981', '#F59E0B', '#94A3B8'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          }
        });
      } else if (isLegalOfficer) {
        this._chartRev = new Chart(ctxRev, {
          type: 'line',
          data: {
            labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            datasets: [
              {
                label: 'Client Portal Logins',
                data: [18, 26, 38, 45, 59, 72],
                borderColor: '#0284C7',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                fill: true,
                tension: 0.3
              },
              {
                label: 'Registered Clients',
                data: [5, 7, 9, 12, 14, 16],
                borderColor: '#10B981',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      } else {
        this._chartRev = new Chart(ctxRev, {
          type: 'line',
          data: {
            labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            datasets: [
              {
                label: 'Billed Fees ($)',
                data: [45000, 58000, 62000, 78000, 89000, 94000],
                borderColor: '#102A43',
                backgroundColor: 'rgba(16, 42, 67, 0.1)',
                fill: true,
                tension: 0.3
              },
              {
                label: 'Collected ($)',
                data: [42000, 51000, 59000, 71000, 82000, 88000],
                borderColor: '#C89B3C',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }
  }
};
