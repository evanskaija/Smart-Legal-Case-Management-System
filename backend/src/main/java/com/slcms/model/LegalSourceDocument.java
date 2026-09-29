package com.slcms.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a Legal Source Document indexed in the SLCMS Legal Library.
 */
public class LegalSourceDocument {

    private String id;
    private String title;
    private String sourceName; // e.g. "TanzLII (Tanzania Legal Information Institute)"
    private String tanzliiUrl;
    private String court;
    private String caseNumber;
    private LocalDate decisionDate;
    private String category; // e.g. "Commercial law", "Land law", "Probate and Family law"
    private String description;
    
    // Access Control & RBAC
    private String accessLevel; // "Public Legal Library", "Entire Law Firm", "Selected Users", "Related Case Only", "Private to Me"
    private String relatedCaseId;
    private String uploadedBy;
    private LocalDateTime uploadedAt;

    // Processing & Extraction State
    private DocumentStatus status; // UPLOADED, EXTRACTING_TEXT, INDEXING, READY_FOR_AI, PROCESSING_FAILED
    private String failureReason;
    private String storedFilePath;
    private String originalFileName;
    private String fileType; // PDF, DOCX, TXT
    private long fileSizeBytes;

    // Extracted content
    private String rawExtractedText;
    private int totalWordCount;
    private int totalCharacterCount;
    private int totalPages;
    private boolean ocrApplied;

    // Searchable passages
    private List<LegalPassage> passages = new ArrayList<>();

    public LegalSourceDocument() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final LegalSourceDocument doc = new LegalSourceDocument();

        public Builder id(String id) { doc.id = id; return this; }
        public Builder title(String title) { doc.title = title; return this; }
        public Builder sourceName(String sourceName) { doc.sourceName = sourceName; return this; }
        public Builder tanzliiUrl(String tanzliiUrl) { doc.tanzliiUrl = tanzliiUrl; return this; }
        public Builder court(String court) { doc.court = court; return this; }
        public Builder caseNumber(String caseNumber) { doc.caseNumber = caseNumber; return this; }
        public Builder decisionDate(LocalDate decisionDate) { doc.decisionDate = decisionDate; return this; }
        public Builder category(String category) { doc.category = category; return this; }
        public Builder description(String description) { doc.description = description; return this; }
        public Builder accessLevel(String accessLevel) { doc.accessLevel = accessLevel; return this; }
        public Builder relatedCaseId(String relatedCaseId) { doc.relatedCaseId = relatedCaseId; return this; }
        public Builder uploadedBy(String uploadedBy) { doc.uploadedBy = uploadedBy; return this; }
        public Builder uploadedAt(LocalDateTime uploadedAt) { doc.uploadedAt = uploadedAt; return this; }
        public Builder status(DocumentStatus status) { doc.status = status; return this; }
        public Builder failureReason(String failureReason) { doc.failureReason = failureReason; return this; }
        public Builder storedFilePath(String storedFilePath) { doc.storedFilePath = storedFilePath; return this; }
        public Builder originalFileName(String originalFileName) { doc.originalFileName = originalFileName; return this; }
        public Builder fileType(String fileType) { doc.fileType = fileType; return this; }
        public Builder fileSizeBytes(long fileSizeBytes) { doc.fileSizeBytes = fileSizeBytes; return this; }
        public Builder rawExtractedText(String rawExtractedText) { doc.rawExtractedText = rawExtractedText; return this; }
        public Builder totalWordCount(int totalWordCount) { doc.totalWordCount = totalWordCount; return this; }
        public Builder totalCharacterCount(int totalCharacterCount) { doc.totalCharacterCount = totalCharacterCount; return this; }
        public Builder totalPages(int totalPages) { doc.totalPages = totalPages; return this; }
        public Builder ocrApplied(boolean ocrApplied) { doc.ocrApplied = ocrApplied; return this; }
        public Builder passages(List<LegalPassage> passages) { doc.passages = passages != null ? passages : new ArrayList<>(); return this; }

        public LegalSourceDocument build() { return doc; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getTanzliiUrl() { return tanzliiUrl; }
    public void setTanzliiUrl(String tanzliiUrl) { this.tanzliiUrl = tanzliiUrl; }

    public String getCourt() { return court; }
    public void setCourt(String court) { this.court = court; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public LocalDate getDecisionDate() { return decisionDate; }
    public void setDecisionDate(LocalDate decisionDate) { this.decisionDate = decisionDate; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAccessLevel() { return accessLevel; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }

    public String getRelatedCaseId() { return relatedCaseId; }
    public void setRelatedCaseId(String relatedCaseId) { this.relatedCaseId = relatedCaseId; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public DocumentStatus getStatus() { return status; }
    public void setStatus(DocumentStatus status) { this.status = status; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getStoredFilePath() { return storedFilePath; }
    public void setStoredFilePath(String storedFilePath) { this.storedFilePath = storedFilePath; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getRawExtractedText() { return rawExtractedText; }
    public void setRawExtractedText(String rawExtractedText) { this.rawExtractedText = rawExtractedText; }

    public int getTotalWordCount() { return totalWordCount; }
    public void setTotalWordCount(int totalWordCount) { this.totalWordCount = totalWordCount; }

    public int getTotalCharacterCount() { return totalCharacterCount; }
    public void setTotalCharacterCount(int totalCharacterCount) { this.totalCharacterCount = totalCharacterCount; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public boolean isOcrApplied() { return ocrApplied; }
    public void setOcrApplied(boolean ocrApplied) { this.ocrApplied = ocrApplied; }

    public List<LegalPassage> getPassages() { return passages; }
    public void setPassages(List<LegalPassage> passages) { this.passages = passages != null ? passages : new ArrayList<>(); }

    public enum DocumentStatus {
        UPLOADED,
        EXTRACTING_TEXT,
        INDEXING,
        READY_FOR_AI,
        PROCESSING_FAILED
    }
}
