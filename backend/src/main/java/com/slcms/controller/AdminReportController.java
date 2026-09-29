package com.slcms.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.slcms.model.*;
import com.slcms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Enterprise Administrator System Report Generator REST API.
 * Connects exclusively to persistent MySQL tables:
 * - users
 * - security_events
 * - system_setting_audit
 * - system_backups
 *
 * Implements strict Separation of Duties: Exposes ONLY administrative metadata.
 * Never exposes case facts, pleadings, evidence, client data, or lawyer notes.
 */
@RestController
@RequestMapping("/api/admin/reports")
@CrossOrigin(originPatterns = "*")
public class AdminReportController {

    private final UserRepository userRepository;
    private final SecurityEventRepository securityEventRepository;
    private final SystemSettingAuditJpaRepository systemSettingAuditJpaRepository;
    private final SystemBackupJpaRepository systemBackupJpaRepository;
    private final SystemSettingRepository systemSettingRepository;

    private static final String HISTORY_FILE = "data/admin_report_history.json";
    private final ObjectMapper objectMapper;
    private final List<Map<String, Object>> reportHistory = new CopyOnWriteArrayList<>();

    @Autowired
    public AdminReportController(UserRepository userRepository,
                                 SecurityEventRepository securityEventRepository,
                                 SystemSettingAuditJpaRepository systemSettingAuditJpaRepository,
                                 SystemBackupJpaRepository systemBackupJpaRepository,
                                 SystemSettingRepository systemSettingRepository) {
        this.userRepository = userRepository;
        this.securityEventRepository = securityEventRepository;
        this.systemSettingAuditJpaRepository = systemSettingAuditJpaRepository;
        this.systemBackupJpaRepository = systemBackupJpaRepository;
        this.systemSettingRepository = systemSettingRepository;

        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        loadReportHistory();
    }

    private synchronized void loadReportHistory() {
        try {
            File file = new File(HISTORY_FILE);
            if (file.exists() && file.length() > 0) {
                List<Map<String, Object>> loaded = objectMapper.readValue(file, new TypeReference<List<Map<String, Object>>>() {});
                reportHistory.clear();
                reportHistory.addAll(loaded);
            }
        } catch (Exception e) {
            System.err.println("Notice: Could not load report history: " + e.getMessage());
        }
    }

    private synchronized void saveReportHistory() {
        try {
            Path dir = Paths.get("data");
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            objectMapper.writeValue(new File(HISTORY_FILE), reportHistory);
        } catch (IOException e) {
            System.err.println("Notice: Could not save report history: " + e.getMessage());
        }
    }

    /**
     * Role authorization check: Must be Administrator
     */
    private boolean isAuthorizedAdmin(String roleHeader) {
        if (roleHeader == null || roleHeader.trim().isEmpty()) {
            return true; // If frontend local fallback doesn't send header, allow session validation
        }
        String r = roleHeader.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        return r.contains("ADMIN") || r.contains("MANAGING_PARTNER");
    }

    /**
     * POST /api/admin/reports/generate
     * Generate administrative report from real MySQL records
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateReport(@RequestBody Map<String, Object> request,
                                            @RequestHeader(value = "X-User-Role", required = false) String requesterRole,
                                            @RequestHeader(value = "X-User-Name", required = false) String requesterName) {

        if (!isAuthorizedAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access Denied: Only Administrators may generate system reports."));
        }

        String reportType = String.valueOf(request.getOrDefault("reportType", "users")).toLowerCase().trim();
        String fromDateStr = (String) request.get("fromDate");
        String toDateStr = (String) request.get("toDate");
        String status = (String) request.getOrDefault("status", "All");
        String generatedBy = requesterName != null && !requesterName.trim().isEmpty() ? requesterName.trim() : "System Administrator";

        LocalDate fromDate = parseDate(fromDateStr);
        LocalDate toDate = parseDate(toDateStr);

        Map<String, Object> responseData = new LinkedHashMap<>();
        responseData.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
        responseData.put("generatedBy", generatedBy);
        responseData.put("reportingPeriod", formatPeriod(fromDateStr, toDateStr));
        responseData.put("statusFilter", status);

        switch (reportType) {
            case "users":
            case "users_report":
                generateUsersReport(responseData, fromDate, toDate, status);
                break;
            case "security":
            case "login_security":
            case "login_and_security":
                generateSecurityReport(responseData, fromDate, toDate, status);
                break;
            case "activity":
            case "system_activity":
                generateActivityReport(responseData, fromDate, toDate, status);
                break;
            case "backup":
            case "backups":
            case "backup_report":
                generateBackupReport(responseData, fromDate, toDate, status);
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid report type: " + reportType));
        }

        // Record into report history
        Map<String, Object> historyEntry = new LinkedHashMap<>();
        historyEntry.put("id", UUID.randomUUID().toString());
        historyEntry.put("reportName", responseData.get("reportTitle"));
        historyEntry.put("reportType", reportType);
        historyEntry.put("generatedDate", responseData.get("generatedAt"));
        historyEntry.put("generatedBy", generatedBy);
        historyEntry.put("reportingPeriod", responseData.get("reportingPeriod"));
        historyEntry.put("recordCount", ((List<?>) responseData.get("records")).size());
        
        reportHistory.add(0, historyEntry);
        // Keep max 50 historical entries
        if (reportHistory.size() > 50) {
            reportHistory.remove(reportHistory.size() - 1);
        }
        saveReportHistory();

        return ResponseEntity.ok(responseData);
    }

    /**
     * GET /api/admin/reports/history
     * Returns previously generated reports
     */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getReportHistory(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAuthorizedAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(reportHistory);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. USERS REPORT (MySQL table: users)
    // ─────────────────────────────────────────────────────────────────────────────
    private void generateUsersReport(Map<String, Object> out, LocalDate from, LocalDate to, String status) {
        out.put("reportTitle", "Users Report");
        out.put("reportType", "users");

        List<UserAccount> allUsers = userRepository.findAll();
        List<Map<String, Object>> records = new ArrayList<>();

        int totalUsers = 0;
        int activeUsers = 0;
        int lockedUsers = 0;
        int firstLoginPending = 0;
        int suspendedUsers = 0;

        for (UserAccount u : allUsers) {
            totalUsers++;

            String accStatus = u.getAccountStatus() != null ? u.getAccountStatus().name() : "ACTIVE";
            boolean isLocked = u.isAdminLocked() || "LOCKED".equalsIgnoreCase(accStatus) ||
                    (u.getLockedUntil() != null && System.currentTimeMillis() < u.getLockedUntil());
            boolean isFirstLogin = u.isFirstLoginRequired() || "FIRST_LOGIN_RESET".equalsIgnoreCase(accStatus);
            boolean isSuspended = "SUSPENDED".equalsIgnoreCase(accStatus) || "DEACTIVATED".equalsIgnoreCase(accStatus);

            if (isLocked) {
                lockedUsers++;
            } else if (isFirstLogin) {
                firstLoginPending++;
            } else if (isSuspended) {
                suspendedUsers++;
            } else {
                activeUsers++;
            }

            // Date filtering on created_at
            if (from != null && u.getCreatedAt() != null && u.getCreatedAt().toLocalDate().isBefore(from)) {
                continue;
            }
            if (to != null && u.getCreatedAt() != null && u.getCreatedAt().toLocalDate().isAfter(to)) {
                continue;
            }

            // Status filtering
            String displayStatus;
            if (isLocked) {
                displayStatus = "Locked";
            } else if (isFirstLogin) {
                displayStatus = "First Login Pending";
            } else if (isSuspended) {
                displayStatus = "Suspended";
            } else {
                displayStatus = "Active";
            }

            if (status != null && !"All".equalsIgnoreCase(status.trim())) {
                if (!displayStatus.equalsIgnoreCase(status.trim())) {
                    continue;
                }
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("staffId", u.getStaffId() != null ? u.getStaffId() : (u.getId() != null ? u.getId() : "N/A"));
            row.put("fullName", u.getName() != null ? u.getName() : "N/A");
            row.put("role", u.getRole() != null ? u.getRole().getDisplayName() : (u.getRoleTitle() != null ? u.getRoleTitle() : "Staff"));
            
            String phoneStr = u.getPhone() != null && !u.getPhone().trim().isEmpty() ? u.getPhone().trim() : "None";
            row.put("emailPhone", u.getEmail() + " | " + phoneStr);
            row.put("status", displayStatus);
            row.put("dateCreated", u.getCreatedAt() != null ? u.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A");

            LocalDateTime lastLogin = u.getLastLoginAt() != null ? u.getLastLoginAt() : u.getLastSuccessfulLogin();
            row.put("lastLogin", lastLogin != null ? lastLogin.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "Never");

            records.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Total Users", totalUsers);
        summary.put("Active", activeUsers);
        summary.put("Locked", lockedUsers);
        summary.put("First Login Pending", firstLoginPending);
        if (suspendedUsers > 0) {
            summary.put("Suspended", suspendedUsers);
        }

        out.put("summary", summary);
        out.put("records", records);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. LOGIN AND SECURITY REPORT (MySQL table: security_events)
    // ─────────────────────────────────────────────────────────────────────────────
    private void generateSecurityReport(Map<String, Object> out, LocalDate from, LocalDate to, String status) {
        out.put("reportTitle", "Login and Security Report");
        out.put("reportType", "security");

        List<SecurityEvent> events = securityEventRepository.findAllByOrderByEventTimeDesc();
        List<Map<String, Object>> records = new ArrayList<>();

        int totalEvents = 0;
        int successfulLogins = 0;
        int failedLogins = 0;
        int lockedEvents = 0;
        int blockedEvents = 0;

        for (SecurityEvent ev : events) {
            totalEvents++;

            String res = ev.getResult() != null ? ev.getResult().trim() : "SUCCESS";
            String desc = ev.getDescription() != null ? ev.getDescription() : "";
            String typeStr = ev.getEventType() != null ? ev.getEventType().name() : "";

            boolean isSuccess = "SUCCESS".equalsIgnoreCase(res) || "SUCCESSFUL".equalsIgnoreCase(res) || desc.toLowerCase().contains("success");
            boolean isFailed = "FAILED".equalsIgnoreCase(res) || desc.toLowerCase().contains("failed") || typeStr.contains("FAILED");
            boolean isLocked = desc.toLowerCase().contains("locked") || typeStr.contains("LOCK");
            boolean isBlocked = "BLOCKED".equalsIgnoreCase(res) || desc.toLowerCase().contains("blocked");

            if (isSuccess) successfulLogins++;
            if (isFailed) failedLogins++;
            if (isLocked) lockedEvents++;
            if (isBlocked) blockedEvents++;

            // Date filtering
            if (from != null && ev.getEventTime() != null && ev.getEventTime().toLocalDate().isBefore(from)) {
                continue;
            }
            if (to != null && ev.getEventTime() != null && ev.getEventTime().toLocalDate().isAfter(to)) {
                continue;
            }

            // Status filtering: Successful, Failed, Locked, Blocked
            String displayStatus = isLocked ? "Locked" : (isBlocked ? "Blocked" : (isFailed ? "Failed" : "Successful"));
            if (status != null && !"All".equalsIgnoreCase(status.trim())) {
                if (!displayStatus.equalsIgnoreCase(status.trim())) {
                    continue;
                }
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("user", ev.getUserName() != null && !ev.getUserName().trim().isEmpty() ? ev.getUserName() : ev.getUserId());
            row.put("dateTime", ev.getEventTime() != null ? ev.getEventTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "N/A");
            row.put("activity", ev.getEventType() != null ? ev.getEventType().getDisplayName() : (desc.isEmpty() ? "Login activity" : desc));
            row.put("status", displayStatus);
            row.put("lockUnlock", isLocked ? "Account Locked" : (desc.toLowerCase().contains("unlock") ? "Account Unlocked" : "Standard Session"));
            row.put("ipAddress", ev.getIpAddress() != null && !ev.getIpAddress().trim().isEmpty() ? ev.getIpAddress() : "Internal");

            // CRITICAL: NEVER show passwords or tokens
            records.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Total Events", totalEvents);
        summary.put("Successful", successfulLogins);
        summary.put("Failed", failedLogins);
        summary.put("Account Locks", lockedEvents);

        out.put("summary", summary);
        out.put("records", records);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. SYSTEM ACTIVITY REPORT (MySQL tables: security_events & system_setting_audit)
    // ─────────────────────────────────────────────────────────────────────────────
    private void generateActivityReport(Map<String, Object> out, LocalDate from, LocalDate to, String status) {
        out.put("reportTitle", "System Activity Report");
        out.put("reportType", "activity");

        List<Map<String, Object>> records = new ArrayList<>();
        int successfulActions = 0;
        int failedActions = 0;
        Set<String> uniqueAdmins = new HashSet<>();

        // 1. Settings audits
        try {
            List<SystemSettingAudit> audits = systemSettingAuditJpaRepository.findAllByOrderByCreatedAtDesc();
            for (SystemSettingAudit a : audits) {
                if (from != null && a.getCreatedAt() != null && a.getCreatedAt().toLocalDate().isBefore(from)) continue;
                if (to != null && a.getCreatedAt() != null && a.getCreatedAt().toLocalDate().isAfter(to)) continue;

                boolean isSuccess = !"FAILED".equalsIgnoreCase(a.getActionStatus());
                String resStr = isSuccess ? "Successful" : "Failed";

                if (isSuccess) successfulActions++; else failedActions++;
                if (a.getAdminName() != null) uniqueAdmins.add(a.getAdminName());

                if (status != null && !"All".equalsIgnoreCase(status.trim()) && !resStr.equalsIgnoreCase(status.trim())) {
                    continue;
                }

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("date", a.getCreatedAt() != null ? a.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "N/A");
                row.put("administrator", a.getAdminName() != null ? a.getAdminName() : (a.getAdminId() != null ? a.getAdminId() : "System Administrator"));
                row.put("action", "System setting changed: " + a.getSettingKey());
                row.put("affectedRecord", a.getSettingKey() + " -> " + (a.getNewValue() != null ? a.getNewValue() : "Updated"));
                row.put("result", resStr);
                row.put("timestamp", a.getCreatedAt());
                records.add(row);
            }
        } catch (Exception e) {
            System.err.println("Notice: Could not load setting audits: " + e.getMessage());
        }

        // 2. Admin security events (user created, details updated, password reset, lock/unlock, backups)
        try {
            List<SecurityEvent> events = securityEventRepository.findAllByOrderByEventTimeDesc();
            for (SecurityEvent ev : events) {
                String typeStr = ev.getEventType() != null ? ev.getEventType().name() : "";
                // Filter for administrative actions
                if (!typeStr.contains("MANAGEMENT") && !typeStr.contains("LOCK") && !typeStr.contains("BACKUP") && !typeStr.contains("RESET")) {
                    continue;
                }

                if (from != null && ev.getEventTime() != null && ev.getEventTime().toLocalDate().isBefore(from)) continue;
                if (to != null && ev.getEventTime() != null && ev.getEventTime().toLocalDate().isAfter(to)) continue;

                boolean isSuccess = !"FAILED".equalsIgnoreCase(ev.getResult());
                String resStr = isSuccess ? "Successful" : "Failed";

                if (isSuccess) successfulActions++; else failedActions++;
                if (ev.getUserName() != null) uniqueAdmins.add(ev.getUserName());

                if (status != null && !"All".equalsIgnoreCase(status.trim()) && !resStr.equalsIgnoreCase(status.trim())) {
                    continue;
                }

                String actionLabel;
                if (typeStr.contains("USER_MANAGEMENT")) actionLabel = "User account provisioned / updated";
                else if (typeStr.contains("PASSWORD")) actionLabel = "Password reset";
                else if (typeStr.contains("ADMIN_LOCK")) actionLabel = "Account locked by Administrator";
                else if (typeStr.contains("ADMIN_UNLOCK")) actionLabel = "Account unlocked by Administrator";
                else if (typeStr.contains("BACKUP")) actionLabel = "Backup created / tested";
                else actionLabel = ev.getEventType().getDisplayName();

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("date", ev.getEventTime() != null ? ev.getEventTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "N/A");
                row.put("administrator", ev.getUserName() != null && !ev.getUserName().trim().isEmpty() ? ev.getUserName() : "System Administrator");
                row.put("action", actionLabel);
                row.put("affectedRecord", ev.getDescription() != null && !ev.getDescription().trim().isEmpty() ? ev.getDescription() : ev.getUserId());
                row.put("result", resStr);
                row.put("timestamp", ev.getEventTime());
                records.add(row);
            }
        } catch (Exception e) {
            System.err.println("Notice: Could not load security events for activity: " + e.getMessage());
        }

        // Sort descending by date
        records.sort((a, b) -> {
            LocalDateTime tA = (LocalDateTime) a.get("timestamp");
            LocalDateTime tB = (LocalDateTime) b.get("timestamp");
            if (tA == null || tB == null) return 0;
            return tB.compareTo(tA);
        });

        // Remove helper timestamp field from output
        for (Map<String, Object> r : records) {
            r.remove("timestamp");
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Total Actions", successfulActions + failedActions);
        summary.put("Successful", successfulActions);
        summary.put("Failed", failedActions);
        summary.put("Active Admins", Math.max(1, uniqueAdmins.size()));

        out.put("summary", summary);
        out.put("records", records);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. BACKUP REPORT (MySQL table: system_backups)
    // ─────────────────────────────────────────────────────────────────────────────
    private void generateBackupReport(Map<String, Object> out, LocalDate from, LocalDate to, String status) {
        out.put("reportTitle", "Backup Report");
        out.put("reportType", "backup");

        List<SystemBackup> backups = systemBackupJpaRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> records = new ArrayList<>();

        int totalBackups = 0;
        int healthyCount = 0;
        int failedCount = 0;
        int testedCount = 0;
        long totalBytes = 0;

        for (SystemBackup b : backups) {
            totalBackups++;
            totalBytes += (b.getSizeBytes() != null ? b.getSizeBytes() : 0);

            boolean isHealthy = "Successful".equalsIgnoreCase(b.getStatus()) || "Healthy".equalsIgnoreCase(b.getStatus()) || "COMPLETED".equalsIgnoreCase(b.getStatus());
            boolean isFailed = "Failed".equalsIgnoreCase(b.getStatus()) || "Error".equalsIgnoreCase(b.getStatus());

            if (isHealthy) healthyCount++;
            if (isFailed) failedCount++;
            if (b.isVerified()) testedCount++;

            if (from != null && b.getCreatedAt() != null && b.getCreatedAt().toLocalDate().isBefore(from)) continue;
            if (to != null && b.getCreatedAt() != null && b.getCreatedAt().toLocalDate().isAfter(to)) continue;

            String displayStatus = isHealthy ? "Healthy" : "Failed";
            if (status != null && !"All".equalsIgnoreCase(status.trim())) {
                if (!displayStatus.equalsIgnoreCase(status.trim())) {
                    continue;
                }
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("filename", b.getFilename() != null ? b.getFilename() : "slcms_backup.sql");
            row.put("dateCreated", b.getCreatedAt() != null ? b.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "N/A");
            row.put("size", formatBytes(b.getSizeBytes()));
            row.put("createdBy", b.getCreatedBy() != null && !b.getCreatedBy().trim().isEmpty() ? b.getCreatedBy() : "System Administrator");
            row.put("status", displayStatus);
            row.put("tested", b.isVerified() ? "Tested" : "Not tested");

            records.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Total Backups", totalBackups);
        summary.put("Healthy", healthyCount);
        summary.put("Failed", failedCount);
        summary.put("Tested", testedCount);

        out.put("summary", summary);
        out.put("records", records);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────────
    private LocalDate parseDate(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            str = str.trim();
            if (str.contains("/")) {
                String[] parts = str.split("/");
                if (parts.length == 3) {
                    int day = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    return LocalDate.of(year, month, day);
                }
            }
            return LocalDate.parse(str); // Default ISO (yyyy-MM-dd)
        } catch (Exception e) {
            return null;
        }
    }

    private String formatPeriod(String fromStr, String toStr) {
        if ((fromStr == null || fromStr.isEmpty()) && (toStr == null || toStr.isEmpty())) {
            return "All Recorded History";
        }
        String f = fromStr != null && !fromStr.isEmpty() ? fromStr : "Beginning of Records";
        String t = toStr != null && !toStr.isEmpty() ? toStr : "Present";
        return f + " to " + t;
    }

    private String formatBytes(Long bytes) {
        if (bytes == null || bytes <= 0) return "0 KB";
        if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        }
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }
}
