/* ==========================================================================
   SLCMS - Executive Dashboard View
   KPI Analytics, Court Calendars, Matter Workloads & Immutable Activity Logs
   ========================================================================== */

const DashboardView = {
  render() {
    const user = SLCMS_STATE.currentUser;
    const activeCasesCount = SLCMS_STATE.cases.filter(c => c.status === 'Active').length;
    const pendingTasksCount = SLCMS_STATE.tasks.filter(t => t.status !== 'completed').length;
    const urgentDeadlines = SLCMS_STATE.tasks.filter(t => t.priority === 'High' && t.status !== 'completed');
    const openInvoicesTotal = SLCMS_STATE.invoices
      .filter(i => i.status === 'Sent' || i.status === 'Overdue')
      .reduce((sum, i) => sum + i.total, 0);
    const clientsCount = SLCMS_STATE.clients.length;

    return `
      <div class="animate-fade">
        <!-- 1. TOP WELCOME HERO BANNER -->
        <div class="dashboard-welcome-banner" style="background: linear-gradient(135deg, #102A43 0%, #0B1F33 100%); border: 1px solid var(--color-gold); border-radius: var(--radius-lg); padding: 1.5rem 1.75rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: var(--shadow-md);">
          <div>
            <div class="flex items-center gap-2" style="margin-bottom: 0.35rem;">
              <h1 style="font-size: 1.65rem; color: #FFFFFF; font-weight: 700; margin: 0; font-family: var(--font-heading);">
                Good morning, ${user.name}
              </h1>
              <span class="badge badge-confidential" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;">
                ${user.role} Session
              </span>
            </div>
            <p style="color: #CBD5E1; font-size: 0.92rem; margin: 0;">
              Here is what requires your attention today. You have <strong style="color: var(--color-gold);">${urgentDeadlines.length} high-priority statutory deadlines</strong> approaching this week.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn btn-secondary" onclick="App.navigate('tasks')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Court Docket</span>
            </button>
            <button class="btn btn-gold" onclick="CasesView.openNewCaseModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>+ Create Case</span>
            </button>
          </div>
        </div>

        <!-- 2. FIVE PRIMARY METRIC KPI CARDS -->
        <div class="stat-cards-grid" style="display: grid; grid-template-columns: repeat(5, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="stat-card" onclick="App.navigate('cases')" style="cursor: pointer;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value">${activeCasesCount}</div>
                <div class="stat-label">Active Cases</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-navy">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
            </div>
            <div class="stat-footer">
              <span class="stat-trend-up">↑ +2 this month</span>
              <span style="color: var(--color-gold); font-weight: 600;">Cases →</span>
            </div>
          </div>

          <div class="stat-card" onclick="App.navigate('tasks')" style="cursor: pointer;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value">${pendingTasksCount}</div>
                <div class="stat-label">Pending Tasks</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
            </div>
            <div class="stat-footer">
              <span style="color: var(--color-text-secondary);">${SLCMS_STATE.tasks.filter(t => t.status === 'in_progress').length} In Progress</span>
              <span style="color: var(--color-gold); font-weight: 600;">Kanban →</span>
            </div>
          </div>

          <div class="stat-card" onclick="App.navigate('tasks')" style="cursor: pointer;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: var(--color-danger);">${urgentDeadlines.length}</div>
                <div class="stat-label">Upcoming Deadlines</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div class="stat-footer">
              <span class="stat-trend-alert">⚡ 2 Hearings in 7 Days</span>
              <span style="color: var(--color-danger); font-weight: 600;">Calendar →</span>
            </div>
          </div>

          <div class="stat-card" onclick="App.navigate('billing')" style="cursor: pointer;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value">$${(openInvoicesTotal / 1000).toFixed(1)}k</div>
                <div class="stat-label">Open Invoices</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <div class="stat-footer">
              <span style="color: var(--color-danger); font-weight: 600;">1 Overdue Notice</span>
              <span style="color: var(--color-gold); font-weight: 600;">Billing →</span>
            </div>
          </div>

          <div class="stat-card" onclick="App.navigate('clients')" style="cursor: pointer;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value">${clientsCount}</div>
                <div class="stat-label">Active Clients</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div class="stat-footer">
              <span class="stat-trend-up">100% Retainer Verified</span>
              <span style="color: var(--color-gold); font-weight: 600;">Clients →</span>
            </div>
          </div>
        </div>

        <!-- 3. CHARTS & ANALYTICS SECTION -->
        <div class="grid grid-cols-2 gap-6" style="margin-bottom: 1.5rem;">
          <!-- Donut Chart: Case Status Overview -->
          <div class="card" style="box-shadow: var(--shadow-xs);">
            <div class="card-header">
              <div>
                <h3 class="card-title" style="font-size: 1.05rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
                  </svg>
                  Case Status Distribution
                </h3>
                <p class="card-subtitle">Active portfolio breakdown across all legal practices</p>
              </div>
              <span class="badge badge-active">${SLCMS_STATE.cases.length} Total Matters</span>
            </div>
            <div class="chart-card-body flex items-center justify-center">
              <canvas id="caseStatusChart" style="max-height: 230px;"></canvas>
            </div>
          </div>

          <!-- Bar Chart: Workload by Lawyer -->
          <div class="card" style="box-shadow: var(--shadow-xs);">
            <div class="card-header">
              <div>
                <h3 class="card-title" style="font-size: 1.05rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);">
                    <path d="M18 20V10"/>
                    <path d="M12 20V4"/>
                    <path d="M6 20v-6"/>
                  </svg>
                  Workload & Matter Distribution by Counsel
                </h3>
                <p class="card-subtitle">Assigned active matters and billable litigation files</p>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="App.navigate('reports')">Full Reports</button>
            </div>
            <div class="chart-card-body">
              <canvas id="lawyerWorkloadChart" style="max-height: 230px;"></canvas>
            </div>
          </div>
        </div>

        <!-- 4. PERFECT 2x2 OPERATIONAL WIDGETS GRID -->
        <div class="dashboard-widgets-grid">
          
          <!-- TOP-LEFT: Upcoming Court Dates & Statutory Deadlines -->
          <div class="dash-widget-card">
            <div>
              <div class="dash-widget-header">
                <h3 class="dash-widget-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-danger);">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Upcoming Court Dates & Statutory Deadlines
                </h3>
                <button class="btn btn-secondary btn-sm" onclick="TasksView.activeView = 'calendar'; App.navigate('tasks');">Calendar View</button>
              </div>

              <!-- Court Row 1: Vanguard -->
              <div class="dash-court-item border-danger">
                <div style="flex: 1; min-width: 0; padding-right: 0.75rem;">
                  <div class="flex items-center gap-2 flex-wrap" style="margin-bottom: 0.25rem;">
                    <span style="font-weight: 700; color: var(--color-primary); font-size: 0.92rem;">
                      Vanguard Capital vs. Apex Tech Holdings
                    </span>
                    <span class="badge badge-priority-high" style="font-size: 0.68rem; padding: 0.12rem 0.55rem;">
                      HIGH PRIORITY
                    </span>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.4;">
                    Supreme Court - Commercial Division • Judge: <strong>Hon. Justice Katherine Thorne</strong>
                  </div>
                </div>
                <div class="text-right" style="flex-shrink: 0;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-danger); font-family: var(--font-mono);">
                    2026-09-14
                  </div>
                  <span class="badge badge-active" style="font-size: 0.65rem; padding: 0.1rem 0.45rem; margin-top: 0.2rem; display: inline-block;">
                    HEARING / MOTION
                  </span>
                </div>
              </div>

              <!-- Court Row 2: AuraBio -->
              <div class="dash-court-item border-danger">
                <div style="flex: 1; min-width: 0; padding-right: 0.75rem;">
                  <div class="flex items-center gap-2 flex-wrap" style="margin-bottom: 0.25rem;">
                    <span style="font-weight: 700; color: var(--color-primary); font-size: 0.92rem;">
                      AuraBio Pharmaceuticals Patent Infringement
                    </span>
                    <span class="badge badge-priority-high" style="font-size: 0.68rem; padding: 0.12rem 0.55rem;">
                      HIGH PRIORITY
                    </span>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.4;">
                    Federal District Court of Appeals • Judge: <strong>Hon. Judge Arthur Pendelton</strong>
                  </div>
                </div>
                <div class="text-right" style="flex-shrink: 0;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-danger); font-family: var(--font-mono);">
                    2026-09-22
                  </div>
                  <span class="badge badge-active" style="font-size: 0.65rem; padding: 0.1rem 0.45rem; margin-top: 0.2rem; display: inline-block;">
                    HEARING / MOTION
                  </span>
                </div>
              </div>

              <!-- Court Row 3: Greenfield -->
              <div class="dash-court-item border-warning">
                <div style="flex: 1; min-width: 0; padding-right: 0.75rem;">
                  <div class="flex items-center gap-2 flex-wrap" style="margin-bottom: 0.25rem;">
                    <span style="font-weight: 700; color: var(--color-primary); font-size: 0.92rem;">
                      Greenfield Estate Land Acquisition & Zoning
                    </span>
                    <span class="badge badge-priority-med" style="font-size: 0.68rem; padding: 0.12rem 0.55rem;">
                      MEDIUM PRIORITY
                    </span>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.4;">
                    Municipal Zoning Appeals Board • Judge: <strong>Board Chair Raymond Morales</strong>
                  </div>
                </div>
                <div class="text-right" style="flex-shrink: 0;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-primary); font-family: var(--font-mono);">
                    2026-10-05
                  </div>
                  <span class="badge badge-onhold" style="font-size: 0.65rem; padding: 0.1rem 0.45rem; margin-top: 0.2rem; display: inline-block;">
                    HEARING / MOTION
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- TOP-RIGHT: Recent Case Filings -->
          <div class="dash-widget-card">
            <div>
              <div class="dash-widget-header">
                <h3 class="dash-widget-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Recent Case Filings
                </h3>
                <button class="btn btn-ghost btn-sm" onclick="App.navigate('cases')" style="font-weight: 600;">All Cases →</button>
              </div>

              <!-- Case 1: Vanguard -->
              <div class="dash-case-item" onclick="CasesView.openCaseDetails('case-101')">
                <div class="flex items-center justify-between" style="margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--color-primary);">
                    CV-2026-0842
                  </span>
                  <span class="badge badge-active" style="font-size: 0.7rem; padding: 0.15rem 0.55rem;">
                    <span class="badge-dot" style="background: #16A34A;"></span> ACTIVE
                  </span>
                </div>
                <div style="font-weight: 700; font-size: 0.92rem; color: var(--color-primary); margin-bottom: 0.25rem;">
                  Vanguard Capital vs. Apex Tech Holdings
                </div>
                <div class="flex items-center justify-between" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-bottom: 0.45rem;">
                  <span>Client: <strong>Vanguard Capital Partners</strong></span>
                  <span>Progress: <strong style="color: var(--color-primary); font-family: var(--font-mono);">65%</strong></span>
                </div>
                <div class="progress-bar-container" style="height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
                  <div class="progress-bar-fill" style="width: 65%; height: 100%; background: linear-gradient(90deg, #102A43 0%, #C89B3C 100%);"></div>
                </div>
              </div>

              <!-- Case 2: AuraBio -->
              <div class="dash-case-item" onclick="CasesView.openCaseDetails('case-102')">
                <div class="flex items-center justify-between" style="margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--color-primary);">
                    IP-2026-0319
                  </span>
                  <span class="badge badge-active" style="font-size: 0.7rem; padding: 0.15rem 0.55rem;">
                    <span class="badge-dot" style="background: #16A34A;"></span> ACTIVE
                  </span>
                </div>
                <div style="font-weight: 700; font-size: 0.92rem; color: var(--color-primary); margin-bottom: 0.25rem;">
                  AuraBio Pharmaceuticals Patent Infringement
                </div>
                <div class="flex items-center justify-between" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-bottom: 0.45rem;">
                  <span>Client: <strong>AuraBio Therapeutics Inc.</strong></span>
                  <span>Progress: <strong style="color: var(--color-primary); font-family: var(--font-mono);">40%</strong></span>
                </div>
                <div class="progress-bar-container" style="height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
                  <div class="progress-bar-fill" style="width: 40%; height: 100%; background: linear-gradient(90deg, #102A43 0%, #C89B3C 100%);"></div>
                </div>
              </div>

              <!-- Case 3: Greenfield -->
              <div class="dash-case-item" onclick="CasesView.openCaseDetails('case-103')">
                <div class="flex items-center justify-between" style="margin-bottom: 0.3rem;">
                  <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--color-primary);">
                    RE-2026-0155
                  </span>
                  <span class="badge badge-pending" style="font-size: 0.7rem; padding: 0.15rem 0.55rem;">
                    <span class="badge-dot" style="background: #F59E0B;"></span> PENDING
                  </span>
                </div>
                <div style="font-weight: 700; font-size: 0.92rem; color: var(--color-primary); margin-bottom: 0.25rem;">
                  Greenfield Estate Land Acquisition & Zoning
                </div>
                <div class="flex items-center justify-between" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-bottom: 0.45rem;">
                  <span>Client: <strong>Greenfield Realty Trust</strong></span>
                  <span>Progress: <strong style="color: var(--color-primary); font-family: var(--font-mono);">55%</strong></span>
                </div>
                <div class="progress-bar-container" style="height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
                  <div class="progress-bar-fill" style="width: 55%; height: 100%; background: linear-gradient(90deg, #102A43 0%, #C89B3C 100%);"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- BOTTOM-LEFT: My Critical Tasks -->
          <div class="dash-widget-card">
            <div>
              <div class="dash-widget-header">
                <h3 class="dash-widget-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  My Critical Tasks
                </h3>
                <button class="btn btn-secondary btn-sm" onclick="TasksView.openNewTaskModal()">+ Add Task</button>
              </div>

              <!-- Task 1 -->
              <div class="dash-task-item">
                <div class="flex items-center gap-3" style="flex: 1; min-width: 0; padding-right: 0.5rem;">
                  <input type="checkbox" onchange="TasksView.toggleTaskStatus('tsk-01')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); flex-shrink: 0;">
                  <div style="min-width: 0;">
                    <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-primary); line-height: 1.35;">
                      File Motion for Summary Judgment with Commercial Division
                    </div>
                    <div style="font-size: 0.76rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Vanguard Capital vs. Apex Tech • Assigned to: <strong>Eleanor Vance, Esq.</strong>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2" style="flex-shrink: 0;">
                  <span class="badge badge-priority-high" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">HIGH</span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-danger); font-family: var(--font-mono);">2026-09-08</span>
                </div>
              </div>

              <!-- Task 2 -->
              <div class="dash-task-item">
                <div class="flex items-center gap-3" style="flex: 1; min-width: 0; padding-right: 0.5rem;">
                  <input type="checkbox" onchange="TasksView.toggleTaskStatus('tsk-02')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); flex-shrink: 0;">
                  <div style="min-width: 0;">
                    <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-primary); line-height: 1.35;">
                      Conduct Pre-Deposition Briefing with Dr. K. Aris
                    </div>
                    <div style="font-size: 0.76rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      AuraBio Patent Infringement • Assigned to: <strong>Julian Mercer, Esq.</strong>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2" style="flex-shrink: 0;">
                  <span class="badge badge-priority-high" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">HIGH</span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-danger); font-family: var(--font-mono);">2026-09-04</span>
                </div>
              </div>

              <!-- Task 3 -->
              <div class="dash-task-item">
                <div class="flex items-center gap-3" style="flex: 1; min-width: 0; padding-right: 0.5rem;">
                  <input type="checkbox" onchange="TasksView.toggleTaskStatus('tsk-03')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); flex-shrink: 0;">
                  <div style="min-width: 0;">
                    <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-primary); line-height: 1.35;">
                      Finalize Mediation Terms with Defense Counsel
                    </div>
                    <div style="font-size: 0.76rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Dr. Clara Thorne vs. St. Jude • Assigned to: <strong>Julian Mercer, Esq.</strong>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2" style="flex-shrink: 0;">
                  <span class="badge badge-priority-high" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">HIGH</span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-danger); font-family: var(--font-mono);">2026-09-02</span>
                </div>
              </div>

              <!-- Task 4 -->
              <div class="dash-task-item">
                <div class="flex items-center gap-3" style="flex: 1; min-width: 0; padding-right: 0.5rem;">
                  <input type="checkbox" onchange="TasksView.toggleTaskStatus('tsk-04')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); flex-shrink: 0;">
                  <div style="min-width: 0;">
                    <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-primary); line-height: 1.35;">
                      Submit Environmental Soil Survey to Municipal Board
                    </div>
                    <div style="font-size: 0.76rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Greenfield Estate Zoning • Assigned to: <strong>Marcus Bell</strong>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2" style="flex-shrink: 0;">
                  <span class="badge badge-priority-med" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">MEDIUM</span>
                  <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); font-family: var(--font-mono);">2026-09-18</span>
                </div>
              </div>
            </div>
          </div>

          <!-- BOTTOM-RIGHT: Live Activity Audit (SOC-2 Type II) -->
          <div class="dash-widget-card">
            <div>
              <div class="dash-widget-header">
                <div class="flex items-center gap-2">
                  <h3 class="dash-widget-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                    Live Activity Audit
                  </h3>
                  <span class="badge badge-confidential" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">SOC-2</span>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="App.navigate('activity-logs')" style="font-weight: 600;">Full Logs →</button>
              </div>

              <!-- Audit 1 -->
              <div class="dash-audit-item" style="border-left-color: #102A43;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-gold); margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 6px rgba(200, 155, 60, 0.6);"></div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.86rem; color: var(--color-primary); line-height: 1.35;">
                    <strong>Eleanor Vance, Esq.</strong>: AI Legal Draft Generated
                  </div>
                  <div style="color: var(--color-text-secondary); font-size: 0.75rem; margin-top: 0.2rem;">
                    Client Letter: Vanguard vs. Apex • <strong style="font-family: var(--font-mono); color: var(--color-text-muted);">10:45:12</strong>
                  </div>
                </div>
              </div>

              <!-- Audit 2 -->
              <div class="dash-audit-item" style="border-left-color: #C89B3C;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-gold); margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 6px rgba(200, 155, 60, 0.6);"></div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.86rem; color: var(--color-primary); line-height: 1.35;">
                    <strong>Julian Mercer, Esq.</strong>: Document Uploaded (Privileged)
                  </div>
                  <div style="color: var(--color-text-secondary); font-size: 0.75rem; margin-top: 0.2rem;">
                    Settlement_Framework_Thorne.pdf • <strong style="font-family: var(--font-mono); color: var(--color-text-muted);">09:30:00</strong>
                  </div>
                </div>
              </div>

              <!-- Audit 3 -->
              <div class="dash-audit-item" style="border-left-color: #16A34A;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #16A34A; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 6px rgba(22, 163, 74, 0.6);"></div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.86rem; color: var(--color-primary); line-height: 1.35;">
                    <strong>Marcus Bell</strong>: Task Status Updated to Completed
                  </div>
                  <div style="color: var(--color-text-secondary); font-size: 0.75rem; margin-top: 0.2rem;">
                    Archive Tax Hearing Record (TX-2025-0812) • <strong style="font-family: var(--font-mono); color: var(--color-text-muted);">16:22:40</strong>
                  </div>
                </div>
              </div>

              <!-- Audit 4 -->
              <div class="dash-audit-item" style="border-left-color: #2563EB;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #2563EB; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 6px rgba(37, 99, 235, 0.6);"></div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.86rem; color: var(--color-primary); line-height: 1.35;">
                    <strong>Eleanor Vance, Esq.</strong>: Invoice Created & Sent
                  </div>
                  <div style="color: var(--color-text-secondary); font-size: 0.75rem; margin-top: 0.2rem;">
                    INV-2026-081 ($15,776) • <strong style="font-family: var(--font-mono); color: var(--color-text-muted);">14:10:05</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  initCharts() {
    // 1. Donut Chart - Case Status Overview
    const ctxStatus = document.getElementById('caseStatusChart');
    if (ctxStatus) {
      const active = SLCMS_STATE.cases.filter(c => c.status === 'Active').length;
      const pending = SLCMS_STATE.cases.filter(c => c.status === 'Pending').length;
      const won = SLCMS_STATE.cases.filter(c => c.status === 'Won').length;
      const onHold = SLCMS_STATE.cases.filter(c => c.status === 'On Hold').length;

      new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Active Litigation', 'Pending Review', 'Won / Favorable', 'On Hold'],
          datasets: [{
            data: [active, pending, won, onHold],
            backgroundColor: ['#102A43', '#C89B3C', '#16A34A', '#64748B'],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } }
            }
          },
          cutout: '68%'
        }
      });
    }

    // 2. Bar Chart - Lawyer Workload
    const ctxWorkload = document.getElementById('lawyerWorkloadChart');
    if (ctxWorkload) {
      new Chart(ctxWorkload, {
        type: 'bar',
        data: {
          labels: ['Eleanor Vance, Esq.', 'Julian Mercer, Esq.', 'Marcus Bell (Clerk)', 'Sophia Chen'],
          datasets: [
            {
              label: 'Active Cases',
              data: [3, 2, 4, 3],
              backgroundColor: '#102A43',
              borderRadius: 6
            },
            {
              label: 'Assigned Tasks',
              data: [2, 3, 2, 1],
              backgroundColor: '#C89B3C',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }
};
