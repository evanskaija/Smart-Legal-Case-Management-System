/* ==========================================================================
   SLCMS - Tasks & Statutory Deadlines (Kanban, List & Calendar Views)
   ========================================================================== */

const TasksView = {
  activeView: 'kanban', // 'kanban' | 'list' | 'calendar'
  filterPriority: 'All', // 'All' | 'High' | 'Medium' | 'Low'
  adminFilter: 'all', // 'all' | 'unassigned' | 'technical' | 'overdue'
  searchQuery: '',

  render() {
    const isAdmin = (SLCMS_STATE.currentUser?.role === 'Administrator');
    const unassignedCount = (SLCMS_STATE.tasks || []).filter(t => !t.assignedTo || t.assignedTo === 'Unassigned').length;
    const techCount = (SLCMS_STATE.tasks || []).filter(t => t.isTechnical || t.category === 'technical').length;
    const overdueCount = (SLCMS_STATE.tasks || []).filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date('2026-09-08')).length;

    return `
      <div class="animate-fade">
        <!-- 1. VIEW HEADER -->
        <div class="view-header">
          <div>
            <div class="flex items-center gap-2" style="margin-bottom: 0.25rem; flex-wrap: wrap;">
              <h1 class="page-title">Tasks &amp; Statutory Deadlines</h1>
              <span class="badge badge-confidential" style="font-size: 0.72rem; white-space: nowrap;">
                Statutory Docket Rules Active
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">
              Track litigation milestones, motion filing schedules, discovery depositions and reminders
            </p>
          </div>

          <div class="flex items-center gap-3">
            <div class="view-toggle">
              <button class="view-toggle-btn ${this.activeView === 'kanban' ? 'active' : ''}" onclick="TasksView.switchView('kanban')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M9 3v18"/>
                  <path d="M15 3v18"/>
                </svg>
                <span>Kanban Board</span>
              </button>
              <button class="view-toggle-btn ${this.activeView === 'list' ? 'active' : ''}" onclick="TasksView.switchView('list')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>List View</span>
              </button>
              <button class="view-toggle-btn ${this.activeView === 'calendar' ? 'active' : ''}" onclick="TasksView.switchView('calendar')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Court Calendar</span>
              </button>
            </div>

            <button class="btn btn-gold" onclick="TasksView.openNewTaskModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Create Task</span>
            </button>
          </div>
        </div>

        ${isAdmin ? `
          <!-- ADMINISTRATOR TASK OVERSIGHT & GOVERNANCE BAR -->
          <div class="card animate-fade adm-oversight-card" style="margin-bottom: 0.85rem; padding: 0.85rem 1rem; border-left: 4px solid var(--color-gold); background: linear-gradient(135deg, rgba(16,42,67,0.03) 0%, rgba(200,155,60,0.08) 100%);">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div class="flex items-center gap-2 flex-wrap" style="min-width: 0;">
                <span style="font-size: 1.1rem; flex-shrink: 0;">👑</span>
                <div class="flex items-center gap-2 flex-wrap" style="min-width: 0;">
                  <strong style="color: var(--color-primary); font-size: 0.90rem;">Administrator Task Oversight</strong>
                  <span class="badge badge-confidential" style="font-size: 0.65rem; white-space: nowrap;">Technical Governance</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap adm-oversight-action-btns">
                <button class="btn btn-gold btn-sm" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;" onclick="TasksView.openCreateTechnicalTaskModal()">
                  Create Technical Task
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;" onclick="TasksView.notifyResponsibleUsers()">
                  🔔 Notify Users
                </button>
              </div>
            </div>

            <!-- Administrative Views Filters (Smooth Touch Strip on Mobile) -->
            <div style="padding-top: 0.4rem; border-top: 1px solid rgba(0,0,0,0.06);">
              <div class="flex items-center gap-1.5 flex-wrap adm-filter-pills-row" style="overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 2px;">
                <span style="color: var(--color-text-secondary); font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px; flex-shrink: 0;">Views:</span>
                <button class="btn ${this.adminFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm" style="font-size: 0.74rem; padding: 0.25rem 0.55rem; white-space: nowrap; flex-shrink: 0; border-radius: 16px;" onclick="TasksView.setAdminFilter('all')">
                  All (${SLCMS_STATE.tasks.length})
                </button>
                <button class="btn ${this.adminFilter === 'unassigned' ? 'btn-danger' : 'btn-ghost'} btn-sm" style="font-size: 0.74rem; padding: 0.25rem 0.55rem; white-space: nowrap; flex-shrink: 0; border-radius: 16px;" onclick="TasksView.setAdminFilter('unassigned')">
                  ⚠️ Unassigned (${unassignedCount})
                </button>
                <button class="btn ${this.adminFilter === 'technical' ? 'btn-gold' : 'btn-ghost'} btn-sm" style="font-size: 0.74rem; padding: 0.25rem 0.55rem; white-space: nowrap; flex-shrink: 0; border-radius: 16px;" onclick="TasksView.setAdminFilter('technical')">
                  ⚙️ Tech (${techCount})
                </button>
                <button class="btn ${this.adminFilter === 'overdue' ? 'btn-danger' : 'btn-ghost'} btn-sm" style="font-size: 0.74rem; padding: 0.25rem 0.55rem; white-space: nowrap; flex-shrink: 0; border-radius: 16px;" onclick="TasksView.setAdminFilter('overdue')">
                  ⏰ Overdue (${overdueCount})
                </button>
              </div>
            </div>

            <div style="font-size: 0.70rem; color: var(--color-text-muted); line-height: 1.3; margin-top: 0.35rem;">
              ⚖️ <strong>Legal Practice Restriction:</strong> Administrator cannot approve lawyer work, alter court statutory deadlines, or complete filings on behalf of counsel.
            </div>
          </div>
        ` : ''}

        <!-- 2. FILTER & SEARCH TOOLBAR -->
        <div class="filter-bar">
          <div class="input-with-icon" style="flex: 1; min-width: 260px;">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control" placeholder="Search tasks by title, case number, or assignee..."
                   value="${this.searchQuery}" oninput="TasksView.handleSearch(this.value)">
          </div>

          <div class="flex items-center gap-2">
            <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 600;">Priority Filter:</span>
            <button class="btn ${this.filterPriority === 'All' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TasksView.setPriorityFilter('All')">All</button>
            <button class="btn ${this.filterPriority === 'High' ? 'btn-danger' : 'btn-secondary'} btn-sm" onclick="TasksView.setPriorityFilter('High')">High Priority</button>
            <button class="btn ${this.filterPriority === 'Medium' ? 'btn-gold' : 'btn-secondary'} btn-sm" onclick="TasksView.setPriorityFilter('Medium')">Medium</button>
            <button class="btn ${this.filterPriority === 'Low' ? 'btn-secondary' : 'btn-secondary'} btn-sm" onclick="TasksView.setPriorityFilter('Low')">Low</button>
          </div>
        </div>

        <!-- 3. ACTIVE VIEW CONTENT -->
        ${this.activeView === 'kanban' ? this.renderKanban() : this.activeView === 'list' ? this.renderList() : this.renderCalendar()}
      </div>
    `;
  },

  switchView(viewName) {
    this.activeView = viewName;
    App.refreshCurrentView();
  },

  handleSearch(val) {
    this.searchQuery = val;
    App.refreshCurrentView();
  },

  setPriorityFilter(p) {
    this.filterPriority = p;
    App.refreshCurrentView();
  },

  setAdminFilter(af) {
    this.adminFilter = af;
    App.refreshCurrentView();
  },

  getFilteredTasks() {
    return SLCMS_STATE.tasks.filter(t => {
      const matchP = this.filterPriority === 'All' || t.priority === this.filterPriority;
      const matchQ = !this.searchQuery ||
        t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.caseNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.caseTitle.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(this.searchQuery.toLowerCase()));

      let matchAdmin = true;
      if (this.adminFilter === 'unassigned') {
        matchAdmin = !t.assignedTo || t.assignedTo === 'Unassigned';
      } else if (this.adminFilter === 'technical') {
        matchAdmin = t.isTechnical || t.category === 'technical';
      } else if (this.adminFilter === 'overdue') {
        matchAdmin = t.status !== 'completed' && new Date(t.dueDate) < new Date('2026-09-08');
      }

      return matchP && matchQ && matchAdmin;
    });
  },

  scrollToColumn(colId) {
    const el = document.getElementById(`kanban-col-${colId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  },

  renderKanban() {
    const columns = [
      { id: 'todo', title: 'To Do', border: 'var(--color-primary)', accent: '#102A43' },
      { id: 'in_progress', title: 'In Progress', border: 'var(--color-gold)', accent: '#C89B3C' },
      { id: 'under_review', title: 'Under Partner Review', border: 'var(--color-info)', accent: '#2563EB' },
      { id: 'completed', title: 'Completed / Filed', border: 'var(--color-success)', accent: '#16A34A' }
    ];

    const tasks = this.getFilteredTasks();

    return `
      <div class="kanban-mobile-tabs">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return `
            <button class="kanban-mobile-tab-btn" onclick="TasksView.scrollToColumn('${col.id}')">
              <span>${col.title}</span>
              <span class="badge" style="font-size: 0.68rem; padding: 2px 6px;">${colTasks.length}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="kanban-board">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return `
            <div class="kanban-col" id="kanban-col-${col.id}">
              
              <!-- Column Header -->
              <div class="kanban-col-header" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.85rem; margin-bottom: 1rem; border-bottom: 2.5px solid ${col.accent};">
                <div class="flex items-center gap-2">
                  <span style="font-weight: 700; color: var(--color-primary); font-size: 0.98rem; font-family: var(--font-heading);">${col.title}</span>
                  <span class="badge" style="border: 1px solid var(--color-border); font-size: 0.72rem; font-weight: 700;">
                    ${colTasks.length}
                  </span>
                </div>
                <button class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.5rem; font-weight: 700;" onclick="TasksView.openNewTaskModal(null, '${col.id}')" title="Add task to ${col.title}">
                  +
                </button>
              </div>

              <!-- Column Cards List -->
              <div class="kanban-cards-list flex flex-col gap-3 flex-1">
                ${colTasks.length === 0 ? `
                  <div style="padding: 2rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.8rem; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
                    No tasks in ${col.title}
                  </div>
                ` : colTasks.map(t => `
                  <div class="card card-hover kanban-card">
                    
                    <!-- Card Top: Priority & Due Date -->
                    <div class="flex items-center justify-between" style="margin-bottom: 0.55rem;">
                      <span class="badge badge-priority-${t.priority.toLowerCase()}" style="font-size: 0.68rem; padding: 0.12rem 0.5rem;">
                        ${t.priority === 'High' ? '🚨 ' : (t.priority === 'Medium' ? '⚡ ' : '🔹 ')}${t.priority}
                      </span>
                      <span style="font-size: 0.74rem; font-weight: 700; color: ${t.priority === 'High' && col.id !== 'completed' ? 'var(--color-danger)' : 'var(--color-text-secondary)'}; font-family: var(--font-mono); display: flex; align-items: center; gap: 0.25rem;">
                        📅 ${t.dueDate}
                      </span>
                    </div>

                    <!-- Task Title -->
                    <h4 style="font-size: 0.92rem; color: var(--color-primary); margin-bottom: 0.45rem; line-height: 1.4; font-weight: 700;">
                      ${t.title}
                    </h4>

                    <!-- Case Association Tag -->
                    <div style="font-size: 0.74rem; margin-bottom: 0.75rem; background: rgba(200,155,60,0.08); padding: 0.35rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid rgba(200,155,60,0.25); display: flex; align-items: center; gap: 0.35rem; overflow: hidden;">
                      <span style="font-family: var(--font-mono); font-weight: 800; color: var(--color-gold); font-size: 0.72rem; flex-shrink: 0;">${t.caseNumber}</span>
                      <span style="color: var(--color-text-muted);">&bull;</span>
                      <span style="color: var(--color-primary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t.caseTitle}">${t.caseTitle}</span>
                    </div>

                    <!-- Assignee & Move Action Buttons -->
                    <div class="flex items-center justify-between pt-2.5" style="border-top: 1px solid var(--color-border-subtle); margin-top: 0.35rem;">
                      <div class="flex items-center gap-2">
                        <div class="avatar avatar-sm ${t.assignedAvatar === 'EV' ? 'avatar-gold' : t.assignedAvatar === 'JM' ? 'avatar-navy' : t.assignedAvatar === 'MB' ? 'avatar-teal' : 'avatar-purple'}" style="font-size: 10px; font-weight: 700;">
                          ${t.assignedAvatar || 'US'}
                        </div>
                        <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-text-main);">
                          ${t.assignedTo.split(' ')[0]}
                        </span>
                      </div>
                      
                      <!-- Intuitive Workflow Advancement Buttons -->
                      <div class="flex items-center gap-1.5">
                        ${col.id !== 'todo' ? `
                          <button class="kanban-action-btn-prev" onclick="TasksView.moveTaskStatus('${t.id}', 'prev')" title="Move back to previous stage">
                            ←
                          </button>
                        ` : ''}
                        ${col.id === 'todo' ? `
                          <button class="kanban-action-btn-next" onclick="TasksView.moveTaskStatus('${t.id}', 'next')" title="Start task">
                            <span>Start</span> →
                          </button>
                        ` : col.id === 'in_progress' ? `
                          <button class="kanban-action-btn-next" onclick="TasksView.moveTaskStatus('${t.id}', 'next')" title="Submit for partner review">
                            <span>Review</span> →
                          </button>
                        ` : col.id === 'review' ? `
                          <button class="kanban-action-btn-next" onclick="TasksView.moveTaskStatus('${t.id}', 'next')" title="Approve and record filing" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important; color: #FFFFFF !important;">
                            <span>Approve</span> ✓
                          </button>
                        ` : `
                          <span class="badge badge-active" style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem;">✓ Filed</span>
                        `}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderList() {
    const tasks = this.getFilteredTasks();

    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%;">Done</th>
              <th style="width: 30%;">Task Description &amp; Milestones</th>
              <th style="width: 18%;">Related Legal Matter</th>
              <th style="width: 14%;">Assigned User</th>
              <th style="width: 11%;">Statutory Due</th>
              <th style="width: 8%;">Priority</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 4%; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => {
              const isOverdue = t.status !== 'completed' && new Date(t.dueDate) < new Date();
              const displayStatus = isOverdue ? 'Overdue' : (t.status === 'in_progress' ? 'In Progress' : (t.status === 'completed' ? 'Completed' : 'Pending'));
              const statusBadgeClass = isOverdue ? 'badge-lost' : (t.status === 'completed' ? 'badge-active' : (t.status === 'in_progress' ? 'badge-pending' : 'badge-onhold'));

              return `
                <tr>
                  <td>
                    <input type="checkbox" class="checkbox-custom" ${t.status === 'completed' ? 'checked' : ''} onchange="TasksView.toggleTaskStatus('${t.id}')">
                  </td>
                  <td>
                    <div style="font-weight: 700; color: var(--color-primary); font-size: 0.92rem; ${t.status === 'completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                      ${t.title}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.15rem;">${t.description}</div>
                  </td>
                  <td>
                    <span class="badge" style="background: var(--color-surface-subtle); color: var(--color-primary); font-family: var(--font-mono); font-size: 0.75rem;">
                      ${t.caseNumber}
                    </span>
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.15rem;">${t.caseTitle}</div>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar avatar-sm ${t.assignedAvatar === 'EV' ? 'avatar-gold' : 'avatar-navy'}">${t.assignedAvatar || 'US'}</div>
                      <span style="font-weight: 500; font-size: 0.82rem;">${t.assignedTo}</span>
                    </div>
                  </td>
                  <td>
                    <strong style="color: ${isOverdue ? 'var(--color-danger)' : 'var(--color-text-main)'}; font-family: var(--font-mono); font-size: 0.85rem;">
                      ${t.dueDate}
                    </strong>
                  </td>
                  <td>
                    <span class="badge badge-priority-${t.priority.toLowerCase()}">${t.priority}</span>
                  </td>
                  <td>
                    <span class="badge ${statusBadgeClass}">${displayStatus}</span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-ghost btn-sm text-danger" onclick="TasksView.deleteTask('${t.id}')" title="Delete Task">✕</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  calendarSubView: 'agenda', // 'agenda' | 'grid' | 'matrix'
  calendarFilter: 'all', // 'all' | 'hearings' | 'motions' | 'briefs'
  calendarMonth: 8, // September (0-indexed)
  calendarYear: 2026,

  // Rich statutory docket events fixture
  courtEvents: [
    {
      id: 'evt-01',
      date: '2026-09-02',
      time: '10:00 AM EST',
      monthShort: 'SEP',
      dayNum: '02',
      weekday: 'Wednesday',
      title: 'Mediation Terms Settlement & Pleading Review',
      caseId: 'case-104',
      caseNumber: 'EM-2026-0774',
      caseTitle: 'Dr. Clara Thorne vs. St. Jude Hospital',
      category: 'hearings',
      type: 'Court Mediation Call',
      court: 'JAMS ADR Hearing Center • Virtual Room 4',
      presiding: 'Hon. Robert Vance (Ret.)',
      assignedTo: 'Julian Mercer, Esq.',
      assignedAvatar: 'JM',
      priority: 'High',
      status: 'Confirmed',
      statute: 'CPLR § 3409 / ADR Rules',
      location: 'Virtual Video Hearing',
      description: 'Review final mutual non-disparagement covenants and severance escrow schedule with defense counsel.',
      exhibits: 'Exhibit D-2 (Draft Covenant), Exhibit F (Damages Ledger)'
    },
    {
      id: 'evt-02',
      date: '2026-09-04',
      time: '02:00 PM EST',
      monthShort: 'SEP',
      dayNum: '04',
      weekday: 'Friday',
      title: 'Pre-Deposition Expert Witness Briefing',
      caseId: 'case-102',
      caseNumber: 'IP-2026-0319',
      caseTitle: 'AuraBio Pharmaceuticals Patent Infringement',
      category: 'briefs',
      type: 'Expert Witness Preparation',
      court: 'Firm Boardroom 42A & Secure Remote Link',
      presiding: 'Senior Patent Litigation Panel',
      assignedTo: 'Julian Mercer, Esq.',
      assignedAvatar: 'JM',
      priority: 'High',
      status: 'Mandatory',
      statute: 'Fed. R. Civ. P. 26(b)(4)',
      location: 'New York HQ, 42nd Floor',
      description: 'Prepare chief biochemist Dr. K. Aris on mRNA sequence validity exhibits and prior art timeline analysis.',
      exhibits: 'Claim Charts A through E, Laboratory Notebook Transcripts'
    },
    {
      id: 'evt-03',
      date: '2026-09-08',
      time: '05:00 PM EST',
      monthShort: 'SEP',
      dayNum: '08',
      weekday: 'Tuesday',
      title: 'Filing: Motion for Summary Judgment & Rule 19-a Statement',
      caseId: 'case-101',
      caseNumber: 'CV-2026-0842',
      caseTitle: 'Vanguard Capital vs. Apex Tech Holdings',
      category: 'motions',
      type: 'Summary Judgment Motion',
      court: 'NYSCEF Electronic Court Filing Docket',
      presiding: 'Hon. Justice Katherine Thorne',
      assignedTo: 'Eleanor Vance, Esq.',
      assignedAvatar: 'EV',
      priority: 'High',
      status: 'Critical Deadline',
      statute: 'CPLR § 3212 / Uniform Rule 202.8-g',
      location: 'Supreme Court - Commercial Division',
      description: 'Submit 35-page Memorandum of Law, 18 evidentiary affidavits, and Rule 19-a Statement of Material Facts.',
      exhibits: 'Pleading Affidavits 1-18, Trade Secret Licensing Contract'
    },
    {
      id: 'evt-04',
      date: '2026-09-14',
      time: '09:30 AM EST',
      monthShort: 'SEP',
      dayNum: '14',
      weekday: 'Monday',
      title: 'Supreme Court Commercial Division Hearing Call',
      caseId: 'case-101',
      caseNumber: 'CV-2026-0842',
      caseTitle: 'Vanguard Capital vs. Apex Tech Holdings',
      category: 'hearings',
      type: 'Oral Argument & Discovery Conference',
      court: 'NY Supreme Court, 60 Centre Street, Room 232',
      presiding: 'Hon. Justice Katherine Thorne',
      assignedTo: 'Eleanor Vance, Esq.',
      assignedAvatar: 'EV',
      priority: 'High',
      status: 'Confirmed Appearance',
      statute: '22 NYCRR 202.70 (Rule 14)',
      location: 'Supreme Court Commercial Division - Room 232',
      description: 'Oral argument on the scope of confidential discovery disclosures and motion return docket call.',
      exhibits: 'Protective Order Stipulation, Disputed Interrogatory Set'
    },
    {
      id: 'evt-05',
      date: '2026-09-18',
      time: '04:00 PM EST',
      monthShort: 'SEP',
      dayNum: '18',
      weekday: 'Friday',
      title: 'Environmental Soil Survey Statutory Lodging',
      caseId: 'case-103',
      caseNumber: 'RE-2026-0155',
      caseTitle: 'Greenfield Estate Zoning & Development',
      category: 'briefs',
      type: 'Regulatory Agency Filing',
      court: 'Municipal Zoning & Planning Appeals Board',
      presiding: 'Chief Zoning Administrator',
      assignedTo: 'Marcus Bell',
      assignedAvatar: 'MB',
      priority: 'Medium',
      status: 'In Progress',
      statute: 'SEQRA 6 NYCRR Part 617',
      location: 'Municipal Administration Building, Desk 4',
      description: 'Obtain certified engineering surveyor stamps and lodge 4 physical evidentiary copies with the board clerk.',
      exhibits: 'Certified Geotechnical Reports, Topographical Survey Maps'
    },
    {
      id: 'evt-06',
      date: '2026-09-25',
      time: '11:00 AM EST',
      monthShort: 'SEP',
      dayNum: '25',
      weekday: 'Friday',
      title: 'Foreign Holding Disclosures & FINCEN Audit Lodging',
      caseId: 'case-105',
      caseNumber: 'CR-2026-0098',
      caseTitle: 'State vs. Jonathan Vance Jr.',
      category: 'briefs',
      type: 'Compliance Audit Filing',
      court: 'SDNY Magistrate Clerk Division • Room 501',
      presiding: 'Magistrate Judge David Wu',
      assignedTo: 'Sophia Chen',
      assignedAvatar: 'SC',
      priority: 'Medium',
      status: 'Under Review',
      statute: '31 U.S.C. § 5314 / FBAR',
      location: 'Daniel Patrick Moynihan U.S. Courthouse',
      description: 'Audit and reconcile 2021-2024 foreign banking declarations with FINCEN form 114 filings.',
      exhibits: 'Foreign Bank Ledgers, Forensic Accountant Affidavit'
    }
  ],

  switchCalendarSubView(subView) {
    this.calendarSubView = subView;
    App.refreshCurrentView();
  },

  setCalendarFilter(filter) {
    this.calendarFilter = filter;
    App.refreshCurrentView();
  },

  changeCalendarMonth(delta) {
    this.calendarMonth += delta;
    if (this.calendarMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else if (this.calendarMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    }
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    App.showToast(`Navigated to ${monthNames[this.calendarMonth]} ${this.calendarYear}`, 'info');
    App.refreshCurrentView();
  },

  resetCalendarToToday() {
    this.calendarMonth = 8; // September 2026
    this.calendarYear = 2026;
    App.showToast('Calendar docket synced to Current Session (September 2026)', 'success');
    App.refreshCurrentView();
  },

  getFilteredEvents() {
    return this.courtEvents.filter(evt => {
      if (this.calendarFilter === 'all') return true;
      if (this.calendarFilter === 'hearings') return evt.category === 'hearings';
      if (this.calendarFilter === 'motions') return evt.category === 'motions';
      if (this.calendarFilter === 'briefs') return evt.category === 'briefs';
      return true;
    });
  },

  renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthLabel = `${monthNames[this.calendarMonth]} ${this.calendarYear}`;
    const prevMonthLabel = monthNames[(this.calendarMonth + 11) % 12];
    const nextMonthLabel = monthNames[(this.calendarMonth + 1) % 12];
    const filteredEvents = this.getFilteredEvents();

    return `
      <div class="court-cal-wrapper">
        
        <!-- 1. EXECUTIVE CALENDAR METRIC STRIP -->
        <div class="court-cal-stats-strip">
          <div class="court-cal-stat-card">
            <div class="court-cal-stat-icon red">🏛️</div>
            <div>
              <div class="court-cal-stat-val">3</div>
              <div class="court-cal-stat-label">Court Appearances</div>
            </div>
          </div>
          <div class="court-cal-stat-card">
            <div class="court-cal-stat-icon gold">⚠️</div>
            <div>
              <div class="court-cal-stat-val">3</div>
              <div class="court-cal-stat-label">Critical Motions Due</div>
            </div>
          </div>
          <div class="court-cal-stat-card">
            <div class="court-cal-stat-icon navy">⚖️</div>
            <div>
              <div class="court-cal-stat-val">2</div>
              <div class="court-cal-stat-label">Commercial Div. Calls</div>
            </div>
          </div>
          <div class="court-cal-stat-card">
            <div class="court-cal-stat-icon green">✓</div>
            <div>
              <div class="court-cal-stat-val">100%</div>
              <div class="court-cal-stat-label">Statutory Compliance</div>
            </div>
          </div>
        </div>

        <!-- 2. MAIN CALENDAR CARD -->
        <div class="court-cal-main-card">
          
          <!-- Card Header & Navigation Bar -->
          <div class="court-cal-header">
            <div class="court-cal-title-block">
              <div class="flex items-center gap-3">
                <div class="court-cal-month-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>${currentMonthLabel}</span>
                </div>
                <span class="court-cal-jurisdiction-tag">
                  NY Supreme & SDNY Docket
                </span>
              </div>
              <div class="court-cal-subtitle">
                Court appearance dates, motion return dockets, and statutory discovery cutoff timeframes
              </div>
            </div>

            <!-- Header Action Controls -->
            <div class="court-cal-controls-wrapper flex items-center gap-2 flex-wrap">
              <div class="court-cal-nav-group">
                <button class="court-cal-nav-btn" onclick="TasksView.changeCalendarMonth(-1)" title="Previous Month">
                  ‹ ${prevMonthLabel}
                </button>
                <button class="court-cal-nav-btn today-btn" onclick="TasksView.resetCalendarToToday()">
                  Today
                </button>
                <button class="court-cal-nav-btn" onclick="TasksView.changeCalendarMonth(1)" title="Next Month">
                  ${nextMonthLabel} ›
                </button>
              </div>

              <div class="court-cal-actions-row flex items-center gap-2">
                <button class="btn btn-secondary btn-sm" onclick="TasksView.syncECourts()" title="Sync e-Courts & NYSCEF Docket">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>e-Courts Sync</span>
                </button>

                <button class="btn btn-gold btn-sm" onclick="TasksView.openScheduleAppearanceModal()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <span>Schedule Appearance</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Secondary Toolbar: Sub-Views & Filters -->
          <div class="court-cal-toolbar">
            <!-- View Mode Switcher -->
            <div class="court-cal-view-tabs">
              <button class="court-cal-view-tab ${this.calendarSubView === 'agenda' ? 'active' : ''}" onclick="TasksView.switchCalendarSubView('agenda')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>Docket Agenda</span>
              </button>

              <button class="court-cal-view-tab ${this.calendarSubView === 'grid' ? 'active' : ''}" onclick="TasksView.switchCalendarSubView('grid')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                </svg>
                <span>Month Grid</span>
              </button>

              <button class="court-cal-view-tab ${this.calendarSubView === 'matrix' ? 'active' : ''}" onclick="TasksView.switchCalendarSubView('matrix')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>Statutory Cutoffs</span>
              </button>
            </div>

            <!-- Category Filter Pills -->
            <div class="court-cal-filters">
              <button class="court-filter-pill ${this.calendarFilter === 'all' ? 'active' : ''}" onclick="TasksView.setCalendarFilter('all')">
                All Scheduled (${this.courtEvents.length})
              </button>
              <button class="court-filter-pill ${this.calendarFilter === 'hearings' ? 'active' : ''}" onclick="TasksView.setCalendarFilter('hearings')">
                🏛️ Court Hearings (2)
              </button>
              <button class="court-filter-pill ${this.calendarFilter === 'motions' ? 'active' : ''}" onclick="TasksView.setCalendarFilter('motions')">
                📑 Motions & Petitions (1)
              </button>
              <button class="court-filter-pill ${this.calendarFilter === 'briefs' ? 'active' : ''}" onclick="TasksView.setCalendarFilter('briefs')">
                📄 Briefs & Filings (3)
              </button>
            </div>
          </div>

          <!-- Active Sub-View Body -->
          ${this.calendarSubView === 'agenda' ? this.renderCalendarAgenda(filteredEvents) :
            this.calendarSubView === 'grid' ? this.renderCalendarGrid() :
            this.renderCalendarMatrix(filteredEvents)}

        </div>
      </div>
    `;
  },

  // --- SUB-VIEW 1: LUXURY DOCKET AGENDA CARDS ---
  renderCalendarAgenda(events) {
    if (events.length === 0) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--color-text-secondary);">
          <p style="font-size: 1rem; font-weight: 600;">No scheduled court hearings or motions match the active filter.</p>
          <button class="btn btn-secondary btn-sm mt-3" onclick="TasksView.setCalendarFilter('all')">Clear Filter</button>
        </div>
      `;
    }

    return `
      <div class="court-agenda-container">
        ${events.map(evt => {
          const priorityClass = evt.priority === 'High' ? 'priority-high' : evt.priority === 'Medium' ? 'priority-medium' : 'priority-low';
          const isConfirmed = evt.status.includes('Confirmed');

          return `
            <div class="court-docket-card ${priorityClass} ${isConfirmed ? 'status-confirmed' : ''}">
              
              <!-- Date Ribbon Stamp -->
              <div class="court-date-badge">
                <span class="court-date-month">${evt.monthShort} 2026</span>
                <span class="court-date-day">${evt.dayNum}</span>
                <span class="court-date-weekday">${evt.weekday}</span>
                <div class="court-date-time">
                  ⏰ ${evt.time.split(' ')[0]} ${evt.time.split(' ')[1]}
                </div>
              </div>

              <!-- Center Body: Case & Appearance Brief -->
              <div class="court-docket-body">
                <!-- Meta Row: Case Number & Priority -->
                <div class="court-docket-meta-row">
                  <span class="court-matter-pill" onclick="App.navigate('cases'); setTimeout(() => CasesView.openCaseDossier('${evt.caseId}'), 100);" title="Open Case Dossier">
                    ⚖️ ${evt.caseNumber}
                  </span>
                  <span class="court-matter-name">${evt.caseTitle}</span>
                  <span class="badge ${evt.priority === 'High' ? 'badge-priority-high' : 'badge-priority-med'}" style="font-size: 0.68rem; margin-left: auto;">
                    ${evt.priority === 'High' ? '⚠️ HIGH PRIORITY' : 'MEDIUM'}
                  </span>
                  <span class="badge ${isConfirmed ? 'badge-active' : 'badge-pending'}" style="font-size: 0.68rem;">
                    ${isConfirmed ? '● CONFIRMED' : '⏳ PENDING'}
                  </span>
                </div>

                <!-- Hearing Title -->
                <h4 class="court-hearing-title">${evt.title}</h4>

                <!-- Courtroom & Presiding Officer -->
                <div class="court-room-detail">
                  <span>
                    🏛️ <strong>${evt.court}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    👤 Presiding: <strong>${evt.presiding}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    📜 Statute: <code style="font-family: var(--font-mono); font-size: 0.72rem; background: var(--color-surface-subtle); padding: 1px 4px; border-radius: 3px;">${evt.statute}</code>
                  </span>
                </div>

                <!-- Short Mandate Summary -->
                <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4;">
                  ${evt.description}
                </p>
              </div>

              <!-- Right Area: Assigned Counsel & Action Buttons -->
              <div class="court-docket-action-area">
                <div class="court-counsel-info flex items-center gap-2">
                  <div class="avatar avatar-sm ${evt.assignedAvatar === 'EV' ? 'avatar-gold' : evt.assignedAvatar === 'JM' ? 'avatar-navy' : 'avatar-teal'}" style="font-size: 10px; font-weight: 700;">
                    ${evt.assignedAvatar}
                  </div>
                  <div class="court-counsel-meta" style="text-align: right;">
                    <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-primary);">${evt.assignedTo}</div>
                    <div style="font-size: 0.68rem; color: var(--color-text-muted);">Lead Counsel</div>
                  </div>
                </div>

                <div class="court-action-btns">
                  <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="TasksView.openEventDetails('${evt.id}')">
                    Inspect Docket
                  </button>
                  <button class="btn btn-gold btn-sm" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="App.showToast('Courtroom video portal launched for ${evt.caseNumber}', 'success')">
                    🏛️ Court Portal
                  </button>
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // --- SUB-VIEW 2: FULL 30-DAY MONTHLY CALENDAR GRID ---
  renderCalendarGrid() {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // September 2026: Sept 1 is a Tuesday (index 2), total 30 days
    const totalDays = 30;
    const startDayIndex = 2; // Tuesday
    const prevMonthDays = 31; // August has 31 days

    let gridCells = [];

    // 1. Previous month trailing days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      gridCells.push({
        dayNum: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    // 2. Current month days (Sept 1 to Sept 30)
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `2026-09-${d < 10 ? '0' + d : d}`;
      const dayEvents = this.courtEvents.filter(e => e.date === dateStr);
      const isToday = (d === 1); // Current day in session simulation

      gridCells.push({
        dayNum: d,
        isCurrentMonth: true,
        isToday: isToday,
        dateStr: dateStr,
        events: dayEvents
      });
    }

    // 3. Next month leading days to complete grid (multiples of 7)
    const remainingCells = (7 - (gridCells.length % 7)) % 7;
    for (let j = 1; j <= remainingCells; j++) {
      gridCells.push({
        dayNum: j,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    return `
      <div class="court-month-grid-wrapper">
        <div class="court-cal-grid">
          
          <!-- Days of Week Header -->
          ${daysOfWeek.map((day, idx) => `
            <div class="court-grid-head-cell ${idx === 0 || idx === 6 ? 'weekend' : ''}">
              ${day}
            </div>
          `).join('')}

          <!-- Month Day Cells -->
          ${gridCells.map(cell => `
            <div class="court-grid-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'is-today' : ''}">
              
              <!-- Day Number Header -->
              <div class="court-day-number-row">
                <span class="court-day-number">${cell.dayNum}</span>
                ${cell.isToday ? '<span class="court-today-indicator">TODAY</span>' : ''}
              </div>

              <!-- Events on this day -->
              <div class="flex flex-col gap-1">
                ${cell.events.map(evt => {
                  const chipColor = evt.priority === 'High' ? 'chip-danger' : evt.category === 'hearings' ? 'chip-navy' : 'chip-gold';
                  return `
                    <div class="court-chip ${chipColor}" onclick="TasksView.openEventDetails('${evt.id}')" title="${evt.time} - ${evt.title} (${evt.caseNumber})">
                      <span class="court-chip-time">⏰ ${evt.time.split(' ')[0]} ${evt.time.split(' ')[1]}</span>
                      <span class="court-chip-title"><strong>${evt.caseNumber}:</strong> ${evt.title}</span>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>
          `).join('')}

        </div>
      </div>
    `;
  },

  // --- SUB-VIEW 3: STATUTORY CUTOFFS & COMPLIANCE MATRIX ---
  renderCalendarMatrix(events) {
    return `
      <div class="court-matrix-container">
        <div class="table-container" style="border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <table class="court-matrix-table">
            <thead>
              <tr>
                <th style="width: 14%;">Statutory Due</th>
                <th style="width: 16%;">Statutory Citation</th>
                <th style="width: 25%;">Docket Action & Pleading</th>
                <th style="width: 18%;">Legal Matter</th>
                <th style="width: 14%;">Assigned Counsel</th>
                <th style="width: 13%; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${events.map(evt => `
                <tr>
                  <td>
                    <div style="font-weight: 700; color: var(--color-primary); font-family: var(--font-heading); font-size: 0.92rem;">
                      ${evt.date}
                    </div>
                    <span style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight: 600;">
                      ${evt.time}
                    </span>
                  </td>
                  <td>
                    <span class="court-statute-badge">${evt.statute}</span>
                  </td>
                  <td>
                    <div style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">
                      ${evt.title}
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      ${evt.court}
                    </div>
                  </td>
                  <td>
                    <span class="court-matter-pill" onclick="App.navigate('cases'); setTimeout(() => CasesView.openCaseDossier('${evt.caseId}'), 100);">
                      ${evt.caseNumber}
                    </span>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      ${evt.caseTitle}
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-1.5">
                      <div class="avatar avatar-sm ${evt.assignedAvatar === 'EV' ? 'avatar-gold' : 'avatar-navy'}" style="font-size: 10px;">
                        ${evt.assignedAvatar}
                      </div>
                      <span style="font-size: 0.8rem; font-weight: 600;">${evt.assignedTo.split(' ')[0]}</span>
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm" onclick="TasksView.openEventDetails('${evt.id}')">
                      View Docket
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --- INTERACTIVE MODALS & ACTIONS ---
  openEventDetails(eventId) {
    const evt = this.courtEvents.find(e => e.id === eventId) || this.courtEvents[0];
    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.25rem;">🏛️</span>
          <div>
            <h3 class="modal-title">Statutory Court Docket & Hearing Dossier</h3>
            <span style="font-size: 0.75rem; color: var(--color-text-secondary);">${evt.caseNumber} • ${evt.statute}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>

      <div class="modal-body">
        <!-- Banner -->
        <div style="background: linear-gradient(135deg, var(--color-primary) 0%, #1A365D 100%); color: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border-left: 4px solid var(--color-gold);">
          <div class="flex items-center justify-between" style="margin-bottom: 0.45rem;">
            <span class="badge badge-active" style="background: rgba(22, 163, 74, 0.3); color: #86EFAC; border-color: #16A34A;">
              ● ${evt.status}
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: #FCD34D;">
              📅 ${evt.date} • ${evt.time}
            </span>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; margin: 0 0 0.35rem 0; color: #FFFFFF;">${evt.title}</h4>
          <div style="font-size: 0.82rem; opacity: 0.9;"><strong>Matter:</strong> ${evt.caseTitle} (${evt.caseNumber})</div>
        </div>

        <!-- 2-Column Details Grid -->
        <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.25rem;">
          <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Presiding Officer / Judge</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary); margin-top: 0.25rem;">${evt.presiding}</div>
            <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.2rem;">${evt.court}</div>
          </div>

          <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Assigned Lead Counsel</div>
            <div class="flex items-center gap-2" style="margin-top: 0.25rem;">
              <div class="avatar avatar-sm ${evt.assignedAvatar === 'EV' ? 'avatar-gold' : 'avatar-navy'}">${evt.assignedAvatar}</div>
              <div>
                <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary);">${evt.assignedTo}</div>
                <div style="font-size: 0.74rem; color: var(--color-text-secondary);">Managing Partner</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Procedural & Evidentiary Mandate -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" style="font-weight: 700;">Procedural Mandate & Statutory Instructions</label>
          <div style="font-size: 0.84rem; line-height: 1.5; color: var(--color-text-main); background: var(--color-surface); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            ${evt.description}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight: 700;">Required Evidentiary Exhibits & Pleadings</label>
          <div style="font-size: 0.8rem; font-family: var(--font-mono); background: var(--color-surface-subtle); padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); color: var(--color-primary);">
            📁 ${evt.exhibits}
          </div>
        </div>
      </div>

      <div class="modal-footer flex items-center justify-between">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        <div class="flex gap-2">
          <button class="btn btn-secondary" onclick="App.showToast('iCal/Outlook sync token generated.', 'success'); App.closeModal();">
            📥 Add to Calendar
          </button>
          <button class="btn btn-gold" onclick="App.showToast('Appearance record updated and logged to audit trail.', 'success'); App.closeModal();">
            ✓ Confirm Appearance
          </button>
        </div>
      </div>
    `);
  },

  openScheduleAppearanceModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Schedule Court Appearance / Statutory Deadline
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Appearance Title / Action Item</label>
          <input type="text" id="sch-title" class="form-control" placeholder="e.g. Oral Argument on Motion for Protective Order" required>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Associated Legal Matter</label>
            <select id="sch-case" class="form-control">
              ${SLCMS_STATE.cases.map(c => `<option value="${c.id}">${c.caseNumber} - ${c.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Assigned Counsel</label>
            <select id="sch-assigned" class="form-control">
              <option value="Eleanor Vance, Esq.">Eleanor Vance, Esq. (Partner)</option>
              <option value="Julian Mercer, Esq.">Julian Mercer, Esq. (Partner)</option>
              <option value="Marcus Bell">Marcus Bell (Senior Clerk)</option>
              <option value="Sophia Chen">Sophia Chen (Paralegal)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="form-group">
            <label class="form-label required">Court Appearance Date</label>
            <input type="date" id="sch-date" class="form-control" value="2026-09-22" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Call Time</label>
            <input type="text" id="sch-time" class="form-control" value="09:30 AM EST">
          </div>
          <div class="form-group">
            <label class="form-label required">Event Type</label>
            <select id="sch-category" class="form-control">
              <option value="hearings">Court Hearing / Motion Call</option>
              <option value="motions">Pleading & Brief Filing</option>
              <option value="briefs">Discovery / Deposition</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Courtroom / Presiding Judge / Location</label>
          <input type="text" id="sch-court" class="form-control" placeholder="e.g. NY Supreme Court - Commercial Division, Room 232 (Judge Thorne)">
        </div>
        <div class="form-group">
          <label class="form-label">Statutory Rule / Procedural Notes</label>
          <textarea id="sch-desc" class="form-control" rows="2" placeholder="Specify applicable CPLR / FRCP statute and mandatory exhibits..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveNewAppearance()">Schedule on Statutory Docket</button>
      </div>
    `);
  },

  saveNewAppearance() {
    const title = document.getElementById('sch-title')?.value;
    if (!title) {
      App.showToast('Please enter an appearance title.', 'error');
      return;
    }
    const caseId = document.getElementById('sch-case')?.value;
    const c = SLCMS_STATE.cases.find(item => item.id === caseId) || SLCMS_STATE.cases[0];
    const dateVal = document.getElementById('sch-date')?.value || '2026-09-22';
    const dayNum = dateVal.split('-')[2] || '22';
    const assigned = document.getElementById('sch-assigned')?.value || 'Eleanor Vance, Esq.';

    const newEvt = {
      id: 'evt-' + Date.now(),
      date: dateVal,
      time: document.getElementById('sch-time')?.value || '10:00 AM EST',
      monthShort: 'SEP',
      dayNum: dayNum,
      weekday: 'Court Day',
      title: title,
      caseId: c.id,
      caseNumber: c.caseNumber,
      caseTitle: c.title,
      category: document.getElementById('sch-category')?.value || 'hearings',
      type: 'Scheduled Court Appearance',
      court: document.getElementById('sch-court')?.value || 'Supreme Court Commercial Division',
      presiding: 'Presiding Judge',
      assignedTo: assigned,
      assignedAvatar: assigned.includes('Eleanor') ? 'EV' : assigned.includes('Julian') ? 'JM' : assigned.includes('Sophia') ? 'SC' : 'MB',
      priority: 'High',
      status: 'Confirmed',
      statute: 'CPLR / Uniform Rules',
      location: 'Court Chambers',
      description: document.getElementById('sch-desc')?.value || 'Mandatory court appearance.',
      exhibits: 'Court Submissions & Appearance Notice'
    };

    this.courtEvents.unshift(newEvt);
    SLCMS_STATE.addAuditLog('Court Appearance Scheduled', 'Tasks & Deadlines', `${newEvt.title} (${newEvt.caseNumber})`);
    App.closeModal();
    App.showToast('Appearance scheduled successfully on Statutory Docket.', 'success');
    App.refreshCurrentView();
  },

  syncECourts() {
    App.showToast('Connecting to NYSCEF & e-Courts Statutory Docket...', 'info');
    setTimeout(() => {
      App.showToast('Docket synchronization complete. All 6 filings and appearances verified.', 'success');
    }, 900);
  },

  moveTaskStatus(taskId, dir) {
    const sequence = ['todo', 'in_progress', 'under_review', 'completed'];
    const t = SLCMS_STATE.tasks.find(item => item.id === taskId);
    if (!t) return;

    const isAdmin = (SLCMS_STATE.currentUser?.role === 'Administrator');
    // Administrator cannot approve lawyer's legal work or complete legal tasks
    if (isAdmin && !t.isTechnical && t.category !== 'technical') {
      if (dir === 'next' && (t.status === 'under_review' || t.status === 'in_progress')) {
        App.openModal(`
          <div class="modal-header" style="background: linear-gradient(135deg, #7F1D1D, #450A0A); color: #FFFFFF;">
            <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.1rem;">⚠️ Legal Counsel Authorization Required</h3>
            <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div class="alert alert-danger" style="font-size: 0.86rem; line-height: 1.5; margin-bottom: 1rem;">
              <strong>Administrator Restriction (Rule 5):</strong> System Administrators cannot mark counsel's substantive legal work as approved or complete legal filings on behalf of counsel.
            </div>
            <p style="font-size: 0.84rem; color: var(--color-text-secondary); line-height: 1.5;">
              This task involves substantive legal filings for <strong>${t.caseNumber} - ${t.caseTitle}</strong>. Final approval and statutory lodging requires review and sign-off by a qualified Senior Lawyer or assigned Advocate.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Acknowledge Restriction</button>
            <button class="btn btn-gold" onclick="App.closeModal(); TasksView.openReassignModal('${t.id}');">Reassign to Senior Lawyer</button>
          </div>
        `, 'modal-md');
        return;
      }
    }

    let idx = sequence.indexOf(t.status);
    if (dir === 'next' && idx < sequence.length - 1) {
      t.status = sequence[idx + 1];
    } else if (dir === 'prev' && idx > 0) {
      t.status = sequence[idx - 1];
    }

    SLCMS_STATE.addAuditLog('Task Stage Advanced on Kanban', 'Tasks & Deadlines', `${t.title} -> ${t.status}`);
    App.showToast(`Task moved to "${t.status.replace('_', ' ').toUpperCase()}".`, 'info');
    App.refreshCurrentView();
  },

  toggleTaskStatus(taskId) {
    const t = SLCMS_STATE.tasks.find(item => item.id === taskId);
    if (!t) return;

    const isAdmin = (SLCMS_STATE.currentUser?.role === 'Administrator');
    if (isAdmin && !t.isTechnical && t.category !== 'technical' && t.status !== 'completed') {
      App.openModal(`
        <div class="modal-header" style="background: linear-gradient(135deg, #7F1D1D, #450A0A); color: #FFFFFF;">
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.1rem;">⚠️ Cannot Complete Legal Task on Behalf of Counsel</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <div class="alert alert-danger" style="font-size: 0.86rem; line-height: 1.5; margin-bottom: 1rem;">
            <strong>Administrator Restriction:</strong> Under Rule 5 of SLCMS Judicial Integrity, an Administrator cannot complete a legal task on behalf of counsel.
          </div>
          <p style="font-size: 0.84rem; color: var(--color-text-secondary); line-height: 1.5;">
            Task: <strong>${t.title}</strong><br>
            Matter: <strong>${t.caseNumber} - ${t.caseTitle}</strong><br>
            Please reassign or notify the responsible advocate.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
          <button class="btn btn-gold" onclick="App.closeModal(); TasksView.openReassignModal('${t.id}');">Reassign Staff</button>
        </div>
      `, 'modal-md');
      return;
    }

    t.status = t.status === 'completed' ? 'todo' : 'completed';
    SLCMS_STATE.addAuditLog('Task Completion Toggled', 'Tasks & Deadlines', `${t.title} (${t.status})`);
    App.refreshCurrentView();
  },

  deleteTask(taskId) {
    const idx = SLCMS_STATE.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const removed = SLCMS_STATE.tasks.splice(idx, 1)[0];
      SLCMS_STATE.addAuditLog('Task Deleted', 'Tasks & Deadlines', removed.title);
      App.showToast('Task removed from docket.', 'info');
      App.refreshCurrentView();
    }
  },

  openReassignModal(taskId) {
    const t = SLCMS_STATE.tasks.find(item => item.id === taskId);
    if (!t) return;

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">👤 Correct Task Assignment (Administrator)</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-info" style="font-size: 0.82rem; margin-bottom: 1rem;">
          Reassign administrative or case tasks to rectify unassigned or misallocated workload across firm personnel.
        </div>
        <div style="background: var(--color-surface-subtle); padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.84rem; margin-bottom: 1rem;">
          <div><strong>Task:</strong> ${t.title}</div>
          <div><strong>Current Assignee:</strong> ${t.assignedTo || 'Unassigned'}</div>
          <div><strong>Associated Case:</strong> ${t.caseNumber} - ${t.caseTitle}</div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">Select Responsible Staff Member</label>
          <select id="reassign-select" class="form-control">
            <option value="Eleanor Vance, Esq.">Eleanor Vance, Esq. (Senior Partner / Senior Lawyer)</option>
            <option value="Julian Mercer, Esq.">Julian Mercer, Esq. (Partner / Senior Lawyer)</option>
            <option value="Sophia Chen">Sophia Chen (Associate Lawyer)</option>
            <option value="Marcus Bell">Marcus Bell (Legal Clerk)</option>
            <option value="Neema Joseph">Neema Joseph (System Administrator)</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveTaskReassignment('${t.id}')">Save Assignment</button>
      </div>
    `, 'modal-md');
  },

  saveTaskReassignment(taskId) {
    const t = SLCMS_STATE.tasks.find(item => item.id === taskId);
    const newAssigned = document.getElementById('reassign-select')?.value;
    if (!t || !newAssigned) return;

    const oldAssigned = t.assignedTo;
    t.assignedTo = newAssigned;
    t.assignedAvatar = newAssigned.includes('Eleanor') ? 'EV' : newAssigned.includes('Julian') ? 'JM' : newAssigned.includes('Sophia') ? 'SC' : newAssigned.includes('Neema') ? 'NJ' : 'MB';

    SLCMS_STATE.addAuditLog('Case Assignment Changed', 'Tasks & Deadlines', `Reassigned "${t.title}" from "${oldAssigned}" to "${newAssigned}"`, 'Success');
    App.closeModal();
    App.showToast(`Task successfully reassigned to ${newAssigned}.`, 'success');
    App.refreshCurrentView();
  },

  openCreateTechnicalTaskModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">⚙️ Create Technical / System Task (Administrator)</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label required">Technical Task Title</label>
          <input type="text" id="tech-title" class="form-control" placeholder="e.g. Verify TanzLII Case Precedent Synchronization" required>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select id="tech-category" class="form-control">
              <option value="technical">Technical Infrastructure</option>
              <option value="ocr">OCR Processing Maintenance</option>
              <option value="security">Security &amp; User Access Audit</option>
              <option value="backup">Database Backup Verification</option>
              <option value="tanzlii">TanzLII Repository Ingestion</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority</label>
            <select id="tech-priority" class="form-control">
              <option value="High">High (Immediate)</option>
              <option value="Medium" selected>Medium (Standard)</option>
              <option value="Low">Low (Maintenance)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Target Due Date</label>
            <input type="date" id="tech-due" class="form-control" value="2026-09-12">
          </div>
          <div class="form-group">
            <label class="form-label required">Assigned Administrator / Engineer</label>
            <select id="tech-assigned" class="form-control">
              <option value="Neema Joseph">Neema Joseph (System Administrator)</option>
              <option value="Marcus Bell">Marcus Bell (Legal Clerk)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Task Instructions</label>
          <textarea id="tech-desc" class="form-control" rows="3" placeholder="Describe server endpoints, OCR check logs, or backup verification steps..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveTechnicalTask()">Create Technical Task</button>
      </div>
    `, 'modal-md');
  },

  saveTechnicalTask() {
    const title = document.getElementById('tech-title')?.value;
    if (!title) {
      App.showToast('Please enter a task title.', 'error');
      return;
    }

    const assigned = document.getElementById('tech-assigned')?.value || 'Neema Joseph';
    const newTask = {
      id: 'tech-' + Date.now(),
      title: title,
      caseId: 'case-101',
      caseTitle: 'Firm Infrastructure & Technical Maintenance',
      caseNumber: 'SYS-2026-TECH',
      assignedTo: assigned,
      assignedAvatar: assigned.includes('Neema') ? 'NJ' : 'MB',
      priority: document.getElementById('tech-priority')?.value || 'Medium',
      dueDate: document.getElementById('tech-due')?.value || '2026-09-12',
      status: 'todo',
      progressPct: 0,
      category: 'technical',
      isTechnical: true,
      description: document.getElementById('tech-desc')?.value || 'System maintenance task created by Administrator.'
    };

    SLCMS_STATE.tasks.unshift(newTask);
    SLCMS_STATE.addAuditLog('Technical Task Created', 'Tasks & Deadlines', newTask.title, 'Success');
    App.closeModal();
    App.showToast('Technical task registered successfully.', 'success');
    App.refreshCurrentView();
  },

  notifyResponsibleUsers() {
    const pendingTasks = (SLCMS_STATE.tasks || []).filter(t => t.status !== 'completed');
    const unassigned = pendingTasks.filter(t => !t.assignedTo || t.assignedTo === 'Unassigned');

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">🔔 Notify Responsible Users</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.88rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Send automated docket reminder notices to all lawyers and staff regarding active tasks and upcoming court deadlines.
        </p>
        <div style="background: var(--color-surface-subtle); padding: 1rem; border-radius: 6px; font-size: 0.84rem; line-height: 1.6; margin-bottom: 1rem;">
          <div>📋 <strong>Active Pending Tasks:</strong> ${pendingTasks.length}</div>
          <div>⚠️ <strong>Unassigned Action Items:</strong> ${unassigned.length}</div>
          <div>👥 <strong>Notified Recipients:</strong> Eleanor Vance, Julian Mercer, Sophia Chen, Marcus Bell</div>
        </div>
        <div class="form-group">
          <label class="form-label">Notification Message</label>
          <textarea id="notify-msg" class="form-control" rows="3">Reminder: Please review and fulfill your statutory docket obligations and unassigned matter items for the current session.</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.sendNotifications()">Send Notifications</button>
      </div>
    `, 'modal-md');
  },

  sendNotifications() {
    SLCMS_STATE.addAuditLog('User Notifications Dispatched', 'Tasks & Deadlines', 'System Administrator broadcasted statutory docket reminders to all staff.', 'Success');
    App.closeModal();
    App.showToast('Docket notifications broadcasted to 4 responsible staff members.', 'success');
  },

  openNewTaskModal(caseContext = null, defaultCol = 'todo') {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Legal Task & Statutory Deadline
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Task Title / Action Item</label>
          <input type="text" id="nt-title" class="form-control" placeholder="e.g. File Reply Brief with Commercial Division" required>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Associated Legal Matter</label>
            <select id="nt-case" class="form-control">
              ${SLCMS_STATE.cases.map(c => `<option value="${c.id}" ${caseContext && caseContext.id === c.id ? 'selected' : ''}>${c.caseNumber} - ${c.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Assigned Counsel / Staff</label>
            <select id="nt-assigned" class="form-control">
              <option value="Eleanor Vance, Esq.">Eleanor Vance, Esq. (Partner)</option>
              <option value="Julian Mercer, Esq.">Julian Mercer, Esq. (Partner)</option>
              <option value="Marcus Bell">Marcus Bell (Senior Clerk)</option>
              <option value="Sophia Chen">Sophia Chen (Paralegal)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Statutory Due Date</label>
            <input type="date" id="nt-due" class="form-control" value="2026-09-15" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority Level</label>
            <select id="nt-priority" class="form-control">
              <option value="High">High Priority (Court Mandated)</option>
              <option value="Medium" selected>Medium (Standard Preparation)</option>
              <option value="Low">Low (Internal Archival)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Detailed Instructions & Statutes</label>
          <textarea id="nt-desc" class="form-control" rows="3" placeholder="Specify statutory citations, motion requirements, or filing instructions..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveNewTask('${defaultCol}')">Save Task to Docket</button>
      </div>
    `);
  },

  saveNewTask(col = 'todo') {
    const title = document.getElementById('nt-title')?.value;
    if (!title) {
      App.showToast('Please enter a task title.', 'error');
      return;
    }

    const caseId = document.getElementById('nt-case')?.value;
    const relatedCase = SLCMS_STATE.cases.find(c => c.id === caseId) || SLCMS_STATE.cases[0];
    const assigned = document.getElementById('nt-assigned')?.value;

    const newTask = {
      id: 'tsk-' + Date.now(),
      title: title,
      caseId: relatedCase.id,
      caseTitle: relatedCase.title,
      caseNumber: relatedCase.caseNumber,
      assignedTo: assigned,
      assignedAvatar: assigned.includes('Eleanor') ? 'EV' : assigned.includes('Julian') ? 'JM' : assigned.includes('Sophia') ? 'SC' : 'MB',
      priority: document.getElementById('nt-priority')?.value || 'Medium',
      dueDate: document.getElementById('nt-due')?.value || '2026-09-15',
      status: col,
      progressPct: 0,
      description: document.getElementById('nt-desc')?.value || ''
    };

    SLCMS_STATE.addTask(newTask);
    App.closeModal();
    App.showToast('Task successfully scheduled on statutory docket.', 'success');
    App.refreshCurrentView();
  }
};
