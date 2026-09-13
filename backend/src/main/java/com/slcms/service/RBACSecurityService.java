package com.slcms.service;

import com.slcms.model.DocumentSensitivity;
import com.slcms.model.UserAccount;
import com.slcms.model.UserRole;
import com.slcms.model.UserStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise Role-Based Access Control (RBAC) & Security Service.
 * Implements strict zero-trust authorization per SLCMS Security Matrix.
 */
@Service
public class RBACSecurityService {

    private final Map<String, UserAccount> userDatabase = new ConcurrentHashMap<>();
    private final List<Map<String, Object>> auditLogs = Collections.synchronizedList(new ArrayList<>());
    private final List<com.slcms.model.SecurityAlert> securityAlerts = Collections.synchronizedList(new ArrayList<>());

    public RBACSecurityService() {
        seedInitialUsers();
    }

    private void seedInitialUsers() {
        // Ground truth initial database state: Sole initial Administrator account
        UserAccount admin = new UserAccount(
            "usr-001", "ADM-0001", "SLCMS System Administrator", "admin@slcms.local", "SecretLawFirm2026!",
            UserRole.ADMINISTRATOR, "System Administrator", com.slcms.model.AccountStatus.FIRST_LOGIN_RESET,
            "System Governance & Administration", null, true,
            Collections.emptyList()
        );
        admin.setPhone("+255 700 000 001");
        admin.setNationalIdRef("NIDA-19800101-0001-01");
        admin.setFirstLoginRequired(true);
        admin.setLastLoginAt(null);
        userDatabase.put(admin.getEmail().toLowerCase(), admin);
        userDatabase.put("slcms.admin", admin);
    }

    public List<UserAccount> getAllUsers() {
        return new ArrayList<>(userDatabase.values());
    }

    public UserAccount getUserByEmail(String email) {
        if (email == null) return null;
        return userDatabase.get(email.trim().toLowerCase());
    }

    public UserAccount getUserById(String id) {
        if (id == null) return null;
        return userDatabase.values().stream()
                .filter(u -> id.equalsIgnoreCase(u.getId()))
                .findFirst().orElse(null);
    }

    /**
     * Central authorization validator checking active state, role, assignment, and sensitivity.
     */
    public boolean authorizeAction(String userEmail, String action, String targetCaseId, DocumentSensitivity sensitivity) {
        UserAccount user = getUserByEmail(userEmail);
        if (user == null) {
            recordAudit(userEmail, "Unknown", action, targetCaseId, "DENIED - Unknown User");
            return false;
        }

        // 1. Security State Overrides
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            recordAudit(user.getEmail(), user.getRole().getDisplayName(), action, targetCaseId, "DENIED - Deactivated Account");
            return false;
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            recordAudit(user.getEmail(), user.getRole().getDisplayName(), action, targetCaseId, "DENIED - Locked Account");
            return false;
        }
        if (user.getStatus() == UserStatus.FIRST_LOGIN_PENDING && !"FIRST_LOGIN_PASSWORD_CHANGE".equalsIgnoreCase(action)) {
            recordAudit(user.getEmail(), user.getRole().getDisplayName(), action, targetCaseId, "DENIED - Password Change Required");
            return false;
        }

        UserRole role = user.getRole();
        boolean permitted = false;

        switch (action.toUpperCase()) {
            case "VIEW_ALL_CASES":
                permitted = (role == UserRole.MANAGING_PARTNER);
                break;

            case "VIEW_CASE":
            case "VIEW_CASE_DETAILS":
                if (role == UserRole.MANAGING_PARTNER) {
                    permitted = true;
                } else if (targetCaseId != null && user.getAssignedCaseIds().contains(targetCaseId)) {
                    permitted = (role == UserRole.SENIOR_COUNSEL || role == UserRole.ASSOCIATE_LAWYER ||
                                 role == UserRole.JUNIOR_LAWYER || role == UserRole.LEGAL_CLERK);
                }
                break;

            case "CREATE_CASE":
                permitted = (role == UserRole.MANAGING_PARTNER || role == UserRole.SENIOR_COUNSEL || role == UserRole.ASSOCIATE_LAWYER);
                break;

            case "ASSIGN_CASE":
            case "TRANSFER_CASE":
                permitted = (role == UserRole.MANAGING_PARTNER || role == UserRole.SENIOR_COUNSEL);
                break;

            case "CLOSE_CASE":
            case "REOPEN_CASE":
                permitted = (role == UserRole.MANAGING_PARTNER || role == UserRole.SENIOR_COUNSEL);
                break;

            case "UPLOAD_DOCUMENTS":
                if (role == UserRole.MANAGING_PARTNER) {
                    permitted = true;
                } else if (targetCaseId != null && user.getAssignedCaseIds().contains(targetCaseId)) {
                    permitted = (role == UserRole.SENIOR_COUNSEL || role == UserRole.ASSOCIATE_LAWYER ||
                                 role == UserRole.JUNIOR_LAWYER || role == UserRole.LEGAL_CLERK);
                }
                break;

            case "VIEW_DOCUMENT":
            case "DOWNLOAD_DOCUMENT":
                if (sensitivity == DocumentSensitivity.HIGHLY_CONFIDENTIAL || sensitivity == DocumentSensitivity.PRIVILEGED) {
                    if (role == UserRole.LEGAL_CLERK) {
                        permitted = false;
                    } else if (role == UserRole.MANAGING_PARTNER) {
                        permitted = true;
                    } else if (targetCaseId != null && user.getAssignedCaseIds().contains(targetCaseId)) {
                        permitted = (role == UserRole.SENIOR_COUNSEL || role == UserRole.ASSOCIATE_LAWYER);
                    }
                } else {
                    if (role == UserRole.MANAGING_PARTNER) {
                        permitted = true;
                    } else if (targetCaseId != null && user.getAssignedCaseIds().contains(targetCaseId)) {
                        permitted = true;
                    }
                }
                break;

            case "DRAFT_LEGAL_DOCUMENTS":
                permitted = (role == UserRole.MANAGING_PARTNER || role == UserRole.SENIOR_COUNSEL ||
                             role == UserRole.ASSOCIATE_LAWYER || role == UserRole.JUNIOR_LAWYER);
                break;

            case "APPROVE_LEGAL_DOCUMENTS":
            case "APPROVE_REPORTS":
                permitted = (role == UserRole.MANAGING_PARTNER || role == UserRole.SENIOR_COUNSEL);
                break;

            case "USE_LEGAL_AI":
                permitted = (role != UserRole.SYSTEM_ADMINISTRATOR);
                break;

            case "MANAGE_BILLING":
                permitted = (role == UserRole.MANAGING_PARTNER || role == UserRole.SENIOR_COUNSEL || role == UserRole.ASSOCIATE_LAWYER);
                break;

            case "MANAGE_ACCOUNTS":
            case "CONFIGURE_SECURITY":
            case "RESET_USER_PASSWORDS":
                permitted = (role == UserRole.SYSTEM_ADMINISTRATOR);
                break;

            case "VIEW_AUDIT_LOGS":
                permitted = (role == UserRole.SYSTEM_ADMINISTRATOR || role == UserRole.MANAGING_PARTNER || role == UserRole.SENIOR_COUNSEL);
                break;

            case "DELETE_AUDIT_LOGS":
                permitted = false; // Strictly denied for all
                break;

            default:
                permitted = false;
        }

        recordAudit(user.getEmail(), role.getDisplayName(), action, targetCaseId, permitted ? "ALLOWED" : "DENIED");
        return permitted;
    }

    public void recordAudit(String email, String role, String action, String resource, String result) {
        Map<String, Object> log = new LinkedHashMap<>();
        log.put("timestamp", LocalDateTime.now().toString());
        log.put("email", email);
        log.put("role", role);
        log.put("action", action);
        log.put("resource", resource != null ? resource : "System");
        log.put("result", result);
        auditLogs.add(log);
    }

    public List<Map<String, Object>> getAuditLogs() {
        return new ArrayList<>(auditLogs);
    }

    public List<com.slcms.model.SecurityAlert> getUnresolvedAlerts() {
        java.util.Comparator<com.slcms.model.SecurityAlert> comparator = java.util.Comparator
            .comparingInt((com.slcms.model.SecurityAlert a) -> {
                String sev = a.getSeverity() != null ? a.getSeverity().toUpperCase() : "LOW";
                switch (sev) {
                    case "HIGH": return 1;
                    case "MEDIUM": return 2;
                    default: return 3;
                }
            })
            .thenComparing(com.slcms.model.SecurityAlert::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()));

        List<com.slcms.model.SecurityAlert> unresolved = new ArrayList<>();
        synchronized (securityAlerts) {
            for (com.slcms.model.SecurityAlert alert : securityAlerts) {
                if (!alert.isResolved()) {
                    unresolved.add(alert);
                }
            }
        }
        unresolved.sort(comparator);
        return unresolved;
    }

    public long getUnresolvedAlertsCount() {
        synchronized (securityAlerts) {
            return securityAlerts.stream().filter(a -> !a.isResolved()).count();
        }
    }

    public com.slcms.model.SecurityAlert createSecurityAlert(com.slcms.model.SecurityAlert alert) {
        if (alert.getAlertId() == null || alert.getAlertId().trim().isEmpty()) {
            alert.setAlertId("alt-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5));
        }
        if (alert.getCreatedAt() == null) {
            alert.setCreatedAt(LocalDateTime.now());
        }
        alert.setResolved(false);
        securityAlerts.add(alert);
        return alert;
    }

    public boolean resolveAlert(String alertId, String resolvedBy) {
        synchronized (securityAlerts) {
            for (com.slcms.model.SecurityAlert alert : securityAlerts) {
                if (alert.getAlertId().equalsIgnoreCase(alertId)) {
                    alert.setResolved(true);
                    alert.setResolvedAt(LocalDateTime.now());
                    alert.setResolvedBy(resolvedBy != null ? resolvedBy : "ADM-0001");
                    return true;
                }
            }
        }
        return false;
    }

    public void resolveAlertsForUser(String userId, com.slcms.model.AlertType alertType, String resolvedBy) {
        synchronized (securityAlerts) {
            for (com.slcms.model.SecurityAlert alert : securityAlerts) {
                if (alert.getUserId() != null && alert.getUserId().equalsIgnoreCase(userId)) {
                    if (alertType == null || alert.getAlertType() == alertType) {
                        alert.setResolved(true);
                        alert.setResolvedAt(LocalDateTime.now());
                        alert.setResolvedBy(resolvedBy != null ? resolvedBy : "ADM-0001");
                    }
                }
            }
        }
    }

    public UserAccount getUserById(String userId) {
        if (userId == null) return null;
        for (UserAccount u : userDatabase.values()) {
            if (userId.equalsIgnoreCase(u.getId()) || userId.equalsIgnoreCase(u.getStaffId()) || userId.equalsIgnoreCase(u.getEmployeeId())) {
                return u;
            }
        }
        return null;
    }

    public boolean lockAccount(String userId, String reason, String lockedBy, Long lockedUntil) {
        UserAccount user = getUserById(userId);
        if (user == null) return false;

        user.setAccountStatus(com.slcms.model.AccountStatus.LOCKED);
        user.setStatus(com.slcms.model.UserStatus.LOCKED);
        user.setLockedAt(LocalDateTime.now());
        user.setLockedUntil(lockedUntil); // null = indefinite administrator manual lock
        user.setLockedBy(lockedBy);
        user.setLockedReason(reason);

        // Record security activity
        recordAudit(user.getEmail(), user.getRole().getDisplayName(), "Account Locked", "Security",
                (lockedUntil == null ? "Administrative manual lock" : "Automatic lockout") + ": " + reason);

        // Create genuine security alert
        boolean isAuto = (lockedUntil != null);
        String title = isAuto ? "Account Locked Automatically" : "Account Locked by Administrator";
        String desc = isAuto ? "The account was locked after five unsuccessful login attempts."
                             : "Reason: " + (reason != null ? reason : "Unauthorized activity review");

        com.slcms.model.SecurityAlert alert = new com.slcms.model.SecurityAlert(
                "alt-" + System.currentTimeMillis(),
                user.getId(),
                user.getStaffId(),
                user.getName(),
                user.getRole().getDisplayName(),
                com.slcms.model.AlertType.ACCOUNT_LOCKED,
                title,
                desc,
                "HIGH"
        );
        alert.setLockedBy(lockedBy);
        alert.setLockedReason(reason);
        createSecurityAlert(alert);
        return true;
    }

    public boolean unlockAccount(String userId, String reason, String unlockedBy, boolean forcePasswordReset) {
        UserAccount user = getUserById(userId);
        if (user == null) return false;

        if (forcePasswordReset) {
            user.setAccountStatus(com.slcms.model.AccountStatus.FIRST_LOGIN_RESET);
            user.setStatus(com.slcms.model.UserStatus.FIRST_LOGIN_PENDING);
            user.setFirstLoginRequired(true);
            user.setMustChangePassword(true);
            user.setTemporaryPasswordExpiresAt(LocalDateTime.now().plusHours(24));
        } else {
            user.setAccountStatus(com.slcms.model.AccountStatus.ACTIVE);
            user.setStatus(com.slcms.model.UserStatus.ACTIVE);
        }

        user.setFailedAttempts(0);
        user.setFailedLoginAttempts(0);
        user.setLockedAt(null);
        user.setLockedUntil(null);
        user.setLockedReason(null);
        user.setLockedBy(null);

        // Resolve existing lock alert(s)
        resolveAlertsForUser(user.getId(), com.slcms.model.AlertType.ACCOUNT_LOCKED, unlockedBy);

        if (forcePasswordReset) {
            // Create FIRST_LOGIN_PENDING alert
            com.slcms.model.SecurityAlert resetAlert = new com.slcms.model.SecurityAlert(
                    "alt-" + System.currentTimeMillis(),
                    user.getId(),
                    user.getStaffId(),
                    user.getName(),
                    user.getRole().getDisplayName(),
                    com.slcms.model.AlertType.FIRST_LOGIN_PENDING,
                    "First Login Not Completed",
                    "Temporary credentials issued following unlock. Password change required before system access.",
                    "MEDIUM"
            );
            createSecurityAlert(resetAlert);
        }

        recordAudit(user.getEmail(), user.getRole().getDisplayName(), "Account Unlocked", "Security",
                "Administrative unlock granted by " + unlockedBy + (reason != null ? " (" + reason + ")" : ""));
        return true;
    }
}
