package com.slcms.controller;

import com.slcms.model.AccountStatus;
import com.slcms.model.SystemBackup;
import com.slcms.model.UserAccount;
import com.slcms.repository.SystemBackupJpaRepository;
import com.slcms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Enterprise Administrator Dashboard REST Controller.
 * Provides real-time metrics calculated dynamically from persistent MySQL tables (users, system_backups).
 * Strictly guarantees no hard-coded counts.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(originPatterns = "*")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final SystemBackupJpaRepository systemBackupJpaRepository;

    @Autowired
    public AdminDashboardController(UserRepository userRepository,
                                    SystemBackupJpaRepository systemBackupJpaRepository) {
        this.userRepository = userRepository;
        this.systemBackupJpaRepository = systemBackupJpaRepository;
    }

    /**
     * GET /api/admin/dashboard/summary
     * Calculates all card totals dynamically from real MySQL database tables.
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        // 1. Active Users calculated from MySQL
        long activeUsers = userRepository.countByAccountStatus(AccountStatus.ACTIVE);

        // 2. Locked Accounts calculated from MySQL (combining LOCKED, TEMPORARILY_LOCKED, and SUSPENDED)
        long lockedAccounts = userRepository.countByAccountStatusIn(List.of(
                AccountStatus.LOCKED,
                AccountStatus.TEMPORARILY_LOCKED,
                AccountStatus.SUSPENDED
        ));

        // 3. First Login Pending Users calculated from MySQL
        long firstLoginPending = userRepository.countByAccountStatus(AccountStatus.FIRST_LOGIN_RESET);

        // 4. Last Backup calculated from system_backups table in MySQL
        Optional<SystemBackup> lastBackupOpt = systemBackupJpaRepository.findTopByOrderByCreatedAtDesc();
        Map<String, Object> lastBackupMap = new LinkedHashMap<>();
        if (lastBackupOpt.isPresent()) {
            SystemBackup backup = lastBackupOpt.get();
            lastBackupMap.put("id", backup.getId());
            lastBackupMap.put("filename", backup.getFilename());
            lastBackupMap.put("createdAt", backup.getCreatedAt() != null ? backup.getCreatedAt().toString() : null);
            String rawStatus = (backup.getStatus() != null) ? backup.getStatus().trim().toUpperCase() : "HEALTHY";
            if (rawStatus.contains("FAIL")) {
                lastBackupMap.put("status", "FAILED");
            } else {
                lastBackupMap.put("status", "HEALTHY");
            }
            lastBackupMap.put("sizeBytes", backup.getSizeBytes());
            lastBackupMap.put("verified", backup.isVerified());
        } else {
            lastBackupMap.put("createdAt", null);
            lastBackupMap.put("status", "NONE");
        }

        // 5. Users Needing Attention (Real MySQL records only)
        List<UserAccount> attentionList = userRepository.findByAccountStatusIn(List.of(
                AccountStatus.LOCKED,
                AccountStatus.TEMPORARILY_LOCKED,
                AccountStatus.SUSPENDED,
                AccountStatus.FIRST_LOGIN_RESET
        ));

        List<Map<String, Object>> attentionUsers = new ArrayList<>();
        for (UserAccount u : attentionList) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", u.getId());
            dto.put("name", u.getName());
            dto.put("staffId", u.getStaffId());
            dto.put("role", u.getRole() != null ? u.getRole().getDisplayName() : "Staff");
            dto.put("email", u.getEmail());
            dto.put("phone", u.getPhone());
            dto.put("accountStatus", u.getAccountStatus() != null ? u.getAccountStatus().name() : "LOCKED");
            dto.put("mustChangePassword", u.isMustChangePassword());
            dto.put("temporaryPasswordExpiresAt", u.getTemporaryPasswordExpiresAt() != null ? u.getTemporaryPasswordExpiresAt().toString() : null);
            attentionUsers.add(dto);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("activeUsers", activeUsers);
        response.put("lockedAccounts", lockedAccounts);
        response.put("firstLoginPending", firstLoginPending);
        response.put("lastBackup", lastBackupMap);
        response.put("attentionUsers", attentionUsers);
        response.put("totalUsersInDb", userRepository.count());

        return ResponseEntity.ok(response);
    }
}
