package com.slcms.dto;

/**
 * Data Transfer Object for Client Communications and Notifications.
 */
public class ClientMessageDTO {
    private String messageId;
    private String caseId;
    private String caseTitle;
    private String caseNumber;
    private String clientId;
    private String clientName;
    private String messageType;
    private String channel;
    private String sender;
    private String recipient;
    private String subject;
    private String messageBody;
    private String language;
    private String status;
    private String preparedBy;
    private String approvedBy;
    private String sentBy;
    private String scheduledAt;
    private String sentAt;
    private String providerReference;
    private String gmailMessageId;
    private String failureReason;
    private String createdAt;
    private String updatedAt;

    public ClientMessageDTO() {}

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getCaseTitle() { return caseTitle; }
    public void setCaseTitle(String caseTitle) { this.caseTitle = caseTitle; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

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

    public String getGmailMessageId() { return gmailMessageId; }
    public void setGmailMessageId(String gmailMessageId) { this.gmailMessageId = gmailMessageId; }

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

    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }

    public String getSentAt() { return sentAt; }
    public void setSentAt(String sentAt) { this.sentAt = sentAt; }

    public String getProviderReference() { return providerReference; }
    public void setProviderReference(String providerReference) { this.providerReference = providerReference; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
