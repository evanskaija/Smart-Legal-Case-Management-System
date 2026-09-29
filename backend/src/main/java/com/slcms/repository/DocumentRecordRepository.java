package com.slcms.repository;

import com.slcms.model.DocumentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRecordRepository extends JpaRepository<DocumentRecord, String> {
    List<DocumentRecord> findByCaseId(String caseId);
    List<DocumentRecord> findByUploadedBy(String uploadedBy);
    List<DocumentRecord> findByCategory(String category);
}
