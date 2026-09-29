package com.slcms.controller;

import com.slcms.dto.AccessDeniedResponse;
import com.slcms.model.*;
import com.slcms.repository.CaseAssignmentRepository;
import com.slcms.repository.CaseRecordRepository;
import com.slcms.repository.DocumentRecordRepository;
import com.slcms.service.RBACSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/cases")
@CrossOrigin(originPatterns = "*")
public class CaseAccessController {

    private final RBACSecurityService securityService;
    private final CaseRecordRepository caseRepository;
    private final CaseAssignmentRepository assignmentRepository;
    private final DocumentRecordRepository documentRepository;

    private static CaseRecordRepository staticCaseRepository;
    private static CaseAssignmentRepository staticAssignmentRepository;

    public static String safeText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    public static boolean caseExists(String caseId) {
        if (caseId == null || caseId.trim().isEmpty()) return false;
        String clean = caseId.trim();
        if (staticCaseRepository != null) {
            return staticCaseRepository.existsById(clean) || staticCaseRepository.existsByCaseNumber(clean);
        }
        return false;
    }

    public static boolean isCaseUnassigned(String caseId) {
        if (caseId == null || caseId.trim().isEmpty()) return false;
        String clean = caseId.trim();
        if (staticCaseRepository != null) {
            Optional<CaseRecord> opt = staticCaseRepository.findById(clean);
            if (opt.isEmpty()) opt = staticCaseRepository.findByCaseNumber(clean);
            if (opt.isPresent()) {
                CaseRecord c = opt.get();
                return "UNASSIGNED".equalsIgnoreCase(c.getStatus()) || c.getAssignedUserIds() == null || c.getAssignedUserIds().isEmpty();
            }
        }
        return false;
    }

    public static void assignUserToCase(String caseId, String userId) {
        if (caseId == null || userId == null) return;
        String clean = caseId.trim();
        if (staticCaseRepository != null) {
            Optional<CaseRecord> opt = staticCaseRepository.findById(clean);
            if (opt.isEmpty()) opt = staticCaseRepository.findByCaseNumber(clean);
            if (opt.isPresent()) {
                CaseRecord c = opt.get();
                if (!c.getAssignedUserIds().contains(userId)) {
                    c.getAssignedUserIds().add(userId);
                }
                if ("UNASSIGNED".equalsIgnoreCase(c.getStatus())) {
                    c.setStatus("ACTIVE");
                }
                staticCaseRepository.save(c);
                if (staticAssignmentRepository != null) {
                    String asgId = "asg-" + UUID.randomUUID().toString().substring(0, 8);
                    staticAssignmentRepository.save(new CaseAssignment(asgId, c.getId(), userId, "Assigned Counsel", "admin"));
                }
            }
        }
    }

    @Autowired
    public CaseAccessController(RBACSecurityService securityService,
                                CaseRecordRepository caseRepository,
                                CaseAssignmentRepository assignmentRepository,
                                DocumentRecordRepository documentRepository) {
        this.securityService = securityService;
        this.caseRepository = caseRepository;
        this.assignmentRepository = assignmentRepository;
        this.documentRepository = documentRepository;
        staticCaseRepository = caseRepository;
        staticAssignmentRepository = assignmentRepository;
        seedShowcaseCasesIfEmpty();
    }

    private void seedShowcaseCasesIfEmpty() {
        if (caseRepository.count() == 0) {
            CaseRecord c1 = new CaseRecord("CASE-2025-001", "Criminal Appeal No. 30 of 2021",
                    "Deogratius Peter Shayo v. Republic", "Criminal Law / Sexual Offence", "CRIMINAL",
                    "CLOSED", "Deogratius Peter Shayo", "Court of Appeal of Tanzania", "Adv. Joyce Mercer");
            c1.setRegistry("Dar es Salaam Appellate Registry");
            c1.setLeadCounselId("usr-002");
            c1.setClientId("cli-001");
            c1.setAssignedUserIds(Arrays.asList("usr-001", "usr-002", "usr-003"));
            c1.setSensitive(true);

            CaseRecord c2 = new CaseRecord("CASE-2025-002", "Land Revision No. 31364 of 2024",
                    "Neema Benson Shabani v. Ramadhani Juma Mpanda", "Land Law / Limitation", "LAND",
                    "CLOSED", "Neema Benson Shabani", "High Court of Tanzania (Land Division)", "Adv. David Croft");
            c2.setRegistry("Dar es Salaam Land Registry");
            c2.setLeadCounselId("usr-003");
            c2.setClientId("cli-002");
            c2.setAssignedUserIds(Arrays.asList("usr-001", "usr-003", "usr-004"));
            c2.setSensitive(false);

            CaseRecord c3 = new CaseRecord("CASE-2025-003", "DC Criminal Revision No. 000006375 of 2025",
                    "Peter Thomas Bocco v. Republic", "Criminal Revision / Evidence", "CRIMINAL",
                    "ACTIVE", "Peter Thomas Bocco", "Resident Magistrate Court of Ilala", "Adv. Joyce Mercer");
            c3.setRegistry("Ilala District Registry");
            c3.setLeadCounselId("usr-002");
            c3.setAssignedUserIds(Arrays.asList("usr-001", "usr-002", "usr-005"));
            c3.setSensitive(false);

            CaseRecord c4 = new CaseRecord("CASE-2025-004", "Misc. Civil Application No. 7327 of 2025",
                    "Rogath K. Katende v. CRDB Bank PLC & Others", "Commercial / Banking / Extension of Time", "COMMERCIAL",
                    "ACTIVE", "Rogath K. Katende", "High Court Commercial Division", "Adv. Eleanor Vance");
            c4.setRegistry("Commercial Division Registry");
            c4.setLeadCounselId("usr-002");
            c4.setClientId("cli-003");
            c4.setAssignedUserIds(Arrays.asList("usr-001", "usr-002", "usr-003", "usr-004", "usr-005"));
            c4.setSensitive(false);

            CaseRecord c5 = new CaseRecord("CASE-2025-005", "Tax Appeal No. 18 of 2026",
                    "Tanzania Revenue Authority v. Kilombero Sugar Co. Ltd", "Corporate & Tax Advisory", "TAX",
                    "UNASSIGNED", "Kilombero Sugar Co. Ltd", "Tax Appeals Tribunal of Tanzania", "Unassigned");
            c5.setRegistry("Dar es Salaam Tax Registry");
            c5.setClientId("cli-004");
            c5.setAssignedUserIds(new ArrayList<>());
            c5.setSensitive(false);

            caseRepository.saveAll(Arrays.asList(c1, c2, c3, c4, c5));

            // Seed initial assignments
            assignmentRepository.save(new CaseAssignment("asg-001", "CASE-2025-001", "usr-002", "Lead Counsel", "usr-001"));
            assignmentRepository.save(new CaseAssignment("asg-002", "CASE-2025-001", "usr-003", "Co-Counsel", "usr-001"));
            assignmentRepository.save(new CaseAssignment("asg-003", "CASE-2025-002", "usr-003", "Lead Counsel", "usr-001"));
            assignmentRepository.save(new CaseAssignment("asg-004", "CASE-2025-003", "usr-002", "Lead Counsel", "usr-001"));
            assignmentRepository.save(new CaseAssignment("asg-005", "CASE-2025-004", "usr-002", "Lead Counsel", "usr-001"));
        }
    }

    @GetMapping("/unassigned")
    public ResponseEntity<?> listUnassignedCases() {
        List<CaseRecord> unassigned = caseRepository.findByStatus("UNASSIGNED");
        return ResponseEntity.ok(unassigned);
    }

    @GetMapping
    public ResponseEntity<?> listCases(@RequestHeader(value = "X-User-Email", required = false) String userEmail,
                                       @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader) {
        List<CaseRecord> allCases = caseRepository.findAll();

        if (userEmail == null || userEmail.trim().isEmpty()) {
            // Default showcase return for open UI view
            return ResponseEntity.ok(allCases);
        }

        Optional<UserAccount> userOpt = securityService.findUserByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(allCases);
        }

        UserAccount user = userOpt.get();
        if (user.getRole() == UserRole.ADMINISTRATOR || user.getRole() == UserRole.SYSTEM_ADMINISTRATOR || user.getRole() == UserRole.MANAGING_PARTNER) {
            return ResponseEntity.ok(allCases);
        }

        List<CaseRecord> filtered = new ArrayList<>();
        for (CaseRecord c : allCases) {
            if (c.getAssignedUserIds() != null && (c.getAssignedUserIds().contains(user.getId()) || c.getAssignedUserIds().contains(user.getStaffId()))) {
                filtered.add(c);
            } else if (user.getAssignedCaseIds() != null && user.getAssignedCaseIds().contains(c.getId())) {
                filtered.add(c);
            }
        }
        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/{caseId}")
    public ResponseEntity<?> getCaseDetails(@PathVariable String caseId,
                                            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Optional<CaseRecord> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            caseOpt = caseRepository.findByCaseNumber(caseId);
        }
        if (caseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Case not found"));
        }
        return ResponseEntity.ok(caseOpt.get());
    }

    @Autowired(required = false)
    private com.slcms.repository.ClientRepository clientRepository;

    @PostMapping({"", "/create"})
    public ResponseEntity<?> createCase(@RequestBody Map<String, Object> payload,
                                        @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        // ==========================================
        // STEP 1: CASE INFORMATION VALIDATION
        // ==========================================

        // 1. Case Title: 5–200 characters; letters, numbers, spaces and normal punctuation only
        String rawTitle = (String) (payload.get("caseTitle") != null ? payload.get("caseTitle") : payload.get("title"));
        if (rawTitle == null || rawTitle.trim().length() < 5 || rawTitle.trim().length() > 200) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Title must be between 5 and 200 characters."));
        }
        String cleanTitle = rawTitle.trim();
        if (!cleanTitle.matches("^[a-zA-Z0-9\\s.,'\"`:;()\\-–—?!]+$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Title contains invalid characters. Use letters, numbers, spaces, and normal punctuation only."));
        }
        if (!cleanTitle.matches(".*[a-zA-Z0-9].*")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Title must contain letters or numbers."));
        }
        if (!cleanTitle.contains(" ") && !cleanTitle.contains(".")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Title must contain a full caption with multiple words (e.g. \"Kilombero Sugar v Mara Logistics\")."));
        }
        if (!cleanTitle.matches(".*[aeiouAEIOU].*")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Title must contain valid legal party names (cannot be random consonants)."));
        }

        // 2. Case Number: Required; must be unique
        String rawCaseNumber = (String) payload.get("caseNumber");
        if (rawCaseNumber == null || rawCaseNumber.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Number is required."));
        }
        String cleanCaseNumber = rawCaseNumber.trim();
        if (cleanCaseNumber.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Number must be at least 4 characters long."));
        }
        if (!cleanCaseNumber.matches(".*\\d.*")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Number must contain official court docket digits or reference numbers (e.g. \"CV/2026/0142\" or \"No. 69 of 2018\")."));
        }
        if (caseRepository.existsByCaseNumber(cleanCaseNumber)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Number \"" + cleanCaseNumber + "\" already exists. Case numbers must be unique."));
        }

        // 3. Case Type: Select: Civil, Criminal, Land, Matrimonial, Probate, Commercial or Other
        String rawCaseType = (String) (payload.get("caseType") != null ? payload.get("caseType") : payload.get("category"));
        if (rawCaseType == null || rawCaseType.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Case Type is required."));
        }
        String cleanTypeInput = rawCaseType.trim().toUpperCase();
        Map<String, String> validCaseTypes = Map.of(
            "CIVIL", "Civil",
            "CRIMINAL", "Criminal",
            "LAND", "Land",
            "MATRIMONIAL", "Matrimonial",
            "PROBATE", "Probate",
            "COMMERCIAL", "Commercial",
            "OTHER", "Other"
        );
        if (!validCaseTypes.containsKey(cleanTypeInput)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid Case Type. Select: Civil, Criminal, Land, Matrimonial, Probate, Commercial or Other."));
        }
        String normalizedCaseType = validCaseTypes.get(cleanTypeInput);

        // 4. Court: Required
        String rawCourt = (String) payload.get("court");
        if (rawCourt == null || rawCourt.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Court is required."));
        }
        String cleanCourt = rawCourt.trim();

        // 5. Decision Date: Cannot be a future date for a decided judgment
        // Automatically obtain the decision year from the decision date
        String decisionDate = (String) payload.get("decisionDate");
        String decisionYear = String.valueOf(Calendar.getInstance().get(Calendar.YEAR));
        if (decisionDate != null && !decisionDate.trim().isBlank()) {
            try {
                java.time.LocalDate parsedDate = java.time.LocalDate.parse(decisionDate.trim());
                if (parsedDate.isAfter(java.time.LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Decision Date cannot be a future date for a decided judgment."));
                }
                decisionYear = String.valueOf(parsedDate.getYear());
            } catch (java.time.format.DateTimeParseException e) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Decision Date must be in YYYY-MM-DD format."));
            }
        }

        // 6. Citation: Optional; must be unique when provided
        String rawCitation = (String) payload.get("citation");
        String cleanCitation = null;
        if (rawCitation != null && !rawCitation.trim().isBlank()) {
            cleanCitation = rawCitation.trim();
            if (caseRepository.existsByCitation(cleanCitation)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Citation \"" + cleanCitation + "\" is already registered on another matter. Citations must be unique when provided."));
            }
        }

        // ==========================================
        // STEP 2: PARTIES AND CLIENT VALIDATION
        // ==========================================

        // Party Name Helper Validation: 2–150 characters; letters, spaces, apostrophes, hyphens and dots; no numbers only; valid syllables
        java.util.function.Predicate<String> isValidPartyName = name -> {
            if (name == null) return false;
            String t = name.trim();
            if (t.length() < 2 || t.length() > 150) return false;
            if (!t.matches("^[a-zA-Z\\s.'’\\-]+$")) return false;
            if (!t.matches(".*[a-zA-Z].*")) return false;
            if (!t.matches(".*[aeiouAEIOU].*") && !t.matches("(?i).*(ltd|plc|co|inc|corp|bank|rep).*")) return false;
            if (t.matches("(?i).*[bcdfghjklmnpqrstvwxyz]{5,}.*")) return false;
            return true;
        };

        // First Party
        String rawP1Name = (String) payload.get("firstPartyName");
        String rawP1Role = (String) payload.get("firstPartyRole");
        if ((rawP1Name == null || rawP1Name.isBlank()) && payload.get("firstParty") instanceof Map) {
            Map<?, ?> p1Map = (Map<?, ?>) payload.get("firstParty");
            rawP1Name = (String) p1Map.get("name");
            rawP1Role = (String) p1Map.get("role");
        }
        if (rawP1Name == null || !isValidPartyName.test(rawP1Name)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "First party name must be 2–150 characters (letters, spaces, apostrophes, hyphens and dots only; cannot be made only of numbers)."));
        }
        if (rawP1Role == null || rawP1Role.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "First party role is required."));
        }
        String cleanP1Name = rawP1Name.trim();
        String cleanP1Role = rawP1Role.trim();

        // Second Party
        String rawP2Name = (String) payload.get("secondPartyName");
        String rawP2Role = (String) payload.get("secondPartyRole");
        if ((rawP2Name == null || rawP2Name.isBlank()) && payload.get("secondParty") instanceof Map) {
            Map<?, ?> p2Map = (Map<?, ?>) payload.get("secondParty");
            rawP2Name = (String) p2Map.get("name");
            rawP2Role = (String) p2Map.get("role");
        }
        if (rawP2Name == null || !isValidPartyName.test(rawP2Name)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Second party name must be 2–150 characters (letters, spaces, apostrophes, hyphens and dots only; cannot be made only of numbers)."));
        }
        if (rawP2Role == null || rawP2Role.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Second party role is required."));
        }
        String cleanP2Name = rawP2Name.trim();
        String cleanP2Role = rawP2Role.trim();

        // First and second parties cannot have identical names and roles
        if (cleanP1Name.equalsIgnoreCase(cleanP2Name) && cleanP1Role.equalsIgnoreCase(cleanP2Role)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "First and second parties cannot have identical names and roles."));
        }

        // Selected roles must fit the case:
        // appeal: Appellant and Respondent;
        // criminal trial: Republic and Accused;
        // civil trial: Plaintiff and Defendant;
        // application: Applicant and Respondent.
        boolean isAppeal = cleanCaseNumber.toLowerCase().contains("appeal") || cleanTitle.toLowerCase().contains("appeal");
        boolean isApplication = cleanCaseNumber.toLowerCase().contains("application") || cleanTitle.toLowerCase().contains("application");
        List<String> validRoles;
        if (isAppeal) {
            validRoles = List.of("APPELLANT", "RESPONDENT", "INTERESTED PARTY");
        } else if (isApplication) {
            validRoles = List.of("APPLICANT", "RESPONDENT", "INTERESTED PARTY");
        } else {
            switch (cleanTypeInput) {
                case "CRIMINAL":
                    validRoles = List.of("REPUBLIC", "ACCUSED", "COMPLAINANT", "APPELLANT", "RESPONDENT", "INTERESTED PARTY");
                    break;
                case "MATRIMONIAL":
                    validRoles = List.of("PETITIONER", "RESPONDENT", "APPLICANT", "APPELLANT", "INTERESTED PARTY");
                    break;
                case "PROBATE":
                    validRoles = List.of("PETITIONER", "RESPONDENT", "OBJECTOR", "APPLICANT", "APPELLANT", "INTERESTED PARTY");
                    break;
                case "CIVIL":
                case "COMMERCIAL":
                case "LAND":
                default:
                    validRoles = List.of("PLAINTIFF", "DEFENDANT", "CLAIMANT", "APPELLANT", "RESPONDENT", "APPLICANT", "INTERESTED PARTY");
                    break;
            }
        }
        if (!validRoles.contains(cleanP1Role.toUpperCase())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Selected role \"" + cleanP1Role + "\" does not fit a " + normalizedCaseType + " case."));
        }
        if (!validRoles.contains(cleanP2Role.toUpperCase())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Selected role \"" + cleanP2Role + "\" does not fit a " + normalizedCaseType + " case."));
        }

        // Related Client: Must exist in the Clients table
        String rawClient = (String) (payload.get("clientName") != null ? payload.get("clientName") : payload.get("client"));
        String rawClientId = (String) payload.get("clientId");
        if (rawClient == null || rawClient.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Related client is required and must exist in the Clients table."));
        }
        String cleanClient = rawClient.trim();
        String resolvedClientId = rawClientId != null ? rawClientId.trim() : null;

        if (clientRepository != null) {
            boolean clientExists = false;
            if (resolvedClientId != null && !resolvedClientId.isEmpty()) {
                clientExists = clientRepository.existsById(resolvedClientId);
            }
            if (!clientExists) {
                clientExists = clientRepository.existsByNameIgnoreCase(cleanClient);
            }
            if (!clientExists) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Related client \"" + cleanClient + "\" must exist in the Clients table."));
            }
        }

        // Priority: Low, Medium, High or Urgent (default: Medium)
        String rawPriority = (String) payload.get("priority");
        String normalizedPriority = "Medium";
        if (rawPriority != null && !rawPriority.trim().isBlank()) {
            String pUpper = rawPriority.trim().toUpperCase();
            if (List.of("LOW", "MEDIUM", "HIGH", "URGENT").contains(pUpper)) {
                normalizedPriority = pUpper.charAt(0) + pUpper.substring(1).toLowerCase();
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Priority must be Low, Medium, High or Urgent."));
            }
        }

        // ==========================================
        // AUTOMATIC SYSTEM VALUES
        // ==========================================
        // Internal case ID: generated
        String internalCaseId = "CASE-" + Calendar.getInstance().get(Calendar.YEAR) + "-" + String.format("%03d", (int)(caseRepository.count() + 1));
        // Status: Open
        String status = "Open";
        // Assignment status: Unassigned
        String leadCounsel = "Unassigned";
        // Created by: Logged-in user
        String createdByUser = (userEmail != null && !userEmail.isBlank()) ? userEmail.trim() : "System Administrator";
        if (securityService != null && userEmail != null) {
            securityService.findUserByEmail(userEmail).ifPresent(u -> {
                // optionally grab display name
            });
        }

        CaseRecord c = new CaseRecord(internalCaseId, cleanCaseNumber, cleanTitle, normalizedCaseType, normalizedCaseType, status, cleanClient, cleanCourt, leadCounsel);
        c.setRegistry(safeText((String) payload.get("registry"), "Main Registry"));
        c.setClientId(resolvedClientId);
        c.setDecisionDate(decisionDate != null ? decisionDate.trim() : null);
        c.setDecisionYear(decisionYear);
        c.setCitation(cleanCitation);
        c.setPriority(normalizedPriority);
        c.setFirstPartyName(cleanP1Name);
        c.setFirstPartyRole(cleanP1Role);
        c.setSecondPartyName(cleanP2Name);
        c.setSecondPartyRole(cleanP2Role);
        c.setOpposingParty(cleanP2Name + " (" + cleanP2Role + ")");
        c.setCreatedBy(createdByUser);
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());

        // File metadata if uploaded in Step 3
        String docFilename = (String) payload.get("documentFilename");
        String docStoragePath = (String) payload.get("documentStoragePath");
        String ocrStatus = (String) payload.get("ocrStatus");
        if (docFilename != null && !docFilename.trim().isBlank()) {
            c.setDocumentFilename(docFilename.trim());
        }
        if (docStoragePath != null && !docStoragePath.trim().isBlank()) {
            c.setDocumentStoragePath(docStoragePath.trim());
        }
        if (ocrStatus != null && !ocrStatus.trim().isBlank()) {
            c.setOcrStatus(ocrStatus.trim());
        }

        if (payload.get("isSensitive") != null) {
            c.setSensitive(Boolean.TRUE.equals(payload.get("isSensitive")));
        }

        CaseRecord saved = caseRepository.save(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{caseId}/assign")
    public ResponseEntity<?> assignCase(@PathVariable String caseId,
                                        @RequestBody Map<String, String> payload,
                                        @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Optional<CaseRecord> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            caseOpt = caseRepository.findByCaseNumber(caseId);
        }
        if (caseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Case not found"));
        }

        CaseRecord c = caseOpt.get();
        String userId = payload.get("userId");
        String counselName = payload.get("leadCounsel");
        String role = payload.getOrDefault("role", "Assigned Lawyer");

        if (userId != null && !userId.isBlank()) {
            if (!c.getAssignedUserIds().contains(userId)) {
                c.getAssignedUserIds().add(userId);
            }
            if ("UNASSIGNED".equalsIgnoreCase(c.getStatus())) {
                c.setStatus("ACTIVE");
            }
            if (counselName != null && !counselName.isBlank()) {
                c.setLeadCounsel(counselName);
                c.setLeadCounselId(userId);
            }
            caseRepository.save(c);

            String asgId = "asg-" + UUID.randomUUID().toString().substring(0, 8);
            assignmentRepository.save(new CaseAssignment(asgId, c.getId(), userId, role, userEmail != null ? userEmail : "admin"));
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Case assigned successfully", "caseId", c.getId(), "assignedTo", userId));
    }

    @PostMapping("/{caseId}/close")
    public ResponseEntity<?> closeCase(@PathVariable String caseId) {
        Optional<CaseRecord> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            caseOpt = caseRepository.findByCaseNumber(caseId);
        }
        if (caseOpt.isPresent()) {
            CaseRecord c = caseOpt.get();
            c.setStatus("CLOSED");
            c.setUpdatedAt(LocalDateTime.now());
            caseRepository.save(c);
            return ResponseEntity.ok(Map.of("message", "Case closed and archived successfully in MySQL", "caseId", caseId));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Case not found"));
    }
}
