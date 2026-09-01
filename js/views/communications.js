/* ==========================================================================
   SLCMS - Communications Log & History
   Audited Client Interactions, Opposing Counsel Conferrals & Privileged Memos
   ========================================================================== */

const CommunicationsView = {
  activeFilter: 'all', // 'all' | 'email' | 'call' | 'meeting' | 'internal_note' | 'letter'
  searchQuery: '',

  render() {
    const filtered = SLCMS_STATE.communications.filter(c => {
      const matchFilter = this.activeFilter === 'all' || c.type === this.activeFilter;
      const matchSearch = !this.searchQuery ||
        c.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (c.client && c.client.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (c.caseNumber && c.caseNumber.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (c.sender && c.sender.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (c.recipient && c.recipient.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchFilter && matchSearch;
    });

    const emailCount = SLCMS_STATE.communications.filter(c => c.type === 'email').length;
    const callCount = SLCMS_STATE.communications.filter(c => c.type === 'call').length;
    const meetingCount = SLCMS_STATE.communications.filter(c => c.type === 'meeting').length;
    const memoCount = SLCMS_STATE.communications.filter(c => c.type === 'internal_note').length;
    const letterCount = SLCMS_STATE.communications.filter(c => c.type === 'letter').length;

    return `
      <div class="animate-fade">
        <!-- 1. VIEW HEADER -->
        <div class="view-header">
          <div>
            <div class="flex items-center gap-2" style="margin-bottom: 0.25rem;">
              <h1 class="page-title">Communications & Counsel Log</h1>
              <span class="badge badge-confidential" style="font-size: 0.75rem;">
                Fed. R. Evid. 408 & 502 Shield
              </span>
            </div>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">
              Audited records of client interactions, opposing counsel calls, settlement talks and privileged internal memos
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn btn-secondary" onclick="CommunicationsView.openAddMemoModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span>+ Internal Memo</span>
            </button>
            <button class="btn btn-gold" onclick="CommunicationsView.openRecordCommModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>+ Record Communication</span>
            </button>
          </div>
        </div>

        <!-- 2. FILTER & SEARCH TOOLBAR -->
        <div class="filter-bar" style="background: #FFFFFF; padding: 1rem 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: var(--shadow-xs);">
          <div class="input-with-icon" style="flex: 1; min-width: 280px;">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" class="form-control" placeholder="Search logs, participants, subjects, or matters..."
                   value="${this.searchQuery}" oninput="CommunicationsView.handleSearch(this.value)">
          </div>

          <div class="tabs-nav" style="border-bottom: none; margin-bottom: 0; gap: 0.35rem;">
            <button class="tab-btn ${this.activeFilter === 'all' ? 'active' : ''}" onclick="CommunicationsView.setFilter('all')">
              All (${SLCMS_STATE.communications.length})
            </button>
            <button class="tab-btn ${this.activeFilter === 'email' ? 'active' : ''}" onclick="CommunicationsView.setFilter('email')">
              Emails (${emailCount})
            </button>
            <button class="tab-btn ${this.activeFilter === 'call' ? 'active' : ''}" onclick="CommunicationsView.setFilter('call')">
              Calls (${callCount})
            </button>
            <button class="tab-btn ${this.activeFilter === 'meeting' ? 'active' : ''}" onclick="CommunicationsView.setFilter('meeting')">
              Conferences (${meetingCount})
            </button>
            <button class="tab-btn ${this.activeFilter === 'internal_note' ? 'active' : ''}" onclick="CommunicationsView.setFilter('internal_note')">
              Memos (${memoCount})
            </button>
            <button class="tab-btn ${this.activeFilter === 'letter' ? 'active' : ''}" onclick="CommunicationsView.setFilter('letter')">
              Letters (${letterCount})
            </button>
          </div>
        </div>

        <!-- 3. CHRONOLOGICAL COMMUNICATIONS FEED -->
        <div class="flex flex-col gap-4">
          ${filtered.length === 0 ? `
            <div class="card p-8 text-center" style="background: var(--color-surface-subtle);">
              <p style="color: var(--color-text-secondary);">No communication records matching your search query.</p>
            </div>
          ` : filtered.map(c => `
            <div class="card card-hover" style="border-left: 4.5px solid ${this.getBorderColor(c.type)}; padding: 1.4rem; transition: all var(--transition-fast);">
              <div class="flex items-start justify-between flex-wrap gap-3" style="margin-bottom: 0.75rem;">
                <div class="flex items-start gap-3">
                  <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background: ${this.getBgColor(c.type)}; display: flex; align-items: center; justify-content: center; color: ${this.getBorderColor(c.type)}; flex-shrink: 0; font-size: 1.1rem; border: 1px solid ${this.getBorderColor(c.type)}33;">
                    ${this.getIcon(c.type)}
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 style="font-size: 1.1rem; color: var(--color-primary); font-weight: 700; line-height: 1.3;">
                        ${c.subject}
                      </h3>
                      <span class="badge ${this.getBadgeClass(c.type)}" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">
                        ${this.getTypeLabel(c.type)}
                      </span>
                    </div>

                    <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.35rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                      <span>From: <strong style="color: var(--color-primary);">${c.sender}</strong></span>
                      <span style="color: var(--color-gold);">→</span>
                      <span>To: <strong style="color: var(--color-primary);">${c.recipient}</strong></span>
                    </div>
                  </div>
                </div>

                <div class="text-right flex flex-col items-end gap-1">
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); font-family: var(--font-mono); background: var(--color-surface-subtle); padding: 0.2rem 0.55rem; border-radius: 4px; border: 1px solid var(--color-border);">
                    🕒 ${c.timestamp}
                  </div>
                  <span class="badge" style="background: #102A43; color: #FFFFFF; font-family: var(--font-mono); font-size: 0.72rem; cursor: pointer;" onclick="App.navigate('cases')" title="View case dossier">
                    📁 ${c.caseNumber}
                  </span>
                </div>
              </div>

              <!-- Summary Content Box -->
              <div style="background: var(--color-surface-subtle); padding: 1rem 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: 0.9rem; color: var(--color-text-main); line-height: 1.6; margin: 0.75rem 0;">
                ${c.summary}
              </div>

              <!-- Attachment & Action Row -->
              <div class="flex items-center justify-between flex-wrap gap-2 pt-2" style="border-top: 1px solid var(--color-border-subtle); font-size: 0.8rem;">
                <div>
                  ${c.attachment ? `
                    <div class="flex items-center gap-2" style="background: var(--color-gold-light); border: 1px solid var(--color-gold-border); padding: 0.35rem 0.75rem; border-radius: var(--radius-sm); color: var(--color-gold); cursor: pointer; width: fit-content;" onclick="CommunicationsView.viewAttachment('${c.attachment}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                      <strong style="text-decoration: underline;">${c.attachment}</strong>
                      <span class="badge badge-confidential" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">Vault Artifact</span>
                    </div>
                  ` : `
                    <span style="color: var(--color-text-muted); font-size: 0.75rem;">🔒 Oral / Privileged Direct Conferral</span>
                  `}
                </div>

                <div class="flex items-center gap-2">
                  <button class="btn btn-ghost btn-sm" onclick="CommunicationsView.forwardComm('${c.id}')" title="Forward via secure firm dispatch">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="15 17 20 12 15 7"/>
                      <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
                    </svg>
                    <span>Forward</span>
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="CommunicationsView.quickReply('${c.id}')" title="Draft reply">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 17 4 12 9 7"/>
                      <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                    </svg>
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  getBorderColor(type) {
    switch (type) {
      case 'email': return '#2563EB';       // Info Blue
      case 'call': return '#C89B3C';        // Gold
      case 'meeting': return '#16A34A';     // Success Green
      case 'internal_note': return '#F59E0B'; // Warning Orange
      case 'letter': return '#102A43';      // Primary Navy
      default: return '#64748B';
    }
  },

  getBgColor(type) {
    switch (type) {
      case 'email': return 'rgba(37, 99, 235, 0.15)';
      case 'call': return 'rgba(200, 155, 60, 0.15)';
      case 'meeting': return 'rgba(22, 163, 74, 0.15)';
      case 'internal_note': return 'rgba(245, 158, 11, 0.15)';
      case 'letter': return 'rgba(100, 116, 139, 0.15)';
      default: return 'var(--color-surface-subtle)';
    }
  },

  getBadgeClass(type) {
    switch (type) {
      case 'email': return 'badge-new';
      case 'call': return 'badge-confidential';
      case 'meeting': return 'badge-won';
      case 'internal_note': return 'badge-pending';
      case 'letter': return 'badge-active';
      default: return 'badge-onhold';
    }
  },

  getTypeLabel(type) {
    switch (type) {
      case 'email': return 'Client Email';
      case 'call': return 'Counsel Call';
      case 'meeting': return 'Trial Run / Meeting';
      case 'internal_note': return 'Internal Memo';
      case 'letter': return 'Court Letter';
      default: return 'Communication';
    }
  },

  getIcon(type) {
    switch (type) {
      case 'email':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
      case 'call':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
      case 'meeting':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
      case 'internal_note':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
      case 'letter':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
      default:
        return `💬`;
    }
  },

  handleSearch(val) {
    this.searchQuery = val;
    App.refreshCurrentView();
  },

  setFilter(filter) {
    this.activeFilter = filter;
    App.refreshCurrentView();
  },

  viewAttachment(filename) {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Encrypted Vault Preview: ${filename}
        </h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background: var(--color-surface-subtle); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📄</div>
          <h4 style="color: var(--color-primary);">${filename}</h4>
          <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.35rem;">
            SHA-256 Checksum: <code style="font-family: var(--font-mono); font-size: 0.72rem;">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
          </p>
          <div class="flex justify-center gap-2" style="margin-top: 1rem;">
            <span class="badge badge-confidential">Attorney-Client Privileged</span>
            <span class="badge badge-active">AES-256 Sealed</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        <button class="btn btn-gold" onclick="App.showToast('Downloading encrypted artifact...', 'success'); App.closeModal();">Download Artifact</button>
      </div>
    `);
  },

  quickReply(commId) {
    const c = SLCMS_STATE.communications.find(item => item.id === commId);
    if (!c) return;

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Reply to: ${c.subject}</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Recipient</label>
          <input type="text" class="form-control" value="${c.sender}" readonly style="background: var(--color-surface-subtle);">
        </div>
        <div class="form-group">
          <label class="form-label required">Subject</label>
          <input type="text" id="reply-subject" class="form-control" value="RE: ${c.subject}">
        </div>
        <div class="form-group">
          <label class="form-label required">Message Body</label>
          <textarea id="reply-body" class="form-control" rows="5" placeholder="Compose privileged legal reply..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CommunicationsView.sendReply('${c.caseNumber}')">Send Secure Communication</button>
      </div>
    `);
  },

  sendReply(caseNumber) {
    const subject = document.getElementById('reply-subject')?.value;
    const body = document.getElementById('reply-body')?.value;
    if (!body) {
      App.showToast('Please enter a message body.', 'error');
      return;
    }

    const newComm = {
      id: 'comm-' + Date.now(),
      type: 'email',
      sender: SLCMS_STATE.currentUser.name,
      recipient: 'Client / Opposing Counsel',
      client: 'Associated Client',
      caseNumber: caseNumber,
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: subject,
      summary: body,
      attachment: null
    };

    SLCMS_STATE.addCommunication(newComm);
    App.closeModal();
    App.showToast('Reply dispatched and logged to case communications.', 'success');
    App.refreshCurrentView();
  },

  forwardComm(commId) {
    App.showToast('Dispatch modal opened for secure transmission.', 'info');
  },

  openRecordCommModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Log Client / Opposing Counsel Communication</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Communication Channel</label>
            <select id="rc-type" class="form-control">
              <option value="email">Formal Email</option>
              <option value="call">Phone Conference</option>
              <option value="meeting">In-Person Meeting / Trial Run</option>
              <option value="letter">Formal Court Letter</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Related Legal Matter</label>
            <select id="rc-case" class="form-control">
              ${SLCMS_STATE.cases.map(c => `<option value="${c.caseNumber}">${c.caseNumber} - ${c.title}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Sender / Firm Staff</label>
            <input type="text" id="rc-sender" class="form-control" value="${SLCMS_STATE.currentUser.name}">
          </div>
          <div class="form-group">
            <label class="form-label required">Recipient / Contact</label>
            <input type="text" id="rc-recipient" class="form-control" placeholder="e.g. David Sterling (Opposing Counsel)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Subject / Conference Topic</label>
          <input type="text" id="rc-subject" class="form-control" placeholder="e.g. Settlement Terms Conferral & Deposition Scheduling" required>
        </div>
        <div class="form-group">
          <label class="form-label required">Detailed Summary of Discussion</label>
          <textarea id="rc-summary" class="form-control" rows="4" placeholder="Record key agreements, admissions, statutory disclosures or agreed deadlines..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CommunicationsView.saveComm()">Save to Legal Log</button>
      </div>
    `);
  },

  openAddMemoModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Record Confidential Internal Legal Memo</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Related Case</label>
          <select id="rc-case" class="form-control">
            ${SLCMS_STATE.cases.map(c => `<option value="${c.caseNumber}">${c.caseNumber} - ${c.title}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Memo Subject</label>
          <input type="text" id="rc-subject" class="form-control" placeholder="e.g. Analysis of Opposing Party's Motion to Dismiss Precedents">
        </div>
        <div class="form-group">
          <label class="form-label required">Confidential Analysis & Strategy</label>
          <textarea id="rc-summary" class="form-control" rows="5" placeholder="Attorney-client privileged internal memo notes..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="CommunicationsView.saveMemo()">Save Privileged Memo</button>
      </div>
    `);
  },

  saveComm() {
    const subject = document.getElementById('rc-subject')?.value;
    if (!subject) {
      App.showToast('Please provide a subject line.', 'error');
      return;
    }

    const caseNum = document.getElementById('rc-case')?.value;
    const relatedCase = SLCMS_STATE.cases.find(c => c.caseNumber === caseNum) || SLCMS_STATE.cases[0];

    const newComm = {
      id: 'comm-' + Date.now(),
      type: document.getElementById('rc-type')?.value || 'email',
      sender: document.getElementById('rc-sender')?.value || SLCMS_STATE.currentUser.name,
      recipient: document.getElementById('rc-recipient')?.value || 'Client / Counsel',
      client: relatedCase.client,
      caseNumber: caseNum,
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: subject,
      summary: document.getElementById('rc-summary')?.value || '',
      attachment: null
    };

    SLCMS_STATE.addCommunication(newComm);
    App.closeModal();
    App.showToast('Communication logged to matter history.', 'success');
    App.refreshCurrentView();
  },

  saveMemo() {
    const subject = document.getElementById('rc-subject')?.value;
    const caseNum = document.getElementById('rc-case')?.value;
    const relatedCase = SLCMS_STATE.cases.find(c => c.caseNumber === caseNum) || SLCMS_STATE.cases[0];

    const newMemo = {
      id: 'comm-' + Date.now(),
      type: 'internal_note',
      sender: SLCMS_STATE.currentUser.name,
      recipient: 'Litigation Team',
      client: relatedCase.client,
      caseNumber: caseNum,
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: subject || 'Internal Legal Memo',
      summary: document.getElementById('rc-summary')?.value || '',
      attachment: null
    };

    SLCMS_STATE.addCommunication(newMemo);
    App.closeModal();
    App.showToast('Privileged internal memo recorded.', 'success');
    App.refreshCurrentView();
  }
};
