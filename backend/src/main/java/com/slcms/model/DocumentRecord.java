package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing an uploaded case document or court filing.
 * Mapped to the persistent 'documents' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "documents")
public class DocumentRecord {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "case_id", length = 50)
    private String caseId;

    @Column(name = "case_number", length = 100)
    private String caseNumber;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "original_filename", length = 255, nullable = false)
    private String originalFilename;

    @Column(name = "stored_filename", length = 255, nullable = false)
    private String storedFilename;

    @Column(name = "file_type", length = 50)
    private String fileType; // PDF, DOCX, PNG, JPG, TXT

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Column(name = "sensitivity", length = 50)
    private String sensitivity = "CONFIDENTIAL"; // PUBLIC, RESTRICTED, CONFIDENTIAL, HIGHLY_CONFIDENTIAL

    @Column(name = "category", length = 100)
    private String category; // Pleading, Evidence, Court Order, Correspondence, Legal Notice

    @Column(name = "uploaded_by", length = 50)
    private String uploadedBy;

    @Column(name = "uploaded_by_name", length = 150)
    private String uploadedByName;

    @Column(name = "ocr_status", length = 50)
    private String ocrStatus = "PENDING"; // PENDING, COMPLETED, NOT_REQUIRED, FAILED

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public DocumentRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getStoredFilename() { return storedFilename; }
    public void setStoredFilename(String storedFilename) { this.storedFilename = storedFilename; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }

    public String getSensitivity() { return sensitivity; }
    public void setSensitivity(String sensitivity) { this.sensitivity = sensitivity; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getUploadedByName() { return uploadedByName; }
    public void setUploadedByName(String uploadedByName) { this.uploadedByName = uploadedByName; }

    public String getOcrStatus() { return ocrStatus; }
    public void setOcrStatus(String ocrStatus) { this.ocrStatus = ocrStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
