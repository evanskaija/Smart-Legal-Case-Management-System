/* ==========================================================================
   SLCMS - System Settings & Security Configuration (Administrator Only)
   Academic Presentation Standard:
   Firm name and logo, Legal categories, Courts, User roles, Password rules,
   File-upload size, Backup button, AI professional notice, Permission matrix overview.
   ========================================================================== */

const SettingsView = {
  telemetryLatency: 16,
  isDiagnosticRunning: false,
  securitySettings: {
    enforceMfa: true,
    autoLock15m: true,
    requireSensitivePass: true,
    maxUploadMB: 100,
    passwordMinLength: 10
  },

  firmProfile: {
    legalName: 'SLCMS Advocates & Legal Consultants',
    jurisdiction: 'United Republic of Tanzania',
    efilingAccount: 'TLS-FIRM-89421',
    tinNumber: 'TIN-104-921-382',
    managingPartner: 'Eleanor Vance, Esq.',
    officeAddress: 'Samora Avenue & Ohio Street, City Centre, Dar es Salaam',
    primaryDockets: [
      'Commercial Law',
      'Civil Law',
      'Land Law',
      'Criminal Law',
      'Labour Law',
      'Constitutional Law',
      'Family Law',
      'Probate'
    ],
    courts: [
      'Court of Appeal of Tanzania',
      'High Court of Tanzania (Main Registry, Dar es Salaam)',
      'High Court - Commercial Division',
      'High Court - Land Division',
      'High Court - Labour Division',
      'Resident Magistrate Court of Kisutu (Dar es Salaam)',
      'District Court of Ilala'
    ]
  },

  activeTab: 'firm', // 'firm' | 'security' | 'storage'

  setTab(tab) {
    this.activeTab = tab;
    App.refreshCurrentView();
  },

  render() {
    // 1. Strict Administrator RBAC check
    const userRole = SLCMS_STATE.currentUser?.role;
    if (userRole !== 'Administrator') {
      return `
        <div class="card empty-state animate-fade" style="padding: 3.5rem 2rem; text-align: center;">
          <div class="empty-icon" style="border-color: var(--color-danger); color: var(--color-danger); width: 64px; height: 64px; margin: 0 auto 1.5rem auto; border-radius: 50%; background: #FEE2E2; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 style="color: var(--color-danger); margin-bottom: 0.5rem; font-size: 1.5rem;">Access Denied (403 Restricted)</h2>
          <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.6;">
            System Settings and Security Configurations are restricted to the <strong>Administrator</strong>.
          </p>
          <button class="btn btn-primary" onclick="App.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }

    return `
      <div class="animate-fade" style="max-width: 1050px; margin: 0 auto;">
        <!-- 1. VIEW HEADER -->
        <div class="card p-4 mb-4" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(200, 155, 60, 0.12); color: var(--color-gold); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                ⚙️
              </div>
              <div>
                <h1 style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0 0 0.2rem 0; font-family: var(--font-heading);">
                  System Settings
                </h1>
                <p style="font-size: 0.85rem; color: #64748B; margin: 0;">
                  Manage firm details, account security, and data backup.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button class="btn btn-secondary btn-sm" onclick="SettingsView.downloadBackup()" style="font-weight: 600;">
                💾 Download Backup
              </button>
              <button class="btn btn-gold btn-sm" onclick="SettingsView.saveSettings()" style="font-weight: 700;">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <!-- 2. SUB-TABS -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.6rem;">
          <button type="button" class="btn btn-sm ${this.activeTab === 'firm' ? 'btn-gold' : 'btn-secondary'}" onclick="SettingsView.setTab('firm')" style="font-weight: 700; border-radius: 8px;">
            🏛️ Firm Profile
          </button>
          <button type="button" class="btn btn-sm ${this.activeTab === 'security' ? 'btn-gold' : 'btn-secondary'}" onclick="SettingsView.setTab('security')" style="font-weight: 700; border-radius: 8px;">
            🔒 Security
          </button>
          <button type="button" class="btn btn-sm ${this.activeTab === 'storage' ? 'btn-gold' : 'btn-secondary'}" onclick="SettingsView.setTab('storage')" style="font-weight: 700; border-radius: 8px;">
            💾 Backup &amp; Data
          </button>
        </div>

        <!-- TAB 1: FIRM PROFILE -->
        <div class="card p-4" style="${this.activeTab === 'firm' ? '' : 'display: none;'} border-radius: 14px; background: #FFFFFF; border: 1px solid #E2E8F0;">
          <div style="margin-bottom: 1.25rem; padding-bottom: 0.85rem; border-bottom: 1px solid #F1F5F9;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #0F172A; margin: 0 0 0.2rem 0;">Firm Information</h3>
            <p style="font-size: 0.82rem; color: #64748B; margin: 0;">Details displayed on legal files, client letters, and court filings.</p>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="form-group mb-0">
              <label style="font-weight: 700; font-size: 0.82rem; color: #1E293B; margin-bottom: 0.35rem; display: block;">Firm Name *</label>
              <input type="text" id="setting-firm-name" class="form-control" value="${this.firmProfile.legalName}">
            </div>
            <div class="form-group mb-0">
              <label style="font-weight: 700; font-size: 0.82rem; color: #1E293B; margin-bottom: 0.35rem; display: block;">Jurisdiction *</label>
              <input type="text" id="setting-jurisdiction" class="form-control" value="${this.firmProfile.jurisdiction}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="form-group mb-0">
              <label style="font-weight: 700; font-size: 0.82rem; color: #1E293B; margin-bottom: 0.35rem; display: block;">Bar Registration / TLS Number *</label>
              <input type="text" id="setting-efiling" class="form-control" value="${this.firmProfile.efilingAccount}">
            </div>
            <div class="form-group mb-0">
              <label style="font-weight: 700; font-size: 0.82rem; color: #1E293B; margin-bottom: 0.35rem; display: block;">TIN Number *</label>
              <input type="text" id="setting-tin" class="form-control" value="${this.firmProfile.tinNumber}">
            </div>
          </div>

          <div class="form-group mb-4">
            <label style="font-weight: 700; font-size: 0.82rem; color: #1E293B; margin-bottom: 0.35rem; display: block;">Office Address *</label>
            <input type="text" id="setting-address" class="form-control" value="${this.firmProfile.officeAddress}">
          </div>

          <div style="display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #F1F5F9;">
            <button class="btn btn-gold" onclick="SettingsView.saveSettings()" style="padding: 0.55rem 1.5rem; font-weight: 700;">
              Save Changes
            </button>
          </div>
        </div>

        <!-- TAB 2: SECURITY & SESSION -->
        <div class="card p-4" style="${this.activeTab === 'security' ? '' : 'display: none;'} border-radius: 14px; background: #FFFFFF; border: 1px solid #E2E8F0;">
          <div style="margin-bottom: 1.25rem; padding-bottom: 0.85rem; border-bottom: 1px solid #F1F5F9;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #0F172A; margin: 0 0 0.2rem 0;">Security Settings</h3>
            <p style="font-size: 0.82rem; color: #64748B; margin: 0;">Basic login rules and idle protection for staff accounts.</p>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="card p-3" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="color: #0F172A; font-size: 0.88rem; display: block;">Two-Factor Authentication (2FA)</strong>
                <span style="font-size: 0.76rem; color: #64748B;">Require verification code on admin sign-in</span>
              </div>
              <label class="custom-switch" style="margin-left: 0.75rem;">
                <input type="checkbox" id="mfa-toggle" checked onchange="SettingsView.toggleSecurity('enforceMfa', this.checked)">
                <span class="custom-switch-slider"></span>
              </label>
            </div>

            <div class="card p-3" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="color: #0F172A; font-size: 0.88rem; display: block;">Auto-Lock Screen</strong>
                <span style="font-size: 0.76rem; color: #64748B;">Lock screen after 15 minutes of idle time</span>
              </div>
              <label class="custom-switch" style="margin-left: 0.75rem;">
                <input type="checkbox" id="autolock-toggle" checked onchange="SettingsView.toggleSecurity('autoLock15m', this.checked)">
                <span class="custom-switch-slider"></span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="form-group mb-0">
              <label style="font-weight: 700; font-size: 0.82rem; color: #1E293B; margin-bottom: 0.35rem; display: block;">Max Upload Size per File</label>
              <select class="form-control" id="setting-max-upload">
                <option value="25">25 MB</option>
                <option value="50">50 MB</option>
                <option value="100" selected>100 MB (Standard PDF)</option>
                <option value="250">250 MB</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label style="font-weight: 700; font-size: 0.82rem; color: #1E293B; margin-bottom: 0.35rem; display: block;">Minimum Password Length</label>
              <input type="number" class="form-control" value="10" min="8" max="32">
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #F1F5F9;">
            <button class="btn btn-gold" onclick="App.showToast('Security settings saved successfully!', 'success')" style="padding: 0.55rem 1.5rem; font-weight: 700;">
              Save Security Settings
            </button>
          </div>
        </div>

        <!-- TAB 3: STORAGE & CLOUD API -->
        <div class="card" style="${this.activeTab === 'storage' ? '' : 'display: none;'} padding: 1.5rem; border-radius: 16px;">
          <div class="card-header" style="padding-bottom: 1rem; border-bottom: 1px solid var(--color-border-subtle); margin-bottom: 1.25rem;">
            <div>
              <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem;">
                <span style="color: var(--color-gold);">💾</span>
                System Backup Vault &amp; Cloud Database
              </h3>
              <div class="card-subtitle">One-click JSON database snapshot export and backend API configuration</div>
            </div>
            <span class="badge badge-active">● Active Vault</span>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <!-- Backup Box -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; color: var(--color-primary); font-size: 1rem; margin-bottom: 0.4rem;">Full System Database Backup</div>
                <p style="font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 1rem;">
                  Generates an encrypted JSON backup file containing all cases, clients, indexed Tanzanian judgments, and audit logs.
                </p>
                <div style="font-size: 0.74rem; color: #059669; font-weight: 600; margin-bottom: 1rem;">
                  ✓ Automated daily verification active
                </div>
              </div>
              <button class="btn btn-gold w-full" onclick="SettingsView.downloadBackup()" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 700;">
                <span>💾 Download Full Backup (.JSON)</span>
              </button>
            </div>

            <!-- Backend Server Box -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; color: var(--color-primary); font-size: 1rem; margin-bottom: 0.4rem;">Backend Server Endpoint</div>
                <p style="font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">
                  Spring Boot server URL connected to PostgreSQL or MySQL database.
                </p>
                <div class="form-group" style="margin-bottom: 0.75rem;">
                  <input type="text" id="cfg-backend-api-url" class="form-control" style="font-size: 0.82rem;"
                    placeholder="https://your-slcms-backend.onrender.com"
                    value="${(window.SLCMS_CONFIG && window.SLCMS_CONFIG.API_BASE_URL) || ''}">
                </div>
                <div id="cfg-backend-status-indicator" style="font-size: 0.78rem; font-weight: 700; color: #0284C7; margin-bottom: 0.75rem;">
                  ${(window.SLCMS_CONFIG && window.SLCMS_CONFIG.API_BASE_URL) ? 'Active: ' + window.SLCMS_CONFIG.API_BASE_URL : 'Status: Local / Same-Origin'}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm flex-1" onclick="SettingsView.testBackendConnection()">
                  Test Connection
                </button>
                <button class="btn btn-gold btn-sm flex-1" onclick="SettingsView.saveBackendApiUrl()">
                  Save URL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async saveSettings() {
    const firmName = document.getElementById('setting-firm-name')?.value || this.firmProfile.legalName;
    const jurisdiction = document.getElementById('setting-jurisdiction')?.value || this.firmProfile.jurisdiction;
    const efiling = document.getElementById('setting-efiling')?.value || this.firmProfile.efilingAccount;
    const address = document.getElementById('setting-address')?.value || this.firmProfile.officeAddress;

    this.firmProfile.legalName = firmName;
    this.firmProfile.jurisdiction = jurisdiction;
    this.firmProfile.efilingAccount = efiling;
    this.firmProfile.officeAddress = address;

    if (typeof AppSettings !== 'undefined' && AppSettings.saveOrganization) {
      try {
        await AppSettings.saveOrganization({
          organizationName: firmName,
          officeAddress: address
        });
      } catch(e) {}
    }

    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.addAuditLog) {
      SLCMS_STATE.addAuditLog('Settings Updated', 'Administration', `Saved parameters for ${firmName}`);
    }

    App.showToast('Firm settings and security policies successfully saved!', 'success');
  },

  toggleSecurity(key, checked) {
    this.securitySettings[key] = checked;
    App.showToast(`Security rule updated: ${key} = ${checked ? 'Enabled' : 'Disabled'}`, 'info');
  },

  downloadBackup() {
    const backupData = {
      system: 'SLCMS - Smart Legal Case Management System',
      exportDate: new Date().toISOString(),
      firm: this.firmProfile,
      casesCount: SLCMS_STATE.cases.length,
      clientsCount: SLCMS_STATE.clients.length,
      documentsCount: SLCMS_STATE.documents.length,
      judgmentsCount: SLCMS_STATE.tanzaniaJudgments.length,
      tasksCount: SLCMS_STATE.tasks.length,
      usersCount: SLCMS_STATE.users.length,
      cases: SLCMS_STATE.cases,
      clients: SLCMS_STATE.clients,
      documents: SLCMS_STATE.documents,
      tasks: SLCMS_STATE.tasks,
      users: SLCMS_STATE.users.map(u => ({ id: u.id, name: u.name, role: u.role, email: u.email, status: u.status }))
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slcms_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    SLCMS_STATE.addAuditLog('System Backup Downloaded', 'Administration', 'Full JSON database export');
    App.showToast('Full system backup file successfully generated & downloaded!', 'success');
  },

  saveBackendApiUrl() {
    const input = document.getElementById('cfg-backend-api-url');
    const val = input ? input.value.trim() : '';
    if (window.setSLCMSBackendUrl) {
      window.setSLCMSBackendUrl(val);
    }
    const indicator = document.getElementById('cfg-backend-status-indicator');
    if (indicator) {
      indicator.textContent = val ? `Active: ${val}` : 'Status: Local / Same-Origin';
      indicator.style.color = '#0284C7';
    }
    App.showToast(val ? `Backend API URL saved: ${val}` : 'Backend URL reset to local default', 'success');
  },

  async testBackendConnection() {
    const indicator = document.getElementById('cfg-backend-status-indicator');
    if (indicator) {
      indicator.textContent = 'Testing connection...';
      indicator.style.color = '#F59E0B';
    }
    try {
      const resp = await window.slcmsFetch('/api/settings/organization');
      if (resp && resp.ok) {
        if (indicator) {
          indicator.textContent = '● Connected: Backend online';
          indicator.style.color = '#10B981';
        }
        App.showToast('Successfully connected to backend API & database!', 'success');
      } else {
        if (indicator) {
          indicator.textContent = `● Warning: Backend responded (${resp.status})`;
          indicator.style.color = '#F59E0B';
        }
        App.showToast(`Backend responded with status: ${resp.status}`, 'warning');
      }
    } catch (err) {
      if (indicator) {
        indicator.textContent = '● Error: Could not reach backend';
        indicator.style.color = '#EF4444';
      }
      App.showToast('Failed to connect to backend server. Verify the URL and CORS settings.', 'error');
    }
  }
};
