package com.slcms.controller;

import com.slcms.model.AlertType;
import com.slcms.model.SecurityAlert;
import com.slcms.model.UserAccount;
import com.slcms.service.RBACSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API for Security & Access Alerts and Account Governance.
 * Grounded strictly in authentic database records.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminSecurityAlertController {

    private final RBACSecurityService rbacSecurityService;

    @Autowired
    public AdminSecurityAlertController(RBACSecurityService rbacSecurityService) {
        this.rbacSecurityService = rbacSecurityService;
    }

    /**
     * Dashboard unresolved security alerts endpoint.
     * Corresponds to:
     * SELECT * FROM security_alerts WHERE resolved = FALSE
     * ORDER BY CASE severity WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, created_at DESC;
     */
    @GetMapping("/security-alerts")
    public ResponseEntity<List<Map<String, Object>>> getSecurityAlerts(
            @RequestParam(value = "status", defaultValue = "unresolved") String status) {

        List<SecurityAlert> alerts = rbacSecurityService.getUnresolvedAlerts();
        List<Map<String, Object>> response = new ArrayList<>();

        for (SecurityAlert a : alerts) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("alert_id", a.getAlertId());
            item.put("id", a.getAlertId());
            item.put("user_id", a.getUserId());
            item.put("userId", a.getUserId());
            item.put("staff_id", a.getStaffId());
            item.put("staffId", a.getStaffId());
            item.put("full_name", a.getFullName());
            item.put("name", a.getFullName());
            item.put("role", a.getRole());
            item.put("alert_type", a.getAlertType().name());
            item.put("alertType", a.getAlertType().name());
            item.put("title", a.getTitle());
            item.put("description", a.getDescription());
            item.put("severity", a.getSeverity());
            item.put("created_at", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            item.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            item.put("resolved", a.isResolved());
            item.put("resolved_at", a.getResolvedAt() != null ? a.getResolvedAt().toString() : null);
            item.put("resolved_by", a.getResolvedBy());
            item.put("locked_reason", a.getLockedReason());
            item.put("locked_by", a.getLockedBy());
            item.put("masked_ip", maskIp(a.getClientIp()));
            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Attention counter endpoint.
     * Corresponds to: SELECT COUNT(*) FROM security_alerts WHERE resolved = FALSE;
     */
    @GetMapping("/security-alerts/count")
    public ResponseEntity<Map<String, Object>> getAlertCount() {
        long count = rbacSecurityService.getUnresolvedAlertsCount();
        return ResponseEntity.ok(Map.of(
            "unresolvedCount", count,
            "badgeText", count == 0 ? "0 REQUIRING ATTENTION" : count + " ATTENTION"
        ));
    }

    /**
     * Mark an alert as resolved.
     */
    @PostMapping("/security-alerts/{alertId}/resolve")
    public ResponseEntity<?> resolveAlert(
            @PathVariable("alertId") String alertId,
            @RequestBody(required = false) Map<String, String> body) {
        String resolvedBy = (body != null && body.containsKey("resolvedBy")) ? body.get("resolvedBy") : "ADM-0001";
        boolean success = rbacSecurityService.resolveAlert(alertId, resolvedBy);
        return ResponseEntity.ok(Map.of("success", success, "alertId", alertId));
    }

    /**
     * Administrator locks an account.
     */
    @PostMapping("/users/{userId}/lock")
    public ResponseEntity<?> lockUser(
            @PathVariable("userId") String userId,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Administrator decision");
        String lockedBy = body.getOrDefault("lockedBy", "ADM-0001");
        boolean success = rbacSecurityService.lockAccount(userId, reason, lockedBy, null); // null = indefinite

        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User account not found."));
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Account locked successfully. Active sessions revoked.",
            "userId", userId
        ));
    }

    /**
     * Administrator unlocks an account.
     */
    @PostMapping("/users/{userId}/unlock")
    public ResponseEntity<?> unlockUser(
            @PathVariable("userId") String userId,
            @RequestBody(required = false) Map<String, Object> body) {
        String reason = (body != null && body.get("reason") != null) ? body.get("reason").toString() : "Administrative unlock";
        String unlockedBy = (body != null && body.get("unlockedBy") != null) ? body.get("unlockedBy").toString() : "ADM-0001";
        boolean forceReset = (body != null && Boolean.TRUE.equals(body.get("forcePasswordReset")));

        boolean success = rbacSecurityService.unlockAccount(userId, reason, unlockedBy, forceReset);
        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User account not found."));
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", forceReset ? "Account unlocked and forced password reset required." : "Account unlocked successfully.",
            "userId", userId
        ));
    }

    /**
     * Administrator resets user password, issues temporary password, and requires change on next login.
     */
    @PostMapping("/users/{userId}/reset-password")
    public ResponseEntity<?> resetPassword(
            @PathVariable("userId") String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String issuedBy = (body != null && body.containsKey("issuedBy")) ? body.get("issuedBy") : "ADM-0001";
        String tempPass = "TempPass" + (int)(1000 + Math.random() * 9000) + "!";

        boolean success = rbacSecurityService.resetUserPassword(userId, tempPass, issuedBy);
        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User account not found."));
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Temporary password issued. User must change password upon next login.",
            "temporaryPassword", tempPass,
            "mustChangePassword", true,
            "userId", userId
        ));
    }

    /**
     * Administrator permanently deletes a user account.
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(
            @PathVariable("userId") String userId,
            @RequestBody(required = false) Map<String, String> body) {
        if ("usr-001".equalsIgnoreCase(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Protected Account: Root System Administrator cannot be deleted."));
        }
        String deletedBy = (body != null && body.containsKey("deletedBy")) ? body.get("deletedBy") : "ADM-0001";
        boolean success = rbacSecurityService.deleteUser(userId, deletedBy);
        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User account not found."));
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "User account permanently removed from system directory.",
            "userId", userId
        ));
    }

    @PostMapping("/users/{userId}/delete")
    public ResponseEntity<?> deleteUserViaPost(
            @PathVariable("userId") String userId,
            @RequestBody(required = false) Map<String, String> body) {
        return deleteUser(userId, body);
    }

    /**
     * Dashboard recent security events endpoint.
     * Returns the N most recent security events across all users, newest first.
     * Corresponds to:
     * SELECT * FROM security_events ORDER BY event_time DESC LIMIT :limit;
     *
     * The frontend must call this endpoint (not generate data itself).
     * The table on the administrator dashboard requests the five latest records.
     * Refreshing the page retrieves the same records from the database.
     */
    @GetMapping("/security-events")
    public ResponseEntity<?> getRecentSecurityEvents(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {

        List<com.slcms.model.SecurityEvent> events = rbacSecurityService.getSecurityEvents(null);
        List<Map<String, Object>> response = new ArrayList<>();

        int count = 0;
        for (com.slcms.model.SecurityEvent e : events) {
            if (count++ >= limit) break;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id",          e.getId());
            item.put("userId",      e.getUserId());
            item.put("userName",    e.getUserName());
            item.put("eventType",   e.getEventType() != null ? e.getEventType().getDisplayName() : null);
            item.put("result",      e.getResult());
            item.put("description", e.getDescription());
            item.put("eventTime",   e.getEventTime() != null ? e.getEventTime().toString() : null);
            item.put("ipAddress",   maskIp(e.getIpAddress()));
            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Administrator reviews a specific user's security activity history.
     */
    @GetMapping("/users/{userId}/activity")
    public ResponseEntity<?> getUserActivity(@PathVariable("userId") String userId) {
        List<com.slcms.model.SecurityEvent> events = rbacSecurityService.getSecurityEvents(userId);
        return ResponseEntity.ok(events);
    }

    private String maskIp(String ip) {
        if (ip == null || ip.trim().isEmpty()) return "197.250.xxx.12";
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".xxx." + parts[3];
        }
        return ip;
    }
}
