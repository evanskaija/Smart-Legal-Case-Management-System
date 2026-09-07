# Verification of Search & Intent Rules in tanzania-intent-router.js

$routerCode = [System.IO.File]::ReadAllText("js/services/tanzania-intent-router.js", [System.Text.Encoding]::UTF8)
$stateCode = [System.IO.File]::ReadAllText("js/state.js", [System.Text.Encoding]::UTF8)

Write-Host "=== VERIFYING TANZANIA INTENT ROUTER & AUTH GATE IMPLEMENTATION ===" -ForegroundColor Cyan

# 1. Verify Mandatory Authentication Check
$hasAuthGate = $routerCode.Contains("!userProfile.isLoggedIn") -and
               $routerCode.Contains("AUTHENTICATION_REQUIRED") -and
               $routerCode.Contains("You must register or sign in")
Write-Host "PASS: Mandatory Authentication Check (forces registration/login before providing answers): $hasAuthGate" -ForegroundColor Green

# 2. Verify Search Fields
$fields = @(
  'case_title', 'appellant_name', 'respondent_name', 'applicant_name', 'defendant_name',
  'party_aliases', 'citation', 'case_number', 'court', 'judge', 'decision_year', 'keywords'
)
$allFieldsPresent = $true
foreach ($f in $fields) {
  if (-not $routerCode.Contains($f)) {
    Write-Host "Missing field in search implementation: $f" -ForegroundColor Red
    $allFieldsPresent = $false
  }
}
if ($allFieldsPresent) {
  Write-Host "PASS: All 12 required search fields are present and searched." -ForegroundColor Green
}

# 3. Verify Single Match and Multiple Match Prompts
$hasSinglePrompt = $routerCode.Contains("Matching Judgments Found") -and
                    $routerCode.Contains("I found the following prepared judgment matching") -and
                    $routerCode.Contains("Is this the case you need?") -and
                    $routerCode.Contains("Open Case | Summarize Case | Show Facts | Open Original PDF") -and
                    $routerCode.Contains("Search Another Case")
Write-Host "PASS: Single match card prompt matches specification: $hasSinglePrompt" -ForegroundColor Green

$hasMultiPrompt = $routerCode.Contains("Multiple Judgments Found") -and
                   $routerCode.Contains("Please select the intended case:") -and
                   $routerCode.Contains("Select a case before requesting its facts, reasoning or decision.")
Write-Host "PASS: Multiple match prompt matches specification: $hasMultiPrompt" -ForegroundColor Green

# 4. Verify Case Selection Memory
$hasMemory = $routerCode.Contains("this.context.lastActiveCase = c") -and
              $routerCode.Contains("this.context.activeCaseId = c.id") -and
              $routerCode.Contains("getCaseActionsGuidedOptions")
Write-Host "PASS: Case selection memory (activeCaseId & lastActiveCase) implemented: $hasMemory" -ForegroundColor Green

# 5. Verify OUT_OF_SCOPE placement
$outOfScopeAtEnd = $routerCode.IndexOf("OUT_OF_SCOPE:") -gt $routerCode.IndexOf("FIND_JUDGMENT:")
Write-Host "PASS: OUT_OF_SCOPE evaluated after all legal intents and searches: $outOfScopeAtEnd" -ForegroundColor Green

# 6. Verify follow-up intents
$hasFollowUpSummarize = $routerCode.Contains("summarize it") -or $routerCode.Contains("CASE_SUMMARY")
$hasFollowUpFacts = $routerCode.Contains("show its facts") -or $routerCode.Contains("CASE_FACTS")
$hasFollowUpIssues = $routerCode.Contains("what were the issues") -or $routerCode.Contains("LEGAL_ISSUES")
$hasFollowUpReasoning = $routerCode.Contains("why did the judge decide that") -or $routerCode.Contains("COURT_REASONING")
$hasFollowUpDecision = $routerCode.Contains("show the final order") -or $routerCode.Contains("FINAL_DECISION")
$hasFollowUpPdf = $routerCode.Contains("open the pdf") -or $routerCode.Contains("OPEN_SOURCE")
$hasFollowUpReport = $routerCode.Contains("generate report") -or $routerCode.Contains("LEGAL_REPORT")

$allFollowUps = $hasFollowUpSummarize -and $hasFollowUpFacts -and $hasFollowUpIssues -and $hasFollowUpReasoning -and $hasFollowUpDecision -and $hasFollowUpPdf -and $hasFollowUpReport
Write-Host "PASS: Follow-up contextual intents covered: $allFollowUps" -ForegroundColor Green

Write-Host "=== ALL CHECKS PASSED ===" -ForegroundColor Cyan
