package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "case_conversations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"case_id"})
})
public class CaseConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false, length = 100, unique = true)
    private String caseId;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "lawyer_id", nullable = false, length = 100)
    private String lawyerId;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public CaseConversation() {}

    public CaseConversation(String caseId, String clientId, String lawyerId) {
        this.caseId = caseId;
        this.clientId = clientId;
        this.lawyerId = lawyerId;
        this.status = "ACTIVE";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getLawyerId() {
        return lawyerId;
    }

    public void setLawyerId(String lawyerId) {
        this.lawyerId = lawyerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
