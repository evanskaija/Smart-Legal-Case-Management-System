package com.slcms.dto;

import com.slcms.model.LegalPassage;
import java.util.List;

public class AIQueryResponse {

    private String directAnswer;
    private String legalExplanation;
    private List<String> limitations;
    private List<LegalPassage> retrievedPassages;
    private List<SourceReferenceDto> citedSources;
    private boolean requiresProfessionalReview;
    private String queryIntent;

    public AIQueryResponse() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final AIQueryResponse res = new AIQueryResponse();
        public Builder directAnswer(String directAnswer) { res.directAnswer = directAnswer; return this; }
        public Builder legalExplanation(String legalExplanation) { res.legalExplanation = legalExplanation; return this; }
        public Builder limitations(List<String> limitations) { res.limitations = limitations; return this; }
        public Builder retrievedPassages(List<LegalPassage> retrievedPassages) { res.retrievedPassages = retrievedPassages; return this; }
        public Builder citedSources(List<SourceReferenceDto> citedSources) { res.citedSources = citedSources; return this; }
        public Builder requiresProfessionalReview(boolean requiresProfessionalReview) { res.requiresProfessionalReview = requiresProfessionalReview; return this; }
        public Builder queryIntent(String queryIntent) { res.queryIntent = queryIntent; return this; }
        public AIQueryResponse build() { return res; }
    }

    public String getDirectAnswer() { return directAnswer; }
    public void setDirectAnswer(String directAnswer) { this.directAnswer = directAnswer; }

    public String getLegalExplanation() { return legalExplanation; }
    public void setLegalExplanation(String legalExplanation) { this.legalExplanation = legalExplanation; }

    public List<String> getLimitations() { return limitations; }
    public void setLimitations(List<String> limitations) { this.limitations = limitations; }

    public List<LegalPassage> getRetrievedPassages() { return retrievedPassages; }
    public void setRetrievedPassages(List<LegalPassage> retrievedPassages) { this.retrievedPassages = retrievedPassages; }

    public List<SourceReferenceDto> getCitedSources() { return citedSources; }
    public void setCitedSources(List<SourceReferenceDto> citedSources) { this.citedSources = citedSources; }

    public boolean isRequiresProfessionalReview() { return requiresProfessionalReview; }
    public void setRequiresProfessionalReview(boolean requiresProfessionalReview) { this.requiresProfessionalReview = requiresProfessionalReview; }

    public String getQueryIntent() { return queryIntent; }
    public void setQueryIntent(String queryIntent) { this.queryIntent = queryIntent; }

    public static class SourceReferenceDto {
        private String sourceId;
        private String title;
        private String court;
        private String citation;
        private String decisionDate;
        private String tanzliiUrl;
        private double relevanceScore;
        private String extractedPassageSnippet;

        public SourceReferenceDto() {}

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final SourceReferenceDto dto = new SourceReferenceDto();
            public Builder sourceId(String sourceId) { dto.sourceId = sourceId; return this; }
            public Builder title(String title) { dto.title = title; return this; }
            public Builder court(String court) { dto.court = court; return this; }
            public Builder citation(String citation) { dto.citation = citation; return this; }
            public Builder decisionDate(String decisionDate) { dto.decisionDate = decisionDate; return this; }
            public Builder tanzliiUrl(String tanzliiUrl) { dto.tanzliiUrl = tanzliiUrl; return this; }
            public Builder relevanceScore(double relevanceScore) { dto.relevanceScore = relevanceScore; return this; }
            public Builder extractedPassageSnippet(String snippet) { dto.extractedPassageSnippet = snippet; return this; }
            public SourceReferenceDto build() { return dto; }
        }

        public String getSourceId() { return sourceId; }
        public void setSourceId(String sourceId) { this.sourceId = sourceId; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCourt() { return court; }
        public void setCourt(String court) { this.court = court; }

        public String getCitation() { return citation; }
        public void setCitation(String citation) { this.citation = citation; }

        public String getDecisionDate() { return decisionDate; }
        public void setDecisionDate(String decisionDate) { this.decisionDate = decisionDate; }

        public String getTanzliiUrl() { return tanzliiUrl; }
        public void setTanzliiUrl(String tanzliiUrl) { this.tanzliiUrl = tanzliiUrl; }

        public double getRelevanceScore() { return relevanceScore; }
        public void setRelevanceScore(double relevanceScore) { this.relevanceScore = relevanceScore; }

        public String getExtractedPassageSnippet() { return extractedPassageSnippet; }
        public void setExtractedPassageSnippet(String extractedPassageSnippet) { this.extractedPassageSnippet = extractedPassageSnippet; }
    }
}
