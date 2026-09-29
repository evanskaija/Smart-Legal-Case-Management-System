package com.slcms.repository;

import com.slcms.model.CaseMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseMessageRepository extends JpaRepository<CaseMessage, Long> {
    List<CaseMessage> findByConversationIdOrderBySentAtAsc(Long conversationId);
    long countByConversationIdAndReadAtIsNullAndSenderIdNot(Long conversationId, String senderId);
}
