package com.slcms.repository;

import com.slcms.model.UserAccount;
import com.slcms.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for UserAccount entities.
 * Connects directly to the permanent online database (PostgreSQL / MySQL / H2).
 */
@Repository
public interface UserRepository extends JpaRepository<UserAccount, String> {

    List<UserAccount> findByRole(UserRole role);

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    Optional<UserAccount> findByStaffIdIgnoreCase(String staffId);

    Optional<UserAccount> findByEmployeeIdIgnoreCase(String employeeId);

    Optional<UserAccount> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByStaffIdIgnoreCase(String staffId);

    boolean existsByPhone(String phone);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByAdvocateNumberIgnoreCase(String advocateNumber);

    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    long countByAccountStatus(com.slcms.model.AccountStatus accountStatus);

    long countByAccountStatusIn(java.util.Collection<com.slcms.model.AccountStatus> accountStatuses);

    List<UserAccount> findByAccountStatusIn(java.util.Collection<com.slcms.model.AccountStatus> accountStatuses);
}
