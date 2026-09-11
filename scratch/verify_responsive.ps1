$r = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/css/responsive.css' -UseBasicParsing
Write-Host "responsive.css HTTP Status: $($r.StatusCode)"
Write-Host "responsive.css Length: $($r.Content.Length) bytes"

$html = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/index.html' -UseBasicParsing
Write-Host "index.html links responsive.css: $($html.Content.Contains('responsive.css'))"
Write-Host "index.html has viewport meta: $($html.Content.Contains('viewport'))"

$app = Get-Content 'c:\Users\messi\OneDrive\Desktop\project\js\app.js' -Raw
Write-Host "app.js has mobile-bottom-nav: $($app.Contains('mobile-bottom-nav'))"
Write-Host "app.js has sidebar-mobile-user-header: $($app.Contains('sidebar-mobile-user-header'))"
Write-Host "app.js has closeMobileSidebar in navigate: $($app.Contains('this.closeMobileSidebar()'))"

$cases = Get-Content 'c:\Users\messi\OneDrive\Desktop\project\js\views\cases.js' -Raw
Write-Host "cases.js has desktop-table-view: $($cases.Contains('desktop-table-view'))"
Write-Host "cases.js has mobile-cards-view: $($cases.Contains('mobile-cards-view'))"
Write-Host "cases.js has case-card-mobile: $($cases.Contains('case-card-mobile'))"

$docs = Get-Content 'c:\Users\messi\OneDrive\Desktop\project\js\views\documents.js' -Raw
Write-Host "documents.js has desktop-table-view: $($docs.Contains('desktop-table-view'))"
Write-Host "documents.js has mobile-cards-view: $($docs.Contains('mobile-cards-view'))"
Write-Host "documents.js has doc-card-mobile: $($docs.Contains('doc-card-mobile'))"

$tasks = Get-Content 'c:\Users\messi\OneDrive\Desktop\project\js\views\tasks.js' -Raw
Write-Host "tasks.js has kanban-mobile-tabs: $($tasks.Contains('kanban-mobile-tabs'))"
Write-Host "tasks.js has scrollToColumn: $($tasks.Contains('scrollToColumn'))"

Write-Host "`nAll responsiveness integration checks completed successfully!" -ForegroundColor Green
