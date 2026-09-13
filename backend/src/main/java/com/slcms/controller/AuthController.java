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

        // Check if temporary password is expired
        if ((user.isMustChangePassword() || user.isFirstLoginRequired()) && user.getTemporaryPasswordExpiresAt() != null) {
            if (java.time.LocalDateTime.now().isAfter(user.getTemporaryPasswordExpiresAt())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "errorType", "TEMPORARY_PASSWORD_EXPIRED",
                                "message", "The temporary password expired before first-login setup was completed. Please contact your Administrator."));
            }
        }

        // Account Temporarily Locked - Reject login even if correct password is later entered during the lock period
        if (user.getStatus() == UserStatus.LOCKED || user.getAccountStatus() == AccountStatus.LOCKED) {
            if (user.getLockedUntil() != null && System.currentTimeMillis() >= user.getLockedUntil()) {
                // Configured lock period elapsed -> auto unlock
                user.setStatus(UserStatus.ACTIVE);
                user.setAccountStatus(AccountStatus.ACTIVE);
                user.setFailedAttempts(0);
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
                user.setLockedAt(null);
                user.setLockedReason(null);
                rbacSecurityService.resolveAlertsForUser(user.getId(), com.slcms.model.AlertType.ACCOUNT_LOCKED, "SYSTEM");
            } else {
                return ResponseEntity.status(HttpStatus.LOCKED)
                        .body(Map.of(
                            "success", false, 
                            "errorType", "ACCOUNT_TEMPORARILY_LOCKED", 
                            "message", "Account Temporarily Locked\nYou cannot access SLCMS at this time. Try again after the lock period or contact the System Administrator."
                        ));
            }
        }

        if (!password.equals(user.getPasswordPlain())) {
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setStatus(UserStatus.LOCKED);
                user.setAccountStatus(AccountStatus.LOCKED);
                user.setLockedAt(java.time.LocalDateTime.now());
                user.setLockedUntil(System.currentTimeMillis() + 15 * 60 * 1000);
                user.setLockedReason("TOO_MANY_FAILED_LOGINS");

                com.slcms.model.SecurityAlert alert = new com.slcms.model.SecurityAlert(
                        "alt-" + System.currentTimeMillis(),
                        user.getId(),
                        user.getStaffId(),
                        user.getName(),
                        user.getRole().getDisplayName(),
                        com.slcms.model.AlertType.ACCOUNT_LOCKED,
                        "Account Locked Automatically",
                        "The account was locked after five unsuccessful login attempts.",
                        "HIGH"
                );
                alert.setLockedReason("TOO_MANY_FAILED_LOGINS");
                rbacSecurityService.createSecurityAlert(alert);

                rbacSecurityService.recordAudit(user.getEmail(), user.getRole().getDisplayName(), "Account Locked", "Security",
                        "Automatic lockout following 5 consecutive failed login attempts.");

                return ResponseEntity.status(HttpStatus.LOCKED)
                        .body(Map.of(
                            "success", false,
                            "errorType", "ACCOUNT_TEMPORARILY_LOCKED",
                            "message", "Account Temporarily Locked\nYou cannot access SLCMS at this time. Try again after the lock period or contact the System Administrator."
                        ));
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid email/username or password."));
        }

        // Reset failed counter on success
        user.setFailedAttempts(0);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLockedAt(null);
        user.setLockedReason(null);
        user.setLastLoginAt(java.time.LocalDateTime.now());
        user.setLastLogin("Today, " + java.time.format.DateTimeFormatter.ofPattern("hh:mm a").format(java.time.LocalTime.now()));

        // Ordinary successful login recorded only in Security Activity:
        rbacSecurityService.recordAudit(user.getEmail(), user.getRole().getDisplayName(), "Login successful", "Security Activity",
                "User: " + user.getStaffId() + ", Date and time: Automatically recorded");

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
