package com.slcms.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slcms.dto.ClientMessageDTO;
import com.slcms.dto.SmtpConfigDTO;
import com.slcms.model.CommunicationRecord;
import com.slcms.repository.CommunicationRepository;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for Client Message Generation, Approval Governance, and Multi-Channel Dispatch.
 * Persists communications to XAMPP MySQL (slcms_db) via CommunicationRepository.
 */
@Service
public class ClientMessageService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final File commsFile = new File("data/communications.json");
    private final File smtpConfigFile = new File("data/smtp_config.json");
    private final GmailApiService gmailApiService;
    private final CommunicationRepository communicationRepository;

    public ClientMessageService(GmailApiService gmailApiService, CommunicationRepository communicationRepository) {
        this.gmailApiService = gmailApiService;
        this.communicationRepository = communicationRepository;
        migrateExistingCommunicationsToDb();
    }

    private synchronized void migrateExistingCommunicationsToDb() {
        try {
            if (commsFile.exists() && communicationRepository.count() == 0) {
                List<ClientMessageDTO> list = objectMapper.readValue(commsFile, new TypeReference<List<ClientMessageDTO>>() {});
                for (ClientMessageDTO dto : list) {
                    CommunicationRecord rec = new CommunicationRecord();
                    rec.setId(dto.getMessageId() != null ? dto.getMessageId() : "comm-" + UUID.randomUUID().toString().substring(0, 8));
                    rec.setMessageId(dto.getMessageId());
                    rec.setCaseId(dto.getCaseId());
                    rec.setCaseNumber(dto.getCaseNumber());
                    rec.setCaseTitle(dto.getCaseTitle());
                    rec.setClientId(dto.getClientId());
                    rec.setClientName(dto.getClientName());
                    rec.setMessageType(dto.getMessageType());
                    rec.setChannel(dto.getChannel() != null ? dto.getChannel() : "Email");
                    rec.setSender(dto.getSender());
                    rec.setRecipient(dto.getRecipient());
                    rec.setSubject(dto.getSubject());
                    rec.setMessageBody(dto.getMessageBody());
                    rec.setLanguage(dto.getLanguage());
                    rec.setStatus(dto.getStatus() != null ? dto.getStatus() : "SENT");
                    rec.setPreparedBy(dto.getPreparedBy());
                    rec.setApprovedBy(dto.getApprovedBy());
                    rec.setSentBy(dto.getSentBy());
                    rec.setGmailMessageId(dto.getGmailMessageId());
                    rec.setProviderReference(dto.getProviderReference());
                    rec.setFailureReason(dto.getFailureReason());
                    rec.setCreatedAt(LocalDateTime.now());
                    communicationRepository.save(rec);
                }
            }
        } catch (Exception ignored) {}
    }

    public synchronized List<ClientMessageDTO> getAllMessages() {
        if (!commsFile.exists()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(commsFile, new TypeReference<List<ClientMessageDTO>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    public synchronized ClientMessageDTO saveMessage(ClientMessageDTO message) {
        List<ClientMessageDTO> list = getAllMessages();
        String now = Instant.now().toString();

        if (message.getMessageId() == null || message.getMessageId().trim().isEmpty()) {
            message.setMessageId("msg-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4));
        }
        if (message.getCreatedAt() == null) {
            message.setCreatedAt(now);
        }
        message.setUpdatedAt(now);

        int existingIndex = -1;
        for (int i = 0; i < list.size(); i++) {
            if (message.getMessageId().equals(list.get(i).getMessageId())) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex >= 0) {
            list.set(existingIndex, message);
        } else {
            list.add(0, message);
        }

        persistMessages(list);

        // Also persist to MySQL
        try {
            CommunicationRecord rec = new CommunicationRecord();
            rec.setId(message.getMessageId());
            rec.setMessageId(message.getMessageId());
            rec.setCaseId(message.getCaseId());
            rec.setCaseNumber(message.getCaseNumber());
            rec.setCaseTitle(message.getCaseTitle());
            rec.setClientId(message.getClientId());
            rec.setClientName(message.getClientName());
            rec.setMessageType(message.getMessageType());
            rec.setChannel(message.getChannel() != null ? message.getChannel() : "Email");
            rec.setSender(message.getSender());
            rec.setRecipient(message.getRecipient());
            rec.setSubject(message.getSubject());
            rec.setMessageBody(message.getMessageBody());
            rec.setLanguage(message.getLanguage());
            rec.setStatus(message.getStatus());
            rec.setPreparedBy(message.getPreparedBy());
            rec.setApprovedBy(message.getApprovedBy());
            rec.setSentBy(message.getSentBy());
            rec.setGmailMessageId(message.getGmailMessageId());
            rec.setProviderReference(message.getProviderReference());
            rec.setFailureReason(message.getFailureReason());
            rec.setCreatedAt(LocalDateTime.now());
            communicationRepository.save(rec);
        } catch (Exception ignored) {}

        return message;
    }

    public synchronized ClientMessageDTO updateMessage(String messageId, Map<String, Object> updates) {
        List<ClientMessageDTO> list = getAllMessages();
        ClientMessageDTO target = null;

        for (ClientMessageDTO msg : list) {
            if (messageId.equals(msg.getMessageId())) {
                target = msg;
                break;
            }
        }

        if (target == null) {
            return null;
        }

        if (updates.containsKey("status")) target.setStatus((String) updates.get("status"));
        if (updates.containsKey("approvedBy")) target.setApprovedBy((String) updates.get("approvedBy"));
        if (updates.containsKey("subject")) target.setSubject((String) updates.get("subject"));
        if (updates.containsKey("messageBody")) target.setMessageBody((String) updates.get("messageBody"));
        if (updates.containsKey("recipient")) target.setRecipient((String) updates.get("recipient"));
        target.setUpdatedAt(Instant.now().toString());

        persistMessages(list);

        try {
            Optional<CommunicationRecord> existingOpt = communicationRepository.findByMessageId(messageId);
            if (existingOpt.isPresent()) {
                CommunicationRecord rec = existingOpt.get();
                if (updates.containsKey("status")) rec.setStatus((String) updates.get("status"));
                if (updates.containsKey("approvedBy")) rec.setApprovedBy((String) updates.get("approvedBy"));
                if (updates.containsKey("subject")) rec.setSubject((String) updates.get("subject"));
                if (updates.containsKey("messageBody")) rec.setMessageBody((String) updates.get("messageBody"));
                if (updates.containsKey("recipient")) rec.setRecipient((String) updates.get("recipient"));
                communicationRepository.save(rec);
            }
        } catch (Exception ignored) {}

        return target;
    }

    public synchronized ClientMessageDTO sendEmailMessage(ClientMessageDTO payload, String senderName) throws Exception {
        if (payload.getRecipient() == null || payload.getRecipient().trim().isEmpty() || !payload.getRecipient().contains("@")) {
            throw new IllegalArgumentException("The client does not have a valid email address.");
        }

        String officialSender = gmailApiService.getOfficialSender();
        String now = Instant.now().toString();

        payload.setSender(officialSender);
        payload.setChannel("Email");
        payload.setSentBy(senderName != null ? senderName : "SLCMS Advocate");
        payload.setSentAt(now);

        try {
            String gmailMessageId = gmailApiService.sendEmail(
                    payload.getRecipient(),
                    payload.getSubject(),
                    payload.getMessageBody()
            );

            if (gmailMessageId != null && !gmailMessageId.trim().isEmpty()) {
                payload.setStatus("SENT");
                payload.setGmailMessageId(gmailMessageId);
                payload.setProviderReference(gmailMessageId);
                payload.setFailureReason(null);
            } else {
                payload.setStatus("FAILED");
                payload.setFailureReason("Gmail API did not return a valid message ID.");
                saveMessage(payload);
                throw new IllegalStateException("Gmail API did not return a valid message ID.");
            }
        } catch (Exception e) {
            payload.setStatus("FAILED");
            payload.setFailureReason(e.getMessage() != null ? e.getMessage() : "Email delivery failed.");
            saveMessage(payload);
            throw e;
        }

        return saveMessage(payload);
    }

    public synchronized SmtpConfigDTO getSmtpConfig() {
        if (!smtpConfigFile.exists()) {
            return SmtpConfigDTO.builder()
                    .host("smtp.gmail.com")
                    .port(587)
                    .enableSsl(true)
                    .username("slcmslegal@gmail.com")
                    .fromEmail("slcmslegal@gmail.com")
                    .fromName("SLCMS Law Firm")
                    .configured(true)
                    .lastTestedAt(Instant.now().toString())
                    .testStatus("Ready")
                    .build();
        }
        try {
            return objectMapper.readValue(smtpConfigFile, SmtpConfigDTO.class);
        } catch (IOException e) {
            return new SmtpConfigDTO();
        }
    }

    public synchronized SmtpConfigDTO saveSmtpConfig(SmtpConfigDTO config) {
        config.setConfigured(true);
        config.setLastTestedAt(Instant.now().toString());
        try {
            objectMapper.writeValue(smtpConfigFile, config);
        } catch (IOException ignored) {}
        return config;
    }

    private void persistMessages(List<ClientMessageDTO> list) {
        try {
            objectMapper.writeValue(commsFile, list);
        } catch (IOException ignored) {}
    }
}
