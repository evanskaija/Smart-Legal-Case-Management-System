package com.slcms.repository;

import com.slcms.model.SystemSettingAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemSettingAuditJpaRepository extends JpaRepository<SystemSettingAudit, Long> {
    List<SystemSettingAudit> findAllByOrderByCreatedAtDesc();
}
