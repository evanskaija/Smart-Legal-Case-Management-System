package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing generated reports, legal letters, and court draft documents.
 * Mapped to the persistent 'generated_documents' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "generated_documents")
public class GeneratedDocument {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "case_id", length = 50)
    private String caseId;

    @Column(name = "case_number", length = 100)
    private String caseNumber;

    @Column(name = "document_type", length = 100)
    private String documentType; // Formal Demand Letter, Plaint Draft, Legal Brief, Billing Summary

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_format", length = 50)
    private String fileFormat = "PDF";

    @Column(name = "generated_by", length = 150)
    private String generatedBy;

    @Column(name = "status", length = 50)
    private String status = "Draft";

    @Lob
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "approved_by", length = 150)
    private String approvedBy;

    @Column(name = "instructions", length = 1000)
    private String instructions;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public GeneratedDocument() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getFileFormat() { return fileFormat; }
    public void setFileFormat(String fileFormat) { this.fileFormat = fileFormat; }

    public String getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
