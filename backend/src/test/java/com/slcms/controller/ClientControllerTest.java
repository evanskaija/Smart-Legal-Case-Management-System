package com.slcms.controller;

import com.slcms.model.Client;
import com.slcms.repository.ClientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ClientControllerTest {

    private ClientRepository clientRepository;
    private ClientController controller;

    @BeforeEach
    void setUp() {
        clientRepository = Mockito.mock(ClientRepository.class);
        controller = new ClientController(clientRepository);
    }

    @Test
    @DisplayName("Should successfully register a valid client with normalized phone and auto-generated system fields")
    void testRegisterValidClient() {
        when(clientRepository.existsByNameIgnoreCase("Salim Juma Mwinyi")).thenReturn(false);
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));

        Client input = new Client();
        input.setName("Salim Juma Mwinyi");
        input.setClientType("INDIVIDUAL");
        input.setPhone("0754112233");
        input.setEmail("salim.mwinyi@example.co.tz");
        input.setNationalIdRef("NIDA-19900101-1234");
        input.setAddress("Dar es Salaam, Tanzania");

        ResponseEntity<?> response = controller.createClient(input, "Advocate");
        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        assertNotNull(body.get("id"));
        assertNotNull(body.get("clientNumber"));

        Client saved = (Client) body.get("client");
        assertEquals("Salim Juma Mwinyi", saved.getName());
        assertEquals("+255754112233", saved.getPhone());
        assertEquals("ACTIVE", saved.getStatus());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @DisplayName("Should reject client registration when name is missing or too short")
    void testRejectInvalidNameLength() {
        Client input = new Client();
        input.setName("A");
        input.setPhone("+255754112233");

        ResponseEntity<?> response = controller.createClient(input, "Advocate");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        Map<?, ?> errors = (Map<?, ?>) body.get("errors");
        assertTrue(errors.containsKey("name"));
    }

    @Test
    @DisplayName("Should reject client name made only of numbers or invalid symbols")
    void testRejectNumericName() {
        Client input = new Client();
        input.setName("12345678");
        input.setPhone("+255754112233");

        ResponseEntity<?> response = controller.createClient(input, "Advocate");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        Map<?, ?> errors = (Map<?, ?>) body.get("errors");
        assertTrue(errors.containsKey("name"));
    }

    @Test
    @DisplayName("Should reject duplicate client name")
    void testRejectDuplicateClientName() {
        when(clientRepository.existsByNameIgnoreCase("CRDB Bank PLC")).thenReturn(true);

        Client input = new Client();
        input.setName("CRDB Bank PLC");
        input.setPhone("+255754000001");

        ResponseEntity<?> response = controller.createClient(input, "Advocate");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        Map<?, ?> errors = (Map<?, ?>) body.get("errors");
        assertTrue(errors.containsKey("name"));
        assertTrue(errors.get("name").toString().contains("already exists"));
    }

    @Test
    @DisplayName("Should reject client registration when phone is missing or invalid")
    void testRejectInvalidPhone() {
        when(clientRepository.existsByNameIgnoreCase("Baraka Logistics")).thenReturn(false);

        Client input = new Client();
        input.setName("Baraka Logistics");
        input.setPhone("invalid-phone");

        ResponseEntity<?> response = controller.createClient(input, "Advocate");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        Map<?, ?> errors = (Map<?, ?>) body.get("errors");
        assertTrue(errors.containsKey("phone"));
    }

    @Test
    @DisplayName("Should reject client registration when email is in invalid format")
    void testRejectInvalidEmail() {
        when(clientRepository.existsByNameIgnoreCase("Baraka Logistics")).thenReturn(false);

        Client input = new Client();
        input.setName("Baraka Logistics");
        input.setPhone("+255754112233");
        input.setEmail("not-an-email");

        ResponseEntity<?> response = controller.createClient(input, "Advocate");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        Map<?, ?> errors = (Map<?, ?>) body.get("errors");
        assertTrue(errors.containsKey("email"));
    }
}
