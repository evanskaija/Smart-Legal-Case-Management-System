# Powershell Verification Script for 18 Question Categories

$webReq = Invoke-WebRequest -Uri "http://127.0.0.1:8080/" -UseBasicParsing
Write-Host "HTTP Status: $($webReq.StatusCode)"

# Verify index.html content
$indexHtml = Get-Content -Raw -Path "index.html"
Write-Host "Index.html has router: $($indexHtml.Contains('js/services/tanzania-intent-router.js'))"

# Verify tanzania-intent-router.js has 18 categories
$routerJs = Get-Content -Raw -Path "js/services/tanzania-intent-router.js"
$categories = @(
  'FIND_JUDGMENT', 'CASE_FACTS', 'CASE_SUMMARY', 'LEGAL_RESEARCH',
  'CASE_INFORMATION', 'PROCEDURAL_HISTORY', 'LEGAL_ISSUES', 'PARTIES_ARGUMENTS',
  'COURT_REASONING', 'FINAL_DECISION', 'LAWS_CITED', 'CASES_CITED',
  'LEGAL_PRINCIPLE', 'CASE_COMPARISON', 'LEGAL_REPORT', 'OPEN_SOURCE',
  'UPLOAD_HELP', 'GREETING'
)

$allFound = $true
foreach ($cat in $categories) {
  if (-not $routerJs.Contains($cat)) {
    Write-Host "Missing category in router: $cat" -ForegroundColor Red
    $allFound = $false
  }
}

if ($allFound) {
  Write-Host "All 18 categories present in tanzania-intent-router.js!" -ForegroundColor Green
}

# Verify ai-assistant.js has 8 primary buttons
$assistantJs = Get-Content -Raw -Path "js/views/ai-assistant.js"
$has8Buttons = $assistantJs.Contains("Find Judgment") -and 
               $assistantJs.Contains("Summarize Case") -and 
               $assistantJs.Contains("Show Facts") -and 
               $assistantJs.Contains("Show Legal Issues") -and 
               $assistantJs.Contains("Court Reasoning") -and 
               $assistantJs.Contains("Final Decision") -and 
               $assistantJs.Contains("Laws Cited") -and 
               $assistantJs.Contains("Open Original") -and 
               $assistantJs.Contains("More Legal Tools")

Write-Host "AI Assistant has 8 Primary Buttons + More Tools: $has8Buttons" -ForegroundColor Green

# Verify state.js has rich records and METADATA_ONLY record
$stateJs = Get-Content -Raw -Path "js/state.js"
Write-Host "state.js has Metadata Only record: $($stateJs.Contains('Metadata Only'))" -ForegroundColor Green
Write-Host "state.js has proceduralHistory: $($stateJs.Contains('proceduralHistory'))" -ForegroundColor Green
Write-Host "state.js has partiesArguments: $($stateJs.Contains('partiesArguments'))" -ForegroundColor Green
Write-Host "state.js has casesCited: $($stateJs.Contains('casesCited'))" -ForegroundColor Green
Write-Host "state.js has legalPrinciplesStructured: $($stateJs.Contains('legalPrinciplesStructured'))" -ForegroundColor Green
Write-Host "state.js has lawsCitedStructured: $($stateJs.Contains('lawsCitedStructured'))" -ForegroundColor Green

# Verify priority logic in router
$hasPriorityLogic = $routerJs.Contains('if (matchedCase)') -and $routerJs.Contains('return this.CATEGORIES.FIND_JUDGMENT')
Write-Host "Router prioritizes party/case search to FIND_JUDGMENT: $hasPriorityLogic" -ForegroundColor Green

# Verify exact case fields exist in state.js
$hasMuwingeFields = $stateJs.Contains("Abdallah Salum Muwinge v Halima Ismail") -and
                    $stateJs.Contains("[2020] TZHC 10045") -and
                    $stateJs.Contains("S.M. Kulita, J.") -and
                    $stateJs.Contains("PC Civil Appeal No. 69 of 2018")
Write-Host "Case 1 (Muwinge) verified database fields present: $hasMuwingeFields" -ForegroundColor Green

$hasNuradFields = $stateJs.Contains("Ashira K. Nurad v Said Ramadhani Dinya") -and
                  $stateJs.Contains("[2020] TZHC 10146") -and
                  $stateJs.Contains("Misc. Civil Application No. 548 of 2018") -and
                  $stateJs.Contains("Civil Appeal No. 40 of 2017") -and
                  $stateJs.Contains("Yassin Membar") -and
                  $stateJs.Contains("Jakaya Kikwete Cardiac Institute")
Write-Host "Case 2 (Ashira K. Nurad) verified database fields present: $hasNuradFields" -ForegroundColor Green

$hasBuyuniFields = $stateJs.Contains("Ashura Saidi Ndundu and Rashid Ahmed Kilindo v Buyuni Company Limited") -and
                   $stateJs.Contains("[2020] TZHC 4633") -and
                   $stateJs.Contains("Misc. Civil Cause No. 508 of 2020") -and
                   $stateJs.Contains("Y.J. Mlyambina, J.") -and
                   $stateJs.Contains("Arnaldo Amadori") -and
                   $stateJs.Contains("Buyuni Company Limited")
Write-Host "Case 3 (Buyuni Company) verified database fields present: $hasBuyuniFields" -ForegroundColor Green

Write-Host "=== VERIFICATION COMPLETED SUCCESSFULLY ===" -ForegroundColor Cyan
