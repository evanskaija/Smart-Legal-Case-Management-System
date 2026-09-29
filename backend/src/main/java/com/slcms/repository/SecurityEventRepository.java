package com.slcms.repository;

import com.slcms.model.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, String> {
    List<SecurityEvent> findByUserIdOrderByEventTimeDesc(String userId);
    List<SecurityEvent> findAllByOrderByEventTimeDesc();
}
