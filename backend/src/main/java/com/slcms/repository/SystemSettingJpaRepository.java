package com.slcms.repository;

import com.slcms.model.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemSettingJpaRepository extends JpaRepository<SystemSetting, Long> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
    boolean existsBySettingKey(String settingKey);
}
