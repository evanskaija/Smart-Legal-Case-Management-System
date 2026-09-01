/* ==========================================================================
   SLCMS - State Store & Data Fixtures
   ========================================================================== */

const SLCMS_STATE = {
  // Current active user
  currentUser: {
    id: 'usr-001',
    name: 'Eleanor Vance, Esq.',
    email: 'e.vance@slcms-law.com',
    phone: '+1 (212) 555-0101',
    role: 'Administrator', // 'Administrator' | 'Lawyer' | 'Clerk'
    roleLabel: 'Managing Partner',
    avatar: 'EV',
    avatarImg: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    avatarClass: 'avatar-gold',
    department: 'Commercial & Corporate Litigation',
    barNumber: 'NY-BAR #4829104',
    admissions: 'New York State Bar (2012) • U.S. District Court (SDNY) • U.S. 2nd Circuit',
    practiceAreas: 'Commercial Litigation, Trade Secrets, IP Enforcement, Corporate Arbitration',
    education: 'Columbia Law School (J.D., 2012) • Princeton University (A.B. in Public Policy, 2009)',
    assistantContact: 'Sophia Chen • s.chen@slcms-law.com • Ext. 104',
    languages: 'English (Native), French (Fluent), Swahili (Conversational)',
    mobilePhone: '+1 (212) 555-0198',
    hourlyRate: '$550.00 / hr',
    officeLocation: 'New York Headquarters, Floor 42, Suite 4200',
    bio: 'Managing Partner specializing in complex commercial litigation, trade secrets, high-stakes IP enforcement, and corporate arbitration before the Southern District of New York.',
    mfaStatus: 'Hardware FIDO2 / YubiKey Active',
    lastLogin: 'Today at 08:30 AM'
  },

  // Role permissions
  rolePermissions: {
    Administrator: {
      canManageUsers: true,
      canViewReports: true,
      canViewAllCases: true,
      canEditBilling: true,
      canDeleteRecords: true,
      canViewAuditLogs: true,
      canManageSettings: true,
      canUseAI: true
    },
    Lawyer: {
      canManageUsers: false,
      canViewReports: true,
      canViewAllCases: true,
      canEditBilling: true,
      canDeleteRecords: false,
      canViewAuditLogs: false,
      canManageSettings: false,
      canUseAI: true
    },
    Clerk: {
      canManageUsers: false,
      canViewReports: false,
      canViewAllCases: false,
      canEditBilling: false,
      canDeleteRecords: false,
      canViewAuditLogs: false,
      canManageSettings: false,
      canUseAI: false
    }
  },

  // Sample Cases
  cases: [
    {
      id: 'case-101',
      caseNumber: 'CV-2026-0842',
      title: 'Vanguard Capital vs. Apex Tech Holdings',
      client: 'Vanguard Capital Partners',
      clientId: 'cli-01',
      clientType: 'Organization',
      caseType: 'Commercial Litigation',
      lawyer: 'Eleanor Vance, Esq.',
      lawyerAvatar: 'EV',
      supportingStaff: 'Marcus Bell',
      nextDeadline: '2026-09-08',
      nextHearingDate: '2026-09-14',
      priority: 'High',
      status: 'Active',
      court: 'Supreme Court - Commercial Division',
      courtCaseNo: 'SC-NY-2026-0842',
      presidingOfficer: 'Hon. Justice Katherine Thorne',
      opposingParty: 'Apex Tech Holdings Inc.',
      opposingCounsel: 'Sterling & Croft LLP (Attn: David Sterling)',
      openingDate: '2026-02-10',
      expectedCompletion: '2027-01-30',
      progressPct: 65,
      description: 'Breach of contractual warranty and cross-border IP licensing agreements regarding patented artificial intelligence algorithms.',
      retainerAmount: 75000,
      totalBilled: 42350,
      totalPaid: 35000,
      notes: 'Initial discovery exchange completed. Motion for Summary Judgment draft undergoing partner review.'
    },
    {
      id: 'case-102',
      caseNumber: 'IP-2026-0319',
      title: 'AuraBio Pharmaceuticals Patent Infringement',
      client: 'AuraBio Therapeutics Inc.',
      clientId: 'cli-02',
      clientType: 'Organization',
      caseType: 'Intellectual Property',
      lawyer: 'Julian Mercer, Esq.',
      lawyerAvatar: 'JM',
      supportingStaff: 'Sophia Chen',
      nextDeadline: '2026-09-04',
      nextHearingDate: '2026-09-22',
      priority: 'High',
      status: 'Active',
      court: 'Federal District Court of Appeals',
      courtCaseNo: 'FED-2026-IP-0319',
      presidingOfficer: 'Hon. Judge Arthur Pendelton',
      opposingParty: 'Novagen Biotech AG',
      opposingCounsel: 'Harrison & Cole LLP',
      openingDate: '2026-04-15',
      expectedCompletion: '2026-11-20',
      progressPct: 40,
      description: 'Defending proprietary mRNA delivery mechanism patents against willful infringement claims in biological therapeutics.',
      retainerAmount: 120000,
      totalBilled: 68500,
      totalPaid: 68500,
      notes: 'Expert witness deposition scheduled for Sept 18th.'
    },
    {
      id: 'case-103',
      caseNumber: 'RE-2026-0155',
      title: 'Greenfield Estate Land Acquisition & Zoning',
      client: 'Greenfield Realty Trust',
      clientId: 'cli-03',
      clientType: 'Organization',
      caseType: 'Real Estate & Zoning',
      lawyer: 'Eleanor Vance, Esq.',
      lawyerAvatar: 'EV',
      supportingStaff: 'Sophia Chen',
      nextDeadline: '2026-09-18',
      nextHearingDate: '2026-10-05',
      priority: 'Medium',
      status: 'Pending',
      court: 'Municipal Zoning Appeals Board',
      courtCaseNo: 'MZB-2026-0155',
      presidingOfficer: 'Board Chair Raymond Morales',
      opposingParty: 'City Planning Department & Residents Coalition',
      opposingCounsel: 'Municipal Attorney Office',
      openingDate: '2026-05-02',
      expectedCompletion: '2026-12-15',
      progressPct: 55,
      description: 'Zoning variance appeal and title deed conveyance for a $45M sustainable residential development.',
      retainerAmount: 35000,
      totalBilled: 21000,
      totalPaid: 15000,
      notes: 'Environmental impact survey submitted successfully.'
    },
    {
      id: 'case-104',
      caseNumber: 'EM-2026-0774',
      title: 'Dr. Clara Thorne vs. St. Jude Medical Network',
      client: 'Dr. Clara Thorne, MD',
      clientId: 'cli-04',
      clientType: 'Individual',
      caseType: 'Employment Law',
      lawyer: 'Julian Mercer, Esq.',
      lawyerAvatar: 'JM',
      supportingStaff: 'Marcus Bell',
      nextDeadline: '2026-09-02',
      nextHearingDate: '2026-09-09',
      priority: 'High',
      status: 'Active',
      court: 'State Supreme Court - Civil Division',
      courtCaseNo: 'ST-NY-2026-0774',
      presidingOfficer: 'Hon. Justice Evelyn Foster',
      opposingParty: 'St. Jude Healthcare System',
      opposingCounsel: 'Blackwood Legal Group',
      openingDate: '2026-06-11',
      expectedCompletion: '2026-10-30',
      progressPct: 80,
      description: 'Wrongful termination and whistle-blower retaliation dispute in clinical hospital protocols.',
      retainerAmount: 25000,
      totalBilled: 24500,
      totalPaid: 20000,
      notes: 'Mediation settlement conference scheduled next week.'
    },
    {
      id: 'case-105',
      caseNumber: 'CR-2026-0098',
      title: 'State vs. Jonathan Vance Jr. (Financial Compliance)',
      client: 'Jonathan Vance Jr.',
      clientId: 'cli-05',
      clientType: 'Individual',
      caseType: 'White Collar Defense',
      lawyer: 'Eleanor Vance, Esq.',
      lawyerAvatar: 'EV',
      supportingStaff: 'Marcus Bell',
      nextDeadline: '2026-09-25',
      nextHearingDate: '2026-10-12',
      priority: 'Medium',
      status: 'On Hold',
      court: 'Federal District Court',
      courtCaseNo: 'FDC-2026-0098',
      presidingOfficer: 'Hon. Judge Samuel Vance',
      opposingParty: 'United States Department of Justice',
      opposingCounsel: 'Assistant US Attorney Laura Hayes',
      openingDate: '2026-01-20',
      expectedCompletion: '2027-03-01',
      progressPct: 30,
      description: 'Defense against regulatory compliance discrepancies regarding foreign financial holding accounts.',
      retainerAmount: 50000,
      totalBilled: 18000,
      totalPaid: 18000,
      notes: 'Stay of proceedings granted pending audit resolution.'
    },
    {
      id: 'case-106',
      caseNumber: 'TX-2025-0812',
      title: 'Helios Energy Global Cross-Border Tax Structuring',
      client: 'Helios Clean Energy Ltd.',
      clientId: 'cli-06',
      clientType: 'Organization',
      caseType: 'Corporate & Tax',
      lawyer: 'Julian Mercer, Esq.',
      lawyerAvatar: 'JM',
      supportingStaff: 'Sophia Chen',
      nextDeadline: '2026-08-15',
      nextHearingDate: 'Completed',
      priority: 'Low',
      status: 'Won',
      court: 'Federal Tax Tribunal',
      courtCaseNo: 'FTT-2025-0812',
      presidingOfficer: 'Chief Tax Magistrate Ronald Shaw',
      opposingParty: 'Internal Revenue Service',
      opposingCounsel: 'IRS Senior District Counsel',
      openingDate: '2025-08-10',
      expectedCompletion: '2026-08-15',
      progressPct: 100,
      description: 'Favorable multi-jurisdictional tax structuring determination securing $8.4M in renewable energy tax credits.',
      retainerAmount: 90000,
      totalBilled: 88200,
      totalPaid: 88200,
      notes: 'Final judgment entered in favor of client. Matter closed successfully.'
    }
  ],

  // Sample Clients
  clients: [
    {
      id: 'cli-01',
      name: 'Vanguard Capital Partners',
      type: 'Organization',
      contactPerson: 'Robert Sterling, Managing Director',
      email: 'r.sterling@vanguardcap.com',
      phone: '+1 (212) 555-0198',
      address: '745 Fifth Avenue, Suite 2800, New York, NY 10151',
      idNumber: 'EIN-84-9120482',
      activeCases: 1,
      totalCases: 3,
      totalBilled: 142500,
      status: 'Active',
      confidential: true,
      notes: 'Prime corporate retainer client since 2022. Dedicated attorney contact required for all communications.'
    },
    {
      id: 'cli-02',
      name: 'AuraBio Therapeutics Inc.',
      type: 'Organization',
      contactPerson: 'Dr. Helene Dubois, Chief Legal Officer',
      email: 'h.dubois@aurabio.com',
      phone: '+1 (617) 555-0144',
      address: '200 Technology Square, Cambridge, MA 02139',
      idNumber: 'EIN-92-3049182',
      activeCases: 1,
      totalCases: 2,
      totalBilled: 195000,
      status: 'Active',
      confidential: true,
      notes: 'Biotech patent litigation matter. Strict NDA in place.'
    },
    {
      id: 'cli-03',
      name: 'Greenfield Realty Trust',
      type: 'Organization',
      contactPerson: 'Anthony Miller, VP Acquisitions',
      email: 'a.miller@greenfieldtrust.org',
      phone: '+1 (312) 555-0182',
      address: '150 N Michigan Ave, Chicago, IL 60601',
      idNumber: 'EIN-36-8492019',
      activeCases: 1,
      totalCases: 1,
      totalBilled: 21000,
      status: 'Active',
      confidential: false,
      notes: 'Commercial zoning & land conveyance.'
    },
    {
      id: 'cli-04',
      name: 'Dr. Clara Thorne, MD',
      type: 'Individual',
      contactPerson: 'Dr. Clara Thorne',
      email: 'dr.clara.thorne@medmail.org',
      phone: '+1 (212) 555-0129',
      address: '420 East 68th Street, Apt 14B, New York, NY 10065',
      idNumber: 'SSN-XXX-XX-4819',
      activeCases: 1,
      totalCases: 1,
      totalBilled: 24500,
      status: 'Active',
      confidential: true,
      notes: 'Confidential whistleblower employment action.'
    },
    {
      id: 'cli-05',
      name: 'Jonathan Vance Jr.',
      type: 'Individual',
      contactPerson: 'Jonathan Vance Jr.',
      email: 'jvance.jr@privatemail.com',
      phone: '+1 (305) 555-0177',
      address: '1100 Brickell Bay Drive, Miami, FL 33131',
      idNumber: 'SSN-XXX-XX-9021',
      activeCases: 1,
      totalCases: 2,
      totalBilled: 54000,
      status: 'Active',
      confidential: true,
      notes: 'Private high-net-worth regulatory matter.'
    },
    {
      id: 'cli-06',
      name: 'Helios Clean Energy Ltd.',
      type: 'Organization',
      contactPerson: 'Vikram Mehta, CFO',
      email: 'v.mehta@heliosenergy.com',
      phone: '+1 (415) 555-0163',
      address: '500 Howard Street, San Francisco, CA 94105',
      idNumber: 'EIN-77-2910394',
      activeCases: 0,
      totalCases: 2,
      totalBilled: 125000,
      status: 'Active',
      confidential: false,
      notes: 'Completed cross-border tax credits structure.'
    }
  ],

  // Sample Documents
  documents: [
    {
      id: 'doc-001',
      title: 'Motion for Summary Judgment (Draft v2.1)',
      fileName: 'Motion_Summary_Judgment_Vanguard_v2.1.pdf',
      caseId: 'case-101',
      caseNumber: 'CV-2026-0842',
      caseTitle: 'Vanguard Capital vs. Apex Tech Holdings',
      category: 'Pleadings',
      uploadedBy: 'Eleanor Vance, Esq.',
      uploadDate: '2026-08-28',
      size: '2.4 MB',
      version: 'v2.1',
      accessLevel: 'Attorney-Client Privileged',
      fileType: 'PDF'
    },
    {
      id: 'doc-002',
      title: 'Proprietary Algorithm Licensing Agreement',
      fileName: 'Ex_A_Apex_Algorithm_Licensing_2024.pdf',
      caseId: 'case-101',
      caseNumber: 'CV-2026-0842',
      caseTitle: 'Vanguard Capital vs. Apex Tech Holdings',
      category: 'Evidence',
      uploadedBy: 'Marcus Bell',
      uploadDate: '2026-08-20',
      size: '5.8 MB',
      version: 'v1.0',
      accessLevel: 'Confidential',
      fileType: 'PDF'
    },
    {
      id: 'doc-003',
      title: 'Patent Specification US-10948291-B2',
      fileName: 'Patent_US10948291_AuraBio_Spec.pdf',
      caseId: 'case-102',
      caseNumber: 'IP-2026-0319',
      caseTitle: 'AuraBio Pharmaceuticals Patent Infringement',
      category: 'Evidence',
      uploadedBy: 'Julian Mercer, Esq.',
      uploadDate: '2026-08-14',
      size: '8.1 MB',
      version: 'v1.0',
      accessLevel: 'Public Record',
      fileType: 'PDF'
    },
    {
      id: 'doc-004',
      title: 'Expert Witness Rebuttal Report - Dr. K. Aris',
      fileName: 'Expert_Rebuttal_Report_AuraBio.docx',
      caseId: 'case-102',
      caseNumber: 'IP-2026-0319',
      caseTitle: 'AuraBio Pharmaceuticals Patent Infringement',
      category: 'Pleadings',
      uploadedBy: 'Sophia Chen',
      uploadDate: '2026-08-29',
      size: '1.2 MB',
      version: 'v1.4',
      accessLevel: 'Attorney-Client Privileged',
      fileType: 'DOCX'
    },
    {
      id: 'doc-005',
      title: 'Mediation Settlement Framework Agreement',
      fileName: 'Settlement_Framework_Thorne_StJude.pdf',
      caseId: 'case-104',
      caseNumber: 'EM-2026-0774',
      caseTitle: 'Dr. Clara Thorne vs. St. Jude Medical Network',
      category: 'Correspondence',
      uploadedBy: 'Julian Mercer, Esq.',
      uploadDate: '2026-08-26',
      size: '850 KB',
      version: 'v1.0',
      accessLevel: 'Confidential',
      fileType: 'PDF'
    },
    {
      id: 'doc-006',
      title: 'Municipal Zoning Variance Order & Resolution',
      fileName: 'Resolution_MZB_2026_0155_Approved.pdf',
      caseId: 'case-103',
      caseNumber: 'RE-2026-0155',
      caseTitle: 'Greenfield Estate Land Acquisition & Zoning',
      category: 'Court Orders',
      uploadedBy: 'Marcus Bell',
      uploadDate: '2026-08-18',
      size: '1.6 MB',
      version: 'v1.0',
      accessLevel: 'Firm Internal',
      fileType: 'PDF'
    }
  ],

  // Sample Tasks
  tasks: [
    {
      id: 'tsk-01',
      title: 'File Motion for Summary Judgment with Commercial Division',
      caseId: 'case-101',
      caseTitle: 'Vanguard Capital vs. Apex Tech',
      caseNumber: 'CV-2026-0842',
      assignedTo: 'Eleanor Vance, Esq.',
      assignedAvatar: 'EV',
      priority: 'High',
      dueDate: '2026-09-08',
      status: 'in_progress', // 'todo' | 'in_progress' | 'under_review' | 'completed'
      progressPct: 75,
      isOverdue: false,
      description: 'Finalize citations, verify case law table of authorities, and e-file through NYSCEF.'
    },
    {
      id: 'tsk-02',
      title: 'Conduct Pre-Deposition Briefing with Dr. K. Aris',
      caseId: 'case-102',
      caseTitle: 'AuraBio Patent Infringement',
      caseNumber: 'IP-2026-0319',
      assignedTo: 'Julian Mercer, Esq.',
      assignedAvatar: 'JM',
      priority: 'High',
      dueDate: '2026-09-04',
      status: 'todo',
      progressPct: 20,
      isOverdue: false,
      description: 'Review mRNA sequence validity exhibits and prior art timeline with chief biochemist.'
    },
    {
      id: 'tsk-03',
      title: 'Finalize Mediation Terms with Defense Counsel',
      caseId: 'case-104',
      caseTitle: 'Dr. Clara Thorne vs. St. Jude',
      caseNumber: 'EM-2026-0774',
      assignedTo: 'Julian Mercer, Esq.',
      assignedAvatar: 'JM',
      priority: 'High',
      dueDate: '2026-09-02',
      status: 'under_review',
      progressPct: 90,
      isOverdue: false,
      description: 'Revise mutual non-disparagement clause and severance escrow schedule.'
    },
    {
      id: 'tsk-04',
      title: 'Submit Environmental Soil Survey to Municipal Board',
      caseId: 'case-103',
      caseTitle: 'Greenfield Estate Zoning',
      caseNumber: 'RE-2026-0155',
      assignedTo: 'Marcus Bell',
      assignedAvatar: 'MB',
      priority: 'Medium',
      dueDate: '2026-09-18',
      status: 'todo',
      progressPct: 0,
      isOverdue: false,
      description: 'Obtain certified surveyor stamp and lodge 4 physical copies with the clerk.'
    },
    {
      id: 'tsk-05',
      title: 'Audit Foreign Holding Disclosures for Vance Defense',
      caseId: 'case-105',
      caseTitle: 'State vs. Jonathan Vance Jr.',
      caseNumber: 'CR-2026-0098',
      assignedTo: 'Sophia Chen',
      assignedAvatar: 'SC',
      priority: 'Medium',
      dueDate: '2026-09-25',
      status: 'in_progress',
      progressPct: 50,
      isOverdue: false,
      description: 'Reconcile 2021-2024 bank reporting statements with FINCEN form 114 filings.'
    },
    {
      id: 'tsk-06',
      title: 'Archive Tax Hearing Record & Issue Final Retainer Refund',
      caseId: 'case-106',
      caseTitle: 'Helios Clean Energy Tax',
      caseNumber: 'TX-2025-0812',
      assignedTo: 'Marcus Bell',
      assignedAvatar: 'MB',
      priority: 'Low',
      dueDate: '2026-08-30',
      status: 'completed',
      progressPct: 100,
      isOverdue: false,
      description: 'All tax judgment filings confirmed. Closing binder generated and client notified.'
    }
  ],

  // Communications Log
  communications: [
    {
      id: 'comm-01',
      type: 'email',
      sender: 'Eleanor Vance, Esq.',
      recipient: 'Robert Sterling (Vanguard Capital)',
      client: 'Vanguard Capital Partners',
      caseNumber: 'CV-2026-0842',
      timestamp: '2026-08-31 10:15 AM',
      subject: 'Summary of Opposing Counsel Settlement Offer & Deposition Dates',
      summary: 'Advised client on counter-proposals for patent cross-license. Client agreed to reject current offer and proceed with filing Summary Judgment.',
      attachment: 'Counter_Offer_Analysis_Memo.pdf'
    },
    {
      id: 'comm-02',
      type: 'call',
      sender: 'Julian Mercer, Esq.',
      recipient: 'David Sterling (Opposing Counsel)',
      client: 'AuraBio Therapeutics Inc.',
      caseNumber: 'IP-2026-0319',
      timestamp: '2026-08-30 03:45 PM',
      subject: 'Conferral on Protective Order Confidentiality Designations',
      summary: 'Resolved designation dispute regarding Exhibit C-4 trade secret algorithms. Agreed on Attorneys Eyes Only restriction.',
      attachment: null
    },
    {
      id: 'comm-03',
      type: 'meeting',
      sender: 'Julian Mercer, Esq. & Marcus Bell',
      recipient: 'Dr. Clara Thorne',
      client: 'Dr. Clara Thorne, MD',
      caseNumber: 'EM-2026-0774',
      timestamp: '2026-08-29 02:00 PM',
      subject: 'Mediation Preparation & Damaged Goodwill Calculation',
      summary: 'Conducted 90-minute in-person trial run of mediator presentation. Client confirmed acceptable settlement floor.',
      attachment: 'Mediation_Brief_Final.docx'
    },
    {
      id: 'comm-04',
      type: 'internal_note',
      sender: 'Marcus Bell (Clerk)',
      recipient: 'Litigation Team',
      client: 'Vanguard Capital Partners',
      caseNumber: 'CV-2026-0842',
      timestamp: '2026-08-28 11:20 AM',
      subject: 'Court Clerk Confirmation: Motion Calendar Date',
      summary: 'Confirmed with Room 232 clerk that Judge Thorne has added our hearing to the Sept 14th motion call.',
      attachment: null
    },
    {
      id: 'comm-05',
      type: 'letter',
      sender: 'Eleanor Vance, Esq.',
      recipient: 'Hon. Justice Katherine Thorne',
      client: 'Vanguard Capital Partners',
      caseNumber: 'CV-2026-0842',
      timestamp: '2026-08-25 09:00 AM',
      subject: 'Formal Request for Discovery Conference Extension',
      summary: 'Submitted joint letter on consent requesting 5-day extension for expert disclosures.',
      attachment: 'Joint_Letter_Extension_Aug25.pdf'
    }
  ],

  // Billing & Invoices
  invoices: [
    {
      id: 'inv-1001',
      invoiceNo: 'INV-2026-081',
      clientId: 'cli-01',
      clientName: 'Vanguard Capital Partners',
      caseNumber: 'CV-2026-0842',
      date: '2026-08-15',
      dueDate: '2026-09-15',
      amount: 14500,
      tax: 1276,
      total: 15776,
      status: 'Sent', // 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled'
      items: [
        { desc: 'Drafting Motion for Summary Judgment & Legal Research (Partner)', hours: 18, rate: 550, amount: 9900 },
        { desc: 'Deposition Preparation & Document Review (Senior Associate)', hours: 12, rate: 350, amount: 4200 },
        { desc: 'Court E-filing Fees & Certified Courier', hours: 1, rate: 400, amount: 400 }
      ],
      notes: 'Net 30. Wire transfer instructions on file.'
    },
    {
      id: 'inv-1002',
      invoiceNo: 'INV-2026-079',
      clientId: 'cli-02',
      clientName: 'AuraBio Therapeutics Inc.',
      caseNumber: 'IP-2026-0319',
      date: '2026-08-01',
      dueDate: '2026-08-31',
      amount: 28400,
      tax: 2499,
      total: 30899,
      status: 'Paid',
      items: [
        { desc: 'Biotech Patent Prior Art Cross-Analysis (Partner)', hours: 24, rate: 600, amount: 14400 },
        { desc: 'Expert Witness Deposition Retainer & Coordination', hours: 20, rate: 450, amount: 9000 },
        { desc: 'Federal Court Filing Disclosures', hours: 1, rate: 5000, amount: 5000 }
      ],
      notes: 'Paid in full via ACH transfer on Aug 28, 2026.'
    },
    {
      id: 'inv-1003',
      invoiceNo: 'INV-2026-075',
      clientId: 'cli-04',
      clientName: 'Dr. Clara Thorne, MD',
      caseNumber: 'EM-2026-0774',
      date: '2026-07-20',
      dueDate: '2026-08-20',
      amount: 8500,
      tax: 748,
      total: 9248,
      status: 'Overdue',
      items: [
        { desc: 'Mediation Brief Preparation & Evidence Indexing', hours: 14, rate: 450, amount: 6300 },
        { desc: 'Witness Interview Statements (Legal Clerk)', hours: 11, rate: 200, amount: 2200 }
      ],
      notes: 'First reminder notice delivered on Aug 22, 2026.'
    },
    {
      id: 'inv-1004',
      invoiceNo: 'INV-2026-083',
      clientId: 'cli-03',
      clientName: 'Greenfield Realty Trust',
      caseNumber: 'RE-2026-0155',
      date: '2026-08-28',
      dueDate: '2026-09-28',
      amount: 6200,
      tax: 545,
      total: 6745,
      status: 'Draft',
      items: [
        { desc: 'Municipal Zoning Appeal Representation (Partner)', hours: 8, rate: 500, amount: 4000 },
        { desc: 'Title Conveyance & Survey Submission', hours: 11, rate: 200, amount: 2200 }
      ],
      notes: 'Awaiting final partner timesheet sign-off.'
    }
  ],

  // Extended Law-Firm Users Database
  users: [
    {
      id: 'usr-001',
      employeeId: 'EMP-1001',
      name: 'Eleanor Vance, Esq.',
      email: 'e.vance@slcms-law.com',
      phone: '+1 (212) 555-0101',
      jobTitle: 'Managing Partner',
      department: 'Commercial Litigation',
      role: 'Administrator',
      roleTitle: 'Managing Partner',
      status: 'Active', // 'Active' | 'Deactivated' | 'Locked'
      passwordHash: 'argon2:$2b$12$eX4mPL3sEcUrE8a9fQ9019VanceSecret2026', // Valid: SecretLawFirm2026!
      passwordPlain: 'SecretLawFirm2026!',
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: 'Today, 08:30 AM',
      activeCases: 4,
      avatarImg: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      avatarClass: 'avatar-gold'
    },
    {
      id: 'usr-002',
      employeeId: 'EMP-1002',
      name: 'Julian Mercer, Esq.',
      email: 'j.mercer@slcms-law.com',
      phone: '+1 (212) 555-0102',
      jobTitle: 'Senior Litigation Partner',
      department: 'Intellectual Property & Employment',
      role: 'Lawyer',
      roleTitle: 'Senior Litigation Counsel',
      status: 'Active',
      passwordHash: 'argon2:$2b$12$eX4mPL3sEcUrE8a9fQ9019MercerSecret2026', // Valid: SecretLawFirm2026!
      passwordPlain: 'SecretLawFirm2026!',
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: 'Today, 09:12 AM',
      activeCases: 3,
      avatarImg: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
      avatarClass: 'avatar-navy'
    },
    {
      id: 'usr-003',
      employeeId: 'EMP-1003',
      name: 'Marcus Bell',
      email: 'm.bell@slcms-law.com',
      phone: '+1 (212) 555-0103',
      jobTitle: 'Senior Legal Clerk',
      department: 'Court Filings & Discovery',
      role: 'Clerk',
      roleTitle: 'Legal Staff / Clerk',
      status: 'Active',
      passwordHash: 'argon2:$2b$12$eX4mPL3sEcUrE8a9fQ9019BellSecret2026', // Valid: SecretLawFirm2026!
      passwordPlain: 'SecretLawFirm2026!',
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: 'Yesterday, 05:45 PM',
      activeCases: 5,
      avatarImg: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
      avatarClass: 'avatar-teal'
    },
    {
      id: 'usr-004',
      employeeId: 'EMP-1004',
      name: 'Sophia Chen',
      email: 's.chen@slcms-law.com',
      phone: '+1 (212) 555-0104',
      jobTitle: 'Paralegal & Research Assistant',
      department: 'Research & Documents',
      role: 'Clerk',
      roleTitle: 'Paralegal',
      status: 'Active',
      passwordHash: 'argon2:$2b$12$eX4mPL3sEcUrE8a9fQ9019ChenSecret2026',
      passwordPlain: 'SecretLawFirm2026!',
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: 'Aug 29, 2026',
      activeCases: 3,
      avatarImg: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      avatarClass: 'avatar-purple'
    },
    {
      id: 'usr-005',
      employeeId: 'EMP-1005',
      name: 'David Croft, Esq. (New Hire)',
      email: 'temp.counsel@slcms-law.com',
      phone: '+1 (212) 555-0105',
      jobTitle: 'Associate Litigation Counsel',
      department: 'Commercial Litigation',
      role: 'Lawyer',
      roleTitle: 'Associate Counsel',
      status: 'Active',
      passwordHash: 'argon2:$2b$12$eX4mPL3sEcUrE8a9fQ9019TempPass2026', // Valid: TempPass2026!
      passwordPlain: 'TempPass2026!',
      mustChangePassword: true, // Requires first-login password change!
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: 'Never (Pending First Login)',
      activeCases: 0,
      avatarImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      avatarClass: 'avatar-navy'
    },
    {
      id: 'usr-006',
      employeeId: 'EMP-1006',
      name: 'Arthur Pendelton (Deactivated)',
      email: 'disabled.user@slcms-law.com',
      phone: '+1 (212) 555-0106',
      jobTitle: 'Former Special Counsel',
      department: 'Tax & Estate',
      role: 'Lawyer',
      roleTitle: 'Special Counsel',
      status: 'Deactivated', // Deactivated account test
      passwordHash: 'argon2:$2b$12$eX4mPL3sEcUrE8a9fQ9019Secret2026',
      passwordPlain: 'SecretLawFirm2026!',
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: 'Jan 15, 2026',
      activeCases: 0,
      avatarClass: 'avatar-navy'
    },
    {
      id: 'usr-007',
      employeeId: 'EMP-1007',
      name: 'Victoria Hayes (Locked Account)',
      email: 'locked.user@slcms-law.com',
      phone: '+1 (212) 555-0107',
      jobTitle: 'Litigation Paralegal',
      department: 'Appellate Division',
      role: 'Clerk',
      roleTitle: 'Legal Clerk',
      status: 'Locked', // Locked after 5 failed attempts
      passwordHash: 'argon2:$2b$12$eX4mPL3sEcUrE8a9fQ9019Secret2026',
      passwordPlain: 'SecretLawFirm2026!',
      mustChangePassword: false,
      failedAttempts: 5,
      lockedUntil: Date.now() + 15 * 60 * 1000, // 15-minute lock window
      lastLogin: 'Aug 28, 2026',
      activeCases: 1,
      avatarClass: 'avatar-teal'
    }
  ],

  // Immutable Audit & Activity Logs
  activityLogs: [
    {
      id: 'log-101',
      timestamp: '2026-08-31 10:45:12',
      user: 'Eleanor Vance, Esq.',
      role: 'Administrator',
      action: 'AI Legal Draft Generated',
      module: 'AI Assistant',
      record: 'Client Letter: Vanguard vs. Apex',
      ip: '192.168.1.45 (Firm Office VPN)',
      status: 'Success'
    },
    {
      id: 'log-102',
      timestamp: '2026-08-31 09:30:00',
      user: 'Julian Mercer, Esq.',
      role: 'Lawyer',
      action: 'Document Uploaded (Privileged)',
      module: 'Document Repository',
      record: 'Settlement_Framework_Thorne.pdf',
      ip: '192.168.1.72 (Firm Office VPN)',
      status: 'Success'
    },
    {
      id: 'log-103',
      timestamp: '2026-08-30 16:22:40',
      user: 'Marcus Bell',
      role: 'Clerk',
      action: 'Task Status Updated to Completed',
      module: 'Tasks & Deadlines',
      record: 'Archive Tax Hearing Record (TX-2025-0812)',
      ip: '192.168.1.88 (Firm Office VPN)',
      status: 'Success'
    },
    {
      id: 'log-104',
      timestamp: '2026-08-30 14:10:05',
      user: 'Eleanor Vance, Esq.',
      role: 'Administrator',
      action: 'Invoice Created & Sent',
      module: 'Billing & Payments',
      record: 'INV-2026-081 ($15,776)',
      ip: '192.168.1.45 (Firm Office VPN)',
      status: 'Success'
    },
    {
      id: 'log-105',
      timestamp: '2026-08-29 11:05:19',
      user: 'Eleanor Vance, Esq.',
      role: 'Administrator',
      action: 'Security Permission Matrix Updated',
      module: 'Firm Settings',
      record: 'Clerk Role Privilege Audit',
      ip: '192.168.1.45 (Firm Office VPN)',
      status: 'Success'
    }
  ],

  // Notifications
  notifications: [
    {
      id: 'notif-01',
      type: 'danger',
      title: 'Urgent Hearing in 48 Hours',
      message: 'Pre-trial conference for Thorne vs. St. Jude is scheduled for Wednesday 9:00 AM.',
      time: '15 mins ago',
      read: false,
      link: '#cases'
    },
    {
      id: 'notif-02',
      type: 'warning',
      title: 'Overdue Invoice Reminder',
      message: 'Invoice INV-2026-075 for Dr. Clara Thorne ($9,248) is 11 days past due.',
      time: '2 hours ago',
      read: false,
      link: '#billing'
    },
    {
      id: 'notif-03',
      type: 'info',
      title: 'New Document Uploaded',
      message: 'Expert Rebuttal Report v1.4 uploaded to AuraBio Patent Case by Sophia Chen.',
      time: 'Yesterday',
      read: true,
      link: '#documents'
    },
    {
      id: 'notif-04',
      type: 'gold',
      title: 'Discovery Deadline Approaching',
      message: 'Motion for Summary Judgment filing deadline in Vanguard vs. Apex is Sept 08.',
      time: '2 days ago',
      read: true,
      link: '#tasks'
    }
  ],

  // ==========================================================================
  // SERVER-SIDE SECURITY & AUTHENTICATION ENGINE (SIMULATED SECURE API)
  // ==========================================================================
  serverAuthenticate(identifier, password, rememberMe = false) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const now = Date.now();

    // 1. Locate Account
    const account = this.users.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.employeeId && u.employeeId.toLowerCase() === cleanId) ||
      u.name.toLowerCase() === cleanId
    );

    // 2. Unregistered User: Safe general denial (do NOT reveal account absence)
    if (!account) {
      this.addAuditLog('Failed Authentication Attempt (Unknown Identifier)', 'Security', `Identifier: ${cleanId}`, 'Denied');
      return {
        success: false,
        errorType: 'INVALID_CREDENTIALS',
        message: 'Invalid email/username or password.'
      };
    }

    // 3. Check Account Lock Status
    if (account.status === 'Locked') {
      if (account.lockedUntil && now < account.lockedUntil) {
        const remainingMinutes = Math.ceil((account.lockedUntil - now) / 60000);
        this.addAuditLog('Login Blocked: Locked Account', 'Security', account.email, 'Blocked');
        return {
          success: false,
          errorType: 'ACCOUNT_LOCKED',
          message: `Too many unsuccessful attempts. Try again in ${remainingMinutes} minute(s) or contact the administrator.`
        };
      } else {
        // Automatically release expired lock
        account.status = 'Active';
        account.failedAttempts = 0;
        account.lockedUntil = null;
      }
    }

    // 4. Check Account Active Status
    if (account.status === 'Deactivated') {
      this.addAuditLog('Login Blocked: Deactivated Account', 'Security', account.email, 'Blocked');
      return {
        success: false,
        errorType: 'ACCOUNT_DISABLED',
        message: 'Your account is currently unavailable. Contact the system administrator.'
      };
    }

    // 5. Verify Password
    const isMatch = (password === account.passwordPlain);

    if (!isMatch) {
      account.failedAttempts = (account.failedAttempts || 0) + 1;
      const currentAttempts = account.failedAttempts;

      if (currentAttempts >= 5) {
        account.status = 'Locked';
        account.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
        this.addAuditLog(`Account Locked (5 Failed Attempts)`, 'Security', account.email, 'Locked');
        return {
          success: false,
          errorType: 'ACCOUNT_LOCKED',
          message: 'Too many unsuccessful attempts. Try again later or contact the administrator.'
        };
      }

      this.addAuditLog(`Failed Login Attempt (Count: ${currentAttempts}/5)`, 'Security', account.email, 'Denied');
      return {
        success: false,
        errorType: 'INVALID_CREDENTIALS',
        message: 'Invalid email/username or password.'
      };
    }

    // 6. Successful Verification: Reset failed attempt counter
    account.failedAttempts = 0;
    account.lockedUntil = null;

    // 7. Check First-Login / Mandatory Password Change
    if (account.mustChangePassword) {
      this.addAuditLog('First Login: Temporary Password Verified', 'Authentication', account.email, 'Pending Password Change');
      return {
        success: true,
        requiresFirstLoginChange: true,
        user: account
      };
    }

    // 8. Create Secure Session
    const sessionToken = 'slcms_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    this.currentUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      roleLabel: account.roleTitle || (account.role === 'Administrator' ? 'Managing Partner' : account.role === 'Lawyer' ? 'Litigation Counsel' : 'Legal Clerk'),
      avatar: account.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      avatarClass: account.avatarClass || 'avatar-navy',
      department: account.department,
      lastLogin: 'Just now'
    };

    account.lastLogin = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.addAuditLog('User Login Successful', 'Authentication', `${account.name} (${account.role})`, 'Success');

    return {
      success: true,
      requiresFirstLoginChange: false,
      token: sessionToken,
      user: this.currentUser
    };
  },

  // First Login Password Update
  completeFirstLoginPasswordChange(userId, currentTempPassword, newPassword) {
    const account = this.users.find(u => u.id === userId);
    if (!account) return { success: false, message: 'Account not found.' };

    if (currentTempPassword !== account.passwordPlain) {
      return { success: false, message: 'Current temporary password is incorrect.' };
    }

    if (newPassword === account.passwordPlain) {
      return { success: false, message: 'New password cannot be identical to the temporary password.' };
    }

    account.passwordPlain = newPassword;
    account.passwordHash = 'argon2:$2b$12$' + Math.random().toString(36).substring(2);
    account.mustChangePassword = false;

    this.currentUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      roleLabel: account.roleTitle || account.role,
      avatar: account.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      avatarClass: account.avatarClass || 'avatar-navy',
      department: account.department,
      lastLogin: 'Just now'
    };

    this.addAuditLog('First-Login Password Successfully Changed', 'Security', account.email, 'Success');
    return { success: true, user: this.currentUser };
  },

  // Admin Account Unlock
  unlockAccount(userId) {
    const account = this.users.find(u => u.id === userId);
    if (account) {
      account.status = 'Active';
      account.failedAttempts = 0;
      account.lockedUntil = null;
      this.addAuditLog(`Administrator Unlocked Account`, 'User Management', account.email, 'Success');
      return true;
    }
    return false;
  },

  // Password Recovery / Reset Method
  resetUserPassword(email, newPassword) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const account = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!account) {
      this.addAuditLog('Password Reset Failed: Account Not Found', 'Security', cleanEmail, 'Failed');
      return { success: false, message: 'No registered firm account found matching that email address.' };
    }

    if (account.status === 'Deactivated') {
      this.addAuditLog('Password Reset Blocked: Deactivated Account', 'Security', account.email, 'Blocked');
      return { success: false, message: 'This account has been deactivated. Please contact the firm managing partner.' };
    }

    // Update password
    account.passwordPlain = newPassword;
    account.passwordHash = 'argon2:$2b$12$' + Math.random().toString(36).substring(2);
    account.failedAttempts = 0;
    account.lockedUntil = null;
    account.mustChangePassword = false;
    
    // Automatically lift any lockout
    if (account.status === 'Locked') {
      account.status = 'Active';
    }

    this.addAuditLog('Password Successfully Reset via Recovery Flow', 'Security', account.email, 'Success');
    return { success: true, user: account };
  },

  // Admin Create New User
  createAdminUser(userData) {
    const existing = this.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
    if (existing) {
      return { success: false, message: 'An account with this email address already exists in the firm database.' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      employeeId: userData.employeeId || 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      name: userData.name,
      email: userData.email.trim(),
      phone: userData.phone || '+1 (212) 555-0100',
      jobTitle: userData.jobTitle || userData.role,
      department: userData.department || 'General Litigation',
      role: userData.role, // 'Administrator' | 'Lawyer' | 'Clerk'
      roleTitle: userData.role === 'Administrator' ? 'Managing Partner' : userData.role === 'Lawyer' ? 'Litigation Counsel' : 'Legal Clerk',
      status: 'Active',
      passwordPlain: userData.temporaryPassword,
      passwordHash: 'argon2:$2b$12$' + Math.random().toString(36).substring(2),
      mustChangePassword: true, // User must create private password on first login
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: 'Never (Invited)',
      activeCases: 0,
      avatarImg: userData.avatarImg || '',
      barNumber: userData.barNumber || '',
      avatarClass: userData.role === 'Administrator' ? 'avatar-gold' : userData.role === 'Lawyer' ? 'avatar-navy' : 'avatar-teal'
    };

    this.users.push(newUser);
    this.addAuditLog(`New User Account Provisioned (${newUser.role})`, 'User Management', `${newUser.name} (${newUser.email})`);
    return { success: true, user: newUser };
  },

  // Helper State Modifiers
  switchRole(roleName) {
    const matched = this.users.find(u => u.role === roleName && u.status === 'Active') || this.users[0];
    this.currentUser = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      roleLabel: matched.roleTitle,
      avatar: matched.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      avatarClass: matched.avatarClass,
      department: matched.department,
      lastLogin: 'Just now'
    };
  },

  addCase(caseData) {
    this.cases.unshift(caseData);
    this.addAuditLog('New Legal Case Registered', 'Case Management', `${caseData.caseNumber} - ${caseData.title}`);
  },

  addTask(taskData) {
    this.tasks.unshift(taskData);
    this.addAuditLog('New Legal Task Created', 'Tasks & Deadlines', taskData.title);
  },

  addDocument(docData) {
    this.documents.unshift(docData);
    this.addAuditLog('Document Uploaded & Cataloged', 'Document Repository', docData.title);
  },

  addCommunication(commData) {
    this.communications.unshift(commData);
    this.addAuditLog('Communication Logged', 'Communications', commData.subject);
  },

  addInvoice(invData) {
    this.invoices.unshift(invData);
    this.addAuditLog('Invoice Generated', 'Billing & Payments', `${invData.invoiceNo} (${invData.total})`);
  },

  // ==========================================================================
  // TANZANIA LEGAL RESEARCH KNOWLEDGE BASE & PRECEDENTS REPOSITORY
  // ==========================================================================
  tanzaniaJudgments: [
    {
      id: 'tz-j-001',
      title: 'Attilio v. Mbowe',
      citation: '[1969] HCD 284 / (1970) EA 143',
      caseNumber: 'Civil Case No. 42 of 1969',
      court: 'High Court of Tanzania (Main Registry at Dar es Salaam)',
      courtTier: 'High Court',
      judge: 'Hon. Georges, C.J.',
      decisionDate: '1969-07-18',
      year: '1969',
      category: 'Civil procedure',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/high-court-main-registry/1969/42',
      downloadUrl: 'https://tanzlii.org/tz/judgment/high-court-main-registry/1969/42/download/pdf',
      hasDownload: true,
      relevanceScore: 98,
      keywords: ['attilio', 'mbowe', 'injunction', 'temporary injunction', 'prima facie case', 'irreparable injury', 'balance of convenience', 'order xxxix', 'splendid hotel'],
      relevantPassage: 'In granting a temporary injunction under Order XXXIX of the Civil Procedure Code, the applicant must establish: (1) a serious question to be tried and a probability that the applicant may obtain relief; (2) that the applicant will suffer irreparable injury which cannot be adequately compensated in damages if the injunction is refused; and (3) if the court is in doubt, the balance of convenience must lie in favour of the applicant.',
      fullTextSummary: 'Landmark decision establishing the classical three-fold test governing the grant of interlocutory and temporary injunctions in Tanzania pursuant to Order XXXIX of the Civil Procedure Code.',
      facts: {
        partiesAndPremises: [
          'The plaintiff was the lessee of the Splendid Hotel on Independence Avenue in Dar es Salaam.',
          'The defendant occupied three rooms in the hotel and operated its bar and nightclub.'
        ],
        natureOfDispute: [
          'The plaintiff sought vacant possession of the rooms, bar and nightclub premises.',
          'The plaintiff also requested an injunction preventing the defendant and his agents from continuing to use those premises.'
        ],
        competingPositions: [
          'The plaintiff alleged that the defendant had obtained possession after representing that he was willing and able to purchase the business but failed to pay as required.',
          'The defendant maintained that there was an agreement allowing part of the purchase price to be paid when the sale agreement was signed and the balance by instalments.',
          'The defendant therefore claimed that his possession arose from a valid sale agreement.'
        ],
        proceduralPosition: [
          'A temporary injunction was initially issued to prevent the defendant from operating the bar and nightclub.',
          'That injunction was later stayed.',
          'The question before the Court was whether the temporary injunction should continue until the main case was tried.'
        ]
      },
      summary: {
        background: 'The dispute concerned the defendant’s possession and operation of rooms, a bar and a nightclub within the Splendid Hotel. The plaintiff sought vacant possession and injunctive relief.',
        legalIssue: 'The Court had to determine whether the temporary injunction should remain in force pending trial.',
        legalPrinciples: [
          'A serious question to be tried and a probability that the applicant may obtain relief.',
          'A risk of injury that could not adequately be repaired through monetary compensation.',
          'A balance of convenience favouring the applicant.'
        ],
        reasoning: 'The Court accepted that serious questions existed regarding the alleged sale agreement and how the defendant obtained possession. However, the plaintiff failed to establish irreparable injury. The claimed financial loss had been quantified and could therefore be compensated through damages if the plaintiff ultimately succeeded.',
        finalDecision: 'The temporary injunction was refused, and the main action was directed to proceed to trial.'
      },
      legalIssues: [
        'Whether the plaintiff established a serious question to be tried with a probability of success regarding the hotel premises.',
        'Whether the refusal of the temporary injunction would cause irreparable injury not compensable in damages.',
        'Whether the balance of convenience favoured continuing the interim restraining order pending trial.'
      ],
      reasoning: 'The High Court (Georges, C.J.) held that while serious triable questions were raised regarding the alleged sale agreement, the applicant failed on the second condition of irreparable injury. Because the plaintiff’s financial losses were quantified and capable of full compensation through damages, an injunction could not be granted.',
      decision: '1. The application for temporary injunction pending trial was refused.\n2. The stay of the interim injunction was made absolute.\n3. The main suit was directed to proceed to trial.\n4. Costs in the cause.',
      lawsCited: [
        'Civil Procedure Code [Cap. 33 R.E. 2019], Order XXXIX Rules 1 & 2',
        'Law of Contract Act [Cap. 345 R.E. 2019], Section 73'
      ]
    },
    {
      id: 'tz-j-002',
      title: 'Kibo Poultry Products Ltd v. Transport Equipment Ltd',
      citation: '[1983] TLR 6',
      caseNumber: 'Civil Appeal No. 24 of 1982',
      court: 'Court of Appeal of Tanzania (at Dar es Salaam)',
      courtTier: 'Court of Appeal',
      judge: 'Hon. Nyalali, C.J., Makame, J.A., and Kisanga, J.A.',
      decisionDate: '1983-03-12',
      year: '1983',
      category: 'Contract law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/1983/6',
      downloadUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/1983/6/download/pdf',
      hasDownload: true,
      relevanceScore: 96,
      keywords: ['contract', 'breach of contract', 'fundamental breach', 'damages', 'repudiation', 'section 73', 'law of contract act'],
      relevantPassage: 'Where one party breaches a condition going to the root of the contract, the aggrieved party is entitled to treat the contract as discharged and claim compensation under Section 73 of the Law of Contract Act. Damages are assessed based on the natural and probable consequences of the breach that were in the contemplation of both parties at the time of making the contract.',
      fullTextSummary: 'Authoritative Court of Appeal precedent on fundamental breach of commercial sale and transport contracts, mitigation of damages, and statutory compensation rules.'
    },
    {
      id: 'tz-j-003',
      title: 'Methuselah Paul Nyagwaswa v. Christopher Mbote Nyirabu',
      citation: '[1985] TLR 103',
      caseNumber: 'Civil Appeal No. 14 of 1984',
      court: 'Court of Appeal of Tanzania (at Dar es Salaam)',
      courtTier: 'Court of Appeal',
      judge: 'Hon. Mustafa, J.A., Makame, J.A., and Kisanga, J.A.',
      decisionDate: '1985-06-25',
      year: '1985',
      category: 'Land law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/1985/103',
      downloadUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/1985/103/download/pdf',
      hasDownload: true,
      relevanceScore: 95,
      keywords: ['land', 'land ownership', 'title deed', 'customary title', 'right of occupancy', 'land registration', 'disposition'],
      relevantPassage: 'A Certificate of Title granted under the Land Registration Act confers an indefeasible title upon the registered owner, save for cases of proven fraud. However, unexhausted improvements and customary rights occupying the land prior to town planning declarations must be compensated or properly extinguished according to statutory procedures.',
      fullTextSummary: 'Key decision reconciling registered rights of occupancy under the Land Act with pre-existing customary land occupancies in urban planning developments.'
    },
    {
      id: 'tz-j-004',
      title: 'Bi. Monica Gonzaga v. National Bank of Commerce (NBC) & Another',
      citation: '[2020] TZHCComD 128',
      caseNumber: 'Commercial Case No. 44 of 2018',
      court: 'High Court of Tanzania (Commercial Division at Dar es Salaam)',
      courtTier: 'High Court (Commercial)',
      judge: 'Hon. Mansoor, J.',
      decisionDate: '2020-09-14',
      year: '2020',
      category: 'Commercial law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/high-court-commercial-division/2020/128',
      downloadUrl: 'https://tanzlii.org/tz/judgment/high-court-commercial-division/2020/128/download/pdf',
      hasDownload: true,
      relevanceScore: 92,
      keywords: ['commercial', 'banking', 'bank guarantee', 'breach of contract', 'commercial disputes', 'injunction'],
      relevantPassage: 'Courts will not interfere with irrevocable bank guarantees or commercial letters of credit unless clear fraud to the knowledge of the issuing bank is established. The autonomous nature of commercial commitments must be preserved to maintain financial certainty in Tanzanian trade.',
      fullTextSummary: 'Commercial Division ruling confirming the strict autonomy principle of commercial letters of credit and performance bonds under Tanzanian banking practice.'
    },
    {
      id: 'tz-j-005',
      title: 'Tanganyika Law Society & Legal and Human Rights Centre v. The Attorney General',
      citation: '[2010] TZCA 1 / Civil Appeal No. 71 of 2008',
      caseNumber: 'Civil Appeal No. 71 of 2008',
      court: 'Court of Appeal of Tanzania (at Dar es Salaam)',
      courtTier: 'Court of Appeal',
      judge: 'Hon. Ramadhani, C.J., Munuo, J.A., and Msoffe, J.A.',
      decisionDate: '2010-06-17',
      year: '2010',
      category: 'Constitutional law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/2010/1',
      downloadUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/2010/1/download/pdf',
      hasDownload: true,
      relevanceScore: 91,
      keywords: ['constitutional', 'fundamental rights', 'basic rights', 'constitution of tanzania', 'article 21', 'independent candidates'],
      relevantPassage: 'The Constitution is the supreme law of the United Republic of Tanzania under Article 64(5). Any legislation or constitutional amendment that abrogates or purports to extinguish the basic pillars of democratic representation and fundamental freedoms guaranteed in the Bill of Rights is subject to judicial review.',
      fullTextSummary: 'Landmark constitutional law precedent examining parliamentary legislative limits, judicial review powers, and fundamental human rights provisions.'
    },
    {
      id: 'tz-j-006',
      title: 'Tanzania Breweries Ltd v. National Social Security Fund (NSSF)',
      citation: '[2017] TZCA 234',
      caseNumber: 'Civil Appeal No. 118 of 2015',
      court: 'Court of Appeal of Tanzania (at Dar es Salaam)',
      courtTier: 'Court of Appeal',
      judge: 'Hon. Mbarouk, J.A., Luanda, J.A., and Mugasha, J.A.',
      decisionDate: '2017-11-03',
      year: '2017',
      category: 'Employment law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/2017/234',
      downloadUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/2017/234/download/pdf',
      hasDownload: true,
      relevanceScore: 90,
      keywords: ['employment', 'labour', 'statutory deductions', 'nssf', 'employer liability', 'employment and labour relations act'],
      relevantPassage: 'Statutory employment contributions mandated under the law are non-derogable obligations of the employer. Failure to remit statutory deductions creates a civil debt recoverable under statutory powers, independent of internal employment contracts.',
      fullTextSummary: 'Appellate decision clarifying employer obligations regarding statutory employee social security deductions and compliance standards.'
    },
    {
      id: 'tz-j-007',
      title: 'Said Salim Bakhresa & Co. Ltd v. Commissioner General (TRA)',
      citation: '[2019] TZCAT 4',
      caseNumber: 'Tax Appeal No. 12 of 2017',
      court: 'Tax Appeals Tribunal (sitting at Dar es Salaam)',
      courtTier: 'Tribunal',
      judge: 'Hon. Dr. Mchome, Chairman',
      decisionDate: '2019-04-08',
      year: '2019',
      category: 'Commercial law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/tax-revenue-appeals-tribunal/2019/4',
      downloadUrl: 'https://tanzlii.org/tz/judgment/tax-revenue-appeals-tribunal/2019/4/download/pdf',
      hasDownload: true,
      relevanceScore: 88,
      keywords: ['tax', 'revenue', 'tra', 'customs', 'commercial', 'corporate tax', 'statutory assessment'],
      relevantPassage: 'Tax assessments by the Tanzania Revenue Authority must adhere strictly to statutory evidentiary thresholds. An assessment founded on speculative margins rather than verified financial ledgers violates the principles of administrative fairness and natural justice.',
      fullTextSummary: 'Precedent regarding taxpayer rights, administrative natural justice in tax assessments, and the burden of proof in revenue appeals.'
    },
    {
      id: 'tz-j-008',
      title: 'National Housing Corporation v. Sadar Mohamed',
      citation: '[1987] TLR 41',
      caseNumber: 'Civil Appeal No. 33 of 1986',
      court: 'Court of Appeal of Tanzania (at Dar es Salaam)',
      courtTier: 'Court of Appeal',
      judge: 'Hon. Makame, J.A., Ramadhani, J.A., and Omar, J.A.',
      decisionDate: '1987-10-15',
      year: '1987',
      category: 'Land law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/1987/41',
      downloadUrl: 'https://tanzlii.org/tz/judgment/court-appeal-tanzania/1987/41/download/pdf',
      hasDownload: true,
      relevanceScore: 89,
      keywords: ['land', 'landlord', 'tenant', 'eviction', 'statutory tenancy', 'notice to quit', 'nhc'],
      relevantPassage: 'In tenancy disputes under statutory protection, an order for vacant possession or eviction cannot be granted without valid statutory notice and judicial evaluation of alternative accommodation and relative hardship of the parties.',
      fullTextSummary: 'Landmark decision on landlord and tenant relationships, statutory notices of termination, and judicial protections against unlawful eviction.'
    },
    {
      id: 'tz-j-009',
      title: 'Abdallah Salum Muwinge vs Halima Ismail',
      citation: '[2020] TZHC 10045',
      caseNumber: 'PC Civil Appeal No. 69 of 2018',
      court: 'High Court of Tanzania',
      courtTier: 'High Court',
      judge: 'Hon. S.M. Kulita, J.',
      decisionDate: '2020-12-31',
      year: '2020',
      category: 'Family Law',
      sourceName: 'TanzLII (Tanzania Legal Information Institute)',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/high-court-tanzania/2020/10045',
      downloadUrl: 'https://tanzlii.org/tz/judgment/high-court-tanzania/2020/10045/download/pdf',
      hasDownload: true,
      relevanceScore: 98,
      keywords: ['muwinge', 'halima', 'ismail', 'family law', 'matrimonial dispute', 'trial de novo', 'nullification', '10045', 'tzhc 10045', '2020'],
      relevantPassage: 'The High Court nullified the proceedings and judgments of the Primary Court and District Court because important portions of the petitioner’s testimony were missing from the original record. The Court ordered a trial de novo before another competent magistrate with a new set of assessors.',
      fullTextSummary: 'High Court appellate determination nullifying lower-court matrimonial property proceedings due to missing trial depositions and ordering a trial de novo.',
      facts: 'The dispute arose over matrimonial property division and child maintenance following separation. The Primary Court awarded 70% of matrimonial assets to the wife and TZS 50,000 monthly maintenance. On appeal, the record was discovered to be missing vital portions of witness evidence.',
      legalIssues: [
        'Whether awarding 70% of the matrimonial property to the respondent was justified.',
        'Whether monthly child maintenance of TZS 50,000 was appropriate.',
        'Whether missing trial court testimony rendered the lower-court judgment legally unreliable.'
      ],
      reasoning: 'The High Court found that significant portions of the Primary Court proceedings were missing, making the record incomplete and unsafe to sustain an appellate judgment.',
      decision: '1. Primary Court proceedings and judgment nullified.\n2. District Court proceedings and judgment nullified.\n3. Trial de novo ordered before another magistrate with new assessors.\n4. No order as to costs.',
      lawsCited: [
        'The Magistrates’ Courts Act [Cap. 11 R.E. 2019], Section 32',
        'The Law of Marriage Act [Cap. 29 R.E. 2019], Sections 114 & 160',
        'Civil Procedure Code [Cap. 33 R.E. 2019]'
      ]
    }
  ],

  tanzaniaLegislation: [
    {
      id: 'tz-leg-001',
      title: 'The Law of Contract Act',
      chapter: 'Cap. 345 R.E. 2019',
      actYear: '1961 (Revised Edition 2019)',
      category: 'Contract law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/legislation/act/2019/345',
      downloadUrl: 'https://tanzlii.org/tz/legislation/act/2019/345/download/pdf',
      hasDownload: true,
      keySections: [
        {
          section: 'Section 10',
          title: 'What agreements are contracts',
          text: 'All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.'
        },
        {
          section: 'Section 73',
          title: 'Compensation for loss or damage caused by breach of contract',
          text: 'When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it.'
        },
        {
          section: 'Section 74',
          title: 'Compensation for breach of contract where penalty stipulated for',
          text: 'When a contract has been broken, if a sum is named in the contract as the amount to be paid in case of such breach, the party complaining of the breach is entitled to receive reasonable compensation not exceeding the amount so named.'
        }
      ]
    },
    {
      id: 'tz-leg-002',
      title: 'The Land Act',
      chapter: 'Cap. 113 R.E. 2019',
      actYear: '1999 (Revised Edition 2019)',
      category: 'Land law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/legislation/act/2019/113',
      downloadUrl: 'https://tanzlii.org/tz/legislation/act/2019/113/download/pdf',
      hasDownload: true,
      keySections: [
        {
          section: 'Section 4',
          title: 'All land vested in the President as trustee',
          text: 'All land in Tanzania is public land vested in the President as trustee on behalf of the citizens of Tanzania.'
        },
        {
          section: 'Section 19',
          title: 'Rights to occupy land',
          text: 'The right to occupy land granted under a Certificate of Right of Occupancy represents the highest legal tenure of general and reserved land in Tanzania.'
        },
        {
          section: 'Section 61',
          title: 'Dispositions and conveyancing requirements',
          text: 'Any disposition or conveyance of a right of occupancy must be registered in the Land Registry to take legal effect against subsequent purchasers for value.'
        }
      ]
    },
    {
      id: 'tz-leg-003',
      title: 'The Civil Procedure Code',
      chapter: 'Cap. 33 R.E. 2019',
      actYear: '1966 (Revised Edition 2019)',
      category: 'Civil procedure',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/legislation/act/2019/33',
      downloadUrl: 'https://tanzlii.org/tz/legislation/act/2019/33/download/pdf',
      hasDownload: true,
      keySections: [
        {
          section: 'Order XXXIX Rule 1',
          title: 'Cases in which temporary injunction may be granted',
          text: 'Where in any suit it is proved by affidavit or otherwise that any property in dispute in a suit is in danger of being wasted, damaged, or alienated by any party to the suit, or wrongfully sold in execution of a decree, the court may grant a temporary injunction to restrain such act.'
        },
        {
          section: 'Order XXXIX Rule 2',
          title: 'Injunction to restrain repetition or continuance of breach',
          text: 'In any suit for restraining the defendant from committing a breach of contract or other injury of any kind, whether compensation is claimed in the suit or not, the plaintiff may apply to the court for a temporary injunction.'
        }
      ]
    },
    {
      id: 'tz-leg-004',
      title: 'The Employment and Labour Relations Act',
      chapter: 'Cap. 366 R.E. 2019',
      actYear: '2004 (Revised Edition 2019)',
      category: 'Employment law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/legislation/act/2019/366',
      downloadUrl: 'https://tanzlii.org/tz/legislation/act/2019/366/download/pdf',
      hasDownload: true,
      keySections: [
        {
          section: 'Section 37',
          title: 'Unfair termination of employment',
          text: 'It shall be unlawful for an employer to terminate the employment of an employee unfairly. A termination is unfair if the employer fails to prove that the reason for termination is valid and fair relating to capacity, conduct, or operational requirements, and in accordance with fair procedure.'
        },
        {
          section: 'Section 42',
          title: 'Severance pay and statutory entitlements',
          text: 'An employer shall pay severance pay to an employee on termination of employment where the employee has completed at least 12 continuous months of service with that employer.'
        }
      ]
    },
    {
      id: 'tz-leg-005',
      title: 'The Appellate Jurisdiction Act',
      chapter: 'Cap. 141 R.E. 2019',
      actYear: '1979 (Revised Edition 2019)',
      category: 'Constitutional law',
      sourceName: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/legislation/act/2019/141',
      downloadUrl: 'https://tanzlii.org/tz/legislation/act/2019/141/download/pdf',
      hasDownload: true,
      keySections: [
        {
          section: 'Section 4',
          title: 'Jurisdiction of the Court of Appeal of Tanzania',
          text: 'The Court of Appeal of Tanzania shall have jurisdiction to hear and determine appeals from the High Court and subordinate tribunals with appellate powers as provided by law.'
        }
      ]
    }
  ],

  // Document Library for Indexed Legal Materials
  legalSourceDocuments: [
    {
      id: 'doc-lib-001',
      title: 'Commercial Injunction Precedents Digest (TanzLII Compilation)',
      source: 'TanzLII',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/high-court-commercial-division/digest-2024',
      court: 'High Court of Tanzania (Commercial Division)',
      caseNumber: 'Precedent Digest TZ-COM-2024',
      decisionDate: '2024-01-15',
      category: 'Commercial law',
      description: 'Comprehensive indexed compilation of interlocutory orders and temporary injunction rulings before the Commercial Division.',
      accessLevel: 'Entire Law Firm',
      relatedCaseId: 'case-101',
      uploadedBy: 'Eleanor Vance, Esq.',
      uploadedDate: '2026-08-10',
      status: 'Ready for AI',
      indexedPassagesCount: 42,
      fileSize: '3.4 MB',
      fileType: 'PDF',
      rawExtractedText: 'HIGH COURT OF TANZANIA (COMMERCIAL DIVISION)\nCOMMERCIAL INJUNCTIONS PRECEDENTS COMPILATION (2024)\n\n1. PRINCIPLES ON INTERLOCUTORY RESTRAINTS:\nAn interlocutory injunction is an equitable remedy intended to preserve the status quo pending trial. The applicant must satisfy three cardinal conditions:\n(a) A prima facie case with a probability of success;\n(b) Irreparable injury that cannot be adequately compensated in monetary damages; and\n(c) The balance of convenience tilts in favor of the grant.\n\n2. COMMERCIAL CONTRACTS & BANK GUARANTEES:\nIn commercial transactions, courts will not restrain payment under an unconditional bank guarantee or letter of credit save in clear and established cases of egregious fraud known to the financial institution.',
      passages: [
        {
          id: 'pass-001-1',
          passageIndex: 1,
          text: 'HIGH COURT OF TANZANIA (COMMERCIAL DIVISION) - PRINCIPLES ON INTERLOCUTORY RESTRAINTS: An interlocutory injunction is an equitable remedy intended to preserve the status quo pending trial. The applicant must satisfy three cardinal conditions: (a) A prima facie case with a probability of success; (b) Irreparable injury that cannot be adequately compensated in monetary damages; and (c) The balance of convenience tilts in favor of the grant.',
          wordCount: 72,
          pageNumber: 1
        },
        {
          id: 'pass-001-2',
          passageIndex: 2,
          text: 'COMMERCIAL CONTRACTS & BANK GUARANTEES: In commercial transactions, courts will not restrain payment under an unconditional bank guarantee or letter of credit save in clear and established cases of egregious fraud known to the financial institution.',
          wordCount: 38,
          pageNumber: 1
        }
      ]
    },
    {
      id: 'doc-lib-002',
      title: 'Law of Contract Act [Cap. 345 R.E. 2019] Official Gazette Edition',
      source: 'TanzLII / Attorney General Chambers',
      tanzliiUrl: 'https://tanzlii.org/tz/legislation/act/2019/345',
      court: 'Parliament of the United Republic of Tanzania',
      caseNumber: 'Cap. 345',
      decisionDate: '2019-11-30',
      category: 'Contract law',
      description: 'Official revised statute governing contract formation, breach remedies, liquidated damages, and indemnity.',
      accessLevel: 'Public Legal Library',
      relatedCaseId: null,
      uploadedBy: 'Julian Mercer, Esq.',
      uploadedDate: '2026-08-15',
      status: 'Ready for AI',
      indexedPassagesCount: 128,
      fileSize: '5.1 MB',
      fileType: 'PDF',
      rawExtractedText: 'THE LAW OF CONTRACT ACT [CAP. 345 R.E. 2019]\n\nPART I - PRELIMINARY PROVISIONS\nSection 10: All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object.\n\nPART VI - REMEDIES FOR BREACH OF CONTRACT\nSection 73: When a contract has been broken, the party who suffers by such breach is entitled to receive from the defaulting party compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things.',
      passages: [
        {
          id: 'pass-002-1',
          passageIndex: 1,
          text: 'THE LAW OF CONTRACT ACT [CAP. 345 R.E. 2019] - Section 10: All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object.',
          wordCount: 37,
          pageNumber: 1
        },
        {
          id: 'pass-002-2',
          passageIndex: 2,
          text: 'Section 73: When a contract has been broken, the party who suffers by such breach is entitled to receive from the defaulting party compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach.',
          wordCount: 47,
          pageNumber: 2
        }
      ]
    },
    {
      id: 'doc-lib-003',
      title: 'Vanguard Capital Matter - Cross-Border Licensing Agreement Draft',
      source: 'Case Repository / Confidential',
      tanzliiUrl: '',
      court: 'High Court Commercial Division',
      caseNumber: 'CV-2026-0842',
      decisionDate: '2026-02-10',
      category: 'Commercial law',
      description: 'Confidential client contract schedule and breach notices for Vanguard Capital v. Apex Tech.',
      accessLevel: 'Related Case Only',
      relatedCaseId: 'case-101',
      uploadedBy: 'Eleanor Vance, Esq.',
      uploadedDate: '2026-08-20',
      status: 'Ready for AI',
      indexedPassagesCount: 18,
      fileSize: '1.8 MB',
      fileType: 'DOCX',
      rawExtractedText: 'CROSS-BORDER SOFTWARE LICENSING AGREEMENT\nBETWEEN: Vanguard Capital Holdings Ltd AND Apex Tech Solutions Tanzania Ltd\n\nCLAUSE 14 - DEFAULT AND TERMINATION:\n14.1 Either party may terminate this Agreement upon thirty (30) days written notice in the event of a material breach.\n14.2 Governing Law and Jurisdiction: This Agreement shall be governed by and construed in accordance with the Laws of the United Republic of Tanzania.',
      passages: [
        {
          id: 'pass-003-1',
          passageIndex: 1,
          text: 'CROSS-BORDER SOFTWARE LICENSING AGREEMENT - CLAUSE 14: Either party may terminate this Agreement upon thirty (30) days written notice in the event of a material breach. Governing Law: This Agreement shall be governed by the Laws of Tanzania.',
          wordCount: 41,
          pageNumber: 1
        }
      ]
    },
    {
      id: 'doc-lib-004',
      title: 'Zoning Appeals Tribunal Ruling on Greenfield Realty Deed',
      source: 'Court Registry',
      tanzliiUrl: '',
      court: 'Municipal Zoning Appeals Board',
      caseNumber: 'MZB-2026-0155',
      decisionDate: '2026-05-18',
      category: 'Land law',
      description: 'Zoning variance findings regarding right of occupancy and title deed conversion.',
      accessLevel: 'Related Case Only',
      relatedCaseId: 'case-103',
      uploadedBy: 'Eleanor Vance, Esq.',
      uploadedDate: '2026-08-25',
      status: 'Ready for AI',
      indexedPassagesCount: 14,
      fileSize: '2.2 MB',
      fileType: 'PDF',
      rawExtractedText: 'MUNICIPAL ZONING APPEALS BOARD OF DAR ES SALAAM\nAPPEAL NO. MZB-2026-0155\nIN RE: GREENFIELD REALTY URBAN RIGHT OF OCCUPANCY VARIANCE\n\nRULING:\nThe Board finds that the conversion of granted right of occupancy for mixed commercial use conforms to the Urban Planning Act [Cap. 355] and does not prejudice adjoining residential rights.',
      passages: [
        {
          id: 'pass-004-1',
          passageIndex: 1,
          text: 'MUNICIPAL ZONING APPEALS BOARD - RULING: The Board finds that the conversion of granted right of occupancy for mixed commercial use conforms to the Urban Planning Act [Cap. 355] and does not prejudice adjoining residential rights.',
          wordCount: 37,
          pageNumber: 1
        }
      ]
    },
    {
      id: 'doc-lib-005',
      title: 'Abdallah Salum Muwinge vs Halima Ismail [2020] TZHC 10045',
      source: 'TanzLII (Tanzania Legal Information Institute)',
      tanzliiUrl: 'https://tanzlii.org/tz/judgment/high-court-tanzania/2020/10045',
      court: 'High Court of Tanzania (Main Registry at Dar es Salaam)',
      caseNumber: 'Probate Cause No. 74 of 2019 / [2020] TZHC 10045',
      decisionDate: '2020-08-28',
      category: 'Probate and Family law',
      description: 'High Court precedent on surviving spousal priority in grant of letters of administration, burden of proof on caveat alleging divorce, and protection of matrimonial residential property.',
      accessLevel: 'Public Legal Library',
      relatedCaseId: null,
      uploadedBy: 'Julian Mercer, Esq.',
      uploadedDate: '2026-08-28',
      status: 'Ready for AI',
      indexedPassagesCount: 24,
      fileSize: '2.9 MB',
      fileType: 'PDF',
      rawExtractedText: `IN THE HIGH COURT OF TANZANIA (MAIN REGISTRY AT DAR ES SALAAM)
PROBATE AND ADMINISTRATION CAUSE NO. 74 OF 2019 / [2020] TZHC 10045

IN THE MATTER OF THE ESTATE OF THE LATE SALUM MUWINGE (DECEASED)
AND
IN THE MATTER OF AN APPLICATION FOR LETTERS OF ADMINISTRATION BY HALIMA ISMAIL (PETITIONER)
VERSUS
ABDALLAH SALUM MUWINGE (CAVEATOR / OBJECTOR)

JUDGMENT & REASONS
MASSOUD, J.:

The dispute before this Court concerns the administration and distribution of the estate of the late Salum Muwinge, deceased, who died intestate in Dar es Salaam leaving valuable immovable real property comprising a residential house situated at Ilala.

The Petitioner, Halima Ismail, petitioned for grant of Letters of Administration claiming legal standing as lawful surviving spouse under the Probate and Administration of Estates Act [Cap. 352 R.E. 2019] and the Law of Marriage Act [Cap. 29 R.E. 2019].

The Objector, Abdallah Salum Muwinge, lodged a caveat asserting that the marriage between the deceased and the Petitioner had been dissolved under Islamic rites (talak) prior to the death of the deceased, and that customary paternal heirs held paramount entitlement.

HELD:
1. Under Tanzanian probate law, marriage creates a strong presumption of legal validity and priority in the grant of letters of administration pursuant to Sections 5 and 23 of Cap. 352.
2. Where a caveator alleges dissolution of marriage, the evidentiary burden strictly lies on the caveator to tender formal documentary proof or corroborated testimony. The caveator having failed to produce a valid divorce certificate, the marriage was subsisting at the time of death.
3. The caveat is dismissed with costs, and Letters of Administration are granted to Halima Ismail.`,
      passages: [
        {
          id: 'pass-005-1',
          passageIndex: 1,
          text: 'HIGH COURT OF TANZANIA - PROBATE CAUSE NO. 74 OF 2019 / [2020] TZHC 10045: In the matter of the estate of the late Salum Muwinge (Deceased), Halima Ismail (Petitioner) v. Abdallah Salum Muwinge (Caveator). The dispute concerns the administration of residential real property in Ilala, Dar es Salaam.',
          wordCount: 47,
          pageNumber: 1
        },
        {
          id: 'pass-005-2',
          passageIndex: 2,
          text: 'HELD BY MASSOUD, J.: Under Tanzanian probate law (Cap. 352), a surviving spouse has statutory priority in the grant of letters of administration. Where an objector alleges prior marriage dissolution, the evidentiary burden strictly lies on the caveator to tender formal documentary proof (talaknama).',
          wordCount: 47,
          pageNumber: 2
        },
        {
          id: 'pass-005-3',
          passageIndex: 3,
          text: 'FINAL DECISION: The caveat filed by Abdallah Salum Muwinge is dismissed with costs. Letters of Administration are granted to Halima Ismail with statutory duty to file an estate inventory within six months.',
          wordCount: 34,
          pageNumber: 3
        }
      ]
    }
  ],

  // Saved AI Legal Research Reports Attached to Cases
  savedResearchReports: [],

  // Citation Feedback Records
  citationFeedbackReports: [],

  // Helper Methods for Tanzania Legal Research Assistant
  getAuthorizedCasesForUser(user) {
    if (!user) return [];
    if (user.role === 'Administrator') return this.cases;
    return this.cases.filter(c => 
      c.lawyer === user.name || 
      c.supportingStaff === user.name || 
      user.role === 'Lawyer'
    );
  },

  searchTanzaniaLegalAuthorities(query, scope = 'all', filters = {}, user = null) {
    const cleanQuery = (query || '').toLowerCase().trim();
    const results = {
      judgments: [],
      legislation: [],
      caseDocuments: []
    };

    if (!cleanQuery) return results;

    // Extract potential 4-digit year constraint (e.g. "2020", "2019", "1985", "1987", "1969")
    const yearMatch = cleanQuery.match(/\b(19\d{2}|20\d{2})\b/);
    const queryYear = yearMatch ? yearMatch[1] : null;

    // Filter out common query stop words
    const stopWords = new Set(['show', 'me', 'all', 'the', 'cases', 'case', 'in', 'about', 'what', 'find', 'list', 'search', 'for', 'tell', 'kuhusu', 'ya', 'za', 'kwenye', 'hapa', 'gani', 'ipi', 'which', 'and', 'with', 'from']);
    const rawTokens = cleanQuery.split(/[^\w\d]+/).filter(w => w.length >= 2);
    const queryTokens = rawTokens.filter(w => !stopWords.has(w));

    // 1. Search & Score Judgments
    if (scope === 'all' || scope === 'tanzlii') {
      const scoredJudgments = [];

      for (const j of this.tanzaniaJudgments) {
        // Strict explicit filter checks
        if (filters.court && filters.court !== 'all' && !j.court.toLowerCase().includes(filters.court.toLowerCase())) continue;
        if (filters.category && filters.category !== 'all' && j.category.toLowerCase() !== filters.category.toLowerCase()) continue;
        if (filters.year && filters.year !== 'all' && j.year !== filters.year) continue;
        if (filters.judge && filters.judge.trim() && !j.judge.toLowerCase().includes(filters.judge.toLowerCase())) continue;
        if (filters.caseNumber && filters.caseNumber.trim() && !j.caseNumber.toLowerCase().includes(filters.caseNumber.toLowerCase())) continue;

        let score = 0;
        const jTitle = (j.title || '').toLowerCase();
        const jCitation = (j.citation || '').toLowerCase();
        const jCat = (j.category || '').toLowerCase();
        const jKeywords = (j.keywords || []).join(' ').toLowerCase();
        const jPassage = (j.relevantPassage || '').toLowerCase();
        const jYear = j.year || '';

        // If user query explicitly mentioned a year (e.g. "2020")
        if (queryYear) {
          if (jYear === queryYear || jCitation.includes(queryYear) || (j.decisionDate && j.decisionDate.startsWith(queryYear))) {
            score += 100;
          } else {
            // If year was specified and this judgment is from a different year, penalize/exclude
            continue;
          }
        }

        // Category matching (e.g. "land", "contract", "employment", "probate", "tax")
        if (cleanQuery.includes('land') && (jCat.includes('land') || jKeywords.includes('land'))) score += 50;
        if (cleanQuery.includes('contract') && (jCat.includes('contract') || jKeywords.includes('contract'))) score += 50;
        if (cleanQuery.includes('injunction') && (jCat.includes('civil') || jKeywords.includes('injunction'))) score += 50;
        if (cleanQuery.includes('probate') && (jCat.includes('probate') || jCat.includes('family') || jKeywords.includes('probate'))) score += 50;
        if (cleanQuery.includes('tax') && (jCat.includes('tax') || jKeywords.includes('tax'))) score += 50;

        // Keyword tokens matching
        for (const tok of queryTokens) {
          if (jTitle.includes(tok)) score += 30;
          if (jCitation.includes(tok)) score += 25;
          if (jKeywords.includes(tok)) score += 20;
          if (jPassage.includes(tok)) score += 10;
        }

        if (score > 0 || (queryTokens.length === 0 && queryYear && (jYear === queryYear))) {
          scoredJudgments.push({ judgment: j, score: score });
        }
      }

      scoredJudgments.sort((a, b) => b.score - a.score);
      results.judgments = scoredJudgments.map(item => item.judgment);
    }

    // 2. Search & Score Legislation
    if (scope === 'all' || scope === 'legislation') {
      const scoredLeg = [];

      for (const l of this.tanzaniaLegislation) {
        if (filters.category && filters.category !== 'all' && l.category.toLowerCase() !== filters.category.toLowerCase()) continue;
        
        let score = 0;
        const lTitle = (l.title || '').toLowerCase();
        const lChap = (l.chapter || '').toLowerCase();
        const lCat = (l.category || '').toLowerCase();
        const sectionsStr = l.keySections.map(s => `${s.section} ${s.title} ${s.text}`).join(' ').toLowerCase();

        if (cleanQuery.includes('land') && (lCat.includes('land') || lTitle.includes('land'))) score += 50;
        if (cleanQuery.includes('contract') && (lCat.includes('contract') || lTitle.includes('contract'))) score += 50;
        if (cleanQuery.includes('injunction') && (lChap.includes('33') || sectionsStr.includes('injunction'))) score += 50;
        if (cleanQuery.includes('probate') && (lTitle.includes('probate') || lTitle.includes('marriage'))) score += 50;

        for (const tok of queryTokens) {
          if (lTitle.includes(tok)) score += 30;
          if (lChap.includes(tok)) score += 25;
          if (sectionsStr.includes(tok)) score += 15;
        }

        if (score > 0) {
          scoredLeg.push({ leg: l, score: score });
        }
      }

      scoredLeg.sort((a, b) => b.score - a.score);
      results.legislation = scoredLeg.map(item => item.leg);
    }

    // 3. Search & Score Authorized Case Documents
    if (scope === 'all' || scope === 'case_docs') {
      const authorizedCases = this.getAuthorizedCasesForUser(user || this.currentUser);
      const authorizedCaseIds = authorizedCases.map(c => c.id);
      const scoredDocs = [];

      for (const doc of this.legalSourceDocuments) {
        if (doc.status !== 'Ready for AI') continue;

        if (doc.accessLevel === 'Related Case Only' && doc.relatedCaseId) {
          if (!authorizedCaseIds.includes(doc.relatedCaseId)) continue;
        }
        if (filters.caseId && filters.caseId !== 'all' && doc.relatedCaseId !== filters.caseId) continue;
        if (filters.category && filters.category !== 'all' && doc.category.toLowerCase() !== filters.category.toLowerCase()) continue;

        let score = 0;
        const dTitle = (doc.title || '').toLowerCase();
        const dCat = (doc.category || '').toLowerCase();
        const dPassages = (doc.passages || []).map(p => p.text).join(' ').toLowerCase();
        const dText = (doc.rawExtractedText || '').toLowerCase();

        if (queryYear && (dTitle.includes(queryYear) || (doc.decisionDate && doc.decisionDate.includes(queryYear)))) {
          score += 100;
        } else if (queryYear) {
          continue;
        }

        if (cleanQuery.includes('land') && (dCat.includes('land') || dTitle.includes('land') || dPassages.includes('land'))) score += 50;
        if (cleanQuery.includes('contract') && (dCat.includes('contract') || dTitle.includes('contract'))) score += 50;
        if (cleanQuery.includes('probate') && (dCat.includes('probate') || dTitle.includes('probate'))) score += 50;

        for (const tok of queryTokens) {
          if (dTitle.includes(tok)) score += 30;
          if (dPassages.includes(tok)) score += 15;
          if (dText.includes(tok)) score += 10;
        }

        if (score > 0 || (queryTokens.length === 0 && queryYear)) {
          scoredDocs.push({ doc: doc, score: score });
        }
      }

      scoredDocs.sort((a, b) => b.score - a.score);
      results.caseDocuments = scoredDocs.map(item => item.doc);
    }

    return results;
  },

  // Chunking text into legal passages
  chunkTextIntoPassages(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];
    const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
    if (paragraphs.length === 0) {
      if (rawText.trim().length > 20) {
        return [{
          id: 'pass-' + Date.now() + '-1',
          passageIndex: 1,
          text: rawText.trim(),
          wordCount: rawText.trim().split(/\s+/).length,
          pageNumber: 1
        }];
      }
      return [];
    }

    return paragraphs.map((para, idx) => ({
      id: 'pass-' + Date.now() + '-' + (idx + 1),
      passageIndex: idx + 1,
      text: para,
      wordCount: para.split(/\s+/).length,
      pageNumber: Math.max(1, Math.ceil((idx + 1) / 2))
    }));
  },

  // Document Upload Processing Pipeline
  uploadLegalSourceDocument(docData) {
    const rawText = docData.rawExtractedText || docData.description || '';
    const passages = docData.passages && docData.passages.length > 0 ? docData.passages : this.chunkTextIntoPassages(rawText);
    const wordCount = rawText ? rawText.trim().split(/\s+/).length : 0;

    // Strict Rule: Do not mark "Ready for AI" unless readable text and passages were successfully created
    const hasReadablePassages = passages.length > 0 && wordCount >= 15;
    const finalStatus = hasReadablePassages ? 'Ready for AI' : 'Processing Failed';
    const failureReason = hasReadablePassages ? null : 'No readable text could be extracted from document. Scanned documents require OCR.';

    const newDoc = {
      id: 'doc-lib-' + Date.now(),
      title: docData.title || 'Untitled Tanzanian Legal Authority',
      source: docData.source || 'TanzLII',
      tanzliiUrl: docData.tanzliiUrl || '',
      court: docData.court || 'High Court of Tanzania',
      caseNumber: docData.caseNumber || 'N/A',
      decisionDate: docData.decisionDate || new Date().toISOString().split('T')[0],
      category: docData.category || 'General Legal',
      description: docData.description || 'Uploaded Tanzanian legal source document.',
      accessLevel: docData.accessLevel || 'Entire Law Firm',
      relatedCaseId: docData.relatedCaseId || null,
      uploadedBy: this.currentUser?.name || 'Authorized Counsel',
      uploadedDate: new Date().toISOString().split('T')[0],
      status: finalStatus,
      failureReason: failureReason,
      indexedPassagesCount: passages.length,
      rawExtractedText: rawText,
      passages: passages,
      totalWordCount: wordCount,
      totalCharacterCount: rawText.length,
      fileSize: docData.fileSize || '2.4 MB',
      fileType: docData.fileType || 'PDF'
    };

    this.legalSourceDocuments.unshift(newDoc);
    this.addAuditLog('Document Uploaded & Processed', 'Legal Source Library', `${newDoc.title} (${newDoc.status})`);
    return newDoc;
  },

  attachResearchToCase(caseId, researchData) {
    const targetCase = this.cases.find(c => c.id === caseId);
    if (!targetCase) return { success: false, message: 'Case record not found.' };

    const reportId = 'rep-' + Date.now();
    const reportRecord = {
      id: reportId,
      caseId: caseId,
      caseNumber: targetCase.caseNumber,
      caseTitle: targetCase.title,
      researchTitle: researchData.title || `Tanzania Legal Research: ${researchData.question.substring(0, 50)}...`,
      question: researchData.question,
      answer: researchData.answer,
      citations: researchData.citations || [],
      sources: researchData.sources || [],
      savedBy: this.currentUser?.name || 'Counsel',
      savedRole: this.currentUser?.role || 'Lawyer',
      savedAt: new Date().toLocaleString(),
      verificationNote: 'AI-assisted research — professional verification required.'
    };

    this.savedResearchReports.unshift(reportRecord);

    // Also add to Case timeline notes
    const newNote = `[AI Legal Research Attached - ${reportRecord.savedAt}]: ${reportRecord.researchTitle} (Saved by ${reportRecord.savedBy}). Verified against TanzLII authorities.`;
    targetCase.notes = targetCase.notes ? `${targetCase.notes}\n\n${newNote}` : newNote;

    this.addAuditLog('AI Legal Research Saved to Case', 'Case Management', `${targetCase.caseNumber} - ${reportRecord.researchTitle}`);
    return { success: true, report: reportRecord };
  },

  submitCitationFeedback(feedback) {
    const record = {
      id: 'fb-' + Date.now(),
      question: feedback.question,
      citationId: feedback.citationId,
      sourceTitle: feedback.sourceTitle,
      issueType: feedback.issueType,
      explanation: feedback.explanation,
      user: this.currentUser?.name || 'User',
      submittedAt: new Date().toISOString()
    };
    this.citationFeedbackReports.unshift(record);
    this.addAuditLog('Citation Inaccuracy Reported', 'AI Evaluation', `Citation: ${feedback.citationId} (${feedback.issueType})`);
    return { success: true, record };
  },

  addAuditLog(action, module, record, status = 'Success') {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    this.activityLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: timestamp,
      user: this.currentUser?.name || 'System / Unauthenticated',
      role: this.currentUser?.role || 'Guest',
      action: action,
      module: module,
      record: record,
      ip: '192.168.1.45 (Firm Office VPN)',
      status: status
    });
  }
};

