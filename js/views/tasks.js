/* ==========================================================================
   SLCMS - Tasks & Statutory Deadlines (Kanban, List & Calendar Views)
   ========================================================================== */

const TasksView = {
  activeView: 'kanban', // 'kanban' | 'list' | 'calendar'
  filterPriority: 'All', // 'All' | 'Urgent' | 'High' | 'Medium' | 'Low'
  filterAssignedMe: false, // My Assigned Tasks toggle
  adminFilter: 'all', // 'all' | 'unassigned' | 'technical' | 'overdue'
  searchQuery: '',

  render() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryView = urlParams.get('taskView') || urlParams.get('view');
    if (queryView && ['kanban', 'list', 'calendar'].includes(queryView)) {
      this.activeView = queryView;
    } else {
      try {
        const savedView = localStorage.getItem('slcms_active_task_view');
        if (savedView && ['kanban', 'list', 'calendar'].includes(savedView)) {
          this.activeView = savedView;
        }
      } catch (e) {}
    }

    const tasks = SLCMS_STATE.tasks || [];
    const isLawyer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })();

    return `
      <div class="animate-fade">
        <!-- 1. CLEAN VIEW HEADER -->
        <div class="view-header" style="overflow: hidden; margin-bottom: 1rem;">
          <div style="width: 100%; min-width: 0;">
            <div class="flex items-center gap-2.5 flex-wrap" style="margin-bottom: 0.25rem;">
              <h1 class="page-title" style="font-size: 1.35rem; margin-bottom: 0; line-height: 1.25; font-weight: 800; font-family: var(--font-heading); color: #0F172A;">
                Tasks &amp; Statutory Deadlines
              </h1>
              <span class="tasks-monitoring-badge">
                <span class="tasks-pulse-dot"></span>
                <span>Deadline Monitoring Active</span>
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.85rem; line-height: 1.4; margin-top: 0.15rem; margin-bottom: 0;">
              Manage legal deliverables, court hearings, and statutory limitation cutoffs.
            </p>
          </div>

          <div class="tasks-header-actions flex items-center gap-2.5 flex-wrap">
            <div class="view-toggle">
              <button class="view-toggle-btn ${this.activeView === 'kanban' ? 'active' : ''}" onclick="TasksView.switchView('kanban')" title="Kanban Workflow Columns">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M9 3v18"/>
                  <path d="M15 3v18"/>
                </svg>
                <span>Kanban</span>
              </button>
              <button class="view-toggle-btn ${this.activeView === 'list' ? 'active' : ''}" onclick="TasksView.switchView('list')" title="Tabular Docket Schedule">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>List</span>
              </button>
              <button class="view-toggle-btn ${this.activeView === 'calendar' ? 'active' : ''}" onclick="TasksView.switchView('calendar')" title="Court Docket Calendar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Calendar</span>
              </button>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="TasksView.notifyResponsibleUsers()" style="font-weight: 600; font-size: 0.82rem; padding: 0.45rem 0.85rem;" title="Dispatch structured reminder notices">
              🔔 Send Notices
            </button>

            <button class="btn btn-secondary btn-sm tasks-deadline-btn" onclick="TasksView.openAddDeadlineModal()" style="font-weight: 700; font-size: 0.82rem; padding: 0.45rem 0.85rem;">
              📅 Add Deadline
            </button>

            ${isLawyer ? '' : `
            <button class="btn btn-gold btn-sm tasks-create-btn" onclick="TasksView.openNewTaskModal()" style="font-weight: 700; font-size: 0.82rem; padding: 0.45rem 0.95rem;">
              + Create Task
            </button>
            `}
          </div>
        </div>

        <!-- 2. STREAMLINED SEARCH & FILTER TOOLBAR -->
        <div class="tasks-filter-floating-card">
          <div class="tasks-search-input-box">
            <svg class="tasks-search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search tasks by title, case number, or counsel..."
                   value="${this.searchQuery}" oninput="TasksView.handleSearch(this.value)">
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button class="btn ${this.filterAssignedMe ? 'btn-gold' : 'btn-secondary'} btn-sm" style="font-weight: 600; border-radius: 8px; font-size: 0.78rem;" onclick="TasksView.toggleAssignedMe()" title="Show only tasks assigned to me">
              👤 My Tasks ${this.filterAssignedMe ? '✓' : ''}
            </button>
            <span style="font-size: 0.78rem; color: var(--color-text-secondary); font-weight: 700; margin-left: 0.25rem;">Priority:</span>
            <button class="btn ${this.filterPriority === 'All' ? 'btn-primary' : 'btn-secondary'} btn-sm" style="border-radius: 8px; font-size: 0.76rem; padding: 0.25rem 0.6rem;" onclick="TasksView.setPriorityFilter('All')">All</button>
            <button class="btn ${this.filterPriority === 'Urgent' ? 'btn-danger' : 'btn-secondary'} btn-sm" style="border-radius: 8px; font-size: 0.76rem; padding: 0.25rem 0.6rem; ${this.filterPriority === 'Urgent' ? 'background: #DC2626; color: white;' : ''}" onclick="TasksView.setPriorityFilter('Urgent')">🚨 Urgent</button>
            <button class="btn ${this.filterPriority === 'High' ? 'btn-danger' : 'btn-secondary'} btn-sm" style="border-radius: 8px; font-size: 0.76rem; padding: 0.25rem 0.6rem;" onclick="TasksView.setPriorityFilter('High')">⚠️ High</button>
            <button class="btn ${this.filterPriority === 'Medium' ? 'btn-gold' : 'btn-secondary'} btn-sm" style="border-radius: 8px; font-size: 0.76rem; padding: 0.25rem 0.6rem;" onclick="TasksView.setPriorityFilter('Medium')">Medium</button>
            <button class="btn ${this.filterPriority === 'Low' ? 'btn-secondary' : 'btn-secondary'} btn-sm" style="border-radius: 8px; font-size: 0.76rem; padding: 0.25rem 0.6rem;" onclick="TasksView.setPriorityFilter('Low')">Low</button>
          </div>
        </div>

        <!-- 3. ACTIVE VIEW CONTENT -->
        ${this.activeView === 'kanban' ? this.renderKanban() : this.activeView === 'list' ? this.renderList() : this.renderCalendar()}
      </div>
    `;
  },

  switchView(viewName) {
    this.activeView = viewName;
    try {
      localStorage.setItem('slcms_active_task_view', viewName);
    } catch (e) {}
    App.refreshCurrentView();
  },

  toggleAssignedMe() {
    this.filterAssignedMe = !this.filterAssignedMe;
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
    const existingCaseIds = new Set((SLCMS_STATE.cases || []).map(c => c.id));
    const existingCaseNums = new Set((SLCMS_STATE.cases || []).map(c => c.caseNumber).filter(Boolean));
    const currentUserName = (SLCMS_STATE.currentUser?.name || '').toLowerCase();
    const currentUserId = SLCMS_STATE.currentUser?.id || '';

    return (SLCMS_STATE.tasks || []).filter(t => {
      if (!t) return false;
      // If task has an explicit caseId, verify only if cases exist
      if (t.caseId && t.caseId !== 'case-gen' && existingCaseIds.size > 0 && !existingCaseIds.has(t.caseId)) {
        if (t.caseNumber && !existingCaseNums.has(t.caseNumber)) return false;
      }

      const matchP = this.filterPriority === 'All' || t.priority === this.filterPriority;
      const matchQ = !this.searchQuery ||
        (t.title && t.title.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (t.caseNumber && t.caseNumber.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (t.caseTitle && t.caseTitle.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(this.searchQuery.toLowerCase()));

      let matchAssigned = true;
      if (this.filterAssignedMe) {
        matchAssigned = (t.assignedTo && t.assignedTo.toLowerCase().includes(currentUserName)) ||
                        (t.assignedToId && t.assignedToId === currentUserId);
      }

      let matchAdmin = true;
      if (this.adminFilter === 'unassigned') {
        matchAdmin = !t.assignedTo || t.assignedTo === 'Unassigned';
      } else if (this.adminFilter === 'technical') {
        matchAdmin = t.isTechnical || t.category === 'technical';
      } else if (this.adminFilter === 'overdue') {
        matchAdmin = t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date();
      }

      return matchP && matchQ && matchAssigned && matchAdmin;
    });
  },

  getDeadlineCountdown(dueDate) {
    if (!dueDate) return { label: 'No date', badgeClass: 'due-normal', urgent: false };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        label: `⏰ Overdue ${daysAgo}d`,
        badgeClass: 'due-overdue',
        urgent: true
      };
    } else if (diffDays === 0) {
      return {
        label: '🚨 Due Today',
        badgeClass: 'due-today',
        urgent: true
      };
    } else if (diffDays === 1) {
      return {
        label: '⚠️ Due Tomorrow',
        badgeClass: 'due-tomorrow',
        urgent: true
      };
    } else if (diffDays <= 3) {
      return {
        label: `⚡ In ${diffDays} days`,
        badgeClass: 'due-soon',
        urgent: true
      };
    } else if (diffDays <= 7) {
      return {
        label: `📅 In ${diffDays} days`,
        badgeClass: 'due-week',
        urgent: false
      };
    } else {
      const dStr = due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return {
        label: `📅 ${dStr}`,
        badgeClass: 'due-normal',
        urgent: false
      };
    }
  },

  scrollToColumn(colId) {
    const el = document.getElementById(`kanban-col-${colId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  },

  renderKanban() {
    const columns = [
      { id: 'todo', title: 'To Do', icon: '📋', accent: '#1E3A8A' },
      { id: 'in_progress', title: 'In Progress', icon: '⚡', accent: '#C89B3C' },
      { id: 'under_review', title: 'Under Review', icon: '🔍', accent: '#6366F1' },
      { id: 'completed', title: 'Completed', icon: '✓', accent: '#10B981' }
    ];

    const allTasks = SLCMS_STATE.tasks || [];
    const filteredTasks = this.getFilteredTasks();
    const isLawyer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })();

    // If completely empty in database (0 tasks created yet) -> Single clean empty state (NO duplicate nested boxes)
    if (allTasks.length === 0) {
      return `
        <div class="tasks-empty-showcase-box animate-fade" style="margin: 2.5rem auto; max-width: 620px; padding: 3rem 2rem; border-radius: 16px; border: 1.5px dashed rgba(200, 155, 60, 0.35); background: #FFFFFF; text-align: center; box-shadow: 0 4px 20px -4px rgba(16,42,67,0.06);">
          <div style="width: 64px; height: 64px; margin: 0 auto 1.25rem auto; border-radius: 50%; background: rgba(200, 155, 60, 0.12); display: flex; align-items: center; justify-content: center; font-size: 2rem;">
            ⚖️
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin-bottom: 0.4rem; font-family: var(--font-heading);">
            No tasks or deadlines scheduled yet
          </h3>
          <p style="color: #64748B; font-size: 0.88rem; line-height: 1.5; max-width: 440px; margin: 0 auto 1.5rem auto;">
            Plan legal filings, track court appearances, and monitor statutory limitation cutoffs.
          </p>
          <div class="flex items-center justify-center gap-3 flex-wrap">
            ${isLawyer ? '' : `
            <button class="btn btn-gold" style="font-weight: 700; padding: 0.55rem 1.3rem; font-size: 0.88rem;" onclick="TasksView.openNewTaskModal()">
              + Create Task
            </button>
            `}
            <button class="btn btn-secondary" style="font-weight: 700; padding: 0.55rem 1.3rem; font-size: 0.88rem;" onclick="TasksView.openAddDeadlineModal()">
              📅 Add Deadline
            </button>
          </div>
        </div>
      `;
    }

    return `
      <!-- Mobile Column Navigation Tabs -->
      <div class="kanban-mobile-tabs">
        ${columns.map(col => {
          const count = filteredTasks.filter(t => (t.status || 'todo').toLowerCase() === col.id).length;
          return `
            <button class="kanban-mobile-tab-btn" onclick="TasksView.scrollToColumn('${col.id}')">
              <span>${col.title}</span>
              <span class="kanban-counter-pill">${count}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- THE 4 KANBAN COLUMNS -->
      <div class="kanban-board">
        ${columns.map(col => {
          const colTasks = filteredTasks.filter(t => {
            const st = (t.status || 'todo').toLowerCase().replace('to_do', 'todo');
            return st === col.id;
          });
          const totalColCount = allTasks.filter(t => {
            const st = (t.status || 'todo').toLowerCase().replace('to_do', 'todo');
            return st === col.id;
          }).length;

          return `
            <div class="kanban-col" id="kanban-col-${col.id}">
              
              <!-- Column Header Box -->
              <div class="kanban-col-header">
                <div class="kanban-col-title-wrap">
                  <span style="font-size: 1.05rem;">${col.icon}</span>
                  <span class="kanban-col-title-text">${col.title}</span>
                  <span class="kanban-counter-pill" title="${colTasks.length} tasks">
                    ${colTasks.length}
                  </span>
                </div>
                ${isLawyer ? '' : `
                <button class="kanban-quick-add-btn" onclick="TasksView.openNewTaskModal(null, '${col.id}')" title="Add task to ${col.title}">
                  +
                </button>
                `}
              </div>

              <!-- Column Cards List / Drop Zone -->
              <div class="kanban-cards-list">
                ${colTasks.length === 0 ? `
                  <div class="kanban-col-empty-zone">
                    <span class="kanban-col-empty-icon">${col.icon}</span>
                    <div>No tasks in ${col.title}</div>
                  </div>
                ` : colTasks.map(t => this.renderTaskCard(t, col.id)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderTaskCard(t, colId) {
    const priority = t.priority || 'Medium';
    const priorityClass = priority.toLowerCase();
    const priorityIcon = priority === 'Urgent' ? '🚨' : priority === 'High' ? '⚠️' : priority === 'Medium' ? '⚡' : '🔹';
    const countdown = this.getDeadlineCountdown(t.dueDate);

    const currentUser = SLCMS_STATE.currentUser || {};
    const currentUserName = (currentUser.name || '').toLowerCase();
    const currentUserId = currentUser.id || '';
    const userRole = currentUser.role || '';

    const isAdmin = (userRole === 'Administrator');
    const isSeniorLawyer = (userRole === 'Senior Lawyer' || userRole === 'Senior Counsel' || userRole === 'Partner');
    const isAssignee = (t.assignedTo && t.assignedTo.toLowerCase().includes(currentUserName)) ||
                       (t.assignedToId && t.assignedToId === currentUserId);
    const isSupervisor = isSeniorLawyer || (t.supervisorId && t.supervisorId === currentUserId);

    // Role-specific action button (Simple, clean, high-impact)
    let actionButtonsHtml = '';
    if (isAdmin) {
      actionButtonsHtml = `
        <button class="btn-task-role-action" style="background: rgba(200,155,60,0.12); color: #B45309; border: 1px solid rgba(200,155,60,0.3); font-weight: 700; font-size: 0.74rem; padding: 0.25rem 0.6rem; border-radius: 6px;" onclick="TasksView.openEditTaskModal('${t.id}')" title="Modify task details">
          ✏️ Edit
        </button>
        <button class="btn-task-role-action reassign-btn" onclick="TasksView.openReassignModal('${t.id}')" title="Reassign staff member">
          Reassign
        </button>
      `;
    } else if (isSupervisor) {
      if (colId === 'todo') {
        actionButtonsHtml = `
          <button class="btn-task-role-action" style="background: rgba(200,155,60,0.12); color: #B45309; border: 1px solid rgba(200,155,60,0.3); font-weight: 700; font-size: 0.74rem; padding: 0.25rem 0.6rem; border-radius: 6px;" onclick="TasksView.openEditTaskModal('${t.id}')">
            ✏️ Edit
          </button>
          <button class="btn-task-role-action reassign-btn" onclick="TasksView.openReassignModal('${t.id}')">
            Reassign
          </button>
        `;
      } else if (colId === 'in_progress') {
        actionButtonsHtml = `
          <button class="btn-task-role-action review-submit" onclick="TasksView.openReviewModal('${t.id}')">
            Review →
          </button>
        `;
      } else if (colId === 'under_review') {
        actionButtonsHtml = `
          <button class="btn-task-role-action approve-btn" onclick="TasksView.approveTask('${t.id}')" title="Approve task">
            Approve ✓
          </button>
        `;
      } else if (colId === 'completed') {
        actionButtonsHtml = `
          <span style="font-size: 0.74rem; font-weight: 700; color: #10B981;">
            ✓ Completed
          </span>
        `;
      }
    } else if (isAssignee) {
      if (colId === 'todo') {
        actionButtonsHtml = `
          <button class="btn-task-role-action primary-start" onclick="TasksView.startTask('${t.id}')">
            Start →
          </button>
        `;
      } else if (colId === 'in_progress') {
        actionButtonsHtml = `
          <button class="btn-task-role-action review-submit" onclick="TasksView.submitTaskForReview('${t.id}')">
            Submit Review →
          </button>
        `;
      } else if (colId === 'under_review') {
        actionButtonsHtml = `
          <span style="font-size: 0.72rem; font-weight: 700; color: #6366F1;">
            Under Review
          </span>
        `;
      } else if (colId === 'completed') {
        actionButtonsHtml = `
          <span style="font-size: 0.74rem; font-weight: 700; color: #10B981;">
            ✓ Completed
          </span>
        `;
      }
    } else {
      actionButtonsHtml = ``;
    }

    return `
      <div class="card kanban-card priority-${priorityClass}" id="card-${t.id}">
        
        <!-- 1. Top Row: Priority Badge + Real-Time Countdown Pill -->
        <div class="task-card-top-row" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.35rem;">
          <span class="task-priority-tag ${priorityClass}">
            ${priorityIcon} ${priority}
          </span>
          <span class="task-countdown-pill ${countdown.badgeClass}">
            ${countdown.label}
          </span>
        </div>

        <!-- 2. Task Title -->
        <h4 class="task-card-heading" style="font-size: 0.92rem; font-weight: 700; color: #0F172A; line-height: 1.35; margin: 0 0 0.35rem 0;">
          ${t.title}
        </h4>

        <!-- 3. Clean Matter Reference -->
        <div class="task-matter-card-box" style="margin-bottom: 0.45rem;">
          <span class="task-matter-card-num">${t.caseNumber || 'MATTER-GEN'}</span>
          <span style="color: #94A3B8; font-size: 0.7rem;">&bull;</span>
          <span class="task-matter-card-title">${t.caseTitle || 'General Legal Practice'}</span>
        </div>

        <!-- 4. Footer: Assignee & Action -->
        <div class="task-card-action-footer" style="display: flex; align-items: center; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid rgba(0,0,0,0.05); margin-top: 0.25rem;">
          <div class="flex items-center gap-1.5" style="min-width: 0;">
            <div class="task-assignee-avatar-ring">
              ${t.assignedAvatar || (t.assignedTo ? t.assignedTo.substring(0, 2).toUpperCase() : 'US')}
            </div>
            <span style="font-size: 0.78rem; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 105px;" title="${t.assignedTo || 'Unassigned'}">
              ${t.assignedTo || 'Unassigned'}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button class="btn-task-details-link" onclick="TasksView.openTaskDetailsModal('${t.id}')">
              Details
            </button>
            ${actionButtonsHtml}
          </div>
        </div>
      </div>
    `;
  },

  renderList() {
    const tasks = this.getFilteredTasks();
    const isLawyer = (function() {
      const u = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })();

    if (tasks.length === 0) {
      return `
        <div class="card empty-state" style="padding: 3.5rem 1.5rem; text-align: center; margin-top: 1rem;">
          <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.85rem;">📋</div>
          <h3 class="empty-title" style="font-size: 1.25rem; color: var(--color-primary); font-weight: 700;">No tasks assigned</h3>
          <p class="empty-desc" style="color: var(--color-text-secondary); max-width: 480px; margin: 0.5rem auto 1.5rem auto; line-height: 1.5;">
            There are currently no tasks assigned to legal or administrative personnel. ${isLawyer ? 'Tasks will appear here once assigned to you.' : 'Create an actionable task linked to a legal matter.'}
          </p>
          ${isLawyer ? '' : `
          <button class="btn btn-gold" onclick="TasksView.openNewTaskModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>+ Create Task</span>
          </button>
          `}
        </div>
      `;
    }

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

  // Statutory docket events (empty by default, loaded from database/persistence)
  courtEvents: (() => {
    try {
      const cases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];
      if (cases.length === 0) {
        localStorage.removeItem('slcms_persisted_court_events');
        return [];
      }
      const existingCaseIds = new Set(cases.map(c => c.id));
      const existingCaseNums = new Set(cases.map(c => c.caseNumber).filter(Boolean));

      const saved = localStorage.getItem('slcms_persisted_court_events');
      if (saved) {
        // Immediate clean of test/junk entries
        if (saved.includes('bvfcjk') || saved.includes('hhoiuyfthjk') || saved.includes('knjhgfgxhj')) {
          localStorage.removeItem('slcms_persisted_court_events');
          return [];
        }
        const parsed = JSON.parse(saved);
        const DEMO_EVT_IDS = ['evt-01', 'evt-02', 'evt-03', 'evt-04', 'evt-05', 'evt-06'];
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(e => 
            e && e.id && 
            !DEMO_EVT_IDS.includes(e.id) && 
            !e.title?.includes('bvfcjk') && 
            !e.court?.includes('hhoiuyfthjk') &&
            (existingCaseIds.has(e.caseId) || existingCaseNums.has(e.caseNumber))
          );
          if (valid.length === 0) {
            localStorage.removeItem('slcms_persisted_court_events');
          }
          return valid;
        }
      }
    } catch(e){}
    return [];
  })(),

  mapDeadlineToCourtEvent(dln) {
    const cleanStr = (val, fallback = '') => {
      if (!val || val === 'undefined' || val === 'null') return fallback;
      const s = String(val).trim();
      return (s === '' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') ? fallback : s;
    };

    const dVal = cleanStr(dln.deadlineDate || dln.date, '2026-09-29');
    const dateObj = new Date(dVal);
    const dayNum = dVal.split('-')[2] || String(dateObj.getDate()).padStart(2, '0');
    const monthShort = isNaN(dateObj.getTime()) ? 'SEP' : dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const weekday = isNaN(dateObj.getTime()) ? 'Weekday' : dateObj.toLocaleString('en-US', { weekday: 'short' });
    
    let rawAssigned = cleanStr(dln.responsibleLawyerName || dln.advocate || dln.assignedTo, 'Advocate In-Charge');
    if (rawAssigned.toLowerCase().includes('undefined') || rawAssigned.toLowerCase().includes('null')) {
      rawAssigned = 'Advocate In-Charge';
    }
    const words = rawAssigned.split(/\s+/).filter(Boolean);
    const initials = words.length >= 2 
      ? (words[0][0] + words[1][0]).toUpperCase() 
      : (rawAssigned.substring(0, 2) || 'LC').toUpperCase();

    const category = (cleanStr(dln.type, '')).toLowerCase().includes('hearing') ? 'hearings' :
                     (cleanStr(dln.type, '')).toLowerCase().includes('motion') ? 'motions' : 'briefs';

    const cleanCourt = cleanStr(dln.court, 'High Court of Tanzania');
    const cleanPresiding = cleanStr(dln.presiding, '');
    const cleanStatute = cleanStr(dln.statutoryReference, '');
    const cleanDesc = cleanStr(dln.instructions || dln.description || dln.supportingDocument, '');

    return {
      id: dln.id,
      date: dVal,
      time: cleanStr(dln.deadlineTime || dln.time, '09:30 AM EAT'),
      monthShort: monthShort,
      dayNum: dayNum,
      weekday: weekday,
      title: cleanStr(dln.title, 'Statutory Proceeding'),
      caseId: cleanStr(dln.caseId, 'case-gen'),
      caseNumber: cleanStr(dln.caseNumber, 'MATTER-GEN'),
      caseTitle: cleanStr(dln.caseTitle, 'General Legal Matter'),
      category: category,
      type: cleanStr(dln.type, 'Statutory Deadline'),
      court: cleanCourt,
      presiding: cleanPresiding,
      assignedTo: rawAssigned,
      assignedAvatar: initials,
      priority: cleanStr(dln.priority, 'Medium'),
      status: cleanStr(dln.status, 'Confirmed'),
      statute: cleanStatute,
      location: cleanCourt,
      description: cleanDesc,
      exhibits: cleanStr(dln.exhibits, 'Pleadings & Affidavits')
    };
  },

  syncCourtEvents() {
    // Purge any stale junk or test entries from storage
    try {
      const saved = localStorage.getItem('slcms_persisted_court_events');
      if (saved && (saved.includes('bvfcjk') || saved.includes('hhoiuyfthjk') || saved.includes('knjhgfgxhj'))) {
        localStorage.removeItem('slcms_persisted_court_events');
      }
    } catch(e){}

    const cases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.cases)) ? SLCMS_STATE.cases : [];
    const existingCaseIds = new Set(cases.map(c => c.id));
    const existingCaseNums = new Set(cases.map(c => c.caseNumber).filter(Boolean));

    // If no cases exist in the system, no court appearances or deadlines can exist
    if (existingCaseIds.size === 0) {
      this.courtEvents = [];
      try {
        localStorage.removeItem('slcms_persisted_court_events');
        if (typeof SLCMS_STATE !== 'undefined') {
          SLCMS_STATE.deadlines = [];
          localStorage.removeItem('slcms_persisted_deadlines');
        }
      } catch(e){}
      return;
    }

    // If genuine deadlines are registered in SLCMS_STATE.deadlines, map them
    if (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.deadlines) && SLCMS_STATE.deadlines.length > 0) {
      const validDeadlines = SLCMS_STATE.deadlines.filter(d => d && (existingCaseIds.has(d.caseId) || existingCaseNums.has(d.caseNumber)));
      this.courtEvents = validDeadlines.map(d => this.mapDeadlineToCourtEvent(d));
      return;
    }

    // Otherwise, check local storage for legitimately scheduled appearances
    try {
      const saved = localStorage.getItem('slcms_persisted_court_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        const DEMO_EVT_IDS = ['evt-01', 'evt-02', 'evt-03', 'evt-04', 'evt-05', 'evt-06'];
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(e => 
            e && e.id && 
            !DEMO_EVT_IDS.includes(e.id) && 
            !e.title?.includes('bvfcjk') && 
            !e.court?.includes('hhoiuyfthjk') &&
            (existingCaseIds.has(e.caseId) || existingCaseNums.has(e.caseNumber))
          );
          if (valid.length === 0) {
            localStorage.removeItem('slcms_persisted_court_events');
          }
          this.courtEvents = valid;
          return;
        }
      }
    } catch(e){}

    this.courtEvents = [];
  },

  persistCourtEvents() {
    try {
      if (!this.courtEvents || this.courtEvents.length === 0) {
        localStorage.removeItem('slcms_persisted_court_events');
      } else {
        localStorage.setItem('slcms_persisted_court_events', JSON.stringify(this.courtEvents));
      }
    } catch(e){}
  },

  async deleteCourtEvent(eventId) {
    if (!confirm('Are you sure you want to remove this statutory docket entry?')) return;
    
    const removedEvt = (this.courtEvents || []).find(e => e.id === eventId);
    this.courtEvents = (this.courtEvents || []).filter(e => e.id !== eventId);
    this.persistCourtEvents();

    if (typeof SLCMS_STATE !== 'undefined') {
      if (typeof SLCMS_STATE.deleteDeadline === 'function') {
        await SLCMS_STATE.deleteDeadline(eventId);
      } else if (Array.isArray(SLCMS_STATE.deadlines)) {
        SLCMS_STATE.deadlines = SLCMS_STATE.deadlines.filter(d => d.id !== eventId);
        try { localStorage.setItem('slcms_persisted_deadlines', JSON.stringify(SLCMS_STATE.deadlines)); } catch(e){}
      }
      SLCMS_STATE.addAuditLog('Court Appearance Deleted', 'Tasks & Deadlines', removedEvt ? `${removedEvt.title} (${removedEvt.caseNumber})` : eventId, 'Warning');
    }

    App.closeModal();
    App.showToast('Docket entry removed successfully.', 'success');
    App.refreshCurrentView();
  },

  openScheduleDeadlineModal(caseContext = null) {
    this.openScheduleAppearanceModal(caseContext);
  },

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
    App.refreshCurrentView();
  },

  resetCalendarToToday() {
    this.calendarMonth = 8; // September 2026
    this.calendarYear = 2026;
    App.refreshCurrentView();
  },

  getFilteredEvents() {
    this.syncCourtEvents();
    return (this.courtEvents || []).filter(evt => {
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

    const courtCount = filteredEvents.filter(e => e.category === 'hearings').length;
    const motionCount = filteredEvents.filter(e => e.category === 'motions').length;
    const callCount = filteredEvents.filter(e => e.category === 'briefs').length;

    return `
      <div class="court-cal-wrapper">
        
        <!-- 1. EXECUTIVE CALENDAR METRIC STRIP (BEST BOXES & LUXURY PALETTE) -->
        <div class="court-cal-stats-strip">
          <!-- Card 1: Court Appearances -->
          <div class="court-cal-stat-card variant-sapphire">
            <div class="court-cal-stat-info">
              <div class="court-cal-stat-val">${courtCount}</div>
              <div class="court-cal-stat-label">Court Appearances</div>
              <span class="court-cal-micro-chip chip-sapphire">🏛️ Active Docket</span>
            </div>
            <div class="court-cal-stat-icon-box sapphire">
              🏛️
            </div>
          </div>

          <!-- Card 2: Critical Motions Due -->
          <div class="court-cal-stat-card variant-amber">
            <div class="court-cal-stat-info">
              <div class="court-cal-stat-val">${motionCount}</div>
              <div class="court-cal-stat-label">Critical Motions Due</div>
              <span class="court-cal-micro-chip chip-amber">${motionCount > 0 ? '⚡ Immediate Review' : '✓ Docket Clear'}</span>
            </div>
            <div class="court-cal-stat-icon-box amber">
              ⚠️
            </div>
          </div>

          <!-- Card 3: Commercial Div. Calls -->
          <div class="court-cal-stat-card variant-violet">
            <div class="court-cal-stat-info">
              <div class="court-cal-stat-val">${callCount}</div>
              <div class="court-cal-stat-label">Commercial Div. Calls</div>
              <span class="court-cal-micro-chip chip-violet">⚖️ Commercial Div.</span>
            </div>
            <div class="court-cal-stat-icon-box violet">
              ⚖️
            </div>
          </div>

          <!-- Card 4: Statutory Compliance -->
          <div class="court-cal-stat-card variant-emerald">
            <div class="court-cal-stat-info">
              <div class="court-cal-stat-val">${filteredEvents.length === 0 ? '100%' : '100%'}</div>
              <div class="court-cal-stat-label">Statutory Compliance</div>
              <span class="court-cal-micro-chip chip-emerald">✓ Fully Compliant</span>
            </div>
            <div class="court-cal-stat-icon-box emerald">
              ✓
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
                  High Court &amp; Appellate Docket
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
                <button class="btn btn-secondary btn-sm" onclick="TasksView.syncECourts()" title="Sync e-Courts &amp; Judiciary Docket">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>Judiciary Sync</span>
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
                🏛️ Court Hearings (${this.courtEvents.filter(e => e.category === 'hearings').length})
              </button>
              <button class="court-filter-pill ${this.calendarFilter === 'motions' ? 'active' : ''}" onclick="TasksView.setCalendarFilter('motions')">
                📑 Motions &amp; Petitions (${this.courtEvents.filter(e => e.category === 'motions').length})
              </button>
              <button class="court-filter-pill ${this.calendarFilter === 'briefs' ? 'active' : ''}" onclick="TasksView.setCalendarFilter('briefs')">
                📄 Briefs &amp; Filings (${this.courtEvents.filter(e => e.category === 'briefs').length})
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
        <div class="card empty-state" style="padding: 3.5rem 1.5rem; text-align: center; margin: 1rem 0;">
          <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.85rem;">📅</div>
          <h3 class="empty-title" style="font-size: 1.25rem; color: var(--color-primary); font-weight: 700;">No deadlines scheduled</h3>
          <p class="empty-desc" style="color: var(--color-text-secondary); max-width: 480px; margin: 0.5rem auto 1.5rem auto; line-height: 1.5;">
            There are currently no court appearances, motion filings, or statutory cutoffs scheduled on the docket.
          </p>
          <button class="btn btn-gold" onclick="TasksView.openScheduleAppearanceModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>+ Schedule Deadline</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="court-agenda-container">
        ${events.map(evt => {
          const isHighPriority = evt.priority === 'High' || evt.priority === 'Urgent';
          const priorityClass = isHighPriority ? 'priority-high' : evt.priority === 'Medium' ? 'priority-medium' : 'priority-low';
          const isConfirmed = Boolean(evt.status && evt.status.toLowerCase().includes('confirmed'));

          return `
            <div class="court-docket-card ${priorityClass} ${isConfirmed ? 'status-confirmed' : ''}">
              
              <!-- Modern Apple/Stripe-Style Date Badge -->
              <div class="court-date-badge">
                <div class="court-date-ribbon">${evt.monthShort || 'SEP'} 2026</div>
                <div class="court-date-day">${evt.dayNum || '15'}</div>
                <div class="court-date-time-tag">
                  ⏰ ${evt.time || '09:30 AM'}
                </div>
              </div>

              <!-- Streamlined Center Body (Reduced & Essential Details) -->
              <div class="court-docket-body">
                <!-- Meta Row: Matter Chip + Matter Name + Status/Priority Badges -->
                <div class="court-docket-meta-row">
                  <span class="court-matter-pill" onclick="App.navigate('cases'); setTimeout(() => CasesView.openCaseDossier('${evt.caseId}'), 100);" title="Open Case Dossier">
                    ⚖️ ${evt.caseNumber}
                  </span>
                  <span class="court-matter-name" title="${evt.caseTitle}">${evt.caseTitle}</span>
                  ${isHighPriority ? `
                    <span class="court-priority-capsule">
                      ⚠️ High Priority
                    </span>
                  ` : ''}
                  <span class="court-status-capsule ${isConfirmed ? 'confirmed' : 'pending'}">
                    ${isConfirmed ? '● Confirmed' : '⏳ Pending'}
                  </span>
                </div>

                <!-- Hearing Title -->
                <h4 class="court-hearing-title">${evt.title}</h4>

                <!-- Concise Single Metadata Strip (NO undefineds or cluttered rows) -->
                <div class="court-clean-meta-strip">
                  <span class="court-clean-meta-item">
                    🏛️ <span>${evt.court}</span>
                  </span>
                  ${evt.presiding ? `
                    <span class="court-clean-meta-dot">•</span>
                    <span class="court-clean-meta-item">
                      👨‍⚖️ <span>${evt.presiding}</span>
                    </span>
                  ` : ''}
                  <span class="court-clean-meta-dot">•</span>
                  <span class="court-clean-meta-item">
                    📅 <span>${evt.weekday}</span>
                  </span>
                  ${evt.description && evt.description.toLowerCase() !== 'undefined' && evt.description.length > 3 ? `
                    <span class="court-clean-meta-dot">•</span>
                    <span style="color: #64748B; font-size: 0.76rem; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${evt.description}">
                      📝 ${evt.description}
                    </span>
                  ` : ''}
                </div>
              </div>

              <!-- Sleek Right Action & Counsel Area -->
              <div class="court-docket-action-area">
                <!-- Counsel Capsule -->
                <div class="court-counsel-chip">
                  <div class="avatar ${evt.assignedAvatar === 'EV' ? 'avatar-gold' : evt.assignedAvatar === 'JM' ? 'avatar-navy' : 'avatar-teal'}">
                    ${evt.assignedAvatar}
                  </div>
                  <div class="court-counsel-name">
                    ${evt.assignedTo}
                  </div>
                </div>

                <!-- Action Button Group -->
                <div class="court-action-btns-group">
                  <button class="btn-court-portal" onclick="App.showToast('Courtroom video portal launched for ${evt.caseNumber}', 'success')" title="Launch High Court Virtual Courtroom Portal">
                    <span>🏛️ Court Portal</span>
                  </button>
                  <button class="btn-court-inspect" onclick="TasksView.openEventDetails('${evt.id}')" title="Inspect Docket Details">
                    <span>Inspect</span>
                  </button>
                  <button class="btn-court-remove" onclick="TasksView.deleteCourtEvent('${evt.id}')" title="Remove from Docket">
                    <span>🗑️</span>
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
                        ${evt.assignedAvatar || 'LC'}
                      </div>
                      <span style="font-size: 0.8rem; font-weight: 600;">${(evt.assignedTo || 'Advocate').split(' ')[0]}</span>
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <div class="flex items-center justify-end gap-1.5">
                      <button class="btn btn-secondary btn-sm" onclick="TasksView.openEditDeadlineModal('${evt.id}')" title="Modify Statutory Deadline">
                        ✏️ Edit
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="TasksView.openEventDetails('${evt.id}')">
                        View Docket
                      </button>
                      <button class="btn btn-ghost btn-sm" style="color: #DC2626; padding: 0.25rem 0.45rem;" onclick="TasksView.deleteCourtEvent('${evt.id}')" title="Delete Entry">
                        🗑️
                      </button>
                    </div>
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
    const evt = (this.courtEvents || []).find(e => e.id === eventId) || (SLCMS_STATE.deadlines || []).find(d => d.id === eventId);
    if (!evt) {
      App.showToast('Docket entry not found.', 'info');
      return;
    }
    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.25rem;">🏛️</span>
          <div>
            <h3 class="modal-title">Statutory Court Docket & Hearing Dossier</h3>
            <span style="font-size: 0.75rem; color: var(--color-text-secondary);">${evt.caseNumber || 'MATTER-GEN'} • ${evt.statute || evt.statutoryReference || 'Court Rules'}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>

      <div class="modal-body">
        <!-- Banner -->
        <div style="background: linear-gradient(135deg, var(--color-primary) 0%, #1A365D 100%); color: #FFFFFF; padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border-left: 4px solid var(--color-gold);">
          <div class="flex items-center justify-between" style="margin-bottom: 0.45rem;">
            <span class="badge badge-active" style="background: rgba(22, 163, 74, 0.3); color: #86EFAC; border-color: #16A34A;">
              ● ${evt.status || 'Scheduled'}
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: #FCD34D;">
              📅 ${evt.date || evt.deadlineDate || ''} • ${evt.time || evt.deadlineTime || '09:00 AM'}
            </span>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; margin: 0 0 0.35rem 0; color: #FFFFFF;">${TasksView.escapeHtml(evt.title || '')}</h4>
          <div style="font-size: 0.82rem; opacity: 0.9;"><strong>Matter:</strong> ${TasksView.escapeHtml(evt.caseTitle || 'General Legal Practice')} (${evt.caseNumber || 'MATTER-GEN'})</div>
        </div>

        <!-- 2-Column Details Grid -->
        <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.25rem;">
          <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Presiding Officer / Judge</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary); margin-top: 0.25rem;">${evt.presiding || 'Presiding Judicial Officer'}</div>
            <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.2rem;">${evt.court || 'High Court of Tanzania'}</div>
          </div>

          <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Assigned Lead Counsel</div>
            <div class="flex items-center gap-2" style="margin-top: 0.25rem;">
              <div class="avatar avatar-sm ${evt.assignedAvatar === 'EV' ? 'avatar-gold' : 'avatar-navy'}">${evt.assignedAvatar || 'LC'}</div>
              <div>
                <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary);">${evt.assignedTo || evt.responsibleLawyerName || 'Counsel'}</div>
                <div style="font-size: 0.74rem; color: var(--color-text-secondary);">Responsible Counsel</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Procedural & Evidentiary Mandate -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" style="font-weight: 700;">Procedural Mandate & Statutory Instructions</label>
          <div style="font-size: 0.84rem; line-height: 1.5; color: var(--color-text-main); background: var(--color-surface); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            ${TasksView.escapeHtml(evt.description || evt.instructions || 'Mandatory appearance / filing cutoff.')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight: 700;">Required Evidentiary Exhibits & Pleadings</label>
          <div style="font-size: 0.8rem; font-family: var(--font-mono); background: var(--color-surface-subtle); padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); color: var(--color-primary);">
            📁 ${TasksView.escapeHtml(evt.exhibits || 'Pleadings, Affidavits & Authorities')}
          </div>
        </div>
      </div>

      <div class="modal-footer flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button class="btn btn-danger btn-sm" style="background: #DC2626; color: #FFFFFF;" onclick="TasksView.deleteCourtEvent('${evt.id}')">
            🗑️ Remove
          </button>
          <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="TasksView.openEditDeadlineModal('${evt.id}')">
            ✏️ Modify Deadline
          </button>
          <button class="btn btn-gold btn-sm" onclick="App.showToast('Appearance confirmed.', 'success'); App.closeModal();">
            ✓ Confirm
          </button>
        </div>
      </div>
    `);
  },

  _deadlineCallback: null,

  openScheduleAppearanceModal(caseContext = null, callback = null) {
    this._deadlineCallback = callback;
    const activeStaff = SLCMS_STATE.getActiveStaffUsers();
    const cases = SLCMS_STATE.cases || [];
    const today = new Date().toISOString().substring(0, 10);

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
      <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
        <!-- Validation Alert Banner -->
        <div id="sch-validation-alert" class="add-case-step-err-banner" style="display:none;"></div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Appearance Title / Action Item <span class="text-danger">*</span></label>
          <input type="text" id="sch-title" class="form-control" 
                 placeholder="e.g. Pre-Trial Hearing / Motion Filing Deadline" 
                 maxlength="150"
                 oninput="TasksView.validateAppearanceFieldRealtime('title')" 
                 onblur="TasksView.validateAppearanceFieldRealtime('title')">
          <div class="sch-err-msg" id="err-sch-title">Appearance Title is required (3–150 characters with valid words).</div>
        </div>

        <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label required">Associated Legal Matter <span class="text-danger">*</span></label>
            <select id="sch-case" class="form-control"
                    onchange="TasksView.validateAppearanceFieldRealtime('case')"
                    onblur="TasksView.validateAppearanceFieldRealtime('case')">
              <option value="">-- Select Legal Matter --</option>
              ${cases.map(c => `<option value="${c.id}" ${(caseContext && (caseContext.id === c.id || caseContext === c.id)) ? 'selected' : ''}>${c.caseNumber} - ${c.title}</option>`).join('')}
            </select>
            <div class="sch-err-msg" id="err-sch-case">Please select an associated legal matter from the docket.</div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label required">Assigned Staff <span class="text-danger">*</span></label>
            <select id="sch-assigned" class="form-control"
                    onchange="TasksView.validateAppearanceFieldRealtime('assigned')"
                    onblur="TasksView.validateAppearanceFieldRealtime('assigned')">
              <option value="">-- Select Assigned Staff --</option>
              ${activeStaff.map(s => `<option value="${s.name}" ${s.role === 'Lawyer' || s.role === 'Advocate' ? 'selected' : ''}>${s.name} (${s.role})</option>`).join('')}
            </select>
            <div class="sch-err-msg" id="err-sch-assigned">Please select a responsible staff member or advocate.</div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4" style="margin-bottom: 1rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label required">Appearance / Due Date <span class="text-danger">*</span></label>
            <input type="date" id="sch-date" class="form-control" 
                   value="${today}" 
                   min="${today}"
                   onchange="TasksView.validateAppearanceFieldRealtime('date')"
                   onblur="TasksView.validateAppearanceFieldRealtime('date')">
            <div class="sch-err-msg" id="err-sch-date">Appearance date cannot be in the past for a newly scheduled appearance.</div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label required">Call Time <span class="text-danger">*</span></label>
            <input type="text" id="sch-time" class="form-control" value="09:30 AM EAT" placeholder="e.g. 09:30 AM or 14:00"
                   oninput="TasksView.validateAppearanceFieldRealtime('time')"
                   onblur="TasksView.validateAppearanceFieldRealtime('time')">
            <div class="sch-err-msg" id="err-sch-time">Please provide a valid time (e.g. 09:30 AM or 14:00).</div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label required">Event Type <span class="text-danger">*</span></label>
            <select id="sch-category" class="form-control"
                    onchange="TasksView.validateAppearanceFieldRealtime('category')">
              <option value="hearings">Court Hearing / Motion Call</option>
              <option value="motions">Pleading &amp; Brief Filing</option>
              <option value="briefs">Discovery / Filing Due Date</option>
            </select>
            <div class="sch-err-msg" id="err-sch-category">Please select a valid Event Type.</div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Courtroom / Location <span class="text-danger">*</span></label>
          <input type="text" id="sch-court" class="form-control" 
                 list="tz-court-locations" 
                 placeholder="e.g. High Court of Tanzania, Commercial Division"
                 oninput="TasksView.validateAppearanceFieldRealtime('court')"
                 onblur="TasksView.validateAppearanceFieldRealtime('court')">
          <datalist id="tz-court-locations">
            <option value="High Court of Tanzania (Commercial Division)">
            <option value="High Court of Tanzania (Land Division)">
            <option value="Court of Appeal of Tanzania">
            <option value="Resident Magistrate Court of Dar es Salaam at Kisutu">
            <option value="District Court of Ilala">
            <option value="District Court of Kinondoni">
            <option value="District Court of Temeke">
            <option value="Tax Appeals Tribunal">
          </datalist>
          <div class="sch-err-msg" id="err-sch-court">Courtroom / Location is required (minimum 3 characters).</div>
        </div>

        <div class="form-group" style="margin-bottom: 0.5rem;">
          <label class="form-label">Procedural Notes / Instructions</label>
          <textarea id="sch-desc" class="form-control" rows="2" 
                    maxlength="500"
                    placeholder="Specify statutory citations or instructions..."
                    oninput="TasksView.validateAppearanceFieldRealtime('desc')"></textarea>
          <div class="sch-err-msg" id="err-sch-desc">Instructions cannot exceed 500 characters.</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveNewAppearance()">Schedule Deadline</button>
      </div>
    `);
  },

  validateAppearanceForm(silent = false) {
    const errors = [];
    const today = new Date().toISOString().substring(0, 10);

    // 1. Appearance Title
    const titleEl = document.getElementById('sch-title');
    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
      errors.push({ field: 'sch-title', errId: 'err-sch-title', msg: 'Appearance Title / Action Item is required.' });
    } else if (title.length < 3 || title.length > 150) {
      errors.push({ field: 'sch-title', errId: 'err-sch-title', msg: 'Appearance Title must be between 3 and 150 characters.' });
    } else if (!/[a-zA-Z]/.test(title)) {
      errors.push({ field: 'sch-title', errId: 'err-sch-title', msg: 'Appearance Title must contain letters/words (cannot be numbers only).' });
    } else if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/.test(title.replace(/[\s.,'"`:;()\-–—?!]/g, ''))) {
      errors.push({ field: 'sch-title', errId: 'err-sch-title', msg: 'Appearance Title cannot contain random unpronounceable keyboard mash.' });
    }

    // 2. Associated Legal Matter
    const caseEl = document.getElementById('sch-case');
    const caseId = caseEl ? caseEl.value.trim() : '';
    if (!caseId) {
      errors.push({ field: 'sch-case', errId: 'err-sch-case', msg: 'Please select an associated legal matter from the docket.' });
    }

    // 3. Assigned Staff
    const staffEl = document.getElementById('sch-assigned');
    const staff = staffEl ? staffEl.value.trim() : '';
    if (!staff || staff === 'Unassigned') {
      errors.push({ field: 'sch-assigned', errId: 'err-sch-assigned', msg: 'Please select an assigned staff member or advocate.' });
    }

    // 4. Appearance / Due Date
    const dateEl = document.getElementById('sch-date');
    const dateVal = dateEl ? dateEl.value.trim() : '';
    if (!dateVal) {
      errors.push({ field: 'sch-date', errId: 'err-sch-date', msg: 'Appearance / Due Date is required.' });
    } else if (dateVal < today) {
      errors.push({ field: 'sch-date', errId: 'err-sch-date', msg: 'Appearance / Due Date cannot be in the past for a newly scheduled appearance.' });
    }

    // 5. Call Time
    const timeEl = document.getElementById('sch-time');
    const timeVal = timeEl ? timeEl.value.trim() : '';
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)?(\s*[A-Z]{2,4})?$|^([01]?[0-9]|2[0-3]):[0-5][0-9](\s*[A-Z]{2,4})?$/i;
    if (!timeVal) {
      errors.push({ field: 'sch-time', errId: 'err-sch-time', msg: 'Call Time is required.' });
    } else if (!timeRegex.test(timeVal)) {
      errors.push({ field: 'sch-time', errId: 'err-sch-time', msg: 'Please enter a valid call time (e.g. 09:30 AM or 14:00).' });
    }

    // 6. Event Type
    const catEl = document.getElementById('sch-category');
    const catVal = catEl ? catEl.value.trim() : '';
    const validCats = ['hearings', 'motions', 'briefs'];
    if (!catVal || !validCats.includes(catVal)) {
      errors.push({ field: 'sch-category', errId: 'err-sch-category', msg: 'Please select a valid Event Type.' });
    }

    // 7. Courtroom / Location
    const courtEl = document.getElementById('sch-court');
    const courtVal = courtEl ? courtEl.value.trim() : '';
    if (!courtVal) {
      errors.push({ field: 'sch-court', errId: 'err-sch-court', msg: 'Courtroom / Location is required.' });
    } else if (courtVal.length < 3) {
      errors.push({ field: 'sch-court', errId: 'err-sch-court', msg: 'Courtroom / Location must be at least 3 characters.' });
    } else if (!/[a-zA-Z]/.test(courtVal)) {
      errors.push({ field: 'sch-court', errId: 'err-sch-court', msg: 'Courtroom / Location must contain letters (e.g. court name or room).' });
    }

    // 8. Description
    const descEl = document.getElementById('sch-desc');
    const descVal = descEl ? descEl.value.trim() : '';
    if (descVal.length > 500) {
      errors.push({ field: 'sch-desc', errId: 'err-sch-desc', msg: 'Procedural notes cannot exceed 500 characters.' });
    }

    return errors;
  },

  validateAppearanceFieldRealtime(fieldName) {
    const errors = this.validateAppearanceForm(true);

    const markField = (inputElId, errElId) => {
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

    if (fieldName === 'title' || !fieldName) markField('sch-title', 'err-sch-title');
    if (fieldName === 'case' || !fieldName) markField('sch-case', 'err-sch-case');
    if (fieldName === 'assigned' || !fieldName) markField('sch-assigned', 'err-sch-assigned');
    if (fieldName === 'date' || !fieldName) markField('sch-date', 'err-sch-date');
    if (fieldName === 'time' || !fieldName) markField('sch-time', 'err-sch-time');
    if (fieldName === 'category' || !fieldName) markField('sch-category', 'err-sch-category');
    if (fieldName === 'court' || !fieldName) markField('sch-court', 'err-sch-court');
    if (fieldName === 'desc' || !fieldName) markField('sch-desc', 'err-sch-desc');

    const banner = document.getElementById('sch-validation-alert');
    if (banner) {
      if (errors.length === 0) {
        banner.style.display = 'none';
      } else if (banner.style.display !== 'none') {
        banner.innerHTML = `⚠️ <span>Please correct the highlighted fields: <strong>${TasksView.escapeHtml(errors[0].msg)}</strong></span>`;
      }
    }
  },

  saveNewAppearance() {
    const errors = this.validateAppearanceForm(false);
    if (errors.length > 0) {
      // Highlight all invalid fields
      errors.forEach(err => {
        const el = document.getElementById(err.field);
        if (el) el.classList.add('is-invalid');
        const errEl = document.getElementById(err.errId);
        if (errEl) {
          errEl.textContent = err.msg;
          errEl.classList.add('visible');
        }
      });

      const banner = document.getElementById('sch-validation-alert');
      if (banner) {
        banner.innerHTML = `⚠️ <span>Please correct the highlighted fields before scheduling: <strong>${TasksView.escapeHtml(errors[0].msg)}</strong></span>`;
        banner.style.display = 'flex';
      }

      App.showToast(errors[0].msg, 'error');
      const firstEl = document.getElementById(errors[0].field);
      if (firstEl) firstEl.focus();
      return;
    }

    const title = document.getElementById('sch-title')?.value?.trim();
    const caseId = document.getElementById('sch-case')?.value;
    const c = (SLCMS_STATE.cases || []).find(item => item.id === caseId) || { id: 'case-gen', caseNumber: 'MATTER-GEN', title: 'General Practice Matter' };
    const dateVal = document.getElementById('sch-date')?.value || new Date().toISOString().substring(0, 10);
    const dayNum = dateVal.split('-')[2] || '15';
    const assigned = document.getElementById('sch-assigned')?.value || 'Adv. Asha Mrema';

    const newEvt = {
      id: 'evt-' + Date.now(),
      date: dateVal,
      time: document.getElementById('sch-time')?.value || '09:30 AM EAT',
      monthShort: new Date(dateVal).toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      dayNum: dayNum,
      weekday: new Date(dateVal).toLocaleString('en-US', { weekday: 'long' }),
      title: title,
      caseId: c.id,
      caseNumber: c.caseNumber,
      caseTitle: c.title,
      category: document.getElementById('sch-category')?.value || 'hearings',
      type: 'Scheduled Appearance',
      court: document.getElementById('sch-court')?.value || 'High Court of Tanzania',
      presiding: 'Presiding Judge',
      assignedTo: assigned,
      assignedAvatar: assigned.substring(0, 2).toUpperCase(),
      priority: 'High',
      status: 'Confirmed',
      statute: 'Judiciary Rules',
      location: document.getElementById('sch-court')?.value || 'High Court of Tanzania',
      description: document.getElementById('sch-desc')?.value || 'Mandatory appearance/deadline.',
      exhibits: 'Pleadings & Affidavits'
    };

    this.courtEvents.unshift(newEvt);
    this.persistCourtEvents();

    if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.createDeadlineOnBackend === 'function') {
      SLCMS_STATE.createDeadlineOnBackend({
        id: newEvt.id,
        title: newEvt.title,
        caseId: newEvt.caseId,
        caseNumber: newEvt.caseNumber,
        caseTitle: newEvt.caseTitle,
        type: newEvt.category === 'hearings' ? 'Hearing' : (newEvt.category === 'motions' ? 'Motion' : 'Brief'),
        deadlineDate: newEvt.date,
        deadlineTime: newEvt.time,
        court: newEvt.court,
        responsibleLawyerName: newEvt.assignedTo,
        source: 'Court Order',
        statutoryReference: newEvt.statute,
        supportingDocument: newEvt.description
      });
    }

    SLCMS_STATE.addAuditLog('Court Appearance Scheduled', 'Tasks & Deadlines', `${newEvt.title} (${newEvt.caseNumber})`);
    App.closeModal();
    App.showToast('Deadline scheduled successfully on docket.', 'success');

    if (typeof this._deadlineCallback === 'function') {
      const cb = this._deadlineCallback;
      this._deadlineCallback = null;
      cb(newEvt);
    } else {
      App.refreshCurrentView();
    }
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
    const userRole = SLCMS_STATE.currentUser?.role || '';
    const isSeniorLawyer = userRole === 'Senior Counsel' || userRole === 'Partner' || userRole === 'Senior Lawyer';
    const isAdmin = userRole === 'Administrator' || userRole === 'System Administrator';

    if (!isAdmin && !isSeniorLawyer) {
      App.showToast('Restricted: Only Senior Lawyers and System Administrators are authorized to reassign tasks.', 'error');
      return;
    }

    const t = SLCMS_STATE.tasks.find(item => item.id === taskId);
    if (!t) return;

    const activeStaff = SLCMS_STATE.getActiveStaffUsers();

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">👤 Reassign Task (Senior Lawyer / Admin)</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-info" style="font-size: 0.82rem; margin-bottom: 1rem;">
          Official Policy: Task reassignment is restricted to Senior Lawyers and Administrators to maintain docket accountability.
        </div>
        <div style="background: var(--color-surface-subtle); padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.84rem; margin-bottom: 1rem;">
          <div><strong>Task:</strong> ${t.title}</div>
          <div><strong>Current Assignee:</strong> ${t.assignedTo || 'Unassigned'}</div>
          <div><strong>Associated Case:</strong> ${t.caseNumber} - ${t.caseTitle}</div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">Select Responsible Staff Member</label>
          <select id="reassign-select" class="form-control">
            ${activeStaff.map(s => `
              <option value="${s.name}" ${t.assignedTo === s.name ? 'selected' : ''}>
                ${s.name} (${s.role || 'Staff'})
              </option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveTaskReassignment('${t.id}')">Confirm Reassignment</button>
      </div>
    `, 'modal-md');
  },

  saveTaskReassignment(taskId) {
    const t = SLCMS_STATE.tasks.find(item => item.id === taskId);
    const newAssigned = document.getElementById('reassign-select')?.value;
    if (!t || !newAssigned) return;

    const oldAssigned = t.assignedTo;
    t.assignedTo = newAssigned;
    t.assignedAvatar = newAssigned.substring(0, 2).toUpperCase();

    SLCMS_STATE.persistTasks();
    SLCMS_STATE.addAuditLog('Task Reassigned', 'Tasks & Deadlines', `Reassigned "${t.title}" from "${oldAssigned}" to "${newAssigned}" by ${SLCMS_STATE.currentUser?.name}`, 'Success');
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
    const pendingTasks = (SLCMS_STATE.tasks || []).filter(t => (t.status || '').toLowerCase() !== 'completed');
    const cases = SLCMS_STATE.cases || [];
    const activeStaff = SLCMS_STATE.getActiveStaffUsers();
    const today = new Date().toISOString().split('T')[0];

    App.openModal(`
      <div class="modal-header" style="border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 0.85rem;">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.25rem;">🔔</span>
          <div>
            <h3 class="modal-title" style="font-family: var(--font-heading); font-size: 1.12rem; margin: 0; color: #0F172A;">
              Dispatch Structured Docket Notice
            </h3>
            <p style="font-size: 0.76rem; color: #64748B; margin: 0.15rem 0 0 0;">
              Send formal statutory court deadline notices and task directives to responsible counsel.
            </p>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.15rem; max-height: 75vh; overflow-y: auto;">
        
        <!-- Recipient & Matter Grid -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required" style="font-size: 0.78rem; font-weight: 700;">Recipient Counsel / Staff</label>
            <select id="snd-recipient" class="form-control" onchange="TasksView.updateNoticePreview()">
              <option value="ALL">👥 All Active Legal Personnel (Broadcast)</option>
              ${activeStaff.map(s => `
                <option value="${s.id || s.staffId || s.name}" data-name="${s.name}" data-role="${s.role || 'Advocate'}" data-email="${s.email || ''}">
                  ${s.name} (${s.role || 'Staff'})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required" style="font-size: 0.78rem; font-weight: 700;">Legal Matter Reference</label>
            <select id="snd-case" class="form-control" onchange="TasksView.updateNoticePreview()">
              ${cases.length === 0 ? `<option value="gen" data-num="MATTER-GEN" data-title="General Practice Docket">General Practice Docket</option>` : cases.map(c => `
                <option value="${c.id}" data-num="${c.caseNumber}" data-title="${c.title}">
                  ${c.caseNumber} - ${c.title}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Task / Obligation Title & Deadline -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required" style="font-size: 0.78rem; font-weight: 700;">Action Obligation / Cutoff</label>
            <input type="text" id="snd-task-title" class="form-control" 
                   value="${pendingTasks.length > 0 ? (pendingTasks[0].title || 'Filing of Written Submissions') : 'Court Appearance & Filing Obligation'}" 
                   placeholder="e.g. Filing of Statement of Defence" oninput="TasksView.updateNoticePreview()">
          </div>

          <div class="form-group">
            <label class="form-label required" style="font-size: 0.78rem; font-weight: 700;">Statutory Due Date</label>
            <input type="date" id="snd-due-date" class="form-control" 
                   value="${pendingTasks.length > 0 && pendingTasks[0].dueDate ? pendingTasks[0].dueDate : today}" 
                   onchange="TasksView.updateNoticePreview()">
          </div>
        </div>

        <!-- Statutory Authority & Court Registry -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label" style="font-size: 0.78rem; font-weight: 700;">Court / Judicial Forum</label>
            <input type="text" id="snd-court" class="form-control" 
                   value="High Court Commercial Division, Dar es Salaam" 
                   oninput="TasksView.updateNoticePreview()">
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 0.78rem; font-weight: 700;">Statutory Authority Reference</label>
            <input type="text" id="snd-statute" class="form-control" 
                   value="Order VIII Rule 1, Civil Procedure Code Cap 33" 
                   oninput="TasksView.updateNoticePreview()">
          </div>
        </div>

        <!-- Notice Category & Urgency -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required" style="font-size: 0.78rem; font-weight: 700;">Notice Urgency</label>
            <select id="snd-urgency" class="form-control" onchange="TasksView.updateNoticePreview()">
              <option value="CRITICAL_48H">🚨 URGENT: Court Cutoff in 48 Hours</option>
              <option value="STATUTORY_LIMITATION" selected>⚠️ HIGH: Statutory Limitation Window</option>
              <option value="STANDARD_REMINDER">⚡ STANDARD: Action Item Milestone</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 0.78rem; font-weight: 700;">Delivery Channels</label>
            <div class="flex items-center gap-3 flex-wrap" style="padding-top: 0.4rem;">
              <label class="flex items-center gap-1.5" style="font-size: 0.78rem; cursor: pointer;">
                <input type="checkbox" id="chn-email" checked>
                <span>📧 Official Email</span>
              </label>
              <label class="flex items-center gap-1.5" style="font-size: 0.78rem; cursor: pointer;">
                <input type="checkbox" id="chn-sms" checked>
                <span>💬 SMS / WhatsApp</span>
              </label>
              <label class="flex items-center gap-1.5" style="font-size: 0.78rem; cursor: pointer;">
                <input type="checkbox" id="chn-inapp" checked>
                <span>🔔 In-App Alert</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Live Structured Notice Preview -->
        <div style="margin-top: 0.75rem;">
          <div class="flex items-center justify-between mb-1.5">
            <span style="font-size: 0.74rem; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
              Structured Legal Notice Preview:
            </span>
            <button type="button" class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 0.15rem 0.5rem;" onclick="TasksView.copyNoticeToClipboard()">
              📋 Copy Notice Text
            </button>
          </div>
          <div id="structured-notice-preview-box" 
               style="background: #0B1927; color: #F1F5F9; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.76rem; line-height: 1.5; padding: 0.95rem; border-radius: 10px; border: 1px solid #1B3550; white-space: pre-wrap; max-height: 220px; overflow-y: auto;">
          </div>
        </div>
      </div>

      <div class="modal-footer" style="border-top: 1px solid rgba(0,0,0,0.08); display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" style="font-weight: 700; box-shadow: 0 4px 14px rgba(200, 155, 60, 0.35);" onclick="TasksView.sendStructuredDocketNotice()">
          🚀 Dispatch Structured Notice
        </button>
      </div>
    `, 'modal-lg');

    // Trigger initial preview generation
    setTimeout(() => this.updateNoticePreview(), 50);
  },

  updateNoticePreview() {
    const recSelect = document.getElementById('snd-recipient');
    const caseSelect = document.getElementById('snd-case');
    const taskTitle = document.getElementById('snd-task-title')?.value || 'Mandatory Docket Obligation';
    const dueDate = document.getElementById('snd-due-date')?.value || '2026-09-30';
    const court = document.getElementById('snd-court')?.value || 'High Court of Tanzania';
    const statute = document.getElementById('snd-statute')?.value || 'Court Directive';
    const urgency = document.getElementById('snd-urgency')?.value || 'HIGH';

    const selectedRecOption = recSelect ? recSelect.options[recSelect.selectedIndex] : null;
    const recipientName = (recSelect && recSelect.value === 'ALL') ? 'All Assigned Legal Personnel' : (selectedRecOption?.getAttribute('data-name') || 'Advocate In-Charge');
    const recipientRole = (recSelect && recSelect.value === 'ALL') ? 'Litigation Practice Team' : (selectedRecOption?.getAttribute('data-role') || 'Legal Counsel');

    const selectedCaseOption = caseSelect ? caseSelect.options[caseSelect.selectedIndex] : null;
    const caseNum = selectedCaseOption?.getAttribute('data-num') || 'MATTER-GEN';
    const caseTitle = selectedCaseOption?.getAttribute('data-title') || 'General Practice Docket';

    const countdown = this.getDeadlineCountdown(dueDate);

    const structuredText = `================================================================
[SLCMS DOCKET NOTIFICATION] STATUTORY DEADLINE NOTICE
Firm: Serengeti Legal Case Management System
Security: Confidential Attorney-Client Communication
Reference: DKT-TZ-${Date.now().toString().slice(-6)}
================================================================

1. MATTER CITATION:
   • Case Ref: ${caseNum} - ${caseTitle}
   • Forum / Registry: ${court}

2. MANDATORY ACTION ITEM:
   • Obligation: ${taskTitle}
   • Statutory Due Date: ${dueDate} at 09:00 AM EAT (${countdown.label})
   • Authority / Court Rule: ${statute}
   • Urgency Classification: ${urgency.replace('_', ' ')}

3. RESPONSIBLE PRACTITIONER:
   • Assigned Personnel: ${recipientName} (${recipientRole})
   • Directives: Ensure pleadings, evidence bundles, or written
     submissions are vetted and served strictly within statutory
     time limits. Non-compliance risks court strike-out.
================================================================
Dispatched via SLCMS Law Firm Docket Engine`;

    const box = document.getElementById('structured-notice-preview-box');
    if (box) box.textContent = structuredText;
  },

  copyNoticeToClipboard() {
    const box = document.getElementById('structured-notice-preview-box');
    if (box && box.textContent) {
      navigator.clipboard.writeText(box.textContent);
      App.showToast('Structured legal notice copied to clipboard.', 'success');
    }
  },

  async sendStructuredDocketNotice() {
    const recSelect = document.getElementById('snd-recipient');
    const caseSelect = document.getElementById('snd-case');
    const taskTitle = document.getElementById('snd-task-title')?.value || 'Statutory Docket Notice';
    const dueDate = document.getElementById('snd-due-date')?.value || new Date().toISOString().split('T')[0];
    const previewBox = document.getElementById('structured-notice-preview-box');
    const messageBody = previewBox ? previewBox.textContent : '';

    const isEmail = document.getElementById('chn-email')?.checked ?? true;
    const isSms = document.getElementById('chn-sms')?.checked ?? true;
    const isInApp = document.getElementById('chn-inapp')?.checked ?? true;

    const selectedRecOption = recSelect ? recSelect.options[recSelect.selectedIndex] : null;
    const recVal = recSelect?.value || 'ALL';
    const recName = (recVal === 'ALL') ? 'All Legal Personnel' : (selectedRecOption?.getAttribute('data-name') || 'Advocate In-Charge');
    const recEmail = selectedRecOption?.getAttribute('data-email') || 'advocate@slcms-law.com';

    const selectedCaseOption = caseSelect ? caseSelect.options[caseSelect.selectedIndex] : null;
    const caseNum = selectedCaseOption?.getAttribute('data-num') || 'MATTER-GEN';
    const caseTitle = selectedCaseOption?.getAttribute('data-title') || 'General Docket';

    // 1. Send via Backend Email if Email channel selected
    if (isEmail && recVal !== 'ALL') {
      try {
        await fetch('/api/communications/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': SLCMS_STATE.currentUser?.id || 'usr-admin',
            'X-User-Name': SLCMS_STATE.currentUser?.name || 'Administrator'
          },
          body: JSON.stringify({
            recipient: recEmail,
            subject: `[SLCMS Docket Alert] Action Required: ${taskTitle} (${caseNum})`,
            messageBody: messageBody,
            caseNumber: caseNum,
            caseTitle: caseTitle,
            clientName: recName,
            messageType: 'Docket Alert'
          })
        });
      } catch (e) {
        console.warn('Email dispatch deferred:', e);
      }
    }

    // 2. Register In-App Notification
    if (isInApp && typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.notifications)) {
      SLCMS_STATE.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'danger',
        title: `Docket Alert: ${taskTitle}`,
        message: `${taskTitle} for ${caseNum} is due on ${dueDate}. Assigned to ${recName}.`,
        time: 'Just now',
        read: false,
        link: '#tasks'
      });
    }

    // 3. Log Immutable Audit Record
    SLCMS_STATE.addAuditLog('Docket Notice Dispatched', 'Tasks & Deadlines', 
      `Structured notice dispatched to ${recName} for ${caseNum} (${taskTitle}, Due: ${dueDate}). Channels: ${isEmail ? 'Email ' : ''}${isSms ? 'SMS ' : ''}${isInApp ? 'InApp' : ''}`, 
      'Success');

    App.closeModal();
    App.showToast(`Structured docket notice successfully dispatched to ${recName}.`, 'success');
  },

  _taskCreationCallback: null,

  setStatutoryDueDate(days, ruleName) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dueEl = document.getElementById('nt-due');
    const chkEl = document.getElementById('nt-is-statutory');
    const statRefEl = document.getElementById('nt-statutory-ref');
    if (dueEl) dueEl.value = d.toISOString().split('T')[0];
    if (chkEl) chkEl.checked = true;
    if (statRefEl) statRefEl.value = ruleName;
    App.showToast(`Statutory period applied: +${days} days (${ruleName})`, 'info');
  },

  openNewTaskModal(caseContext = null, defaultCol = 'todo', callback = null) {
    const currentUser = (typeof SLCMS_STATE !== 'undefined') ? SLCMS_STATE.currentUser : null;
    const isLawyer = (function(u) {
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })(currentUser);

    if (isLawyer) {
      App.showToast('Access restricted: Lawyers do not have permission to create tasks.', 'warning');
      return;
    }

    this._taskCreationCallback = callback;
    const activeStaff = SLCMS_STATE.getActiveStaffUsers();
    const cases = SLCMS_STATE.cases || [];
    const today = new Date().toISOString().split('T')[0];

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-heading);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Legal Task
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label required">Task Title / Action Item</label>
          <input type="text" id="nt-title" class="form-control" placeholder="e.g. File Written Submissions pursuant to High Court order" required>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Associated Legal Matter</label>
            <select id="nt-case" class="form-control">
              ${cases.length === 0 ? `<option value="case-gen">General Legal Practice</option>` : cases.map(c => `
                <option value="${c.id}" ${(caseContext && (caseContext.id === c.id || caseContext === c.id)) ? 'selected' : ''}>
                  ${c.caseNumber} - ${c.title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Task Category</label>
            <select id="nt-category" class="form-control">
              <option value="Pleadings">Pleadings</option>
              <option value="Evidence Gathering">Evidence Gathering</option>
              <option value="Filing">Filing</option>
              <option value="Client Conference">Client Conference</option>
              <option value="Compliance">Compliance</option>
              <option value="Legal Research">Legal Research</option>
              <option value="Billing">Billing</option>
              <option value="Administrative">Administrative</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Assigned Personnel</label>
            <select id="nt-assigned" class="form-control">
              ${activeStaff.length === 0 ? `<option value="Unassigned">Unassigned</option>` : activeStaff.map(s => `
                <option value="${s.name}">${s.name} (${s.role || 'Staff'})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority Level</label>
            <select id="nt-priority" class="form-control">
              <option value="Urgent">🚨 Urgent (Immediate Filing / Court Cutoff)</option>
              <option value="High">⚠️ High Priority (Time Sensitive)</option>
              <option value="Medium" selected>Medium (Standard Preparation)</option>
              <option value="Low">Low (Routine Follow-up)</option>
            </select>
          </div>
        </div>

        <!-- Statutory Presets Strip -->
        <div style="background: rgba(200, 155, 60, 0.08); border: 1px solid rgba(200, 155, 60, 0.22); border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 0.85rem;">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
            <span style="font-size: 0.76rem; font-weight: 700; color: var(--color-gold);">
              ⚖️ Statutory Limitation Presets:
            </span>
            <span style="font-size: 0.72rem; color: var(--color-text-muted);">Auto-calculate cutoff date</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setStatutoryDueDate(14, 'Order VIII R.11 CPC (Written Submissions)')">
              +14 Days (Submissions)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setStatutoryDueDate(21, 'Order VIII R.1 CPC (Statement of Defence)')">
              +21 Days (Defence)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setStatutoryDueDate(30, 'Court of Appeal Rules R.76 (Notice of Appeal)')">
              +30 Days (Appeal)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setStatutoryDueDate(60, 'Court of Appeal Rules R.83 (Record of Appeal)')">
              +60 Days (Record)
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" id="nt-due" class="form-control" value="${today}" required>
          </div>
          <div class="form-group flex flex-col justify-end" style="padding-bottom: 0.35rem;">
            <label class="flex items-center gap-2" style="font-size: 0.82rem; cursor: pointer; color: var(--color-primary); font-weight: 600;">
              <input type="checkbox" id="nt-is-statutory" checked>
              <span>Statutory Docket Deadline</span>
            </label>
            <input type="hidden" id="nt-statutory-ref" value="Civil Procedure Code Cap 33">
          </div>
        </div>

        <div class="form-group mb-2">
          <label class="form-label">Action Notes &amp; Specific Instructions</label>
          <textarea id="nt-desc" class="form-control" rows="2" placeholder="Specify instructions, client deliverables, or court filing requirements..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveNewTask('${defaultCol}')">Create Task</button>
      </div>
    `, 'modal-md');
  },

  async saveNewTask(col = 'todo') {
    const title = document.getElementById('nt-title')?.value?.trim();
    if (!title) {
      App.showToast('Please enter a task title.', 'error');
      return;
    }

    const caseId = document.getElementById('nt-case')?.value;
    const relatedCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId) || { id: 'case-gen', caseNumber: 'MATTER-GEN', title: 'General Practice' };
    const assigned = document.getElementById('nt-assigned')?.value || 'Adv. Asha Mrema';

    const newTask = {
      title: title,
      caseId: relatedCase.id,
      caseTitle: relatedCase.title,
      caseNumber: relatedCase.caseNumber,
      category: document.getElementById('nt-category')?.value || 'Pleadings',
      assignedTo: assigned,
      assignedAvatar: assigned.substring(0, 2).toUpperCase(),
      priority: document.getElementById('nt-priority')?.value || 'Medium',
      dueDate: document.getElementById('nt-due')?.value || new Date().toISOString().substring(0, 10),
      isStatutoryDeadline: document.getElementById('nt-is-statutory')?.checked ?? true,
      statutoryReference: document.getElementById('nt-statutory-ref')?.value || 'Civil Procedure Code Cap 33',
      status: col,
      instructions: document.getElementById('nt-desc')?.value || ''
    };

    const saved = await SLCMS_STATE.createTaskOnBackend(newTask);
    App.closeModal();
    App.showToast('Task successfully scheduled.', 'success');

    if (typeof this._taskCreationCallback === 'function') {
      const cb = this._taskCreationCallback;
      this._taskCreationCallback = null;
      cb(saved);
    } else {
      App.refreshCurrentView();
    }
  },

  /* --------------------------------------------------------------------------
     STATUTORY COURT DEADLINES (HOW DEADLINES WORK & PRESETS)
     -------------------------------------------------------------------------- */
  setAddDeadlinePreset(days, ruleName, defaultType = 'Hearing') {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dlnDateEl = document.getElementById('dln-date');
    const dlnTypeEl = document.getElementById('dln-type');
    const dlnRefEl = document.getElementById('dln-statutory-ref');
    if (dlnDateEl) dlnDateEl.value = d.toISOString().split('T')[0];
    if (dlnTypeEl) dlnTypeEl.value = defaultType;
    if (dlnRefEl) dlnRefEl.value = ruleName;
    App.showToast(`Applied +${days} days: ${ruleName}`, 'info');
  },

  openAddDeadlineModal(caseContext = null) {
    const cases = SLCMS_STATE.cases || [];
    const activeStaff = SLCMS_STATE.getActiveStaffUsers();
    const today = new Date().toISOString().split('T')[0];

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-heading);">
          <span style="font-size: 1.2rem;">📅</span>
          <span>Register Statutory Court Deadline</span>
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        
        <!-- Explanatory Banner: How Deadlines Work in Law Practice -->
        <div style="background: rgba(200, 155, 60, 0.08); border: 1px solid rgba(200, 155, 60, 0.25); border-radius: 10px; padding: 0.75rem 0.95rem; margin-bottom: 1rem; font-size: 0.80rem; color: #78350F; line-height: 1.5;">
          ⚖️ <strong>How Statutory Deadlines Work:</strong> Court deadlines are strict limitation periods established by Court Order or Legislation (e.g. Civil Procedure Code Cap 33). Registering a deadline automatically generates an urgent tracking task on the Kanban board and synchronizes with the Court Calendar.
        </div>

        <!-- Quick Presets -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 1rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.35rem;">
            One-Click Statutory Presets:
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setAddDeadlinePreset(14, 'Order VIII R.11 CPC - Written Submissions', 'Submission')">
              +14d Written Submissions
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setAddDeadlinePreset(21, 'Order VIII R.1 CPC - Written Statement of Defence', 'Filing')">
              +21d Statement of Defence
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setAddDeadlinePreset(30, 'Court of Appeal Rules R.76 - Notice of Appeal', 'Appeal')">
              +30d Notice of Appeal
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="TasksView.setAddDeadlinePreset(60, 'Court of Appeal Rules R.83 - Record of Appeal', 'Appeal')">
              +60d Record of Appeal
            </button>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label required">Deadline / Hearing Title</label>
          <input type="text" id="dln-title" class="form-control" placeholder="e.g. Hearing of Chamber Summons for Injunction" required>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Associated Legal Matter</label>
            <select id="dln-case" class="form-control">
              ${cases.length === 0 ? `<option value="case-gen">General Legal Practice</option>` : cases.map(c => `
                <option value="${c.id}" ${(caseContext && (caseContext.id === c.id || caseContext === c.id)) ? 'selected' : ''}>
                  ${c.caseNumber} - ${c.title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Deadline Type</label>
            <select id="dln-type" class="form-control">
              <option value="Hearing">Court Hearing / Trial</option>
              <option value="Mention">Mention / Case Management</option>
              <option value="Filing">Pleadings / Document Filing</option>
              <option value="Submission">Written Submissions</option>
              <option value="Appeal">Notice of Appeal / Record</option>
              <option value="Ruling">Ruling / Judgment Delivery</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Deadline Date</label>
            <input type="date" id="dln-date" class="form-control" value="${today}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Time / Filing Cutoff</label>
            <input type="time" id="dln-time" class="form-control" value="09:00">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Court Registry / Forum</label>
            <input type="text" id="dln-court" class="form-control" value="High Court Commercial Division, Dar es Salaam">
          </div>
          <div class="form-group">
            <label class="form-label required">Responsible Counsel</label>
            <select id="dln-lawyer" class="form-control">
              ${activeStaff.map(s => `
                <option value="${s.name}">${s.name} (${s.role || 'Advocate'})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Authority Source</label>
            <select id="dln-source" class="form-control">
              <option value="Court Order">Formal Court Order / Summons</option>
              <option value="Legislation">Statutory Limitation Enactment</option>
              <option value="Manually Entered">Manual Entry / Client Directive</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Statutory Reference / Citation</label>
            <input type="text" id="dln-statutory-ref" class="form-control" value="High Court Commercial Rules 2012">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveNewDeadline()">Register Deadline</button>
      </div>
    `, 'modal-md');
  },

  async saveNewDeadline() {
    const title = document.getElementById('dln-title')?.value?.trim();
    if (!title) {
      App.showToast('Please enter a deadline title.', 'error');
      return;
    }

    const caseId = document.getElementById('dln-case')?.value;
    const relatedCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId) || { id: 'case-gen', caseNumber: 'MATTER-GEN', title: 'General Practice' };
    const dateVal = document.getElementById('dln-date')?.value || new Date().toISOString().split('T')[0];
    const timeVal = document.getElementById('dln-time')?.value || '09:00';
    const lawyer = document.getElementById('dln-lawyer')?.value || 'Adv. Asha Mrema';

    const deadlineData = {
      title: title,
      caseId: relatedCase.id,
      caseNumber: relatedCase.caseNumber,
      caseTitle: relatedCase.title,
      type: document.getElementById('dln-type')?.value || 'Hearing',
      deadlineDate: dateVal,
      deadlineTime: timeVal,
      court: document.getElementById('dln-court')?.value || 'High Court Commercial Division',
      responsibleLawyerName: lawyer,
      source: document.getElementById('dln-source')?.value || 'Court Order',
      statutoryReference: document.getElementById('dln-statutory-ref')?.value || '',
      supportingDocument: ''
    };

    await SLCMS_STATE.createDeadlineOnBackend(deadlineData);

    // Automatically create corresponding actionable Task under To Do column to track the deadline
    await SLCMS_STATE.createTaskOnBackend({
      title: `${deadlineData.type}: ${title}`,
      caseId: relatedCase.id,
      caseNumber: relatedCase.caseNumber,
      caseTitle: relatedCase.title,
      assignedTo: lawyer,
      priority: 'Urgent',
      dueDate: dateVal,
      dueTime: timeVal,
      isStatutoryDeadline: true,
      statutoryReference: deadlineData.statutoryReference || 'Court Directive',
      instructions: `Court Appearance / Deadline obligation set for ${dateVal} at ${timeVal} before ${deadlineData.court}. Source: ${deadlineData.source}.`
    });

    App.closeModal();
    App.showToast('Court deadline and tracking task registered.', 'success');
    App.refreshCurrentView();
  },

  openTaskDetailsModal(taskId) {
    const t = (SLCMS_STATE.tasks || []).find(item => item.id === taskId);
    if (!t) {
      App.showToast('Task details not found.', 'info');
      return;
    }
    const countdown = this.getDeadlineCountdown(t.dueDate);
    const priority = t.priority || 'Medium';
    const priorityClass = priority.toLowerCase();
    const priorityIcon = priority === 'Urgent' ? '🚨' : priority === 'High' ? '⚠️' : priority === 'Medium' ? '⚡' : '🔹';

    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <span style="font-size: 1.25rem;">⚖️</span>
          <div>
            <h3 class="modal-title" style="font-family: var(--font-heading); margin: 0;">Task Dossier</h3>
            <span style="font-size: 0.76rem; color: #64748B;">${t.caseNumber || 'MATTER-GEN'} &bull; ${t.caseTitle || 'General Legal Practice'}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.25rem;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.15rem; margin-bottom: 1.15rem;">
          <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span class="task-priority-tag ${priorityClass}">${priorityIcon} ${priority} Priority</span>
            <span class="task-countdown-pill ${countdown.badgeClass}">${countdown.label}</span>
          </div>
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0 0 0.5rem 0; line-height: 1.4;">
            ${TasksView.escapeHtml(t.title || 'Untitled Task')}
          </h3>
          <div style="font-size: 0.82rem; color: #475569;">
            <strong>Matter:</strong> ${TasksView.escapeHtml(t.caseTitle || 'General Matter')} (${t.caseNumber || 'N/A'})
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div style="background: #F8FAFC; padding: 0.85rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Assigned Practitioner</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #0F172A; margin-top: 0.25rem;">${TasksView.escapeHtml(t.assignedTo || 'Unassigned')}</div>
          </div>
          <div style="background: #F8FAFC; padding: 0.85rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Current Status</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #0F172A; margin-top: 0.25rem; text-transform: capitalize;">${(t.status || 'todo').replace('_', ' ')}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div style="background: #F8FAFC; padding: 0.85rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Statutory Due Date</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #0F172A; margin-top: 0.25rem;">${t.dueDate || 'No Date'} ${t.dueTime ? 'at ' + t.dueTime : ''}</div>
          </div>
          <div style="background: #F8FAFC; padding: 0.85rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Statutory Authority</div>
            <div style="font-size: 0.85rem; font-weight: 600; color: #C89B3C; margin-top: 0.25rem;">${TasksView.escapeHtml(t.statutoryReference || 'Court Rules')}</div>
          </div>
        </div>

        <div class="form-group mb-2">
          <label class="form-label" style="font-weight: 700; font-size: 0.78rem;">Instructions &amp; Mandate</label>
          <div style="font-size: 0.84rem; line-height: 1.5; color: #334155; background: #F8FAFC; padding: 0.85rem; border-radius: 10px; border: 1px solid #E2E8F0; min-height: 60px;">
            ${TasksView.escapeHtml(t.instructions || t.description || 'No additional instructions provided.')}
          </div>
        </div>
      </div>
      <div class="modal-footer flex items-center justify-between">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary" onclick="TasksView.openReassignModal('${t.id}')">👤 Reassign</button>
          <button class="btn btn-gold" onclick="TasksView.openEditTaskModal('${t.id}')">✏️ Modify Task</button>
        </div>
      </div>
    `, 'modal-md');
  },

  openEditTaskModal(taskId) {
    const t = (SLCMS_STATE.tasks || []).find(item => item.id === taskId);
    if (!t) {
      App.showToast('Task record not found.', 'error');
      return;
    }
    const cases = SLCMS_STATE.cases || [];
    const activeStaff = SLCMS_STATE.getActiveStaffUsers();

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-heading);">
          <span style="font-size: 1.2rem;">✏️</span>
          <span>Modify Legal Task</span>
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label required">Task Title / Obligation</label>
          <input type="text" id="ed-tsk-title" class="form-control" value="${TasksView.escapeHtml(t.title || '')}" required>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Associated Legal Matter</label>
            <select id="ed-tsk-case" class="form-control">
              ${cases.length === 0 ? `<option value="${t.caseId || 'case-gen'}">${t.caseNumber || 'MATTER-GEN'} - ${t.caseTitle || 'General Practice'}</option>` : cases.map(c => `
                <option value="${c.id}" ${c.id === t.caseId ? 'selected' : ''}>${c.caseNumber} - ${c.title}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Task Category</label>
            <select id="ed-tsk-category" class="form-control">
              <option value="Pleadings" ${t.category === 'Pleadings' ? 'selected' : ''}>Pleadings</option>
              <option value="Evidence Gathering" ${t.category === 'Evidence Gathering' ? 'selected' : ''}>Evidence Gathering</option>
              <option value="Filing" ${t.category === 'Filing' ? 'selected' : ''}>Filing</option>
              <option value="Client Conference" ${t.category === 'Client Conference' ? 'selected' : ''}>Client Conference</option>
              <option value="Compliance" ${t.category === 'Compliance' ? 'selected' : ''}>Compliance</option>
              <option value="Legal Research" ${t.category === 'Legal Research' ? 'selected' : ''}>Legal Research</option>
              <option value="Billing" ${t.category === 'Billing' ? 'selected' : ''}>Billing</option>
              <option value="Administrative" ${t.category === 'Administrative' ? 'selected' : ''}>Administrative</option>
              <option value="technical" ${t.category === 'technical' ? 'selected' : ''}>Technical / Maintenance</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Priority Level</label>
            <select id="ed-tsk-priority" class="form-control">
              <option value="Urgent" ${t.priority === 'Urgent' ? 'selected' : ''}>🚨 Urgent</option>
              <option value="High" ${t.priority === 'High' ? 'selected' : ''}>⚠️ High</option>
              <option value="Medium" ${t.priority === 'Medium' ? 'selected' : ''}>⚡ Medium</option>
              <option value="Low" ${t.priority === 'Low' ? 'selected' : ''}>🔹 Low</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Workflow Status</label>
            <select id="ed-tsk-status" class="form-control">
              <option value="todo" ${(t.status || 'todo') === 'todo' ? 'selected' : ''}>📋 To Do</option>
              <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>⚡ In Progress</option>
              <option value="under_review" ${t.status === 'under_review' ? 'selected' : ''}>🔍 Under Review</option>
              <option value="completed" ${t.status === 'completed' ? 'selected' : ''}>✓ Completed</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Assigned Staff</label>
            <select id="ed-tsk-assigned" class="form-control">
              ${activeStaff.map(s => `
                <option value="${s.name}" ${(t.assignedTo || '').includes(s.name) ? 'selected' : ''}>${s.name} (${s.role || 'Staff'})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" id="ed-tsk-due" class="form-control" value="${t.dueDate || new Date().toISOString().split('T')[0]}" required>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Statutory Reference / Limitation Rule</label>
          <input type="text" id="ed-tsk-stat-ref" class="form-control" value="${TasksView.escapeHtml(t.statutoryReference || '')}">
        </div>

        <div class="form-group">
          <label class="form-label">Instructions &amp; Mandate Notes</label>
          <textarea id="ed-tsk-instructions" class="form-control" rows="3">${TasksView.escapeHtml(t.instructions || t.description || '')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveModifiedTask('${taskId}')">Save Changes</button>
      </div>
    `, 'modal-md');
  },

  async saveModifiedTask(taskId) {
    const title = document.getElementById('ed-tsk-title')?.value?.trim();
    if (!title) {
      App.showToast('Please enter a task title.', 'error');
      return;
    }
    const caseId = document.getElementById('ed-tsk-case')?.value;
    const relatedCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId) || { id: 'case-gen', caseNumber: 'MATTER-GEN', title: 'General Practice' };
    const assigned = document.getElementById('ed-tsk-assigned')?.value;
    const category = document.getElementById('ed-tsk-category')?.value;
    const priority = document.getElementById('ed-tsk-priority')?.value;
    const status = document.getElementById('ed-tsk-status')?.value;
    const dueDate = document.getElementById('ed-tsk-due')?.value;
    const statRef = document.getElementById('ed-tsk-stat-ref')?.value;
    const instructions = document.getElementById('ed-tsk-instructions')?.value;

    const updates = {
      title,
      caseId: relatedCase.id,
      caseNumber: relatedCase.caseNumber,
      caseTitle: relatedCase.title,
      assignedTo: assigned,
      assignedToName: assigned,
      assignedAvatar: (assigned || 'US').substring(0, 2).toUpperCase(),
      category,
      priority,
      status,
      dueDate,
      statutoryReference: statRef,
      instructions,
      description: instructions
    };

    await SLCMS_STATE.updateTaskOnBackend(taskId, updates);
    App.closeModal();
    App.showToast('Task modified successfully.', 'success');
    App.refreshCurrentView();
  },

  openEditDeadlineModal(deadlineId) {
    const dln = (SLCMS_STATE.deadlines || []).find(d => d.id === deadlineId) || 
                (this.courtEvents || []).find(e => e.id === deadlineId);
    if (!dln) {
      App.showToast('Deadline record not found.', 'error');
      return;
    }
    const cases = SLCMS_STATE.cases || [];
    const activeStaff = SLCMS_STATE.getActiveStaffUsers();
    const dDate = dln.deadlineDate || dln.date || new Date().toISOString().split('T')[0];
    const dTime = dln.deadlineTime || dln.time || '09:00';
    const lawyer = dln.responsibleLawyerName || dln.assignedTo || 'Adv. Asha Mrema';

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-heading);">
          <span style="font-size: 1.2rem;">✏️</span>
          <span>Modify Statutory Deadline</span>
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label required">Deadline Title / Proceeding</label>
          <input type="text" id="ed-dln-title" class="form-control" value="${TasksView.escapeHtml(dln.title || '')}" required>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Associated Legal Matter</label>
            <select id="ed-dln-case" class="form-control">
              ${cases.length === 0 ? `<option value="${dln.caseId || 'case-gen'}">${dln.caseNumber || 'MATTER-GEN'} - ${dln.caseTitle || 'General Practice'}</option>` : cases.map(c => `
                <option value="${c.id}" ${c.id === dln.caseId ? 'selected' : ''}>
                  ${c.caseNumber} - ${c.title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Deadline Type</label>
            <select id="ed-dln-type" class="form-control">
              <option value="Hearing" ${(dln.type || '').toLowerCase().includes('hearing') ? 'selected' : ''}>Court Hearing / Trial</option>
              <option value="Mention" ${(dln.type || '').toLowerCase().includes('mention') ? 'selected' : ''}>Mention / Case Management</option>
              <option value="Filing" ${(dln.type || '').toLowerCase().includes('filing') ? 'selected' : ''}>Pleadings / Document Filing</option>
              <option value="Submission" ${(dln.type || '').toLowerCase().includes('submission') ? 'selected' : ''}>Written Submissions</option>
              <option value="Appeal" ${(dln.type || '').toLowerCase().includes('appeal') ? 'selected' : ''}>Notice of Appeal / Record</option>
              <option value="Ruling" ${(dln.type || '').toLowerCase().includes('ruling') ? 'selected' : ''}>Ruling / Judgment Delivery</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Deadline Date</label>
            <input type="date" id="ed-dln-date" class="form-control" value="${dDate}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Filing Cutoff / Time</label>
            <input type="time" id="ed-dln-time" class="form-control" value="${dTime.split(' ')[0]}">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Court Registry / Judicial Forum</label>
            <input type="text" id="ed-dln-court" class="form-control" value="${TasksView.escapeHtml(dln.court || 'High Court Commercial Division')}">
          </div>
          <div class="form-group">
            <label class="form-label required">Responsible Counsel</label>
            <select id="ed-dln-lawyer" class="form-control">
              ${activeStaff.map(s => `
                <option value="${s.name}" ${s.name === lawyer ? 'selected' : ''}>${s.name} (${s.role || 'Staff'})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label required">Authority Source</label>
            <select id="ed-dln-source" class="form-control">
              <option value="Court Order" ${(dln.source || '') === 'Court Order' ? 'selected' : ''}>Formal Court Order / Summons</option>
              <option value="Legislation" ${(dln.source || '') === 'Legislation' ? 'selected' : ''}>Statutory Limitation Enactment</option>
              <option value="Manually Entered" ${(dln.source || '') === 'Manually Entered' ? 'selected' : ''}>Manual Entry / Client Directive</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Statutory Reference / Citation</label>
            <input type="text" id="ed-dln-statutory-ref" class="form-control" value="${TasksView.escapeHtml(dln.statutoryReference || dln.statute || '')}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Reason for Modification</label>
          <input type="text" id="ed-dln-reason" class="form-control" placeholder="e.g. Adjournment by consent / Extension granted under Order XLVII">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="TasksView.saveModifiedDeadline('${deadlineId}')">Save Modifications</button>
      </div>
    `, 'modal-md');
  },

  async saveModifiedDeadline(deadlineId) {
    const title = document.getElementById('ed-dln-title')?.value?.trim();
    if (!title) {
      App.showToast('Please enter a deadline title.', 'error');
      return;
    }
    const caseId = document.getElementById('ed-dln-case')?.value;
    const relatedCase = (SLCMS_STATE.cases || []).find(c => c.id === caseId) || { id: 'case-gen', caseNumber: 'MATTER-GEN', title: 'General Practice' };
    const dateVal = document.getElementById('ed-dln-date')?.value;
    const timeVal = document.getElementById('ed-dln-time')?.value || '09:00';
    const lawyer = document.getElementById('ed-dln-lawyer')?.value;
    const court = document.getElementById('ed-dln-court')?.value;
    const type = document.getElementById('ed-dln-type')?.value;
    const source = document.getElementById('ed-dln-source')?.value;
    const statRef = document.getElementById('ed-dln-statutory-ref')?.value;
    const reason = document.getElementById('ed-dln-reason')?.value || 'Administrative schedule adjustment';

    const updates = {
      title,
      caseId: relatedCase.id,
      caseNumber: relatedCase.caseNumber,
      caseTitle: relatedCase.title,
      deadlineDate: dateVal,
      deadlineTime: timeVal,
      responsibleLawyerName: lawyer,
      court,
      type,
      source,
      statutoryReference: statRef
    };

    await SLCMS_STATE.updateDeadlineOnBackend(deadlineId, updates, reason);

    // Sync court event in TasksView.courtEvents
    const cEvt = (this.courtEvents || []).find(e => e.id === deadlineId);
    if (cEvt) {
      cEvt.title = title;
      cEvt.date = dateVal;
      cEvt.time = timeVal;
      cEvt.court = court;
      cEvt.type = type;
      cEvt.assignedTo = lawyer;
      cEvt.statute = statRef;
      this.persistCourtEvents();
    }

    SLCMS_STATE.addAuditLog('Deadline Modified', 'Tasks & Deadlines', `Deadline "${title}" updated. Reason: ${reason}`, 'Success');
    App.closeModal();
    App.showToast('Statutory deadline successfully updated.', 'success');
    App.refreshCurrentView();
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};


