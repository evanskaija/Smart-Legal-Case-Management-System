package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * System Setting entity representing a persistent configuration parameter.
 * Mapped to the persistent 'system_settings' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", length = 100, unique = true, nullable = false)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "setting_type", length = 30, nullable = false)
    private String settingType; // TEXT, NUMBER, BOOLEAN, EMAIL, PHONE, ENUM

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SystemSetting() {
        this.updatedAt = LocalDateTime.now();
    }

    public SystemSetting(String settingKey, String settingValue, String settingType, Long updatedBy) {
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.settingType = settingType;
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    public SystemSetting(Long id, String settingKey, String settingValue, String settingType, Long updatedBy, LocalDateTime updatedAt) {
        this.id = id;
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.settingType = settingType;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSettingKey() {
        return settingKey;
    }

    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }

    public String getSettingValue() {
        return settingValue;
    }

    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }

    public String getSettingType() {
        return settingType;
    }

    public void setSettingType(String settingType) {
        this.settingType = settingType;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
