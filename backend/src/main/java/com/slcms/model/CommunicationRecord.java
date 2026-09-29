package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing official communications dispatched to clients and courts.
 * Mapped to the persistent 'communications' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "communications")
public class CommunicationRecord {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "message_id", length = 100)
    private String messageId;

    @Column(name = "case_id", length = 50)
    private String caseId;

    @Column(name = "case_number", length = 100)
    private String caseNumber;

    @Column(name = "case_title", length = 255)
    private String caseTitle;

    @Column(name = "client_id", length = 50)
    private String clientId;

    @Column(name = "client_name", length = 150)
    private String clientName;

    @Column(name = "message_type", length = 100)
    private String messageType; // Hearing Reminder, Appointment Reminder, Status Update, Invoice Delivery

    @Column(name = "channel", length = 50)
    private String channel = "Email"; // Email, Phone, Meeting, Letter

    @Column(name = "sender", length = 150)
    private String sender;

    @Column(name = "recipient", length = 150)
    private String recipient;

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "message_body", columnDefinition = "TEXT")
    private String messageBody;

    @Column(name = "language", length = 50)
    private String language = "English";

    @Column(name = "status", length = 50)
    private String status = "SENT"; // SENT, FAILED, Draft, Opened in Gmail, Confirmed Sent by Staff

    @Column(name = "prepared_by", length = 150)
    private String preparedBy;

    @Column(name = "approved_by", length = 150)
    private String approvedBy;

    @Column(name = "sent_by", length = 150)
    private String sentBy;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "gmail_message_id", length = 150)
    private String gmailMessageId;

    @Column(name = "provider_reference", length = 150)
    private String providerReference;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public CommunicationRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getCaseTitle() { return caseTitle; }
    public void setCaseTitle(String caseTitle) { this.caseTitle = caseTitle; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessageBody() { return messageBody; }
    public void setMessageBody(String messageBody) { this.messageBody = messageBody; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPreparedBy() { return preparedBy; }
    public void setPreparedBy(String preparedBy) { this.preparedBy = preparedBy; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public String getSentBy() { return sentBy; }
    public void setSentBy(String sentBy) { this.sentBy = sentBy; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public String getGmailMessageId() { return gmailMessageId; }
    public void setGmailMessageId(String gmailMessageId) { this.gmailMessageId = gmailMessageId; }

    public String getProviderReference() { return providerReference; }
    public void setProviderReference(String providerReference) { this.providerReference = providerReference; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
