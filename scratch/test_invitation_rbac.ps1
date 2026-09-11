# Validation test for SLCMS Invitation-Based Registration & RBAC

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SLCMS INVITATION-BASED RBAC & IDENTITY VERIFICATION   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$statePath = "c:\Users\messi\OneDrive\Desktop\project\js\state.js"
$authPath = "c:\Users\messi\OneDrive\Desktop\project\js\views\auth.js"
$adminPath = "c:\Users\messi\OneDrive\Desktop\project\js\views\admin.js"

$stateContent = Get-Content -Raw $statePath
$authContent = Get-Content -Raw $authPath
$adminContent = Get-Content -Raw $adminPath

# 1. Verify standard denial messages
$msgInvalidInv = "Registration denied. This invitation is invalid, expired or already used."
$msgIdentityMismatch = "Registration denied. The submitted professional information does not match the role assigned by the organization."
$msgPendingApproval = "Your identity was received successfully. Access will remain restricted until an authorized administrator approves your account."
$msgWorkspaceRestricted = "Access restricted. Your account is registered as"

$test1 = $stateContent.Contains($msgInvalidInv) -and $authContent.Contains($msgInvalidInv)
$test2 = $stateContent.Contains($msgIdentityMismatch) -and $authContent.Contains($msgIdentityMismatch)
$test3 = $stateContent.Contains($msgPendingApproval) -and $authContent.Contains($msgPendingApproval)
$test4 = $stateContent.Contains($msgWorkspaceRestricted)

Write-Host "Test 1: Invalid/Expired/Used Invitation Denial Message matches exact spec: " -NoNewline
if ($test1) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

Write-Host "Test 2: Professional Identity Mismatch Denial Message matches exact spec: " -NoNewline
if ($test2) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

Write-Host "Test 3: Pending Administrator Approval Message matches exact spec: " -NoNewline
if ($test3) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

Write-Host "Test 4: Workspace Boundary Restriction Message matches exact spec: " -NoNewline
if ($test4) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 2. Verify Invitation codes exist
$codes = @('INV-TZ-2026-SR-COUNSEL', 'INV-TZ-2026-ASSOC', 'INV-TZ-2026-CLERK', 'INV-EXPIRED-TEST', 'INV-USED-TEST')
foreach ($c in $codes) {
    $hasCode = $stateContent.Contains($c) -and $authContent.Contains($c)
    Write-Host "Test 5: Invitation Code [$c] configured: " -NoNewline
    if ($hasCode) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }
}

# 3. Verify No Public Role Selection in Registration
$noPublicRoleSelect = -not ($authContent -match '<select[^>]*id="reg-staff-role"')
Write-Host "Test 6: Public Role Select Dropdown removed from registration: " -NoNewline
if ($noPublicRoleSelect) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 4. Verify 7 Account States in state.js
$states = @('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'ACTIVE', 'FIRST_LOGIN_RESET', 'LOCKED', 'SUSPENDED', 'DEACTIVATED')
foreach ($s in $states) {
    $hasState = $stateContent.Contains($s)
    Write-Host "Test 7: Account Status [$s] supported: " -NoNewline
    if ($hasState) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }
}

Write-Host "`nAll verification checks complete." -ForegroundColor Cyan
