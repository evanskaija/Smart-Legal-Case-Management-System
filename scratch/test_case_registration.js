const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('SLCMS - Case Registration Record & 6-Step Workflow Verification');
console.log('===============================================================\n');

// 1. Mock Browser Environment
global.window = global;
global.document = {
  getElementById: (id) => ({ value: '', innerHTML: '', innerText: '', style: {} })
};
global.App = {
  openModal: () => {},
  closeModal: () => {},
  showToast: (msg, type) => console.log(`  [Toast ${type || 'info'}]: ${msg}`),
  refreshCurrentView: () => {}
};

// 2. Load Intent Router, State, and CaseRegistrationModal
const routerCode = fs.readFileSync(path.join(__dirname, '../js/services/tanzania-intent-router.js'), 'utf8');
eval(routerCode);

const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
eval(stateCode);

const modalCode = fs.readFileSync(path.join(__dirname, '../js/components/case-registration-modal.js'), 'utf8');
eval(modalCode);

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

// Test 1: Check Jackson Mati v Joseph Jutky presence in SLCMS_STATE.tanzaniaJudgments
const matiCase = SLCMS_STATE.tanzaniaJudgments.find(j => j.title.includes('Jackson Mati') || j.citation.includes('5200'));
assert(!!matiCase, 'Jackson Mati v Joseph Jutky exists in SLCMS_STATE.tanzaniaJudgments');
assert(matiCase && matiCase.citation === '[2026] TZHC 5200', 'Mati case has correct neutral citation [2026] TZHC 5200');
assert(matiCase && matiCase.caseNumber === 'Land Appeal No. 45 of 2024', 'Mati case has correct case number Land Appeal No. 45 of 2024');
assert(matiCase && matiCase.firstPartyRole === 'Appellant' && matiCase.secondPartyRole === 'Respondent', 'Parties recorded with exact legal positions (Appellant & Respondent)');
assert(matiCase && matiCase.primaryCategory === 'Land Law', 'Legal category is Land Law');
assert(matiCase && matiCase.ocrStatus === 'READY_FOR_AI', 'Document is READY_FOR_AI with prepared sections');

// Test 2: Intent Router 12-Field Search finds Jackson Mati
const query1 = TanzaniaIntentRouter.searchAllCaseRecords('Find Jackson Mati');
assert(query1.length > 0 && query1[0].title.includes('Jackson Mati'), 'Search "Find Jackson Mati" returns Jackson Mati v Joseph Jutky');

const query2 = TanzaniaIntentRouter.searchAllCaseRecords('[2026] TZHC 5200');
assert(query2.length > 0 && query2[0].citation.includes('5200'), 'Search by citation "[2026] TZHC 5200" returns matching record');

const query3 = TanzaniaIntentRouter.searchAllCaseRecords('Land Appeal No. 45 of 2024');
assert(query3.length > 0 && query3[0].caseNumber.includes('45 of 2024'), 'Search by case number "Land Appeal No. 45 of 2024" returns matching record');

// Test 3: Case Registration Modal Initialization & Auto-Title Generation
CaseRegistrationModal.open();
assert(CaseRegistrationModal.currentStep === 1, 'Modal initializes at Step 1');
assert(CaseRegistrationModal.formData.country === 'Tanzania', 'Country is automatically set to Tanzania');
assert(CaseRegistrationModal.formData.internalId.startsWith('SLCMS-'), 'Internal document ID is automatically generated');

CaseRegistrationModal.formData.firstPartyName = 'Aloyce Shija';
CaseRegistrationModal.formData.secondPartyName = 'Emanuel Mwita';
CaseRegistrationModal.updateAutoTitle();
assert(CaseRegistrationModal.formData.title === 'Aloyce Shija v Emanuel Mwita', 'Case Title is automatically generated from parties');

// Test 4: Duplicate Prevention Algorithm
// Check citation match
CaseRegistrationModal.formData.citation = '[2026] TZHC 5200';
CaseRegistrationModal.checkForDuplicates();
assert(CaseRegistrationModal.duplicateDetected !== null && CaseRegistrationModal.duplicateDetected.reason.includes('citation'), 'Duplicate detected when citation matches existing record');

// Check Court + Case Number match
CaseRegistrationModal.formData.citation = '[2026] TZHC 9999';
CaseRegistrationModal.formData.court = 'High Court of Tanzania';
CaseRegistrationModal.formData.caseNumber = 'Land Appeal No. 45 of 2024';
CaseRegistrationModal.checkForDuplicates();
assert(CaseRegistrationModal.duplicateDetected !== null && CaseRegistrationModal.duplicateDetected.reason.includes('Case Number'), 'Duplicate detected when Court + Case Number matches');

// Test 5: Guardrail - OCR Status & AI Indexing
CaseRegistrationModal.formData.ocrStatus = 'UPLOADED';
CaseRegistrationModal.formData.fileName = 'Test_Judgment.pdf';
CaseRegistrationModal.formData.title = 'Unique Test Case v Defense';
CaseRegistrationModal.formData.citation = '[2026] TZHC 8888';
CaseRegistrationModal.formData.caseNumber = 'Civil Appeal No. 99 of 2026';
CaseRegistrationModal.duplicateDetected = null;

// Attempting to index while UPLOADED should fail
const countBefore = SLCMS_STATE.tanzaniaJudgments.length;
CaseRegistrationModal.saveAndIndexForAI();
assert(SLCMS_STATE.tanzaniaJudgments.length === countBefore, 'Guardrail: Document cannot be indexed for AI while OCR status is UPLOADED');

// Progress to OCR_REVIEW_REQUIRED
CaseRegistrationModal.formData.ocrStatus = 'OCR_REVIEW_REQUIRED';
CaseRegistrationModal.prepareAIDetailsFromForm();
CaseRegistrationModal.saveAndIndexForAI();
assert(SLCMS_STATE.tanzaniaJudgments.length === countBefore + 1, 'Document successfully saved and indexed after OCR review');
assert(SLCMS_STATE.tanzaniaJudgments[0].ocrStatus === 'READY_FOR_AI', 'Document marked READY_FOR_AI upon confirmed indexing');

console.log(`\n===============================================================`);
console.log(`RESULTS: ${passed}/${total} Tests Passed (${Math.round((passed/total)*100)}%)`);
console.log(`===============================================================`);
