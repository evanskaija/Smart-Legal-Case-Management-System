package com.slcms.repository;

import com.slcms.model.Task;
import com.slcms.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskJpaRepository extends JpaRepository<Task, String> {
    List<Task> findByCaseId(String caseId);
    List<Task> findByAssignedTo(String assignedTo);
    List<Task> findByStatus(TaskStatus status);
}
