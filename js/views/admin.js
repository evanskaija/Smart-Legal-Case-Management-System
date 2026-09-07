/* ==========================================================================
   SLCMS - User Management & Immutable Activity Logs (Admin Only)
   Full Compliance with Account Creation, Role Matrix & Account Unlocking
   ========================================================================== */

const AdminView = {
  activeSubtab: 'users', // 'users' | 'invitations' | 'pending' | 'activity'
  searchQuery: '',
  roleFilter: 'all',
  moduleFilter: 'all',

  render() {
    // Check RBAC permission on server/client level
    const userRole = SLCMS_STATE.currentUser.role;
    if (userRole !== 'Administrator' && userRole !== 'Managing Partner' && userRole !== 'System Administrator') {
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
            User Management, Account Provisioning, and Security Audit Logs are strictly restricted to Managing Partners and System Administrators. Your active session role is: <strong>${userRole}</strong>.
          </p>
          <button class="btn btn-primary" onclick="App.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }

    const lockedUsers = SLCMS_STATE.users.filter(u => u.status === 'LOCKED' || u.status === 'Locked').length;
    const pendingApprovals = SLCMS_STATE.users.filter(u => (u.accountStatus || u.status) === 'PENDING_APPROVAL').length;
    const activeInvitations = (SLCMS_STATE.invitations || []).filter(i => (i.status || '').toUpperCase() === 'PENDING').length;

    return `
      <div class="animate-fade">
        <!-- 1. VIEW HEADER -->
        <div class="view-header">
          <div>
            <div class="flex items-center gap-2" style="margin-bottom: 0.25rem;">
              <h1 class="page-title">User Management & Security Governance</h1>
              <span class="badge badge-confidential" style="font-size: 0.75rem;">
                SOC-2 Type II Governed
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">
              Firm invitation provisioning, professional identity verification, account unlocking, and immutable audit trails
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn btn-gold" onclick="AdminView.openIssueInvitationModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span>+ Issue Firm Invitation</span>
            </button>
          </div>
        </div>

        <!-- 2. SUBTABS NAVIGATION -->
        <div class="tabs-nav">
          <button class="tab-btn ${this.activeSubtab === 'users' ? 'active' : ''}" onclick="AdminView.switchSubtab('users')">
            <span>👥 Staff Accounts (${SLCMS_STATE.users.length})</span>
            ${lockedUsers > 0 ? `<span class="badge badge-lost" style="font-size: 0.65rem; padding: 0.1rem 0.4rem; margin-left: 0.35rem;">${lockedUsers} Locked</span>` : ''}
          </button>
          <button class="tab-btn ${this.activeSubtab === 'invitations' ? 'active' : ''}" onclick="AdminView.switchSubtab('invitations')">
            <span>✉️ Firm Invitations (${SLCMS_STATE.invitations ? SLCMS_STATE.invitations.length : 0})</span>
            ${activeInvitations > 0 ? `<span class="badge badge-active" style="font-size: 0.65rem; padding: 0.1rem 0.4rem; margin-left: 0.35rem;">${activeInvitations} Active</span>` : ''}
          </button>
          <button class="tab-btn ${this.activeSubtab === 'pending' ? 'active' : ''}" onclick="AdminView.switchSubtab('pending')">
            <span>⏳ Pending Approvals</span>
            ${pendingApprovals > 0 ? `<span class="badge badge-pending" style="font-size: 0.65rem; padding: 0.1rem 0.4rem; margin-left: 0.35rem;">${pendingApprovals} Pending</span>` : ''}
          </button>
          <button class="tab-btn ${this.activeSubtab === 'activity' ? 'active' : ''}" onclick="AdminView.switchSubtab('activity')">
            <span>📜 Immutable Activity Log (${SLCMS_STATE.activityLogs.length})</span>
          </button>
        </div>

        <!-- 3. TAB CONTENT -->
        ${this.activeSubtab === 'users' ? this.renderUsersTab() :
          this.activeSubtab === 'invitations' ? this.renderInvitationsTab() :
          this.activeSubtab === 'pending' ? this.renderPendingApprovalsTab() :
          this.renderActivityTab()}
      </div>
    `;
  },

  switchSubtab(tab) {
    this.activeSubtab = tab;
    this.searchQuery = '';
    App.refreshCurrentView();
  },

  renderInvitationsTab() {
    const invitations = SLCMS_STATE.invitations || [];
    const filteredInv = invitations.filter(i => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      return i.invitationCode.toLowerCase().includes(q) ||
             i.approvedFullName.toLowerCase().includes(q) ||
             i.approvedRole.toLowerCase().includes(q) ||
             i.approvedEmail.toLowerCase().includes(q) ||
             (i.staffId && i.staffId.toLowerCase().includes(q));
    });

    return `
      <div>
        <div class="flex items-center justify-between gap-4 flex-wrap" style="margin-bottom: 1.25rem;">
          <div class="input-with-icon" style="max-width: 380px; width: 100%;">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control" placeholder="Search invitation codes, practitioner names, emails..." value="${this.searchQuery}" oninput="AdminView.handleSearch(this.value)">
          </div>

          <div class="flex items-center gap-2">
            <button class="btn btn-gold btn-sm" onclick="AdminView.openIssueInvitationModal()">
              + Issue New Invitation
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invitation Code & Status</th>
                <th>Approved Legal Practitioner</th>
                <th>Pre-Approved Role</th>
                <th>Professional Identifiers</th>
                <th>Expiration Date</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInv.map(inv => {
                const isPending = (inv.status || '').toUpperCase() === 'PENDING';
                const isExpired = inv.expirationDate && new Date(inv.expirationDate) < new Date();
                const displayStatus = (!isPending) ? inv.status : (isExpired ? 'EXPIRED' : 'PENDING');

                return `
                  <tr>
                    <td>
                      <div>
                        <div style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); font-size: 0.92rem; display: flex; align-items: center; gap: 0.35rem;">
                          <span>🎫</span>
                          <span>${inv.invitationCode}</span>
                        </div>
                        <div style="margin-top: 0.25rem;">
                          <span class="badge ${displayStatus === 'PENDING' ? 'badge-active' : displayStatus === 'USED' ? 'badge-confidential' : 'badge-lost'}" style="font-size: 0.68rem;">
                            ${displayStatus}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight: 700; color: var(--color-primary);">${inv.approvedFullName}</div>
                      <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${inv.approvedEmail} • ${inv.approvedPhone}</div>
                      <div style="font-size: 0.72rem; color: #64748B;">Dept: ${inv.department}</div>
                    </td>
                    <td>
                      <span class="badge ${inv.approvedRole === 'Managing Partner' ? 'badge-confidential' : inv.approvedRole === 'Senior Counsel' ? 'badge-new' : inv.approvedRole === 'Legal Clerk' ? 'badge-onhold' : 'badge-active'}">
                        ${inv.approvedRole}
                      </span>
                    </td>
                    <td>
                      <div style="font-size: 0.78rem;">
                        <div>Staff ID: <code style="font-weight: 600;">${inv.staffId}</code></div>
                        ${inv.advocateNumber ? `<div>Roll No: <code>${inv.advocateNumber}</code></div>` : ''}
                        ${inv.nationalIdRef ? `<div>NIDA Ref: <code>${inv.nationalIdRef}</code></div>` : ''}
                      </div>
                    </td>
                    <td>
                      <span style="font-size: 0.8rem; color: ${isExpired ? '#DC2626' : 'var(--color-text-secondary)'};">
                        ${inv.expirationDate ? new Date(inv.expirationDate).toLocaleDateString() : 'Never'}
                        ${isExpired ? '<br><span style="color: #DC2626; font-size: 0.7rem; font-weight: 700;">(EXPIRED)</span>' : ''}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div class="flex items-center justify-end gap-1.5">
                        <button class="btn btn-secondary btn-sm" onclick="AdminView.copyInvitationCode('${inv.invitationCode}')" title="Copy invitation code to clipboard">
                          📋 Copy
                        </button>
                        ${isPending && !isExpired ? `
                          <button class="btn btn-ghost btn-sm text-danger" onclick="AdminView.revokeInvitation('${inv.id}')" title="Revoke this invitation">
                            Revoke
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderPendingApprovalsTab() {
    const pendingUsers = SLCMS_STATE.users.filter(u => (u.accountStatus || u.status) === 'PENDING_APPROVAL');

    return `
      <div>
        <div class="alert alert-warning" style="margin-bottom: 1.25rem; display: flex; align-items: flex-start; gap: 0.85rem; padding: 1rem 1.25rem;">
          <div style="font-size: 1.3rem;">⏳</div>
          <div style="font-size: 0.85rem; line-height: 1.5;">
            <strong>Pending Partner / Administrator Approvals:</strong> Newly registered practitioners whose identities have been verified but require leadership sign-off before entering the law firm workspace.
          </div>
        </div>

        ${pendingUsers.length === 0 ? `
          <div class="card empty-state" style="padding: 3rem 2rem; text-align: center;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">✅</div>
            <h3 style="color: var(--color-primary); margin-bottom: 0.35rem;">All Registrations Approved</h3>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">There are no practitioner registrations currently awaiting leadership authorization.</p>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Practitioner Candidate</th>
                  <th>Assigned Role</th>
                  <th>Department & Identification</th>
                  <th>Verification Status</th>
                  <th style="text-align: right;">Approval Action</th>
                </tr>
              </thead>
              <tbody>
                ${pendingUsers.map(u => `
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="avatar avatar-sm avatar-purple">
                          ${u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style="font-weight: 700; color: var(--color-primary);">${u.name}</div>
                          <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${u.email} • ${u.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-confidential">${u.role}</span>
                    </td>
                    <td>
                      <div style="font-size: 0.8rem;">
                        <div>Dept: <strong>${u.department}</strong></div>
                        <div>Staff ID: <code>${u.staffId || u.employeeId}</code> ${u.advocateNumber ? `• Roll: <code>${u.advocateNumber}</code>` : ''}</div>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-pending">
                        <span class="badge-dot"></span> PENDING_APPROVAL
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-gold btn-sm" onclick="AdminView.approveUser('${u.id}')">
                        ✓ Approve & Activate Access
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  copyInvitationCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      App.showToast(`Invitation code ${code} copied to clipboard!`, 'success');
    } else {
      App.showToast(`Invitation Code: ${code}`, 'info');
    }
  },

  revokeInvitation(invId) {
    const success = SLCMS_STATE.revokeInvitation(invId);
    if (success) {
      App.showToast('Invitation successfully revoked.', 'info');
      App.refreshCurrentView();
    }
  },

  approveUser(userId) {
    const success = SLCMS_STATE.approveUserAccount(userId);
    if (success) {
      App.showToast('User account successfully approved and activated!', 'success');
      App.refreshCurrentView();
    }
  },

  openIssueInvitationModal() {
    const autoStaffId = 'EMP-10' + (SLCMS_STATE.users.length + (SLCMS_STATE.invitations ? SLCMS_STATE.invitations.length : 0) + 1);

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>✉️</span> Issue Firm Invitation Code
          </h3>
          <p style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.2rem;">
            Generate an expirable, one-time invitation code with immutable role and clearance parameters.
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem;">
        <form id="issue-invitation-form" onsubmit="AdminView.handleIssueInvitationSubmit(event)">
          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Approved Practitioner Full Name *</label>
              <input type="text" id="inv-full-name" class="form-control" placeholder="e.g. Adv. Zainab Salim" required>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Assigned Staff ID *</label>
              <input type="text" id="inv-staff-id" class="form-control" value="${autoStaffId}" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Pre-Approved System Role *</label>
              <select id="inv-role" class="form-control" required onchange="AdminView.toggleRoleIdentifierFields(this.value)">
                <option value="Senior Counsel">⚖️ Senior Counsel (Lead cases, pleadings)</option>
                <option value="Associate Lawyer" selected>📜 Associate Lawyer (Assigned drafting)</option>
                <option value="Junior Lawyer">🎓 Junior Lawyer (Research & citations)</option>
                <option value="Legal Clerk">📁 Legal Clerk (Registry & filings)</option>
                <option value="Managing Partner">👑 Managing Partner (Leadership oversight)</option>
                <option value="System Administrator">🛡️ System Administrator (Security)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Department / Practice Group</label>
              <select id="inv-dept" class="form-control">
                <option value="Commercial Litigation">Commercial Litigation</option>
                <option value="Intellectual Property & Patents">Intellectual Property & Patents</option>
                <option value="Corporate & Tax Advisory">Corporate & Tax Advisory</option>
                <option value="Appellate & Constitutional Law">Appellate & Constitutional Law</option>
                <option value="Court Filings & Registry">Court Filings & Registry</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Approved Email Address *</label>
              <input type="email" id="inv-email" class="form-control" placeholder="z.salim@slcms-law.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Approved Phone Number *</label>
              <input type="text" id="inv-phone" class="form-control" placeholder="+255 754 889 900" required>
            </div>
          </div>

          <div id="inv-dynamic-identifiers-row" class="grid grid-cols-2 gap-3" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Advocate Roll / Bar No. *</label>
              <input type="text" id="inv-advocate-no" class="form-control" placeholder="ADV/2026/0512" value="ADV/2026/0512">
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Practising Certificate No.</label>
              <input type="text" id="inv-pc-no" class="form-control" placeholder="PC-TZ-2026-9041" value="PC-TZ-2026-9041">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Invitation Validity Period</label>
            <select id="inv-expiration-days" class="form-control">
              <option value="7">7 Days Validity</option>
              <option value="14" selected>14 Days Validity (Standard)</option>
              <option value="30">30 Days Validity</option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-gold">
              Issue Invitation Code
            </button>
          </div>
        </form>
      </div>
    `, 'modal-lg');
  },

  toggleRoleIdentifierFields(role) {
    const row = document.getElementById('inv-dynamic-identifiers-row');
    if (!row) return;

    if (role === 'Legal Clerk') {
      row.innerHTML = `
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">National ID Reference (NIDA/NID) *</label>
          <input type="text" id="inv-nid-ref" class="form-control" placeholder="NIDA-19950512-1002-33" value="NIDA-19950512-1002-33" required>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="form-group">
          <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Advocate Roll / Bar No. *</label>
          <input type="text" id="inv-advocate-no" class="form-control" placeholder="ADV/2026/0512" value="ADV/2026/0512" required>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size: 0.82rem; font-weight: 600;">Practising Certificate No.</label>
          <input type="text" id="inv-pc-no" class="form-control" placeholder="PC-TZ-2026-9041" value="PC-TZ-2026-9041">
        </div>
      `;
    }
  },

  handleIssueInvitationSubmit(e) {
    e.preventDefault();
    const approvedFullName = document.getElementById('inv-full-name')?.value.trim();
    const staffId = document.getElementById('inv-staff-id')?.value.trim();
    const role = document.getElementById('inv-role')?.value;
    const department = document.getElementById('inv-dept')?.value;
    const email = document.getElementById('inv-email')?.value.trim();
    const phone = document.getElementById('inv-phone')?.value.trim();
    const advocateNumber = document.getElementById('inv-advocate-no')?.value?.trim();
    const practisingCertNo = document.getElementById('inv-pc-no')?.value?.trim();
    const nationalIdRef = document.getElementById('inv-nid-ref')?.value?.trim();
    const expirationDays = document.getElementById('inv-expiration-days')?.value;

    if (!approvedFullName || !email || !staffId) {
      App.showToast('Please complete all required fields.', 'error');
      return;
    }

    const res = SLCMS_STATE.createInvitation({
      approvedFullName,
      staffId,
      role,
      department,
      email,
      phone,
      advocateNumber,
      practisingCertNo,
      nationalIdRef,
      expirationDays
    });

    if (res.success) {
      App.closeModal();
      App.showToast(res.message, 'success');
      this.activeSubtab = 'invitations';
      App.refreshCurrentView();
    } else {
      App.showToast(res.message, 'error');
    }
  },

  renderUsersTab() {
    const filteredUsers = SLCMS_STATE.users.filter(u => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) ||
             u.email.toLowerCase().includes(q) ||
             (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
             u.role.toLowerCase().includes(q) ||
             (u.department && u.department.toLowerCase().includes(q));
    });

    return `
      <div>
        <!-- Search & Filter Bar -->
        <div class="flex items-center justify-between gap-4 flex-wrap" style="margin-bottom: 1.25rem;">
          <div class="input-with-icon" style="max-width: 380px; width: 100%;">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control" placeholder="Search staff by name, email, ID, or role..." value="${this.searchQuery}" oninput="AdminView.handleSearch(this.value)">
          </div>

          <div class="flex items-center gap-2">
            <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 600;">Showing:</span>
            <span class="badge" style="background: var(--color-surface-subtle); color: var(--color-primary); border: 1px solid var(--color-border);">
              ${filteredUsers.length} Staff Members
            </span>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff Member & Employee ID</th>
                <th>System Role</th>
                <th>Job Title & Department</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Last Active</th>
                <th style="text-align: right;">Security Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map(u => `
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar avatar-sm ${u.avatarClass || 'avatar-navy'}">
                        ${u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style="font-weight: 700; color: var(--color-primary); font-size: 0.92rem;">${u.name}</div>
                        <div style="font-size: 0.75rem; color: var(--color-text-secondary);">
                          ${u.email} • <span style="font-family: var(--font-mono); font-weight: 600; color: var(--color-gold);">${u.employeeId || 'EMP-1000'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${u.role === 'Managing Partner' || u.role === 'Administrator' ? 'badge-confidential' : u.role === 'Senior Counsel' ? 'badge-new' : u.role === 'Associate Lawyer' ? 'badge-active' : u.role === 'Junior Lawyer' ? 'badge-purple' : u.role === 'Legal Clerk' ? 'badge-onhold' : 'badge-neutral'}">
                      ${u.role === 'Managing Partner' || u.role === 'Administrator' ? '👑 ' : u.role === 'Senior Counsel' ? '⚖️ ' : u.role === 'Associate Lawyer' ? '📜 ' : u.role === 'Junior Lawyer' ? '🎓 ' : u.role === 'Legal Clerk' ? '📁 ' : '🛡️ '}${u.role}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight: 600; color: var(--color-text-main); font-size: 0.85rem;">${u.jobTitle || u.roleTitle || 'Legal Counsel'}</div>
                    <div style="font-size: 0.74rem; color: var(--color-text-muted);">${u.department}</div>
                  </td>
                  <td>
                    <span style="font-size: 0.82rem; color: var(--color-text-secondary); font-family: var(--font-mono);">${u.phone || 'N/A'}</span>
                  </td>
                  <td>
                    ${u.status === 'Active' ? `
                      <span class="badge badge-active"><span class="badge-dot"></span> Active</span>
                    ` : u.status === 'Locked' ? `
                      <span class="badge badge-lost" style="background: rgba(220, 38, 38, 0.15); color: #DC2626; border-color: #DC2626;" title="Locked after 5 failed password attempts">
                        🔒 Locked (${u.failedAttempts} fails)
                      </span>
                    ` : `
                      <span class="badge badge-lost">Deactivated</span>
                    `}
                  </td>
                  <td>
                    <span style="font-size: 0.78rem; color: var(--color-text-secondary);">
                      ${u.lastLogin}
                      ${u.mustChangePassword ? '<br><span style="color: var(--color-warning); font-size: 0.7rem; font-weight: 600;">(Temp Pass Pending)</span>' : ''}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div class="flex items-center justify-end gap-1.5">
                      ${u.status === 'Locked' ? `
                        <button class="btn btn-gold btn-sm" onclick="AdminView.unlockUser('${u.id}')" title="Unlock account & reset failed attempts">
                          🔓 Unlock
                        </button>
                      ` : ''}
                      <button class="btn btn-secondary btn-sm" onclick="AdminView.editUser('${u.id}')">Edit</button>
                      ${u.status === 'Active' ? `
                        <button class="btn btn-ghost btn-sm text-danger" onclick="AdminView.toggleUserStatus('${u.id}')" title="Deactivate User">Deactivate</button>
                      ` : u.status === 'Deactivated' ? `
                        <button class="btn btn-ghost btn-sm text-success" onclick="AdminView.toggleUserStatus('${u.id}')" title="Reactivate User">Reactivate</button>
                      ` : ''}
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

  renderActivityTab() {
    const filteredLogs = SLCMS_STATE.activityLogs.filter(l => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      return l.user.toLowerCase().includes(q) ||
             l.role.toLowerCase().includes(q) ||
             l.module.toLowerCase().includes(q) ||
             l.action.toLowerCase().includes(q) ||
             l.record.toLowerCase().includes(q) ||
             l.ip.toLowerCase().includes(q) ||
             l.status.toLowerCase().includes(q);
    });

    return `
      <div>
        <!-- SOC-2 Immutable Notice Banner -->
        <div class="alert alert-info" style="margin-bottom: 1.25rem; display: flex; align-items: flex-start; gap: 0.85rem; padding: 1.15rem 1.35rem; border-left: 4px solid var(--color-gold); background: #FDF8EC; border-color: #E8D39E; color: #102A43;">
          <div style="font-size: 1.4rem; line-height: 1; flex-shrink: 0; color: var(--color-gold);">🛡️</div>
          <div style="font-size: 0.85rem; line-height: 1.55;">
            <strong>Immutable Security Audit Log (SOC-2 Type II):</strong> Every authentication attempt, account lockout, administrative unlock, password change, and data access is permanently logged with IP and device origin. Regular users cannot alter or purge these records.
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="flex items-center justify-between gap-4 flex-wrap" style="margin-bottom: 1.25rem;">
          <div class="input-with-icon" style="max-width: 380px; width: 100%;">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control" placeholder="Search audit trail by user, action, module, or IP..." value="${this.searchQuery}" oninput="AdminView.handleSearch(this.value)">
          </div>

          <div class="flex items-center gap-2">
            <button class="btn btn-secondary btn-sm" onclick="AdminView.exportAuditLogs()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Export Audit Trail (CSV)</span>
            </button>
            <span class="badge" style="background: #102A43; color: #FFFFFF;">
              ${filteredLogs.length} Verified Entries
            </span>
          </div>
        </div>

        <!-- Immutable Audit Log Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 15%;">Timestamp (UTC)</th>
                <th style="width: 15%;">Staff Member</th>
                <th style="width: 10%;">Role</th>
                <th style="width: 13%;">Module</th>
                <th style="width: 17%;">Action Executed</th>
                <th style="width: 17%;">Target Record / Details</th>
                <th style="width: 13%;">Origin IP / Device</th>
                <th style="width: 10%; text-align: center;">Result</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map(l => `
                <tr>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">
                      ${l.timestamp}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight: 700; color: var(--color-primary); font-size: 0.88rem;">${l.user}</div>
                  </td>
                  <td>
                    <span class="badge ${l.role === 'Administrator' ? 'badge-confidential' : l.role === 'Lawyer' ? 'badge-new' : 'badge-onhold'}" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">
                      ${l.role}
                    </span>
                  </td>
                  <td>
                    <span style="font-weight: 600; color: var(--color-text-main); font-size: 0.82rem;">${l.module}</span>
                  </td>
                  <td>
                    <span style="font-weight: 600; color: var(--color-primary); font-size: 0.82rem;">${l.action}</span>
                  </td>
                  <td>
                    <span class="truncate" style="max-width: 240px; display: inline-block; font-size: 0.8rem; color: var(--color-text-secondary);" title="${l.record}">
                      ${l.record}
                    </span>
                  </td>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--color-text-muted); background: var(--color-surface-subtle); padding: 0.2rem 0.45rem; border-radius: 4px; border: 1px solid var(--color-border);">
                      ${l.ip}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <span class="badge ${l.status === 'Success' ? 'badge-active' : l.status === 'Locked' || l.status === 'Denied' || l.status === 'Blocked' ? 'badge-lost' : 'badge-pending'}">
                      <span class="badge-dot"></span> ${l.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  handleSearch(val) {
    this.searchQuery = val;
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }
  },

  unlockUser(userId) {
    const success = SLCMS_STATE.unlockAccount(userId);
    if (success) {
      App.showToast('Account successfully unlocked and failed login count reset.', 'success');
      App.refreshCurrentView();
    }
  },

  toggleUserStatus(userId) {
    const u = SLCMS_STATE.users.find(item => item.id === userId);
    if (u) {
      u.status = u.status === 'Active' ? 'Deactivated' : 'Active';
      SLCMS_STATE.addAuditLog(`User Account Status Changed: ${u.status}`, 'User Management', u.email);
      App.showToast(`User ${u.name} status updated to ${u.status}.`, 'info');
      App.refreshCurrentView();
    }
  },

  exportAuditLogs() {
    let csv = 'Timestamp (UTC),Staff Member,Role,Module,Action Executed,Target Record,Origin IP,Result\n';
    SLCMS_STATE.activityLogs.forEach(l => {
      csv += `"${l.timestamp}","${l.user}","${l.role}","${l.module}","${l.action}","${l.record}","${l.ip}","${l.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `SLCMS_Security_Audit_Trail_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    App.showToast('Exported SOC-2 immutable audit trail to CSV.', 'success');
  },

  // Account Creation Modal
  openAddUserModal() {
    const autoEmpId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
    const autoTempPass = 'TempPass' + Math.floor(1000 + Math.random() * 9000) + '!';

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          Provision Authorized Law-Firm Account
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: #64748B; margin-bottom: 1.25rem;">
          SLCMS accounts are restricted to verified law-firm personnel. The user will be required to create a new private password upon their initial login.
        </p>

        <div id="add-user-modal-alert" class="alert alert-danger hidden" style="margin-bottom: 1rem;"></div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label required">Full Legal Name</label>
            <input type="text" id="nu-name" class="form-control" placeholder="e.g. Katherine Howard, Esq." required>
          </div>
          <div class="form-group">
            <label class="form-label required">Employee / Staff ID</label>
            <input type="text" id="nu-empid" class="form-control" value="${autoEmpId}" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label required">Firm Email Address (Unique)</label>
            <input type="email" id="nu-email" class="form-control" placeholder="k.howard@slcms-law.com" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Contact Phone Number</label>
            <input type="tel" id="nu-phone" class="form-control" placeholder="+1 (212) 555-0199" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label required">Job Title</label>
            <input type="text" id="nu-jobtitle" class="form-control" placeholder="e.g. Senior Associate" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Department / Practice Area</label>
            <input type="text" id="nu-dept" class="form-control" placeholder="e.g. Commercial Litigation" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label required">User Role</label>
            <select id="nu-role" class="form-control">
              <option value="Lawyer">Lawyer (Senior Counsel)</option>
              <option value="Clerk">Legal Clerk or Staff</option>
              <option value="Administrator">Administrator (Managing Partner)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Initial Account Status</label>
            <select id="nu-status" class="form-control">
              <option value="Active">Active</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Temporary Password</label>
          <div style="position: relative;">
            <input type="text" id="nu-temppass" class="form-control" value="${autoTempPass}" style="font-family: var(--font-mono); font-weight: 600;" required>
          </div>
          <div style="font-size: 0.75rem; color: #64748B; margin-top: 0.25rem;">
            Provide this temporary passphrase to the user securely. They will be forced to change it upon first login.
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="AdminView.saveNewUser()">Provision Account</button>
      </div>
    `);
  },

  saveNewUser() {
    const name = document.getElementById('nu-name')?.value?.trim();
    const email = document.getElementById('nu-email')?.value?.trim();
    const employeeId = document.getElementById('nu-empid')?.value?.trim();
    const phone = document.getElementById('nu-phone')?.value?.trim();
    const jobTitle = document.getElementById('nu-jobtitle')?.value?.trim();
    const department = document.getElementById('nu-dept')?.value?.trim();
    const role = document.getElementById('nu-role')?.value || 'Lawyer';
    const status = document.getElementById('nu-status')?.value || 'Active';
    const temporaryPassword = document.getElementById('nu-temppass')?.value;

    const alertEl = document.getElementById('add-user-modal-alert');

    if (!name || !email || !employeeId || !temporaryPassword) {
      if (alertEl) {
        alertEl.innerText = 'Please complete all required fields.';
        alertEl.classList.remove('hidden');
      }
      return;
    }

    const res = SLCMS_STATE.createAdminUser({
      name,
      email,
      employeeId,
      phone,
      jobTitle,
      department,
      role,
      status,
      temporaryPassword
    });

    if (!res.success) {
      if (alertEl) {
        alertEl.innerText = res.message;
        alertEl.classList.remove('hidden');
      }
      return;
    }

    App.closeModal();
    App.showToast(`Account successfully provisioned for ${res.user.name}.`, 'success');
    App.refreshCurrentView();
  },

  editUser(userId) {
    const u = SLCMS_STATE.users.find(item => item.id === userId);
    if (!u) return;

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43 0%, #0B1F33 100%); color: #FFFFFF; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg); padding: 1.25rem 1.5rem;">
        <div class="flex items-center gap-2.5">
          <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: rgba(200, 155, 60, 0.2); border: 1px solid var(--color-gold); display: flex; align-items: center; justify-content: center; color: var(--color-gold);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title" style="color: #FFFFFF; margin: 0; font-size: 1.15rem; font-family: var(--font-heading);">
              Edit Law-Firm Account: ${u.name}
            </h3>
            <div style="font-size: 0.75rem; color: #CBD5E1; margin-top: 0.15rem;">
              Personnel Record • Staff ID: <strong style="color: var(--color-gold); font-family: var(--font-mono);">${u.employeeId || u.id}</strong>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #CBD5E1;">✕</button>
      </div>

      <div class="modal-body" style="max-height: 75vh; overflow-y: auto; padding: 1.5rem;">
        <!-- Avatar Preview & Actions -->
        <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div class="avatar avatar-lg avatar-ring-gold" style="width: 68px; height: 68px; background: #0B1F33;">
            <img id="admin-edit-preview-avatar" src="${u.avatarImg || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'}" alt="${u.name}">
          </div>
          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; margin-bottom: 0.35rem;">
              Profile Photo URL or File Upload:
            </div>
            <div class="flex items-center gap-2">
              <input type="file" id="admin-user-avatar-file" accept="image/*" style="display:none;" onchange="
                const f = this.files && this.files[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = (e) => {
                    document.getElementById('admin-edit-preview-avatar').src = e.target.result;
                    document.getElementById('eu-avatar-url').value = e.target.result;
                  };
                  r.readAsDataURL(f);
                }
              ">
              <input type="text" id="eu-avatar-url" class="form-control" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; height: 32px;" value="${u.avatarImg || ''}" placeholder="Paste Image URL..." oninput="document.getElementById('admin-edit-preview-avatar').src = this.value">
              <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.3rem 0.65rem; white-space: nowrap;" onclick="document.getElementById('admin-user-avatar-file').click()">Upload</button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label required">Full Legal Name</label>
            <input type="text" id="eu-name" class="form-control" value="${u.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Firm Email Address</label>
            <input type="email" id="eu-email" class="form-control" value="${u.email}" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label required">Role Assignment</label>
            <select id="eu-role" class="form-control">
              <option value="Administrator" ${u.role === 'Administrator' ? 'selected' : ''}>Administrator (Managing Partner)</option>
              <option value="Lawyer" ${u.role === 'Lawyer' ? 'selected' : ''}>Lawyer (Senior Counsel)</option>
              <option value="Clerk" ${u.role === 'Clerk' ? 'selected' : ''}>Legal Clerk / Staff</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Account Status</label>
            <select id="eu-status" class="form-control">
              <option value="Active" ${u.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Deactivated" ${u.status === 'Deactivated' ? 'selected' : ''}>Deactivated</option>
              <option value="Locked" ${u.status === 'Locked' ? 'selected' : ''}>Locked</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Job Title</label>
            <input type="text" id="eu-title" class="form-control" value="${u.jobTitle || u.roleTitle || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Practice Department</label>
            <input type="text" id="eu-dept" class="form-control" value="${u.department || ''}">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="eu-phone" class="form-control" value="${u.phone || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">State Bar License No. (if Counsel)</label>
            <input type="text" id="eu-barno" class="form-control" value="${u.barNumber || ''}" style="font-family: var(--font-mono);" placeholder="e.g. NY-BAR #4829104">
          </div>
        </div>
      </div>
      <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--color-border-subtle); display: flex; align-items: center; justify-content: space-between;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-gold" onclick="AdminView.saveEditUser('${u.id}')">Save Changes</button>
      </div>
    `, 'modal-lg');
  },

  saveEditUser(userId) {
    const u = SLCMS_STATE.users.find(item => item.id === userId);
    if (!u) return;

    const name = document.getElementById('eu-name')?.value?.trim();
    const email = document.getElementById('eu-email')?.value?.trim();

    if (!name || !email) {
      App.showToast('Name and Email are required.', 'error');
      return;
    }

    u.name = name;
    u.email = email;
    u.role = document.getElementById('eu-role')?.value || u.role;
    u.status = document.getElementById('eu-status')?.value || u.status;
    u.jobTitle = document.getElementById('eu-title')?.value || u.jobTitle;
    u.roleTitle = u.jobTitle;
    u.department = document.getElementById('eu-dept')?.value || u.department;
    u.phone = document.getElementById('eu-phone')?.value || u.phone;
    u.barNumber = document.getElementById('eu-barno')?.value || u.barNumber;

    const avatarVal = document.getElementById('eu-avatar-url')?.value?.trim();
    if (avatarVal) {
      u.avatarImg = avatarVal;
    }

    // If current logged-in user is this user, also sync currentUser
    if (SLCMS_STATE.currentUser.id === u.id) {
      SLCMS_STATE.currentUser.name = u.name;
      SLCMS_STATE.currentUser.email = u.email;
      SLCMS_STATE.currentUser.role = u.role;
      SLCMS_STATE.currentUser.roleLabel = u.jobTitle;
      SLCMS_STATE.currentUser.department = u.department;
      SLCMS_STATE.currentUser.phone = u.phone;
      SLCMS_STATE.currentUser.barNumber = u.barNumber || SLCMS_STATE.currentUser.barNumber;
      if (u.avatarImg) SLCMS_STATE.currentUser.avatarImg = u.avatarImg;
      App.updateUserUI();
    }

    SLCMS_STATE.addAuditLog('User Account Updated', 'User Management', `${u.name} (${u.email})`);
    App.closeModal();
    App.showToast(`User account for ${u.name} updated successfully!`, 'success');
    App.refreshCurrentView();
  }
};
