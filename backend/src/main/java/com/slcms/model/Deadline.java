package com.slcms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deadlines")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Deadline {
    @Id
    @Column(length = 50)
    private String id;
    @Column(name = "title", length = 255)
    private String title;
    @Column(name = "case_id", length = 50)
    private String caseId;
    private String caseNumber;
    private String caseTitle;
    private String type; // Hearing, Mention, Filing, Submission, Appeal, Other
    private LocalDateTime deadlineAt;
    private String deadlineDateString;
    @JsonProperty("deadlineTime")
    private String deadlineTime;
    private String court;
    private String registry;
    private String responsibleLawyerId;
    private String responsibleLawyerName;
    private String source; // Court Order, Legislation, Manually Entered
    private String statutoryReference;
    private LocalDateTime reminderAt;
    private String supportingDocument;
    private String changeReason;
    private LocalDateTime previousDeadlineAt;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Deadline() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Deadline d = new Deadline();
        public Builder id(String id) { d.id = id; return this; }
        public Builder title(String title) { d.title = title; return this; }
        public Builder caseId(String caseId) { d.caseId = caseId; return this; }
        public Builder caseNumber(String caseNumber) { d.caseNumber = caseNumber; return this; }
        public Builder caseTitle(String caseTitle) { d.caseTitle = caseTitle; return this; }
        public Builder type(String type) { d.type = type; return this; }
        public Builder deadlineAt(LocalDateTime deadlineAt) { d.deadlineAt = deadlineAt; return this; }
        public Builder deadlineDateString(String deadlineDateString) { d.deadlineDateString = deadlineDateString; return this; }
        public Builder court(String court) { d.court = court; return this; }
        public Builder registry(String registry) { d.registry = registry; return this; }
        public Builder responsibleLawyerId(String responsibleLawyerId) { d.responsibleLawyerId = responsibleLawyerId; return this; }
        public Builder responsibleLawyerName(String responsibleLawyerName) { d.responsibleLawyerName = responsibleLawyerName; return this; }
        public Builder source(String source) { d.source = source; return this; }
        public Builder statutoryReference(String statutoryReference) { d.statutoryReference = statutoryReference; return this; }
        public Builder reminderAt(LocalDateTime reminderAt) { d.reminderAt = reminderAt; return this; }
        public Builder supportingDocument(String supportingDocument) { d.supportingDocument = supportingDocument; return this; }
        public Builder changeReason(String changeReason) { d.changeReason = changeReason; return this; }
        public Builder previousDeadlineAt(LocalDateTime previousDeadlineAt) { d.previousDeadlineAt = previousDeadlineAt; return this; }
        public Builder createdBy(String createdBy) { d.createdBy = createdBy; return this; }
        public Builder createdAt(LocalDateTime createdAt) { d.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { d.updatedAt = updatedAt; return this; }
        public Deadline build() { return d; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getCaseTitle() { return caseTitle; }
    public void setCaseTitle(String caseTitle) { this.caseTitle = caseTitle; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(LocalDateTime deadlineAt) { this.deadlineAt = deadlineAt; }

    public String getDeadlineDateString() { return deadlineDateString; }
    public void setDeadlineDateString(String deadlineDateString) { this.deadlineDateString = deadlineDateString; }

    public String getDeadlineTime() { return deadlineTime; }
    public void setDeadlineTime(String deadlineTime) { this.deadlineTime = deadlineTime; }

    public String getCourt() { return court; }
    public void setCourt(String court) { this.court = court; }

    public String getRegistry() { return registry; }
    public void setRegistry(String registry) { this.registry = registry; }

    public String getResponsibleLawyerId() { return responsibleLawyerId; }
    public void setResponsibleLawyerId(String responsibleLawyerId) { this.responsibleLawyerId = responsibleLawyerId; }

    public String getResponsibleLawyerName() { return responsibleLawyerName; }
    public void setResponsibleLawyerName(String responsibleLawyerName) { this.responsibleLawyerName = responsibleLawyerName; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getStatutoryReference() { return statutoryReference; }
    public void setStatutoryReference(String statutoryReference) { this.statutoryReference = statutoryReference; }

    public LocalDateTime getReminderAt() { return reminderAt; }
    public void setReminderAt(LocalDateTime reminderAt) { this.reminderAt = reminderAt; }

    public String getSupportingDocument() { return supportingDocument; }
    public void setSupportingDocument(String supportingDocument) { this.supportingDocument = supportingDocument; }

    public String getChangeReason() { return changeReason; }
    public void setChangeReason(String changeReason) { this.changeReason = changeReason; }

    public LocalDateTime getPreviousDeadlineAt() { return previousDeadlineAt; }
    public void setPreviousDeadlineAt(LocalDateTime previousDeadlineAt) { this.previousDeadlineAt = previousDeadlineAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
