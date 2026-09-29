package com.slcms.model;

import java.time.LocalDateTime;

public class TaskHistory {
    private String id;
    private String taskId;
    private TaskStatus previousStatus;
    private TaskStatus newStatus;
    private String changedBy;
    private String changedByName;
    private String changeReason;
    private LocalDateTime changedAt;

    public TaskHistory() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final TaskHistory h = new TaskHistory();
        public Builder id(String id) { h.id = id; return this; }
        public Builder taskId(String taskId) { h.taskId = taskId; return this; }
        public Builder previousStatus(TaskStatus status) { h.previousStatus = status; return this; }
        public Builder newStatus(TaskStatus status) { h.newStatus = status; return this; }
        public Builder changedBy(String changedBy) { h.changedBy = changedBy; return this; }
        public Builder changedByName(String changedByName) { h.changedByName = changedByName; return this; }
        public Builder changeReason(String changeReason) { h.changeReason = changeReason; return this; }
        public Builder changedAt(LocalDateTime changedAt) { h.changedAt = changedAt; return this; }
        public TaskHistory build() { return h; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public TaskStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(TaskStatus previousStatus) { this.previousStatus = previousStatus; }

    public TaskStatus getNewStatus() { return newStatus; }
    public void setNewStatus(TaskStatus newStatus) { this.newStatus = newStatus; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public String getChangedByName() { return changedByName; }
    public void setChangedByName(String changedByName) { this.changedByName = changedByName; }

    public String getChangeReason() { return changeReason; }
    public void setChangeReason(String changeReason) { this.changeReason = changeReason; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
