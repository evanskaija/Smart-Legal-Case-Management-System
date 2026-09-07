package com.slcms.model;

/**
 * SLCMS System Roles defining distinct legal and administrative privilege tiers.
 */
public enum UserRole {
    MANAGING_PARTNER("Managing Partner", "View/manage all firm cases, approve final pleadings & reports, assign staff, view financial analytics."),
    SENIOR_COUNSEL("Senior Counsel", "Lead assigned cases, supervise teams, approve legal drafts, use AI research, manage hearings and evidence."),
    ASSOCIATE_LAWYER("Associate Lawyer", "Work on assigned cases, draft pleadings/reports, upload evidence, submit drafts for Senior Counsel approval."),
    JUNIOR_LAWYER("Junior Lawyer", "Conduct research, read precedents, prepare draft summaries, update assigned tasks, submit drafts for review."),
    LEGAL_CLERK("Legal Clerk", "Register case info, upload/label documents, record court dates, maintain client contacts, prepare administrative forms."),
    SYSTEM_ADMINISTRATOR("System Administrator", "Create/manage accounts, configure security rules, monitor audit logs & system health, restore backups.");

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
        for (UserRole r : values()) {
            if (r.name().equalsIgnoreCase(clean) || r.displayName.equalsIgnoreCase(roleStr.trim())) {
                return r;
            }
        }
        return null;
    }
}
