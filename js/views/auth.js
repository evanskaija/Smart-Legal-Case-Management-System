/* ==========================================================================
   SLCMS - Secure Enterprise Authentication View
   Zero-Trust Law Firm Architecture | Role-Based Access | First-Login Flow
   ========================================================================== */

const AuthView = {
  // Authentication View Sub-State
  currentViewMode: 'login', // 'login' | 'first_login_password_change' | 'locked_notice'
  tempAuthUser: null, // Temporary session context for first-login reset

  render() {
    if (this.currentViewMode === 'first_login_password_change' && this.tempAuthUser) {
      return this.renderFirstLoginPasswordChangeView();
    }

    return `
      <div class="auth-page-container animate-fade" style="position: relative;">
        <!-- Auth Screen Theme Toggle -->
        <button class="topbar-icon-btn" onclick="App.toggleTheme()" title="Toggle Dark / Light Mode" style="position: absolute; top: 1.25rem; right: 1.5rem; z-index: 10; background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
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
                Manage every legal matter securely and efficiently.
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
                  <span>Secure</span>
                </div>

                <div class="auth-pill-badge">
                  <span class="badge-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                    </svg>
                  </span>
                  <span>Organized</span>
                </div>

                <div class="auth-pill-badge">
                  <span class="badge-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="7" r="4"/>
                      <path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
                      <circle cx="12" cy="12" r="10" stroke-width="1.5"/>
                    </svg>
                  </span>
                  <span>Accountable</span>
                </div>
              </div>
            </div>

            <!-- Left Bottom Spacer -->
            <div style="font-size: 0.8rem; color: #94A3B8;">
              Enterprise Law-Firm Portal • Authorized Personnel Only • Zero-Trust Enforced
            </div>
          </div>

          <!-- 2. Right Form Section -->
          <div class="auth-form-panel">
            <div class="auth-white-card">
              <!-- Circular Golden Lock Badge -->
              <div class="auth-card-lock-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  <circle cx="12" cy="16" r="1.5"/>
                </svg>
              </div>

              <!-- Card Header -->
              <h2 class="auth-card-title">Welcome Back</h2>
              <p class="auth-card-subtitle">
                Sign in to continue to your workspace
              </p>

              <!-- Server/Security Alert Banner -->
              <div id="auth-server-alert" class="alert alert-danger hidden" style="margin-bottom: 1.25rem; font-size: 0.85rem; text-align: left;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div id="auth-server-alert-text"></div>
              </div>

              <!-- Standard Login Form (No Public Registration) -->
              <form id="auth-main-login-form" onsubmit="AuthView.handleLoginSubmit(event)" novalidate>
                <!-- Email or Username Field -->
                <div class="auth-input-group">
                  <label for="login-email-input">Email or Username</label>
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
                      placeholder="name@slcms-law.com or EMP-1001" 
                      value="e.vance@slcms-law.com" 
                      autocomplete="username"
                      oninput="AuthView.clearFieldError('login-email-input', 'login-email-error')"
                    >
                  </div>
                  <div id="login-email-error" class="form-error-msg hidden"></div>
                </div>

                <!-- Password Field -->
                <div class="auth-input-group">
                  <label for="login-password-input">Password</label>
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
                      placeholder="••••••••••••" 
                      value="SecretLawFirm2026!" 
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

                <!-- Remember Me Security Advisory Warning -->
                <div style="font-size: 0.72rem; color: #64748B; text-align: left; margin-bottom: 1.25rem; background: #F8FAFC; padding: 0.45rem 0.65rem; border-radius: 4px; border-left: 2.5px solid var(--color-gold);">
                  🔒 <em>Do not use Remember me on a shared or public computer.</em>
                </div>

                <!-- Sign In Button -->
                <button type="submit" id="auth-submit-btn" class="auth-btn-signin">
                  Sign In
                </button>
              </form>

              <!-- Bottom Security Protection Note -->
              <div class="auth-security-footer-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>Your session and information are protected.</span>
              </div>

              <!-- Interactive Security & Testing Matrix Sandbox -->
              <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px dashed #E2E8F0; text-align: left;">
                <div class="flex items-center justify-between" style="margin-bottom: 0.65rem;">
                  <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                    🧪 Security States Showcase
                  </span>
                  <span class="badge badge-neutral" style="font-size: 0.65rem;">Requirement 18</span>
                </div>
                
                <div class="grid grid-cols-2 gap-2" style="font-size: 0.75rem;">
                  <button type="button" class="btn btn-secondary btn-sm w-full" onclick="AuthView.fillCredentials('e.vance@slcms-law.com', 'SecretLawFirm2026!')" title="Active Admin Partner">
                    👑 Admin Partner
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm w-full" onclick="AuthView.fillCredentials('j.mercer@slcms-law.com', 'SecretLawFirm2026!')" title="Active Senior Counsel">
                    ⚖️ Senior Counsel
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm w-full" onclick="AuthView.fillCredentials('m.bell@slcms-law.com', 'SecretLawFirm2026!')" title="Active Legal Staff">
                    📋 Legal Clerk
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm w-full" onclick="AuthView.fillCredentials('temp.counsel@slcms-law.com', 'TempPass2026!')" title="First Login with Temporary Password">
                    🔑 1st Login Reset
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm w-full" onclick="AuthView.fillCredentials('disabled.user@slcms-law.com', 'SecretLawFirm2026!')" title="Deactivated Account Test">
                    🚫 Deactivated User
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm w-full" onclick="AuthView.fillCredentials('locked.user@slcms-law.com', 'SecretLawFirm2026!')" title="Locked Account (5 Failed Attempts)">
                    🔒 Locked User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Bottom Dark Navy Footer -->
        <footer class="auth-global-footer">
          <span>© 2026 SLCMS Legal Technologies Inc.</span>
          <span>•</span>
          <a href="javascript:void(0)" onclick="App.showToast('Firm Security & Privacy Policies (SOC-2 Type II Certified)', 'info')">Privacy</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="AuthView.showHelpModal()">Help & Security Helpline</a>
        </footer>
      </div>
    `;
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
      textEl.innerText = msg;
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
  fillCredentials(email, password) {
    this.hideServerAlert();
    const emailInput = document.getElementById('login-email-input');
    const passInput = document.getElementById('login-password-input');
    if (emailInput) {
      emailInput.value = email;
      this.clearFieldError('login-email-input', 'login-email-error');
    }
    if (passInput) {
      passInput.value = password;
      this.clearFieldError('login-password-input', 'login-password-error');
    }
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
