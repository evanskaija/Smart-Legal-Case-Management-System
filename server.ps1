# ============================================================================
# SLCMS Secure HTTP & Enterprise Security Server
# Backed by persistent disk database (data/users.json, data/security_events.json, data/security_alerts.json)
# ============================================================================

$port = 8080
$rootDir = $PSScriptRoot
$dataDir = Join-Path $rootDir "data"
if (!(Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir | Out-Null }

$usersFile = Join-Path $dataDir "users.json"
$eventsFile = Join-Path $dataDir "security_events.json"
$alertsFile = Join-Path $dataDir "security_alerts.json"
$backupsFile = Join-Path $dataDir "backups.json"
$backupsDir = Join-Path $dataDir "backups"

if (!(Test-Path $eventsFile)) { '[]' | Set-Content -Path $eventsFile -Encoding UTF8 }
if (!(Test-Path $alertsFile)) { '[]' | Set-Content -Path $alertsFile -Encoding UTF8 }
if (!(Test-Path $backupsFile)) { '[]' | Set-Content -Path $backupsFile -Encoding UTF8 }
if (!(Test-Path $backupsDir)) { New-Item -ItemType Directory -Path $backupsDir | Out-Null }

$rateLimitMap = [System.Collections.Concurrent.ConcurrentDictionary[string, System.Collections.Generic.List[long]]]::new()

function Get-DbBackups {
    if (Test-Path $backupsFile) {
        $raw = [System.IO.File]::ReadAllText($backupsFile, [System.Text.Encoding]::UTF8)
        $parsed = ($raw | ConvertFrom-Json)
        if ($null -eq $parsed) { return @() }
        return @($parsed)
    }
    return @()
}

function Save-DbBackups($backupsList) {
    $arr = @($backupsList)
    $json = $arr | ConvertTo-Json -Depth 10
    if ($arr.Count -eq 1 -and -not $json.Trim().StartsWith('[')) {
        $json = "[$json]"
    }
    [System.IO.File]::WriteAllText($backupsFile, $json, [System.Text.Encoding]::UTF8)
}

function Get-DbUsers {
    if (Test-Path $usersFile) {
        $raw = [System.IO.File]::ReadAllText($usersFile, [System.Text.Encoding]::UTF8)
        return ($raw | ConvertFrom-Json)
    }
    return @()
}

function Save-DbUsers($usersList) {
    $json = $usersList | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($usersFile, $json, [System.Text.Encoding]::UTF8)
}

function Get-DbEvents {
    if (Test-Path $eventsFile) {
        $raw = [System.IO.File]::ReadAllText($eventsFile, [System.Text.Encoding]::UTF8)
        return ($raw | ConvertFrom-Json)
    }
    return @()
}

function Save-DbEvents($eventsList) {
    $json = $eventsList | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($eventsFile, $json, [System.Text.Encoding]::UTF8)
}

function Add-DbEvent($userId, $eventType, $desc, $ip, $result = $null, $userName = $null) {
    $events = @(Get-DbEvents)
    if (-not $userName) {
        if ($userId -and $userId -ne 'unknown') {
            $users = @(Get-DbUsers)
            $u = $users | Where-Object { $_.id -eq $userId -or $_.staffId -eq $userId } | Select-Object -First 1
            if ($u) { $userName = $u.name } else { $userName = $userId }
        } else {
            $userName = "Unknown User"
        }
    }
    if (-not $result) {
        $result = switch ($eventType) {
            'LOGIN_SUCCESS'        { 'Successful' }
            'LOGIN_FAILED'         { 'Failed' }
            'ADMIN_LOCK'           { 'Locked by administrator' }
            'ADMIN_UNLOCK'         { 'Unlocked' }
            'PASSWORD_RESET'       { 'Temporary password issued' }
            'TEMPORARY_LOCK'       { 'Temporarily locked for 2 minutes' }
            'BACKUP_CREATED'       { 'Successful' }
            'Login attempt'        { 'Successful' }
            'Account security'     { 'Temporarily locked for 2 minutes' }
            'Account management'   { 'Locked by administrator' }
            'Password management'  { 'Successful' }
            'User management'      { 'Created' }
            'Permission management'{ 'Updated' }
            default                { 'Successful' }
        }
    }
    $newEvent = [PSCustomObject]@{
        id          = "evt-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())-$((New-Guid).ToString().Substring(0,5))"
        userId      = $userId
        userName    = $userName
        eventType   = $eventType
        result      = $result
        description = $desc
        eventTime   = [DateTime]::UtcNow.ToString("o")
        ipAddress   = $ip
        resolved    = $false
        resolvedAt  = $null
        resolvedBy  = $null
    }
    $events += $newEvent
    Save-DbEvents $events
    return $newEvent
}

function Get-DbAlerts {
    if (Test-Path $alertsFile) {
        $raw = [System.IO.File]::ReadAllText($alertsFile, [System.Text.Encoding]::UTF8)
        $parsed = ($raw | ConvertFrom-Json)
        if ($null -eq $parsed) { return @() }
        return @($parsed)
    }
    return @()
}

function Save-DbAlerts($alertsList) {
    $arr = @($alertsList)
    $json = $arr | ConvertTo-Json -Depth 10
    if ($arr.Count -eq 1 -and -not $json.Trim().StartsWith('[')) {
        $json = "[$json]"
    }
    [System.IO.File]::WriteAllText($alertsFile, $json, [System.Text.Encoding]::UTF8)
}

function Check-RateLimit($ip) {
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $timestamps = $rateLimitMap.GetOrAdd($ip, [System.Collections.Generic.List[long]]::new())
    [System.Threading.Monitor]::Enter($timestamps)
    try {
        $cutoff = $now - 10000
        $timestamps.RemoveAll([Predicate[long]]{ param($t) $t -lt $cutoff })
        if ($timestamps.Count -ge 20) {
            return $false
        }
        $timestamps.Add($now)
        return $true
    } finally {
        [System.Threading.Monitor]::Exit($timestamps)
    }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "SLCMS Backend & Web Server listening on http://127.0.0.1:$port/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $req = $context.Request
            $res = $context.Response
            
            $res.AddHeader("Access-Control-Allow-Origin", "*")
            $res.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            $res.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
            $res.AddHeader("Access-Control-Allow-Credentials", "true")

        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 200
            $res.Close()
            continue
        }

        $localPath = $req.Url.LocalPath
        $clientIp = if ($req.RemoteEndPoint) { $req.RemoteEndPoint.Address.ToString() } else { "127.0.0.1" }

        # -------------------------------------------------------------
        # 1. POST /api/auth/login
        # -------------------------------------------------------------
        if ($localPath -eq '/api/auth/login' -and $req.HttpMethod -eq 'POST') {
            if (-not (Check-RateLimit $clientIp)) {
                $res.StatusCode = 429
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"Too many requests. Please wait a moment."}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.Close()
                continue
            }

            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $bodyStr = $reader.ReadToEnd()
            $body = $null
            try { $body = $bodyStr | ConvertFrom-Json } catch {}

            $idInput = if ($body) { if ($body.email) { $body.email } else { $body.identifier } } else { "" }
            $password = if ($body) { $body.password } else { "" }
            [System.IO.File]::WriteAllText("c:\Users\messi\OneDrive\Desktop\SLCMS\scratch\body_debug.txt", "BODY: '$bodyStr', ID: '$idInput', PWD: '$password'", [System.Text.Encoding]::UTF8)

            $cleanId = ($idInput + "").Trim().ToLower()
            $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

            $users = @(Get-DbUsers)
            $matchedUser = $null

            foreach ($u in $users) {
                $uEmail = ($u.email + "").ToLower()
                $uStaff = ($u.staffId + "").ToLower()
                $uEmp   = ($u.employeeId + "").ToLower()
                $uUser  = ($u.username + "").ToLower()

                if ($cleanId -ne "" -and ($cleanId -eq $uEmail -or $cleanId -eq $uStaff -or $cleanId -eq $uEmp -or $cleanId -eq $uUser)) {
                    $matchedUser = $u
                    break
                }
                # Also support admin aliases
                if ($cleanId -in @('admin', 'administrator', 'slcms.admin', 'slcms.ad', 'adm-0001', 'adm0001') -and ($uStaff -eq 'adm-0001' -or $u.id -eq 'usr-001')) {
                    $matchedUser = $u
                    break
                }
            }

            $res.ContentType = 'application/json; charset=utf-8'

            if (-not $matchedUser) {
                Add-DbEvent "unknown" "Login attempt" "Unknown identifier attempted: $cleanId" $clientIp "Failed — 2 attempts remaining" "Unknown User"
                $res.StatusCode = 401
                $outJson = '{"success":false,"attemptsRemaining":2,"message":"Incorrect credentials. 2 attempts remaining."}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.Close()
                continue
            }

            # Check Deactivated
            if ($matchedUser.accountStatus -eq "DEACTIVATED") {
                Add-DbEvent $matchedUser.id "Login attempt" "Attempt to access deactivated account" $clientIp "Failed" $matchedUser.name
                $res.StatusCode = 403
                $outJson = '{"success":false,"errorType":"ACCOUNT_DISABLED","message":"This account is inactive. Contact the system administrator."}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.Close()
                continue
            }

            # Check Administrator Lock
            if ($matchedUser.adminLocked -eq $true -or ($matchedUser.accountStatus -eq "LOCKED" -and -not $matchedUser.lockedUntil)) {
                Add-DbEvent $matchedUser.id "Login attempt" "Attempt to access administrator-locked account" $clientIp "Failed" $matchedUser.name
                $res.StatusCode = 403
                $outJson = '{"success":false,"errorType":"ADMIN_LOCKED","message":"Your account has been locked by the administrator. Contact the system administrator."}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.Close()
                continue
            }

            # Check Temporary Lock
            if ($matchedUser.accountStatus -eq "TEMPORARILY_LOCKED" -or ($matchedUser.lockedUntil -and $matchedUser.lockedUntil -gt 0)) {
                if ($nowMs -lt $matchedUser.lockedUntil) {
                    $remMs = $matchedUser.lockedUntil - $nowMs
                    $remSecs = [Math]::Max(1, [Math]::Floor($remMs / 1000))
                    $m = [Math]::Floor($remSecs / 60)
                    $s = $remSecs % 60
                    $timeStr = "{0}:{1:D2}" -f $m, $s

                    $res.StatusCode = 423 # Locked
                    $outObj = @{
                        success = $false
                        errorType = "TEMPORARILY_LOCKED"
                        remainingSeconds = $remSecs
                        lockedUntil = $matchedUser.lockedUntil
                        message = "Account temporarily locked. Try again in $timeStr."
                    }
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Compress))
                    $res.OutputStream.Write($bytes, 0, $bytes.Length)
                    $res.Close()
                    continue
                } else {
                    # 2 minutes expired! Auto-unlock
                    $matchedUser.accountStatus = "ACTIVE"
                    $matchedUser.lockedUntil = $null
                    $matchedUser.failedAttempts = 0

                    # Auto-resolve alert
                    $alerts = @(Get-DbAlerts)
                    foreach ($a in $alerts) {
                        if ($a.userId -eq $matchedUser.id -and $a.resolved -ne $true) {
                            $a.resolved = $true
                            $a.resolvedAt = [DateTime]::UtcNow.ToString("o")
                            $a.resolvedBy = "SYSTEM"
                        }
                    }
                    Save-DbAlerts $alerts
                    Save-DbUsers $users
                }
            }

            # Password check
            $actualPassword = if ($matchedUser.passwordPlain) { $matchedUser.passwordPlain } else { 'SecretLawFirm2026!' }
            $passMatch = ($password -eq $actualPassword)
            Write-Host ">>> CHECKING PASSWORD: input='$password', actual='$actualPassword', passMatch=$passMatch"

            if (-not $passMatch) {
                Write-Host ">>> INSIDE FAILED BRANCH: failedAttempts=$($matchedUser.failedAttempts)"
                $curFailed = [int]$matchedUser.failedAttempts + 1
                $matchedUser.failedAttempts = $curFailed
                $matchedUser.lastFailedLogin = [DateTime]::UtcNow.ToString("o")

                if ($curFailed -ge 3) {
                    $matchedUser.accountStatus = "TEMPORARILY_LOCKED"
                    $matchedUser.lockedUntil = $nowMs + 120000 # 2 minutes

                    $lockTime = [DateTime]::UtcNow
                    $unlockTime = $lockTime.AddMinutes(2)
                    $unlockTimeStr = $unlockTime.ToLocalTime().ToString("h:mm tt")

                    # Create one genuine admin security alert
                    $alerts = @(Get-DbAlerts)
                    $hasUnresolved = $false
                    foreach ($a in $alerts) {
                        if ($a.userId -eq $matchedUser.id -and $a.resolved -ne $true) {
                            $hasUnresolved = $true
                            break
                        }
                    }

                    if (-not $hasUnresolved) {
                        $newAlert = [PSCustomObject]@{
                            alertId = "alt-$nowMs"
                            alert_id = "alt-$nowMs"
                            userId = $matchedUser.id
                            user_id = $matchedUser.id
                            staffId = $matchedUser.staffId
                            staff_id = $matchedUser.staffId
                            fullName = $matchedUser.name
                            name = $matchedUser.name
                            role = $matchedUser.role
                            alertType = "TEMPORARY_LOCK"
                            alert_type = "TEMPORARY_LOCK"
                            title = "Temporary Login Lock"
                            description = "Three unsuccessful login attempts"
                            severity = "HIGH"
                            createdAt = $lockTime.ToString("o")
                            created_at = $lockTime.ToString("o")
                            lockedAtTime = $lockTime.ToLocalTime().ToString("h:mm tt")
                            unlockTime = $unlockTimeStr
                            lockedUntil = $matchedUser.lockedUntil
                            resolved = $false
                            resolvedAt = $null
                            resolvedBy = $null
                            clientIp = $clientIp
                        }
                        $alerts += $newAlert
                        Save-DbAlerts $alerts
                    }

                    # First record the 3rd failed login attempt itself
                    Add-DbEvent -userId $matchedUser.id -eventType "Login attempt" -desc "Unsuccessful login attempt [3 of 3]" -ip $clientIp -result "Failed - 0 attempts remaining" -userName $matchedUser.name
                    # Then record the resulting Account security lock event
                    Add-DbEvent -userId $matchedUser.id -eventType "Account security" -desc "Account temporarily locked for 2 minutes after 3 failed login attempts" -ip $clientIp -result "Temporarily locked until $unlockTimeStr" -userName $matchedUser.name
                    Save-DbUsers $users

                    $res.StatusCode = 423
                    $outObj = @{
                        success = $false
                        errorType = "TEMPORARILY_LOCKED"
                        remainingSeconds = 120
                        lockedUntil = $matchedUser.lockedUntil
                        message = "Account temporarily locked after 3 unsuccessful attempts. Try again in 2:00 minutes."
                    }
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Compress))
                    $res.OutputStream.Write($bytes, 0, $bytes.Length)
                    $res.Close()
                    continue
                }

                $rem = 3 - $curFailed
                $remStr = if ($rem -eq 1) { "1 attempt remaining" } else { "$rem attempts remaining" }
                $failedResult = "Failed — $remStr"

                Add-DbEvent $matchedUser.id "Login attempt" "Unsuccessful login attempt ($curFailed of 3)" $clientIp $failedResult $matchedUser.name
                Save-DbUsers $users

                $res.StatusCode = 401
                $outObj = @{
                    success = $false
                    attemptsRemaining = $rem
                    message = "Incorrect credentials. $remStr."
                }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Compress))
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.Close()
                continue
            }

            # Login Success!
            Write-Host ">>> REACHED SUCCESS BRANCH FOR $($matchedUser.name)"
            $matchedUser.failedAttempts = 0
            $matchedUser.lockedUntil = $null
            $matchedUser.lastSuccessfulLogin = [DateTime]::UtcNow.ToString("o")
            Save-DbUsers $users

            Add-DbEvent $matchedUser.id "Login attempt" "Login successful" $clientIp "Successful" $matchedUser.name

            $res.StatusCode = 200
            $outObj = @{
                success = $true
                message = "Login successful. Welcome to SLCMS."
                token = "slcms_jwt_$([Guid]::NewGuid().ToString('N'))"
                user = $matchedUser
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Depth 6 -Compress))
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 2. GET /api/admin/security-alerts & /api/admin/security-alerts/count
        # -------------------------------------------------------------
        if ($localPath -like '/api/admin/security-alerts*') {
            $res.ContentType = 'application/json; charset=utf-8'
            $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

            $alerts = @(Get-DbAlerts)
            $users = @(Get-DbUsers)
            $alertsChanged = $false
            $usersChanged = $false

            # Auto-resolve expired temporary lock alerts
            foreach ($a in $alerts) {
                if ($a.resolved -ne $true -and $a.alertType -eq "TEMPORARY_LOCK") {
                    $u = $users | Where-Object { $_.id -eq $a.userId } | Select-Object -First 1
                    if ($u -and -not $u.adminLocked -and $u.lockedUntil -and $nowMs -ge $u.lockedUntil) {
                        $a.resolved = $true
                        $a.resolvedAt = [DateTime]::UtcNow.ToString("o")
                        $a.resolvedBy = "SYSTEM"
                        $alertsChanged = $true

                        $u.accountStatus = "ACTIVE"
                        $u.lockedUntil = $null
                        $u.failedAttempts = 0
                        $usersChanged = $true
                    }
                }
            }
            if ($alertsChanged) { Save-DbAlerts $alerts }
            if ($usersChanged) { Save-DbUsers $users }

            $arrUnresolved = @($alerts | Where-Object { $_.resolved -ne $true })

            if ($localPath -like '*/count') {
                $count = $arrUnresolved.Count
                $badge = if ($count -eq 0) { "0 requiring attention" } else { "$count ATTENTION" }
                $outObj = @{ unresolvedCount = $count; badgeText = $badge }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Compress))
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.Close()
                continue
            }

            $outJson = $arrUnresolved | ConvertTo-Json -Depth 6
            if ($arrUnresolved.Count -eq 1 -and -not $outJson.Trim().StartsWith('[')) {
                $outJson = "[$outJson]"
            }
            if ($arrUnresolved.Count -eq 0) {
                $outJson = "[]"
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 3. POST /api/admin/security-alerts/{alertId}/resolve
        # -------------------------------------------------------------
        if ($localPath -match '^/api/admin/security-alerts/([^/]+)/resolve$' -and $req.HttpMethod -eq 'POST') {
            $alertId = $matches[1]
            $alerts = @(Get-DbAlerts)
            $found = $false
            foreach ($a in $alerts) {
                if ($a.alertId -eq $alertId -or $a.alert_id -eq $alertId) {
                    $a.resolved = $true
                    $a.resolvedAt = [DateTime]::UtcNow.ToString("o")
                    $a.resolvedBy = "ADM-0001"
                    $found = $true
                }
            }
            if ($found) { Save-DbAlerts $alerts }
            $res.ContentType = 'application/json; charset=utf-8'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true}')
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 4. POST /api/admin/users/{userId}/lock
        # -------------------------------------------------------------
        if ($localPath -match '^/api/admin/users/([^/]+)/lock$' -and $req.HttpMethod -eq 'POST') {
            $userId = $matches[1]
            $users = @(Get-DbUsers)
            $u = $users | Where-Object { $_.id -eq $userId -or $_.staffId -eq $userId } | Select-Object -First 1
            if ($u) {
                $u.adminLocked = $true
                $u.accountStatus = "LOCKED"
                $u.lockedUntil = $null
                Save-DbUsers $users
                Add-DbEvent $u.id "Account management" "Account locked by administrator" $clientIp "Locked by administrator" $u.name
                
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Account locked successfully."}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"User not found"}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 5. POST /api/admin/users/{userId}/unlock
        # -------------------------------------------------------------
        if ($localPath -match '^/api/admin/users/([^/]+)/unlock$' -and $req.HttpMethod -eq 'POST') {
            $userId = $matches[1]
            $users = @(Get-DbUsers)
            $u = $users | Where-Object { $_.id -eq $userId -or $_.staffId -eq $userId } | Select-Object -First 1
            if ($u) {
                $u.adminLocked = $false
                $u.accountStatus = "ACTIVE"
                $u.failedAttempts = 0
                $u.lockedUntil = $null
                Save-DbUsers $users
                
                # Resolve alerts for this user
                $alerts = @(Get-DbAlerts)
                foreach ($a in $alerts) {
                    if ($a.userId -eq $u.id) {
                        $a.resolved = $true
                        $a.resolvedAt = [DateTime]::UtcNow.ToString("o")
                        $a.resolvedBy = "ADM-0001"
                    }
                }
                Save-DbAlerts $alerts
                Add-DbEvent $u.id "Account management" "Account unlocked by administrator" $clientIp "Unlocked" $u.name

                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Account unlocked successfully."}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"User not found"}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 6. POST /api/admin/users/{userId}/reset-password
        # -------------------------------------------------------------
        if ($localPath -match '^/api/admin/users/([^/]+)/reset-password$' -and $req.HttpMethod -eq 'POST') {
            $userId = $matches[1]
            $users = @(Get-DbUsers)
            $u = $users | Where-Object { $_.id -eq $userId -or $_.staffId -eq $userId } | Select-Object -First 1
            if ($u) {
                $tempPass = "TempPass" + (Get-Random -Minimum 1000 -Maximum 9999) + "!"
                $u.passwordPlain = $tempPass
                $u.mustChangePassword = $true
                Save-DbUsers $users
                Add-DbEvent $u.id "Password management" "Temporary password issued by administrator" $clientIp "Temporary password issued" $u.name

                $res.ContentType = 'application/json; charset=utf-8'
                $outObj = @{
                    success = $true
                    message = "Temporary password issued. User must change password upon next login."
                    temporaryPassword = $tempPass
                    mustChangePassword = $true
                }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Compress))
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"User not found"}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 6b. POST /api/auth/change-password
        # -------------------------------------------------------------
        if ($localPath -eq '/api/auth/change-password' -and $req.HttpMethod -eq 'POST') {
            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $bodyStr = $reader.ReadToEnd()
            $body = $null
            try { $body = $bodyStr | ConvertFrom-Json } catch {}

            $userId = if ($body) { if ($body.userId) { $body.userId } else { $body.id } } else { "" }
            $newPass = if ($body) { if ($body.newPassword) { $body.newPassword } else { $body.password } } else { "" }

            $users = @(Get-DbUsers)
            $u = $users | Where-Object { $_.id -eq $userId -or $_.staffId -eq $userId -or $_.email -eq $userId } | Select-Object -First 1
            if ($u -and $newPass) {
                $u.passwordPlain = $newPass
                $u.mustChangePassword = $false
                $u.accountStatus = "ACTIVE"
                Save-DbUsers $users
                Add-DbEvent $u.id "Password management" "Password changed successfully" $clientIp "Successful" $u.name

                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Password changed successfully."}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 400
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"Invalid request"}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 6c. POST /api/admin/users/{userId}/deactivate
        # -------------------------------------------------------------
        if ($localPath -match '^/api/admin/users/([^/]+)/deactivate$' -and $req.HttpMethod -eq 'POST') {
            $userId = $matches[1]
            $users = @(Get-DbUsers)
            $u = $users | Where-Object { $_.id -eq $userId -or $_.staffId -eq $userId } | Select-Object -First 1
            if ($u) {
                $u.accountStatus = "DEACTIVATED"
                Save-DbUsers $users
                Add-DbEvent $u.id "User management" "User account deactivated by administrator" $clientIp "Deactivated" $u.name

                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Account deactivated successfully."}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"User not found"}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 6d. POST /api/admin/users/{userId}/role
        # -------------------------------------------------------------
        if ($localPath -match '^/api/admin/users/([^/]+)/role$' -and $req.HttpMethod -eq 'POST') {
            $userId = $matches[1]
            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $bodyStr = $reader.ReadToEnd()
            $body = $null
            try { $body = $bodyStr | ConvertFrom-Json } catch {}

            $newRole = if ($body) { $body.role } else { "" }
            $users = @(Get-DbUsers)
            $u = $users | Where-Object { $_.id -eq $userId -or $_.staffId -eq $userId } | Select-Object -First 1
            if ($u -and $newRole) {
                $u.role = $newRole
                Save-DbUsers $users
                Add-DbEvent $u.id "Permission management" "Role changed to $newRole" $clientIp "Updated" $u.name

                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Role updated successfully."}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 400
                $res.ContentType = 'application/json; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"message":"Invalid role request"}')
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 7. GET /api/admin/users/{userId}/activity
        # -------------------------------------------------------------
        if ($localPath -match '^/api/admin/users/([^/]+)/activity$') {
            $userId = $matches[1]
            $events = @(Get-DbEvents | Where-Object { $_.userId -eq $userId })
            $res.ContentType = 'application/json; charset=utf-8'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes(($events | ConvertTo-Json -Depth 5))
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 7b. GET /api/admin/security-activity
        # -------------------------------------------------------------
        if ($localPath -eq '/api/admin/security-activity' -and $req.HttpMethod -eq 'GET') {
            $events = @(Get-DbEvents)
            $users = @(Get-DbUsers)

            $logs = @()
            foreach ($e in $events) {
                $u = $users | Where-Object { $_.id -eq $e.userId -or $_.staffId -eq $e.userId } | Select-Object -First 1
                $userName = if ($u) { $u.name } else { if ($e.userId -eq 'unknown') { 'Unknown Identity' } else { $e.userId } }
                $userRole = if ($u) { $u.role } else { 'External / System' }
                $staffId = if ($u) { $u.staffId } else { 'N/A' }

                $actionName = switch ($e.eventType) {
                    'LOGIN_SUCCESS' { 'Login Succeeded' }
                    'LOGIN_FAILED'  { 'Login Failed' }
                    'TEMPORARY_LOCK'{ 'Account Temporarily Locked' }
                    'ADMIN_LOCK'    { 'Account Manually Locked' }
                    'ADMIN_UNLOCK'  { 'Account Unlocked' }
                    'PASSWORD_RESET'{ 'Temporary Password Issued' }
                    default { $e.eventType }
                }

                $resBadge = switch ($e.eventType) {
                    'LOGIN_SUCCESS' { 'Success' }
                    'ADMIN_UNLOCK'  { 'Success' }
                    'PASSWORD_RESET'{ 'Success' }
                    'TEMPORARY_LOCK'{ 'Locked' }
                    'ADMIN_LOCK'    { 'Locked' }
                    'LOGIN_FAILED'  { 'Failed' }
                    default { 'Success' }
                }

                $ts = $e.eventTime
                try {
                    $parsedDate = [DateTime]::Parse($ts)
                    $ts = $parsedDate.ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")
                } catch {}

                $logs += [PSCustomObject]@{
                    id            = $e.id
                    timestamp     = $ts
                    user          = $userName
                    staffId       = $staffId
                    role          = $userRole
                    module        = 'Security Activity'
                    action        = $actionName
                    record        = $e.description
                    result        = $resBadge
                    status        = $resBadge
                    ip            = $e.ipAddress
                    securityLevel = if ($resBadge -eq 'Locked') { 'Critical' } elseif ($resBadge -eq 'Failed') { 'High' } else { 'Standard' }
                }
            }

            [Array]::Reverse($logs)

            $res.ContentType = 'application/json; charset=utf-8'
            $outJson = $logs | ConvertTo-Json -Depth 5
            if ($logs.Count -eq 1 -and -not $outJson.Trim().StartsWith('[')) {
                $outJson = "[$outJson]"
            }
            if ($logs.Count -eq 0) {
                $outJson = "[]"
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 7c. GET /api/admin/security-status
        # -------------------------------------------------------------
        if ($localPath -eq '/api/admin/security-status' -and $req.HttpMethod -eq 'GET') {
            $events = @(Get-DbEvents)
            $users = @(Get-DbUsers)
            $alerts = @(Get-DbAlerts)
            $backups = @(Get-DbBackups)

            $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $todayUtc = [DateTime]::UtcNow.Date

            # 1. Failed Logins Today
            $failedLoginsToday = 0
            foreach ($e in $events) {
                if ($e.eventType -eq 'LOGIN_FAILED' -or ($e.eventType -eq 'Login attempt' -and $e.result -like 'Failed*')) {
                    try {
                        if ([DateTime]::Parse($e.eventTime).ToUniversalTime().Date -eq $todayUtc) {
                            $failedLoginsToday++
                        }
                    } catch {}
                }
            }

            # 2. Locked Accounts
            $lockedUsers = @()
            foreach ($u in $users) {
                $isLocked = $false
                if ($u.adminLocked -eq $true) {
                    $isLocked = $true
                } elseif ($u.accountStatus -in @('LOCKED', 'TEMPORARILY_LOCKED')) {
                    if ($u.lockedUntil -and $nowMs -ge $u.lockedUntil) {
                        $isLocked = $false
                    } else {
                        $isLocked = $true
                    }
                }
                if ($isLocked) { $lockedUsers += $u }
            }
            $lockedAccountsCount = $lockedUsers.Count

            # 3. Unresolved Alerts
            $arrUnresolved = @($alerts | Where-Object { $_.resolved -ne $true })
            $unresolvedAlertsCount = $arrUnresolved.Count

            # System Status & Message
            $systemStatus = if ($lockedAccountsCount -eq 0 -and $unresolvedAlertsCount -eq 0) { "Normal" } else { "Attention Required" }
            $statusMessage = if ($systemStatus -eq "Normal") {
                "No security issues currently require administrator attention."
            } else {
                if ($lockedAccountsCount -eq 1) {
                    $u0 = $lockedUsers[0]
                    if ($u0.adminLocked -eq $true) {
                        "One account ($($u0.name)) is locked by administrator."
                    } else {
                        "One account ($($u0.name)) is temporarily locked after three unsuccessful login attempts."
                    }
                } else {
                    "$lockedAccountsCount accounts are locked or require administrator attention."
                }
            }

            # 4. Recent Security Activity: only the latest 5 genuine records from database
            $allEvents = @(Get-DbEvents)
            [Array]::Reverse($allEvents)
            $top5 = @($allEvents | Select-Object -First 5)

            $recentEvents = @()
            foreach ($e in $top5) {
                $u = $users | Where-Object { $_.id -eq $e.userId -or $_.staffId -eq $e.userId } | Select-Object -First 1
                $userName = if ($e.userName) { $e.userName } elseif ($u) { $u.name } else { if ($e.userId -eq 'unknown') { 'Unknown Identity' } else { $e.userId } }

                $timeFormatted = $e.eventTime
                try {
                    $timeFormatted = [DateTime]::Parse($e.eventTime).ToLocalTime().ToString("h:mm tt")
                } catch {}

                $eventDesc = if ($e.eventType) {
                    switch ($e.eventType) {
                        'LOGIN_SUCCESS'   { 'Login attempt' }
                        'LOGIN_FAILED'    { 'Login attempt' }
                        'TEMPORARY_LOCK'  { 'Account security' }
                        'ADMIN_LOCK'      { 'Account management' }
                        'ADMIN_UNLOCK'    { 'Account management' }
                        'PASSWORD_RESET'  { 'Password management' }
                        'BACKUP_CREATED'  { 'System backup' }
                        default           { $e.eventType }
                    }
                } else { 'Login attempt' }

                $resultBadge = if ($e.result) { $e.result } else {
                    switch ($e.eventType) {
                        'LOGIN_SUCCESS'   { 'Successful' }
                        'ADMIN_UNLOCK'    { 'Unlocked' }
                        'PASSWORD_RESET'  { 'Temporary password issued' }
                        'BACKUP_CREATED'  { 'Successful' }
                        'TEMPORARY_LOCK'  { 'Temporarily locked for 2 minutes' }
                        'ADMIN_LOCK'      { 'Locked by administrator' }
                        'LOGIN_FAILED'    { 'Failed' }
                        default           { 'Successful' }
                    }
                }

                $recentEvents += [PSCustomObject]@{
                    id          = $e.id
                    userId      = $e.userId
                    userName    = $userName
                    time        = $timeFormatted
                    user        = $userName
                    event       = $eventDesc
                    eventType   = $eventDesc
                    result      = $resultBadge
                    description = $e.description
                    eventTime   = $e.eventTime
                    ipAddress   = $e.ipAddress
                }
            }

            # 5. Latest Backup
            $latestBackup = if ($backups.Count -gt 0) { $backups[0] } else { $null }

            $outObj = [PSCustomObject]@{
                systemStatus           = $systemStatus
                statusMessage          = $statusMessage
                failedLoginsToday      = $failedLoginsToday
                lockedAccountsCount    = $lockedAccountsCount
                unresolvedAlertsCount  = $unresolvedAlertsCount
                unresolvedAlerts       = $arrUnresolved
                lockedUsers            = $lockedUsers
                recentEvents           = $recentEvents
                latestBackup           = $latestBackup
            }

            $res.ContentType = 'application/json; charset=utf-8'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Depth 6))
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 7d. GET /api/admin/backups & POST /api/admin/backups
        # -------------------------------------------------------------
        if ($localPath -eq '/api/admin/backups' -and $req.HttpMethod -eq 'GET') {
            $res.ContentType = 'application/json; charset=utf-8'
            $backups = @(Get-DbBackups)
            $outJson = $backups | ConvertTo-Json -Depth 5
            if ($backups.Count -eq 1 -and -not $outJson.Trim().StartsWith('[')) { $outJson = "[$outJson]" }
            if ($backups.Count -eq 0) { $outJson = "[]" }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        if ($localPath -eq '/api/admin/backups' -and $req.HttpMethod -eq 'POST') {
            $now = [DateTime]::UtcNow
            $tsStr = $now.ToString("yyyyMMdd_HHmmss")
            $filename = "SLCMS_Snapshot_$tsStr.json"
            $filepath = Join-Path $backupsDir $filename

            $backupPayload = @{
                version = "SLCMS-Enterprise-2.0"
                timestamp = $now.ToString("o")
                generatedBy = "SLCMS System Administrator"
                users = @(Get-DbUsers)
                securityEvents = @(Get-DbEvents)
                securityAlerts = @(Get-DbAlerts)
            }

            $json = $backupPayload | ConvertTo-Json -Depth 10
            [System.IO.File]::WriteAllText($filepath, $json, [System.Text.Encoding]::UTF8)

            $fileInfo = Get-Item $filepath
            $sizeMb = [Math]::Round($fileInfo.Length / (1024 * 1024), 1)
            $sizeStr = if ($sizeMb -ge 0.1) { "$sizeMb MB" } else { "$([Math]::Round($fileInfo.Length / 1024, 1)) KB" }

            $newBackup = [PSCustomObject]@{
                id            = "bkp-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
                filename      = $filename
                filepath      = $filepath
                sizeBytes     = $fileInfo.Length
                sizeFormatted = $sizeStr
                status        = "Successful"
                createdBy     = "Manual Administrator Backup"
                createdAt     = $now.ToString("o")
                dateFormatted = $now.ToString("d MMMM yyyy, h:mm tt")
            }

            $backups = @(Get-DbBackups)
            $backups = @($newBackup) + $backups
            Save-DbBackups $backups

            Add-DbEvent "usr-001" "BACKUP_CREATED" "System database snapshot created ($sizeStr)" $clientIp

            $res.ContentType = 'application/json; charset=utf-8'
            $outObj = @{ success = $true; backup = $newBackup }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes(($outObj | ConvertTo-Json -Depth 5))
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 8. GET /api/admin/users
        # -------------------------------------------------------------
        if ($localPath -eq '/api/admin/users') {
            $res.ContentType = 'application/json; charset=utf-8'
            $users = @(Get-DbUsers)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes(($users | ConvertTo-Json -Depth 6))
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        # -------------------------------------------------------------
        # 9. Static File Serving
        # -------------------------------------------------------------
        $path = $localPath.TrimStart('/')
        if ($path -eq '') { $path = 'index.html' }
        $fullPath = Join-Path $rootDir $path

        if (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                '.js'   { 'application/javascript; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.svg'  { 'image/svg+xml' }
                default { 'text/plain' }
            }
            $res.ContentType = $mime
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
        }
        $res.Close()
    } catch {
        try { $context.Response.Close() } catch {}
    }
    }
} finally {
    $listener.Stop()
}
