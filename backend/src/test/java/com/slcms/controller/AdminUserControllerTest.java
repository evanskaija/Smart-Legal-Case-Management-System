package com.slcms.controller;

import com.slcms.model.UserAccount;
import com.slcms.repository.UserRepository;
import com.slcms.service.RBACSecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class AdminUserControllerTest {

    private UserRepository userRepository;
    private RBACSecurityService rbacSecurityService;
    private PasswordEncoder passwordEncoder;
    private AdminUserController adminUserController;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        rbacSecurityService = Mockito.mock(RBACSecurityService.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_mock");
        when(userRepository.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserController = new AdminUserController(userRepository, rbacSecurityService, passwordEncoder);
    }

    private Map<String, Object> createValidPayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("role", "Lawyer");
        payload.put("fullName", "Grace Mdee");
        payload.put("username", "grace.mdee");
        payload.put("email", "grace.mdee@slcms.local");
        payload.put("phone", "+255754000111");
        payload.put("staffId", "LAW-1001");
        payload.put("advocateNumber", "TLS/ADV/7760");
        payload.put("jobTitle", "Litigation Associate");
        payload.put("department", "Commercial Litigation");
        payload.put("temporaryPassword", "SecureTemp#2026Pass");
        payload.put("caseId", null);
        return payload;
    }

    @Test
    @DisplayName("Valid payload provisions user successfully")
    void testValidUserCreation() {
        Map<String, Object> payload = createValidPayload();
        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        assertEquals("LAW-1001", body.get("staffId"));
    }

    @Test
    @DisplayName("Rule 1: Invalid Assigned Role is rejected with 400 Bad Request")
    void testInvalidRoleRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("role", "Managing Partner Hacker");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Assigned Role must be Administrator, Senior Lawyer, Lawyer or Legal Clerk"));
    }

    @Test
    @DisplayName("Rule 2: Full Name with single name or digits is rejected")
    void testInvalidFullNameRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("fullName", "Grace");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Full Name must contain at least two names"));

        payload.put("fullName", "Grace Mdee 123");
        ResponseEntity<?> response2 = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response2.getStatusCode());
    }

    @Test
    @DisplayName("Rule 3: Invalid Username chars or uppercase are rejected")
    void testInvalidUsernameRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("username", "Grace Mdee!");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Username must contain lowercase letters, numbers, dots and underscores only"));
    }

    @Test
    @DisplayName("Rule 4: Official Email not matching username is rejected")
    void testEmailMismatchRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("email", "different.email@gmail.com");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Official Email must be generated automatically from username"));
    }

    @Test
    @DisplayName("Rule 5: Contact Phone not starting with +255 or missing 6/7 is rejected")
    void testInvalidPhoneRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("phone", "0754000111");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Contact Phone must start with +255"));

        payload.put("phone", "+255222000111"); // starting with 2 instead of 6 or 7
        ResponseEntity<?> response2 = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response2.getStatusCode());
    }

    @Test
    @DisplayName("Rule 6: Staff ID with invalid format is rejected")
    void testInvalidStaffIdFormatRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("staffId", "INVALID-ID");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Staff ID must follow the automatic format"));
    }

    @Test
    @DisplayName("Rule 7: Lawyer Roll Number required for Lawyer and Senior Lawyer in TLS/ADV/7760 format")
    void testLawyerRollNumberValidation() {
        Map<String, Object> payload = createValidPayload();
        payload.put("advocateNumber", null);
        payload.put("lawyerRollNumber", null);

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Lawyer Roll Number is required for Senior Lawyer and Lawyer in format TLS/ADV/7760"));

        payload.put("advocateNumber", "INVALID/FORMAT");
        ResponseEntity<?> response2 = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response2.getStatusCode());
    }

    @Test
    @DisplayName("Rule 8: Unapproved Job Title is rejected")
    void testInvalidJobTitleRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("jobTitle", "Chief Legal Wizard");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Job Title must be selected from approved titles"));
    }

    @Test
    @DisplayName("Rule 9: Unapproved Practice Department is rejected")
    void testInvalidDepartmentRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("department", "Outer Space Legal Division");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Practice Department must be selected from approved departments"));
    }

    @Test
    @DisplayName("Rule 10: Temporary Password shorter than 12 characters is rejected")
    void testShortTemporaryPasswordRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("temporaryPassword", "short#123");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Temporary Password must be automatically generated and at least 12 characters"));
    }

    @Test
    @DisplayName("Rule 11: Initial Case referencing nonexistent case is rejected")
    void testInvalidInitialCaseRejected() {
        Map<String, Object> payload = createValidPayload();
        payload.put("caseId", "NONEXISTENT-CASE-999");

        ResponseEntity<?> response = adminUserController.createStaffUser(payload, "Administrator");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Initial Case must reference an existing case"));
    }

    @Test
    void testCheckAdminPassword() {
        org.springframework.security.crypto.password.PasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12);
        String freshHash = encoder.encode("SecretLawFirm2026!");
        boolean match = encoder.matches("SecretLawFirm2026!", freshHash);
        assertTrue(match, "Fresh hash must match SecretLawFirm2026!");
    }
}
