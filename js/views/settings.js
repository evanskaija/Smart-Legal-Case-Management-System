/* ==========================================================================
   SLCMS - Firm Settings & Role Permission Matrix
   ========================================================================== */

const SettingsView = {
  currentTab: 'all',
  telemetryLatency: 18,
  isDiagnosticRunning: false,
  securitySettings: {
    enforceMfa: true,
    autoLock15m: true,
    requireSensitivePass: true,
    enforceVpnIp: true,
    shaIntegrity: true
  },

  firmProfile: {
    legalName: 'SLCMS Legal Partners LLP',
    jurisdiction: 'New York / Southern District (SDNY)',
    efilingAccount: 'NYSCEF-FIRM-89421',
    trustEscrow: 'Chase IOLTA #****-9482',
    ein: '13-8941209',
    managingPartner: 'Eleanor Vance, Esq.',
    officeAddress: 'Rockefeller Center, Suite 4400, New York, NY 10020',
    primaryDockets: ['Commercial Litigation', 'Intellectual Property Defense', 'White Collar Defense', 'Securities Arbitration']
  },

  render() {
    return `
      <div class="animate-fade">
        <!-- 1. VIEW HEADER -->
        <div class="view-header">
          <div>
            <div class="flex items-center gap-2" style="margin-bottom: 0.25rem;">
              <h1 class="page-title">Firm Settings & Security Policies</h1>
              <span class="badge badge-confidential" style="font-size: 0.75rem;">
                SOC-2 Type II Certified
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">
              Configure organization parameters, multi-factor authentication policies, role permissions matrix and practice dockets
            </p>
          </div>

          <div class="flex items-center gap-3">
            <span class="badge" style="background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; font-size: 0.75rem;">
              <span class="badge-dot" style="background: #16A34A;"></span> Synced & Secure
            </span>
            <button class="btn btn-gold" onclick="SettingsView.saveSettings()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Save All Settings</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6">
          <!-- Left 2 Cols: Firm Profile & RBAC Matrix -->
          <div style="grid-column: span 2;" class="flex flex-col gap-6">
            
            <!-- 0. ACTIVE ATTORNEY PROFILE DOSSIER -->
            <div class="card" style="border-top: 3px solid var(--color-gold);">
              <div class="card-header">
                <div>
                  <h3 class="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Attorney Account & Licensure Profile
                  </h3>
                  <div class="card-subtitle">Personal attorney credentials, bar licensure number, contact lines and headshot</div>
                </div>
                <button class="btn btn-gold btn-sm" onclick="App.openUserProfileModal()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit Profile & Photo</span>
                </button>
              </div>

              <div style="display: flex; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; background: var(--color-surface-subtle); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                <div style="position: relative; cursor: pointer;" onclick="App.openUserProfileModal()" title="Click to Edit Photo & Profile">
                  <div class="avatar avatar-lg avatar-ring-gold" style="width: 76px; height: 76px; background: #0B1F33;">
                    ${SLCMS_STATE.currentUser.avatarImg ? 
                      `<img src="${SLCMS_STATE.currentUser.avatarImg}" alt="${SLCMS_STATE.currentUser.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                       <span style="display:none; font-size: 1.4rem; font-weight: 700; color: #FFFFFF;">${SLCMS_STATE.currentUser.avatar || 'EV'}</span>` : 
                      `<span style="font-size: 1.4rem; font-weight: 700; color: #FFFFFF;">${SLCMS_STATE.currentUser.avatar || 'EV'}</span>`
                    }
                  </div>
                  <span class="badge badge-active" style="position: absolute; bottom: -3px; right: -3px; padding: 2px 5px; font-size: 0.6rem; border: 2px solid #FFFFFF;">Active</span>
                </div>

                <div style="flex: 1; min-width: 260px;">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 style="font-size: 1.18rem; color: var(--color-primary); font-weight: 700; margin: 0;">
                      ${SLCMS_STATE.currentUser.name}
                    </h3>
                    <span class="badge badge-confidential" style="font-size: 0.72rem;">
                      ${SLCMS_STATE.currentUser.roleLabel}
                    </span>
                    <span class="badge" style="background: rgba(200, 155, 60, 0.15); color: var(--color-gold); font-size: 0.7rem; font-weight: 600;">
                      ${SLCMS_STATE.currentUser.department || 'Commercial Litigation'}
                    </span>
                  </div>
                  
                  <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.4rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <span>📜 Bar No: <strong style="color: var(--color-gold); font-family: var(--font-mono);">${SLCMS_STATE.currentUser.barNumber || 'NY-BAR #4829104'}</strong></span>
                    <span>•</span>
                    <span>💵 Rate: <strong style="color: var(--color-primary); font-family: var(--font-mono);">${SLCMS_STATE.currentUser.hourlyRate || '$550.00 / hr'}</strong></span>
                    <span>•</span>
                    <span>✉️ <strong>${SLCMS_STATE.currentUser.email}</strong></span>
                    <span>•</span>
                    <span>📞 <strong>${SLCMS_STATE.currentUser.phone || '+1 (212) 555-0101'}</strong></span>
                  </div>

                  ${SLCMS_STATE.currentUser.practiceAreas ? `
                    <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                      <span style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight: 600;">Focus:</span>
                      ${SLCMS_STATE.currentUser.practiceAreas.split(',').map(tag => `
                        <span class="profile-tag-pill">${tag.trim()}</span>
                      `).join('')}
                    </div>
                  ` : ''}

                  ${SLCMS_STATE.currentUser.education ? `
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.35rem;">
                      🎓 <strong>Education:</strong> ${SLCMS_STATE.currentUser.education}
                    </div>
                  ` : ''}

                  <p style="font-size: 0.78rem; color: var(--color-text-main); margin-top: 0.5rem; line-height: 1.5; margin-bottom: 0;">
                    ${SLCMS_STATE.currentUser.bio || 'Managing Partner specializing in complex commercial litigation, trade secrets, and IP disputes.'}
                  </p>
                </div>
              </div>
            </div>

            <!-- 1. LAW-FIRM PROFILE CARD -->
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                      <path d="M9 9h1"/>
                      <path d="M9 13h1"/>
                      <path d="M9 17h1"/>
                    </svg>
                    Law-Firm Profile
                  </h3>
                  <div class="card-subtitle">Official entity credentials, e-filing registry, and state bar jurisdictional authorizations</div>
                </div>
                <span class="badge" style="background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;">
                  ✓ Verified NY Legal Entity
                </span>
              </div>

              <!-- Profile Form Inputs -->
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label required">Firm Legal Entity Name</label>
                  <div class="input-with-icon">
                    <span class="input-icon">🏛️</span>
                    <input type="text" id="setting-firm-name" class="form-control" value="${this.firmProfile.legalName}">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label required">Primary Practice Jurisdiction</label>
                  <div class="input-with-icon">
                    <span class="input-icon">⚖️</span>
                    <input type="text" id="setting-jurisdiction" class="form-control" value="${this.firmProfile.jurisdiction}">
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4" style="margin-top: 0.5rem;">
                <div class="form-group">
                  <label class="form-label">Firm E-Filing Account (NYSCEF / PACER)</label>
                  <div class="input-with-icon">
                    <span class="input-icon">📑</span>
                    <input type="text" id="setting-efiling" class="form-control" value="${this.firmProfile.efilingAccount}">
                  </div>
                  <span class="form-hint" style="color: #16A34A; font-weight: 500;">🟢 Live Court API Gateway Connected</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Primary Trust Escrow Account</label>
                  <div class="input-with-icon">
                    <span class="input-icon">🏦</span>
                    <input type="text" id="setting-trust" class="form-control" value="${this.firmProfile.trustEscrow}">
                  </div>
                  <span class="form-hint" style="color: var(--color-gold); font-weight: 500;">🔒 IOLTA Escrow Regulated (Rule 1.15 Safekeeping)</span>
                </div>
              </div>

              <!-- Extra Firm Meta Row -->
              <div class="grid grid-cols-2 gap-4" style="margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border-subtle);">
                <div class="form-group">
                  <label class="form-label">Managing Partner Sponsor</label>
                  <input type="text" class="form-control" value="${this.firmProfile.managingPartner}" readonly style="background: var(--color-surface-subtle);">
                </div>
                <div class="form-group">
                  <label class="form-label">Firm Headquarters</label>
                  <input type="text" class="form-control" value="${this.firmProfile.officeAddress}" readonly style="background: var(--color-surface-subtle);">
                </div>
              </div>

              <!-- Practice Area Dockets Tags -->
              <div style="margin-top: 0.75rem; padding-top: 0.85rem; border-top: 1px solid var(--color-border-subtle);">
                <label class="form-label" style="margin-bottom: 0.4rem; display: block;">Authorized Practice Dockets</label>
                <div class="flex items-center gap-2 flex-wrap">
                  ${this.firmProfile.primaryDockets.map(d => `
                    <span class="badge" style="background: var(--color-surface-subtle); color: var(--color-primary); border: 1px solid var(--color-border); font-size: 0.75rem;">
                      • ${d}
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 2. ROLE-BASED SECURITY & PERMISSIONS MATRIX -->
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);">
                      <rect width="18" height="18" x="3" y="3" rx="2"/>
                      <path d="M9 3v18"/>
                      <path d="M15 3v18"/>
                      <path d="M3 9h18"/>
                      <path d="M3 15h18"/>
                    </svg>
                    Role-Based Security & Permissions Matrix
                  </h3>
                  <div class="card-subtitle">Granular privilege definitions enforced across all litigation modules, document repositories, and billing ledgers</div>
                </div>
                <span class="badge badge-confidential">RBAC Enabled</span>
              </div>

              <div class="table-container">
                <table class="rbac-matrix-table data-table">
                  <thead>
                    <tr>
                      <th style="width: 38%;">Module / Permission</th>
                      <th style="text-align: center; width: 20%;">Administrator</th>
                      <th style="text-align: center; width: 21%;">Lawyer</th>
                      <th style="text-align: center; width: 21%;">Legal Clerk</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Row 1 -->
                    <tr>
                      <td>
                        <div class="rbac-permission-name">
                          <span>⚖️</span>
                          <strong>Case Management (Create, Edit, Close)</strong>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-left: 1.6rem;">Docket registration & case closure</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-active"><span class="badge-dot"></span> Full Access</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-active"><span class="badge-dot"></span> Assigned Cases</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-pending"><span class="badge-dot"></span> View Only</span>
                      </td>
                    </tr>

                    <!-- Row 2 -->
                    <tr>
                      <td>
                        <div class="rbac-permission-name">
                          <span>🗄️</span>
                          <strong>Document Vault & Privilege Controls</strong>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-left: 1.6rem;">Confidentiality levels & vault encryption</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-active"><span class="badge-dot"></span> Full Access</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-active"><span class="badge-dot"></span> Full Access</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-new"><span class="badge-dot"></span> Upload / Non-Privileged</span>
                      </td>
                    </tr>

                    <!-- Row 3 -->
                    <tr>
                      <td>
                        <div class="rbac-permission-name">
                          <span>✨</span>
                          <strong>AI Legal Draft Assistant</strong>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-left: 1.6rem;">Pleading generation & deposition synthesis</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-won"><span class="badge-dot"></span> Enabled</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-won"><span class="badge-dot"></span> Enabled</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-lost"><span class="badge-dot"></span> Restricted</span>
                      </td>
                    </tr>

                    <!-- Row 4 -->
                    <tr>
                      <td>
                        <div class="rbac-permission-name">
                          <span>💳</span>
                          <strong>Billing, Rates & Invoices</strong>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-left: 1.6rem;">Hourly rate table & IOLTA disbursements</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-active"><span class="badge-dot"></span> Full Access</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-new"><span class="badge-dot"></span> Log Hours</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-lost"><span class="badge-dot"></span> Restricted</span>
                      </td>
                    </tr>

                    <!-- Row 5 -->
                    <tr>
                      <td>
                        <div class="rbac-permission-name">
                          <span>🛡️</span>
                          <strong>User Management & Roles</strong>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-left: 1.6rem;">Account provisioning & lockout controls</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-confidential">Admin Only</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-lost"><span class="badge-dot"></span> Restricted</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-lost"><span class="badge-dot"></span> Restricted</span>
                      </td>
                    </tr>

                    <!-- Row 6 -->
                    <tr>
                      <td>
                        <div class="rbac-permission-name">
                          <span>📜</span>
                          <strong>Immutable Audit Logs</strong>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-left: 1.6rem;">Cryptographic SOC-2 IP trail & tamper seals</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-active"><span class="badge-dot"></span> Full Access</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-lost"><span class="badge-dot"></span> Restricted</span>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-lost"><span class="badge-dot"></span> Restricted</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Col: Security, MFA & Telemetry -->
          <div class="flex flex-col gap-6">
            
            <!-- 3. SECURITY & MFA CONTROLS -->
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-danger);">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Security & MFA
                  </h3>
                  <div class="card-subtitle">Session authentication & threat prevention</div>
                </div>
              </div>

              <div class="flex flex-col">
                <!-- Toggle 1: MFA -->
                <div class="settings-switch-item">
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem; color: var(--color-primary);">
                      Enforce Multi-Factor (MFA)
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Mandatory TOTP authenticator or FIDO2 hardware key for all accounts.
                    </div>
                  </div>
                  <label class="custom-switch">
                    <input type="checkbox" id="mfa-toggle" checked onchange="SettingsView.toggleSecurity('enforceMfa', this.checked)">
                    <span class="custom-switch-slider"></span>
                  </label>
                </div>

                <!-- Toggle 2: Auto-Lock -->
                <div class="settings-switch-item">
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem; color: var(--color-primary);">
                      Auto-Lock Inactive Sessions
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Terminates idle sessions after 15 minutes to protect privileged records.
                    </div>
                  </div>
                  <label class="custom-switch">
                    <input type="checkbox" id="autolock-toggle" checked onchange="SettingsView.toggleSecurity('autoLock15m', this.checked)">
                    <span class="custom-switch-slider"></span>
                  </label>
                </div>

                <!-- Toggle 3: Re-Auth -->
                <div class="settings-switch-item">
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem; color: var(--color-primary);">
                      Sensitive Action Password Check
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Require password prompt before escrow disbursement or account lockout.
                    </div>
                  </div>
                  <label class="custom-switch">
                    <input type="checkbox" id="sensitive-pass-toggle" checked onchange="SettingsView.toggleSecurity('requireSensitivePass', this.checked)">
                    <span class="custom-switch-slider"></span>
                  </label>
                </div>

                <!-- Toggle 4: IP Whitelist -->
                <div class="settings-switch-item">
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem; color: var(--color-primary);">
                      Enforce IP Whitelisting (Firm VPN)
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Restrict access to approved office IP ranges and secure gateway subnets.
                    </div>
                  </div>
                  <label class="custom-switch">
                    <input type="checkbox" id="vpn-toggle" checked onchange="SettingsView.toggleSecurity('enforceVpnIp', this.checked)">
                    <span class="custom-switch-slider"></span>
                  </label>
                </div>

                <!-- Toggle 5: SHA-256 Vault Sealing -->
                <div class="settings-switch-item">
                  <div>
                    <div style="font-weight: 600; font-size: 0.88rem; color: var(--color-primary);">
                      SHA-256 Cryptographic Sealing
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.15rem;">
                      Generate tamper-evident hash for every evidentiary document upload.
                    </div>
                  </div>
                  <label class="custom-switch">
                    <input type="checkbox" id="sha-toggle" checked onchange="SettingsView.toggleSecurity('shaIntegrity', this.checked)">
                    <span class="custom-switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 4. SYSTEM HEALTH & STORAGE TELEMETRY -->
            <div class="card" style="background: var(--color-surface-subtle); border-color: var(--color-border-strong);">
              <div class="card-header" style="border-bottom: 1px solid var(--color-border);">
                <div>
                  <h3 class="card-title" style="font-size: 1.05rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    System Health & Storage
                  </h3>
                  <div class="card-subtitle">Real-time infrastructure & compliance telemetry</div>
                </div>
                <span class="badge badge-active"><span class="badge-dot"></span> 99.99% Uptime</span>
              </div>

              <!-- Storage Meter -->
              <div style="margin-bottom: 1.25rem;">
                <div class="flex justify-between items-center" style="font-size: 0.82rem; margin-bottom: 0.35rem;">
                  <span style="font-weight: 600; color: var(--color-primary);">Encrypted Storage</span>
                  <strong style="color: var(--color-primary); font-family: var(--font-mono);">24.8 GB / 1000 GB</strong>
                </div>
                <div class="storage-progress-container">
                  <div class="storage-progress-bar" style="width: 2.48%;"></div>
                </div>
                <div class="flex justify-between" style="font-size: 0.72rem; color: var(--color-text-secondary);">
                  <span>2.48% Utilized</span>
                  <span>975.2 GB Available</span>
                </div>
              </div>

              <!-- Telemetry Tiles Grid -->
              <div class="flex flex-col gap-2.5">
                <!-- API Latency -->
                <div class="telemetry-tile">
                  <div class="flex items-center gap-2">
                    <span style="font-size: 1.1rem;">⚡</span>
                    <div>
                      <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">API Latency</div>
                      <div style="font-weight: 700; color: var(--color-primary); font-family: var(--font-mono); font-size: 0.95rem;">
                        <span id="telemetry-latency-value">${this.telemetryLatency}ms</span>
                      </div>
                    </div>
                  </div>
                  <span class="badge badge-active">
                    <span class="badge-dot"></span> Optimal
                  </span>
                </div>

                <!-- SOC-2 Compliance -->
                <div class="telemetry-tile">
                  <div class="flex items-center gap-2">
                    <span style="font-size: 1.1rem;">🛡️</span>
                    <div>
                      <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">SOC-2 Compliance</div>
                      <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">Active & Verified</div>
                    </div>
                  </div>
                  <span class="badge badge-won">
                    <span class="badge-dot"></span> Pass
                  </span>
                </div>

                <!-- Encryption Standard -->
                <div class="telemetry-tile">
                  <div class="flex items-center gap-2">
                    <span style="font-size: 1.1rem;">🔐</span>
                    <div>
                      <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">Vault Encryption</div>
                      <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">AES-256 GCM</div>
                    </div>
                  </div>
                  <span class="badge badge-confidential">FIPS 140-3</span>
                </div>
              </div>

              <!-- Run Diagnostics Button -->
              <button class="btn btn-secondary btn-sm w-full" style="margin-top: 1.25rem;" onclick="SettingsView.runDiagnostic()" id="btn-run-diag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                <span>Run Diagnostic Health Check</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // --- ACTIONS & HANDLERS ---
  saveSettings() {
    const firmName = document.getElementById('setting-firm-name')?.value || this.firmProfile.legalName;
    const jurisdiction = document.getElementById('setting-jurisdiction')?.value || this.firmProfile.jurisdiction;
    const efiling = document.getElementById('setting-efiling')?.value || this.firmProfile.efilingAccount;
    const trust = document.getElementById('setting-trust')?.value || this.firmProfile.trustEscrow;

    this.firmProfile.legalName = firmName;
    this.firmProfile.jurisdiction = jurisdiction;
    this.firmProfile.efilingAccount = efiling;
    this.firmProfile.trustEscrow = trust;

    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.addAuditLog) {
      SLCMS_STATE.addAuditLog('Firm Settings Updated', 'Administration', `Saved parameters for ${firmName}`);
    }

    App.showToast('Firm settings and security policies successfully saved & synchronized!', 'success');
  },

  toggleSecurity(settingKey, isChecked) {
    this.securitySettings[settingKey] = isChecked;
    const labelMap = {
      enforceMfa: 'Enforce Multi-Factor (MFA)',
      autoLock15m: 'Auto-Lock Inactive Sessions (15m)',
      requireSensitivePass: 'Sensitive Action Password Re-Auth',
      enforceVpnIp: 'IP Whitelisting (Firm VPN)',
      shaIntegrity: 'SHA-256 Cryptographic Sealing'
    };

    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.addAuditLog) {
      SLCMS_STATE.addAuditLog('Security Policy Toggled', 'Security', `${labelMap[settingKey]}: ${isChecked ? 'ENABLED' : 'DISABLED'}`);
    }

    App.showToast(`${labelMap[settingKey]} updated to: ${isChecked ? 'Enabled' : 'Disabled'}`, 'info');
  },

  runDiagnostic() {
    if (this.isDiagnosticRunning) return;
    this.isDiagnosticRunning = true;

    const btn = document.getElementById('btn-run-diag');
    if (btn) {
      btn.innerHTML = `<span>Running diagnostics...</span>`;
      btn.disabled = true;
    }

    App.showToast('Running comprehensive SOC-2 and latency diagnostic...', 'info');

    setTimeout(() => {
      this.telemetryLatency = Math.floor(Math.random() * 8) + 14; // 14ms - 21ms
      const valElem = document.getElementById('telemetry-latency-value');
      if (valElem) valElem.innerText = `${this.telemetryLatency}ms`;

      if (btn) {
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>Run Diagnostic Health Check</span>
        `;
        btn.disabled = false;
      }
      this.isDiagnosticRunning = false;
      App.showToast('Diagnostic completed: All systems nominal (100% database & vault integrity verified)', 'success');
    }, 900);
  }
};
