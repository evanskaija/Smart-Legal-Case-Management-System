USE slcm_db;

CREATE TABLE IF NOT EXISTS billing_invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_no VARCHAR(64) NOT NULL,
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  case_number VARCHAR(100) NOT NULL,
  issue_date VARCHAR(32) NOT NULL,
  due_date VARCHAR(32) NOT NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 500000.00,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(15,2) NOT NULL DEFAULT 500000.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
  status VARCHAR(64) NOT NULL DEFAULT 'UNPAID',
  payment_method VARCHAR(64) DEFAULT 'Bank Transfer',
  demo_reference VARCHAR(64) DEFAULT 'DEMO-2026-4831',
  demo_submitted_at DATETIME NULL,
  demo_confirmed_at DATETIME NULL,
  demo_confirmed_by VARCHAR(255) NULL,
  is_demo_simulation TINYINT(1) NOT NULL DEFAULT 1,
  items_json TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO billing_invoices (id, invoice_no, client_id, client_name, case_number, issue_date, due_date, amount, tax, total, currency, status, payment_method, demo_reference, is_demo_simulation, items_json)
VALUES (
  'inv-demo-001',
  'INV-2026-0001',
  'cli-001',
  'Peter Thomas Bocco',
  'CASE-2025-003',
  '2026-09-01',
  '2026-10-01',
  500000.00,
  0.00,
  500000.00,
  'TZS',
  'UNPAID',
  'Bank Transfer',
  'DEMO-2026-4831',
  1,
  '[{"desc":"Legal Representation and Drafting Pleadings","hours":10,"rate":50000,"amount":500000}]'
) ON DUPLICATE KEY UPDATE invoice_no=invoice_no;

USE slcms_db;

CREATE TABLE IF NOT EXISTS billing_invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_no VARCHAR(64) NOT NULL,
  client_id VARCHAR(64) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  case_number VARCHAR(100) NOT NULL,
  issue_date VARCHAR(32) NOT NULL,
  due_date VARCHAR(32) NOT NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 500000.00,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(15,2) NOT NULL DEFAULT 500000.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
  status VARCHAR(64) NOT NULL DEFAULT 'UNPAID',
  payment_method VARCHAR(64) DEFAULT 'Bank Transfer',
  demo_reference VARCHAR(64) DEFAULT 'DEMO-2026-4831',
  demo_submitted_at DATETIME NULL,
  demo_confirmed_at DATETIME NULL,
  demo_confirmed_by VARCHAR(255) NULL,
  is_demo_simulation TINYINT(1) NOT NULL DEFAULT 1,
  items_json TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO billing_invoices (id, invoice_no, client_id, client_name, case_number, issue_date, due_date, amount, tax, total, currency, status, payment_method, demo_reference, is_demo_simulation, items_json)
VALUES (
  'inv-demo-001',
  'INV-2026-0001',
  'cli-001',
  'Peter Thomas Bocco',
  'CASE-2025-003',
  '2026-09-01',
  '2026-10-01',
  500000.00,
  0.00,
  500000.00,
  'TZS',
  'UNPAID',
  'Bank Transfer',
  'DEMO-2026-4831',
  1,
  '[{"desc":"Legal Representation and Drafting Pleadings","hours":10,"rate":50000,"amount":500000}]'
) ON DUPLICATE KEY UPDATE invoice_no=invoice_no;
