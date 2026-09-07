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

    public RBACSecurityService() {
        seedInitialUsers();
    }

    private void seedInitialUsers() {
        // 1. Managing Partner
        UserAccount mp = new UserAccount(
            "usr-001", "EMP-1001", "Eleanor Vance, Esq.", "e.vance@slcms-law.com", "SecretLawFirm2026!",
            UserRole.MANAGING_PARTNER, "Managing Partner", com.slcms.model.AccountStatus.ACTIVE,
            "Commercial & Corporate Litigation", "TZ-ADV-4829104", false,
            Arrays.asList("case-101", "case-102", "case-103", "case-104", "case-105")
        );
        mp.setPhone("+1 (212) 555-0101");
        mp.setPractisingCertNo("PC-TZ-2026-0001");
        mp.setNationalIdRef("NIDA-19800412-1001-99");
        userDatabase.put(mp.getEmail().toLowerCase(), mp);

        // 2. Senior Counsel
        UserAccount sc = new UserAccount(
            "usr-002", "EMP-1002", "Julian Mercer, Esq.", "j.mercer@slcms-law.com", "SecretLawFirm2026!",
            UserRole.SENIOR_COUNSEL, "Senior Litigation Counsel", com.slcms.model.AccountStatus.ACTIVE,
            "Intellectual Property & Employment", "TZ-ADV-2938102", false,
            Arrays.asList("case-102", "case-103")
        );
        sc.setPhone("+1 (212) 555-0102");
        sc.setPractisingCertNo("PC-TZ-2026-0042");
        sc.setNationalIdRef("NIDA-19830514-1002-77");
        userDatabase.put(sc.getEmail().toLowerCase(), sc);

        // 3. Associate Lawyer
        UserAccount assoc = new UserAccount(
            "usr-003", "EMP-1003", "David Croft, Esq.", "d.croft@slcms-law.com", "SecretLawFirm2026!",
            UserRole.ASSOCIATE_LAWYER, "Associate Litigation Lawyer", com.slcms.model.AccountStatus.ACTIVE,
            "Commercial Litigation", "TZ-ADV-7193021", false,
            Arrays.asList("case-101", "case-104")
        );
        assoc.setPhone("+1 (212) 555-0103");
        assoc.setPractisingCertNo("PC-TZ-2026-0189");
        assoc.setNationalIdRef("NIDA-19881120-1003-65");
        userDatabase.put(assoc.getEmail().toLowerCase(), assoc);

        // 4. Junior Lawyer
        UserAccount jl = new UserAccount(
            "usr-004", "EMP-1004", "Maya Patel", "m.patel@slcms-law.com", "SecretLawFirm2026!",
            UserRole.JUNIOR_LAWYER, "Junior Legal Associate", com.slcms.model.AccountStatus.ACTIVE,
            "Appellate & Research", "TZ-ADV-9023145", false,
            Arrays.asList("case-101", "case-102")
        );
        jl.setPhone("+1 (212) 555-0104");
        jl.setPractisingCertNo("PC-TZ-2026-0312");
        jl.setNationalIdRef("NIDA-19920708-1004-33");
        userDatabase.put(jl.getEmail().toLowerCase(), jl);

        // 5. Legal Clerk
        UserAccount clerk = new UserAccount(
            "usr-005", "EMP-1005", "Marcus Bell", "m.bell@slcms-law.com", "SecretLawFirm2026!",
            UserRole.LEGAL_CLERK, "Senior Legal Clerk", com.slcms.model.AccountStatus.ACTIVE,
            "Court Filings & Discovery", null, false,
            Arrays.asList("case-101", "case-102", "case-103", "case-104", "case-105")
        );
        clerk.setPhone("+1 (212) 555-0105");
        clerk.setNationalIdRef("NIDA-19910319-1005-12");
        userDatabase.put(clerk.getEmail().toLowerCase(), clerk);

        // 6. System Administrator
        UserAccount admin = new UserAccount(
            "usr-006", "EMP-1006", "Alexandre Sterling", "admin.sterling@slcms-law.com", "SecretLawFirm2026!",
            UserRole.SYSTEM_ADMINISTRATOR, "Chief Information Security Officer", com.slcms.model.AccountStatus.ACTIVE,
            "IT Infrastructure & Security", null, false,
            Collections.emptyList()
        );
        admin.setPhone("+1 (212) 555-0106");
        admin.setNationalIdRef("NIDA-19850928-1006-44");
        userDatabase.put(admin.getEmail().toLowerCase(), admin);

        // 7. Security State Test: First Login Pending
        UserAccount firstLogin = new UserAccount(
            "usr-007", "EMP-1007", "Teresa Bradley, Esq. (First Login)", "temp.counsel@slcms-law.com", "TempPass2026!",
            UserRole.ASSOCIATE_LAWYER, "Associate Litigation Counsel", com.slcms.model.AccountStatus.FIRST_LOGIN_RESET,
            "Commercial Litigation", "TZ-ADV-8834190", true,
            Arrays.asList("case-101")
        );
        firstLogin.setPhone("+1 (212) 555-0107");
        firstLogin.setPractisingCertNo("PC-TZ-2026-0994");
        firstLogin.setNationalIdRef("NIDA-19890214-1007-55");
        userDatabase.put(firstLogin.getEmail().toLowerCase(), firstLogin);

        // 8. Security State Test: Locked Account
        UserAccount locked = new UserAccount(
            "usr-008", "EMP-1008", "Victoria Hayes (Locked Account)", "locked.user@slcms-law.com", "SecretLawFirm2026!",
            UserRole.LEGAL_CLERK, "Litigation Paralegal", com.slcms.model.AccountStatus.LOCKED,
            "Appellate Filings", null, false,
            Arrays.asList("case-101")
        );
        locked.setPhone("+1 (212) 555-0108");
        locked.setNationalIdRef("NIDA-19931201-1008-21");
        locked.setFailedAttempts(5);
        locked.setLockedUntil(System.currentTimeMillis() + 15 * 60 * 1000);
        userDatabase.put(locked.getEmail().toLowerCase(), locked);

        // 9. Security State Test: Deactivated Account
        UserAccount deactivated = new UserAccount(
            "usr-009", "EMP-1009", "Arthur Pendelton (Deactivated)", "disabled.user@slcms-law.com", "SecretLawFirm2026!",
            UserRole.SENIOR_COUNSEL, "Former Senior Counsel", com.slcms.model.AccountStatus.DEACTIVATED,
            "Tax & Estate", "TZ-ADV-1109482", false,
            Collections.emptyList()
        );
        deactivated.setPhone("+1 (212) 555-0109");
        deactivated.setNationalIdRef("NIDA-19750611-1009-88");
        userDatabase.put(deactivated.getEmail().toLowerCase(), deactivated);

        // 10. Security State Test: Pending Approval Account
        UserAccount pendingApp = new UserAccount(
            "usr-010", "EMP-1010", "Grace Mollel (Pending Approval)", "pending.approval@slcms-law.com", "SecretLawFirm2026!",
            UserRole.SENIOR_COUNSEL, "Senior Counsel Candidate", com.slcms.model.AccountStatus.PENDING_APPROVAL,
            "Banking & Financial Litigation", "TZ-ADV-9920194", false,
            Collections.emptyList()
        );
        pendingApp.setPhone("+1 (212) 555-0110");
        pendingApp.setPractisingCertNo("PC-TZ-2026-1188");
        pendingApp.setNationalIdRef("NIDA-19900822-1010-09");
        userDatabase.put(pendingApp.getEmail().toLowerCase(), pendingApp);
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
}
