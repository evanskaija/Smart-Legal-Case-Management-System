package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit log entity tracking changes made to system configuration parameters.
 * Mapped to the persistent 'system_setting_audit' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "system_setting_audit")
public class SystemSettingAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id", length = 50)
    private String adminId;

    @Column(name = "admin_name", length = 150)
    private String adminName;

    @Column(name = "setting_key", length = 100, nullable = false)
    private String settingKey;

    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "action_status", length = 30)
    private String actionStatus = "SUCCESS";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public SystemSettingAudit() {
        this.createdAt = LocalDateTime.now();
    }

    public SystemSettingAudit(String adminId, String adminName, String settingKey, String previousValue, String newValue, String ipAddress, String actionStatus) {
        this.adminId = adminId;
        this.adminName = adminName;
        this.settingKey = settingKey;
        this.previousValue = previousValue;
        this.newValue = newValue;
        this.ipAddress = ipAddress;
        this.actionStatus = actionStatus != null ? actionStatus : "SUCCESS";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public String getSettingKey() { return settingKey; }
    public void setSettingKey(String settingKey) { this.settingKey = settingKey; }

    public String getPreviousValue() { return previousValue; }
    public void setPreviousValue(String previousValue) { this.previousValue = previousValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getActionStatus() { return actionStatus; }
    public void setActionStatus(String actionStatus) { this.actionStatus = actionStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
