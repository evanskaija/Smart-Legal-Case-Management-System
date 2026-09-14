-- ============================================================================
-- SLCMS Database Schema — System Settings & Audit
-- ============================================================================

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
    status VARCHAR(30) NOT NULL, -- 'Not Created', 'In Progress', 'Successful', 'Failed'
    created_by VARCHAR(150),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Seed Data
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by) VALUES
('organization_name', 'SLCMS Law Firm', 'TEXT', 1),
('system_name', 'Smart Legal Case Management System', 'TEXT', 1),
('system_short_name', 'SLCMS', 'TEXT', 1),
('organization_logo', 'assets/SLCMS.png', 'TEXT', 1),
('official_email', 'admin@slcms.local', 'EMAIL', 1),
('phone_number', '+255700000001', 'PHONE', 1),
('office_address', 'Dar es Salaam, Tanzania', 'TEXT', 1),
('minimum_password_length', '10', 'NUMBER', 1),
('maximum_login_attempts', '5', 'NUMBER', 1),
('lock_duration_minutes', '15', 'NUMBER', 1),
('session_duration_minutes', '60', 'NUMBER', 1),
('maximum_upload_mb', '50', 'NUMBER', 1),
('ocr_enabled', 'true', 'BOOLEAN', 1),
('automatic_backup', 'WEEKLY', 'ENUM', 1),
('allowed_file_types', 'PDF,DOCX,JPG,PNG', 'TEXT', 1),
('case_number_format', 'CV/YYYY/####', 'TEXT', 1)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
