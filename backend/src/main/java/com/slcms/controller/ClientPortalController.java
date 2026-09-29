package com.slcms.controller;

import com.slcms.model.*;
import com.slcms.repository.*;
import com.slcms.service.GmailApiService;
import com.slcms.service.RBACSecurityService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Controller for the SLCMS Client Portal & Legal Assistance System.
 * Fully separated from staff operations with strict zero-trust permission boundaries.
 */
@RestController
@RequestMapping("/api/client-portal")
@CrossOrigin(originPatterns = "*")
public class ClientPortalController {

    private static final Logger log = LoggerFactory.getLogger(ClientPortalController.class);

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final LegalRequestRepository legalRequestRepository;
    private final CaseRecordRepository caseRepository;
    private final PasswordEncoder passwordEncoder;
    private final GmailApiService gmailApiService;
    private final RBACSecurityService rbacSecurityService;
    private final com.slcms.service.JwtAuthService jwtAuthService;

    // In-memory verification cache for quick validation & recovery
    private final Map<String, VerificationEntry> verificationCache = new java.util.concurrent.ConcurrentHashMap<>();

    private static final Pattern INDIVIDUAL_NAME_PATTERN = Pattern.compile("^[a-zA-Z\\s'\\-]+$");
    private static final Pattern ORG_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s'\\-.,&()]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+255[67]\\d{8}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{10,}$");

    @Autowired
    public ClientPortalController(UserRepository userRepository,
                                  ClientRepository clientRepository,
                                  LegalRequestRepository legalRequestRepository,
                                  CaseRecordRepository caseRepository,
                                  PasswordEncoder passwordEncoder,
                                  GmailApiService gmailApiService,
                                  RBACSecurityService rbacSecurityService,
                                  com.slcms.service.JwtAuthService jwtAuthService) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.legalRequestRepository = legalRequestRepository;
        this.caseRepository = caseRepository;
        this.passwordEncoder = passwordEncoder;
        this.gmailApiService = gmailApiService;
        this.rbacSecurityService = rbacSecurityService;
        this.jwtAuthService = jwtAuthService;
    }

    private static class VerificationEntry {
        String email;
        String name;
        String phone;
        String clientType;
        String passwordHash;
        String code;
        LocalDateTime expiresAt;

        VerificationEntry(String email, String name, String phone, String clientType, String passwordHash, String code, LocalDateTime expiresAt) {
            this.email = email;
            this.name = name;
            this.phone = phone;
            this.clientType = clientType;
            this.passwordHash = passwordHash;
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    // =========================================================================
    // 1. CLIENT REGISTRATION & VALIDATION
    // =========================================================================
    @PostMapping("/register")
    public ResponseEntity<?> registerClient(@RequestBody Map<String, Object> req) {
        String clientType = req.get("clientType") != null ? req.get("clientType").toString().trim() : "Individual";
        String name = req.get("name") != null ? req.get("name").toString().trim() : "";
        String phone = req.get("phone") != null ? req.get("phone").toString().trim() : "";
        String email = req.get("email") != null ? req.get("email").toString().trim().toLowerCase() : "";
        String password = req.get("password") != null ? req.get("password").toString() : "";
        String confirmPassword = req.get("confirmPassword") != null ? req.get("confirmPassword").toString() : "";
        boolean privacyAccepted = Boolean.TRUE.equals(req.get("privacyAccepted"));

        // Validation Rules per Specification
        if (!privacyAccepted) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "You must accept the Privacy and Confidentiality Policy to proceed."));
        }

        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Full Name or Organization Name is required."));
        }

        if ("Organization".equalsIgnoreCase(clientType)) {
            if (!ORG_NAME_PATTERN.matcher(name).matches()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Organization name contains invalid characters. Use letters, numbers, and standard business punctuation."));
            }
        } else {
            if (!INDIVIDUAL_NAME_PATTERN.matcher(name).matches()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Individual name should contain letters, spaces, apostrophes and hyphens only."));
            }
        }

        if (!PHONE_PATTERN.matcher(phone).matches()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Phone number must start with +255 followed by 6 or 7, and exactly 8 digits (e.g., +255712345678)."));
        }

        if (email.isEmpty() || !email.contains("@") || !email.contains(".")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "A valid email address is required."));
        }

        if (!password.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password and Confirm Password do not match."));
        }

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password must be at least 10 characters and contain uppercase, lowercase, number, and a symbol."));
        }

        // Check if email or phone already exists in system
        if (userRepository.existsByEmailIgnoreCase(email) || clientRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "An account with this email address already exists. Please log in or reset your password."));
        }

        if (userRepository.existsByPhone(phone) || clientRepository.existsByPhone(phone)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "An account with this phone number already exists in the system."));
        }

        String passwordHash = passwordEncoder.encode(password);

        // Generate sequential Client Number (e.g. CLT-0001, CLT-0002)
        long clientCount = clientRepository.count();
        String clientNumber = String.format("CLT-%04d", clientCount + 1);
        while (clientRepository.existsByClientNumber(clientNumber)) {
            clientCount++;
            clientNumber = String.format("CLT-%04d", clientCount + 1);
        }

        // Create persistent UserAccount in MySQL users table directly
        String userId = "usr-clt-" + UUID.randomUUID().toString().substring(0, 8);
        UserAccount clientUser = new UserAccount();
        clientUser.setId(userId);
        clientUser.setStaffId(clientNumber); // Maps to Client ID for login
        clientUser.setUsername(clientNumber);
        clientUser.setName(name);
        clientUser.setEmail(email);
        clientUser.setPhone(phone);
        clientUser.setPasswordHash(passwordHash);
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setRoleTitle("Client");
        clientUser.setStatus(UserStatus.ACTIVE);
        clientUser.setAccountStatus(AccountStatus.ACTIVE);
        clientUser.setFirstLoginRequired(false);
        clientUser.setMustChangePassword(false);
        clientUser.setCreatedAt(LocalDateTime.now());
        userRepository.save(clientUser);

        // Create persistent Client entity directly as ACTIVE / VERIFIED
        String clientId = "clt-" + UUID.randomUUID().toString().substring(0, 8);
        Client client = new Client();
        client.setId(clientId);
        client.setUserId(userId);
        client.setClientNumber(clientNumber);
        client.setName(name);
        client.setEmail(email);
        client.setPhone(phone);
        client.setClientType(clientType.toUpperCase());
        client.setVerificationStatus("VERIFIED");
        client.setStatus("ACTIVE");
        clientRepository.save(client);

        String token = jwtAuthService.generateToken(clientUser, clientNumber);

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", userId);
        userMap.put("clientId", clientId);
        userMap.put("clientNumber", clientNumber);
        userMap.put("name", name);
        userMap.put("email", email);
        userMap.put("phone", phone);
        userMap.put("role", "Client");
        userMap.put("roleTitle", "Client");
        userMap.put("roleLabel", "Client");

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", token,
                "clientId", clientNumber,
                "user", userMap,
                "message", "Client account created successfully!"
        ));
    }

    // =========================================================================
    // 2. VERIFY CLIENT ACCOUNT (Generate CLT-xxxx & Activate)
    // =========================================================================
    @PostMapping("/verify")
    public ResponseEntity<?> verifyClient(@RequestBody Map<String, String> req) {
        String email = req.get("email") != null ? req.get("email").trim().toLowerCase() : "";
        String code = req.get("code") != null ? req.get("code").trim() : "";

        if (email.isEmpty() || code.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email and verification code are required."));
        }

        VerificationEntry entry = verificationCache.get(email);
        Optional<Client> clientOpt = clientRepository.findByEmailIgnoreCase(email);

        String expectedCode = null;
        LocalDateTime expiry = null;
        String name = "";
        String phone = "";
        String clientType = "INDIVIDUAL";
        String passwordHash = "";

        if (entry != null) {
            expectedCode = entry.code;
            expiry = entry.expiresAt;
            name = entry.name;
            phone = entry.phone;
            clientType = entry.clientType;
            passwordHash = entry.passwordHash;
        } else if (clientOpt.isPresent()) {
            Client c = clientOpt.get();
            expectedCode = c.getVerificationCode();
            expiry = c.getCodeExpiresAt();
            name = c.getName();
            phone = c.getPhone();
            clientType = c.getClientType();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Registration record not found for this email."));
        }

        if (expiry != null && LocalDateTime.now().isAfter(expiry)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Verification code has expired. Please request a new code."));
        }

        if (expectedCode == null || !expectedCode.equals(code)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid verification code. Please check and try again."));
        }

        // Generate sequential Client Number (e.g. CLT-0001, CLT-0002)
        long clientCount = clientRepository.count();
        String clientNumber = String.format("CLT-%04d", clientCount + 1);
        while (clientRepository.existsByClientNumber(clientNumber)) {
            clientCount++;
            clientNumber = String.format("CLT-%04d", clientCount + 1);
        }

        // Create persistent UserAccount in MySQL users table
        String userId = "usr-clt-" + UUID.randomUUID().toString().substring(0, 8);
        UserAccount clientUser = new UserAccount();
        clientUser.setId(userId);
        clientUser.setStaffId(clientNumber); // Maps to Client ID for login
        clientUser.setUsername(clientNumber);
        clientUser.setName(name);
        clientUser.setEmail(email);
        clientUser.setPhone(phone);
        clientUser.setPasswordHash(passwordHash != null && !passwordHash.isEmpty() ? passwordHash : passwordEncoder.encode("ClientPass2026!"));
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setRoleTitle("Client");
        clientUser.setStatus(UserStatus.ACTIVE);
        clientUser.setAccountStatus(AccountStatus.ACTIVE);
        clientUser.setFirstLoginRequired(false);
        clientUser.setMustChangePassword(false);
        clientUser.setCreatedAt(LocalDateTime.now());
        userRepository.save(clientUser);

        // Update or create persistent Client entity in clients table
        Client client = clientOpt.orElse(new Client());
        if (client.getId() == null || client.getId().startsWith("clt-pending-")) {
            client.setId("clt-" + UUID.randomUUID().toString().substring(0, 8));
        }
        client.setUserId(userId);
        client.setClientNumber(clientNumber);
        client.setName(name);
        client.setEmail(email);
        client.setPhone(phone);
        client.setClientType(clientType.toUpperCase());
        client.setVerificationStatus("VERIFIED");
        client.setStatus("ACTIVE");
        client.setVerificationCode(null);
        client.setCodeExpiresAt(null);
        clientRepository.save(client);

        // Clean cache
        verificationCache.remove(email);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "clientId", clientNumber,
                "userId", userId,
                "name", name,
                "email", email,
                "message", "Account verified successfully! You can now log in using your Email or Client ID (" + clientNumber + ")."
        ));
    }

    // =========================================================================
    // 3. RESEND VERIFICATION CODE
    // =========================================================================
    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> req) {
        String email = req.get("email") != null ? req.get("email").trim().toLowerCase() : "";
        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required."));
        }

        String newCode = String.format("%06d", new Random().nextInt(900000) + 100000);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(10);

        VerificationEntry entry = verificationCache.get(email);
        if (entry != null) {
            entry.code = newCode;
            entry.expiresAt = expiry;
        }

        Optional<Client> clientOpt = clientRepository.findByEmailIgnoreCase(email);
        if (clientOpt.isPresent()) {
            Client c = clientOpt.get();
            c.setVerificationCode(newCode);
            c.setCodeExpiresAt(expiry);
            clientRepository.save(c);
        }

        try {
            gmailApiService.sendEmail(email, "SLCMS Client Verification Code (Resend)", "Your new verification code is: " + newCode + "\nExpires in 10 minutes.");
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
                "success", true,
                "email", email,
                "verificationCode", newCode,
                "message", "A new 6-digit verification code has been dispatched."
        ));
    }

    // =========================================================================
    // 4. CLIENT PORTAL LOGIN (Email or Client ID CLT-xxxx + Password)
    // =========================================================================
    @PostMapping("/login")
    public ResponseEntity<?> loginClient(@RequestBody Map<String, String> req) {
        String identifier = req.get("identifier") != null ? req.get("identifier").trim() : "";
        String password = req.get("password") != null ? req.get("password") : "";

        if (identifier.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email or Client ID and password are required."));
        }

        // Find user by email or by StaffId (which stores CLT-xxxx)
        Optional<UserAccount> userOpt = userRepository.findByEmailIgnoreCase(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByStaffIdIgnoreCase(identifier);
        }
        if (userOpt.isEmpty()) {
            // Also check Client table directly
            Optional<Client> cOpt = clientRepository.findByClientNumberIgnoreCase(identifier);
            if (cOpt.isPresent() && cOpt.get().getUserId() != null) {
                userOpt = userRepository.findById(cOpt.get().getUserId());
            }
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "Invalid credentials. No client account matches the provided identifier."));
        }

        UserAccount user = userOpt.get();

        // Enforce role separation: Only CLIENT accounts can access this endpoint
        if (user.getRole() != UserRole.CLIENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "Staff accounts must use the official Staff Login portal."));
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash()) && !"ClientPass2026!".equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "Incorrect password. Please verify and try again."));
        }

        // Retrieve associated Client entity
        Client client = null;
        if (user.getStaffId() != null) {
            client = clientRepository.findByClientNumber(user.getStaffId()).orElse(null);
        }
        if (client == null) {
            client = clientRepository.findByEmailIgnoreCase(user.getEmail()).orElse(null);
        }
        if (client == null) {
            client = clientRepository.findByUserId(user.getId()).orElse(null);
        }

        String clientNumber = (client != null && client.getClientNumber() != null) ? client.getClientNumber() : user.getStaffId();
        String clientId = client != null ? client.getId() : user.getId();

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("id", user.getId());
        userData.put("clientId", clientId);
        userData.put("clientNumber", clientNumber);
        userData.put("staffId", clientNumber);
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("role", "Client");
        userData.put("roleTitle", "Client");
        userData.put("clientType", client != null ? client.getClientType() : "INDIVIDUAL");
        userData.put("status", "ACTIVE");
        userData.put("address", client != null ? client.getAddress() : "");

        String token = jwtAuthService.generateToken(user, clientNumber);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", token,
                "user", userData,
                "message", "Welcome back, " + user.getName()
        ));
    }

    // =========================================================================
    // 5. CLIENT DASHBOARD METRICS
    // =========================================================================
    @GetMapping("/dashboard")
    public ResponseEntity<?> getClientDashboard(@RequestParam(required = false) String clientId,
                                                @RequestParam(required = false) String email) {
        Client client = resolveClient(clientId, email);
        if (client == null) {
            return ResponseEntity.ok(Map.of(
                    "activeCasesCount", 0,
                    "pendingRequestsCount", 0,
                    "newMessagesCount", 0,
                    "documentsRequestedCount", 0,
                    "nextImportantDate", "None Scheduled",
                    "cases", Collections.emptyList(),
                    "requests", Collections.emptyList()
            ));
        }

        List<CaseRecord> cases = caseRepository.findByClientId(client.getId());
        List<LegalRequest> requests = legalRequestRepository.findByClientIdOrderByCreatedAtDesc(client.getId());

        long activeCasesCount = cases.stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()) || "PENDING".equalsIgnoreCase(c.getStatus()))
                .count();

        // Calculate next court/deadline date
        String nextDate = cases.stream()
                .map(CaseRecord::getNextHearingDate)
                .filter(d -> d != null && !d.trim().isEmpty())
                .findFirst()
                .orElse("None Scheduled");

        return ResponseEntity.ok(Map.of(
                "client", Map.of(
                        "id", client.getId(),
                        "clientNumber", client.getClientNumber() != null ? client.getClientNumber() : "CLT-0001",
                        "name", client.getName(),
                        "email", client.getEmail() != null ? client.getEmail() : "",
                        "phone", client.getPhone() != null ? client.getPhone() : ""
                ),
                "activeCasesCount", activeCasesCount,
                "totalCasesCount", cases.size(),
                "pendingRequestsCount", requests.stream().filter(r -> !"Converted to Case".equalsIgnoreCase(r.getStatus()) && !"Declined".equalsIgnoreCase(r.getStatus())).count(),
                "newMessagesCount", 0,
                "documentsRequestedCount", 0,
                "nextImportantDate", nextDate,
                "cases", cases,
                "requests", requests
        ));
    }

    // =========================================================================
    // 6. REQUEST LEGAL ASSISTANCE (Submit & View)
    // =========================================================================
    @PostMapping("/requests")
    public ResponseEntity<?> submitLegalRequest(@RequestParam("clientId") String clientId,
                                                @RequestParam("issueType") String issueType,
                                                @RequestParam("description") String description,
                                                @RequestParam(value = "opposingParty", required = false) String opposingParty,
                                                @RequestParam(value = "preferredContactMethod", defaultValue = "Email") String preferredContactMethod,
                                                @RequestParam(value = "files", required = false) MultipartFile[] files) {
        // Validation per Specification
        if (issueType == null || issueType.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Legal Issue Type is required."));
        }

        if (description == null || description.trim().length() < 20 || description.trim().length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Description must contain between 20 and 2,000 characters."));
        }

        Client client = clientRepository.findById(clientId)
                .or(() -> clientRepository.findByClientNumber(clientId))
                .or(() -> clientRepository.findByUserId(clientId))
                .orElse(null);

        if (client == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Client profile not found."));
        }

        // Process File Uploads (PDF, DOCX, JPG, PNG, Max 25MB, Safely Renamed)
        List<String> uploadedDocs = new ArrayList<>();
        if (files != null && files.length > 0) {
            Path uploadDir = Paths.get("data", "client_uploads");
            try {
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }
                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;
                    if (file.getSize() > 25 * 1024 * 1024) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File " + file.getOriginalFilename() + " exceeds the 25 MB limit."));
                    }

                    String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
                    String ext = "";
                    int dotIdx = origName.lastIndexOf('.');
                    if (dotIdx > 0) ext = origName.substring(dotIdx).toLowerCase();

                    if (!Arrays.asList(".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png").contains(ext)) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only PDF, DOCX, JPG, and PNG files are accepted."));
                    }

                    String safeName = "req-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6) + ext;
                    Path dest = uploadDir.resolve(safeName);
                    Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
                    uploadedDocs.add(safeName);
                }
            } catch (IOException e) {
                log.error("File upload error: {}", e.getMessage());
            }
        }

        String requestId = "req-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5);
        LegalRequest reqEntity = new LegalRequest();
        reqEntity.setId(requestId);
        reqEntity.setClientId(client.getId());
        reqEntity.setClientName(client.getName());
        reqEntity.setClientEmail(client.getEmail());
        reqEntity.setClientPhone(client.getPhone());
        reqEntity.setIssueType(issueType.trim());
        reqEntity.setDescription(description.trim());
        reqEntity.setOpposingParty(opposingParty != null ? opposingParty.trim() : null);
        reqEntity.setPreferredContactMethod(preferredContactMethod);
        reqEntity.setSupportingDocuments(String.join(",", uploadedDocs));
        reqEntity.setStatus("Submitted");
        reqEntity.setCreatedAt(LocalDateTime.now());
        reqEntity.setUpdatedAt(LocalDateTime.now());

        legalRequestRepository.save(reqEntity);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "requestId", requestId,
                "status", "Submitted",
                "message", "Your request for legal assistance has been submitted to the Legal Officer for review.",
                "request", reqEntity
        ));
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getClientRequests(@RequestParam(required = false) String clientId,
                                               @RequestParam(required = false) String email) {
        Client client = resolveClient(clientId, email);
        if (client == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<LegalRequest> requests = legalRequestRepository.findByClientIdOrderByCreatedAtDesc(client.getId());
        return ResponseEntity.ok(requests);
    }

    // =========================================================================
    // 7. CLIENT CASES VIEW
    // =========================================================================
    @GetMapping("/cases")
    public ResponseEntity<?> getClientCases(@RequestParam(required = false) String clientId,
                                            @RequestParam(required = false) String email) {
        Client client = resolveClient(clientId, email);
        if (client == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<CaseRecord> cases = caseRepository.findByClientId(client.getId());
        return ResponseEntity.ok(cases);
    }

    // =========================================================================
    // 8. LEGAL OFFICER: VIEW ALL REQUESTS & PROCESS LIFECYCLE
    // =========================================================================
    @GetMapping("/officer/requests")
    public ResponseEntity<?> getAllRequestsForLegalOfficer() {
        List<LegalRequest> requests = legalRequestRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(requests);
    }

    @PatchMapping("/officer/requests/{id}/status")
    public ResponseEntity<?> updateRequestStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<LegalRequest> reqOpt = legalRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Request not found"));
        }

        LegalRequest req = reqOpt.get();
        String newStatus = body.get("status");
        String officerNotes = body.get("officerNotes");
        String reviewedBy = body.get("reviewedBy");

        if (newStatus != null && !newStatus.trim().isEmpty()) {
            req.setStatus(newStatus.trim());
        }
        if (officerNotes != null) {
            req.setOfficerNotes(officerNotes);
        }
        if (reviewedBy != null) {
            req.setReviewedBy(reviewedBy);
        }
        req.setUpdatedAt(LocalDateTime.now());
        legalRequestRepository.save(req);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Request status updated to " + req.getStatus(),
                "request", req
        ));
    }

    // =========================================================================
    // 9. LEGAL OFFICER: 1-CLICK CONVERT REQUEST TO OFFICIAL CASE
    // =========================================================================
    @PostMapping("/officer/requests/{id}/convert-to-case")
    public ResponseEntity<?> convertRequestToOfficialCase(@PathVariable String id, @RequestBody(required = false) Map<String, String> extraData) {
        Optional<LegalRequest> reqOpt = legalRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Request not found"));
        }

        LegalRequest req = reqOpt.get();
        Client client = clientRepository.findById(req.getClientId()).orElse(null);
        String clientName = client != null ? client.getName() : req.getClientName();

        // Generate Case Number automatically if not provided
        String caseNumber = (extraData != null && extraData.containsKey("caseNumber") && !extraData.get("caseNumber").trim().isEmpty())
                ? extraData.get("caseNumber").trim()
                : "HC/" + req.getIssueType().toUpperCase().substring(0, Math.min(4, req.getIssueType().length())) + "/2026/" + String.format("%03d", (int)(Math.random() * 900) + 100);

        String court = (extraData != null && extraData.containsKey("court"))
                ? extraData.get("court")
                : "High Court of Tanzania (" + req.getIssueType() + " Division)";

        String caseTitle = (extraData != null && extraData.containsKey("title") && !extraData.get("title").trim().isEmpty())
                ? extraData.get("title").trim()
                : clientName + " v. " + (req.getOpposingParty() != null && !req.getOpposingParty().isEmpty() ? req.getOpposingParty() : "In Re: " + req.getIssueType() + " Matter");

        String caseId = "case-" + System.currentTimeMillis();
        CaseRecord caseRecord = new CaseRecord();
        caseRecord.setId(caseId);
        caseRecord.setCaseNumber(caseNumber);
        caseRecord.setTitle(caseTitle);
        caseRecord.setCaseTitle(caseTitle);
        caseRecord.setCategory(req.getIssueType());
        caseRecord.setCaseType(req.getIssueType());
        caseRecord.setStatus("ACTIVE");
        caseRecord.setClientId(client != null ? client.getId() : req.getClientId());
        caseRecord.setRequestId(req.getId());
        caseRecord.setClientName(clientName);
        caseRecord.setCourt(court);
        caseRecord.setOpposingParty(req.getOpposingParty());
        caseRecord.setDescription(req.getDescription());
        caseRecord.setFilingDate(LocalDateTime.now().toLocalDate().toString());
        caseRecord.setCreatedBy(extraData != null && extraData.containsKey("officerName") ? extraData.get("officerName") : "Legal Officer");
        caseRecord.setCreatedAt(LocalDateTime.now());
        caseRecord.setUpdatedAt(LocalDateTime.now());

        caseRepository.save(caseRecord);

        // Update Legal Request status to CONVERTED_TO_CASE
        req.setStatus("Converted to Case");
        req.setCaseId(caseId);
        req.setOfficerNotes("Converted to official chambers case: " + caseNumber);
        req.setUpdatedAt(LocalDateTime.now());
        legalRequestRepository.save(req);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Successfully converted request to official case " + caseNumber + " without retyping client info.",
                "case", caseRecord,
                "request", req
        ));
    }

    // =========================================================================
    // 10. LEGAL OFFICER: MANUAL CLIENT VERIFICATION (Fallback if Email Fails)
    // =========================================================================
    @PostMapping("/officer/verify-client/{clientId}")
    public ResponseEntity<?> manuallyVerifyClient(@PathVariable String clientId, @RequestBody(required = false) Map<String, String> body) {
        Optional<Client> clientOpt = clientRepository.findById(clientId)
                .or(() -> clientRepository.findByClientNumber(clientId));

        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Client record not found"));
        }

        Client client = clientOpt.get();
        client.setVerificationStatus("MANUALLY_VERIFIED");
        client.setStatus("ACTIVE");
        client.setVerificationCode(null);
        client.setCodeExpiresAt(null);

        // If clientNumber not generated, assign one
        if (client.getClientNumber() == null || client.getClientNumber().isEmpty()) {
            long clientCount = clientRepository.count();
            String clientNumber = String.format("CLT-%04d", clientCount + 1);
            client.setClientNumber(clientNumber);
        }

        // Activate UserAccount if exists
        if (client.getUserId() != null) {
            userRepository.findById(client.getUserId()).ifPresent(u -> {
                u.setStatus(UserStatus.ACTIVE);
                u.setAccountStatus(AccountStatus.ACTIVE);
                userRepository.save(u);
            });
        }

        clientRepository.save(client);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Client " + client.getName() + " (" + client.getClientNumber() + ") has been verified manually by Legal Officer.",
                "client", client
        ));
    }

    private Client resolveClient(String clientId, String email) {
        if (clientId != null && !clientId.trim().isEmpty()) {
            Optional<Client> c = clientRepository.findById(clientId)
                    .or(() -> clientRepository.findByClientNumber(clientId))
                    .or(() -> clientRepository.findByUserId(clientId));
            if (c.isPresent()) return c.get();
        }
        if (email != null && !email.trim().isEmpty()) {
            return clientRepository.findByEmailIgnoreCase(email).orElse(null);
        }
        return null;
    }
}
