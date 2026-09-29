package com.slcms.controller;

import com.slcms.model.Client;
import com.slcms.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(originPatterns = "*")
public class ClientController {

    private final ClientRepository clientRepository;

    private static final Pattern NAME_PATTERN = Pattern.compile("^[a-zA-Z\\s'\\-\\.]+$");
    private static final Pattern HAS_LETTERS_PATTERN = Pattern.compile(".*[a-zA-Z].*");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern TZ_PHONE_CLEAN_PATTERN = Pattern.compile("^(\\+255)[67]\\d{8}$");
    private static final Pattern INT_PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{9,15}$");

    @Autowired
    public ClientController(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
        seedShowcaseClientsIfEmpty();
    }

    private void seedShowcaseClientsIfEmpty() {
        if (clientRepository.count() == 0) {
            Client c1 = new Client("cli-001", "CLI-TZ-2025-001", "Deogratius Peter Shayo", "INDIVIDUAL", "deogratius.shayo@example.com", "+255754112233", "NIDA-19850101-1001-11", "Dar es Salaam, Kinondoni");
            Client c2 = new Client("cli-002", "CLI-TZ-2025-002", "Neema Benson Shabani", "INDIVIDUAL", "neema.shabani@example.com", "+255765223344", "NIDA-19900202-2002-22", "Dar es Salaam, Ilala");
            Client c3 = new Client("cli-003", "CLI-TZ-2025-003", "CRDB Bank PLC", "CORPORATE", "legal@crdbbank.co.tz", "+255754000001", "BRELA-1002341", "Azikiwe Street, Dar es Salaam");
            Client c4 = new Client("cli-004", "CLI-TZ-2025-004", "Kilombero Sugar Co. Ltd", "CORPORATE", "info@kilomberosugar.co.tz", "+255754000002", "BRELA-1005882", "Morogoro, Tanzania");
            clientRepository.saveAll(Arrays.asList(c1, c2, c3, c4));
        }
    }

    @GetMapping
    public ResponseEntity<List<Client>> getAllClients() {
        return ResponseEntity.ok(clientRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClientById(@PathVariable String id) {
        Optional<Client> client = clientRepository.findById(id);
        if (client.isPresent()) {
            return ResponseEntity.ok(client.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Client not found with ID: " + id));
    }

    @PostMapping
    public ResponseEntity<?> createClient(@RequestBody Client client,
                                          @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        Map<String, String> errors = new HashMap<>();

        // 1. Client Name Validation: 2–150 characters, letters/spaces/apostrophes/hyphens/dots, cannot be numbers only, unique
        if (client.getName() == null || client.getName().trim().isEmpty()) {
            errors.put("name", "Client name is required.");
        } else {
            String name = client.getName().trim();
            if (name.length() < 2 || name.length() > 150) {
                errors.put("name", "Client name must be between 2 and 150 characters.");
            } else if (!NAME_PATTERN.matcher(name).matches()) {
                errors.put("name", "Client name may only contain letters, spaces, apostrophes, hyphens and dots.");
            } else if (!HAS_LETTERS_PATTERN.matcher(name).matches()) {
                errors.put("name", "Client name cannot be made only of numbers or special characters.");
            } else if (clientRepository.existsByNameIgnoreCase(name)) {
                errors.put("name", "A client with this name already exists in the system.");
            } else {
                client.setName(name);
            }
        }

        // 2. Client Type Validation
        if (client.getClientType() == null || client.getClientType().trim().isEmpty()) {
            client.setClientType("INDIVIDUAL");
        } else {
            String typeUpper = client.getClientType().trim().toUpperCase();
            if (!typeUpper.equals("INDIVIDUAL") && !typeUpper.equals("CORPORATE") &&
                !typeUpper.equals("ORGANIZATION") && !typeUpper.equals("NGO") && !typeUpper.equals("GOVERNMENT")) {
                errors.put("clientType", "Invalid client type. Must be Individual or Corporate/Organization.");
            } else {
                client.setClientType(typeUpper.equals("ORGANIZATION") ? "CORPORATE" : typeUpper);
            }
        }

        // 3. Contact Phone Number Validation & Normalization
        if (client.getPhone() == null || client.getPhone().trim().isEmpty()) {
            errors.put("phone", "Contact phone number is required.");
        } else {
            String cleanPhone = client.getPhone().trim().replaceAll("[\\s\\-\\(\\)]+", "");
            if (cleanPhone.startsWith("0") && cleanPhone.length() == 10) {
                cleanPhone = "+255" + cleanPhone.substring(1);
            } else if (cleanPhone.startsWith("255") && cleanPhone.length() == 12) {
                cleanPhone = "+" + cleanPhone;
            }

            if (!TZ_PHONE_CLEAN_PATTERN.matcher(cleanPhone).matches() && !INT_PHONE_PATTERN.matcher(cleanPhone).matches()) {
                errors.put("phone", "Invalid phone number format. Provide a valid Tanzanian number (+255 7XX XXX XXX or 07XXXXXXXX) or international phone format.");
            } else {
                client.setPhone(cleanPhone);
            }
        }

        // 4. Email Validation (Optional, but validated if provided)
        if (client.getEmail() != null && !client.getEmail().trim().isEmpty()) {
            String email = client.getEmail().trim();
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                errors.put("email", "Please provide a valid email address (e.g. client@example.com).");
            } else {
                client.setEmail(email);
            }
        } else {
            client.setEmail("");
        }

        // 5. Identification / TIN Ref (Optional trim)
        if (client.getNationalIdRef() != null) {
            client.setNationalIdRef(client.getNationalIdRef().trim());
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "errors", errors));
        }

        // Automatic System Values
        if (client.getId() == null || client.getId().trim().isEmpty()) {
            client.setId("cli-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (client.getClientNumber() == null || client.getClientNumber().trim().isEmpty()) {
            client.setClientNumber("CLI-TZ-" + Calendar.getInstance().get(Calendar.YEAR) + "-" + String.format("%04d", (int)(Math.random() * 9000) + 1000));
        }
        client.setStatus("ACTIVE");
        client.setCreatedAt(LocalDateTime.now());
        client.setUpdatedAt(LocalDateTime.now());

        Client saved = clientRepository.save(client);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "success", true,
            "id", saved.getId(),
            "clientNumber", saved.getClientNumber(),
            "client", saved
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateClient(@PathVariable String id, @RequestBody Client updated) {
        Optional<Client> existing = clientRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Client not found"));
        }
        Client c = existing.get();
        if (updated.getName() != null && !updated.getName().trim().isEmpty()) {
            if (!NAME_PATTERN.matcher(updated.getName().trim()).matches()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid name format"));
            }
            c.setName(updated.getName().trim());
        }
        if (updated.getPhone() != null && !updated.getPhone().trim().isEmpty()) {
            String cleanPhone = updated.getPhone().replaceAll("\\s+", "");
            if (!TZ_PHONE_CLEAN_PATTERN.matcher(cleanPhone).matches() && !INT_PHONE_PATTERN.matcher(cleanPhone).matches()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Tanzanian phone format"));
            }
            c.setPhone(cleanPhone);
        }
        if (updated.getEmail() != null) c.setEmail(updated.getEmail().trim());
        if (updated.getClientType() != null) c.setClientType(updated.getClientType());
        if (updated.getAddress() != null) c.setAddress(updated.getAddress());
        if (updated.getStatus() != null) c.setStatus(updated.getStatus());
        if (updated.getContactPerson() != null) c.setContactPerson(updated.getContactPerson());
        if (updated.getNotes() != null) c.setNotes(updated.getNotes());
        c.setUpdatedAt(LocalDateTime.now());

        Client saved = clientRepository.save(c);
        return ResponseEntity.ok(Map.of("success", true, "client", saved));
    }
}
