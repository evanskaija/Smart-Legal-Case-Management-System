package com.slcms.repository;

import com.slcms.model.CaseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRecordRepository extends JpaRepository<CaseRecord, String> {
    Optional<CaseRecord> findByCaseNumber(String caseNumber);
    List<CaseRecord> findByStatus(String status);
    List<CaseRecord> findByClientId(String clientId);
    List<CaseRecord> findByLeadCounselId(String leadCounselId);
    boolean existsByCaseNumber(String caseNumber);
    boolean existsByCitation(String citation);
    Optional<CaseRecord> findByCitation(String citation);
}
