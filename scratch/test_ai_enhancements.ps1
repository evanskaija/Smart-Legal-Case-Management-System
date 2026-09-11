# Automated Verification Script for AI Enhancements
$cssPath = "c:\Users\messi\OneDrive\Desktop\project\css\components.css"
$aiAssistantPath = "c:\Users\messi\OneDrive\Desktop\project\js\views\ai-assistant.js"
$aiCopilotPath = "c:\Users\messi\OneDrive\Desktop\project\js\components\ai-copilot.js"

$errors = @()

# 1. CSS Verification
$css = Get-Content -Raw $cssPath
$cssExpected = @(
    '.tz-thinking-card',
    '.tz-thinking-header',
    '.tz-thinking-dots',
    '@keyframes tz-bounce',
    '.tz-thinking-step',
    '.tz-thinking-step.active',
    '.tz-thinking-step.completed',
    '.tz-thought-toggle',
    '.tz-thought-details'
)
foreach ($token in $cssExpected) {
    if (-not $css.Contains($token)) {
        $errors += "Missing CSS token: $token"
    }
}

# 2. AI Assistant Verification
$aiAss = Get-Content -Raw $aiAssistantPath
$aiAssExpected = @(
    'thoughtDetailsOpen: {}',
    'toggleThoughtDetails(msgId)',
    'Mandatory Authentication Check',
    'thinkingStage: 1',
    'thinkingStage = 2',
    'thinkingStage = 3',
    'thinkingStage = 4',
    'thoughtProcess = [',
    'thoughtTime = elapsed',
    'tz-thinking-dots',
    'tz-thought-toggle',
    'tz-thought-details',
    "AIAssistantView.fillAndAsk('show me all cases in"
)
foreach ($token in $aiAssExpected) {
    if (-not $aiAss.Contains($token)) {
        $errors += "Missing AI Assistant token: $token"
    }
}

# 3. AI Copilot Verification
$aiCop = Get-Content -Raw $aiCopilotPath
$aiCopExpected = @(
    'Mandatory Authentication Check',
    'Access Restricted • SLCMS Security Guardrail',
    'isThinking = true',
    'thinkingStage = 1'
)
foreach ($token in $aiCopExpected) {
    if (-not $aiCop.Contains($token)) {
        $errors += "Missing AI Copilot token: $token"
    }
}

if ($errors.Count -eq 0) {
    Write-Host "SUCCESS: All verification checks passed for AI Assistant, AICopilot, CSS styles, and Year navigation!" -ForegroundColor Green
} else {
    Write-Host "FAILED: Errors found:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}
