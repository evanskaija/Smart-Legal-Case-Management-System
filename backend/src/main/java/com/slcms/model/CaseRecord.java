package com.slcms.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Entity representing a legal case in SLCMS.
 * Mapped to the persistent 'cases' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "cases")
public class CaseRecord {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "case_number", length = 100, unique = true, nullable = false)
    private String caseNumber;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "case_title", length = 255)
    private String caseTitle;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "case_type", length = 50)
    private String caseType; // CIVIL, CRIMINAL, COMMERCIAL, LAND, TAX, LABOUR, CONSTITUTIONAL

    @Column(name = "status", length = 50, nullable = false)
    private String status = "ACTIVE"; // ACTIVE, PENDING, CLOSED, APPEAL, JUDGMENT_DELIVERED

    @Column(name = "client_id", length = 50)
    private String clientId;

    @Column(name = "request_id", length = 50)
    private String requestId;

    @Column(name = "client_name", length = 150)
    private String clientName;

    @Column(name = "court", length = 150)
    private String court;

    @Column(name = "registry", length = 150)
    private String registry;

    @Column(name = "lead_counsel_id", length = 50)
    private String leadCounselId;

    @Column(name = "lead_counsel", length = 150)
    private String leadCounsel;

    @Column(name = "judge_coram", length = 150)
    private String judgeCoram;

    @Column(name = "next_hearing_date", length = 50)
    private String nextHearingDate;

    @Column(name = "filing_date", length = 50)
    private String filingDate;

    @Column(name = "opposing_party", length = 150)
    private String opposingParty;

    @Column(name = "opposing_counsel", length = 150)
    private String opposingCounsel;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_sensitive")
    private boolean isSensitive = false;

    @Column(name = "decision_date", length = 50)
    private String decisionDate;

    @Column(name = "decision_year", length = 10)
    private String decisionYear;

    @Column(name = "citation", length = 100)
    private String citation;

    @Column(name = "priority", length = 50)
    private String priority = "Medium";

    @Column(name = "first_party_name", length = 150)
    private String firstPartyName;

    @Column(name = "first_party_role", length = 50)
    private String firstPartyRole;

    @Column(name = "second_party_name", length = 150)
    private String secondPartyName;

    @Column(name = "second_party_role", length = 50)
    private String secondPartyRole;

    @Column(name = "document_filename", length = 255)
    private String documentFilename;

    @Column(name = "document_storage_path", length = 255)
    private String documentStoragePath;

    @Column(name = "ocr_status", length = 50)
    private String ocrStatus;

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "case_assigned_users", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "user_id")
    private List<String> assignedUserIds = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public CaseRecord() {}

    public CaseRecord(String id, String caseNumber, String title, String category, String caseType, String status, String clientName, String court, String leadCounsel) {
        this.id = id;
        this.caseNumber = caseNumber;
        this.title = title;
        this.caseTitle = title;
        this.category = category;
        this.caseType = caseType;
        this.status = status;
        this.clientName = clientName;
        this.court = court;
        this.leadCounsel = leadCounsel;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) {
        this.title = title;
        if (this.caseTitle == null) this.caseTitle = title;
    }

    public String getCaseTitle() { return caseTitle != null ? caseTitle : title; }
    public void setCaseTitle(String caseTitle) {
        this.caseTitle = caseTitle;
        if (this.title == null) this.title = caseTitle;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCaseType() { return caseType; }
    public void setCaseType(String caseType) { this.caseType = caseType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getCourt() { return court; }
    public void setCourt(String court) { this.court = court; }

    public String getRegistry() { return registry; }
    public void setRegistry(String registry) { this.registry = registry; }

    public String getLeadCounselId() { return leadCounselId; }
    public void setLeadCounselId(String leadCounselId) { this.leadCounselId = leadCounselId; }

    public String getLeadCounsel() { return leadCounsel; }
    public void setLeadCounsel(String leadCounsel) { this.leadCounsel = leadCounsel; }

    public String getJudgeCoram() { return judgeCoram; }
    public void setJudgeCoram(String judgeCoram) { this.judgeCoram = judgeCoram; }

    public String getNextHearingDate() { return nextHearingDate; }
    public void setNextHearingDate(String nextHearingDate) { this.nextHearingDate = nextHearingDate; }

    public String getFilingDate() { return filingDate; }
    public void setFilingDate(String filingDate) { this.filingDate = filingDate; }

    public String getOpposingParty() { return opposingParty; }
    public void setOpposingParty(String opposingParty) { this.opposingParty = opposingParty; }

    public String getOpposingCounsel() { return opposingCounsel; }
    public void setOpposingCounsel(String opposingCounsel) { this.opposingCounsel = opposingCounsel; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isSensitive() { return isSensitive; }
    public void setSensitive(boolean sensitive) { isSensitive = sensitive; }

    public List<String> getAssignedUserIds() { return assignedUserIds; }
    public void setAssignedUserIds(List<String> assignedUserIds) { this.assignedUserIds = assignedUserIds != null ? assignedUserIds : new ArrayList<>(); }

    public String getDecisionDate() { return decisionDate; }
    public void setDecisionDate(String decisionDate) { this.decisionDate = decisionDate; }

    public String getDecisionYear() { return decisionYear; }
    public void setDecisionYear(String decisionYear) { this.decisionYear = decisionYear; }

    public String getCitation() { return citation; }
    public void setCitation(String citation) { this.citation = citation; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getFirstPartyName() { return firstPartyName; }
    public void setFirstPartyName(String firstPartyName) { this.firstPartyName = firstPartyName; }

    public String getFirstPartyRole() { return firstPartyRole; }
    public void setFirstPartyRole(String firstPartyRole) { this.firstPartyRole = firstPartyRole; }

    public String getSecondPartyName() { return secondPartyName; }
    public void setSecondPartyName(String secondPartyName) { this.secondPartyName = secondPartyName; }

    public String getSecondPartyRole() { return secondPartyRole; }
    public void setSecondPartyRole(String secondPartyRole) { this.secondPartyRole = secondPartyRole; }

    public String getDocumentFilename() { return documentFilename; }
    public void setDocumentFilename(String documentFilename) { this.documentFilename = documentFilename; }

    public String getDocumentStoragePath() { return documentStoragePath; }
    public void setDocumentStoragePath(String documentStoragePath) { this.documentStoragePath = documentStoragePath; }

    public String getOcrStatus() { return ocrStatus; }
    public void setOcrStatus(String ocrStatus) { this.ocrStatus = ocrStatus; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
