package com.slcms.repository;

import com.slcms.model.CaseConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseConversationRepository extends JpaRepository<CaseConversation, Long> {
    Optional<CaseConversation> findByCaseId(String caseId);
    List<CaseConversation> findByClientId(String clientId);
    List<CaseConversation> findByLawyerId(String lawyerId);
    boolean existsByCaseId(String caseId);
}
