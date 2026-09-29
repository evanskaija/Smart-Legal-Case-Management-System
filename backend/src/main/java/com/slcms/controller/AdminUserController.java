package com.slcms.controller;

import com.slcms.model.AccountStatus;
import com.slcms.model.UserAccount;
import com.slcms.model.UserRole;
import com.slcms.model.UserStatus;
import com.slcms.repository.UserRepository;
import com.slcms.service.RBACSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Enterprise Admin User Management REST API.
 * Connects directly to the permanent online database.
 */
@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(originPatterns = "*")
public class AdminUserController {

    private final UserRepository userRepository;
    private final RBACSecurityService rbacSecurityService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    private static final Set<String> APPROVED_ROLES = Set.of(
        "Administrator", "Senior Lawyer", "Lawyer", "Legal Clerk", "Legal Officer"
    );

    private static final Set<String> APPROVED_JOB_TITLES = Set.of(
        "Senior Litigation Partner", "Managing Associate", "Senior Counsel",
        "Litigation Associate", "Junior Associate", "Legal Associate",
        "Court Registry Clerk", "Legal Records Clerk", "Chief Court Clerk",
        "System Administrator", "IT & Security Administrator", "Compliance & System Officer",
        "Legal Officer", "Senior Legal Officer", "Corporate Legal Officer", "Legal Compliance Officer"
    );

    private static final Set<String> APPROVED_DEPARTMENTS = Set.of(
        "Commercial Litigation", "Land & Property Law", "Corporate & Tax Advisory",
        "Labour & Employment Law", "Civil & Matrimonial", "Criminal Defence & Appellate",
        "General Litigation Registry", "System Governance & Administration",
        "Full System & Security Governance", "User Accounts & Permissions Only", "Audit & Compliance Monitoring",
        "Corporate & Legal Affairs", "Legal Compliance & Governance", "Contracts & Commercial Advisory"
    );

    @Autowired
    public AdminUserController(UserRepository userRepository,
                               RBACSecurityService rbacSecurityService,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.rbacSecurityService = rbacSecurityService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * GET /api/admin/users
     * Returns list of all active/provisioned users in the permanent database.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllStaffUsers() {
        List<UserAccount> users = userRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (UserAccount u : users) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", u.getId());
            dto.put("staffId", u.getStaffId());
            dto.put("employeeId", u.getEmployeeId());
            dto.put("username", u.getUsername());
            dto.put("name", u.getName());
            dto.put("email", u.getEmail());
            dto.put("phone", u.getPhone());
            dto.put("role", u.getRole() != null ? u.getRole().getDisplayName() : "Lawyer");
            dto.put("roleKey", u.getRole() != null ? u.getRole().name() : "LAWYER");
            dto.put("roleTitle", u.getRoleTitle());
            dto.put("accountStatus", u.getAccountStatus() != null ? u.getAccountStatus().name() : "ACTIVE");
            dto.put("status", u.getStatus() != null ? u.getStatus().getDisplayName() : "Active");
            dto.put("department", u.getDepartment());
            dto.put("advocateNumber", u.getAdvocateNumber());
            dto.put("practisingCertNo", u.getPractisingCertNo());
            dto.put("nationalIdRef", u.getNationalIdRef());
            dto.put("assignedCaseCount", u.getAssignedCaseIds() != null ? u.getAssignedCaseIds().size() : 0);
            dto.put("assignedCaseIds", u.getAssignedCaseIds());
            dto.put("mustChangePassword", u.isMustChangePassword());
            dto.put("failedAttempts", u.getFailedAttempts());
            LocalDateTime cutoff = LocalDateTime.now().minusMinutes(15);
            boolean isOnline = u.getLastLoginAt() != null && u.getLastLoginAt().isAfter(cutoff);
            boolean isEnabled = (u.getAccountStatus() == AccountStatus.ACTIVE || u.getAccountStatus() == AccountStatus.FIRST_LOGIN_RESET)
                    && !u.isAdminLocked()
                    && (u.getLockedUntil() == null || u.getLockedUntil() <= System.currentTimeMillis());

            dto.put("isOnline", isOnline);
            dto.put("isEnabled", isEnabled);
            dto.put("lastLoginAt", u.getLastLoginAt() != null ? u.getLastLoginAt().toString() : null);
            dto.put("lastSuccessfulLogin", u.getLastSuccessfulLogin() != null ? u.getLastSuccessfulLogin().toString() : null);
            dto.put("lastLogin", isOnline ? "Online Now" : (u.getLastSuccessfulLogin() != null ? u.getLastSuccessfulLogin().toString() : "Never"));
            dto.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
            response.add(dto);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/users
     * Administrator creates a new staff account (e.g. Lawyer) stored in the permanent database.
     * Validates every field strictly according to firm rules. Invalid information is never saved.
     */
    @PostMapping
    public ResponseEntity<?> createStaffUser(@RequestBody Map<String, Object> payload,
                                             @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {

        // Check if requester role header exists and is not Administrator
        if (requesterRole != null && !requesterRole.trim().isEmpty() &&
            !"ADMINISTRATOR".equalsIgnoreCase(requesterRole.trim()) &&
            !"Administrator".equalsIgnoreCase(requesterRole.trim()) &&
            !"MANAGING_PARTNER".equalsIgnoreCase(requesterRole.trim())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied: Administrator privileges required to provision staff."));
        }

        // 1. Assigned Role Validation: Must be Administrator, Senior Lawyer, Lawyer or Legal Clerk
        String roleStr = (String) payload.get("role");
        if (roleStr == null || !APPROVED_ROLES.contains(roleStr.trim())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Assigned Role must be Administrator, Senior Lawyer, Lawyer or Legal Clerk."));
        }
        String cleanRole = roleStr.trim();
        UserRole userRole;
        if (cleanRole.equalsIgnoreCase("Administrator")) {
            userRole = UserRole.ADMINISTRATOR;
        } else if (cleanRole.equalsIgnoreCase("Senior Lawyer")) {
            userRole = UserRole.SENIOR_LAWYER;
        } else if (cleanRole.equalsIgnoreCase("Legal Clerk")) {
            userRole = UserRole.LEGAL_CLERK;
        } else if (cleanRole.equalsIgnoreCase("Legal Officer")) {
            userRole = UserRole.LEGAL_OFFICER;
        } else {
            userRole = UserRole.LAWYER;
        }

        // 2. Full Name Validation: At least two names; letters and spaces only
        String fullName = (String) payload.get("fullName");
        if (fullName == null || fullName.trim().isEmpty()) {
            fullName = (String) payload.get("name");
        }
        if (fullName == null || !fullName.trim().matches("^[a-zA-Z]+(\\s+[a-zA-Z]+)+$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Full Name must contain at least two names and letters and spaces only."));
        }
        String cleanFullName = fullName.trim();
        if (userRepository.existsByNameIgnoreCase(cleanFullName)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "A user with the name '" + cleanFullName + "' is already registered in the system."));
        }

        // 3. Username Validation: Lowercase letters, numbers, dots and underscores only
        String username = (String) payload.get("username");
        if (username == null || !username.trim().matches("^[a-z0-9._]+$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username must contain lowercase letters, numbers, dots and underscores only."));
        }
        String cleanUsername = username.trim().toLowerCase();
        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "Username '" + cleanUsername + "' is already in use. Please choose a different username."));
        }

        // 4. Official Email Validation: Generated automatically from username (${username}@slcms.local); read-only
        String expectedEmail = cleanUsername + "@slcms.local";
        String email = (String) payload.get("email");
        if (email != null && !email.trim().equalsIgnoreCase(expectedEmail)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Official Email must be generated automatically from username as " + expectedEmail + "."));
        }
        final String cleanEmail = expectedEmail.toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "Official Email '" + cleanEmail + "' is already registered in the system."));
        }

        // 5. Contact Phone Validation: Must start with +255, then 6 or 7, followed by eight digits
        String phone = (String) payload.get("phone");
        String cleanPhone = (phone != null) ? phone.replaceAll("\\s+", "") : "";
        if (!cleanPhone.matches("^\\+255[67]\\d{8}$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Contact Phone must start with +255, followed by 6 or 7 and eight digits (e.g. +255754000111)."));
        }
        if (userRepository.existsByPhone(cleanPhone) || (phone != null && userRepository.existsByPhone(phone.trim()))) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "Contact phone number '" + cleanPhone + "' is already registered to an existing user."));
        }

        // 6. Staff ID Validation: Generated automatically; read-only
        String staffId = (String) payload.get("staffId");
        if (staffId == null || staffId.trim().isEmpty()) {
            String prefix = (userRole == UserRole.ADMINISTRATOR) ? "ADM" :
                            (userRole == UserRole.LEGAL_CLERK) ? "CLK" :
                            (userRole == UserRole.LEGAL_OFFICER) ? "LGO" : "LAW";
            int num = 1000 + random.nextInt(9000);
            staffId = prefix + "-" + num;
            while (userRepository.existsByStaffIdIgnoreCase(staffId)) {
                num = 1000 + random.nextInt(9000);
                staffId = prefix + "-" + num;
            }
        } else {
            staffId = staffId.trim().toUpperCase();
            if (!staffId.matches("^(ADM|LAW|CLK|LGO|STF)-\\d{4}$")) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Staff ID must follow the automatic format (e.g. LAW-0068, LGO-1024, ADM-2048)."));
            }
            if (userRepository.existsByStaffIdIgnoreCase(staffId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "Staff ID '" + staffId + "' is already assigned to an existing user."));
            }
        }

        // 7. Lawyer Roll Number Validation: Required only for Senior Lawyer and Lawyer; format TLS/ADV/7760
        String advocateNumber = (String) payload.get("advocateNumber");
        if (advocateNumber == null || advocateNumber.trim().isEmpty()) {
            advocateNumber = (String) payload.get("lawyerRollNumber");
        }
        if (userRole == UserRole.SENIOR_LAWYER || userRole == UserRole.LAWYER) {
            if (advocateNumber == null || !advocateNumber.trim().matches("^TLS/ADV/\\d+$")) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lawyer Roll Number is required for Senior Lawyer and Lawyer in format TLS/ADV/7760."));
            }
            advocateNumber = advocateNumber.trim();
            if (userRepository.existsByAdvocateNumberIgnoreCase(advocateNumber)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "message", "Lawyer Roll Number '" + advocateNumber + "' is already registered with Tanganyika Law Society (TLS) records in SLCMS."));
            }
        } else {
            advocateNumber = null;
        }

        // 8. Job Title Validation: Select from approved titles
        String jobTitle = (String) payload.get("jobTitle");
        if (jobTitle == null || !APPROVED_JOB_TITLES.contains(jobTitle.trim())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Job Title must be selected from approved titles."));
        }
        String cleanJobTitle = jobTitle.trim();

        // 9. Practice Department Validation: Select from approved departments
        String department = (String) payload.get("department");
        if (department == null || !APPROVED_DEPARTMENTS.contains(department.trim())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Practice Department must be selected from approved departments."));
        }
        String cleanDepartment = department.trim();

        // 10. Temporary Password Validation: Automatically generated; at least 12 characters
        String tempPassword = (String) payload.get("temporaryPassword");
        if (tempPassword == null || tempPassword.trim().length() < 12) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Temporary Password must be automatically generated and at least 12 characters."));
        }
        String cleanTempPassword = tempPassword.trim();

        // 11. Initial Case Validation: Optional; must reference an existing unassigned case
        String caseId = (String) payload.get("caseId");
        if (caseId != null && !caseId.trim().isEmpty()) {
            String cleanCaseId = caseId.trim();
            if (!CaseAccessController.caseExists(cleanCaseId)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Initial Case must reference an existing case in the system."));
            }
            if (!CaseAccessController.isCaseUnassigned(cleanCaseId)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Initial Case must reference an unassigned case. The selected case is already assigned."));
            }
            caseId = cleanCaseId;
        } else {
            caseId = null;
        }

        // All validations passed — create user and save to database
        String hashedPass = passwordEncoder.encode(cleanTempPassword);

        UserAccount newUser = new UserAccount();
        newUser.setId("usr-" + UUID.randomUUID().toString().substring(0, 8));
        newUser.setStaffId(staffId);
        newUser.setEmployeeId(staffId);
        newUser.setUsername(cleanUsername);
        newUser.setName(cleanFullName);
        newUser.setEmail(cleanEmail);
        newUser.setPhone(cleanPhone);
        newUser.setPasswordHash(hashedPass);
        newUser.setPasswordPlain(cleanTempPassword);
        newUser.setRole(userRole);
        newUser.setRoleTitle(cleanJobTitle);
        newUser.setStatus(UserStatus.FIRST_LOGIN_PENDING);
        newUser.setAccountStatus(AccountStatus.FIRST_LOGIN_RESET);
        newUser.setMustChangePassword(true);
        newUser.setFirstLoginRequired(true);
        newUser.setTemporaryPasswordExpiresAt(LocalDateTime.now().plusHours(24));
        newUser.setDepartment(cleanDepartment);
        newUser.setAdvocateNumber(advocateNumber);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setFailedAttempts(0);
        newUser.setFailedLoginAttempts(0);

        if (caseId != null) {
            newUser.getAssignedCaseIds().add(caseId);
            CaseAccessController.assignUserToCase(caseId, newUser.getId());
        }

        UserAccount savedUser = userRepository.save(newUser);

        // Record security audit event
        rbacSecurityService.recordSecurityEvent(new com.slcms.model.SecurityEvent(
                "evt-" + System.currentTimeMillis(), savedUser.getId(), savedUser.getName(),
                com.slcms.model.EventType.USER_MANAGEMENT, "Created",
                "Staff account provisioned for " + savedUser.getName() + " (" + savedUser.getStaffId() + ") as " + userRole.getDisplayName(),
                "127.0.0.1"
        ));

        Map<String, Object> userDTO = new LinkedHashMap<>();
        userDTO.put("id", savedUser.getId());
        userDTO.put("staffId", savedUser.getStaffId());
        userDTO.put("username", savedUser.getUsername());
        userDTO.put("name", savedUser.getName());
        userDTO.put("email", savedUser.getEmail());
        userDTO.put("phone", savedUser.getPhone());
        userDTO.put("role", savedUser.getRole().getDisplayName());
        userDTO.put("roleKey", savedUser.getRole().name());
        userDTO.put("roleTitle", savedUser.getRoleTitle());
        userDTO.put("accountStatus", savedUser.getAccountStatus().name());
        userDTO.put("status", savedUser.getStatus().getDisplayName());
        userDTO.put("mustChangePassword", savedUser.isMustChangePassword());
        userDTO.put("department", savedUser.getDepartment());
        userDTO.put("advocateNumber", savedUser.getAdvocateNumber());
        userDTO.put("assignedCaseIds", savedUser.getAssignedCaseIds());
        userDTO.put("createdAt", savedUser.getCreatedAt().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Staff account successfully created and saved to permanent database.",
                "user", userDTO,
                "temporaryPassword", cleanTempPassword,
                "staffId", savedUser.getStaffId()
        ));
    }
}
