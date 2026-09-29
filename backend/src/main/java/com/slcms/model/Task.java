package com.slcms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Task {
    @Id
    @Column(length = 50)
    private String id;
    @Column(name = "title", length = 255)
    private String title;
    @Column(name = "case_id", length = 50)
    private String caseId;
    private String caseNumber;
    private String caseTitle;
    private String assignedTo;
    private String assignedToName;
    private String assignedToAvatar;
    private String supervisorId;
    private String supervisorName;
    private String priority; // URGENT, HIGH, MEDIUM, LOW
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private TaskStatus status;
    private LocalDateTime dueAt;
    private String dueDateString;
    @JsonProperty("dueDate")
    private String dueDate;
    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;
    private LocalDateTime reminderAt;
    private boolean isStatutoryDeadline;
    private String statutoryReference;
    private String filingStatus; // NOT_FILED, FILED
    private String filingDate;
    private String filingReference;
    @Column(name = "review_feedback", columnDefinition = "TEXT")
    private String reviewFeedback;
    private boolean isAdministrative;
    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    public Task() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Task t = new Task();
        public Builder id(String id) { t.id = id; return this; }
        public Builder title(String title) { t.title = title; return this; }
        public Builder caseId(String caseId) { t.caseId = caseId; return this; }
        public Builder caseNumber(String caseNumber) { t.caseNumber = caseNumber; return this; }
        public Builder caseTitle(String caseTitle) { t.caseTitle = caseTitle; return this; }
        public Builder assignedTo(String assignedTo) { t.assignedTo = assignedTo; return this; }
        public Builder assignedToName(String assignedToName) { t.assignedToName = assignedToName; return this; }
        public Builder assignedToAvatar(String assignedToAvatar) { t.assignedToAvatar = assignedToAvatar; return this; }
        public Builder supervisorId(String supervisorId) { t.supervisorId = supervisorId; return this; }
        public Builder supervisorName(String supervisorName) { t.supervisorName = supervisorName; return this; }
        public Builder priority(String priority) { t.priority = priority; return this; }
        public Builder status(TaskStatus status) { t.status = status; return this; }
        public Builder dueAt(LocalDateTime dueAt) { t.dueAt = dueAt; return this; }
        public Builder dueDateString(String dueDateString) { t.dueDateString = dueDateString; return this; }
        public Builder instructions(String instructions) { t.instructions = instructions; return this; }
        public Builder reminderAt(LocalDateTime reminderAt) { t.reminderAt = reminderAt; return this; }
        public Builder isStatutoryDeadline(boolean isStatutoryDeadline) { t.isStatutoryDeadline = isStatutoryDeadline; return this; }
        public Builder statutoryReference(String statutoryReference) { t.statutoryReference = statutoryReference; return this; }
        public Builder filingStatus(String filingStatus) { t.filingStatus = filingStatus; return this; }
        public Builder filingDate(String filingDate) { t.filingDate = filingDate; return this; }
        public Builder filingReference(String filingReference) { t.filingReference = filingReference; return this; }
        public Builder reviewFeedback(String reviewFeedback) { t.reviewFeedback = reviewFeedback; return this; }
        public Builder isAdministrative(boolean isAdministrative) { t.isAdministrative = isAdministrative; return this; }
        public Builder cancellationReason(String cancellationReason) { t.cancellationReason = cancellationReason; return this; }
        public Builder createdBy(String createdBy) { t.createdBy = createdBy; return this; }
        public Builder createdByName(String createdByName) { t.createdByName = createdByName; return this; }
        public Builder createdAt(LocalDateTime createdAt) { t.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { t.updatedAt = updatedAt; return this; }
        public Builder completedAt(LocalDateTime completedAt) { t.completedAt = completedAt; return this; }
        public Task build() { return t; }
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

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public String getAssignedToAvatar() { return assignedToAvatar; }
    public void setAssignedToAvatar(String assignedToAvatar) { this.assignedToAvatar = assignedToAvatar; }

    public String getSupervisorId() { return supervisorId; }
    public void setSupervisorId(String supervisorId) { this.supervisorId = supervisorId; }

    public String getSupervisorName() { return supervisorName; }
    public void setSupervisorName(String supervisorName) { this.supervisorName = supervisorName; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public LocalDateTime getDueAt() { return dueAt; }
    public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }

    public String getDueDateString() { return dueDateString != null ? dueDateString : dueDate; }
    public void setDueDateString(String dueDateString) { this.dueDateString = dueDateString; this.dueDate = dueDateString; }

    public String getDueDate() { return dueDate != null ? dueDate : dueDateString; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; this.dueDateString = dueDate; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public LocalDateTime getReminderAt() { return reminderAt; }
    public void setReminderAt(LocalDateTime reminderAt) { this.reminderAt = reminderAt; }

    public boolean isStatutoryDeadline() { return isStatutoryDeadline; }
    public void setStatutoryDeadline(boolean statutoryDeadline) { isStatutoryDeadline = statutoryDeadline; }

    public String getStatutoryReference() { return statutoryReference; }
    public void setStatutoryReference(String statutoryReference) { this.statutoryReference = statutoryReference; }

    public String getFilingStatus() { return filingStatus; }
    public void setFilingStatus(String filingStatus) { this.filingStatus = filingStatus; }

    public String getFilingDate() { return filingDate; }
    public void setFilingDate(String filingDate) { this.filingDate = filingDate; }

    public String getFilingReference() { return filingReference; }
    public void setFilingReference(String filingReference) { this.filingReference = filingReference; }

    public String getReviewFeedback() { return reviewFeedback; }
    public void setReviewFeedback(String reviewFeedback) { this.reviewFeedback = reviewFeedback; }

    public boolean isAdministrative() { return isAdministrative; }
    public void setAdministrative(boolean administrative) { isAdministrative = administrative; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
