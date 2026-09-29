package com.slcms.controller;

import com.slcms.model.*;
import com.slcms.repository.*;
import com.slcms.service.JwtAuthService;
import com.slcms.service.RBACSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller implementing the official SLCMS Legal Officer Workflow:
 * POST /api/legal-officer/invoices
 * POST /api/legal-officer/payments/{id}/verify
 * POST /api/legal-officer/payments/{id}/reject
 * POST /api/legal-officer/cases/{id}/assign-lawyer
 */
@RestController
@RequestMapping("/api/legal-officer")
@CrossOrigin(originPatterns = "*")
public class LegalOfficerWorkflowController {

    private static final Logger log = LoggerFactory.getLogger(LegalOfficerWorkflowController.class);

    private final JwtAuthService jwtAuthService;
    private final LegalRequestRepository legalRequestRepository;
    private final CaseRecordRepository caseRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final CaseConversationRepository conversationRepository;
    private final CaseAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final SystemNotificationRepository notificationRepository;
    private final RBACSecurityService rbacSecurityService;

    @Autowired
    public LegalOfficerWorkflowController(JwtAuthService jwtAuthService,
                                          LegalRequestRepository legalRequestRepository,
                                          CaseRecordRepository caseRepository,
                                          InvoiceRepository invoiceRepository,
                                          PaymentRepository paymentRepository,
                                          CaseConversationRepository conversationRepository,
                                          CaseAssignmentRepository assignmentRepository,
                                          UserRepository userRepository,
                                          ClientRepository clientRepository,
                                          SystemNotificationRepository notificationRepository,
                                          RBACSecurityService rbacSecurityService) {
        this.jwtAuthService = jwtAuthService;
        this.legalRequestRepository = legalRequestRepository;
        this.caseRepository = caseRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.conversationRepository = conversationRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.notificationRepository = notificationRepository;
        this.rbacSecurityService = rbacSecurityService;
    }

    /**
     * GET /api/legal-officer/requests
     * Legal Officer reviews incoming client requests.
     */
    @GetMapping("/requests")
    public ResponseEntity<?> getAllRequests(HttpServletRequest request) {
        jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR);
        List<LegalRequest> requests = legalRequestRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(requests);
    }

    /**
     * POST /api/legal-officer/invoices
     * Legal Officer creates and sends an invoice.
     * Case status changes to INVOICE_SENT.
     */
    @PostMapping("/invoices")
    public ResponseEntity<?> createAndSendInvoice(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body
    ) {
        UserAccount officer = jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR);

        String clientId = (String) body.get("clientId");
        String caseId = (String) body.get("caseId");
        String requestId = (String) body.get("requestId");
        String serviceDescription = (String) body.get("serviceDescription");
        Object amountObj = body.get("amount") != null ? body.get("amount") : body.get("totalAmount");
        String paymentInstructions = (String) body.get("paymentInstructions");
        String dueDateStr = (String) body.get("dueDate");

        if (clientId == null || serviceDescription == null || amountObj == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "clientId, serviceDescription, and amount are required."));
        }

        BigDecimal amount = new BigDecimal(amountObj.toString());
        long invoiceCount = invoiceRepository.count() + 1;
        String invoiceNumber = String.format("INV-2026-%04d", invoiceCount);

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setClientId(clientId);
        invoice.setCaseId(caseId);
        invoice.setRequestId(requestId);
        invoice.setServiceDescription(serviceDescription);
        invoice.setTotalAmount(amount);
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setIssueDate(LocalDate.now());
        invoice.setDueDate(dueDateStr != null && !dueDateStr.isBlank() ? LocalDate.parse(dueDateStr) : LocalDate.now().plusDays(14));
        invoice.setStatus("SENT"); // Status: SENT
        invoice.setPaymentInstructions(paymentInstructions != null && !paymentInstructions.isBlank()
                ? paymentInstructions
                : "Remit funds to CRDB Bank Account No. 0150244883900 (SLCMS Legal Trust) or Lipa Namba 554433. After payment, upload your deposit slip or transaction receipt proof.");
        invoice.setCreatedBy(officer.getName());
        invoice.setCreatedAt(LocalDateTime.now());

        Invoice saved = invoiceRepository.save(invoice);

        // Update Case status to INVOICE_SENT
        if (caseId != null && !caseId.isBlank()) {
            Optional<CaseRecord> caseOpt = caseRepository.findById(caseId);
            if (caseOpt.isEmpty()) caseOpt = caseRepository.findByCaseNumber(caseId);
            if (caseOpt.isPresent()) {
                CaseRecord c = caseOpt.get();
                c.setStatus("INVOICE_SENT");
                c.setUpdatedAt(LocalDateTime.now());
                caseRepository.save(c);
            }
        }

        // Notify Client
        Optional<Client> clientOpt = clientRepository.findById(clientId)
                .or(() -> clientRepository.findByClientNumber(clientId));
        String clientUserId = clientOpt.map(Client::getUserId).orElse(null);

        SystemNotification notif = new SystemNotification(
                clientUserId,
                "Client",
                "New Invoice Received: #" + invoiceNumber,
                "Legal Officer " + officer.getName() + " has sent you Invoice #" + invoiceNumber + " for " + serviceDescription + " (TZS " + amount + "). Please upload payment proof once settled.",
                "INVOICE_SENT",
                caseId
        );
        notif.setRelatedInvoiceId(saved.getId());
        notificationRepository.save(notif);

        // Audit log
        rbacSecurityService.recordAudit(officer.getEmail(), officer.getRole().getDisplayName(), "Created and Sent Invoice", "Billing",
                "Invoice: " + invoiceNumber + " to Client " + clientId + " for TZS " + amount);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Invoice created and sent to client successfully. Case status updated to INVOICE_SENT.",
                "invoice", saved,
                "caseStatus", "INVOICE_SENT"
        ));
    }

    /**
     * GET /api/legal-officer/payments/proofs
     * Retrieves all payments awaiting verification by Legal Officer.
     */
    @GetMapping("/payments/proofs")
    public ResponseEntity<?> getPaymentProofs(HttpServletRequest request) {
        jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR);
        List<Payment> allPayments = paymentRepository.findAll();
        List<Map<String, Object>> proofs = new ArrayList<>();

        for (Payment p : allPayments) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", p.getId());
            map.put("invoiceId", p.getInvoiceId());
            map.put("amount", p.getAmount());
            map.put("paymentMethod", p.getPaymentMethod());
            map.put("referenceNumber", p.getReferenceNumber());
            map.put("paymentDate", p.getPaymentDate());
            map.put("submittedAt", p.getSubmittedAt());
            map.put("proofDocument", p.getProofDocument());
            map.put("status", p.getStatus());
            map.put("verifiedBy", p.getVerifiedBy());
            map.put("verifiedAt", p.getVerifiedAt());
            map.put("rejectionReason", p.getRejectionReason());

            Optional<Invoice> invOpt = invoiceRepository.findById(p.getInvoiceId());
            if (invOpt.isPresent()) {
                Invoice inv = invOpt.get();
                map.put("invoiceNumber", inv.getInvoiceNumber());
                map.put("clientId", inv.getClientId());
                map.put("caseId", inv.getCaseId());
                map.put("serviceDescription", inv.getServiceDescription());
                map.put("invoiceTotal", inv.getTotalAmount());
                map.put("invoiceStatus", inv.getStatus());

                Optional<Client> clientOpt = clientRepository.findById(inv.getClientId())
                        .or(() -> clientRepository.findByClientNumber(inv.getClientId()));
                map.put("clientName", clientOpt.map(Client::getName).orElse(inv.getClientId()));
            }

            proofs.add(map);
        }

        return ResponseEntity.ok(proofs);
    }

    /**
     * POST /api/legal-officer/payments/{id}/verify
     * Legal Officer verifies the payment.
     * The case status changes to PAID — READY FOR ASSIGNMENT.
     */
    @PostMapping("/payments/{id}/verify")
    public ResponseEntity<?> verifyPayment(
            @PathVariable("id") Long paymentId,
            HttpServletRequest request
    ) {
        UserAccount officer = jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR);

        Optional<Payment> payOpt = paymentRepository.findById(paymentId);
        if (payOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Payment record not found"));
        }

        Payment payment = payOpt.get();
        payment.setStatus("VERIFIED");
        payment.setVerificationStatus("CONFIRMED");
        payment.setVerifiedBy(officer.getName());
        payment.setVerifiedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Update Invoice status to PAID
        Optional<Invoice> invOpt = invoiceRepository.findById(payment.getInvoiceId());
        String caseId = null;
        String clientId = null;
        if (invOpt.isPresent()) {
            Invoice invoice = invOpt.get();
            invoice.setStatus("PAID");
            invoice.setAmountPaid(payment.getAmount());
            invoiceRepository.save(invoice);
            caseId = invoice.getCaseId();
            clientId = invoice.getClientId();
        }

        // Update Case status to PAID — READY FOR ASSIGNMENT
        CaseRecord caseRecord = null;
        if (caseId != null) {
            Optional<CaseRecord> caseOpt = caseRepository.findById(caseId);
            if (caseOpt.isEmpty()) caseOpt = caseRepository.findByCaseNumber(caseId);
            if (caseOpt.isPresent()) {
                caseRecord = caseOpt.get();
                caseRecord.setStatus("READY_FOR_ASSIGNMENT"); // Case status: PAID — READY FOR ASSIGNMENT
                caseRecord.setUpdatedAt(LocalDateTime.now());
                caseRepository.save(caseRecord);
            }
        }

        // Notify Client that payment was confirmed and case is ready for lawyer assignment
        if (clientId != null) {
            Optional<Client> clientOpt = findClientByIdOrNumber(clientId);
            String clientUserId = clientOpt.map(Client::getUserId).orElse(null);

            SystemNotification clientNotif = new SystemNotification(
                    clientUserId,
                    "Client",
                    "Payment Verified — Ready for Assignment",
                    "Your payment of TZS " + payment.getAmount() + " (Ref: " + payment.getReferenceNumber() + ") has been verified by Legal Officer " + officer.getName() + ". Your case is now PAID — READY FOR ASSIGNMENT.",
                    "PAYMENT_VERIFIED",
                    caseId
            );
            notificationRepository.save(clientNotif);
        }

        // Audit trail
        rbacSecurityService.recordAudit(officer.getEmail(), officer.getRole().getDisplayName(), "Verified Payment Proof", "Billing Verification",
                "Payment ID: " + paymentId + ", Invoice: " + payment.getInvoiceId() + ", Ref: " + payment.getReferenceNumber());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment verified successfully. Case status changed to PAID — READY FOR ASSIGNMENT.",
                "paymentId", paymentId,
                "invoiceStatus", "PAID",
                "caseStatus", "READY_FOR_ASSIGNMENT",
                "caseStatusDisplay", "PAID — READY FOR ASSIGNMENT",
                "payment", payment,
                "case", caseRecord
        ));
    }

    /**
     * POST /api/legal-officer/payments/{id}/reject
     * Legal Officer rejects the payment proof with reason.
     */
    @PostMapping("/payments/{id}/reject")
    public ResponseEntity<?> rejectPayment(
            @PathVariable("id") Long paymentId,
            HttpServletRequest request,
            @RequestBody(required = false) Map<String, String> body
    ) {
        UserAccount officer = jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR);

        Optional<Payment> payOpt = paymentRepository.findById(paymentId);
        if (payOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Payment record not found"));
        }

        String reason = (body != null && body.containsKey("rejectionReason"))
                ? body.get("rejectionReason")
                : "Proof was invalid or illegible. Please check reference number and re-upload valid bank/mobile proof.";

        Payment payment = payOpt.get();
        payment.setStatus("REJECTED");
        payment.setVerificationStatus("REJECTED");
        payment.setRejectionReason(reason);
        payment.setVerifiedBy(officer.getName());
        payment.setVerifiedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Update Invoice status to REJECTED
        Optional<Invoice> invOpt = invoiceRepository.findById(payment.getInvoiceId());
        String caseId = null;
        String clientId = null;
        if (invOpt.isPresent()) {
            Invoice invoice = invOpt.get();
            invoice.setStatus("REJECTED");
            invoice.setRejectionReason(reason);
            invoiceRepository.save(invoice);
            caseId = invoice.getCaseId();
            clientId = invoice.getClientId();
        }

        // Return Case status to INVOICE_SENT
        if (caseId != null) {
            Optional<CaseRecord> caseOpt = caseRepository.findById(caseId);
            if (caseOpt.isEmpty()) caseOpt = caseRepository.findByCaseNumber(caseId);
            if (caseOpt.isPresent()) {
                CaseRecord c = caseOpt.get();
                c.setStatus("INVOICE_SENT");
                c.setUpdatedAt(LocalDateTime.now());
                caseRepository.save(c);
            }
        }

        // Notify Client
        if (clientId != null) {
            Optional<Client> clientOpt = findClientByIdOrNumber(clientId);
            String clientUserId = clientOpt.map(Client::getUserId).orElse(null);

            SystemNotification clientNotif = new SystemNotification(
                    clientUserId,
                    "Client",
                    "Payment Proof Rejected",
                    "Your payment proof for Invoice #" + (invOpt.isPresent() ? invOpt.get().getInvoiceNumber() : payment.getInvoiceId()) + " was rejected by Legal Officer: " + reason + ". Please upload valid proof.",
                    "PAYMENT_REJECTED",
                    caseId
            );
            notificationRepository.save(clientNotif);
        }

        // Audit trail
        rbacSecurityService.recordAudit(officer.getEmail(), officer.getRole().getDisplayName(), "Rejected Payment Proof", "Billing Verification",
                "Payment ID: " + paymentId + ", Reason: " + reason);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment rejected. Client has been notified with the rejection reason.",
                "paymentId", paymentId,
                "invoiceStatus", "REJECTED",
                "caseStatus", "INVOICE_SENT",
                "rejectionReason", reason
        ));
    }

    /**
     * POST /api/legal-officer/cases/{id}/assign-lawyer
     * Legal Officer assigns an available Lawyer.
     * The Lawyer receives the client and case details.
     * A secure case chat is automatically created for the Client and assigned Lawyer.
     * SLCMS automatically notifies both users and creates the conversation.
     */
    @PostMapping("/cases/{id}/assign-lawyer")
    public ResponseEntity<?> assignLawyerToCase(
            @PathVariable("id") String caseId,
            HttpServletRequest request,
            @RequestBody Map<String, String> body
    ) {
        UserAccount officer = jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR, UserRole.SENIOR_LAWYER);

        String lawyerId = body.get("lawyerId");
        String lawyerName = body.get("lawyerName");
        String assignmentRole = body.getOrDefault("role", "Lead Counsel");

        if (lawyerId == null || lawyerId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "lawyerId is required to assign lawyer."));
        }

        Optional<CaseRecord> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) caseOpt = caseRepository.findByCaseNumber(caseId);
        if (caseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Case not found"));
        }

        CaseRecord c = caseOpt.get();

        // Find Lawyer account
        Optional<UserAccount> lawyerOpt = userRepository.findById(lawyerId)
                .or(() -> userRepository.findByStaffIdIgnoreCase(lawyerId))
                .or(() -> userRepository.findByEmailIgnoreCase(lawyerId));

        if (lawyerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Selected Lawyer user not found: " + lawyerId));
        }

        UserAccount lawyer = lawyerOpt.get();
        if (lawyerName == null || lawyerName.isBlank()) {
            lawyerName = lawyer.getName();
        }

        // 1. Update Case Assignment & Status to ASSIGNED / ACTIVE
        c.setStatus("ASSIGNED"); // Case status: ASSIGNED
        c.setLeadCounselId(lawyer.getId());
        c.setLeadCounsel(lawyerName);
        if (!c.getAssignedUserIds().contains(lawyer.getId())) {
            c.getAssignedUserIds().add(lawyer.getId());
        }
        if (lawyer.getStaffId() != null && !c.getAssignedUserIds().contains(lawyer.getStaffId())) {
            c.getAssignedUserIds().add(lawyer.getStaffId());
        }
        c.setUpdatedAt(LocalDateTime.now());
        caseRepository.save(c);

        // 2. Persist CaseAssignment record
        String asgId = "asg-" + UUID.randomUUID().toString().substring(0, 8);
        assignmentRepository.save(new CaseAssignment(asgId, c.getId(), lawyer.getId(), assignmentRole, officer.getName()));

        // Also add to lawyer's assignedCaseIds if present
        if (!lawyer.getAssignedCaseIds().contains(c.getId())) {
            lawyer.getAssignedCaseIds().add(c.getId());
            userRepository.save(lawyer);
        }

        // 3. Resolve Client ID for chat conversation
        String clientId = c.getClientId();
        if (clientId == null || clientId.isBlank()) {
            clientId = "cli-001";
        }
        Optional<Client> clientOpt = findClientByIdOrNumber(clientId);
        String clientName = clientOpt.map(Client::getName).orElse(c.getClientName() != null ? c.getClientName() : "Client");
        String clientUserId = clientOpt.map(Client::getUserId).orElse(null);

        // 4. Automatically create secure case chat conversation in MySQL (case_conversations)
        CaseConversation conversation = conversationRepository.findByCaseId(c.getId()).orElse(null);
        if (conversation == null) {
            conversation = new CaseConversation(c.getId(), clientId, lawyer.getId());
            conversation.setStatus("ACTIVE");
            conversationRepository.save(conversation);
            log.info("Created secure case conversation for Case: {}, Client: {}, Lawyer: {}", c.getId(), clientId, lawyer.getId());
        } else {
            conversation.setLawyerId(lawyer.getId());
            conversation.setStatus("ACTIVE");
            conversationRepository.save(conversation);
        }

        // 5. SLCMS automatically notifies both users:
        // Notification to Lawyer: receives client and case details
        SystemNotification lawyerNotif = new SystemNotification(
                lawyer.getId(),
                "Lawyer",
                "New Case Assigned: " + c.getCaseNumber(),
                "You have been assigned to Case " + c.getCaseNumber() + " (" + c.getTitle() + "). Client: " + clientName + ". A secure case chat conversation has been automatically created.",
                "LAWYER_ASSIGNED",
                c.getId()
        );
        notificationRepository.save(lawyerNotif);

        // Notification to Client: lawyer assigned
        SystemNotification clientNotif = new SystemNotification(
                clientUserId,
                "Client",
                "Lawyer Assigned to Your Case",
                "Advocate " + lawyerName + " has been assigned to your case " + c.getCaseNumber() + ". A secure case chat is now open for direct privileged communication.",
                "LAWYER_ASSIGNED",
                c.getId()
        );
        notificationRepository.save(clientNotif);

        // 6. Audit trail
        rbacSecurityService.recordAudit(officer.getEmail(), officer.getRole().getDisplayName(), "Assigned Lawyer to Case", "Case Management",
                "Case: " + c.getCaseNumber() + ", Assigned Lawyer: " + lawyerName + " (" + lawyer.getStaffId() + ")");

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Lawyer " + lawyerName + " assigned successfully. Secure case chat automatically created and notifications dispatched.",
                "caseId", c.getId(),
                "caseNumber", c.getCaseNumber(),
                "caseStatus", "ASSIGNED",
                "assignedLawyer", Map.of(
                        "id", lawyer.getId(),
                        "name", lawyerName,
                        "staffId", lawyer.getStaffId() != null ? lawyer.getStaffId() : "",
                        "email", lawyer.getEmail()
                ),
                "conversation", conversation,
                "case", c
        ));
    }

    /**
     * GET /api/legal-officer/lawyers/available
     * Lists available Lawyers for assignment.
     */
    @GetMapping("/lawyers/available")
    public ResponseEntity<?> getAvailableLawyers(HttpServletRequest request) {
        jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR, UserRole.SENIOR_LAWYER);

        List<UserAccount> allUsers = userRepository.findAll();
        List<Map<String, Object>> lawyers = new ArrayList<>();

        for (UserAccount u : allUsers) {
            if (u.getRole() == UserRole.LAWYER || u.getRole() == UserRole.SENIOR_LAWYER ||
                u.getRole() == UserRole.ASSOCIATE_LAWYER || u.getRole() == UserRole.JUNIOR_LAWYER) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", u.getId());
                map.put("staffId", u.getStaffId());
                map.put("name", u.getName());
                map.put("email", u.getEmail());
                map.put("phone", u.getPhone());
                map.put("role", u.getRole().getDisplayName());
                map.put("roleTitle", u.getRoleTitle());
                map.put("department", u.getDepartment());
                map.put("assignedCaseCount", u.getAssignedCaseIds() != null ? u.getAssignedCaseIds().size() : 0);
                lawyers.add(map);
            }
        }

        return ResponseEntity.ok(lawyers);
    }

    /**
     * GET /api/legal-officer/cases
     * Legal Officer views all clients and cases.
     */
    @GetMapping("/cases")
    public ResponseEntity<?> getAllCasesForLegalOfficer(HttpServletRequest request) {
        jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR);
        List<CaseRecord> cases = caseRepository.findAll();
        return ResponseEntity.ok(cases);
    }

    /**
     * GET /api/legal-officer/notifications
     * Legal Officer views notifications.
     */
    @GetMapping("/notifications")
    public ResponseEntity<?> getLegalOfficerNotifications(HttpServletRequest request) {
        UserAccount officer = jwtAuthService.requireRole(request, UserRole.LEGAL_OFFICER, UserRole.ADMINISTRATOR);
        List<SystemNotification> notifs = notificationRepository.findByUserIdOrRecipientRoleOrderByCreatedAtDesc(officer.getId(), "Legal Officer");
        return ResponseEntity.ok(notifs);
    }

    private Optional<Client> findClientByIdOrNumber(String idOrNumber) {
        if (idOrNumber == null || idOrNumber.isBlank()) return Optional.empty();
        Optional<Client> c = clientRepository.findById(idOrNumber);
        if (c.isPresent()) return c;
        return clientRepository.findByClientNumber(idOrNumber);
    }
}
