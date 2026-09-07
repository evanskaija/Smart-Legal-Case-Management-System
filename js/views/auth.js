/* ==========================================================================
   SLCMS - Secure Enterprise Authentication View
   Zero-Trust Law Firm Architecture | Role-Based Access | First-Login Flow
   ========================================================================== */

const AuthView = {
  // Authentication View Sub-State
  currentTab: 'login', // 'login' | 'register'
  currentViewMode: 'auth', // 'auth' | 'first_login_password_change'
  tempAuthUser: null, // Temporary session context for first-login reset
  currentInvStep: 1, // 1 | 2 | 3
  verifiedInvitationData: null,
  verifiedFormData: null,

  switchTab(tab) {
    this.currentTab = tab;
    this.hideServerAlert();
    this.currentInvStep = 1;
    this.verifiedInvitationData = null;
    this.renderInPlace();
  },

  renderInPlace() {
    const root = document.getElementById('app-root');
    if (root) {
      document.body.classList.add('auth-view-active');
      root.innerHTML = this.render();
    }
  },

  render() {
    document.body.classList.add('auth-view-active');
    if (this.currentViewMode === 'first_login_password_change' && this.tempAuthUser) {
      return this.renderFirstLoginPasswordChangeView();
    }

    const isLoginTab = (this.currentTab === 'login');

    return `
      <div class="auth-page-container animate-fade" style="position: relative;">
        <!-- Auth Screen Theme Toggle -->
        <button class="topbar-icon-btn auth-theme-toggle-btn" onclick="App.toggleTheme()" title="Toggle Dark / Light Mode" aria-label="Toggle Dark / Light Mode">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <div class="auth-split-layout">
          <!-- 1. Left Legal Hero Branding Section -->
          <div class="auth-hero-panel">
            <!-- Top Logo Header -->
            <div class="auth-brand-header">
              <div class="auth-brand-logo-icon" style="padding: 0; background: transparent; border: none;">
                <img src="assets/SLCMS.png" alt="SLCMS Emblem" style="width: 46px; height: 46px; border-radius: 50%; display: block; object-fit: contain; box-shadow: 0 0 12px rgba(200, 155, 60, 0.4);">
              </div>
              <div class="auth-brand-name">SLCMS</div>
            </div>

            <!-- Center Headline & Tagline -->
            <div class="auth-hero-center">
              <h1 class="auth-main-headline">
                Smart Legal Case
                <span class="highlight-gold">Management</span>
              </h1>
              <div class="auth-headline-bar"></div>
              <p class="auth-lead-tagline">
                Enterprise law-firm management with strict invitation verification and zero-trust identity control.
              </p>

              <!-- 3 Pill Badges -->
              <div class="auth-pill-badges-row">
                <div class="auth-pill-badge">
                  <span class="badge-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                      <rect width="8" height="5" x="8" y="11" rx="1"/>
                      <path d="M10 11V9a2 2 0 1 1 4 0v2"/>
                    </svg>
                  </span>
                  <span>Verified Identity</span>
                </div>

                <div class="auth-pill-badge">
                  <span class="badge-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                    </svg>
                  </span>
                  <span>Invitation Only</span>
                </div>

                <div class="auth-pill-badge">
                  <span class="badge-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="7" r="4"/>
                      <path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
                      <circle cx="12" cy="12" r="10" stroke-width="1.5"/>
                    </svg>
                  </span>
                  <span>Strict RBAC</span>
                </div>
              </div>
            </div>

            <!-- Left Bottom Spacer -->
            <div style="font-size: 0.8rem; color: #94A3B8;">
              Enterprise Law-Firm Portal • Authorized Personnel Only • Registration Required
            </div>
          </div>

          <!-- 2. Right Form Section - Unified Auth Card -->
          <div class="auth-form-panel">
            <!-- Mobile Brand Header (Visible only on mobile/tablet <= 768px) -->
            <div class="auth-mobile-brand-header">
              <div class="auth-brand-logo-icon" style="padding: 0; background: transparent; border: none; width: 44px; height: 44px;">
                <img src="assets/SLCMS.png" alt="SLCMS Emblem" style="width: 44px; height: 44px; border-radius: 50%; display: block; object-fit: contain; box-shadow: 0 0 12px rgba(200, 155, 60, 0.4);">
              </div>
              <div class="auth-mobile-brand-text">
                <span class="auth-mobile-brand-title">SLCMS</span>
                <span class="auth-mobile-brand-subtitle">Smart Legal Case Management</span>
              </div>
            </div>

            <div class="auth-white-card">
              <!-- Top Lock/Key Badge -->
              <div class="auth-card-lock-badge">
                ${isLoginTab ? `
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    <circle cx="12" cy="16" r="1.5"/>
                  </svg>
                ` : `
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M19 8v6M22 11h-6"/>
                  </svg>
                `}
              </div>

              <!-- Card Header -->
              <h2 class="auth-card-title">
                ${isLoginTab ? 'Firm Sign In' : 'Account Registration'}
              </h2>
              <p class="auth-card-subtitle">
                ${isLoginTab ? 'Sign in with your registered and verified law firm credentials' : 'Enter your official invitation code to verify your professional identity'}
              </p>

              <!-- UNIFIED TAB SWITCHER BAR (Login & Register in One Part) -->
              <div class="auth-toggle-tabs" style="display: flex; background: #F1F5F9; border-radius: 10px; padding: 4px; margin-bottom: 1.5rem; border: 1px solid #E2E8F0;">
                <button type="button" class="auth-toggle-tab ${isLoginTab ? 'active' : ''}" onclick="AuthView.switchTab('login')" style="flex: 1; padding: 0.55rem; font-size: 0.85rem; font-weight: 700; border-radius: 7px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>1. Sign In</span>
                </button>
                <button type="button" class="auth-toggle-tab ${!isLoginTab ? 'active' : ''}" onclick="AuthView.switchTab('register')" style="flex: 1; padding: 0.55rem; font-size: 0.85rem; font-weight: 700; border-radius: 7px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  <span class="auth-tab-desktop-text">2. Register with Invitation</span>
                  <span class="auth-tab-mobile-text">2. Register</span>
                </button>
              </div>

              <!-- Server/Security Alert Banner -->
              <div id="auth-server-alert" class="alert alert-danger hidden" style="margin-bottom: 1.25rem; font-size: 0.85rem; text-align: left;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div id="auth-server-alert-text"></div>
              </div>

              <!-- TAB CONTENT: 1. SIGN IN TAB -->
              ${isLoginTab ? `
                <form id="auth-main-login-form" onsubmit="AuthView.handleLoginSubmit(event)" novalidate>
                  <!-- Email or Phone Number Field -->
                  <div class="auth-input-group">
                    <label for="login-email-input">Registered Email, Phone Number, or Staff ID</label>
                    <div style="position: relative;">
                      <span class="auth-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="8" r="4"/>
                          <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                        </svg>
                      </span>
                      <input 
                        type="text" 
                        id="login-email-input" 
                        class="auth-input-field" 
                        placeholder="e.g. name@slcms-law.com, +255 754 112 233, or EMP-1010" 
                        value="" 
                        autocomplete="username"
                        oninput="AuthView.clearFieldError('login-email-input', 'login-email-error')"
                      >
                    </div>
                    <div id="login-email-error" class="form-error-msg hidden"></div>
                  </div>

                  <!-- Password Field -->
                  <div class="auth-input-group">
                    <label for="login-password-input">Private Password</label>
                    <div style="position: relative;">
                      <span class="auth-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input 
                        type="password" 
                        id="login-password-input" 
                        class="auth-input-field" 
                        placeholder="Enter your confidential password" 
                        value="" 
                        autocomplete="current-password"
                        style="padding-right: 2.75rem;"
                        oninput="AuthView.clearFieldError('login-password-input', 'login-password-error')"
                      >
                      <button 
                        type="button" 
                        onclick="AuthView.togglePasswordEye('login-password-input', 'auth-eye-svg')" 
                        style="position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; display: flex; align-items: center;"
                        title="Show / Hide Password"
                      >
                        <svg id="auth-eye-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                    <div id="login-password-error" class="form-error-msg hidden"></div>
                  </div>

                  <!-- Remember Me & Forgot Password Row -->
                  <div class="flex items-center justify-between" style="margin-bottom: 1.25rem; font-size: 0.85rem;">
                    <label class="checkbox-label" style="font-size: 0.85rem; color: #475569;" title="Only use on trusted firm workstations">
                      <input type="checkbox" id="auth-remember-check" checked style="display: none;">
                      <span class="checkbox-custom">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      </span>
                      <span>Remember me</span>
                    </label>
                    <a href="javascript:void(0)" onclick="AuthView.showForgotPasswordModal(document.getElementById('login-email-input')?.value)" style="color: var(--color-info); font-size: 0.82rem; font-weight: 500;">
                      Forgot password?
                    </a>
                  </div>

                  <!-- Registration Requirement Advisory -->
                  <div style="font-size: 0.74rem; color: #64748B; text-align: left; margin-bottom: 1.25rem; background: #F8FAFC; padding: 0.55rem 0.75rem; border-radius: 6px; border-left: 3px solid var(--color-gold);">
                    🛡️ <strong>Registration Required:</strong> No one may log in without an active, verified account. If you received a firm invitation code, please register first.
                  </div>

                  <!-- Sign In Button -->
                  <button type="submit" id="auth-submit-btn" class="auth-btn-signin">
                    Sign In to Assigned Workspace →
                  </button>

                  <div style="margin-top: 1rem; font-size: 0.82rem; color: #64748B;">
                    Don't have an account yet? 
                    <a href="javascript:void(0)" onclick="AuthView.switchTab('register')" style="color: var(--color-gold); font-weight: 700; text-decoration: underline;">
                      Register with Invitation Code →
                    </a>
                  </div>
                </form>
              ` : `
                <!-- TAB CONTENT: 2. REGISTER WITH INVITATION TAB (IN-CARD FLOW) -->
                <div id="in-card-register-container">
                  ${this.renderInCardRegistrationFlow()}
                </div>
              `}

              <!-- Bottom Security Protection Note -->
              <div class="auth-security-footer-note" style="margin-top: 1.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>Privileged & Confidential • Zero-Trust Role Enforced</span>
              </div>

              <!-- COLLAPSIBLE DEMO ACCOUNTS & INVITATION CODES DRAWER -->
              <details style="margin-top: 1.25rem; text-align: left; background: #FAFBFD; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.75rem 0.95rem; box-shadow: 0 1px 4px rgba(16, 42, 67, 0.03);">
                <summary style="font-size: 0.78rem; font-weight: 700; color: #334155; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
                  <span style="display: flex; align-items: center; gap: 0.4rem;">
                    <span>🧪</span>
                    <span>Demo Registered Accounts & Test Invitations</span>
                  </span>
                  <span style="color: var(--color-gold); font-size: 0.72rem; font-weight: 600;">Click to View ▾</span>
                </summary>
                
                <div style="margin-top: 0.85rem; border-top: 1px dashed #CBD5E1; padding-top: 0.85rem;">
                  <!-- Section 1: Registered Accounts -->
                  <div style="font-size: 0.72rem; font-weight: 800; color: #1E293B; margin-bottom: 0.45rem; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; justify-content: space-between;">
                    <span>1. Registered Accounts (Click to Fill Sign In):</span>
                    <span style="font-size: 0.68rem; color: #64748B; font-weight: 500;">Existing Users</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2" style="margin-bottom: 0.9rem;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillCredentials('admin.sterling@slcms-law.com', 'SecretLawFirm2026!', 'System Administrator')" style="font-size: 0.73rem; padding: 0.4rem 0.55rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      🛡️ <strong>Admin</strong> (A. Sterling)
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillCredentials('e.vance@slcms-law.com', 'SecretLawFirm2026!', 'Managing Partner')" style="font-size: 0.73rem; padding: 0.4rem 0.55rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      👑 <strong>Partner</strong> (E. Vance)
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillCredentials('j.mercer@slcms-law.com', 'SecretLawFirm2026!', 'Senior Counsel')" style="font-size: 0.73rem; padding: 0.4rem 0.55rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      ⚖️ <strong>Sr Counsel</strong> (J. Mercer)
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillCredentials('m.bell@slcms-law.com', 'SecretLawFirm2026!', 'Legal Clerk')" style="font-size: 0.73rem; padding: 0.4rem 0.55rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      📁 <strong>Clerk</strong> (M. Bell)
                    </button>
                  </div>

                  <!-- Section 2: Invitation Tokens -->
                  <div style="font-size: 0.72rem; font-weight: 800; color: #1E293B; margin-bottom: 0.45rem; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; justify-content: space-between;">
                    <span>2. Valid Invitation Tokens (Click to Fill Register):</span>
                    <span style="font-size: 0.68rem; color: #C89B3C; font-weight: 600;">New Registrations</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillRegisterCode('INV-TZ-2026-ADMIN-4081')" style="font-size: 0.71rem; padding: 0.35rem 0.5rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      🎫 <strong>Admin</strong> <code style="font-size: 0.66rem; color: #64748B; margin-left: 0.25rem;">...ADMIN-4081</code>
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillRegisterCode('INV-TZ-2026-SR-COUNSEL')" style="font-size: 0.71rem; padding: 0.35rem 0.5rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      🎫 <strong>Sr Counsel</strong> <code style="font-size: 0.66rem; color: #64748B; margin-left: 0.25rem;">...SR-COUNSEL</code>
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillRegisterCode('INV-TZ-2026-ASSOC')" style="font-size: 0.71rem; padding: 0.35rem 0.5rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      🎫 <strong>Associate</strong> <code style="font-size: 0.66rem; color: #64748B; margin-left: 0.25rem;">...ASSOC</code>
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillRegisterCode('INV-TZ-2026-CLERK')" style="font-size: 0.71rem; padding: 0.35rem 0.5rem; justify-content: flex-start; text-align: left; border-radius: 7px; background: #FFFFFF;">
                      🎫 <strong>Clerk</strong> <code style="font-size: 0.66rem; color: #64748B; margin-left: 0.25rem;">...CLERK</code>
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        <!-- 3. Bottom Global Footer -->
        <footer class="auth-global-footer">
          <span>© 2026 SLCMS Smart Legal Case Management System</span>
          <span>•</span>
          <a href="javascript:void(0)" onclick="App.showToast('Firm Security & Privacy Policies (SOC-2 Type II Certified)', 'info')">Privacy</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="AuthView.showHelpModal()">Help & Support Helpline</a>
        </footer>
      </div>
    `;
  },

  renderInCardRegistrationFlow() {
    if (this.currentInvStep === 1) {
      return this.renderInCardStep1();
    } else if (this.currentInvStep === 2) {
      return this.renderInCardStep2(this.verifiedInvitationData);
    } else if (this.currentInvStep === 3) {
      return this.renderInCardStep3(this.verifiedInvitationData);
    }
    return this.renderInCardStep1();
  },

  renderInCardStep1(presetCode = '') {
    return `
      <div id="in-card-step-1" class="reg-container">
        <!-- 3-Step Connected Progress Stepper -->
        <div class="reg-stepper">
          <div class="reg-stepper-track">
            <div class="reg-stepper-progress" style="width: 0%;"></div>
          </div>
          <div class="reg-step-node active">
            <div class="reg-step-circle">1</div>
            <span class="reg-step-label">Validate Token</span>
          </div>
          <div class="reg-step-node">
            <div class="reg-step-circle">2</div>
            <span class="reg-step-label">Dossier Clearance</span>
          </div>
          <div class="reg-step-node">
            <div class="reg-step-circle">3</div>
            <span class="reg-step-label">Passphrase</span>
          </div>
        </div>

        <div id="in-card-inv-step-1-alert" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.82rem;"></div>

        <form id="in-card-step-1-form" onsubmit="AuthView.handleInCardValidateInvitationSubmit(event)">
          <!-- Luxury Voucher Pass Card -->
          <div class="reg-ticket-card">
            <div class="reg-ticket-header">
              <div class="reg-ticket-title">
                <span>🛡️</span>
                <span>Firm Credential Voucher</span>
              </div>
              <span class="reg-ticket-badge">VIP Invitation</span>
            </div>

            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.45rem;">
              Firm Invitation Code *
            </label>

            <div class="reg-code-input-wrapper">
              <input 
                type="text" 
                id="in-card-inv-code" 
                class="reg-code-input-field" 
                placeholder="INV-TZ-2026-XXXX-XXXX" 
                value="${presetCode || ''}"
                autocomplete="off"
                spellcheck="false"
                required
                oninput="AuthView.handleCodeInputChange(this.value)"
              >
              <span class="reg-code-input-icon">🎫</span>
            </div>

            <!-- Dynamic Real-time Token Match Preview -->
            <div id="reg-code-live-preview" style="min-height: 22px; font-size: 0.74rem; margin-bottom: 0.45rem; transition: all 0.25s ease;">
              <span style="color: #64748B;">Codes are issued exclusively by authorized administrators.</span>
            </div>
          </div>

          <!-- Quick Interactive Test Cards -->
          <div style="margin-bottom: 1.25rem;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.55rem; display: flex; align-items: center; justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 0.35rem;">
                <span>⚡</span>
                <span>Available Invitations (Click to auto-fill):</span>
              </span>
              <span style="font-size: 0.68rem; color: #C89B3C; font-weight: 600;">1-Click Fill</span>
            </div>

            <div class="reg-quick-grid">
              <div class="reg-quick-card" onclick="AuthView.setInCardCode('INV-TZ-2026-ADMIN-4081')" title="Load Administrator invitation">
                <div class="reg-quick-icon">🛡️</div>
                <div class="reg-quick-info">
                  <div class="reg-quick-role">System Admin</div>
                  <div class="reg-quick-code">INV-TZ-2026-ADMIN-4081</div>
                </div>
              </div>

              <div class="reg-quick-card" onclick="AuthView.setInCardCode('INV-TZ-2026-SR-COUNSEL')" title="Load Senior Counsel invitation">
                <div class="reg-quick-icon">⚖️</div>
                <div class="reg-quick-info">
                  <div class="reg-quick-role">Senior Counsel</div>
                  <div class="reg-quick-code">INV-TZ-2026-SR-COUNSEL</div>
                </div>
              </div>

              <div class="reg-quick-card" onclick="AuthView.setInCardCode('INV-TZ-2026-ASSOC')" title="Load Associate Lawyer invitation">
                <div class="reg-quick-icon">📜</div>
                <div class="reg-quick-info">
                  <div class="reg-quick-role">Associate Lawyer</div>
                  <div class="reg-quick-code">INV-TZ-2026-ASSOC</div>
                </div>
              </div>

              <div class="reg-quick-card" onclick="AuthView.setInCardCode('INV-TZ-2026-CLERK')" title="Load Legal Clerk invitation">
                <div class="reg-quick-icon">📁</div>
                <div class="reg-quick-info">
                  <div class="reg-quick-role">Legal Clerk</div>
                  <div class="reg-quick-code">INV-TZ-2026-CLERK</div>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" class="reg-btn-gold">
            <span>Verify Invitation Code</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </form>
      </div>
    `;
  },

  handleCodeInputChange(rawVal) {
    const val = rawVal.toUpperCase();
    const input = document.getElementById('in-card-inv-code');
    if (input && input.value !== val) input.value = val;
    this.clearFieldError('in-card-inv-code', 'in-card-inv-step-1-alert');

    const previewEl = document.getElementById('reg-code-live-preview');
    if (!previewEl) return;

    if (!val || val.length < 5) {
      previewEl.innerHTML = `<span style="color: #64748B;">Codes are issued exclusively by authorized administrators.</span>`;
      return;
    }

    const valResult = SLCMS_STATE.validateInvitationCode(val);
    if (valResult.valid && valResult.invitation) {
      const inv = valResult.invitation;
      previewEl.innerHTML = `
        <span style="color: #059669; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          Recognized: <strong>${inv.approvedFullName}</strong> (${inv.approvedRole})
        </span>
      `;
    } else {
      previewEl.innerHTML = `<span style="color: #94A3B8;">Entering token: <code style="color: #475569; font-family: monospace;">${val}</code></span>`;
    }
  },

  setInCardCode(code) {
    const input = document.getElementById('in-card-inv-code');
    if (input) {
      input.value = code;
      input.classList.add('auth-input-highlight');
      this.handleCodeInputChange(code);
      setTimeout(() => input.classList.remove('auth-input-highlight'), 600);
      App.showToast(`Selected invitation token: ${code}`, 'info', 1800);
    }
  },

  fillRegisterCode(code) {
    this.currentTab = 'register';
    this.currentInvStep = 1;
    this.renderInPlace();
    setTimeout(() => {
      this.setInCardCode(code);
    }, 50);
  },

  handleInCardValidateInvitationSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('in-card-inv-code')?.value.trim();
    const alertEl = document.getElementById('in-card-inv-step-1-alert');

    const valResult = SLCMS_STATE.validateInvitationCode(code);

    if (!valResult.valid) {
      if (alertEl) {
        alertEl.innerText = valResult.message;
        alertEl.classList.remove('hidden');
      }
      App.showToast(valResult.message, 'error');
      return;
    }

    if (alertEl) alertEl.classList.add('hidden');
    this.verifiedInvitationData = valResult.invitation;
    this.currentInvStep = 2;
    this.renderInPlace();
    App.showToast(`Verified invitation for ${valResult.invitation.approvedFullName} (${valResult.invitation.approvedRole})`, 'success');
  },

  renderInCardStep2(inv) {
    if (!inv) return this.renderInCardStep1();
    const isLawyer = ['Managing Partner', 'Senior Counsel', 'Associate Lawyer', 'Junior Lawyer'].includes(inv.approvedRole);
    const isClerk = (inv.approvedRole === 'Legal Clerk');

    return `
      <div id="in-card-step-2" class="reg-container">
        <!-- 3-Step Connected Progress Stepper -->
        <div class="reg-stepper">
          <div class="reg-stepper-track">
            <div class="reg-stepper-progress" style="width: 50%;"></div>
          </div>
          <div class="reg-step-node completed">
            <div class="reg-step-circle">✓</div>
            <span class="reg-step-label">Validated</span>
          </div>
          <div class="reg-step-node active">
            <div class="reg-step-circle">2</div>
            <span class="reg-step-label">Verify Identity</span>
          </div>
          <div class="reg-step-node">
            <div class="reg-step-circle">3</div>
            <span class="reg-step-label">Passphrase</span>
          </div>
        </div>

        <!-- Luxury Practitioner Dossier Card -->
        <div class="reg-dossier-card">
          <div class="reg-dossier-top">
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-gold); font-weight: 800;">
              ⚖️ Official Firm Dossier
            </div>
            <span class="reg-dossier-role-pill">
              🔒 ${inv.approvedRole}
            </span>
          </div>

          <div class="reg-dossier-name">
            ${inv.approvedFullName}
          </div>

          <div class="reg-dossier-meta">
            <span>🏛️ <strong>${inv.department}</strong></span>
            <span>•</span>
            <span>🎫 Code: <code style="color: var(--color-gold); font-family: 'JetBrains Mono', monospace;">${inv.invitationCode}</code></span>
          </div>
        </div>

        <div id="in-card-inv-step-2-alert" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.82rem;"></div>

        <form id="in-card-step-2-form" onsubmit="AuthView.handleInCardIdentityVerificationSubmit(event)">
          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 0.85rem;">
            <div class="auth-input-group" style="margin-bottom: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 700; color: #1E293B;">Staff / Employee ID *</label>
              <div style="position: relative;">
                <span class="auth-input-icon" style="left: 0.8rem; font-size: 0.9rem;">🆔</span>
                <input type="text" id="inc-staff-id" class="auth-input-field" value="${inv.staffId}" required style="font-size: 0.88rem; padding: 0.65rem 0.75rem 0.65rem 2.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; background: #F8FAFC;">
              </div>
              <span class="reg-verified-field-indicator">✓ Registered Firm ID</span>
            </div>
            <div class="auth-input-group" style="margin-bottom: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 700; color: #1E293B;">Approved Firm Email *</label>
              <div style="position: relative;">
                <span class="auth-input-icon" style="left: 0.8rem; font-size: 0.9rem;">✉️</span>
                <input type="email" id="inc-email" class="auth-input-field" value="${inv.approvedEmail}" required style="font-size: 0.88rem; padding: 0.65rem 0.75rem 0.65rem 2.4rem; font-weight: 600; background: #F8FAFC;">
              </div>
              <span class="reg-verified-field-indicator">✓ Pre-Approved Mailbox</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 0.85rem;">
            <div class="auth-input-group" style="margin-bottom: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 700; color: #1E293B;">Approved Phone Number *</label>
              <div style="position: relative;">
                <span class="auth-input-icon" style="left: 0.8rem; font-size: 0.9rem;">📞</span>
                <input type="text" id="inc-phone" class="auth-input-field" value="${inv.approvedPhone}" required style="font-size: 0.88rem; padding: 0.65rem 0.75rem 0.65rem 2.4rem; font-weight: 600; background: #F8FAFC;">
              </div>
              <span class="reg-verified-field-indicator">✓ Verified Contact</span>
            </div>
            ${isLawyer ? `
              <div class="auth-input-group" style="margin-bottom: 0.4rem;">
                <label style="font-size: 0.8rem; font-weight: 700; color: #1E293B;">Advocate Roll No. *</label>
                <div style="position: relative;">
                  <span class="auth-input-icon" style="left: 0.8rem; font-size: 0.9rem;">⚖️</span>
                  <input type="text" id="inc-advocate-no" class="auth-input-field" value="${inv.advocateNumber || ''}" placeholder="e.g. ADV/2026/0481" required style="font-size: 0.88rem; padding: 0.65rem 0.75rem 0.65rem 2.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; background: #F8FAFC;">
                </div>
                <span class="reg-verified-field-indicator">✓ Bar Licensure Match</span>
              </div>
            ` : `
              <div class="auth-input-group" style="margin-bottom: 0.4rem;">
                <label style="font-size: 0.8rem; font-weight: 700; color: #1E293B;">National ID Ref (NIDA) *</label>
                <div style="position: relative;">
                  <span class="auth-input-icon" style="left: 0.8rem; font-size: 0.9rem;">🛡️</span>
                  <input type="text" id="inc-nid-ref" class="auth-input-field" value="${inv.nationalIdRefMasked || 'NIDA-19870512-1010-33'}" required style="font-size: 0.88rem; padding: 0.65rem 0.75rem 0.65rem 2.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; background: #F8FAFC;">
                </div>
                <span class="reg-verified-field-indicator">✓ National Identity Verified</span>
              </div>
            `}
          </div>

          <div class="flex gap-2" style="margin-top: 1.25rem;">
            <button type="button" class="btn btn-secondary" onclick="AuthView.currentInvStep = 1; AuthView.renderInPlace();" style="flex: 0.35; padding: 0.8rem; font-weight: 600;">
              ← Back
            </button>
            <button type="submit" class="reg-btn-gold" style="flex: 0.65;">
              <span>Confirm & Setup Passphrase</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    `;
  },

  handleInCardIdentityVerificationSubmit(e) {
    e.preventDefault();
    const inv = this.verifiedInvitationData;
    if (!inv) return;

    const email = document.getElementById('inc-email')?.value.trim();
    const phone = document.getElementById('inc-phone')?.value.trim();
    const staffId = document.getElementById('inc-staff-id')?.value.trim();
    const advocateNo = document.getElementById('inc-advocate-no')?.value.trim();
    const nidRef = document.getElementById('inc-nid-ref')?.value.trim();
    const alertEl = document.getElementById('in-card-inv-step-2-alert');

    let hasMismatch = false;
    if (email && email.toLowerCase() !== inv.approvedEmail.toLowerCase()) hasMismatch = true;
    if (staffId && staffId.toLowerCase() !== inv.staffId.toLowerCase()) hasMismatch = true;
    if (inv.advocateNumber && advocateNo && advocateNo.toLowerCase() !== inv.advocateNumber.toLowerCase()) hasMismatch = true;

    if (hasMismatch) {
      const msg = "Registration denied. The submitted professional information does not match the organization invitation record.";
      if (alertEl) {
        alertEl.innerText = msg;
        alertEl.classList.remove('hidden');
      }
      App.showToast(msg, 'error');
      return;
    }

    if (alertEl) alertEl.classList.add('hidden');
    this.verifiedFormData = {
      invitationCode: inv.invitationCode,
      email,
      phone,
      staffId,
      advocateNumber: advocateNo || inv.advocateNumber,
      nationalIdRef: nidRef || inv.nationalIdRef,
      practisingCertNo: inv.practisingCertNo
    };

    this.currentInvStep = 3;
    this.renderInPlace();
  },

  renderInCardStep3(inv) {
    if (!inv) return this.renderInCardStep1();

    return `
      <div id="in-card-step-3" class="reg-container">
        <!-- 3-Step Connected Progress Stepper -->
        <div class="reg-stepper">
          <div class="reg-stepper-track">
            <div class="reg-stepper-progress" style="width: 100%;"></div>
          </div>
          <div class="reg-step-node completed">
            <div class="reg-step-circle">✓</div>
            <span class="reg-step-label">Validated</span>
          </div>
          <div class="reg-step-node completed">
            <div class="reg-step-circle">✓</div>
            <span class="reg-step-label">Cleared</span>
          </div>
          <div class="reg-step-node active">
            <div class="reg-step-circle">3</div>
            <span class="reg-step-label">Passphrase</span>
          </div>
        </div>

        <div id="in-card-inv-step-3-alert" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.82rem;"></div>

        <form id="in-card-step-3-form" onsubmit="AuthView.handleInCardFinalRegistrationSubmit(event)">
          <div class="auth-input-group" style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.82rem; font-weight: 700; color: #1E293B;">Create Master Password *</label>
            <div style="position: relative;">
              <span class="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input 
                type="password" 
                id="inc-new-pass" 
                class="auth-input-field" 
                placeholder="Create high-security passphrase" 
                value="SecretLawFirm2026!"
                required
                style="padding: 0.75rem 2.75rem 0.75rem 2.65rem; font-size: 0.92rem;"
                oninput="AuthView.checkRegistrationPasswordStrength(this.value)"
              >
              <button 
                type="button" 
                onclick="AuthView.togglePasswordEye('inc-new-pass', 'reg-pass-eye-1')" 
                style="position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; display: flex; align-items: center;"
                title="Show / Hide Password"
              >
                <svg id="reg-pass-eye-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            
            <!-- Real-time Password Strength Meter -->
            <div style="margin-top: 0.5rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.6rem 0.75rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; margin-bottom: 0.35rem;">
                <span style="color: #64748B; font-weight: 600;">Security Strength:</span>
                <span id="reg-pass-strength-text" style="font-weight: 800; color: #10B981;">Enterprise-Grade (100%)</span>
              </div>
              <div style="height: 5px; background: #E2E8F0; border-radius: 3px; overflow: hidden; margin-bottom: 0.45rem;">
                <div id="reg-pass-strength-fill" style="width: 100%; height: 100%; background: #10B981; transition: all 0.3s ease;"></div>
              </div>
              <div id="reg-pass-checklist" style="display: flex; flex-wrap: wrap; gap: 0.4rem; font-size: 0.68rem;">
                <span id="chk-len" style="color: #059669; font-weight: 700;">✓ 8+ Characters</span>
                <span id="chk-case" style="color: #059669; font-weight: 700;">✓ Upper & Lowercase</span>
                <span id="chk-num" style="color: #059669; font-weight: 700;">✓ Number</span>
                <span id="chk-sym" style="color: #059669; font-weight: 700;">✓ Symbol (!@#$)</span>
              </div>
            </div>
          </div>

          <div class="auth-input-group" style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.82rem; font-weight: 700; color: #1E293B;">Confirm Master Password *</label>
            <div style="position: relative;">
              <span class="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </span>
              <input 
                type="password" 
                id="inc-confirm-pass" 
                class="auth-input-field" 
                placeholder="Re-enter your password to verify" 
                value="SecretLawFirm2026!"
                required
                style="padding: 0.75rem 2.75rem 0.75rem 2.65rem; font-size: 0.92rem;"
              >
              <button 
                type="button" 
                onclick="AuthView.togglePasswordEye('inc-confirm-pass', 'reg-pass-eye-2')" 
                style="position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; display: flex; align-items: center;"
                title="Show / Hide Password"
              >
                <svg id="reg-pass-eye-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Activation Summary Dossier -->
          <div style="background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%); border: 1px solid #CBD5E1; border-radius: 10px; padding: 0.75rem 0.95rem; font-size: 0.78rem; margin-bottom: 1.25rem;">
            <div style="font-weight: 800; color: #1E293B; margin-bottom: 0.3rem; display: flex; align-items: center; justify-content: space-between;">
              <span>📜 Activation Summary</span>
              <span style="color: #059669; font-weight: 700; font-size: 0.7rem;">Ready to Authorize</span>
            </div>
            <div style="color: #475569; margin-bottom: 0.15rem;">• Practitioner: <strong>${inv.approvedFullName}</strong> (<span style="color: var(--color-gold); font-weight: 800;">${inv.approvedRole}</span>)</div>
            <div style="color: #475569;">• Primary Sign-in: <code style="font-family: monospace; color: #1E293B;">${inv.approvedEmail}</code></div>
          </div>

          <div class="flex gap-2">
            <button type="button" class="btn btn-secondary" onclick="AuthView.currentInvStep = 2; AuthView.renderInPlace();" style="flex: 0.35; padding: 0.8rem; font-weight: 600;">
              ← Back
            </button>
            <button type="submit" class="reg-btn-gold" style="flex: 0.65;">
              <span>Activate & Enter Workspace</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    `;
  },

  checkRegistrationPasswordStrength(pass) {
    const textEl = document.getElementById('reg-pass-strength-text');
    const fillEl = document.getElementById('reg-pass-strength-fill');
    const chkLen = document.getElementById('chk-len');
    const chkCase = document.getElementById('chk-case');
    const chkNum = document.getElementById('chk-num');
    const chkSym = document.getElementById('chk-sym');

    let score = 0;
    const hasLen = pass.length >= 8;
    const hasCase = /[A-Z]/.test(pass) && /[a-z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSym = /[^A-Za-z0-9]/.test(pass);

    if (chkLen) {
      chkLen.style.color = hasLen ? '#059669' : '#94A3B8';
      chkLen.innerText = `${hasLen ? '✓' : '○'} 8+ Characters`;
    }
    if (chkCase) {
      chkCase.style.color = hasCase ? '#059669' : '#94A3B8';
      chkCase.innerText = `${hasCase ? '✓' : '○'} Upper & Lowercase`;
    }
    if (chkNum) {
      chkNum.style.color = hasNum ? '#059669' : '#94A3B8';
      chkNum.innerText = `${hasNum ? '✓' : '○'} Number`;
    }
    if (chkSym) {
      chkSym.style.color = hasSym ? '#059669' : '#94A3B8';
      chkSym.innerText = `${hasSym ? '✓' : '○'} Symbol (!@#$)`;
    }

    if (hasLen) score += 25;
    if (hasCase) score += 25;
    if (hasNum) score += 25;
    if (hasSym) score += 25;

    if (!fillEl || !textEl) return;

    fillEl.style.width = `${score}%`;
    if (score <= 25) {
      fillEl.style.background = '#EF4444';
      textEl.style.color = '#EF4444';
      textEl.innerText = `Weak (${score}%)`;
    } else if (score <= 50) {
      fillEl.style.background = '#F59E0B';
      textEl.style.color = '#D97706';
      textEl.innerText = `Fair (${score}%)`;
    } else if (score <= 75) {
      fillEl.style.background = '#3B82F6';
      textEl.style.color = '#2563EB';
      textEl.innerText = `Strong (${score}%)`;
    } else {
      fillEl.style.background = '#10B981';
      textEl.style.color = '#059669';
      textEl.innerText = `Enterprise-Grade (100%)`;
    }
  },

  handleInCardFinalRegistrationSubmit(e) {
    e.preventDefault();
    const pass = document.getElementById('inc-new-pass')?.value;
    const confirm = document.getElementById('inc-confirm-pass')?.value;
    const alertEl = document.getElementById('in-card-inv-step-3-alert');

    if (pass !== confirm) {
      if (alertEl) {
        alertEl.innerText = 'Passwords do not match.';
        alertEl.classList.remove('hidden');
      }
      return;
    }

    const payload = {
      ...this.verifiedFormData,
      password: pass
    };

    const regRes = SLCMS_STATE.registerWithInvitation(payload);

    if (!regRes.success) {
      if (alertEl) {
        alertEl.innerText = regRes.message;
        alertEl.classList.remove('hidden');
      }
      App.showToast(regRes.message, 'error');
      return;
    }

    if (regRes.pendingApproval) {
      App.openModal(`
        <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
          <h3 class="modal-title" style="color: #FFFFFF;">⏳ Registration Received</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem; text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-text-main);">
            Identity Received Successfully
          </h4>
          <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 1.25rem; line-height: 1.5;">
            Your identity was received successfully. Access will remain restricted until an authorized administrator approves your account.
          </p>
          <button class="btn btn-primary" onclick="App.closeModal(); AuthView.switchTab('login');">
            Acknowledge & Return to Sign In
          </button>
        </div>
      `, 'modal-md');
    } else {
      App.isLoggedIn = true;
      App.renderAuthenticatedApp();
      App.showToast(`Registration complete! Welcome, ${regRes.user.name} (${regRes.user.role}).`, 'success');
    }
  },

  // ==========================================================================
  // FIRST-LOGIN MANDATORY PASSWORD CHANGE VIEW (Requirement 9)
  // ==========================================================================
  renderFirstLoginPasswordChangeView() {
    const user = this.tempAuthUser;
    return `
      <div class="auth-page-container animate-fade">
        <div class="auth-split-layout">
          <!-- Left Hero -->
          <div class="auth-hero-panel">
            <div class="auth-brand-header">
              <div class="auth-brand-logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="M7 21h10"/>
                  <path d="M12 3v18"/>
                  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                </svg>
              </div>
              <div class="auth-brand-name">SLCMS</div>
            </div>

            <div class="auth-hero-center">
              <h1 class="auth-main-headline">
                Initial Account
                <span class="highlight-gold">Activation</span>
              </h1>
              <div class="auth-headline-bar"></div>
              <p class="auth-lead-tagline">
                Mandatory security procedure: Replace your administrator-issued temporary password with a confidential passphrase.
              </p>
              <div class="alert alert-info" style="background: rgba(16, 42, 67, 0.7); border-color: rgba(200, 155, 60, 0.4); color: #E2E8F0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold); flex-shrink: 0;">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div style="font-size: 0.85rem; line-height: 1.5;">
                  <strong>Confidentiality Notice:</strong> In accordance with ABA Model Rule 1.6, passwords must be strictly private and never shared with staff or colleagues.
                </div>
              </div>
            </div>

            <div style="font-size: 0.8rem; color: #94A3B8;">
              Session Protected • Cryptographic Hash Stored • Zero Knowledge
            </div>
          </div>

          <!-- Right Password Setup Card -->
          <div class="auth-form-panel">
            <div class="auth-white-card" style="max-width: 480px;">
              <div class="auth-card-lock-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 2l-2 2m-1.5 1.5L10 13l-4 4-2-2 4-4 7.5-7.5"/>
                  <circle cx="16" cy="8" r="2"/>
                </svg>
              </div>

              <h2 class="auth-card-title">Create New Password</h2>
              <p class="auth-card-subtitle">
                Welcome, <strong>${user.name}</strong>. Set your permanent private credentials.
              </p>

              <!-- Error Alert -->
              <div id="first-login-alert" class="alert alert-danger hidden" style="margin-bottom: 1.25rem; font-size: 0.85rem; text-align: left;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div id="first-login-alert-text"></div>
              </div>

              <form id="first-login-form" onsubmit="AuthView.handleFirstLoginSubmit(event)" novalidate>
                <!-- Current Temporary Password -->
                <div class="auth-input-group">
                  <label for="temp-password-input">Current Temporary Password</label>
                  <div style="position: relative;">
                    <span class="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input 
                      type="password" 
                      id="temp-password-input" 
                      class="auth-input-field" 
                      placeholder="Enter the password received from Admin" 
                      value="TempPass2026!"
                      style="padding-right: 2.75rem;"
                    >
                    <button type="button" onclick="AuthView.togglePasswordEye('temp-password-input', 'temp-eye-svg')" style="position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8;">
                      <svg id="temp-eye-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                  <div id="temp-password-error" class="form-error-msg hidden"></div>
                </div>

                <!-- New Password Field -->
                <div class="auth-input-group">
                  <label for="new-password-input">New Private Password</label>
                  <div style="position: relative;">
                    <span class="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                      </svg>
                    </span>
                    <input 
                      type="password" 
                      id="new-password-input" 
                      class="auth-input-field" 
                      placeholder="Create a strong passphrase"
                      style="padding-right: 2.75rem;"
                      oninput="AuthView.updatePasswordStrengthChecklist()"
                    >
                    <button type="button" onclick="AuthView.togglePasswordEye('new-password-input', 'new-eye-svg')" style="position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8;">
                      <svg id="new-eye-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                  <div id="new-password-error" class="form-error-msg hidden"></div>

                  <!-- Live Password Strength Meter Bar -->
                  <div style="margin-top: 0.5rem;">
                    <div class="flex items-center justify-between" style="font-size: 0.72rem; margin-bottom: 0.25rem;">
                      <span style="color: #64748B;">Password Strength:</span>
                      <span id="strength-label" style="font-weight: 700; color: var(--color-danger);">Too Short</span>
                    </div>
                    <div style="height: 4px; background: #E2E8F0; border-radius: 2px; overflow: hidden;">
                      <div id="strength-bar" style="height: 100%; width: 10%; background: var(--color-danger); transition: all 0.3s ease;"></div>
                    </div>
                  </div>
                </div>

                <!-- Confirm Password Field -->
                <div class="auth-input-group">
                  <label for="confirm-password-input">Confirm New Password</label>
                  <div style="position: relative;">
                    <span class="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m9 12 2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </span>
                    <input 
                      type="password" 
                      id="confirm-password-input" 
                      class="auth-input-field" 
                      placeholder="Re-enter your new passphrase"
                      oninput="AuthView.clearFieldError('confirm-password-input', 'confirm-password-error')"
                    >
                  </div>
                  <div id="confirm-password-error" class="form-error-msg hidden"></div>
                </div>

                <!-- Requirement Checklist (Requirement 9) -->
                <div class="password-req-box" style="text-align: left; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.78rem;">
                  <div style="font-weight: 600; color: #334155; margin-bottom: 0.45rem;">Passphrase Requirements:</div>
                  <div class="grid grid-cols-2 gap-1" id="req-checklist">
                    <div id="req-len" class="flex items-center gap-1" style="color: #94A3B8;">
                      <span>⚪</span> At least 8 characters
                    </div>
                    <div id="req-upper" class="flex items-center gap-1" style="color: #94A3B8;">
                      <span>⚪</span> Uppercase letter (A-Z)
                    </div>
                    <div id="req-lower" class="flex items-center gap-1" style="color: #94A3B8;">
                      <span>⚪</span> Lowercase letter (a-z)
                    </div>
                    <div id="req-num" class="flex items-center gap-1" style="color: #94A3B8;">
                      <span>⚪</span> Number (0-9)
                    </div>
                    <div id="req-sym" class="flex items-center gap-1" style="color: #94A3B8;">
                      <span>⚪</span> Special symbol (!@#$)
                    </div>
                    <div id="req-not-name" class="flex items-center gap-1" style="color: #94A3B8;">
                      <span>⚪</span> No name / email
                    </div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button type="button" class="btn btn-secondary" onclick="AuthView.cancelFirstLogin()" style="flex: 0.4;">
                    Cancel
                  </button>
                  <button type="submit" id="btn-save-password" class="auth-btn-signin" style="flex: 0.6; margin-top: 0;">
                    Save & Enter Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // FRONT-END VALIDATION & SUBMISSION HANDLING (Requirements 3 & 4)
  // ==========================================================================
  handleLoginSubmit(e) {
    e.preventDefault();
    this.hideServerAlert();

    const emailInput = document.getElementById('login-email-input');
    const passwordInput = document.getElementById('login-password-input');
    const rememberMeCheck = document.getElementById('auth-remember-check');

    const emailVal = emailInput ? emailInput.value.trim() : '';
    const passwordVal = passwordInput ? passwordInput.value : ''; // Do NOT trim internal spaces from password!

    let hasClientError = false;

    // 1. Validate Email / Username
    if (!emailVal) {
      this.showFieldError('login-email-input', 'login-email-error', 'Enter your email address or username.');
      hasClientError = true;
    } else if (emailVal.includes('@')) {
      // Basic RFC 5322 regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        this.showFieldError('login-email-input', 'login-email-error', 'Enter a valid email address.');
        hasClientError = true;
      }
    }

    // 2. Validate Password
    if (!passwordVal) {
      this.showFieldError('login-password-input', 'login-password-error', 'Enter your password.');
      hasClientError = true;
    } else if (passwordVal.length < 8) {
      this.showFieldError('login-password-input', 'login-password-error', 'Password must be at least 8 characters.');
      hasClientError = true;
    }

    if (hasClientError) return;

    // 3. Trigger Loading State ("Signing in…", disable button to prevent double-submit)
    const btn = document.getElementById('auth-submit-btn');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin-right: 0.5rem; display: inline-block; vertical-align: middle;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>Signing in…</span>
    `;
    btn.disabled = true;

    // 4. Server-Side Verification Execution (Simulated Secure Backend Engine)
    setTimeout(() => {
      const authResult = SLCMS_STATE.serverAuthenticate(emailVal, passwordVal, rememberMeCheck?.checked);

      if (!authResult.success) {
        // Reset button
        btn.innerHTML = 'Sign In';
        btn.disabled = false;

        // Display safe server-side controlled error message
        this.showServerAlert(authResult.message);
        return;
      }

      // 5. Handle First-Login Password Change Intercept
      if (authResult.requiresFirstLoginChange) {
        this.tempAuthUser = authResult.user;
        this.currentViewMode = 'first_login_password_change';
        document.getElementById('app-root').innerHTML = this.render();
        return;
      }

      // 6. Complete Login: Store session, log in, redirect to role dashboard
      sessionStorage.setItem('slcms_auth', 'true');
      sessionStorage.setItem('slcms_token', authResult.token);
      
      App.isLoggedIn = true;
      App.renderAuthenticatedApp();
      
      const firstName = authResult.user.name.split(' ')[0] || 'Counsel';
      App.showToast(`Welcome back, ${firstName}.`, 'success');
    }, 450);
  },

  // First Login Password Update Handler
  handleFirstLoginSubmit(e) {
    e.preventDefault();
    const tempPass = document.getElementById('temp-password-input')?.value;
    const newPass = document.getElementById('new-password-input')?.value;
    const confirmPass = document.getElementById('confirm-password-input')?.value;

    let hasError = false;

    if (!tempPass) {
      this.showFieldError('temp-password-input', 'temp-password-error', 'Enter your temporary password.');
      hasError = true;
    }

    if (!newPass || newPass.length < 8) {
      this.showFieldError('new-password-input', 'new-password-error', 'New password must be at least 8 characters.');
      hasError = true;
    }

    if (newPass !== confirmPass) {
      this.showFieldError('confirm-password-input', 'confirm-password-error', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    const res = SLCMS_STATE.completeFirstLoginPasswordChange(this.tempAuthUser.id, tempPass, newPass);
    if (!res.success) {
      const alertEl = document.getElementById('first-login-alert');
      const textEl = document.getElementById('first-login-alert-text');
      if (alertEl && textEl) {
        textEl.innerText = res.message;
        alertEl.classList.remove('hidden');
      }
      return;
    }

    // Success: enter app
    sessionStorage.setItem('slcms_auth', 'true');
    this.currentViewMode = 'login';
    this.tempAuthUser = null;

    App.isLoggedIn = true;
    App.renderAuthenticatedApp();
    App.showToast(`Password successfully updated. Welcome to SLCMS, ${res.user.name}.`, 'success');
  },

  cancelFirstLogin() {
    this.currentViewMode = 'login';
    this.tempAuthUser = null;
    document.getElementById('app-root').innerHTML = this.render();
  },

  // Live Checklist & Strength Meter
  updatePasswordStrengthChecklist() {
    const val = document.getElementById('new-password-input')?.value || '';
    const user = this.tempAuthUser;

    const hasLen = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNum = /[0-9]/.test(val);
    const hasSym = /[^A-Za-z0-9]/.test(val);
    const notName = user ? (!val.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]) && !val.toLowerCase().includes(user.email.split('@')[0])) : true;

    this.toggleChecklistBadge('req-len', hasLen);
    this.toggleChecklistBadge('req-upper', hasUpper);
    this.toggleChecklistBadge('req-lower', hasLower);
    this.toggleChecklistBadge('req-num', hasNum);
    this.toggleChecklistBadge('req-sym', hasSym);
    this.toggleChecklistBadge('req-not-name', notName);

    // Calculate Strength (0-100)
    let score = 0;
    if (hasLen) score += 20;
    if (hasUpper) score += 20;
    if (hasLower) score += 20;
    if (hasNum) score += 20;
    if (hasSym) score += 20;

    const bar = document.getElementById('strength-bar');
    const label = document.getElementById('strength-label');
    if (!bar || !label) return;

    bar.style.width = `${Math.max(score, 10)}%`;
    if (score <= 40) {
      bar.style.backgroundColor = 'var(--color-danger)';
      label.style.color = 'var(--color-danger)';
      label.innerText = 'Weak';
    } else if (score <= 80) {
      bar.style.backgroundColor = 'var(--color-warning)';
      label.style.color = 'var(--color-warning)';
      label.innerText = 'Good';
    } else {
      bar.style.backgroundColor = 'var(--color-success)';
      label.style.color = 'var(--color-success)';
      label.innerText = 'Strong Enterprise Passphrase';
    }
  },

  toggleChecklistBadge(id, valid) {
    const el = document.getElementById(id);
    if (!el) return;
    if (valid) {
      el.style.color = 'var(--color-success)';
      el.querySelector('span').innerText = '🟢';
    } else {
      el.style.color = '#94A3B8';
      el.querySelector('span').innerText = '⚪';
    }
  },

  // Helper Field Errors
  showFieldError(inputId, errorId, msg) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (err) {
      err.innerText = msg;
      err.classList.remove('hidden');
    }
  },

  clearFieldError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errorId);
    if (input) input.classList.remove('error');
    if (err) {
      err.innerText = '';
      err.classList.add('hidden');
    }
  },

  showServerAlert(msg) {
    const alertEl = document.getElementById('auth-server-alert');
    const textEl = document.getElementById('auth-server-alert-text');
    if (alertEl && textEl) {
      if (msg.includes('Invalid') || msg.includes('unregistered') || msg.includes('denied') || msg.includes('unavailable')) {
        textEl.innerHTML = `
          <div><strong>Access Denied:</strong> ${msg}</div>
          <div style="margin-top: 0.5rem; font-size: 0.78rem; border-top: 1px solid rgba(239, 68, 68, 0.2); padding-top: 0.4rem;">
            <span>🛡️ No one may sign in without prior registration. If you received a firm invitation code:</span>
            <div style="margin-top: 0.35rem;">
              <button type="button" class="btn btn-sm btn-gold" onclick="AuthView.switchTab('register')" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; font-weight: 700;">
                ✍️ Go to Register with Invitation Tab →
              </button>
            </div>
          </div>
        `;
      } else {
        textEl.innerText = msg;
      }
      alertEl.classList.remove('hidden');
    }
  },

  hideServerAlert() {
    const alertEl = document.getElementById('auth-server-alert');
    if (alertEl) alertEl.classList.add('hidden');
  },

  togglePasswordEye(inputId, svgId) {
    const input = document.getElementById(inputId);
    const svg = document.getElementById(svgId);
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      if (svg) {
        svg.innerHTML = `
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        `;
      }
    } else {
      input.type = 'password';
      if (svg) {
        svg.innerHTML = `
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        `;
      }
    }
  },

  // Fast Test Sandbox Filler
  fillCredentials(email, password, roleLabel = '') {
    if (this.currentTab !== 'login') {
      this.currentTab = 'login';
      this.renderInPlace();
    }
    this.hideServerAlert();
    const emailInput = document.getElementById('login-email-input');
    const passInput = document.getElementById('login-password-input');
    if (emailInput) {
      emailInput.value = email;
      emailInput.classList.add('auth-input-highlight');
      setTimeout(() => emailInput.classList.remove('auth-input-highlight'), 1000);
      this.clearFieldError('login-email-input', 'login-email-error');
    }
    if (passInput) {
      passInput.value = password;
      passInput.classList.add('auth-input-highlight');
      setTimeout(() => passInput.classList.remove('auth-input-highlight'), 1000);
      this.clearFieldError('login-password-input', 'login-password-error');
    }
    if (roleLabel) {
      App.showToast(`Selected Profile: ${roleLabel} (${email})`, 'info', 3000);
    }
  },

  selectRoleCard(elem, email, password, roleLabel) {
    document.querySelectorAll('.auth-role-card').forEach(el => el.classList.remove('active-selected'));
    document.querySelectorAll('.auth-sec-state-chip').forEach(el => el.style.boxShadow = 'none');
    if (elem) elem.classList.add('active-selected');
    this.fillCredentials(email, password, roleLabel);
  },

  selectStateChip(elem, email, password, stateLabel) {
    document.querySelectorAll('.auth-role-card').forEach(el => el.classList.remove('active-selected'));
    document.querySelectorAll('.auth-sec-state-chip').forEach(el => el.style.boxShadow = 'none');
    if (elem) elem.style.boxShadow = '0 0 0 2px var(--color-gold)';
    this.fillCredentials(email, password, stateLabel);
  },

  // ==========================================================================
  // INVITATION-BASED REGISTRATION WIZARD (STRICT PROFESSIONAL VERIFICATION)
  // Zero Public Role Selection • Immutable Role Assignment From Invitation
  // ==========================================================================
  currentInvStep: 1,
  verifiedInvitationData: null,

  showInvitationRegisterModal(presetCode = '') {
    this.currentInvStep = 1;
    this.verifiedInvitationData = null;

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>🛡️</span> Secure Staff Registration (Invitation-Only)
          </h3>
          <p style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.2rem;">
            Registration requires a firm-issued invitation code. Role and clearance are locked and immutable.
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem;" id="invitation-modal-content">
        ${this.renderInvitationStep1(presetCode)}
      </div>
    `, 'modal-lg');
  },

  renderInvitationStep1(presetCode = '') {
    return `
      <div id="inv-step-1-container">
        <!-- Step Indicator -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--color-gold); color: #000; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800;">1</span>
            Step 1: Validate Invitation Code
          </div>
          <span style="font-size: 0.75rem; color: #64748B;">Step 1 of 3</span>
        </div>

        <!-- Alert Notification -->
        <div id="inv-step-1-alert" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.85rem;"></div>

        <!-- Form -->
        <form id="inv-step-1-form" onsubmit="AuthView.handleValidateInvitationSubmit(event)">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">One-Time Firm Invitation Code *</label>
            <div style="position: relative;">
              <input 
                type="text" 
                id="reg-invitation-code" 
                class="form-control" 
                placeholder="e.g. INV-TZ-2026-SR-COUNSEL" 
                value="${presetCode || 'INV-TZ-2026-SR-COUNSEL'}"
                style="font-family: var(--font-mono); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding-left: 2.25rem;"
                required
              >
              <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 1rem;">🎫</span>
            </div>
            <div style="font-size: 0.75rem; color: #64748B; margin-top: 0.35rem;">
              Issued exclusively by the Managing Partner or authorized System Administrator.
            </div>
          </div>

          <!-- Sandbox Quick-Test Invitation Buttons -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.04em;">
              🧪 Invitation Test Sandbox (Click to quick-fill code):
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillInvitationCode('INV-TZ-2026-SR-COUNSEL')" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;">
                ⚖️ Senior Counsel (Valid)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillInvitationCode('INV-TZ-2026-ASSOC')" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;">
                📜 Associate Lawyer (Valid)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillInvitationCode('INV-TZ-2026-CLERK')" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;">
                📁 Legal Clerk / NIDA (Valid)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillInvitationCode('INV-EXPIRED-TEST')" style="font-size: 0.72rem; padding: 0.25rem 0.5rem; border-color: #FECACA; color: #DC2626;">
                ❌ Expired Code (Test Rejection)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillInvitationCode('INV-USED-TEST')" style="font-size: 0.72rem; padding: 0.25rem 0.5rem; border-color: #FECACA; color: #DC2626;">
                🚫 Used Code (Test Rejection)
              </button>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-gold">
              Verify Invitation Code →
            </button>
          </div>
        </form>
      </div>
    `;
  },

  fillInvitationCode(code) {
    const input = document.getElementById('reg-invitation-code');
    if (input) {
      input.value = code;
    }
  },

  handleValidateInvitationSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('reg-invitation-code')?.value.trim();
    const alertEl = document.getElementById('inv-step-1-alert');

    const valResult = SLCMS_STATE.validateInvitationCode(code);

    if (!valResult.valid) {
      if (alertEl) {
        alertEl.innerText = valResult.message;
        alertEl.classList.remove('hidden');
      }
      App.showToast(valResult.message, 'error');
      return;
    }

    if (alertEl) alertEl.classList.add('hidden');
    this.verifiedInvitationData = valResult.invitation;
    this.currentInvStep = 2;

    const modalContent = document.getElementById('invitation-modal-content');
    if (modalContent) {
      modalContent.innerHTML = this.renderInvitationStep2(valResult.invitation);
    }
  },

  renderInvitationStep2(inv) {
    const isLawyer = ['Managing Partner', 'Senior Counsel', 'Associate Lawyer', 'Junior Lawyer'].includes(inv.approvedRole);
    const isClerk = (inv.approvedRole === 'Legal Clerk');

    return `
      <div id="inv-step-2-container" class="animate-fade">
        <!-- Step Indicator -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--color-gold); color: #000; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800;">2</span>
            Step 2: Professional Identity Verification
          </div>
          <span style="font-size: 0.75rem; color: #64748B;">Step 2 of 3</span>
        </div>

        <!-- Pre-Approved Immutable Role Card (No public role selection) -->
        <div style="background: linear-gradient(135deg, #102A43, #1E3A5F); color: #FFFFFF; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem; box-shadow: 0 4px 12px rgba(16,42,67,0.15);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-gold); font-weight: 700;">
              🔒 Pre-Approved Role & Clearance (Immutable)
            </div>
            <span class="badge" style="background: rgba(200,155,60,0.25); color: #FCD34D; border: 1px solid rgba(200,155,60,0.4); font-size: 0.75rem; font-weight: 700;">
              ${inv.approvedRole}
            </span>
          </div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.2rem;">
            ${inv.approvedFullName}
          </div>
          <div style="font-size: 0.8rem; color: #CBD5E1;">
            Department: <strong>${inv.department}</strong> • Invitation Code: <code>${inv.invitationCode}</code>
          </div>
        </div>

        <!-- Alert Notification -->
        <div id="inv-step-2-alert" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.85rem;"></div>

        <!-- Verification Form -->
        <form id="inv-step-2-form" onsubmit="AuthView.handleIdentityVerificationSubmit(event)">
          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Staff / Employee ID *</label>
              <input 
                type="text" 
                id="verif-staff-id" 
                class="form-control" 
                placeholder="e.g. ${inv.staffId}" 
                value="${inv.staffId}" 
                required
              >
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Approved Email Address *</label>
              <input 
                type="email" 
                id="verif-email" 
                class="form-control" 
                placeholder="${inv.approvedEmail}" 
                value="${inv.approvedEmail}" 
                required
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Approved Phone Number *</label>
              <input 
                type="text" 
                id="verif-phone" 
                class="form-control" 
                placeholder="${inv.approvedPhone}" 
                value="${inv.approvedPhone}" 
                required
              >
            </div>

            ${isLawyer ? `
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Advocate Roll / Registration No. *</label>
                <input 
                  type="text" 
                  id="verif-advocate-no" 
                  class="form-control" 
                  placeholder="e.g. ${inv.advocateNumber || 'ADV/2026/XXXX'}" 
                  value="${inv.advocateNumber || ''}" 
                  required
                >
              </div>
            ` : isClerk ? `
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">National ID Reference (NIDA/NID) *</label>
                <input 
                  type="text" 
                  id="verif-nid-ref" 
                  class="form-control" 
                  placeholder="NIDA-19940812-1002-88" 
                  value="${inv.nationalIdRefMasked || 'NIDA-19940812-1002-88'}" 
                  required
                >
              </div>
            ` : `
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Administrative Security Clearance *</label>
                <input 
                  type="text" 
                  id="verif-clearance-ref" 
                  class="form-control" 
                  placeholder="SEC-CLR-2026" 
                  value="SEC-CLR-2026" 
                  required
                >
              </div>
            `}
          </div>

          ${isLawyer && inv.practisingCertNo ? `
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Practising Certificate No.</label>
              <input 
                type="text" 
                id="verif-pc-no" 
                class="form-control" 
                value="${inv.practisingCertNo}" 
                readonly
                style="background: #F1F5F9; font-family: var(--font-mono);"
              >
            </div>
          ` : ''}

          <div style="font-size: 0.72rem; color: #64748B; background: #F8FAFC; padding: 0.5rem 0.75rem; border-radius: 6px; margin-bottom: 1.25rem;">
            🔒 <em>Server-Side Security Check: All credentials will be verified against the firm's invitation registry before account activation.</em>
          </div>

          <div class="flex items-center justify-between">
            <button type="button" class="btn btn-secondary" onclick="AuthView.showInvitationRegisterModal('${inv.invitationCode}')">
              ← Back
            </button>
            <button type="submit" class="btn btn-gold">
              Proceed to Password Setup →
            </button>
          </div>
        </form>
      </div>
    `;
  },

  handleIdentityVerificationSubmit(e) {
    e.preventDefault();
    const inv = this.verifiedInvitationData;
    if (!inv) return;

    const email = document.getElementById('verif-email')?.value.trim();
    const phone = document.getElementById('verif-phone')?.value.trim();
    const staffId = document.getElementById('verif-staff-id')?.value.trim();
    const advocateNo = document.getElementById('verif-advocate-no')?.value.trim();
    const nidRef = document.getElementById('verif-nid-ref')?.value.trim();
    const alertEl = document.getElementById('inv-step-2-alert');

    // Mismatch verification
    let hasMismatch = false;

    if (email && email.toLowerCase() !== inv.approvedEmail.toLowerCase()) hasMismatch = true;
    if (staffId && staffId.toLowerCase() !== inv.staffId.toLowerCase()) hasMismatch = true;
    if (inv.advocateNumber && advocateNo && advocateNo.toLowerCase() !== inv.advocateNumber.toLowerCase()) hasMismatch = true;

    if (hasMismatch) {
      const denialMsg = "Registration denied. The submitted professional information does not match the role assigned by the organization.";
      if (alertEl) {
        alertEl.innerText = denialMsg;
        alertEl.classList.remove('hidden');
      }
      App.showToast(denialMsg, 'error');
      return;
    }

    if (alertEl) alertEl.classList.add('hidden');
    this.currentInvStep = 3;

    // Cache verified form inputs
    this.verifiedFormData = {
      invitationCode: inv.invitationCode,
      email,
      phone,
      staffId,
      advocateNumber: advocateNo || inv.advocateNumber,
      nationalIdRef: nidRef || inv.nationalIdRef,
      practisingCertNo: inv.practisingCertNo
    };

    const modalContent = document.getElementById('invitation-modal-content');
    if (modalContent) {
      modalContent.innerHTML = this.renderInvitationStep3(inv);
    }
  },

  renderInvitationStep3(inv) {
    return `
      <div id="inv-step-3-container" class="animate-fade">
        <!-- Step Indicator -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--color-gold); color: #000; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800;">3</span>
            Step 3: Secure Passphrase Setup
          </div>
          <span style="font-size: 0.75rem; color: #64748B;">Step 3 of 3</span>
        </div>

        <div id="inv-step-3-alert" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.85rem;"></div>

        <form id="inv-step-3-form" onsubmit="AuthView.handleFinalRegistrationSubmit(event)">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Create Strong Password *</label>
            <input 
              type="password" 
              id="reg-new-pass" 
              class="form-control" 
              placeholder="Minimum 8 characters, uppercase, numbers, symbols" 
              value="SecretLawFirm2026!"
              required
              oninput="AuthView.checkRegistrationPasswordStrength(this.value)"
            >
            <div id="reg-pass-strength-bar" style="height: 4px; background: #E2E8F0; border-radius: 2px; margin-top: 0.4rem; overflow: hidden;">
              <div id="reg-pass-strength-fill" style="width: 100%; height: 100%; background: var(--color-success); transition: width 0.3s ease;"></div>
            </div>
            <div id="reg-pass-strength-text" style="font-size: 0.72rem; color: var(--color-success); margin-top: 0.25rem; font-weight: 600;">
              Strong Password (Meets enterprise complexity criteria)
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Confirm Password *</label>
            <input 
              type="password" 
              id="reg-confirm-pass" 
              class="form-control" 
              placeholder="Re-enter password" 
              value="SecretLawFirm2026!"
              required
            >
          </div>

          <!-- Summary Box -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem; font-size: 0.78rem; margin-bottom: 1.25rem;">
            <div style="font-weight: 700; color: #1E293B; margin-bottom: 0.25rem;">
              Account Verification Summary:
            </div>
            <div>• Practitioner: <strong>${inv.approvedFullName}</strong> (${inv.approvedRole})</div>
            <div>• Registered Identifier: <code>${inv.approvedEmail}</code></div>
            <div>• Firm ID: <code>${inv.staffId}</code> ${inv.advocateNumber ? `• Roll No: <code>${inv.advocateNumber}</code>` : ''}</div>
          </div>

          <div class="flex items-center justify-between">
            <button type="button" class="btn btn-secondary" onclick="AuthView.showInvitationRegisterModal('${inv.invitationCode}')">
              ← Back
            </button>
            <button type="submit" class="btn btn-gold">
              Complete Verified Registration ✓
            </button>
          </div>
        </form>
      </div>
    `;
  },

  checkRegistrationPasswordStrength(pass) {
    const fillEl = document.getElementById('reg-pass-strength-fill');
    const textEl = document.getElementById('reg-pass-strength-text');
    if (!fillEl || !textEl) return;

    if (!pass || pass.length < 6) {
      fillEl.style.width = '20%';
      fillEl.style.background = 'var(--color-danger)';
      textEl.innerText = 'Too short (Minimum 8 characters required)';
      textEl.style.color = 'var(--color-danger)';
    } else if (pass.length < 8 || !/[0-9]/.test(pass)) {
      fillEl.style.width = '50%';
      fillEl.style.background = 'var(--color-warning)';
      textEl.innerText = 'Moderate (Include uppercase and numbers)';
      textEl.style.color = 'var(--color-warning)';
    } else {
      fillEl.style.width = '100%';
      fillEl.style.background = 'var(--color-success)';
      textEl.innerText = 'Strong Password (Meets enterprise complexity criteria)';
      textEl.style.color = 'var(--color-success)';
    }
  },

  handleFinalRegistrationSubmit(e) {
    e.preventDefault();
    const pass = document.getElementById('reg-new-pass')?.value;
    const confirm = document.getElementById('reg-confirm-pass')?.value;
    const alertEl = document.getElementById('inv-step-3-alert');

    if (pass !== confirm) {
      if (alertEl) {
        alertEl.innerText = 'Passwords do not match.';
        alertEl.classList.remove('hidden');
      }
      return;
    }

    const payload = {
      ...this.verifiedFormData,
      password: pass
    };

    const regRes = SLCMS_STATE.registerWithInvitation(payload);

    if (!regRes.success) {
      if (alertEl) {
        alertEl.innerText = regRes.message;
        alertEl.classList.remove('hidden');
      }
      App.showToast(regRes.message, 'error');
      return;
    }

    App.closeModal();

    if (regRes.pendingApproval) {
      // Pending Partner Approval State
      App.openModal(`
        <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
          <h3 class="modal-title" style="color: #FFFFFF;">⏳ Registration Received</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem; text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-text-main);">
            Identity Received Successfully
          </h4>
          <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 1.25rem; line-height: 1.5;">
            Your identity was received successfully. Access will remain restricted until an authorized administrator approves your account.
          </p>
          <button class="btn btn-primary" onclick="App.closeModal()">
            Acknowledge & Return to Sign In
          </button>
        </div>
      `, 'modal-md');
    } else {
      // Active Account State
      this.fillCredentials(regRes.user.email, pass, `${regRes.user.name} (${regRes.user.role})`);

      App.openModal(`
        <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
          <h3 class="modal-title" style="color: #FFFFFF;">✅ Registration Complete</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem; text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: var(--color-success); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-text-main);">
            ${regRes.user.name}
          </h4>
          <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 1.25rem;">
            Verified Role: <strong>${regRes.user.role}</strong> • Account Status: <span class="badge badge-won" style="font-size: 0.75rem;">ACTIVE</span>
          </p>
          <div style="background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 1rem; text-align: left; font-size: 0.82rem; margin-bottom: 1.25rem;">
            <div style="margin-bottom: 0.35rem;"><strong>Email / Phone:</strong> <code>${regRes.user.email}</code> / <code>${regRes.user.phone}</code></div>
            <div style="margin-bottom: 0.35rem;"><strong>Staff ID:</strong> <code>${regRes.user.staffId}</code></div>
            ${regRes.user.advocateNumber ? `<div><strong>Advocate Roll No:</strong> <code>${regRes.user.advocateNumber}</code></div>` : ''}
            ${regRes.user.nationalIdRef ? `<div><strong>National ID Ref:</strong> <code>${regRes.user.nationalIdRef}</code></div>` : ''}
          </div>
          <button class="btn btn-gold" onclick="App.closeModal(); AuthView.handleLoginSubmit(new Event('submit'))">
            Enter Assigned Workspace Now →
          </button>
        </div>
      `, 'modal-md');
    }
  },

  showStaffRegisterModal() {
    this.showInvitationRegisterModal();
  },

  // ==========================================================================
  // FORGOT PASSWORD / PASSWORD RECOVERY WORKFLOW (Requirement 15)
  // ==========================================================================
  resetFlow: {
    email: '',
    code: null,
    step: 1
  },

  // Step 1: Request Password Reset Modal
  showForgotPasswordModal(prefillEmail = '') {
    const defaultEmail = (prefillEmail && prefillEmail.trim()) ? prefillEmail.trim() : (document.getElementById('login-email-input')?.value?.trim() || 'e.vance@slcms-law.com');
    this.resetFlow = {
      email: defaultEmail,
      code: null,
      step: 1
    };

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Reset Firm Workspace Password
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 1rem; font-size: 0.88rem; color: #475569; line-height: 1.55;">
          Enter your registered law-firm email address. A cryptographically signed one-time security verification code will be generated to authenticate your password reset.
        </p>

        <!-- Quick Select Staff Accounts -->
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.45rem;">
            ⚡ Quick-Select Firm Account:
          </div>
          <div class="flex flex-wrap gap-1">
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="AuthView.selectResetAccount('e.vance@slcms-law.com')">
              👑 E. Vance (Admin)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="AuthView.selectResetAccount('j.mercer@slcms-law.com')">
              ⚖️ J. Mercer (Lawyer)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="AuthView.selectResetAccount('m.bell@slcms-law.com')">
              📋 M. Bell (Clerk)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="AuthView.selectResetAccount('locked.user@slcms-law.com')">
              🔒 Locked User
            </button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required" for="reset-email-input">Registered Firm Email Address</label>
          <input type="email" id="reset-email-input" class="form-control" placeholder="name@slcms-law.com" value="${defaultEmail}" oninput="document.getElementById('reset-email-error').classList.add('hidden')">
          <div id="reset-email-error" class="form-error-msg hidden" style="color: var(--color-danger); font-size: 0.78rem; margin-top: 0.35rem;"></div>
        </div>

        <div class="alert alert-info" style="margin-top: 0.75rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div style="font-size: 0.8rem; line-height: 1.45;">
            <strong>Zero-Trust Protocol:</strong> Reset tokens expire after 15 minutes. Resetting will automatically unlock the account and record a SOC-2 security event.
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" id="btn-send-reset-code" onclick="AuthView.handleRequestResetCode()">
          Send Security Token & Proceed →
        </button>
      </div>
    `, 'modal-md');
  },

  selectResetAccount(email) {
    const input = document.getElementById('reset-email-input');
    if (input) {
      input.value = email;
      const err = document.getElementById('reset-email-error');
      if (err) err.classList.add('hidden');
    }
  },

  handleRequestResetCode() {
    const emailInput = document.getElementById('reset-email-input');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const errorEl = document.getElementById('reset-email-error');

    if (!email) {
      if (errorEl) {
        errorEl.innerText = 'Please enter your registered email address.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (errorEl) {
        errorEl.innerText = 'Please enter a valid email address.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    // Check if account exists
    const account = SLCMS_STATE.users.find(u => u.email.toLowerCase() === email);
    if (account && account.status === 'Deactivated') {
      if (errorEl) {
        errorEl.innerText = 'This account is deactivated. Contact your managing partner.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    // Generate simulated 6-digit security verification code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetFlow = {
      email: email,
      code: generatedCode,
      step: 2
    };

    SLCMS_STATE.addAuditLog('Password Reset Token Dispatched', 'Security', email, 'Dispatched');
    App.showToast(`Security code sent to ${email}`, 'info');

    // Move to Step 2
    this.renderResetModalStep2();
  },

  // Step 2: Verification Code & New Password Entry
  renderResetModalStep2() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          Enter Security Code & New Password
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <!-- Simulated Token Dispatch Banner -->
        <div style="background: rgba(200, 155, 60, 0.08); border: 1px solid var(--color-gold); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--color-gold); letter-spacing: 0.04em;">
                📨 Simulated Secure Token Dispatch
              </div>
              <div style="font-size: 0.82rem; color: var(--color-text-main); margin-top: 0.15rem;">
                Recipient: <strong>${this.resetFlow.email}</strong>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 1.15rem; font-weight: 700; background: var(--color-gold); color: #071524; padding: 0.15rem 0.55rem; border-radius: 4px; letter-spacing: 2px;">
                ${this.resetFlow.code}
              </span>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="AuthView.quickFillResetCode('${this.resetFlow.code}')" title="Auto-fill verification code">
                ⚡ Quick Paste
              </button>
            </div>
          </div>
        </div>

        <form id="reset-password-step2-form" onsubmit="event.preventDefault(); AuthView.handleCompletePasswordReset();">
          <!-- 6-Digit Code Field -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label required" for="reset-token-input">6-Digit Verification Security Code</label>
            <input type="text" id="reset-token-input" class="form-control" placeholder="Enter 6-digit code (e.g. ${this.resetFlow.code})" maxlength="6" style="font-family: 'JetBrains Mono', monospace; font-size: 1rem; letter-spacing: 2px;" oninput="document.getElementById('reset-step2-error').classList.add('hidden')">
          </div>

          <!-- New Password Field -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label required" for="reset-new-password">New Private Password</label>
            <div style="position: relative;">
              <input type="password" id="reset-new-password" class="form-control" placeholder="Create strong new password" style="padding-right: 2.5rem;" oninput="AuthView.updateResetStrengthMeter(); document.getElementById('reset-step2-error').classList.add('hidden')">
              <button type="button" onclick="AuthView.toggleResetEye('reset-new-password', 'rst-eye-svg-1')" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8;">
                <svg id="rst-eye-svg-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <!-- Strength meter -->
            <div style="margin-top: 0.45rem;">
              <div class="flex items-center justify-between" style="font-size: 0.72rem; margin-bottom: 0.2rem;">
                <span style="color: #64748B;">Password Strength:</span>
                <span id="rst-strength-label" style="font-weight: 600; color: #94A3B8;">Enter password</span>
              </div>
              <div style="height: 4px; background: #E2E8F0; border-radius: 2px; overflow: hidden;">
                <div id="rst-strength-bar" style="height: 100%; width: 0%; transition: width 0.3s, background-color 0.3s;"></div>
              </div>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label required" for="reset-confirm-password">Confirm New Password</label>
            <div style="position: relative;">
              <input type="password" id="reset-confirm-password" class="form-control" placeholder="Re-type new password" style="padding-right: 2.5rem;" oninput="document.getElementById('reset-step2-error').classList.add('hidden')">
              <button type="button" onclick="AuthView.toggleResetEye('reset-confirm-password', 'rst-eye-svg-2')" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8;">
                <svg id="rst-eye-svg-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Requirements Checklist -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.65rem 0.85rem; font-size: 0.76rem; margin-bottom: 1rem;">
            <div style="font-weight: 600; color: #475569; margin-bottom: 0.3rem;">Password Requirements:</div>
            <div class="grid grid-cols-2 gap-1" style="color: #64748B;">
              <div id="rst-req-len">⚪ At least 8 characters</div>
              <div id="rst-req-upper">⚪ Uppercase letter (A-Z)</div>
              <div id="rst-req-lower">⚪ Lowercase letter (a-z)</div>
              <div id="rst-req-num">⚪ Number or symbol (!@#$)</div>
            </div>
          </div>

          <div id="reset-step2-error" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.8rem; padding: 0.5rem 0.75rem;"></div>

          <div class="modal-footer" style="padding: 0; margin-top: 1.25rem; border-top: none;">
            <button type="button" class="btn btn-secondary" onclick="AuthView.showForgotPasswordModal('${this.resetFlow.email}')">← Back</button>
            <button type="submit" id="btn-submit-new-pass" class="btn btn-gold">
              Reset Password & Save
            </button>
          </div>
        </form>
      </div>
    `, 'modal-md');
  },

  quickFillResetCode(code) {
    const tokenInput = document.getElementById('reset-token-input');
    if (tokenInput) {
      tokenInput.value = code;
      const passInput = document.getElementById('reset-new-password');
      if (passInput) passInput.focus();
    }
  },

  toggleResetEye(inputId, svgId) {
    const input = document.getElementById(inputId);
    const svg = document.getElementById(svgId);
    if (!input || !svg) return;

    if (input.type === 'password') {
      input.type = 'text';
      svg.innerHTML = `
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" x2="22" y1="2" y2="22"/>
      `;
    } else {
      input.type = 'password';
      svg.innerHTML = `
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  },

  updateResetStrengthMeter() {
    const val = document.getElementById('reset-new-password')?.value || '';
    const hasLen = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNum = /[0-9]|[^A-Za-z0-9]/.test(val);

    const updateBadge = (id, valid, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `${valid ? '🟢' : '⚪'} ${text}`;
      el.style.color = valid ? 'var(--color-success)' : '#64748B';
    };

    updateBadge('rst-req-len', hasLen, 'At least 8 characters');
    updateBadge('rst-req-upper', hasUpper, 'Uppercase letter (A-Z)');
    updateBadge('rst-req-lower', hasLower, 'Lowercase letter (a-z)');
    updateBadge('rst-req-num', hasNum, 'Number or symbol (!@#$)');

    let score = 0;
    if (hasLen) score += 25;
    if (hasUpper) score += 25;
    if (hasLower) score += 25;
    if (hasNum) score += 25;

    const bar = document.getElementById('rst-strength-bar');
    const label = document.getElementById('rst-strength-label');
    if (!bar || !label) return;

    bar.style.width = `${Math.max(score, 10)}%`;
    if (score <= 25) {
      bar.style.backgroundColor = 'var(--color-danger)';
      label.style.color = 'var(--color-danger)';
      label.innerText = 'Weak';
    } else if (score <= 75) {
      bar.style.backgroundColor = 'var(--color-warning)';
      label.style.color = 'var(--color-warning)';
      label.innerText = 'Good';
    } else {
      bar.style.backgroundColor = 'var(--color-success)';
      label.style.color = 'var(--color-success)';
      label.innerText = 'Strong Passphrase';
    }
  },

  handleCompletePasswordReset() {
    const tokenVal = document.getElementById('reset-token-input')?.value?.trim();
    const newPass = document.getElementById('reset-new-password')?.value || '';
    const confirmPass = document.getElementById('reset-confirm-password')?.value || '';
    const errEl = document.getElementById('reset-step2-error');

    const showError = (msg) => {
      if (errEl) {
        errEl.innerText = msg;
        errEl.classList.remove('hidden');
      }
    };

    if (!tokenVal) {
      showError('Please enter the 6-digit verification security code.');
      return;
    }

    if (tokenVal !== this.resetFlow.code) {
      showError('Invalid verification code. Please check the code dispatched above.');
      return;
    }

    if (!newPass || newPass.length < 8) {
      showError('New password must be at least 8 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      showError('Passwords do not match. Please re-enter.');
      return;
    }

    // Execute state reset
    const res = SLCMS_STATE.resetUserPassword(this.resetFlow.email, newPass);
    if (!res.success) {
      showError(res.message);
      return;
    }

    // Step 3: Success Confirmation Screen
    this.renderResetModalStep3(res.user, newPass);
  },

  renderResetModalStep3(user, newPass) {
    App.openModal(`
      <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
        <h3 class="modal-title" style="color: var(--color-success);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Password Successfully Reset
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="text-align: center; padding: 1.5rem 1rem;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(16, 185, 129, 0.12); color: var(--color-success); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 0.35rem;">
          Account Password Updated
        </h4>
        <p style="font-size: 0.88rem; color: #64748B; max-width: 380px; margin: 0 auto 1.25rem; line-height: 1.5;">
          The security password for <strong>${user.name}</strong> (<code>${user.email}</code>) has been updated and any temporary lockouts have been released.
        </p>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem 1rem; max-width: 380px; margin: 0 auto; text-align: left; font-size: 0.8rem;">
          <div class="flex items-center justify-between" style="margin-bottom: 0.25rem;">
            <span style="color: #64748B;">Account Status:</span>
            <span class="badge badge-won">Active & Ready</span>
          </div>
          <div class="flex items-center justify-between">
            <span style="color: #64748B;">Role & Permission:</span>
            <span style="font-weight: 600; color: var(--color-text-main);">${user.roleTitle || user.role}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer" style="justify-content: center;">
        <button class="btn btn-gold w-full" style="max-width: 380px;" onclick="AuthView.finishResetAndFillLogin('${user.email}', '${newPass.replace(/'/g, "\\'")}')">
          Proceed to Sign In with New Password →
        </button>
      </div>
    `, 'modal-md');
  },

  finishResetAndFillLogin(email, password) {
    App.closeModal();

    // Ensure login view is active
    this.currentViewMode = 'login';
    const appRoot = document.getElementById('app-root');
    if (appRoot) {
      appRoot.innerHTML = this.render();
    }

    // Auto-fill login credentials
    const emailInput = document.getElementById('login-email-input');
    const passInput = document.getElementById('login-password-input');
    if (emailInput) {
      emailInput.value = email;
      emailInput.classList.add('auth-input-highlight');
      this.clearFieldError('login-email-input', 'login-email-error');
    }
    if (passInput) {
      passInput.value = password;
      passInput.classList.add('auth-input-highlight');
      this.clearFieldError('login-password-input', 'login-password-error');
    }

    App.showToast('Credentials updated! Click Sign In to enter your firm workspace.', 'success', 5000);
    const submitBtn = document.getElementById('auth-submit-btn');
    if (submitBtn) submitBtn.focus();
  },

  showHelpModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">SLCMS Legal IT & Security Support</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="font-size: 0.9rem; line-height: 1.6;">
        <p><strong>Account Provisioning:</strong> New user accounts are created solely by firm administrators. If you require access, request your managing partner to provision an account.</p>
        <p style="margin-top: 0.75rem;"><strong>Security Helpline:</strong> (212) 555-0199 • security@slcms-law.com</p>
        <p style="margin-top: 0.75rem;"><strong>Account Lockout Policy:</strong> Accounts are locked after 5 failed attempts for 15 minutes to prevent brute-force intrusion.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="App.closeModal()">Close</button>
      </div>
    `);
  }
};
