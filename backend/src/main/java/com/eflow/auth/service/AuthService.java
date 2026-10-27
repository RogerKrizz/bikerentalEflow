package com.eflow.auth.service;

import com.eflow.auth.dto.*;
import com.eflow.auth.entity.OtpVerification;
import com.eflow.auth.entity.Student;
import com.eflow.auth.repository.StudentRepository;
import com.eflow.common.exception.ApiException;
import com.eflow.config.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final String allowedDomain;

    public AuthService(
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            OtpService otpService,
            JwtService jwtService,
            @Value("${eflow.auth.allowed-domain:ssn.edu.in}") String allowedDomain
    ) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.allowedDomain = allowedDomain;
    }

    @Transactional
    public void register(RegisterRequest req) {
        if (allowedDomain != null && !allowedDomain.isBlank()) {
            if (!req.email().toLowerCase().endsWith("@" + allowedDomain.toLowerCase())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DOMAIN",
                        "Registration is restricted to @" + allowedDomain + " institutional emails.");
            }
        }

        if (studentRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email is already registered.");
        }

        Student student = new Student(
                req.email().toLowerCase(),
                passwordEncoder.encode(req.password()),
                req.name(),
                Student.Role.STUDENT
        );
        student = studentRepository.save(student);

        otpService.generateAndSendOtp(student, OtpVerification.Purpose.REGISTRATION);
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest req) {
        Student student = studentRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        boolean verified = otpService.verifyOtp(student, req.otp(), OtpVerification.Purpose.REGISTRATION);
        if (!verified) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Invalid OTP code.");
        }

        student.setEmailVerified(true);
        studentRepository.save(student);

        return createAuthResponse(student);
    }

    @Transactional
    public void resendOtp(String email) {
        Student student = studentRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        if (student.isEmailVerified()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALREADY_VERIFIED", "Account is already verified.");
        }

        otpService.generateAndSendOtp(student, OtpVerification.Purpose.REGISTRATION);
    }

    public AuthResponse login(LoginRequest req) {
        Student student = studentRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "Invalid email or password."));

        if (!passwordEncoder.matches(req.password(), student.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "Invalid email or password.");
        }

        if (!student.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Email is not verified. Please verify OTP first.");
        }

        return createAuthResponse(student);
    }

    public AuthResponse refresh(RefreshTokenRequest req) {
        if (!jwtService.isTokenValid(req.refreshToken())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
        }

        Claims claims = jwtService.parseToken(req.refreshToken());
        if (!"REFRESH".equals(claims.get("type", String.class))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN_TYPE", "Not a refresh token.");
        }

        UUID userId = UUID.fromString(claims.getSubject());
        Student student = studentRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        return createAuthResponse(student);
    }

    @Transactional
    public void forgotPassword(PasswordResetDtos.ForgotPasswordRequest req) {
        studentRepository.findByEmail(req.email().toLowerCase()).ifPresent(student ->
                otpService.generateAndSendOtp(student, OtpVerification.Purpose.PASSWORD_RESET)
        );
    }

    @Transactional
    public void resetPassword(PasswordResetDtos.ResetPasswordRequest req) {
        Student student = studentRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        boolean verified = otpService.verifyOtp(student, req.otp(), OtpVerification.Purpose.PASSWORD_RESET);
        if (!verified) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Invalid OTP.");
        }

        student.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        studentRepository.save(student);
    }

    public AuthResponse.StudentDto getProfile(UUID studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));
        return mapToDto(student);
    }

    private AuthResponse createAuthResponse(Student student) {
        String accessToken = jwtService.generateAccessToken(student.getId(), student.getEmail(), student.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(student.getId());
        return new AuthResponse(accessToken, refreshToken, mapToDto(student));
    }

    private AuthResponse.StudentDto mapToDto(Student student) {
        return new AuthResponse.StudentDto(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getRole().name(),
                student.isEmailVerified(),
                student.isRestricted()
        );
    }
}
