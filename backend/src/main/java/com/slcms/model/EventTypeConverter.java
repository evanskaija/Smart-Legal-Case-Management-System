package com.slcms.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter for EventType to handle legacy mixed-case / space-separated strings
 * in security_events table gracefully.
 */
@Converter(autoApply = true)
public class EventTypeConverter implements AttributeConverter<EventType, String> {

    @Override
    public String convertToDatabaseColumn(EventType attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public EventType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return EventType.LOGIN_ATTEMPT;
        }
        try {
            return EventType.valueOf(dbData.trim().toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            String clean = dbData.trim().toUpperCase();
            if (clean.contains("FAIL") || clean.contains("INVALID")) return EventType.LOGIN_FAILED;
            if (clean.contains("SUCC") || clean.contains("PASS")) return EventType.LOGIN_SUCCESS;
            if (clean.contains("LOGIN")) return EventType.LOGIN_ATTEMPT;
            if (clean.contains("LOCK")) return EventType.TEMPORARY_LOCK;
            if (clean.contains("UNLOCK")) return EventType.ADMIN_UNLOCK;
            if (clean.contains("RESET") || clean.contains("PASSWORD")) return EventType.PASSWORD_MANAGEMENT;
            if (clean.contains("BACKUP")) return EventType.SYSTEM_BACKUP;
            if (clean.contains("USER") || clean.contains("STAFF") || clean.contains("ROLE")) return EventType.USER_MANAGEMENT;
            return EventType.ACCOUNT_SECURITY;
        }
    }
}
