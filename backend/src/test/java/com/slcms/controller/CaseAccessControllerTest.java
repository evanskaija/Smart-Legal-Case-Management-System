package com.slcms.controller;

import com.slcms.model.CaseRecord;
import com.slcms.model.Client;
import com.slcms.repository.CaseAssignmentRepository;
import com.slcms.repository.CaseRecordRepository;
import com.slcms.repository.ClientRepository;
import com.slcms.repository.DocumentRecordRepository;
import com.slcms.service.RBACSecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class CaseAccessControllerTest {

    private RBACSecurityService securityService;
    private CaseRecordRepository caseRepository;
    private CaseAssignmentRepository assignmentRepository;
    private DocumentRecordRepository documentRepository;
    private ClientRepository clientRepository;
    private CaseAccessController controller;

    @BeforeEach
    void setUp() {
        securityService = Mockito.mock(RBACSecurityService.class);
        caseRepository = Mockito.mock(CaseRecordRepository.class);
        assignmentRepository = Mockito.mock(CaseAssignmentRepository.class);
        documentRepository = Mockito.mock(DocumentRecordRepository.class);
        clientRepository = Mockito.mock(ClientRepository.class);

        controller = new CaseAccessController(securityService, caseRepository, assignmentRepository, documentRepository);
        ReflectionTestUtils.setField(controller, "clientRepository", clientRepository);
    }

    private Map<String, Object> createValidPayload() {
        Map<String, Object> map = new HashMap<>();
        map.put("caseTitle", "Kilombero Sugar Co. Ltd v Mara Logistics Ltd");
        map.put("caseNumber", "CV/2026/0142");
        map.put("caseType", "Civil");
        map.put("court", "High Court of Tanzania");
        map.put("decisionDate", "2025-05-10");
        map.put("citation", "[2025] TZHC 0142");
        map.put("firstPartyName", "Kilombero Sugar Co. Ltd");
        map.put("firstPartyRole", "Plaintiff");
        map.put("secondPartyName", "Mara Logistics Ltd");
        map.put("secondPartyRole", "Defendant");
        map.put("clientName", "Kilombero Sugar Co. Ltd");
        map.put("clientId", "cli-001");
        map.put("priority", "Medium");
        return map;
    }

    @Test
    @DisplayName("Should successfully create a case with valid 3-step data and automatic system values")
    void testCreateCase_Success() {
        Map<String, Object> payload = createValidPayload();

        when(caseRepository.existsByCaseNumber("CV/2026/0142")).thenReturn(false);
        when(caseRepository.existsByCitation("[2025] TZHC 0142")).thenReturn(false);
        when(clientRepository.existsById("cli-001")).thenReturn(true);
        when(caseRepository.save(any(CaseRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = controller.createCase(payload, "advocate@slcms.local");
        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        assertTrue(response.getBody() instanceof CaseRecord);
        CaseRecord created = (CaseRecord) response.getBody();
        assertEquals("CV/2026/0142", created.getCaseNumber());
        assertEquals("Civil", created.getCaseType());
        assertEquals("Open", created.getStatus());
        assertEquals("Unassigned", created.getLeadCounsel());
        assertEquals("2025", created.getDecisionYear());
        assertEquals("Kilombero Sugar Co. Ltd", created.getFirstPartyName());
        assertEquals("Plaintiff", created.getFirstPartyRole());
        assertEquals("Mara Logistics Ltd", created.getSecondPartyName());
        assertEquals("Defendant", created.getSecondPartyRole());
        assertEquals("advocate@slcms.local", created.getCreatedBy());
    }

    @Test
    @DisplayName("Should reject Case Title shorter than 5 characters or containing invalid characters")
    void testCreateCase_InvalidTitle() {
        Map<String, Object> payload = createValidPayload();
        payload.put("caseTitle", "Abc"); // too short

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Case Title must be between 5 and 200 characters"));

        payload.put("caseTitle", "Valid Title with <script>alert(1)</script>");
        response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("invalid characters"));
    }

    @Test
    @DisplayName("Should reject duplicate Case Number")
    void testCreateCase_DuplicateCaseNumber() {
        Map<String, Object> payload = createValidPayload();
        when(caseRepository.existsByCaseNumber("CV/2026/0142")).thenReturn(true);

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("already exists"));
    }

    @Test
    @DisplayName("Should reject future Decision Date for decided judgment")
    void testCreateCase_FutureDecisionDate() {
        Map<String, Object> payload = createValidPayload();
        LocalDate futureDate = LocalDate.now().plusMonths(3);
        payload.put("decisionDate", futureDate.toString());

        when(caseRepository.existsByCaseNumber(any())).thenReturn(false);

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Decision Date cannot be a future date"));
    }

    @Test
    @DisplayName("Should reject duplicate Citation")
    void testCreateCase_DuplicateCitation() {
        Map<String, Object> payload = createValidPayload();
        when(caseRepository.existsByCaseNumber(any())).thenReturn(false);
        when(caseRepository.existsByCitation("[2025] TZHC 0142")).thenReturn(true);

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("is already registered on another matter"));
    }

    @Test
    @DisplayName("Should reject party name made only of numbers")
    void testCreateCase_NumbersOnlyPartyName() {
        Map<String, Object> payload = createValidPayload();
        payload.put("firstPartyName", "12345678");

        when(caseRepository.existsByCaseNumber(any())).thenReturn(false);

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("cannot be made only of numbers"));
    }

    @Test
    @DisplayName("Should reject identical first and second party names and roles")
    void testCreateCase_IdenticalParties() {
        Map<String, Object> payload = createValidPayload();
        payload.put("firstPartyName", "Mara Logistics Ltd");
        payload.put("firstPartyRole", "Defendant");
        payload.put("secondPartyName", "Mara Logistics Ltd");
        payload.put("secondPartyRole", "Defendant");

        when(caseRepository.existsByCaseNumber(any())).thenReturn(false);

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("identical names and roles"));
    }

    @Test
    @DisplayName("Should reject roles that do not fit the case type (e.g. Plaintiff for Criminal matter)")
    void testCreateCase_RoleMismatchForCriminal() {
        Map<String, Object> payload = createValidPayload();
        payload.put("caseType", "Criminal");
        payload.put("firstPartyName", "Republic of Tanzania");
        payload.put("firstPartyRole", "Plaintiff"); // Civil role for criminal case!
        payload.put("secondPartyName", "Deogratius Shayo");
        payload.put("secondPartyRole", "Defendant"); // Civil role!

        when(caseRepository.existsByCaseNumber(any())).thenReturn(false);

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("does not fit a Criminal case"));
    }

    @Test
    @DisplayName("Should reject client that does not exist in Clients registry")
    void testCreateCase_ClientNotFound() {
        Map<String, Object> payload = createValidPayload();
        payload.put("clientName", "Unknown Corporate Entity");
        payload.put("clientId", "cli-999");

        when(caseRepository.existsByCaseNumber(any())).thenReturn(false);
        when(clientRepository.existsById("cli-999")).thenReturn(false);
        when(clientRepository.existsByNameIgnoreCase("Unknown Corporate Entity")).thenReturn(false);

        ResponseEntity<?> response = controller.createCase(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("must exist in the Clients table"));
    }
}
