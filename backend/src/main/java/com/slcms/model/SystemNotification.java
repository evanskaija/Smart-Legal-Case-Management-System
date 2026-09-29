package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_notifications")
public class SystemNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", length = 100)
    private String userId;

    @Column(name = "recipient_role", length = 50)
    private String recipientRole;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "notification_type", length = 50)
    private String type = "INFO";

    @Column(name = "related_case_id", length = 100)
    private String relatedCaseId;

    @Column(name = "related_invoice_id")
    private Long relatedInvoiceId;

    @Column(name = "is_read")
    private boolean read = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public SystemNotification() {}

    public SystemNotification(String userId, String recipientRole, String title, String message, String type, String relatedCaseId) {
        this.userId = userId;
        this.recipientRole = recipientRole;
        this.title = title;
        this.message = message;
        this.type = type;
        this.relatedCaseId = relatedCaseId;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRecipientRole() {
        return recipientRole;
    }

    public void setRecipientRole(String recipientRole) {
        this.recipientRole = recipientRole;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRelatedCaseId() {
        return relatedCaseId;
    }

    public void setRelatedCaseId(String relatedCaseId) {
        this.relatedCaseId = relatedCaseId;
    }

    public Long getRelatedInvoiceId() {
        return relatedInvoiceId;
    }

    public void setRelatedInvoiceId(Long relatedInvoiceId) {
        this.relatedInvoiceId = relatedInvoiceId;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
