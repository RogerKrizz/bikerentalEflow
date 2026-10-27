package com.eflow.auth.repository;

import com.eflow.auth.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    Optional<Student> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRestrictedTrue();
    java.util.List<Student> findAllByOrderByCreatedAtDesc();
}
