package com.slcms.repository;

import com.slcms.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByClientIdOrderByCreatedAtDesc(String clientId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByStatus(String status);
}
