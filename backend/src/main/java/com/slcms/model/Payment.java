package com.slcms.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod; // Bank Transfer, Mobile Money, Cash, Direct Deposit

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "proof_path", length = 500)
    private String proofPath;

    @Column(name = "proof_document", length = 500)
    private String proofDocument;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "status", length = 30)
    private String status = "PENDING"; // PENDING, VERIFIED, REJECTED

    @Column(name = "verification_status", length = 30)
    private String verificationStatus = "PENDING"; // PENDING, CONFIRMED, REJECTED

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public Payment() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getProofPath() {
        return proofPath;
    }

    public void setProofPath(String proofPath) {
        this.proofPath = proofPath;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public String getProofDocument() {
        return proofDocument != null ? proofDocument : proofPath;
    }

    public void setProofDocument(String proofDocument) {
        this.proofDocument = proofDocument;
        if (this.proofPath == null) {
            this.proofPath = proofDocument;
        }
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getStatus() {
        return status != null ? status : verificationStatus;
    }

    public void setStatus(String status) {
        this.status = status;
        this.verificationStatus = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
