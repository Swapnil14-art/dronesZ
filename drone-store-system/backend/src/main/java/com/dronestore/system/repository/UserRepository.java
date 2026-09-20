package com.dronestore.system.repository;

import com.dronestore.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    List<User> findByIsDeletedFalse();
    Optional<User> findByIdAndIsDeletedFalse(Long id);
    Optional<User> findByEmailIgnoreCaseAndIsDeletedFalse(String email);
    boolean existsByEmailIgnoreCaseAndIsDeletedFalse(String email);
}
