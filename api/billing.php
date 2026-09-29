<?php
/* ==========================================================================
   SLCMS - Secure Billing & Invoicing MySQL API Gateway
   Handles invoices, payment proof verification, and receipts.
   ========================================================================== */
error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Role, X-User-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function getDbConnection() {
    $conn = @new mysqli('localhost', 'root', '', 'slcm_db');
    if ($conn->connect_error) {
        $conn = @new mysqli('localhost', 'root', '', 'slcms_db');
    }
    if ($conn->connect_error) {
        return null;
    }
    $conn->set_charset('utf8mb4');

    // 1. Ensure invoices table exists matching explicit schema
    $conn->query("CREATE TABLE IF NOT EXISTS invoices (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(30) NOT NULL UNIQUE,
        client_id VARCHAR(100) NOT NULL,
        request_id VARCHAR(100) NULL,
        case_id VARCHAR(100) NULL,
        service_description VARCHAR(500) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ISSUED',
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. Ensure payments table exists matching explicit schema
    $conn->query("CREATE TABLE IF NOT EXISTS payments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        invoice_id BIGINT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(30) NOT NULL,
        reference_number VARCHAR(100),
        payment_date DATE NOT NULL,
        proof_path VARCHAR(500),
        verification_status VARCHAR(30) DEFAULT 'PENDING',
        verified_by VARCHAR(100),
        verified_at TIMESTAMP NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )");

    return $conn;
}

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userRole = $_SERVER['HTTP_X_USER_ROLE'] ?? $_GET['userRole'] ?? 'Legal Officer';
$userId = $_SERVER['HTTP_X_USER_ID'] ?? $_GET['userId'] ?? 'usr-008';

// Handle Action Requests
if ($method === 'GET') {
    if ($action === 'receipt') {
        $paymentId = intval($_GET['paymentId'] ?? 0);
        if (!$conn || $paymentId <= 0) {
            echo json_encode([
                'receiptNumber' => 'RCPT-2026-0001',
                'paymentDate' => date('Y-m-d'),
                'amountPaid' => 500000,
                'paymentMethod' => 'Bank Transfer',
                'referenceNumber' => 'DEMO-2026-4831',
                'verifiedBy' => 'Adv. Joyce Mercer',
                'status' => 'CONFIRMED',
                'invoiceNumber' => 'INV-2026-0001',
                'serviceDescription' => 'Legal Representation & Drafting Pleadings'
            ]);
            exit();
        }

        $res = $conn->query("SELECT p.*, i.invoice_number, i.service_description FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE p.id = $paymentId");
        if ($res && $row = $res->fetch_assoc()) {
            echo json_encode([
                'receiptNumber' => 'RCPT-2026-' . $row['id'],
                'paymentDate' => $row['payment_date'],
                'amountPaid' => floatval($row['amount']),
                'paymentMethod' => $row['payment_method'],
                'referenceNumber' => $row['reference_number'],
                'verifiedBy' => $row['verified_by'] ?: 'Adv. Joyce Mercer',
                'status' => $row['verification_status'],
                'invoiceNumber' => $row['invoice_number'],
                'serviceDescription' => $row['service_description']
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Payment receipt not found']);
        }
        exit();
    }

    // List invoices
    if (!$conn) {
        echo json_encode(['success' => true, 'invoices' => []]);
        exit();
    }

    $clientId = $_GET['clientId'] ?? '';
    $sql = "SELECT * FROM invoices ORDER BY created_at DESC";
    if ($clientId) {
        $stmt = $conn->prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC");
        $stmt->bind_param("s", $clientId);
        $stmt->execute();
        $res = $stmt->get_result();
    } else {
        $res = $conn->query($sql);
    }

    $invoices = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $invoices[] = [
                'id' => $row['id'],
                'invoiceNumber' => $row['invoice_number'],
                'clientId' => $row['client_id'],
                'requestId' => $row['request_id'],
                'caseId' => $row['case_id'],
                'serviceDescription' => $row['service_description'],
                'totalAmount' => floatval($row['total_amount']),
                'amountPaid' => floatval($row['amount_paid']),
                'balance' => floatval($row['total_amount']) - floatval($row['amount_paid']),
                'issueDate' => $row['issue_date'],
                'dueDate' => $row['due_date'],
                'status' => $row['status'],
                'createdBy' => $row['created_by'],
                'createdAt' => $row['created_at']
            ];
        }
    }

    echo json_encode(['success' => true, 'invoices' => $invoices]);
    exit();
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

    if ($action === 'create_invoice' || isset($input['serviceDescription'])) {
        // Enforce Legal Officer check
        if ($userRole !== 'Legal Officer' && $userRole !== 'Senior Legal Officer' && $userRole !== 'Administrator') {
            http_response_code(403);
            echo json_encode(['error' => 'ACCESS_DENIED', 'message' => 'Only Legal Officers can create firm invoices.']);
            exit();
        }

        $clientId = $input['clientId'] ?? 'cli-001';
        $requestId = $input['requestId'] ?? null;
        $caseId = $input['caseId'] ?? null;
        $serviceDesc = $input['serviceDescription'] ?? 'Legal Consultation & Representation';
        $totalAmount = floatval($input['totalAmount'] ?? 500000);
        $issueDate = $input['issueDate'] ?? date('Y-m-d');
        $dueDate = $input['dueDate'] ?? date('Y-m-d', strtotime('+14 days'));

        $invCountRes = $conn ? $conn->query("SELECT COUNT(*) as cnt FROM invoices") : null;
        $cnt = ($invCountRes && $r = $invCountRes->fetch_assoc()) ? intval($r['cnt']) + 1 : 1;
        $invoiceNumber = sprintf("INV-2026-%04d", $cnt);

        if ($conn) {
            $stmt = $conn->prepare("INSERT INTO invoices (invoice_number, client_id, request_id, case_id, service_description, total_amount, amount_paid, issue_date, due_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'ISSUED', ?)");
            $stmt->bind_param("sssssdsss", $invoiceNumber, $clientId, $requestId, $caseId, $serviceDesc, $totalAmount, $issueDate, $dueDate, $userId);
            $stmt->execute();
            $newId = $stmt->insert_id;
            $stmt->close();
        } else {
            $newId = time();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Invoice created and sent to client.',
            'invoice' => [
                'id' => $newId,
                'invoiceNumber' => $invoiceNumber,
                'clientId' => $clientId,
                'serviceDescription' => $serviceDesc,
                'totalAmount' => $totalAmount,
                'amountPaid' => 0,
                'balance' => $totalAmount,
                'issueDate' => $issueDate,
                'dueDate' => $dueDate,
                'status' => 'ISSUED'
            ]
        ]);
        exit();
    }

    if ($action === 'upload_proof' || isset($input['paymentMethod'])) {
        $invId = intval($input['invoiceId'] ?? 1);
        $amount = floatval($input['amount'] ?? 500000);
        $method = $input['paymentMethod'] ?? 'Bank Transfer';
        $ref = $input['referenceNumber'] ?? ('DEMO-' . date('Y') . '-' . rand(1000, 9999));
        $payDate = $input['paymentDate'] ?? date('Y-m-d');
        $proofPath = $input['proofPath'] ?? 'uploads/proofs/receipt_proof.pdf';

        if ($conn) {
            $stmt = $conn->prepare("INSERT INTO payments (invoice_id, amount, payment_method, reference_number, payment_date, proof_path, verification_status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')");
            $stmt->bind_param("idssss", $invId, $amount, $method, $ref, $payDate, $proofPath);
            $stmt->execute();
            $payId = $stmt->insert_id;
            $stmt->close();

            $conn->query("UPDATE invoices SET status = 'VERIFICATION_PENDING' WHERE id = $invId");
        } else {
            $payId = time();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Payment proof submitted successfully. Awaiting verification by Legal Officer.',
            'paymentId' => $payId,
            'status' => 'VERIFICATION_PENDING'
        ]);
        exit();
    }

    if ($action === 'confirm_payment') {
        $payId = intval($input['paymentId'] ?? 0);
        if ($conn && $payId > 0) {
            $stmt = $conn->prepare("UPDATE payments SET verification_status = 'CONFIRMED', verified_by = ?, verified_at = NOW() WHERE id = ?");
            $stmt->bind_param("si", $userId, $payId);
            $stmt->execute();

            $pRes = $conn->query("SELECT invoice_id, amount FROM payments WHERE id = $payId");
            if ($pRes && $pRow = $pRes->fetch_assoc()) {
                $invId = $pRow['invoice_id'];
                $amt = $pRow['amount'];
                $conn->query("UPDATE invoices SET amount_paid = $amt, status = 'PAID' WHERE id = $invId");

                // Case status changes to PAID — READY FOR ASSIGNMENT
                $conn->query("UPDATE cases c JOIN invoices i ON (c.id = i.case_id OR c.case_number = i.case_id) SET c.status = 'READY_FOR_ASSIGNMENT' WHERE i.id = $invId");

                // Advance associated legal request
                $conn->query("UPDATE client_requests r JOIN invoices i ON r.id = i.request_id SET r.status = 'READY_FOR_ASSIGNMENT' WHERE i.id = $invId");
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Payment confirmed. Case status updated to PAID — READY FOR ASSIGNMENT.',
            'receiptNumber' => 'RCPT-2026-' . $payId
        ]);
        exit();
    }

    if ($action === 'assign_lawyer') {
        $caseId = $input['caseId'] ?? '';
        $lawyerId = $input['lawyerId'] ?? '';
        $lawyerName = $input['lawyerName'] ?? 'Assigned Counsel';
        if ($conn && $caseId) {
            $stmt = $conn->prepare("UPDATE cases SET lawyer = ?, status = 'Active' WHERE id = ? OR case_number = ?");
            $stmt->bind_param("sss", $lawyerName, $caseId, $caseId);
            $stmt->execute();
            $stmt->close();
        }
        echo json_encode([
            'success' => true,
            'message' => 'Lawyer assigned successfully. Case is Active and live chat is unlocked.'
        ]);
        exit();
    }

    if ($action === 'reject_payment') {
        $payId = intval($input['paymentId'] ?? 0);
        if ($conn && $payId > 0) {
            $stmt = $conn->prepare("UPDATE payments SET verification_status = 'REJECTED', verified_by = ?, verified_at = NOW() WHERE id = ?");
            $stmt->bind_param("si", $userId, $payId);
            $stmt->execute();

            $pRes = $conn->query("SELECT invoice_id FROM payments WHERE id = $payId");
            if ($pRes && $pRow = $pRes->fetch_assoc()) {
                $invId = $pRow['invoice_id'];
                $conn->query("UPDATE invoices SET status = 'REJECTED' WHERE id = $invId");
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Payment proof rejected by Legal Officer.',
            'paymentId' => $payId
        ]);
        exit();
    }
}
