package com.slcms.model;

/**
 * SLCMS System Roles defining distinct legal and administrative privilege tiers.
 */
public enum UserRole {
    ADMINISTRATOR("Administrator", "Create/manage accounts, configure security rules, monitor audit logs & system health, restore backups."),
    SENIOR_LAWYER("Senior Lawyer", "Lead assigned cases, supervise teams, approve legal drafts, use AI research, manage hearings and evidence."),
    LAWYER("Lawyer", "Work on assigned cases, draft pleadings/reports, upload evidence, submit drafts for Senior Lawyer review."),
    LEGAL_CLERK("Legal Clerk", "Register case info, upload/label documents, record court dates, maintain client contacts, prepare administrative forms."),
    LEGAL_OFFICER("Legal Officer", "Manage corporate legal compliance, contract reviews, regulatory filings, client records, and legal advisory."),
    CLIENT("Client", "Client Portal Access to submit legal requests, view active cases, and exchange documents."),
    SYSTEM_ADMINISTRATOR("Administrator", "System Administrator"),
    MANAGING_PARTNER("Senior Lawyer", "Managing Partner / Senior Counsel"),
    SENIOR_COUNSEL("Senior Lawyer", "Senior Counsel"),
    ASSOCIATE_LAWYER("Lawyer", "Associate Lawyer"),
    JUNIOR_LAWYER("Lawyer", "Junior Lawyer");

    private final String displayName;
    private final String description;

    UserRole(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public static UserRole fromString(String roleStr) {
        if (roleStr == null) return null;
        String clean = roleStr.trim().replace(" ", "_").toUpperCase();
        if (clean.equals("SYSTEM_ADMINISTRATOR") || clean.equals("ADMIN")) return ADMINISTRATOR;
        if (clean.equals("SENIOR_COUNSEL") || clean.equals("MANAGING_PARTNER")) return SENIOR_LAWYER;
        if (clean.equals("ASSOCIATE_LAWYER") || clean.equals("JUNIOR_LAWYER")) return LAWYER;
        for (UserRole r : values()) {
            if (r.name().equalsIgnoreCase(clean) || r.displayName.equalsIgnoreCase(roleStr.trim())) {
                return r;
            }
        }
        return null;
    }
}
