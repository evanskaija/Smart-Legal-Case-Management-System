package com.slcms.controller;

import com.slcms.model.Invoice;
import com.slcms.model.Payment;
import com.slcms.repository.InvoiceRepository;
import com.slcms.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*")
public class BillingController {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    @Autowired
    public BillingController(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * POST /api/invoices - Create invoice (Role protected: Legal Officer)
     */
    @PostMapping("/invoices")
    public ResponseEntity<?> createInvoice(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "Legal Officer") String userRole,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "usr-008") String userId
    ) {
        // Enforce role protection
        if (!"Legal Officer".equalsIgnoreCase(userRole) && !"Senior Legal Officer".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "ACCESS_DENIED", "message", "Only Legal Officers can create firm invoices."));
        }

        String clientId = (String) body.get("clientId");
        String requestId = (String) body.get("requestId");
        String caseId = (String) body.get("caseId");
        String serviceDescription = (String) body.get("serviceDescription");
        Object amountObj = body.get("totalAmount");
        String issueDateStr = (String) body.get("issueDate");
        String dueDateStr = (String) body.get("dueDate");

        if (clientId == null || serviceDescription == null || amountObj == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "INVALID_INPUT", "message", "Missing required fields: clientId, serviceDescription, totalAmount"));
        }

        BigDecimal totalAmount = new BigDecimal(amountObj.toString());
        long invoiceCount = invoiceRepository.count() + 1;
        String invoiceNumber = String.format("INV-2026-%04d", invoiceCount);

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setClientId(clientId);
        invoice.setRequestId(requestId);
        invoice.setCaseId(caseId);
        invoice.setServiceDescription(serviceDescription);
        invoice.setTotalAmount(totalAmount);
        invoice.setAmountPaid(BigDecimal.ZERO);
        invoice.setIssueDate(issueDateStr != null ? LocalDate.parse(issueDateStr) : LocalDate.now());
        invoice.setDueDate(dueDateStr != null ? LocalDate.parse(dueDateStr) : LocalDate.now().plusDays(14));
        invoice.setStatus("ISSUED");
        invoice.setCreatedBy(userId);
        invoice.setCreatedAt(LocalDateTime.now());

        Invoice saved = invoiceRepository.save(invoice);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Invoice created and sent to client.");
        response.put("invoice", saved);
        response.put("balance", saved.getBalance());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/invoices/client/{clientId} - Retrieve client invoices
     */
    @GetMapping("/invoices/client/{clientId}")
    public ResponseEntity<?> getClientInvoices(
            @PathVariable("clientId") String clientId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "Client") String userRole,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "") String userId
    ) {
        if ("Administrator".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED", "message", "Administrators do not perform billing work."));
        }

        List<Invoice> invoices = invoiceRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        return ResponseEntity.ok(invoices);
    }

    /**
     * GET /api/invoices/{invoiceId} - Retrieve single invoice
     */
    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<?> getInvoiceById(@PathVariable("invoiceId") Long invoiceId) {
        Optional<Invoice> inv = invoiceRepository.findById(invoiceId);
        if (inv.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "NOT_FOUND", "message", "Invoice not found."));
        }
        return ResponseEntity.ok(inv.get());
    }

    /**
     * POST /api/payments/proof - Client uploads payment proof
     */
    @PostMapping("/payments/proof")
    public ResponseEntity<?> uploadPaymentProof(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "Client") String userRole
    ) {
        if (!"Client".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED", "message", "Only Clients can upload payment proof."));
        }

        Object invIdObj = body.get("invoiceId");
        Object amountObj = body.get("amount");
        String paymentMethod = (String) body.get("paymentMethod");
        String referenceNumber = (String) body.get("referenceNumber");
        String paymentDateStr = (String) body.get("paymentDate");
        String proofPath = (String) body.get("proofPath");

        if (invIdObj == null || amountObj == null || paymentMethod == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "INVALID_INPUT", "message", "Missing required payment fields."));
        }

        Long invoiceId = Long.parseLong(invIdObj.toString());
        Optional<Invoice> invOpt = invoiceRepository.findById(invoiceId);
        if (invOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "NOT_FOUND", "message", "Invoice not found."));
        }

        Invoice invoice = invOpt.get();
        Payment payment = new Payment();
        payment.setInvoiceId(invoiceId);
        payment.setAmount(new BigDecimal(amountObj.toString()));
        payment.setPaymentMethod(paymentMethod);
        payment.setReferenceNumber(referenceNumber != null ? referenceNumber : "DEMO-REF-" + System.currentTimeMillis());
        payment.setPaymentDate(paymentDateStr != null ? LocalDate.parse(paymentDateStr) : LocalDate.now());
        payment.setProofPath(proofPath != null ? proofPath : "uploads/proofs/demo_receipt.pdf");
        payment.setVerificationStatus("PENDING");

        Payment savedPayment = paymentRepository.save(payment);

        invoice.setStatus("VERIFICATION_PENDING");
        invoiceRepository.save(invoice);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment proof submitted successfully. Awaiting verification by Legal Officer.",
                "payment", savedPayment,
                "status", "VERIFICATION_PENDING"
        ));
    }

    /**
     * POST /api/payments/{paymentId}/confirm - Legal Officer confirms payment
     */
    @PostMapping("/payments/{paymentId}/confirm")
    public ResponseEntity<?> confirmPayment(
            @PathVariable("paymentId") Long paymentId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "Legal Officer") String userRole,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "usr-008") String userId
    ) {
        if (!"Legal Officer".equalsIgnoreCase(userRole) && !"Senior Legal Officer".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED", "message", "Only Legal Officers can confirm payment verification."));
        }

        Optional<Payment> payOpt = paymentRepository.findById(paymentId);
        if (payOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "NOT_FOUND", "message", "Payment record not found."));
        }

        Payment payment = payOpt.get();
        payment.setVerificationStatus("CONFIRMED");
        payment.setVerifiedBy(userId);
        payment.setVerifiedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        Optional<Invoice> invOpt = invoiceRepository.findById(payment.getInvoiceId());
        if (invOpt.isPresent()) {
            Invoice invoice = invOpt.get();
            invoice.setAmountPaid(payment.getAmount());
            invoice.setStatus("PAID");
            invoiceRepository.save(invoice);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment confirmed. Invoice status updated to PAID. Receipt generated.",
                "receiptNumber", "RCPT-2026-" + payment.getId()
        ));
    }

    /**
     * POST /api/payments/{paymentId}/reject - Legal Officer rejects payment
     */
    @PostMapping("/payments/{paymentId}/reject")
    public ResponseEntity<?> rejectPayment(
            @PathVariable("paymentId") Long paymentId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "Legal Officer") String userRole,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "usr-008") String userId
    ) {
        if (!"Legal Officer".equalsIgnoreCase(userRole) && !"Senior Legal Officer".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "ACCESS_DENIED", "message", "Only Legal Officers can reject payment verification."));
        }

        Optional<Payment> payOpt = paymentRepository.findById(paymentId);
        if (payOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "NOT_FOUND", "message", "Payment record not found."));
        }

        Payment payment = payOpt.get();
        payment.setVerificationStatus("REJECTED");
        payment.setVerifiedBy(userId);
        payment.setVerifiedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        Optional<Invoice> invOpt = invoiceRepository.findById(payment.getInvoiceId());
        if (invOpt.isPresent()) {
            Invoice invoice = invOpt.get();
            invoice.setStatus("REJECTED");
            invoiceRepository.save(invoice);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment rejected by Legal Officer.",
                "paymentId", paymentId
        ));
    }

    /**
     * GET /api/payments/{paymentId}/receipt - Download / View receipt
     */
    @GetMapping("/payments/{paymentId}/receipt")
    public ResponseEntity<?> getReceipt(@PathVariable("paymentId") Long paymentId) {
        Optional<Payment> payOpt = paymentRepository.findById(paymentId);
        if (payOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "NOT_FOUND", "message", "Payment record not found."));
        }

        Payment payment = payOpt.get();
        Optional<Invoice> invOpt = invoiceRepository.findById(payment.getInvoiceId());

        Map<String, Object> receipt = new HashMap<>();
        receipt.put("receiptNumber", "RCPT-2026-" + payment.getId());
        receipt.put("paymentDate", payment.getPaymentDate());
        receipt.put("amountPaid", payment.getAmount());
        receipt.put("paymentMethod", payment.getPaymentMethod());
        receipt.put("referenceNumber", payment.getReferenceNumber());
        receipt.put("verifiedBy", payment.getVerifiedBy() != null ? payment.getVerifiedBy() : "Adv. Joyce Mercer");
        receipt.put("status", payment.getVerificationStatus());
        if (invOpt.isPresent()) {
            receipt.put("invoiceNumber", invOpt.get().getInvoiceNumber());
            receipt.put("serviceDescription", invOpt.get().getServiceDescription());
        }

        return ResponseEntity.ok(receipt);
    }
}
