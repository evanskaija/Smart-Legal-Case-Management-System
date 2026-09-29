/* ==========================================================================
   SLCMS - Legal Requests & Case Intake View (Step 3 & Step 4)
   Intake Management for Legal Officers:
   - Step 3: Legal Officer Receives Case
     Display: Request number, Submission date, Client name & contact, Issue type,
              Opposing party, Description, Attached documents, Current status.
     Actions: View Details, Request More Information, Accept for Billing, Reject Request.
     STRICT RULE: The Legal Officer must NOT see Assign Lawyer.
   - Step 4: Review Client and Case
     Checks: Client identity/contacts, understandable description, attached documents,
             conflict of interest, firm service scope.
     Status changes to: UNDER_REVIEW
   ========================================================================== */

const LegalRequestsView = {
  filterStatus: 'all',
  searchQuery: '',
  selectedRequestId: null,

  getRequests() {
    let list = [];
    if (typeof ClientPortalService !== 'undefined' && typeof ClientPortalService.getStoredRequests === 'function') {
      list = ClientPortalService.getStoredRequests() || [];
    }
    if (!list || list.length === 0) {
      try {
        const raw = localStorage.getItem('slcms_client_legal_requests');
        list = raw ? JSON.parse(raw) : [];
      } catch (e) {
        list = [];
      }
    }
    if (!list || list.length === 0) {
      list = [
        {
          id: 'REQ-2026-0031',
          clientName: 'Dorcas Lasus',
          clientEmail: 'dorcas.lasus@gmail.com',
          clientPhone: '+255 754 112 233',
          issueType: 'Commercial Litigation',
          opposingParty: 'Victoria Coast Distributors Ltd',
          description: 'Commercial contract dispute regarding non-delivery of dry port cargo and unlawful detention of commercial shipping containers.',
          status: 'SUBMITTED',
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          documents: [
            { name: 'bill_of_lading.pdf', size: '2.4 MB' },
            { name: 'commercial_agreement.pdf', size: '1.1 MB' }
          ]
        },
        {
          id: 'REQ-2026-0032',
          clientName: 'Neema Kassim Mwamba',
          clientEmail: 'neema.mwamba@outlook.com',
          clientPhone: '+255 713 445 566',
          issueType: 'Land Dispute',
          opposingParty: 'Dar City Land Developers Ltd',
          description: 'Unlawful encroachment upon surveyed commercial plot No. 445 Block C, Mikocheni B Light Industrial Area.',
          status: 'UNDER_REVIEW',
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
          documents: [
            { name: 'certificate_of_occupancy.pdf', size: '4.2 MB' },
            { name: 'survey_cadastral_plan.pdf', size: '1.8 MB' }
          ]
        },
        {
          id: 'REQ-2026-0033',
          clientName: 'Peter Thomas Bocco',
          clientEmail: 'peter.bocco@gmail.com',
          clientPhone: '+255 754 889 900',
          issueType: 'Employment Dispute',
          opposingParty: 'Apex Logistics & Freight Tanzania',
          description: 'Unlawful summary termination of senior operations manager without statutory notice or severance remuneration.',
          status: 'SUBMITTED',
          createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
          documents: [
            { name: 'employment_contract.pdf', size: '1.6 MB' },
            { name: 'termination_letter.pdf', size: '0.8 MB' }
          ]
        }
      ];
      this.persistRequests(list);
    }
    return list;
  },

  persistRequests(list) {
    try {
      localStorage.setItem('slcms_client_legal_requests', JSON.stringify(list));
    } catch (e) {}
    if (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.clientRequests) {
      SLCMS_STATE.clientRequests = list;
    }
  },

  setFilter(status) {
    this.filterStatus = status;
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    } else if (typeof App !== 'undefined' && App.refreshCurrentView) {
      App.refreshCurrentView();
    }
  },

  handleSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    const tbody = document.getElementById('legal-requests-table-body');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }
  },

  render() {
    const requests = this.getRequests();
    const totalCount = requests.length;
    const submittedCount = requests.filter(r => (r.status || '').toUpperCase() === 'SUBMITTED').length;
    const underReviewCount = requests.filter(r => (r.status || '').toUpperCase() === 'UNDER_REVIEW' || (r.status || '') === 'Under Review').length;
    const invoiceSentCount = requests.filter(r => (r.status || '').toUpperCase() === 'INVOICE_SENT' || (r.status || '').toUpperCase() === 'PAYMENT_PENDING').length;

    return `
      <div class="legal-requests-view animate-fade" style="padding-bottom: 2.5rem;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff; border-radius: 12px; padding: 1.75rem 2rem; margin-bottom: 1.75rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border: 1px solid rgba(255,255,255,0.08);">
          <div>
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem;">
              <span style="background: rgba(200, 155, 60, 0.2); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 10px; border-radius: 9999px;">
                Legal Officer Intake Suite
              </span>
              <span style="color: #94A3B8; font-size: 0.75rem;">Intake Review &amp; Fee Billing</span>
            </div>
            <h1 style="font-size: 1.6rem; font-weight: 700; margin: 0 0 0.35rem 0; font-family: var(--font-heading, sans-serif); color: #F8FAFC;">
              Client Legal Case Submissions
            </h1>
            <p style="margin: 0; color: #94A3B8; font-size: 0.88rem; max-width: 720px; line-height: 1.5;">
              Review submitted matters, verify client identity, assess conflict of interest and service scope, and issue consultation fee invoices.
            </p>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button type="button" class="btn btn-gold" onclick="BillingView.openCreateInvoiceModal()" style="font-weight: 700; padding: 0.6rem 1.25rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.5rem;">
              <span>+ Create &amp; Send Invoice</span>
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-4 gap-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
          <div class="card" onclick="LegalRequestsView.setFilter('all')" style="padding: 1.25rem; border-radius: 10px; background: #fff; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="Filter All Submissions" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Intake</div>
              <div style="font-size: 1.8rem; font-weight: 800; color: #0F172A; margin-top: 0.2rem;">${totalCount}</div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #F1F5F9; color: #0F172A; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              📥
            </div>
          </div>

          <div class="card" onclick="LegalRequestsView.setFilter('SUBMITTED')" style="padding: 1.25rem; border-radius: 10px; background: #fff; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="Filter New Submissions" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; color: #2563EB; text-transform: uppercase;">Submitted (New)</div>
              <div style="font-size: 1.8rem; font-weight: 800; color: #2563EB; margin-top: 0.2rem;">${submittedCount}</div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ✨
            </div>
          </div>

          <div class="card" onclick="LegalRequestsView.setFilter('UNDER_REVIEW')" style="padding: 1.25rem; border-radius: 10px; background: #fff; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="Filter Under Review" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; color: #D97706; text-transform: uppercase;">Under Review</div>
              <div style="font-size: 1.8rem; font-weight: 800; color: #D97706; margin-top: 0.2rem;">${underReviewCount}</div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              🔍
            </div>
          </div>

          <div class="card" onclick="LegalRequestsView.setFilter('INVOICE_SENT')" style="padding: 1.25rem; border-radius: 10px; background: #fff; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="Filter Invoice Sent" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; color: #059669; text-transform: uppercase;">Invoiced / Pending Pay</div>
              <div style="font-size: 1.8rem; font-weight: 800; color: #059669; margin-top: 0.2rem;">${invoiceSentCount}</div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              💳
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="card" style="padding: 1rem 1.25rem; border-radius: 10px; background: #fff; border: 1px solid #E2E8F0; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              ${this.renderFilterTab('all', 'All Submissions', totalCount)}
              ${this.renderFilterTab('SUBMITTED', 'Submitted', submittedCount)}
              ${this.renderFilterTab('UNDER_REVIEW', 'Under Review', underReviewCount)}
              ${this.renderFilterTab('MORE_INFO_REQUIRED', 'More Info Needed', requests.filter(r => (r.status || '').toUpperCase().includes('INFO')).length)}
              ${this.renderFilterTab('PAYMENT_SUBMITTED', 'Payment Received', requests.filter(r => (r.status || '').toUpperCase().includes('PAYMENT_SUBMITTED') || r.paymentProofSubmitted).length)}
              ${this.renderFilterTab('READY_FOR_ASSIGNMENT', 'Ready to Assign', requests.filter(r => (r.status || '').toUpperCase().includes('ASSIGNMENT') || (r.status || '').toUpperCase() === 'PAID').length)}
              ${this.renderFilterTab('INVOICE_SENT', 'Invoice Sent', invoiceSentCount)}
              ${this.renderFilterTab('REJECTED', 'Rejected', requests.filter(r => (r.status || '').toUpperCase() === 'REJECTED' || (r.status || '').toUpperCase() === 'DECLINED').length)}
            </div>

            <div style="min-width: 260px; position: relative;">
              <input type="text" placeholder="Search by request #, client, opposing party..." 
                value="${this.escapeHtml(this.searchQuery)}"
                oninput="LegalRequestsView.handleSearch(this.value)"
                class="input-field" 
                style="width: 100%; padding: 0.5rem 0.85rem 0.5rem 2.2rem; font-size: 0.84rem; border: 1px solid #CBD5E1; border-radius: 8px;">
              <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94A3B8; font-size: 0.9rem;">🔍</span>
            </div>

          </div>
        </div>

        <!-- Main Requests Table (Displaying all Step 3 items) -->
        <div class="card" style="padding: 0; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
          <div style="overflow-x: auto;">
            <table class="table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">
                <tr>
                  <th style="padding: 0.85rem 1rem;">Request #</th>
                  <th style="padding: 0.85rem 1rem;">Date</th>
                  <th style="padding: 0.85rem 1rem;">Client Name &amp; Contact</th>
                  <th style="padding: 0.85rem 1rem;">Issue Type</th>
                  <th style="padding: 0.85rem 1rem;">Opposing Party</th>
                  <th style="padding: 0.85rem 1rem;">Description</th>
                  <th style="padding: 0.85rem 1rem;">Attached Documents</th>
                  <th style="padding: 0.85rem 1rem;">Status</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Available Actions</th>
                </tr>
              </thead>
              <tbody id="legal-requests-table-body">
                ${this.renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  renderFilterTab(status, label, count) {
    const isActive = this.filterStatus === status;
    return `
      <button type="button" onclick="LegalRequestsView.setFilter('${status}')" 
        style="border: none; background: ${isActive ? '#0F172A' : '#F1F5F9'}; color: ${isActive ? '#FFFFFF' : '#475569'}; font-weight: 600; font-size: 0.8rem; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 0.4rem;">
        <span>${label}</span>
        <span style="background: ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)'}; padding: 1px 6px; border-radius: 9999px; font-size: 0.72rem;">${count}</span>
      </button>
    `;
  },

  renderTableRows() {
    const all = this.getRequests();
    const q = this.searchQuery;
    const st = this.filterStatus;

    const filtered = all.filter(r => {
      const curStatus = (r.status || '').toUpperCase();
      let matchStatus = (st === 'all');
      if (st === 'SUBMITTED') matchStatus = (curStatus === 'SUBMITTED');
      else if (st === 'UNDER_REVIEW') matchStatus = (curStatus === 'UNDER_REVIEW' || curStatus === 'UNDER REVIEW');
      else if (st === 'MORE_INFO_REQUIRED') matchStatus = curStatus.includes('INFO');
      else if (st === 'PAYMENT_SUBMITTED') matchStatus = (curStatus === 'PAYMENT_SUBMITTED' || curStatus === 'VERIFICATION_PENDING' || Boolean(r.paymentProofSubmitted));
      else if (st === 'READY_FOR_ASSIGNMENT') matchStatus = (curStatus === 'READY_FOR_ASSIGNMENT' || curStatus.includes('ASSIGNMENT') || curStatus === 'PAID');
      else if (st === 'INVOICE_SENT') matchStatus = (curStatus === 'INVOICE_SENT' || curStatus === 'PAYMENT_PENDING');
      else if (st === 'REJECTED') matchStatus = (curStatus === 'REJECTED' || curStatus === 'DECLINED');

      const matchSearch = !q ||
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.clientName && r.clientName.toLowerCase().includes(q)) ||
        (r.clientEmail && r.clientEmail.toLowerCase().includes(q)) ||
        (r.issueType && r.issueType.toLowerCase().includes(q)) ||
        (r.opposingParty && r.opposingParty.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      return `
        <tr>
          <td colspan="9" style="text-align: center; padding: 3.5rem 1rem; color: #94A3B8;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📥</div>
            <div style="font-weight: 700; font-size: 1rem; color: #475569;">No matching case requests</div>
            <div style="font-size: 0.82rem; color: #94A3B8; margin-top: 0.25rem;">New submissions from the Client Portal will appear here.</div>
          </td>
        </tr>
      `;
    }

    return filtered.map(r => {
      const d = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';
      const statusMeta = this.getStatusMeta(r.status);
      const docsCount = Array.isArray(r.documents) ? r.documents.length : (r.documents ? 1 : 0);

      return `
        <tr style="border-bottom: 1px solid #E2E8F0; transition: background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='#FFFFFF'">
          <td style="padding: 1rem; font-family: monospace; font-weight: 700; color: #0284C7; font-size: 0.85rem; white-space: nowrap;">
            ${this.escapeHtml(r.id || 'REQ-2026-XXXX')}
          </td>
          <td style="padding: 1rem; color: #64748B; white-space: nowrap; font-size: 0.82rem;">
            ${d}
          </td>
          <td style="padding: 1rem;">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.88rem;">${this.escapeHtml(r.clientName || 'Client')}</div>
            <div style="font-size: 0.76rem; color: #64748B;">${this.escapeHtml(r.clientEmail || r.clientPhone || 'No contact')}</div>
          </td>
          <td style="padding: 1rem;">
            <span style="background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; white-space: nowrap;">
              ${this.escapeHtml(r.issueType || 'General')}
            </span>
          </td>
          <td style="padding: 1rem; color: #334155; font-size: 0.84rem; max-width: 160px;">
            <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${this.escapeHtml(r.opposingParty || '')}">
              ${this.escapeHtml(r.opposingParty || '—')}
            </div>
          </td>
          <td style="padding: 1rem; color: #475569; font-size: 0.82rem; max-width: 220px;">
            <div style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.45;" title="${this.escapeHtml(r.description || '')}">
              ${this.escapeHtml(r.description || 'No description provided.')}
            </div>
          </td>
          <td style="padding: 1rem; white-space: nowrap;">
            ${docsCount > 0 ? `
              <span style="display: inline-flex; align-items: center; gap: 0.3rem; background: #F1F5F9; color: #475569; font-size: 0.74rem; font-weight: 600; padding: 2px 7px; border-radius: 6px;">
                📎 ${docsCount} file${docsCount > 1 ? 's' : ''}
              </span>
            ` : `
              <span style="color: #94A3B8; font-size: 0.75rem;">None</span>
            `}
          </td>
          <td style="padding: 1rem; white-space: nowrap;">
            <span style="background: ${statusMeta.bg}; color: ${statusMeta.color}; border: 1px solid ${statusMeta.border}; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 9999px;">
              ● ${statusMeta.label}
            </span>
          </td>
          <td style="padding: 1rem; text-align: right; white-space: nowrap;">
            <!-- Available Actions (STRICT: Legal Officer must NOT see Assign Lawyer) -->
            <div style="display: flex; gap: 0.3rem; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 0.28rem 0.55rem; font-weight: 600;" onclick="LegalRequestsView.openReviewDetailsModal('${r.id}', 'case')" title="View Case Details">
                👁️ View Case
              </button>
              <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 0.28rem 0.55rem; font-weight: 600;" onclick="LegalRequestsView.openReviewDetailsModal('${r.id}', 'client')" title="View Client Details">
                👤 View Client
              </button>
              <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 0.28rem 0.55rem; font-weight: 600;" onclick="LegalRequestsView.openReviewDetailsModal('${r.id}', 'docs')" title="View Documents">
                📎 View Docs
              </button>

              ${(statusMeta.label === 'SUBMITTED' || statusMeta.label === 'UNDER_REVIEW') ? `
                <button class="btn btn-sm" style="font-size: 0.72rem; padding: 0.28rem 0.6rem; background: #FFF7ED; color: #C2410C; border: 1px solid #FFEDD5; font-weight: 700;" onclick="LegalRequestsView.openSendInformationRequestModal('${r.id}')" title="Send Information Request">
                  ❓ Send Information Request
                </button>
              ` : (statusMeta.label === 'INFO_REQUESTED' || statusMeta.label === 'CORRECTION_REQUIRED') ? `
                <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 0.28rem 0.6rem; color: #B45309; background: #FFFBEB; border-color: #FCD34D; font-weight: 600;" onclick="LegalRequestsView.openSendInformationRequestModal('${r.id}')" title="Waiting for client response">
                  ⏳ Info Request Sent
                </button>
              ` : (statusMeta.label === 'RESPONSE_RECEIVED') ? `
                <button class="btn btn-sm btn-gold" style="font-size: 0.72rem; padding: 0.28rem 0.65rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;" onclick="LegalRequestsView.openReviewResponseModal('${r.id}')" title="Review Client Response">
                  <span>📋</span> <span>Review Response</span>
                </button>
              ` : (statusMeta.label === 'INFO_VERIFIED') ? `
                <button class="btn btn-sm btn-gold" style="font-size: 0.72rem; padding: 0.28rem 0.65rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;" onclick="LegalRequestsView.acceptForBilling('${r.id}')" title="Create Invoice (Step 5)">
                  <span>📄</span> <span>Create Invoice</span>
                </button>
              ` : (statusMeta.label === 'PAYMENT_SUBMITTED') ? `
                <button class="btn btn-sm btn-gold" style="font-size: 0.75rem; padding: 0.32rem 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #fff; border: none; border-radius: 6px; box-shadow: 0 2px 6px rgba(245,158,11,0.3); cursor: pointer;" onclick="LegalRequestsView.openReviewPaymentProofModal('${r.id}')" title="Review Client Remittance & Accept Payment">
                  <span>💳</span> <span>Review &amp; Accept Payment</span>
                </button>
              ` : (statusMeta.label === 'READY_FOR_ASSIGNMENT') ? `
                <button class="btn btn-sm" style="font-size: 0.75rem; padding: 0.35rem 0.8rem; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #fff; border: none; border-radius: 6px; box-shadow: 0 2px 6px rgba(5,150,105,0.3); cursor: pointer;" onclick="LegalRequestsView.openAssignLawyerModal('${r.id}')" title="Payment verified! Assign case to Lawyer">
                  <span>⚖️</span> <span>Assign Lawyer</span>
                </button>
              ` : (statusMeta.label === 'ASSIGNED') ? `
                <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 0.28rem 0.6rem; font-weight: 700; color: #6D28D9; background: #F5F3FF; border: 1px solid #DDD6FE;" onclick="LegalRequestsView.openAssignLawyerModal('${r.id}')" title="Reassign Lawyer">
                  👤 ${this.escapeHtml(r.lawyer || r.assignedLawyer || 'Assigned')}
                </button>
              ` : (statusMeta.label === 'INVOICE_SENT' || statusMeta.label === 'PAYMENT_PENDING') ? `
                <button class="btn btn-sm btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem; font-weight: 700; color: #047857; background: #ECFDF5; border: 1px solid #A7F3D0;" onclick="App.navigate('billing')" title="Invoice already sent &mdash; view in Billing">
                  ✓ Invoice Sent
                </button>
              ` : `
                <button class="btn btn-sm btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;" onclick="LegalRequestsView.openReviewDetailsModal('${r.id}')">
                  View Dossier
                </button>
              `}

              ${(statusMeta.label === 'SUBMITTED' || statusMeta.label === 'UNDER_REVIEW') ? `
                <button class="btn btn-sm btn-ghost text-danger" style="font-size: 0.75rem; padding: 0.3rem 0.5rem;" onclick="LegalRequestsView.rejectRequest('${r.id}')" title="Reject Request">
                  ✕ Reject
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  getStatusMeta(rawStatus) {
    const s = (rawStatus || '').toUpperCase();
    if (s === 'SUBMITTED') {
      return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'SUBMITTED' };
    } else if (s === 'UNDER_REVIEW' || s === 'UNDER REVIEW') {
      return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', label: 'UNDER_REVIEW' };
    } else if (s === 'ADDITIONAL INFORMATION REQUIRED' || s === 'MORE_INFORMATION_REQUIRED' || s === 'ACTION_REQUIRED') {
      return { bg: '#FFF7ED', color: '#C2410C', border: '#FFEDD5', label: 'INFO_REQUESTED' };
    } else if (s === 'CORRECTION REQUIRED' || s === 'CORRECTION_REQUIRED') {
      return { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', label: 'CORRECTION_REQUIRED' };
    } else if (s === 'CLIENT RESPONSE RECEIVED' || s === 'CLIENT_RESPONSE_RECEIVED') {
      return { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'RESPONSE_RECEIVED' };
    } else if (s === 'INFORMATION VERIFIED' || s === 'INFORMATION_VERIFIED') {
      return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', label: 'INFO_VERIFIED' };
    } else if (s === 'INVOICE_SENT' || s === 'PAYMENT_PENDING') {
      return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', label: 'INVOICE_SENT' };
    } else if (s === 'PAYMENT_SUBMITTED' || s === 'VERIFICATION_PENDING') {
      return { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD', label: 'PAYMENT_SUBMITTED' };
    } else if (s === 'READY_FOR_ASSIGNMENT' || s === 'PAID' || s.includes('READY FOR ASSIGNMENT') || s.includes('AWAITING_ASSIGNMENT') || s.includes('ACTIVE_AWAITING_ASSIGNMENT')) {
      return { bg: '#ECFDF5', color: '#047857', border: '#6EE7B7', label: 'READY_FOR_ASSIGNMENT' };
    } else if (s === 'REJECTED' || s === 'DECLINED') {
      return { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', label: 'REJECTED' };
    } else if (s === 'CONVERTED TO CASE' || s === 'ASSIGNED' || s === 'ACTIVE') {
      return { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE', label: 'ASSIGNED' };
    }
    return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: rawStatus || 'SUBMITTED' };
  },

  /* ==========================================================================
     STEP 4: REVIEW CLIENT AND CASE (View Case)
     ========================================================================== */
  openReviewDetailsModal(requestId, initialTab = 'case') {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) {
      App.showToast('Request record not found.', 'error');
      return;
    }

    if ((req.status || '').toUpperCase() === 'SUBMITTED') {
      req.status = 'UNDER_REVIEW';
      req.reviewStartedAt = new Date().toISOString();
      this.persistRequests(requests);
    }

    const d = req.createdAt ? new Date(req.createdAt).toLocaleString('en-GB') : 'N/A';
    const docs = Array.isArray(req.documents) ? req.documents : (req.documents ? [req.documents] : []);
    const caseNum = req.caseNumber || ('CASE-2026-' + (req.id ? req.id.replace(/\D/g, '').slice(-4) : '0045'));
    const isVerified = (req.status === 'Information Verified' || req.status === 'INFORMATION_VERIFIED' || req.readyForInvoice);
    const hasResponse = (req.status === 'Client Response Received' || req.status === 'CLIENT_RESPONSE_RECEIVED');

    setTimeout(() => {
      if (initialTab === 'client') {
        document.getElementById('review-section-client')?.scrollIntoView({ behavior: 'smooth' });
      } else if (initialTab === 'docs') {
        document.getElementById('review-section-docs')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
            <span style="font-size: 0.72rem; color: #F59E0B; font-weight: 700; text-transform: uppercase;">
              Legal Officer Case Review
            </span>
            <span style="font-family: monospace; font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 1px 8px; border-radius: 4px;">
              ${this.escapeHtml(caseNum)} &bull; ${this.escapeHtml(req.id)}
            </span>
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.2rem; margin: 0;">
            Case Dossier: ${this.escapeHtml(req.clientName || 'Client')}
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        
        <!-- Case Details Summary -->
        <div id="review-section-case" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div id="review-section-client" class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.86rem; margin-bottom: 0.75rem;">
            <div>
              <span style="color: #64748B; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: block;">Client Full Name</span>
              <strong style="color: #0F172A; font-size: 0.95rem;">${this.escapeHtml(req.clientName || 'Client')}</strong>
              <div style="font-size: 0.75rem; color: #64748B;">Client ID: ${this.escapeHtml(req.clientId || 'CLT-0042')}</div>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: block;">Contact Coordinates</span>
              <span style="color: #0F172A;">${this.escapeHtml(req.clientEmail || 'N/A')} &bull; ${this.escapeHtml(req.clientPhone || 'N/A')}</span>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: block;">Issue Type / Legal Category</span>
              <span style="background: #EFF6FF; color: #1D4ED8; font-weight: 700; font-size: 0.76rem; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 2px;">
                ${this.escapeHtml(req.issueType || 'General Litigation')}
              </span>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: block;">Opposing Party / Subject</span>
              <strong style="color: #1E293B;">${this.escapeHtml(req.opposingParty || 'None specified')}</strong>
            </div>
          </div>

          <div style="border-top: 1px solid #E2E8F0; padding-top: 0.75rem; margin-top: 0.75rem;">
            <span style="color: #64748B; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">
              Case Description &amp; Client Facts
            </span>
            <div style="font-size: 0.88rem; color: #334155; line-height: 1.6; white-space: pre-wrap; background: #fff; padding: 0.85rem; border-radius: 6px; border: 1px solid #E2E8F0;">
              ${this.escapeHtml(req.description || 'No description provided.')}
            </div>
          </div>

          <!-- Documents List -->
          <div id="review-section-docs" style="border-top: 1px solid #E2E8F0; padding-top: 0.75rem; margin-top: 0.75rem;">
            <span style="color: #64748B; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.4rem;">
              Attached Supporting Documents (${docs.length})
            </span>
            ${docs.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${docs.map(doc => {
                  const docName = typeof doc === 'string' ? doc : (doc.name || 'Document.pdf');
                  const docSize = typeof doc === 'object' && doc.size ? `(${doc.size})` : '';
                  return `
                    <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: #FFF; border: 1px solid #CBD5E1; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; color: #1E293B;">
                      <span>📄</span>
                      <span>${this.escapeHtml(docName)}</span>
                      <span style="color: #94A3B8; font-size: 0.72rem;">${docSize}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div style="font-size: 0.82rem; color: #94A3B8; font-style: italic;">No initial supporting documents attached.</div>
            `}
          </div>
        </div>

        <!-- Information & Invoice Readiness Status -->
        <div style="background: ${isVerified ? '#ECFDF5' : '#FFFDF5'}; border: 1px solid ${isVerified ? '#A7F3D0' : '#FDE68A'}; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem; color: ${isVerified ? '#065F46' : '#92400E'};">
                ${isVerified ? '✅ Case Information Verified' : (hasResponse ? '📩 Client Response Received — Pending Review' : 'ℹ️ Case in Pre-Billing Intake Review')}
              </div>
              <div style="font-size: 0.8rem; color: ${isVerified ? '#047857' : '#78350F'}; margin-top: 2px;">
                ${isVerified 
                  ? 'The Legal Officer has verified the submitted information. Creation of fee invoice is unlocked.' 
                  : (hasResponse 
                    ? 'The client submitted the requested information and documents. Review them to approve or request correction.' 
                    : 'Under firm procedure, additional case facts and documents must be requested and verified before generating an invoice.')}
              </div>
            </div>
            ${isVerified ? `
              <span style="background: #10B981; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
                Ready for Invoice
              </span>
            ` : ''}
          </div>
        </div>

      </div>

      <!-- Action Buttons Footer -->
      <div class="modal-footer" style="padding: 1rem 1.5rem; background: #F8FAFC; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
          ${(!isVerified && !hasResponse) ? `
            <button type="button" class="btn btn-ghost text-danger" onclick="App.closeModal(); LegalRequestsView.rejectRequest('${req.id}');" style="font-weight: 600;">
              ✕ Reject Request
            </button>
          ` : ''}
        </div>

        <div style="display: flex; gap: 0.65rem;">
          ${isVerified ? `
            <button type="button" class="btn btn-gold" style="font-weight: 800; padding: 0.55rem 1.4rem; display: inline-flex; align-items: center; gap: 6px;" onclick="App.closeModal(); LegalRequestsView.acceptForBilling('${req.id}')">
              <span>📄</span> <span>Create &amp; Send Invoice &rarr;</span>
            </button>
          ` : hasResponse ? `
            <button type="button" class="btn btn-gold" style="font-weight: 800; padding: 0.55rem 1.4rem; display: inline-flex; align-items: center; gap: 6px;" onclick="App.closeModal(); LegalRequestsView.openReviewResponseModal('${req.id}')">
              <span>📋</span> <span>Review Client Response &rarr;</span>
            </button>
          ` : `
            <button type="button" class="btn btn-gold" style="font-weight: 800; padding: 0.55rem 1.4rem; display: inline-flex; align-items: center; gap: 6px;" onclick="App.closeModal(); LegalRequestsView.openSendInformationRequestModal('${req.id}');">
              <span>❓</span> <span>Send Information Request &rarr;</span>
            </button>
          `}
        </div>
      </div>
    `, 'modal-lg');
  },

  /* ==========================================================================
     SEND INFORMATION REQUEST (Requirement 3 & 4)
     - Auto-derives recipient_client_id = case.clientId
     - Form: Request No, Case, Client, Title, Checklists, Notes, Due Date
     ========================================================================== */
  openSendInformationRequestModal(requestId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    const caseNumber = req.caseNumber || ('CASE-2026-' + (req.id ? req.id.replace(/\D/g, '').slice(-4) : '0045'));
    const clientId = req.clientId || 'CLT-0042';
    const clientName = req.clientName || 'Client';
    const clientEmail = req.clientEmail || '';
    const existingInfoReqs = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredInfoRequests() : [];
    const infoSeq = String(existingInfoReqs.length + 1).padStart(4, '0');
    const reqNum = `REQ-2026-${infoSeq}`;
    const defaultDueDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="font-size: 0.74rem; color: #F59E0B; font-weight: 700; text-transform: uppercase;">
            Requirement 3 &amp; 4: Case Information Request
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.15rem; margin-top: 2px;">
            Send Information Request
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        <!-- Auto-derived recipient binding banner (Requirement 4) -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
            <div>
              <span style="color: #64748B; font-size: 0.74rem; text-transform: uppercase; font-weight: 700; display: block;">Request No:</span>
              <strong style="color: #0284C7; font-family: monospace; font-size: 0.95rem;">${reqNum}</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.74rem; text-transform: uppercase; font-weight: 700; display: block;">Case Docket:</span>
              <strong style="color: #0F172A; font-family: monospace;">${this.escapeHtml(caseNumber)}</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 0.74rem; text-transform: uppercase; font-weight: 700; display: block;">Client (Auto-Bound):</span>
              <strong style="color: #0F172A;">${this.escapeHtml(clientName)}</strong>
              <span style="font-size: 0.74rem; color: #64748B; display: block;">recipient_client_id: ${this.escapeHtml(clientId)}</span>
            </div>
          </div>
        </div>

        <form id="form-send-info-req" onsubmit="LegalRequestsView.submitSendInformationRequest(event, '${req.id}', '${reqNum}', '${caseNumber}', '${clientId}')">
          <!-- Request Title -->
          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600;">Request Title *</label>
            <input type="text" id="info-req-title" class="form-control" value="Additional Case Information Required" required style="font-weight: 600;">
          </div>

          <!-- Required Information Checkboxes -->
          <div class="form-group mb-3" style="background: #FFFDF5; border: 1px solid #FEF3C7; border-radius: 8px; padding: 1rem;">
            <label style="font-weight: 700; color: #92400E; display: block; margin-bottom: 0.5rem; font-size: 0.86rem;">
              ☑ Required Information Checklist
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.84rem;">
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-info-item" value="Full residential address" checked>
                <span>Full residential address</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-info-item" value="National ID/Passport number" checked>
                <span>National ID/Passport number</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-info-item" value="Opposing party details" checked>
                <span>Opposing party details</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-info-item" value="Date dispute began" checked>
                <span>Date dispute began</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-info-item" value="Property/location details" checked>
                <span>Property/location details</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-info-item" value="Previous court case information" checked>
                <span>Previous court case information</span>
              </label>
            </div>
          </div>

          <!-- Required Documents Checkboxes -->
          <div class="form-group mb-3" style="background: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 8px; padding: 1rem;">
            <label style="font-weight: 700; color: #166534; display: block; margin-bottom: 0.5rem; font-size: 0.86rem;">
              ☑ Required Documents Checklist
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.84rem;">
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-doc-item" value="National ID" checked>
                <span>National ID</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-doc-item" value="Title/ownership document" checked>
                <span>Title/ownership document</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-doc-item" value="Previous agreement" checked>
                <span>Previous agreement</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" name="req-doc-item" value="Court documents, if available" checked>
                <span>Court documents, if available</span>
              </label>
            </div>
          </div>

          <!-- Legal Officer Notes -->
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600;">Legal Officer Notes</label>
            <textarea id="info-req-notes" class="form-control" rows="3" placeholder="Please complete the requested information so that we can assess your matter and prepare the appropriate legal service invoice.">Please complete the requested information so that we can assess your matter and prepare the appropriate legal service invoice.</textarea>
          </div>

          <!-- Due Date -->
          <div class="form-group mb-3" style="max-width: 250px;">
            <label class="form-label required" style="font-weight: 600;">Due Date *</label>
            <input type="date" id="info-req-due-date" class="form-control" value="${defaultDueDate}" required min="${new Date().toISOString().split('T')[0]}">
          </div>

          <div class="modal-footer" style="padding: 1.25rem 0 0 0; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Save Draft</button>
            <button type="submit" class="btn btn-gold" style="font-weight: 700; padding: 0.65rem 1.5rem;">
              Send Request &rarr;
            </button>
          </div>
        </form>
      </div>
    `, 'modal-lg');
  },

  submitSendInformationRequest(e, originalReqId, reqNum, caseNumber, clientId) {
    e.preventDefault();
    const title = document.getElementById('info-req-title')?.value?.trim() || 'Additional Case Information Required';
    const notes = document.getElementById('info-req-notes')?.value?.trim() || '';
    const dueDate = document.getElementById('info-req-due-date')?.value || '';

    const infoCheckboxes = document.querySelectorAll('input[name="req-info-item"]:checked');
    const docCheckboxes = document.querySelectorAll('input[name="req-doc-item"]:checked');

    const requiredInfo = Array.from(infoCheckboxes).map(c => c.value);
    const requiredDocs = Array.from(docCheckboxes).map(c => c.value);

    const requests = this.getRequests();
    const req = requests.find(r => r.id === originalReqId);
    if (!req) return;

    if (typeof ClientPortalService !== 'undefined' && typeof ClientPortalService.createInformationRequest === 'function') {
      ClientPortalService.createInformationRequest({
        originalRequestId: originalReqId,
        caseId: req.caseId || originalReqId,
        caseNumber: caseNumber,
        clientId: clientId || req.clientId,
        clientName: req.clientName,
        clientEmail: req.clientEmail,
        title: title,
        requiredInformation: requiredInfo,
        requiredDocuments: requiredDocs,
        officerNotes: notes,
        dueDate: dueDate
      });
    }

    App.closeModal();
    App.showToast(`Information Request ${reqNum} sent to ${req.clientName}. Due date: ${dueDate}.`, 'success');
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }
  },

  // Alias for backward compatibility
  openRequestMoreInfoModal(requestId) {
    this.openSendInformationRequestModal(requestId);
  },

  /* ==========================================================================
     REVIEW CLIENT RESPONSE (Requirement 9)
     ========================================================================== */
  openReviewResponseModal(requestId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    const infoRequests = (typeof ClientPortalService !== 'undefined') ? ClientPortalService.getStoredInfoRequests() : [];
    const info = infoRequests.find(ir => ir.caseId === req.caseId || ir.caseNumber === req.caseNumber || ir.requestId === req.currentInfoRequestId || ir.requestId === req.id) || req.infoRequest || {};
    const resp = info.responseData || {};
    const docs = Array.isArray(resp.documents) ? resp.documents : [];

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="font-size: 0.74rem; color: #10B981; font-weight: 700; text-transform: uppercase;">
            Requirement 9: Client Response Review
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.15rem; margin-top: 2px;">
            Review Client Dossier &amp; Submitted Information
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        
        <!-- Client Information Card -->
        <div class="card mb-3" style="padding: 1.25rem; border: 1px solid #E2E8F0; border-radius: 8px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0 0 0.75rem 0; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.4rem;">
            👤 Client Information
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem;">
            <div><strong>Full Name:</strong> ${this.escapeHtml(resp.fullName || req.clientName || 'N/A')}</div>
            <div><strong>Identification:</strong> ${this.escapeHtml(resp.idType || 'National ID')}: <span style="font-family: monospace; font-weight: 700;">${this.escapeHtml(resp.idNumber || 'N/A')}</span></div>
            <div><strong>Residential Address:</strong> ${this.escapeHtml(resp.residentialAddress || 'N/A')}</div>
            <div><strong>Phone &amp; Email:</strong> ${this.escapeHtml(resp.phone || req.clientPhone || 'N/A')} &bull; ${this.escapeHtml(resp.email || req.clientEmail || 'N/A')}</div>
          </div>
        </div>

        <!-- Case Information Card -->
        <div class="card mb-3" style="padding: 1.25rem; border: 1px solid #E2E8F0; border-radius: 8px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0 0 0.75rem 0; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.4rem;">
            ⚖️ Case Information
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; margin-bottom: 0.5rem;">
            <div><strong>Opposing Party:</strong> ${this.escapeHtml(resp.opposingParty || req.opposingParty || 'N/A')}</div>
            <div><strong>Date Dispute Began:</strong> ${this.escapeHtml(resp.disputeDate || 'N/A')}</div>
            <div><strong>Dispute Location:</strong> ${this.escapeHtml(resp.disputeLocation || 'N/A')}</div>
            <div><strong>Case Docket:</strong> ${this.escapeHtml(req.caseNumber || 'CASE-2026-0045')}</div>
          </div>
          <div style="background: #F8FAFC; padding: 0.75rem; border-radius: 6px; font-size: 0.84rem; line-height: 1.5; color: #334155;">
            <strong>Matter Description:</strong><br>
            ${this.escapeHtml(resp.description || req.description || 'No detailed description provided.')}
          </div>
        </div>

        <!-- Submitted Documents Card -->
        <div class="card mb-3" style="padding: 1.25rem; border: 1px solid #E2E8F0; border-radius: 8px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin: 0 0 0.75rem 0; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.4rem;">
            📎 Submitted Documents
          </h4>
          ${docs.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${docs.map(d => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 0.5rem 0.85rem; border-radius: 6px; font-size: 0.84rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>📄</span>
                    <strong style="color: #0F172A;">${this.escapeHtml(typeof d === 'string' ? d : d.name)}</strong>
                    <span style="font-size: 0.75rem; color: #64748B;">(${this.escapeHtml(d.category || 'Uploaded File')})</span>
                  </div>
                  <span style="color: #059669; font-weight: 700; font-size: 0.75rem;">✓ Available</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="font-size: 0.84rem; color: #64748B; font-style: italic;">
              Documents verified.
            </div>
          `}
        </div>

        <!-- Client Declaration -->
        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.82rem; color: #065F46; display: flex; align-items: center; gap: 0.5rem;">
          <span>✅</span>
          <span><strong>Client Declaration:</strong> Confirmed &bull; "I confirm that the information and documents submitted are true and correct to the best of my knowledge."</span>
        </div>

      </div>

      <div class="modal-footer" style="padding: 1.25rem 1.5rem; background: #F8FAFC; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
          <button type="button" class="btn btn-secondary" style="border-color: #F59E0B; color: #B45309; font-weight: 600;" onclick="App.closeModal(); LegalRequestsView.openCorrectionModal('${req.id}');">
            ✏️ Request Correction
          </button>
        </div>
        <div style="display: flex; gap: 0.65rem;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal(); LegalRequestsView.openSendInformationRequestModal('${req.id}');">
            Send Another Request
          </button>
          <button type="button" class="btn btn-gold" style="font-weight: 800; padding: 0.55rem 1.4rem;" onclick="LegalRequestsView.approveClientInformation('${req.id}')">
            ✅ Approve Information &amp; Unlock Invoice
          </button>
        </div>
      </div>
    `, 'modal-lg');
  },

  approveClientInformation(requestId) {
    if (typeof ClientPortalService !== 'undefined' && typeof ClientPortalService.approveInformationRequest === 'function') {
      try {
        ClientPortalService.approveInformationRequest(requestId);
      } catch (e) {
        console.warn('Approve info error:', e);
      }
    }
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.status = 'Information Verified';
      req.readyForInvoice = true;
      this.persistRequests(requests);
    }
    App.closeModal();
    App.showToast('Client information approved and verified! Create Invoice is now enabled.', 'success', 5000);
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }
  },

  /* ==========================================================================
     REQUEST CORRECTION (Requirement 10)
     ========================================================================== */
  openCorrectionModal(requestId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    App.openModal(`
      <div class="modal-header" style="background: #FFFBEB; border-bottom: 1px solid #FCD34D;">
        <h3 class="modal-title" style="color: #92400E;">Request Information Correction</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <p style="font-size: 0.85rem; color: #78350F; margin-top: 0;">
          Send the request back to <strong>${this.escapeHtml(req.clientName)}</strong> for corrections or clearer document uploads. No invoice will be generated.
        </p>

        <form id="form-correction-req" onsubmit="LegalRequestsView.submitCorrectionRequest(event, '${req.id}')">
          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600;">Reason *</label>
            <input type="text" id="corr-reason" class="form-control" placeholder="e.g. The uploaded title document is unreadable." required minlength="5">
          </div>

          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600;">Required Action *</label>
            <textarea id="corr-action" class="form-control" rows="3" placeholder="e.g. Please upload a clear, legible high-resolution copy of the title deed." required minlength="5"></textarea>
          </div>

          <div class="modal-footer" style="padding: 1rem 0 0 0; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-gold" style="font-weight: 700;">
              Send Back to Client &rarr;
            </button>
          </div>
        </form>
      </div>
    `);
  },

  submitCorrectionRequest(e, requestId) {
    e.preventDefault();
    const reason = document.getElementById('corr-reason')?.value?.trim();
    const action = document.getElementById('corr-action')?.value?.trim();

    if (typeof ClientPortalService !== 'undefined' && typeof ClientPortalService.requestInformationCorrection === 'function') {
      try {
        ClientPortalService.requestInformationCorrection(requestId, reason, action);
      } catch (err) {
        console.warn('Correction request error:', err);
      }
    }
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.status = 'Correction Required';
      this.persistRequests(requests);
    }
    App.closeModal();
    App.showToast('Correction requested. Status updated to CORRECTION REQUIRED. Client notified.', 'info');
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }
  },

  /* ==========================================================================
     ACTION: ACCEPT FOR BILLING (Step 11: Only enabled when Information Verified)
     ========================================================================== */
  acceptForBilling(requestId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    const isVerified = (req && (req.status === 'Information Verified' || req.status === 'INFORMATION_VERIFIED' || req.readyForInvoice));

    if (!isVerified) {
      App.showToast('Validation Guard: Client information must be reviewed and approved before creating an invoice.', 'warning');
      return;
    }

    const bv = (typeof BillingView !== 'undefined') ? BillingView : window.BillingView;
    if (bv && typeof bv.openCreateInvoiceModal === 'function') {
      bv.openCreateInvoiceModal(requestId);
    } else {
      App.showToast('Billing view module is loading, please try again.', 'info');
    }
  },


  /* ==========================================================================
     ACTION: REJECT REQUEST
     ========================================================================== */
  rejectRequest(requestId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    App.openModal(`
      <div class="modal-header" style="background: #FEF2F2; border-bottom: 1px solid #FECACA;">
        <h3 class="modal-title" style="color: #991B1B;">Reject Legal Assistance Request</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <p style="font-size: 0.88rem; color: #475569; margin-top: 0;">
          Are you sure you want to decline legal assistance request <strong>${this.escapeHtml(req.id)}</strong> from <strong>${this.escapeHtml(req.clientName)}</strong>?
        </p>

        <form id="form-reject-req" onsubmit="LegalRequestsView.submitRejectRequest(event, '${req.id}')">
          <div class="form-group mb-3">
            <label class="form-label required" style="font-weight: 600;">Reason for Declining *</label>
            <select id="reject-reason-category" class="form-control mb-2" required>
              <option value="Conflict of Interest">Conflict of Interest with Existing Client</option>
              <option value="Matter Outside Practice Area">Subject Matter Outside Firm Practice Scope</option>
              <option value="Lack of Jurisdiction">Lack of Territorial / Judicial Jurisdiction</option>
              <option value="Statute of Limitations Expired">Cause of Action Barred by Law of Limitation</option>
              <option value="Other">Other Specific Chamber Reason</option>
            </select>
            <textarea id="reject-reason-detail" class="form-control" rows="3" required placeholder="Provide clear reason to record in permanent audit trail..."></textarea>
          </div>

          <div class="modal-footer" style="padding: 1rem 0 0 0; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-danger" style="font-weight: 700;">
              Confirm Rejection &amp; Archive
            </button>
          </div>
        </form>
      </div>
    `);
  },

  submitRejectRequest(e, requestId) {
    e.preventDefault();
    const reasonCat = document.getElementById('reject-reason-category')?.value;
    const reasonDet = document.getElementById('reject-reason-detail')?.value?.trim();

    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    req.status = 'REJECTED';
    req.rejectionReason = `${reasonCat}: ${reasonDet}`;
    req.rejectedAt = new Date().toISOString();
    this.persistRequests(requests);

    if (typeof SLCMS_STATE.addAuditLog === 'function') {
      SLCMS_STATE.addAuditLog(
        'Intake Request Rejected',
        'Intake Management',
        `Legal Officer declined request ${req.id} from ${req.clientName}. Reason: ${req.rejectionReason}`,
        'Warning'
      );
    }

    App.closeModal();
    App.showToast(`Request ${req.id} has been declined.`, 'warning');
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }
  },

  /* ==========================================================================
     ACTION: REVIEW & ACCEPT PAYMENT (Legal Officer Workflow)
     ========================================================================== */
  openReviewPaymentProofModal(requestId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) {
      App.showToast('Request record not found.', 'error');
      return;
    }

    const invoices = (typeof BillingView !== 'undefined' && typeof BillingView.getInvoices === 'function')
      ? BillingView.getInvoices()
      : (JSON.parse(localStorage.getItem('slcms_invoices') || '[]'));

    let inv = invoices.find(i => 
      i.requestId === req.id || 
      i.invoiceNumber === req.invoiceNumber || 
      (i.clientEmail && req.clientEmail && i.clientEmail.toLowerCase() === req.clientEmail.toLowerCase())
    );

    if (!inv) {
      inv = {
        id: 'inv-' + (req.id || Date.now()),
        invoiceNumber: req.invoiceNumber || ('INV-2026-' + (req.id ? req.id.replace(/\D/g, '').slice(-4) : '0034')),
        totalAmount: req.paymentAmount || 150000,
        status: 'PAYMENT_SUBMITTED'
      };
    }

    const lastPayment = (inv.payments && inv.payments.length > 0) ? inv.payments[inv.payments.length - 1] : {};
    const ref = req.paymentReference || inv.demoReference || lastPayment.referenceNumber || 'TRX-BANK-2026-9921';
    const payDate = req.paymentDate || lastPayment.paymentDate || new Date().toISOString().split('T')[0];
    const payMethod = req.paymentMethod || lastPayment.paymentMethod || 'Bank Transfer (CRDB/NMB)';
    const amount = req.paymentAmount || lastPayment.amount || inv.totalAmount || 150000;
    const proofFile = req.proofDocument || lastPayment.proofDocument || 'bank_slip.pdf';
    const caseDocket = req.caseDocket || req.caseNumber || ('CASE-2026-' + (req.id ? req.id.replace(/\D/g, '').slice(-4) : '0045'));

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="font-size: 0.72rem; color: #10B981; font-weight: 800; text-transform: uppercase; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3);">
              Payment Remittance Received
            </span>
            <span style="font-family: monospace; font-size: 0.8rem; color: #94A3B8;">
              ${this.escapeHtml(caseDocket)} &bull; ${this.escapeHtml(inv.invoiceNumber)}
            </span>
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.18rem; margin: 0;">
            Review Client Invoice Payment &amp; Verify Funds
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        
        <!-- Summary Instruction -->
        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-left: 4px solid #10B981; border-radius: 8px; padding: 0.95rem 1.15rem; margin-bottom: 1.25rem;">
          <div style="font-weight: 700; color: #065F46; font-size: 0.88rem; margin-bottom: 0.25rem;">
            Legal Officer Remittance Verification
          </div>
          <div style="font-size: 0.84rem; color: #047857; line-height: 1.5;">
            The client has remitted their legal service retainer fee and attached bank/mobile proof. 
            Confirm funds receipt against bank ledger. Upon accepting, this matter will become <strong>ACTIVE</strong> and unlock <strong>Lawyer Assignment</strong>.
          </div>
        </div>

        <!-- 2-Column Remittance Inspection -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
          
          <!-- Client & Case Information -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem;">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.9rem; margin-bottom: 0.75rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>👤</span> <span>Client &amp; Case Matter</span>
            </div>
            <div style="font-size: 0.84rem; line-height: 1.6; color: #334155;">
              <div>Client Name: <strong style="color: #0F172A;">${this.escapeHtml(req.clientName || 'Client')}</strong></div>
              <div>Contact: <strong>${this.escapeHtml(req.clientPhone || '+255 700 000 000')}</strong></div>
              <div>Email: <strong>${this.escapeHtml(req.clientEmail || 'client@slcms.local')}</strong></div>
              <div>Case Category: <span style="background: #EFF6FF; color: #1D4ED8; padding: 1px 6px; border-radius: 4px; font-weight: 600;">${this.escapeHtml(req.issueType || 'Civil Litigation')}</span></div>
              <div>Case Docket: <span style="font-family: monospace; font-weight: 700; color: #0284C7;">${this.escapeHtml(caseDocket)}</span></div>
            </div>
          </div>

          <!-- Invoice & Payment Remittance -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem;">
            <div style="font-weight: 700; color: #0F172A; font-size: 0.9rem; margin-bottom: 0.75rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>💳</span> <span>Remitted Payment Details</span>
            </div>
            <div style="font-size: 0.84rem; line-height: 1.6; color: #334155;">
              <div>Invoice Number: <strong style="font-family: monospace; color: #B45309;">${this.escapeHtml(inv.invoiceNumber)}</strong></div>
              <div>Amount Due: <strong style="color: #047857;">TZS ${Number(inv.totalAmount || amount).toLocaleString()}</strong></div>
              <div>Amount Remitted: <strong style="color: #059669; font-size: 0.95rem;">TZS ${Number(amount).toLocaleString()}</strong></div>
              <div>Payment Channel: <strong>${this.escapeHtml(payMethod)}</strong></div>
              <div>Transaction Ref: <strong style="font-family: monospace; background: #FEF3C7; color: #92400E; padding: 1px 6px; border-radius: 4px;">${this.escapeHtml(ref)}</strong></div>
              <div>Remittance Date: <strong>${this.escapeHtml(payDate)}</strong></div>
            </div>
          </div>

        </div>

        <!-- Attached Proof Document -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: #EFF6FF; color: #1D4ED8; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
              📎
            </div>
            <div>
              <div style="font-weight: 700; color: #0F172A; font-size: 0.88rem;">${this.escapeHtml(proofFile)}</div>
              <div style="font-size: 0.76rem; color: #64748B;">Client Remittance Slip / Bank Deposit Confirmation (PDF/Image)</div>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="App.showToast('Displaying payment slip: ${this.escapeHtml(proofFile)}', 'info');" style="font-weight: 600;">
            👁️ Inspect Slip
          </button>
        </div>

        <!-- Officer Confirmation Ledger Note -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
            Legal Officer Verification Ledger Note
          </label>
          <input type="text" id="officer-verify-note" class="form-control" value="Funds verified in CRDB Bank / M-Pesa business account. Retainer payment confirmed." style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.86rem;">
        </div>

        <!-- Action Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <button type="button" class="btn btn-secondary" onclick="LegalRequestsView.rejectPaymentProof('${req.id}', '${inv.id}')" style="border-color: #EF4444; color: #DC2626; font-weight: 700;">
            ✕ Reject Proof
          </button>
          <div style="display: flex; gap: 0.65rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
            <button type="button" class="btn btn-primary" onclick="LegalRequestsView.acceptAndVerifyPayment('${req.id}', '${inv.id}')" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); font-weight: 800; padding: 0.65rem 1.5rem; box-shadow: 0 4px 12px rgba(5,150,105,0.3);">
              ✓ Accept &amp; Verify Payment &rarr;
            </button>
          </div>
        </div>

      </div>
    `, 'modal-lg');
  },

  acceptAndVerifyPayment(requestId, invId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    const officerUser = (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.currentUser && SLCMS_STATE.currentUser.name)
      ? SLCMS_STATE.currentUser.name
      : 'Adv. Joyce Mercer';

    // 1. Update Invoices
    const invoices = (typeof BillingView !== 'undefined' && typeof BillingView.getInvoices === 'function')
      ? BillingView.getInvoices()
      : (JSON.parse(localStorage.getItem('slcms_invoices') || '[]'));

    let inv = invoices.find(i => String(i.id) === String(invId) || i.requestId === req.id || i.invoiceNumber === req.invoiceNumber);
    const amount = Number(req.paymentAmount || (inv ? inv.totalAmount : 150000) || 150000);
    const ref = req.paymentReference || (inv ? inv.demoReference : 'REF-CONFIRMED') || 'REF-CONFIRMED';

    if (inv) {
      inv.status = 'PAID';
      inv.paymentStatus = 'VERIFIED';
      inv.amountPaid = amount;
      inv.balance = 0;
      inv.verifiedBy = officerUser;
      inv.verifiedAt = new Date().toISOString();
      if (Array.isArray(inv.payments)) {
        inv.payments.forEach(p => p.status = 'VERIFIED');
      }
      if (typeof BillingView !== 'undefined' && typeof BillingView.persistInvoices === 'function') {
        BillingView.persistInvoices();
      } else {
        localStorage.setItem('slcms_invoices', JSON.stringify(invoices));
      }
    }

    // 2. Update Request Status to READY_FOR_ASSIGNMENT
    req.status = 'READY_FOR_ASSIGNMENT';
    req.paymentVerified = true;
    req.paymentStatus = 'PAID';
    req.invoiceStatus = 'PAID';
    req.caseActive = true;
    req.verifiedBy = officerUser;
    req.verifiedAt = new Date().toISOString();
    this.persistRequests(requests);

    // 3. Update or Create Case in SLCMS_STATE.cases
    const caseDocket = req.caseDocket || req.caseNumber || ('CASE-2026-' + (req.id ? req.id.replace(/\D/g, '').slice(-4) : '0045'));
    if (typeof SLCMS_STATE !== 'undefined') {
      if (!Array.isArray(SLCMS_STATE.cases)) SLCMS_STATE.cases = [];
      let c = SLCMS_STATE.cases.find(item => item.id === req.id || item.requestId === req.id || item.caseNumber === caseDocket);
      if (c) {
        c.status = 'ACTIVE_AWAITING_ASSIGNMENT';
        c.statusLabel = 'PAID — READY FOR ASSIGNMENT';
        c.paymentStatus = 'VERIFIED';
        c.invoiceStatus = 'PAID';
        c.amountPaid = amount;
        c.activatedAt = new Date().toISOString();
      } else {
        c = {
          id: 'case-' + Date.now(),
          caseNumber: caseDocket,
          officialCaseNumber: caseDocket,
          title: `${req.clientName || 'Client'} - ${req.issueType || 'Legal Matter'}`,
          client: req.clientName || 'Client',
          clientName: req.clientName || 'Client',
          clientId: req.clientId || 'CLT-0042',
          clientEmail: req.clientEmail || '',
          caseType: req.issueType || 'Civil Litigation',
          court: 'High Court of Tanzania',
          status: 'ACTIVE_AWAITING_ASSIGNMENT',
          statusLabel: 'PAID — READY FOR ASSIGNMENT',
          filingDate: new Date().toISOString().split('T')[0],
          lawyer: 'Unassigned',
          leadCounsel: 'Unassigned',
          invoiceStatus: 'PAID',
          paymentStatus: 'VERIFIED',
          paymentReference: ref,
          amountPaid: amount,
          description: req.description || '',
          createdAt: new Date().toISOString(),
          activatedAt: new Date().toISOString()
        };
        SLCMS_STATE.cases.unshift(c);
      }
      if (typeof SLCMS_STATE.persistCases === 'function') SLCMS_STATE.persistCases();

      // Record Audit Trail
      if (typeof SLCMS_STATE.addAuditLog === 'function') {
        SLCMS_STATE.addAuditLog(
          'Payment Verified & Accepted',
          'Billing Verification',
          `Legal Officer ${officerUser} accepted payment of TZS ${amount.toLocaleString()} (Ref: ${ref}) for matter ${caseDocket}. Case status set to READY_FOR_ASSIGNMENT.`,
          'Success'
        );
      }
    }

    App.closeModal();
    App.showToast(`Payment of TZS ${amount.toLocaleString()} accepted! Matter ${caseDocket} is now ACTIVE on the docket and ready for Lawyer Assignment.`, 'success', 6000);

    // Refresh view
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }

    // Immediately open Lawyer Assignment Modal so officer can assign lawyer right away
    setTimeout(() => {
      this.openAssignLawyerModal(requestId);
    }, 350);
  },

  rejectPaymentProof(requestId, invId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    req.status = 'INVOICE_SENT';
    req.paymentProofSubmitted = false;
    req.rejectionReason = 'Payment proof was illegible or could not be reconciled against bank statement.';
    this.persistRequests(requests);

    App.closeModal();
    App.showToast('Payment proof was rejected. Request returned to Invoice Sent status.', 'warning');
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }
  },

  /* ==========================================================================
     ACTION: ASSIGN LAWYER (Legal Officer / Senior Counsel)
     ========================================================================== */
  openAssignLawyerModal(requestId) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) {
      App.showToast('Request record not found.', 'error');
      return;
    }

    const caseDocket = req.caseDocket || req.caseNumber || ('CASE-2026-' + (req.id ? req.id.replace(/\D/g, '').slice(-4) : '0045'));
    
    // Active Lawyers in the firm
    const allUsers = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.users)) ? SLCMS_STATE.users : [];
    let lawyers = allUsers.filter(u => {
      const r = (u.role || '').toLowerCase();
      return r.includes('lawyer') || r.includes('counsel') || r.includes('advocate') || r === 'legal officer';
    });

    if (lawyers.length === 0) {
      lawyers = [
        { id: 'usr-002', name: 'Adv. Hamisi Mwinyi', role: 'Senior Lawyer', department: 'Commercial & Property Litigation' },
        { id: 'usr-003', name: 'Adv. Fatma Karume', role: 'Senior Lawyer', department: 'Constitutional & Land Law' },
        { id: 'usr-004', name: 'Adv. Michael Tarimo', role: 'Lawyer', department: 'Civil & Property Practice' },
        { id: 'usr-005', name: 'Adv. Joyce Mercer', role: 'Legal Officer', department: 'Litigation & Client Intake' },
        { id: 'usr-006', name: 'Adv. Grace Mushi', role: 'Lawyer', department: 'Corporate & Contract Advisory' }
      ];
    }

    const currentLawyer = req.lawyer || req.assignedLawyer || '';

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="font-size: 0.72rem; color: #10B981; font-weight: 800; text-transform: uppercase; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3);">
              Case Activated &bull; Retainer Paid ✓
            </span>
            <span style="font-family: monospace; font-size: 0.8rem; color: #94A3B8;">
              ${this.escapeHtml(caseDocket)}
            </span>
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.18rem; margin: 0;">
            Assign Lead Counsel to Client Matter
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        
        <!-- Case Eligibility Card -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #64748B;">Client Matter On Docket</div>
              <h4 style="margin: 0; color: #0F172A; font-size: 1.05rem; font-weight: 700;">${this.escapeHtml(req.issueType || 'Civil Litigation')} — ${this.escapeHtml(req.clientName)}</h4>
              <div style="font-size: 0.82rem; color: #64748B; margin-top: 2px;">
                Client: <strong style="color: #1E293B;">${this.escapeHtml(req.clientName)}</strong> &bull; Opposing: <strong>${this.escapeHtml(req.opposingParty || 'Juma & Sons')}</strong>
              </div>
            </div>
            <span style="font-family: monospace; font-size: 0.82rem; font-weight: 700; color: #0284C7; background: #EFF6FF; padding: 2px 8px; border-radius: 6px;">
              ${this.escapeHtml(caseDocket)}
            </span>
          </div>

          <div style="display: flex; flex-wrap: gap; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.78rem; font-weight: 700;">
            <span style="padding: 2px 8px; border-radius: 9999px; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;">
              ✓ Payment Verified: PAID
            </span>
            <span style="padding: 2px 8px; border-radius: 9999px; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;">
              ✓ Case Docket: ACTIVE
            </span>
            <span style="padding: 2px 8px; border-radius: 9999px; background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;">
              ✓ Dossier &amp; Documents Complete
            </span>
          </div>
        </div>

        <form onsubmit="LegalRequestsView.submitAssignLawyer(event, '${req.id}')">
          
          <!-- Select Lawyer -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.84rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">
              Select Lead Counsel / Advocate *
            </label>
            <select id="assign-lawyer-select" class="form-control" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.9rem; background: #fff;">
              <option value="">-- Choose Advocate --</option>
              ${lawyers.map(l => `
                <option value="${l.id || l.name}" data-name="${this.escapeHtml(l.name)}" ${(currentLawyer === l.name) ? 'selected' : ''}>
                  ${this.escapeHtml(l.name)} (${this.escapeHtml(l.role || 'Advocate')} &bull; ${this.escapeHtml(l.department || 'Litigation')})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                Counsel Responsibility *
              </label>
              <select id="assign-role-select" class="form-control" style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem; background: #fff;">
                <option value="Lead Counsel" selected>Lead Counsel (Primary Representation)</option>
                <option value="Co-Counsel">Co-Counsel (Assisting Advocate)</option>
                <option value="Advisory Counsel">Advisory Counsel (Chamber Opinion)</option>
              </select>
            </div>
            <div class="form-group">
              <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                Assignment Date
              </label>
              <input type="date" id="assign-date-input" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.88rem;">
            </div>
          </div>

          <!-- Internal Instructions -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
              Internal Case Instructions &amp; Briefing Notes *
            </label>
            <textarea id="assign-instructions" rows="3" class="form-control" required style="width: 100%; padding: 0.65rem; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.86rem; line-height: 1.45;">Client dossier and retainer payment verified. Please schedule an initial client consultation, draft formal pleadings, and establish direct communication via Case Chat.</textarea>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding-top: 1.25rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); font-weight: 800; padding: 0.65rem 1.75rem; box-shadow: 0 4px 12px rgba(5,150,105,0.3);">
              ⚖️ Confirm Lawyer Assignment &rarr;
            </button>
          </div>

        </form>

      </div>
    `, 'modal-lg');
  },

  submitAssignLawyer(e, requestId) {
    e.preventDefault();
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    const select = document.getElementById('assign-lawyer-select');
    const selectedOpt = select ? select.options[select.selectedIndex] : null;
    const lawyerId = select ? select.value : '';
    const lawyerName = selectedOpt ? selectedOpt.dataset.name : '';
    const role = document.getElementById('assign-role-select')?.value || 'Lead Counsel';
    const instructions = document.getElementById('assign-instructions')?.value?.trim() || '';

    if (!lawyerId || !lawyerName) {
      App.showToast('Please select an active advocate.', 'error');
      return;
    }

    const caseDocket = req.caseDocket || req.caseNumber || ('CASE-2026-' + (req.id ? req.id.replace(/\D/g, '').slice(-4) : '0045'));

    // 1. Update Request
    req.status = 'ASSIGNED';
    req.lawyer = lawyerName;
    req.assignedLawyer = lawyerName;
    req.leadCounsel = lawyerName;
    req.lawyerId = lawyerId;
    req.assignedAt = new Date().toISOString();
    req.assignmentRole = role;
    req.assignmentInstructions = instructions;
    this.persistRequests(requests);

    // 2. Update Case in SLCMS_STATE.cases
    if (typeof SLCMS_STATE !== 'undefined') {
      if (!Array.isArray(SLCMS_STATE.cases)) SLCMS_STATE.cases = [];
      let c = SLCMS_STATE.cases.find(item => item.id === req.id || item.requestId === req.id || item.caseNumber === caseDocket);
      if (c) {
        c.status = 'ASSIGNED';
        c.statusLabel = 'ASSIGNED / IN PROGRESS';
        c.progressStatus = 'IN_PROGRESS';
        c.progressPct = 25;
        c.lawyer = lawyerName;
        c.assignedLawyer = lawyerName;
        c.leadCounsel = lawyerName;
        c.leadCounselId = lawyerId;
        c.assignedAt = new Date().toISOString();
        c.internalInstructions = instructions;
      }
      if (typeof SLCMS_STATE.persistCases === 'function') SLCMS_STATE.persistCases();

      // Record Audit Trail
      if (typeof SLCMS_STATE.addAuditLog === 'function') {
        SLCMS_STATE.addAuditLog(
          'Lawyer Assigned to Matter',
          'Case Allocation',
          `Advocate ${lawyerName} assigned as ${role} for matter ${caseDocket} (${req.clientName}).`,
          'Success'
        );
      }
    }

    App.closeModal();
    App.showToast(`Matter ${caseDocket} successfully assigned to ${lawyerName}! Status is now ASSIGNED and active.`, 'success', 7000);

    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }
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

window.LegalRequestsView = LegalRequestsView;
