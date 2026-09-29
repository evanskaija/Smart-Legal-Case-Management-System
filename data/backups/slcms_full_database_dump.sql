-- ============================================================================
-- SLCMS FULL DATABASE BACKUP DUMP
-- Database: slcms_db (Compatible with MariaDB, MySQL 8+, H2)
-- Generated: 2026-09-23 19:15:31
-- ============================================================================
CREATE DATABASE IF NOT EXISTS slcms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE slcms_db;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- TABLE SCHEMAS
-- ----------------------------------------------------------------------------
-- ============================================================================
-- SLCMS Complete Production Database Schema â€” XAMPP MariaDB/MySQL (slcms_db)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    employee_id VARCHAR(50),
    username VARCHAR(100),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    role_title VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    account_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, TEMPORARILY_LOCKED, LOCKED, DEACTIVATED
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until BIGINT, -- Epoch ms
    admin_locked BOOLEAN NOT NULL DEFAULT FALSE,
    last_successful_login TIMESTAMP NULL,
    last_failed_login TIMESTAMP NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    department VARCHAR(100),
    bar_number VARCHAR(50),
    advocate_number VARCHAR(50),
    practising_cert_no VARCHAR(50),
    national_id_ref VARCHAR(50),
    identity_verification_status VARCHAR(50),
    invitation_id VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    avatar_img VARCHAR(500),
    first_login_required BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    client_number VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    client_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
    email VARCHAR(150),
    phone VARCHAR(50),
    national_id_ref VARCHAR(50),
    address TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    contact_person VARCHAR(150),
    notes TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_name (name)
);

CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(50) PRIMARY KEY,
    case_number VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    case_title VARCHAR(255),
    category VARCHAR(100),
    case_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    client_id VARCHAR(50),
    client_name VARCHAR(150),
    court VARCHAR(150),
    registry VARCHAR(150),
    lead_counsel_id VARCHAR(50),
    lead_counsel VARCHAR(150),
    judge_coram VARCHAR(150),
    next_hearing_date VARCHAR(50),
    filing_date VARCHAR(50),
    opposing_party VARCHAR(150),
    opposing_counsel VARCHAR(150),
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_case_num (case_number),
    INDEX idx_case_status (status),
    INDEX idx_case_client (client_id)
);

CREATE TABLE IF NOT EXISTS case_assignments (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    assigned_role VARCHAR(50),
    assigned_by VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asg_case (case_id),
    INDEX idx_asg_user (user_id)
);

CREATE TABLE IF NOT EXISTS case_assigned_users (
    case_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (case_id, user_id)
);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50),
    case_number VARCHAR(100),
    title VARCHAR(255),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    storage_path VARCHAR(500),
    sensitivity VARCHAR(50) DEFAULT 'CONFIDENTIAL',
    category VARCHAR(100),
    uploaded_by VARCHAR(50),
    uploaded_by_name VARCHAR(150),
    ocr_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doc_case (case_id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    case_id VARCHAR(50),
    case_number VARCHAR(100),
    case_title VARCHAR(255),
    assigned_to VARCHAR(50),
    assigned_to_name VARCHAR(150),
    assigned_to_avatar VARCHAR(50),
    supervisor_id VARCHAR(50),
    supervisor_name VARCHAR(150),
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'PENDING',
    due_at TIMESTAMP NULL,
    due_date_string VARCHAR(50),
    due_date VARCHAR(50),
    instructions TEXT,
    reminder_at TIMESTAMP NULL,
    is_statutory_deadline BOOLEAN DEFAULT FALSE,
    statutory_reference VARCHAR(150),
    filing_status VARCHAR(50),
    filing_date VARCHAR(50),
    filing_reference VARCHAR(150),
    review_feedback TEXT,
    is_administrative BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    created_by VARCHAR(50),
    created_by_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_task_case (case_id),
    INDEX idx_task_assigned (assigned_to),
    INDEX idx_task_status (status)
);

CREATE TABLE IF NOT EXISTS deadlines (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    case_id VARCHAR(50),
    case_number VARCHAR(100),
    case_title VARCHAR(255),
    type VARCHAR(50),
    deadline_at TIMESTAMP NULL,
    deadline_date_string VARCHAR(50),
    deadline_time VARCHAR(50),
    court VARCHAR(150),
    registry VARCHAR(150),
    responsible_lawyer_id VARCHAR(50),
    responsible_lawyer_name VARCHAR(150),
    source VARCHAR(100),
    statutory_reference VARCHAR(150),
    reminder_at TIMESTAMP NULL,
    supporting_document VARCHAR(255),
    change_reason VARCHAR(255),
    previous_deadline_at TIMESTAMP NULL,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_deadline_case (case_id),
    INDEX idx_deadline_lawyer (responsible_lawyer_id)
);

CREATE TABLE IF NOT EXISTS communications (
    id VARCHAR(50) PRIMARY KEY,
    message_id VARCHAR(100),
    case_id VARCHAR(50),
    case_number VARCHAR(100),
    case_title VARCHAR(255),
    client_id VARCHAR(50),
    client_name VARCHAR(150),
    message_type VARCHAR(100),
    channel VARCHAR(50) DEFAULT 'Email',
    sender VARCHAR(150),
    recipient VARCHAR(150),
    subject VARCHAR(255),
    message_body TEXT,
    language VARCHAR(50) DEFAULT 'English',
    status VARCHAR(50) DEFAULT 'SENT',
    prepared_by VARCHAR(150),
    approved_by VARCHAR(150),
    sent_by VARCHAR(150),
    sent_at TIMESTAMP NULL,
    gmail_message_id VARCHAR(150),
    provider_reference VARCHAR(150),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comm_case (case_id),
    INDEX idx_comm_client (client_id)
);

CREATE TABLE IF NOT EXISTS case_progress (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    notes TEXT,
    recorded_by VARCHAR(150),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_progress_case (case_id)
);

CREATE TABLE IF NOT EXISTS generated_documents (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50),
    case_number VARCHAR(100),
    document_type VARCHAR(100),
    title VARCHAR(255),
    file_path VARCHAR(500),
    file_format VARCHAR(50) DEFAULT 'PDF',
    generated_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(150),
    event_type VARCHAR(100) NOT NULL,
    result VARCHAR(200),
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    ip_address VARCHAR(50),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(50),
    INDEX idx_sec_events_user (user_id),
    INDEX idx_sec_events_type (event_type),
    INDEX idx_sec_events_time (event_time),
    INDEX idx_sec_events_resolved (resolved)
);

CREATE TABLE IF NOT EXISTS security_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    staff_id VARCHAR(50),
    full_name VARCHAR(150),
    role VARCHAR(50),
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'HIGH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(50),
    locked_reason VARCHAR(100),
    locked_by VARCHAR(50),
    client_ip VARCHAR(50),
    INDEX idx_sec_alerts_resolved (resolved)
);

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(30) NOT NULL,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_setting_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id VARCHAR(50),
    admin_name VARCHAR(150),
    setting_key VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    action_status VARCHAR(30) DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_backups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    size_bytes BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(150),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES
('organization_name', 'SLCMS Law Firm', 'TEXT', 1),
('system_name', 'Smart Legal Case Management System', 'TEXT', 1),
('system_short_name', 'SLCMS', 'TEXT', 1),
('organization_logo', 'assets/SLCMS.png', 'TEXT', 1),
('official_email', 'admin@slcms.local', 'EMAIL', 1),
('phone_number', '+255700000001', 'PHONE', 1),
('office_address', 'Dar es Salaam, Tanzania', 'TEXT', 1),
('minimum_password_length', '10', 'NUMBER', 1),
('maximum_login_attempts', '3', 'NUMBER', 1),
('lock_duration_minutes', '2', 'NUMBER', 1),
('session_duration_minutes', '60', 'NUMBER', 1),
('maximum_upload_mb', '50', 'NUMBER', 1),
('ocr_enabled', 'true', 'BOOLEAN', 1),
('automatic_backup', 'WEEKLY', 'ENUM', 1),
('allowed_file_types', 'PDF,DOCX,JPG,PNG', 'TEXT', 1),
('case_number_format', 'CV/YYYY/####', 'TEXT', 1)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);


-- ----------------------------------------------------------------------------
-- DATA INSERTS
-- ----------------------------------------------------------------------------
-- Table: users
INSERT INTO users (id, staff_id, employee_id, username, name, email, phone, password_hash, role, role_title, department, account_status, failed_attempts, locked_until, admin_locked) VALUES ('usr-001', 'ADM-0001', 'ADM-0001', 'slcms.admin', 'SLCMS System Administrator', 'admin@slcms.local', '+255 700 000 001', '.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m', 'Administrator', 'System Administrator', 'System Governance & Administration', 'ACTIVE', 0, NULL, 0) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO users (id, staff_id, employee_id, username, name, email, phone, password_hash, role, role_title, department, account_status, failed_attempts, locked_until, admin_locked) VALUES ('usr-002', 'LAW-0021', 'LAW-0021', 'asha.mrema', 'Adv. Asha Mrema', 'asha.mrema@slcms.local', '+255 754 112 233', '.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m', 'Senior Lawyer', 'Senior Advocate', 'Litigation & Dispute Resolution', 'ACTIVE', 0, NULL, 0) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO users (id, staff_id, employee_id, username, name, email, phone, password_hash, role, role_title, department, account_status, failed_attempts, locked_until, admin_locked) VALUES ('usr-003', 'LAW-0035', 'LAW-0035', 'baraka.juma', 'Adv. Baraka Juma', 'baraka.juma@slcms.local', '+255 713 445 566', '.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m', 'Lawyer', 'Advocate', 'Corporate & Commercial Law', 'ACTIVE', 0, NULL, 0) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO users (id, staff_id, employee_id, username, name, email, phone, password_hash, role, role_title, department, account_status, failed_attempts, locked_until, admin_locked) VALUES ('usr-004', 'CLK-0008', 'CLK-0008', 'emmanuel.kilonzo', 'Emmanuel Kilonzo', 'emmanuel.kilonzo@slcms.local', '+255 784 778 899', '.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m', 'Legal Clerk', 'Court Filing Clerk', 'Court Registry & Documentation', 'ACTIVE', 0, NULL, 0) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO users (id, staff_id, employee_id, username, name, email, phone, password_hash, role, role_title, department, account_status, failed_attempts, locked_until, admin_locked) VALUES ('usr-005', 'LAW-0099', 'LAW-0099', 'daudi.mussa', 'Adv. Daudi Mussa', 'daudi.mussa@slcms.local', '+255 765 999 888', '.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m', 'Lawyer', 'Advocate', 'Litigation', 'LOCKED', 0, NULL, 1) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO users (id, staff_id, employee_id, username, name, email, phone, password_hash, role, role_title, department, account_status, failed_attempts, locked_until, admin_locked) VALUES ('usr-006', 'LAW-0081', 'LAW-0081', 'jmoses', 'Jack moses', 'jmoses@slcms-law.co.tz', '+255 754 000 111', '.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m', 'Lawyer', 'Litigation Associate', 'Commercial Litigation', 'ACTIVE', 0, NULL, 0) ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO users (id, staff_id, employee_id, username, name, email, phone, password_hash, role, role_title, department, account_status, failed_attempts, locked_until, admin_locked) VALUES ('usr-007', 'EMP-1017', 'EMP-1017', 'jmoss', 'Joseph Moss', 'jmoss@slcms-law.co.tz', '+255 754 000 786', '.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m', 'Legal Clerk', 'Court Registry Clerk', 'Court Registry & Documentation', 'TEMPORARILY_LOCKED', 3, 253402300799000, 0) ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Table: system_settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('case_statuses', 'Active,Pending,Closed,Archived', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('case_number_format', 'CV/YYYY/####', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('system_short_name', 'SLCMS', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('system_name', 'Smart Legal Case Management System', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('allowed_file_types', 'PDF,DOCX,JPG,PNG', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('ocr_enabled', 'true', 'BOOLEAN', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('organization_name', 'SLCMS Law Firm', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('organization_logo', 'assets/SLCMS.png', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('case_categories', 'Civil,Criminal,Land,Matrimonial,Probate,Commercial,Other', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('lock_duration_minutes', '15', 'NUMBER', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('automatic_backup', 'WEEKLY', 'ENUM', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('office_address', 'Dar es Salaam, Tanzania', 'TEXT', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('maximum_upload_mb', '50', 'NUMBER', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('official_email', 'admin@slcms.local', 'EMAIL', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('phone_number', '+255700000001', 'PHONE', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('session_duration_minutes', '60', 'NUMBER', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('maximum_login_attempts', '5', 'NUMBER', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES ('minimum_password_length', '10', 'NUMBER', 1) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Table: tasks
INSERT INTO tasks (id, title, case_id, case_number, case_title, assigned_to_name, priority, status, due_date_string, instructions) VALUES ('tsk-1790079146327-eb6b', 'Draft Statement of Defence (AMENDED) - Suit No. 142', 'case-101', 'CV/2026/0142', 'Commercial Bank vs Kivukoni Traders', 'Adv. Asha Mrema', 'Urgent', 'todo', '2026-10-15', 'Modified by Administrator with statutory limitation extension.') ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Table: deadlines
INSERT INTO deadlines (id, title, case_id, case_number, case_title, type, deadline_date_string, deadline_time, court, responsible_lawyer_name, source, statutory_reference) VALUES ('dln-1790079146457-14d2', 'Hearing of Chamber Summons for Injunction (RESCHEDULED)', 'case-101', 'CV/2026/0142', 'Commercial Bank vs Kivukoni Traders', 'Hearing', '2026-10-06', '09:00', 'High Court Commercial Division, Dar es Salaam - Courtroom 3', 'Adv. Asha Mrema', 'Court Order', 'Order XXXIX Rule 1 CPC') ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Table: communications
INSERT INTO communications (id, case_id, case_number, case_title, client_name, message_type, channel, recipient, subject, message_body, language, status, prepared_by, approved_by, sent_by, provider_reference) VALUES ('msg-1790079160943-28e3', NULL, 'CV/2026/0142', 'Commercial Bank vs Kivukoni Traders', 'Adv. Asha Mrema', 'Docket Alert', 'Email', 'asha.mrema@slcms-law.com', '[SLCMS Docket Alert] Action Required: Draft Statement of Defence (CV/2026/0142)', '================================================================
[SLCMS DOCKET NOTIFICATION] STATUTORY DEADLINE NOTICE
Firm: Serengeti Legal Case Management System
Security: Confidential Attorney-Client Communication
Reference: DKT-TZ-982144
================================================================

1. MATTER CITATION:
   �?� Case Ref: CV/2026/0142 - Commercial Bank vs Kivukoni Traders
   �?� Forum / Registry: High Court Commercial Division, Dar es Salaam

2. MANDATORY ACTION ITEM:
   �?� Obligation: Draft Statement of Defence
   �?� Statutory Due Date: 2026-10-13 at 09:00 AM EAT (In 21 days)
   �?� Authority / Court Rule: Order VIII Rule 1, Civil Procedure Code Cap 33
   �?� Urgency Classification: HIGH: Statutory Limitation Window

3. RESPONSIBLE PRACTITIONER:
   �?� Assigned Personnel: Adv. Asha Mrema (Senior Counsel)
   �?� Directives: Ensure pleadings, evidence bundles, or written
     submissions are vetted and served strictly within statutory
     time limits. Non-compliance risks court strike-out.
================================================================
Dispatched via SLCMS Law Firm Docket Engine', 'English', 'Sent', 'Administrator', 'Administrator', 'Administrator', 'GMAIL-SMTP-1790079160941') ON DUPLICATE KEY UPDATE subject=VALUES(subject);
INSERT INTO communications (id, case_id, case_number, case_title, client_name, message_type, channel, recipient, subject, message_body, language, status, prepared_by, approved_by, sent_by, provider_reference) VALUES ('msg-2026-0914-001', 'case-001', 'CV/2026/0042', 'Kilombero Sugar Co. Ltd v Mara Logistics Ltd', 'Kilombero Sugar Co. Ltd', 'Hearing Reminder', 'Email', 'legal@kilomberosugar.co.tz', 'Hearing Reminder — Kilombero Sugar Co. Ltd v Mara Logistics Ltd, CV/2026/0042', 'Dear Kilombero Sugar Co. Ltd,

This is a reminder concerning Kilombero Sugar Co. Ltd v Mara Logistics Ltd, Civil Case No. CV/2026/0042.

The matter is scheduled for hearing on 28 September 2026 at 9:00 AM at the High Court of Tanzania (Commercial Division), Dar es Salaam. Please arrive at least 30 minutes before the scheduled time and bring your identification and any documents previously requested by your lawyer.

If you need clarification, please contact your assigned lawyer before the hearing date.

Kind regards,
SLCMS Law Firm', 'English', 'Sent', 'Adv. Asha Mrema', 'Senior Advocate E. M. Kaija', 'Adv. Asha Mrema', 'GMAIL-SMTP-MSG-8849201') ON DUPLICATE KEY UPDATE subject=VALUES(subject);
INSERT INTO communications (id, case_id, case_number, case_title, client_name, message_type, channel, recipient, subject, message_body, language, status, prepared_by, approved_by, sent_by, provider_reference) VALUES ('msg-2026-0915-002', 'case-002', 'PC Civil Appeal No. 69 of 2018', 'Abdallah Salum Muwinge v Halima Ismail', 'Halima Ismail', 'Hearing Reminder', 'Email', 'halima@example.com', 'Hearing Reminder — PC Civil Appeal No. 69 of 2018', 'Dear Halima Ismail,

This is a reminder concerning Abdallah Salum Muwinge v Halima Ismail, PC Civil Appeal No. 69 of 2018.

The matter is scheduled for hearing on 25 September 2026 at 9:00 AM at the High Court of Tanzania, Dar es Salaam District Registry. Please arrive at least 30 minutes before the scheduled time and bring your identification and any documents previously requested by your lawyer.

If you need clarification, please contact your assigned lawyer before the hearing date.

Kind regards,
SLCMS Law Firm', 'English', 'Sent', 'Adv. Baraka Juma', 'Senior Advocate E. M. Kaija', 'Adv. Baraka Juma', 'GMAIL-SMTP-MSG-9120481') ON DUPLICATE KEY UPDATE subject=VALUES(subject);

-- Table: security_alerts
INSERT INTO security_alerts (alert_id, user_id, staff_id, full_name, role, alert_type, title, description, severity, resolved, client_ip) VALUES ('alt-001', 'usr-005', 'LAW-0099', 'Adv. Daudi Mussa', 'Lawyer', 'ACCOUNT_LOCKED', 'Administrative Security Lock', 'Account placed on administrative security hold pending compliance review.', 'HIGH', 0, '197.250.48.12') ON DUPLICATE KEY UPDATE title=VALUES(title);
INSERT INTO security_alerts (alert_id, user_id, staff_id, full_name, role, alert_type, title, description, severity, resolved, client_ip) VALUES ('alt-002', 'usr-007', 'EMP-1017', 'Joseph Moss', 'Legal Clerk', 'TEMPORARY_LOCK', 'Temporary Login Lock', 'Three unsuccessful login attempts', 'HIGH', 0, '127.0.0.1') ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Table: security_events
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-1790179478927-htuqg', 'usr-001', 'Login Succeeded', 'Staff member SLCMS System Administrator (ADM-0001) authenticated via secure TLS 1.3 session', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-135812-a1', 'usr-002', 'Pleading Filed', 'Written Statement of Defence filed in High Court Commercial Div (TZHC/COMM/2026/089)', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-133045-b2', 'usr-001', 'BACKUP_CREATED', 'System database snapshot created & AES-256 encrypted (24.8 KB)', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-124500-c3', 'usr-004', 'Document Uploaded', 'Expert Witness Forensic Accounting Report (v2.1) uploaded with SHA-256 seal', '192.168.1.112 (Registry Workstation)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-121020-d4', 'usr-003', 'Court Attendance Recorded', 'Pre-trial scheduling conference before Justice Mwambegele (Commercial Case No. 102)', '192.168.1.108 (High Court Mobile Terminal)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-113510-e5', 'unknown', 'Login Failed', 'Unauthorized login attempt from external IP (197.250.84.119); blocked by sentinel', '197.250.84.119 (External ISP)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-110500-f6', 'usr-002', 'Client Advisory Dispatched', 'Formal litigation risk assessment dispatched to Serengeti Breweries Legal Directorate', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-102015-g7', 'usr-001', 'Duties Separation Review', 'Quarterly RBAC & ethical Chinese wall separation review verified for active litigation matters', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-094000-h8', 'usr-006', 'Pleading Submitted', 'Chamber Summons and Supporting Affidavit for Injunction submitted (Matter TZHC/COMM/2026/089)', '192.168.1.115 (Associate Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-091530-i9', 'usr-003', 'Login Succeeded', 'Two-factor authentication verified via authenticator token; session TLS 1.3', '192.168.1.108 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-083000-j1', 'usr-002', 'Login Succeeded', 'Managing partner session initialized; cryptographic token valid', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260922-080512-k2', 'usr-007', 'Login Succeeded', 'Registry desktop terminal logged in successfully', '192.168.1.110 (Court Registry Desk)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-171500-l3', 'usr-002', 'Formal Case Closure', 'Final Settlement Decree executed for Vanguard vs. Apex Holdings; matter archived', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-163020-m4', 'usr-003', 'Invoice Approved', 'Invoice INV-2026-089 approved for CRDB Bank PLC ($12,450.00 corporate retainer)', '192.168.1.108 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-154010-n5', 'usr-004', 'Cause List Synchronized', 'High Court of Tanzania Main Registry weekly cause list synchronized into calendar', '192.168.1.112 (Registry Workstation)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-145530-o6', 'usr-005', 'Account Manually Locked', 'Account manually locked by administrator pending annual practising certificate renewal', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-145000-p7', 'usr-001', 'Temporary Password Issued', 'One-time security credentials generated for Adv. Daudi Mussa (TLS Advocate Roll LAW-0099)', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-132040-q8', 'usr-007', 'OCR Text Extracted', 'Commercial Contract Annexure A-D processed with Tesseract OCR; text integrity verified', '192.168.1.110 (Court Registry Desk)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-114510-r9', 'usr-002', 'Case Assigned', 'Matter Catherine Edwin Mbele v Godfrey Abednego Mushi assigned to Adv. Baraka Juma as Lead', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-103000-s1', 'usr-003', 'Client Registered', 'Serengeti Breweries Ltd (Corporate Advisory) registered in client database by Adv. Baraka Juma', '192.168.1.108 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-091520-t2', 'usr-001', 'Account Unlocked', 'Account unlocked by administrator after manual identity verification', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-085010-u3', 'usr-007', 'Account Temporarily Locked', 'Account temporarily locked for 2 minutes after 3 failed login attempts (incorrect security PIN)', '192.168.1.110 (Court Registry Desk)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-084950-v4', 'usr-007', 'Login Failed', 'Unsuccessful login attempt (3 of 3) — PIN verification error', '192.168.1.110 (Court Registry Desk)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-084920-w5', 'usr-007', 'Login Failed', 'Unsuccessful login attempt (2 of 3) — PIN verification error', '192.168.1.110 (Court Registry Desk)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260921-084845-x6', 'usr-007', 'Login Failed', 'Unsuccessful login attempt (1 of 3) — PIN verification error', '192.168.1.110 (Court Registry Desk)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260920-164000-y7', 'usr-001', 'BACKUP_CREATED', 'Weekly encrypted archive generated and replicated to off-site vault (24.1 KB)', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260920-151030-z8', 'usr-004', 'SMS Notification Dispatched', 'Pre-Trial hearing SMS reminder dispatched to Dr. Clara Thorne for Wednesday 9:00 AM', '192.168.1.112 (Registry Workstation)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260920-142500-a9', 'usr-002', 'Digital Signature Applied', 'Advocate digital seal applied to Petition of Appeal in Commercial Dispute TZHC 4102/2026', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260920-115015-b1', 'usr-003', 'Case Status Transition', 'Matter status transitioned from Pleadings Closed to Pre-Trial Conference', '192.168.1.108 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260920-101000-c2', 'usr-001', 'Configuration Updated', 'Gmail SMTP TLS relay configuration verified and test handshake passed', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260919-163540-d3', 'usr-006', 'Matter Registered', 'Commercial dispute registered: Kilimanjaro Agro-Industries Ltd vs. Coastal Hauliers & Logistics Ltd', '192.168.1.115 (Associate Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260919-142010-e4', 'usr-004', 'Court Appearance Logged', 'High Court Land Division preliminary mention before Deputy Registrar recorded', '192.168.1.112 (Registry Workstation)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260919-110500-f5', 'usr-002', 'Fee Retainer Logged', 'Retainer deposit confirmed for AuraBio Patent Infringement matter ($8,500.00)', '192.168.1.104 (Dar es Salaam Chambers)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260919-094020-g6', 'unknown', 'Login Failed', 'Unknown username ''root'' attempted authentication via public web interface', '41.59.88.22 (Tanzania Telecom)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-20260919-083000-h7', 'usr-001', 'SOC-2 Ledger Verification', 'Tamper-evident SOC-2 cryptographic chain verified; 0 discrepancies found', '127.0.0.1 (Local Console)', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);
INSERT INTO security_events (id, user_id, event_type, description, ip_address, resolved) VALUES ('evt-1790079160976-42c3d', 'usr-admin', 'Client Communication', 'Email sent to asha.mrema@slcms-law.com regarding CV/2026/0142 ([SLCMS Docket Alert] Action Required: Draft Statement of Defence (CV/2026/0142))', '127.0.0.1', 0) ON DUPLICATE KEY UPDATE event_type=VALUES(event_type);

SET FOREIGN_KEY_CHECKS = 1;
-- End of dump
