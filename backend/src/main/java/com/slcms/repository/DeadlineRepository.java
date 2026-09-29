package com.slcms.repository;

import com.slcms.model.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeadlineRepository extends JpaRepository<Deadline, String> {
    List<Deadline> findByCaseId(String caseId);
    List<Deadline> findByResponsibleLawyerId(String responsibleLawyerId);
}
