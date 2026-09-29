package com.slcms.controller;

import com.slcms.dto.CaseContextDto;
import com.slcms.service.AIContextService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for retrieving safe, role-authorized context for AI prompt grounding.
 * Endpoints:
 * - GET /api/ai/context/cases/{caseId}
 * - GET /api/ai/context/admin
 */
@RestController
@RequestMapping("/api/ai/context")
@CrossOrigin(originPatterns = "*")
public class AIContextController {

    private final AIContextService aiContextService;

    @Autowired
    public AIContextController(AIContextService aiContextService) {
        this.aiContextService = aiContextService;
    }

    /**
     * Retrieves safe, sanitized case context for grounding AI responses.
     */
    @GetMapping("/cases/{caseId}")
    public ResponseEntity<CaseContextDto> getCaseContext(
            @PathVariable("caseId") String caseId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "usr-001") String userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "Lawyer") String userRole,
            @RequestHeader(value = "X-User-Title", required = false, defaultValue = "Advocate") String userTitle
    ) {
        CaseContextDto context = aiContextService.getCaseContext(caseId, userId, userRole, userTitle);
        return ResponseEntity.ok(context);
    }

    /**
     * Retrieves safe administrative reports context (restricted to System Administrator).
     */
    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAdminReportContext(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "usr-001") String userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "Administrator") String userRole
    ) {
        Map<String, Object> adminContext = aiContextService.getAdminReportContext(userId, userRole);
        if (adminContext.containsKey("error") && "ACCESS_DENIED".equals(adminContext.get("error"))) {
            return ResponseEntity.status(403).body(adminContext);
        }
        return ResponseEntity.ok(adminContext);
    }
}
