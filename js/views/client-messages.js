/* ==========================================================================
   SLCMS - Client Message Generator & Formal Case Communications Studio
   Connected to Registered Clients, Active Cases, Deadlines and Gmail API.
   Configured with Single Official Sender: SLCMS Law Firm <slcmslegal@gmail.com>
   Strict OAuth2 Token Governance & Verifiable Gmail Message IDs.
   ========================================================================== */

/**
 * Opens prepared email draft in Gmail web interface with slcmslegal@gmail.com
 */
function openPreparedEmailInGmail({ recipient, subject, message }) {
    if (!recipient || !recipient.includes("@")) {
        throw new Error("A valid recipient email is required.");
    }

    const params = new URLSearchParams({
        authuser: "slcmslegal@gmail.com",
        view: "cm",
        fs: "1",
        to: recipient,
        su: subject,
        body: message
    });

    const gmailUrl = `https://mail.google.com/mail/?${params.toString()}`;

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
}
window.openPreparedEmailInGmail = openPreparedEmailInGmail;

const ClientMessagesView = {
  // Official Sender Identity (Immutable & Fixed)
  officialSender: 'slcmslegal@gmail.com',
  officialSenderName: 'SLCMS Law Firm',

  // View & Tab State
  activeTab: 'inbox', // 'inbox' | 'compose' | 'history'
  selectedThreadKey: null,
  inboxSearchQuery: '',
  quickReplyDraft: '',

  // State
  selectedCaseId: '',
  selectedClientId: '',
  selectedMessageType: 'Hearing Reminder',
  selectedLanguage: 'English', // 'English' | 'Kiswahili'
  selectedChannel: 'Email', // 'Email' | 'WhatsApp' | 'SMS'
  sendTiming: 'now', // 'now' | 'schedule'
  scheduledDateTime: '',

  // Dynamic form inputs (for date/time customization)
  dynamicFields: {},

  // Current draft state
  currentSubject: '',
  currentRecipient: '',
  currentMessageBody: '',
  currentMessageId: null,
  currentGmailMessageId: null,
  currentStatus: 'Draft',
  sendError: null,
  isGenerating: false,
  isSending: false,
  gmailOauthStatus: null,

  // Table filters
  historyFilterStatus: 'all',
  historySearchQuery: '',

  init() {
    const clients = SLCMS_STATE.clients || [];
    const cases = SLCMS_STATE.cases || [];

    // Select first client if not set
    if (!this.selectedClientId && clients.length > 0) {
      this.selectedClientId = clients[0].id;
    }

    // Select matching case for client
    if (!this.selectedCaseId) {
      const cl = clients.find(c => c.id === this.selectedClientId);
      const clientCase = cases.find(c => cl && (c.clientId === cl.id || c.client === cl.name || c.clientName === cl.name));
      if (clientCase) {
        this.selectedCaseId = clientCase.id;
      } else if (cases.length > 0) {
        this.selectedCaseId = cases[0].id;
      }
    }

    this.syncSelectedCaseDetails();

    if (!this.currentMessageBody) {
      this.generateDraft(false);
    }

    // Check OAuth status in background
    this.checkGmailStatus();
  },

  async checkGmailStatus() {
    const baseUrl = (typeof SLCMS_CONFIG !== 'undefined' && SLCMS_CONFIG.apiBaseUrl) ? SLCMS_CONFIG.apiBaseUrl : '';
    try {
      const res = await fetch(`${baseUrl}/api/communications/gmail/status`);
      if (res.ok) {
        this.gmailOauthStatus = await res.json();
      }
    } catch (e) {
      // Backend not running or offline
    }
  },

  async authorizeGmail() {
    const baseUrl = (typeof SLCMS_CONFIG !== 'undefined' && SLCMS_CONFIG.apiBaseUrl) ? SLCMS_CONFIG.apiBaseUrl : '';
    App.showToast('Initiating Google OAuth2 for slcmslegal@gmail.com …', 'info', 6000);
    try {
      const res = await fetch(`${baseUrl}/api/communications/gmail/authorize`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.isAuthorized) {
        this.gmailOauthStatus = data;
        App.showToast('Successfully authorized as slcmslegal@gmail.com!', 'success');
      } else {
        App.showToast(data.message || 'Authorization window opened. Please approve in browser.', 'info', 7000);
      }
    } catch (e) {
      App.showToast('Authorization request submitted to server.', 'info');
    }
    App.refreshCurrentView();
  },

  syncSelectedCaseDetails() {
    const cases = SLCMS_STATE.cases || [];
    const clients = SLCMS_STATE.clients || [];

    const cl = clients.find(c => c.id === this.selectedClientId);
    const cs = cases.find(c => c.id === this.selectedCaseId);

    // Pre-fill recipient based on channel
    if (this.selectedChannel === 'Email') {
      this.currentRecipient = (cl && cl.email) || (cs && cs.clientEmail) || this.currentRecipient || '';
    } else {
      this.currentRecipient = (cl && cl.phone) || (cs && cs.clientPhone) || this.currentRecipient || '';
    }

    // Auto-fill dynamic fields from case metadata if available
    if (cs) {
      if (cs.court && !this.dynamicFields.court) this.dynamicFields.court = cs.court;
      if (cs.nextHearingDate) {
        this.dynamicFields.hearingDate = cs.nextHearingDate.includes('T') ? cs.nextHearingDate.split('T')[0] : cs.nextHearingDate;
        if (cs.nextHearingDate.includes('T')) {
          this.dynamicFields.hearingTime = cs.nextHearingDate.split('T')[1].substring(0, 5);
        }
      }
    }
  },

  /**
   * Called when user changes the client dropdown
   */
  handleClientChange(clientId) {
    this.selectedClientId = clientId;
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === clientId);

    if (cl) {
      // 1. Immediately apply recipient contact info from selected client record
      if (this.selectedChannel === 'Email') {
        this.currentRecipient = cl.email || '';
      } else {
        this.currentRecipient = cl.phone || '';
      }

      // 2. Automatically find and sync matters belonging to this client
      const clientCases = (SLCMS_STATE.cases || []).filter(c =>
        c.clientId === cl.id ||
        (cl.name && (c.client === cl.name || c.clientName === cl.name))
      );

      if (clientCases.length > 0) {
        const currentMatches = clientCases.some(c => c.id === this.selectedCaseId);
        if (!currentMatches) {
          this.selectedCaseId = clientCases[0].id;
        }
      }
    }

    this.currentStatus = 'Draft';
    this.currentGmailMessageId = null;
    this.sendError = null;

    this.syncSelectedCaseDetails();
    this.generateDraft(false);
    App.refreshCurrentView();
  },

  /**
   * Called when user changes the case dropdown
   */
  handleCaseChange(caseId) {
    this.selectedCaseId = caseId;
    const cs = (SLCMS_STATE.cases || []).find(c => c.id === caseId);

    if (cs) {
      // Find matching client
      const cl = (SLCMS_STATE.clients || []).find(cli =>
        cli.id === cs.clientId ||
        (cli.name && (cli.name === cs.client || cli.name === cs.clientName))
      );

      if (cl) {
        this.selectedClientId = cl.id;
        if (this.selectedChannel === 'Email') {
          this.currentRecipient = cl.email || cs.clientEmail || '';
        } else {
          this.currentRecipient = cl.phone || cs.clientPhone || '';
        }
      } else {
        if (this.selectedChannel === 'Email') {
          this.currentRecipient = cs.clientEmail || '';
        } else {
          this.currentRecipient = cs.clientPhone || '';
        }
      }
    }

    this.currentStatus = 'Draft';
    this.currentGmailMessageId = null;
    this.sendError = null;

    this.syncSelectedCaseDetails();
    this.generateDraft(false);
    App.refreshCurrentView();
  },

  handleSelectCase(caseId) {
    this.activeTab = 'compose';
    this.selectedThreadKey = `case_${caseId}`;
    return this.handleCaseChange(caseId);
  },

  handleMessageTypeChange(type) {
    this.selectedMessageType = type;
    this.currentStatus = 'Draft';
    this.currentGmailMessageId = null;
    this.sendError = null;
    this.generateDraft(false);
    App.refreshCurrentView();
  },

  handleLanguageChange(lang) {
    this.selectedLanguage = lang;
    this.generateDraft(false);
    App.refreshCurrentView();
  },

  handleChannelChange(channel) {
    this.selectedChannel = channel;
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId);
    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId);

    if (channel === 'Email') {
      this.currentRecipient = (cl && cl.email) || (cs && cs.clientEmail) || '';
    } else {
      this.currentRecipient = (cl && cl.phone) || (cs && cs.clientPhone) || '';
    }
    App.refreshCurrentView();
  },

  handleDynamicFieldInput(key, val) {
    this.dynamicFields[key] = val;
    this.generateDraft(false);
    const textarea = document.getElementById('messageBody') || document.getElementById('client-message-textarea');
    if (textarea) textarea.value = this.currentMessageBody;
    const subjInput = document.getElementById('messageSubject') || document.getElementById('client-message-subject');
    if (subjInput) subjInput.value = this.currentSubject;
  },

  /**
   * Generates draft message using client-message-templates
   */
  generateDraft(showLoading = true) {
    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId || c.name === cs.client || c.name === cs.clientName) || {};

    if (showLoading) {
      this.isGenerating = true;
      const btn = document.getElementById('btn-regenerate-draft');
      if (btn) btn.innerHTML = `<span>⏳</span> Generating …`;

      setTimeout(() => {
        const { subject, body } = ClientMessageTemplates.generate({
          messageType: this.selectedMessageType,
          language: this.selectedLanguage,
          caseData: cs,
          clientData: cl,
          dynamicFields: this.dynamicFields
        });
        this.currentSubject = subject;
        this.currentMessageBody = body;
        this.currentStatus = 'Draft';
        this.isGenerating = false;
        App.refreshCurrentView();
        App.showToast('Draft refreshed with latest client and matter records.', 'info', 3000);
      }, 350);
    } else {
      const { subject, body } = ClientMessageTemplates.generate({
        messageType: this.selectedMessageType,
        language: this.selectedLanguage,
        caseData: cs,
        clientData: cl,
        dynamicFields: this.dynamicFields
      });
      this.currentSubject = subject;
      this.currentMessageBody = body;
      this.currentStatus = 'Draft';
    }
  },

  /**
   * Inserts variable tag directly into the message textarea
   */
  insertTag(tag) {
    const textarea = document.getElementById('messageBody') || document.getElementById('client-message-textarea');
    if (!textarea) return;

    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId) || {};

    let insertVal = '';
    if (tag === 'client') insertVal = cl.name || cs.client || cs.clientName || 'Valued Client';
    else if (tag === 'caseNo') insertVal = cs.caseNumber || 'N/A';
    else if (tag === 'caseTitle') insertVal = cs.title || cs.caseTitle || 'Legal Matter';
    else if (tag === 'court') insertVal = cs.court || 'High Court of Tanzania';
    else if (tag === 'lawyer') insertVal = cs.lawyer || 'Adv. Asha Mrema';
    else if (tag === 'date') {
      insertVal = cs.nextHearingDate ? cs.nextHearingDate.replace('T', ' ') : new Date().toLocaleDateString('en-GB');
    }

    const start = textarea.selectionStart || textarea.value.length;
    const end = textarea.selectionEnd || textarea.value.length;
    const val = textarea.value;
    textarea.value = val.substring(0, start) + insertVal + val.substring(end);
    this.currentMessageBody = textarea.value;
    textarea.focus();
    textarea.setSelectionRange(start + insertVal.length, start + insertVal.length);
    App.showToast(`Inserted: ${insertVal}`, 'info', 2000);
  },

  /**
   * Copies formatted message to clipboard
   */
  copyMessageToClipboard() {
    const text = `From: ${this.officialSenderName} <${this.officialSender}>\nSubject: ${this.currentSubject}\n\n${this.currentMessageBody}`;
    navigator.clipboard?.writeText(text).then(() => {
      App.showToast('Full message copied to clipboard.', 'success');
    }).catch(() => {
      App.showToast('Could not access clipboard.', 'info');
    });
  },

  /**
   * Main Render Entry
   */
  render() {
    this.init();

    const user = SLCMS_STATE.currentUser || {};
    const role = user.role || 'Lawyer';
    const isAdmin = (role === 'Administrator' || role === 'Managing Partner');

    if (role === 'Client' || role === 'External') {
      return `
        <div class="empty-state card" style="max-width: 600px; margin: 3rem auto; padding: 3rem 2rem; text-align: center; border-radius: 12px; border: 1px solid var(--color-border); box-shadow: var(--shadow-md);">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🛡️</div>
          <h2 style="color: var(--color-primary); font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">Authorized Staff Access Only</h2>
          <p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
            Official client communication dispatch is strictly restricted to authorized SLCMS advocates and firm staff.
          </p>
          <button class="btn btn-primary" onclick="App.navigateTo('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }

    const cases = SLCMS_STATE.cases || [];
    const clients = SLCMS_STATE.clients || [];

    const selectedCase = cases.find(c => c.id === this.selectedCaseId) || cases[0] || {};
    const selectedClient = clients.find(c => c.id === this.selectedClientId || c.name === selectedCase.client || c.name === selectedCase.clientName) || clients[0] || {};

    // Filter cases for the current client (or all cases if none linked)
    const clientCases = cases.filter(c =>
      c.clientId === selectedClient.id ||
      (selectedClient.name && (c.client === selectedClient.name || c.clientName === selectedClient.name))
    );
    const availableCases = clientCases.length > 0 ? clientCases : cases;

    const charCount = (this.currentMessageBody || '').length;
    const wordCount = (this.currentMessageBody || '').trim().split(/\s+/).filter(Boolean).length;

    // Recipient initials for visual avatar
    const clientInitials = (selectedClient.name || 'Client')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    // Purpose list
    const messageTypes = [
      { id: 'Hearing Reminder', label: 'Hearing Notice', icon: '⚖️', desc: 'Court appearance reminder' },
      { id: 'Case Progress Update', label: 'Case Update', icon: '📈', desc: 'Case status & milestone update' },
      { id: 'Request for Documents', label: 'Document Request', icon: '📑', desc: 'Evidence & records request' },
      { id: 'Appointment Reminder', label: 'Appointment', icon: '📅', desc: 'Office consultation meeting' },
      { id: 'Case Outcome Notice', label: 'Court Decision', icon: '📜', desc: 'Judgment / ruling notification' },
      { id: 'Custom Message', label: 'Custom Letter', icon: '✍️', desc: 'Direct legal correspondence' }
    ];

    const isOauthConfigured = this.gmailOauthStatus?.isAuthorized;
    const accessibleMessages = this.getAccessibleClientMessages();
    const incomingClientCount = accessibleMessages.filter(m => m.senderRole === 'Client').length;
    const totalMsgCount = accessibleMessages.length;

    const htmlContent = `
      <div class="animate-fade client-message-studio">
        <style>
          .studio-hero {
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            border-radius: 14px;
            padding: 1.5rem 1.75rem;
            color: #FFFFFF;
            margin-bottom: 1.5rem;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
          }
          .studio-grid {
            display: grid;
            grid-template-columns: minmax(360px, 4.8fr) minmax(480px, 7.2fr);
            gap: 1.5rem;
            align-items: start;
            margin-bottom: 2rem;
          }
          @media (max-width: 1024px) {
            .studio-grid {
              grid-template-columns: 1fr;
            }
          }
          .client-dossier-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 1.15rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
            margin-bottom: 1rem;
            transition: all 0.2s ease;
          }
          .client-dossier-card:hover {
            border-color: #CBD5E1;
            box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.06);
          }
          .client-avatar-badge {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, #1E3A8A, #3B82F6);
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            flex-shrink: 0;
            box-shadow: 0 4px 8px rgba(30, 58, 138, 0.25);
          }
          .purpose-chip-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.65rem;
            margin-bottom: 1rem;
          }
          .purpose-chip {
            background: #F8FAFC;
            border: 1.5px solid #E2E8F0;
            border-radius: 10px;
            padding: 0.7rem 0.85rem;
            text-align: left;
            cursor: pointer;
            transition: all 0.18s ease;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          }
          .purpose-chip:hover {
            background: #F1F5F9;
            border-color: #CBD5E1;
            transform: translateY(-1px);
          }
          .purpose-chip.active {
            background: #FEFCE8;
            border-color: #D97706;
            box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
          }
          .purpose-chip.active .purpose-chip-title {
            color: #92400E;
            font-weight: 700;
          }
          .purpose-chip-title {
            font-size: 0.85rem;
            font-weight: 600;
            color: #1E293B;
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }
          .purpose-chip-desc {
            font-size: 0.72rem;
            color: #64748B;
            line-height: 1.3;
          }
          .composer-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 14px;
            padding: 1.5rem;
            box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            min-height: 100%;
          }
          .composer-input-row {
            display: flex;
            align-items: center;
            border-bottom: 1px solid #F1F5F9;
            padding: 0.65rem 0;
            gap: 0.75rem;
          }
          .composer-label {
            width: 75px;
            font-size: 0.82rem;
            font-weight: 600;
            color: #64748B;
            text-align: right;
            flex-shrink: 0;
          }
          .composer-input-field {
            flex: 1;
            border: none;
            outline: none;
            font-size: 0.92rem;
            color: #0F172A;
            background: transparent;
            font-family: inherit;
            padding: 0.25rem 0.5rem;
          }
          .composer-input-field:focus {
            background: #F8FAFC;
            border-radius: 6px;
          }
          .tag-chip {
            background: #F1F5F9;
            color: #475569;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 0.25rem 0.55rem;
            font-size: 0.73rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
          }
          .tag-chip:hover {
            background: #E2E8F0;
            color: #0F172A;
            border-color: #CBD5E1;
            transform: translateY(-1px);
          }
          .btn-gradient-send {
            background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
            color: #FFFFFF;
            font-weight: 700;
            padding: 0.65rem 1.4rem;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 10px rgba(217, 119, 6, 0.3);
            transition: all 0.2s ease;
          }
          .btn-gradient-send:hover {
            background: linear-gradient(135deg, #B45309 0%, #92400E 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 14px rgba(217, 119, 6, 0.4);
          }
          .btn-oauth-auth {
            background: #EFF6FF;
            color: #1D4ED8;
            border: 1.5px solid #BFDBFE;
            font-weight: 600;
            padding: 0.55rem 0.95rem;
            border-radius: 8px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.8rem;
            transition: all 0.2s ease;
          }
          .btn-oauth-auth:hover {
            background: #DBEAFE;
          }
        </style>

        <!-- 1. HERO HEADER -->
        <div class="studio-hero">
          <div>
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem;">
              <h1 style="margin: 0; font-size: 1.4rem; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">
                ✉️ Client Message Studio
              </h1>
              <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem;">
                ● Gmail API: ${this.officialSender}
              </span>
              <span class="badge" style="background: rgba(255, 255, 255, 0.1); color: #E2E8F0; font-size: 0.72rem; border: 1px solid rgba(255, 255, 255, 0.15);">
                🛡️ Legal Privilege Protected
              </span>
            </div>
            <p style="margin: 0; font-size: 0.86rem; color: #94A3B8;">
              All client correspondence is sent strictly from <strong>${this.officialSenderName} &lt;${this.officialSender}&gt;</strong> via Google Gmail API OAuth2.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 0.6rem;">
            ${!isOauthConfigured ? `
              <button class="btn btn-sm btn-gold" onclick="ClientMessagesView.authorizeGmail()" style="background: #F59E0B; border-color: #D97706; color: #FFFFFF; font-weight: 700;">
                🔑 Authorize ${this.officialSender}
              </button>
            ` : `
              <span class="badge" style="background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-size: 0.75rem; padding: 0.35rem 0.75rem;">
                ✓ OAuth Token Active
              </span>
            `}
            <button class="btn btn-secondary btn-sm" onclick="ClientMessagesView.scrollToHistory()" style="background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #FFFFFF;">
              📜 Communication History
            </button>
          </div>
        </div>

        <!-- 2. TAB NAVIGATION BAR -->
        <div class="message-tabs-nav" style="display: flex; gap: 0.5rem; margin-bottom: 1.35rem; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.65rem; flex-wrap: wrap;">
          <button type="button" class="btn ${this.activeTab === 'inbox' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientMessagesView.switchTab('inbox')" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 8px;">
            <span>📥 Client Inquiries &amp; Inbox</span>
            ${incomingClientCount > 0 ? `<span class="badge" style="background: #3B82F6; color: #FFFFFF; font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 12px; font-weight: 700;">${incomingClientCount}</span>` : ''}
          </button>
          <button type="button" class="btn ${this.activeTab === 'case-chat' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientMessagesView.switchTab('case-chat')" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 8px;">
            <span>💬 Live Case Chat</span>
          </button>
          <button type="button" class="btn ${this.activeTab === 'compose' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientMessagesView.switchTab('compose')" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 8px;">
            <span>✍️ Formal Notice Dispatch Studio</span>
          </button>
          <button type="button" class="btn ${this.activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientMessagesView.switchTab('history')" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 8px;">
            <span>📜 Dispatch Audit &amp; History</span>
            <span class="badge" style="background: rgba(148, 163, 184, 0.2); color: #475569; font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 12px;">${totalMsgCount}</span>
          </button>
        </div>

        ${this.activeTab === 'case-chat' ? this.renderLiveCaseChat() : ''}

        ${this.activeTab === 'inbox' ? this.renderInboxView() : ''}

        ${this.activeTab === 'compose' ? `
        <!-- 3. STUDIO TWO-COLUMN LAYOUT -->
        <div class="studio-grid">
          
          <!-- LEFT COLUMN: CLIENT & MATTER SELECTION -->
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            
            <!-- CLIENT & MATTER SELECTION CARD -->
            <div class="client-dossier-card">
              <div style="font-size: 0.78rem; font-weight: 700; color: #0284C7; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                <span>1. Select Client &amp; Matter</span>
                <span style="font-size: 0.72rem; color: #64748B; font-weight: 500;">Verified Case Records</span>
              </div>

              <!-- Client Selector -->
              <div class="form-group" style="margin-bottom: 0.85rem;">
                <label class="form-label required" style="font-size: 0.82rem; font-weight: 600;">Client</label>
                <select class="form-control" style="font-size: 0.9rem; font-weight: 600; padding: 0.55rem 0.75rem;" onchange="ClientMessagesView.handleClientChange(this.value)">
                  ${clients.map(cl => `
                    <option value="${cl.id}" ${cl.id === selectedClient.id ? 'selected' : ''}>
                      ${cl.name} (${cl.type || 'Client'}) — ${cl.email || cl.phone || 'No direct contact'}
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Case Selector (Auto-synced to client) -->
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label required" style="font-size: 0.82rem; font-weight: 600;">Associated Case / Matter</label>
                <select class="form-control" style="font-size: 0.88rem; padding: 0.55rem 0.75rem;" onchange="ClientMessagesView.handleCaseChange(this.value)">
                  ${availableCases.length === 0 ? `<option value="">No cases registered for this client</option>` : ''}
                  ${availableCases.map(c => `
                    <option value="${c.id}" ${c.id === selectedCase.id ? 'selected' : ''}>
                      ${c.caseNumber} — ${c.title || c.caseTitle}
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- DYNAMIC CLIENT & MATTER DOSSIER PREVIEW -->
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.95rem; display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                  <div class="client-avatar-badge">${clientInitials}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <h4 style="margin: 0; font-size: 0.96rem; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${selectedClient.name || 'Client Name'}
                      </h4>
                      <span class="badge" style="background: #EFF6FF; color: #1D4ED8; font-size: 0.68rem; padding: 0.15rem 0.45rem;">
                        ${selectedClient.type || 'Individual'}
                      </span>
                    </div>
                    <div style="font-size: 0.8rem; color: #475569; margin-top: 0.15rem; display: flex; align-items: center; gap: 0.4rem;">
                      <span style="color: #10B981;">●</span>
                      <strong style="color: #0369A1;">${selectedClient.email || 'No email registered'}</strong>
                      ${selectedClient.phone ? `<span style="color: #94A3B8;">|</span> <span>${selectedClient.phone}</span>` : ''}
                    </div>
                  </div>
                </div>

                <div style="border-top: 1px dashed #CBD5E1; padding-top: 0.65rem; font-size: 0.78rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; color: #475569;">
                  <div>🏛️ Court: <strong style="color: #1E293B;">${selectedCase.court || 'High Court of Tanzania'}</strong></div>
                  <div>⚖️ Counsel: <strong style="color: #1E293B;">${selectedCase.lawyer || 'Adv. Asha Mrema'}</strong></div>
                  <div>📅 Next Session: <strong style="color: #D97706;">${selectedCase.nextHearingDate ? selectedCase.nextHearingDate.replace('T', ' ') : 'Pending Cause List'}</strong></div>
                  <div>📁 Status: <strong style="color: #10B981;">${selectedCase.status || 'Active'}</strong></div>
                </div>
              </div>

            </div>

            <!-- MESSAGE PURPOSE & FORMATTING CARD -->
            <div class="client-dossier-card">
              <div style="font-size: 0.78rem; font-weight: 700; color: #D97706; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">
                2. Message Purpose
              </div>

              <!-- 6 Purpose Chips -->
              <div class="purpose-chip-grid">
                ${messageTypes.map(t => `
                  <div class="purpose-chip ${t.id === this.selectedMessageType ? 'active' : ''}" onclick="ClientMessagesView.handleMessageTypeChange('${t.id}')">
                    <div class="purpose-chip-title">
                      <span>${t.icon}</span>
                      <span>${t.label}</span>
                    </div>
                    <div class="purpose-chip-desc">${t.desc}</div>
                  </div>
                `).join('')}
              </div>

              <!-- Language & Channel Selection -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-top: 0.85rem; border-top: 1px dashed #E2E8F0; padding-top: 0.85rem;">
                <div>
                  <label class="form-label" style="font-size: 0.78rem; font-weight: 600; margin-bottom: 0.35rem;">Language</label>
                  <div style="display: flex; gap: 0.4rem;">
                    <button type="button" class="btn btn-sm ${this.selectedLanguage === 'English' ? 'btn-gold' : 'btn-secondary'}" style="flex: 1; font-size: 0.78rem; padding: 0.4rem;" onclick="ClientMessagesView.handleLanguageChange('English')">
                      🇬🇧 English
                    </button>
                    <button type="button" class="btn btn-sm ${this.selectedLanguage === 'Kiswahili' ? 'btn-gold' : 'btn-secondary'}" style="flex: 1; font-size: 0.78rem; padding: 0.4rem;" onclick="ClientMessagesView.handleLanguageChange('Kiswahili')">
                      🇹🇿 Kiswahili
                    </button>
                  </div>
                </div>

                <div>
                  <label class="form-label" style="font-size: 0.78rem; font-weight: 600; margin-bottom: 0.35rem;">Delivery Channel</label>
                  <div style="display: flex; gap: 0.35rem;">
                    <button type="button" class="btn btn-sm btn-gold" style="flex: 1; font-size: 0.76rem; padding: 0.4rem 0.4rem; cursor: default;" title="Deliver via Gmail">
                      ✉️ Gmail
                    </button>
                  </div>
                </div>
              </div>

              <!-- Optional Date / Time Customizer -->
              ${(this.selectedMessageType === 'Hearing Reminder' || this.selectedMessageType === 'Appointment Reminder') ? `
                <div style="margin-top: 0.85rem; background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 0.75rem;">
                  <div style="font-size: 0.76rem; font-weight: 700; color: #92400E; margin-bottom: 0.4rem;">
                    📅 Scheduled Event Details (Optional override):
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div>
                      <input type="date" class="form-control form-control-sm" style="font-size: 0.78rem;" value="${this.dynamicFields.hearingDate || ''}" onchange="ClientMessagesView.handleDynamicFieldInput('hearingDate', this.value)">
                    </div>
                    <div>
                      <input type="text" class="form-control form-control-sm" style="font-size: 0.78rem;" placeholder="e.g. 09:00 AM" value="${this.dynamicFields.hearingTime || ''}" oninput="ClientMessagesView.handleDynamicFieldInput('hearingTime', this.value)">
                    </div>
                  </div>
                </div>
              ` : ''}

            </div>

          </div>

          <!-- RIGHT COLUMN: EXECUTIVE EMAIL COMPOSER -->
          <div>
            <div class="composer-card">
              
              <!-- TOP COMPOSER TOOLBAR -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.75rem; margin-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span class="badge ${this.currentStatus === 'SENT' ? 'badge-active' : (this.currentStatus === 'FAILED' ? 'badge-lost' : 'badge-info')}" style="font-weight: 700; font-size: 0.74rem;">
                    ● Status: ${this.currentStatus}
                  </span>
                  <span style="font-size: 0.78rem; color: #64748B;">
                    ${this.selectedChannel === 'Email' ? 'Official Legal Notice' : `${this.selectedChannel} Message`}
                  </span>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 0.75rem; color: #64748B; font-family: var(--font-mono);">
                    ${wordCount} words &bull; ${charCount} chars
                  </span>
                  <button type="button" id="btn-regenerate-draft" class="btn btn-ghost btn-sm" onclick="ClientMessagesView.generateDraft(true)" title="Regenerate message from case records" style="font-size: 0.78rem; padding: 0.25rem 0.55rem;">
                    🔄 Reset Draft
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm" onclick="ClientMessagesView.copyMessageToClipboard()" title="Copy entire message to clipboard" style="font-size: 0.78rem; padding: 0.25rem 0.55rem;">
                    📋 Copy
                  </button>
                </div>
              </div>

              <!-- DISPATCH STATUS BANNERS -->
              ${this.currentStatus === 'SENT' ? `
                <div style="background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: #065F46;">
                    <span style="font-size: 1.2rem;">✅</span>
                    <div>
                      <strong>Dispatched via Google Gmail API</strong>
                      <div style="font-size: 0.75rem; color: #047857; font-family: var(--font-mono);">
                        Sender: <strong>${this.officialSender}</strong> &bull; Gmail Message ID: <strong>${this.currentGmailMessageId || 'Confirmed'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${this.currentStatus === 'Opened in Gmail' ? `
                <div style="background: #EFF6FF; border: 1.5px solid #3B82F6; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: #1E40AF;">
                    <span style="font-size: 1.25rem;">📬</span>
                    <div>
                      <strong>Opened in Gmail (${this.officialSender})</strong>
                      <div style="font-size: 0.75rem; color: #2563EB;">
                        Gmail opened with recipient, subject, and message body loaded. Review and click <strong>Send</strong> in Gmail. Then confirm below.
                      </div>
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-gold" onclick="ClientMessagesView.confirmManualSend('Gmail')" style="padding: 0.4rem 0.9rem; font-weight: 700;">
                    ✓ Confirm Email Sent
                  </button>
                </div>
              ` : ''}

              ${this.currentStatus === 'Confirmed Sent by Staff' ? `
                <div style="background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: #065F46;">
                    <span style="font-size: 1.2rem;">✅</span>
                    <div>
                      <strong>Confirmed Sent via Gmail</strong>
                      <div style="font-size: 0.75rem; color: #047857; font-family: var(--font-mono);">
                        Sender: <strong>${this.officialSender}</strong> &bull; Verified by Advocate
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${this.currentStatus === 'FAILED' ? `
                <div style="background: #FEF2F2; border: 1.5px solid #EF4444; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.84rem; color: #991B1B;">
                    <span style="font-size: 1.2rem;">⚠️</span>
                    <div>
                      <strong>Delivery Status: FAILED</strong>
                      <div style="font-size: 0.76rem; color: #B91C1C;">
                        ${this.sendError || 'Could not dispatch message. Please ensure slcmslegal@gmail.com is authorized.'}
                      </div>
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-gold" onclick="ClientMessagesView.promptSendConfirmation()" style="padding: 0.35rem 0.85rem; font-weight: 700;">
                    🔄 Retry Dispatch
                  </button>
                </div>
              ` : ''}

              <!-- 1. OFFICIAL SENDER ROW (Strictly Fixed & Locked - Users cannot change) -->
              <div class="composer-input-row" style="background: #F8FAFC; border-radius: 6px; padding: 0.55rem 0.75rem; margin-bottom: 0.4rem; border: 1px solid #E2E8F0;">
                <span class="composer-label" style="font-weight: 700; color: #0F172A;">From:</span>
                <div style="flex: 1; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <span style="font-weight: 700; color: #0F172A; font-size: 0.88rem;">${this.officialSenderName}</span>
                    <span style="color: #0284C7; font-family: var(--font-mono); font-size: 0.84rem; font-weight: 600;">&lt;${this.officialSender}&gt;</span>
                    <span class="badge" style="background: #EFF6FF; color: #1D4ED8; font-size: 0.65rem; font-weight: 700; border: 1px solid #BFDBFE;">
                      🔒 Fixed Official Sender
                    </span>
                  </div>
                  <div style="font-size: 0.72rem; color: #64748B;">
                    Reply-To: <strong style="color: #334155; font-family: var(--font-mono);">${this.officialSender}</strong>
                  </div>
                </div>
              </div>

              <!-- 2. RECIPIENT ROW (Auto-loaded from selected client record) -->
              <div class="composer-input-row">
                <span class="composer-label">To:</span>
                <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                  <input type="text" id="recipientEmail" data-alias="client-recipient-input" class="composer-input-field" style="font-weight: 600; color: #0369A1;" value="${this.currentRecipient}" placeholder="client@example.com" oninput="ClientMessagesView.currentRecipient = this.value">
                  <span style="font-size: 0.72rem; color: #10B981; background: #ECFDF5; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 600; white-space: nowrap;">
                    ✓ Client Record: ${selectedClient.name || 'Client'}
                  </span>
                </div>
              </div>

              <!-- 3. SUBJECT ROW -->
              <div class="composer-input-row" style="margin-bottom: 0.75rem;">
                <span class="composer-label">Subject:</span>
                <input type="text" id="messageSubject" data-alias="client-message-subject" class="composer-input-field" style="font-weight: 700; color: #0F172A;" value="${this.currentSubject}" placeholder="Enter email subject line..." oninput="ClientMessagesView.currentSubject = this.value">
              </div>

              <!-- SMART VARIABLE INSERTION TOOLBAR -->
              <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.65rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.4rem 0.65rem;">
                <span style="font-size: 0.72rem; font-weight: 700; color: #64748B; margin-right: 0.2rem;">Quick Insert:</span>
                <span class="tag-chip" onclick="ClientMessagesView.insertTag('client')" title="Insert client full name">+ Client Name</span>
                <span class="tag-chip" onclick="ClientMessagesView.insertTag('caseNo')" title="Insert official case number">+ Case No</span>
                <span class="tag-chip" onclick="ClientMessagesView.insertTag('caseTitle')" title="Insert case title">+ Matter Title</span>
                <span class="tag-chip" onclick="ClientMessagesView.insertTag('court')" title="Insert court or registry">+ Court</span>
                <span class="tag-chip" onclick="ClientMessagesView.insertTag('lawyer')" title="Insert assigned advocate">+ Lawyer</span>
                <span class="tag-chip" onclick="ClientMessagesView.insertTag('date')" title="Insert next scheduled date">+ Date</span>
              </div>

              <!-- MESSAGE TEXTAREA -->
              <div style="flex: 1; display: flex; flex-direction: column; margin-bottom: 1.25rem;">
                <textarea id="messageBody" data-alias="client-message-textarea" class="form-control" style="flex: 1; min-height: 270px; font-size: 0.92rem; line-height: 1.65; color: #1E293B; background: #FAFAFA; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 1rem; resize: vertical; font-family: var(--font-sans);" oninput="ClientMessagesView.currentMessageBody = this.value">${this.currentMessageBody}</textarea>
              </div>

              <!-- ACTION DOCK: SEND & DELIVERY BUTTONS -->
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
                
                <!-- Left Action Group: Preview & Save Draft -->
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="ClientMessagesView.previewModal()" title="Preview official letterhead representation">
                    👁️ Preview Letter
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm" onclick="ClientMessagesView.saveDraft()" title="Save current message as a draft">
                    💾 Save Draft
                  </button>
                </div>

                <!-- Right Action Group: Real Delivery Dispatch -->
                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                  <!-- Open and Send via Gmail Browser Link (slcmslegal@gmail.com) -->
                  <button type="button" id="openGmailButton" class="btn btn-gold" style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.65rem 1.25rem; font-weight: 700; border-radius: 8px;" title="Open Gmail composer with slcmslegal@gmail.com, recipient, subject, and message filled">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Open and Send via Gmail
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
        ` : ''}

        ${(this.activeTab === 'compose' || this.activeTab === 'history') ? `
        <!-- 4. RECENT DISPATCHES & AUDIT HISTORY -->
        <div id="client-comms-history-section" class="card" style="padding: 1.25rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <h3 style="font-size: 1.05rem; color: var(--color-primary); font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
                <span>📜</span> Case Communications &amp; Dispatch History
              </h3>
              <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 0.15rem 0 0 0;">
                Audited record of all client correspondence, delivery methods, timestamps, advocate signatures, and verified Gmail Message IDs.
              </p>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2 flex-wrap">
              <input type="text" class="form-control form-control-sm" placeholder="Search client or matter..." style="width: 200px; font-size: 0.78rem;" value="${this.historySearchQuery}" oninput="ClientMessagesView.historySearchQuery = this.value; App.refreshCurrentView();">

              <select class="form-control form-control-sm" style="width: auto; font-size: 0.78rem;" onchange="ClientMessagesView.historyFilterStatus = this.value; App.refreshCurrentView();">
                <option value="all">All Dispatches</option>
                <option value="SENT" ${this.historyFilterStatus === 'SENT' ? 'selected' : ''}>SENT (Verified Gmail ID)</option>
                <option value="FAILED" ${this.historyFilterStatus === 'FAILED' ? 'selected' : ''}>FAILED</option>
                <option value="Draft" ${this.historyFilterStatus === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Opened in Gmail" ${this.historyFilterStatus === 'Opened in Gmail' ? 'selected' : ''}>Opened in Gmail</option>
                <option value="Confirmed Sent by Staff" ${this.historyFilterStatus === 'Confirmed Sent by Staff' ? 'selected' : ''}>Manual Confirmed</option>
              </select>
            </div>
          </div>

          <!-- History Table -->
          <div class="table-responsive">
            <table class="data-table" style="width: 100%; font-size: 0.82rem;">
              <thead>
                <tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0;">
                  <th style="padding: 0.65rem 0.75rem; text-align: left;">Date</th>
                  <th style="padding: 0.65rem 0.75rem; text-align: left;">Client</th>
                  <th style="padding: 0.65rem 0.75rem; text-align: left;">Matter</th>
                  <th style="padding: 0.65rem 0.75rem; text-align: left;">Sender</th>
                  <th style="padding: 0.65rem 0.75rem; text-align: left;">Type</th>
                  <th style="padding: 0.65rem 0.75rem; text-align: left;">Prepared By</th>
                  <th style="padding: 0.65rem 0.75rem; text-align: left;">Status</th>
                  <th style="padding: 0.65rem 0.75rem; text-align: center; width: 90px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderHistoryTableRows()}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

      </div>
    `;

    setTimeout(() => this.initListeners(), 0);
    return htmlContent;
  },

  /**
   * Confirmation Modal before dispatch
   */
  promptSendConfirmation() {
    const role = SLCMS_STATE.currentUser?.role || 'Lawyer';
    if (role === 'Client' || role === 'External') {
      App.showToast('Access Denied: Only authorized law firm staff may prepare or send client messages.', 'error');
      return;
    }

    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId || c.name === cs.client || c.name === cs.clientName) || {};

    if (!this.currentRecipient || !this.currentRecipient.trim()) {
      App.showToast('Please provide a recipient email address from the client record.', 'error');
      return;
    }

    if (this.selectedChannel === 'Email' && !this.currentRecipient.includes('@')) {
      App.showToast('Please provide a valid recipient email address (missing @).', 'error');
      return;
    }

    if (!this.currentSubject.trim() || !this.currentMessageBody.trim()) {
      App.showToast('Subject and message content cannot be empty.', 'error');
      return;
    }

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A, #1E293B); color: #FFFFFF;">
        <div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.05rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>🛡️</span> Confirm Gmail API Dispatch
          </h3>
          <p style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.15rem;">
            Single Official Sender: ${this.officialSenderName} &lt;${this.officialSender}&gt;
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.25rem;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; font-size: 0.84rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B;">Official Sender:</span>
            <strong style="color: #0F172A; font-family: var(--font-mono);">${this.officialSender}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B;">Reply-To:</span>
            <strong style="color: #334155; font-family: var(--font-mono);">${this.officialSender}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B;">Client Recipient:</span>
            <strong style="color: #0369A1; font-family: var(--font-mono);">${this.currentRecipient} (${cl.name || 'Client'})</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B;">Case / Matter:</span>
            <strong style="color: #1E293B;">${cs.caseNumber || 'N/A'} — ${cs.title || cs.caseTitle || 'Legal Matter'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed #CBD5E1; padding-top: 0.5rem;">
            <span style="color: #64748B;">Subject:</span>
            <strong style="color: #0F172A;">${this.currentSubject}</strong>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding: 0.85rem 1.25rem; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-gold" onclick="ClientMessagesView.executeDispatch()" style="font-weight: 700; padding: 0.5rem 1.4rem;">
          Confirm &amp; Send as ${this.officialSender}
        </button>
      </div>
    `);
  },

  /**
   * Executes message dispatch
   */
  async executeDispatch() {
    App.closeModal();

    if (this.selectedChannel === 'Email') {
      await this.dispatchEmail();
    } else if (this.selectedChannel === 'WhatsApp') {
      this.dispatchWhatsApp();
    } else {
      this.dispatchSms();
    }
  },

  /**
   * Dispatch strictly via Backend Gmail API as slcmslegal@gmail.com
   */
  async dispatchEmail() {
    this.isSending = true;
    this.sendError = null;
    App.showToast(`Dispatching through official Gmail API (${this.officialSender}) …`, 'info', 4000);
    App.refreshCurrentView();

    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId || c.name === cs.client || c.name === cs.clientName) || {};

    const msgId = this.currentMessageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const payload = {
      messageId: msgId,
      caseId: cs.id || this.selectedCaseId || 'case-gen',
      caseTitle: cs.title || cs.caseTitle || 'Legal Matter',
      caseNumber: cs.caseNumber || 'TBD',
      clientId: cl.id || this.selectedClientId || 'cli-gen',
      clientName: cl.name || cs.client || cs.clientName || 'Client',
      messageType: this.selectedMessageType,
      channel: 'Email',
      sender: this.officialSender,
      recipient: (this.currentRecipient || '').trim(),
      subject: (this.currentSubject || '').trim(),
      messageBody: (this.currentMessageBody || '').trim(),
      language: this.selectedLanguage,
      status: 'Pending',
      preparedBy: SLCMS_STATE.currentUser?.name || 'SLCMS Staff',
      approvedBy: SLCMS_STATE.currentUser?.name || 'Approved',
      sentBy: SLCMS_STATE.currentUser?.name || 'SLCMS Staff',
      sentAt: nowIso,
      createdAt: nowIso
    };

    const baseUrl = (typeof SLCMS_CONFIG !== 'undefined' && SLCMS_CONFIG.apiBaseUrl) ? SLCMS_CONFIG.apiBaseUrl : '';

    try {
      const res = await fetch(`${baseUrl}/api/communications/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': SLCMS_STATE.currentUser?.id || 'usr-admin',
          'X-User-Name': SLCMS_STATE.currentUser?.name || 'SLCMS Staff',
          'X-User-Role': SLCMS_STATE.currentUser?.role || 'Lawyer'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      const gmailMsgId = data.gmailMessageId || (data.record && data.record.gmailMessageId) || data.providerReference;

      if (res.ok && data.success && gmailMsgId) {
        // Required behavior: Display SENT only after Gmail returns a valid message ID
        payload.status = 'SENT';
        payload.gmailMessageId = gmailMsgId;
        payload.providerReference = gmailMsgId;
        this.currentStatus = 'SENT';
        this.currentGmailMessageId = gmailMsgId;
        this.currentMessageId = payload.messageId;
        this.sendError = null;

        SLCMS_STATE.addClientMessage(payload);

        if (typeof SLCMS_STATE.addAuditLog === 'function') {
          SLCMS_STATE.addAuditLog(
            'Client Message Sent via Gmail API',
            'Communications',
            `From: ${this.officialSender} | To: ${payload.recipient} | Case: ${payload.caseNumber} | Gmail ID: ${gmailMsgId}`,
            'Success'
          );
        }

        App.showToast(`Email delivered through Gmail API! Message ID: ${gmailMsgId}`, 'success', 6000);
      } else {
        // Failed: Display FAILED with safe error message and allow retry
        const safeError = data.message || data.failureReason || 'Failed to dispatch email via Gmail API.';
        payload.status = 'FAILED';
        payload.failureReason = safeError;
        this.currentStatus = 'FAILED';
        this.sendError = safeError;

        SLCMS_STATE.addClientMessage(payload);
        App.showToast(`Dispatch failed: ${safeError}`, 'error', 7000);
      }
    } catch (e) {
      const safeError = e.message || 'Connection error to SLCMS backend service.';
      payload.status = 'FAILED';
      payload.failureReason = safeError;
      this.currentStatus = 'FAILED';
      this.sendError = safeError;

      SLCMS_STATE.addClientMessage(payload);
      App.showToast(`Dispatch failed: ${safeError}. Click Retry Dispatch to try again.`, 'error', 7000);
    } finally {
      this.isSending = false;
      App.refreshCurrentView();
    }
  },

  /**
   * Dispatch via WhatsApp
   */
  dispatchWhatsApp() {
    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId || c.name === cs.client || c.name === cs.clientName) || {};

    const cleanPhone = (this.currentRecipient || '').replace(/\D/g, '');
    const encodedText = encodeURIComponent(`*${this.currentSubject}*\n\n${this.currentMessageBody}`);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    const msgId = this.currentMessageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const record = {
      messageId: msgId,
      caseId: cs.id || this.selectedCaseId,
      caseTitle: cs.title || cs.caseTitle || 'Legal Matter',
      caseNumber: cs.caseNumber || 'TBD',
      clientId: cl.id || this.selectedClientId,
      clientName: cl.name || cs.client || 'Client',
      messageType: this.selectedMessageType,
      channel: 'WhatsApp',
      sender: this.officialSender,
      recipient: this.currentRecipient,
      subject: this.currentSubject,
      messageBody: this.currentMessageBody,
      language: this.selectedLanguage,
      status: 'Confirmed Sent by Staff',
      preparedBy: SLCMS_STATE.currentUser?.name || 'SLCMS Advocate',
      approvedBy: SLCMS_STATE.currentUser?.name || 'Approved',
      sentBy: SLCMS_STATE.currentUser?.name || 'SLCMS Advocate',
      sentAt: nowIso,
      providerReference: 'WA-MANUAL-DISPATCH',
      createdAt: nowIso
    };

    SLCMS_STATE.addClientMessage(record);
    window.open(whatsappUrl, '_blank');
    App.showToast('WhatsApp launched with pre-filled message.', 'info', 5000);
    App.refreshCurrentView();
  },

  /**
   * Dispatch via SMS
   */
  dispatchSms() {
    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId || c.name === cs.client || c.name === cs.clientName) || {};

    const cleanPhone = (this.currentRecipient || '').replace(/\s+/g, '');
    const encodedText = encodeURIComponent(`${this.currentSubject}\n\n${this.currentMessageBody}`);
    const smsUrl = `sms:${cleanPhone}?body=${encodedText}`;

    const msgId = this.currentMessageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const record = {
      messageId: msgId,
      caseId: cs.id || this.selectedCaseId,
      caseTitle: cs.title || cs.caseTitle || 'Legal Matter',
      caseNumber: cs.caseNumber || 'TBD',
      clientId: cl.id || this.selectedClientId,
      clientName: cl.name || cs.client || 'Client',
      messageType: this.selectedMessageType,
      channel: 'SMS',
      sender: this.officialSender,
      recipient: this.currentRecipient,
      subject: this.currentSubject,
      messageBody: this.currentMessageBody,
      language: this.selectedLanguage,
      status: 'Confirmed Sent by Staff',
      preparedBy: SLCMS_STATE.currentUser?.name || 'SLCMS Advocate',
      approvedBy: SLCMS_STATE.currentUser?.name || 'Approved',
      sentBy: SLCMS_STATE.currentUser?.name || 'SLCMS Advocate',
      sentAt: nowIso,
      providerReference: 'SMS-MANUAL-TRIGGER',
      createdAt: nowIso
    };

    SLCMS_STATE.addClientMessage(record);
    window.location.href = smsUrl;
    App.showToast('SMS composer opened on device.', 'info', 5000);
    App.refreshCurrentView();
  },

  /**
   * Helper to open prepared email in Gmail
   */
  openPreparedEmailInGmail(opts) {
    return openPreparedEmailInGmail(opts);
  },

  /**
   * Handler for "Open and Send via Gmail" button
   */
  handleOpenGmail() {
    const recipientEl = document.getElementById("recipientEmail") || document.getElementById("client-recipient-input");
    const subjectEl = document.getElementById("messageSubject") || document.getElementById("client-message-subject");
    const messageEl = document.getElementById("messageBody") || document.getElementById("client-message-textarea");

    const recipient = (recipientEl ? recipientEl.value : this.currentRecipient || '').trim();
    const subject = (subjectEl ? subjectEl.value : this.currentSubject || '').trim();
    const message = (messageEl ? messageEl.value : this.currentMessageBody || '').trim();

    try {
      openPreparedEmailInGmail({ recipient, subject, message });
      this.handleGmailOpened(recipient, subject, message);
    } catch (err) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(err.message, 'error', 5000);
      } else {
        alert(err.message);
      }
    }
  },

  /**
   * Process email after opening in Gmail:
   * Sets status to 'Opened in Gmail' (does NOT automatically mark as sent)
   */
  handleGmailOpened(recipient, subject, message) {
    this.currentRecipient = recipient;
    this.currentSubject = subject;
    this.currentMessageBody = message;
    this.currentStatus = 'Opened in Gmail';

    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId || c.name === cs.client || c.name === cs.clientName) || {};

    const msgId = this.currentMessageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.currentMessageId = msgId;
    const nowIso = new Date().toISOString();

    const record = {
      messageId: msgId,
      caseId: cs.id || this.selectedCaseId,
      caseTitle: cs.title || cs.caseTitle || 'Legal Matter',
      caseNumber: cs.caseNumber || 'TBD',
      clientId: cl.id || this.selectedClientId,
      clientName: cl.name || cs.client || 'Client',
      messageType: this.selectedMessageType,
      channel: 'Email',
      sender: this.officialSender,
      recipient: recipient,
      subject: subject,
      messageBody: message,
      language: this.selectedLanguage,
      status: 'Opened in Gmail',
      preparedBy: SLCMS_STATE.currentUser?.name || 'SLCMS Advocate',
      approvedBy: 'Pending Send Confirmation',
      sentBy: null,
      sentAt: null,
      providerReference: 'GMAIL-WEB-COMPOSE',
      createdAt: nowIso
    };

    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.addClientMessage) {
      SLCMS_STATE.addClientMessage(record);
    }

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Opened in Gmail! Please review and click Send in Gmail, then click Confirm Email Sent.', 'info', 7000);
      App.refreshCurrentView();
    }
  },

  /**
   * Confirms manual send after user clicks Send in Gmail
   */
  confirmManualSend(channel = 'Gmail') {
    const nowIso = new Date().toISOString();
    this.currentStatus = 'Confirmed Sent by Staff';

    if (this.currentMessageId && typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.clientMessages) {
      const existing = SLCMS_STATE.clientMessages.find(m => m.messageId === this.currentMessageId);
      if (existing) {
        existing.status = 'Confirmed Sent by Staff';
        existing.sentAt = nowIso;
        existing.sentBy = SLCMS_STATE.currentUser?.name || 'SLCMS Advocate';
        existing.approvedBy = SLCMS_STATE.currentUser?.name || 'Approved';
        if (typeof SLCMS_STATE.saveToStorage === 'function') {
          SLCMS_STATE.saveToStorage();
        }
      }
    }

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Email verified and marked as Confirmed Sent by Staff.', 'success', 5000);
      App.refreshCurrentView();
    }
  },

  /**
   * Confirms manual send by messageId from history table
   */
  confirmManualSendById(msgId) {
    const nowIso = new Date().toISOString();
    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.clientMessages) {
      const existing = SLCMS_STATE.clientMessages.find(m => m.messageId === msgId);
      if (existing) {
        existing.status = 'Confirmed Sent by Staff';
        existing.sentAt = nowIso;
        existing.sentBy = SLCMS_STATE.currentUser?.name || 'SLCMS Advocate';
        existing.approvedBy = SLCMS_STATE.currentUser?.name || 'Approved';
        if (typeof SLCMS_STATE.saveToStorage === 'function') {
          SLCMS_STATE.saveToStorage();
        }
      }
    }
    if (this.currentMessageId === msgId) {
      this.currentStatus = 'Confirmed Sent by Staff';
    }
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Message marked as Confirmed Sent by Staff.', 'success', 4000);
      App.refreshCurrentView();
    }
  },

  /**
   * Connects DOM listeners to openGmailButton
   */
  initListeners() {
    const btn = document.getElementById("openGmailButton");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "true";
      btn.addEventListener("click", function () {
        const recipientEl = document.getElementById("recipientEmail") || document.getElementById("client-recipient-input");
        const subjectEl = document.getElementById("messageSubject") || document.getElementById("client-message-subject");
        const messageEl = document.getElementById("messageBody") || document.getElementById("client-message-textarea");

        const recipient = recipientEl ? recipientEl.value.trim() : "";
        const subject = subjectEl ? subjectEl.value.trim() : "";
        const message = messageEl ? messageEl.value.trim() : "";

        try {
          openPreparedEmailInGmail({
            recipient,
            subject,
            message
          });
          ClientMessagesView.handleGmailOpened(recipient, subject, message);
        } catch (err) {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(err.message, 'error', 5000);
          } else {
            alert(err.message);
          }
        }
      });
    }
  },

  /**
   * Save message draft
   */
  async saveDraft() {
    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId || c.name === cs.client || c.name === cs.clientName) || {};

    const msgId = this.currentMessageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const record = {
      messageId: msgId,
      caseId: cs.id || this.selectedCaseId,
      caseTitle: cs.title || cs.caseTitle || 'Legal Matter',
      caseNumber: cs.caseNumber || 'TBD',
      clientId: cl.id || this.selectedClientId,
      clientName: cl.name || cs.client || 'Client',
      messageType: this.selectedMessageType,
      channel: this.selectedChannel,
      sender: this.officialSender,
      recipient: this.currentRecipient,
      subject: this.currentSubject,
      messageBody: this.currentMessageBody,
      language: this.selectedLanguage,
      status: 'Draft',
      preparedBy: SLCMS_STATE.currentUser?.name || 'SLCMS Staff',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.currentMessageId = msgId;
    this.currentStatus = 'Draft';
    SLCMS_STATE.addClientMessage(record);

    App.showToast('Message draft saved successfully.', 'success');
    App.refreshCurrentView();
  },

  /**
   * Official Letterhead Preview Modal
   */
  previewModal() {
    const cs = (SLCMS_STATE.cases || []).find(c => c.id === this.selectedCaseId) || {};
    const cl = (SLCMS_STATE.clients || []).find(c => c.id === this.selectedClientId) || {};
    const firmName = SLCMS_STATE.systemSettings?.organizationName || 'SLCMS Law Firm';

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A, #1E293B); color: #FFFFFF;">
        <div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.05rem;">
            👁️ Formal Letterhead Preview (${this.selectedChannel})
          </h3>
          <p style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.15rem;">
            From: ${this.officialSenderName} &lt;${this.officialSender}&gt; &bull; Client: ${cl.name || 'Client'}
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; background: #F1F5F9;">
        <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); overflow: hidden; max-width: 650px; margin: 0 auto;">
          
          <!-- Firm Letterhead Header Strip -->
          <div style="background: #0F172A; color: #FFFFFF; padding: 1.25rem 1.5rem; border-bottom: 3px solid #D97706; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 1.15rem; font-weight: 700; letter-spacing: 0.05em; color: #FEF3C7;">
                ⚖️ ${firmName}
              </div>
              <div style="font-size: 0.72rem; color: #94A3B8;">
                Advocates, Notaries Public &amp; Commissioners for Oaths &bull; Dar es Salaam
              </div>
            </div>
            <div style="text-align: right; font-size: 0.75rem; color: #CBD5E1;">
              <div>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div style="font-family: var(--font-mono); color: #FCD34D;">${cs.caseNumber || 'CASE-MATTER'}</div>
            </div>
          </div>

          <!-- Metadata Strip -->
          <div style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 0.85rem 1.5rem; font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.3rem;">
            <div><span style="color: #64748B;">From:</span> <strong>${this.officialSenderName}</strong> &lt;${this.officialSender}&gt;</div>
            <div><span style="color: #64748B;">Reply-To:</span> <strong>${this.officialSender}</strong></div>
            <div><span style="color: #64748B;">To:</span> <strong>${cl.name || 'Client'}</strong> &lt;${this.currentRecipient}&gt;</div>
            <div><span style="color: #64748B;">Subject:</span> <strong>${this.currentSubject}</strong></div>
            <div><span style="color: #64748B;">Matter:</span> <span>${cs.caseNumber || ''} — ${cs.title || cs.caseTitle || ''}</span></div>
          </div>

          <!-- Message Body -->
          <div style="padding: 1.5rem; font-size: 0.9rem; line-height: 1.7; color: #1E293B; white-space: pre-wrap; font-family: var(--font-sans);">
${this.currentMessageBody}
          </div>

        </div>
      </div>

      <div class="modal-footer" style="padding: 0.85rem 1.25rem; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close Preview</button>
      </div>
    `, 'modal-lg');
  },

  /**
   * View Sent/Saved Message Detail Modal
   */
  viewMessageDetailModal(msgId) {
    const msg = (SLCMS_STATE.clientMessages || []).find(m => m.messageId === msgId);
    if (!msg) return;

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A, #1E293B); color: #FFFFFF;">
        <div>
          <h3 class="modal-title" style="color: #FFFFFF; font-size: 1.05rem;">
            📜 Communication Record: ${msg.messageType}
          </h3>
          <p style="font-size: 0.78rem; color: #CBD5E1; margin-top: 0.15rem;">
            Recipient: ${msg.recipient} &bull; Channel: ${msg.channel} &bull; Status: ${msg.status}
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFFFFF;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.25rem;">
        <div class="grid grid-cols-2 gap-3" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem 1rem; font-size: 0.82rem; margin-bottom: 1rem;">
          <div>Client: <strong>${msg.clientName || 'N/A'}</strong></div>
          <div>Recipient: <strong style="color: #0369A1;">${msg.recipient || 'N/A'}</strong></div>
          <div>Official Sender: <strong style="color: #0284C7; font-family: var(--font-mono);">${msg.sender || this.officialSender}</strong></div>
          <div>Case: <strong>${msg.caseNumber || 'N/A'} — ${msg.caseTitle || ''}</strong></div>
          <div>Status: <span class="badge ${msg.status === 'SENT' ? 'badge-active' : (msg.status === 'FAILED' ? 'badge-lost' : 'badge-info')}">${msg.status}</span></div>
          <div>Sent At: <strong>${msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'Not recorded'}</strong></div>
          <div>Prepared By: <strong>${msg.preparedBy || 'Staff'}</strong></div>
          <div>Gmail Message ID: <strong style="font-family: var(--font-mono); font-size: 0.76rem; color: #1E3A8A;">${msg.gmailMessageId || msg.providerReference || 'Pending'}</strong></div>
        </div>

        <div class="form-group" style="margin-bottom: 0.5rem;">
          <label class="form-label" style="font-size: 0.78rem; font-weight: 600;">Subject</label>
          <div style="font-weight: 700; font-size: 0.92rem; color: #1E293B;">${msg.subject}</div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size: 0.78rem; font-weight: 600;">Message Body</label>
          <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 1rem; font-size: 0.86rem; line-height: 1.6; white-space: pre-wrap; color: #334155; max-height: 320px; overflow-y: auto;">
${msg.messageBody}
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding: 0.85rem 1.25rem; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `, 'modal-lg');
  },

  /**
   * Render history table rows
   */
  renderHistoryTableRows() {
    const list = (SLCMS_STATE.clientMessages || []);
    const q = (this.historySearchQuery || '').toLowerCase();
    const stFilter = this.historyFilterStatus;

    const filtered = list.filter(m => {
      const matchStatus = (stFilter === 'all' || m.status === stFilter);
      const matchSearch = !q ||
        (m.clientName && m.clientName.toLowerCase().includes(q)) ||
        (m.caseTitle && m.caseTitle.toLowerCase().includes(q)) ||
        (m.caseNumber && m.caseNumber.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        (m.recipient && m.recipient.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      return `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
            No client communications found matching criteria.
          </td>
        </tr>
      `;
    }

    return filtered.map(m => {
      const d = m.sentAt || m.createdAt || '';
      const dateStr = d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today';
      const isClientMsg = (m.senderRole === 'Client');
      const badgeClass = isClientMsg ? 'badge-new' : (m.status === 'SENT' ? 'badge-active' : (m.status === 'Opened in Gmail' ? 'badge-warning' : (m.status === 'FAILED' ? 'badge-lost' : (m.status === 'Draft' ? 'badge-info' : 'badge-confidential'))));
      const isOpenedInGmail = (m.status === 'Opened in Gmail');

      return `
        <tr style="border-bottom: 1px solid #E2E8F0; ${isClientMsg ? 'background: #F0F9FF;' : ''}">
          <td style="padding: 0.65rem 0.75rem; color: #475569; white-space: nowrap;">${dateStr}</td>
          <td style="padding: 0.65rem 0.75rem; font-weight: 600; color: #1E293B;">
            ${m.clientName || 'Client'}
            ${isClientMsg ? '<span style="display:block; font-size:0.68rem; color:#0284C7; font-weight:700;">📥 Direct from Client</span>' : ''}
          </td>
          <td style="padding: 0.65rem 0.75rem; color: #334155;">
            <div style="font-weight: 600; font-size: 0.8rem;">${m.caseNumber || ''}</div>
            <div style="font-size: 0.74rem; color: #64748B; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.caseTitle || ''}</div>
          </td>
          <td style="padding: 0.65rem 0.75rem; font-family: var(--font-mono); font-size: 0.76rem; color: #0284C7;">
            ${isClientMsg ? `Client &rarr; ${m.recipient || 'Counsel'}` : (m.sender || this.officialSender)}
          </td>
          <td style="padding: 0.65rem 0.75rem; color: #1E293B;">${m.messageType || 'General'}</td>
          <td style="padding: 0.65rem 0.75rem; color: #475569;">${m.preparedBy || m.sender || 'Staff'}</td>
          <td style="padding: 0.65rem 0.75rem;">
            <span class="badge ${badgeClass}" style="font-size: 0.7rem;">${isClientMsg ? 'From Client' : m.status}</span>
          </td>
          <td style="padding: 0.65rem 0.75rem; text-align: center; white-space: nowrap;">
            ${isClientMsg ? `
              <button class="btn btn-sm btn-gold" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; margin-right: 0.35rem;" onclick="ClientMessagesView.handleReplyToMessage('${m.messageId}')" title="Reply to client message">↩️ Reply</button>
            ` : (isOpenedInGmail ? `
              <button class="btn btn-sm btn-gold" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; margin-right: 0.35rem;" onclick="ClientMessagesView.confirmManualSendById('${m.messageId}')" title="Confirm email was sent in Gmail">Confirm Sent</button>
            ` : '')}
            <button class="btn btn-ghost btn-sm" style="font-size: 0.76rem; padding: 0.2rem 0.55rem; color: var(--color-gold); font-weight: 700;" onclick="ClientMessagesView.viewMessageDetailModal('${m.messageId}')">
              View
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  handleReplyToMessage(msgId) {
    const m = (SLCMS_STATE.clientMessages || []).find(item => item.messageId === msgId);
    if (!m) return;

    let threadKey = m.caseId && m.caseId !== 'case-direct' ? `case_${m.caseId}` : (m.clientId ? `client_${m.clientId}` : (m.caseNumber || m.clientName || m.messageId));
    this.selectedThreadKey = threadKey;
    this.activeTab = 'inbox';
    App.refreshCurrentView();

    setTimeout(() => {
      const replyInput = document.getElementById('inbox-quick-reply-text');
      if (replyInput) {
        replyInput.focus();
        replyInput.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  },

  scrollToHistory() {
    this.activeTab = 'history';
    App.refreshCurrentView();
    const el = document.getElementById('client-comms-history-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    App.refreshCurrentView();
  },

  selectThread(threadKey) {
    this.selectedThreadKey = threadKey;
    App.refreshCurrentView();
    setTimeout(() => {
      const stream = document.getElementById('thread-message-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 50);
  },

  formatTimeAgo(isoString) {
    if (!isoString) return 'Recent';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recent';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  },

  getAccessibleClientMessages() {
    const user = SLCMS_STATE.currentUser || {};
    const role = user.role || 'Lawyer';
    const isSuperRole = (role === 'Administrator' || role === 'Managing Partner' || role === 'Legal Officer');
    const userId = user.id || user.lawyerId || user.staffId || '';
    const userName = (user.name || '').trim().toLowerCase();
    const assignedSet = new Set(Array.isArray(user.assignedCaseIds) ? user.assignedCaseIds : []);
    const allCases = SLCMS_STATE.cases || [];
    const allMessages = SLCMS_STATE.clientMessages || [];

    if (isSuperRole) {
      return allMessages;
    }

    return allMessages.filter(m => {
      if (!m) return false;

      // 1. Matched by case ID or case number in lawyer's assigned set
      if (m.caseId && assignedSet.has(m.caseId)) return true;
      if (m.caseNumber && assignedSet.has(m.caseNumber)) return true;

      // 2. Matched by case record details
      const c = allCases.find(cs => cs.id === m.caseId || (m.caseNumber && cs.caseNumber === m.caseNumber));
      if (c) {
        if (c.assignedLawyerId === userId || c.lawyerId === userId || c.seniorLawyerId === userId || c.clerkId === userId) return true;
        if (c.lawyer && userName && c.lawyer.toLowerCase().includes(userName)) return true;
        if (c.leadCounsel && userName && c.leadCounsel.toLowerCase().includes(userName)) return true;
        if (c.assignedCounsel && userName && c.assignedCounsel.toLowerCase().includes(userName)) return true;
      }

      // 3. Direct recipient or sender matches current lawyer
      if (m.recipient && userName && m.recipient.toLowerCase().includes(userName)) return true;
      if (m.sender && userName && m.sender.toLowerCase().includes(userName)) return true;

      // 4. If assigned lawyer role and message is addressed to counsel
      if (m.recipientRole === 'Lawyer' && (!m.caseId || m.caseId === 'case-direct')) return true;

      return false;
    });
  },

  getInboxThreads() {
    const messages = this.getAccessibleClientMessages();
    const allCases = SLCMS_STATE.cases || [];
    const allClients = SLCMS_STATE.clients || [];
    const threadsMap = new Map();

    messages.forEach(m => {
      let threadKey = m.caseId && m.caseId !== 'case-direct' ? `case_${m.caseId}` : (m.clientId ? `client_${m.clientId}` : (m.caseNumber || m.clientName || m.messageId));

      if (!threadsMap.has(threadKey)) {
        const matchedCase = allCases.find(c => c.id === m.caseId || (m.caseNumber && c.caseNumber === m.caseNumber)) || null;
        const matchedClient = allClients.find(cl => cl.id === m.clientId || cl.name === m.clientName || (matchedCase && (cl.id === matchedCase.clientId || cl.name === matchedCase.client || cl.name === matchedCase.clientName))) || null;

        threadsMap.set(threadKey, {
          threadKey,
          caseId: m.caseId || (matchedCase ? matchedCase.id : ''),
          caseNumber: m.caseNumber || (matchedCase ? matchedCase.caseNumber : 'Direct Inquiry'),
          caseTitle: m.caseTitle || (matchedCase ? (matchedCase.title || matchedCase.caseTitle) : 'Direct Communication'),
          clientId: m.clientId || (matchedClient ? matchedClient.id : ''),
          clientName: m.clientName || (matchedClient ? matchedClient.name : (m.senderRole === 'Client' ? m.sender : m.recipient)) || 'Client',
          clientEmail: (matchedClient ? matchedClient.email : '') || (matchedCase ? matchedCase.clientEmail : '') || '',
          clientPhone: (matchedClient ? matchedClient.phone : '') || (matchedCase ? matchedCase.clientPhone : '') || '',
          court: matchedCase ? (matchedCase.court || 'High Court') : '',
          status: matchedCase ? (matchedCase.status || 'Active') : 'Active',
          messages: [],
          latestMessage: m,
          latestTimestamp: m.sentAt || m.createdAt || '',
          clientMessageCount: 0,
          totalCount: 0
        });
      }

      const thread = threadsMap.get(threadKey);
      thread.messages.push(m);
      thread.totalCount++;
      if (m.senderRole === 'Client') {
        thread.clientMessageCount++;
      }

      const msgTime = new Date(m.sentAt || m.createdAt || 0).getTime();
      const threadTime = new Date(thread.latestTimestamp || 0).getTime();
      if (msgTime >= threadTime) {
        thread.latestMessage = m;
        thread.latestTimestamp = m.sentAt || m.createdAt || '';
      }
    });

    const threads = Array.from(threadsMap.values()).map(t => {
      t.messages.sort((a, b) => new Date(a.sentAt || a.createdAt || 0) - new Date(b.sentAt || b.createdAt || 0));
      return t;
    });

    threads.sort((a, b) => new Date(b.latestTimestamp || 0) - new Date(a.latestTimestamp || 0));
    return threads;
  },

  openInDispatchStudio(threadKey) {
    const threads = this.getInboxThreads();
    const thread = threads.find(t => t.threadKey === threadKey);
    if (thread) {
      if (thread.caseId) this.selectedCaseId = thread.caseId;
      if (thread.clientId) this.selectedClientId = thread.clientId;
      this.syncSelectedCaseDetails();
      if (thread.latestMessage) {
        this.currentSubject = `Re: ${thread.latestMessage.subject || thread.caseTitle || 'Legal Matter'}`;
        this.currentMessageBody = `Dear ${thread.clientName || 'Client'},\n\nThank you for your message regarding ${thread.caseNumber}.\n\nKind regards,\n${SLCMS_STATE.currentUser?.name || 'Assigned Counsel'}\nSLCMS Law Firm`;
      }
    }
    this.activeTab = 'compose';
    App.refreshCurrentView();
  },

  sendThreadReply(threadKey) {
    const threads = this.getInboxThreads();
    const thread = threads.find(t => t.threadKey === threadKey);
    if (!thread) {
      App.showToast('Conversation thread not found.', 'error');
      return;
    }

    const input = document.getElementById('inbox-quick-reply-text');
    const text = input ? input.value.trim() : (this.quickReplyDraft || '').trim();
    if (!text) {
      App.showToast('Please type a reply before sending.', 'warning');
      return;
    }

    const alsoGmail = document.getElementById('inbox-also-gmail')?.checked;

    const user = SLCMS_STATE.currentUser || {};
    const nowIso = new Date().toISOString();
    const replyId = `msg-reply-${Date.now()}`;

    const newReply = {
      messageId: replyId,
      caseId: thread.caseId || 'case-direct',
      caseNumber: thread.caseNumber || 'INQ-DIRECT',
      caseTitle: thread.caseTitle || 'Legal Inquiry',
      clientId: thread.clientId || '',
      clientName: thread.clientName || 'Client',
      sender: user.name || 'Assigned Counsel',
      senderRole: user.role || 'Lawyer',
      preparedBy: user.name || 'Counsel',
      recipient: thread.clientName || 'Client',
      recipientRole: 'Client',
      messageType: 'Counsel Response',
      channel: alsoGmail ? 'Portal + Gmail' : 'Direct Portal',
      subject: `Re: ${thread.latestMessage?.subject || thread.caseTitle || 'Case Communication'}`,
      messageBody: text,
      status: 'SENT',
      sentBy: user.name || 'Counsel',
      sentAt: nowIso,
      createdAt: nowIso
    };

    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.addClientMessage) {
      SLCMS_STATE.addClientMessage(newReply);
    }

    if (alsoGmail && thread.clientEmail && typeof openPreparedEmailInGmail === 'function') {
      try {
        openPreparedEmailInGmail({
          recipient: thread.clientEmail,
          subject: newReply.subject,
          message: newReply.messageBody
        });
      } catch (err) {}
    }

    this.quickReplyDraft = '';
    App.showToast(`Reply dispatched to ${thread.clientName}'s portal!`, 'success');
    App.refreshCurrentView();

    setTimeout(() => {
      const stream = document.getElementById('thread-message-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 100);
  },

  renderInboxView() {
    const threads = this.getInboxThreads();
    const q = (this.inboxSearchQuery || '').toLowerCase().trim();
    const filteredThreads = threads.filter(t => {
      if (!q) return true;
      return (t.clientName && t.clientName.toLowerCase().includes(q)) ||
        (t.caseNumber && t.caseNumber.toLowerCase().includes(q)) ||
        (t.caseTitle && t.caseTitle.toLowerCase().includes(q)) ||
        (t.latestMessage?.messageBody && t.latestMessage.messageBody.toLowerCase().includes(q));
    });

    if (!this.selectedThreadKey && filteredThreads.length > 0) {
      this.selectedThreadKey = filteredThreads[0].threadKey;
    } else if (this.selectedThreadKey && !filteredThreads.some(t => t.threadKey === this.selectedThreadKey)) {
      this.selectedThreadKey = filteredThreads[0]?.threadKey || null;
    }

    const activeThread = filteredThreads.find(t => t.threadKey === this.selectedThreadKey) || filteredThreads[0] || null;

    return `
      <div class="inbox-container" style="display: grid; grid-template-columns: minmax(320px, 3.8fr) minmax(480px, 8.2fr); gap: 1.5rem; align-items: start; margin-bottom: 2rem;">
        
        <!-- LEFT PANEL: THREAD LIST -->
        <div class="inbox-thread-panel" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div style="font-size: 0.95rem; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 0.4rem;">
              <span>💬</span> Conversations
            </div>
            <span class="badge" style="background: #EFF6FF; color: #1D4ED8; font-weight: 700; font-size: 0.75rem;">
              ${filteredThreads.length} ${filteredThreads.length === 1 ? 'Matter' : 'Matters'}
            </span>
          </div>

          <!-- Search Input -->
          <div style="margin-bottom: 1rem;">
            <input type="text" class="form-control form-control-sm" placeholder="🔍 Search clients or cases..." value="${this.inboxSearchQuery}" oninput="ClientMessagesView.inboxSearchQuery = this.value; App.refreshCurrentView();" style="width: 100%; font-size: 0.82rem; border-radius: 8px;">
          </div>

          <!-- Thread List Stream -->
          <div class="thread-list-stream" style="max-height: 600px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 0.25rem;">
            ${filteredThreads.length === 0 ? `
              <div style="padding: 2.5rem 1rem; text-align: center; color: #94A3B8; font-size: 0.85rem;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                No client conversations match your filter.
              </div>
            ` : filteredThreads.map(t => {
              const isSelected = activeThread && t.threadKey === activeThread.threadKey;
              const initials = (t.clientName || 'Client').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
              const isFromClient = t.latestMessage?.senderRole === 'Client';
              return `
                <div class="inbox-thread-item ${isSelected ? 'active' : ''}" onclick="ClientMessagesView.selectThread('${t.threadKey}')" style="cursor: pointer; padding: 0.85rem 1rem; border-radius: 10px; border: 1.5px solid ${isSelected ? '#D97706' : '#E2E8F0'}; background: ${isSelected ? '#FEFCE8' : (isFromClient ? '#F0F9FF' : '#FFFFFF')}; transition: all 0.15s ease;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 0;">
                      <div style="width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, #1E3A8A, #3B82F6); color: #FFF; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${initials}
                      </div>
                      <div style="min-width: 0;">
                        <div style="font-weight: 700; font-size: 0.88rem; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${t.clientName}
                        </div>
                        <div style="font-size: 0.72rem; color: #0369A1; font-weight: 600;">
                          ${t.caseNumber}
                        </div>
                      </div>
                    </div>
                    <div style="text-align: right; flex-shrink: 0; margin-left: 0.5rem;">
                      <span style="font-size: 0.7rem; color: #64748B;">${this.formatTimeAgo(t.latestTimestamp)}</span>
                      ${t.clientMessageCount > 0 ? `
                        <div style="margin-top: 0.2rem;">
                          <span class="badge" style="background: #0284C7; color: #FFF; font-size: 0.65rem; padding: 0.1rem 0.45rem; border-radius: 10px; font-weight: 700;">
                            ${t.clientMessageCount} Client
                          </span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  <div style="font-size: 0.78rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 0.25rem;">
                    <strong style="color: ${isFromClient ? '#0284C7' : '#334155'};">${isFromClient ? 'Client: ' : 'You: '}</strong>${(t.latestMessage?.messageBody || '').substring(0, 70)}...
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- RIGHT PANEL: CONVERSATION STREAM & QUICK REPLY -->
        <div class="inbox-conversation-panel" style="display: flex; flex-direction: column; gap: 1rem;">
          ${!activeThread ? `
            <div class="card" style="padding: 3.5rem 2rem; text-align: center; border-radius: 14px; border: 1.5px dashed #CBD5E1; background: #FFFFFF;">
              <div style="font-size: 3.5rem; margin-bottom: 0.75rem;">💬</div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">Select a Conversation</h3>
              <p style="color: #64748B; font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.5rem auto;">
                Pick a client thread from the left or compose a new dispatch to initiate dialogue.
              </p>
              <button class="btn btn-primary" onclick="ClientMessagesView.switchTab('compose')">✍️ Compose New Dispatch</button>
            </div>
          ` : `
            <!-- Thread Top Header Card -->
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.15rem 1.35rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #1E3A8A, #3B82F6); color: #FFF; font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(30, 58, 138, 0.25);">
                  ${(activeThread.clientName || 'Client').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0F172A;">
                      ${activeThread.clientName}
                    </h3>
                    <span class="badge" style="background: #EFF6FF; color: #1D4ED8; font-size: 0.68rem; padding: 0.15rem 0.45rem;">
                      ${activeThread.status}
                    </span>
                  </div>
                  <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.15rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <strong style="color: #0369A1;">📁 ${activeThread.caseNumber}</strong>
                    <span>&bull;</span>
                    <span>${activeThread.caseTitle}</span>
                    ${activeThread.court ? `<span>&bull;</span> <span>🏛️ ${activeThread.court}</span>` : ''}
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="ClientMessagesView.openInDispatchStudio('${activeThread.threadKey}')" title="Open full dispatch studio with letterhead formatting">
                  ✍️ Open in Studio
                </button>
                ${activeThread.caseId ? `
                  <button type="button" class="btn btn-ghost btn-sm" onclick="App.navigate('cases'); setTimeout(() => CasesView.showCaseDetails('${activeThread.caseId}'), 100);" title="View case dossier">
                    📁 View Case
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Messages Stream -->
            <div id="thread-message-stream" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.5rem; max-height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 1.15rem; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);">
              ${activeThread.messages.length === 0 ? `
                <div style="text-align: center; padding: 3rem 1rem; color: #94A3B8;">
                  No messages yet in this conversation thread.
                </div>
              ` : activeThread.messages.map(m => {
                const isClient = (m.senderRole === 'Client');
                const timeStr = m.sentAt || m.createdAt ? new Date(m.sentAt || m.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent';

                if (isClient) {
                  return `
                    <div style="align-self: flex-start; max-width: 82%;">
                      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                        <span style="font-weight: 700; font-size: 0.82rem; color: #0F172A;">${m.sender || m.clientName || 'Client'}</span>
                        <span class="badge" style="background: #E0F2FE; color: #0369A1; font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem;">Client</span>
                        <span style="font-size: 0.72rem; color: #94A3B8;">${timeStr}</span>
                      </div>
                      <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 0 12px 12px 12px; padding: 0.95rem 1.15rem; color: #1E293B; font-size: 0.88rem; line-height: 1.6; box-shadow: 0 2px 4px rgba(0,0,0,0.03); white-space: pre-wrap;">
                        ${m.subject ? `<div style="font-weight: 700; color: #0369A1; margin-bottom: 0.4rem; font-size: 0.84rem; border-bottom: 1px dashed #E2E8F0; padding-bottom: 0.3rem;">📌 ${m.subject}</div>` : ''}
                        <div>${m.messageBody || ''}</div>
                      </div>
                      <div style="font-size: 0.68rem; color: #64748B; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.4rem;">
                        <span>📱 Delivered from Client Portal</span>
                        ${m.channel && m.channel !== 'Direct Portal' ? `<span>&bull; Via: ${m.channel}</span>` : ''}
                      </div>
                    </div>
                  `;
                } else {
                  return `
                    <div style="align-self: flex-end; max-width: 82%;">
                      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.35rem;">
                        <span style="font-size: 0.72rem; color: #94A3B8;">${timeStr}</span>
                        <span class="badge" style="background: #FEF3C7; color: #92400E; font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem;">${m.senderRole || 'Lawyer'}</span>
                        <span style="font-weight: 700; font-size: 0.82rem; color: #0F172A;">${m.sender || m.preparedBy || 'Counsel'}</span>
                      </div>
                      <div style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border: 1px solid #334155; border-radius: 12px 0 12px 12px; padding: 0.95rem 1.15rem; color: #FFFFFF; font-size: 0.88rem; line-height: 1.6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); white-space: pre-wrap;">
                        ${m.subject ? `<div style="font-weight: 700; color: #FCD34D; margin-bottom: 0.4rem; font-size: 0.84rem; border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 0.3rem;">📌 ${m.subject}</div>` : ''}
                        <div>${m.messageBody || ''}</div>
                      </div>
                      <div style="font-size: 0.68rem; color: #64748B; margin-top: 0.25rem; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem;">
                        <span>✓ Sent to Client Portal</span>
                        ${m.channel ? `<span>(${m.channel})</span>` : ''}
                        ${m.status ? `<span>&bull; ${m.status}</span>` : ''}
                      </div>
                    </div>
                  `;
                }
              }).join('')}
            </div>

            <!-- Quick Reply Composer -->
            <div style="background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 14px; padding: 1.15rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.84rem; font-weight: 700; color: #1E293B; display: flex; align-items: center; gap: 0.35rem;">
                  <span>↩️</span> Quick Reply to <strong>${activeThread.clientName}</strong>
                </span>
                <span style="font-size: 0.74rem; color: #64748B;">Re: ${activeThread.caseNumber}</span>
              </div>

              <div style="margin-bottom: 0.75rem;">
                <textarea id="inbox-quick-reply-text" class="form-control" style="width: 100%; min-height: 95px; font-size: 0.92rem; line-height: 1.6; padding: 0.85rem; border-radius: 10px; border: 1.5px solid #E2E8F0; resize: vertical;" placeholder="Type your response to ${activeThread.clientName} regarding ${activeThread.caseNumber} (delivered directly to client's portal)..." onkeydown="if(event.ctrlKey && event.key === 'Enter') ClientMessagesView.sendThreadReply('${activeThread.threadKey}')">${this.quickReplyDraft || ''}</textarea>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.78rem; color: #475569;">
                  <input type="checkbox" id="inbox-also-gmail" style="cursor: pointer;">
                  <label for="inbox-also-gmail" style="cursor: pointer; user-select: none;">
                    Also prepare Gmail email to <strong style="color: #0369A1;">${activeThread.clientEmail || 'client'}</strong>
                  </label>
                </div>

                <div style="display: flex; gap: 0.5rem;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="ClientMessagesView.openInDispatchStudio('${activeThread.threadKey}')" style="font-weight: 600;">
                    ✍️ Full Studio
                  </button>
                  <button type="button" class="btn btn-gold btn-sm" onclick="ClientMessagesView.sendThreadReply('${activeThread.threadKey}')" style="font-weight: 700; padding: 0.55rem 1.35rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                    🚀 Send Reply to Client Portal
                  </button>
                </div>
              </div>
            </div>
          `}
        </div>

      </div>
    `;
  },

  handleCaseChatSelect(caseId) {
    this.selectedCaseId = caseId;
    App.refreshCurrentView();
  },

  renderLiveCaseChat() {
    const user = SLCMS_STATE.currentUser || {};
    const isLawyer = user.role === 'Lawyer' || user.role === 'Senior Lawyer';
    let cases = (SLCMS_STATE.cases || []).filter(c => c.status !== 'Closed');

    if (cases.length === 0) {
      const stored = localStorage.getItem('slcms_cases');
      if (stored) {
        try { cases = JSON.parse(stored).filter(c => c.status !== 'Closed'); } catch (e) {}
      }
    }
    if (cases.length === 0) {
      const reqs = localStorage.getItem('slcms_client_legal_requests') || localStorage.getItem('slcms_legal_requests');
      if (reqs) {
        try {
          const list = JSON.parse(reqs);
          cases = list.map(r => ({
            id: r.id || r.caseId || 'case-matter',
            caseNumber: r.caseDocket || r.caseNumber || 'MATTER-001',
            title: r.clientName ? `${r.clientName} - ${r.issueType || 'Matter'}` : (r.title || 'Case Matter'),
            client: r.clientName || 'Client',
            lawyer: r.lawyer || r.assignedLawyer || 'Assigned Counsel',
            status: r.status || 'ASSIGNED'
          }));
        } catch (e) {}
      }
    }

    if (isLawyer) {
      const assigned = cases.filter(c => c.assignedLawyerId === user.id || (c.lawyer && c.lawyer.includes(user.name)));
      if (assigned.length > 0) cases = assigned;
    }
    const selectedCase = cases.find(c => c.id === this.selectedCaseId) || cases[0];
    const caseId = selectedCase ? selectedCase.id : null;

    if (!caseId) {
      return `
        <div class="card p-6" style="text-align: center; padding: 3rem 1rem; border-radius: 12px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚖️</div>
          <h3 style="color: var(--color-primary); font-weight: 700;">No Assigned Matters with Live Chat</h3>
          <p class="text-secondary" style="font-size: 0.88rem; max-width: 480px; margin: 0.5rem auto 0 auto;">
            Per SLCMS workflow rules, secure case chat unlocks automatically once a client's invoice is verified as <strong>PAID</strong> and a Lawyer is assigned by the Legal Officer.
          </p>
        </div>
      `;
    }

    return `
      <div class="live-case-chat-container animate-fade">
        <div class="card" style="padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-left: 4px solid var(--color-gold, #C89B3C); border-radius: 10px;">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <label style="font-weight: 700; font-size: 0.88rem; color: var(--color-primary); white-space: nowrap;">Selected Legal Matter:</label>
            <select class="form-control" style="font-size: 0.88rem; font-weight: 600; min-width: 320px;" onchange="ClientMessagesView.handleCaseChatSelect(this.value)">
              ${cases.map(c => `
                <option value="${c.id}" ${c.id === caseId ? 'selected' : ''}>
                  ${c.caseNumber} &bull; ${c.title || c.caseTitle} (${c.client || 'Client'})
                </option>
              `).join('')}
            </select>
          </div>
          <div style="font-size: 0.82rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px;">
            <span style="color: #10B981; font-size: 0.9rem;">●</span> Real-Time WebSocket &amp; MySQL
          </div>
        </div>

        <div>
          ${typeof CaseChatView !== 'undefined' ? CaseChatView.renderChatView(caseId) : '<div class="card p-6">Loading Case Chat...</div>'}
        </div>
      </div>
    `;
  }
};
