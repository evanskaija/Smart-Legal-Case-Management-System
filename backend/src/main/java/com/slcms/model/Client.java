package com.slcms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing a client in SLCMS.
 * Mapped to the persistent 'clients' table in XAMPP MySQL (slcms_db).
 */
@Entity
@Table(name = "clients")
public class Client {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "client_number", length = 50, unique = true)
    private String clientNumber;

    @Column(name = "name", length = 150, nullable = false)
    private String name;

    @Column(name = "client_type", length = 50)
    private String clientType; // INDIVIDUAL, CORPORATE, INSTITUTIONAL

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "national_id_ref", length = 50)
    private String nationalIdRef;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "verification_status", length = 50)
    private String verificationStatus = "VERIFIED"; // PENDING_VERIFICATION, VERIFIED, MANUALLY_VERIFIED

    @Column(name = "verification_code", length = 10)
    private String verificationCode;

    @Column(name = "code_expires_at")
    private LocalDateTime codeExpiresAt;

    @Column(name = "status", length = 50)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, ARCHIVED

    @Column(name = "contact_person", length = 150)
    private String contactPerson;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Client() {}

    public Client(String id, String clientNumber, String name, String clientType, String email, String phone, String nationalIdRef, String address) {
        this.id = id;
        this.clientNumber = clientNumber;
        this.name = name;
        this.clientType = clientType;
        this.email = email;
        this.phone = phone;
        this.nationalIdRef = nationalIdRef;
        this.address = address;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClientNumber() { return clientNumber; }
    public void setClientNumber(String clientNumber) { this.clientNumber = clientNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getClientType() { return clientType; }
    public void setClientType(String clientType) { this.clientType = clientType; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getNationalIdRef() { return nationalIdRef; }
    public void setNationalIdRef(String nationalIdRef) { this.nationalIdRef = nationalIdRef; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }

    public LocalDateTime getCodeExpiresAt() { return codeExpiresAt; }
    public void setCodeExpiresAt(LocalDateTime codeExpiresAt) { this.codeExpiresAt = codeExpiresAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
