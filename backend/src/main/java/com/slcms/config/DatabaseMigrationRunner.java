package com.slcms.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slcms.model.*;
import com.slcms.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Automatically validates, migrates, and seeds existing SLCMS records
 * from JSON data stores into XAMPP MariaDB/MySQL (slcms_db) on application startup.
 */
@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final CaseRecordRepository caseRepository;
    private final CaseAssignmentRepository assignmentRepository;
    private final TaskJpaRepository taskRepository;
    private final DeadlineRepository deadlineRepository;
    private final CommunicationRepository communicationRepository;
    private final SecurityEventRepository securityEventRepository;
    private final SecurityAlertRepository securityAlertRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DatabaseMigrationRunner(UserRepository userRepository,
                                   ClientRepository clientRepository,
                                   CaseRecordRepository caseRepository,
                                   CaseAssignmentRepository assignmentRepository,
                                   TaskJpaRepository taskRepository,
                                   DeadlineRepository deadlineRepository,
                                   CommunicationRepository communicationRepository,
                                   SecurityEventRepository securityEventRepository,
                                   SecurityAlertRepository securityAlertRepository,
                                   PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.caseRepository = caseRepository;
        this.assignmentRepository = assignmentRepository;
        this.taskRepository = taskRepository;
        this.deadlineRepository = deadlineRepository;
        this.communicationRepository = communicationRepository;
        this.securityEventRepository = securityEventRepository;
        this.securityAlertRepository = securityAlertRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Checking SLCMS database state in XAMPP MySQL (slcms_db)...");
        migrateUsers();
        migrateClients();
        migrateCases();
        migrateTasks();
        migrateDeadlines();
        migrateCommunications();
        migrateSecurityEvents();
        log.info("SLCMS MySQL migration and seed verification complete.");
    }

    private File resolveDataFile(String relativePath) {
        File f1 = new File(relativePath);
        if (f1.exists()) return f1;
        File f2 = new File("../" + relativePath);
        if (f2.exists()) return f2;
        return f1;
    }

    private void migrateUsers() {
        File file = resolveDataFile("data/users.json");
        if (!file.exists()) return;

        try {
            JsonNode root = objectMapper.readTree(file);
            if (root.isArray()) {
                for (JsonNode uNode : root) {
                    String email = uNode.path("email").asText();
                    if (email == null || email.isBlank() || userRepository.existsByEmailIgnoreCase(email)) {
                        continue;
                    }

                    UserAccount user = new UserAccount();
                    user.setId(uNode.path("id").asText("usr-" + UUID.randomUUID().toString().substring(0, 8)));
                    user.setStaffId(uNode.path("staffId").asText("STF-" + System.currentTimeMillis() % 10000));
                    user.setEmployeeId(uNode.path("employeeId").asText(user.getStaffId()));
                    user.setUsername(uNode.path("username").asText(email.split("@")[0]));
                    user.setName(uNode.path("name").asText("Staff Member"));
                    user.setEmail(email.trim().toLowerCase());
                    user.setPhone(uNode.path("phone").asText("+255700000001"));

                    // Role mapping
                    String roleStr = uNode.path("role").asText("Lawyer");
                    UserRole role = UserRole.fromString(roleStr);
                    user.setRole(role != null ? role : UserRole.LAWYER);
                    user.setRoleTitle(uNode.path("roleTitle").asText(role != null ? role.getDisplayName() : "Lawyer"));

                    // Status
                    String statusStr = uNode.path("accountStatus").asText("ACTIVE");
                    try {
                        user.setAccountStatus(AccountStatus.valueOf(statusStr));
                    } catch (Exception e) {
                        user.setAccountStatus(AccountStatus.ACTIVE);
                    }
                    user.setStatus(UserStatus.ACTIVE);

                    // Password
                    String plain = uNode.path("passwordPlain").asText("SecretLawFirm2026!");
                    user.setPasswordHash(passwordEncoder.encode(plain));
                    user.setDepartment(uNode.path("department").asText("Litigation & Dispute Resolution"));
                    user.setCreatedAt(LocalDateTime.now());
                    user.setFailedAttempts(uNode.path("failedAttempts").asInt(0));

                    userRepository.save(user);
                    log.info("Migrated user into MySQL: {} ({})", user.getEmail(), user.getRole());
                }
            }
        } catch (Exception e) {
            log.warn("Notice during user migration: {}", e.getMessage());
        }

        // Guarantee default admin exists
        if (userRepository.count() == 0) {
            UserAccount admin = new UserAccount();
            admin.setId("usr-001");
            admin.setStaffId("ADM-0001");
            admin.setEmployeeId("ADM-0001");
            admin.setUsername("slcms.admin");
            admin.setName("SLCMS System Administrator");
            admin.setEmail("admin@slcms.local");
            admin.setPhone("+255700000001");
            admin.setRole(UserRole.ADMINISTRATOR);
            admin.setRoleTitle("System Administrator");
            admin.setAccountStatus(AccountStatus.ACTIVE);
            admin.setStatus(UserStatus.ACTIVE);
            admin.setPasswordHash(passwordEncoder.encode("SecretLawFirm2026!"));
            admin.setDepartment("System Governance & Administration");
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
            log.info("Initialized default Administrator in MySQL: admin@slcms.local");
        }
    }

    private void migrateClients() {
        if (clientRepository.count() > 0) return;

        List<Client> clients = Arrays.asList(
            new Client("cli-001", "CLI-TZ-2025-001", "Deogratius Peter Shayo", "INDIVIDUAL", "deogratius.shayo@example.com", "+255754112233", "NIDA-19850101-1001-11", "Dar es Salaam, Kinondoni"),
            new Client("cli-002", "CLI-TZ-2025-002", "Neema Benson Shabani", "INDIVIDUAL", "neema.shabani@example.com", "+255765223344", "NIDA-19900202-2002-22", "Dar es Salaam, Ilala"),
            new Client("cli-003", "CLI-TZ-2025-003", "CRDB Bank PLC", "CORPORATE", "legal@crdbbank.co.tz", "+255754000001", "BRELA-1002341", "Azikiwe Street, Dar es Salaam"),
            new Client("cli-004", "CLI-TZ-2025-004", "Kilombero Sugar Co. Ltd", "CORPORATE", "info@kilomberosugar.co.tz", "+255754000002", "BRELA-1005882", "Morogoro, Tanzania")
        );
        clientRepository.saveAll(clients);
        log.info("Seeded {} clients into MySQL clients table.", clients.size());
    }

    private void migrateCases() {
        if (caseRepository.count() > 0) return;

        CaseRecord c1 = new CaseRecord("CASE-2025-001", "Criminal Appeal No. 30 of 2021",
                "Deogratius Peter Shayo v. Republic", "Criminal Law / Sexual Offence", "CRIMINAL",
                "CLOSED", "Deogratius Peter Shayo", "Court of Appeal of Tanzania", "Adv. Joyce Mercer");
        c1.setRegistry("Dar es Salaam Appellate Registry");
        c1.setLeadCounselId("usr-002");
        c1.setClientId("cli-001");
        c1.setAssignedUserIds(Arrays.asList("usr-001", "usr-002", "usr-003"));
        c1.setSensitive(true);

        CaseRecord c2 = new CaseRecord("CASE-2025-002", "Land Revision No. 31364 of 2024",
                "Neema Benson Shabani v. Ramadhani Juma Mpanda", "Land Law / Limitation", "LAND",
                "CLOSED", "Neema Benson Shabani", "High Court of Tanzania (Land Division)", "Adv. David Croft");
        c2.setRegistry("Dar es Salaam Land Registry");
        c2.setLeadCounselId("usr-003");
        c2.setClientId("cli-002");
        c2.setAssignedUserIds(Arrays.asList("usr-001", "usr-003", "usr-004"));
        c2.setSensitive(false);

        CaseRecord c3 = new CaseRecord("CASE-2025-003", "DC Criminal Revision No. 000006375 of 2025",
                "Peter Thomas Bocco v. Republic", "Criminal Revision / Evidence", "CRIMINAL",
                "ACTIVE", "Peter Thomas Bocco", "Resident Magistrate Court of Ilala", "Adv. Joyce Mercer");
        c3.setRegistry("Ilala District Registry");
        c3.setLeadCounselId("usr-002");
        c3.setAssignedUserIds(Arrays.asList("usr-001", "usr-002", "usr-005"));
        c3.setSensitive(false);

        CaseRecord c4 = new CaseRecord("CASE-2025-004", "Misc. Civil Application No. 7327 of 2025",
                "Rogath K. Katende v. CRDB Bank PLC & Others", "Commercial / Banking / Extension of Time", "COMMERCIAL",
                "ACTIVE", "Rogath K. Katende", "High Court Commercial Division", "Adv. Eleanor Vance");
        c4.setRegistry("Commercial Division Registry");
        c4.setLeadCounselId("usr-002");
        c4.setClientId("cli-003");
        c4.setAssignedUserIds(Arrays.asList("usr-001", "usr-002", "usr-003", "usr-004", "usr-005"));
        c4.setSensitive(false);

        CaseRecord c5 = new CaseRecord("CASE-2025-005", "Tax Appeal No. 18 of 2026",
                "Tanzania Revenue Authority v. Kilombero Sugar Co. Ltd", "Corporate & Tax Advisory", "TAX",
                "UNASSIGNED", "Kilombero Sugar Co. Ltd", "Tax Appeals Tribunal of Tanzania", "Unassigned");
        c5.setRegistry("Dar es Salaam Tax Registry");
        c5.setClientId("cli-004");
        c5.setAssignedUserIds(new ArrayList<>());
        c5.setSensitive(false);

        caseRepository.saveAll(Arrays.asList(c1, c2, c3, c4, c5));

        assignmentRepository.save(new CaseAssignment("asg-001", "CASE-2025-001", "usr-002", "Lead Counsel", "usr-001"));
        assignmentRepository.save(new CaseAssignment("asg-002", "CASE-2025-001", "usr-003", "Co-Counsel", "usr-001"));
        assignmentRepository.save(new CaseAssignment("asg-003", "CASE-2025-002", "usr-003", "Lead Counsel", "usr-001"));
        assignmentRepository.save(new CaseAssignment("asg-004", "CASE-2025-003", "usr-002", "Lead Counsel", "usr-001"));
        assignmentRepository.save(new CaseAssignment("asg-005", "CASE-2025-004", "usr-002", "Lead Counsel", "usr-001"));

        log.info("Seeded 5 cases and assignments into MySQL cases and case_assignments tables.");
    }

    private void migrateTasks() {
        File file = resolveDataFile("data/tasks.json");
        if (!file.exists() || taskRepository.count() > 0) return;

        try {
            JsonNode root = objectMapper.readTree(file);
            if (root.isArray()) {
                for (JsonNode tNode : root) {
                    Task task = new Task();
                    task.setId(tNode.path("id").asText("tsk-" + UUID.randomUUID().toString().substring(0, 8)));
                    task.setTitle(tNode.path("title").asText("Legal Task"));
                    task.setCaseId(tNode.path("caseId").asText());
                    task.setCaseNumber(tNode.path("caseNumber").asText());
                    task.setCaseTitle(tNode.path("caseTitle").asText());
                    task.setAssignedTo(tNode.path("assignedTo").asText());
                    task.setAssignedToName(tNode.path("assignedTo").asText());
                    task.setPriority(tNode.path("priority").asText("MEDIUM"));
                    task.setDueDate(tNode.path("dueDate").asText());
                    task.setDueDateString(tNode.path("dueDate").asText());
                    task.setInstructions(tNode.path("instructions").asText());
                    task.setStatus(TaskStatus.TO_DO);
                    task.setCreatedAt(LocalDateTime.now());
                    taskRepository.save(task);
                }
                log.info("Migrated tasks into MySQL tasks table.");
            }
        } catch (Exception e) {
            log.warn("Notice during task migration: {}", e.getMessage());
        }
    }

    private void migrateDeadlines() {
        File file = resolveDataFile("data/deadlines.json");
        if (!file.exists() || deadlineRepository.count() > 0) return;

        try {
            JsonNode root = objectMapper.readTree(file);
            if (root.isArray()) {
                for (JsonNode dNode : root) {
                    Deadline dl = new Deadline();
                    dl.setId(dNode.path("id").asText("dln-" + UUID.randomUUID().toString().substring(0, 8)));
                    dl.setTitle(dNode.path("title").asText("Hearing / Deadline"));
                    dl.setCaseId(dNode.path("caseId").asText());
                    dl.setCaseNumber(dNode.path("caseNumber").asText());
                    dl.setCaseTitle(dNode.path("caseTitle").asText());
                    dl.setType(dNode.path("type").asText("Hearing"));
                    dl.setDeadlineDateString(dNode.path("deadlineDate").asText());
                    dl.setDeadlineTime(dNode.path("deadlineTime").asText("09:00"));
                    dl.setCourt(dNode.path("court").asText("High Court"));
                    dl.setResponsibleLawyerName(dNode.path("responsibleLawyerName").asText());
                    dl.setSource(dNode.path("source").asText("Court Order"));
                    dl.setStatutoryReference(dNode.path("statutoryReference").asText());
                    dl.setChangeReason(dNode.path("changeReason").asText());
                    dl.setCreatedAt(LocalDateTime.now());
                    deadlineRepository.save(dl);
                }
                log.info("Migrated deadlines into MySQL deadlines table.");
            }
        } catch (Exception e) {
            log.warn("Notice during deadline migration: {}", e.getMessage());
        }
    }

    private void migrateCommunications() {
        File file = resolveDataFile("data/communications.json");
        if (!file.exists() || communicationRepository.count() > 0) return;

        try {
            JsonNode root = objectMapper.readTree(file);
            if (root.isArray()) {
                for (JsonNode cNode : root) {
                    CommunicationRecord rec = new CommunicationRecord();
                    String msgId = cNode.path("messageId").asText("msg-" + UUID.randomUUID().toString().substring(0, 8));
                    rec.setId(msgId);
                    rec.setMessageId(msgId);
                    rec.setCaseId(cNode.path("caseId").asText());
                    rec.setCaseNumber(cNode.path("caseNumber").asText());
                    rec.setCaseTitle(cNode.path("caseTitle").asText());
                    rec.setClientId(cNode.path("clientId").asText());
                    rec.setClientName(cNode.path("clientName").asText());
                    rec.setMessageType(cNode.path("messageType").asText("Hearing Reminder"));
                    rec.setChannel(cNode.path("channel").asText("Email"));
                    rec.setSender(cNode.path("sender").asText("slcmslegal@gmail.com"));
                    rec.setRecipient(cNode.path("recipient").asText());
                    rec.setSubject(cNode.path("subject").asText());
                    rec.setMessageBody(cNode.path("messageBody").asText());
                    rec.setStatus(cNode.path("status").asText("SENT"));
                    rec.setPreparedBy(cNode.path("preparedBy").asText());
                    rec.setSentBy(cNode.path("sentBy").asText());
                    rec.setGmailMessageId(cNode.path("gmailMessageId").asText());
                    rec.setCreatedAt(LocalDateTime.now());
                    communicationRepository.save(rec);
                }
                log.info("Migrated communications into MySQL communications table.");
            }
        } catch (Exception e) {
            log.warn("Notice during communication migration: {}", e.getMessage());
        }
    }

    private void migrateSecurityEvents() {
        File file = resolveDataFile("data/security_events.json");
        if (!file.exists() || securityEventRepository.count() > 0) return;

        try {
            JsonNode root = objectMapper.readTree(file);
            if (root.isArray()) {
                int count = 0;
                for (JsonNode eNode : root) {
                    if (count >= 50) break; // Migrate most recent
                    SecurityEvent ev = new SecurityEvent();
                    ev.setId(eNode.path("id").asText("evt-" + UUID.randomUUID().toString().substring(0, 8)));
                    ev.setUserId(eNode.path("userId").asText("usr-001"));
                    ev.setUserName(eNode.path("userName").asText("System Administrator"));
                    String evType = eNode.path("eventType").asText("USER_MANAGEMENT");
                    try {
                        ev.setEventType(EventType.valueOf(evType));
                    } catch (Exception e) {
                        ev.setEventType(EventType.USER_MANAGEMENT);
                    }
                    ev.setResult(eNode.path("result").asText("Successful"));
                    ev.setDescription(eNode.path("description").asText("System Audit Event"));
                    ev.setIpAddress(eNode.path("ipAddress").asText("127.0.0.1"));
                    ev.setResolved(eNode.path("resolved").asBoolean(false));
                    securityEventRepository.save(ev);
                    count++;
                }
                log.info("Migrated security events into MySQL security_events table.");
            }
        } catch (Exception e) {
            log.warn("Notice during security event migration: {}", e.getMessage());
        }
    }
}
