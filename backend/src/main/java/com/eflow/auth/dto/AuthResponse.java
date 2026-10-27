package com.eflow.auth.dto;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        StudentDto user
) {
    public record StudentDto(
            UUID id,
            String name,
            String email,
            String role,
            boolean emailVerified,
            boolean restricted
    ) {}
}
