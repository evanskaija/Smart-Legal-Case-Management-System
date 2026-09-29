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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller implementing the official SLCMS Client Workflow:
 * POST /api/client/requests
 * GET  /api/client/invoices
 * POST /api/client/invoices/{id}/payment-proof
 */
@RestController
@RequestMapping("/api/client")
@CrossOrigin(originPatterns = "*")
public class ClientWorkflowController {

    private static final Logger log = LoggerFactory.getLogger(ClientWorkflowController.class);

    private final JwtAuthService jwtAuthService;
    private final LegalRequestRepository legalRequestRepository;
    private final CaseRecordRepository caseRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final SystemNotificationRepository notificationRepository;
    private final RBACSecurityService rbacSecurityService;
    private final ClientRepository clientRepository;

    @Autowired
    public ClientWorkflowController(JwtAuthService jwtAuthService,
                                    LegalRequestRepository legalRequestRepository,
                                    CaseRecordRepository caseRepository,
                                    InvoiceRepository invoiceRepository,
                                    PaymentRepository paymentRepository,
                                    SystemNotificationRepository notificationRepository,
                                    RBACSecurityService rbacSecurityService,
                                    ClientRepository clientRepository) {
        this.jwtAuthService = jwtAuthService;
        this.legalRequestRepository = legalRequestRepository;
        this.caseRepository = caseRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.notificationRepository = notificationRepository;
        this.rbacSecurityService = rbacSecurityService;
        this.clientRepository = clientRepository;
    }

    /**
     * POST /api/client/requests
     * Client submits a legal-assistance request and basic case details.
     * Enforces authentication via JWT token.
     */
    @PostMapping(value = "/requests", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> submitLegalRequest(
            HttpServletRequest request,
            @RequestParam(value = "issueType", required = false) String paramIssueType,
            @RequestParam(value = "description", required = false) String paramDescription,
            @RequestParam(value = "opposingParty", required = false) String paramOpposingParty,
            @RequestParam(value = "preferredContactMethod", required = false, defaultValue = "Email") String paramContact,
            @RequestParam(value = "caseTitle", required = false) String paramCaseTitle,
            @RequestParam(value = "court", required = false) String paramCourt,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        UserAccount user = jwtAuthService.requireRole(request, UserRole.CLIENT);
        Client client = resolveClientForUser(user);

        String issueType = paramIssueType;
        String description = paramDescription;
        String opposingParty = paramOpposingParty;
        String contactMethod = paramContact;
        String caseTitle = paramCaseTitle;
        String court = paramCourt;

        if (body != null) {
            if (issueType == null && body.get("issueType") != null) issueType = body.get("issueType").toString();
            if (description == null && body.get("description") != null) description = body.get("description").toString();
            if (opposingParty == null && body.get("opposingParty") != null) opposingParty = body.get("opposingParty").toString();
            if (contactMethod == null && body.get("preferredContactMethod") != null) contactMethod = body.get("preferredContactMethod").toString();
            if (caseTitle == null && body.get("caseTitle") != null) caseTitle = body.get("caseTitle").toString();
            if (court == null && body.get("court") != null) court = body.get("court").toString();
        }

        if (issueType == null || issueType.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Legal Issue Type is required."));
        }
        if (description == null || description.trim().length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Description must contain at least 10 characters detailing your matter."));
        }

        List<String> uploadedDocs = new ArrayList<>();
        if (files != null && files.length > 0) {
            Path uploadDir = Paths.get("data", "client_uploads");
            try {
                if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);
                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;
                    String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "doc";
                    String ext = "";
                    int dotIdx = origName.lastIndexOf('.');
                    if (dotIdx > 0) ext = origName.substring(dotIdx).toLowerCase();
                    if (!Arrays.asList(".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png").contains(ext)) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only PDF, DOCX, JPG, and PNG documents are allowed."));
                    }
                    String safeName = "req-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6) + ext;
                    Path dest = uploadDir.resolve(safeName);
                    Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
                    uploadedDocs.add(safeName);
                }
            } catch (IOException e) {
                log.error("Failed to save uploaded documents: {}", e.getMessage());
            }
        }

        String requestId = "req-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5);
        String caseId = "case-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5);
        String docketNum = "SLCMS/" + issueType.toUpperCase().replaceAll("\\s+", "").substring(0, Math.min(4, issueType.length())) + "/" + Calendar.getInstance().get(Calendar.YEAR) + "/" + String.format("%03d", (int)(Math.random() * 900) + 100);

        String finalTitle = (caseTitle != null && !caseTitle.trim().isEmpty())
                ? caseTitle.trim()
                : (client.getName() + " v. " + (opposingParty != null && !opposingParty.trim().isEmpty() ? opposingParty.trim() : "Legal Matter (" + issueType + ")"));

        String finalCourt = (court != null && !court.trim().isEmpty())
                ? court.trim()
                : "High Court of Tanzania (" + issueType + " Division)";

        // 1. Persist CaseRecord with initial state SUBMITTED
        CaseRecord caseRecord = new CaseRecord();
        caseRecord.setId(caseId);
        caseRecord.setCaseNumber(docketNum);
        caseRecord.setTitle(finalTitle);
        caseRecord.setCaseTitle(finalTitle);
        caseRecord.setCategory(issueType.trim());
        caseRecord.setCaseType(issueType.trim());
        caseRecord.setStatus("SUBMITTED"); // Case status: SUBMITTED
        caseRecord.setClientId(client.getId());
        caseRecord.setRequestId(requestId);
        caseRecord.setClientName(client.getName());
        caseRecord.setCourt(finalCourt);
        caseRecord.setOpposingParty(opposingParty);
        caseRecord.setDescription(description.trim());
        caseRecord.setFilingDate(LocalDate.now().toString());
        caseRecord.setCreatedBy(user.getName());
        caseRecord.setCreatedAt(LocalDateTime.now());
        caseRecord.setUpdatedAt(LocalDateTime.now());
        caseRepository.save(caseRecord);

        // 2. Persist LegalRequest with SUBMITTED status
        LegalRequest legalRequest = new LegalRequest();
        legalRequest.setId(requestId);
        legalRequest.setClientId(client.getId());
        legalRequest.setClientName(client.getName());
        legalRequest.setClientEmail(client.getEmail());
        legalRequest.setClientPhone(client.getPhone());
        legalRequest.setIssueType(issueType.trim());
        legalRequest.setDescription(description.trim());
        legalRequest.setOpposingParty(opposingParty);
        legalRequest.setPreferredContactMethod(contactMethod);
        legalRequest.setSupportingDocuments(String.join(",", uploadedDocs));
        legalRequest.setStatus("SUBMITTED");
        legalRequest.setCaseId(caseId);
        legalRequest.setCreatedAt(LocalDateTime.now());
        legalRequest.setUpdatedAt(LocalDateTime.now());
        legalRequestRepository.save(legalRequest);

        // 3. Notify Legal Officer
        SystemNotification notif = new SystemNotification(
                null,
                "Legal Officer",
                "New Client Request Received",
                "Client " + client.getName() + " submitted a new legal-assistance request: " + finalTitle,
                "NEW_REQUEST",
                caseId
        );
        notificationRepository.save(notif);

        // 4. Audit trail
        rbacSecurityService.recordAudit(user.getEmail(), user.getRole().getDisplayName(), "Submitted Legal Assistance Request", "Client Intake", "Request ID: " + requestId + ", Case: " + docketNum);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Legal assistance request submitted successfully. A Legal Officer will review your matter and issue an invoice.",
                "requestId", requestId,
                "caseId", caseId,
                "caseNumber", docketNum,
                "status", "SUBMITTED",
                "request", legalRequest,
                "case", caseRecord
        ));
    }

    /**
     * GET /api/client/invoices
     * Retrieves all invoices belonging to the authenticated client.
     */
    @GetMapping("/invoices")
    public ResponseEntity<?> getClientInvoices(HttpServletRequest request) {
        UserAccount user = jwtAuthService.requireRole(request, UserRole.CLIENT);
        Client client = resolveClientForUser(user);

        List<Invoice> invoices = invoiceRepository.findByClientIdOrderByCreatedAtDesc(client.getId());
        if (invoices.isEmpty() && client.getClientNumber() != null) {
            invoices = invoiceRepository.findByClientIdOrderByCreatedAtDesc(client.getClientNumber());
        }

        // Attach corresponding payments to each invoice response
        List<Map<String, Object>> result = new ArrayList<>();
        for (Invoice inv : invoices) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", inv.getId());
            map.put("invoiceNumber", inv.getInvoiceNumber());
            map.put("clientId", inv.getClientId());
            map.put("clientName", client.getName());
            map.put("caseId", inv.getCaseId());
            map.put("requestId", inv.getRequestId());
            map.put("serviceDescription", inv.getServiceDescription());
            map.put("amount", inv.getTotalAmount());
            map.put("totalAmount", inv.getTotalAmount());
            map.put("amountPaid", inv.getAmountPaid());
            map.put("balance", inv.getBalance());
            map.put("issueDate", inv.getIssueDate());
            map.put("dueDate", inv.getDueDate());
            map.put("status", inv.getStatus());
            map.put("paymentInstructions", inv.getPaymentInstructions() != null ? inv.getPaymentInstructions() : "Please pay via bank transfer or mobile money and upload proof.");
            map.put("rejectionReason", inv.getRejectionReason());
            map.put("createdAt", inv.getCreatedAt());

            List<Payment> payments = paymentRepository.findByInvoiceId(inv.getId());
            map.put("payments", payments);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/client/invoices/{id}/payment-proof
     * Client pays outside SLCMS and uploads payment proof.
     * SLCMS notifies the Legal Officer: “Payment proof submitted.”
     */
    @PostMapping(value = "/invoices/{id}/payment-proof", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> uploadPaymentProof(
            @PathVariable("id") Long invoiceId,
            HttpServletRequest request,
            @RequestParam(value = "proof", required = false) MultipartFile proofFile,
            @RequestParam(value = "proofDocument", required = false) String paramProofDoc,
            @RequestParam(value = "paymentMethod", required = false, defaultValue = "Bank Transfer") String paramMethod,
            @RequestParam(value = "referenceNumber", required = false) String paramRef,
            @RequestParam(value = "amount", required = false) String paramAmount,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        UserAccount user = jwtAuthService.requireRole(request, UserRole.CLIENT);
        Client client = resolveClientForUser(user);

        Optional<Invoice> invOpt = invoiceRepository.findById(invoiceId);
        if (invOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Invoice not found"));
        }

        Invoice invoice = invOpt.get();
        // Enforce ownership: must belong to authenticated client
        if (!client.getId().equalsIgnoreCase(invoice.getClientId()) &&
            (client.getClientNumber() == null || !client.getClientNumber().equalsIgnoreCase(invoice.getClientId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "Access denied: This invoice does not belong to your account."));
        }

        String paymentMethod = paramMethod;
        String referenceNumber = paramRef;
        String proofDoc = paramProofDoc;
        BigDecimal amount = invoice.getBalance().compareTo(BigDecimal.ZERO) > 0 ? invoice.getBalance() : invoice.getTotalAmount();

        if (body != null) {
            if (body.get("paymentMethod") != null) paymentMethod = body.get("paymentMethod").toString();
            if (body.get("referenceNumber") != null) referenceNumber = body.get("referenceNumber").toString();
            if (body.get("proofDocument") != null) proofDoc = body.get("proofDocument").toString();
            if (body.get("proofPath") != null && proofDoc == null) proofDoc = body.get("proofPath").toString();
            if (body.get("amount") != null) {
                try { amount = new BigDecimal(body.get("amount").toString()); } catch (Exception ignored) {}
            }
        }
        if (paramAmount != null && !paramAmount.isBlank()) {
            try { amount = new BigDecimal(paramAmount.trim()); } catch (Exception ignored) {}
        }

        // Handle file upload if provided
        if (proofFile != null && !proofFile.isEmpty()) {
            Path proofDir = Paths.get("data", "payment_proofs");
            try {
                if (!Files.exists(proofDir)) Files.createDirectories(proofDir);
                String origName = proofFile.getOriginalFilename() != null ? proofFile.getOriginalFilename() : "receipt.pdf";
                String ext = origName.contains(".") ? origName.substring(origName.lastIndexOf('.')).toLowerCase() : ".pdf";
                if (!Arrays.asList(".pdf", ".docx", ".jpg", ".jpeg", ".png").contains(ext)) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Payment proof must be a PDF, DOCX, JPG, or PNG document."));
                }
                String safeName = "proof-inv" + invoiceId + "-" + System.currentTimeMillis() + ext;
                Path dest = proofDir.resolve(safeName);
                Files.copy(proofFile.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
                proofDoc = "data/payment_proofs/" + safeName;
            } catch (IOException e) {
                log.error("Failed to store payment proof file: {}", e.getMessage());
            }
        }

        if (proofDoc == null || proofDoc.isBlank()) {
            proofDoc = "data/payment_proofs/proof-inv" + invoiceId + "-manual.pdf";
        }
        if (referenceNumber == null || referenceNumber.isBlank()) {
            referenceNumber = "REF-" + System.currentTimeMillis();
        }

        // 1. Persist Payment Record with PROOF_SUBMITTED / PENDING status
        Payment payment = new Payment();
        payment.setInvoiceId(invoiceId);
        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setReferenceNumber(referenceNumber);
        payment.setPaymentDate(LocalDate.now());
        payment.setProofDocument(proofDoc);
        payment.setProofPath(proofDoc);
        payment.setSubmittedAt(LocalDateTime.now());
        payment.setStatus("PROOF_SUBMITTED");
        payment.setVerificationStatus("PENDING");
        Payment savedPayment = paymentRepository.save(payment);

        // 2. Update Invoice Status to PROOF_SUBMITTED
        invoice.setStatus("PROOF_SUBMITTED");
        invoiceRepository.save(invoice);

        // 3. Update associated Case Status to PAYMENT_REVIEW
        if (invoice.getCaseId() != null) {
            Optional<CaseRecord> caseOpt = caseRepository.findById(invoice.getCaseId());
            if (caseOpt.isEmpty()) caseOpt = caseRepository.findByCaseNumber(invoice.getCaseId());
            if (caseOpt.isPresent()) {
                CaseRecord c = caseOpt.get();
                c.setStatus("PAYMENT_REVIEW");
                c.setUpdatedAt(LocalDateTime.now());
                caseRepository.save(c);
            }
        }

        // 4. SLCMS notifies Legal Officer: “Payment proof submitted.”
        SystemNotification notif = new SystemNotification(
                null,
                "Legal Officer",
                "Payment proof submitted",
                "Payment proof submitted for Invoice #" + invoice.getInvoiceNumber() + " (" + invoice.getServiceDescription() + ") by " + client.getName() + ". Amount: TZS " + amount + ". Ref: " + referenceNumber,
                "PAYMENT_PROOF",
                invoice.getCaseId()
        );
        notif.setRelatedInvoiceId(invoice.getId());
        notificationRepository.save(notif);

        // 5. Audit trail
        rbacSecurityService.recordAudit(user.getEmail(), "Client", "Uploaded Payment Proof", "Billing",
                "Invoice ID: " + invoiceId + ", Ref: " + referenceNumber + ", Document: " + proofDoc);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment proof submitted successfully. The Legal Officer has been notified to verify the payment.",
                "invoiceStatus", "PROOF_SUBMITTED",
                "caseStatus", "PAYMENT_REVIEW",
                "payment", savedPayment
        ));
    }

    /**
     * GET /api/client/cases
     * Enforces client sees ONLY their own cases.
     */
    @GetMapping("/cases")
    public ResponseEntity<?> getClientCases(HttpServletRequest request) {
        UserAccount user = jwtAuthService.requireRole(request, UserRole.CLIENT);
        Client client = resolveClientForUser(user);

        List<CaseRecord> cases = caseRepository.findByClientId(client.getId());
        if (cases.isEmpty() && client.getClientNumber() != null) {
            cases = caseRepository.findByClientId(client.getClientNumber());
        }
        return ResponseEntity.ok(cases);
    }

    /**
     * GET /api/client/notifications
     * Retrieves client notifications.
     */
    @GetMapping("/notifications")
    public ResponseEntity<?> getClientNotifications(HttpServletRequest request) {
        UserAccount user = jwtAuthService.requireRole(request, UserRole.CLIENT);
        List<SystemNotification> notifs = notificationRepository.findByUserIdOrRecipientRoleOrderByCreatedAtDesc(user.getId(), "Client");
        return ResponseEntity.ok(notifs);
    }

    private Client resolveClientForUser(UserAccount user) {
        return clientRepository.findByUserId(user.getId())
                .or(() -> clientRepository.findByClientNumber(user.getStaffId()))
                .or(() -> clientRepository.findByEmailIgnoreCase(user.getEmail()))
                .orElseGet(() -> {
                    // Create if not yet present
                    Client c = new Client();
                    c.setId("clt-" + UUID.randomUUID().toString().substring(0, 8));
                    c.setUserId(user.getId());
                    c.setClientNumber(user.getStaffId() != null ? user.getStaffId() : "CLT-0001");
                    c.setName(user.getName());
                    c.setEmail(user.getEmail());
                    c.setPhone(user.getPhone());
                    c.setStatus("ACTIVE");
                    c.setVerificationStatus("VERIFIED");
                    return clientRepository.save(c);
                });
    }
}
