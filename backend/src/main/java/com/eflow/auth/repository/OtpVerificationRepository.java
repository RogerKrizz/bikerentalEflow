package com.eflow.auth.repository;

import com.eflow.auth.entity.OtpVerification;
import com.eflow.auth.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {
    Optional<OtpVerification> findTopByStudentAndPurposeOrderByCreatedAtDesc(
            Student student, OtpVerification.Purpose purpose
    );

    void deleteByStudentAndPurpose(Student student, OtpVerification.Purpose purpose);
}
