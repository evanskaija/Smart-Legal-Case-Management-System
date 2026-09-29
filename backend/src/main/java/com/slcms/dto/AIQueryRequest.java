package com.slcms.dto;

import java.util.List;

public class AIQueryRequest {

    private String query;
    private String scope; // 'all' | 'tanzlii' | 'legislation' | 'case_docs'
    private String selectedCaseId;
    private List<String> targetDocumentIds;
    private String userRole;
    private String userName;

    public AIQueryRequest() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final AIQueryRequest req = new AIQueryRequest();
        public Builder query(String query) { req.query = query; return this; }
        public Builder scope(String scope) { req.scope = scope; return this; }
        public Builder selectedCaseId(String selectedCaseId) { req.selectedCaseId = selectedCaseId; return this; }
        public Builder targetDocumentIds(List<String> ids) { req.targetDocumentIds = ids; return this; }
        public Builder userRole(String role) { req.userRole = role; return this; }
        public Builder userName(String name) { req.userName = name; return this; }
        public AIQueryRequest build() { return req; }
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getSelectedCaseId() { return selectedCaseId; }
    public void setSelectedCaseId(String selectedCaseId) { this.selectedCaseId = selectedCaseId; }

    public List<String> getTargetDocumentIds() { return targetDocumentIds; }
    public void setTargetDocumentIds(List<String> targetDocumentIds) { this.targetDocumentIds = targetDocumentIds; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
