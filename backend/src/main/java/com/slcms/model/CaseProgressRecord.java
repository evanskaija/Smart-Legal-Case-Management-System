package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing chronological case progress, procedural rulings, and stage milestones.
 * Mapped to the persistent 'case_progress' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "case_progress")
public class CaseProgressRecord {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "case_id", length = 50, nullable = false)
    private String caseId;

    @Column(name = "stage_name", length = 100, nullable = false)
    private String stageName; // Filing, Pleadings, Pre-Trial Conference, Hearing, Submissions, Judgment, Appeal

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "recorded_by", length = 150)
    private String recordedBy;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt = LocalDateTime.now();

    public CaseProgressRecord() {}

    public CaseProgressRecord(String id, String caseId, String stageName, String notes, String recordedBy) {
        this.id = id;
        this.caseId = caseId;
        this.stageName = stageName;
        this.notes = notes;
        this.recordedBy = recordedBy;
        this.recordedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
