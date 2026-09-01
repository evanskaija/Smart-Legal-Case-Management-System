/* ==========================================================================
   SLCMS - Document Management & Repository
   ========================================================================== */

const DocumentsView = {
  currentCategory: 'All',
  searchQuery: '',

  render() {
    const filteredDocs = SLCMS_STATE.documents.filter(d => {
      const matchSearch = !this.searchQuery ||
        d.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.fileName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.caseTitle.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchCat = this.currentCategory === 'All' || d.category === this.currentCategory;
      return matchSearch && matchCat;
    });

    return `
      <div class="animate-fade">
        <div class="view-header">
          <div>
            <h1 class="page-title">Document Repository & Evidence Vault</h1>
            <p style="color: var(--color-text-secondary); font-size: 0.88rem;">
              Encrypted legal document archive with chain-of-custody tracking and privilege tags
            </p>
          </div>
          <button class="btn btn-gold" onclick="DocumentsView.openUploadModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Upload Document</span>
          </button>
        </div>

        <!-- Drag & Drop Zone -->
        <div class="dropzone-box" style="margin-bottom: 1.5rem;" onclick="DocumentsView.openUploadModal()">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="color: var(--color-gold); margin-bottom: 0.5rem;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div style="font-weight: 600; color: var(--color-primary); font-size: 0.95rem;">Drag & drop case files, pleadings, or trial exhibits to upload</div>
          <div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.25rem;">Supported formats: PDF, DOCX, XLSX, TIFF, MSG up to 100MB • AES-256 Encrypted</div>
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
            <input type="text" class="form-control" placeholder="Search by document title, filename or related case..."
                   value="${this.searchQuery}" oninput="DocumentsView.handleSearch(this.value)">
          </div>

          <div class="filter-group">
            <select class="form-control" style="width: 170px;" onchange="DocumentsView.filterCategory(this.value)">
              <option value="All">All Categories</option>
              <option value="Pleadings">Pleadings & Motions</option>
              <option value="Evidence">Evidence & Exhibits</option>
              <option value="Correspondence">Correspondence</option>
              <option value="Court Orders">Court Orders</option>
            </select>
          </div>
        </div>

        <!-- Documents Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Document Details</th>
                <th>Related Matter</th>
                <th>Category</th>
                <th>Access Level</th>
                <th>Version</th>
                <th>Uploaded By</th>
                <th>Size</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDocs.map(d => `
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--color-surface-subtle); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: 700; font-size: 0.72rem;">
                        ${d.fileType}
                      </div>
                      <div>
                        <div style="font-weight: 600; color: var(--color-primary); cursor: pointer;" onclick="DocumentsView.previewDocument('${d.id}')">
                          ${d.title}
                        </div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted); font-family: var(--font-mono);">${d.fileName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 0.82rem; font-weight: 500;">${d.caseTitle}</div>
                    <span style="font-size: 0.72rem; color: var(--color-gold); font-family: var(--font-mono);">${d.caseNumber}</span>
                  </td>
                  <td>
                    <span class="badge" style="background: var(--color-surface-subtle);">${d.category}</span>
                  </td>
                  <td>
                    <span class="badge ${d.accessLevel.includes('Privileged') || d.accessLevel.includes('Confidential') ? 'badge-confidential' : 'badge-onhold'}">
                      ${d.accessLevel}
                    </span>
                  </td>
                  <td>
                    <span style="font-weight: 600; font-size: 0.8rem;">${d.version}</span>
                  </td>
                  <td>
                    <div style="font-size: 0.8rem;">${d.uploadedBy}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">${d.uploadDate}</div>
                  </td>
                  <td>
                    <span style="font-size: 0.8rem; color: var(--color-text-secondary);">${d.size}</span>
                  </td>
                  <td style="text-align: right;">
                    <div class="flex items-center justify-end gap-1">
                      <button class="btn btn-secondary btn-sm" onclick="DocumentsView.previewDocument('${d.id}')" title="Preview Document">
                        Preview
                      </button>
                      <button class="btn btn-ghost btn-sm" onclick="DocumentsView.downloadDocument('${d.id}')" title="Download Encrypted File">
                        ⬇
                      </button>
                      <button class="btn btn-ghost btn-sm text-danger" onclick="DocumentsView.deleteDocument('${d.id}')" title="Delete Document">
                        ✕
                      </button>
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

  handleSearch(val) {
    this.searchQuery = val;
    App.refreshCurrentView();
  },

  filterCategory(val) {
    this.currentCategory = val;
    App.refreshCurrentView();
  },

  previewDocument(docId) {
    const doc = SLCMS_STATE.documents.find(d => d.id === docId);
    if (!doc) return;

    App.openModal(`
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-gold);">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <h3 class="modal-title" style="font-size: 1.15rem;">${doc.title}</h3>
          <span class="badge badge-confidential">${doc.accessLevel}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 1.25rem;">
          <div class="grid grid-cols-3 gap-3">
            <div><strong>Filename:</strong> ${doc.fileName}</div>
            <div><strong>Related Matter:</strong> ${doc.caseNumber}</div>
            <div><strong>Version:</strong> ${doc.version}</div>
            <div><strong>Uploaded By:</strong> ${doc.uploadedBy}</div>
            <div><strong>Upload Date:</strong> ${doc.uploadDate}</div>
            <div><strong>File Size:</strong> ${doc.size}</div>
          </div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 2rem; min-height: 280px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); font-family: 'Times New Roman', serif; font-size: 1.05rem; line-height: 1.7; color: #1F2937;">
          <div style="text-align: center; margin-bottom: 1.5rem; font-weight: bold; text-transform: uppercase;">
            SUPREME COURT OF THE STATE OF NEW YORK<br>
            COUNTY OF NEW YORK: COMMERCIAL DIVISION<br>
            -----------------------------------------------------------------X
          </div>
          <div class="flex justify-between" style="font-size: 0.95rem; margin-bottom: 1.5rem;">
            <div>
              <strong>${doc.caseTitle.split(' vs. ')[0] || 'PLAINTIFF'}</strong>,<br>
              &nbsp;&nbsp;&nbsp;&nbsp;Plaintiff,<br>
              &nbsp;&nbsp;&nbsp;&nbsp;- against -<br>
              <strong>${doc.caseTitle.split(' vs. ')[1] || 'DEFENDANT'}</strong>,<br>
              &nbsp;&nbsp;&nbsp;&nbsp;Defendant.
            </div>
            <div>
              <strong>${doc.caseNumber}</strong><br>
              Hon. Justice Presiding<br>
              <strong>CONFIDENTIAL PLEADING</strong>
            </div>
          </div>
          <p style="text-indent: 2rem; margin-bottom: 1rem;">
            COMES NOW the Lead Counsel on behalf of the represented parties and respectfully submits this formal pleading in accordance with Rule 3212 of the Civil Practice Law and Rules...
          </p>
          <div class="alert alert-info" style="font-family: var(--font-primary); font-size: 0.8rem; margin-top: 2rem;">
            🔒 Verified Digital Watermark: Authorized session under Eleanor Vance, Esq. (Audit Hash: 0x89F2A1).
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Preview</button>
        <button class="btn btn-gold" onclick="DocumentsView.downloadDocument('${doc.id}')">⬇ Download Original (${doc.size})</button>
      </div>
    `, 'modal-lg');
  },

  downloadDocument(docId) {
    App.showToast('Downloading encrypted document artifact...', 'success');
  },

  deleteDocument(docId) {
    App.confirmAction({
      title: 'Confirm Document Purge',
      message: 'Are you certain you wish to delete this document? Chain-of-custody records will log this action permanently in the immutable audit log.',
      confirmText: 'Delete Document',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        const idx = SLCMS_STATE.documents.findIndex(d => d.id === docId);
        if (idx !== -1) {
          const removed = SLCMS_STATE.documents.splice(idx, 1)[0];
          SLCMS_STATE.addAuditLog('Document Purged', 'Document Repository', removed.title, 'Warning');
          App.showToast(`Document "${removed.title}" deleted.`, 'info');
          App.refreshCurrentView();
        }
      }
    });
  },

  openUploadModal(caseContext = null) {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Upload Legal Document to Vault</h3>
        <button class="btn btn-ghost btn-sm" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Document Title</label>
          <input type="text" id="ud-title" class="form-control" placeholder="e.g. Affidavit of Service - Exhibit B" required>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Associate with Case</label>
            <select id="ud-case" class="form-control">
              ${SLCMS_STATE.cases.map(c => `<option value="${c.id}" ${caseContext && caseContext.id === c.id ? 'selected' : ''}>${c.caseNumber} - ${c.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Document Category</label>
            <select id="ud-category" class="form-control">
              <option>Pleadings</option>
              <option>Evidence</option>
              <option>Contracts</option>
              <option>Correspondence</option>
              <option>Court Orders</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label required">Access & Privilege Level</label>
            <select id="ud-access" class="form-control">
              <option>Attorney-Client Privileged</option>
              <option>Confidential</option>
              <option>Firm Internal</option>
              <option>Public Record</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Version Tag</label>
            <input type="text" id="ud-version" class="form-control" value="v1.0">
          </div>
        </div>
        <div class="dropzone-box" style="margin-top: 0.75rem;">
          <input type="file" id="ud-file-input" style="display: none;" onchange="DocumentsView.handleFileSelected(this)">
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('ud-file-input').click()">Browse Local Storage</button>
          <div id="ud-selected-file-label" style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.5rem;">No file chosen (PDF, DOCX up to 100MB)</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="DocumentsView.saveUpload()">Upload & Encrypt</button>
      </div>
    `);
  },

  handleFileSelected(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      document.getElementById('ud-selected-file-label').innerHTML = `<strong>Selected:</strong> ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
  },

  saveUpload() {
    const title = document.getElementById('ud-title')?.value;
    if (!title) {
      App.showToast('Please enter a Document Title.', 'error');
      return;
    }

    const caseId = document.getElementById('ud-case')?.value;
    const relatedCase = SLCMS_STATE.cases.find(c => c.id === caseId) || SLCMS_STATE.cases[0];

    const newDoc = {
      id: 'doc-' + Date.now(),
      title: title,
      fileName: title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf',
      caseId: relatedCase.id,
      caseNumber: relatedCase.caseNumber,
      caseTitle: relatedCase.title,
      category: document.getElementById('ud-category')?.value || 'Pleadings',
      uploadedBy: SLCMS_STATE.currentUser.name,
      uploadDate: new Date().toISOString().split('T')[0],
      size: '2.8 MB',
      version: document.getElementById('ud-version')?.value || 'v1.0',
      accessLevel: document.getElementById('ud-access')?.value || 'Attorney-Client Privileged',
      fileType: 'PDF'
    };

    SLCMS_STATE.addDocument(newDoc);
    App.closeModal();
    App.showToast(`Document "${newDoc.title}" securely uploaded!`, 'success');
    App.refreshCurrentView();
  }
};
