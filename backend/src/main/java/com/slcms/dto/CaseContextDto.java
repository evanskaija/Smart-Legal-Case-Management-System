package com.slcms.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Safe, sanitized context DTO for AI prompt grounding.
 * Contains only authorized, non-sensitive case records.
 */
public class CaseContextDto {

    private Map<String, Object> caseDetails;
    private Map<String, Object> client;
    private List<Map<String, Object>> team = new ArrayList<>();
    private List<Map<String, Object>> deadlines = new ArrayList<>();
    private List<Map<String, Object>> tasks = new ArrayList<>();
    private List<Map<String, Object>> progress = new ArrayList<>();
    private List<Map<String, Object>> documents = new ArrayList<>();
    private List<Map<String, Object>> communications = new ArrayList<>();
    private List<Map<String, Object>> generatedDocuments = new ArrayList<>();
    private String dataEnvironment = "LIVE"; // LIVE | DEMO

    public CaseContextDto() {}

    public Map<String, Object> getCaseDetails() {
        return caseDetails;
    }

    public void setCaseDetails(Map<String, Object> caseDetails) {
        this.caseDetails = caseDetails;
    }

    public Map<String, Object> getClient() {
        return client;
    }

    public void setClient(Map<String, Object> client) {
        this.client = client;
    }

    public List<Map<String, Object>> getTeam() {
        return team;
    }

    public void setTeam(List<Map<String, Object>> team) {
        this.team = team;
    }

    public List<Map<String, Object>> getDeadlines() {
        return deadlines;
    }

    public void setDeadlines(List<Map<String, Object>> deadlines) {
        this.deadlines = deadlines;
    }

    public List<Map<String, Object>> getTasks() {
        return tasks;
    }

    public void setTasks(List<Map<String, Object>> tasks) {
        this.tasks = tasks;
    }

    public List<Map<String, Object>> getProgress() {
        return progress;
    }

    public void setProgress(List<Map<String, Object>> progress) {
        this.progress = progress;
    }

    public List<Map<String, Object>> getDocuments() {
        return documents;
    }

    public void setDocuments(List<Map<String, Object>> documents) {
        this.documents = documents;
    }

    public List<Map<String, Object>> getCommunications() {
        return communications;
    }

    public void setCommunications(List<Map<String, Object>> communications) {
        this.communications = communications;
    }

    public List<Map<String, Object>> getGeneratedDocuments() {
        return generatedDocuments;
    }

    public void setGeneratedDocuments(List<Map<String, Object>> generatedDocuments) {
        this.generatedDocuments = generatedDocuments;
    }

    public String getDataEnvironment() {
        return dataEnvironment;
    }

    public void setDataEnvironment(String dataEnvironment) {
        this.dataEnvironment = dataEnvironment;
    }
}
