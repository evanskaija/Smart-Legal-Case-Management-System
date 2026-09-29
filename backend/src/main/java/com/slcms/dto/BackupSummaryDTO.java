package com.slcms.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Summary telemetry and list of actual ZIP backup archives on disk.
 */
public class BackupSummaryDTO {

    private String lastSuccessfulBackup = "None";
    private String lastFailedBackup = "None";
    private String backupSize = "—";
    private String nextScheduledBackup = "Not Scheduled";
    private List<BackupInfoDTO> backups = new ArrayList<>();

    public BackupSummaryDTO() {}

    public BackupSummaryDTO(String lastSuccessfulBackup, String lastFailedBackup, String backupSize, String nextScheduledBackup, List<BackupInfoDTO> backups) {
        this.lastSuccessfulBackup = lastSuccessfulBackup;
        this.lastFailedBackup = lastFailedBackup;
        this.backupSize = backupSize;
        this.nextScheduledBackup = nextScheduledBackup;
        this.backups = backups != null ? backups : new ArrayList<>();
    }

    public String getLastSuccessfulBackup() {
        return lastSuccessfulBackup;
    }

    public void setLastSuccessfulBackup(String lastSuccessfulBackup) {
        this.lastSuccessfulBackup = lastSuccessfulBackup;
    }

    public String getLastFailedBackup() {
        return lastFailedBackup;
    }

    public void setLastFailedBackup(String lastFailedBackup) {
        this.lastFailedBackup = lastFailedBackup;
    }

    public String getBackupSize() {
        return backupSize;
    }

    public void setBackupSize(String backupSize) {
        this.backupSize = backupSize;
    }

    public String getNextScheduledBackup() {
        return nextScheduledBackup;
    }

    public void setNextScheduledBackup(String nextScheduledBackup) {
        this.nextScheduledBackup = nextScheduledBackup;
    }

    public List<BackupInfoDTO> getBackups() {
        return backups;
    }

    public void setBackups(List<BackupInfoDTO> backups) {
        this.backups = backups;
    }
}
