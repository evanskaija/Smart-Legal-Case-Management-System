$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Host "Server listening on http://127.0.0.1:8080/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    
    $path = $req.Url.LocalPath.TrimStart('/')
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
