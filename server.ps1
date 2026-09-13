$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Host "Server listening on http://127.0.0.1:8080/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    
    $localPath = $req.Url.LocalPath
    if ($localPath -like '/api/admin/security-alerts*') {
        $res.ContentType = 'application/json; charset=utf-8'
        $res.AddHeader("Access-Control-Allow-Origin", "*")
        $res.AddHeader("Access-Control-Allow-Credentials", "true")
        $alertsFile = Join-Path $PSScriptRoot "scratch/security_alerts.json"
        $jsonStr = "[]"
        if (Test-Path $alertsFile) {
            $jsonStr = [System.IO.File]::ReadAllText($alertsFile)
        }
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
        continue
    }

    if ($localPath -like '/api/admin/users*') {
        $res.ContentType = 'application/json; charset=utf-8'
        $res.AddHeader("Access-Control-Allow-Origin", "*")
        $res.AddHeader("Access-Control-Allow-Credentials", "true")
        $usersFile = Join-Path $PSScriptRoot "scratch/users.json"
        $jsonStr = '[{"id":"usr-001","employeeId":"ADM-0001","staffId":"ADM-0001","username":"slcms.admin","name":"SLCMS System Administrator","email":"admin@slcms.local","phone":"+255 700 000 001","role":"Administrator","roleTitle":"System Administrator","status":"FIRST_LOGIN_RESET","accountStatus":"FIRST_LOGIN_RESET","firstLoginStatus":"Pending","first_login_required":true,"lastLogin":"Never","activeCases":0,"assignedCaseIds":[]}]'
        if (Test-Path $usersFile) {
            $jsonStr = [System.IO.File]::ReadAllText($usersFile)
        }
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
        continue
    }

    $path = $localPath.TrimStart('/')
    if ($path -eq '') {
        $path = 'index.html'
    }
    
    $fullPath = Join-Path $PSScriptRoot $path
    if (Test-Path $fullPath) {
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
        $mime = 'text/plain'
        switch ($ext) {
            '.html' { $mime = 'text/html; charset=utf-8' }
            '.css'  { $mime = 'text/css; charset=utf-8' }
            '.js'   { $mime = 'application/javascript; charset=utf-8' }
            '.json' { $mime = 'application/json' }
            '.png'  { $mime = 'image/png' }
            '.jpg'  { $mime = 'image/jpeg' }
            '.svg'  { $mime = 'image/svg+xml' }
        }
        $res.ContentType = $mime
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $res.StatusCode = 404
    }
    $res.Close()
}
