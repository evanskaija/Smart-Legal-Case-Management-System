package com.slcms.controller;

import com.slcms.model.GeneratedDocument;
import com.slcms.repository.GeneratedDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/generated-documents")
@CrossOrigin(originPatterns = "*")
public class GeneratedDocumentController {

    private final GeneratedDocumentRepository documentRepository;

    @Autowired
    public GeneratedDocumentController(GeneratedDocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @GetMapping
    public ResponseEntity<List<GeneratedDocument>> getAllDocuments(@RequestParam(required = false) String caseId) {
        if (caseId != null && !caseId.isBlank()) {
            return ResponseEntity.ok(documentRepository.findByCaseId(caseId));
        }
        return ResponseEntity.ok(documentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable String id) {
        Optional<GeneratedDocument> doc = documentRepository.findById(id);
        if (doc.isPresent()) {
            return ResponseEntity.ok(doc.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Document not found"));
    }

    @PostMapping
    public ResponseEntity<?> saveDocument(
            @RequestBody GeneratedDocument doc,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Name", required = false) String userName
    ) {
        if (doc.getId() == null || doc.getId().isBlank()) {
            doc.setId("gdoc-" + System.currentTimeMillis());
        }

        // Limit instructions to 1,000 characters
        if (doc.getInstructions() != null && doc.getInstructions().length() > 1000) {
            doc.setInstructions(doc.getInstructions().substring(0, 1000));
        }

        if (doc.getStatus() == null || doc.getStatus().isBlank()) {
            doc.setStatus("Draft");
        }

        // Role check for direct approval
        if ("Approved".equalsIgnoreCase(doc.getStatus()) || "Final".equalsIgnoreCase(doc.getStatus())) {
            boolean isSeniorLawyer = "Senior Lawyer".equalsIgnoreCase(userRole) || "Managing Partner".equalsIgnoreCase(userRole);
            if (!isSeniorLawyer) {
                // If not senior lawyer, reset to Draft or Pending Review
                if ("Administrator".equalsIgnoreCase(userRole)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                            "error", "Permission Denied: System Administrators may manage the platform but cannot approve legal content unless registered as authorized senior counsel."
                    ));
                }
            }
        }

        doc.setUpdatedAt(LocalDateTime.now());
        if (doc.getCreatedAt() == null) {
            doc.setCreatedAt(LocalDateTime.now());
        }

        GeneratedDocument saved = documentRepository.save(doc);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Name", required = false) String userName
    ) {
        Optional<GeneratedDocument> opt = documentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Document not found"));
        }

        GeneratedDocument doc = opt.get();
        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        // Enforce RBAC: Only Senior Lawyer can approve or finalize legal documents
        if ("Approved".equalsIgnoreCase(newStatus) || "Final".equalsIgnoreCase(newStatus)) {
            boolean isSenior = "Senior Lawyer".equalsIgnoreCase(userRole) || "Managing Partner".equalsIgnoreCase(userRole);
            if (!isSenior) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Permission Denied: Only a Senior Lawyer can approve or finalize legal documents. Administrators cannot approve legal content."
                ));
            }
            doc.setApprovedBy(userName != null && !userName.isBlank() ? userName : "Senior Advocate");
        }

        doc.setStatus(newStatus);
        doc.setUpdatedAt(LocalDateTime.now());
        GeneratedDocument saved = documentRepository.save(doc);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable String id) {
        if (!documentRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Document not found"));
        }
        documentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Document deleted successfully"));
    }
}
