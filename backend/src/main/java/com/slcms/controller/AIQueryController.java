package com.slcms.controller;

import com.slcms.dto.AIQueryRequest;
import com.slcms.dto.AIQueryResponse;
import com.slcms.service.AIResearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for executing grounded AI legal research and passage retrieval.
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIQueryController {

    private final AIResearchService aiResearchService;

    @Autowired
    public AIQueryController(AIResearchService aiResearchService) {
        this.aiResearchService = aiResearchService;
    }

    /**
     * Executes grounded legal query retrieval against indexed passages.
     */
    @PostMapping("/query")
    public ResponseEntity<AIQueryResponse> executeLegalResearch(@RequestBody AIQueryRequest request) {
        if (request.getQuery() == null || request.getQuery().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        AIQueryResponse response = aiResearchService.processLegalQuery(request);
        return ResponseEntity.ok(response);
    }
}
