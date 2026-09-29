package com.slcms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Representation of backup-info.json contained inside every SLCMS ZIP backup archive.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BackupInfoDTO {

    private String backupId;
    private String createdAt;
    private String createdBy;
    private String type; // MANUAL, SCHEDULED, SAFETY_PRE_RESTORE
    private String status; // SUCCESSFUL, FAILED
    private int users;
    private int clients;
    private int cases;
    private int documents;
    private int judgments;
    private Long sizeBytes;
    private String sizeFormatted;
    private String filename;

    public BackupInfoDTO() {}

    public BackupInfoDTO(String backupId, String createdAt, String createdBy, String type, String status,
                         int users, int clients, int cases, int documents, int judgments) {
        this.backupId = backupId;
        this.createdAt = createdAt;
        this.createdBy = createdBy;
        this.type = type;
        this.status = status;
        this.users = users;
        this.clients = clients;
        this.cases = cases;
        this.documents = documents;
        this.judgments = judgments;
    }

    public String getBackupId() {
        return backupId;
    }

    public void setBackupId(String backupId) {
        this.backupId = backupId;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getUsers() {
        return users;
    }

    public void setUsers(int users) {
        this.users = users;
    }

    public int getClients() {
        return clients;
    }

    public void setClients(int clients) {
        this.clients = clients;
    }

    public int getCases() {
        return cases;
    }

    public void setCases(int cases) {
        this.cases = cases;
    }

    public int getDocuments() {
        return documents;
    }

    public void setDocuments(int documents) {
        this.documents = documents;
    }

    public int getJudgments() {
        return judgments;
    }

    public void setJudgments(int judgments) {
        this.judgments = judgments;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getSizeFormatted() {
        return sizeFormatted;
    }

    public void setSizeFormatted(String sizeFormatted) {
        this.sizeFormatted = sizeFormatted;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }
}
