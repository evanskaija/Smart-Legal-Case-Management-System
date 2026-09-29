package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a system backup archive and its verification status.
 * Mapped to the persistent 'system_backups' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "system_backups")
public class SystemBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "filename", length = 255, nullable = false)
    private String filename;

    @Column(name = "filepath", length = 500, nullable = false)
    private String filepath;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "status", length = 30, nullable = false)
    private String status; // 'Not Created', 'In Progress', 'Successful', 'Failed'

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "verified")
    private boolean verified;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public SystemBackup() {
        this.status = "Not Created";
        this.createdAt = LocalDateTime.now();
    }

    public SystemBackup(Long id, String filename, String filepath, Long sizeBytes, String status, String createdBy, boolean verified) {
        this.id = id;
        this.filename = filename;
        this.filepath = filepath;
        this.sizeBytes = sizeBytes;
        this.status = status;
        this.createdBy = createdBy;
        this.verified = verified;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getFilepath() {
        return filepath;
    }

    public void setFilepath(String filepath) {
        this.filepath = filepath;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
