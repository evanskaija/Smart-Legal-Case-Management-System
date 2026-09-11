# Automated Verification for Three Hanging Dots in all AIs
$css = Get-Content -Raw "c:\Users\messi\OneDrive\Desktop\project\css\components.css"
$aiAss = Get-Content -Raw "c:\Users\messi\OneDrive\Desktop\project\js\views\ai-assistant.js"
$aiCop = Get-Content -Raw "c:\Users\messi\OneDrive\Desktop\project\js\components\ai-copilot.js"

$errors = @()

# 1. CSS checks
if (-not $css.Contains('.tz-thinking-bubble')) { $errors += "components.css missing .tz-thinking-bubble" }
if (-not $css.Contains('.tz-dot')) { $errors += "components.css missing .tz-dot" }
if (-not $css.Contains('@keyframes tz-hanging-dot')) { $errors += "components.css missing @keyframes tz-hanging-dot" }

# 2. AI Assistant checks
if (-not $aiAss.Contains('tz-thinking-bubble')) { $errors += "ai-assistant.js missing tz-thinking-bubble" }
if (-not $aiAss.Contains('tz-dot')) { $errors += "ai-assistant.js missing tz-dot" }
if ($aiAss.Contains('Analyzing legal question & intent classification (Tanzania)...')) {
    $errors += "ai-assistant.js still contains legacy text checklist"
}

# 3. AI Copilot checks
if (-not $aiCop.Contains('tz-thinking-bubble')) { $errors += "ai-copilot.js missing tz-thinking-bubble" }
if (-not $aiCop.Contains('tz-dot')) { $errors += "ai-copilot.js missing tz-dot" }
if ($aiCop.Contains('Analyzing legal question & intent classification (Tanzania)...')) {
    $errors += "ai-copilot.js still contains legacy text checklist"
}

if ($errors.Count -eq 0) {
    Write-Host "ALL CHECKS PASSED: Both AI Assistant and AI Copilot now use the three hanging dots bubble!" -ForegroundColor Green
} else {
    Write-Host "ERRORS FOUND:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}
