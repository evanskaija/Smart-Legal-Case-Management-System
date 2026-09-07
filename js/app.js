/* ==========================================================================
   SLCMS - Main Application Controller & Router
   ========================================================================== */

const App = {
  currentRoute: 'dashboard',
  isLoggedIn: sessionStorage.getItem('slcms_auth') === 'true' && (!!sessionStorage.getItem('slcms_current_user') || !!sessionStorage.getItem('slcms_current_user_id')),
  isSidebarCollapsed: false,
  theme: localStorage.getItem('slcms_theme') || 'light',
  inactivityTimer: null,
  inactivityWarningTimer: null,
  pendingRedirectRoute: null,

  init() {
    if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.restoreSessionUser === 'function') {
      SLCMS_STATE.restoreSessionUser();
    }
    this.isLoggedIn = sessionStorage.getItem('slcms_auth') === 'true' && (!!sessionStorage.getItem('slcms_current_user') || !!sessionStorage.getItem('slcms_current_user_id'));
    this.initTheme();
    this.bindGlobalEvents();
    this.bindInactivityTracker();

    // Check if initial load is an unauthenticated attempt on a protected route
    if (!this.isLoggedIn) {
      document.getElementById('app-root').innerHTML = AuthView.render();
      if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#login') {
        this.pendingRedirectRoute = window.location.hash.replace('#', '');
        this.showToast('Please sign in to continue.', 'info');
      }
      return;
    }

    this.renderAuthenticatedApp();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('slcms_theme') || 'light';
    this.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
  },

  toggleTheme() {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  },

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('slcms_theme', theme);
    this.updateThemeButton();
    if (this.isLoggedIn) {
      this.refreshCurrentView();
    }
    this.showToast(`Theme switched to ${theme.toUpperCase()} mode`, 'info');
  },

  updateThemeButton() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark ? `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #FCD34D;">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ` : `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    `;
    btn.title = isDark ? 'Switch to Light Mode (Ctrl+Shift+D)' : 'Switch to Dark Mode (Ctrl+Shift+D)';
  },

  renderAuthenticatedApp() {
    document.getElementById('app-root').innerHTML = `
      <!-- Mobile Sidebar Backdrop -->
      <div id="sidebar-backdrop" class="sidebar-backdrop" onclick="App.closeMobileSidebar()"></div>

      <!-- 1. FIXED LEFT SIDEBAR -->
      <aside id="app-sidebar" class="sidebar">
        <!-- Mobile Drawer Header with User Profile and Close Button -->
        <div class="sidebar-mobile-user-header">
          <div class="user-display-avatar avatar avatar-sm avatar-ring-gold">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80" alt="Avatar">
          </div>
          <div class="mobile-user-meta">
            <div class="user-display-name mobile-user-name">Eleanor Vance, Esq.</div>
            <div class="user-display-role mobile-user-role">Managing Partner · Active</div>
          </div>
          <button class="mobile-drawer-close-btn" onclick="App.closeMobileSidebar()" aria-label="Close navigation drawer" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Sidebar Header & Logo -->
        <div class="sidebar-header">
          <div class="sidebar-logo" style="padding: 0; background: transparent; border: none;">
            <img src="assets/SLCMS.png" alt="SLCMS Emblem" style="width: 38px; height: 38px; border-radius: 50%; display: block; object-fit: contain; box-shadow: 0 0 10px rgba(200, 155, 60, 0.4);">
          </div>
          <div class="sidebar-brand-text">
            <div class="brand-title">SLCMS<span>.</span></div>
            <div class="brand-subtitle">Smart Legal Case Mgmt</div>
          </div>
        </div>

        <!-- Navigation Items List (Dynamic RBAC) -->
        <nav id="sidebar-nav-list" class="sidebar-nav"></nav>

        <!-- Sidebar User Footer -->
        <div class="sidebar-footer">
          <div class="sidebar-user-info" onclick="App.openUserProfileModal()" title="View & Edit Attorney Profile" style="cursor: pointer;">
            <div class="user-display-avatar avatar avatar-sm avatar-ring-gold">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80" alt="Eleanor Vance, Esq.">
            </div>
            <div class="user-details">
              <span class="user-display-name user-name">Eleanor Vance, Esq.</span>
              <span class="user-display-role user-role-badge">Managing Partner</span>
            </div>
          </div>
          <button class="btn-logout" onclick="App.logout()" title="Secure Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- 2. MAIN WRAPPER -->
      <div class="main-wrapper">
        <!-- Top Navigation Bar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="sidebar-toggle-btn" onclick="App.toggleSidebar()" title="Toggle Sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            
            <div class="breadcrumb-area">
              <h2 id="topbar-page-title" class="page-title">Executive Dashboard</h2>
              <div class="breadcrumb-trail">
                <a href="javascript:void(0)" onclick="App.navigate('dashboard')">SLCMS Law Firm</a>
                <span>/</span>
                <span id="topbar-breadcrumb-current" style="color: var(--color-gold);">Workspace</span>
              </div>
            </div>
          </div>

          <!-- Global Search Field -->
          <div class="global-search-container" onclick="App.openGlobalSearch()">
            <span class="input-icon" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="global-search-input" placeholder="Search cases, clients, pleadings..." readonly>
            <span class="search-shortcut-badge">Ctrl+K</span>
          </div>

          <!-- Topbar Right Actions -->
          <div class="topbar-right">
            <!-- Mobile Global Search Icon Button (visible on mobile phones) -->
            <button class="topbar-icon-btn topbar-mobile-search-btn" onclick="App.openGlobalSearch()" title="Search cases & documents">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <!-- Role Switcher Sandbox Pill -->
            <div class="role-switcher" title="Switch User Role to preview permission differences">
              <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700;">Role:</span>
              <select id="role-switcher-select" class="role-switcher-select" onchange="App.handleRoleSwitch(this.value)">
                <option value="Administrator">Administrator (Partner)</option>
                <option value="Lawyer">Lawyer (Senior Counsel)</option>
                <option value="Clerk">Legal Clerk / Staff</option>
              </select>
            </div>

            <!-- Quick Inactivity Expiry Test Button (Requirement 14 & 18) -->
            <button class="btn btn-ghost btn-sm topbar-test-expiry-btn" onclick="App.triggerInactivityWarning()" title="Simulate 2-minute session inactivity warning" style="color: #64748B; font-size: 0.75rem;">
              ⏳ Test Expiry
            </button>

            <!-- Quick "Add New" Button -->
            <button class="btn btn-gold btn-sm topbar-add-new-btn" onclick="CasesView.openNewCaseModal()" title="New Legal Case">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Add New</span>
            </button>

            <!-- Calendar Icon -->
            <button class="topbar-icon-btn topbar-calendar-btn" onclick="App.navigate('tasks')" title="Statutory Calendar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>

            <!-- Dark / Light Theme Toggle Button -->
            <button id="theme-toggle-btn" class="topbar-icon-btn topbar-theme-btn" onclick="App.toggleTheme()" title="Toggle Dark / Light Mode (Ctrl+Shift+D)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>

            <!-- Notification Bell -->
            <button class="topbar-icon-btn topbar-notifications-btn" onclick="App.openNotifications()" title="Alerts & Deadlines">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              <span class="notification-dot"></span>
            </button>

            <!-- User Profile Dropdown Pill -->
            <div class="flex items-center gap-2 topbar-profile-pill" style="cursor: pointer;" onclick="App.openUserProfileModal()" title="View & Edit Attorney Profile">
              <div class="user-display-avatar avatar avatar-sm avatar-ring-gold">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80" alt="Eleanor Vance, Esq.">
              </div>
            </div>
          </div>
        </header>

        <!-- 3. CENTRAL DYNAMIC CONTENT CONTAINER -->
        <main id="main-content-container" class="content-area"></main>
      </div>

      <!-- 4. MOBILE BOTTOM NAVIGATION (5 Primary Tabs) -->
      <nav id="mobile-bottom-nav" class="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
        <a class="mobile-bottom-nav-item" data-route="dashboard" onclick="App.navigate('dashboard')">
          <span class="mobile-bottom-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
          </span>
          <span>Dashboard</span>
        </a>
        <a class="mobile-bottom-nav-item" data-route="cases" onclick="App.navigate('cases')">
          <span class="mobile-bottom-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </span>
          <span>Cases</span>
        </a>
        <a class="mobile-bottom-nav-item" data-route="tasks" onclick="App.navigate('tasks')">
          <span class="mobile-bottom-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span>Tasks</span>
        </a>
        <a class="mobile-bottom-nav-item" id="mobile-nav-ai-tab" data-route="ai-assistant" onclick="App.navigate('ai-assistant')">
          <span class="mobile-bottom-nav-icon" style="color: var(--color-gold);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </span>
          <span>Legal AI</span>
        </a>
        <a class="mobile-bottom-nav-item" id="mobile-nav-more-tab" onclick="App.toggleSidebar()">
          <span class="mobile-bottom-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="19" cy="12" r="1.5"/>
              <circle cx="5" cy="12" r="1.5"/>
            </svg>
          </span>
          <span>More</span>
        </a>
      </nav>
    `;

    document.body.classList.remove('auth-view-active');
    this.updateUserUI();
    this.renderSidebarNav();
    this.updateThemeButton();
    if (typeof AICopilot !== 'undefined') {
      AICopilot.init();
    }
    
    // Redirect to pending route if user requested a specific page before login
    const targetRoute = this.pendingRedirectRoute || this.currentRoute;
    this.pendingRedirectRoute = null;
    this.navigate(targetRoute);
    this.resetInactivityTimer();
  },

  bindGlobalEvents() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openGlobalSearch();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        this.toggleTheme();
      }
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    // Hash change protection & routing
    window.addEventListener('hashchange', () => {
      if (window.location.hash) {
        const route = window.location.hash.replace('#', '');
        if (route) this.navigate(route);
      }
    });
  },

  // Inactivity Session Management (Requirement 14)
  bindInactivityTracker() {
    ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, () => {
        if (this.isLoggedIn) {
          this.resetInactivityTimer();
        }
      }, { passive: true });
    });
  },

  resetInactivityTimer() {
    clearTimeout(this.inactivityWarningTimer);
    clearTimeout(this.inactivityTimer);

    // In a production environment, this would be 28 minutes. For testing, we set the lifecycle.
    this.inactivityWarningTimer = setTimeout(() => {
      this.triggerInactivityWarning();
    }, 28 * 60 * 1000);

    this.inactivityTimer = setTimeout(() => {
      this.forceInactivityLogout();
    }, 30 * 60 * 1000);
  },

  triggerInactivityWarning() {
    this.openModal(`
      <div class="modal-header">
        <h3 class="modal-title" style="color: var(--color-warning);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Session Inactivity Warning
        </h3>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.6;">
          Your confidential law-firm session will expire in <strong>2 minutes</strong> because of inactivity.
        </p>
        <div class="alert alert-info" style="margin-top: 1rem; font-size: 0.82rem;">
          To safeguard attorney-client privilege, inactive sessions are automatically terminated to prevent unauthorized workstation access.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.logout()">Sign Out</button>
        <button class="btn btn-gold" onclick="App.closeModal(); App.resetInactivityTimer(); App.showToast('Session renewed.', 'success');">
          Stay Signed In
        </button>
      </div>
    `);
  },

  forceInactivityLogout() {
    this.closeModal();
    if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.clearSessionUser === 'function') {
      SLCMS_STATE.clearSessionUser();
    } else {
      sessionStorage.removeItem('slcms_auth');
    }
    this.isLoggedIn = false;
    document.getElementById('app-root').innerHTML = AuthView.render();
    SLCMS_STATE.addAuditLog('Session Expired (Inactivity)', 'Authentication', 'Auto-terminated');
    this.showToast('Your session expired due to inactivity. Please sign in again.', 'warning', 6000);
  },

  // Sensitive Action Re-Authentication (Requirement 14: Sensitive Operations)
  promptSensitiveAuth(actionTitle, onConfirm) {
    this.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-danger);">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Re-Authentication Required
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.9rem; color: #475569; margin-bottom: 1rem;">
          You are attempting a sensitive operation: <strong>${actionTitle}</strong>. Enter your current password to proceed.
        </p>
        <div class="form-group">
          <label class="form-label required">Confirm Your Password</label>
          <input type="password" id="sensitive-pass-input" class="form-control" placeholder="••••••••••••" value="SecretLawFirm2026!">
        </div>
        <div id="sensitive-pass-error" class="form-error-msg hidden"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="App.verifySensitiveAuth('${encodeURIComponent(actionTitle)}')">Verify & Proceed</button>
      </div>
    `);

    this._pendingSensitiveAction = onConfirm;
  },

  verifySensitiveAuth(encodedTitle) {
    const input = document.getElementById('sensitive-pass-input');
    const err = document.getElementById('sensitive-pass-error');
    if (!input || !input.value) {
      if (err) {
        err.innerText = 'Password is required.';
        err.classList.remove('hidden');
      }
      return;
    }

    if (input.value !== 'SecretLawFirm2026!' && input.value !== 'TempPass2026!') {
      if (err) {
        err.innerText = 'Invalid password.';
        err.classList.remove('hidden');
      }
      return;
    }

    this.closeModal();
    if (this._pendingSensitiveAction) {
      this._pendingSensitiveAction();
      this._pendingSensitiveAction = null;
    }
  },

  navigate(route) {
    this.closeMobileSidebar();

    // 1. Strict Protected Pages Check (Requirement 12)
    if (!this.isLoggedIn) {
      this.pendingRedirectRoute = route;
      document.getElementById('app-root').innerHTML = AuthView.render();
      this.showToast('Please sign in to continue.', 'info');
      return;
    }

    // Check Role Restrictions
    const role = SLCMS_STATE.currentUser.role;
    
    // 1. Admin modules
    if (route === 'user-management' || route === 'activity-logs' || route === 'settings') {
      if (role !== 'Managing Partner' && role !== 'System Administrator' && role !== 'Administrator') {
        this.showAccessRestrictedModal('Administration Module Restricted');
        return;
      }
    }

    // 2. Billing & Reports modules
    if (route === 'billing' || route === 'reports') {
      if (role !== 'Managing Partner' && role !== 'Senior Counsel' && role !== 'Administrator') {
        this.showAccessRestrictedModal('Financial & Analytical Records Restricted');
        return;
      }
    }

    // 3. AI Assistant module (Clerks & Admins without legal clearance restricted)
    if (route === 'ai-assistant') {
      if (role === 'Legal Clerk') {
        this.showAccessRestrictedModal('AI Jurisprudence Assistant Restricted', 'Legal clerks are restricted from AI legal research and brief generation.');
        return;
      }
    }

    this.currentRoute = route;
    window.location.hash = route;

    // Update active state in sidebar
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(link => {
      if (link.dataset.route === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update active state in mobile bottom nav
    const bottomNavLinks = document.querySelectorAll('.mobile-bottom-nav .mobile-bottom-nav-item');
    bottomNavLinks.forEach(link => {
      if (link.dataset.route === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update breadcrumb and page title
    const titleMap = {
      'dashboard': 'Executive Dashboard',
      'cases': 'Legal Case Management',
      'clients': 'Client Accounts & Dossiers',
      'documents': 'Document Repository & Vault',
      'tasks': 'Tasks & Statutory Deadlines',
      'communications': 'Communications Log',
      'billing': 'Billing & Retainers',
      'ai-assistant': 'Tanzania Legal Research Assistant',
      'reports': 'Reports & BI Analytics',
      'user-management': 'User Management & Access Control',
      'activity-logs': 'Security & Activity Logs',
      'settings': 'Firm Settings',
      'design-system': 'Design Specifications & Sitemap'
    };

    const pageTitleElem = document.getElementById('topbar-page-title');
    if (pageTitleElem) {
      pageTitleElem.innerText = titleMap[route] || 'Legal Workspace';
    }

    // Render Content
    const container = document.getElementById('main-content-container');
    if (!container) return;

    switch (route) {
      case 'dashboard':
        container.innerHTML = DashboardView.render();
        DashboardView.initCharts();
        break;
      case 'cases':
        container.innerHTML = CasesView.render();
        break;
      case 'clients':
        container.innerHTML = ClientsView.render();
        break;
      case 'documents':
        container.innerHTML = DocumentsView.render();
        break;
      case 'tasks':
        container.innerHTML = TasksView.render();
        break;
      case 'communications':
        container.innerHTML = CommunicationsView.render();
        break;
      case 'billing':
        container.innerHTML = BillingView.render();
        break;
      case 'ai-assistant':
        container.innerHTML = AIAssistantView.render();
        break;
      case 'reports':
        container.innerHTML = ReportsView.render();
        ReportsView.initCharts();
        break;
      case 'user-management':
      case 'activity-logs':
        AdminView.activeSubtab = route === 'activity-logs' ? 'activity' : 'users';
        container.innerHTML = AdminView.render();
        break;
      case 'settings':
        container.innerHTML = SettingsView.render();
        break;
      case 'design-system':
        container.innerHTML = DesignSystemView.render();
        break;
      default:
        container.innerHTML = DashboardView.render();
        DashboardView.initCharts();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  refreshCurrentView() {
    this.navigate(this.currentRoute);
  },

  // --- ROLE MANAGEMENT & SWITCHING ---
  handleRoleSwitch(newRole) {
    SLCMS_STATE.switchRole(newRole);
    this.updateUserUI();
    this.renderSidebarNav();
    this.showToast(`Switched active session to: ${SLCMS_STATE.currentUser.roleLabel}`, 'info');
    this.navigate(this.currentRoute);
  },

  updateUserUI() {
    const u = SLCMS_STATE.currentUser;
    const nameElems = document.querySelectorAll('.user-display-name');
    const roleElems = document.querySelectorAll('.user-display-role');
    const avatarElems = document.querySelectorAll('.user-display-avatar');
    const selectElem = document.getElementById('role-switcher-select');

    nameElems.forEach(el => el.innerText = u.name);
    roleElems.forEach(el => el.innerText = u.roleLabel);
    avatarElems.forEach(el => {
      if (u.avatarImg) {
        el.innerHTML = `<img src="${u.avatarImg}" alt="${u.name}" onerror="this.parentElement.innerText='${u.avatar}'">`;
        el.className = `user-display-avatar avatar avatar-sm avatar-ring-gold`;
      } else {
        el.innerText = u.avatar;
        el.className = `user-display-avatar avatar avatar-sm ${u.avatarClass || 'avatar-gold'}`;
      }
    });

    if (selectElem) {
      selectElem.value = u.role;
    }
  },

  openUserProfileModal() {
    const u = SLCMS_STATE.currentUser;
    const presets = [
      { name: 'Eleanor Vance, Esq.', role: 'Managing Partner', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80' },
      { name: 'Julian Mercer, Esq.', role: 'Senior Litigation Partner', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80' },
      { name: 'Marcus Bell', role: 'Litigation Partner', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80' },
      { name: 'Sophia Chen', role: 'IP Counsel', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80' },
      { name: 'David Croft, Esq.', role: 'Associate Counsel', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
      { name: 'Amara Okafor, Esq.', role: 'Arbitration Partner', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=256&q=80' },
      { name: 'Michael Vance, Esq.', role: 'Tax Counsel', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
      { name: 'Elena Rostova, Esq.', role: 'Corporate Counsel', url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=256&q=80' }
    ];

    this.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43 0%, #0B1F33 100%); color: #FFFFFF; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg); padding: 1.25rem 1.5rem;">
        <div class="flex items-center gap-2.5">
          <div style="width: 34px; height: 34px; border-radius: var(--radius-sm); background: rgba(200, 155, 60, 0.2); border: 1px solid var(--color-gold); display: flex; align-items: center; justify-content: center; color: var(--color-gold);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title" style="color: #FFFFFF; margin: 0; font-size: 1.18rem; font-family: var(--font-heading);">
              Attorney Profile & Licensure Dossier
            </h3>
            <div style="font-size: 0.75rem; color: #CBD5E1; margin-top: 0.15rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>Firm Personnel Record</span>
              <span>•</span>
              <span style="color: var(--color-gold); font-weight: 600;">SOC-2 Type II Certified</span>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #CBD5E1;" title="Close">✕</button>
      </div>

      <div class="modal-body" style="max-height: 75vh; overflow-y: auto; padding: 1.5rem;">
        <!-- Top Profile & Photo Upload Hub -->
        <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem; position: relative;">
          <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
            <!-- Interactive Avatar Area -->
            <div class="avatar-upload-target" onclick="document.getElementById('edit-user-avatar-file').click()" title="Click to Upload Local Headshot"
                 ondragover="event.preventDefault(); this.classList.add('dragover');"
                 ondragleave="this.classList.remove('dragover');"
                 ondrop="App.handleAvatarDrop(event)">
              <div class="avatar avatar-xl avatar-ring-gold" style="width: 90px; height: 90px; background: #0B1F33;">
                <img id="profile-modal-preview-img" src="${u.avatarImg || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'}" alt="${u.name}" style="${!u.avatarImg ? 'display:none;' : ''}">
                <span id="profile-modal-preview-initials" style="${u.avatarImg ? 'display:none;' : ''}; font-size: 1.6rem; font-weight: 700; color: #FFFFFF;">${u.avatar || 'EV'}</span>
              </div>
              <div class="avatar-upload-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Upload</span>
              </div>
              <div class="avatar-camera-badge" title="Upload New Headshot">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>

            <!-- Profile Overview & Photo Actions -->
            <div style="flex: 1; min-width: 260px;">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 id="profile-modal-header-name" style="font-size: 1.25rem; color: var(--color-primary); font-weight: 700; margin: 0;">
                  ${u.name}
                </h3>
                <span class="badge badge-confidential" style="font-size: 0.72rem;">
                  ${u.roleLabel || 'Managing Partner'}
                </span>
                <span class="badge badge-active" style="font-size: 0.68rem; padding: 2px 7px;">
                  Active Counsel
                </span>
              </div>
              <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.35rem; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <span>🏛️ <span id="profile-modal-header-dept">${u.department || 'Commercial Litigation'}</span></span>
                <span>•</span>
                <span>📜 <strong style="color: var(--color-gold); font-family: var(--font-mono);">${u.barNumber || 'NY-BAR #4829104'}</strong></span>
                <span>•</span>
                <span>💵 <strong style="color: var(--color-primary); font-family: var(--font-mono);">${u.hourlyRate || '$550.00 / hr'}</strong></span>
              </div>

              <!-- Upload & Controls Row -->
              <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <input type="file" id="edit-user-avatar-file" accept="image/png, image/jpeg, image/webp, image/gif" style="display:none;" onchange="App.handleAvatarFileUpload(event)">
                <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('edit-user-avatar-file').click()" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Upload Photo</span>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="App.togglePresetsGallery()" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  <span>Preset Gallery ▾</span>
                </button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="App.removeAvatarPhoto()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; color: #EF4444;" title="Clear custom photo and use initials avatar">
                  <span>Remove Photo</span>
                </button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="App.toggleCustomUrlInput()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; color: var(--color-text-secondary);" title="Paste direct image link">
                  <span>Image URL</span>
                </button>
              </div>

              <!-- Presets Gallery Grid Container (Collapsible) -->
              <div id="avatar-presets-container" style="display: none; margin-top: 0.75rem; animation: fadeIn 0.2s ease;">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; margin-bottom: 0.35rem;">
                  Select Professional Headshot Preset:
                </div>
                <div class="avatar-presets-grid">
                  ${presets.map((p) => `
                    <button type="button" class="avatar-preset-btn ${(u.avatarImg === p.url) ? 'active' : ''}" onclick="App.selectPresetAvatar('${p.url}')" title="${p.name} (${p.role})">
                      <img src="${p.url}" alt="${p.name}">
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Custom URL Input (Collapsible) -->
              <div id="avatar-url-container" style="display: none; margin-top: 0.75rem;">
                <input type="text" id="edit-user-avatar-url" class="form-control" style="font-size: 0.75rem; padding: 0.35rem 0.65rem; height: 32px;" value="${u.avatarImg || ''}" placeholder="Paste high-res image URL (https://...)" oninput="App.previewAvatarUrl(this.value)">
              </div>
            </div>
          </div>
        </div>

        <!-- Section 1: Professional Licensure & Practice Details -->
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; color: var(--color-primary); font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.45rem;">
            <span style="color: var(--color-gold);">⚖️</span> Licensure & Practice Credentials
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label required">Full Legal Name & Suffix</label>
              <input type="text" id="edit-user-name" class="form-control" value="${u.name}" required oninput="document.getElementById('profile-modal-header-name').innerText = this.value || 'Attorney'">
            </div>
            <div class="form-group">
              <label class="form-label required">Primary Position Title</label>
              <input type="text" id="edit-user-role-label" class="form-control" value="${u.roleLabel || 'Managing Partner'}" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label required">State Bar License Number</label>
              <input type="text" id="edit-user-bar-no" class="form-control" value="${u.barNumber || 'NY-BAR #4829104'}" style="font-family: var(--font-mono); font-weight: 600;" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Standard Hourly Billing Rate</label>
              <input type="text" id="edit-user-rate" class="form-control" value="${u.hourlyRate || '$550.00 / hr'}" style="font-family: var(--font-mono);" required placeholder="$550.00 / hr">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Court Admissions & Jurisdictions</label>
            <input type="text" id="edit-user-admissions" class="form-control" value="${u.admissions || 'New York State Bar (2012) • U.S. District Court (SDNY) • U.S. 2nd Circuit'}" required>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Practice Areas & Specializations</label>
              <input type="text" id="edit-user-practice-areas" class="form-control" value="${u.practiceAreas || 'Commercial Litigation, Trade Secrets, IP Enforcement, Corporate Arbitration'}" placeholder="e.g. Commercial Litigation, IP, White Collar">
            </div>
            <div class="form-group">
              <label class="form-label">Law School & Education</label>
              <input type="text" id="edit-user-education" class="form-control" value="${u.education || 'Columbia Law School (J.D., 2012) • Princeton University (A.B., 2009)'}" placeholder="e.g. Columbia Law School (J.D.)">
            </div>
          </div>
        </div>

        <!-- Section 2: Contact & Office Location -->
        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; color: var(--color-primary); font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.45rem;">
            <span style="color: var(--color-gold);">📍</span> Contact & Firm Office Location
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label required">Direct Firm Email</label>
              <input type="email" id="edit-user-email" class="form-control" value="${u.email}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Direct Telephone Line</label>
              <input type="tel" id="edit-user-phone" class="form-control" value="${u.phone || '+1 (212) 555-0101'}" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label required">Practice Department</label>
              <input type="text" id="edit-user-dept" class="form-control" value="${u.department || 'Commercial & Corporate Litigation'}" required oninput="document.getElementById('profile-modal-header-dept').innerText = this.value">
            </div>
            <div class="form-group">
              <label class="form-label required">Physical Office Location</label>
              <input type="text" id="edit-user-office" class="form-control" value="${u.officeLocation || 'New York Headquarters, Floor 42, Suite 4200'}" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Assistant / Paralegal Liaison</label>
              <input type="text" id="edit-user-assistant" class="form-control" value="${u.assistantContact || 'Sophia Chen • s.chen@slcms-law.com • Ext. 104'}" placeholder="Name & Extension">
            </div>
            <div class="form-group">
              <label class="form-label">Languages Spoken</label>
              <input type="text" id="edit-user-languages" class="form-control" value="${u.languages || 'English (Native), French (Fluent), Swahili (Conversational)'}" placeholder="e.g. English, French">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Professional Practice Biography</label>
            <textarea id="edit-user-bio" class="form-control" rows="3" placeholder="Summary of legal career, prominent matters handled, and background...">${u.bio || 'Managing Partner specializing in complex commercial litigation, trade secrets, high-stakes IP enforcement, and corporate arbitration before the Southern District of New York.'}</textarea>
          </div>
        </div>

        <!-- Section 3: Security & Session Origin -->
        <div style="background: #F8FAFC; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem 1.25rem;">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.35rem;">
                <span>🔒</span> Security & Authentication Compliance
              </div>
              <div style="font-size: 0.76rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                MFA: <strong style="color: var(--color-success);">${u.mfaStatus || 'Hardware FIDO2 / YubiKey Active'}</strong> • Origin: <strong>192.168.1.45 (Firm Office VPN)</strong> • SOC-2 Audited
              </div>
            </div>
            <span class="badge badge-confidential" style="font-size: 0.72rem;">
              SOC-2 Verified
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--color-border-subtle); display: flex; align-items: center; justify-content: space-between;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-gold" onclick="App.saveUserProfile()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Save Profile Changes</span>
        </button>
      </div>
    `, 'modal-lg');
  },

  handleAvatarFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (PNG, JPG, WebP, GIF).', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      this.showToast('Image file size must be less than 15MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        // High-DPI canvas downscaling (max 512x512) for fast persistence & retina crispness
        const maxDim = 512;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);

        const previewImg = document.getElementById('profile-modal-preview-img');
        const initialsSpan = document.getElementById('profile-modal-preview-initials');
        const urlInput = document.getElementById('edit-user-avatar-url');

        if (previewImg) {
          previewImg.src = dataUrl;
          previewImg.style.display = 'block';
        }
        if (initialsSpan) initialsSpan.style.display = 'none';
        if (urlInput) urlInput.value = dataUrl;

        // Clear active states on presets
        document.querySelectorAll('.avatar-preset-btn').forEach(b => b.classList.remove('active'));

        this.showToast('Photo loaded and optimized! Click "Save Profile Changes" to save permanently.', 'success');
      };
      img.onerror = () => {
        const previewImg = document.getElementById('profile-modal-preview-img');
        const initialsSpan = document.getElementById('profile-modal-preview-initials');
        const urlInput = document.getElementById('edit-user-avatar-url');

        if (previewImg) {
          previewImg.src = rawDataUrl;
          previewImg.style.display = 'block';
        }
        if (initialsSpan) initialsSpan.style.display = 'none';
        if (urlInput) urlInput.value = rawDataUrl;

        this.showToast('Photo loaded! Click "Save Profile Changes" to apply.', 'success');
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      this.showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  },

  handleAvatarDrop(event) {
    event.preventDefault();
    const dt = event.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      const input = document.getElementById('edit-user-avatar-file');
      if (input) {
        input.files = dt.files;
        this.handleAvatarFileUpload({ target: { files: dt.files } });
      }
    }
  },

  togglePresetsGallery() {
    const container = document.getElementById('avatar-presets-container');
    if (!container) return;
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    const urlContainer = document.getElementById('avatar-url-container');
    if (urlContainer && isHidden) urlContainer.style.display = 'none';
  },

  toggleCustomUrlInput() {
    const container = document.getElementById('avatar-url-container');
    if (!container) return;
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    const presetsContainer = document.getElementById('avatar-presets-container');
    if (presetsContainer && isHidden) presetsContainer.style.display = 'none';
    if (isHidden) {
      document.getElementById('edit-user-avatar-url')?.focus();
    }
  },

  selectPresetAvatar(url) {
    const previewImg = document.getElementById('profile-modal-preview-img');
    const initialsSpan = document.getElementById('profile-modal-preview-initials');
    const urlInput = document.getElementById('edit-user-avatar-url');

    if (previewImg) {
      previewImg.src = url;
      previewImg.style.display = 'block';
    }
    if (initialsSpan) initialsSpan.style.display = 'none';
    if (urlInput) urlInput.value = url;

    document.querySelectorAll('.avatar-preset-btn').forEach(b => {
      if (b.querySelector('img')?.src === url) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    this.showToast('Selected preset portrait. Click "Save Profile Changes" to apply.', 'info');
  },

  previewAvatarUrl(url) {
    const previewImg = document.getElementById('profile-modal-preview-img');
    const initialsSpan = document.getElementById('profile-modal-preview-initials');
    if (!url || !url.trim()) {
      if (previewImg) previewImg.style.display = 'none';
      if (initialsSpan) initialsSpan.style.display = 'block';
      return;
    }
    if (previewImg) {
      previewImg.src = url.trim();
      previewImg.style.display = 'block';
    }
    if (initialsSpan) initialsSpan.style.display = 'none';
  },

  removeAvatarPhoto() {
    const previewImg = document.getElementById('profile-modal-preview-img');
    const initialsSpan = document.getElementById('profile-modal-preview-initials');
    const urlInput = document.getElementById('edit-user-avatar-url');
    const fileInput = document.getElementById('edit-user-avatar-file');

    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (initialsSpan) initialsSpan.style.display = 'block';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';

    document.querySelectorAll('.avatar-preset-btn').forEach(b => b.classList.remove('active'));
    this.showToast('Photo removed. Initials badge will be used after saving.', 'info');
  },

  saveUserProfile() {
    const name = document.getElementById('edit-user-name')?.value?.trim();
    if (!name) {
      this.showToast('Please provide a legal name.', 'error');
      document.getElementById('edit-user-name')?.focus();
      return;
    }

    const email = document.getElementById('edit-user-email')?.value?.trim();
    if (!email || !email.includes('@')) {
      this.showToast('Please provide a valid direct firm email.', 'error');
      document.getElementById('edit-user-email')?.focus();
      return;
    }

    const u = SLCMS_STATE.currentUser;
    u.name = name;
    u.roleLabel = document.getElementById('edit-user-role-label')?.value?.trim() || u.roleLabel;
    u.barNumber = document.getElementById('edit-user-bar-no')?.value?.trim() || u.barNumber;
    u.hourlyRate = document.getElementById('edit-user-rate')?.value?.trim() || u.hourlyRate;
    u.admissions = document.getElementById('edit-user-admissions')?.value?.trim() || u.admissions;
    u.practiceAreas = document.getElementById('edit-user-practice-areas')?.value?.trim() || u.practiceAreas;
    u.education = document.getElementById('edit-user-education')?.value?.trim() || u.education;
    u.email = email;
    u.phone = document.getElementById('edit-user-phone')?.value?.trim() || u.phone;
    u.department = document.getElementById('edit-user-dept')?.value?.trim() || u.department;
    u.officeLocation = document.getElementById('edit-user-office')?.value?.trim() || u.officeLocation;
    u.assistantContact = document.getElementById('edit-user-assistant')?.value?.trim() || u.assistantContact;
    u.languages = document.getElementById('edit-user-languages')?.value?.trim() || u.languages;
    u.bio = document.getElementById('edit-user-bio')?.value?.trim() || u.bio;

    const previewImg = document.getElementById('profile-modal-preview-img');
    const avatarVal = document.getElementById('edit-user-avatar-url')?.value?.trim();
    if (avatarVal) {
      u.avatarImg = avatarVal;
    } else if (previewImg && previewImg.src && previewImg.style.display !== 'none' && !previewImg.src.endsWith('#') && previewImg.src.length > 5) {
      u.avatarImg = previewImg.src;
    } else {
      u.avatarImg = '';
    }

    // Compute initials for fallback badge
    const parts = u.name.replace(/,.*$/, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      u.avatar = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      u.avatar = parts[0].substring(0, 2).toUpperCase();
    } else {
      u.avatar = 'AT';
    }

    // Update corresponding user in users directory
    const foundUser = SLCMS_STATE.users.find(item => item.id === u.id || (item.email && u.email && item.email.toLowerCase() === u.email.toLowerCase()));
    if (foundUser) {
      foundUser.name = u.name;
      foundUser.email = u.email;
      foundUser.phone = u.phone;
      foundUser.department = u.department;
      foundUser.jobTitle = u.roleLabel;
      foundUser.roleTitle = u.roleLabel;
      foundUser.avatarImg = u.avatarImg;
      foundUser.avatar = u.avatar;
    }

    // Permanently persist to localStorage and sessionStorage
    if (typeof SLCMS_STATE.persistCurrentUser === 'function') {
      SLCMS_STATE.persistCurrentUser();
    }
    if (typeof SLCMS_STATE.persistUsers === 'function') {
      SLCMS_STATE.persistUsers();
    }

    SLCMS_STATE.addAuditLog('Attorney Profile Updated', 'Security & Personnel', `${u.name} (${u.roleLabel}) - Dossier & Licensure updated`);
    this.updateUserUI();
    this.closeModal();
    this.showToast('Attorney profile, photo, and licensure details saved permanently!', 'success');
    this.refreshCurrentView();
  },

  showAccessRestrictedModal(actionName = 'Access Denied', details = '') {
    const msg = SLCMS_STATE.getStandardDenialMessage();
    this.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #7F1D1D, #450A0A); color: #FFFFFF;">
        <div>
          <h3 class="modal-title" style="color: #FFFFFF; display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem;">
            <span>🛡️</span> Security Authorization Policy
          </h3>
          <p style="font-size: 0.78rem; color: #FECACA; margin-top: 0.2rem;">
            Strict Role-Based Access Control (RBAC) & Ethical Wall Enforcement
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; text-align: center;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: var(--color-danger); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--color-danger); margin-bottom: 0.5rem;">
          ${actionName}
        </h4>

        <div class="alert alert-danger" style="text-align: left; font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.25rem;">
          ${msg}
        </div>

        <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: 8px; padding: 0.85rem; font-size: 0.8rem; text-align: left;">
          <div style="color: #64748B; margin-bottom: 0.25rem;"><strong>Active Session User:</strong> ${SLCMS_STATE.currentUser.name}</div>
          <div style="color: #64748B; margin-bottom: 0.25rem;"><strong>Assigned Role:</strong> <span class="badge badge-neutral" style="font-size: 0.72rem;">${SLCMS_STATE.currentUser.roleLabel || SLCMS_STATE.currentUser.role}</span></div>
          ${details ? `<div style="color: #64748B; margin-top: 0.35rem; font-style: italic;">Note: ${details}</div>` : ''}
          <div style="color: #94A3B8; font-size: 0.72rem; margin-top: 0.5rem;">
            🔒 <em>This unauthorized attempt has been recorded in the firm's immutable security audit log.</em>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="justify-content: center;">
        <button class="btn btn-secondary" onclick="App.closeModal()">Acknowledge & Return</button>
      </div>
    `, 'modal-md');

    SLCMS_STATE.addAuditLog('Access Restricted (Unauthorized Action Blocked)', 'Security', `${actionName} attempted by ${SLCMS_STATE.currentUser.email} (${SLCMS_STATE.currentUser.role})`, 'Blocked');
  },

  renderSidebarNav() {
    const role = SLCMS_STATE.currentUser.role;
    const navContainer = document.getElementById('sidebar-nav-list');
    if (!navContainer) return;

    let html = `
      <div class="nav-section-title">Core Operations</div>
      <a class="nav-item ${this.currentRoute === 'dashboard' ? 'active' : ''}" data-route="dashboard" onclick="App.navigate('dashboard')">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
        </span>
        <span>Dashboard</span>
      </a>

      <a class="nav-item ${this.currentRoute === 'cases' ? 'active' : ''}" data-route="cases" onclick="App.navigate('cases')">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </span>
        <span>Cases & Matters</span>
        <span class="nav-badge">${SLCMS_STATE.cases.length}</span>
      </a>

      <a class="nav-item ${this.currentRoute === 'clients' ? 'active' : ''}" data-route="clients" onclick="App.navigate('clients')">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
        <span>Clients Directory</span>
      </a>

      <a class="nav-item ${this.currentRoute === 'documents' ? 'active' : ''}" data-route="documents" onclick="App.navigate('documents')">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </span>
        <span>Document Vault</span>
      </a>

      <a class="nav-item ${this.currentRoute === 'tasks' ? 'active' : ''}" data-route="tasks" onclick="App.navigate('tasks')">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </span>
        <span>Tasks & Deadlines</span>
      </a>

      <a class="nav-item ${this.currentRoute === 'communications' ? 'active' : ''}" data-route="communications" onclick="App.navigate('communications')">
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span>Communications</span>
      </a>
    `;

    // Jurisprudence & Legal AI: Managing Partner, Senior Counsel, Associate Lawyer, Junior Lawyer
    if (role === 'Managing Partner' || role === 'Senior Counsel' || role === 'Associate Lawyer' || role === 'Junior Lawyer' || role === 'Administrator' || role === 'Lawyer') {
      html += `
        <div class="nav-section-title">Counsel & Jurisprudence</div>
        <a class="nav-item ${this.currentRoute === 'ai-assistant' ? 'active' : ''}" data-route="ai-assistant" onclick="App.navigate('ai-assistant')">
          <span class="nav-icon" style="color: var(--color-gold);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </span>
          <span>Tanzania Legal AI</span>
        </a>

        <a class="nav-item" onclick="AIAssistantView.openYearBrowserModal('ALL')" title="Browse Tanzanian Case Law by Year (2020–2026)" style="cursor: pointer; white-space: nowrap;">
          <span class="nav-icon" style="color: #38BDF8;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <path d="M8 7h8M8 11h6"/>
            </svg>
          </span>
          <span style="font-weight: 600; white-space: nowrap;">Case Library (2020–2026)</span>
          <span class="nav-badge" style="background: linear-gradient(135deg, rgba(200,155,60,0.3) 0%, rgba(200,155,60,0.15) 100%); color: var(--color-gold); border: 1px solid rgba(200,155,60,0.4); flex-shrink: 0; margin-left: auto;">${SLCMS_STATE.tanzaniaJudgments.length}</span>
        </a>
      `;
    }

    // Billing & Retainers: Managing Partner & Senior Counsel
    if (role === 'Managing Partner' || role === 'Senior Counsel' || role === 'Administrator') {
      html += `
        <a class="nav-item ${this.currentRoute === 'billing' ? 'active' : ''}" data-route="billing" onclick="App.navigate('billing')">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </span>
          <span>Billing & Payments</span>
        </a>
      `;
    }

    // Reports: Managing Partner only
    if (role === 'Managing Partner' || role === 'Administrator') {
      html += `
        <a class="nav-item ${this.currentRoute === 'reports' ? 'active' : ''}" data-route="reports" onclick="App.navigate('reports')">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20V10"/>
              <path d="M12 20V4"/>
              <path d="M6 20v-6"/>
            </svg>
          </span>
          <span>Reports & Analytics</span>
        </a>
      `;
    }

    // Administration: Managing Partner & System Administrator
    if (role === 'Managing Partner' || role === 'System Administrator' || role === 'Administrator') {
      html += `
        <div class="nav-section-title">Administration</div>
        <a class="nav-item ${this.currentRoute === 'user-management' ? 'active' : ''}" data-route="user-management" onclick="App.navigate('user-management')">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <span>User Management</span>
        </a>

        <a class="nav-item ${this.currentRoute === 'activity-logs' ? 'active' : ''}" data-route="activity-logs" onclick="App.navigate('activity-logs')">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </span>
          <span>Activity Logs</span>
        </a>

        <a class="nav-item ${this.currentRoute === 'settings' ? 'active' : ''}" data-route="settings" onclick="App.navigate('settings')">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span>Firm Settings</span>
        </a>
      `;
    }

    html += `
      <div class="nav-section-title">Documentation</div>
      <a class="nav-item ${this.currentRoute === 'design-system' ? 'active' : ''}" data-route="design-system" onclick="App.navigate('design-system')">
        <span class="nav-icon" style="color: var(--color-gold);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="6 2 18 2 18 6 6 6 6 2"/>
            <rect width="18" height="14" x="3" y="6" rx="2"/>
            <line x1="3" y1="11" x2="21" y2="11"/>
          </svg>
        </span>
        <span>Design System & Specs</span>
      </a>
    `;

    navContainer.innerHTML = html;

    // Synchronize Mobile Bottom Nav for RBAC
    const aiTab = document.getElementById('mobile-nav-ai-tab');
    if (aiTab) {
      if (role === 'Legal Clerk') {
        aiTab.setAttribute('data-route', 'documents');
        aiTab.setAttribute('onclick', "App.navigate('documents')");
        aiTab.innerHTML = `
          <span class="mobile-bottom-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </span>
          <span>Vault</span>
        `;
      } else {
        aiTab.setAttribute('data-route', 'ai-assistant');
        aiTab.setAttribute('onclick', "App.navigate('ai-assistant')");
        aiTab.innerHTML = `
          <span class="mobile-bottom-nav-icon" style="color: var(--color-gold);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </span>
          <span>Legal AI</span>
        `;
      }
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    const width = window.innerWidth;
    if (width < 768) {
      // Mobile drawer (<768px)
      const isOpen = sidebar.classList.toggle('mobile-open');
      if (backdrop) backdrop.classList.toggle('active', isOpen);
      document.body.classList.toggle('mobile-nav-open', isOpen);
    } else if (width >= 768 && width < 1024) {
      // Tablet icon overlay (768px - 1023px)
      const isExpanded = sidebar.classList.toggle('expanded-tablet');
      if (backdrop) backdrop.classList.toggle('active', isExpanded);
    } else {
      // Desktop collapse to icon bar (>=1024px)
      sidebar.classList.toggle('collapsed');
      this.isSidebarCollapsed = sidebar.classList.contains('collapsed');
    }
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
      sidebar.classList.remove('expanded-tablet');
    }
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('mobile-nav-open');
  },

  // --- AUTHENTICATION FLOWS ---
  logout() {
    this.confirmAction({
      title: 'Confirm Secure Logout',
      message: 'You are about to terminate your encrypted law-firm session. Any unsaved edits will be discarded.',
      confirmText: 'Sign Out',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.clearSessionUser === 'function') {
          SLCMS_STATE.clearSessionUser();
        } else {
          sessionStorage.removeItem('slcms_auth');
        }
        this.isLoggedIn = false;
        document.getElementById('app-root').innerHTML = AuthView.render();
        this.showToast('You have securely signed out.', 'info');
      }
    });
  },

  // --- GLOBAL SEARCH MODAL ---
  openGlobalSearch() {
    this.openModal(`
      <div class="modal-header" style="padding: 0.85rem 1.25rem;">
        <div class="input-with-icon w-full">
          <span class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" id="global-modal-search-input" class="form-control" placeholder="Search legal matters, client dossiers, depositions, filings... (Esc to exit)"
                 style="font-size: 1rem; border: none; box-shadow: none;" oninput="App.handleGlobalSearchInput(this.value)" autofocus>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" id="global-search-results" style="max-height: 440px; padding: 1rem 1.25rem;">
        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); font-weight: 700; margin-bottom: 0.75rem;">
          Quick Jump Recommendations
        </div>
        <div class="flex flex-col gap-2">
          ${SLCMS_STATE.cases.slice(0, 3).map(c => `
            <div class="p-2 flex items-center justify-between" style="background: var(--color-surface-subtle); border-radius: var(--radius-sm); cursor: pointer;" onclick="App.closeModal(); CasesView.openCaseDetails('${c.id}')">
              <div class="flex items-center gap-2">
                <span class="badge" style="font-family: var(--font-mono); font-size: 0.7rem;">CASE</span>
                <div>
                  <strong style="font-size: 0.85rem; color: var(--color-primary);">${c.title}</strong>
                  <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${c.caseNumber} • ${c.client}</div>
                </div>
              </div>
              <span class="badge badge-${c.status.toLowerCase().replace(' ', '')}">${c.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `, 'modal-lg');

    setTimeout(() => {
      document.getElementById('global-modal-search-input')?.focus();
    }, 100);
  },

  handleGlobalSearchInput(val) {
    const container = document.getElementById('global-search-results');
    if (!container) return;

    if (!val || val.trim() === '') {
      container.innerHTML = `<div style="font-size: 0.82rem; color: var(--color-text-muted); text-align: center; padding: 2rem;">Type to search across cases, clients and documents...</div>`;
      return;
    }

    const q = val.toLowerCase();
    const matchCases = SLCMS_STATE.cases.filter(c => c.title.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q));
    const matchClients = SLCMS_STATE.clients.filter(cl => cl.name.toLowerCase().includes(q));
    const matchDocs = SLCMS_STATE.documents.filter(d => d.title.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q));

    let resHTML = '';

    if (matchCases.length) {
      resHTML += `
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: 0.35rem;">CASES (${matchCases.length})</div>
        <div class="flex flex-col gap-1.5" style="margin-bottom: 1rem;">
          ${matchCases.map(c => `
            <div class="p-2 flex items-center justify-between" style="background: var(--color-surface-subtle); border-radius: var(--radius-sm); cursor: pointer;" onclick="App.closeModal(); CasesView.openCaseDetails('${c.id}')">
              <div><strong>${c.title}</strong> <span style="font-size: 0.72rem; color: var(--color-gold); font-family: var(--font-mono);">${c.caseNumber}</span></div>
              <span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (matchClients.length) {
      resHTML += `
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: 0.35rem;">CLIENTS (${matchClients.length})</div>
        <div class="flex flex-col gap-1.5" style="margin-bottom: 1rem;">
          ${matchClients.map(cl => `
            <div class="p-2 flex items-center justify-between" style="background: var(--color-surface-subtle); border-radius: var(--radius-sm); cursor: pointer;" onclick="App.closeModal(); ClientsView.openClientProfile('${cl.id}')">
              <div><strong>${cl.name}</strong> <span style="font-size: 0.72rem; color: var(--color-text-muted);">(${cl.type})</span></div>
              <span style="font-size: 0.75rem;">$${cl.totalBilled.toLocaleString()} Billed</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (matchDocs.length) {
      resHTML += `
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: 0.35rem;">DOCUMENTS (${matchDocs.length})</div>
        <div class="flex flex-col gap-1.5">
          ${matchDocs.map(d => `
            <div class="p-2 flex items-center justify-between" style="background: var(--color-surface-subtle); border-radius: var(--radius-sm); cursor: pointer;" onclick="App.closeModal(); DocumentsView.previewDocument('${d.id}')">
              <div><strong>${d.title}</strong> <div style="font-size: 0.7rem; color: var(--color-text-muted);">${d.fileName}</div></div>
              <span class="badge badge-confidential">${d.accessLevel}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (!matchCases.length && !matchClients.length && !matchDocs.length) {
      resHTML = `<div style="text-align: center; padding: 2rem; color: var(--color-text-muted);">No records found matching "${val}"</div>`;
    }

    container.innerHTML = resHTML;
  },

  // --- NOTIFICATIONS & ALERTS PANEL ---
  currentNotifFilter: 'all',

  openNotifications(filter = 'all') {
    this.currentNotifFilter = filter;
    const notifications = SLCMS_STATE.notifications;
    const unreadCount = notifications.filter(n => !n.read).length;

    const filtered = notifications.filter(n => {
      if (this.currentNotifFilter === 'unread') return !n.read;
      if (this.currentNotifFilter === 'urgent') return n.type === 'danger' || n.type === 'warning';
      return true;
    });

    const getIcon = (type) => {
      if (type === 'danger') return '🏛️';
      if (type === 'warning') return '💳';
      if (type === 'info') return '📄';
      return '📅';
    };

    const getActionLabel = (link) => {
      if (link.includes('cases')) return 'View Case Dossier →';
      if (link.includes('billing')) return 'View Invoice & Ledger →';
      if (link.includes('documents')) return 'Inspect Vault Document →';
      if (link.includes('tasks')) return 'Open Statutory Calendar →';
      return 'View Details →';
    };

    this.openModal(`
      <div class="notif-modal-wrapper">
        <!-- Modal Header -->
        <div class="modal-header" style="padding: 1.15rem 1.35rem;">
          <div class="flex items-center gap-2.5">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-gold-light); display: flex; align-items: center; justify-content: center; color: var(--color-gold); box-shadow: 0 2px 6px rgba(200, 155, 60, 0.2);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
            </div>
            <div>
              <h3 class="modal-title" style="font-size: 1.1rem; margin: 0; line-height: 1.2;">Notifications & Alerts</h3>
              <span style="font-size: 0.74rem; color: var(--color-text-secondary);">Real-time firm docket, court hearings & billing</span>
            </div>
            ${unreadCount > 0 ? `<span class="notif-header-badge">${unreadCount} Unread</span>` : `<span class="badge badge-active" style="font-size: 0.68rem;">All Caught Up</span>`}
          </div>

          <div class="flex items-center gap-2">
            ${unreadCount > 0 ? `
              <button class="btn btn-ghost btn-sm" style="font-size: 0.78rem; font-weight: 700; color: var(--color-gold);" onclick="App.markAllNotificationsRead()">
                ✓ Mark all read
              </button>
            ` : ''}
            <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" title="Close">✕</button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="notif-filter-tabs">
          <button class="notif-tab-btn ${this.currentNotifFilter === 'all' ? 'active' : ''}" onclick="App.openNotifications('all')">
            All (${notifications.length})
          </button>
          <button class="notif-tab-btn ${this.currentNotifFilter === 'unread' ? 'active' : ''}" onclick="App.openNotifications('unread')">
            Unread (${unreadCount})
          </button>
          <button class="notif-tab-btn ${this.currentNotifFilter === 'urgent' ? 'active' : ''}" onclick="App.openNotifications('urgent')">
            ⚠️ Urgent & Hearings
          </button>
        </div>

        <!-- Notification Cards List -->
        <div class="notif-cards-list">
          ${filtered.length === 0 ? `
            <div style="padding: 2.5rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem;">
              <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">🎉</div>
              No notifications matching the selected filter.
            </div>
          ` : filtered.map(n => `
            <div class="notif-card ${n.read ? 'read' : 'unread'}" onclick="App.handleNotificationClick('${n.id}', '${n.link}')">
              
              <!-- Straight Left Accent Bar -->
              <div class="notif-card-bar ${n.type}"></div>

              <!-- Left Category Icon Box -->
              <div class="notif-icon-box ${n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : n.type === 'info' ? 'info' : 'gold'}">
                ${getIcon(n.type)}
              </div>

              <!-- Main Content -->
              <div class="notif-card-body">
                <div class="notif-card-top">
                  <div class="flex items-center gap-2">
                    <strong class="notif-card-title">${n.title}</strong>
                    ${!n.read ? '<span class="notif-unread-dot" title="Unread notification"></span>' : ''}
                  </div>
                  <span class="notif-card-time">${n.time}</span>
                </div>

                <p class="notif-card-msg">${n.message}</p>

                <div class="notif-card-footer">
                  <span class="notif-action-link">
                    ${getActionLabel(n.link)}
                  </span>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted);">
                    Click to open record
                  </span>
                </div>
              </div>

            </div>
          `).join('')}
        </div>

        <!-- Footer -->
        <div class="notif-panel-footer">
          <span>🔔 Automatic e-Courts & Statutory Docket sync active</span>
          <button class="btn btn-ghost btn-sm" style="font-size: 0.72rem; color: var(--color-text-secondary);" onclick="App.clearAllNotifications()">
            Dismiss All
          </button>
        </div>
      </div>
    `, 'modal-md');
  },

  handleNotificationClick(notifId, link) {
    const n = SLCMS_STATE.notifications.find(item => item.id === notifId);
    if (n) {
      n.read = true;
    }
    this.closeModal();

    // Navigate to target route
    const route = link.replace('#', '');
    if (route) {
      this.navigate(route);
      if (route === 'tasks') {
        setTimeout(() => TasksView.switchView('calendar'), 100);
      }
    }
  },

  markAllNotificationsRead() {
    SLCMS_STATE.notifications.forEach(n => n.read = true);
    const dot = document.querySelector('.notification-dot');
    if (dot) dot.style.display = 'none';
    this.showToast('All notifications marked as read.', 'success');
    this.openNotifications(this.currentNotifFilter);
  },

  clearAllNotifications() {
    SLCMS_STATE.notifications = [];
    const dot = document.querySelector('.notification-dot');
    if (dot) dot.style.display = 'none';
    this.showToast('All notifications cleared.', 'info');
    this.closeModal();
  },

  // --- MODAL DIALOG MANAGER ---
  openModal(htmlContent, sizeClass = '') {
    const overlay = document.getElementById('global-modal-overlay');
    const content = document.getElementById('global-modal-content');
    if (!overlay || !content) return;

    content.className = `modal-content ${sizeClass}`;
    content.innerHTML = htmlContent;
    overlay.classList.add('active');
  },

  closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  // --- CONFIRMATION MODAL ---
  confirmAction({ title, message, confirmText = 'Confirm', confirmClass = 'btn-gold', onConfirm }) {
    this.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.9rem; color: var(--color-text-main); line-height: 1.6;">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn ${confirmClass}" id="btn-confirm-action">${confirmText}</button>
      </div>
    `, 'modal-sm');

    document.getElementById('btn-confirm-action')?.addEventListener('click', () => {
      App.closeModal();
      if (typeof onConfirm === 'function') onConfirm();
    });
  },

  // --- TOAST NOTIFICATIONS ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    `;
    if (type === 'success') {
      iconSvg = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-success);">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    } else if (type === 'error' || type === 'danger') {
      iconSvg = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-danger);">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      `;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-body">
        <div class="toast-title">${type.toUpperCase()}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

// Bootstrap application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
