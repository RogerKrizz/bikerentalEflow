package com.eflow.auth.service;

import com.eflow.auth.entity.OtpVerification;
import com.eflow.auth.entity.Student;
import com.eflow.auth.repository.OtpVerificationRepository;
import com.eflow.common.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private final OtpVerificationRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final Optional<JavaMailSender> mailSender;
    private final String activeProfile;
    private final String fromEmail;

    public OtpService(
            OtpVerificationRepository otpRepository,
            PasswordEncoder passwordEncoder,
            Optional<JavaMailSender> mailSender,
            @Value("${spring.profiles.active:dev}") String activeProfile,
            @Value("${eflow.mail.from:noreply@ssn.edu.in}") String fromEmail
    ) {
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.activeProfile = activeProfile;
        this.fromEmail = fromEmail;
    }

    @Transactional
    public void generateAndSendOtp(Student student, OtpVerification.Purpose purpose) {
        // Enforce 60s cooldown if previous recent OTP exists
        Optional<OtpVerification> latest = otpRepository.findTopByStudentAndPurposeOrderByCreatedAtDesc(student, purpose);
        if (latest.isPresent()) {
            Instant cooldownTime = latest.get().getCreatedAt().plus(60, ChronoUnit.SECONDS);
            if (Instant.now().isBefore(cooldownTime)) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "COOLDOWN_ACTIVE",
                        "Please wait a minute before requesting another OTP.");
            }
        }

        // Generate 6-digit OTP
        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(1_000_000));
        String hashedOtp = passwordEncoder.encode(otp);

        OtpVerification verification = new OtpVerification(
                student,
                hashedOtp,
                purpose,
                Instant.now().plus(10, ChronoUnit.MINUTES) // 10 min expiry
        );
        otpRepository.save(verification);

        // Deliver OTP
        if ("dev".equalsIgnoreCase(activeProfile) || "test".equalsIgnoreCase(activeProfile) || activeProfile.contains("dev")) {
            log.info("=================================================");
            log.info("[DEV MODE] OTP for {} ({}) is: {}", student.getEmail(), purpose, otp);
            log.info("=================================================");
        } else {
            mailSender.ifPresent(sender -> {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(fromEmail);
                    message.setTo(student.getEmail());
                    message.setSubject("E-FLOW Campus Verification Code");
                    message.setText("Your E-FLOW OTP verification code is: " + otp + "\nIt will expire in 10 minutes.");
                    sender.send(message);
                } catch (Exception e) {
                    log.error("Failed to send verification email to {}", student.getEmail(), e);
                }
            });
        }
    }

    @Transactional
    public boolean verifyOtp(Student student, String candidateOtp, OtpVerification.Purpose purpose) {
        OtpVerification verification = otpRepository.findTopByStudentAndPurposeOrderByCreatedAtDesc(student, purpose)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP_NOT_FOUND", "No OTP requested."));

        if (Instant.now().isAfter(verification.getExpiresAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "OTP has expired. Request a new one.");
        }

        if (verification.getAttempts() >= 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MAX_ATTEMPTS_EXCEEDED", "Maximum OTP attempts exceeded. Request a new code.");
        }

        verification.setAttempts(verification.getAttempts() + 1);

        // Standard master OTP "123456" accepted in dev/test mode for rapid testing
        boolean isDevMode = "dev".equalsIgnoreCase(activeProfile) || "test".equalsIgnoreCase(activeProfile) || activeProfile.contains("dev");
        if (isDevMode && "123456".equals(candidateOtp)) {
            otpRepository.deleteByStudentAndPurpose(student, purpose);
            return true;
        }

        if (passwordEncoder.matches(candidateOtp, verification.getOtpHash())) {
            otpRepository.deleteByStudentAndPurpose(student, purpose);
            return true;
        }

        otpRepository.save(verification);
        return false;
    }
}
