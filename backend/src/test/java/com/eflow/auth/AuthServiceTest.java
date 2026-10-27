package com.eflow.auth;

import com.eflow.auth.dto.AuthResponse;
import com.eflow.auth.dto.LoginRequest;
import com.eflow.auth.dto.RegisterRequest;
import com.eflow.auth.dto.VerifyOtpRequest;
import com.eflow.auth.entity.Student;
import com.eflow.auth.repository.StudentRepository;
import com.eflow.auth.service.AuthService;
import com.eflow.auth.service.OtpService;
import com.eflow.common.exception.ApiException;
import com.eflow.config.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OtpService otpService;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(studentRepository, passwordEncoder, otpService, jwtService, "ssn.edu.in");
    }

    @Test
    void testRegisterWithInvalidDomainThrowsException() {
        RegisterRequest req = new RegisterRequest("Test User", "test@gmail.com", "password123");
        assertThrows(ApiException.class, () -> authService.register(req));
    }

    @Test
    void testRegisterValidDomainSavesAndDispatchesOtp() {
        RegisterRequest req = new RegisterRequest("Test User", "test@ssn.edu.in", "password123");
        when(studentRepository.existsByEmail("test@ssn.edu.in")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashedPass");
        when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

        authService.register(req);

        verify(studentRepository, times(1)).save(any(Student.class));
        verify(otpService, times(1)).generateAndSendOtp(any(Student.class), any());
    }

    @Test
    void testLoginWithUnverifiedEmailFails() {
        LoginRequest req = new LoginRequest("student@ssn.edu.in", "pass");
        Student student = new Student("student@ssn.edu.in", "hashedPass", "Student", Student.Role.STUDENT);
        student.setEmailVerified(false);

        when(studentRepository.findByEmail("student@ssn.edu.in")).thenReturn(Optional.of(student));
        when(passwordEncoder.matches("pass", "hashedPass")).thenReturn(true);

        assertThrows(ApiException.class, () -> authService.login(req));
    }
}
