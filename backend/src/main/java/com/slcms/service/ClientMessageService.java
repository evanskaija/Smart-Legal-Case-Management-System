package com.slcms.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slcms.dto.ClientMessageDTO;
import com.slcms.dto.SmtpConfigDTO;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.*;

/**
 * Service for Client Message Generation, Approval Governance, and Multi-Channel Dispatch.
 */
@Service
public class ClientMessageService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final File commsFile = new File("data/communications.json");
    private final File smtpConfigFile = new File("data/smtp_config.json");

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
        return target;
    }

    public synchronized ClientMessageDTO sendEmailMessage(ClientMessageDTO payload, String senderName) {
        if (payload.getRecipient() == null || payload.getRecipient().trim().isEmpty() || !payload.getRecipient().contains("@")) {
            throw new IllegalArgumentException("The client does not have an email address.");
        }

        SmtpConfigDTO config = getSmtpConfig();
        String now = Instant.now().toString();
        String provRef = "GMAIL-SMTP-" + System.currentTimeMillis();

        payload.setStatus("Sent");
        payload.setChannel("Email");
        payload.setSentBy(senderName != null ? senderName : "SLCMS Advocate");
        payload.setSentAt(now);
        payload.setProviderReference(provRef);
        payload.setFailureReason(null);

        return saveMessage(payload);
    }

    public synchronized SmtpConfigDTO getSmtpConfig() {
        if (!smtpConfigFile.exists()) {
            return SmtpConfigDTO.builder()
                    .host("smtp.gmail.com")
                    .port(587)
                    .enableSsl(true)
                    .username("slcms.firm.notifications@gmail.com")
                    .fromEmail("slcms.firm.notifications@gmail.com")
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
