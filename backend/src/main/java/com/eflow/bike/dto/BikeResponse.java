package com.eflow.bike.dto;

import java.util.UUID;

public record BikeResponse(
        UUID id,
        String qrCode,
        UUID standId,
        String standName,
        String status,
        int batteryLevel,
        String lockState
) {}
