package com.slcms.controller;

import com.slcms.model.*;
import com.slcms.repository.*;
import com.slcms.service.JwtAuthService;
import com.slcms.service.RBACSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller implementing the official Case Chat rules & endpoints:
 * GET  /api/cases/{caseId}/messages
 * POST /api/cases/{caseId}/messages
 * POST /api/cases/{caseId}/messages/{messageId}/read
 */
@RestController
@RequestMapping("/api/cases")
@CrossOrigin(originPatterns = "*")
public class CaseChatController {

    private static final Logger log = LoggerFactory.getLogger(CaseChatController.class);

    private final JwtAuthService jwtAuthService;
    private final CaseRecordRepository caseRepository;
    private final CaseConversationRepository conversationRepository;
    private final CaseMessageRepository messageRepository;
    private final ClientRepository clientRepository;
    private final RBACSecurityService rbacSecurityService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public CaseChatController(JwtAuthService jwtAuthService,
                              CaseRecordRepository caseRepository,
                              CaseConversationRepository conversationRepository,
                              CaseMessageRepository messageRepository,
                              ClientRepository clientRepository,
                              RBACSecurityService rbacSecurityService,
                              @Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.jwtAuthService = jwtAuthService;
        this.caseRepository = caseRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.clientRepository = clientRepository;
        this.rbacSecurityService = rbacSecurityService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * GET /api/cases/{caseId}/conversation
     * Returns conversation metadata and permission status.
     */
    @GetMapping("/{caseId}/conversation")
    public ResponseEntity<?> getConversationMetadata(
            @PathVariable("caseId") String caseId,
            HttpServletRequest request
    ) {
        UserAccount user = jwtAuthService.requireAuthenticatedUser(request);
        CaseRecord caseRecord = resolveCase(caseId);
        validateChatOpenEligibility(caseRecord);

        CaseConversation conversation = conversationRepository.findByCaseId(caseRecord.getId())
                .orElseGet(() -> {
                    String clientId = caseRecord.getClientId() != null ? caseRecord.getClientId() : "cli-001";
                    String lawyerId = caseRecord.getLeadCounselId() != null ? caseRecord.getLeadCounselId() : "usr-002";
                    CaseConversation c = new CaseConversation(caseRecord.getId(), clientId, lawyerId);
                    return conversationRepository.save(c);
                });

        enforceConversationReadAccess(user, caseRecord, conversation);

        return ResponseEntity.ok(Map.of(
                "conversation", conversation,
                "case", caseRecord,
                "canPost", canUserPostMessages(user, caseRecord, conversation),
                "isOfficerOversight", isLegalOfficerOversight(user)
        ));
    }

    /**
     * GET /api/cases/{caseId}/messages
     * Returns list of messages for the case conversation.
     * Enforces case chat rules:
     * - Chat opens only after payment is verified and a Lawyer is assigned.
     * - Only assigned Lawyer, related Client, or Legal Officer (read-only oversight) can access.
     */
    @GetMapping("/{caseId}/messages")
    public ResponseEntity<?> getCaseMessages(
            @PathVariable("caseId") String caseId,
            HttpServletRequest request
    ) {
        UserAccount user = jwtAuthService.requireAuthenticatedUser(request);
        CaseRecord caseRecord = resolveCase(caseId);
        validateChatOpenEligibility(caseRecord);

        CaseConversation conversation = conversationRepository.findByCaseId(caseRecord.getId())
                .orElseGet(() -> {
                    String clientId = caseRecord.getClientId() != null ? caseRecord.getClientId() : "cli-001";
                    String lawyerId = caseRecord.getLeadCounselId() != null ? caseRecord.getLeadCounselId() : "usr-002";
                    CaseConversation c = new CaseConversation(caseRecord.getId(), clientId, lawyerId);
                    return conversationRepository.save(c);
                });

        enforceConversationReadAccess(user, caseRecord, conversation);

        List<CaseMessage> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId());

        // Automatically mark incoming messages as read for this user if not sent by them
        for (CaseMessage m : messages) {
            if (!user.getId().equals(m.getSenderId()) && m.getReadAt() == null && !isLegalOfficerOversight(user)) {
                m.setReadAt(LocalDateTime.now());
                messageRepository.save(m);
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "caseId", caseRecord.getId(),
                "conversationId", conversation.getId(),
                "messages", messages,
                "readOnlyOversight", isLegalOfficerOversight(user)
        ));
    }

    /**
     * POST /api/cases/{caseId}/messages
     * Sends a message in the secure chat.
     * - Only assigned Lawyer and related Client can post.
     * - Legal Officer has read-only oversight and cannot silently impersonate.
     * - Stores in MySQL case_messages.
     * - Broadcasts over STOMP WebSocket.
     */
    @PostMapping(value = "/{caseId}/messages", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> sendCaseMessage(
            @PathVariable("caseId") String caseId,
            HttpServletRequest request,
            @RequestParam(value = "messageBody", required = false) String paramBody,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "attachmentPath", required = false) String paramAttachmentPath,
            @RequestParam(value = "attachmentName", required = false) String paramAttachmentName,
            @RequestBody(required = false) Map<String, Object> jsonBody
    ) {
        UserAccount user = jwtAuthService.requireAuthenticatedUser(request);
        CaseRecord caseRecord = resolveCase(caseId);
        validateChatOpenEligibility(caseRecord);

        CaseConversation conversation = conversationRepository.findByCaseId(caseRecord.getId())
                .orElseGet(() -> {
                    String clientId = caseRecord.getClientId() != null ? caseRecord.getClientId() : "cli-001";
                    String lawyerId = caseRecord.getLeadCounselId() != null ? caseRecord.getLeadCounselId() : "usr-002";
                    CaseConversation c = new CaseConversation(caseRecord.getId(), clientId, lawyerId);
                    return conversationRepository.save(c);
                });

        // RULE: Only the assigned Lawyer and related Client can use it.
        // The Legal Officer may view for oversight but must NOT silently impersonate.
        if (isLegalOfficerOversight(user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Legal Officers have read-only oversight and cannot post messages or impersonate parties in client-lawyer privileged chat."
            ));
        }

        if (!canUserPostMessages(user, caseRecord, conversation)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Access denied: Only the assigned Lawyer and the related Client can send messages in this case chat."
            ));
        }

        String messageBody = paramBody;
        String attachmentPath = paramAttachmentPath;
        String attachmentName = paramAttachmentName;

        if (jsonBody != null) {
            if (messageBody == null && jsonBody.get("messageBody") != null) messageBody = jsonBody.get("messageBody").toString();
            if (messageBody == null && jsonBody.get("content") != null) messageBody = jsonBody.get("content").toString();
            if (attachmentPath == null && jsonBody.get("attachmentPath") != null) attachmentPath = jsonBody.get("attachmentPath").toString();
            if (attachmentName == null && jsonBody.get("attachmentName") != null) attachmentName = jsonBody.get("attachmentName").toString();
        }

        // Process file upload if provided (PDF, DOCX, JPG, PNG <= 25MB)
        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 25L * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Attachment exceeds the maximum allowed size of 25 MB."));
            }
            Path chatUploadDir = Paths.get("data", "chat_attachments");
            try {
                if (!Files.exists(chatUploadDir)) Files.createDirectories(chatUploadDir);
                String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment";
                String ext = origName.contains(".") ? origName.substring(origName.lastIndexOf('.')).toLowerCase() : "";
                if (!Arrays.asList(".pdf", ".docx", ".jpg", ".jpeg", ".png").contains(ext)) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Allowed documents are PDF, DOCX, JPG, and PNG only."));
                }
                String safeName = "chat-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6) + ext;
                Path dest = chatUploadDir.resolve(safeName);
                Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
                attachmentPath = "data/chat_attachments/" + safeName;
                attachmentName = origName;
            } catch (IOException e) {
                log.error("Failed to store chat attachment: {}", e.getMessage());
            }
        }

        if (messageBody != null && messageBody.length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Message text must not exceed 2,000 characters."));
        }

        if ((messageBody == null || messageBody.trim().isEmpty()) && (attachmentPath == null || attachmentPath.isEmpty())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Message text or document attachment is required."));
        }

        String senderRoleStr = user.getRole() == UserRole.CLIENT ? "Client" : "Lawyer";

        // Save in MySQL case_messages table
        CaseMessage message = new CaseMessage();
        message.setConversationId(conversation.getId());
        message.setSenderId(user.getId());
        message.setSenderName(user.getName());
        message.setSenderRole(senderRoleStr);
        message.setMessageBody(messageBody != null ? messageBody.trim() : (attachmentName != null ? "Shared document: " + attachmentName : "Attachment"));
        message.setAttachmentPath(attachmentPath);
        message.setAttachmentName(attachmentName);
        message.setSentAt(LocalDateTime.now());
        message.setDeliveredAt(LocalDateTime.now()); // Immediate delivery to MySQL
        CaseMessage saved = messageRepository.save(message);

        // Broadcast over WebSocket STOMP topic (/topic/case/{caseId})
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/case/" + caseRecord.getId(), saved);
            } catch (Exception e) {
                log.warn("WebSocket STOMP broadcast exception: {}", e.getMessage());
            }
        }

        // Audit Trail
        rbacSecurityService.recordAudit(user.getEmail(), senderRoleStr, "Sent Secure Case Message", "Privileged Case Chat",
                "Case: " + caseRecord.getCaseNumber() + ", Message ID: " + saved.getId() + (attachmentPath != null ? " with attachment " + attachmentName : ""));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", saved,
                "caseId", caseRecord.getId()
        ));
    }

    /**
     * POST /api/cases/{caseId}/messages/{messageId}/read
     * Marks a specific message as read.
     */
    @PostMapping("/{caseId}/messages/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(
            @PathVariable("caseId") String caseId,
            @PathVariable("messageId") Long messageId,
            HttpServletRequest request
    ) {
        UserAccount user = jwtAuthService.requireAuthenticatedUser(request);
        Optional<CaseMessage> msgOpt = messageRepository.findById(messageId);
        if (msgOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Message not found"));
        }

        CaseMessage msg = msgOpt.get();
        if (msg.getReadAt() == null) {
            msg.setReadAt(LocalDateTime.now());
            messageRepository.save(msg);

            // Broadcast read receipt over WebSocket
            if (messagingTemplate != null) {
                try {
                    messagingTemplate.convertAndSend("/topic/case/" + caseId + "/read", Map.of(
                            "messageId", messageId,
                            "readAt", msg.getReadAt(),
                            "readBy", user.getId()
                    ));
                } catch (Exception ignored) {}
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "messageId", messageId, "readAt", msg.getReadAt()));
    }

    private CaseRecord resolveCase(String caseId) {
        Optional<CaseRecord> opt = caseRepository.findById(caseId);
        if (opt.isEmpty()) opt = caseRepository.findByCaseNumber(caseId);
        if (opt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found: " + caseId);
        }
        CaseRecord c = opt.get();
        if ("DELETED".equalsIgnoreCase(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Case has been deleted or archived. Chat conversation is closed.");
        }
        return c;
    }

    /**
     * RULE 1: A chat opens only after payment is verified and a Lawyer is assigned.
     */
    private void validateChatOpenEligibility(CaseRecord c) {
        String status = c.getStatus() != null ? c.getStatus().toUpperCase() : "";
        boolean isLawyerAssigned = (c.getLeadCounselId() != null && !c.getLeadCounselId().isBlank()) ||
                                   (c.getAssignedUserIds() != null && !c.getAssignedUserIds().isEmpty());

        // Statuses indicating lawyer is assigned and case is ready: ASSIGNED, ACTIVE, CLOSED
        // If still SUBMITTED, UNDER_REVIEW, INVOICE_SENT, PAYMENT_REVIEW, READY_FOR_ASSIGNMENT without lawyer:
        if ("SUBMITTED".equals(status) || "UNDER_REVIEW".equals(status) || "INVOICE_SENT".equals(status) || "PAYMENT_REVIEW".equals(status)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Secure case chat is locked: Chat opens only after payment is verified and a Lawyer is assigned. Current Case status: " + c.getStatus());
        }

        if ("READY_FOR_ASSIGNMENT".equals(status) && !isLawyerAssigned) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Secure case chat is locked: Payment has been verified, but a Lawyer has not yet been assigned by the Legal Officer.");
        }
    }

    /**
     * Enforce read access to conversation log.
     */
    private void enforceConversationReadAccess(UserAccount user, CaseRecord caseRecord, CaseConversation conversation) {
        if (isLegalOfficerOversight(user)) {
            return; // Legal Officer may view for administrative oversight
        }
        if (user.getRole() == UserRole.ADMINISTRATOR || user.getRole() == UserRole.SYSTEM_ADMINISTRATOR) {
            return;
        }

        // If client: must be related client
        if (user.getRole() == UserRole.CLIENT) {
            boolean isClient = user.getId().equals(conversation.getClientId()) ||
                    (user.getStaffId() != null && user.getStaffId().equalsIgnoreCase(conversation.getClientId())) ||
                    (caseRecord.getClientId() != null && (user.getId().equals(caseRecord.getClientId()) || user.getStaffId().equalsIgnoreCase(caseRecord.getClientId())));
            if (!isClient) {
                // Check clients repository
                Optional<Client> cOpt = clientRepository.findByUserId(user.getId());
                if (cOpt.isPresent() && (cOpt.get().getId().equals(conversation.getClientId()) || cOpt.get().getId().equals(caseRecord.getClientId()))) {
                    isClient = true;
                }
            }
            if (!isClient) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view messages for this case.");
            }
            return;
        }

        // If Lawyer: must be assigned lawyer
        boolean isAssignedLawyer = user.getId().equals(conversation.getLawyerId()) ||
                user.getId().equals(caseRecord.getLeadCounselId()) ||
                (caseRecord.getAssignedUserIds() != null && caseRecord.getAssignedUserIds().contains(user.getId())) ||
                (user.getStaffId() != null && caseRecord.getAssignedUserIds() != null && caseRecord.getAssignedUserIds().contains(user.getStaffId()));

        if (!isAssignedLawyer) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Only the assigned Lawyer can access this case chat.");
        }
    }

    private boolean canUserPostMessages(UserAccount user, CaseRecord caseRecord, CaseConversation conversation) {
        if (user.getRole() == UserRole.CLIENT) {
            return user.getId().equals(conversation.getClientId()) ||
                    (user.getStaffId() != null && user.getStaffId().equalsIgnoreCase(conversation.getClientId())) ||
                    (caseRecord.getClientId() != null && (user.getId().equals(caseRecord.getClientId()) || user.getStaffId().equalsIgnoreCase(caseRecord.getClientId())));
        }
        if (user.getRole() == UserRole.LAWYER || user.getRole() == UserRole.SENIOR_LAWYER || user.getRole() == UserRole.ASSOCIATE_LAWYER || user.getRole() == UserRole.JUNIOR_LAWYER) {
            return user.getId().equals(conversation.getLawyerId()) ||
                    user.getId().equals(caseRecord.getLeadCounselId()) ||
                    (caseRecord.getAssignedUserIds() != null && caseRecord.getAssignedUserIds().contains(user.getId())) ||
                    (user.getStaffId() != null && caseRecord.getAssignedUserIds() != null && caseRecord.getAssignedUserIds().contains(user.getStaffId()));
        }
        return false;
    }

    private boolean isLegalOfficerOversight(UserAccount user) {
        return user.getRole() == UserRole.LEGAL_OFFICER ||
                user.getRole() == UserRole.ADMINISTRATOR ||
                user.getRole() == UserRole.SYSTEM_ADMINISTRATOR;
    }
}
