package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a client's legal assistance request.
 * Mapped to the persistent 'legal_requests' table in MySQL (slcm_db).
 */
@Entity
@Table(name = "legal_requests")
public class LegalRequest {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "client_id", length = 50, nullable = false)
    private String clientId;

    @Column(name = "client_name", length = 150)
    private String clientName;

    @Column(name = "client_email", length = 150)
    private String clientEmail;

    @Column(name = "client_phone", length = 50)
    private String clientPhone;

    @Column(name = "issue_type", length = 50, nullable = false)
    private String issueType; // Civil, Criminal, Land, Matrimonial, Probate, Commercial, Labour, Other

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "opposing_party", length = 150)
    private String opposingParty;

    @Column(name = "preferred_contact_method", length = 50, nullable = false)
    private String preferredContactMethod = "Email"; // Email, Phone, Office Visit

    @Column(name = "supporting_documents", columnDefinition = "TEXT")
    private String supportingDocuments;

    @Column(name = "status", length = 50, nullable = false)
    private String status = "Submitted"; // Submitted, Under Review, More Information Required, Accepted, Declined, Converted to Case

    @Column(name = "officer_notes", columnDefinition = "TEXT")
    private String officerNotes;

    @Column(name = "case_id", length = 50)
    private String caseId;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public LegalRequest() {}

    public LegalRequest(String id, String clientId, String clientName, String clientEmail, String clientPhone,
                        String issueType, String description, String opposingParty, String preferredContactMethod) {
        this.id = id;
        this.clientId = clientId;
        this.clientName = clientName;
        this.clientEmail = clientEmail;
        this.clientPhone = clientPhone;
        this.issueType = issueType;
        this.description = description;
        this.opposingParty = opposingParty;
        this.preferredContactMethod = preferredContactMethod != null ? preferredContactMethod : "Email";
        this.status = "Submitted";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }

    public String getClientPhone() { return clientPhone; }
    public void setClientPhone(String clientPhone) { this.clientPhone = clientPhone; }

    public String getIssueType() { return issueType; }
    public void setIssueType(String issueType) { this.issueType = issueType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOpposingParty() { return opposingParty; }
    public void setOpposingParty(String opposingParty) { this.opposingParty = opposingParty; }

    public String getPreferredContactMethod() { return preferredContactMethod; }
    public void setPreferredContactMethod(String preferredContactMethod) { this.preferredContactMethod = preferredContactMethod; }

    public String getSupportingDocuments() { return supportingDocuments; }
    public void setSupportingDocuments(String supportingDocuments) { this.supportingDocuments = supportingDocuments; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOfficerNotes() { return officerNotes; }
    public void setOfficerNotes(String officerNotes) { this.officerNotes = officerNotes; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
