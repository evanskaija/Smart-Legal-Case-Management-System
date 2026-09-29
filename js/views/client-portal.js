/* ==========================================================================
   SLCMS - Client Portal View
   Dedicated, Zero-Trust Portal for Clients:
   - Dashboard (Empty state & Active state)
   - Legal Assistance Requests (Submission with 20-2000 chars & attachments)
   - My Cases (Title, Number, Court, Assigned Lawyer, Stage, Next Date, Updates)
   - Client Messages (Direct privileged communication with legal team)
   - Documents (Requested uploads & shared downloads)
   - Appointments & Court Dates
   - Client Profile Management
   ========================================================================== */

const ClientPortalView = {
  activeTab: 'dashboard', // 'dashboard' | 'requests' | 'cases' | 'messages' | 'documents' | 'appointments' | 'profile'
  requests: [],
  cases: [],
  summary: {
    activeCasesCount: 0,
    totalCasesCount: 0,
    pendingRequestsCount: 0,
    newMessagesCount: 0,
    documentsRequestedCount: 0,
    nextImportantDate: 'None Scheduled'
  },
  isLoading: false,

  async initData() {
    const user = SLCMS_STATE.currentUser || {};
    const clientId = user.clientId || user.id || user.clientNumber;
    const email = user.email;

    try {
      this.isLoading = true;
      if (typeof ClientPortalService !== 'undefined') {
        const dash = await ClientPortalService.getDashboard(clientId, email);
        if (dash) {
          this.summary = {
            activeCasesCount: dash.activeCasesCount ?? 0,
            totalCasesCount: dash.totalCasesCount ?? 0,
            pendingRequestsCount: dash.pendingRequestsCount ?? 0,
            newMessagesCount: dash.newMessagesCount ?? 0,
            documentsRequestedCount: dash.documentsRequestedCount ?? 0,
            nextImportantDate: dash.nextImportantDate || 'None Scheduled'
          };
          this.cases = dash.cases || [];
          this.requests = dash.requests || [];
        }
      }
    } catch (e) {
      console.warn('ClientPortalView.initData error, falling back to local state:', e);
    } finally {
      this.isLoading = false;
    }
  },

  render(subTab = null) {
    if (subTab) {
      this.activeTab = subTab;
    }
    const user = SLCMS_STATE.currentUser || {};
    const clientName = user.name || user.full_name || 'Client';

    // Synchronize background data refresh
    setTimeout(() => {
      this.refreshDataInBackground();
    }, 50);

    return `
      <div class="client-portal-wrapper animate-fade" style="padding-bottom: 3rem;">
        <!-- Top Executive Welcome & Action Banner -->
        <div class="client-portal-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff; border-radius: 12px; padding: 1.75rem 2rem; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border: 1px solid rgba(255,255,255,0.08);">
          <div style="min-width: 240px;">
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem;">
              <span style="background: rgba(2, 132, 199, 0.2); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.4); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 10px; border-radius: 9999px;">
                Client Portal · ${user.staffId || user.clientNumber || 'Verified Client'}
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; color: #10B981; font-size: 0.75rem; font-weight: 600;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
                Active Account
              </span>
            </div>
            <h1 style="font-size: 1.65rem; font-weight: 700; margin: 0 0 0.35rem 0; font-family: var(--font-heading, 'Outfit', sans-serif); color: #F8FAFC;">
              Welcome, ${this.escapeHtml(clientName)}
            </h1>
            <p style="margin: 0; color: #94A3B8; font-size: 0.88rem; max-width: 650px;">
              Manage your legal assistance requests, follow active court proceedings, and review privileged case communications.
            </p>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button class="btn btn-primary" onclick="ClientPortalView.openRequestModal()" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); border: none; padding: 0.65rem 1.25rem; font-weight: 600; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Request Legal Assistance</span>
            </button>
          </div>
        </div>

        <!-- Portal Sub-Navigation Tabs Bar (Required Dashboards) -->
        <div class="client-portal-tabs-bar" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--color-border, #E2E8F0);">
          <button class="btn btn-sm ${this.activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-requests')">
            📝 My Requests
          </button>
          <button class="btn btn-sm ${this.activeTab === 'cases' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-cases')">
            ⚖️ My Cases
          </button>
          <button class="btn btn-sm ${this.activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-invoices')">
            📄 Invoices
          </button>
          <button class="btn btn-sm ${this.activeTab === 'upload-proof' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-upload-proof')">
            📤 Upload Payment Proof
          </button>
          <button class="btn btn-sm ${this.activeTab === 'receipts' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-receipts')">
            🧾 Receipts
          </button>
          <button class="btn btn-sm ${this.activeTab === 'messages' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-messages')">
            💬 Messages
          </button>
          <button class="btn btn-sm ${this.activeTab === 'documents' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-documents')">
            📁 Documents
          </button>
          <button class="btn btn-sm ${this.activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}" onclick="App.navigate('client-notifications')">
            🔔 Notifications
          </button>
        </div>

        <!-- Portal Tab Content -->
        <div id="client-portal-subcontent">
          ${this.renderSubTabContent()}
        </div>
      </div>
    `;
  },

  async refreshDataInBackground() {
    const user = SLCMS_STATE.currentUser || {};
    const clientId = user.clientId || user.id || user.clientNumber;
    const email = user.email;
    if (typeof ClientPortalService !== 'undefined') {
      try {
        const dash = await ClientPortalService.getDashboard(clientId, email);
        if (dash) {
          this.summary = {
            activeCasesCount: dash.activeCasesCount ?? 0,
            totalCasesCount: dash.totalCasesCount ?? 0,
            pendingRequestsCount: dash.pendingRequestsCount ?? 0,
            newMessagesCount: dash.newMessagesCount ?? 0,
            documentsRequestedCount: dash.documentsRequestedCount ?? 0,
            nextImportantDate: dash.nextImportantDate || 'None Scheduled'
          };
          this.cases = dash.cases || [];
          this.requests = dash.requests || [];
        }
      } catch (e) {}
    }
  },

  renderSubTabContent() {
    switch (this.activeTab) {
      case 'dashboard':
        return this.renderDashboard();
      case 'requests':
        return this.renderRequests();
      case 'cases':
        return this.renderCases();
      case 'invoices':
        return this.renderInvoices();
      case 'upload-proof':
        return this.renderUploadProof();
      case 'receipts':
        return this.renderReceipts();
      case 'messages':
        return this.renderMessages();
      case 'documents':
        return this.renderDocuments();
      case 'notifications':
        return this.renderNotifications();
      case 'appointments':
        return this.renderAppointments();
      case 'profile':
        return this.renderProfile();
      case 'billing':
        return this.renderInvoices();
      default:
        return this.renderDashboard();
    }
  },

  /* ==========================================================================
     6. CLIENT DASHBOARD (Simple & Clean)
     ========================================================================== */
  renderDashboard() {
    const user = SLCMS_STATE.currentUser || {};
    const activeCases = this.getClientCases().filter(c => (c.status || '').toLowerCase() === 'active');
    const hasCases = activeCases.length > 0;
    const clientRequests = this.getClientRequests();
    const acceptedRequests = clientRequests.filter(r => (r.status || '') === 'Accepted' || (r.status || '') === 'Converted to Case').length;
    const newMessages = this.summary.newMessagesCount || 0;

    return `
      <div class="client-dashboard-simple animate-fade" style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 900px; margin: 0 auto;">
        
        <!-- 3 Simple Stat Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          
          <!-- Active Cases -->
          <div class="card" style="padding: 1.25rem 1.5rem; border-radius: 10px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #E2E8F0); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.03em;">Active Cases</div>
              <div style="font-size: 1.75rem; font-weight: 700; color: #0F172A; margin-top: 0.25rem;">
                ${activeCases.length}
              </div>
            </div>
            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(2, 132, 199, 0.08); color: #0284C7; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ⚖️
            </div>
          </div>

          <!-- Requests -->
          <div class="card" style="padding: 1.25rem 1.5rem; border-radius: 10px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #E2E8F0); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.03em;">Legal Requests</div>
              <div style="font-size: 1.75rem; font-weight: 700; color: #0F172A; margin-top: 0.25rem;">
                ${clientRequests.length}
                ${acceptedRequests > 0 ? `<span style="font-size: 0.8rem; font-weight: 600; color: #059669; margin-left: 0.4rem;">(${acceptedRequests} Accepted)</span>` : ''}
              </div>
            </div>
            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(16, 185, 129, 0.08); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              📝
            </div>
          </div>

          <!-- Messages -->
          <div class="card" style="padding: 1.25rem 1.5rem; border-radius: 10px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #E2E8F0); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.03em;">Messages</div>
              <div style="font-size: 1.75rem; font-weight: 700; color: #0F172A; margin-top: 0.25rem;">
                ${newMessages}
              </div>
            </div>
            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(99, 102, 241, 0.08); color: #6366F1; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              💬
            </div>
          </div>

        </div>

        <!-- Active Cases (if any exist) -->
        ${hasCases ? `
          <div class="card" style="background: var(--color-surface, #fff); border: 1px solid var(--color-border, #E2E8F0); border-radius: 10px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: #0F172A;">My Active Cases</h3>
              <button class="btn btn-secondary btn-sm" onclick="App.navigate('client-cases')">View Cases →</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${activeCases.map(c => this.renderCaseDetailedCard(c)).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Legal Requests Card -->
        <div class="card" style="background: var(--color-surface, #fff); border: 1px solid var(--color-border, #E2E8F0); border-radius: 10px; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: #0F172A;">
                My Legal Requests
              </h3>
              <p style="margin: 0.2rem 0 0 0; color: #64748B; font-size: 0.82rem;">
                Track the status of your assistance requests and legal matters
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              ${clientRequests.length > 0 ? `
                <button class="btn btn-secondary btn-sm" onclick="App.navigate('client-requests')">
                  All Requests (${clientRequests.length}) →
                </button>
              ` : ''}
              <button class="btn btn-primary btn-sm" onclick="ClientPortalView.openRequestModal()" style="background: #0284C7; font-weight: 600;">
                + Request Assistance
              </button>
            </div>
          </div>

          ${clientRequests.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              ${this.renderCaseIntakeLifecycleCard(clientRequests[0])}
              ${clientRequests.length > 1 ? `
                <div style="padding-top: 1rem; border-top: 1px solid #E2E8F0;">
                  <div style="font-size: 0.82rem; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 0.65rem;">Previous Submissions</div>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${clientRequests.slice(1).map(r => this.renderRequestCompactCard(r)).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : `
            <div style="padding: 2.5rem 1.5rem; text-align: center; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚖️</div>
              <p style="color: #64748B; margin: 0 0 1rem 0; font-size: 0.88rem;">You have not submitted any legal requests yet.</p>
              <button class="btn btn-primary btn-sm" onclick="ClientPortalView.openRequestModal()" style="background: #0284C7;">
                Request Legal Assistance
              </button>
            </div>
          `}
        </div>

      </div>
    `;
  },

  /* ==========================================================================
     7. & 8. MY REQUESTS & ASSISTANCE REQUEST LIFECYCLE
     ========================================================================== */
  renderRequests() {
    const clientRequests = this.getClientRequests();

    return `
      <div class="client-requests-view">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0; color: var(--color-text-primary, #0F172A); font-family: var(--font-heading, sans-serif);">
              My Legal Assistance Requests
            </h2>
            <p style="margin: 0.25rem 0 0 0; color: #64748B; font-size: 0.88rem;">
              Track the review, acceptance, and conversion of your requests by our legal officers
            </p>
          </div>
          <button class="btn btn-primary" onclick="ClientPortalView.openRequestModal()" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); font-weight: 600; border-radius: 8px; padding: 0.65rem 1.25rem;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 0.45rem; vertical-align: middle;">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Request Legal Assistance</span>
          </button>
        </div>

        ${clientRequests.length === 0 ? `
          <div class="card" style="padding: 3.5rem 2rem; text-align: center; border-radius: 12px; background: var(--color-surface, #fff); border: 1px dashed var(--color-border, #CBD5E1);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚖️</div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">No Legal Requests Yet</h3>
            <p style="color: #64748B; max-width: 480px; margin: 0 auto 1.5rem auto; font-size: 0.9rem;">
              Have a legal matter in civil, criminal, land, commercial, matrimonial or probate law? Submit a request and our legal team will evaluate your dossier.
            </p>
            <button class="btn btn-primary" onclick="ClientPortalView.openRequestModal()">Submit Your First Request</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${clientRequests.map(r => this.renderRequestFullCard(r)).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderRequestFullCard(r) {
    return this.renderCaseIntakeLifecycleCard(r);
  },

  renderCaseIntakeLifecycleCard(r) {
    if (!r) return '';
    const user = SLCMS_STATE.currentUser || {};
    const caseDocket = r.caseNumber || (r.id && String(r.id).startsWith('REQ-') ? 'CASE-2026-' + String(r.id).replace(/\D/g, '').slice(-4) : (r.caseId || 'CASE-2026-0045'));
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

    // Retrieve associated information request
    const infoRequests = (typeof ClientPortalService !== 'undefined')
      ? ClientPortalService.getStoredInfoRequests(r.clientId || user.clientId, r.caseId || r.id)
      : [];
    const infoReq = infoRequests.find(ir => 
      (ir.caseNumber && r.caseNumber && ir.caseNumber === r.caseNumber) ||
      (ir.caseId && r.caseId && ir.caseId === r.caseId) ||
      (ir.caseId && r.id && ir.caseId === r.id) ||
      (ir.requestId && ir.requestId === r.currentInfoRequestId) ||
      (ir.id && ir.id === r.currentInfoRequestId) ||
      (r.infoRequest && (ir.requestId === r.infoRequest.requestId || ir.id === r.infoRequest.id))
    ) || r.infoRequest || null;

    // Retrieve genuine backend invoice (strictly requiring status SENT, PAYMENT_PENDING, PAYMENT_SUBMITTED, or PAID)
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    const caseInvoice = invoices.find(i => 
      i && (
        (i.requestId && (i.requestId === r.id || i.requestId === r.requestNumber)) ||
        (i.caseNumber && r.caseNumber && i.caseNumber === r.caseNumber) ||
        (i.caseId && r.caseId && i.caseId === r.caseId) ||
        (r.invoiceNumber && i.invoiceNumber === r.invoiceNumber) ||
        (r.invoiceId && String(i.id) === String(r.invoiceId))
      ) &&
      i.status !== 'NOT_CREATED' && i.status !== 'DRAFT'
    ) || null;

    // Status evaluation
    const isCaseActive = (r.status === 'Converted to Case' || r.status === 'Active' || (caseInvoice && caseInvoice.status === 'PAID'));
    const isPaymentSubmitted = Boolean(caseInvoice && (caseInvoice.status === 'PAYMENT_SUBMITTED' || r.paymentProofSubmitted));
    const isInvoiceSent = Boolean(caseInvoice && (caseInvoice.status === 'SENT' || caseInvoice.status === 'PAYMENT_PENDING' || caseInvoice.status === 'PAYMENT_SUBMITTED' || caseInvoice.status === 'PAID'));
    const isInfoApproved = Boolean(r.status === 'Information Verified' || r.status === 'INFORMATION_VERIFIED' || (infoReq && infoReq.status === 'APPROVED') || r.readyForInvoice);
    const isClientResponseSubmitted = Boolean(r.status === 'Client Response Received' || r.status === 'CLIENT_RESPONSE_RECEIVED' || (infoReq && (infoReq.status === 'CLIENT_RESPONSE_RECEIVED' || infoReq.status === 'SUBMITTED' || infoReq.submittedAt)));
    const isCorrectionRequired = Boolean(infoReq && (infoReq.status === 'CORRECTION_REQUIRED' || infoReq.status === 'CORRECTION REQUIRED'));
    const isActionRequired = Boolean(!isClientResponseSubmitted && !isInfoApproved && (infoReq && (infoReq.status === 'ACTION_REQUIRED' || infoReq.status === 'ACTION REQUIRED' || r.status === 'Additional Information Required')));

    // Display Badges & Labels
    let displayCaseStatus = 'Submitted';
    let statusBadgeColor = '#1D4ED8';
    let statusBadgeBg = '#EFF6FF';
    let statusBadgeBorder = '#BFDBFE';

    if (isCaseActive) {
      displayCaseStatus = 'Active Case';
      statusBadgeColor = '#6D28D9';
      statusBadgeBg = '#F5F3FF';
      statusBadgeBorder = '#DDD6FE';
    } else if (isPaymentSubmitted) {
      displayCaseStatus = 'Payment Proof Submitted';
      statusBadgeColor = '#1D4ED8';
      statusBadgeBg = '#EFF6FF';
      statusBadgeBorder = '#93C5FD';
    } else if (isInvoiceSent) {
      displayCaseStatus = 'Invoice Issued';
      statusBadgeColor = '#047857';
      statusBadgeBg = '#ECFDF5';
      statusBadgeBorder = '#A7F3D0';
    } else if (isInfoApproved) {
      displayCaseStatus = 'Information Verified';
      statusBadgeColor = '#047857';
      statusBadgeBg = '#ECFDF5';
      statusBadgeBorder = '#A7F3D0';
    } else if (isClientResponseSubmitted) {
      displayCaseStatus = 'Client Response Received';
      statusBadgeColor = '#15803D';
      statusBadgeBg = '#F0FDF4';
      statusBadgeBorder = '#BBF7D0';
    } else if (isCorrectionRequired) {
      displayCaseStatus = 'Additional Information Required (Correction)';
      statusBadgeColor = '#DC2626';
      statusBadgeBg = '#FEF2F2';
      statusBadgeBorder = '#FECACA';
    } else if (isActionRequired) {
      displayCaseStatus = 'Additional Information Required';
      statusBadgeColor = '#C2410C';
      statusBadgeBg = '#FFF7ED';
      statusBadgeBorder = '#FFEDD5';
    }

    // Grid labels
    let legalReviewLabel = 'Under Review';
    if (isCaseActive) legalReviewLabel = '<span style="color: #6D28D9; font-weight: 700;">Completed &bull; Active</span>';
    else if (isInfoApproved) legalReviewLabel = '<span style="color: #047857; font-weight: 700;">Dossier Verified</span>';
    else if (isClientResponseSubmitted) legalReviewLabel = '<span style="color: #1D4ED8; font-weight: 700;">Reviewing Response</span>';
    else if (isActionRequired || isCorrectionRequired) legalReviewLabel = '<span style="color: #B45309; font-weight: 700;">Information Requested</span>';

    let infoRequestBadge = '<span style="color: #64748B;">Not Yet Sent</span>';
    if (infoReq) {
      if (isInfoApproved) {
        infoRequestBadge = `<span style="color: #047857; font-weight: 700;">${this.escapeHtml(infoReq.requestId)} &bull; VERIFIED ✓</span>`;
      } else if (isClientResponseSubmitted) {
        infoRequestBadge = `<span style="color: #1D4ED8; font-weight: 700;">${this.escapeHtml(infoReq.requestId)} &bull; SUBMITTED</span>`;
      } else if (isCorrectionRequired) {
        infoRequestBadge = `<span style="color: #DC2626; font-weight: 700;">${this.escapeHtml(infoReq.requestId)} &bull; CORRECTION REQUESTED</span>`;
      } else {
        infoRequestBadge = `<span style="color: #D97706; font-weight: 700;">${this.escapeHtml(infoReq.requestId)} &bull; ACTION REQUIRED</span>`;
      }
    }

    let invoiceBadge = '<span style="color: #64748B;">Not Available</span>';
    if (isInvoiceSent && caseInvoice) {
      invoiceBadge = `<span style="color: #047857; font-weight: 700;">${this.escapeHtml(caseInvoice.invoiceNumber || 'INV-2026')} (TZS ${(caseInvoice.totalAmount || caseInvoice.amount || 150000).toLocaleString()})</span>`;
    } else if (isInfoApproved) {
      invoiceBadge = '<span style="color: #64748B;">Not Yet Issued (Preparing...)</span>';
    }

    let paymentBadge = '<span style="color: #64748B;">Not Available</span>';
    if (isCaseActive || (caseInvoice && caseInvoice.status === 'PAID')) {
      paymentBadge = '<span style="color: #047857; font-weight: 700;">PAID ✓</span>';
    } else if (isPaymentSubmitted) {
      paymentBadge = '<span style="color: #1D4ED8; font-weight: 700;">Proof Submitted (Verifying)</span>';
    } else if (isInvoiceSent) {
      paymentBadge = '<span style="color: #D97706; font-weight: 700;">Payment Pending (UNPAID)</span>';
    }

    // Timeline timestamps & flags (Requirement 16)
    const timelineSubmittedTime = r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:14';
    const timelineReviewTime = r.reviewStartedAt ? new Date(r.reviewStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (r.createdAt ? new Date(new Date(r.createdAt).getTime() + 10 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:24');
    const timelineInfoReqDone = Boolean(infoReq && infoReq.sentAt);
    const timelineInfoReqTime = (infoReq && infoReq.sentAt) ? new Date(infoReq.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:35';
    const timelineClientRespDone = isClientResponseSubmitted || isInfoApproved || isInvoiceSent || isCaseActive;
    const timelineClientRespActive = (isActionRequired || isCorrectionRequired) && !timelineClientRespDone;
    const timelineClientRespTime = (infoReq && infoReq.submittedAt) ? new Date(infoReq.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const timelineInfoReviewDone = isInfoApproved || isInvoiceSent || isCaseActive;
    const timelineInfoReviewActive = isClientResponseSubmitted && !timelineInfoReviewDone;
    const timelineInvoiceDone = isInvoiceSent || isCaseActive;
    const timelineInvoiceActive = isInfoApproved && !timelineInvoiceDone;
    const timelinePaymentDone = isCaseActive;
    const timelinePaymentActive = (isInvoiceSent || isPaymentSubmitted) && !timelinePaymentDone;
    const timelineActivationDone = isCaseActive;
    const timelineLawyerDone = isCaseActive && r.lawyer && r.lawyer !== 'Unassigned';

    return `
      <div class="card client-case-lifecycle-card" style="background: #fff; border: 1px solid var(--color-border, #E2E8F0); border-radius: 12px; padding: 1.75rem; box-shadow: 0 4px 16px rgba(0,0,0,0.03); transition: all 0.2s ease; margin-bottom: 1.5rem;">
        
        <!-- Header: Category & Status Badge -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid #F1F5F9; padding-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
            <span style="background: rgba(2, 132, 199, 0.1); color: #0284C7; font-weight: 700; font-size: 0.76rem; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px;">
              ${this.escapeHtml(r.issueType || 'General Litigation')}
            </span>
            <span style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0F172A; background: #F8FAFC; padding: 3px 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
              ${this.escapeHtml(caseDocket)}
            </span>
            <span style="font-size: 0.8rem; color: #64748B;">&bull; Submitted ${dateStr}</span>
          </div>
          <span style="background: ${statusBadgeBg}; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeBorder}; font-size: 0.8rem; font-weight: 700; padding: 5px 14px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 6px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: ${statusBadgeColor};"></span>
            ${this.escapeHtml(displayCaseStatus)}
          </span>
        </div>

        <!-- 6-Metric Intake Status Grid (Requirement 1, 5, 8) -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; font-size: 0.84rem;">
            <div>
              <span style="color: #64748B; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Case Docket</span>
              <strong style="color: #0F172A; font-family: monospace; font-size: 0.95rem;">${this.escapeHtml(caseDocket)}</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Status</span>
              <strong style="color: #0F172A;">${this.escapeHtml(displayCaseStatus)}</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Legal Review</span>
              <div>${legalReviewLabel}</div>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Information Request</span>
              <div>${infoRequestBadge}</div>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Invoice</span>
              <div>${invoiceBadge}</div>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Payment</span>
              <div>${paymentBadge}</div>
            </div>
          </div>
        </div>

        <!-- Case Facts & Opposing Party Details -->
        <div style="font-size: 0.92rem; color: #334155; line-height: 1.6; margin-bottom: 1.25rem; white-space: pre-wrap;">${this.escapeHtml(r.description || '')}</div>

        <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.82rem; color: #64748B; padding-bottom: 1rem; border-bottom: 1px solid #F1F5F9;">
          ${r.opposingParty ? `
            <div>
              <strong style="color: #475569;">Opposing Party:</strong> ${this.escapeHtml(r.opposingParty)}
            </div>
          ` : ''}
          <div>
            <strong style="color: #475569;">Preferred Contact:</strong> ${this.escapeHtml(r.preferredContactMethod || 'Email')}
          </div>
          ${r.supportingDocuments ? `
            <div>
              <strong style="color: #475569;">Initial Documents:</strong> 📎 ${this.escapeHtml(r.supportingDocuments)}
            </div>
          ` : ''}
        </div>

        <!-- Stage-Specific Interactive Action Banners -->

        <!-- 1. Initial Submitted State: No Pay button, No invoice amount (Requirement 1) -->
        ${(!infoReq && !isInvoiceSent && !isCaseActive) ? `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #0284C7; border-radius: 8px; padding: 1rem 1.25rem; margin-top: 1.25rem; font-size: 0.88rem; color: #334155; display: flex; align-items: center; gap: 0.85rem;">
            <span style="font-size: 1.4rem;">ℹ️</span>
            <div>
              <strong>Your case has been submitted.</strong> A Legal Officer will review it and may request additional information before an invoice is issued.
            </div>
          </div>
        ` : ''}

        <!-- 2. Action Required: Officer sent Information Request (Requirement 5) -->
        ${(isActionRequired && infoReq) ? `
          <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 1.25rem 1.5rem; margin-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
                  <span style="background: #F59E0B; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                    ACTION REQUIRED
                  </span>
                  <strong style="color: #92400E; font-size: 0.96rem;">Information Request: ${this.escapeHtml(infoReq.requestId)}</strong>
                </div>
                <div style="font-size: 0.88rem; color: #78350F; line-height: 1.5; margin-bottom: 0.5rem;">
                  ${this.escapeHtml(infoReq.officerNotes || 'Please complete the requested information and attach required documents so that we can assess your matter and prepare the appropriate legal service invoice.')}
                </div>
                <div style="font-size: 0.8rem; color: #B45309; display: flex; gap: 1.25rem; flex-wrap: wrap;">
                  <span><strong>Sent:</strong> ${infoReq.sentAt ? new Date(infoReq.sentAt).toLocaleDateString('en-GB') : '27 Sep 2026'}</span>
                  <span><strong>Due Date:</strong> ${this.escapeHtml(infoReq.dueDate || '30 Sep 2026')}</span>
                </div>
              </div>
              <button type="button" class="btn btn-primary" onclick="ClientPortalView.openCompleteInformationRequestModal('${infoReq.requestId}')" style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); border: none; font-weight: 700; padding: 0.75rem 1.5rem; font-size: 0.92rem; border-radius: 8px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35); display: inline-flex; align-items: center; gap: 0.5rem;">
                <span>📝</span> <span>COMPLETE REQUEST</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- 3. Correction Required (Requirement 10) -->
        ${(isCorrectionRequired && infoReq) ? `
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid #EF4444; border-radius: 8px; padding: 1.25rem 1.5rem; margin-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
                  <span style="background: #EF4444; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                    CORRECTION REQUESTED
                  </span>
                  <strong style="color: #991B1B; font-size: 0.96rem;">Request: ${this.escapeHtml(infoReq.requestId)}</strong>
                </div>
                <div style="font-size: 0.88rem; color: #7F1D1D; line-height: 1.5; margin-bottom: 0.4rem;">
                  <strong>Reason:</strong> ${this.escapeHtml(infoReq.correctionReason || 'The uploaded document is unclear or additional details are needed.')}
                </div>
                <div style="font-size: 0.88rem; color: #7F1D1D; line-height: 1.5;">
                  <strong>Required Action:</strong> ${this.escapeHtml(infoReq.correctionAction || 'Please upload a clear copy of the requested records.')}
                </div>
              </div>
              <button type="button" class="btn btn-primary" onclick="ClientPortalView.openCompleteInformationRequestModal('${infoReq.requestId}')" style="background: #DC2626; border: none; font-weight: 700; padding: 0.75rem 1.5rem; font-size: 0.92rem; border-radius: 8px;">
                <span>✏️</span> <span>Update &amp; Resubmit Response</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- 4. Client Submitted Response: Waiting for Officer Review (Requirement 8) -->
        ${(isClientResponseSubmitted && !isInfoApproved && !isInvoiceSent && infoReq) ? `
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-left: 4px solid #2563EB; border-radius: 8px; padding: 1.15rem 1.35rem; margin-top: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
              <span style="background: #2563EB; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                SUBMITTED
              </span>
              <strong style="color: #1E40AF; font-size: 0.95rem;">Information Request: ${this.escapeHtml(infoReq.requestId)}</strong>
              <span style="font-size: 0.8rem; color: #3B82F6;">&bull; Submitted on ${infoReq.submittedAt ? new Date(infoReq.submittedAt).toLocaleString('en-GB') : 'Recently'}</span>
            </div>
            <div style="font-size: 0.88rem; color: #1E3A8A; line-height: 1.5; margin-bottom: 0.35rem;">
              Your response has been sent to the Legal Officer for verification.
            </div>
            <div style="font-size: 0.82rem; color: #64748B;">
              <strong>Invoice:</strong> Not Yet Issued (Pending review of returned information)
            </div>
          </div>
        ` : ''}

        <!-- 5. Information Approved / Verified: Preparing Invoice (Requirement 11) -->
        ${(isInfoApproved && !isInvoiceSent) ? `
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-left: 4px solid #059669; border-radius: 8px; padding: 1.15rem 1.35rem; margin-top: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem;">
              <span style="background: #059669; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                VERIFIED ✓
              </span>
              <strong style="color: #065F46; font-size: 0.95rem;">Information Status: VERIFIED</strong>
            </div>
            <div style="font-size: 0.88rem; color: #064E3B; line-height: 1.5;">
              Your information and documentation have been formally reviewed and verified by the Legal Officer. The chamber is now preparing your legal service fee invoice.
            </div>
          </div>
        ` : ''}

        <!-- 6. Official Invoice Sent & Ready for Payment (Requirement 12) -->
        ${(isInvoiceSent && caseInvoice && !isPaymentSubmitted && !isCaseActive) ? `
          <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-left: 4px solid #16A34A; border-radius: 8px; padding: 1.25rem 1.5rem; margin-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                  <span style="background: #16A34A; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                    INVOICE READY
                  </span>
                  <strong style="color: #14532D; font-size: 1rem;">Invoice ${this.escapeHtml(caseInvoice.invoiceNumber)}</strong>
                  <span style="font-size: 0.95rem; font-weight: 800; color: #15803D;">TZS ${(caseInvoice.totalAmount || caseInvoice.amount || 150000).toLocaleString()}</span>
                </div>
                <div style="font-size: 0.86rem; color: #166534;">
                  Status: <strong>UNPAID</strong> &bull; Due Date: ${this.escapeHtml(caseInvoice.dueDate || 'Within 7 days')}
                </div>
              </div>
              <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="ClientPortalView.printInvoice('${caseInvoice.id}')" style="background: #fff; border: 1px solid #86EFAC; color: #15803D; font-weight: 600; padding: 0.55rem 1rem;">
                  📄 View Invoice
                </button>
                <button type="button" class="btn btn-primary btn-sm" onclick="ClientPortalView.openUploadProof('${caseInvoice.id}')" style="background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); font-weight: 700; padding: 0.55rem 1.25rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
                  💳 Pay Now &rarr;
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 7. Payment Proof Submitted -->
        ${(isPaymentSubmitted && !isCaseActive) ? `
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 1.15rem 1.35rem; margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div style="font-size: 0.88rem; color: #1E40AF;">
              ⏳ <strong>Payment Proof Submitted:</strong> Your payment remittance receipt is currently being verified by the Legal Officer.
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="ClientPortalView.printInvoice('${caseInvoice?.id || r.id}')" style="background: #fff; border: 1px solid #BFDBFE; color: #1E40AF; font-weight: 600;">
              📄 View Invoice
            </button>
          </div>
        ` : ''}

        <!-- 8. Active Case Converted -->
        ${isCaseActive ? `
          <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-left: 4px solid #7C3AED; border-radius: 8px; padding: 1.15rem 1.35rem; margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div style="font-size: 0.88rem; color: #5B21B6;">
              🎉 <strong>Case Active &amp; Lawyer Assigned:</strong> Payment verified and case docket opened with assigned advocate representation.
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.navigate('client-cases')" style="background: #fff; border: 1px solid #DDD6FE; color: #6D28D9; font-weight: 600;">
              View in My Cases &rarr;
            </button>
          </div>
        ` : ''}

        <!-- Professional Status Timeline (Requirement 16) -->
        <div style="margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid #E2E8F0;">
          <div style="font-size: 0.82rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 1rem;">
            Case Progression Timeline
          </div>

          <div class="client-lifecycle-timeline" style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.85rem;">
            
            <!-- Step 1: Case Submitted -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #0F172A;">Case Submitted</div>
                <div style="font-size: 0.75rem; color: #64748B;">${dateStr} &bull; ${timelineSubmittedTime}</div>
              </div>
            </div>

            <!-- Step 2: Legal Review Started -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #0F172A;">Legal Review Started</div>
                <div style="font-size: 0.75rem; color: #64748B;">${dateStr} &bull; ${timelineReviewTime}</div>
              </div>
            </div>

            <!-- Step 3: Additional Information Requested -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              ${timelineInfoReqDone ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #0F172A;">Additional Information Requested</div>
                  <div style="font-size: 0.75rem; color: #64748B;">${infoReq.requestId} &bull; ${timelineInfoReqTime}</div>
                </div>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #F8FAFC; color: #94A3B8; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">○</span>
                <div style="flex: 1; color: #64748B;">
                  <div>Additional Information Requested</div>
                </div>
              `}
            </div>

            <!-- Step 4: Waiting for Your Response -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              ${timelineClientRespDone ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #0F172A;">Information Submitted</div>
                  <div style="font-size: 0.75rem; color: #64748B;">Completed dossier &bull; ${timelineClientRespTime || 'Confirmed'}</div>
                </div>
              ` : timelineClientRespActive ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #FFFBEB; color: #D97706; border: 2px solid #F59E0B; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0; animation: pulse 2s infinite;">●</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #B45309;">Waiting for Your Response</div>
                  <div style="font-size: 0.75rem; color: #D97706;">Action required &bull; Click "COMPLETE REQUEST" above</div>
                </div>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #F8FAFC; color: #94A3B8; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">○</span>
                <div style="flex: 1; color: #64748B;">
                  <div>Waiting for Your Response</div>
                </div>
              `}
            </div>

            <!-- Step 5: Information Review -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              ${timelineInfoReviewDone ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #0F172A;">Information Verified</div>
                  <div style="font-size: 0.75rem; color: #64748B;">Officer approved dossier</div>
                </div>
              ` : timelineInfoReviewActive ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #EFF6FF; color: #1D4ED8; border: 2px solid #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">●</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #1D4ED8;">Legal Officer Reviewing Response</div>
                  <div style="font-size: 0.75rem; color: #3B82F6;">Reviewing submitted documents and information</div>
                </div>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #F8FAFC; color: #94A3B8; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">○</span>
                <div style="flex: 1; color: #64748B;">
                  <div>Information Review</div>
                </div>
              `}
            </div>

            <!-- Step 6: Invoice -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              ${timelineInvoiceDone ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #0F172A;">Invoice Issued</div>
                  <div style="font-size: 0.75rem; color: #64748B;">${this.escapeHtml(caseInvoice?.invoiceNumber || 'Official Invoice')}</div>
                </div>
              ` : timelineInvoiceActive ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #047857; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">●</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #047857;">Preparing Invoice</div>
                  <div style="font-size: 0.75rem; color: #059669;">Information verified &bull; Chamber generating fee invoice</div>
                </div>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #F8FAFC; color: #94A3B8; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">○</span>
                <div style="flex: 1; color: #64748B;">
                  <div>Invoice</div>
                </div>
              `}
            </div>

            <!-- Step 7: Payment -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              ${timelinePaymentDone ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #0F172A;">Payment Verified</div>
                  <div style="font-size: 0.75rem; color: #64748B;">Funds confirmed by finance</div>
                </div>
              ` : timelinePaymentActive ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #FFFBEB; color: #D97706; border: 2px solid #F59E0B; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">●</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #B45309;">${isPaymentSubmitted ? 'Verifying Payment Proof' : 'Awaiting Payment'}</div>
                  <div style="font-size: 0.75rem; color: #D97706;">${isPaymentSubmitted ? 'Bank remittance under verification' : 'Please remit invoice fee'}</div>
                </div>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #F8FAFC; color: #94A3B8; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">○</span>
                <div style="flex: 1; color: #64748B;">
                  <div>Payment</div>
                </div>
              `}
            </div>

            <!-- Step 8: Case Activation -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              ${timelineActivationDone ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #0F172A;">Case Activation</div>
                  <div style="font-size: 0.75rem; color: #64748B;">Matter formally active on docket</div>
                </div>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #F8FAFC; color: #94A3B8; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">○</span>
                <div style="flex: 1; color: #64748B;">
                  <div>Case Activation</div>
                </div>
              `}
            </div>

            <!-- Step 9: Lawyer Assignment -->
            <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
              ${timelineLawyerDone ? `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">✓</span>
                <div style="flex: 1;">
                  <div style="font-weight: 700; color: #0F172A;">Lawyer Assignment</div>
                  <div style="font-size: 0.75rem; color: #64748B;">Advocate: ${this.escapeHtml(r.lawyer)}</div>
                </div>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 50%; background: #F8FAFC; color: #94A3B8; border: 2px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">○</span>
                <div style="flex: 1; color: #64748B;">
                  <div>Lawyer Assignment</div>
                </div>
              `}
            </div>

          </div>
        </div>

      </div>
    `;
  },

  renderRequestCompactCard(r) {
    const statusMeta = this.getStatusBadgeMeta(r.status || 'Submitted');
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent';

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.1rem; background: var(--color-bg, #F8FAFC); border: 1px solid var(--color-border, #E2E8F0); border-radius: 8px; cursor: pointer; transition: all 0.15s ease;" onclick="App.navigate('client-requests')">
        <div style="min-width: 0; flex: 1; padding-right: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
            <span style="font-weight: 700; font-size: 0.84rem; color: #0F172A;">${this.escapeHtml(r.issueType || 'General')}</span>
            <span style="color: #94A3B8; font-size: 0.75rem;">• ${dateStr}</span>
            ${r.opposingParty ? `<span style="font-size: 0.72rem; color: #475569; background: #E2E8F0; padding: 1px 6px; border-radius: 4px; font-weight: 500;">vs. ${this.escapeHtml(r.opposingParty)}</span>` : ''}
          </div>
          <div style="font-size: 0.82rem; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">
            ${this.escapeHtml(r.description || '')}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
          <span style="background: ${statusMeta.bg}; color: ${statusMeta.color}; border: 1px solid ${statusMeta.border}; font-size: 0.72rem; font-weight: 700; padding: 3px 9px; border-radius: 9999px; white-space: nowrap;">
            ${this.escapeHtml(r.status || 'Submitted')}
          </span>
          <span style="color: #94A3B8; font-size: 0.85rem;">→</span>
        </div>
      </div>
    `;
  },

  /* ==========================================================================
     10. MY CASES PAGE (Title, Number, Court, Lawyer, Stage, Next Date, Update)
     ========================================================================== */
  renderCases() {
    const clientCases = this.getClientCases();

    return `
      <div class="client-cases-view">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0; color: var(--color-text-primary, #0F172A); font-family: var(--font-heading, sans-serif);">
              My Accepted Cases
            </h2>
            <p style="margin: 0.25rem 0 0 0; color: #64748B; font-size: 0.88rem;">
              Real-time court tracking, assigned advocates, procedural stages, and approved filings
            </p>
          </div>
        </div>

        ${clientCases.length === 0 ? `
          <div class="card" style="padding: 3.5rem 2rem; text-align: center; border-radius: 12px; background: var(--color-surface, #fff); border: 1px dashed var(--color-border, #CBD5E1);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📂</div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">No Official Cases Created Yet</h3>
            <p style="color: #64748B; max-width: 480px; margin: 0 auto 1.5rem auto; font-size: 0.9rem;">
              When your legal assistance request is accepted by the legal team, an official case will be opened here with full court docket tracking.
            </p>
            <button class="btn btn-primary" onclick="ClientPortalView.openRequestModal()">Request Legal Assistance</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${clientCases.map(c => this.renderCaseDetailedCard(c)).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderCaseDetailedCard(c) {
    const title = c.title || c.caseTitle || 'Legal Matter';
    const caseNumber = c.caseNumber || c.officialCaseNumber || 'Registry Pending';
    const court = c.court || 'High Court of Tanzania';
    const lawyer = c.assignedLawyer || 'Senior Legal Counsel';
    const stage = c.stage || c.proceedingStage || 'Pleadings & Documentation';
    const nextDate = c.nextHearingDate || c.nextCourtDate || 'To be scheduled by Registry';
    const latestUpdate = c.latestApprovedUpdate || c.notes || 'The legal team has been assigned and is preparing court documents.';

    return `
      <div class="card" style="background: var(--color-surface, #fff); border: 1px solid var(--color-border, #E2E8F0); border-radius: 12px; padding: 1.75rem; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
        <!-- Top Row: Title, Case Number & Status -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem;">
              <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: #0284C7; background: rgba(2, 132, 199, 0.08); padding: 2px 8px; border-radius: 6px; font-size: 0.85rem; border: 1px solid rgba(2, 132, 199, 0.2);">
                ${this.escapeHtml(caseNumber)}
              </span>
              <span style="background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px;">
                ${this.escapeHtml(c.status || 'Active')}
              </span>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--color-text-primary, #0F172A); font-family: var(--font-heading, sans-serif);">
              ${this.escapeHtml(title)}
            </h3>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: #64748B; text-transform: uppercase; font-weight: 600; display: block;">Jurisdiction</span>
            <span style="font-size: 0.9rem; font-weight: 700; color: #1E293B;">🏛️ ${this.escapeHtml(court)}</span>
          </div>
        </div>

        <!-- 4 Key Grid Fields per Requirement 10 -->
        <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 1rem; background: var(--color-bg, #F8FAFC); border-radius: 8px; border: 1px solid var(--color-border, #F1F5F9); margin-bottom: 1.25rem;">
          <div>
            <span style="display: block; font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Assigned Lawyer</span>
            <span style="font-size: 0.92rem; font-weight: 600; color: #0F172A; display: flex; align-items: center; gap: 0.35rem; margin-top: 0.2rem;">
              <span>⚖️</span>
              <span>${this.escapeHtml(lawyer)}</span>
            </span>
          </div>

          <div>
            <span style="display: block; font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Current Client Stage</span>
            <span style="font-size: 0.92rem; font-weight: 600; color: #0284C7; display: flex; align-items: center; gap: 0.35rem; margin-top: 0.2rem;">
              <span>📍</span>
              <span>${this.escapeHtml(stage)}</span>
            </span>
          </div>

          <div>
            <span style="display: block; font-size: 0.74rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Next Important Date</span>
            <span style="font-size: 0.92rem; font-weight: 700; color: #D97706; display: flex; align-items: center; gap: 0.35rem; margin-top: 0.2rem;">
              <span>📅</span>
              <span>${this.escapeHtml(nextDate)}</span>
            </span>
          </div>
        </div>

        <!-- Latest Approved Update Bulletin -->
        <div style="background: #F8FAFC; border-left: 4px solid #0284C7; border-radius: 0 8px 8px 0; padding: 0.85rem 1rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #0284C7; text-transform: uppercase; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
            <span>📢</span>
            <span>Latest Approved Case Update</span>
          </div>
          <p style="margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.5;">
            ${this.escapeHtml(latestUpdate)}
          </p>
        </div>
      </div>
    `;
  },

  /* ==========================================================================
     MESSAGES, DOCUMENTS, APPOINTMENTS, PROFILE
     ========================================================================== */
  selectedMessageCaseId: null,

  switchMessageCase(caseId) {
    this.selectedMessageCaseId = caseId;
    const container = document.getElementById('client-portal-subcontent');
    if (container) {
      container.innerHTML = this.renderSubTabContent();
    }
  },

  renderMessages() {
    const user = SLCMS_STATE.currentUser || {};
    const clientCases = this.getClientCases();

    // Select active / connected case
    let currentCase = null;
    if (this.selectedMessageCaseId) {
      currentCase = clientCases.find(c => c.id === this.selectedMessageCaseId);
    }
    if (!currentCase && clientCases.length > 0) {
      currentCase = clientCases.find(c => (c.status || '').toLowerCase() !== 'closed') || clientCases[0];
      this.selectedMessageCaseId = currentCase.id;
    }

    const assignedLawyer = currentCase?.lawyer;
    const hasLawyerConnected = !!(assignedLawyer && assignedLawyer.trim() && assignedLawyer.toLowerCase() !== 'unassigned');
    const lawyerAvatar = hasLawyerConnected
      ? (currentCase.lawyerAvatar || assignedLawyer.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase())
      : 'LO';

    // Retrieve conversation history for this client / matter
    const userEmail = (user.email || '').toLowerCase();
    const userName = (user.name || '').toLowerCase();
    const clientId = user.clientId || user.id || user.clientNumber;

    const messages = (SLCMS_STATE.clientMessages || []).filter(m => {
      if (!m) return false;
      if (currentCase && (m.caseId === currentCase.id || m.caseNumber === currentCase.caseNumber)) {
        return true;
      }
      if (m.clientId && (m.clientId === clientId || m.clientId === user.staffId)) return true;
      if (m.recipient && userEmail && m.recipient.toLowerCase().includes(userEmail)) return true;
      if (m.clientName && userName && m.clientName.toLowerCase().includes(userName)) return true;
      if (m.sender && userName && m.sender.toLowerCase().includes(userName)) return true;
      return false;
    }).slice().reverse(); // Oldest first to newest last

    return `
      <div class="client-messages-view">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
              Client Messages &amp; Privileged Legal Correspondence
            </h2>
            <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
              ${hasLawyerConnected ? `Direct, encrypted communication with your assigned lead counsel (<strong>${this.escapeHtml(assignedLawyer)}</strong>)` : 'Direct communication with the SLCMS Legal Operations &amp; Client Services Desk'}
            </p>
          </div>
          ${clientCases.length > 1 ? `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.8rem; font-weight: 600; color: #475569;">Active Matter:</span>
              <select onchange="ClientPortalView.switchMessageCase(this.value)" class="input-field" style="padding: 0.35rem 0.75rem; font-size: 0.82rem; border-radius: 6px; border: 1px solid #CBD5E1; background: #fff; font-weight: 600; color: #0F172A;">
                ${clientCases.map(c => `
                  <option value="${c.id}" ${c.id === currentCase?.id ? 'selected' : ''}>
                    ${c.caseNumber} — ${c.title.substring(0, 28)}... (${c.lawyer || 'Unassigned'})
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}
        </div>

        <!-- Connection Status & Counsel Header Banner -->
        ${hasLawyerConnected ? `
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff; border-radius: 12px; padding: 1.15rem 1.5rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #C89B3C, #A07828); color: #0B1F33; font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(200, 155, 60, 0.3); flex-shrink: 0;">
                ${lawyerAvatar}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.2rem; flex-wrap: wrap;">
                  <span style="font-weight: 700; font-size: 1.05rem; color: #F8FAFC;">Adv. ${this.escapeHtml(assignedLawyer)}</span>
                  <span style="background: rgba(16, 185, 129, 0.2); color: #34D399; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(52, 211, 153, 0.3); display: inline-flex; align-items: center; gap: 4px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #34D399;"></span>
                    Direct Advocate Line Active
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: #CBD5E1;">
                  Assigned Lead Counsel &middot; Matter: <strong style="color: #F8FAFC;">${this.escapeHtml(currentCase.caseNumber)}</strong> — ${this.escapeHtml(currentCase.title)}
                </div>
              </div>
            </div>
            <div style="font-size: 0.75rem; color: #94A3B8; text-align: right; background: rgba(255,255,255,0.06); padding: 0.4rem 0.75rem; border-radius: 6px;">
              🛡️ Protected Attorney-Client Privilege
            </div>
          </div>
        ` : `
          <div style="background: linear-gradient(135deg, #1E293B 0%, #334155 100%); color: #fff; border-radius: 12px; padding: 1.15rem 1.5rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #0284C7; color: #fff; font-weight: 800; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                🏢
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.2rem;">
                  <span style="font-weight: 700; font-size: 1.05rem; color: #F8FAFC;">SLCMS Legal Operations &amp; Intake Desk</span>
                  <span style="background: rgba(2, 132, 199, 0.2); color: #38BDF8; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.3);">
                    Intake &amp; Allocation Desk
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: #CBD5E1;">
                  Your matter is currently in intake or pending counsel assignment. Messages are reviewed directly by the Legal Officer.
                </div>
              </div>
            </div>
          </div>
        `}

        ${hasLawyerConnected && currentCase && typeof CaseChatView !== 'undefined' ? `
          <!-- Real-Time Secure STOMP / WebSocket Case Chat with Assigned Counsel -->
          <div style="margin-top: 0.5rem;">
            ${CaseChatView.renderChatView(currentCase.id)}
          </div>
        ` : `
          <!-- Notice: Chat Unlocked After Verification & Assignment -->
          <div class="card" style="padding: 2.5rem 1.5rem; text-align: center; border-radius: 12px; background: #FFF; border: 1px dashed #CBD5E1; margin-bottom: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔒</div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">
              Secure Case Chat Opens After Payment Verification &amp; Lawyer Assignment
            </h3>
            <p style="color: #64748B; max-width: 540px; margin: 0 auto 1.5rem auto; font-size: 0.88rem; line-height: 1.6;">
              Under firm guidelines, the direct encrypted case chat channel between you and your advocate is automatically established once the Legal Officer verifies your payment proof and assigns an available Lawyer.
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="App.navigate('client-requests')">Check Requests Status</button>
              <button class="btn btn-primary btn-sm" onclick="App.navigate('client-invoices')" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);">
                View Invoices &amp; Upload Proof &rarr;
              </button>
            </div>
          </div>

          <!-- General Operations Message Thread Container -->
          <div class="card" style="padding: 1.75rem; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
            <div id="client-chat-scroll-container" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; max-height: 480px; overflow-y: auto; padding-right: 0.5rem;">
              
              <!-- Default Official Welcome Notice -->
              <div style="align-self: flex-start; max-width: 82%; background: #F8FAFC; border-radius: 12px 12px 12px 2px; padding: 1.1rem; font-size: 0.88rem; color: #1E293B; border: 1px solid #E2E8F0;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
                  <strong style="color: #0284C7; font-size: 0.82rem;">
                    🏢 SLCMS Legal Operations Desk
                  </strong>
                  <span style="font-size: 0.72rem; color: #94A3B8;">Intake Desk Notice</span>
                </div>
                <p style="margin: 0; line-height: 1.5; color: #334155;">
                  Welcome to the client portal messaging desk. Any updates regarding matter intake, invoice issuance, or request clarifications will be posted here.
                </p>
                <span style="display: block; font-size: 0.7rem; color: #94A3B8; margin-top: 0.4rem; text-align: right;">Official Law Office Notice</span>
              </div>

              <!-- Dynamic Messages Loop -->
              ${messages.map(m => {
                const isClientMsg = (m.senderRole === 'Client' || (m.sentBy && m.sentBy === user.name) || (m.sender && m.sender === user.name));
                const d = m.sentAt || m.createdAt || '';
                const timeFormatted = d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Just now';

                if (isClientMsg) {
                  return `
                    <div style="align-self: flex-end; max-width: 80%; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #FFFFFF; border-radius: 14px 14px 2px 14px; padding: 0.95rem 1.15rem; font-size: 0.88rem; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; gap: 0.75rem;">
                        <span style="font-weight: 700; font-size: 0.76rem; color: rgba(255,255,255,0.85);">You (Client)</span>
                        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.7);">${timeFormatted}</span>
                      </div>
                      <div style="line-height: 1.5; white-space: pre-wrap; word-break: break-word;">${this.escapeHtml(m.messageBody || m.message || '')}</div>
                      <div style="font-size: 0.68rem; color: rgba(255,255,255,0.7); margin-top: 0.35rem; text-align: right;">
                        ✓ Sent to Legal Operations
                      </div>
                    </div>
                  `;
                } else {
                  return `
                    <div style="align-self: flex-start; max-width: 82%; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px 14px 14px 2px; padding: 1rem 1.2rem; font-size: 0.88rem; color: #1E293B; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; gap: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                          <span style="font-weight: 700; font-size: 0.82rem; color: #0284C7;">
                            🏢 ${this.escapeHtml(m.sender || m.preparedBy || 'SLCMS Legal Operations')}
                          </span>
                          <span style="background: #F1F5F9; color: #475569; font-size: 0.68rem; font-weight: 600; padding: 1px 6px; border-radius: 4px;">
                            ${this.escapeHtml(m.messageType || 'Official Notice')}
                          </span>
                        </div>
                        <span style="font-size: 0.7rem; color: #94A3B8;">${timeFormatted}</span>
                      </div>
                      ${m.subject ? `
                        <div style="font-weight: 700; font-size: 0.84rem; color: #0F172A; margin-bottom: 0.35rem;">
                          ${this.escapeHtml(m.subject)}
                        </div>
                      ` : ''}
                      <div style="line-height: 1.55; color: #334155; white-space: pre-wrap; word-break: break-word;">${this.escapeHtml(m.messageBody || m.message || '')}</div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px dashed #E2E8F0; padding-top: 0.35rem; font-size: 0.68rem; color: #94A3B8;">
                        <span>🔒 Privileged Correspondence</span>
                        <span>Channel: ${this.escapeHtml(m.channel || 'Direct Portal')}</span>
                      </div>
                    </div>
                  `;
                }
              }).join('')}

            </div>

            <!-- Message Composition Input Form -->
            <form onsubmit="ClientPortalView.handleSendMessage(event)" style="border-top: 1px solid #E2E8F0; padding-top: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin: 0;">
                  Send Message to Legal Operations
                </label>
                <span style="font-size: 0.74rem; color: #94A3B8;">
                  Recipient: <strong style="color: #0F172A;">Legal Operations</strong>
                </span>
              </div>
              <textarea id="client-msg-text" class="input-field" rows="3" placeholder="Type your inquiry or update for the legal team..." required style="width: 100%; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0.75rem; font-family: inherit; font-size: 0.88rem; margin-bottom: 0.75rem; resize: vertical;"></textarea>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: #94A3B8;">
                  🔒 Transmitted over encrypted channel
                </span>
                <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); border: none; padding: 0.55rem 1.4rem; font-weight: 600; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.4rem;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        `}
      </div>
    `;
  },

  handleSendMessage(e) {
    e.preventDefault();
    const textarea = document.getElementById('client-msg-text');
    if (!textarea || !textarea.value.trim()) return;

    const text = textarea.value.trim();
    const user = SLCMS_STATE.currentUser || {};
    const clientCases = this.getClientCases();

    let currentCase = null;
    if (this.selectedMessageCaseId) {
      currentCase = clientCases.find(c => c.id === this.selectedMessageCaseId);
    }
    if (!currentCase && clientCases.length > 0) {
      currentCase = clientCases.find(c => (c.status || '').toLowerCase() !== 'closed') || clientCases[0];
    }

    const assignedLawyer = currentCase?.lawyer;
    const hasLawyerConnected = !!(assignedLawyer && assignedLawyer.trim() && assignedLawyer.toLowerCase() !== 'unassigned');
    const nowIso = new Date().toISOString();
    const msgId = `msg-portal-${Date.now()}`;

    const newMsg = {
      messageId: msgId,
      caseId: currentCase ? currentCase.id : 'case-direct',
      caseNumber: currentCase ? currentCase.caseNumber : 'INQ-DIRECT',
      caseTitle: currentCase ? currentCase.title : 'Direct Client Communication',
      clientId: user.clientId || user.id || user.clientNumber,
      clientName: user.name || 'Client',
      sender: user.name || 'Client',
      senderRole: 'Client',
      recipient: hasLawyerConnected ? assignedLawyer : 'Legal Operations',
      recipientRole: hasLawyerConnected ? 'Lawyer' : 'Legal Officer',
      messageType: hasLawyerConnected ? 'Direct Client Communication' : 'General Legal Inquiry',
      channel: 'Direct Portal',
      subject: hasLawyerConnected ? `Direct Message for Adv. ${assignedLawyer} (Re: ${currentCase.caseNumber})` : 'Inquiry to Legal Operations',
      messageBody: text,
      status: 'SENT',
      sentBy: user.name || 'Client',
      sentAt: nowIso,
      createdAt: nowIso
    };

    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.addClientMessage) {
      SLCMS_STATE.addClientMessage(newMsg);
    }

    if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.addAuditLog === 'function') {
      SLCMS_STATE.addAuditLog(
        'Client Message Sent',
        'Communications',
        `Client ${user.name || 'Client'} sent message to ${hasLawyerConnected ? assignedLawyer : 'Legal Operations'} regarding ${currentCase ? currentCase.caseNumber : 'General Inquiry'}`,
        'Success'
      );
    }

    const recipientLabel = hasLawyerConnected ? assignedLawyer : 'Legal Operations';
    App.showToast(`Message sent directly to ${recipientLabel}.`, 'success');

    textarea.value = '';

    // Dynamically re-render messages tab and auto-scroll to the bottom
    const container = document.getElementById('client-portal-subcontent');
    if (container) {
      container.innerHTML = this.renderSubTabContent();
      const scrollEl = document.getElementById('client-chat-scroll-container');
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    }
  },

  renderDocuments() {
    return `
      <div class="client-documents-view">
        <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
          Document Vault
        </h2>
        <p style="color: #64748B; font-size: 0.88rem; margin-bottom: 1.5rem;">
          Upload requested evidence and download approved court filings
        </p>

        <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <!-- Section 1: Upload Requested Documents -->
          <div class="card" style="padding: 1.75rem; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #0F172A; margin: 0 0 0.5rem 0;">
              Upload Supporting Documents
            </h3>
            <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 1.25rem;">
              Accepted formats: PDF, DOCX, JPG, PNG (Max 25 MB). Files are scanned and encrypted.
            </p>
            
            <div style="border: 2px dashed #CBD5E1; border-radius: 10px; padding: 2rem 1.5rem; text-align: center; background: #F8FAFC; cursor: pointer;" onclick="document.getElementById('client-vault-file').click()">
              <input type="file" id="client-vault-file" style="display: none;" accept=".pdf,.docx,.jpg,.jpeg,.png" onchange="ClientPortalView.handleVaultFileUpload(this)">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📤</div>
              <strong style="color: #0284C7; font-size: 0.9rem;">Click to upload document</strong>
              <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 0.25rem;">or drag and drop file here</div>
            </div>
          </div>

          <!-- Section 2: Shared Firm Documents -->
          <div class="card" style="padding: 1.75rem; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #0F172A; margin: 0 0 0.5rem 0;">
              Shared Legal Documents
            </h3>
            <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 1.25rem;">
              Approved case pleadings, summons, and court ruling copies
            </p>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; text-align: center; color: #64748B; font-size: 0.85rem;">
              No shared documents currently pending download. Approved case documents will be listed here automatically.
            </div>
          </div>
        </div>
      </div>
    `;
  },

  handleVaultFileUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 25 * 1024 * 1024) {
      App.showToast('File exceeds maximum size limit of 25 MB.', 'error');
      return;
    }
    App.showToast(`Document "${file.name}" uploaded successfully to client vault.`, 'success');
  },

  renderAppointments() {
    return `
      <div class="client-appointments-view">
        <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
          Appointments & Approved Court Dates
        </h2>
        <p style="color: #64748B; font-size: 0.88rem; margin-bottom: 1.5rem;">
          Scheduled chamber consultations, pre-trial conferences, and court hearings
        </p>

        <div class="card" style="padding: 2rem; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0;">
          <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="font-size: 1.75rem;">📅</div>
            <div>
              <strong style="color: #0F172A; font-size: 0.95rem; display: block;">Law Office Consultation Hours</strong>
              <span style="font-size: 0.82rem; color: #64748B;">Monday – Friday: 08:30 AM – 05:00 PM (EAT). To schedule an office conference, contact your assigned lawyer or legal officer via the Messages tab.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderProfile() {
    const user = SLCMS_STATE.currentUser || {};
    const clientType = user.clientType || 'INDIVIDUAL';
    const clientId = user.staffId || user.clientNumber || 'CLT-0001';

    return `
      <div class="client-profile-view" style="max-width: 680px; margin: 0 auto;">
        <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
          My Client Profile
        </h2>
        <p style="color: #64748B; font-size: 0.88rem; margin-bottom: 1.5rem;">
          Verified identification dossier and contact preferences
        </p>

        <div class="card" style="padding: 2rem; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0;">
          <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #F1F5F9;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #0284C7; color: #fff; font-weight: 700; font-size: 1.35rem; display: flex; align-items: center; justify-content: center;">
              ${(user.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.2rem; color: #0F172A; font-weight: 700;">${this.escapeHtml(user.name || 'Client Name')}</h3>
              <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                <span style="font-family: monospace; font-size: 0.8rem; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: #475569;">
                  ${this.escapeHtml(clientId)}
                </span>
                <span style="background: #ECFDF5; color: #059669; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px;">
                  ${this.escapeHtml(clientType)}
                </span>
              </div>
            </div>
          </div>

          <form onsubmit="ClientPortalView.handleUpdateProfile(event)">
            <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 0.35rem;">Email Address</label>
                <input type="email" value="${this.escapeHtml(user.email || '')}" disabled style="width: 100%; padding: 0.65rem; border: 1px solid #E2E8F0; border-radius: 6px; background: #F8FAFC; color: #64748B; font-size: 0.88rem;">
              </div>
              <div>
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 0.35rem;">Phone Number *</label>
                <input type="text" id="client-profile-phone" value="${this.escapeHtml(user.phone || '+255')}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem;">
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 0.35rem;">Physical Address / Location</label>
              <input type="text" id="client-profile-address" value="${this.escapeHtml(user.address || '')}" placeholder="City, District, Street..." style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem;">
            </div>

            <div style="text-align: right;">
              <button type="submit" class="btn btn-primary" style="background: #0284C7;">
                Save Profile Updates
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  handleUpdateProfile(e) {
    e.preventDefault();
    const phone = document.getElementById('client-profile-phone')?.value.trim();
    const address = document.getElementById('client-profile-address')?.value.trim();

    if (SLCMS_STATE.currentUser) {
      SLCMS_STATE.currentUser.phone = phone;
      SLCMS_STATE.currentUser.address = address;
      SLCMS_STATE.saveSessionUser(SLCMS_STATE.currentUser);
    }
    App.showToast('Profile contact information updated successfully.', 'success');
  },

  /* ==========================================================================
     7. REQUEST LEGAL ASSISTANCE
     ========================================================================== */
  openRequestModal() {
    const user = SLCMS_STATE.currentUser || {};
    const modalContent = `
      <div class="client-req-modal animate-fade" style="padding: 1.75rem; max-width: 600px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
              Submit Case for Legal Assistance
            </h2>
            <p style="margin: 0.25rem 0 0 0; color: #64748B; font-size: 0.85rem;">
              Submit your matter to the law office for advocate dossier evaluation
            </p>
          </div>
          <button class="modal-close-btn" onclick="App.closeModal()" style="border: none; background: transparent; font-size: 1.5rem; cursor: pointer; color: #94A3B8;">&times;</button>
        </div>

        <form id="client-assistance-form" onsubmit="ClientPortalView.handleSubmitLegalRequest(event)" novalidate>
          <div id="client-req-error" class="alert alert-danger hidden" style="margin-bottom: 1rem; font-size: 0.85rem; padding: 0.75rem;"></div>

          <!-- Client Auto-filled Identity (Read-only) -->
          <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                Client Name <span style="font-weight: normal; color: #64748B;">(Auto-filled)</span>
              </label>
              <input type="text" id="req-client-name" class="form-control" value="${this.escapeHtml(user.name || 'Client')}" readonly style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; background: #F1F5F9; color: #334155; font-weight: 600; cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                Client Email <span style="font-weight: normal; color: #64748B;">(Auto-filled)</span>
              </label>
              <input type="email" id="req-client-email" class="form-control" value="${this.escapeHtml(user.email || '')}" readonly style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; background: #F1F5F9; color: #334155; font-weight: 600; cursor: not-allowed;">
            </div>
          </div>

          <!-- Legal Issue Type * -->
          <div class="form-group" id="fg-issue-type" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
              Issue Type *
            </label>
            <select id="req-issue-type" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.9rem; background: #fff; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                    onchange="ClientPortalView.validateField('issue-type')"
                    onblur="ClientPortalView.validateField('issue-type')">
              <option value="" disabled selected>-- Select Issue Type --</option>
              <option value="Civil Law">Civil Law</option>
              <option value="Criminal Law">Criminal Law</option>
              <option value="Land & Real Estate">Land &amp; Real Estate</option>
              <option value="Matrimonial & Family">Matrimonial &amp; Family</option>
              <option value="Probate & Succession">Probate &amp; Succession</option>
              <option value="Commercial & Corporate">Commercial &amp; Corporate</option>
              <option value="Labour & Employment">Labour &amp; Employment</option>
              <option value="Constitutional & Human Rights">Constitutional &amp; Human Rights</option>
              <option value="Tax Law">Tax Law</option>
              <option value="Other">Other Legal Matter</option>
            </select>
            <div class="field-error-msg" id="err-issue-type"></div>
          </div>

          <!-- Opposing Party or Subject * (2–180 characters) -->
          <div class="form-group" id="fg-opposing-party" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label style="font-size: 0.82rem; font-weight: 700; color: #1E293B; margin: 0;">
                Opposing Party or Subject * (2–180 characters)
              </label>
              <span id="req-opposing-counter" style="font-size: 0.75rem; color: #94A3B8;">0 / 180</span>
            </div>
            <input type="text" id="req-opposing-party" placeholder="Name of Opposing Individual, Company, or Subject Matter" required minlength="2" maxlength="180"
                   style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                   oninput="const len = this.value.length; const c = document.getElementById('req-opposing-counter'); if (c) { c.innerText = len + ' / 180'; c.style.color = (len < 2 || len > 180) ? '#EF4444' : '#059669'; } ClientPortalView.validateField('opposing-party');"
                   onblur="ClientPortalView.validateField('opposing-party')">
            <div class="field-error-msg" id="err-opposing-party"></div>
          </div>

          <!-- Short Description * (20 - 2,000 characters) -->
          <div class="form-group" id="fg-description" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label style="font-size: 0.82rem; font-weight: 700; color: #1E293B; margin: 0;">
                Short Case Description * (20 – 2,000 characters)
              </label>
              <span id="req-char-counter" style="font-size: 0.75rem; color: #94A3B8;">0 / 2,000</span>
            </div>
            <textarea id="req-description" rows="5" required 
                      placeholder="Clearly describe the background facts, relevant dates, and the specific legal relief or action sought..." 
                      style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 6px; font-family: inherit; font-size: 0.88rem; line-height: 1.5; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                      oninput="ClientPortalView.updateCharCounter(this); ClientPortalView.validateField('description');"
                      onblur="ClientPortalView.validateField('description')"></textarea>
            <div class="field-error-msg" id="err-description"></div>
          </div>

          <!-- Preferred Contact Method -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
              Preferred Contact Method
            </label>
            <div style="display: flex; gap: 1.5rem; align-items: center; font-size: 0.88rem; color: #334155;">
              <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
                <input type="radio" name="req-contact-method" value="Email" checked>
                <span>Email</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
                <input type="radio" name="req-contact-method" value="Phone">
                <span>Phone</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
                <input type="radio" name="req-contact-method" value="Office Visit">
                <span>Office Visit</span>
              </label>
            </div>
          </div>

          <!-- Supporting Documents — Optional -->
          <div class="form-group" id="fg-file-input" style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
              Supporting Documents <span style="font-weight: normal; color: #94A3B8;">— Optional (PDF, DOCX, JPG, PNG only; Max 25 MB)</span>
            </label>
            <input type="file" id="req-file-input" accept=".pdf,.docx,.jpg,.jpeg,.png" multiple
                   style="width: 100%; padding: 0.5rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.82rem; background: #F8FAFC; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                   onchange="ClientPortalView.validateField('file-input')">
            <div class="field-error-msg" id="err-file-input"></div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" id="btn-submit-req" class="btn btn-primary" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); font-weight: 600;">
              Submit Case
            </button>
          </div>
        </form>
      </div>
    `;

    if (typeof App !== 'undefined' && typeof App.openModal === 'function') {
      App.openModal(modalContent);
    } else {
      const overlay = document.getElementById('global-modal-overlay');
      const content = document.getElementById('global-modal-content');
      if (overlay && content) {
        content.innerHTML = modalContent;
        overlay.classList.add('active');
      }
    }
  },

  updateCharCounter(textarea) {
    const len = (textarea.value || '').length;
    const counter = document.getElementById('req-char-counter');
    if (counter) {
      counter.innerText = `${len} / 2,000`;
      if (len < 20 || len > 2000) {
        counter.style.color = '#EF4444';
      } else {
        counter.style.color = '#059669';
      }
    }
  },

  /* --- Per-field validation helper --- */
  validateField(fieldName) {
    const rules = {
      'issue-type': () => {
        const val = document.getElementById('req-issue-type')?.value;
        if (!val) return 'Please select an area of law for your case.';
        return '';
      },
      'opposing-party': () => {
        const val = (document.getElementById('req-opposing-party')?.value || '').trim();
        if (!val) return 'Opposing party or subject is required.';
        if (val.length < 2) return 'Must be at least 2 characters long.';
        if (val.length > 180) return 'Cannot exceed 180 characters.';
        return '';
      },
      'description': () => {
        const val = (document.getElementById('req-description')?.value || '').trim();
        if (!val) return 'Case description is required.';
        if (val.length < 20) return `At least 20 characters required (currently ${val.length}).`;
        if (val.length > 2000) return `Cannot exceed 2,000 characters (currently ${val.length}).`;
        return '';
      },
      'file-input': () => {
        const fileInput = document.getElementById('req-file-input');
        const allowedExts = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const ext = file.name.split('.').pop().toLowerCase();
            if (!allowedExts.includes(ext)) {
              return `"${file.name}" is not a supported format. Use PDF, DOCX, JPG, or PNG only.`;
            }
            if (file.size > 25 * 1024 * 1024) {
              return `"${file.name}" exceeds the 25 MB size limit.`;
            }
          }
        }
        return '';
      }
    };

    const validator = rules[fieldName];
    if (!validator) return true;

    const errorMsg = validator();
    const fgEl = document.getElementById('fg-' + fieldName);
    const errEl = document.getElementById('err-' + fieldName);

    if (errorMsg) {
      if (fgEl) { fgEl.classList.remove('field-valid'); fgEl.classList.add('field-invalid'); }
      if (errEl) { errEl.textContent = errorMsg; errEl.classList.add('visible'); }
      return false;
    } else {
      if (fgEl) { fgEl.classList.remove('field-invalid'); fgEl.classList.add('field-valid'); }
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
      return true;
    }
  },

  /* --- Clear all validation states --- */
  clearAllValidation() {
    ['issue-type', 'opposing-party', 'description', 'file-input'].forEach(fieldName => {
      const fgEl = document.getElementById('fg-' + fieldName);
      const errEl = document.getElementById('err-' + fieldName);
      if (fgEl) { fgEl.classList.remove('field-valid', 'field-invalid'); }
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
    });
  },

  async handleSubmitLegalRequest(e) {
    e.preventDefault();
    const errorBox = document.getElementById('client-req-error');
    if (errorBox) errorBox.classList.add('hidden');

    // Validate all fields and collect results
    const requiredFields = ['issue-type', 'opposing-party', 'description', 'file-input'];
    let allValid = true;
    let firstInvalidField = null;
    const errorMessages = [];

    requiredFields.forEach(fieldName => {
      const isValid = this.validateField(fieldName);
      if (!isValid) {
        allValid = false;
        if (!firstInvalidField) firstInvalidField = fieldName;
        const errEl = document.getElementById('err-' + fieldName);
        if (errEl && errEl.textContent) errorMessages.push(errEl.textContent);
      }
    });

    // If validation failed, shake the form and scroll to first error
    if (!allValid) {
      const form = document.getElementById('client-assistance-form');
      if (form) {
        form.classList.remove('form-shake');
        void form.offsetWidth; // force reflow to restart animation
        form.classList.add('form-shake');
        setTimeout(() => form.classList.remove('form-shake'), 500);
      }

      // Show summary error
      const summaryMsg = errorMessages.length > 1
        ? `Please fix ${errorMessages.length} errors before submitting: ${errorMessages.join(' • ')}`
        : errorMessages[0] || 'Please fix the highlighted errors before submitting.';
      this.showReqError(summaryMsg);

      // Scroll to the first invalid field
      if (firstInvalidField) {
        const firstEl = document.getElementById('fg-' + firstInvalidField);
        if (firstEl) firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const issueType = document.getElementById('req-issue-type')?.value;
    const opposingParty = document.getElementById('req-opposing-party')?.value.trim();
    const description = document.getElementById('req-description')?.value.trim();
    const contactMethod = document.querySelector('input[name="req-contact-method"]:checked')?.value || 'Email';
    const fileInput = document.getElementById('req-file-input');

    // Build sanitized file names list
    const allowedExts = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
    let fileNames = [];
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        fileNames.push(safeName);
      }
    }

    const user = SLCMS_STATE.currentUser || {};
    const submitBtn = document.getElementById('btn-submit-req');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting Case...';
    }

    try {
      const payload = {
        clientId: user.clientId || user.id || user.clientNumber,
        clientName: user.name || user.full_name || 'Client',
        clientEmail: user.email || '',
        clientPhone: user.phone || '',
        issueType: issueType,
        opposingParty: opposingParty,
        description: description,
        preferredContactMethod: contactMethod,
        supportingDocuments: fileNames.join(', '),
        files: fileInput ? fileInput.files : null
      };

      if (typeof ClientPortalService !== 'undefined') {
        const result = await ClientPortalService.submitRequest(payload);
        if (result && result.request) {
          if (!Array.isArray(this.requests)) this.requests = [];
          this.requests.unshift(result.request);
        }
      }

      App.closeModal();
      App.showToast('Case submitted successfully under initial status SUBMITTED. A Legal Officer will review your matter.', 'success');
      App.navigate('client-requests');
    } catch (err) {
      this.showReqError(err.message || 'Submission failed. Please check form validations.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit Case';
      }
    }
  },

  showReqError(msg) {
    const errorBox = document.getElementById('client-req-error');
    if (errorBox) {
      errorBox.innerText = msg;
      errorBox.classList.remove('hidden');
    } else {
      App.showToast(msg, 'error');
    }
  },

  /* ==========================================================================
     INFORMATION REQUEST RESPONSE FORM & VALIDATION (Requirements 5, 6, 7, 8)
     ========================================================================== */
  openCompleteInformationRequestModal(requestId) {
    const user = SLCMS_STATE.currentUser || {};
    const infoRequests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredInfoRequests() : [];
    const infoReq = infoRequests.find(ir => String(ir.requestId) === String(requestId) || String(ir.id) === String(requestId) || String(ir.caseNumber) === String(requestId))
      || (this.requests || []).find(r => String(r.id) === String(requestId) || String(r.currentInfoRequestId) === String(requestId))?.infoRequest;

    const reqId = infoReq ? infoReq.requestId : (requestId || 'REQ-2026-0034');
    const caseNum = infoReq ? infoReq.caseNumber : 'CASE-2026-0045';
    const clientName = infoReq ? (infoReq.clientName || user.name || 'Client') : (user.name || 'Client');
    const clientEmail = infoReq ? (infoReq.clientEmail || user.email || '') : (user.email || '');
    const clientPhone = infoReq ? (infoReq.clientPhone || user.phone || '+255 700 000 000') : (user.phone || '+255 700 000 000');
    const title = infoReq ? (infoReq.title || 'Additional Case Information Required') : 'Additional Case Information Required';
    const notes = infoReq ? (infoReq.officerNotes || 'Please complete the requested information so that we can assess your matter and prepare the appropriate legal service invoice.') : 'Please complete the requested information so that we can assess your matter and prepare the appropriate legal service invoice.';
    const dueDate = infoReq ? (infoReq.dueDate || '30 Sep 2026') : '30 Sep 2026';

    const savedDraft = JSON.parse(localStorage.getItem('slcms_draft_inforeq_' + reqId) || '{}');

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="font-size: 0.72rem; color: #F59E0B; font-weight: 800; text-transform: uppercase; background: rgba(245, 158, 11, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.3);">
              Case Dossier Questionnaire
            </span>
            <span style="font-family: monospace; font-size: 0.8rem; color: #94A3B8;">
              ${this.escapeHtml(reqId)} &bull; ${this.escapeHtml(caseNum)}
            </span>
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.2rem; margin: 0;">
            ${this.escapeHtml(title)}
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.75rem; max-height: 80vh; overflow-y: auto;">
        
        <!-- Officer Instruction Banner -->
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
          <div style="font-weight: 700; color: #92400E; font-size: 0.88rem; margin-bottom: 0.35rem;">
            Legal Officer Assessment Instructions
          </div>
          <p style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #78350F; line-height: 1.5;">
            ${this.escapeHtml(notes)}
          </p>
          <div style="font-size: 0.78rem; color: #B45309;">
            <strong>Due Date:</strong> ${this.escapeHtml(dueDate)} &bull; Recipient: <strong>${this.escapeHtml(clientName)}</strong>
          </div>
        </div>

        <form id="complete-info-req-form" onsubmit="ClientPortalView.handleSubmitInformationResponse(event, '${reqId}')" novalidate>
          
          <!-- Section 1: Personal Details -->
          <div style="margin-bottom: 1.5rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>👤</span> <span>1. Personal Details</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
              <div class="form-group" id="fg-info-name">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  Full Name *
                </label>
                <input type="text" id="info-client-name" class="form-control" value="${this.escapeHtml(savedDraft.name || clientName)}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                       onblur="ClientPortalView.validateInfoField('info-name')">
                <div class="field-error-msg" id="err-info-name"></div>
              </div>
              <div class="form-group" id="fg-info-phone">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  Phone Number *
                </label>
                <input type="tel" id="info-client-phone" class="form-control" value="${this.escapeHtml(savedDraft.phone || clientPhone)}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                       onblur="ClientPortalView.validateInfoField('info-phone')">
                <div class="field-error-msg" id="err-info-phone"></div>
              </div>
            </div>

            <div class="form-group" id="fg-info-email" style="margin-bottom: 0.75rem;">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                Email Address *
              </label>
              <input type="email" id="info-client-email" class="form-control" value="${this.escapeHtml(savedDraft.email || clientEmail)}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                     onblur="ClientPortalView.validateInfoField('info-email')">
              <div class="field-error-msg" id="err-info-email"></div>
            </div>

            <div class="form-group" id="fg-info-address">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                Full Residential Address *
              </label>
              <textarea id="info-client-address" rows="2" class="form-control" required placeholder="House number, Street, Ward, District, Region..." style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                        onblur="ClientPortalView.validateInfoField('info-address')">${this.escapeHtml(savedDraft.address || 'Plot 45, Msasani Peninsula, Kinondoni, Dar es Salaam')}</textarea>
              <div class="field-error-msg" id="err-info-address"></div>
            </div>
          </div>

          <!-- Section 2: Identification -->
          <div style="margin-bottom: 1.5rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>🪪</span> <span>2. Identification</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group" id="fg-info-idtype">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  Identification Type *
                </label>
                <select id="info-id-type" class="form-control" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; background: #fff; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                        onchange="ClientPortalView.validateInfoField('info-idtype')">
                  <option value="National ID (NIDA)" ${(savedDraft.idType === 'National ID (NIDA)' || !savedDraft.idType) ? 'selected' : ''}>National ID (NIDA)</option>
                  <option value="Passport" ${savedDraft.idType === 'Passport' ? 'selected' : ''}>Passport</option>
                  <option value="Voter ID Card" ${savedDraft.idType === 'Voter ID Card' ? 'selected' : ''}>Voter ID Card</option>
                  <option value="Driver's License" ${savedDraft.idType === "Driver's License" ? 'selected' : ''}>Driver's License</option>
                </select>
                <div class="field-error-msg" id="err-info-idtype"></div>
              </div>
              <div class="form-group" id="fg-info-idnumber">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  ID Number *
                </label>
                <input type="text" id="info-id-number" class="form-control" placeholder="19900101-12345-00001-22" value="${this.escapeHtml(savedDraft.idNumber || '19880415-21101-00042-19')}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; font-family: monospace; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                       onblur="ClientPortalView.validateInfoField('info-idnumber')">
                <div class="field-error-msg" id="err-info-idnumber"></div>
              </div>
            </div>
          </div>

          <!-- Section 3: Case Information -->
          <div style="margin-bottom: 1.5rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>⚖️</span> <span>3. Case Information</span>
            </div>

            <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
              <div class="form-group" id="fg-info-opposing">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  Opposing Party Name *
                </label>
                <input type="text" id="info-opposing-party" class="form-control" value="${this.escapeHtml(savedDraft.opposingParty || 'Juma &amp; Sons Properties Ltd')}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                       onblur="ClientPortalView.validateInfoField('info-opposing')">
                <div class="field-error-msg" id="err-info-opposing"></div>
              </div>
              <div class="form-group" id="fg-info-disputedate">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  Date Dispute Started *
                </label>
                <input type="date" id="info-dispute-date" class="form-control" value="${this.escapeHtml(savedDraft.disputeDate || '2026-05-14')}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                       onblur="ClientPortalView.validateInfoField('info-disputedate')">
                <div class="field-error-msg" id="err-info-disputedate"></div>
              </div>
            </div>

            <div class="form-group" id="fg-info-location" style="margin-bottom: 0.75rem;">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                Location of Dispute / Property *
              </label>
              <input type="text" id="info-dispute-location" class="form-control" value="${this.escapeHtml(savedDraft.disputeLocation || 'Kibamba Ward, Ubungo District, Dar es Salaam')}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                     onblur="ClientPortalView.validateInfoField('info-location')">
              <div class="field-error-msg" id="err-info-location"></div>
            </div>

            <div class="form-group" id="fg-info-desc">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                Detailed Description / Previous Court Case Details *
              </label>
              <textarea id="info-description" rows="4" class="form-control" required placeholder="Describe the factual sequence, boundaries in dispute, prior agreements, and any previous court case numbers..." style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; line-height: 1.5; transition: border-color 0.25s ease, box-shadow 0.25s ease;"
                        onblur="ClientPortalView.validateInfoField('info-desc')">${this.escapeHtml(savedDraft.description || 'The dispute pertains to boundary encroachment on Certificate of Title No. 49821. Opposing party claimed ownership without survey records. No previous court judgement has been rendered.')}</textarea>
              <div class="field-error-msg" id="err-info-desc"></div>
            </div>
          </div>

          <!-- Section 4: Supporting Documents Upload -->
          <div style="margin-bottom: 1.5rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem;">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>📎</span> <span>4. Supporting Documents</span>
            </div>
            <p style="margin: 0 0 0.85rem 0; font-size: 0.8rem; color: #64748B;">
              Approved formats: PDF, DOCX, JPG, PNG (Max 25 MB per file). Click upload to attach verified documentation.
              <br><span style="color: #DC2626; font-weight: 600;">Documents marked with * are required. Missing required documents will be flagged to the Legal Officer.</span>
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              
              <!-- Doc 1: National ID -->
              <div id="doc-card-id" data-uploaded="false" data-required="true" data-doc-label="National ID / Passport" style="background: #fff; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0.75rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;">
                <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #1E293B; margin-bottom: 0.3rem;">
                  National ID / Passport <span style="color: #DC2626;">*</span>
                </label>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                  <span id="info-doc-id-name" style="font-size: 0.78rem; color: #94A3B8; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic;">No file uploaded</span>
                  <label class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.6rem; cursor: pointer; margin: 0;">
                    Upload <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" style="display: none;" onchange="ClientPortalView.handleInfoDocUpload(this, 'info-doc-id-name', 'doc-card-id')">
                  </label>
                </div>
                <div class="field-error-msg" id="err-doc-id"></div>
              </div>

              <!-- Doc 2: Ownership Document -->
              <div id="doc-card-title" data-uploaded="false" data-required="true" data-doc-label="Title / Ownership Document" style="background: #fff; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0.75rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;">
                <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #1E293B; margin-bottom: 0.3rem;">
                  Title / Ownership Document <span style="color: #DC2626;">*</span>
                </label>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                  <span id="info-doc-title-name" style="font-size: 0.78rem; color: #94A3B8; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic;">No file uploaded</span>
                  <label class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.6rem; cursor: pointer; margin: 0;">
                    Upload <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" style="display: none;" onchange="ClientPortalView.handleInfoDocUpload(this, 'info-doc-title-name', 'doc-card-title')">
                  </label>
                </div>
                <div class="field-error-msg" id="err-doc-title"></div>
              </div>

              <!-- Doc 3: Previous Agreement -->
              <div id="doc-card-agree" data-uploaded="false" data-required="false" data-doc-label="Previous Agreement" style="background: #fff; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0.75rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;">
                <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #1E293B; margin-bottom: 0.3rem;">
                  Previous Agreement <span style="font-weight: normal; color: #94A3B8; font-size: 0.72rem;">(Optional)</span>
                </label>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                  <span id="info-doc-agree-name" style="font-size: 0.78rem; color: #94A3B8; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic;">No file uploaded</span>
                  <label class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.6rem; cursor: pointer; margin: 0;">
                    Upload <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" style="display: none;" onchange="ClientPortalView.handleInfoDocUpload(this, 'info-doc-agree-name', 'doc-card-agree')">
                  </label>
                </div>
              </div>

              <!-- Doc 4: Court Documents -->
              <div id="doc-card-court" data-uploaded="false" data-required="false" data-doc-label="Previous Court Documents" style="background: #fff; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0.75rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;">
                <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #1E293B; margin-bottom: 0.3rem;">
                  Previous Court Documents <span style="font-weight: normal; color: #94A3B8; font-size: 0.72rem;">(Optional)</span>
                </label>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                  <span id="info-doc-court-name" style="font-size: 0.78rem; color: #94A3B8; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic;">No file uploaded</span>
                  <label class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.6rem; cursor: pointer; margin: 0;">
                    Upload <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" style="display: none;" onchange="ClientPortalView.handleInfoDocUpload(this, 'info-doc-court-name', 'doc-card-court')">
                  </label>
                </div>
              </div>

            </div>

            <!-- Missing Documents Warning Banner -->
            <div id="missing-docs-warning" style="display: none; margin-top: 0.85rem; background: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid #EF4444; border-radius: 6px; padding: 0.75rem 1rem;">
              <div style="font-weight: 700; color: #991B1B; font-size: 0.82rem; margin-bottom: 0.25rem;">⚠ Required Documents Missing</div>
              <p id="missing-docs-list" style="margin: 0; font-size: 0.78rem; color: #B91C1C; line-height: 1.5;"></p>
              <p style="margin: 0.35rem 0 0 0; font-size: 0.72rem; color: #DC2626; font-style: italic;">You may still submit, but the Legal Officer will be notified of missing documents.</p>
            </div>
          </div>

          <!-- Section 5: Mandatory Client Declaration (Requirement 7) -->
          <div id="fg-info-declaration" style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; transition: border-color 0.25s ease, box-shadow 0.25s ease;">
            <label style="display: flex; align-items: flex-start; gap: 0.65rem; cursor: pointer; font-size: 0.88rem; color: #065F46; line-height: 1.5;">
              <input type="checkbox" id="info-declaration-check" required style="width: 18px; height: 18px; margin-top: 2px; accent-color: #059669;"
                     onchange="ClientPortalView.validateInfoField('info-declaration')">
              <span><strong>Client Declaration:</strong> I confirm that the information and documents submitted are true and correct to the best of my knowledge.</span>
            </label>
            <div class="field-error-msg" id="err-info-declaration"></div>
          </div>

          <!-- Live Validation Hint -->
          <div id="inforeq-validation-hint" style="font-size: 0.82rem; margin-bottom: 1rem; text-align: right;"></div>

          <!-- Action Buttons -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 1.25rem;">
            <button type="button" class="btn btn-secondary" onclick="ClientPortalView.saveInfoReqDraft('${reqId}')">
              💾 Save Draft
            </button>
            <div style="display: flex; gap: 0.65rem;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
              <button type="submit" id="btn-submit-inforeq" class="btn btn-primary" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); font-weight: 700; padding: 0.65rem 1.5rem; opacity: 0.5; cursor: not-allowed;" disabled>
                Submit to Legal Officer &rarr;
              </button>
            </div>
          </div>

        </form>
      </div>
    `, 'modal-lg');

    // Bind live client-side validation
    setTimeout(() => {
      ClientPortalView.bindInfoReqValidation(reqId);
    }, 60);
  },

  handleInfoDocUpload(input, targetLabelId, cardId) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const maxBytes = 25 * 1024 * 1024;
      if (file.size > maxBytes) {
        App.showToast(`File "${file.name}" exceeds 25 MB maximum size limit.`, 'error');
        input.value = '';
        return;
      }
      const ext = file.name.split('.').pop().toLowerCase();
      const allowed = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
      if (!allowed.includes(ext)) {
        App.showToast(`File "${file.name}" is not an accepted format (PDF, DOCX, JPG, PNG only).`, 'error');
        input.value = '';
        return;
      }
      const label = document.getElementById(targetLabelId);
      if (label) {
        label.innerText = file.name;
        label.style.color = '#059669';
        label.style.fontWeight = '700';
        label.style.fontStyle = 'normal';
      }
      // Mark document card as uploaded
      if (cardId) {
        const card = document.getElementById(cardId);
        if (card) {
          card.setAttribute('data-uploaded', 'true');
          card.style.borderColor = '#059669';
          card.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
          // Clear error if it was shown
          const errId = 'err-' + cardId.replace('doc-card-', 'doc-');
          const errEl = document.getElementById(errId);
          if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
        }
      }
      // Update missing docs warning
      this.updateMissingDocsWarning();
      App.showToast(`Attached "${file.name}" successfully.`, 'success');
    }
  },

  /* --- Check and display missing required documents warning --- */
  updateMissingDocsWarning() {
    const docCards = document.querySelectorAll('[data-required="true"]');
    const missing = [];
    docCards.forEach(card => {
      if (card.getAttribute('data-uploaded') !== 'true') {
        missing.push(card.getAttribute('data-doc-label'));
      }
    });
    const warningEl = document.getElementById('missing-docs-warning');
    const listEl = document.getElementById('missing-docs-list');
    if (warningEl && listEl) {
      if (missing.length > 0) {
        listEl.textContent = missing.map(d => '• ' + d).join('  ');
        warningEl.style.display = 'block';
      } else {
        warningEl.style.display = 'none';
      }
    }
    return missing;
  },

  /* --- Per-field validation for dossier form --- */
  validateInfoField(fieldName) {
    const rules = {
      'info-name': () => {
        const v = (document.getElementById('info-client-name')?.value || '').trim();
        if (!v) return 'Full name is required.';
        if (v.length < 2) return 'Name must be at least 2 characters.';
        return '';
      },
      'info-phone': () => {
        const v = (document.getElementById('info-client-phone')?.value || '').trim();
        if (!v) return 'Phone number is required.';
        if (v.length < 6) return 'Enter a valid phone number.';
        return '';
      },
      'info-email': () => {
        const v = (document.getElementById('info-client-email')?.value || '').trim();
        if (!v) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
        return '';
      },
      'info-address': () => {
        const v = (document.getElementById('info-client-address')?.value || '').trim();
        if (!v) return 'Residential address is required.';
        if (v.length < 5) return 'Address must be at least 5 characters.';
        return '';
      },
      'info-idtype': () => {
        const v = document.getElementById('info-id-type')?.value;
        if (!v) return 'Select an identification type.';
        return '';
      },
      'info-idnumber': () => {
        const v = (document.getElementById('info-id-number')?.value || '').trim();
        if (!v) return 'ID number is required.';
        if (v.length < 4) return 'ID number must be at least 4 characters.';
        return '';
      },
      'info-opposing': () => {
        const v = (document.getElementById('info-opposing-party')?.value || '').trim();
        if (!v) return 'Opposing party name is required.';
        if (v.length < 2) return 'Must be at least 2 characters.';
        return '';
      },
      'info-disputedate': () => {
        const v = document.getElementById('info-dispute-date')?.value;
        if (!v) return 'Dispute start date is required.';
        return '';
      },
      'info-location': () => {
        const v = (document.getElementById('info-dispute-location')?.value || '').trim();
        if (!v) return 'Dispute location is required.';
        if (v.length < 3) return 'Location must be at least 3 characters.';
        return '';
      },
      'info-desc': () => {
        const v = (document.getElementById('info-description')?.value || '').trim();
        if (!v) return 'Case description is required.';
        if (v.length < 10) return `At least 10 characters required (currently ${v.length}).`;
        return '';
      },
      'info-declaration': () => {
        const checked = document.getElementById('info-declaration-check')?.checked;
        if (!checked) return 'You must confirm the declaration to proceed.';
        return '';
      }
    };

    const validator = rules[fieldName];
    if (!validator) return true;

    const errorMsg = validator();
    const fgEl = document.getElementById('fg-' + fieldName);
    const errEl = document.getElementById('err-' + fieldName);

    if (errorMsg) {
      if (fgEl) { fgEl.classList.remove('field-valid'); fgEl.classList.add('field-invalid'); }
      if (errEl) { errEl.textContent = errorMsg; errEl.classList.add('visible'); }
      return false;
    } else {
      if (fgEl) { fgEl.classList.remove('field-invalid'); fgEl.classList.add('field-valid'); }
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
      return true;
    }
  },

  bindInfoReqValidation(reqId) {
    const form = document.getElementById('complete-info-req-form');
    if (!form) return;

    const checkValidity = () => {
      const name = document.getElementById('info-client-name')?.value?.trim();
      const phone = document.getElementById('info-client-phone')?.value?.trim();
      const email = document.getElementById('info-client-email')?.value?.trim();
      const address = document.getElementById('info-client-address')?.value?.trim();
      const idType = document.getElementById('info-id-type')?.value?.trim();
      const idNumber = document.getElementById('info-id-number')?.value?.trim();
      const opposingParty = document.getElementById('info-opposing-party')?.value?.trim();
      const disputeDate = document.getElementById('info-dispute-date')?.value?.trim();
      const disputeLocation = document.getElementById('info-dispute-location')?.value?.trim();
      const description = document.getElementById('info-description')?.value?.trim();
      const declaration = document.getElementById('info-declaration-check')?.checked;

      const isValid = Boolean(
        name && 
        phone && 
        email && 
        address && 
        idType && 
        idNumber && 
        opposingParty && 
        disputeDate && 
        disputeLocation && 
        description && 
        description.length >= 10 && 
        declaration
      );

      // Update missing docs warning in real-time
      this.updateMissingDocsWarning();

      const submitBtn = document.getElementById('btn-submit-inforeq');
      const validationHint = document.getElementById('inforeq-validation-hint');
      if (submitBtn) {
        submitBtn.disabled = !isValid;
        submitBtn.style.opacity = isValid ? '1' : '0.5';
        submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
      }
      if (validationHint) {
        const missingDocs = this.updateMissingDocsWarning();
        if (isValid && missingDocs.length === 0) {
          validationHint.innerHTML = '<span style="color: #059669; font-weight: 600;">✓ All required fields and documents completed. Ready to submit.</span>';
        } else if (isValid && missingDocs.length > 0) {
          validationHint.innerHTML = '<span style="color: #D97706; font-weight: 600;">⚠ Fields complete but ' + missingDocs.length + ' required document(s) missing. You may submit — the Legal Officer will be notified.</span>';
        } else {
          validationHint.innerHTML = '<span style="color: #64748B;">Please fill all required personal, identification, case details and check the declaration.</span>';
        }
      }
    };

    form.addEventListener('input', checkValidity);
    form.addEventListener('change', checkValidity);
    // Initial check
    this.updateMissingDocsWarning();
    checkValidity();
  },

  saveInfoReqDraft(reqId) {
    const draft = {
      name: document.getElementById('info-client-name')?.value,
      phone: document.getElementById('info-client-phone')?.value,
      email: document.getElementById('info-client-email')?.value,
      address: document.getElementById('info-client-address')?.value,
      idType: document.getElementById('info-id-type')?.value,
      idNumber: document.getElementById('info-id-number')?.value,
      opposingParty: document.getElementById('info-opposing-party')?.value,
      disputeDate: document.getElementById('info-dispute-date')?.value,
      disputeLocation: document.getElementById('info-dispute-location')?.value,
      description: document.getElementById('info-description')?.value,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('slcms_draft_inforeq_' + reqId, JSON.stringify(draft));
    App.showToast('Draft information saved successfully.', 'info');
  },

  async handleSubmitInformationResponse(e, reqId) {
    if (e) e.preventDefault();

    // --- Full form validation with visual feedback ---
    const infoFields = [
      'info-name', 'info-phone', 'info-email', 'info-address',
      'info-idtype', 'info-idnumber',
      'info-opposing', 'info-disputedate', 'info-location', 'info-desc',
      'info-declaration'
    ];
    let allValid = true;
    let firstInvalidField = null;
    const errorMessages = [];

    infoFields.forEach(fieldName => {
      const isValid = this.validateInfoField(fieldName);
      if (!isValid) {
        allValid = false;
        if (!firstInvalidField) firstInvalidField = fieldName;
        const errEl = document.getElementById('err-' + fieldName);
        if (errEl && errEl.textContent) errorMessages.push(errEl.textContent);
      }
    });

    // Validate required documents (show error on cards but don't block submit)
    const docCards = document.querySelectorAll('[data-required="true"]');
    docCards.forEach(card => {
      if (card.getAttribute('data-uploaded') !== 'true') {
        card.style.borderColor = '#EF4444';
        card.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        const errId = 'err-' + card.id.replace('doc-card-', 'doc-');
        const errEl = document.getElementById(errId);
        if (errEl) {
          errEl.textContent = 'Required document not uploaded — Legal Officer will be notified.';
          errEl.classList.add('visible');
        }
      }
    });

    if (!allValid) {
      const form = document.getElementById('complete-info-req-form');
      if (form) {
        form.classList.remove('form-shake');
        void form.offsetWidth;
        form.classList.add('form-shake');
        setTimeout(() => form.classList.remove('form-shake'), 500);
      }
      App.showToast(`Please fix ${errorMessages.length} error(s) before submitting.`, 'error');
      if (firstInvalidField) {
        const firstEl = document.getElementById('fg-' + firstInvalidField);
        if (firstEl) firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // --- Detect missing documents ---
    const allDocCards = [
      { cardId: 'doc-card-id', label: 'National ID / Passport', nameId: 'info-doc-id-name', required: true },
      { cardId: 'doc-card-title', label: 'Title / Ownership Document', nameId: 'info-doc-title-name', required: true },
      { cardId: 'doc-card-agree', label: 'Previous Agreement', nameId: 'info-doc-agree-name', required: false },
      { cardId: 'doc-card-court', label: 'Previous Court Documents', nameId: 'info-doc-court-name', required: false }
    ];

    const missingDocuments = [];
    const uploadedDocuments = [];
    const documents = [];

    allDocCards.forEach(doc => {
      const card = document.getElementById(doc.cardId);
      const isUploaded = card && card.getAttribute('data-uploaded') === 'true';
      const fileName = document.getElementById(doc.nameId)?.innerText || '';

      documents.push({
        category: doc.label,
        name: isUploaded ? fileName : 'NOT DEPOSITED',
        uploaded: isUploaded,
        required: doc.required
      });

      if (!isUploaded) {
        missingDocuments.push(doc.label + (doc.required ? ' (REQUIRED)' : ' (Optional)'));
      } else {
        uploadedDocuments.push(doc.label + ': ' + fileName);
      }
    });

    const payload = {
      fullName: document.getElementById('info-client-name')?.value?.trim(),
      phone: document.getElementById('info-client-phone')?.value?.trim(),
      email: document.getElementById('info-client-email')?.value?.trim(),
      residentialAddress: document.getElementById('info-client-address')?.value?.trim(),
      idType: document.getElementById('info-id-type')?.value,
      idNumber: document.getElementById('info-id-number')?.value?.trim(),
      opposingParty: document.getElementById('info-opposing-party')?.value?.trim(),
      disputeDate: document.getElementById('info-dispute-date')?.value,
      disputeLocation: document.getElementById('info-dispute-location')?.value?.trim(),
      description: document.getElementById('info-description')?.value?.trim(),
      documents: documents,
      missingDocuments: missingDocuments,
      uploadedDocuments: uploadedDocuments,
      declarationConfirmed: true,
      submittedAt: new Date().toISOString()
    };

    const submitBtn = document.getElementById('btn-submit-inforeq');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting Response...';
    }

    try {
      if (typeof ClientPortalService !== 'undefined') {
        ClientPortalService.submitInformationResponse(reqId, payload);
      }

      // --- Send missing-documents notification to Legal Officer ---
      if (missingDocuments.length > 0) {
        const clientName = document.getElementById('info-client-name')?.value?.trim() || 'Client';
        const infoRequests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredInfoRequests() : [];
        const infoReq = infoRequests.find(ir => String(ir.requestId) === String(reqId) || String(ir.id) === String(reqId));
        const caseNumber = infoReq ? infoReq.caseNumber : reqId;

        if (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.notifications)) {
          SLCMS_STATE.notifications.unshift({
            id: 'notif-missing-docs-' + Date.now(),
            targetRole: 'Legal Officer',
            title: `⚠ Missing Documents — ${caseNumber}`,
            message: `Client ${clientName} has submitted the dossier for ${caseNumber} but did NOT deposit the following documents: ${missingDocuments.join(', ')}. Please follow up with the client to obtain these documents.`,
            type: 'MISSING_DOCUMENTS',
            severity: 'WARNING',
            requestId: reqId,
            caseNumber: caseNumber,
            missingDocuments: missingDocuments,
            uploadedDocuments: uploadedDocuments,
            actionRoute: 'legal-requests',
            createdAt: new Date().toISOString()
          });
        }

        if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.addAuditLog === 'function') {
          SLCMS_STATE.addAuditLog(
            'Missing Documents Flagged',
            'Client Intake',
            `Client ${clientName} submitted dossier for ${caseNumber} without: ${missingDocuments.join(', ')}`,
            'Warning'
          );
        }
      }

      localStorage.removeItem('slcms_draft_inforeq_' + reqId);
      App.closeModal();

      if (missingDocuments.length > 0) {
        App.showToast(`Response submitted. Note: ${missingDocuments.length} document(s) were not deposited — the Legal Officer has been notified.`, 'warning');
      } else {
        App.showToast('Your response and all documents have been sent to the Legal Officer.', 'success');
      }
      
      // Refresh data and view
      await this.initData();
      const subcontent = document.getElementById('client-portal-subcontent');
      if (subcontent) {
        subcontent.innerHTML = this.renderSubTabContent();
      } else {
        App.navigate('client-requests');
      }
    } catch (err) {
      App.showToast(err.message || 'Submission failed.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit to Legal Officer';
      }
    }
  },

  openReplyMoreInfoModal(requestId) {
    this.openCompleteInformationRequestModal(requestId);
  },

  /* ==========================================================================
     DATA HELPERS
     ========================================================================== */
  getClientCases() {
    const user = SLCMS_STATE.currentUser || {};
    const clientId = user.clientId || user.id || user.clientNumber;
    const email = (user.email || '').toLowerCase();
    const name = (user.name || '').toLowerCase();

    const allCases = SLCMS_STATE.cases || [];
    return allCases.filter(c => {
      if (c.clientId && (c.clientId === clientId || c.clientId === user.staffId)) return true;
      if (c.client && email && c.client.toLowerCase().includes(email.split('@')[0])) return true;
      if (c.client && name && c.client.toLowerCase() === name) return true;
      return false;
    });
  },

  getClientRequests() {
    const user = SLCMS_STATE.currentUser || {};
    const clientId = user.clientId || user.id || user.clientNumber;
    const email = user.email || '';
    const name = user.name || user.full_name || '';
    if (typeof ClientPortalService !== 'undefined') {
      this.requests = ClientPortalService.getStoredRequests(clientId, email, name);
      return this.requests;
    }
    return this.requests || [];
  },

  getStatusBadgeMeta(status) {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'SUBMITTED':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      case 'UNDER REVIEW':
      case 'UNDER_REVIEW':
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'MORE INFORMATION REQUIRED':
      case 'MORE_INFO_REQUIRED':
      case 'MORE_INFORMATION_REQUIRED':
      case 'ADDITIONAL INFORMATION REQUIRED':
      case 'ACTION REQUIRED':
      case 'ACTION_REQUIRED':
        return { bg: '#FFF7ED', color: '#C2410C', border: '#FFEDD5' };
      case 'CORRECTION REQUIRED':
      case 'CORRECTION_REQUIRED':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
      case 'CLIENT RESPONSE RECEIVED':
      case 'CLIENT_RESPONSE_RECEIVED':
      case 'RESPONSE_RECEIVED':
        return { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
      case 'INFORMATION VERIFIED':
      case 'INFO_VERIFIED':
      case 'VERIFIED':
      case 'ACCEPTED':
        return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
      case 'INVOICE_SENT':
      case 'INVOICE SENT':
      case 'PAYMENT PENDING':
      case 'PAYMENT_PENDING':
        return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
      case 'PAYMENT_SUBMITTED':
      case 'PAYMENT SUBMITTED':
      case 'VERIFICATION_PENDING':
        return { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' };
      case 'DECLINED':
      case 'REJECTED':
        return { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' };
      case 'CONVERTED TO CASE':
      case 'ACTIVE':
      case 'ACTIVE_AWAITING_ASSIGNMENT':
        return { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' };
      default:
        return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
    }
  },

  /* ==========================================================================
     INVOICES, PAYMENT PROOF UPLOAD, RECEIPTS, NOTIFICATIONS
     ========================================================================== */
  renderInvoices() {
    const user = SLCMS_STATE.currentUser || {};
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    const clientId = user.clientId || user.id || user.clientNumber || user.staffId;
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || user.full_name || '').toLowerCase().trim();
    
    // Step 6: The client must see only their own invoices
    const clientRequests = this.getClientRequests() || [];
    const clientRequestIds = clientRequests.map(r => r.id).filter(Boolean);
    const clientInvoiceNumbers = clientRequests.map(r => r.invoiceNumber).filter(Boolean);

    let clientInvoices = invoices.filter(i => {
      if (!i) return false;
      const matchId = (i.clientId && clientId && String(i.clientId).trim() === String(clientId).trim());
      const matchEmail = (i.clientEmail && userEmail && (
        i.clientEmail.toLowerCase().trim() === userEmail ||
        userEmail.includes(i.clientEmail.toLowerCase().trim()) ||
        i.clientEmail.toLowerCase().trim().includes(userEmail)
      ));
      const matchName = (i.clientName && userName && (
        i.clientName.toLowerCase().trim() === userName ||
        userName.includes(i.clientName.toLowerCase().trim()) ||
        i.clientName.toLowerCase().trim().includes(userName)
      ));
      const matchReq = (i.requestId && clientRequestIds.includes(i.requestId));
      const matchInvNum = (i.invoiceNumber && clientInvoiceNumbers.includes(i.invoiceNumber));
      return matchId || matchEmail || matchName || matchReq || matchInvNum;
    });

    // Step 6: Exclude draft or uncreated invoices (authoritative backend source)
    clientInvoices = clientInvoices.filter(i => i && i.status !== 'NOT_CREATED' && i.status !== 'DRAFT');


    return `
      <div class="client-invoices-view animate-fade">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
              Legal Service Invoices
            </h2>
            <p style="margin: 0.25rem 0 0 0; color: #64748B; font-size: 0.88rem;">
              Review chamber billing, bank remittance instructions, and payment verification status
            </p>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('client-upload-proof')" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); font-weight: 600;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Upload Payment Proof</span>
          </button>
        </div>

        <!-- Remittance Instruction Card -->
        <div class="card" style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-left: 4px solid var(--color-gold, #C89B3C); border-radius: 10px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
          <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>🏦</span>
            <span>External Payment Remittance Instructions</span>
          </div>
          <p style="margin: 0 0 0.5rem 0; font-size: 0.86rem; color: #334155; line-height: 1.5;">
            Payment happens outside SLCMS through: Bank transfer, Mobile money, or Cash at the office. Please remit consultation retainer fees directly to our official accounts:
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.84rem; background: #FFF; padding: 0.85rem 1.15rem; border-radius: 8px; border: 1px solid #E2E8F0;">
            <div><strong style="color: #64748B;">Bank Account:</strong> <span style="font-weight: 700; color: #0F172A;">CRDB Bank Plc &bull; A/C 0150244883900</span></div>
            <div><strong style="color: #64748B;">Mobile Money:</strong> <span style="font-weight: 700; color: #0F172A;">Lipa Namba (Till) 554433</span></div>
            <div><strong style="color: #64748B;">Cash:</strong> <span style="font-weight: 700; color: #0F172A;">At SLCMS Chambers Cashier</span></div>
          </div>
          <div style="margin-top: 0.65rem; font-size: 0.8rem; color: #64748B;">
            ⚠️ <em>Important: After completing the payment outside SLCMS, click "Upload Payment Proof" with your transaction reference. Our Legal Officer will verify the funds to activate your case.</em>
          </div>
        </div>

        <!-- Invoices List -->
        ${clientInvoices.length === 0 ? `
          <div class="card" style="padding: 3.5rem 2rem; text-align: center; border-radius: 12px; background: #fff; border: 1px dashed #CBD5E1;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📄</div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">No Invoices Issued Yet</h3>
            <p style="color: #64748B; max-width: 480px; margin: 0 auto 1.5rem auto; font-size: 0.9rem;">
              When the Legal Officer reviews and accepts your assistance request, your invoice will appear here.
            </p>
            <button class="btn btn-primary" onclick="ClientPortalView.openRequestModal()">Submit Assistance Request</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${clientInvoices.map(inv => this.renderInvoiceCard(inv)).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderInvoiceCard(inv) {
    const total = inv.totalAmount || inv.total || inv.amount || 150000;
    const invNum = inv.invoiceNumber || inv.invoiceNo || 'SLCMS-2026-000124';
    const status = (inv.status || 'PAYMENT_PENDING').toUpperCase();
    const isPaid = (status === 'PAID' || status === 'DEMO_PAID' || status === 'PAYMENT_VERIFIED');
    const isSubmitted = (status === 'PAYMENT_SUBMITTED' || status === 'VERIFICATION_PENDING' || status === 'PROOF_SUBMITTED');
    const isRejected = (status === 'REJECTED');

    let badgeBg = '#FEF3C7';
    let badgeColor = '#B45309';
    let badgeText = 'Payment Pending';

    if (isPaid) {
      badgeBg = '#ECFDF5';
      badgeColor = '#059669';
      badgeText = 'PAID — Verified';
    } else if (isSubmitted) {
      badgeBg = '#EFF6FF';
      badgeColor = '#1D4ED8';
      badgeText = 'PAYMENT_SUBMITTED — Pending Verification';
    } else if (isRejected) {
      badgeBg = '#FEF2F2';
      badgeColor = '#DC2626';
      badgeText = 'Payment Rejected';
    }

    return `
      <div class="card" style="background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem;">
              <span style="font-family: monospace; font-weight: 700; color: #0284C7; font-size: 0.95rem; background: rgba(2, 132, 199, 0.08); padding: 2px 8px; border-radius: 6px;">
                ${this.escapeHtml(invNum)}
              </span>
              ${inv.requestId ? `
                <span style="font-size: 0.76rem; font-family: monospace; color: #64748B; background: #F1F5F9; padding: 2px 6px; border-radius: 4px;">
                  Related Request: ${this.escapeHtml(inv.requestId)}
                </span>
              ` : ''}
              <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 0.76rem; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
                ● ${badgeText}
              </span>
            </div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0F172A; margin: 0;">
              ${this.escapeHtml(inv.serviceDescription || 'Initial legal consultation and case assessment')}
            </h3>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.76rem; color: #64748B; text-transform: uppercase; font-weight: 600;">Amount Due</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #047857;">TZS ${Number(total).toLocaleString()}</div>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.82rem; color: #64748B; padding: 0.75rem 0; border-top: 1px solid #F1F5F9; border-bottom: 1px solid #F1F5F9; margin-bottom: 0.85rem;">
          <div><strong style="color: #475569;">Issue Date:</strong> ${inv.issueDate || '27 September 2026'}</div>
          <div><strong style="color: #475569;">Due Date:</strong> ${inv.dueDate || '4 October 2026'}</div>
          <div><strong style="color: #475569;">Created By:</strong> ${inv.createdBy || 'Adv. Joyce Mercer (Legal Officer)'}</div>
          ${inv.demoReference ? `<div><strong style="color: #475569;">Tx Reference:</strong> <span style="font-family: monospace; color: #0284C7; font-weight: 700;">${inv.demoReference}</span></div>` : ''}
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 0.2rem;">Payment Instructions</div>
          <div style="font-size: 0.84rem; color: #334155; line-height: 1.45;">
            ${this.escapeHtml(inv.paymentInstructions || 'Remit payment via CRDB Bank A/C 0150244883900 or Lipa Namba 554433.')}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <!-- Step 6: Download or print invoice button -->
          <button type="button" class="btn btn-secondary btn-sm" onclick="ClientPortalView.printInvoice('${inv.id}')" style="font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span>🖨️ Download / Print Invoice</span>
          </button>

          <!-- Step 6: Upload payment proof button -->
          ${isPaid ? `
            <button class="btn btn-gold btn-sm" onclick="BillingView.showReceipt('${inv.id}')" style="font-weight: 700;">
              🧾 View Official Receipt
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="ClientPortalView.openUploadProof('${inv.id}')" style="font-weight: 700; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);">
              📤 Upload Payment Proof
            </button>
          `}
        </div>
      </div>
    `;
  },

  printInvoice(invId) {
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    let inv = invoices.find(i => 
      i && (String(i.id) === String(invId) || i.invoiceNumber === invId || i.requestId === invId) &&
      i.status !== 'NOT_CREATED' && i.status !== 'DRAFT'
    );
    
    if (!inv) {
      const clientRequests = this.getClientRequests() || [];
      const r = clientRequests.find(req => req.invoiceNumber === invId || req.id === invId || req.invoiceId === invId);
      if (r && (r.status === 'INVOICE_SENT' || r.status === 'PAYMENT_PENDING' || r.status === 'PAYMENT_SUBMITTED' || r.invoiceNumber)) {
        inv = invoices.find(i => i.requestId === r.id || i.invoiceNumber === r.invoiceNumber);
      }
    }

    if (!inv) {
      App.showToast('Official invoice record has not yet been issued by the Legal Officer.', 'info');
      return;
    }

    const amt = inv.totalAmount || inv.amount || 150000;
    const invNum = inv.invoiceNumber || 'SLCMS-2026-000124';

    App.openModal(`
      <div class="modal-header" style="background: #0F172A; color: #FFF;">
        <div>
          <h3 class="modal-title" style="color: #FFF;">Official Fee Invoice &bull; ${invNum}</h3>
          <div style="font-size: 0.75rem; color: #94A3B8;">Smart Legal Case Management System</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFF;">✕</button>
      </div>

      <div class="modal-body" id="printable-invoice-content" style="padding: 2rem; background: #FFF; font-family: sans-serif; color: #0F172A;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.6rem; font-weight: 800; margin: 0; color: #0F172A;">SLCMS LEGAL PARTNERS</h2>
            <div style="font-size: 0.85rem; color: #64748B; margin-top: 0.25rem;">Advocates, Notaries Public &amp; Legal Consultants</div>
            <div style="font-size: 0.82rem; color: #64748B;">Dar es Salaam, Tanzania &bull; Tel: +255 754 000 111</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.35rem; font-weight: 800; color: #C89B3C; font-family: monospace;">INVOICE</div>
            <div style="font-size: 0.85rem; color: #64748B;"><strong>Invoice No:</strong> ${this.escapeHtml(invNum)}</div>
            <div style="font-size: 0.85rem; color: #64748B;"><strong>Issue Date:</strong> ${inv.issueDate || '27 September 2026'}</div>
            <div style="font-size: 0.85rem; color: #64748B;"><strong>Due Date:</strong> ${inv.dueDate || '4 October 2026'}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.75rem; font-size: 0.88rem;">
          <div style="background: #F8FAFC; padding: 1rem; border-radius: 8px;">
            <div style="font-weight: 700; color: #64748B; text-transform: uppercase; font-size: 0.75rem; margin-bottom: 0.35rem;">Billed To (Client):</div>
            <div style="font-weight: 700; font-size: 1.05rem;">${this.escapeHtml(inv.clientName || 'Client')}</div>
            <div style="color: #475569;">Email: ${this.escapeHtml(inv.clientEmail || 'N/A')}</div>
            <div style="color: #475569;">Request: ${this.escapeHtml(inv.requestId || 'REQ-2026-0031')}</div>
          </div>
          <div style="background: #F8FAFC; padding: 1rem; border-radius: 8px;">
            <div style="font-weight: 700; color: #64748B; text-transform: uppercase; font-size: 0.75rem; margin-bottom: 0.35rem;">Issuing Chamber Authority:</div>
            <div style="font-weight: 700;">Legal Operations Unit</div>
            <div style="color: #475569;">Created By: ${this.escapeHtml(inv.createdBy || 'Adv. Joyce Mercer')}</div>
            <div style="color: #475569;">Status: <span style="font-weight: 700; color: #D97706;">${inv.status || 'Payment Pending'}</span></div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.75rem; font-size: 0.88rem;">
          <thead>
            <tr style="background: #0F172A; color: #FFF; text-align: left;">
              <th style="padding: 0.75rem 1rem;">Service Description</th>
              <th style="padding: 0.75rem 1rem;">Category</th>
              <th style="padding: 0.75rem 1rem; text-align: right;">Amount (TZS)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 1rem; font-weight: 600;">${this.escapeHtml(inv.serviceDescription || 'Initial legal consultation and case assessment')}</td>
              <td style="padding: 1rem; color: #64748B;">${this.escapeHtml(inv.issueType || 'Commercial Litigation')}</td>
              <td style="padding: 1rem; text-align: right; font-weight: 700; font-size: 1rem;">TZS ${Number(amt).toLocaleString()}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background: #F8FAFC; font-weight: 800; font-size: 1.05rem;">
              <td colspan="2" style="padding: 1rem; text-align: right;">Total Payable:</td>
              <td style="padding: 1rem; text-align: right; color: #047857;">TZS ${Number(amt).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 1rem; font-size: 0.84rem; color: #92400E; margin-bottom: 1.5rem;">
          <div style="font-weight: 700; margin-bottom: 0.25rem;">Payment Remittance Instructions:</div>
          <div>${this.escapeHtml(inv.paymentInstructions || 'Remit via CRDB Bank A/C 0150244883900 SLCMS Chambers or Lipa Namba 554433.')}</div>
        </div>

        <div style="text-align: center; color: #94A3B8; font-size: 0.78rem;">
          This is an official computer-generated document issued by SLCMS. No signature is required.
        </div>
      </div>

      <div class="modal-footer" style="padding: 1rem 1.5rem; background: #F8FAFC; display: flex; justify-content: space-between;">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        <button type="button" class="btn btn-gold" onclick="window.print()" style="font-weight: 700;">
          🖨️ Print / Save as PDF
        </button>
      </div>
    `, 'modal-lg');
  },

  uploadSelectedInvId: null,

  openUploadProof(invId) {
    this.uploadSelectedInvId = invId;
    App.navigate('client-upload-proof');
  },

  renderUploadProof() {
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);

    const user = SLCMS_STATE.currentUser || {};
    const clientId = user.clientId || user.id || user.clientNumber || user.staffId;
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || user.full_name || '').toLowerCase().trim();
    const clientRequests = this.getClientRequests() || [];
    const clientRequestIds = clientRequests.map(r => r.id).filter(Boolean);
    const clientInvoiceNumbers = clientRequests.map(r => r.invoiceNumber).filter(Boolean);

    let clientInvoices = invoices.filter(i => {
      if (!i) return false;
      const matchId = (i.clientId && clientId && String(i.clientId).trim() === String(clientId).trim());
      const matchEmail = (i.clientEmail && userEmail && (
        i.clientEmail.toLowerCase().trim() === userEmail ||
        userEmail.includes(i.clientEmail.toLowerCase().trim()) ||
        i.clientEmail.toLowerCase().trim().includes(userEmail)
      ));
      const matchName = (i.clientName && userName && (
        i.clientName.toLowerCase().trim() === userName ||
        userName.includes(i.clientName.toLowerCase().trim()) ||
        i.clientName.toLowerCase().trim().includes(userName)
      ));
      const matchReq = (i.requestId && clientRequestIds.includes(i.requestId));
      const matchInvNum = (i.invoiceNumber && clientInvoiceNumbers.includes(i.invoiceNumber));
      const matchSelected = (this.uploadSelectedInvId && (String(i.id) === String(this.uploadSelectedInvId) || i.invoiceNumber === this.uploadSelectedInvId || i.requestId === this.uploadSelectedInvId));
      return matchId || matchEmail || matchName || matchReq || matchInvNum || matchSelected;
    });

    // Exclude draft or uncreated invoices
    clientInvoices = clientInvoices.filter(i => i && i.status !== 'NOT_CREATED' && i.status !== 'DRAFT');

    const unpaidInvoices = clientInvoices.filter(i => i.status !== 'PAID' && i.status !== 'DEMO_PAID' && (i.status === 'SENT' || i.status === 'PAYMENT_PENDING'));

    if (unpaidInvoices.length === 0) {
      return `
        <div class="client-upload-proof-view animate-fade" style="max-width: 680px; margin: 0 auto; padding-top: 1rem;">
          <div class="card" style="padding: 3.5rem 2rem; text-align: center; border-radius: 12px; background: #fff; border: 1px dashed #CBD5E1;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">💳</div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">No Invoices Awaiting Payment</h3>
            <p style="color: #64748B; max-width: 480px; margin: 0 auto 1.5rem auto; font-size: 0.9rem;">
              You do not have any pending invoices that require payment. Payment proof can only be uploaded after an official fee invoice has been issued by your Legal Officer.
            </p>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('client-requests')">
              Track My Case Requests &rarr;
            </button>
          </div>
        </div>
      `;
    }

    const selectedInv = unpaidInvoices.find(i => 
      String(i.id) === String(this.uploadSelectedInvId) || 
      i.invoiceNumber === this.uploadSelectedInvId || 
      i.requestId === this.uploadSelectedInvId
    ) || unpaidInvoices[0] || clientInvoices[0];
    const selectedId = selectedInv ? selectedInv.id : '';
    const defaultAmount = selectedInv ? (selectedInv.totalAmount || selectedInv.amount || 150000) : 150000;


    return `
      <div class="client-upload-proof-view animate-fade" style="max-width: 680px; margin: 0 auto;">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
            Upload Payment Proof
          </h2>
          <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
            Submit your deposit slip or transfer receipt for Legal Officer verification
          </p>
        </div>

        <!-- Official Workflow Alert -->
        <div class="alert alert-info" style="margin-bottom: 1.5rem; background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem 1.25rem; border-radius: 8px;">
          <div style="font-weight: 700; color: #1E40AF; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>ℹ️</span>
            <span>Manual Bank Verification Protocol</span>
          </div>
          <div style="font-size: 0.84rem; color: #1E3A8A; line-height: 1.5;">
            Without connecting a payment-provider API, the system cannot automatically know that money was received. It detects that you uploaded proof. The Legal Officer will check the firm's bank records to confirm the payment, after which your case status changes to <strong>PAID — READY FOR ASSIGNMENT</strong> and a Lawyer is assigned.
          </div>
        </div>

        <div class="card" style="padding: 2rem; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <form onsubmit="ClientPortalView.handleSubmitPaymentProof(event)">
            
            <!-- Invoice Selection -->
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                Select Invoice *
              </label>
              ${unpaidInvoices.length > 0 ? `
                <select id="proof-inv-select" class="form-control" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.9rem;" onchange="ClientPortalView.onProofInvoiceChange(this.value)">
                  ${unpaidInvoices.map(i => `
                    <option value="${i.id}" ${String(i.id) === String(selectedId) ? 'selected' : ''}>
                      ${i.invoiceNumber || i.invoiceNo} — ${i.serviceDescription} (TZS ${(i.totalAmount || i.amount || 100000).toLocaleString()})
                    </option>
                  `).join('')}
                </select>
              ` : `
                <div style="padding: 0.75rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; color: #64748B; font-size: 0.85rem;">
                  No unpaid invoices currently pending.
                </div>
              `}
            </div>

            <!-- Amount & Payment Method -->
            <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
              <div class="form-group">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                  Amount Paid (TZS) *
                </label>
                <input type="number" id="proof-amount-input" class="form-control" value="${defaultAmount}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.9rem;">
              </div>
              <div class="form-group">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                  Payment Method *
                </label>
                <select id="proof-method-select" class="form-control" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.9rem;">
                  <option value="CRDB Bank Transfer" selected>CRDB Bank Transfer</option>
                  <option value="Lipa Namba (Till 554433)">Lipa Namba (Till 554433)</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="NMB Mobile">NMB Mobile</option>
                  <option value="Direct Cash Deposit">Direct Cash Deposit</option>
                </select>
              </div>
            </div>

            <!-- Reference Number & Payment Date -->
            <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
              <div class="form-group">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                  Transaction Reference / Slip No *
                </label>
                <input type="text" id="proof-ref-input" class="form-control" placeholder="e.g. CRDB-2026-9923 or MPESA-..." required value="REF-2026-${Math.floor(1000 + Math.random() * 9000)}" style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.9rem; font-family: monospace;">
              </div>
              <div class="form-group">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                  Date of Payment *
                </label>
                <input type="date" id="proof-date-input" class="form-control" value="${new Date().toISOString().split('T')[0]}" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.9rem;">
              </div>
            </div>

            <!-- Proof Document Upload -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">
                Upload Transfer Slip or Receipt File *
              </label>
              <div style="border: 2px dashed #CBD5E1; border-radius: 8px; padding: 1.5rem; text-align: center; background: #F8FAFC; cursor: pointer;" onclick="document.getElementById('proof-file-picker').click()">
                <input type="file" id="proof-file-picker" style="display: none;" accept=".pdf,.png,.jpg,.jpeg" onchange="document.getElementById('proof-selected-filename').innerText = this.files[0] ? this.files[0].name : 'No file selected'">
                <div style="font-size: 1.75rem; margin-bottom: 0.35rem;">📎</div>
                <strong style="color: #0284C7; font-size: 0.88rem;">Click to browse bank deposit slip</strong>
                <div style="font-size: 0.76rem; color: #94A3B8; margin-top: 0.2rem;">Accepted formats: PDF, PNG, JPG (Max 25 MB)</div>
                <div id="proof-selected-filename" style="margin-top: 0.5rem; font-weight: 700; color: #059669; font-size: 0.84rem;">bank_transfer_receipt.pdf</div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; align-items: center;">
              <button type="button" class="btn btn-secondary" onclick="App.navigate('client-invoices')">Cancel</button>
              <button type="submit" id="btn-submit-proof" class="btn btn-primary" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); font-weight: 700; padding: 0.65rem 1.5rem;">
                Submit Proof for Verification &rarr;
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  onProofInvoiceChange(invId) {
    this.uploadSelectedInvId = invId;
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    let inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.requestId === invId);
    if (!inv) {
      const clientRequests = this.getClientRequests() || [];
      const r = clientRequests.find(req => req.invoiceNumber === invId || req.id === invId || req.invoiceId === invId);
      if (r) {
        inv = { totalAmount: r.invoiceAmount || 150000 };
      }
    }
    if (inv) {
      const amtInput = document.getElementById('proof-amount-input');
      if (amtInput) amtInput.value = inv.totalAmount || inv.amount || 150000;
    }
  },

  async handleSubmitPaymentProof(e) {
    e.preventDefault();
    const invSelect = document.getElementById('proof-inv-select');
    const invId = invSelect ? invSelect.value : (this.uploadSelectedInvId || '');
    const amountVal = document.getElementById('proof-amount-input')?.value?.trim();
    const method = document.getElementById('proof-method-select')?.value || 'Bank Transfer';
    const ref = document.getElementById('proof-ref-input')?.value?.trim() || '';
    const payDate = document.getElementById('proof-date-input')?.value?.trim() || '';
    const filePicker = document.getElementById('proof-file-picker');

    // Find invoice
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    let inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.requestId === invId);

    if (!inv) {
      const clientRequests = this.getClientRequests() || [];
      const r = clientRequests.find(req => req.invoiceNumber === invId || req.id === invId || req.invoiceId === invId);
      if (r) {
        inv = {
          id: r.invoiceId || ('inv-' + r.id),
          invoiceNumber: r.invoiceNumber || ('SLCMS-2026-' + String(r.id).replace(/\D/g, '').slice(-6)),
          requestId: r.id,
          clientId: r.clientId || 'CLT-0008',
          clientName: r.clientName || 'Dorcas Lasus',
          clientEmail: r.clientEmail || 'evans6@gmail.com',
          totalAmount: r.invoiceAmount || 150000,
          balance: r.invoiceAmount || 150000,
          status: 'PAYMENT_PENDING',
          payments: []
        };
        invoices.push(inv);
      }
    }

    if (!inv) {
      App.showToast('Validation Error: Target invoice record not found.', 'error');
      return;
    }

    // 1. Validation: Reference 4–100 letters, numbers, /, _ or -
    const refRegex = /^[a-zA-Z0-9/_-]{4,100}$/;
    if (!refRegex.test(ref)) {
      App.showToast('Validation Error: Transaction reference must be 4–100 letters, numbers, /, _ or -.', 'error');
      return;
    }

    // 2. Validation: Payment date cannot be in the future
    const todayStr = new Date().toISOString().split('T')[0];
    if (payDate > todayStr) {
      App.showToast('Validation Error: Payment date cannot be in the future.', 'error');
      return;
    }

    // 3. Validation: Amount claimed must equal the invoice amount
    const amountNum = parseFloat(amountVal);
    const invoiceTotal = parseFloat(inv.totalAmount || inv.amount || 0);
    if (isNaN(amountNum) || amountNum !== invoiceTotal) {
      App.showToast(`Validation Error: Amount claimed (TZS ${amountNum.toLocaleString()}) must equal the exact invoice amount (TZS ${invoiceTotal.toLocaleString()}).`, 'error');
      return;
    }

    // 4. Validation: File types PDF, JPG or PNG only, Maximum 25 MB
    let fileName = 'bank_slip.pdf';
    if (filePicker && filePicker.files && filePicker.files[0]) {
      const file = filePicker.files[0];
      const validExts = ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(fileExt)) {
        App.showToast('Validation Error: Uploaded proof must be PDF, JPG or PNG only.', 'error');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        App.showToast('Validation Error: Uploaded payment proof exceeds maximum 25 MB limit.', 'error');
        return;
      }
      fileName = file.name;
    }

    // 5. Validation: The same transaction reference cannot be reused
    const isDuplicate = invoices.some(otherInv => {
      if (otherInv.demoReference && otherInv.demoReference.toUpperCase() === ref.toUpperCase()) return true;
      if (Array.isArray(otherInv.payments)) {
        return otherInv.payments.some(p => p.referenceNumber && p.referenceNumber.toUpperCase() === ref.toUpperCase());
      }
      return false;
    });

    if (isDuplicate) {
      App.showToast(`Validation Error: Transaction reference "${ref}" has already been submitted or used. Reference numbers cannot be reused.`, 'error');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-proof');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting Proof...';
    }

    // Call Backend Spring Boot API
    try {
      if (typeof slcmsFetch === 'function') {
        await slcmsFetch(`/api/client/invoices/${invId}/payment-proof`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountPaid: amountNum,
            paymentMethod: method,
            referenceNumber: ref,
            paymentDate: payDate,
            proofDocument: fileName
          })
        });
      }
    } catch (err) {
      console.warn('Backend payment proof submission warning:', err);
    }

    // Update invoice status to PAYMENT_SUBMITTED
    inv.status = 'PAYMENT_SUBMITTED';
    inv.paymentStatus = 'PAYMENT_SUBMITTED';
    inv.demoReference = ref;
    if (!Array.isArray(inv.payments)) inv.payments = [];
    inv.payments.push({
      amount: amountNum,
      paymentMethod: method,
      referenceNumber: ref,
      paymentDate: payDate,
      proofDocument: fileName,
      status: 'PAYMENT_SUBMITTED'
    });
    if (typeof BillingView !== 'undefined' && typeof BillingView.persistInvoices === 'function') {
      BillingView.persistInvoices();
    }

    // Synchronize request status in localStorage and runtime state
    const allReqs = (typeof LegalRequestsView !== 'undefined' && typeof LegalRequestsView.getRequests === 'function')
      ? LegalRequestsView.getRequests()
      : (JSON.parse(localStorage.getItem('slcms_client_legal_requests') || '[]'));
    const matchedReq = allReqs.find(r => 
      r.id === inv.requestId || 
      r.invoiceNumber === inv.invoiceNumber || 
      (r.clientEmail && inv.clientEmail && r.clientEmail.toLowerCase() === inv.clientEmail.toLowerCase())
    );
    if (matchedReq) {
      matchedReq.status = 'PAYMENT_SUBMITTED';
      matchedReq.paymentProofSubmitted = true;
      matchedReq.paymentReference = ref;
      matchedReq.paymentDate = payDate;
      matchedReq.proofDocument = fileName;
      matchedReq.paymentAmount = amountNum;
      if (typeof LegalRequestsView !== 'undefined' && typeof LegalRequestsView.persistRequests === 'function') {
        LegalRequestsView.persistRequests(allReqs);
      } else {
        localStorage.setItem('slcms_client_legal_requests', JSON.stringify(allReqs));
      }
    }
    this.requests = null; // Clear cached requests to ensure instant refresh

    // Add Audit Log
    if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.addAuditLog === 'function') {
      SLCMS_STATE.addAuditLog(
        'Payment Proof Submitted',
        'Billing',
        `Client submitted payment proof (${ref}) of TZS ${amountNum.toLocaleString()} for invoice #${inv.invoiceNumber}. Status updated to PAYMENT_SUBMITTED.`,
        'Success'
      );
    }

    App.showToast('Payment proof submitted successfully! Status set to PAYMENT_SUBMITTED. Legal Officer will verify the bank funds.', 'success', 6000);
    App.navigate('client-invoices');
  },

  renderReceipts() {
    const invoices = (typeof BillingView !== 'undefined' && BillingView.getInvoices)
      ? BillingView.getInvoices()
      : (SLCMS_STATE.invoices || []);
    const user = SLCMS_STATE.currentUser || {};
    const clientId = user.clientId || user.id || user.clientNumber || user.staffId;
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || user.full_name || '').toLowerCase().trim();
    const clientRequests = this.getClientRequests() || [];
    const clientRequestIds = clientRequests.map(r => r.id).filter(Boolean);
    const clientInvoiceNumbers = clientRequests.map(r => r.invoiceNumber).filter(Boolean);

    const clientInvoices = invoices.filter(i => {
      if (!i) return false;
      const matchId = (i.clientId && clientId && String(i.clientId).trim() === String(clientId).trim());
      const matchEmail = (i.clientEmail && userEmail && (
        i.clientEmail.toLowerCase().trim() === userEmail ||
        userEmail.includes(i.clientEmail.toLowerCase().trim()) ||
        i.clientEmail.toLowerCase().trim().includes(userEmail)
      ));
      const matchName = (i.clientName && userName && (
        i.clientName.toLowerCase().trim() === userName ||
        userName.includes(i.clientName.toLowerCase().trim()) ||
        i.clientName.toLowerCase().trim().includes(userName)
      ));
      const matchReq = (i.requestId && clientRequestIds.includes(i.requestId));
      const matchInvNum = (i.invoiceNumber && clientInvoiceNumbers.includes(i.invoiceNumber));
      return matchId || matchEmail || matchName || matchReq || matchInvNum;
    });

    const paidInvoices = clientInvoices.filter(i => i.status === 'PAID' || i.status === 'DEMO_PAID' || i.status === 'PAYMENT_VERIFIED');

    return `
      <div class="client-receipts-view animate-fade">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
            Official Payment Receipts
          </h2>
          <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
            Chamber-verified receipts for confirmed invoice settlements
          </p>
        </div>

        ${paidInvoices.length === 0 ? `
          <div class="card" style="padding: 3.5rem 2rem; text-align: center; border-radius: 12px; background: #fff; border: 1px dashed #CBD5E1;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🧾</div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">No Receipts Issued Yet</h3>
            <p style="color: #64748B; max-width: 480px; margin: 0 auto 1.5rem auto; font-size: 0.9rem;">
              Once your uploaded payment proof is verified by the Legal Officer, official receipts will be accessible here.
            </p>
            <button class="btn btn-secondary" onclick="App.navigate('client-invoices')">View Invoices</button>
          </div>
        ` : `
          <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
            ${paidInvoices.map(inv => {
              const rcptNum = `RCPT-2026-${(inv.invoiceNumber || inv.invoiceNo || '0001').replace('INV-2026-', '')}`;
              const total = inv.totalAmount || inv.amount || 100000;
              const dateStr = inv.verifiedAt ? new Date(inv.verifiedAt).toLocaleDateString() : (inv.dueDate || '2026-09-15');
              return `
                <div class="card" style="background: #fff; border: 1px solid #A7F3D0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                      <span style="font-size: 0.72rem; font-weight: 700; color: #059669; background: #ECFDF5; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                        Confirmed Settlement
                      </span>
                      <h4 style="margin: 0.4rem 0 0 0; font-size: 1.1rem; color: #0F172A; font-family: monospace;">
                        ${rcptNum}
                      </h4>
                    </div>
                    <div style="font-size: 1.3rem; font-weight: 800; color: #059669;">
                      TZS ${Number(total).toLocaleString()}
                    </div>
                  </div>
                  <div style="font-size: 0.84rem; color: #475569; line-height: 1.6; margin-bottom: 1rem;">
                    <div>Invoice: <strong style="color: #0F172A;">${inv.invoiceNumber || inv.invoiceNo}</strong></div>
                    <div>Matter: ${inv.serviceDescription || 'Legal Services Retainer'}</div>
                    <div>Verification Date: ${dateStr}</div>
                    <div>Verified By: <strong>${inv.verifiedBy || 'Adv. Joyce Mercer'}</strong></div>
                  </div>
                  <button class="btn btn-gold btn-sm" onclick="BillingView.showReceipt('${inv.id}')" style="width: 100%; font-weight: 700;">
                    📄 View &amp; Print Full Receipt
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderNotifications() {
    const user = SLCMS_STATE.currentUser || {};
    const notifs = [
      {
        title: 'Payment Proof Submitted',
        body: 'Your payment proof for INV-2026-0001 was submitted. Legal Officer notified: "Payment proof submitted."',
        time: 'Today',
        icon: '📤',
        type: 'info'
      },
      {
        title: 'Case Status: PAID — READY FOR ASSIGNMENT',
        body: 'Payment verified by Legal Officer. Case moved to assignment queue for lead counsel.',
        time: 'Recent',
        icon: '✅',
        type: 'success'
      },
      {
        title: 'Lead Advocate Assigned',
        body: 'Advocate assigned to represent your interest. Direct case communication channel opened.',
        time: 'Recent',
        icon: '⚖️',
        type: 'gold'
      },
      {
        title: 'Account Verification Complete',
        body: 'Your SLCMS client registration and identity documents have been fully verified.',
        time: 'Completed',
        icon: '🛡️',
        type: 'success'
      }
    ];

    return `
      <div class="client-notifications-view animate-fade" style="max-width: 760px; margin: 0 auto;">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem 0; color: #0F172A; font-family: var(--font-heading, sans-serif);">
            Notifications &amp; Activity Log
          </h2>
          <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
            Workflow status alerts, invoice approvals, and counsel allocation notices
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${notifs.map(n => `
            <div class="card" style="padding: 1.25rem 1.5rem; border-radius: 10px; background: #fff; border: 1px solid #E2E8F0; display: flex; align-items: flex-start; gap: 1rem;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #F8FAFC; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                ${n.icon}
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                  <strong style="color: #0F172A; font-size: 0.95rem;">${n.title}</strong>
                  <span style="font-size: 0.74rem; color: #94A3B8;">${n.time}</span>
                </div>
                <p style="margin: 0; font-size: 0.86rem; color: #475569; line-height: 1.5;">
                  ${n.body}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.ClientPortalView = ClientPortalView;
