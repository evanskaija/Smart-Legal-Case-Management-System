/* ==========================================================================
   SLCMS - Client Management & Client Dossiers
   ========================================================================== */

const ClientsView = {
  currentTab: 'all', // 'all' | 'organization' | 'individual'
  searchQuery: '',

  render() {
    const filteredClients = SLCMS_STATE.clients.filter(c => {
      const matchSearch = !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchType = this.currentTab === 'all' || c.type.toLowerCase() === this.currentTab;
      return matchSearch && matchType;
    });

    return `
      <div class="animate-fade">
        <div class="view-header">
          <div>
            <h1 class="page-title">Client Directory & Accounts</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">
              Corporate retainers, individual representations, KYC compliance records, and account ledgers
            </p>
          </div>
          <button class="btn btn-gold" onclick="ClientsView.openNewClientModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            <span>Add New Client</span>
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="input-with-icon" style="flex: 1; min-width: 240px;">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control" placeholder="Search clients by entity name, email, EIN/SSN or contact person..."
                   value="${this.searchQuery}" oninput="ClientsView.handleSearch(this.value)">
          </div>

          <div class="tabs-nav" style="border-bottom: none; margin-bottom: 0;">
            <button class="tab-btn ${this.currentTab === 'all' ? 'active' : ''}" onclick="ClientsView.filterTab('all')">All (${SLCMS_STATE.clients.length})</button>
            <button class="tab-btn ${this.currentTab === 'organization' ? 'active' : ''}" onclick="ClientsView.filterTab('organization')">Organizations</button>
            <button class="tab-btn ${this.currentTab === 'individual' ? 'active' : ''}" onclick="ClientsView.filterTab('individual')">Individuals</button>
          </div>
        </div>

        <!-- Clients Cards Grid -->
        <div class="grid grid-cols-3 gap-6">
          ${filteredClients.map(c => `
            <div class="card card-hover flex flex-col justify-between" onclick="ClientsView.openClientProfile('${c.id}')" style="cursor: pointer; position: relative;">
              <div>
                <div class="flex items-start justify-between" style="margin-bottom: 0.75rem;">
                  <div class="flex items-center gap-3">
                    <div class="avatar avatar-md ${c.type === 'Organization' ? 'avatar-navy' : 'avatar-gold'}">
                      ${c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style="font-size: 1.05rem; color: var(--color-primary); line-height: 1.2;">${c.name}</h3>
                      <span class="badge" style="background: var(--color-surface-subtle); font-size: 0.7rem; margin-top: 0.2rem;">${c.type}</span>
                    </div>
                  </div>
                  ${c.confidential ? `
                    <span class="badge badge-confidential" title="Confidential Client Representation">Privileged</span>
                  ` : ''}
                </div>

                <div class="flex flex-col gap-2" style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 1rem 0;">
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>${c.email}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>${c.phone}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-3" style="border-top: 1px solid var(--color-border-subtle); font-size: 0.78rem;">
                <div>
                  <span style="color: var(--color-text-muted);">Active Matters:</span>
                  <strong style="color: var(--color-primary);">${c.activeCases}</strong>
                </div>
                <div>
                  <span style="color: var(--color-text-muted);">Total Billed:</span>
                  <strong style="color: var(--color-gold);">$${c.totalBilled.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  handleSearch(val) {
    this.searchQuery = val;
    App.refreshCurrentView();
  },

  filterTab(tab) {
    this.currentTab = tab;
    App.refreshCurrentView();
  },

  openClientProfile(clientId) {
    const c = SLCMS_STATE.clients.find(item => item.id === clientId);
    if (!c) return;

    const clientCases = SLCMS_STATE.cases.filter(cs => cs.clientId === c.id || cs.client === c.name);

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #102A43, #0B1F33); color: #FFFFFF;">
        <div class="flex items-center gap-3">
          <div class="avatar avatar-lg ${c.type === 'Organization' ? 'avatar-navy' : 'avatar-gold'}">
            ${c.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 style="color: #FFFFFF; font-size: 1.35rem;">${c.name}</h2>
              <span class="badge" style="background: rgba(255,255,255,0.15); color: #FFFFFF;">${c.type}</span>
              ${c.confidential ? '<span class="badge badge-confidential">Privileged Matter</span>' : ''}
            </div>
            <div style="font-size: 0.8rem; color: #CBD5E1;">Tax ID: ${c.idNumber} • Status: ${c.status}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body">
        <div class="grid grid-cols-3 gap-6" style="margin-bottom: 1.5rem;">
          <div class="card" style="background: var(--color-surface-subtle);">
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Direct Contact</div>
            <div style="font-weight: 600; color: var(--color-primary);">${c.contactPerson}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">${c.email}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${c.phone}</div>
          </div>
          <div class="card" style="background: var(--color-surface-subtle);">
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Registered Address</div>
            <div style="font-size: 0.85rem; color: var(--color-primary); line-height: 1.4;">${c.address}</div>
          </div>
          <div class="card" style="background: var(--color-surface-subtle);">
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Billing Summary</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-gold);">$${c.totalBilled.toLocaleString()}</div>
            <div style="font-size: 0.75rem; color: var(--color-success);">KYC Retainer Verified</div>
          </div>
        </div>

        <h4 style="color: var(--color-primary); margin-bottom: 0.75rem;">Associated Legal Matters (${clientCases.length})</h4>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Case Number</th><th>Title</th><th>Counsel</th><th>Status</th><th>Hearing</th></tr>
            </thead>
            <tbody>
              ${clientCases.map(cs => `
                <tr>
                  <td><strong>${cs.caseNumber}</strong></td>
                  <td>${cs.title}</td>
                  <td>${cs.lawyer}</td>
                  <td><span class="badge badge-${cs.status.toLowerCase().replace(' ', '')}">${cs.status}</span></td>
                  <td>${cs.nextHearingDate}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Dossier</button>
        <button class="btn btn-gold" onclick="CasesView.openNewCaseModal()">+ Open New Case for Client</button>
      </div>
    `, 'modal-lg');
  },

  openNewClientModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Register New Law-Firm Client</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Client / Entity Name</label>
            <input type="text" id="nc-name" class="form-control" placeholder="e.g. Apex Global Corp" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Client Entity Type</label>
            <select id="nc-type" class="form-control">
              <option value="Organization">Organization / Corporate</option>
              <option value="Individual">Individual Person</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Primary Contact Person</label>
            <input type="text" id="nc-contact" class="form-control" placeholder="Full name & title">
          </div>
          <div class="form-group">
            <label class="form-label required">Official Email</label>
            <input type="email" id="nc-email" class="form-control" placeholder="counsel@entity.com">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="nc-phone" class="form-control" placeholder="+1 (555) 000-0000">
          </div>
          <div class="form-group">
            <label class="form-label">Tax ID / SSN / EIN</label>
            <input type="text" id="nc-idnum" class="form-control" placeholder="EIN-XX-XXXXXXX">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Registered Office Address</label>
          <input type="text" id="nc-address" class="form-control" placeholder="Street Address, City, State, ZIP">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="ClientsView.saveNewClient()">Save Client Record</button>
      </div>
    `);
  },

  saveNewClient() {
    const name = document.getElementById('nc-name')?.value;
    if (!name) {
      App.showToast('Please provide a Client Name', 'error');
      return;
    }

    const newClient = {
      id: 'cli-' + Date.now(),
      name: name,
      type: document.getElementById('nc-type')?.value || 'Organization',
      contactPerson: document.getElementById('nc-contact')?.value || name,
      email: document.getElementById('nc-email')?.value || 'contact@client.com',
      phone: document.getElementById('nc-phone')?.value || '+1 (555) 000-0000',
      address: document.getElementById('nc-address')?.value || 'New York, NY',
      idNumber: document.getElementById('nc-idnum')?.value || 'EIN-PENDING',
      activeCases: 0,
      totalCases: 0,
      totalBilled: 0,
      status: 'Active',
      confidential: true,
      notes: 'New client onboarding.'
    };

    SLCMS_STATE.clients.unshift(newClient);
    SLCMS_STATE.addAuditLog('New Client Onboarded', 'Client Management', newClient.name);
    App.closeModal();
    App.showToast(`Client ${newClient.name} registered successfully!`, 'success');
    App.refreshCurrentView();
  }
};
