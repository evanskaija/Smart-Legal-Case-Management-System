package com.slcms.repository;

import com.slcms.model.SecurityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, String> {
    List<SecurityAlert> findByResolvedFalseOrderByCreatedAtDesc();
    List<SecurityAlert> findByUserIdOrderByCreatedAtDesc(String userId);
}
