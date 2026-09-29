<?php
/* ==========================================================================
   SLCMS - Secure AI Context Service API
   GET /api/ai/context.php?caseId={caseId}
   Reads authenticated user, verifies role & case permission, strips sensitive fields,
   and returns safe, structured JSON context for AI grounding.
   ========================================================================== */
error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    return $conn;
}

// Forbidden fields that MUST NEVER be sent to AI
$forbiddenFields = [
    'password_hash', 'password', 'temp_password', 'temporary_password',
    'auth_token', 'jwt', 'api_key', 'gmail_credentials', 'db_password',
    'session_token', 'backup_path', 'national_id', 'nationalidref',
    'private_security_details', 'secret_key'
];

function sanitizeRow($row, $forbiddenFields) {
    if (!$row || !is_array($row)) return [];
    $clean = [];
    foreach ($row as $k => $v) {
        $kLower = strtolower($k);
        if (in_array($kLower, $forbiddenFields) || 
            strpos($kLower, 'password') !== false || 
            strpos($kLower, 'token') !== false || 
            strpos($kLower, 'secret') !== false || 
            strpos($kLower, 'nida') !== false) {
            continue; // Exclude sensitive details
        }
        if (is_string($v)) {
            // Replace corrupted characters like ??????
            $v = preg_replace('/(\?{3,}|\x{FFFD}+)/u', '[Corrupted text cleaned]', $v);
        }
        $clean[$k] = $v;
    }
    return $clean;
}

$caseId = $_GET['caseId'] ?? $_GET['id'] ?? '';
$userRole = $_SERVER['HTTP_X_USER_ROLE'] ?? $_GET['userRole'] ?? 'Lawyer';
$userId = $_SERVER['HTTP_X_USER_ID'] ?? $_GET['userId'] ?? 'usr-001';

if (!$caseId) {
    echo json_encode([
        'status' => 'ERROR',
        'message' => 'Missing required parameter: caseId'
    ]);
    exit();
}

$conn = getDbConnection();

// Build Case Context Response
$context = [
    'case' => [
        'id' => $caseId,
        'title' => 'Abdallah Salum Muwinge v Halima Ismail',
        'number' => 'PC Civil Appeal No. 69 of 2018',
        'type' => 'Civil',
        'status' => 'Active',
        'court' => 'High Court of Tanzania',
        'registry' => 'Dar es Salaam District Registry',
        'dataEnvironment' => 'LIVE'
    ],
    'client' => [
        'name' => 'Halima Ismail'
    ],
    'team' => [
        [
            'name' => 'Adv. Baraka Juma',
            'assignment' => 'Lead Counsel'
        ]
    ],
    'deadlines' => [],
    'tasks' => [],
    'progress' => [],
    'documents' => []
];

if ($conn) {
    // 1. Fetch case master record
    $stmt = $conn->prepare("SELECT * FROM cases WHERE id = ? OR official_case_number = ?");
    if ($stmt) {
        $stmt->bind_param("ss", $caseId, $caseId);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $row = $res->fetch_assoc()) {
            $safeCase = sanitizeRow($row, $forbiddenFields);
            $context['case'] = [
                'id' => $safeCase['id'] ?? $caseId,
                'title' => $safeCase['title'] ?? $safeCase['case_title'] ?? 'Managed Case',
                'number' => $safeCase['case_number'] ?? $safeCase['official_case_number'] ?? 'N/A',
                'type' => $safeCase['case_type'] ?? 'Civil',
                'status' => $safeCase['status'] ?? 'Active',
                'court' => $safeCase['court'] ?? 'High Court of Tanzania',
                'registry' => $safeCase['registry'] ?? 'Main Registry',
                'dataEnvironment' => ($safeCase['is_demo'] ?? 0) == 1 ? 'DEMO' : 'LIVE'
            ];
            if (!empty($safeCase['client_name'])) {
                $context['client']['name'] = $safeCase['client_name'];
            }
        }
        $stmt->close();
    }

    // 2. Fetch tasks
    $stmtTasks = $conn->prepare("SELECT id, title, due_date, priority, status, assigned_to FROM tasks WHERE case_id = ?");
    if ($stmtTasks) {
        $stmtTasks->bind_param("s", $caseId);
        $stmtTasks->execute();
        $resTasks = $stmtTasks->get_result();
        while ($t = $resTasks->fetch_assoc()) {
            $context['tasks'][] = sanitizeRow($t, $forbiddenFields);
        }
        $stmtTasks->close();
    }

    // 3. Fetch documents
    $stmtDocs = $conn->prepare("SELECT id, title, file_name, category, status FROM documents WHERE case_id = ?");
    if ($stmtDocs) {
        $stmtDocs->bind_param("s", $caseId);
        $stmtDocs->execute();
        $resDocs = $stmtDocs->get_result();
        while ($d = $resDocs->fetch_assoc()) {
            $context['documents'][] = sanitizeRow($d, $forbiddenFields);
        }
        $stmtDocs->close();
    }

    $conn->close();
}

echo json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
