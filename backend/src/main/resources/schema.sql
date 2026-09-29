-- ============================================================================
-- SLCMS Complete Production Database Schema — XAMPP MariaDB/MySQL (slcms_db)
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
    user_id VARCHAR(50),
    client_number VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    client_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
    email VARCHAR(150),
    phone VARCHAR(50),
    national_id_ref VARCHAR(50),
    address TEXT,
    verification_status VARCHAR(50) DEFAULT 'VERIFIED',
    verification_code VARCHAR(10),
    code_expires_at TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    contact_person VARCHAR(150),
    notes TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_name (name),
    INDEX idx_client_user (user_id)
);

CREATE TABLE IF NOT EXISTS legal_requests (
    id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    client_name VARCHAR(150),
    client_email VARCHAR(150),
    client_phone VARCHAR(50),
    issue_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    opposing_party VARCHAR(150),
    preferred_contact_method VARCHAR(50) DEFAULT 'Email',
    supporting_documents TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    officer_notes TEXT,
    case_id VARCHAR(50),
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_req_client (client_id),
    INDEX idx_req_status (status)
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
    request_id VARCHAR(50),
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
    INDEX idx_case_client (client_id),
    INDEX idx_case_request (request_id)
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

CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client_id VARCHAR(100) NOT NULL,
    case_id VARCHAR(100),
    request_id VARCHAR(100),
    service_description VARCHAR(500) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT', -- DRAFT, SENT, PROOF_SUBMITTED, PAID, REJECTED, CANCELLED
    payment_instructions TEXT,
    rejection_reason TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inv_client (client_id),
    INDEX idx_inv_case (case_id),
    INDEX idx_inv_status (status)
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    reference_number VARCHAR(100),
    payment_date DATE NOT NULL,
    proof_document VARCHAR(500),
    proof_path VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    verification_status VARCHAR(30) DEFAULT 'PENDING',
    rejection_reason TEXT,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP NULL,
    INDEX idx_pay_inv (invoice_id),
    INDEX idx_pay_status (status)
);

CREATE TABLE IF NOT EXISTS case_conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(100) NOT NULL,
    client_id VARCHAR(100) NOT NULL,
    lawyer_id VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (case_id),
    INDEX idx_conv_client (client_id),
    INDEX idx_conv_lawyer (lawyer_id)
);

CREATE TABLE IF NOT EXISTS case_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id VARCHAR(100) NOT NULL,
    sender_name VARCHAR(150),
    sender_role VARCHAR(50),
    message_body TEXT NOT NULL,
    attachment_path VARCHAR(500),
    attachment_name VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    INDEX idx_msg_conv (conversation_id),
    INDEX idx_msg_sender (sender_id)
);

CREATE TABLE IF NOT EXISTS system_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100),
    recipient_role VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'INFO',
    related_case_id VARCHAR(100),
    related_invoice_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_role (recipient_role)
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
