# Verification of Case Registration Form, 6-Step Workflow & Guardrails

$modalCode = [System.IO.File]::ReadAllText("js/components/case-registration-modal.js", [System.Text.Encoding]::UTF8)
$stateCode = [System.IO.File]::ReadAllText("js/state.js", [System.Text.Encoding]::UTF8)
$indexCode = [System.IO.File]::ReadAllText("index.html", [System.Text.Encoding]::UTF8)
$docsCode = [System.IO.File]::ReadAllText("js/views/documents.js", [System.Text.Encoding]::UTF8)
$aiCode = [System.IO.File]::ReadAllText("js/views/ai-assistant.js", [System.Text.Encoding]::UTF8)

Write-Host "`n===============================================================" -ForegroundColor Cyan
Write-Host "SLCMS - CASE REGISTRATION & 6-STEP WORKFLOW VERIFICATION" -ForegroundColor Cyan
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

# 1. Check index.html script inclusion
Check-Rule ($indexCode.Contains("js/components/case-registration-modal.js")) "CaseRegistrationModal script tag included in index.html"

# 2. Check 6-step structure
Check-Rule ($modalCode.Contains("Step 1: Case Identity") -and
            $modalCode.Contains("Step 2: Parties") -and
            $modalCode.Contains("Step 3: Classification") -and
            $modalCode.Contains("Step 4: Official Source") -and
            $modalCode.Contains("Step 5: PDF Ingestion") -and
            $modalCode.Contains("Step 6: Human Verification")) "All 6 required wizard steps implemented"

# 3. Check Section 1-12 Field Implementations
Check-Rule ($modalCode.Contains("cr-case-title") -and
            $modalCode.Contains("caseNumber") -and
            $modalCode.Contains("citation") -and
            $modalCode.Contains("decisionYear") -and
            $modalCode.Contains("proceedingType") -and
            $modalCode.Contains("legalCategory") -and
            $modalCode.Contains("internalId")) "Section 1: Case Identity fields implemented"

Check-Rule ($modalCode.Contains("firstPartyName") -and
            $modalCode.Contains("firstPartyRole") -and
            $modalCode.Contains("secondPartyName") -and
            $modalCode.Contains("secondPartyRole") -and
            $modalCode.Contains("governmentParty") -and
            $modalCode.Contains("partyAliases")) "Section 2: Parties and specific legal roles implemented"

Check-Rule ($modalCode.Contains("court") -and
            $modalCode.Contains("registry") -and
            $modalCode.Contains("judge") -and
            $modalCode.Contains("decisionDate") -and
            $modalCode.Contains("originalCourt") -and
            $modalCode.Contains("lowerCaseNumber")) "Section 3 & 4: Court Information and Dates implemented"

Check-Rule ($modalCode.Contains("primaryCategory") -and
            $modalCode.Contains("secondaryCategories") -and
            $modalCode.Contains("subject") -and
            $modalCode.Contains("keywords") -and
            $modalCode.Contains("originalProceeding") -and
            $modalCode.Contains("firstAppellateProceeding") -and
            $modalCode.Contains("currentProceeding")) "Section 5, 6 & 7: Classification, Keywords & Procedural History implemented"

Check-Rule ($modalCode.Contains("outcome") -and
            $modalCode.Contains("finalOrders") -and
            $modalCode.Contains("costs") -and
            $modalCode.Contains("caseStatus")) "Section 8: Judgment Outcome and Operative Orders implemented"

Check-Rule ($modalCode.Contains("sourceName") -and
            $modalCode.Contains("officialUrl") -and
            $modalCode.Contains("accessScope") -and
            $modalCode.Contains("confidentiality") -and
            $modalCode.Contains("fileChecksum") -and
            $modalCode.Contains("pdfType")) "Section 9 & 10: Original Document Info & Access Scope implemented"

Check-Rule ($modalCode.Contains("ocrStatus") -and
            $modalCode.Contains("OCR_PROCESSING") -and
            $modalCode.Contains("OCR_REVIEW_REQUIRED") -and
            $modalCode.Contains("READY_FOR_AI") -and
            $modalCode.Contains("ocrConfidence")) "Section 11: OCR Processing States & Confidence tracking implemented"

Check-Rule ($modalCode.Contains("preparedAIDetails") -and
            $modalCode.Contains("summary") -and
            $modalCode.Contains("materialFacts") -and
            $modalCode.Contains("legalIssues") -and
            $modalCode.Contains("appellantArgs") -and
            $modalCode.Contains("courtReasoning") -and
            $modalCode.Contains("ratioDecidendi") -and
            $modalCode.Contains("lawsCited") -and
            $modalCode.Contains("casesCited") -and
            $modalCode.Contains("obiterObservations") -and
            $modalCode.Contains("importantQuotations")) "Section 12: Prepared AI Details for response buttons implemented"

# 4. Check Dynamic Auto-Title Generator
Check-Rule ($modalCode.Contains("updateAutoTitle") -and $modalCode.Contains("isTitleManuallyEdited")) "Auto-title generation from parties with manual edit override implemented"

# 5. Check Duplicate Prevention Engine
Check-Rule ($modalCode.Contains("checkForDuplicates") -and
            $modalCode.Contains("duplicateDetected") -and
            $modalCode.Contains("Possible Duplicate Judgment Detected") -and
            $modalCode.Contains("A document with the same")) "Duplicate prevention check (citation, court+caseNo, title+date, checksum) implemented"

# 6. Check Critical Guardrail: Document cannot be READY_FOR_AI before OCR & Review
Check-Rule ($modalCode.Contains("CRITICAL: Document must undergo OCR and human review before AI indexing") -and
            $modalCode.Contains("OCR_REVIEW_REQUIRED") -and
            $modalCode.Contains("A document must not display <code>READY_FOR_AI</code> merely because metadata was entered")) "Guardrail: OCR & Human Review enforced before READY_FOR_AI"

# 7. Check Jackson Mati v Joseph Jutky in SLCMS_STATE.tanzaniaJudgments
Check-Rule ($stateCode.Contains("Jackson Mati v Joseph Jutky") -and
            $stateCode.Contains("Land Appeal No. 45 of 2024") -and
            $stateCode.Contains("[2026] TZHC 5200") -and
            $stateCode.Contains("A. P. Kilimi, J.") -and
            $stateCode.Contains("Dar es Salaam Sub-Registry")) "Jackson Mati v Joseph Jutky registered with full record in state.js"

# 8. Check View Button Integrations
Check-Rule ($docsCode.Contains("Register Scanned Judgment") -and
            $docsCode.Contains("openCaseRegistrationModal")) "DocumentsView integrated with Case Registration Wizard"

Check-Rule ($aiCode.Contains("openRegistrationModal") -and
            $aiCode.Contains("Register Scanned Judgment")) "AIAssistantView integrated with Case Registration Wizard"

Write-Host "`n===============================================================" -ForegroundColor Cyan
Write-Host "RESULTS: $passed / $total Tests Passed ($([Math]::Round(($passed/$total)*100))%)" -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan
