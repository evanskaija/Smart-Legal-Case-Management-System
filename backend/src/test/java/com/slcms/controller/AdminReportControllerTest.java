package com.slcms.controller;

import com.slcms.model.*;
import com.slcms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class AdminReportControllerTest {

    private UserRepository userRepository;
    private SecurityEventRepository securityEventRepository;
    private SystemSettingAuditJpaRepository systemSettingAuditJpaRepository;
    private SystemBackupJpaRepository systemBackupJpaRepository;
    private SystemSettingRepository systemSettingRepository;
    private AdminReportController adminReportController;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        securityEventRepository = Mockito.mock(SecurityEventRepository.class);
        systemSettingAuditJpaRepository = Mockito.mock(SystemSettingAuditJpaRepository.class);
        systemBackupJpaRepository = Mockito.mock(SystemBackupJpaRepository.class);
        systemSettingRepository = Mockito.mock(SystemSettingRepository.class);

        adminReportController = new AdminReportController(
                userRepository,
                securityEventRepository,
                systemSettingAuditJpaRepository,
                systemBackupJpaRepository,
                systemSettingRepository
        );
    }

    @Test
    @DisplayName("Non-administrator access is rejected with 403 Forbidden")
    void testNonAdminAccessForbidden() {
        Map<String, Object> req = Map.of("reportType", "users");
        ResponseEntity<?> resp = adminReportController.generateReport(req, "Lawyer", "Adv. Asha");
        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());

        ResponseEntity<?> respClerk = adminReportController.generateReport(req, "Legal Clerk", "Emmanuel");
        assertEquals(HttpStatus.FORBIDDEN, respClerk.getStatusCode());
    }

    @Test
    @DisplayName("Users report generates summary and rows from real user records")
    @SuppressWarnings("unchecked")
    void testGenerateUsersReport() {
        UserAccount u1 = new UserAccount();
        u1.setId("usr-001");
        u1.setStaffId("ADM-0001");
        u1.setName("System Administrator");
        u1.setEmail("admin@slcms.local");
        u1.setRole(UserRole.ADMINISTRATOR);
        u1.setAccountStatus(AccountStatus.ACTIVE);
        u1.setCreatedAt(LocalDateTime.of(2026, 9, 1, 10, 0));

        UserAccount u2 = new UserAccount();
        u2.setId("usr-002");
        u2.setStaffId("LAW-0021");
        u2.setName("Adv. Asha Mrema");
        u2.setEmail("asha@slcms.local");
        u2.setRole(UserRole.SENIOR_LAWYER);
        u2.setAccountStatus(AccountStatus.LOCKED);
        u2.setAdminLocked(true);
        u2.setCreatedAt(LocalDateTime.of(2026, 9, 2, 11, 0));

        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        Map<String, Object> req = Map.of(
                "reportType", "users",
                "fromDate", "2026-09-01",
                "toDate", "2026-09-30",
                "status", "All"
        );

        ResponseEntity<?> resp = adminReportController.generateReport(req, "Administrator", "System Administrator");
        assertEquals(HttpStatus.OK, resp.getStatusCode());

        Map<String, Object> data = (Map<String, Object>) resp.getBody();
        assertNotNull(data);
        assertEquals("Users Report", data.get("reportTitle"));

        Map<String, Object> summary = (Map<String, Object>) data.get("summary");
        assertEquals(2, summary.get("Total Users"));
        assertEquals(1, summary.get("Active"));
        assertEquals(1, summary.get("Locked"));

        List<Map<String, Object>> records = (List<Map<String, Object>>) data.get("records");
        assertEquals(2, records.size());
        assertEquals("ADM-0001", records.get(0).get("staffId"));
        assertEquals("LAW-0021", records.get(1).get("staffId"));
    }

    @Test
    @DisplayName("Login and security report excludes passwords and tokens")
    @SuppressWarnings("unchecked")
    void testSecurityReportSanitization() {
        SecurityEvent ev = new SecurityEvent();
        ev.setId("evt-1");
        ev.setUserName("slcms.admin");
        ev.setEventTime(LocalDateTime.of(2026, 9, 24, 8, 30));
        ev.setEventType(EventType.LOGIN_SUCCESS);
        ev.setResult("SUCCESS");
        ev.setDescription("Successful console authentication");
        ev.setIpAddress("127.0.0.1");

        when(securityEventRepository.findAllByOrderByEventTimeDesc()).thenReturn(List.of(ev));

        Map<String, Object> req = Map.of("reportType", "security", "status", "All");
        ResponseEntity<?> resp = adminReportController.generateReport(req, "Administrator", "System Administrator");
        assertEquals(HttpStatus.OK, resp.getStatusCode());

        Map<String, Object> data = (Map<String, Object>) resp.getBody();
        List<Map<String, Object>> records = (List<Map<String, Object>>) data.get("records");
        assertEquals(1, records.size());

        Map<String, Object> row = records.get(0);
        assertFalse(row.containsKey("password"));
        assertFalse(row.containsKey("passwordHash"));
        assertFalse(row.containsKey("token"));
        assertEquals("slcms.admin", row.get("user"));
        assertEquals("Successful", row.get("status"));
    }

    @Test
    @DisplayName("Backup report correctly summarizes healthy and tested archives")
    @SuppressWarnings("unchecked")
    void testBackupReportGeneration() {
        SystemBackup b = new SystemBackup();
        b.setId(1L);
        b.setFilename("backup_test.zip");
        b.setSizeBytes(10240L);
        b.setStatus("Healthy");
        b.setCreatedBy("Administrator");
        b.setVerified(true);
        b.setCreatedAt(LocalDateTime.of(2026, 9, 24, 9, 0));

        when(systemBackupJpaRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(b));

        Map<String, Object> req = Map.of("reportType", "backup", "status", "All");
        ResponseEntity<?> resp = adminReportController.generateReport(req, "Administrator", "System Administrator");
        assertEquals(HttpStatus.OK, resp.getStatusCode());

        Map<String, Object> data = (Map<String, Object>) resp.getBody();
        Map<String, Object> summary = (Map<String, Object>) data.get("summary");
        assertEquals(1, summary.get("Total Backups"));
        assertEquals(1, summary.get("Healthy"));
        assertEquals(1, summary.get("Tested"));
    }
}
