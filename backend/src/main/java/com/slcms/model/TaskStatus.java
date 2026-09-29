package com.slcms.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TaskStatus {
    TO_DO,
    IN_PROGRESS,
    UNDER_REVIEW,
    COMPLETED,
    CANCELLED;

    @JsonCreator
    public static TaskStatus fromString(String val) {
        if (val == null || val.trim().isEmpty()) return TO_DO;
        String clean = val.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        if (clean.equals("TODO")) return TO_DO;
        for (TaskStatus s : values()) {
            if (s.name().equalsIgnoreCase(clean)) {
                return s;
            }
        }
        return TO_DO;
    }
}
