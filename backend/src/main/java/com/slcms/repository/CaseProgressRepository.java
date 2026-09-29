package com.slcms.repository;

import com.slcms.model.CaseProgressRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseProgressRepository extends JpaRepository<CaseProgressRecord, String> {
    List<CaseProgressRecord> findByCaseIdOrderByRecordedAtDesc(String caseId);
}
