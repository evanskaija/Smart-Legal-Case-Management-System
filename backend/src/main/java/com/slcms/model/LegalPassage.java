package com.slcms.model;

import java.time.LocalDateTime;

/**
 * Represents an indexed, searchable legal passage extracted from a legal source document.
 */
public class LegalPassage {

    private String id;
    private String documentId;
    private int passageIndex;
    private String text;
    private int pageNumber;
    private int characterStart;
    private int characterEnd;
    private int wordCount;
    private double relevanceScore;
    
    // Legal metadata
    private boolean isRatioDecidendi;
    private String statutorySectionRef;
    private String courtHierarchy;
    private LocalDateTime indexedAt;

    public LegalPassage() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final LegalPassage p = new LegalPassage();
        public Builder id(String id) { p.id = id; return this; }
        public Builder documentId(String documentId) { p.documentId = documentId; return this; }
        public Builder passageIndex(int index) { p.passageIndex = index; return this; }
        public Builder text(String text) { p.text = text; return this; }
        public Builder pageNumber(int pageNumber) { p.pageNumber = pageNumber; return this; }
        public Builder characterStart(int start) { p.characterStart = start; return this; }
        public Builder characterEnd(int end) { p.characterEnd = end; return this; }
        public Builder wordCount(int wordCount) { p.wordCount = wordCount; return this; }
        public Builder relevanceScore(double score) { p.relevanceScore = score; return this; }
        public Builder isRatioDecidendi(boolean ratio) { p.isRatioDecidendi = ratio; return this; }
        public Builder statutorySectionRef(String ref) { p.statutorySectionRef = ref; return this; }
        public Builder courtHierarchy(String hierarchy) { p.courtHierarchy = hierarchy; return this; }
        public Builder indexedAt(LocalDateTime indexedAt) { p.indexedAt = indexedAt; return this; }
        public LegalPassage build() { return p; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }

    public int getPassageIndex() { return passageIndex; }
    public void setPassageIndex(int passageIndex) { this.passageIndex = passageIndex; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public int getCharacterStart() { return characterStart; }
    public void setCharacterStart(int characterStart) { this.characterStart = characterStart; }

    public int getCharacterEnd() { return characterEnd; }
    public void setCharacterEnd(int characterEnd) { this.characterEnd = characterEnd; }

    public int getWordCount() { return wordCount; }
    public void setWordCount(int wordCount) { this.wordCount = wordCount; }

    public double getRelevanceScore() { return relevanceScore; }
    public void setRelevanceScore(double relevanceScore) { this.relevanceScore = relevanceScore; }

    public boolean isRatioDecidendi() { return isRatioDecidendi; }
    public void setRatioDecidendi(boolean isRatioDecidendi) { this.isRatioDecidendi = isRatioDecidendi; }

    public String getStatutorySectionRef() { return statutorySectionRef; }
    public void setStatutorySectionRef(String statutorySectionRef) { this.statutorySectionRef = statutorySectionRef; }

    public String getCourtHierarchy() { return courtHierarchy; }
    public void setCourtHierarchy(String courtHierarchy) { this.courtHierarchy = courtHierarchy; }

    public LocalDateTime getIndexedAt() { return indexedAt; }
    public void setIndexedAt(LocalDateTime indexedAt) { this.indexedAt = indexedAt; }
}
