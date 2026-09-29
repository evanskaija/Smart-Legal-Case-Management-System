/* ==========================================================================
   SLCMS - Billing Subsystem & Invoice Management
   Real MySQL Data & Academic Simulation Hybrid
   ========================================================================== */

const BillingView = {
  currentTab: 'invoices', // 'invoices' | 'proofs' | 'record' | 'receipts'

  init() {
    this.ensureSeedData();
    this.restoreInvoices();
  },

  ensureSeedData() {
    if (typeof SLCMS_STATE !== 'undefined') {
      if (!Array.isArray(SLCMS_STATE.clients)) SLCMS_STATE.clients = [];
      let peter = SLCMS_STATE.clients.find(c => c.id === 'cli-001' || (c.name && c.name.includes('Peter Thomas Bocco')));
      if (!peter) {
        peter = {
          id: 'cli-001',
          clientNumber: 'CLT-2025-0001',
          name: 'Peter Thomas Bocco',
          email: 'peter.bocco@gmail.com',
          phone: '+255 754 889 900',
          clientType: 'INDIVIDUAL',
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED'
        };
        SLCMS_STATE.clients.unshift(peter);
      }

      if (!Array.isArray(SLCMS_STATE.users)) SLCMS_STATE.users = [];
      let joyce = SLCMS_STATE.users.find(u => u.username === 'joyce.mercer' || (u.name && u.name.includes('Joyce Mercer')));
      if (!joyce) {
        joyce = {
          id: 'usr-008',
          staffId: 'OFF-0008',
          username: 'joyce.mercer',
          name: 'Adv. Joyce Mercer',
          email: 'joyce.mercer@slcms.local',
          phone: '+255 754 990 011',
          role: 'Legal Officer',
          roleTitle: 'Senior Legal Officer',
          status: 'ACTIVE',
          department: 'Legal Operations & Client Relations'
        };
        SLCMS_STATE.users.push(joyce);
      }
    }
  },

  getInvoices() {
    this.ensureSeedData();

    // 1. Gather all existing invoices from runtime state and localStorage
    let list = [];
    const local = localStorage.getItem('slcms_persisted_invoices');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {}
    }

    if (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.invoices) && SLCMS_STATE.invoices.length > 0) {
      SLCMS_STATE.invoices.forEach(inv => {
        if (!list.some(existing => existing.id === inv.id || existing.invoiceNumber === inv.invoiceNumber)) {
          list.push(inv);
        }
      });
    }

    // 2. Self-healing / Auto-sync from slcms_client_legal_requests
    // If any client request was issued an invoice (e.g. SLCMS-2026-XXXXXX), guarantee that invoice exists!
    try {
      const rawReqs = localStorage.getItem('slcms_client_legal_requests');
      if (rawReqs) {
        const reqList = JSON.parse(rawReqs);
        if (Array.isArray(reqList)) {
          reqList.forEach(r => {
            if (r.invoiceNumber || r.status === 'INVOICE_SENT' || r.status === 'PAYMENT_PENDING') {
              const invNum = r.invoiceNumber || ('SLCMS-2026-' + String(r.id).replace(/\D/g, '').slice(-6));
              let existing = list.find(i => i.invoiceNumber === invNum || (i.requestId && i.requestId === r.id));
              if (!existing) {
                const autoInv = {
                  id: r.invoiceId || ('inv-' + (r.id ? String(r.id).replace(/\D/g, '') : Date.now())),
                  invoiceNumber: invNum,
                  requestId: r.id,
                  clientId: r.clientId || 'CLT-0008',
                  clientName: r.clientName || 'Dorcas Lasus',
                  clientEmail: r.clientEmail || 'evans6@gmail.com',
                  clientPhone: r.clientPhone || r.phone || '+255 700 000 000',
                  issueType: r.issueType || 'Probate',
                  serviceDescription: r.serviceDescription || 'Initial legal consultation and case assessment',
                  totalAmount: r.invoiceAmount || 150000,
                  amountPaid: 0,
                  balance: r.invoiceAmount || 150000,
                  issueDate: r.invoiceSentAt ? r.invoiceSentAt.split('T')[0] : new Date().toISOString().split('T')[0],
                  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  paymentInstructions: 'Remit fee via CRDB Bank A/C 0150244883900 SLCMS Chambers or Lipa Namba 554433. Upload deposit slip after payment.',
                  status: (r.status === 'PAYMENT_SUBMITTED' || r.paymentProofSubmitted) ? 'PAYMENT_SUBMITTED' : 'PAYMENT_PENDING',
                  createdBy: 'Adv. Joyce Mercer (Legal Officer)',
                  createdAt: r.invoiceSentAt || new Date().toISOString(),
                  payments: []
                };
                list.unshift(autoInv);
              } else {
                // Ensure synchronization of client fields
                if (r.clientId && !existing.clientId) existing.clientId = r.clientId;
                if (r.clientName && !existing.clientName) existing.clientName = r.clientName;
                if (r.clientEmail && !existing.clientEmail) existing.clientEmail = r.clientEmail;
                if (r.id && !existing.requestId) existing.requestId = r.id;
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Auto-sync invoices error:', e);
    }

    // 3. Fallback seed if still empty
    if (list.length === 0) {
      list = [{
        id: 1,
        invoiceNumber: 'INV-2026-0001',
        clientId: 'cli-001',
        clientName: 'Peter Thomas Bocco',
        requestId: 'REQ-2026-001',
        caseId: 'CASE-2025-003',
        serviceDescription: 'Initial legal consultation & contract drafting',
        totalAmount: 100000,
        amountPaid: 0,
        balance: 100000,
        issueDate: '2026-09-01',
        dueDate: '2026-09-30',
        status: 'ISSUED',
        paymentInstructions: 'Remit payment via CRDB Bank A/C 0150244883900 SLCMS Legal Partners or Lipa Namba 554433.',
        createdBy: 'Adv. Joyce Mercer',
        payments: []
      }];
    }

    if (typeof SLCMS_STATE !== 'undefined') SLCMS_STATE.invoices = list;
    localStorage.setItem('slcms_persisted_invoices', JSON.stringify(list));
    return list;
  },

  async restoreInvoices() {
    const currentList = this.getInvoices();
    try {
      const res = await fetch('api/billing.php');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.invoices) && data.invoices.length > 0) {
        const mapped = data.invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || inv.invoice_number || 'INV-2026-0001',
          clientId: inv.clientId || inv.client_id || 'cli-001',
          clientName: inv.clientName || this.getClientNameById(inv.clientId || inv.client_id),
          clientEmail: inv.clientEmail || '',
          requestId: inv.requestId || inv.request_id || null,
          caseId: inv.caseId || inv.case_id || null,
          serviceDescription: inv.serviceDescription || inv.service_description || 'Legal Consultation',
          totalAmount: parseFloat(inv.totalAmount || inv.total_amount || 0),
          amountPaid: parseFloat(inv.amountPaid || inv.amount_paid || 0),
          balance: parseFloat(inv.balance || (inv.total_amount - inv.amount_paid) || 0),
          issueDate: inv.issueDate || inv.issue_date || new Date().toISOString().split('T')[0],
          dueDate: inv.dueDate || inv.due_date || new Date().toISOString().split('T')[0],
          status: inv.status || 'PAYMENT_PENDING',
          createdBy: inv.createdBy || inv.created_by || 'Adv. Joyce Mercer',
          payments: inv.payments || []
        }));

        // Merge: keep all local invoices, append remote ones if not already present
        mapped.forEach(remoteInv => {
          const exists = currentList.some(loc => 
            (loc.id && String(loc.id) === String(remoteInv.id)) ||
            (loc.invoiceNumber && loc.invoiceNumber === remoteInv.invoiceNumber)
          );
          if (!exists) {
            currentList.push(remoteInv);
          }
        });

        SLCMS_STATE.invoices = currentList;
        localStorage.setItem('slcms_persisted_invoices', JSON.stringify(currentList));
        return currentList;
      }
    } catch (e) {
      console.warn('Backend billing API fetch warning:', e);
    }
    return currentList;
  },

  persistInvoices() {
    if (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.invoices)) {
      localStorage.setItem('slcms_persisted_invoices', JSON.stringify(SLCMS_STATE.invoices));
    }
  },

  getClientNameById(clientId) {
    if (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.clients)) {
      const found = SLCMS_STATE.clients.find(c => c.id === clientId || c.clientNumber === clientId);
      if (found && found.name) return found.name;
    }
    return 'Peter Thomas Bocco';
  },

  setTab(tabName) {
    this.currentTab = tabName;
    const container = document.getElementById('main-content-container');
    if (container) {
      container.innerHTML = this.render();
    }

    // Synchronize route and sidebar active state immediately without whole-page router reloads
    const routeMap = {
      'invoices': 'billing-create-invoice',
      'proofs': 'billing-proofs',
      'receipts': 'billing-receipts',
      'record': 'billing-record'
    };
    const targetRoute = routeMap[tabName];
    if (targetRoute && typeof App !== 'undefined') {
      App.currentRoute = targetRoute;
      try {
        history.replaceState(null, '', '#' + targetRoute);
      } catch (e) {
        window.location.hash = '#' + targetRoute;
      }

      const titleMap = {
        'billing-create-invoice': 'Create and Send Invoice',
        'billing-proofs': 'Payment Proofs Verification',
        'billing-receipts': 'Official Payment Receipts',
        'billing-record': 'Record Payment'
      };
      const titleEl = document.getElementById('topbar-page-title');
      if (titleEl && titleMap[targetRoute]) {
        titleEl.innerText = titleMap[targetRoute];
      }

      // Update sidebar nav active styling immediately
      const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
      navLinks.forEach(link => {
        const r = link.dataset.route;
        if (r === targetRoute || (targetRoute === 'billing-proofs' && r === 'billing-verify')) {
          link.classList.add('active');
        } else if (['billing-create-invoice', 'billing-proofs', 'billing-verify'].includes(r)) {
          link.classList.remove('active');
        }
      });
    }
  },

  // ==========================================================================
  // 1. LEGAL OFFICER BILLING VIEW
  // ==========================================================================
  render() {
    const invoices = this.getInvoices();

    // Calculate Real MySQL Dashboard Counts for Legal Officer
    const issuedCount = invoices.filter(i => i.status === 'ISSUED' || i.status === 'UNPAID' || i.status === 'PAYMENT_PENDING').length;
    const pendingCount = invoices.filter(i => i.status === 'VERIFICATION_PENDING' || i.status === 'PAYMENT_SUBMITTED' || i.status === 'PROOF_SUBMITTED' || i.status === 'DEMO_VERIFICATION_PENDING').length;
    const paidCount = invoices.filter(i => i.status === 'PAID' || i.status === 'DEMO_PAID').length;
    
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = invoices.filter(i => i.dueDate < today && i.status !== 'PAID' && i.status !== 'DEMO_PAID').length;

    const pendingInvoices = invoices.filter(i => i.status === 'VERIFICATION_PENDING' || i.status === 'PAYMENT_SUBMITTED' || i.status === 'PROOF_SUBMITTED' || i.status === 'DEMO_VERIFICATION_PENDING');

    return `
      <div class="billing-view animate-fade" style="padding-bottom: 2.5rem;">
        
        <!-- Header & Top Actions -->
        <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 class="page-title" style="margin-bottom: 0.25rem;">Billing &amp; Financial Management</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin: 0;">
              Legal Officer chamber ledger for invoicing, payment verification, and fee receipts.
            </p>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button type="button" class="btn btn-gold" onclick="BillingView.openCreateInvoiceModal()" style="font-weight: 700;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              <span>+ Create &amp; Send Invoice</span>
            </button>
          </div>
        </div>

        <!-- Requirement 8: Legal Officer Dashboard Stat Cards (Clickable shortcuts) -->
        <div class="grid grid-cols-4 gap-4" style="margin-bottom: 1.75rem;">
          <div class="stat-card" onclick="BillingView.setTab('invoices')" style="border-left: 4px solid #3B82F6; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="View Issued Invoices" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: #1E40AF;">${issuedCount}</div>
                <div class="stat-label">Issued Invoices</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-navy">📄</div>
            </div>
            <div class="stat-footer"><span class="text-muted" style="font-size: 0.78rem;">Awaiting Client Settlement &rarr;</span></div>
          </div>

          <div class="stat-card" onclick="BillingView.setTab('proofs')" style="border-left: 4px solid #F59E0B; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="View Verification Pending Proofs" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: #D97706;">${pendingCount}</div>
                <div class="stat-label">Verification Pending</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-gold">⏳</div>
            </div>
            <div class="stat-footer"><span style="color: #D97706; font-size: 0.78rem; font-weight: 600;">Payment Proofs to Verify &rarr;</span></div>
          </div>

          <div class="stat-card" onclick="BillingView.setTab('receipts')" style="border-left: 4px solid #10B981; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="View Confirmed Settlements" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: #059669;">${paidCount}</div>
                <div class="stat-label">Paid Invoices</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-green">✅</div>
            </div>
            <div class="stat-footer"><span style="color: #059669; font-size: 0.78rem; font-weight: 600;">Confirmed Settlements &rarr;</span></div>
          </div>

          <div class="stat-card" onclick="BillingView.setTab('invoices')" style="border-left: 4px solid #EF4444; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;" title="View Overdue Invoices" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: #DC2626;">${overdueCount}</div>
                <div class="stat-label">Overdue Invoices</div>
              </div>
              <div class="stat-icon-wrapper" style="background: #FEE2E2; color: #DC2626;">⚠️</div>
            </div>
            <div class="stat-footer"><span style="color: #DC2626; font-size: 0.78rem; font-weight: 600;">Passed Payment Due Date &rarr;</span></div>
          </div>
        </div>

        <!-- Sub-tabs inside Legal Officer Billing Suite -->
        <div style="border-bottom: 2px solid var(--color-border); margin-bottom: 1.5rem; display: flex; gap: 0.75rem; overflow-x: auto;">
          <button type="button" class="tab-btn ${this.currentTab === 'invoices' ? 'active' : ''}" onclick="BillingView.setTab('invoices')" style="padding: 0.75rem 1.25rem; font-weight: 700; border: none; background: none; border-bottom: 3px solid ${this.currentTab === 'invoices' ? 'var(--color-gold, #C89B3C)' : 'transparent'}; color: ${this.currentTab === 'invoices' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; cursor: pointer; transition: all 0.15s;">
            Invoices (${invoices.length})
          </button>
          <button type="button" class="tab-btn ${this.currentTab === 'proofs' ? 'active' : ''}" onclick="BillingView.setTab('proofs')" style="padding: 0.75rem 1.25rem; font-weight: 700; border: none; background: none; border-bottom: 3px solid ${this.currentTab === 'proofs' ? 'var(--color-gold, #C89B3C)' : 'transparent'}; color: ${this.currentTab === 'proofs' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; cursor: pointer; transition: all 0.15s;">
            Payment Proofs ${pendingCount > 0 ? `<span class="badge" style="background: #F59E0B; color: #FFF; margin-left: 0.35rem;">${pendingCount}</span>` : ''}
          </button>
          <button type="button" class="tab-btn ${this.currentTab === 'receipts' ? 'active' : ''}" onclick="BillingView.setTab('receipts')" style="padding: 0.75rem 1.25rem; font-weight: 700; border: none; background: none; border-bottom: 3px solid ${this.currentTab === 'receipts' ? 'var(--color-gold, #C89B3C)' : 'transparent'}; color: ${this.currentTab === 'receipts' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; cursor: pointer; transition: all 0.15s;">
            Receipts (${paidCount})
          </button>
          <button type="button" class="tab-btn ${this.currentTab === 'record' ? 'active' : ''}" onclick="BillingView.setTab('record')" style="padding: 0.75rem 1.25rem; font-weight: 700; border: none; background: none; border-bottom: 3px solid ${this.currentTab === 'record' ? 'var(--color-gold, #C89B3C)' : 'transparent'}; color: ${this.currentTab === 'record' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; cursor: pointer; transition: all 0.15s;">
            Record Payment
          </button>
        </div>

        <!-- Tab 1: Invoices List -->
        ${this.currentTab === 'invoices' ? this.renderInvoicesTab(invoices) : ''}

        <!-- Tab 2: Payment Proofs Verification -->
        ${this.currentTab === 'proofs' ? this.renderPaymentProofsTab(pendingInvoices) : ''}

        <!-- Tab 3: Record Payment Form -->
        ${this.currentTab === 'record' ? this.renderRecordPaymentTab(invoices) : ''}

        <!-- Tab 4: Receipts -->
        ${this.currentTab === 'receipts' ? this.renderReceiptsTab(invoices.filter(i => i.status === 'PAID' || i.status === 'DEMO_PAID')) : ''}

      </div>
    `;
  },

  // Sub-Tab 1: Invoices Table
  renderInvoicesTab(invoices) {
    if (!invoices || invoices.length === 0) {
      return `
        <div class="card" style="padding: 3rem; text-align: center; border-radius: 12px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--color-text-muted);">📄</div>
          <h3 style="margin: 0; color: var(--color-primary); font-size: 1.2rem; font-weight: 700;">No invoices have been issued.</h3>
          <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin-top: 0.5rem;">
            Click "+ Create Invoice" above to issue an invoice for client legal requests.
          </p>
        </div>
      `;
    }

    return `
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);">
          <h3 class="card-title" style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--color-primary);">Firm Issued Invoices</h3>
          <span style="font-size: 0.8rem; color: var(--color-text-secondary);">Total Records: ${invoices.length}</span>
        </div>

        <div class="table-container" style="overflow-x: auto;">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: var(--color-surface-subtle); text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary);">
                <th style="padding: 0.85rem 1rem;">Invoice No</th>
                <th style="padding: 0.85rem 1rem;">Client Name</th>
                <th style="padding: 0.85rem 1rem;">Service Description</th>
                <th style="padding: 0.85rem 1rem;">Total (TZS)</th>
                <th style="padding: 0.85rem 1rem;">Balance</th>
                <th style="padding: 0.85rem 1rem;">Due Date</th>
                <th style="padding: 0.85rem 1rem;">Status</th>
                <th style="padding: 0.85rem 1rem; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => {
                const total = inv.totalAmount || inv.total || inv.amount || 0;
                const paid = inv.amountPaid || 0;
                const bal = inv.status === 'PAID' || inv.status === 'DEMO_PAID' ? 0 : (inv.balance !== undefined ? inv.balance : (total - paid));
                return `
                  <tr style="border-bottom: 1px solid var(--color-border); font-size: 0.88rem;">
                    <td style="padding: 1rem;"><strong style="font-family: var(--font-mono); color: var(--color-primary);">${inv.invoiceNumber || inv.invoiceNo}</strong></td>
                    <td style="padding: 1rem;"><div style="font-weight: 600;">${inv.clientName || this.getClientNameById(inv.clientId)}</div></td>
                    <td style="padding: 1rem;"><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${inv.serviceDescription || 'Legal Services'}</div></td>
                    <td style="padding: 1rem;"><strong style="color: var(--color-primary);">TZS ${total.toLocaleString()}</strong></td>
                    <td style="padding: 1rem;"><strong style="color: ${bal > 0 ? '#D97706' : '#059669'};">TZS ${bal.toLocaleString()}</strong></td>
                    <td style="padding: 1rem;">${inv.dueDate}</td>
                    <td style="padding: 1rem;">${this.renderStatusBadge(inv.status)}</td>
                    <td style="padding: 1rem; text-align: right;">
                      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="BillingView.previewInvoice('${inv.id}')">View</button>
                        ${inv.status === 'PAID' || inv.status === 'DEMO_PAID' ? `
                          <button class="btn btn-gold btn-sm" onclick="BillingView.showReceipt('${inv.id}')">📄 Receipt</button>
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

  // Sub-Tab 2: Payment Proof Verification
  renderPaymentProofsTab(pendingInvoices) {
    if (!pendingInvoices || pendingInvoices.length === 0) {
      return `
        <div class="card" style="padding: 3rem; text-align: center; border-radius: 12px; border: 1px dashed var(--color-border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: #10B981;">✅</div>
          <h3 style="margin: 0; color: var(--color-primary); font-size: 1.2rem; font-weight: 700;">No pending payment verifications.</h3>
          <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin-top: 0.5rem; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.5;">
            All client payment proofs have been processed and verified. When clients upload bank transfer or mobile deposit slips, they will appear here.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="BillingView.setTab('invoices')">View All Invoices</button>
            <button type="button" class="btn btn-gold btn-sm" onclick="BillingView.simulateClientPaymentProof()">⚡ Test Incoming Payment Proof</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="card" style="padding: 1.5rem; border: 2px solid #F59E0B; background: #FEF3C7;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="margin: 0; color: #92400E; font-size: 1.1rem; font-weight: 800;">
            🚨 Legal Officer Verification Pending (${pendingInvoices.length})
          </h3>
          <span style="font-size: 0.82rem; color: #78350F; font-weight: 600;">Check real bank / mobile-money records before confirming settlement</span>
        </div>

        <div class="grid grid-cols-1 gap-4">
          ${pendingInvoices.map(inv => {
            const lastPay = (inv.payments && inv.payments.length > 0) ? inv.payments[inv.payments.length - 1] : {};
            const ref = inv.demoReference || lastPay.referenceNumber || ('REF-' + inv.invoiceNumber);
            const amt = inv.totalAmount || inv.total || inv.amount || 100000;
            const clientName = inv.clientName || this.getClientNameById(inv.clientId);

            return `
              <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 8px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div style="font-size: 0.9rem; line-height: 1.6;">
                  <div>Client: <strong style="color: var(--color-primary); font-size: 1.05rem;">${clientName}</strong></div>
                  <div>Invoice: <strong style="font-family: var(--font-mono); color: #B45309;">${inv.invoiceNumber || inv.invoiceNo}</strong></div>
                  <div>Amount Billed: <strong style="color: #059669; font-size: 1.05rem;">TZS ${amt.toLocaleString()}</strong></div>
                  <div>Payment Reference: <strong style="font-family: var(--font-mono); background: #FEF3C7; padding: 2px 8px; border-radius: 4px; color: #92400E;">${ref}</strong></div>
                  <div>Status: <span class="badge" style="background: #FEF3C7; color: #B45309; border: 1px solid #FCD34D; font-weight: 700;">Verification Pending</span></div>
                </div>

                <div style="display: flex; gap: 0.75rem;">
                  <!-- Requirement 6: [Reject] [Confirm Payment] -->
                  <button class="btn btn-secondary" onclick="BillingView.rejectPayment('${inv.id}')" style="border-color: #EF4444; color: #DC2626; font-weight: 700;">
                    [Reject]
                  </button>
                  <button class="btn btn-gold" onclick="BillingView.confirmPayment('${inv.id}')" style="font-weight: 800;">
                    [Confirm Payment]
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // Sub-Tab 3: Record Direct Payment
  renderRecordPaymentTab(invoices) {
    const unpaidInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'DEMO_PAID');

    return `
      <div class="card" style="padding: 1.75rem; max-width: 650px; margin: 0 auto;">
        <h3 style="margin-top: 0; color: var(--color-primary); font-size: 1.2rem; font-weight: 700; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          Record Direct Offline Payment (Cash / Wire / Cheque)
        </h3>
        
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Select Invoice *</label>
          <select id="rec-inv-id" class="form-control">
            ${unpaidInvoices.map(i => `<option value="${i.id}">${i.invoiceNumber || i.invoiceNo} - ${i.clientName || this.getClientNameById(i.clientId)} (TZS ${(i.totalAmount || i.total || i.amount || 0).toLocaleString()})</option>`).join('')}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label required">Amount Received (TZS) *</label>
            <input type="number" id="rec-amount" class="form-control" value="100000">
          </div>
          <div class="form-group">
            <label class="form-label required">Payment Method *</label>
            <select id="rec-method" class="form-control">
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash Deposit">Cash Deposit</option>
              <option value="Cheque">Cheque</option>
              <option value="CRDB SimBanking">CRDB SimBanking</option>
              <option value="NMB Mobile">NMB Mobile</option>
              <option value="M-Pesa">M-Pesa</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4" style="margin-bottom: 1.25rem;">
          <div class="form-group">
            <label class="form-label required">Transaction Reference *</label>
            <input type="text" id="rec-ref" class="form-control" placeholder="e.g. TXN-99882341">
          </div>
          <div class="form-group">
            <label class="form-label required">Payment Date *</label>
            <input type="date" id="rec-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>

        <button class="btn btn-gold" onclick="BillingView.submitRecordPayment()" style="width: 100%; font-weight: 700; padding: 0.75rem;">
          Record Payment &amp; Issue Receipt
        </button>
      </div>
    `;
  },

  // Sub-Tab 4: Receipts List
  renderReceiptsTab(paidInvoices) {
    if (!paidInvoices || paidInvoices.length === 0) {
      return `
        <div class="card" style="padding: 3rem; text-align: center; border-radius: 12px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--color-text-muted);">🧾</div>
          <h3 style="margin: 0; color: var(--color-primary); font-size: 1.2rem; font-weight: 700;">No payment receipts issued yet.</h3>
          <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin-top: 0.5rem;">
            Confirmed invoice payments automatically generate official receipts here.
          </p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-2 gap-4">
        ${paidInvoices.map(inv => `
          <div class="card" style="padding: 1.25rem; border-radius: 8px; border: 1px solid var(--color-border);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <div style="font-family: var(--font-mono); font-weight: 800; color: var(--color-gold, #D97706); font-size: 1.1rem;">
                  RCPT-${(inv.invoiceNumber || inv.invoiceNo).replace('INV-', '')}
                </div>
                <div style="font-weight: 700; color: var(--color-primary); margin-top: 2px;">
                  ${inv.clientName || this.getClientNameById(inv.clientId)}
                </div>
              </div>
              <span class="badge" style="background: #D1FAE5; color: #065F46; font-weight: 700;">CONFIRMED</span>
            </div>

            <div style="font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 1rem;">
              <div>Invoice No: <strong>${inv.invoiceNumber || inv.invoiceNo}</strong></div>
              <div>Amount Settled: <strong style="color: #059669;">TZS ${(inv.totalAmount || inv.total || inv.amount || 0).toLocaleString()}</strong></div>
              <div>Service: ${inv.serviceDescription || 'Legal Services'}</div>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="BillingView.showReceipt('${inv.id}')" style="width: 100%; font-weight: 700;">
              📄 View Official Receipt
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderStatusBadge(status) {
    switch (status) {
      case 'PAID':
      case 'DEMO_PAID':
      case 'Paid':
        return `<span class="badge" style="background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; font-weight: 700;">Paid</span>`;
      case 'VERIFICATION_PENDING':
      case 'PAYMENT_SUBMITTED':
      case 'PROOF_SUBMITTED':
      case 'DEMO_VERIFICATION_PENDING':
        return `<span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-weight: 700;">Verification Pending</span>`;
      case 'REJECTED':
      case 'DEMO_REJECTED':
        return `<span class="badge" style="background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; font-weight: 700;">Payment Rejected</span>`;
      default:
        return `<span class="badge" style="background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; font-weight: 700;">Issued</span>`;
    }
  },

  // ==========================================================================
  // 2. CLIENT PORTAL BILLING VIEW (Requirement 2 & Requirement 5)
  // ==========================================================================
  renderClientView() {
    const invoices = this.getInvoices();
    const currentUser = (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.currentUser) ? SLCMS_STATE.currentUser : {};

    // Filter invoices for client
    const clientInvoices = invoices.filter(i => {
      if (currentUser.id && i.clientId === currentUser.id) return true;
      if (currentUser.name && i.clientName && i.clientName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
      return i.clientId === 'cli-001' || (i.clientName && i.clientName.includes('Peter Thomas Bocco'));
    });

    const displayInvoices = clientInvoices.length > 0 ? clientInvoices : invoices;

    // Requirement 8: Real Dashboard Counts for Client
    const outstandingInvoices = displayInvoices.filter(i => i.status === 'ISSUED' || i.status === 'UNPAID' || i.status === 'PAYMENT_PENDING');
    const pendingVerification = displayInvoices.filter(i => i.status === 'VERIFICATION_PENDING' || i.status === 'PAYMENT_SUBMITTED' || i.status === 'PROOF_SUBMITTED' || i.status === 'DEMO_VERIFICATION_PENDING');
    const receiptsAvailable = displayInvoices.filter(i => i.status === 'PAID' || i.status === 'DEMO_PAID');

    return `
      <div class="client-billing-view animate-fade" style="padding-bottom: 2.5rem;">
        
        <!-- Header -->
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.4rem; font-weight: 800; margin: 0 0 0.35rem 0; color: var(--color-primary); font-family: var(--font-heading);">
            My Legal Billing &amp; Fee Statements
          </h2>
          <p style="margin: 0; color: var(--color-text-secondary); font-size: 0.88rem;">
            View firm invoices, submit proof of outside payment transfers, and access official fee receipts.
          </p>
        </div>

        <!-- Requirement 8: Client Dashboard Counts (Outstanding Invoices, Payments Awaiting Verification, Available Receipts) -->
        <div class="grid grid-cols-3 gap-6" style="margin-bottom: 1.75rem;">
          <div class="stat-card" style="border-left: 4px solid #3B82F6;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: #1E40AF;">${outstandingInvoices.length}</div>
                <div class="stat-label">Outstanding Invoices</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-navy">📄</div>
            </div>
          </div>

          <div class="stat-card" style="border-left: 4px solid #F59E0B;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: #D97706;">${pendingVerification.length}</div>
                <div class="stat-label">Payments Awaiting Verification</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-gold">⏳</div>
            </div>
          </div>

          <div class="stat-card" style="border-left: 4px solid #10B981;">
            <div class="stat-card-top">
              <div>
                <div class="stat-value" style="color: #059669;">${receiptsAvailable.length}</div>
                <div class="stat-label">Available Receipts</div>
              </div>
              <div class="stat-icon-wrapper stat-icon-green">🧾</div>
            </div>
          </div>
        </div>

        <!-- Requirement 8: Empty State Handling -->
        ${displayInvoices.length === 0 ? `
          <div class="card" style="padding: 3rem; text-align: center; border-radius: 12px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--color-text-muted);">📄</div>
            <h3 style="margin: 0; color: var(--color-primary); font-size: 1.2rem; font-weight: 700;">No invoices have been issued.</h3>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin-top: 0.5rem;">
              You do not have any pending or historical invoices from the legal firm.
            </p>
          </div>
        ` : `
          <!-- Requirement 5: Client Billing Page Display -->
          <div class="grid grid-cols-1 gap-6">
            ${displayInvoices.map(inv => {
              const total = inv.totalAmount || inv.total || inv.amount || 100000;
              const paid = inv.amountPaid || 0;
              const bal = inv.status === 'PAID' || inv.status === 'DEMO_PAID' ? 0 : (inv.balance !== undefined ? inv.balance : (total - paid));
              const invNum = inv.invoiceNumber || inv.invoiceNo || 'INV-2026-0001';

              return `
                <div class="card" style="padding: 1.75rem; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-surface, #FFF);">
                  
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 800; color: var(--color-primary);">${invNum}</span>
                        ${this.renderStatusBadge(inv.status)}
                      </div>
                      <div style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary); margin-top: 0.4rem;">
                        Service: ${inv.serviceDescription || 'Initial legal consultation'}
                      </div>
                      <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                        Due Date: <strong>${inv.dueDate}</strong>
                      </div>
                    </div>

                    <div style="text-align: right;">
                      <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700;">Amount Billed</div>
                      <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); margin-top: 2px;">
                        TZS ${total.toLocaleString()}
                      </div>
                      <div style="font-size: 0.85rem; color: ${bal > 0 ? '#D97706' : '#059669'}; font-weight: 700; margin-top: 0.2rem;">
                        Paid: TZS ${paid.toLocaleString()} &bull; Balance: TZS ${bal.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <!-- Requirement 5: Exact Buttons [View Invoice] [Download] [Upload Payment Proof] (NO Pay Now button!) -->
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                      <button class="btn btn-secondary btn-sm" onclick="BillingView.previewInvoice('${inv.id}')" style="font-weight: 600;">
                        [View Invoice]
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="BillingView.downloadInvoice('${inv.id}')" style="font-weight: 600;">
                        [Download]
                      </button>
                      ${inv.status !== 'PAID' && inv.status !== 'DEMO_PAID' ? `
                        <button class="btn btn-gold btn-sm" onclick="BillingView.openUploadProofModal('${inv.id}')" style="font-weight: 700;">
                          [Upload Payment Proof]
                        </button>
                      ` : ''}
                    </div>

                    ${inv.status === 'PAID' || inv.status === 'DEMO_PAID' ? `
                      <button class="btn btn-gold btn-sm" onclick="BillingView.showReceipt('${inv.id}')" style="font-weight: 700;">
                        📄 View Receipt
                      </button>
                    ` : ''}
                  </div>

                  ${inv.status === 'VERIFICATION_PENDING' || inv.status === 'PAYMENT_SUBMITTED' || inv.status === 'PROOF_SUBMITTED' || inv.status === 'DEMO_VERIFICATION_PENDING' ? `
                    <div style="margin-top: 1.25rem; background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 1rem; text-align: center;">
                      <div style="font-size: 1rem; font-weight: 800; color: #92400E; margin-bottom: 0.2rem;">
                        Status: Verification Pending
                      </div>
                      <div style="font-size: 0.85rem; color: #78350F;">
                        Payment proof uploaded. Awaiting verification by Legal Officer.
                      </div>
                    </div>
                  ` : ''}

                </div>
              `;
            }).join('')}
          </div>
        `}

      </div>
    `;
  },

  // ==========================================================================
  // 3. CREATE INVOICE MODAL (Legacy draft - see Step 5 openCreateInvoiceModal)
  // ==========================================================================
  _legacyOpenCreateInvoiceModal() {
    const clients = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.clients)) ? SLCMS_STATE.clients : [];
    const requests = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.clientRequests)) ? SLCMS_STATE.clientRequests : [];

    const invCount = (SLCMS_STATE.invoices || []).length + 1;
    const autoInvNum = `INV-2026-${String(invCount).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    App.openModal(`
      <div class="modal-header" style="border-bottom: 2px solid var(--color-gold, #C89B3C);">
        <h3 class="modal-title" style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary);">Create New Client Invoice</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem;">
        
        <!-- Requirement 4: Auto generated info pill -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; font-size: 0.88rem;">
          <div>Auto Generated No: <strong style="font-family: var(--font-mono); color: var(--color-primary);">${autoInvNum}</strong></div>
          <div>Status: <strong style="color: #3B82F6;">Issued</strong> &bull; Amount Paid: <strong style="color: #059669;">TZS 0</strong></div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Requirement 4: Client * -->
          <div class="form-group">
            <label class="form-label required">Client *</label>
            <select id="create-inv-client" class="form-control">
              ${clients.length > 0 ? clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('') : `<option value="cli-001">Peter Thomas Bocco</option>`}
            </select>
          </div>

          <!-- Requirement 4: Legal Request * -->
          <div class="form-group">
            <label class="form-label required">Legal Request *</label>
            <select id="create-inv-request" class="form-control">
              <option value="REQ-2026-001">REQ-2026-001 - Legal Counsel & Representation</option>
              ${requests.map(r => `<option value="${r.id}">${r.id} - ${r.subject || r.type || 'Client Request'}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Requirement 4: Service Description * -->
        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label required">Service Description *</label>
          <input type="text" id="create-inv-service" class="form-control" value="Initial legal consultation and drafting of legal pleadings">
        </div>

        <div class="grid grid-cols-3 gap-4" style="margin-top: 1rem;">
          <!-- Requirement 4: Amount (TZS) * -->
          <div class="form-group">
            <label class="form-label required">Amount (TZS) *</label>
            <input type="number" id="create-inv-amount" class="form-control" value="100000">
          </div>

          <!-- Requirement 4: Issue Date * -->
          <div class="form-group">
            <label class="form-label required">Issue Date *</label>
            <input type="date" id="create-inv-issue" class="form-control" value="${today}">
          </div>

          <!-- Requirement 4: Due Date * -->
          <div class="form-group">
            <label class="form-label required">Due Date *</label>
            <input type="date" id="create-inv-due" class="form-control" value="${defaultDue}">
          </div>
        </div>

        <!-- Requirement 4: Payment Instructions * -->
        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label required">Payment Instructions *</label>
          <textarea id="create-inv-instructions" class="form-control" rows="2">Remit bank transfer to CRDB Bank A/C: 0150244883900 SLCMS Legal Partners or Lipa Namba 554433. Payment must be made outside SLCMS system.</textarea>
        </div>

      </div>

      <div class="modal-footer" style="padding: 1.25rem 1.5rem;">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <!-- Requirement 4: [Create and Send Invoice] -->
        <button class="btn btn-gold" onclick="BillingView._legacySubmitCreateInvoice('${autoInvNum}')" style="font-weight: 800; padding: 0.65rem 1.5rem;">
          [Create and Send Invoice]
        </button>
      </div>
    `, 'modal-lg');
  },

  async _legacySubmitCreateInvoice(autoNum) {

    const clientId = document.getElementById('create-inv-client')?.value || 'cli-001';
    const requestId = document.getElementById('create-inv-request')?.value || 'REQ-2026-001';
    const serviceDesc = document.getElementById('create-inv-service')?.value || 'Legal Consultation';
    const amount = parseFloat(document.getElementById('create-inv-amount')?.value || '100000');
    const issueDate = document.getElementById('create-inv-issue')?.value || new Date().toISOString().split('T')[0];
    const dueDate = document.getElementById('create-inv-due')?.value || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const instructions = document.getElementById('create-inv-instructions')?.value || '';

    const newInv = {
      id: Date.now(),
      invoiceNumber: autoNum,
      clientId: clientId,
      clientName: this.getClientNameById(clientId),
      requestId: requestId,
      caseId: null,
      serviceDescription: serviceDesc,
      totalAmount: amount,
      amountPaid: 0,
      balance: amount,
      issueDate: issueDate,
      dueDate: dueDate,
      status: 'ISSUED',
      paymentInstructions: instructions,
      createdBy: (SLCMS_STATE.currentUser && SLCMS_STATE.currentUser.name) ? SLCMS_STATE.currentUser.name : 'Adv. Joyce Mercer',
      payments: []
    };

    const invoices = this.getInvoices();
    invoices.unshift(newInv);
    SLCMS_STATE.invoices = invoices;
    this.persistInvoices();

    // Call Java / PHP POST /api/invoices
    try {
      await fetch('api/billing.php?action=create_invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          requestId: requestId,
          serviceDescription: serviceDesc,
          totalAmount: amount,
          issueDate: issueDate,
          dueDate: dueDate
        })
      });
    } catch (e) {}

    if (typeof App !== 'undefined') {
      App.closeModal();
      App.showToast(`Invoice ${autoNum} issued successfully! Amount Paid: TZS 0, Balance: TZS ${amount.toLocaleString()}`, 'success');
      this.setTab('invoices');
      if (typeof App.renderSidebarNav === 'function') {
        App.renderSidebarNav();
      }
    }
  },

  // ==========================================================================
  // 4. CLIENT UPLOAD PAYMENT PROOF MODAL (Requirement 6)
  // ==========================================================================
  openUploadProofModal(invId) {
    const invoices = this.getInvoices();
    const inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.invoiceNo === invId) || invoices[0];
    const total = inv ? (inv.totalAmount || inv.total || inv.amount || 100000) : 100000;
    const invNum = inv ? (inv.invoiceNumber || inv.invoiceNo || 'INV-2026-0001') : 'INV-2026-0001';

    App.openModal(`
      <div class="modal-header" style="border-bottom: 2px solid var(--color-gold, #C89B3C);">
        <h3 class="modal-title" style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary);">Upload Payment Proof</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem;">
        
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
          <div>Invoice: <strong style="font-family: var(--font-mono); color: var(--color-primary);">${invNum}</strong></div>
          <div style="margin-top: 4px;">Service: <strong>${inv ? inv.serviceDescription : 'Legal Consultation'}</strong></div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Requirement 6: Amount Paid * -->
          <div class="form-group">
            <label class="form-label required">Amount Paid (TZS) *</label>
            <input type="number" id="proof-amount" class="form-control" value="${total}">
          </div>

          <!-- Requirement 6: Payment Method * -->
          <div class="form-group">
            <label class="form-label required">Payment Method *</label>
            <select id="proof-method" class="form-control">
              <option value="Bank Transfer">Bank Transfer (CRDB/NMB/NBC)</option>
              <option value="CRDB SimBanking">CRDB SimBanking</option>
              <option value="NMB Mobile">NMB Mobile</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Tigo Pesa">Tigo Pesa</option>
              <option value="Cash Deposit">Cash Deposit</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4" style="margin-top: 1rem;">
          <!-- Requirement 6: Payment Date * -->
          <div class="form-group">
            <label class="form-label required">Payment Date *</label>
            <input type="date" id="proof-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
          </div>

          <!-- Requirement 6: Transaction Reference * -->
          <div class="form-group">
            <label class="form-label required">Transaction Reference *</label>
            <input type="text" id="proof-ref" class="form-control" placeholder="e.g. CRDB-2026-9923" value="REF-2026-${Math.floor(1000 + Math.random() * 9000)}">
          </div>
        </div>

        <!-- Requirement 6: Proof of Payment * -->
        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label required">Proof of Payment File *</label>
          <div style="border: 2px dashed var(--color-border); padding: 1.5rem; text-align: center; border-radius: 8px; background: var(--color-surface-subtle);">
            <input type="file" id="proof-file-input" style="display: none;" onchange="document.getElementById('proof-file-name').innerText = this.files[0] ? this.files[0].name : ''">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('proof-file-input').click()">Browse Transfer Receipt (PDF/Image)...</button>
            <div id="proof-file-name" style="margin-top: 0.5rem; font-weight: 700; color: var(--color-primary); font-size: 0.85rem;">payment_slip_proof.pdf</div>
          </div>
        </div>

      </div>

      <div class="modal-footer" style="padding: 1.25rem 1.5rem;">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="BillingView.submitUploadProof('${inv ? inv.id : invId}')" style="font-weight: 800; padding: 0.65rem 1.5rem;">
          Submit Proof for Verification
        </button>
      </div>
    `);
  },

  async submitUploadProof(invId) {
    const amount = parseFloat(document.getElementById('proof-amount')?.value || '100000');
    const method = document.getElementById('proof-method')?.value || 'Bank Transfer';
    const payDate = document.getElementById('proof-date')?.value || new Date().toISOString().split('T')[0];
    const ref = document.getElementById('proof-ref')?.value || 'REF-2026-0001';

    const invoices = this.getInvoices();
    const inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.invoiceNo === invId);

    if (inv) {
      // Requirement 6: Status becomes Verification Pending
      inv.status = 'VERIFICATION_PENDING';
      inv.demoReference = ref;
      if (!Array.isArray(inv.payments)) inv.payments = [];
      inv.payments.push({
        amount: amount,
        paymentMethod: method,
        paymentDate: payDate,
        referenceNumber: ref,
        status: 'PENDING'
      });
      this.persistInvoices();
    }

    try {
      await fetch('api/billing.php?action=upload_proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invId,
          amount: amount,
          paymentMethod: method,
          referenceNumber: ref,
          paymentDate: payDate
        })
      });
    } catch (e) {}

    if (typeof App !== 'undefined') {
      App.closeModal();
      App.showToast('Payment proof submitted successfully! Status updated to Verification Pending.', 'success');
      App.refreshCurrentView();
    }
  },

  // ==========================================================================
  // 5. LEGAL OFFICER VERIFICATION & LAWYER ASSIGNMENT WORKFLOW
  // ==========================================================================
  /* ==========================================================================
     STEP 5: SEND INVOICE (Legal Officer creates and sends invoice)
     ========================================================================== */
  openCreateInvoiceModal(prefillRequestId) {
    const user = (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.currentUser) ? SLCMS_STATE.currentUser : {};
    const roleLower = (user.role || '').toLowerCase().trim();
    if (roleLower === 'client') {
      if (typeof App !== 'undefined') App.showToast('Validation Error: Clients cannot issue invoices.', 'error');
      return;
    }

    const requests = (typeof LegalRequestsView !== 'undefined' && LegalRequestsView.getRequests)
      ? LegalRequestsView.getRequests()
      : (JSON.parse(localStorage.getItem('slcms_client_legal_requests') || '[]'));

    let targetReq = prefillRequestId ? requests.find(r => r.id === prefillRequestId || r.requestNumber === prefillRequestId) : null;
    if (!targetReq && requests.length > 0) {
      targetReq = requests[0];
    }

    // Auto-generate Invoice Number: SLCMS-2026-XXXXXX (e.g. SLCMS-2026-000124)
    const invSeq = Math.floor(100000 + Math.random() * 900000);
    const generatedInvoiceNumber = `SLCMS-2026-${invSeq}`;

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const officerName = user.name || 'Adv. Joyce Mercer';

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff;">
        <div>
          <div style="font-size: 0.74rem; color: #F59E0B; font-weight: 700; text-transform: uppercase;">
            Step 5: Send Fee Invoice
          </div>
          <h3 class="modal-title" style="color: #fff; font-size: 1.15rem; margin-top: 2px;">
            Issue Official Client Invoice
          </h3>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #fff;">✕</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        <form id="form-create-invoice" onsubmit="BillingView.submitCreateInvoice(event)">
          <input type="hidden" id="inv-client-id" value="${this.escapeHtml(targetReq?.clientId || '')}">
          
          <div class="grid grid-cols-2 gap-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Invoice Number (Automatic)</label>
              <input type="text" id="inv-gen-number" class="form-control" value="${generatedInvoiceNumber}" readonly style="background: #F1F5F9; font-family: monospace; font-weight: 700; color: #1E40AF;">
            </div>
            <div class="form-group">
              <label class="form-label required" style="font-weight: 600;">Request Number (Automatic)</label>
              <select id="inv-req-select" class="form-control" onchange="BillingView.handleInvoiceRequestChange(this.value)" required style="font-weight: 600;">
                ${requests.map(r => `
                  <option value="${r.id}" ${targetReq && (targetReq.id === r.id || targetReq.requestNumber === r.id) ? 'selected' : ''}>
                    ${r.id || r.requestNumber} — ${this.escapeHtml(r.clientName)} (${this.escapeHtml(r.issueType || 'General')})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Client Name (Read-Only)</label>
              <input type="text" id="inv-client-name" class="form-control" value="${this.escapeHtml(targetReq?.clientName || '')}" readonly style="background: #F8FAFC; color: #334155; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Client Email (Read-Only)</label>
              <input type="email" id="inv-client-email" class="form-control" value="${this.escapeHtml(targetReq?.clientEmail || '')}" readonly style="background: #F8FAFC; color: #334155;">
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Issue Type (Automatic)</label>
              <input type="text" id="inv-issue-type" class="form-control" value="${this.escapeHtml(targetReq?.issueType || 'Commercial Litigation')}" readonly style="background: #F8FAFC; color: #1D4ED8; font-weight: 600;">
            </div>
          </div>

          <div class="form-group mb-3">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <label class="form-label required" style="font-weight: 600; margin: 0;">Service Description *</label>
              <span id="inv-desc-count" style="font-size: 0.72rem; color: #64748B;">48 / 500</span>
            </div>
            <textarea id="inv-service-desc" class="form-control" rows="2" required minlength="10" maxlength="500" oninput="document.getElementById('inv-desc-count').innerText = this.value.length + ' / 500'">Initial legal consultation and case assessment</textarea>
            <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">Validation: 10–500 characters.</div>
          </div>

          <div class="grid grid-cols-3 gap-3" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label required" style="font-weight: 600;">Amount in TZS *</label>
              <input type="number" id="inv-amount-tzs" class="form-control" value="150000" min="1000" max="1000000000" step="1" required style="font-weight: 700; font-size: 0.95rem; color: #047857;">
              <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">TZS 1,000 – 1,000,000,000 (numbers only)</div>
            </div>
            <div class="form-group">
              <label class="form-label required" style="font-weight: 600;">Issue Date</label>
              <input type="date" id="inv-issue-date" class="form-control" value="${todayStr}" required readonly style="background: #F8FAFC;">
            </div>
            <div class="form-group">
              <label class="form-label required" style="font-weight: 600;">Due Date *</label>
              <input type="date" id="inv-due-date" class="form-control" value="${defaultDueDate}" required min="${todayStr}">
              <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">Cannot be before Issue Date</div>
            </div>
          </div>

          <div class="form-group mb-3">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <label class="form-label required" style="font-weight: 600; margin: 0;">Payment Instructions *</label>
              <span id="inv-inst-count" style="font-size: 0.72rem; color: #64748B;">105 / 1000</span>
            </div>
            <textarea id="inv-payment-instructions" class="form-control" rows="2" required minlength="10" maxlength="1000" oninput="document.getElementById('inv-inst-count').innerText = this.value.length + ' / 1000'">Remit fee via CRDB Bank A/C 0150244883900 SLCMS Chambers or Lipa Namba 554433. Upload deposit slip after payment.</textarea>
            <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;">Validation: 10–1,000 characters.</div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: 600;">Created By (Legal Officer)</label>
            <input type="text" id="inv-created-by" class="form-control" value="${officerName}" readonly style="background: #F8FAFC; color: #334155; font-weight: 600;">
          </div>

          <div class="modal-footer" style="padding: 1rem 0 0 0; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-gold" style="font-weight: 700; padding: 0.55rem 1.4rem;">
              Send Invoice &amp; Set PAYMENT_PENDING &rarr;
            </button>
          </div>
        </form>
      </div>
    `, 'modal-lg');
  },

  handleInvoiceRequestChange(requestId) {
    const requests = (typeof LegalRequestsView !== 'undefined' && LegalRequestsView.getRequests)
      ? LegalRequestsView.getRequests()
      : [];
    const req = requests.find(r => r.id === requestId || r.requestNumber === requestId);
    if (!req) return;

    const idInput = document.getElementById('inv-client-id');
    const nameInput = document.getElementById('inv-client-name');
    const emailInput = document.getElementById('inv-client-email');
    const typeInput = document.getElementById('inv-issue-type');

    if (idInput) idInput.value = req.clientId || '';
    if (nameInput) nameInput.value = req.clientName || '';
    if (emailInput) emailInput.value = req.clientEmail || '';
    if (typeInput) typeInput.value = req.issueType || 'Commercial Litigation';
  },

  submitCreateInvoice(e) {
    e.preventDefault();
    const user = (typeof SLCMS_STATE !== 'undefined' && SLCMS_STATE.currentUser) ? SLCMS_STATE.currentUser : {};
    const roleLower = (user.role || '').toLowerCase().trim();
    if (roleLower === 'client') {
      App.showToast('Validation Error: Clients cannot issue invoices.', 'error');
      return;
    }

    const invoiceNumber = document.getElementById('inv-gen-number')?.value?.trim();
    const requestId = document.getElementById('inv-req-select')?.value?.trim();
    const hiddenClientId = document.getElementById('inv-client-id')?.value?.trim();
    const clientName = document.getElementById('inv-client-name')?.value?.trim();
    const clientEmail = document.getElementById('inv-client-email')?.value?.trim();
    const issueType = document.getElementById('inv-issue-type')?.value?.trim();
    const serviceDescription = document.getElementById('inv-service-desc')?.value?.trim();
    const amountVal = document.getElementById('inv-amount-tzs')?.value?.trim();
    const issueDate = document.getElementById('inv-issue-date')?.value?.trim();
    const dueDate = document.getElementById('inv-due-date')?.value?.trim();
    const paymentInstructions = document.getElementById('inv-payment-instructions')?.value?.trim();
    const createdBy = document.getElementById('inv-created-by')?.value?.trim() || user.name || 'Legal Officer';

    // 1. Validation: Service description 10–500 characters
    if (!serviceDescription || serviceDescription.length < 10 || serviceDescription.length > 500) {
      App.showToast('Validation Error: Service description must be between 10 and 500 characters.', 'error');
      return;
    }

    // 2. Validation: Amount TZS 1,000–1,000,000,000 numbers only
    if (!/^\d+$/.test(amountVal)) {
      App.showToast('Validation Error: Amount must contain numbers only.', 'error');
      return;
    }
    const amount = parseInt(amountVal, 10);
    if (isNaN(amount) || amount < 1000 || amount > 1000000000) {
      App.showToast('Validation Error: Amount must be between TZS 1,000 and TZS 1,000,000,000.', 'error');
      return;
    }

    // 3. Validation: Due date cannot be before issue date
    if (!dueDate || dueDate < issueDate) {
      App.showToast('Validation Error: Due date cannot be before the issue date.', 'error');
      return;
    }

    // 4. Validation: Payment instructions 10–1,000 characters
    if (!paymentInstructions || paymentInstructions.length < 10 || paymentInstructions.length > 1000) {
      App.showToast('Validation Error: Payment instructions must be between 10 and 1,000 characters.', 'error');
      return;
    }

    // 5. Validation: Prevent multiple active invoices for one request
    const invoices = this.getInvoices();
    const existingActive = invoices.find(i => i.requestId === requestId && i.status !== 'REJECTED' && i.status !== 'CANCELLED');
    if (existingActive) {
      App.showToast(`Validation Error: An active invoice (${existingActive.invoiceNumber}) already exists for request ${requestId}. Multiple active invoices for one request are blocked.`, 'error');
      return;
    }

    // Exact Client Resolution: Bind directly to the client who submitted the request
    const requests = (typeof LegalRequestsView !== 'undefined' && LegalRequestsView.getRequests)
      ? LegalRequestsView.getRequests()
      : (JSON.parse(localStorage.getItem('slcms_client_legal_requests') || '[]'));
    const targetReq = requests.find(r => r.id === requestId || r.requestNumber === requestId);

    let finalClientId = hiddenClientId || targetReq?.clientId;
    if (!finalClientId && (clientEmail || clientName)) {
      const emailLower = (clientEmail || '').toLowerCase().trim();
      const nameLower = (clientName || '').toLowerCase().trim();
      const foundClient = (SLCMS_STATE.clients || []).find(c => 
        (c.email && c.email.toLowerCase().trim() === emailLower) ||
        (c.name && c.name.toLowerCase().trim() === nameLower)
      );
      if (foundClient) {
        finalClientId = foundClient.clientNumber || foundClient.id;
      }
    }
    if (!finalClientId) {
      finalClientId = 'cli-' + (targetReq?.id ? String(targetReq.id).replace(/[^a-zA-Z0-9]/g, '') : Date.now());
    }

    const exactClientName = targetReq?.clientName || clientName;
    const exactClientEmail = targetReq?.clientEmail || clientEmail;
    const exactClientPhone = targetReq?.clientPhone || targetReq?.phone || '';

    // Create the new invoice object with status: PAYMENT_PENDING / INVOICE_SENT
    const newInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: invoiceNumber,
      requestId: requestId,
      clientId: finalClientId,
      clientName: exactClientName,
      clientEmail: exactClientEmail,
      clientPhone: exactClientPhone,
      issueType: issueType,
      serviceDescription: serviceDescription,
      totalAmount: amount,
      amountPaid: 0,
      balance: amount,
      issueDate: issueDate,
      dueDate: dueDate,
      paymentInstructions: paymentInstructions,
      status: 'PAYMENT_PENDING',
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      payments: []
    };

    invoices.unshift(newInvoice);
    this.persistInvoices();

    // Update target request status to INVOICE_SENT and attach invoiceNumber & invoiceId
    if (targetReq) {
      if (!targetReq.clientId) {
        targetReq.clientId = finalClientId;
      }
      targetReq.status = 'INVOICE_SENT';
      targetReq.invoiceNumber = invoiceNumber;
      targetReq.invoiceId = newInvoice.id;
      targetReq.invoiceAmount = amount;
      targetReq.invoiceSentAt = new Date().toISOString();
      if (typeof LegalRequestsView !== 'undefined' && typeof LegalRequestsView.persistRequests === 'function') {
        LegalRequestsView.persistRequests(requests);
      }
      if (typeof ClientPortalService !== 'undefined' && typeof ClientPortalService.saveLocalRequest === 'function') {
        ClientPortalService.saveLocalRequest(targetReq);
      }
    }

    // Add Audit Log
    if (typeof SLCMS_STATE !== 'undefined' && typeof SLCMS_STATE.addAuditLog === 'function') {
      SLCMS_STATE.addAuditLog(
        'Invoice Issued',
        'Billing Management',
        `Legal Officer ${createdBy} issued invoice ${invoiceNumber} for request ${requestId} (${exactClientName}) amounting to TZS ${amount.toLocaleString()}`,
        'Success'
      );
    }

    App.closeModal();
    App.showToast(`Invoice ${invoiceNumber} issued to ${exactClientName}! Sent to client dashboard.`, 'success', 6000);

    // If currently viewing Legal Requests table, refresh immediately so button shows '✓ Invoice Sent'
    if (typeof LegalRequestsView !== 'undefined') {
      const container = document.getElementById('main-content-container');
      if (container && (typeof App !== 'undefined' && (App.currentRoute === 'legal-requests' || App.currentRoute === 'requests'))) {
        container.innerHTML = LegalRequestsView.render();
        return;
      }
    }

    this.setTab('invoices');
  },

  /* ==========================================================================
     STEPS 8 & 9: SYSTEM & LEGAL OFFICER VERIFY PAYMENT -> CASE BECOMES ACTIVE
     ========================================================================== */
  async confirmPayment(invId) {
    const invoices = this.getInvoices();
    const inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.invoiceNo === invId);

    // Step 8 System Checks
    // 1. Invoice exists
    if (!inv) {
      App.showToast('Validation Error: Invoice record does not exist.', 'error');
      return;
    }

    // 2. Invoice has not already been paid
    if (inv.status === 'PAID') {
      App.showToast('Validation Error: Invoice has already been verified and paid.', 'warning');
      return;
    }

    // 3. Reference number is unique across all invoices
    const lastPay = (inv.payments && inv.payments.length > 0) ? inv.payments[inv.payments.length - 1] : {};
    const ref = inv.demoReference || lastPay.referenceNumber || ('REF-' + inv.invoiceNumber);

    const duplicateRef = invoices.find(other => other.id !== inv.id && (other.demoReference === ref || (other.payments && other.payments.some(p => p.referenceNumber === ref && p.status === 'VERIFIED'))));
    if (duplicateRef) {
      App.showToast(`Validation Error: Transaction reference ${ref} has already been used for invoice ${duplicateRef.invoiceNumber}.`, 'error');
      return;
    }

    // 4. Amount matches invoice total
    const claimedAmt = (lastPay.amount !== undefined) ? lastPay.amount : (inv.totalAmount || 150000);
    if (Number(claimedAmt) !== Number(inv.totalAmount)) {
      App.showToast(`Validation Error: Claimed payment amount (TZS ${claimedAmt.toLocaleString()}) does not match billed invoice total (TZS ${inv.totalAmount.toLocaleString()}).`, 'error');
      return;
    }

    // Step 8: Legal Officer checks real bank / mobile / cash record before confirming
    const officerUser = (SLCMS_STATE.currentUser && SLCMS_STATE.currentUser.name) ? SLCMS_STATE.currentUser.name : 'Adv. Joyce Mercer';

    // Update Invoice status to PAID & PAYMENT_VERIFIED
    inv.status = 'PAID';
    inv.paymentStatus = 'VERIFIED';
    inv.amountPaid = inv.totalAmount;
    inv.balance = 0;
    inv.verifiedBy = officerUser;
    inv.verifiedAt = new Date().toISOString();
    if (!inv.payments || inv.payments.length === 0) {
      inv.payments = [{
        amount: inv.totalAmount,
        paymentMethod: 'Bank Transfer / Mobile Money',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNumber: ref,
        status: 'VERIFIED'
      }];
    } else {
      inv.payments.forEach(p => p.status = 'VERIFIED');
    }
    this.persistInvoices();

    // STEP 9: Case Becomes Active (Automatically creates/activates case record)
    const newCaseId = 'case-' + Date.now();
    const caseNum = 'TZ/HC/CIV/2026/' + Math.floor(100 + Math.random() * 900);
    const activationDate = new Date().toISOString();

    let linkedCase = null;
    if (typeof SLCMS_STATE !== 'undefined') {
      if (!Array.isArray(SLCMS_STATE.cases)) SLCMS_STATE.cases = [];

      linkedCase = SLCMS_STATE.cases.find(c => c.id === inv.caseId || c.requestId === inv.requestId || (c.client && inv.clientName && c.client.toLowerCase() === inv.clientName.toLowerCase()));

      if (linkedCase) {
        linkedCase.status = 'ACTIVE_AWAITING_ASSIGNMENT';
        linkedCase.statusLabel = 'ACTIVE — AWAITING ASSIGNMENT';
        linkedCase.paymentStatus = 'VERIFIED';
        linkedCase.invoiceStatus = 'PAID';
        linkedCase.invoiceNumber = inv.invoiceNumber;
        linkedCase.paymentReference = ref;
        linkedCase.amountPaid = inv.totalAmount;
        linkedCase.activatedAt = activationDate;
      } else {
        linkedCase = {
          id: newCaseId,
          caseNumber: caseNum,
          officialCaseNumber: caseNum,
          title: `${inv.clientName || 'Client'} v. Legal Proceeding`,
          client: inv.clientName || 'Client',
          clientName: inv.clientName || 'Client',
          clientId: inv.clientId || 'cli-001',
          clientEmail: inv.clientEmail || '',
          requestId: inv.requestId || 'REQ-2026-0031',
          issueType: inv.issueType || 'Commercial Litigation',
          caseType: inv.issueType || 'Civil Litigation',
          court: 'High Court of Tanzania',
          status: 'ACTIVE_AWAITING_ASSIGNMENT',
          statusLabel: 'ACTIVE — AWAITING ASSIGNMENT',
          paymentStatus: 'VERIFIED',
          invoiceStatus: 'PAID',
          invoiceNumber: inv.invoiceNumber,
          paymentReference: ref,
          amountPaid: inv.totalAmount,
          activatedAt: activationDate,
          lawyer: 'Unassigned',
          assignedLawyer: null,
          createdAt: activationDate,
          updatedAt: activationDate
        };
        SLCMS_STATE.cases.unshift(linkedCase);
      }
      if (typeof SLCMS_STATE.persistCases === 'function') SLCMS_STATE.persistCases();

      // Update legal request status
      if (typeof LegalRequestsView !== 'undefined' && typeof LegalRequestsView.getRequests === 'function') {
        const reqList = LegalRequestsView.getRequests();
        const r = reqList.find(req => req.id === inv.requestId || req.clientName === inv.clientName);
        if (r) {
          r.status = 'ACTIVE_AWAITING_ASSIGNMENT';
          r.caseId = linkedCase.id;
          r.caseNumber = linkedCase.caseNumber;
          LegalRequestsView.persistRequests(reqList);
        }
      }

      // Record Audit Trail
      if (typeof SLCMS_STATE.addAuditLog === 'function') {
        SLCMS_STATE.addAuditLog(
          'Payment Verified & Case Activated',
          'Intake & Billing',
          `Legal Officer ${officerUser} verified payment of TZS ${inv.totalAmount.toLocaleString()} (Ref: ${ref}) for invoice ${inv.invoiceNumber}. Case ${linkedCase.caseNumber} status set to ACTIVE — AWAITING ASSIGNMENT and routed to Senior Lawyer queue.`,
          'Success'
        );
      }
    }

    // Call Backend API
    try {
      if (typeof slcmsFetch === 'function') {
        await slcmsFetch(`/api/legal-officer/payments/${invId}/verify`, { method: 'POST' });
      }
    } catch (e) {
      console.warn('Backend payment verification warning:', e);
    }

    if (typeof App !== 'undefined') {
      App.showToast(`Payment verified! Case ${linkedCase ? linkedCase.caseNumber : ''} status is now ACTIVE — AWAITING ASSIGNMENT and dispatched to Senior Lawyer's queue.`, 'success', 7000);
      this.setTab('proofs');
      if (typeof App.renderSidebarNav === 'function') {
        App.renderSidebarNav();
      }
    }
  },

  async rejectPayment(invId) {
    const invoices = this.getInvoices();
    const inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.invoiceNo === invId);

    if (inv) {
      inv.status = 'REJECTED';
      this.persistInvoices();
    }

    try {
      if (typeof slcmsFetch === 'function') {
        await slcmsFetch(`/api/legal-officer/payments/${invId}/reject`, { method: 'POST' });
      } else {
        await fetch('api/billing.php?action=reject_payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: invId })
        });
      }
    } catch (e) {}

    if (typeof App !== 'undefined') {
      App.showToast('Payment proof rejected. Client notified to resubmit deposit slip.', 'warning');
      const container = document.getElementById('main-content-container');
      if (container) {
        container.innerHTML = this.render();
      }
      if (typeof App.renderSidebarNav === 'function') {
        App.renderSidebarNav();
      }
    }
  },

  simulateClientPaymentProof() {
    const invoices = this.getInvoices();
    let target = invoices.find(i => i.status === 'ISSUED' || i.status === 'UNPAID');
    if (!target) {
      target = invoices[0];
    }
    if (target) {
      target.status = 'VERIFICATION_PENDING';
      target.demoReference = 'CRDB-MOBI-' + Math.floor(100000 + Math.random() * 900000);
      if (!Array.isArray(target.payments)) target.payments = [];
      target.payments.push({
        amount: target.totalAmount || 100000,
        paymentMethod: 'CRDB SimBanking',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNumber: target.demoReference,
        status: 'PENDING'
      });
      this.persistInvoices();
      if (typeof App !== 'undefined') {
        App.showToast(`Simulated client payment proof for ${target.invoiceNumber || 'invoice'}. Ready to verify!`, 'info');
        this.setTab('proofs');
        if (typeof App.renderSidebarNav === 'function') {
          App.renderSidebarNav();
        }
      }
    }
  },



  submitRecordPayment() {
    const invId = document.getElementById('rec-inv-id')?.value;
    const amount = parseFloat(document.getElementById('rec-amount')?.value || '100000');
    const method = document.getElementById('rec-method')?.value || 'Bank Transfer';
    const ref = document.getElementById('rec-ref')?.value || ('REF-' + Date.now());

    if (!invId) {
      if (typeof App !== 'undefined') App.showToast('Please select an invoice', 'error');
      return;
    }

    this.confirmPayment(invId);
  },

  // ==========================================================================
  // 6. OFFICIAL RECEIPT GENERATION & PREVIEW (Requirement 6)
  // ==========================================================================
  showReceipt(invId) {
    const invoices = this.getInvoices();
    const inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.invoiceNo === invId) || invoices[0];
    const invNum = inv.invoiceNumber || inv.invoiceNo || 'INV-2026-0001';
    const rcptNum = `RCPT-2026-${invNum.replace('INV-2026-', '')}`;
    const amount = inv.totalAmount || inv.total || inv.amount || 100000;
    const officerName = inv.verifiedBy || 'Adv. Joyce Mercer';
    const dateStr = inv.verifiedAt ? new Date(inv.verifiedAt).toLocaleDateString() : new Date().toLocaleDateString();

    App.openModal(`
      <div class="modal-header" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFF; padding: 1.25rem 1.75rem;">
        <div>
          <h3 class="modal-title" style="color: #F8FAFC; font-weight: 800; font-family: var(--font-heading);">Official Payment Receipt</h3>
          <div style="color: #10B981; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">
            SLCMS CONFIRMED SETTLEMENT RECEIPT
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="window.print()" style="background: rgba(255,255,255,0.1); color: #FFF; border: 1px solid rgba(255,255,255,0.2);">🖨 Print / PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="App.closeModal()" style="color: #FFF;">✕</button>
        </div>
      </div>

      <div class="modal-body" style="padding: 2rem;">
        <div style="border: 2px solid #10B981; border-radius: 12px; padding: 2rem; background: #FFFDF5;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--color-primary); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
            <div>
              <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--color-primary);">
                SLCMS LEGAL PARTNERS LLP
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                Samora Avenue &amp; Ohio Street, Floor 7, Dar es Salaam HQ<br>
                Verified by Legal Officer: <strong>${officerName}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 800; color: var(--color-gold, #C89B3C);">
                ${rcptNum}
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.2rem;">
                Date Confirmed: <strong>${dateStr}</strong>
              </div>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.9rem;">
            <div>
              <span style="color: var(--color-text-muted); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Client:</span>
              <div style="font-weight: 800; color: var(--color-primary); font-size: 1.05rem;">${inv.clientName || this.getClientNameById(inv.clientId)}</div>
            </div>
            <div>
              <span style="color: var(--color-text-muted); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Invoice Reference:</span>
              <div style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${invNum}</div>
            </div>
            <div>
              <span style="color: var(--color-text-muted); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Service Rendered:</span>
              <div style="font-weight: 600; color: var(--color-primary);">${inv.serviceDescription || 'Legal Counsel'}</div>
            </div>
            <div>
              <span style="color: var(--color-text-muted); font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Payment Reference:</span>
              <div style="font-family: var(--font-mono); font-weight: 800; color: #92400E; background: #FEF3C7; padding: 2px 8px; border-radius: 4px; display: inline-block;">${inv.demoReference || 'REF-VERIFIED-01'}</div>
            </div>
          </div>

          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.8rem; text-transform: uppercase; color: #065F46; font-weight: 700;">Invoice Settlement Status</div>
              <div style="font-size: 1.1rem; font-weight: 800; color: #047857;">Status: Paid</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; text-transform: uppercase; color: #065F46; font-weight: 700;">Amount Paid</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: #047857;">TZS ${amount.toLocaleString()}</div>
            </div>
          </div>

        </div>
      </div>

      <div class="modal-footer" style="padding: 1rem 1.75rem;">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Receipt</button>
        <button class="btn btn-gold" onclick="window.print()">Print Receipt</button>
      </div>
    `, 'modal-lg');
  },

  previewInvoice(invId) {
    const invoices = this.getInvoices();
    const inv = invoices.find(i => String(i.id) === String(invId) || i.invoiceNumber === invId || i.invoiceNo === invId) || invoices[0];
    const total = inv.totalAmount || inv.total || inv.amount || 100000;
    const invNum = inv.invoiceNumber || inv.invoiceNo || 'INV-2026-0001';

    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Formal Fee Statement &amp; Invoice</h3>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨 Print / PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
        </div>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div class="invoice-paper-preview" style="background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 2rem;">
          
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--color-primary); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--color-primary);">
                SLCMS LEGAL PARTNERS LLP
              </div>
              <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                Samora Avenue &amp; Ohio Street, Floor 7, Dar es Salaam HQ<br>
                Tel: +255 700 000 001 &bull; billing@slcms-law.co.tz
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-mono); font-size: 1.3rem; font-weight: 800; color: var(--color-gold, #C89B3C);">${invNum}</div>
              <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
                Issue Date: <strong>${inv.issueDate || inv.date}</strong><br>
                Due Date: <strong>${inv.dueDate}</strong>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem; font-size: 0.9rem;">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); font-weight: 700;">
              BILLED TO:
            </div>
            <strong style="color: var(--color-primary); font-size: 1.1rem;">${inv.clientName || this.getClientNameById(inv.clientId)}</strong>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Service Description</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--color-primary); margin-top: 0.35rem;">
              ${inv.serviceDescription || 'Initial legal consultation'}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
            <div style="width: 280px; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid var(--color-primary); font-size: 1.15rem; color: var(--color-primary);">
                <strong>Total Fee Amount:</strong>
                <strong style="color: var(--color-gold, #C89B3C);">TZS ${total.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div style="font-size: 0.85rem; color: var(--color-text-secondary); background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; padding: 0.85rem; text-align: center;">
            <strong>Payment Instructions:</strong> ${inv.paymentInstructions || 'Pay via CRDB Bank A/C: 0150244883900 SLCMS Legal Partners or Lipa Namba 554433 outside system.'}
          </div>

        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Preview</button>
        <button class="btn btn-gold" onclick="window.print()">Print Statement</button>
      </div>
    `, 'modal-lg');
  },

  downloadInvoice(invId) {
    this.previewInvoice(invId);
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

window.BillingView = BillingView;

// Initialize seed data on load
BillingView.init();


