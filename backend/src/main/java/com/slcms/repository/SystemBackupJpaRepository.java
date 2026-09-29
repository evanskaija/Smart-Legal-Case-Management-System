package com.slcms.repository;

import com.slcms.model.SystemBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemBackupJpaRepository extends JpaRepository<SystemBackup, Long> {
    List<SystemBackup> findAllByOrderByCreatedAtDesc();
    java.util.Optional<SystemBackup> findTopByOrderByCreatedAtDesc();
    java.util.Optional<SystemBackup> findTopByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
}
