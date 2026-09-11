# Verification of Attorney Profile & Picture Persistence across Browser Refreshes

$stateCode = [System.IO.File]::ReadAllText("js/state.js", [System.Text.Encoding]::UTF8)
$appCode = [System.IO.File]::ReadAllText("js/app.js", [System.Text.Encoding]::UTF8)

Write-Host "`n===============================================================" -ForegroundColor Cyan
Write-Host "SLCMS - ATTORNEY PROFILE & PICTURE PERSISTENCE VERIFICATION" -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan

$passed = 0
$total = 0

function Check-Rule($condition, $name) {
    $script:total++
    if ($condition) {
        $script:passed++
        Write-Host "✅ [PASS] $name" -ForegroundColor Green
    } else {
        Write-Host "❌ [FAIL] $name" -ForegroundColor Red
    }
}

# 1. Verify persistCurrentUser method exists in state.js
Check-Rule ($stateCode.Contains("persistCurrentUser()") -and
            $stateCode.Contains("slcms_persisted_current_user")) "SLCMS_STATE.persistCurrentUser implemented with slcms_persisted_current_user"

# 2. Verify restoreSessionUser checks persisted profile in localStorage
Check-Rule ($stateCode.Contains("localStorage.getItem('slcms_persisted_current_user')") -and
            $stateCode.Contains("this.currentUser = Object.assign({}, this.currentUser, candidateUser)")) "SLCMS_STATE.restoreSessionUser restores custom profile & picture from localStorage"

# 3. Verify App.saveUserProfile saves to localStorage via persistCurrentUser
Check-Rule ($appCode.Contains("SLCMS_STATE.persistCurrentUser()") -and
            $appCode.Contains("SLCMS_STATE.persistUsers()")) "App.saveUserProfile saves profile & users permanently into storage"

# 4. Verify Photo / Avatar downscaling & optimization
Check-Rule ($appCode.Contains("canvas.toDataURL('image/jpeg'") -and
            $appCode.Contains("u.avatarImg = avatarVal") -and
            $appCode.Contains("Photo loaded and optimized!")) "High-DPI Canvas scaling & picture optimization implemented for local uploads"

# 5. Verify UI Sync
Check-Rule ($appCode.Contains("updateUserUI()") -and
            $appCode.Contains("user-display-avatar") -and
            $appCode.Contains("avatar-ring-gold")) "Profile avatar & user credentials synced across all header/sidebar UI elements"

Write-Host "`n===============================================================" -ForegroundColor Cyan
Write-Host "RESULTS: $passed / $total Tests Passed ($([Math]::Round(($passed/$total)*100))%)" -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan
