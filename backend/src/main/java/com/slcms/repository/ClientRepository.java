package com.slcms.repository;

import com.slcms.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, String> {
    Optional<Client> findByClientNumber(String clientNumber);
    Optional<Client> findByClientNumberIgnoreCase(String clientNumber);
    Optional<Client> findByUserId(String userId);
    Optional<Client> findByEmailIgnoreCase(String email);
    List<Client> findByStatus(String status);
    List<Client> findByNameContainingIgnoreCase(String name);
    boolean existsByClientNumber(String clientNumber);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
    boolean existsByNameIgnoreCase(String name);
    Optional<Client> findByNameIgnoreCase(String name);
}
