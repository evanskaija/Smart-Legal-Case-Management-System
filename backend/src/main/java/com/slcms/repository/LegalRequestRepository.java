package com.slcms.repository;

import com.slcms.model.LegalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LegalRequestRepository extends JpaRepository<LegalRequest, String> {
    List<LegalRequest> findByClientIdOrderByCreatedAtDesc(String clientId);
    List<LegalRequest> findAllByOrderByCreatedAtDesc();
    List<LegalRequest> findByStatusOrderByCreatedAtDesc(String status);
}
