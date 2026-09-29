package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "case_messages")
public class CaseMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_id", nullable = false, length = 100)
    private String senderId;

    @Column(name = "sender_name", length = 150)
    private String senderName;

    @Column(name = "sender_role", length = 50)
    private String senderRole; // Client, Lawyer, Legal Officer

    @Column(name = "message_body", columnDefinition = "TEXT", nullable = false)
    private String messageBody;

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Column(name = "sent_at")
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    public CaseMessage() {}

    public CaseMessage(Long conversationId, String senderId, String messageBody) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.messageBody = messageBody;
        this.sentAt = LocalDateTime.now();
        this.deliveredAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public String getMessageBody() {
        return messageBody;
    }

    public void setMessageBody(String messageBody) {
        this.messageBody = messageBody;
    }

    public String getAttachmentPath() {
        return attachmentPath;
    }

    public void setAttachmentPath(String attachmentPath) {
        this.attachmentPath = attachmentPath;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
}
