package com.slcms.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter for UserRole ensuring robust case-insensitive and title-case
 * mapping to and from the users table in MySQL.
 */
@Converter(autoApply = true)
public class UserRoleConverter implements AttributeConverter<UserRole, String> {

    @Override
    public String convertToDatabaseColumn(UserRole attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public UserRole convertToEntityAttribute(String dbData) {
        return UserRole.fromString(dbData);
    }
}
