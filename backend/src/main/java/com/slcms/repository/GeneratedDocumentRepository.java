package com.slcms.repository;

import com.slcms.model.GeneratedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeneratedDocumentRepository extends JpaRepository<GeneratedDocument, String> {
    List<GeneratedDocument> findByCaseId(String caseId);
}
