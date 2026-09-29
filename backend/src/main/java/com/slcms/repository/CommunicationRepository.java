package com.slcms.repository;

import com.slcms.model.CommunicationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommunicationRepository extends JpaRepository<CommunicationRecord, String> {
    Optional<CommunicationRecord> findByMessageId(String messageId);
    List<CommunicationRecord> findByCaseId(String caseId);
    List<CommunicationRecord> findByClientId(String clientId);
    List<CommunicationRecord> findByStatus(String status);
}
