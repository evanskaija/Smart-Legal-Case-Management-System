package com.slcms.repository;

import com.slcms.model.CaseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseAssignmentRepository extends JpaRepository<CaseAssignment, String> {
    List<CaseAssignment> findByCaseId(String caseId);
    List<CaseAssignment> findByUserId(String userId);
    boolean existsByCaseIdAndUserId(String caseId, String userId);
    void deleteByCaseIdAndUserId(String caseId, String userId);
}
