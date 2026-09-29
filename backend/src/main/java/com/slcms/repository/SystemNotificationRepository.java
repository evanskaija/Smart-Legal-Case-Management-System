package com.slcms.repository;

import com.slcms.model.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, Long> {
    List<SystemNotification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SystemNotification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);
    List<SystemNotification> findByUserIdOrRecipientRoleOrderByCreatedAtDesc(String userId, String recipientRole);
    long countByUserIdAndReadFalse(String userId);
    long countByRecipientRoleAndReadFalse(String recipientRole);
}
