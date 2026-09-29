package com.slcms.dto;

/**
 * Data Transfer Object for Gmail SMTP Configuration.
 */
public class SmtpConfigDTO {
    private String host;
    private int port;
    private boolean enableSsl;
    private String username;
    private String password;
    private boolean hasPassword;
    private String fromEmail;
    private String fromName;
    private boolean configured;
    private String lastTestedAt;
    private String testStatus;

    public SmtpConfigDTO() {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final SmtpConfigDTO dto = new SmtpConfigDTO();

        public Builder host(String host) { dto.host = host; return this; }
        public Builder port(int port) { dto.port = port; return this; }
        public Builder enableSsl(boolean enableSsl) { dto.enableSsl = enableSsl; return this; }
        public Builder username(String username) { dto.username = username; return this; }
        public Builder password(String password) { dto.password = password; return this; }
        public Builder hasPassword(boolean hasPassword) { dto.hasPassword = hasPassword; return this; }
        public Builder fromEmail(String fromEmail) { dto.fromEmail = fromEmail; return this; }
        public Builder fromName(String fromName) { dto.fromName = fromName; return this; }
        public Builder configured(boolean configured) { dto.configured = configured; return this; }
        public Builder lastTestedAt(String lastTestedAt) { dto.lastTestedAt = lastTestedAt; return this; }
        public Builder testStatus(String testStatus) { dto.testStatus = testStatus; return this; }
        public SmtpConfigDTO build() { return dto; }
    }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public boolean isEnableSsl() { return enableSsl; }
    public void setEnableSsl(boolean enableSsl) { this.enableSsl = enableSsl; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isHasPassword() { return hasPassword; }
    public void setHasPassword(boolean hasPassword) { this.hasPassword = hasPassword; }

    public String getFromEmail() { return fromEmail; }
    public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }

    public String getFromName() { return fromName; }
    public void setFromName(String fromName) { this.fromName = fromName; }

    public boolean isConfigured() { return configured; }
    public void setConfigured(boolean configured) { this.configured = configured; }

    public String getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(String lastTestedAt) { this.lastTestedAt = lastTestedAt; }

    public String getTestStatus() { return testStatus; }
    public void setTestStatus(String testStatus) { this.testStatus = testStatus; }
}
