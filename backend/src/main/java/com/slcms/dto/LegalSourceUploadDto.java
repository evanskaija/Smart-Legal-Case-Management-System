package com.slcms.dto;

/**
 * Form data payload for legal document upload.
 */
public class LegalSourceUploadDto {

    private String title;
    private String source;
    private String tanzliiUrl;
    private String court;
    private String caseNumber;
    private String decisionDate;
    private String category;
    private String description;
    private String accessLevel;
    private String relatedCaseId;

    public LegalSourceUploadDto() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final LegalSourceUploadDto dto = new LegalSourceUploadDto();
        public Builder title(String title) { dto.title = title; return this; }
        public Builder source(String source) { dto.source = source; return this; }
        public Builder tanzliiUrl(String tanzliiUrl) { dto.tanzliiUrl = tanzliiUrl; return this; }
        public Builder court(String court) { dto.court = court; return this; }
        public Builder caseNumber(String caseNumber) { dto.caseNumber = caseNumber; return this; }
        public Builder decisionDate(String decisionDate) { dto.decisionDate = decisionDate; return this; }
        public Builder category(String category) { dto.category = category; return this; }
        public Builder description(String description) { dto.description = description; return this; }
        public Builder accessLevel(String accessLevel) { dto.accessLevel = accessLevel; return this; }
        public Builder relatedCaseId(String relatedCaseId) { dto.relatedCaseId = relatedCaseId; return this; }
        public LegalSourceUploadDto build() { return dto; }
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getTanzliiUrl() { return tanzliiUrl; }
    public void setTanzliiUrl(String tanzliiUrl) { this.tanzliiUrl = tanzliiUrl; }

    public String getCourt() { return court; }
    public void setCourt(String court) { this.court = court; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getDecisionDate() { return decisionDate; }
    public void setDecisionDate(String decisionDate) { this.decisionDate = decisionDate; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAccessLevel() { return accessLevel; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }

    public String getRelatedCaseId() { return relatedCaseId; }
    public void setRelatedCaseId(String relatedCaseId) { this.relatedCaseId = relatedCaseId; }
}
