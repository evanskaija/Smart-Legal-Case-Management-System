package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing an authentic security event in SLCMS.
 * Stored separately in database for security auditing and access tracking.
 */
@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    @Column(name = "user_name", length = 150)
    private String userName;

    @Convert(converter = EventTypeConverter.class)
    @Column(name = "event_type", length = 100, nullable = false)
    private EventType eventType;

    @Column(name = "result", length = 200)
    private String result;

    @Column(name = "event_time")
    private LocalDateTime eventTime;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "resolved")
    private boolean resolved;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by", length = 50)
    private String resolvedBy;

    public SecurityEvent() {
        this.eventTime = LocalDateTime.now();
        this.resolved = false;
    }

    public SecurityEvent(String id, String userId, EventType eventType, String description, String ipAddress) {
        this.id = id;
        this.userId = userId;
        this.eventType = eventType;
        this.description = description;
        this.ipAddress = ipAddress;
        this.eventTime = LocalDateTime.now();
        this.resolved = false;
    }

    public SecurityEvent(String id, String userId, String userName, EventType eventType, String result, String description, String ipAddress) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.eventType = eventType;
        this.result = result;
        this.description = description;
        this.ipAddress = ipAddress;
        this.eventTime = LocalDateTime.now();
        this.resolved = false;
    }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public LocalDateTime getEventTime() { return eventTime; }
    public void setEventTime(LocalDateTime eventTime) { this.eventTime = eventTime; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }
}
