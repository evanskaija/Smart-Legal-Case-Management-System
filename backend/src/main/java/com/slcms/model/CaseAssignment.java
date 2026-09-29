package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing the many-to-many relationship linking Cases to Users (lawyers/clerks).
 * Mapped to the persistent 'case_assignments' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "case_assignments")
public class CaseAssignment {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "case_id", length = 50, nullable = false)
    private String caseId;

    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    @Column(name = "assigned_role", length = 50)
    private String assignedRole; // Lead Counsel, Co-Counsel, Associate, Legal Clerk

    @Column(name = "assigned_by", length = 50)
    private String assignedBy;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt = LocalDateTime.now();

    public CaseAssignment() {}

    public CaseAssignment(String id, String caseId, String userId, String assignedRole, String assignedBy) {
        this.id = id;
        this.caseId = caseId;
        this.userId = userId;
        this.assignedRole = assignedRole;
        this.assignedBy = assignedBy;
        this.assignedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAssignedRole() { return assignedRole; }
    public void setAssignedRole(String assignedRole) { this.assignedRole = assignedRole; }

    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
