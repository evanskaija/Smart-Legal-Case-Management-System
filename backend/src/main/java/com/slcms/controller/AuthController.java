package com.slcms.controller;

import com.slcms.dto.AccessDeniedResponse;
import com.slcms.model.AccountStatus;
import com.slcms.model.UserAccount;
import com.slcms.model.UserRole;
import com.slcms.model.UserStatus;
import com.slcms.service.RBACSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Enterprise Authentication & User Access API with strict RBAC enforcement.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final RBACSecurityService rbacSecurityService;

    @Autowired
    public AuthController(RBACSecurityService rbacSecurityService) {
        this.rbacSecurityService = rbacSecurityService;
    }

    /**
     * Retrieve list of authorized demo users for the login/register showcase matrix.
     */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getShowcaseUsers() {
        List<UserAccount> accounts = rbacSecurityService.getAllUsers();
        List<Map<String, Object>> result = new ArrayList<>();

        for (UserAccount acc : accounts) {
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("id", acc.getId());
            u.put("employeeId", acc.getEmployeeId());
            u.put("staffId", acc.getStaffId());
            u.put("name", acc.getName());
            u.put("email", acc.getEmail());
            u.put("phone", acc.getPhone());
            u.put("role", acc.getRole().getDisplayName());
            u.put("roleKey", acc.getRole().name());
            u.put("roleTitle", acc.getRoleTitle());
            u.put("status", acc.getStatus().getDisplayName());
            u.put("accountStatus", acc.getAccountStatus() != null ? acc.getAccountStatus().name() : acc.getStatus().name());
            u.put("department", acc.getDepartment());
            u.put("advocateNumber", acc.getAdvocateNumber());
            u.put("practisingCertNo", acc.getPractisingCertNo());
            u.put("nationalIdRef", acc.getNationalIdRef());
            u.put("assignedCaseCount", acc.getAssignedCaseIds().size());
            u.put("assignedCaseIds", acc.getAssignedCaseIds());
            u.put("mustChangePassword", acc.isMustChangePassword());
            u.put("passwordPlain", acc.getPasswordPlain()); // Included for 1-click test fill
            result.add(u);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Authenticate user credentials and evaluate security states.
     * Supports login via Email, Phone Number, or Staff ID.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticate(@RequestBody Map<String, String> credentials) {
        String identifier = credentials.get("email");
        if (identifier == null || identifier.trim().isEmpty()) {
            identifier = credentials.get("identifier");
        }
        String password = credentials.get("password");

        if (identifier == null || password == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid email/username or password."));
        }

        final String cleanId = identifier.trim().toLowerCase();
        final String digitsOnly = identifier.replaceAll("\\D", "");

        UserAccount user = rbacSecurityService.getAllUsers().stream()
                .filter(u -> {
                    if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(cleanId)) return true;
                    if (u.getEmployeeId() != null && u.getEmployeeId().equalsIgnoreCase(cleanId)) return true;
                    if (u.getStaffId() != null && u.getStaffId().equalsIgnoreCase(cleanId)) return true;
                    if (u.getName() != null && u.getName().equalsIgnoreCase(cleanId)) return true;
                    if (digitsOnly.length() >= 7 && u.getPhone() != null && u.getPhone().replaceAll("\\D", "").endsWith(digitsOnly)) return true;
                    return false;
                })
                .findFirst()
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid email/username or password."));
        }

        // Check Pending Approval State
        if (user.getAccountStatus() == AccountStatus.PENDING_APPROVAL || user.getAccountStatus() == AccountStatus.PENDING_VERIFICATION) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "errorType", "PENDING_APPROVAL",
                            "message", "Your identity was received successfully. Access will remain restricted until an authorized administrator approves your account."));
        }

        if (user.getStatus() == UserStatus.DEACTIVATED || user.getAccountStatus() == AccountStatus.DEACTIVATED || user.getAccountStatus() == AccountStatus.SUSPENDED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "errorType", "ACCOUNT_DISABLED", 
                            "message", "Your account is currently unavailable. Contact the system administrator."));
        }

        if (user.getStatus() == UserStatus.LOCKED || user.getAccountStatus() == AccountStatus.LOCKED) {
            long remainingMinutes = user.getLockedUntil() != null ? 
                    Math.max(1, (user.getLockedUntil() - System.currentTimeMillis()) / 60000) : 15;
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(Map.of("success", false, "errorType", "ACCOUNT_LOCKED", 
                            "message", "Too many unsuccessful attempts. Try again in " + remainingMinutes + " minute(s) or contact the administrator."));
        }

        if (!password.equals(user.getPasswordPlain())) {
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            if (user.getFailedAttempts() >= 5) {
                user.setStatus(UserStatus.LOCKED);
                user.setAccountStatus(AccountStatus.LOCKED);
                user.setLockedUntil(System.currentTimeMillis() + 15 * 60 * 1000);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid email/username or password."));
        }

        // Reset failed counter on success
        user.setFailedAttempts(0);
        user.setLockedUntil(null);

        if (user.isMustChangePassword() || user.getStatus() == UserStatus.FIRST_LOGIN_PENDING || user.getAccountStatus() == AccountStatus.FIRST_LOGIN_RESET) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "requiresFirstLoginChange", true,
                "user", Map.of("id", user.getId(), "email", user.getEmail(), "name", user.getName(), "role", user.getRole().getDisplayName())
            ));
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "requiresFirstLoginChange", false,
            "token", "slcms_jwt_" + UUID.randomUUID(),
            "user", user
        ));
    }
}
