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
    // 1. Immediately apply cached/default settings synchronously for zero-latency render
    if (typeof AppSettings !== 'undefined') {
      try {
        const cached = (typeof AppSettings.getCached === 'function') ? AppSettings.getCached() : {};
        AppSettings.values = Object.assign({}, AppSettings.defaults, cached);
        AppSettings.apply();
        // Sync live settings in background without blocking initial DOM render
        AppSettings.load().catch(e => console.warn('AppSettings background sync:', e));
      } catch (e) {
        console.warn('AppSettings load deferred:', e);
      }
    }
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('demo');
    if (demoParam) {
      sessionStorage.setItem('slcms_auth', 'true');
      if (demoParam === 'lawyer') {
        const lawyerUser = (SLCMS_STATE.users || []).find(u => u.role === 'Lawyer') || { id: 'USR-002', name: 'Advocate J. M. Temu', role: 'Lawyer', email: 'temu@slcms-law.co.tz' };
        SLCMS_STATE.currentUser = lawyerUser;
        sessionStorage.setItem('slcms_current_user', JSON.stringify(lawyerUser));
        sessionStorage.setItem('slcms_current_user_id', lawyerUser.id);
      } else if (demoParam === 'senior_lawyer') {
        const snrUser = (SLCMS_STATE.users || []).find(u => u.role === 'Senior Lawyer') || { id: 'USR-001', name: 'Senior Advocate E. M. Kaija', role: 'Senior Lawyer', email: 'kaija@slcms-law.co.tz' };
        SLCMS_STATE.currentUser = snrUser;
        sessionStorage.setItem('slcms_current_user', JSON.stringify(snrUser));
        sessionStorage.setItem('slcms_current_user_id', snrUser.id);
      } else if (demoParam === 'clerk') {
        const clerkUser = (SLCMS_STATE.users || []).find(u => u.role === 'Legal Clerk') || { id: 'USR-003', name: 'Legal Clerk P. M. Shirima', role: 'Legal Clerk', email: 'clerk@slcms-law.co.tz' };
        SLCMS_STATE.currentUser = clerkUser;
        sessionStorage.setItem('slcms_current_user', JSON.stringify(clerkUser));
        sessionStorage.setItem('slcms_current_user_id', clerkUser.id);
      } else {
        sessionStorage.setItem('slcms_current_user', JSON.stringify(SLCMS_STATE.currentUser));
        sessionStorage.setItem('slcms_current_user_id', SLCMS_STATE.currentUser?.id);
      }
    }
    if (typeof SLCMS_STATE !== 'undefined') {
      if (typeof SLCMS_STATE.restoreSessionUser === 'function') {
        SLCMS_STATE.restoreSessionUser();
      }
      // Sync users in background without blocking initial DOM render
      if (typeof SLCMS_STATE.syncUsersFromBackend === 'function') {
        SLCMS_STATE.syncUsersFromBackend().catch(e => console.warn('Backend user sync deferred:', e));
      }
    }
    this.isLoggedIn = sessionStorage.getItem('slcms_auth') === 'true' && (!!sessionStorage.getItem('slcms_current_user') || !!sessionStorage.getItem('slcms_current_user_id'));
    this.initTheme();
    this.bindGlobalEvents();
    this.bindInactivityTracker();

    // Sanitize any stale or unregistered test docket entries from storage
    try {
      const savedEvts = localStorage.getItem('slcms_persisted_court_events');
      if (savedEvts && (savedEvts.includes('bvfcjk') || savedEvts.includes('hhoiuyfthjk') || savedEvts.includes('knjhgfgxhj'))) {
        localStorage.removeItem('slcms_persisted_court_events');
      }
    } catch(e){}

    // Ensure the hanging AI Copilot FAB is initialized and visible across the entire platform
    if (typeof AICopilot !== 'undefined') {
      AICopilot.init();
    }

    // Check if initial load is an unauthenticated attempt on a protected route
    if (!this.isLoggedIn) {
      if (typeof AuthView !== 'undefined') {
        const h = (window.location.hash || '').replace(/^#\/?/, '').trim();
        if (h === 'client-portal' || h === 'client_entrance') {
          AuthView.portalMode = 'client_entrance';
        } else if (h === 'client-login') {
          AuthView.portalMode = 'client_login';
        } else if (h === 'client-register') {
          AuthView.portalMode = 'client_register';
        } else if (h === 'client-verify') {
          AuthView.portalMode = 'client_verify';
        } else if (h === 'staff-login' || h === 'staff') {
          AuthView.portalMode = 'staff';
        } else {
          AuthView.portalMode = 'welcome_gate';
        }
      }
      document.getElementById('app-root').innerHTML = AuthView.render();
      if (typeof AppSettings !== 'undefined') {
        AppSettings.apply();
      }
      if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#login' && !window.location.hash.startsWith('#client') && !window.location.hash.startsWith('#staff')) {
        this.pendingRedirectRoute = window.location.hash.replace('#', '');
        this.showToast('Please sign in to continue.', 'info');
      }
      if (urlParams.get('openDrawer') === 'true' && typeof AICopilot !== 'undefined') {
        setTimeout(() => AICopilot.openDrawer(), 300);
      }
      return;
    }

    this.renderAuthenticatedApp();
  },

  initTheme() {
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    const savedTheme = (themeParam && (themeParam === 'dark' || themeParam === 'light')) ? themeParam : (localStorage.getItem('slcms_theme') || 'light');
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
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Update main app topbar button (when logged in)
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #F59E0B;">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      `;
      btn.title = isDark ? 'Switch to Light Mode (Ctrl+Shift+D)' : 'Switch to Dark Mode (Ctrl+Shift+D)';
    }

    // Update auth page pill button (when on login screen)
    const authPill = document.getElementById('auth-theme-toggle-btn');
    if (authPill) {
      const iconEl = authPill.querySelector('.auth-theme-toggle-icon');
      const labelEl = authPill.querySelector('.auth-theme-toggle-label');
      if (isDark) {
        if (iconEl) iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
        if (labelEl) labelEl.textContent = 'Light Mode';
      } else {
        if (iconEl) iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        if (labelEl) labelEl.textContent = 'Dark Mode';
      }
      authPill.title = isDark ? 'Switch to Light Mode (Ctrl+Shift+D)' : 'Switch to Dark Mode (Ctrl+Shift+D)';
    }
  },

  renderAuthenticatedApp() {
    document.getElementById('app-root').innerHTML = `
      <!-- Mobile Sidebar Backdrop -->
      <div id="sidebar-backdrop" class="sidebar-backdrop" onclick="App.closeMobileSidebar()"></div>

      <!-- 1. FIXED LEFT SIDEBAR -->
      <aside id="app-sidebar" class="sidebar">
        <!-- Sidebar Header & Logo with Clean Close Button on Mobile -->
        <div class="sidebar-header" style="display: flex; align-items: center; justify-content: space-between;">
          <div class="flex items-center gap-2.5" style="min-width: 0; flex: 1; cursor: pointer;" onclick="App.navigate('dashboard'); App.closeMobileSidebar();" title="SLCMS Dashboard">
            <div class="sidebar-logo" style="padding: 0; background: transparent; border: none; flex-shrink: 0;">
              <img src="assets/SLCMS.png" data-setting-image="logoUrl" alt="SLCMS Emblem" style="width: 38px; height: 38px; border-radius: 50%; display: block; object-fit: contain; box-shadow: 0 0 10px rgba(200, 155, 60, 0.4);">
            </div>
            <div class="sidebar-brand-text">
              <div class="brand-title" data-setting="shortName">SLCMS</div>
              <div class="brand-subtitle" data-setting="systemName">Smart Legal Case Management</div>
            </div>
          </div>
          <button class="mobile-drawer-close-btn" onclick="App.closeMobileSidebar()" aria-label="Close navigation drawer" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Navigation Items List (Dynamic RBAC) -->
        <nav id="sidebar-nav-list" class="sidebar-nav"></nav>

        <!-- Sidebar User Footer -->
        <div class="sidebar-footer">
          <div class="sidebar-user-card">
            <div class="sidebar-user-header">
              <div class="user-display-avatar avatar avatar-sm avatar-ring-gold"></div>
              <div class="user-details">
                <div class="user-display-name user-name">Loading...</div>
                <div class="user-display-role user-role-badge">...</div>
                <div class="user-status-row">
                  <span class="status-indicator-dot"></span>
                  <span class="user-status-text">ACTIVE</span>
                </div>
              </div>
            </div>
            <div class="sidebar-user-actions">
              <button type="button" class="btn btn-sidebar-logout" onclick="App.logout()" title="Sign out of SLCMS" style="width: 100%;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
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
            
            <!-- Mobile SLCMS Brand Header (Visible on Mobile) -->
            <div class="mobile-topbar-brand" onclick="App.navigate('dashboard')">
              <span class="mobile-topbar-title"><span data-setting="shortName">SLCMS</span><span style="color: var(--color-gold, #C89B3C);">.</span></span>
              <span id="mobile-topbar-page-label" class="mobile-topbar-subtitle">DASHBOARD</span>
            </div>

            <div class="breadcrumb-area">
              <h2 id="topbar-page-title" class="page-title">Executive Dashboard</h2>
              <div class="breadcrumb-trail">
                <a href="javascript:void(0)" onclick="App.navigate('dashboard')" data-setting="organizationName">SLCMS Law Firm</a>
                <span class="breadcrumb-sep">/</span>
                <span id="topbar-breadcrumb-current" class="breadcrumb-current">Workspace</span>
              </div>
            </div>
          </div>

          <!-- Executive Center Telemetry & Security Capsule (Replaces search bar) -->
          <div class="topbar-center-telemetry">
            <div class="topbar-telemetry-badge">
              <span class="telemetry-live-dot"></span>
              <span class="telemetry-live-text">SECURE CHAMBERS</span>
              <span class="telemetry-sep">&bull;</span>
              <span class="telemetry-meta">TLS 1.3 ENCRYPTED</span>
            </div>
            <div class="topbar-firm-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span data-setting="organizationName">SLCMS Law Firm</span>
            </div>
          </div>

          <!-- Topbar Right Actions -->
          <div class="topbar-right">
            <!-- Notification Bell with Pulsing Indicator -->
            <button class="topbar-icon-btn topbar-notif-btn" onclick="App.openNotifications()" title="Security Alerts & Court Deadlines">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              <span class="notification-dot"></span>
            </button>

            <!-- Executive User Profile Pill (Desktop Only) -->
            <div class="topbar-user-profile-pill topbar-btn-hide-mobile" onclick="App.openUserProfileModal()" title="View Profile & Credentials">
              <div class="user-display-avatar avatar avatar-sm avatar-ring-seablue">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80" alt="User Profile">
              </div>
              <div class="topbar-user-meta">
                <span class="user-display-name topbar-user-name">System Administrator</span>
                <span class="user-display-role topbar-user-role">Administrator</span>
              </div>
              <svg class="topbar-user-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </header>

        <!-- 3. CENTRAL DYNAMIC CONTENT CONTAINER -->
        <main id="main-content-container" class="content-area"></main>

        <!-- System Branding & Governance Footer -->
        <footer class="app-system-footer" style="padding: 10px 24px; font-size: 0.74rem; color: var(--color-text-muted); border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div><span data-setting="systemName">Smart Legal Case Management System</span> &bull; <span data-setting="organizationName">Somba Legal Chambers</span></div>
          <div><span data-setting="shortName">SLCMS</span> Enterprise &bull; <span data-setting="officialEmail">info@sombalegal.co.tz</span> &bull; <span data-setting="phoneNumber">+255 754 000 111</span></div>
        </footer>
      </div>

      <!-- 4. MOBILE BOTTOM NAVIGATION BAR (hidden on desktop via CSS) -->
      <nav id="mobile-bottom-nav" class="mobile-bottom-nav" role="navigation" aria-label="Mobile Navigation">
        <!-- 1. Dashboard -->
        <button class="mobile-nav-item active" id="mob-nav-dashboard" onclick="App.navigate('dashboard');" aria-label="Dashboard">
          <div class="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <span class="mobile-nav-label">Dashboard</span>
        </button>

        <!-- 2. Cases -->
        <button class="mobile-nav-item" id="mob-nav-cases" onclick="App.navigate('cases');" aria-label="Cases">
          <div class="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span class="mobile-nav-label">Cases</span>
        </button>

        <!-- 3. Clients -->
        <button class="mobile-nav-item" id="mob-nav-clients" onclick="App.navigate('clients');" aria-label="Clients">
          <div class="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span class="mobile-nav-label">Clients</span>
        </button>

        <!-- 4. Tasks -->
        <button class="mobile-nav-item" id="mob-nav-tasks" onclick="App.navigate('tasks');" aria-label="Tasks">
          <div class="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span class="mobile-nav-label">Tasks</span>
        </button>

        <!-- 5. More -->
        <button class="mobile-nav-item" id="mob-nav-more" onclick="App.toggleSidebar();" aria-label="More Options">
          <div class="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/>
            </svg>
          </div>
          <span class="mobile-nav-label">More</span>
        </button>
      </nav>
    `;


    this.updateUserUI();
    this.renderSidebarNav();
    this.updateThemeButton();
    if (typeof AICopilot !== 'undefined') {
      AICopilot.init();
    }
    
    // Restore route from URL hash on page refresh, or use pending/default route
    const hashRoute = window.location.hash ? window.location.hash.replace(/^[#\/]+/, '').trim() : '';
    const rawRoleInit = SLCMS_STATE.currentUser?.role;
    const roleInit = (function(r) {
      if (!r) return 'Lawyer';
      const up = String(r).toUpperCase().replace(/[\s_-]+/g, '');
      if (up === 'CLIENT') return 'Client';
      if (up === 'ADMINISTRATOR' || up === 'ADMIN' || up === 'SYSTEMADMINISTRATOR') return 'Administrator';
      if (up === 'SENIORLAWYER' || up === 'MANAGINGPARTNER' || up === 'SENIORCOUNSEL') return 'Senior Lawyer';
      if (up.includes('LEGALOFFICER') || up === 'LEGALOFFICER') return 'Legal Officer';
      if (up === 'LAWYER' || up === 'ASSOCIATELAWYER' || up === 'JUNIORLAWYER') return 'Lawyer';
      if (up === 'LEGALCLERK' || up === 'CLERK') return 'Legal Clerk';
      return r;
    })(rawRoleInit);

    // If no hash in URL (fresh load), pick the role-appropriate default dashboard
    let defaultRoute;
    if (roleInit === 'Client') {
      defaultRoute = 'client-dashboard';
    } else if (roleInit === 'Administrator' || roleInit === 'Managing Partner') {
      defaultRoute = 'admin-dashboard';
    } else if (roleInit === 'Legal Officer') {
      defaultRoute = 'legal-requests';
    } else {
      defaultRoute = 'dashboard';
    }

    const targetRoute = this.pendingRedirectRoute || hashRoute || defaultRoute;
    this.pendingRedirectRoute = null;
    this.navigate(targetRoute);
    this.resetInactivityTimer();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openSidebar') === 'true') {
      setTimeout(() => {
        this.toggleSidebar();
      }, 300);
    }
    if (urlParams.get('openDrawer') === 'true' && typeof AICopilot !== 'undefined') {
      setTimeout(() => {
        AICopilot.openDrawer();
      }, 300);
    }
    if (urlParams.get('registerSampleCase') === 'true') {
      SLCMS_STATE.addCase({
        id: 'case-firm-001',
        caseNumber: 'LIT/2026/0088',
        title: 'Serengeti Breweries Ltd v Trax Logistics Ltd',
        caseType: 'Commercial Litigation',
        status: 'Active',
        lawyer: 'Adv. Robert Kasoma',
        client: 'Serengeti Breweries Ltd'
      });
    }

    const openModalParam = urlParams.get('openModal');
    if (openModalParam === 'createUser') {
      setTimeout(() => {
        if (typeof AdminView !== 'undefined' && AdminView.openCreateUserModal) {
          AdminView.openCreateUserModal();
          if (urlParams.get('assignCaseNow') === 'true') {
            setTimeout(() => {
              const chk = document.getElementById('cu-assign-case-toggle');
              if (chk) {
                chk.checked = true;
                AdminView.toggleProvisionCaseAssignment(true);
              }
              const modalBody = document.querySelector('.adm-prov-body');
              if (modalBody) {
                modalBody.scrollTop = modalBody.scrollHeight;
              }
            }, 100);
          }
        }
      }, 250);
    } else if (openModalParam === 'assignUser') {
      setTimeout(() => {
        if (typeof AdminView !== 'undefined' && AdminView.openAssignUserModal) {
          AdminView.openAssignUserModal();
        }
      }, 250);
    } else if (openModalParam === 'newCase') {
      setTimeout(() => {
        if (typeof CasesView !== 'undefined' && CasesView.openNewCaseModal) {
          CasesView.openNewCaseModal();
        }
      }, 250);
    }
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

    // Unsaved changes warning
    window.addEventListener('beforeunload', (e) => {
      if (typeof AdminView !== 'undefined' && Object.keys(AdminView.unsavedSections || {}).length > 0) {
        e.preventDefault();
        e.returnValue = '';
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

    const sessionMins = (typeof AppSettings !== 'undefined')
      ? parseInt(AppSettings.get('sessionDurationMinutes', 60), 10)
      : ((typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.systemSettings?.sessionDurationMinutes) || 60);
    const warnMins = Math.max(1, sessionMins - 2);

    this.inactivityWarningTimer = setTimeout(() => {
      this.triggerInactivityWarning();
    }, warnMins * 60 * 1000);

    this.inactivityTimer = setTimeout(() => {
      this.forceInactivityLogout();
    }, sessionMins * 60 * 1000);
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

  // Sensitive Action — requires current user's password for destructive operations
  promptSensitiveAuth(actionTitle, onConfirm) {
    const u = SLCMS_STATE.currentUser;
    if (!u) return;
    this._pendingSensitiveAction = onConfirm;
    this.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1rem;">Security Confirmation Required</h3>
          <p style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.15rem;">Re-enter your password to proceed with: <strong>${actionTitle}</strong></p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div class="form-group">
          <label class="form-label">Your Current Password</label>
          <input type="password" id="sensitive-pass-input" class="form-control" placeholder="Enter your password" autocomplete="current-password">
          <div id="sensitive-pass-error" class="form-error-msg hidden" style="font-size:0.82rem;"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="App.verifySensitiveAuth(btoa('${actionTitle}'))">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          Confirm
        </button>
      </div>
    `);
    setTimeout(() => document.getElementById('sensitive-pass-input')?.focus(), 100);
  },

  verifySensitiveAuth(encodedTitle) {
    const input = document.getElementById('sensitive-pass-input');
    const err = document.getElementById('sensitive-pass-error');
    if (!input || !input.value) {
      if (err) { err.innerText = 'Password is required.'; err.classList.remove('hidden'); }
      return;
    }

    // Validate against the current user's real database record
    const u = SLCMS_STATE.currentUser;
    const dbUser = u ? SLCMS_STATE.users.find(x => x.id === u.id) : null;
    const isValid = dbUser && SLCMS_STATE.verifyPassword(input.value, dbUser.passwordHash || dbUser.password_hash, dbUser.passwordPlain);

    if (!isValid) {
      if (err) { err.innerText = 'Incorrect password. Please try again.'; err.classList.remove('hidden'); }
      return;
    }

    this.closeModal();
    if (this._pendingSensitiveAction) {
      this._pendingSensitiveAction();
      this._pendingSensitiveAction = null;
    }
  },

  navigate(route, params = null) {
    // Automatically close mobile menu/drawer when any navigation occurs
    if (typeof this.closeMobileSidebar === 'function') {
      this.closeMobileSidebar();
    }

    const rawRoute = (route || '').trim();
    let cleanRoute = rawRoute.replace(/^[\/#]+/, '');

    // 1. Strict Protected Pages Check (Section 13)
    if (!this.isLoggedIn) {
      if (cleanRoute === 'change-first-password' && typeof AuthView !== 'undefined' && AuthView.currentViewMode === 'first_login_password_change') {
        document.getElementById('app-root').innerHTML = AuthView.render();
        return;
      }
      this.pendingRedirectRoute = cleanRoute;
      document.getElementById('app-root').innerHTML = AuthView.render();
      this.showToast('Please sign in to continue.', 'info');
      return;
    }

    // Check Role Restrictions (Direct URLs cannot bypass role restrictions - Section 13)
    const navUser = SLCMS_STATE.currentUser || {};
    const rawNavRole = navUser.role || navUser.jobTitle || navUser.roleLabel || navUser.roleTitle || '';
    const role = (function(r) {
      if (!r) return 'Lawyer';
      const up = String(r).toUpperCase().replace(/[\s_-]+/g, '');
      if (up === 'CLIENT') return 'Client';
      if (up === 'ADMINISTRATOR' || up === 'ADMIN' || up === 'SYSTEMADMINISTRATOR') return 'Administrator';
      if (up === 'SENIORLAWYER' || up === 'MANAGINGPARTNER' || up === 'SENIORCOUNSEL') return 'Senior Lawyer';
      if (up.includes('LEGALOFFICER') || up === 'LEGALOFFICER') return 'Legal Officer';
      if (up === 'LAWYER' || up === 'ASSOCIATELAWYER' || up === 'JUNIORLAWYER') return 'Lawyer';
      if (up === 'LEGALCLERK' || up === 'CLERK') return 'Legal Clerk';
      return r;
    })(rawNavRole);

    // Zero-Trust Client Portal Guard (Clients cannot access staff areas - Requirement 11)
    if (role === 'Client') {
      const allowedClientRoutes = [
        'client-dashboard', 'client-requests', 'client-cases', 
        'client-invoices', 'client-upload-proof', 'client-receipts',
        'client-messages', 'client-documents', 'client-notifications',
        'client-appointments', 'client-profile', 'client-billing'
      ];
      if (!allowedClientRoutes.includes(cleanRoute)) {
        this.showToast('Access restricted: Law firm staff area is protected.', 'warning');
        cleanRoute = 'client-requests';
      }
    }

    // Administrator Separation of Duties Guard (Legal practice documents, communications & AI drafting restricted)
    if (role === 'Administrator') {
      if (cleanRoute === 'documents' || cleanRoute === 'ai-drafting' || cleanRoute === 'ai-draft-assistant' || cleanRoute === 'reports' || cleanRoute === 'case-assignments' || cleanRoute === 'admin-assignments' || cleanRoute === 'communications' || cleanRoute === 'case-tracking') {
        const container = document.getElementById('main-content-container');
        if (container) {
          container.innerHTML = `
            <div class="card empty-state animate-fade" style="padding: 4rem 2rem; text-align: center; max-width: 620px; margin: 3rem auto; border-top: 4px solid var(--color-warning, #F59E0B);">
              <div style="width: 72px; height: 72px; margin: 0 auto 1.5rem auto; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h2 style="color: #92400E; margin-bottom: 0.6rem; font-size: 1.5rem; font-family: var(--font-heading);">
                Separation of Duties Restriction
              </h2>
              <p style="color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 1.5rem; font-size: 0.92rem;">
                Under law firm data protection and ethical governance standards, administrative personnel do not have access to legal documents, communications &amp; tracking, AI drafting, client reports, or case assignment. These functions are exclusively managed by practicing advocates and senior lawyers.
              </p>
              <button class="btn btn-primary" onclick="App.navigate('dashboard')">Return to Admin Dashboard</button>
            </div>
          `;
        } else {
          this.showAccessRestrictedModal('Access Restricted', 'This module is restricted to practicing advocates and senior lawyers under law firm separation of duties.');
        }
        return;
      }
    }

    // Strict Senior Lawyer & Managing Partner module for case assignments
    if (cleanRoute === 'case-assignments' || cleanRoute === 'admin-assignments') {
      if (role !== 'Managing Partner' && role !== 'Senior Lawyer') {
        const container = document.getElementById('main-content-container');
        if (container && typeof AdminView !== 'undefined') {
          container.innerHTML = AdminView.renderAccessDeniedView();
        } else {
          this.showAccessRestrictedModal('Access Restricted', 'Access restricted. Only Senior Lawyers and Managing Partners can manage case assignments.');
        }
        return;
      }
    } else if (cleanRoute.startsWith('admin') || cleanRoute === 'user-management' || cleanRoute === 'settings' || cleanRoute === 'backup' || cleanRoute === 'activity-logs') {
      if (role !== 'Administrator' && role !== 'Managing Partner') {
        const container = document.getElementById('main-content-container');
        if (container && typeof AdminView !== 'undefined') {
          container.innerHTML = AdminView.renderAccessDeniedView();
        } else {
          this.showAccessRestrictedModal('Administrator Access Required', 'Access restricted. Your assigned role does not permit this action.');
        }
        return;
      }
    }

    // Role-specific workspace guards
    if (cleanRoute === 'senior-lawyer/dashboard' && role !== 'Senior Lawyer' && role !== 'Administrator') {
      const container = document.getElementById('main-content-container');
      if (container && typeof AdminView !== 'undefined') {
        container.innerHTML = AdminView.renderAccessDeniedView();
      } else {
        this.showAccessRestrictedModal('Access Restricted', 'Access restricted. Your assigned role does not permit this action.');
      }
      return;
    }

    if (cleanRoute === 'lawyer/dashboard' && role !== 'Lawyer' && role !== 'Administrator') {
      const container = document.getElementById('main-content-container');
      if (container && typeof AdminView !== 'undefined') {
        container.innerHTML = AdminView.renderAccessDeniedView();
      } else {
        this.showAccessRestrictedModal('Access Restricted', 'Access restricted. Your assigned role does not permit this action.');
      }
      return;
    }

    if (cleanRoute === 'clerk/dashboard' && role !== 'Legal Clerk' && role !== 'Administrator') {
      const container = document.getElementById('main-content-container');
      if (container && typeof AdminView !== 'undefined') {
        container.innerHTML = AdminView.renderAccessDeniedView();
      } else {
        this.showAccessRestrictedModal('Access Restricted', 'Access restricted. Your assigned role does not permit this action.');
      }
      return;
    }

    this.currentRoute = cleanRoute;
    window.location.hash = '#' + cleanRoute;

    // Sync mobile bottom navigation active state
    if (typeof this.updateMobileNav === 'function') {
      this.updateMobileNav(cleanRoute);
    }

    const activeRouteMap = {
      'admin/dashboard': 'dashboard',
      'admin-dashboard': 'dashboard',
      'senior-lawyer/dashboard': 'dashboard',
      'lawyer/dashboard': 'dashboard',
      'clerk/dashboard': 'dashboard',
      'user-management': 'admin-users',
      'admin-users': 'admin-users',
      'settings': 'admin-settings',
      'admin-settings': 'admin-settings',
      'admin-security': 'activity-logs',
      'admin-logs': 'activity-logs',
      'admin-security-activity': 'activity-logs',
      'activity-logs': 'activity-logs',
      'case-assignments': 'case-assignments',
      'admin-assignments': 'case-assignments',
      'backup': 'admin-backup',
      'admin-backup': 'admin-backup',
      'ai-draft-assistant': 'ai-drafting',
      'ai-drafting': 'ai-drafting',
      'legal-ai': 'legal-ai',
      'ai-assistant': 'legal-ai',
      'case-tracking': 'communications',
      'communications': 'communications',
      'client-messages': 'client-messages',
      'message-generator': 'client-messages',
      'documents': 'documents',
      'cases': 'cases',
      'clients': 'clients',
      'tasks': 'tasks',
      'case-library': 'case-library',
      'reports': 'reports',
      'legal-requests': 'legal-requests',
      'client-dashboard': 'client-dashboard',
      'client-requests': 'client-requests',
      'client-cases': 'client-cases',
      'client-invoices': 'client-invoices',
      'client-upload-proof': 'client-upload-proof',
      'client-receipts': 'client-receipts',
      'client-messages': 'client-messages',
      'client-documents': 'client-documents',
      'client-notifications': 'client-notifications',
      'client-appointments': 'client-appointments',
      'client-profile': 'client-profile',
      'billing-create-invoice': 'billing-create-invoice',
      'billing-proofs': 'billing-proofs',
      'billing-verify': 'billing-verify',
      'legal-officer-assign': 'legal-officer-assign',
      'billing-receipts': 'billing-receipts',
      'billing-record': 'billing-record',
      'legal-officer-notifications': 'legal-officer-notifications'
    };
    if (role === 'Legal Officer' && cleanRoute === 'dashboard') {
      activeRouteMap['dashboard'] = 'legal-requests';
    }
    const effectiveRoute = activeRouteMap[cleanRoute] || cleanRoute;

    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(link => {
      if (link.dataset.route === effectiveRoute) {
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
      'admin/dashboard': 'Admin Dashboard',
      'admin-dashboard': 'Admin Dashboard',
      'senior-lawyer/dashboard': 'Senior Lawyer Dashboard',
      'lawyer/dashboard': 'Lawyer Dashboard',
      'clerk/dashboard': 'Legal Clerk Dashboard',
      'legal-requests': 'Legal Assistance Requests & Intake',
      'client-dashboard': 'Client Dashboard',
      'client-requests': 'My Legal Requests',
      'client-cases': 'My Cases',
      'client-invoices': 'Invoices',
      'client-upload-proof': 'Upload Payment Proof',
      'client-receipts': 'Payment Receipts',
      'client-messages': 'Messages',
      'client-documents': 'Documents Vault',
      'client-notifications': 'Notifications & Activity Log',
      'client-appointments': 'Appointments & Court Dates',
      'client-profile': 'My Profile',
      'billing-create-invoice': 'Create and Send Invoice',
      'billing-proofs': 'Payment Proofs Verification',
      'billing-verify': 'Verify or Reject Payment',
      'legal-officer-assign': 'Assign Available Lawyer',
      'billing-receipts': 'Payment Receipts',
      'billing-record': 'Record Payment',
      'legal-officer-notifications': 'Notifications & Alerts',
      'admin-users': 'Users',
      'users': 'Users',
      'admin-security': 'Security',
      'security': 'Security',
      'system-reports': 'System Reports',
      'admin-reports': 'System Reports',
      'case-assignments': 'Case Assignments',
      'activity-logs': 'Security Activity',
      'admin-security-activity': 'Security Activity',
      'admin-settings': 'System Settings',
      'admin-backup': 'Backup',
      'backup': 'Backup',
      'user-management': 'Users',
      'settings': 'System Settings',
      'admin-cases-matters': 'Cases and Matters',
      'dashboard': (role === 'Administrator' || role === 'Managing Partner') ? 'Admin Dashboard' : ((role === 'Client') ? 'Client Dashboard' : 'Dashboard'),
      'cases': 'Cases and Matters',
      'clients': 'Clients Directory',
      'client-messages': 'Client Message Generator',
      'message-generator': 'Client Message Generator',
      'documents': 'Document Vault',
      'tasks': 'Tasks and Deadlines',
      'communications': 'Communications and Tracking',
      'case-tracking': 'Case Tracking & Timeline',
      'ai-drafting': 'SLCMS AI Drafting',
      'ai-draft-assistant': 'SLCMS AI Drafting',
      'legal-ai': 'Tanzania Legal AI',
      'ai-assistant': 'Tanzania Legal AI',
      'case-library': 'Case Library',
      'reports': (role === 'Administrator') ? 'System Reports' : 'Executive Reports & Analytics'
    };

    const pageTitleElem = document.getElementById('topbar-page-title');
    if (pageTitleElem) {
      pageTitleElem.innerText = titleMap[cleanRoute] || 'Legal Workspace';
    }

    const mobileLabelElem = document.getElementById('mobile-topbar-page-label');
    if (mobileLabelElem) {
      let pageName = (titleMap[cleanRoute] || 'Dashboard')
        .replace(/^(Admin|Senior Lawyer|Lawyer|Legal Clerk)\s+/i, '')
        .toUpperCase();
      if (cleanRoute === 'ai-assistant') {
        pageName = 'AI DOCS';
      } else if (cleanRoute === 'case-library') {
        pageName = 'LIBRARY';
      } else if (cleanRoute === 'tasks') {
        pageName = 'TASKS';
      }
      mobileLabelElem.innerText = pageName;
    }

    // Render Content
    const container = document.getElementById('main-content-container');
    if (!container) return;
    container.classList.toggle('ai-view-active', cleanRoute === 'ai-assistant');
    document.body.classList.toggle('ai-page-active', cleanRoute === 'ai-assistant');
    
    // Strictly isolate AI Copilot FAB: ONLY active on the Lawyer Page / Lawyer Dashboard
    const currentUser = (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.currentUser) ? SLCMS_STATE.currentUser : null;
    const isLawyerRole = (function(r, u) {
      const roleStr = String(r || (u && u.role) || '').toLowerCase();
      const titleStr = String((u && (u.jobTitle || u.roleLabel || u.roleTitle)) || '').toLowerCase();
      return roleStr.includes('lawyer') || titleStr.includes('lawyer') || roleStr.includes('advocate') || titleStr.includes('advocate');
    })(role, currentUser);

    const isLawyerDashboardPage = isLawyerRole && (
      cleanRoute === 'lawyer/dashboard' ||
      cleanRoute === 'senior-lawyer/dashboard' ||
      cleanRoute === 'lawyer-dashboard' ||
      cleanRoute === 'senior-lawyer-dashboard' ||
      cleanRoute === 'dashboard' ||
      cleanRoute === ''
    );

    document.body.classList.toggle('is-lawyer-page', Boolean(isLawyerDashboardPage));

    try {
      if (typeof AICopilot !== 'undefined' && typeof AICopilot.updateFabVisibility === 'function') {
        AICopilot.updateFabVisibility();
      } else {
        const copilotFab = document.getElementById('ai-copilot-fab');
        if (copilotFab) {
          if (!isLawyerDashboardPage) {
            copilotFab.style.setProperty('display', 'none', 'important');
            copilotFab.style.setProperty('opacity', '0', 'important');
            copilotFab.style.setProperty('pointer-events', 'none', 'important');
          } else if (!document.body.classList.contains('copilot-open')) {
            copilotFab.style.setProperty('display', 'flex', 'important');
            copilotFab.style.setProperty('opacity', '1', 'important');
            copilotFab.style.setProperty('pointer-events', 'auto', 'important');
          }
        }
      }
    } catch (fabErr) {
      console.warn('AI Copilot visibility check notice:', fabErr);
    }

    try {
      switch (cleanRoute) {
        case 'client-dashboard':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('dashboard') : '<div class="card p-6">Client Dashboard loading...</div>';
          break;
        case 'client-requests':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('requests') : '<div class="card p-6">Client Requests loading...</div>';
          break;
        case 'client-cases':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('cases') : '<div class="card p-6">Client Cases loading...</div>';
          break;
        case 'client-invoices':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('invoices') : '<div class="card p-6">Client Invoices loading...</div>';
          break;
        case 'client-upload-proof':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('upload-proof') : '<div class="card p-6">Upload Payment Proof loading...</div>';
          break;
        case 'client-receipts':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('receipts') : '<div class="card p-6">Client Receipts loading...</div>';
          break;
        case 'client-notifications':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('notifications') : '<div class="card p-6">Client Notifications loading...</div>';
          break;
        case 'client-messages':
          // Role-aware routing: Clients see their portal chat; Staff see the message generator + inbox
          if (role === 'Client') {
            container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('messages') : '<div class="card p-6">Client Messages loading...</div>';
          } else {
            // Staff (Lawyer, Senior Lawyer, Legal Officer, Legal Clerk) — render the message generator with client inbox
            if (role === 'Administrator') {
              App.showToast('Client Messaging is restricted to authorized legal staff.', 'info');
              App.navigate('dashboard');
              break;
            }
            if (params && typeof ClientMessagesView !== 'undefined') {
              if (params.caseId) ClientMessagesView.selectedCaseId = params.caseId;
              if (params.messageType) ClientMessagesView.selectedMessageType = params.messageType;
              if (params.language) ClientMessagesView.selectedLanguage = params.language;
              if (params.channel) ClientMessagesView.selectedChannel = params.channel;
              ClientMessagesView.syncSelectedCaseDetails();
              ClientMessagesView.generateDraft(false);
              if (params.openConfirm) {
                setTimeout(() => ClientMessagesView.promptSendConfirmation(), 250);
              }
            }
            container.innerHTML = typeof ClientMessagesView !== 'undefined' ? ClientMessagesView.render() : '<div class="card p-6">Client Message Generator loading...</div>';
            if (typeof ClientMessagesView !== 'undefined' && typeof ClientMessagesView.initListeners === 'function') {
              setTimeout(() => ClientMessagesView.initListeners(), 50);
            }
          }
          break;
        case 'client-documents':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('documents') : '<div class="card p-6">Client Documents loading...</div>';
          break;
        case 'client-appointments':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('appointments') : '<div class="card p-6">Client Appointments loading...</div>';
          break;
        case 'client-profile':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('profile') : '<div class="card p-6">Client Profile loading...</div>';
          break;
        case 'client-billing':
          container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('billing') : (typeof BillingView !== 'undefined' ? BillingView.renderClientView() : '<div class="card p-6">Client Billing loading...</div>');
          break;
        case 'billing':
        case 'invoices':
        case 'fee-statements':
          if (role === 'Client') {
            container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('billing') : (typeof BillingView !== 'undefined' ? BillingView.renderClientView() : '<div class="card p-6">Client Billing loading...</div>');
          } else {
            container.innerHTML = typeof BillingView !== 'undefined' ? BillingView.render() : '<div class="card p-6">Billing Simulation loading...</div>';
          }
          break;
        case 'legal-requests':
          container.innerHTML = typeof LegalRequestsView !== 'undefined' ? LegalRequestsView.render() : '<div class="card p-6">Legal Requests loading...</div>';
          break;
        case 'billing-create-invoice':
          if (typeof BillingView !== 'undefined') {
            BillingView.currentTab = 'invoices';
            container.innerHTML = BillingView.render();
            setTimeout(() => {
              if (this.currentRoute === 'billing-create-invoice') {
                BillingView.openCreateInvoiceModal();
              }
            }, 60);
          } else {
            container.innerHTML = '<div class="card p-6">Billing loading...</div>';
          }
          break;
        case 'billing-proofs':
        case 'billing-verify':
          if (typeof BillingView !== 'undefined') {
            BillingView.currentTab = 'proofs';
            container.innerHTML = BillingView.render();
          } else {
            container.innerHTML = '<div class="card p-6">Payment Proofs loading...</div>';
          }
          break;
        case 'legal-officer-assign':
          if (role !== 'Senior Lawyer' && role !== 'Administrator') {
            App.showToast('Lawyer assignment is restricted to Senior Lawyers.', 'warning');
            App.navigate('legal-requests');
          } else if (typeof CasesView !== 'undefined' && typeof CasesView.renderCaseAssignmentsView === 'function') {
            container.innerHTML = CasesView.renderCaseAssignmentsView();
          } else if (typeof AdminView !== 'undefined') {
            AdminView.activeTab = 'assignments';
            container.innerHTML = AdminView.render();
          }
          break;
        case 'billing-receipts':
          if (typeof BillingView !== 'undefined') {
            BillingView.currentTab = 'receipts';
            container.innerHTML = BillingView.render();
          } else {
            container.innerHTML = '<div class="card p-6">Receipts loading...</div>';
          }
          break;
        case 'billing-record':
          if (typeof BillingView !== 'undefined') {
            BillingView.currentTab = 'record';
            container.innerHTML = BillingView.render();
          } else {
            container.innerHTML = '<div class="card p-6">Record Payment loading...</div>';
          }
          break;
        case 'legal-officer-notifications':
          container.innerHTML = `
            <div class="legal-officer-notifs animate-fade" style="max-width: 900px; margin: 0 auto; padding-bottom: 2rem;">
              <div class="view-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <h1 class="page-title">Notifications &amp; Workflow Alerts</h1>
                  <p class="text-secondary" style="font-size: 0.88rem; margin: 0;">Operational updates for new client requests, payment proofs, and lawyer assignments.</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="App.markAllNotificationsRead(); App.refreshCurrentView();">Mark all read</button>
              </div>
              <div class="card" style="padding: 1.5rem;">
                ${(SLCMS_STATE.notifications || []).length === 0 ? `
                  <div style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔔</div>
                    <h4>No new notifications</h4>
                    <p style="font-size: 0.85rem;">System will alert you when clients submit requests or upload payment proofs.</p>
                  </div>
                ` : `
                  <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${(SLCMS_STATE.notifications || []).map(n => `
                      <div style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; border-radius: 8px; border: 1px solid var(--color-border); background: ${n.read ? 'var(--color-surface)' : 'rgba(245, 158, 11, 0.05)'}; border-left: 4px solid ${n.type === 'danger' ? '#EF4444' : (n.type === 'success' ? '#10B981' : 'var(--color-gold)')};">
                        <div style="font-size: 1.3rem;">${n.icon || '📌'}</div>
                        <div style="flex: 1;">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: var(--color-primary); font-size: 0.92rem;">${n.title || 'System Notification'}</strong>
                            <span style="font-size: 0.75rem; color: var(--color-text-muted);">${n.time || 'Recently'}</span>
                          </div>
                          <p style="font-size: 0.84rem; color: var(--color-text-secondary); margin: 0.35rem 0 0 0; line-height: 1.45;">${n.message || ''}</p>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>
          `;
          break;
        case 'dashboard':
          // Always route based on the logged-in user's own role — never leak admin view to non-admins
          if (role === 'Client') {
            container.innerHTML = typeof ClientPortalView !== 'undefined' ? ClientPortalView.render('dashboard') : '<div class="card p-6">Client Dashboard loading...</div>';
          } else if (role === 'Administrator' || role === 'Managing Partner') {
            AdminView.activeTab = 'dashboard';
            container.innerHTML = AdminView.render();
            if (typeof loadAdminDashboard === 'function') {
              loadAdminDashboard();
            } else if (typeof AdminView.loadDashboardSummary === 'function') {
              AdminView.loadDashboardSummary();
            }
          } else if (role === 'Legal Officer') {
            container.innerHTML = typeof LegalRequestsView !== 'undefined' ? LegalRequestsView.render() : '<div class="card p-6">Legal Requests loading...</div>';
          } else {
            // Lawyers, Senior Lawyers, Legal Clerks all get their own dashboard
            container.innerHTML = DashboardView.render();
            DashboardView.initCharts();
          }
          break;
        case 'admin/dashboard':
        case 'admin-dashboard':
          AdminView.activeTab = 'dashboard';
          container.innerHTML = AdminView.render();
          if (typeof loadAdminDashboard === 'function') {
            loadAdminDashboard();
          } else if (typeof AdminView.loadDashboardSummary === 'function') {
            AdminView.loadDashboardSummary();
          }
          break;
        case 'legal-officer/dashboard':
        case 'legal-officer-dashboard':
          container.innerHTML = typeof LegalRequestsView !== 'undefined' ? LegalRequestsView.render() : '<div class="card p-6">Legal Requests loading...</div>';
          break;
        case 'senior-lawyer/dashboard':
        case 'lawyer/dashboard':
        case 'clerk/dashboard':
          container.innerHTML = DashboardView.render();
          DashboardView.initCharts();
          break;
        case 'admin-users':
        case 'user-management':
          AdminView.activeTab = 'users';
          container.innerHTML = AdminView.render();
          break;
        case 'case-assignments':
        case 'admin-assignments':
          AdminView.activeTab = 'assignments';
          container.innerHTML = AdminView.render();
          break;
        case 'admin-security':
        case 'activity-logs':
        case 'admin-security-activity':
        case 'admin-logs':
          AdminView.activeTab = 'security';
          container.innerHTML = AdminView.render();
          break;
        case 'system-reports':
        case 'admin-reports':
          AdminView.activeTab = 'reports';
          container.innerHTML = AdminView.render();
          break;
        case 'admin-settings':
        case 'settings':
          AdminView.activeTab = 'settings';
          container.innerHTML = AdminView.render();
          break;
        case 'admin-backup':
        case 'backup':
          AdminView.activeTab = 'backup';
          container.innerHTML = AdminView.render();
          break;
        case 'admin-cases-matters':
          AdminView.activeTab = 'dashboard';
          container.innerHTML = AdminView.render();
          break;
        case 'my-cases':
        case 'cases':
          try {
            if (params && params.filter === 'attention') {
              CasesView.selectedFilterStatus = 'Attention';
            }
            if (params && params.scope) {
              CasesView.viewScope = params.scope;
            }
            container.innerHTML = CasesView.render();
          } catch (error) {
            console.error('Admin Cases rendering failed:', error);
            if (typeof CasesView !== 'undefined' && typeof CasesView.renderPageError === 'function') {
              container.innerHTML = CasesView.renderPageError('Cases could not be displayed. Please refresh or contact the system administrator.');
            } else {
              container.innerHTML = `
                <div class="card" style="padding: 3rem 1.5rem; text-align: center; margin: 1.5rem 0; border: 1px solid #FCA5A5; background: #FEF2F2; border-radius: 8px;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚠️</div>
                  <h3 style="color: #991B1B; font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">Matter Service Notice</h3>
                  <p style="color: #7F1D1D; max-width: 500px; margin: 0 auto 1.25rem auto; line-height: 1.5;">
                    Cases could not be displayed. Please refresh or contact the system administrator.
                  </p>
                  <button class="btn btn-secondary btn-sm" onclick="location.reload()">Refresh Page</button>
                </div>
              `;
            }
          }
          break;
        case 'clients':
          if (role === 'Administrator') {
            App.showToast('Clients Directory is managed by legal staff.', 'info');
            App.navigate('dashboard');
            break;
          }
          container.innerHTML = ClientsView.render();
          break;
        case 'documents':
          container.innerHTML = typeof DocumentsView !== 'undefined' ? DocumentsView.render() : '<div class="card p-6">Documents module loading...</div>';
          break;
        case 'tasks':
          if (role === 'Administrator') {
            App.showToast('Tasks & Deadlines is managed by legal practitioners.', 'info');
            App.navigate('dashboard');
            break;
          }
          container.innerHTML = TasksView.render();
          break;
        case 'communications':
        case 'case-tracking':
          container.innerHTML = typeof CommunicationsView !== 'undefined' ? CommunicationsView.render() : '<div class="card p-6">Communications and Tracking module loading...</div>';
          break;
        case 'message-generator':
          // Legacy route alias — handled identically to client-messages for staff
          if (role === 'Administrator') {
            App.showToast('Client Messaging is restricted to authorized legal staff.', 'info');
            App.navigate('dashboard');
            break;
          }
          if (params && typeof ClientMessagesView !== 'undefined') {
            if (params.caseId) ClientMessagesView.selectedCaseId = params.caseId;
            if (params.messageType) ClientMessagesView.selectedMessageType = params.messageType;
            if (params.language) ClientMessagesView.selectedLanguage = params.language;
            if (params.channel) ClientMessagesView.selectedChannel = params.channel;
            ClientMessagesView.syncSelectedCaseDetails();
            ClientMessagesView.generateDraft(false);
            if (params.openConfirm) {
              setTimeout(() => ClientMessagesView.promptSendConfirmation(), 250);
            }
          }
          container.innerHTML = typeof ClientMessagesView !== 'undefined' ? ClientMessagesView.render() : '<div class="card p-6">Client Message Generator loading...</div>';
          if (typeof ClientMessagesView !== 'undefined' && typeof ClientMessagesView.initListeners === 'function') {
            setTimeout(() => ClientMessagesView.initListeners(), 50);
          }
          break;
        case 'ai-drafting':
        case 'ai-draft-assistant':
          if (role === 'Administrator' || role === 'Legal Officer' || role === 'Lawyer') {
            App.navigate('dashboard');
            break;
          }
          container.innerHTML = typeof AIDraftAssistantView !== 'undefined' ? AIDraftAssistantView.render() : '<div class="card p-6">AI Drafting Studio loading...</div>';
          break;
        case 'legal-research':
        case 'legal-ai':
        case 'ai-assistant':
          if (role === 'Administrator' || role === 'Legal Officer') {
            App.navigate('reports');
            break;
          }
          if (params) {
            if (params.mode) AIAssistantView.activeMode = params.mode;
            if (params.subPage) AIAssistantView.subPage = params.subPage;
            if (params.step) AIAssistantView.wizardStep = parseInt(params.step) || 1;
            if (params.category) AIAssistantView.selectedDocCategory = params.category;
            if (params.docType) AIAssistantView.selectedDocType = params.docType;
            if (params.tab) AIAssistantView.myDocumentsTab = params.tab;
            if (params.docId) {
              const doc = AIAssistantView.myDocuments.find(d => d.id === params.docId);
              if (doc) {
                AIAssistantView.generatedDoc = doc;
                AIAssistantView.selectedCaseId = doc.caseId;
                AIAssistantView.selectedDocType = doc.docType;
                AIAssistantView.subPage = 'preview';
              }
            }
          } else if (cleanRoute === 'legal-ai' || cleanRoute === 'legal-research') {
            AIAssistantView.activeMode = 'research';
          }
          container.innerHTML = AIAssistantView.render();
          break;
        case 'case-library':
          if (role === 'Administrator' || role === 'Legal Officer') {
            App.navigate('reports');
            break;
          }
          if (params && params.filter && typeof CaseLibraryView !== 'undefined') {
            CaseLibraryView.activeCategory = params.filter === 'ready' ? 'READY_FOR_AI' : 'ALL';
          }
          container.innerHTML = (typeof CaseLibraryView !== 'undefined') ? CaseLibraryView.render() : '<div class="card" style="padding:3rem;text-align:center;"><p>Case Library loading...</p></div>';
          break;
        case 'my-profile':
        case 'profile':
          this.openUserProfileModal();
          break;
        case 'reports':
          if (role === 'Administrator') {
            AdminView.activeTab = 'reports';
            container.innerHTML = AdminView.render();
          } else {
            container.innerHTML = typeof ReportsView !== 'undefined' ? ReportsView.render() : '<div class="card p-6">Generated Reports loading...</div>';
            if (typeof ReportsView !== 'undefined' && typeof ReportsView.initCharts === 'function') {
              setTimeout(() => ReportsView.initCharts(), 50);
            }
          }
          break;
        default:
          if (role === 'Administrator') {
            AdminView.activeTab = 'dashboard';
            container.innerHTML = AdminView.render();
          } else {
            container.innerHTML = DashboardView.render();
            DashboardView.initCharts();
          }
      }
    } catch (err) {
      console.error(`Error rendering view '${cleanRoute}':`, err);
      container.innerHTML = `
        <div class="card" style="padding: 2.5rem; text-align: center; margin: 2rem auto; max-width: 600px;">
          <h3 style="color: var(--color-danger); margin-bottom: 0.5rem;">⚠️ Rendering Notice</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">${err.message}</p>
          <button class="btn btn-gold" onclick="App.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }

    if (cleanRoute !== 'ai-assistant' || (typeof AIAssistantView !== 'undefined' && AIAssistantView.conversation && AIAssistantView.conversation.length === 0)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Support direct launch for automated test / verification
    try {
      const qp = new URLSearchParams(window.location.search);
      if (qp.get('action') === 'addcase' || qp.get('modal') === 'addcase') {
        setTimeout(() => {
          if (typeof CasesView !== 'undefined' && typeof CasesView.openNewCaseModal === 'function') {
            CasesView.openNewCaseModal();
            if (qp.get('sample') === 'true' || qp.get('autofill') === 'sample') {
              CasesView.loadTanzaniaSampleCase();
            }
            if (qp.get('step')) {
              CasesView.goToNewCaseStep(parseInt(qp.get('step')));
            }
            if (qp.get('dup') === 'true') {
              CasesView.newCaseDuplicateMatch = {
                title: 'Abdallah Salum Muwinge v Halima Ismail',
                caseNumber: 'PC Civil Appeal No. 69 of 2018',
                court: 'High Court of Tanzania',
                year: '2020',
                citation: '[2020] TZHC 10045',
                parties: [{ name: 'Abdallah Salum Muwinge' }, { name: 'Halima Ismail' }],
                id: 'case-101'
              };
              CasesView.renderNewCaseModal();
            }
          }
        }, 120);
      }
      if (typeof AppSettings !== 'undefined') {
        AppSettings.apply();
      }
    } catch(e){}
  },

  refreshCurrentView() {
    this.navigate(this.currentRoute);
  },

  // Role switching removed — role is always loaded from the database on login

  getInitials(name) {
    if (!name || typeof name !== 'string') return 'SA';
    const clean = name.replace(/^(adv\.?|advocate|senior advocate|dr\.?|mr\.?|ms\.?|mrs\.?|prof\.?)\s+/i, '').replace(/,.*$/, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return 'US';
  },

  updateUserUI() {
    const u = SLCMS_STATE.currentUser;
    if (!u) return;

    // Check dedicated avatar storage if avatarImg is missing on memory object
    if (!u.avatarImg) {
      const savedAvatar = (u.id && localStorage.getItem('slcms_user_avatar_' + u.id)) ||
                          (u.clientNumber && localStorage.getItem('slcms_user_avatar_' + u.clientNumber)) ||
                          (u.staffId && localStorage.getItem('slcms_user_avatar_' + u.staffId)) ||
                          (u.email && localStorage.getItem('slcms_user_avatar_' + u.email.toLowerCase())) ||
                          localStorage.getItem('slcms_user_avatar_active') ||
                          localStorage.getItem('slcms_avatar_backup');
      if (savedAvatar) {
        u.avatarImg = savedAvatar;
      }
    }

    const initials = this.getInitials(u.name);
    u.avatar = initials;

    const nameElems = document.querySelectorAll('.user-display-name');
    const roleElems = document.querySelectorAll('.user-display-role');
    const avatarElems = document.querySelectorAll('.user-display-avatar');

    nameElems.forEach(el => el.innerText = u.name);
    roleElems.forEach(el => el.innerText = u.roleLabel || u.role);
    avatarElems.forEach(el => {
      if (u.avatarImg) {
        el.innerHTML = `<img src="${u.avatarImg}" alt="${u.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="this.onerror=null; this.parentElement.innerText='${initials}'">`;
        el.className = 'user-display-avatar avatar avatar-sm';
      } else {
        el.innerHTML = `<span style="font-weight: 700; font-size: 11px; color: #FFFFFF;">${initials}</span>`;
        el.className = 'user-display-avatar avatar avatar-sm avatar-navy';
      }
    });

    const profileLabels = document.querySelectorAll('.sidebar-profile-btn-label');
    profileLabels.forEach(el => {
      el.innerText = `${u.role} Profile`;
    });
  },

  openUserProfileModal() {
    if (typeof this.closeMobileSidebar === 'function') {
      this.closeMobileSidebar();
    }
    const u = SLCMS_STATE.currentUser || {};

    // Recover avatar image from localStorage if not loaded in memory
    if (!u.avatarImg) {
      const savedAvatar = (u.id && localStorage.getItem('slcms_user_avatar_' + u.id)) ||
                          (u.clientNumber && localStorage.getItem('slcms_user_avatar_' + u.clientNumber)) ||
                          (u.staffId && localStorage.getItem('slcms_user_avatar_' + u.staffId)) ||
                          (u.email && localStorage.getItem('slcms_user_avatar_' + u.email.toLowerCase())) ||
                          localStorage.getItem('slcms_user_avatar_active') ||
                          localStorage.getItem('slcms_avatar_backup');
      if (savedAvatar) {
        u.avatarImg = savedAvatar;
      }
    }

    const initials = this.getInitials(u.name);
    u.avatar = initials;

    const presets = [
      { name: 'Grace Mdee, Adv.', role: 'Senior Advocate', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=384&q=80' },
      { name: 'Juma Mkwawa, Adv.', role: 'Litigation Partner', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=384&q=80' },
      { name: 'Kaija Kiiguta, Adv.', role: 'Commercial Counsel', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=384&q=80' },
      { name: 'Amina Salum, Adv.', role: 'IP Counsel', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=384&q=80' },
      { name: 'David Croft, Adv.', role: 'Associate Advocate', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=384&q=80' },
      { name: 'Amara Okafor, Adv.', role: 'Arbitration Counsel', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=384&q=80' },
      { name: 'Executive Counsel', role: 'General Counsel', url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=384&q=80' }
    ];

    const isClient = (u.role === 'Client' || u.roleLabel === 'Client');
    const isLawyer = (u.role === 'Senior Lawyer' || u.role === 'Lawyer' || (u.role && u.role.toLowerCase().includes('lawyer')));
    const isAdmin = (u.role === 'Administrator' || (u.role && u.role.toLowerCase().includes('admin')));

    let modalTitle = 'Legal Staff Profile';
    let modalSubtitle = 'SLCMS Registry Operations & Court Filings';
    let heroChipHtml = '';
    let sec1Title = '👤 Legal Staff Information';
    let sec2Title = '🏛️ Registry Operations & Station Assignment';
    let labelTitle = 'Official Position Title';
    let valTitle = u.roleLabel || u.roleTitle || 'Legal Registry Clerk';
    let labelId = 'Clerk Staff Identification';
    let valId = u.staffId || u.employeeId || 'CLK-TZ-104';
    let labelDept = 'Registry Division / Department';
    let valDept = u.department || 'Court Filings & Document Registry';
    let labelField3 = 'Assigned Court Registry';
    let valField3 = u.admissions || 'Commercial Court Sub-Registry, Dar es Salaam';
    let labelField4 = 'Operational Scope & Focus';
    let valField4 = u.practiceAreas || 'Court Process Filing, Summons Service, Registry Docketing';
    let complianceText = '🏛️ Authorized Legal Registry Officer • Designated for receipt, endorsement, and service of formal judicial documents.';

    if (isClient) {
      modalTitle = 'Client Profile & Identity';
      modalSubtitle = 'SLCMS Client Portal • Protected by Attorney-Client Privilege';
      const refId = u.clientNumber || u.clientId || u.staffId || 'CLT-0009';
      heroChipHtml = `
        <span>Reference ID: <strong style="color: #0F172A; font-family: var(--font-mono);">${refId}</strong></span>
        <span>•</span>
        <span>Account: <strong>${u.roleLabel || 'Individual Client'}</strong></span>
        <span>•</span>
        <span>Status: <strong style="color: #047857;">Privileged &amp; Verified</strong></span>
      `;
      sec1Title = '👤 Core Client Information';
      sec2Title = '📋 Client Details &amp; Communication Preferences';
      labelTitle = 'Account Category / Profile Type';
      valTitle = u.roleLabel || 'Individual Client';
      labelId = 'Client Reference Number';
      valId = refId;
      labelDept = 'Preferred Contact Method';
      valDept = u.preferredContact || 'Email & Telephone';
      labelField3 = 'Residential / Physical Address';
      valField3 = u.address || u.officeLocation || 'Kinondoni, Dar es Salaam, Tanzania';
      labelField4 = 'Legal Matter Interests / Service Scope';
      valField4 = u.practiceAreas || 'Civil Litigation, Land Disputes, Commercial Contracts';
      complianceText = '🔒 Attorney-Client Privilege Protection • All communications and matters within SLCMS are encrypted under TLS 1.3 and strictly privileged pursuant to Tanzanian Law.';
    } else if (isLawyer) {
      modalTitle = 'Advocate Profile & Practicing Dossier';
      modalSubtitle = 'Tanganyika Law Society (TLS) Regulated Counsel';
      const rollNo = u.barNumber || u.advocateNumber || u.lawyerNumber || 'TLS/ADV/4829';
      const dept = u.department || 'Commercial Litigation';
      const jurisdiction = u.admissions || 'High Court of Tanzania & Courts Subordinate Thereto';
      heroChipHtml = `
        <span>Roll No: <strong style="color: #0F172A; font-family: var(--font-mono);">${rollNo}</strong></span>
        <span>•</span>
        <span>Division: <strong>${dept}</strong></span>
        <span>•</span>
        <span>Jurisdiction: <strong>High Court</strong></span>
      `;
      sec1Title = '👤 Core Practitioner Information';
      sec2Title = '⚖️ Professional Assignment &amp; Credentials';
      labelTitle = 'Official Practicing Title';
      valTitle = u.roleLabel || u.roleTitle || u.role;
      labelId = 'TLS Lawyer Roll Number (Bar No.)';
      valId = rollNo;
      labelDept = 'Practice Department / Division';
      valDept = dept;
      labelField3 = 'Admitted Court Jurisdiction';
      valField3 = jurisdiction;
      labelField4 = 'Practice Focus / Specialization';
      valField4 = u.practiceAreas || 'Commercial Litigation, Land Law, Civil Disputes';
      complianceText = '⚖️ Tanganyika Law Society Compliance • Advocate duly admitted to the Roll and practicing in full compliance with the Advocates Act.';
    } else if (isAdmin) {
      modalTitle = 'System Administrator Profile';
      modalSubtitle = 'SLCMS Identity & System Governance';
      const admId = u.staffId || u.employeeId || 'ADM-0001';
      const dept = u.department || 'System Governance & Administration';
      heroChipHtml = `
        <span>Admin ID: <strong style="color: #0F172A; font-family: var(--font-mono);">${admId}</strong></span>
        <span>•</span>
        <span>Division: <strong>${dept}</strong></span>
        <span>•</span>
        <span>Scope: <strong>System-Wide Governance</strong></span>
      `;
      sec1Title = '👤 Administrator Information';
      sec2Title = '🛡️ System Governance &amp; Security Scope';
      labelTitle = 'Official Administrative Title';
      valTitle = u.roleLabel || u.roleTitle || 'System Administrator';
      labelId = 'Admin Reference Identifier';
      valId = admId;
      labelDept = 'Governance Department';
      valDept = dept;
      labelField3 = 'Administrative Jurisdiction';
      valField3 = u.admissions || 'Firm-Wide Identity & Security Governance';
      labelField4 = 'Primary Governance Responsibilities';
      valField4 = u.practiceAreas || 'User Provisioning, RBAC Security Audits, Infrastructure';
      complianceText = '🛡️ Zero-Trust Security Enforcement • Multi-factor authentication enforced with tamper-evident cryptographic audit logs.';
    } else {
      // Official / Legal Clerk
      heroChipHtml = `
        <span>Staff ID: <strong style="color: #0F172A; font-family: var(--font-mono);">${valId}</strong></span>
        <span>•</span>
        <span>Division: <strong>${valDept}</strong></span>
        <span>•</span>
        <span>Registry: <strong>Court Filings</strong></span>
      `;
    }

    this.openModal(`
      <div class="modal-header" style="background: #0F172A; color: #FFFFFF; border-top-left-radius: 12px; border-top-right-radius: 12px; padding: 1.15rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div class="flex items-center gap-2.5">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; color: #F8FAFC;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title" style="color: #FFFFFF; margin: 0; font-size: 1.15rem; font-family: var(--font-heading, 'Outfit', sans-serif); font-weight: 700;">
              ${modalTitle}
            </h3>
            <div style="font-size: 0.74rem; color: #94A3B8; margin-top: 0.15rem; display: flex; align-items: center; gap: 0.45rem;">
              <span>${modalSubtitle}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #94A3B8; font-size: 1.1rem; line-height: 1;" title="Close">✕</button>
      </div>

      <div class="modal-body" style="max-height: 75vh; overflow-y: auto; padding: 1.25rem 1.5rem; background: #FAFBFD;">
        
        <!-- HERO IDENTITY CARD -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
            
            <!-- Headshot Avatar with Upload Actions -->
            <div class="avatar-upload-target" onclick="document.getElementById('edit-user-avatar-file').click()" title="Click to Upload Headshot"
                 ondragover="event.preventDefault(); this.classList.add('dragover');"
                 ondragleave="this.classList.remove('dragover');"
                 ondrop="App.handleAvatarDrop(event)"
                 style="position: relative; cursor: pointer;">
              <div class="avatar avatar-xl" style="width: 84px; height: 84px; background: #0F172A; border: 2px solid #CBD5E1; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <img id="profile-modal-preview-img" src="${u.avatarImg || ''}" alt="${u.name}" style="${!u.avatarImg ? 'display:none;' : 'display:block;'}; width: 100%; height: 100%; object-fit: cover;">
                <span id="profile-modal-preview-initials" style="${u.avatarImg ? 'display:none;' : 'display:flex;'}; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 700; color: #FFFFFF;">${initials}</span>
              </div>
              <div class="avatar-upload-overlay" style="border-radius: 50%;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span style="font-size: 0.68rem; margin-top: 2px;">Change</span>
              </div>
              <div class="avatar-camera-badge" title="Change Photo" style="position: absolute; right: 0; bottom: 0; background: #0F172A; color: #FFFFFF; width: 26px; height: 26px; border-radius: 50%; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>

            <!-- Identity Summary & Meta Chips -->
            <div style="flex: 1; min-width: 250px;">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 id="profile-modal-header-name" style="font-size: 1.25rem; color: #0F172A; font-weight: 700; margin: 0;">
                  ${u.name}
                </h3>
                <span style="background: #E2E8F0; color: #1E293B; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                  ${u.roleLabel || u.role}
                </span>
                <span style="background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 9999px;">
                  ● Active Account
                </span>
              </div>

              <!-- Quick Meta Row -->
              <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.4rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                ${heroChipHtml}
              </div>

              <!-- Photo Action Buttons -->
              <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                <input type="file" id="edit-user-avatar-file" accept="image/*" style="display:none;" onchange="App.handleAvatarFileUpload(event)">
                <button type="button" class="btn btn-sm" onclick="document.getElementById('edit-user-avatar-file').click()" style="background: #0F172A; color: #FFFFFF; font-size: 0.76rem; padding: 0.35rem 0.85rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600;">
                  📷 Upload Photo
                </button>
                <button type="button" class="btn btn-sm" onclick="App.togglePresetsGallery()" style="background: #FFFFFF; border: 1px solid #CBD5E1; color: #334155; font-size: 0.76rem; padding: 0.35rem 0.85rem; border-radius: 6px; cursor: pointer;">
                  Presets ▾
                </button>
                <button type="button" class="btn btn-sm" onclick="App.toggleCustomUrlInput()" style="background: #FFFFFF; border: 1px solid #CBD5E1; color: #334155; font-size: 0.76rem; padding: 0.35rem 0.85rem; border-radius: 6px; cursor: pointer;">
                  Image URL
                </button>
                <button type="button" class="btn btn-sm" onclick="App.removeAvatarPhoto()" style="background: transparent; border: none; color: #DC2626; font-size: 0.74rem; padding: 0.35rem 0.55rem; cursor: pointer;" title="Reset to initials badge">
                  Remove Photo
                </button>
              </div>

              <!-- Presets Grid Container -->
              <div id="avatar-presets-container" style="display: none; margin-top: 0.75rem; padding: 0.75rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px;">
                <div style="font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.45rem;">
                  Select Professional Headshot:
                </div>
                <div class="avatar-presets-grid" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  ${presets.map((p) => `
                    <button type="button" class="avatar-preset-btn ${(u.avatarImg === p.url) ? 'active' : ''}" onclick="App.selectPresetAvatar('${p.url}')" title="${p.name} (${p.role})" style="width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 2px solid #E2E8F0; padding: 0; cursor: pointer; transition: transform 0.15s, border-color 0.15s;">
                      <img src="${p.url}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Custom URL Input -->
              <div id="avatar-url-container" style="display: none; margin-top: 0.75rem;">
                <input type="text" id="edit-user-avatar-url" class="form-control" style="font-size: 0.78rem; padding: 0.4rem 0.75rem; height: 32px;" value="${u.avatarImg || ''}" placeholder="Paste direct image link (https://...)..." oninput="App.previewAvatarUrl(this.value)">
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 1: ESSENTIAL IDENTITY & CONTACT -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 0.8rem; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.85rem; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.45rem; display: flex; align-items: center; gap: 0.4rem;">
            ${sec1Title}
          </div>
          
          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 0.75rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label required" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">Full Legal Name</label>
              <input type="text" id="edit-user-name" class="form-control" value="${u.name || ''}" placeholder="e.g. John Doe" oninput="document.getElementById('profile-modal-header-name').innerText = this.value.trim() || 'User'">
              <div class="form-error-msg" id="err-edit-user-name" style="display: none;"></div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label required" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">${labelTitle}</label>
              <input type="text" id="edit-user-role-label" class="form-control" value="${valTitle}">
              <div class="form-error-msg" id="err-edit-user-role-label" style="display: none;"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label required" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">Contact Email Address</label>
              <input type="email" id="edit-user-email" class="form-control" value="${u.email || ''}" placeholder="name@domain.com" style="font-family: var(--font-mono);">
              <div class="form-error-msg" id="err-edit-user-email" style="display: none;"></div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label required" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">Contact Telephone Line</label>
              <input type="tel" id="edit-user-phone" class="form-control" value="${u.phone || ''}" placeholder="+255 700 000 000">
              <div class="form-error-msg" id="err-edit-user-phone" style="display: none;"></div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: CREDENTIALS & SPECIFICATIONS -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 0.8rem; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.85rem; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.45rem; display: flex; align-items: center; gap: 0.4rem;">
            ${sec2Title}
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 0.75rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label required" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">${labelId}</label>
              <input type="text" id="edit-user-bar-no" class="form-control" value="${valId}" ${isClient ? 'readonly style="background:#F8FAFC; color:#64748B; font-family: var(--font-mono); font-weight:600;"' : 'style="font-family: var(--font-mono); font-weight: 600;"'}>
              <div class="form-error-msg" id="err-edit-user-bar-no" style="display: none;"></div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label required" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">${labelDept}</label>
              <input type="text" id="edit-user-dept" class="form-control" value="${valDept}">
              <div class="form-error-msg" id="err-edit-user-dept" style="display: none;"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">${labelField3}</label>
              <input type="text" id="edit-user-admissions" class="form-control" value="${valField3}">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem;">${labelField4}</label>
              <input type="text" id="edit-user-practice-areas" class="form-control" value="${valField4}">
            </div>
          </div>
        </div>

        <!-- SECTION 3: COMPLIANCE STRIP -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
          <div style="font-size: 0.76rem; color: #475569; line-height: 1.45; max-width: 650px;">
            ${complianceText}
          </div>
          <span style="background: #E2E8F0; color: #334155; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">
            Verified Active
          </span>
        </div>

        <!-- Hidden input elements preserving backward compatibility -->
        <input type="hidden" id="edit-user-rate" value="${u.hourlyRate || ''}">
        <input type="hidden" id="edit-user-education" value="${u.education || ''}">
        <input type="hidden" id="edit-user-office" value="${u.officeLocation || u.address || 'Dar es Salaam HQ'}">
        <input type="hidden" id="edit-user-assistant" value="${u.assistantContact || ''}">
        <input type="hidden" id="edit-user-languages" value="${u.languages || 'English, Swahili'}">
        <input type="hidden" id="edit-user-bio" value="${u.bio || ''}">

      </div>

      <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()" style="font-size: 0.88rem; padding: 0.55rem 1.25rem;">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="App.saveUserProfile()" style="background: #0F172A; color: #FFFFFF; font-weight: 600; padding: 0.55rem 1.35rem; font-size: 0.88rem; border-radius: 8px; border: none; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 2px 6px rgba(15,23,42,0.18);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Save Profile Changes</span>
        </button>
      </div>
    `, 'modal-lg');

    // Attach real-time validation listeners to instantly clear errors upon typing
    setTimeout(() => {
      this.attachProfileValidationListeners();
    }, 50);
  },

  attachProfileValidationListeners() {
    const fieldIds = ['edit-user-name', 'edit-user-role-label', 'edit-user-email', 'edit-user-phone', 'edit-user-bar-no', 'edit-user-dept'];
    fieldIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const clearErrorState = () => {
        el.classList.remove('is-invalid');
        const errEl = document.getElementById('err-' + id);
        if (errEl) {
          errEl.innerText = '';
          errEl.style.display = 'none';
        }
      };
      el.addEventListener('input', clearErrorState);
      el.addEventListener('change', clearErrorState);
    });
  },

  validateProfileForm() {
    let isValid = true;
    let firstInvalidField = null;

    const clearError = (fieldId) => {
      const field = document.getElementById(fieldId);
      const errEl = document.getElementById('err-' + fieldId);
      if (field) field.classList.remove('is-invalid');
      if (errEl) {
        errEl.innerText = '';
        errEl.style.display = 'none';
      }
    };

    const setError = (fieldId, message) => {
      const field = document.getElementById(fieldId);
      const errEl = document.getElementById('err-' + fieldId);
      if (field) {
        field.classList.add('is-invalid');
        if (!firstInvalidField) firstInvalidField = field;
      }
      if (errEl) {
        errEl.innerText = message;
        errEl.style.display = 'block';
      }
      isValid = false;
    };

    // 1. Full Legal Name
    const nameVal = document.getElementById('edit-user-name')?.value?.trim();
    if (!nameVal) {
      setError('edit-user-name', 'Full legal name is required.');
    } else if (nameVal.length < 2) {
      setError('edit-user-name', 'Name must contain at least 2 characters.');
    } else if (/^[^a-zA-Z\u00C0-\u024F]+$/.test(nameVal)) {
      setError('edit-user-name', 'Please enter a valid legal name.');
    } else {
      clearError('edit-user-name');
    }

    // 2. Position / Role Label
    const roleVal = document.getElementById('edit-user-role-label')?.value?.trim();
    if (!roleVal) {
      setError('edit-user-role-label', 'Position title / account type is required.');
    } else if (roleVal.length < 2) {
      setError('edit-user-role-label', 'Title must be at least 2 characters.');
    } else {
      clearError('edit-user-role-label');
    }

    // 3. Email
    const emailVal = document.getElementById('edit-user-email')?.value?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      setError('edit-user-email', 'Email address is required.');
    } else if (!emailRegex.test(emailVal)) {
      setError('edit-user-email', 'Please enter a valid email address (e.g. name@domain.com).');
    } else {
      clearError('edit-user-email');
    }

    // 4. Telephone
    const phoneVal = document.getElementById('edit-user-phone')?.value?.trim();
    const phoneDigits = (phoneVal || '').replace(/\D/g, '');
    if (!phoneVal) {
      setError('edit-user-phone', 'Contact telephone number is required.');
    } else if (phoneDigits.length < 7) {
      setError('edit-user-phone', 'Phone number must contain at least 7 digits.');
    } else {
      clearError('edit-user-phone');
    }

    // 5. Reference / Bar No / Staff ID
    const barNoField = document.getElementById('edit-user-bar-no');
    if (barNoField && !barNoField.hasAttribute('readonly')) {
      const barVal = barNoField.value?.trim();
      if (!barVal) {
        setError('edit-user-bar-no', 'Identification reference is required.');
      } else if (barVal.length < 2) {
        setError('edit-user-bar-no', 'Identifier must be at least 2 characters.');
      } else {
        clearError('edit-user-bar-no');
      }
    }

    // 6. Department / Contact Preference
    const deptVal = document.getElementById('edit-user-dept')?.value?.trim();
    if (!deptVal) {
      setError('edit-user-dept', 'Department / preference is required.');
    } else if (deptVal.length < 2) {
      setError('edit-user-dept', 'Field must be at least 2 characters.');
    } else {
      clearError('edit-user-dept');
    }

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
      try {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch(e) {}
    }

    return isValid;
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
        // High-DPI canvas downscaling (max 384x384) for fast persistence & crisp display
        const maxDim = 384;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

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

        this.showToast('Photo loaded! Click "Save Profile Changes" to save permanently.', 'success');
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
      if (initialsSpan) initialsSpan.style.display = 'flex';
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
    if (initialsSpan) initialsSpan.style.display = 'flex';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';

    document.querySelectorAll('.avatar-preset-btn').forEach(b => b.classList.remove('active'));
    this.showToast('Photo removed. Initials badge will be used after saving.', 'info');
  },

  saveUserProfile() {
    if (!this.validateProfileForm()) {
      this.showToast('Please correct the highlighted fields before saving.', 'error');
      return;
    }

    const u = SLCMS_STATE.currentUser;
    if (!u) return;

    const name = document.getElementById('edit-user-name')?.value?.trim();
    const roleLabel = document.getElementById('edit-user-role-label')?.value?.trim();
    const email = document.getElementById('edit-user-email')?.value?.trim();
    const phone = document.getElementById('edit-user-phone')?.value?.trim();
    const barNo = document.getElementById('edit-user-bar-no')?.value?.trim();
    const dept = document.getElementById('edit-user-dept')?.value?.trim();
    const admissions = document.getElementById('edit-user-admissions')?.value?.trim();
    const practiceAreas = document.getElementById('edit-user-practice-areas')?.value?.trim();
    const officeLocation = document.getElementById('edit-user-office')?.value?.trim();

    u.name = name;
    u.roleLabel = roleLabel;
    u.email = email;
    u.phone = phone;
    if (dept) u.department = dept;
    if (officeLocation) {
      u.officeLocation = officeLocation;
      u.address = officeLocation;
    }
    if (practiceAreas) u.practiceAreas = practiceAreas;
    if (admissions) u.admissions = admissions;

    if (u.role === 'Senior Lawyer' || u.role === 'Lawyer') {
      u.barNumber = barNo;
      u.advocateNumber = barNo;
      u.lawyerNumber = barNo;
    } else if (u.role === 'Administrator') {
      u.staffId = barNo;
      u.employeeId = barNo;
    } else if (u.role === 'Client') {
      u.preferredContact = dept;
      u.clientId = barNo || u.clientId || u.clientNumber;
      u.clientNumber = barNo || u.clientNumber || u.clientId;
    } else {
      u.staffId = barNo;
      u.employeeId = barNo;
    }

    // Avatar image resolution
    const previewImg = document.getElementById('profile-modal-preview-img');
    const avatarVal = document.getElementById('edit-user-avatar-url')?.value?.trim();
    if (avatarVal) {
      u.avatarImg = avatarVal;
    } else if (previewImg && previewImg.src && previewImg.style.display !== 'none' && !previewImg.src.endsWith('#') && previewImg.src.length > 5) {
      u.avatarImg = previewImg.src;
    } else {
      u.avatarImg = '';
    }

    // Compute dynamic 2-letter initials
    u.avatar = this.getInitials(u.name);

    // Multi-layer permanent persistence across SessionStorage and LocalStorage
    if (typeof SLCMS_STATE.persistCurrentUser === 'function') {
      SLCMS_STATE.persistCurrentUser();
    } else {
      sessionStorage.setItem('slcms_current_user', JSON.stringify(u));
      localStorage.setItem('slcms_persisted_current_user', JSON.stringify(u));
    }

    // Also persist dedicated avatar keys for 100% guarantee across refresh & session restore
    if (u.avatarImg) {
      if (u.id) localStorage.setItem('slcms_user_avatar_' + u.id, u.avatarImg);
      if (u.clientNumber) localStorage.setItem('slcms_user_avatar_' + u.clientNumber, u.avatarImg);
      if (u.staffId) localStorage.setItem('slcms_user_avatar_' + u.staffId, u.avatarImg);
      if (u.email) localStorage.setItem('slcms_user_avatar_' + u.email.toLowerCase(), u.avatarImg);
      localStorage.setItem('slcms_user_avatar_active', u.avatarImg);
      localStorage.setItem('slcms_avatar_backup', u.avatarImg);
    } else {
      if (u.id) localStorage.removeItem('slcms_user_avatar_' + u.id);
      if (u.clientNumber) localStorage.removeItem('slcms_user_avatar_' + u.clientNumber);
      if (u.staffId) localStorage.removeItem('slcms_user_avatar_' + u.staffId);
      if (u.email) localStorage.removeItem('slcms_user_avatar_' + u.email.toLowerCase());
      localStorage.removeItem('slcms_user_avatar_active');
      localStorage.removeItem('slcms_avatar_backup');
    }

    // Update corresponding record in SLCMS_STATE.users
    if (Array.isArray(SLCMS_STATE.users)) {
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
        if (barNo) {
          foundUser.barNumber = barNo;
          foundUser.advocateNumber = barNo;
          foundUser.staffId = barNo;
        }
      }
      if (typeof SLCMS_STATE.persistUsers === 'function') {
        SLCMS_STATE.persistUsers();
      }
    }

    // If client, also update in SLCMS_STATE.clients if exists
    if (u.role === 'Client' && Array.isArray(SLCMS_STATE.clients)) {
      const cIdx = SLCMS_STATE.clients.findIndex(c => (c.id && c.id === u.id) || (c.email && c.email.toLowerCase() === u.email.toLowerCase()));
      if (cIdx !== -1) {
        SLCMS_STATE.clients[cIdx].name = u.name;
        SLCMS_STATE.clients[cIdx].email = u.email;
        SLCMS_STATE.clients[cIdx].phone = u.phone;
        if (u.avatarImg) SLCMS_STATE.clients[cIdx].avatarImg = u.avatarImg;
      }
    }

    SLCMS_STATE.addAuditLog('User Profile Updated', 'Security & Personnel', `${u.name} (${u.roleLabel || u.role}) - Profile & avatar saved permanently`);
    this.updateUserUI();
    this.closeModal();
    this.showToast('Profile and photo saved permanently!', 'success');
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
    const sbUser = SLCMS_STATE.currentUser || {};
    const rawRole = sbUser.role || sbUser.jobTitle || sbUser.roleLabel || sbUser.roleTitle || '';
    const role = (function(r) {
      if (!r) return 'Lawyer';
      const up = String(r).toUpperCase().replace(/[\s_-]+/g, '');
      if (up === 'CLIENT') return 'Client';
      if (up === 'ADMINISTRATOR' || up === 'ADMIN' || up === 'SYSTEMADMINISTRATOR') return 'Administrator';
      if (up === 'SENIORLAWYER' || up === 'MANAGINGPARTNER' || up === 'SENIORCOUNSEL') return 'Senior Lawyer';
      if (up.includes('LEGALOFFICER') || up === 'LEGALOFFICER') return 'Legal Officer';
      if (up === 'LAWYER' || up === 'ASSOCIATELAWYER' || up === 'JUNIORLAWYER') return 'Lawyer';
      if (up === 'LEGALCLERK' || up === 'CLERK') return 'Legal Clerk';
      return r;
    })(rawRole);
    const navContainer = document.getElementById('sidebar-nav-list');
    if (!navContainer) return;

    // Dynamic database badge values with defaults matching specification
    const casesAttentionCount = (typeof SLCMS_STATE.getCasesRequiringAttentionCount === 'function') 
      ? SLCMS_STATE.getCasesRequiringAttentionCount() 
      : 0;
    const judgmentsCount = (typeof SLCMS_STATE.getDistinctJudgmentsCount === 'function' && SLCMS_STATE.getDistinctJudgmentsCount()) 
      ? SLCMS_STATE.getDistinctJudgmentsCount() 
      : 77;

    // Section label helper
    const sectionLabel = (text) => `<div class="nav-section-title">${text}</div>`;

    // Nav item helper
    const navItem = (route, icon, label, badge = null, badgeAction = null, badgeType = 'default') => {
      let badgeHtml = '';
      if (badge !== null && badge !== undefined && Number(badge) > 0) {
        if (badgeAction || badgeType === 'danger') {
          badgeHtml = `<span class="nav-badge nav-badge-danger" onclick="event.stopPropagation(); ${badgeAction || `App.navigate('${route}')`}; App.closeMobileSidebar();" title="${badge} cases requiring attention" style="cursor: pointer;">${badge}</span>`;
        } else {
          badgeHtml = `<span class="nav-badge nav-badge-info" onclick="event.stopPropagation(); App.navigate('${route}'); App.closeMobileSidebar();" title="${badge} judgments in library" style="cursor: pointer;">${badge}</span>`;
        }
      }
      const isActive = this.currentRoute === route || 
        (route === 'dashboard' && (this.currentRoute === 'admin-dashboard' || (role === 'Legal Officer' && this.currentRoute === 'legal-requests'))) ||
        (route === 'legal-requests' && this.currentRoute === 'dashboard' && role === 'Legal Officer') ||
        (route === 'admin-users' && this.currentRoute === 'user-management') ||
        (route === 'admin-settings' && this.currentRoute === 'settings') ||
        (route === 'admin-security-activity' && (this.currentRoute === 'admin-security' || this.currentRoute === 'admin-logs')) ||
        (route === 'admin-cases-matters' && this.currentRoute === 'admin-cases-matters') ||
        ((route === 'billing-proofs' || route === 'billing-verify') && (this.currentRoute === 'billing-proofs' || this.currentRoute === 'billing-verify'));

      const clickHandler = badgeAction ? badgeAction : `App.navigate('${route}'); App.closeMobileSidebar();`;

      return `
        <a class="nav-item ${isActive ? 'active' : ''}" data-route="${route}" onclick="${clickHandler}" title="${label}">
          <span class="nav-icon">${icon}</span>
          <span>${label}</span>
          ${badgeHtml}
        </a>`;
    };

    const icons = {
      dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
      clients: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      cases: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      documents: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
      tasks: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      communications: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      clientMessages: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg>`,
      aiDrafting: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
      legalAi: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      library: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h6"/></svg>`,
      reports: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="8" y1="18" x2="8" y2="15"/><line x1="16" y1="18" x2="16" y2="9"/></svg>`,
      users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      assignments: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
      activityLogs: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>`,
      settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      backup: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
      security: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      billing: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
    };

    const isAdmin = (role === 'Administrator');

    const isLawyer = (role === 'Lawyer' || role === 'Senior Lawyer');

    const isClerk = (role === 'Legal Clerk');

    let html = '';
    if (isAdmin) {
      html = `
        ${sectionLabel('ADMINISTRATION')}
        ${navItem('dashboard', icons.dashboard, 'Dashboard')}
        ${navItem('admin-users', icons.users, 'Users')}
        ${navItem('admin-security', icons.security, 'Security')}
        ${navItem('system-reports', icons.reports, 'System Reports')}
        ${navItem('admin-settings', icons.settings, 'System Settings')}
        ${navItem('admin-backup', icons.backup, 'Backup')}
      `;
    } else if (isLawyer) {
      html = `
        ${sectionLabel('LAWYER PRACTICE')}
        ${navItem('cases', icons.cases, 'Assigned Cases', casesAttentionCount, "App.navigate('cases', { scope: 'assigned' })", 'danger')}
        ${navItem('clients', icons.clients, 'Client Details')}
        ${navItem('documents', icons.documents, 'Case Documents')}
        ${navItem('tasks', icons.tasks, 'Tasks and Deadlines')}
        ${navItem('client-messages', icons.clientMessages, 'Client Messages')}
        ${navItem('case-tracking', icons.communications, 'Case Progress')}

        ${sectionLabel('LEGAL AI & RESEARCH')}
        ${navItem('case-library', icons.library, 'TanzLII Cases', 77, null, 'info')}
        ${navItem('legal-ai', icons.legalAi, 'Legal Research', judgmentsCount, null, 'info')}
        ${navItem('reports', icons.reports, 'Reports')}

        ${role === 'Senior Lawyer' ? `
          ${sectionLabel('ADMINISTRATION')}
          ${navItem('case-assignments', icons.assignments, 'Case Assignments')}
        ` : ''}
      `;
    } else if (isClerk) {
      html = `
        ${sectionLabel('REGISTRY & CLERKSHIP')}
        ${navItem('dashboard', icons.dashboard, 'Registry Dashboard')}
        ${navItem('cases', icons.cases, 'Cases and Matters', casesAttentionCount, "App.navigate('cases', { filter: 'attention' })", 'danger')}
        ${navItem('documents', icons.documents, 'Documents')}
        ${navItem('tasks', icons.tasks, 'Court Dates & Deadlines')}
        ${navItem('reports', icons.reports, 'Reports')}
      `;
    } else if (role === 'Legal Officer') {
      const storedReqs = (typeof LegalRequestsView !== 'undefined' && LegalRequestsView.getRequests)
        ? LegalRequestsView.getRequests()
        : (JSON.parse(localStorage.getItem('slcms_client_legal_requests') || '[]'));
      const pendingReqCount = Array.isArray(storedReqs)
        ? storedReqs.filter(r => r && (r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'More Information Required')).length
        : 0;
      
      const invs = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
        ? BillingView.getInvoices()
        : (SLCMS_STATE.invoices || []);
      const pendingProofCount = invs.filter(i => i.status === 'VERIFICATION_PENDING' || i.status === 'DEMO_VERIFICATION_PENDING').length;
      const readyForAssignCount = (SLCMS_STATE.cases || []).filter(c => c.status === 'READY_FOR_ASSIGNMENT').length;

      html = `
        ${sectionLabel('LEGAL OFFICER DASHBOARD')}
        ${navItem('legal-requests', icons.cases, 'New Client Requests', pendingReqCount > 0 ? pendingReqCount : null, null, 'warning')}
        ${navItem('billing-create-invoice', icons.billing, 'Create and Send Invoice')}
        ${navItem('billing-proofs', icons.backup, 'Payment Proofs', pendingProofCount > 0 ? pendingProofCount : null, null, 'warning')}
        ${navItem('billing-verify', icons.reports, 'Verify or Reject Payment')}
        ${navItem('cases', icons.clients, 'Clients and Cases')}
        ${navItem('legal-officer-notifications', icons.communications, 'Notifications')}
      `;
    } else if (role === 'Client') {
      html = `
        ${sectionLabel('CLIENT DASHBOARD')}
        ${navItem('client-requests', icons.cases, 'My Requests')}
        ${navItem('client-cases', icons.documents, 'My Cases')}
        ${navItem('client-invoices', icons.billing, 'Invoices')}
        ${navItem('client-upload-proof', icons.backup, 'Upload Payment Proof')}
        ${navItem('client-receipts', icons.reports, 'Receipts')}
        ${navItem('client-messages', icons.clientMessages, 'Messages')}
        ${navItem('client-documents', icons.documents, 'Documents')}
        ${navItem('client-notifications', icons.communications, 'Notifications')}
      `;
    } else {
      // General Administration / Fallback View
      html = `
        ${sectionLabel('CORE OPERATIONS')}
        ${navItem('dashboard', icons.dashboard, 'Dashboard')}

        ${sectionLabel('LEGAL ASSISTANCE')}
        ${navItem('reports', icons.reports, 'Generated Reports')}

        ${role === 'Managing Partner' ? `
          ${sectionLabel('ADMINISTRATION')}
          ${navItem('admin-users', icons.users, 'Users & Security')}
          ${navItem('case-assignments', icons.assignments, 'Case Assignments')}
          ${navItem('admin-settings', icons.settings, 'System Settings')}
          ${navItem('admin-backup', icons.backup, 'Backup')}
        ` : ''}
      `;
    }

    navContainer.innerHTML = html;

    // Synchronize Mobile Bottom Nav for RBAC
    const mobCases = document.getElementById('mob-nav-cases');
    const mobClients = document.getElementById('mob-nav-clients');
    const mobTasks = document.getElementById('mob-nav-tasks');

    if (role === 'Administrator') {
      if (mobCases) {
        mobCases.style.display = '';
        mobCases.setAttribute('onclick', "App.navigate('admin-users');");
        const lbl = mobCases.querySelector('.mobile-nav-label');
        if (lbl) lbl.innerText = 'Users';
        const icn = mobCases.querySelector('.mobile-nav-icon');
        if (icn) icn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
      }
      if (mobClients) {
        mobClients.style.display = '';
        mobClients.setAttribute('onclick', "App.navigate('admin-settings');");
        const lbl = mobClients.querySelector('.mobile-nav-label');
        if (lbl) lbl.innerText = 'Settings';
        const icn = mobClients.querySelector('.mobile-nav-icon');
        if (icn) icn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
      }
      if (mobTasks) {
        mobTasks.style.display = '';
        mobTasks.setAttribute('onclick', "App.navigate('admin-backup');");
        const lbl = mobTasks.querySelector('.mobile-nav-label');
        if (lbl) lbl.innerText = 'Backup';
        const icn = mobTasks.querySelector('.mobile-nav-icon');
        if (icn) icn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
      }
    } else if (role === 'Legal Officer') {
      if (mobCases) {
        mobCases.style.display = '';
        mobCases.setAttribute('onclick', "App.navigate('cases');");
        const lbl = mobCases.querySelector('.mobile-nav-label');
        if (lbl) lbl.innerText = 'Cases';
        const icn = mobCases.querySelector('.mobile-nav-icon');
        if (icn) icn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
      }
      if (mobClients) {
        mobClients.style.display = '';
        mobClients.setAttribute('onclick', "App.navigate('clients');");
        const lbl = mobClients.querySelector('.mobile-nav-label');
        if (lbl) lbl.innerText = 'Clients';
        const icn = mobClients.querySelector('.mobile-nav-icon');
        if (icn) icn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
      }
      if (mobTasks) {
        mobTasks.style.display = '';
        mobTasks.setAttribute('onclick', "App.navigate('tasks');");
        const lbl = mobTasks.querySelector('.mobile-nav-label');
        if (lbl) lbl.innerText = 'Tasks';
        const icn = mobTasks.querySelector('.mobile-nav-icon');
        if (icn) icn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
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

  // Sync mobile bottom nav active state with current route
  updateMobileNav(route) {
    const navMap = {
      'dashboard': 'mob-nav-dashboard',
      'admin-dashboard': 'mob-nav-dashboard',
      'cases': 'mob-nav-cases',
      'case-detail': 'mob-nav-cases',
      'tasks': 'mob-nav-tasks',
      'clients': 'mob-nav-more',
      'admin-users': 'mob-nav-more',
      'admin-security-activity': 'mob-nav-more',
      'admin-settings': 'mob-nav-more',
      'settings': 'mob-nav-more',
      'ai-assistant': 'mob-nav-more',
      'case-library': 'mob-nav-more',
    };

    // Find best match
    let activeId = null;
    const isAdm = (SLCMS_STATE.currentUser?.role === 'Administrator');
    if (isAdm) {
      if (route && (route.startsWith('admin-users') || route.startsWith('user-management'))) {
        activeId = 'mob-nav-cases';
      } else if (route && (route.startsWith('admin-settings') || route.startsWith('settings'))) {
        activeId = 'mob-nav-clients';
      } else if (route && (route.startsWith('admin-backup') || route.startsWith('backup'))) {
        activeId = 'mob-nav-tasks';
      }
    }
    if (!activeId) {
      for (const [key, id] of Object.entries(navMap)) {
        if (route && route.startsWith(key)) {
          activeId = id;
          break;
        }
      }
    }
    if (!activeId) activeId = 'mob-nav-dashboard';

    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.classList.add('active');
  },


  logout() {
    if (typeof this.closeMobileSidebar === 'function') {
      this.closeMobileSidebar();
    }
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
        if (typeof AuthView !== 'undefined') {
          AuthView.portalMode = 'welcome_gate';
        }
        window.location.hash = '';
        this.isLoggedIn = false;
        document.body.classList.remove('is-lawyer-page');
        if (typeof AICopilot !== 'undefined') {
          if (typeof AICopilot.closeDrawer === 'function') AICopilot.closeDrawer();
          if (typeof AICopilot.updateFabVisibility === 'function') AICopilot.updateFabVisibility();
        }
        document.getElementById('app-root').innerHTML = AuthView.render();
        this.showToast('You have securely signed out.', 'info');
      }
    });
  },

  // --- SMART GLOBAL SEARCH SYSTEM ---
  globalSearchState: {
    query: '',
    activeFilter: 'all',
    selectedIndex: -1,
    debounceTimer: null,
    renderedItems: []
  },

  escapeSearchHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  highlightSearchMatch(text, query) {
    if (!text) return '';
    const s = String(text);
    if (!query || !query.trim()) return this.escapeSearchHtml(s);
    const qClean = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safe = this.escapeSearchHtml(s);
    try {
      const regex = new RegExp(`(${qClean})`, 'gi');
      return safe.replace(regex, '<mark style="background: rgba(200,155,60,0.3); color: inherit; padding: 0.05rem 0.25rem; border-radius: 3px; font-weight: 700;">$1</mark>');
    } catch (e) {
      return safe;
    }
  },

  openGlobalSearch() {
    this.globalSearchState.query = '';
    this.globalSearchState.activeFilter = 'all';
    this.globalSearchState.selectedIndex = -1;
    this.globalSearchState.renderedItems = [];

    const role = SLCMS_STATE.currentUser?.role || '';
    const isLawyer = (function(u) {
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })(SLCMS_STATE.currentUser);
    const canUseAIDrafting = role !== 'Lawyer' && role !== 'Administrator' && role !== 'Legal Officer' && role !== 'Client';
    const activeCases = (SLCMS_STATE.cases || []).slice(0, 4);
    const upcomingDeadlines = (typeof TasksView !== 'undefined' && Array.isArray(TasksView.courtEvents) && TasksView.courtEvents.length > 0)
      ? TasksView.courtEvents.slice(0, 3)
      : (SLCMS_STATE.deadlines || []).slice(0, 3);

    this.openModal(`
      <div class="global-search-modal-wrap" style="display: flex; flex-direction: column; max-height: 85vh;">
        <!-- Search Input Bar -->
        <div class="modal-header" style="padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--color-border, #E2E8F0); background: var(--color-surface, #FFFFFF);">
          <div class="input-with-icon w-full" style="display: flex; align-items: center; position: relative;">
            <span class="input-icon" style="position: absolute; left: 0.6rem; color: var(--color-gold, #C89B3C); display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" id="global-modal-search-input" class="form-control"
                   placeholder="Search cases, clients, documents, hearings, precedents, tasks, staff... (Esc to exit)"
                   style="font-size: 1.02rem; padding: 0.65rem 4.5rem 0.65rem 2.65rem; border: 1px solid transparent; background: transparent; box-shadow: none; width: 100%; outline: none;"
                   oninput="App.handleGlobalSearchInput(this.value)" autofocus>
            <div style="position: absolute; right: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
              <span class="badge" style="font-size: 0.68rem; font-family: var(--font-mono, monospace); background: var(--color-surface-subtle, #F1F5F9); color: var(--color-text-muted, #64748B); padding: 0.15rem 0.4rem; border: 1px solid var(--color-border, #CBD5E1); border-radius: 4px;">ESC</span>
              <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="padding: 0.3rem 0.5rem; color: var(--color-text-muted, #64748B);" title="Close">✕</button>
            </div>
          </div>
        </div>

        <!-- Filter Category Tabs -->
        <div id="global-search-filter-bar" style="display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.25rem; border-bottom: 1px solid var(--color-border, #E2E8F0); background: var(--color-surface-subtle, #F8FAFC); overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
          <button class="btn-search-filter active" onclick="App.setGlobalSearchFilter('all')" data-filter="all" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 700; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-primary, #0A192F); color: #FFFFFF; cursor: pointer; transition: all 0.15s;">
            All
          </button>
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('cases')" data-filter="cases" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            ⚖️ Cases
          </button>
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('clients')" data-filter="clients" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            👥 Clients
          </button>
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('documents')" data-filter="documents" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            📁 Documents
          </button>
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('tasks')" data-filter="tasks" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            ✅ Tasks
          </button>
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('hearings')" data-filter="hearings" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            🏛️ Hearings &amp; Deadlines
          </button>
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('precedents')" data-filter="precedents" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            📚 Precedents
          </button>
          ${canUseAIDrafting ? `
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('drafts')" data-filter="drafts" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            ⚡ AI Drafts
          </button>
          ` : ''}
          <button class="btn-search-filter" onclick="App.setGlobalSearchFilter('staff')" data-filter="staff" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border, #CBD5E1); background: var(--color-surface, #FFFFFF); color: var(--color-text-secondary, #475569); cursor: pointer;">
            👤 Staff
          </button>
        </div>

        <!-- Search Results Container -->
        <div class="modal-body" id="global-search-results" style="max-height: 520px; overflow-y: auto; padding: 1rem 1.25rem; background: var(--color-surface, #FFFFFF);">
          <!-- Quick Actions Grid -->
          <div style="margin-bottom: 1.25rem;">
            <div style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted, #64748B); font-weight: 700; margin-bottom: 0.65rem; display: flex; align-items: center; justify-content: space-between;">
              <span>Quick Actions &amp; Workflows</span>
              <span style="font-size: 0.7rem; color: var(--color-text-muted);">Navigate instantly</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.5rem;">
              ${isLawyer ? '' : `
              <div class="p-2.5 flex items-center gap-2.5" style="background: var(--color-surface-subtle, #F8FAFC); border: 1px solid var(--color-border, #E2E8F0); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                   onclick="App.closeModal(); if (typeof CasesView !== 'undefined' && CasesView.openNewCaseModal) CasesView.openNewCaseModal(); else App.navigate('cases');">
                <span style="font-size: 1.15rem; background: rgba(200,155,60,0.15); width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--color-gold, #C89B3C);">➕</span>
                <div>
                  <strong style="font-size: 0.82rem; color: var(--color-primary, #0A192F); display: block;">New Legal Case</strong>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted, #64748B);">Register active matter</span>
                </div>
              </div>

              <div class="p-2.5 flex items-center gap-2.5" style="background: var(--color-surface-subtle, #F8FAFC); border: 1px solid var(--color-border, #E2E8F0); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                   onclick="App.closeModal(); if (typeof TasksView !== 'undefined' && TasksView.openNewTaskModal) TasksView.openNewTaskModal(); else App.navigate('tasks');">
                <span style="font-size: 1.15rem; background: rgba(139,92,246,0.15); width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #8B5CF6;">📝</span>
                <div>
                  <strong style="font-size: 0.82rem; color: var(--color-primary, #0A192F); display: block;">Create Task</strong>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted, #64748B);">Assign deliverable</span>
                </div>
              </div>
              `}

              <div class="p-2.5 flex items-center gap-2.5" style="background: var(--color-surface-subtle, #F8FAFC); border: 1px solid var(--color-border, #E2E8F0); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                   onclick="App.closeModal(); if (typeof TasksView !== 'undefined' && TasksView.openAddDeadlineModal) TasksView.openAddDeadlineModal(); else App.navigate('tasks');">
                <span style="font-size: 1.15rem; background: rgba(245,158,11,0.15); width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #F59E0B;">🏛️</span>
                <div>
                  <strong style="font-size: 0.82rem; color: var(--color-primary, #0A192F); display: block;">Court Hearing</strong>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted, #64748B);">Schedule appearance</span>
                </div>
              </div>

              ${canUseAIDrafting ? `
              <div class="p-2.5 flex items-center gap-2.5" style="background: var(--color-surface-subtle, #F8FAFC); border: 1px solid var(--color-border, #E2E8F0); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                   onclick="App.closeModal(); App.navigate('ai-drafting');">
                <span style="font-size: 1.15rem; background: rgba(16,185,129,0.15); width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #10B981;">⚡</span>
                <div>
                  <strong style="font-size: 0.82rem; color: var(--color-primary, #0A192F); display: block;">AI Legal Drafting</strong>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted, #64748B);">Pleadings &amp; summons</span>
                </div>
              </div>
              ` : ''}

              <div class="p-2.5 flex items-center gap-2.5" style="background: var(--color-surface-subtle, #F8FAFC); border: 1px solid var(--color-border, #E2E8F0); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                   onclick="App.closeModal(); App.navigate('case-library');">
                <span style="font-size: 1.15rem; background: rgba(239,68,68,0.15); width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #EF4444;">📚</span>
                <div>
                  <strong style="font-size: 0.82rem; color: var(--color-primary, #0A192F); display: block;">Tanzania Precedents</strong>
                  <span style="font-size: 0.7rem; color: var(--color-text-muted, #64748B);">77+ judgments</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Cases Quick Jump -->
          ${activeCases.length ? `
            <div style="margin-bottom: 1.25rem;">
              <div style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted, #64748B); font-weight: 700; margin-bottom: 0.5rem;">
                Active Legal Matters
              </div>
              <div class="flex flex-col gap-1.5">
                ${activeCases.map(c => `
                  <div class="p-2 flex items-center justify-between" style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid var(--color-gold, #C89B3C); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                       onclick="App.closeModal(); CasesView.openCaseDetails('${c.id}')">
                    <div class="flex items-center gap-2.5" style="min-width: 0;">
                      <span class="badge" style="font-family: var(--font-mono, monospace); font-size: 0.68rem; background: rgba(200,155,60,0.15); color: var(--color-gold, #C89B3C);">CASE</span>
                      <div style="min-width: 0;">
                        <strong style="font-size: 0.85rem; color: var(--color-primary, #0A192F); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.title}</strong>
                        <div style="font-size: 0.72rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem;">
                          <span style="font-family: var(--font-mono); color: var(--color-gold); font-weight: 600;">${c.caseNumber}</span>
                          <span>•</span>
                          <span>${c.client || 'Client N/A'}</span>
                          ${c.court ? `<span>•</span><span>${c.court}</span>` : ''}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2" style="flex-shrink: 0;">
                      <span class="badge badge-priority-${(c.priority || 'medium').toLowerCase()}">${c.priority || 'Normal'}</span>
                      <span class="badge badge-${(c.status || 'active').toLowerCase().replace(/\s+/g, '')}">${c.status || 'Active'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Upcoming Hearings Quick Jump -->
          ${upcomingDeadlines.length ? `
            <div style="margin-bottom: 1.25rem;">
              <div style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted, #64748B); font-weight: 700; margin-bottom: 0.5rem;">
                Upcoming Statutory Deadlines &amp; Hearings
              </div>
              <div class="flex flex-col gap-1.5">
                ${upcomingDeadlines.map(h => `
                  <div class="p-2 flex items-center justify-between" style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #F59E0B; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                       onclick="App.closeModal(); if (typeof TasksView !== 'undefined' && TasksView.openEventDetails) TasksView.openEventDetails('${h.id}'); else App.navigate('tasks');">
                    <div class="flex items-center gap-2.5">
                      <span class="badge" style="font-family: var(--font-mono, monospace); font-size: 0.68rem; background: rgba(245,158,11,0.15); color: #B45309;">HEARING</span>
                      <div>
                        <strong style="font-size: 0.85rem; color: var(--color-primary, #0A192F);">${h.title}</strong>
                        <div style="font-size: 0.72rem; color: var(--color-text-secondary, #475569);">${h.caseNumber || 'Matter Docket'} • ${h.court || 'Court Room'}</div>
                      </div>
                    </div>
                    <span class="badge" style="background: rgba(245,158,11,0.15); color: #B45309; font-weight: 700; font-family: var(--font-mono); font-size: 0.75rem;">
                      ${h.date || h.time || 'Scheduled'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Search Guide Footer -->
          <div style="padding: 0.65rem 0.85rem; background: var(--color-surface-subtle, #F8FAFC); border-radius: var(--radius-sm, 6px); border: 1px dashed var(--color-border, #CBD5E1); font-size: 0.75rem; color: var(--color-text-muted, #64748B); display: flex; align-items: center; justify-content: space-between;">
            <div>
              💡 <strong>Instant Search:</strong> Type any case # (e.g. <code>CV/2026</code>), client name, advocate, legal citation, document title, or task.
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-muted);">
              Use ↑ ↓ to navigate • Enter to select
            </div>
          </div>
        </div>
      </div>
    `, 'modal-lg');

    // Attach keyboard event handler for up/down navigation and auto-focus
    setTimeout(() => {
      const input = document.getElementById('global-modal-search-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => this.handleGlobalSearchKeyDown(e));
      }
    }, 80);
  },

  setGlobalSearchFilter(category) {
    this.globalSearchState.activeFilter = category;
    const filterBar = document.getElementById('global-search-filter-bar');
    if (filterBar) {
      filterBar.querySelectorAll('.btn-search-filter').forEach(btn => {
        if (btn.dataset.filter === category) {
          btn.style.background = 'var(--color-primary, #0A192F)';
          btn.style.color = '#FFFFFF';
          btn.style.fontWeight = '700';
          btn.classList.add('active');
        } else {
          btn.style.background = 'var(--color-surface, #FFFFFF)';
          btn.style.color = 'var(--color-text-secondary, #475569)';
          btn.style.fontWeight = '600';
          btn.classList.remove('active');
        }
      });
    }

    const input = document.getElementById('global-modal-search-input');
    if (input) {
      this.executeGlobalSearch(input.value);
    }
  },

  handleGlobalSearchKeyDown(e) {
    const items = this.globalSearchState.renderedItems || [];
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.globalSearchState.selectedIndex = (this.globalSearchState.selectedIndex + 1) % items.length;
      this.updateGlobalSearchSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.globalSearchState.selectedIndex = (this.globalSearchState.selectedIndex - 1 + items.length) % items.length;
      this.updateGlobalSearchSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = this.globalSearchState.selectedIndex >= 0 ? this.globalSearchState.selectedIndex : 0;
      const target = items[idx];
      if (target && target.action) {
        target.action();
      }
    }
  },

  updateGlobalSearchSelection() {
    const container = document.getElementById('global-search-results');
    if (!container) return;

    container.querySelectorAll('.global-search-item').forEach((el, idx) => {
      if (idx === this.globalSearchState.selectedIndex) {
        el.style.backgroundColor = 'var(--color-surface-subtle, #F1F5F9)';
        el.style.borderColor = 'var(--color-gold, #C89B3C)';
        el.style.boxShadow = '0 0 0 1px var(--color-gold, #C89B3C)';
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        el.style.backgroundColor = 'var(--color-surface-subtle, #F8FAFC)';
        el.style.boxShadow = 'none';
      }
    });
  },

  handleGlobalSearchInput(val) {
    if (this.globalSearchState.debounceTimer) {
      clearTimeout(this.globalSearchState.debounceTimer);
    }
    this.globalSearchState.debounceTimer = setTimeout(() => {
      this.executeGlobalSearch(val);
    }, 120);
  },

  executeGlobalSearch(val) {
    const container = document.getElementById('global-search-results');
    if (!container) return;

    this.globalSearchState.query = val || '';
    this.globalSearchState.selectedIndex = -1;
    this.globalSearchState.renderedItems = [];

    // Empty query fallback: return to dashboard recommendations
    if (!val || val.trim() === '') {
      this.openGlobalSearch();
      return;
    }

    const q = val.trim().toLowerCase();
    const activeFilter = this.globalSearchState.activeFilter || 'all';
    const role = SLCMS_STATE.currentUser?.role || '';
    const isLawyer = (function(u) {
      if (!u) return false;
      const r = String(u.role || '').toLowerCase();
      const t = String(u.jobTitle || u.roleLabel || u.roleTitle || '').toLowerCase();
      return r.includes('lawyer') || t.includes('lawyer') || r.includes('advocate') || t.includes('advocate');
    })(SLCMS_STATE.currentUser);
    const canSearchAIDrafting = role !== 'Lawyer' && role !== 'Administrator' && role !== 'Legal Officer' && role !== 'Client';

    // Helper: Relevance Scorer
    const scoreItem = (primaryVals, secondaryVals, snippetVal = '') => {
      let score = 0;
      let matchedSnippet = '';
      const tokens = q.split(/\s+/).filter(Boolean);

      primaryVals.forEach(v => {
        if (!v) return;
        const str = String(v).toLowerCase();
        if (str === q) score += 150;
        else if (str.startsWith(q)) score += 90;
        else if (str.includes(q)) score += 50;
        tokens.forEach(t => { if (str.includes(t)) score += 15; });
      });

      secondaryVals.forEach(v => {
        if (!v) return;
        const str = String(v).toLowerCase();
        if (str === q) score += 40;
        else if (str.startsWith(q)) score += 25;
        else if (str.includes(q)) score += 15;
        tokens.forEach(t => { if (str.includes(t)) score += 8; });
        if (!matchedSnippet && str.includes(q)) {
          matchedSnippet = String(v);
        }
      });

      if (snippetVal && !matchedSnippet) {
        const sStr = String(snippetVal).toLowerCase();
        if (sStr.includes(q)) {
          score += 12;
          const matchPos = sStr.indexOf(q);
          const start = Math.max(0, matchPos - 40);
          const end = Math.min(sStr.length, matchPos + q.length + 60);
          matchedSnippet = (start > 0 ? '...' : '') + snippetVal.substring(start, end) + (end < sStr.length ? '...' : '');
        }
      }

      return { score, matchedSnippet };
    };

    // 1. CASES
    const matchCases = [];
    if (activeFilter === 'all' || activeFilter === 'cases') {
      (SLCMS_STATE.cases || []).forEach(c => {
        const primary = [c.title, c.caseNumber, c.client];
        const secondary = [c.court, c.judge, c.status, c.priority, c.category, c.assignedAdvocate || c.advocateName, c.filingDate];
        const { score, matchedSnippet } = scoreItem(primary, secondary, c.description);
        if (score > 0) {
          matchCases.push({ item: c, score, snippet: matchedSnippet });
        }
      });
      matchCases.sort((a, b) => b.score - a.score);
    }

    // 2. CLIENTS
    const matchClients = [];
    if (activeFilter === 'all' || activeFilter === 'clients') {
      (SLCMS_STATE.clients || []).forEach(cl => {
        const primary = [cl.name, cl.company, cl.email];
        const secondary = [cl.phone, cl.type, cl.tin, cl.contactPerson, cl.address, cl.notes];
        const { score, matchedSnippet } = scoreItem(primary, secondary, cl.address || cl.notes);
        if (score > 0) {
          matchClients.push({ item: cl, score, snippet: matchedSnippet });
        }
      });
      matchClients.sort((a, b) => b.score - a.score);
    }

    // 3. DOCUMENTS
    const matchDocs = [];
    if (activeFilter === 'all' || activeFilter === 'documents') {
      (SLCMS_STATE.documents || []).forEach(d => {
        const primary = [d.title, d.fileName, d.caseNumber];
        const secondary = [d.clientName, d.fileType, d.category, d.accessLevel, d.uploadedBy, d.tags];
        const { score, matchedSnippet } = scoreItem(primary, secondary, d.description || d.tags);
        if (score > 0) {
          matchDocs.push({ item: d, score, snippet: matchedSnippet });
        }
      });
      matchDocs.sort((a, b) => b.score - a.score);
    }

    // 4. TASKS
    const matchTasks = [];
    if (activeFilter === 'all' || activeFilter === 'tasks') {
      (SLCMS_STATE.tasks || []).forEach(t => {
        const primary = [t.title, t.caseNumber, t.assignedTo];
        const secondary = [t.caseTitle, t.priority, t.status, t.dueDate, t.category];
        const { score, matchedSnippet } = scoreItem(primary, secondary, t.description);
        if (score > 0) {
          matchTasks.push({ item: t, score, snippet: matchedSnippet });
        }
      });
      matchTasks.sort((a, b) => b.score - a.score);
    }

    // 5. HEARINGS & STATUTORY DEADLINES
    const matchHearings = [];
    if (activeFilter === 'all' || activeFilter === 'hearings') {
      const allHearings = (typeof TasksView !== 'undefined' && Array.isArray(TasksView.courtEvents) && TasksView.courtEvents.length > 0)
        ? TasksView.courtEvents
        : ((SLCMS_STATE.deadlines || []).concat(SLCMS_STATE.courtAttendances || []));

      allHearings.forEach(h => {
        const primary = [h.title, h.caseNumber, h.court];
        const secondary = [h.presiding || h.judge, h.advocate || h.assignedTo, h.type, h.date, h.time, h.statute || h.statutoryReference];
        const { score, matchedSnippet } = scoreItem(primary, secondary, h.description || h.instructions);
        if (score > 0) {
          matchHearings.push({ item: h, score, snippet: matchedSnippet });
        }
      });
      matchHearings.sort((a, b) => b.score - a.score);
    }

    // 6. TANZANIAN PRECEDENTS & JUDICIAL REPOSITORY
    const matchPrecedents = [];
    if (activeFilter === 'all' || activeFilter === 'precedents') {
      (SLCMS_STATE.tanzaniaJudgments || []).forEach(j => {
        const primary = [j.title, j.citation, j.caseNumber];
        const secondary = [j.court, j.category, j.year, j.judge || j.coram, j.tier];
        const snippetText = (typeof j.ratio === 'string' ? j.ratio : '') ||
                            (typeof j.bindingPrinciple === 'string' ? j.bindingPrinciple : '') ||
                            (typeof j.summary === 'string' ? j.summary : '');
        const { score, matchedSnippet } = scoreItem(primary, secondary, snippetText);
        if (score > 0) {
          matchPrecedents.push({ item: j, score, snippet: matchedSnippet });
        }
      });
      matchPrecedents.sort((a, b) => b.score - a.score);
    }

    // 7. AI DRAFTS & SAVED AI DOCUMENTS
    const matchDrafts = [];
    if (canSearchAIDrafting && (activeFilter === 'all' || activeFilter === 'drafts')) {
      const aiDocs = (typeof AIAssistantView !== 'undefined' && Array.isArray(AIAssistantView.myDocuments))
        ? AIAssistantView.myDocuments
        : [];
      const draftsCombined = [...(SLCMS_STATE.legalDrafts || [])];
      aiDocs.forEach(ad => {
        if (!draftsCombined.some(d => d.id === ad.id)) draftsCombined.push(ad);
      });

      draftsCombined.forEach(drf => {
        const primary = [drf.title, drf.documentType || drf.docType, drf.caseNumber];
        const secondary = [drf.clientName, drf.court, drf.status, drf.draftingLawyer, drf.language];
        const { score, matchedSnippet } = scoreItem(primary, secondary, drf.content || drf.preview);
        if (score > 0) {
          matchDrafts.push({ item: drf, score, snippet: matchedSnippet });
        }
      });
      matchDrafts.sort((a, b) => b.score - a.score);
    }

    // 8. STAFF & ADVOCATES
    const matchStaff = [];
    if (activeFilter === 'all' || activeFilter === 'staff') {
      (SLCMS_STATE.users || []).forEach(u => {
        const primary = [u.name || u.full_name, u.username, u.email];
        const secondary = [u.phone, u.role, u.jobTitle, u.department, u.advocateNumber, u.practisingCertNo, u.staffId || u.employeeId];
        const { score, matchedSnippet } = scoreItem(primary, secondary, u.department || u.bio);
        if (score > 0) {
          matchStaff.push({ item: u, score, snippet: matchedSnippet });
        }
      });
      matchStaff.sort((a, b) => b.score - a.score);
    }

    // 9. MATCHING SYSTEM QUICK ACTIONS (Smart Navigation Commands)
    const quickActions = [
      ...(!isLawyer ? [{
        title: 'Register New Legal Matter (Case)',
        keywords: ['new case', 'add case', 'create case', 'file case', 'matter', 'register case'],
        action: () => { App.closeModal(); if (typeof CasesView !== 'undefined' && CasesView.openNewCaseModal) CasesView.openNewCaseModal(); else App.navigate('cases'); },
        badge: 'ACTION',
        icon: '⚖️'
      }] : []),
      ...(!isLawyer ? [{
        title: 'Create Statutory Task / Deliverable',
        keywords: ['new task', 'add task', 'create task', 'assign task', 'todo', 'deliverable'],
        action: () => { App.closeModal(); if (typeof TasksView !== 'undefined' && TasksView.openNewTaskModal) TasksView.openNewTaskModal(); else App.navigate('tasks'); },
        badge: 'ACTION',
        icon: '📝'
      }] : []),
      {
        title: 'Schedule Court Appearance / Deadline',
        keywords: ['hearing', 'schedule hearing', 'court date', 'deadline', 'appearance', 'docket'],
        action: () => { App.closeModal(); if (typeof TasksView !== 'undefined' && TasksView.openAddDeadlineModal) TasksView.openAddDeadlineModal(); else App.navigate('tasks'); },
        badge: 'ACTION',
        icon: '🏛️'
      },
      ...(canSearchAIDrafting ? [{
        title: 'Launch AI Legal Drafting Studio',
        keywords: ['ai draft', 'draft', 'pleading', 'affidavit', 'plaint', 'summons', 'chamber', 'generate document'],
        action: () => { App.closeModal(); App.navigate('ai-drafting'); },
        badge: 'AI STUDIO',
        icon: '⚡'
      }] : []),
      {
        title: 'Search Judicial Precedents & Judgments',
        keywords: ['precedent', 'judgment', 'case library', 'law report', 'coram', 'case law', 'ratio'],
        action: () => { App.closeModal(); App.navigate('case-library'); },
        badge: 'LIBRARY',
        icon: '📚'
      },
      {
        title: 'Open Clients Management Directory',
        keywords: ['client', 'client directory', 'customer', 'corporate client'],
        action: () => { App.closeModal(); App.navigate('clients'); },
        badge: 'DIRECTORY',
        icon: '👥'
      },
      {
        title: 'Upload Legal Document to Vault',
        keywords: ['upload document', 'add document', 'upload file', 'vault', 'filing upload'],
        action: () => { App.closeModal(); if (typeof DocumentsView !== 'undefined' && DocumentsView.openUploadModal) DocumentsView.openUploadModal(); else App.navigate('documents'); },
        badge: 'ACTION',
        icon: '📁'
      },
      {
        title: 'System Settings & Firm Configuration',
        keywords: ['settings', 'config', 'configuration', 'firm settings', 'security settings'],
        action: () => { App.closeModal(); App.navigate('admin-settings'); },
        badge: 'ADMIN',
        icon: '⚙️'
      },
      {
        title: 'Security Audit & Activity Logs',
        keywords: ['audit', 'logs', 'activity logs', 'security audit', 'access log'],
        action: () => { App.closeModal(); App.navigate('activity-logs'); },
        badge: 'AUDIT',
        icon: '🛡️'
      },
      {
        title: 'Database Backup & System Snapshots',
        keywords: ['backup', 'database backup', 'snapshot', 'restore', 'export database'],
        action: () => { App.closeModal(); App.navigate('admin-backup'); },
        badge: 'BACKUP',
        icon: '💾'
      }
    ];

    const matchQuickActions = quickActions.filter(qa => {
      return qa.keywords.some(k => k.includes(q) || q.includes(k)) || qa.title.toLowerCase().includes(q);
    });

    // Total Count
    const totalCount = matchQuickActions.length + matchCases.length + matchClients.length + matchDocs.length +
                       matchTasks.length + matchHearings.length + matchPrecedents.length + matchDrafts.length + matchStaff.length;

    if (totalCount === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; background: var(--color-surface, #FFFFFF);">
          <div style="width: 56px; height: 56px; margin: 0 auto 1rem auto; border-radius: 50%; background: var(--color-surface-subtle, #F1F5F9); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; color: var(--color-text-muted, #64748B);">
            🔍
          </div>
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--color-primary, #0A192F); margin-bottom: 0.35rem;">
            No records found for "${this.escapeSearchHtml(val)}"
          </h3>
          <p style="font-size: 0.84rem; color: var(--color-text-muted, #64748B); max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
            We searched across all active matters, clients, documents, statutory tasks, court hearings, judicial precedents, and staff profiles.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="App.setGlobalSearchFilter('all')">Switch to "All" Category</button>
            ${isLawyer ? '' : `<button class="btn btn-gold btn-sm" onclick="App.closeModal(); if (typeof CasesView !== 'undefined' && CasesView.openNewCaseModal) CasesView.openNewCaseModal(); else App.navigate('cases');">Register New Matter</button>`}
          </div>
        </div>
      `;
      return;
    }

    // Build Rendered HTML
    let resHTML = `
      <div style="font-size: 0.74rem; font-weight: 700; color: var(--color-text-muted, #64748B); margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
        <span>Found <strong>${totalCount}</strong> matching result${totalCount !== 1 ? 's' : ''} across firm records</span>
        <span style="font-size: 0.7rem; color: var(--color-gold, #C89B3C); font-weight: 600;">Ranked by relevance</span>
      </div>
    `;

    // Render Quick Actions
    if (matchQuickActions.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-gold, #C89B3C); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.3rem;">
            <span>⚡ QUICK WORKFLOW ACTIONS</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchQuickActions.map(qa => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({ action: qa.action });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid var(--color-gold, #C89B3C); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div class="flex items-center gap-2.5">
                    <span style="font-size: 1.2rem;">${qa.icon}</span>
                    <div>
                      <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">${this.highlightSearchMatch(qa.title, val)}</strong>
                      <div style="font-size: 0.72rem; color: var(--color-text-secondary, #475569);">Instant platform action</div>
                    </div>
                  </div>
                  <span class="badge badge-gold" style="font-size: 0.68rem; font-weight: 700;">${qa.badge}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render Cases
    if (matchCases.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-primary, #0A192F); margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>⚖️ LEGAL CASES &amp; MATTERS (${matchCases.length})</span>
            <span style="font-size: 0.7rem; color: var(--color-gold, #C89B3C); cursor: pointer;" onclick="App.closeModal(); App.navigate('cases')">View Cases →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchCases.slice(0, 5).map(({ item: c, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => { App.closeModal(); CasesView.openCaseDetails(c.id); }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid var(--color-gold, #C89B3C); border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <div class="flex items-center gap-2">
                      <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${this.highlightSearchMatch(c.title, val)}
                      </strong>
                    </div>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span style="font-family: var(--font-mono); color: var(--color-gold); font-weight: 700;">
                        ${this.highlightSearchMatch(c.caseNumber, val)}
                      </span>
                      <span>•</span>
                      <span>Client: ${this.highlightSearchMatch(c.client, val)}</span>
                      ${c.court ? `<span>•</span><span>${this.highlightSearchMatch(c.court, val)}</span>` : ''}
                      ${c.judge ? `<span>•</span><span>Coram: ${this.highlightSearchMatch(c.judge, val)}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic; background: rgba(0,0,0,0.02); padding: 0.15rem 0.4rem; border-radius: 3px;">
                        ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <div class="flex items-center gap-2" style="flex-shrink: 0;">
                    <span class="badge badge-priority-${(c.priority || 'medium').toLowerCase()}">${c.priority || 'Normal'}</span>
                    <span class="badge badge-${(c.status || 'active').toLowerCase().replace(/\s+/g, '')}">${c.status || 'Active'}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render Clients
    if (matchClients.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #2563EB; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>👥 CLIENTS DIRECTORY (${matchClients.length})</span>
            <span style="font-size: 0.7rem; color: #2563EB; cursor: pointer;" onclick="App.closeModal(); App.navigate('clients')">View Clients →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchClients.slice(0, 5).map(({ item: cl, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => { App.closeModal(); ClientsView.openClientProfile(cl.id); }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #3B82F6; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">
                      ${this.highlightSearchMatch(cl.name, val)}
                    </strong>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span class="badge" style="background: rgba(59,130,246,0.12); color: #2563EB; font-size: 0.68rem;">${cl.type || 'Individual'}</span>
                      ${cl.email ? `<span>•</span><span>${this.highlightSearchMatch(cl.email, val)}</span>` : ''}
                      ${cl.phone ? `<span>•</span><span>${this.highlightSearchMatch(cl.phone, val)}</span>` : ''}
                      ${cl.company ? `<span>•</span><span>Company: ${this.highlightSearchMatch(cl.company, val)}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic;">
                        ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-primary, #0A192F);">
                      ${cl.totalBilled ? `$${cl.totalBilled.toLocaleString()}` : 'Active Client'}
                    </div>
                    <span style="font-size: 0.7rem; color: var(--color-text-muted, #64748B);">${cl.activeCases || 0} active matter(s)</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render Documents
    if (matchDocs.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0284C7; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>📁 DOCUMENT VAULT (${matchDocs.length})</span>
            <span style="font-size: 0.7rem; color: #0284C7; cursor: pointer;" onclick="App.closeModal(); App.navigate('documents')">View Vault →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchDocs.slice(0, 5).map(({ item: d, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => { App.closeModal(); DocumentsView.previewDocument(d.id); }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #0EA5E9; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">
                      ${this.highlightSearchMatch(d.title, val)}
                    </strong>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span style="font-family: var(--font-mono); color: var(--color-text-muted); font-size: 0.7rem;">${this.highlightSearchMatch(d.fileName, val)}</span>
                      ${d.caseNumber ? `<span>•</span><span style="color: var(--color-gold); font-family: var(--font-mono); font-weight: 600;">${this.highlightSearchMatch(d.caseNumber, val)}</span>` : ''}
                      ${d.uploadedBy ? `<span>•</span><span>Uploaded by ${this.highlightSearchMatch(d.uploadedBy, val)}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic;">
                        ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <div class="flex items-center gap-2" style="flex-shrink: 0;">
                    <span class="badge badge-confidential" style="font-size: 0.68rem;">${d.accessLevel || 'CONFIDENTIAL'}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render Tasks
    if (matchTasks.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #7C3AED; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>✅ TASKS &amp; DELIVERABLES (${matchTasks.length})</span>
            <span style="font-size: 0.7rem; color: #7C3AED; cursor: pointer;" onclick="App.closeModal(); App.navigate('tasks')">View Tasks →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchTasks.slice(0, 5).map(({ item: t, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => {
                  App.closeModal();
                  if (typeof TasksView !== 'undefined' && TasksView.openTaskDetailsModal) {
                    TasksView.openTaskDetailsModal(t.id);
                  } else {
                    App.navigate('tasks');
                  }
                }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #8B5CF6; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">
                      ${this.highlightSearchMatch(t.title, val)}
                    </strong>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span>Assigned: ${this.highlightSearchMatch(t.assignedTo, val)}</span>
                      ${t.caseNumber ? `<span>•</span><span style="font-family: var(--font-mono); color: var(--color-gold); font-weight: 600;">${this.highlightSearchMatch(t.caseNumber, val)}</span>` : ''}
                      ${t.dueDate ? `<span>•</span><span style="color: var(--color-danger); font-family: var(--font-mono); font-weight: 600;">Due: ${t.dueDate}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic;">
                        ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <div class="flex items-center gap-2" style="flex-shrink: 0;">
                    <span class="badge badge-priority-${(t.priority || 'medium').toLowerCase()}">${t.priority || 'Medium'}</span>
                    <span class="badge ${t.status === 'completed' ? 'badge-active' : 'badge-onhold'}" style="font-size: 0.68rem;">${t.status}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render Hearings & Statutory Appearances
    if (matchHearings.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #D97706; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>🏛️ COURT HEARINGS &amp; STATUTORY DEADLINES (${matchHearings.length})</span>
            <span style="font-size: 0.7rem; color: #D97706; cursor: pointer;" onclick="App.closeModal(); App.navigate('tasks')">Open Calendar →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchHearings.slice(0, 5).map(({ item: h, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => {
                  App.closeModal();
                  if (typeof TasksView !== 'undefined' && TasksView.openEventDetails) {
                    TasksView.openEventDetails(h.id);
                  } else {
                    App.navigate('tasks');
                  }
                }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #F59E0B; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">
                      ${this.highlightSearchMatch(h.title, val)}
                    </strong>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span style="font-family: var(--font-mono); color: var(--color-gold); font-weight: 600;">${this.highlightSearchMatch(h.caseNumber, val)}</span>
                      ${h.court ? `<span>•</span><span>${this.highlightSearchMatch(h.court, val)}</span>` : ''}
                      ${h.presiding ? `<span>•</span><span>Judge: ${this.highlightSearchMatch(h.presiding, val)}</span>` : ''}
                      ${h.statute ? `<span>•</span><span style="color: #B45309; font-weight: 600;">${this.highlightSearchMatch(h.statute, val)}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic;">
                        ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <span class="badge" style="background: rgba(245,158,11,0.15); color: #B45309; font-weight: 700; font-family: var(--font-mono); font-size: 0.72rem;">
                      ${h.date || h.time || 'Scheduled'}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render Tanzanian Precedents & Judgments
    if (matchPrecedents.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #DC2626; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>📚 TANZANIAN JUDICIAL PRECEDENTS (${matchPrecedents.length})</span>
            <span style="font-size: 0.7rem; color: #DC2626; cursor: pointer;" onclick="App.closeModal(); App.navigate('case-library')">Browse Library →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchPrecedents.slice(0, 5).map(({ item: j, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => {
                  App.closeModal();
                  if (typeof CaseLibraryView !== 'undefined' && CaseLibraryView.openDetail) {
                    CaseLibraryView.openDetail(j.id);
                  } else {
                    App.navigate('case-library');
                  }
                }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #EF4444; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">
                      ${this.highlightSearchMatch(j.title, val)}
                    </strong>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span class="badge badge-gold" style="font-size: 0.68rem; font-family: var(--font-mono);">${this.highlightSearchMatch(j.citation || j.year, val)}</span>
                      <span>•</span>
                      <span>${this.highlightSearchMatch(j.court || 'Court of Appeal', val)}</span>
                      ${j.judge || j.coram ? `<span>•</span><span>Coram: ${this.highlightSearchMatch(j.judge || j.coram, val)}</span>` : ''}
                      ${j.category ? `<span>•</span><span>${j.category}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic; background: rgba(0,0,0,0.02); padding: 0.2rem 0.4rem; border-radius: 3px;">
                        Ratio / Principle: ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <div class="flex items-center gap-1.5" style="flex-shrink: 0;">
                    <span class="badge" style="background: rgba(239,68,68,0.12); color: #DC2626; font-size: 0.68rem; font-weight: 700;">PRECEDENT</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render AI Drafts
    if (matchDrafts.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>⚡ AI LEGAL DRAFTS &amp; DOCUMENTS (${matchDrafts.length})</span>
            <span style="font-size: 0.7rem; color: #059669; cursor: pointer;" onclick="App.closeModal(); App.navigate('ai-drafting')">Drafting Studio →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchDrafts.slice(0, 5).map(({ item: d, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => {
                  App.closeModal();
                  if (typeof AIAssistantView !== 'undefined' && AIAssistantView.openSavedDocument && d.docType) {
                    AIAssistantView.openSavedDocument(d.id);
                  } else if (typeof AIDraftAssistantView !== 'undefined' && AIDraftAssistantView.loadArchivedDraft) {
                    AIDraftAssistantView.loadArchivedDraft(d.id);
                  } else {
                    App.navigate('ai-drafting');
                  }
                }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #10B981; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">
                      ${this.highlightSearchMatch(d.title, val)}
                    </strong>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span class="badge" style="background: rgba(16,185,129,0.12); color: #059669; font-size: 0.68rem; font-weight: 700;">${d.documentType || d.docType || 'AI Draft'}</span>
                      ${d.caseNumber ? `<span>•</span><span style="font-family: var(--font-mono); color: var(--color-gold); font-weight: 600;">${this.highlightSearchMatch(d.caseNumber, val)}</span>` : ''}
                      ${d.clientName ? `<span>•</span><span>Client: ${this.highlightSearchMatch(d.clientName, val)}</span>` : ''}
                      ${d.court ? `<span>•</span><span>${d.court}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic;">
                        ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <span class="badge ${d.status === 'Approved' ? 'badge-active' : 'badge-gold'}" style="font-size: 0.68rem;">
                    ${d.status || 'Draft'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Render Staff & Advocates
    if (matchStaff.length) {
      resHTML += `
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #4F46E5; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
            <span>👤 ADVOCATES &amp; STAFF MEMBERS (${matchStaff.length})</span>
            <span style="font-size: 0.7rem; color: #4F46E5; cursor: pointer;" onclick="App.closeModal(); if (SLCMS_STATE.currentUser?.role === 'Administrator') App.navigate('admin-users');">View Directory →</span>
          </div>
          <div class="flex flex-col gap-1.5">
            ${matchStaff.slice(0, 5).map(({ item: u, snippet }) => {
              const itemIdx = this.globalSearchState.renderedItems.length;
              this.globalSearchState.renderedItems.push({
                action: () => {
                  App.closeModal();
                  if (SLCMS_STATE.currentUser?.role === 'Administrator') {
                    App.navigate('admin-users');
                  } else {
                    App.showToast(`Advocate: ${u.name || u.full_name} (${u.role || u.jobTitle})`, 'info');
                  }
                }
              });
              return `
                <div class="global-search-item p-2 flex items-center justify-between"
                     style="background: var(--color-surface-subtle, #F8FAFC); border-left: 3px solid #6366F1; border-radius: var(--radius-sm, 6px); cursor: pointer; transition: all 0.15s;"
                     onclick="App.navigateToGlobalSearchResult(${itemIdx})">
                  <div style="min-width: 0; padding-right: 0.75rem;">
                    <div class="flex items-center gap-2">
                      <strong style="font-size: 0.86rem; color: var(--color-primary, #0A192F);">
                        ${this.highlightSearchMatch(u.name || u.full_name, val)}
                      </strong>
                      <span class="badge" style="background: rgba(99,102,241,0.12); color: #4F46E5; font-size: 0.68rem;">${u.role || 'Staff'}</span>
                    </div>
                    <div style="font-size: 0.73rem; color: var(--color-text-secondary, #475569); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; flex-wrap: wrap;">
                      <span>${this.highlightSearchMatch(u.email, val)}</span>
                      ${u.phone ? `<span>•</span><span>${this.highlightSearchMatch(u.phone, val)}</span>` : ''}
                      ${u.advocateNumber ? `<span>•</span><span style="font-family: var(--font-mono); color: var(--color-gold);">${this.highlightSearchMatch(u.advocateNumber, val)}</span>` : ''}
                      ${u.department ? `<span>•</span><span>${u.department}</span>` : ''}
                    </div>
                    ${snippet ? `
                      <div style="font-size: 0.71rem; color: var(--color-text-muted, #64748B); margin-top: 0.2rem; font-style: italic;">
                        ${this.highlightSearchMatch(snippet, val)}
                      </div>
                    ` : ''}
                  </div>
                  <span class="badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-danger'}" style="font-size: 0.68rem;">
                    ${u.status || 'ACTIVE'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = resHTML;
  },

  navigateToGlobalSearchResult(index) {
    const item = (this.globalSearchState.renderedItems || [])[index];
    if (item && typeof item.action === 'function') {
      item.action();
    }
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
        <div class="modal-header notif-modal-header" style="padding: 1rem 1.15rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0; flex: 1;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-gold-light); display: flex; align-items: center; justify-content: center; color: var(--color-gold); flex-shrink: 0; box-shadow: 0 2px 6px rgba(200, 155, 60, 0.2);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
            </div>
            <div style="min-width: 0; flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                <h3 class="modal-title" style="font-size: 1.05rem; margin: 0; line-height: 1.2;">Notifications</h3>
                ${unreadCount > 0 ? `<span class="notif-header-badge" style="font-size: 0.65rem; padding: 0.12rem 0.45rem;">${unreadCount} Unread</span>` : `<span class="badge badge-active" style="font-size: 0.62rem; padding: 0.1rem 0.4rem;">All Caught Up</span>`}
              </div>
              <span style="font-size: 0.72rem; color: var(--color-text-secondary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;">Real-time firm docket &amp; hearings</span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
            ${unreadCount > 0 ? `
              <button class="btn btn-ghost btn-sm" style="font-size: 0.74rem; font-weight: 700; color: var(--color-gold); padding: 0.25rem 0.5rem; white-space: nowrap;" onclick="App.markAllNotificationsRead()" title="Mark all notifications as read">
                ✓ Mark all read
              </button>
            ` : ''}
            <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" title="Close" style="width: 32px; height: 32px; min-width: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1rem;">✕</button>
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
    document.body.classList.add('modal-open');
  },

  closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
    if (typeof AICopilot !== 'undefined' && typeof AICopilot.updateFabVisibility === 'function') {
      AICopilot.updateFabVisibility();
    }
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

    // Limit stacked toasts to max 3 to prevent screen obstruction
    while (container.children.length >= 3) {
      container.removeChild(container.firstChild);
    }

    toast.style.cursor = 'pointer';
    toast.title = 'Click to dismiss';
    toast.onclick = () => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    };

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Bootstrap application on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}
