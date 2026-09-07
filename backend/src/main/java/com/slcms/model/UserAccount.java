package com.slcms.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing an authenticated or provisioned user in SLCMS.
 */
public class UserAccount {
    private String id;
    private String staffId;
    private String employeeId;
    private String name;
    private String email;
    private String phone;
    private String passwordPlain;
    private String passwordHash;
    private UserRole role;
    private String roleTitle;
    private UserStatus status; // Legacy compatibility
    private AccountStatus accountStatus; // PENDING_VERIFICATION, PENDING_APPROVAL, ACTIVE, FIRST_LOGIN_RESET, LOCKED, SUSPENDED, DEACTIVATED
    private String department;
    private String barNumber;
    private String advocateNumber;
    private String practisingCertNo;
    private String nationalIdRef;
    private String identityVerificationStatus; // VERIFIED, PENDING_REVIEW, REJECTED
    private String invitationId;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private String avatarImg;
    private boolean mustChangePassword;
    private int failedAttempts;
    private Long lockedUntil;
    private String lastLogin;
    private List<String> assignedCaseIds = new ArrayList<>();

    public UserAccount() {}

    public UserAccount(String id, String staffId, String name, String email, String passwordPlain, 
                       UserRole role, String roleTitle, AccountStatus accountStatus, String department, 
                       String advocateNumber, boolean mustChangePassword, List<String> assignedCaseIds) {
        this.id = id;
        this.staffId = staffId;
        this.employeeId = staffId;
        this.name = name;
        this.email = email;
        this.passwordPlain = passwordPlain;
        this.passwordHash = "argon2:$2b$12$" + id.hashCode();
        this.role = role;
        this.roleTitle = roleTitle;
        this.accountStatus = accountStatus;
        this.status = (accountStatus == AccountStatus.ACTIVE) ? UserStatus.ACTIVE :
                      (accountStatus == AccountStatus.LOCKED) ? UserStatus.LOCKED :
                      (accountStatus == AccountStatus.DEACTIVATED) ? UserStatus.DEACTIVATED :
                      (accountStatus == AccountStatus.FIRST_LOGIN_RESET) ? UserStatus.FIRST_LOGIN_PENDING : UserStatus.ACTIVE;
        this.department = department;
        this.advocateNumber = advocateNumber;
        this.barNumber = advocateNumber;
        this.mustChangePassword = mustChangePassword;
        this.failedAttempts = 0;
        this.lockedUntil = null;
        this.lastLogin = "Never";
        this.identityVerificationStatus = "VERIFIED";
        this.createdAt = LocalDateTime.now();
        if (assignedCaseIds != null) {
            this.assignedCaseIds = new ArrayList<>(assignedCaseIds);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStaffId() { return staffId != null ? staffId : employeeId; }
    public void setStaffId(String staffId) { this.staffId = staffId; this.employeeId = staffId; }

    public String getEmployeeId() { return employeeId != null ? employeeId : staffId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; this.staffId = employeeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPasswordPlain() { return passwordPlain; }
    public void setPasswordPlain(String passwordPlain) { this.passwordPlain = passwordPlain; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getRoleTitle() { return roleTitle; }
    public void setRoleTitle(String roleTitle) { this.roleTitle = roleTitle; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public AccountStatus getAccountStatus() { return accountStatus; }
    public void setAccountStatus(AccountStatus accountStatus) { this.accountStatus = accountStatus; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getBarNumber() { return barNumber; }
    public void setBarNumber(String barNumber) { this.barNumber = barNumber; }

    public String getAdvocateNumber() { return advocateNumber; }
    public void setAdvocateNumber(String advocateNumber) { this.advocateNumber = advocateNumber; }

    public String getPractisingCertNo() { return practisingCertNo; }
    public void setPractisingCertNo(String practisingCertNo) { this.practisingCertNo = practisingCertNo; }

    public String getNationalIdRef() { return nationalIdRef; }
    public void setNationalIdRef(String nationalIdRef) { this.nationalIdRef = nationalIdRef; }

    public String getIdentityVerificationStatus() { return identityVerificationStatus; }
    public void setIdentityVerificationStatus(String identityVerificationStatus) { this.identityVerificationStatus = identityVerificationStatus; }

    public String getInvitationId() { return invitationId; }
    public void setInvitationId(String invitationId) { this.invitationId = invitationId; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getAvatarImg() { return avatarImg; }
    public void setAvatarImg(String avatarImg) { this.avatarImg = avatarImg; }

    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }

    public Long getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(Long lockedUntil) { this.lockedUntil = lockedUntil; }

    public String getLastLogin() { return lastLogin; }
    public void setLastLogin(String lastLogin) { this.lastLogin = lastLogin; }

    public List<String> getAssignedCaseIds() { return assignedCaseIds; }
    public void setAssignedCaseIds(List<String> assignedCaseIds) { this.assignedCaseIds = assignedCaseIds; }
}
