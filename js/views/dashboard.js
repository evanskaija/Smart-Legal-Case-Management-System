/* ==========================================================================
   SLCMS - Dashboard View
   Focused Academic Presentation Dashboard
   KPIs: Active cases, Registered clients, Pending tasks, Upcoming deadlines
   ========================================================================== */

const DashboardView = {
  render() {
    const user = SLCMS_STATE.currentUser;
    const activeCasesCount = SLCMS_STATE.getActiveCasesCount();
    const clientsCount = SLCMS_STATE.getClientsCount();
    const pendingTasksCount = SLCMS_STATE.getPendingTasksCount();
    const upcomingDeadlinesCount = SLCMS_STATE.getUpcomingDeadlinesCount();

    const realCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];
    const totalCasesCount = realCases.length;
    const closedCasesCount = realCases.filter(c => ['won', 'closed', 'resolved', 'concluded'].includes((c.status || '').toLowerCase())).length;
    const scheduledHearingsCount = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.courtAttendances)) ? SLCMS_STATE.courtAttendances.length : 0;

    const commCount = realCases.filter(c => /commercial|bank|financ|corp/i.test(c.caseType || c.type || c.category || c.title || '')).length;
    const civilCount = realCases.filter(c => /civil|contract|tort|dispute/i.test(c.caseType || c.type || c.category || c.title || '')).length;
    const landCount = realCases.filter(c => /land|property|real/i.test(c.caseType || c.type || c.category || c.title || '')).length;
    const constiCount = realCases.filter(c => /constitut|review|appeal/i.test(c.caseType || c.type || c.category || c.title || '')).length;
    const crimCount = realCases.filter(c => /crimin|penal/i.test(c.caseType || c.type || c.category || c.title || '')).length;

    const userCategoriesConfig = [
      { name: 'Commercial & Banking', count: commCount, color: '#6EE7B7' },
      { name: 'Civil Litigation', count: civilCount, color: '#6366F1' },
      { name: 'Land & Real Estate', count: landCount, color: '#38BDF8' },
      { name: 'Constitutional Review', count: constiCount, color: '#A78BFA' },
      { name: 'Criminal Defense & Appeals', count: crimCount, color: '#10B981' }
    ];

    const registeredUserCategories = userCategoriesConfig.filter(cat => cat.count > 0);

    let userCategoryChipsHtml = '';
    if (totalCasesCount === 0 || registeredUserCategories.length === 0) {
      userCategoryChipsHtml = `
        <div style="grid-column: 1 / -1; padding: 1.4rem 1.1rem; background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.16); border-radius: 14px; text-align: center;">
          <div style="font-size: 1.6rem; margin-bottom: 0.35rem;">📂</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF;">0 Matters Registered</div>
          <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 0.25rem; max-width: 320px; margin-left: auto; margin-right: auto; line-height: 1.4;">
            No legal matters currently on record. Registered legal cases and litigation files will appear here automatically.
          </div>
        </div>
      `;
    } else {
      userCategoryChipsHtml = registeredUserCategories.map((cat, idx) => `
        <div class="luxury-cat-legend-item">
          <span class="cat-legend-dot" style="--cat-color: ${cat.color};"></span>
          <div class="cat-legend-info">
            <div class="cat-legend-title">${cat.name}</div>
            <div class="cat-legend-amount" id="user-cat-val-${idx + 1}">${cat.count} ${cat.count === 1 ? 'Case' : 'Cases'}</div>
          </div>
        </div>
      `).join('');
    }

    return `
      <div class="animate-fade">
        <!-- 1. TOP WELCOME HERO BANNER -->
        <div class="dashboard-welcome-banner" style="background: linear-gradient(135deg, #102A43 0%, #0B1F33 100%); border: 1px solid var(--color-gold); border-radius: var(--radius-lg); padding: 1.5rem 1.75rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: var(--shadow-md);">
          <div>
            <div class="flex items-center gap-2" style="margin-bottom: 0.35rem;">
              <h1 style="font-size: 1.65rem; color: #FFFFFF; font-weight: 700; margin: 0; font-family: var(--font-heading);">
                Welcome, ${user.name}
              </h1>
              <span class="badge badge-confidential" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;">
                ${user.role}
              </span>
            </div>
            <p style="color: #CBD5E1; font-size: 0.92rem; margin: 0;">
              Smart Legal Case Management System &middot; <strong>Register cases → Manage legal work → Research Tanzanian judgments with AI</strong>.
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button class="btn" onclick="App.navigate('case-library')" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #FFFFFF; font-weight: 600; display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.45rem 0.95rem; border-radius: var(--radius-sm); transition: all 0.2s;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>Case Library</span>
            </button>
          </div>
        </div>

        <!-- 2. QUICK ACTION COMMAND RIBBON (EXECUTIVE PRACTICE & AI WORKFLOWS) -->
        <div class="slcms-quick-actions-bar">
          <div class="qa-brand-label">
            <div class="qa-brand-icon-box">⚡</div>
            <div>
              <div class="qa-brand-title">Quick Action Center</div>
              <div class="qa-brand-sub">Primary practice workflows &amp; AI intelligence studio</div>
            </div>
          </div>
          
          <div class="qa-button-group">
            ${SLCMS_STATE.currentUser?.role === 'Administrator' ? '' : `
            <button class="qa-btn-op" onclick="CasesView.openNewCaseModal()" title="Register a new legal case file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              <span>Add Case</span>
            </button>
            `}
            <button class="qa-btn-op" onclick="ClientsView.openNewClientModal()" title="Register an individual or corporate client">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              <span>Add Client</span>
            </button>
            <button class="qa-btn-op" onclick="TasksView.openNewTaskModal()" title="Create an internal task or court deadline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span>Create Task</span>
            </button>
          </div>
        </div>

        <!-- 3. FOUR PRIMARY METRIC KPI CARDS -->
        <div class="stat-cards-grid" style="gap: 1rem; margin-bottom: 1.5rem;">
          <!-- 1. Active Cases -->
          <div class="stat-card" onclick="App.navigate('cases')" style="cursor: pointer;" id="kpi-active-cases-card">
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
              <span class="${activeCasesCount === 0 ? 'stat-trend-muted' : 'stat-trend-up'}">
                ${activeCasesCount === 0 ? 'No active cases' : `${activeCasesCount} active / ${SLCMS_STATE.cases.length} total`}
              </span>
              <span style="color: var(--color-gold); font-weight: 600;">View Cases →</span>
            </div>
          </div>

          <!-- 2. Registered Clients -->
          <div class="stat-card" onclick="App.navigate('clients')" style="cursor: pointer;" id="kpi-registered-clients-card">
            <div class="stat-card-top">
              <div>
                <div class="stat-value">${clientsCount}</div>
                <div class="stat-label">Registered Clients</div>
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
              <span class="${clientsCount === 0 ? 'stat-trend-muted' : 'stat-trend-up'}">
                ${clientsCount === 0 ? 'No clients registered' : `${clientsCount} registered clients`}
              </span>
              <span style="color: var(--color-gold); font-weight: 600;">Client Directory →</span>
            </div>
          </div>

          <!-- 3. Pending Tasks -->
          <div class="stat-card" onclick="App.navigate('tasks')" style="cursor: pointer;" id="kpi-pending-tasks-card">
            <div class="stat-card-top">
              <div>
                <div class="stat-value">${pendingTasksCount}</div>
                <div class="stat-label">Pending Tasks</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-navy">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
            </div>
            <div class="stat-footer">
              <span class="${pendingTasksCount === 0 ? 'stat-trend-muted' : 'stat-trend-up'}">
                ${pendingTasksCount === 0 ? 'No pending tasks' : `${pendingTasksCount} actionable tasks`}
              </span>
              <span style="color: var(--color-gold); font-weight: 600;">Task Board →</span>
            </div>
          </div>

          <!-- 4. Upcoming Deadlines -->
          <div class="stat-card" onclick="if (typeof TasksView !== 'undefined') TasksView.activeView = 'calendar'; App.navigate('tasks');" style="cursor: pointer;" id="kpi-upcoming-deadlines-card">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: ${upcomingDeadlinesCount > 0 ? 'var(--color-danger)' : 'inherit'};">${upcomingDeadlinesCount}</div>
                <div class="stat-label">Upcoming Deadlines</div>
              </div>
              <div class="stat-icon-wrapper ${upcomingDeadlinesCount > 0 ? 'stat-icon-red' : 'stat-icon-navy'}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div class="stat-footer">
              <span class="${upcomingDeadlinesCount === 0 ? 'stat-trend-muted' : 'stat-trend-alert'}">
                ${upcomingDeadlinesCount === 0 ? 'No upcoming deadlines' : `⚡ ${upcomingDeadlinesCount} scheduled deadlines`}
              </span>
              <span style="color: var(--color-danger); font-weight: 600;">Calendar →</span>
            </div>
          </div>
        </div>

        <!-- 4. TANZANIAN CASE LAW BY YEAR QUICK EXPLORER -->
        <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, rgba(16,42,67,0.85) 0%, rgba(11,31,51,0.95) 100%); border: 1px solid rgba(200,155,60,0.35); box-shadow: 0 4px 20px rgba(0,0,0,0.25);">
          <div style="padding: 1rem 1.4rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div class="flex items-center gap-2.5">
              <span style="font-size: 1.3rem;">⚖️</span>
              <div>
                <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #FFFFFF; font-family: var(--font-heading); display: flex; align-items: center; gap: 0.5rem;">
                  <span>Tanzanian Judgments Repository (2020 – 2026)</span>
                  <span class="badge badge-gold" style="font-size: 0.7rem;">${SLCMS_STATE.tanzaniaJudgments.length} Decisions</span>
                </h3>
                <p style="margin: 0.15rem 0 0 0; font-size: 0.8rem; color: #94A3B8;">
                  Explore authentic Tanzanian High Court and Court of Appeal precedents indexed for AI
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-gold btn-sm" onclick="App.navigate('case-library')" style="font-size: 0.8rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>Browse Full Case Library</span>
              </button>
            </div>
          </div>
          <div style="padding: 0.85rem 1.4rem; background: rgba(0,0,0,0.18);">
            <div class="tz-year-pills-row" style="margin: 0; display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="tz-year-pill tz-year-pill-latest active" onclick="CaseLibraryView.setYearFilter('2026'); App.navigate('case-library');">
                <span class="pill-year">✨ 2026</span>
                <span class="tz-year-pill-count">${SLCMS_STATE.tanzaniaJudgments.filter(j => j.year == 2026).length} Latest</span>
              </button>
              <button class="tz-year-pill" onclick="CaseLibraryView.setYearFilter('2025'); App.navigate('case-library');">
                <span class="pill-year">2025</span>
                <span class="tz-year-pill-count">${SLCMS_STATE.tanzaniaJudgments.filter(j => j.year == 2025).length}</span>
              </button>
              <button class="tz-year-pill" onclick="CaseLibraryView.setYearFilter('2024'); App.navigate('case-library');">
                <span class="pill-year">2024</span>
                <span class="tz-year-pill-count">${SLCMS_STATE.tanzaniaJudgments.filter(j => j.year == 2024).length}</span>
              </button>
              <button class="tz-year-pill" onclick="CaseLibraryView.setYearFilter('2023'); App.navigate('case-library');">
                <span class="pill-year">2023</span>
                <span class="tz-year-pill-count">${SLCMS_STATE.tanzaniaJudgments.filter(j => j.year == 2023).length}</span>
              </button>
              <button class="tz-year-pill" onclick="CaseLibraryView.setYearFilter('2022'); App.navigate('case-library');">
                <span class="pill-year">2022</span>
                <span class="tz-year-pill-count">${SLCMS_STATE.tanzaniaJudgments.filter(j => j.year == 2022).length}</span>
              </button>
              <button class="tz-year-pill" onclick="CaseLibraryView.setYearFilter('2021'); App.navigate('case-library');">
                <span class="pill-year">2021</span>
                <span class="tz-year-pill-count">${SLCMS_STATE.tanzaniaJudgments.filter(j => j.year == 2021).length}</span>
              </button>
              <button class="tz-year-pill" onclick="CaseLibraryView.setYearFilter('2020'); App.navigate('case-library');">
                <span class="pill-year">2020</span>
                <span class="tz-year-pill-count">${SLCMS_STATE.tanzaniaJudgments.filter(j => j.year == 2020).length}</span>
              </button>
              <button class="tz-year-pill tz-year-pill-all" onclick="CaseLibraryView.setYearFilter('ALL'); App.navigate('case-library');">
                <span class="pill-year">🔍 All Years (${SLCMS_STATE.tanzaniaJudgments.length})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 5. LUXURY PRACTICE & CASEWORK ANALYTICS ROW -->
        <div class="luxury-analytics-grid luxury-analytics-grid-2col">
          <!-- CARD 1: CASEWORK FORECAST & VELOCITY (PERIWINKLE LUXURY CARD) -->
          <div class="luxury-forecast-card">
            <div class="luxury-forecast-header">
              <div>
                <h3 class="luxury-forecast-title">Casework Forecast</h3>
                <span class="luxury-forecast-sub">Hearing Velocity &amp; Litigation Milestones</span>
              </div>
              <button class="luxury-filter-btn" onclick="DashboardView.cycleUserForecastPeriod(event)">
                <span id="user-forecast-filter-label">Monthly</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>

            <div class="luxury-forecast-body">
              <!-- Left Stack: 2 Stat Pills -->
              <div class="luxury-pill-stack">
                <div class="luxury-stat-pill luxury-pill-white">
                  <span class="luxury-pill-label">Active Matters</span>
                  <div class="luxury-pill-value" id="user-pill-active-val">${activeCasesCount}<span class="luxury-pill-unit">${activeCasesCount === 1 ? 'Case' : 'Cases'}</span></div>
                  <div class="luxury-pill-trend">${activeCasesCount > 0 ? `<span class="trend-up">&uarr; ${activeCasesCount} active</span> in chambers` : `<span style="color: #64748B;">0 active cases</span>`}</div>
                </div>

                <div class="luxury-stat-pill luxury-pill-dark">
                  <span class="luxury-pill-label">Concluded Matters</span>
                  <div class="luxury-pill-value" id="user-pill-resolved-val">${closedCasesCount}<span class="luxury-pill-unit">${closedCasesCount === 1 ? 'Matter' : 'Matters'}</span></div>
                  <div class="luxury-pill-trend">${closedCasesCount > 0 ? `<span class="trend-gold">&bull; ${closedCasesCount} closed</span> favorable` : `<span style="color: #94A3B8;">0 closed matters</span>`}</div>
                </div>
              </div>

              <!-- Right: Elevated Inner Card with Live Badge and Multi-Bar Chart -->
              <div class="luxury-chart-inner-card">
                <div class="luxury-chart-top-bar">
                  <span class="luxury-live-badge">
                    <span class="live-pulse-dot"></span> Live
                  </span>
                  <div class="luxury-chart-metric-callout">
                    <div class="luxury-callout-value" id="user-callout-avg-val">${scheduledHearingsCount}<span class="unit">Sessions</span></div>
                    <div class="luxury-callout-label">Scheduled Court Hearings</div>
                  </div>
                </div>
                <div class="luxury-chart-canvas-wrapper">
                  <canvas id="userCaseworkForecastChart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 2: MATTERS BY LEGAL CATEGORY (DARK CHARCOAL LUXURY CARD) -->
          <div class="luxury-category-card">
            <div class="luxury-category-header">
              <div>
                <h3 class="luxury-category-title">Matters by Category</h3>
                <span class="luxury-category-sub">Practice Distribution &amp; Portfolio Breakdown</span>
              </div>
              <button class="luxury-filter-btn luxury-filter-btn-dark" onclick="DashboardView.cycleUserCategoryFilter(event)">
                <span id="user-category-filter-label">All Areas</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>

            <div class="luxury-category-body">
              <!-- Left: Segmented Donut with Rounded Ends & Center Callout -->
              <div class="luxury-donut-wrapper">
                <canvas id="userPracticeCategoryChart"></canvas>
                <div class="luxury-donut-center-badge">
                  <div class="donut-center-val" id="user-donut-total-val">${totalCasesCount}</div>
                  <div class="donut-center-sub">${totalCasesCount === 0 ? 'NO MATTERS' : (totalCasesCount === 1 ? 'MATTER' : 'TOTAL MATTERS')}</div>
                </div>
              </div>

              <!-- Right: Category Legend Chips with Color Dots -->
              <div class="luxury-category-legend-grid">
                ${userCategoryChipsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- 6. STREAMLINED RECENT PRACTICE ACTIVITY STREAM -->
        <div class="card" style="margin-bottom: 1.5rem; box-shadow: var(--shadow-xs);">
          <div class="card-header">
            <div>
              <h3 class="card-title" style="font-size: 1.05rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                Recent Practice Activity &amp; Casework Stream
              </h3>
              <p class="card-subtitle">Live litigation updates, filings &amp; matter actions across firm chambers</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('cases')">View All Cases &rarr;</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; padding: 0.5rem 0;">
            ${(SLCMS_STATE.auditLogs || SLCMS_STATE.activityLogs || []).slice(0, 4).map(l => {
              const isAi = (l.action || '').toLowerCase().includes('ai') || (l.details || '').toLowerCase().includes('draft');
              const isTask = (l.action || '').toLowerCase().includes('task');
              const isCase = (l.action || '').toLowerCase().includes('case');
              const icon = isAi ? '⚖️' : (isTask ? '✅' : (isCase ? '📁' : '🏛️'));

              return `
                <div class="dash-audit-timeline-item" style="border: 1px solid var(--color-border-subtle); border-radius: 12px; padding: 0.75rem 1rem;">
                  <span style="font-size: 1.15rem; flex-shrink: 0; margin-top: 0.1rem;">${icon}</span>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.82rem; color: var(--color-primary); line-height: 1.35;">
                      <strong>${l.user || l.userName || 'Advocate'}</strong>: ${l.action || l.details}
                    </div>
                    <div style="color: var(--color-text-secondary); font-size: 0.72rem; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.4rem;">
                      <span class="badge" style="background: var(--color-surface-subtle); font-size: 0.65rem; padding: 0.1rem 0.35rem;">${l.module || 'Litigation'}</span>
                      <span style="font-family: var(--font-mono); color: var(--color-text-muted);">${l.timestamp || 'Today'}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 6. OPERATIONAL WIDGETS GRID (DEADLINES, CASES, TASKS, BACKGROUND LOGS) -->
        <div class="dashboard-widgets-grid">
          <!-- WIDGET 1: Upcoming Court Dates & Statutory Deadlines -->
          <div class="dash-widget-card">
            <div class="dash-widget-header">
              <h3 class="dash-widget-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-danger);">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Upcoming Deadlines &amp; Hearings
              </h3>
              <button class="btn btn-secondary btn-sm" onclick="TasksView.switchView('calendar'); App.navigate('tasks');">Calendar</button>
            </div>

            ${(() => {
              const hasCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases) && SLCMS_STATE.cases.length > 0);
              if (typeof TasksView !== 'undefined' && typeof TasksView.syncCourtEvents === 'function') {
                TasksView.syncCourtEvents();
              }
              const events = hasCases && (typeof TasksView !== 'undefined' && Array.isArray(TasksView.courtEvents)) 
                ? TasksView.courtEvents 
                : [];
              if (events.length === 0) {
                return `
                  <div style="padding: 2rem 1rem; text-align: center; color: var(--color-text-muted);">
                    <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">📅</div>
                    <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary);">No deadlines scheduled</div>
                    <p style="font-size: 0.78rem; margin: 0.25rem 0 1rem 0; color: var(--color-text-secondary);">Court appearances and statutory deadlines will appear here once scheduled.</p>
                    <button class="btn btn-secondary btn-sm" onclick="TasksView.activeView = 'calendar'; App.navigate('tasks');">Open Calendar</button>
                  </div>
                `;
              }
              return events.slice(0, 3).map(e => `
                <div class="dash-docket-card" onclick="TasksView.activeView = 'calendar'; App.navigate('tasks');" style="cursor: pointer;">
                  <div class="dash-docket-date-badge">
                    <span class="dash-docket-month">${e.monthShort || 'DUE'}</span>
                    <span class="dash-docket-day">${e.dayNum || '01'}</span>
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div class="flex items-center gap-2 flex-wrap" style="margin-bottom: 0.2rem;">
                      <strong style="color: var(--color-primary); font-size: 0.88rem;">${e.title}</strong>
                      <span class="badge badge-priority-${(e.priority || 'medium').toLowerCase()}" style="font-size: 0.65rem; padding: 0.1rem 0.45rem;">${(e.priority || 'Medium').toUpperCase()}</span>
                    </div>
                    <div style="font-size: 0.76rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                      <span>🏛️ ${e.court || 'High Court of Tanzania'}</span>
                      <span>&bull;</span>
                      <span>Case: <strong>${e.caseNumber || 'N/A'}</strong></span>
                    </div>
                  </div>
                  <div class="text-right" style="flex-shrink: 0;">
                    <span class="badge badge-active" style="font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.55rem;">
                      ${e.type || 'SCHEDULED'}
                    </span>
                    <div style="font-size: 0.7rem; color: var(--color-danger); font-weight: 600; margin-top: 0.2rem;">${e.date || 'Upcoming'}</div>
                  </div>
                </div>
              `).join('');
            })()}
          </div>

          <!-- WIDGET 2: Active Case Matters -->
          <div class="dash-widget-card">
            <div class="dash-widget-header">
              <h3 class="dash-widget-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Active Case Matters
              </h3>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('cases')" style="font-weight: 600;">All Cases →</button>
            </div>

            ${SLCMS_STATE.cases.length === 0 ? `
              <div style="padding: 2rem 1rem; text-align: center; color: var(--color-text-muted);">
                <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">📁</div>
                <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary);">No cases yet</div>
                <p style="font-size: 0.78rem; margin: 0.25rem 0 1rem 0; color: var(--color-text-secondary);">No active legal matters registered in the repository.</p>
                ${SLCMS_STATE.currentUser?.role === 'Administrator' ? '' : `
                <button class="btn btn-gold btn-sm" onclick="CasesView.openNewCaseModal()">+ Add New Case</button>
                `}
              </div>
            ` : SLCMS_STATE.cases.slice(0, 3).map(c => `
              <div class="dash-case-dossier-card" onclick="CasesView.openCaseDetails('${c.id}')">
                <div class="flex items-center justify-between" style="margin-bottom: 0.35rem;">
                  <span style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 800; color: var(--color-gold); background: rgba(200,155,60,0.1); padding: 0.15rem 0.45rem; border-radius: 4px;">
                    ${c.caseNumber}
                  </span>
                  <span class="badge badge-${(c.status || 'active').toLowerCase().replace(' ', '')}" style="font-size: 0.68rem; padding: 0.15rem 0.55rem;">
                    ${c.status}
                  </span>
                </div>
                <div class="dash-case-title-link" style="font-weight: 700; font-size: 0.9rem; color: var(--color-primary); margin-bottom: 0.3rem; transition: color 0.2s;">
                  ${c.title}
                </div>
                <div class="flex items-center justify-between" style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 0.35rem;">
                  <span>🏢 <strong>${c.client}</strong></span>
                  <span style="font-weight: 700; color: var(--color-primary); font-family: var(--font-mono);">${c.progressPct || 25}% Prepared</span>
                </div>
                <div class="progress-bar-container" style="height: 6px; background: var(--color-surface-subtle); border-radius: 3px; overflow: hidden; border: 1px solid var(--color-border-subtle);">
                  <div class="progress-bar-fill" style="width: ${c.progressPct || 25}%; height: 100%; background: linear-gradient(90deg, #102A43 0%, #C89B3C 100%);"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- WIDGET 3: Critical Tasks & Deadlines -->
          <div class="dash-widget-card">
            <div class="dash-widget-header">
              <h3 class="dash-widget-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Critical Tasks &amp; Deadlines
              </h3>
              <button class="btn btn-secondary btn-sm" onclick="TasksView.openNewTaskModal()">+ Add Task</button>
            </div>

            ${SLCMS_STATE.tasks.length === 0 ? `
              <div style="padding: 2rem 1rem; text-align: center; color: var(--color-text-muted);">
                <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">📋</div>
                <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary);">No tasks assigned</div>
                <p style="font-size: 0.78rem; margin: 0.25rem 0 1rem 0; color: var(--color-text-secondary);">No actionable litigation or administrative tasks assigned yet.</p>
                <button class="btn btn-gold btn-sm" onclick="TasksView.openNewTaskModal()">+ Create Task</button>
              </div>
            ` : SLCMS_STATE.tasks.slice(0, 3).map(t => `
              <div class="dash-task-item-row">
                <div class="flex items-center gap-2.5" style="flex: 1; min-width: 0;">
                  <input type="checkbox" ${t.status === 'completed' ? 'checked' : ''} onchange="TasksView.toggleTaskStatus('${t.id}')" style="cursor: pointer; width: 17px; height: 17px; accent-color: var(--color-gold); flex-shrink: 0;">
                  <div style="min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary); line-height: 1.35; ${t.status === 'completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                      ${t.title}
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                      <span style="color: var(--color-primary); font-weight: 600;">${t.caseTitle || t.caseNumber}</span>
                      <span>&bull;</span>
                      <span>👤 ${t.assignedTo}</span>
                    </div>
                  </div>
                </div>
                <span class="badge badge-priority-${(t.priority || 'medium').toLowerCase()}" style="font-size: 0.68rem; margin-left: 0.5rem; flex-shrink: 0;">
                  ${t.priority}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- WIDGET 4: Background System Activity Log -->
          <div class="dash-widget-card">
            <div class="dash-widget-header">
              <div class="flex items-center gap-2">
                <h3 class="dash-widget-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  System Activity Log
                </h3>
                <span class="badge badge-confidential" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Automated</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              ${(SLCMS_STATE.auditLogs || SLCMS_STATE.activityLogs || []).slice(0, 3).map(l => {
                const isAi = (l.action || '').toLowerCase().includes('ai') || (l.details || '').toLowerCase().includes('draft');
                const isDoc = (l.action || '').toLowerCase().includes('document') || (l.details || '').toLowerCase().includes('upload');
                const isTask = (l.action || '').toLowerCase().includes('task');
                const icon = isAi ? '✍️' : (isDoc ? '📄' : (isTask ? '✅' : '⚖️'));

                return `
                  <div class="dash-audit-timeline-item">
                    <span style="font-size: 1.1rem; flex-shrink: 0; margin-top: 0.1rem;">${icon}</span>
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 0.82rem; color: var(--color-primary); line-height: 1.35;">
                        <strong>${l.user || l.userName || 'Advocate'}</strong>: ${l.action || l.details}
                      </div>
                      <div style="color: var(--color-text-secondary); font-size: 0.72rem; margin-top: 0.15rem; display: flex; align-items: center; gap: 0.4rem;">
                        <span class="badge" style="background: var(--color-surface-subtle); font-size: 0.65rem; padding: 0.1rem 0.35rem;">${l.module || 'Matter'}</span>
                        <span style="font-family: var(--font-mono); color: var(--color-text-muted);">${l.timestamp || 'Today'}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initCharts() {
    if (typeof Chart === 'undefined') return;

    const realCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];
    const realAttendances = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.courtAttendances)) ? SLCMS_STATE.courtAttendances : [];
    const realTasks = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.tasks)) ? SLCMS_STATE.tasks : [];

    // 1. User Casework Forecast Multi-Bar Chart (Jan - May)
    const ctxForecast = document.getElementById('userCaseworkForecastChart');
    if (ctxForecast) {
      if (this._userForecastChart) {
        try { this._userForecastChart.destroy(); } catch (e) {}
      }

      // Compute monthly distribution (Jan-May)
      const caseMonthly = [0, 0, 0, 0, 0];
      realCases.forEach(c => {
        const d = c.createdAt || c.filingDate || c.date;
        if (d) {
          const m = new Date(d).getMonth();
          if (m >= 0 && m < 5) caseMonthly[m]++;
        }
      });

      const attendMonthly = [0, 0, 0, 0, 0];
      realAttendances.forEach(a => {
        const d = a.date || a.hearingDate || a.createdAt;
        if (d) {
          const m = new Date(d).getMonth();
          if (m >= 0 && m < 5) attendMonthly[m]++;
        }
      });

      const taskMonthly = [0, 0, 0, 0, 0];
      realTasks.forEach(t => {
        const d = t.dueDate || t.createdAt;
        if (d) {
          const m = new Date(d).getMonth();
          if (m >= 0 && m < 5) taskMonthly[m]++;
        }
      });

      const maxVal = Math.max(5, ...caseMonthly, ...attendMonthly, ...taskMonthly);

      const ctx = ctxForecast.getContext('2d');
      this._userForecastChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              label: 'Registered Cases',
              data: caseMonthly,
              backgroundColor: '#6366F1', // Pastel Purple / Indigo
              borderRadius: 6,
              barPercentage: 0.65,
              categoryPercentage: 0.65
            },
            {
              label: 'Court Hearings',
              data: attendMonthly,
              backgroundColor: '#10B981', // Mint Green
              borderRadius: 6,
              barPercentage: 0.65,
              categoryPercentage: 0.65
            },
            {
              label: 'Practice Tasks',
              data: taskMonthly,
              backgroundColor: '#38BDF8', // Sky Blue
              borderRadius: 6,
              barPercentage: 0.65,
              categoryPercentage: 0.65
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 650, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              titleFont: { family: 'Inter', size: 12, weight: '700' },
              bodyFont: { family: 'Inter', size: 11 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  return ` ${context.dataset.label}: ${context.raw} records`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false, drawBorder: false },
              ticks: {
                color: '#94A3B8',
                font: { family: 'Inter', size: 11, weight: '600' }
              }
            },
            y: {
              display: false,
              grid: { display: false },
              beginAtZero: true,
              suggestedMax: maxVal
            }
          }
        }
      });
    }

    // 2. Matters by Category Segmented Ring Chart with rounded caps
    const ctxCategory = document.getElementById('userPracticeCategoryChart');
    if (ctxCategory) {
      if (this._userCategoryChart) {
        try { this._userCategoryChart.destroy(); } catch (e) {}
      }

      const commCount = realCases.filter(c => /commercial|bank|financ|corp/i.test(c.caseType || c.type || c.category || c.title || '')).length;
      const civilCount = realCases.filter(c => /civil|contract|tort|dispute/i.test(c.caseType || c.type || c.category || c.title || '')).length;
      const landCount = realCases.filter(c => /land|property|real/i.test(c.caseType || c.type || c.category || c.title || '')).length;
      const constiCount = realCases.filter(c => /constitut|review|appeal/i.test(c.caseType || c.type || c.category || c.title || '')).length;
      const crimCount = realCases.filter(c => /crimin|penal/i.test(c.caseType || c.type || c.category || c.title || '')).length;

      const activeCategories = [
        { label: 'Commercial & Banking', count: commCount, color: '#6EE7B7' },
        { label: 'Civil Litigation', count: civilCount, color: '#6366F1' },
        { label: 'Land & Real Estate', count: landCount, color: '#38BDF8' },
        { label: 'Constitutional Review', count: constiCount, color: '#A78BFA' },
        { label: 'Criminal Defense & Appeals', count: crimCount, color: '#10B981' }
      ].filter(cat => cat.count > 0);

      const hasCases = activeCategories.length > 0;
      const chartLabels = hasCases ? activeCategories.map(c => c.label) : ['No Matters Registered'];
      const chartData = hasCases ? activeCategories.map(c => c.count) : [1];
      const chartColors = hasCases ? activeCategories.map(c => c.color) : ['rgba(255, 255, 255, 0.08)'];

      const ctxCat = ctxCategory.getContext('2d');
      this._userCategoryChart = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels: chartLabels,
          datasets: [{
            data: chartData,
            backgroundColor: chartColors,
            borderWidth: 0,
            hoverOffset: hasCases ? 6 : 0,
            borderRadius: hasCases ? 8 : 0,
            spacing: hasCases ? 5 : 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          animation: { duration: 750, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: hasCases,
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              titleFont: { family: 'Inter', size: 12, weight: '700' },
              bodyFont: { family: 'Inter', size: 11 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  return ` ${context.label}: ${context.raw} matters`;
                }
              }
            }
          }
        }
      });
    }

    // 3. Fallback Legacy Status Chart if in DOM
    const ctxStatus = document.getElementById('caseStatusChart');
    if (ctxStatus) {
      const active = realCases.filter(c => c.status === 'Active').length;
      const pending = realCases.filter(c => c.status === 'Pending').length;
      const won = realCases.filter(c => c.status === 'Won').length;
      const onHold = realCases.filter(c => c.status === 'On Hold').length;
      const hasStatusData = (active + pending + won + onHold) > 0;

      if (this._chartInstance) {
        try { this._chartInstance.destroy(); } catch (e) {}
      }

      this._chartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: hasStatusData ? ['Active', 'Pending Review', 'Won / Favorable', 'On Hold'] : ['No Matters Registered'],
          datasets: [{
            data: hasStatusData ? [active, pending, won, onHold] : [1],
            backgroundColor: hasStatusData ? ['#102A43', '#C89B3C', '#16A34A', '#64748B'] : ['rgba(0,0,0,0.06)'],
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
  },

  cycleUserForecastPeriod(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    this._forecastMode = (this._forecastMode || 0) + 1;
    if (this._forecastMode > 2) this._forecastMode = 0;

    const periods = ['Monthly', 'Quarterly', 'YTD'];
    const realCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];
    const realAttendances = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.courtAttendances)) ? SLCMS_STATE.courtAttendances : [];
    const activeCases = realCases.filter(c => (c.status || '').toLowerCase() === 'active').length;
    const closedCases = realCases.filter(c => ['won', 'closed', 'resolved', 'concluded'].includes((c.status || '').toLowerCase())).length;

    const filterBtn = document.getElementById('user-forecast-filter-label');
    if (filterBtn) filterBtn.textContent = periods[this._forecastMode];

    const activeEl = document.getElementById('user-pill-active-val');
    if (activeEl) activeEl.innerHTML = `${activeCases}<span class="luxury-pill-unit">${activeCases === 1 ? 'Case' : 'Cases'}</span>`;

    const resolvedEl = document.getElementById('user-pill-resolved-val');
    if (resolvedEl) resolvedEl.innerHTML = `${closedCases}<span class="luxury-pill-unit">${closedCases === 1 ? 'Matter' : 'Matters'}</span>`;

    const avgEl = document.getElementById('user-callout-avg-val');
    if (avgEl) avgEl.innerHTML = `${realAttendances.length}<span class="unit">Sessions</span>`;
  },

  cycleUserCategoryFilter(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    this._categoryMode = (this._categoryMode || 0) + 1;
    if (this._categoryMode > 2) this._categoryMode = 0;

    const modes = ['All Areas', 'Commercial & Civil', 'Public & Appeals'];
    const realCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];

    const filterBtn = document.getElementById('user-category-filter-label');
    if (filterBtn) filterBtn.textContent = modes[this._categoryMode];

    const totalEl = document.getElementById('user-donut-total-val');
    if (totalEl) totalEl.textContent = String(realCases.length);
  }
};
