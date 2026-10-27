package com.eflow.stand.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StandResponse(
        UUID id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        int capacity,
        BigDecimal returnRadiusMeters,
        boolean active,
        long availableBikes,
        long inUseBikes,
        long maintenanceBikes,
        Double distanceMeters
) {}
