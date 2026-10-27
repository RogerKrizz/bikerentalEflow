package com.eflow.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AdminDtos {

    public record AdminDashboardStats(
            long totalBikes,
            long availableBikes,
            long inUseBikes,
            long maintenanceBikes,
            long totalStands,
            long activeStands,
            long totalDevices,
            long onlineDevices,
            long offlineDevices,
            long totalStudents,
            long restrictedStudents,
            long activeRidesCount,
            BigDecimal todayRevenue,
            BigDecimal totalRevenue,
            List<StandOccupancyDto> standOccupancies,
            List<AdminAlertDto> recentAlerts
    ) {}

    public record StandOccupancyDto(
            UUID id,
            String name,
            int capacity,
            long availableBikes,
            double occupancyPercent,
            BigDecimal returnRadiusMeters,
            boolean active
    ) {}

    public record AdminAlertDto(
            String id,
            String type, // WARNING, INFO, CRITICAL
            String title,
            String message,
            Instant timestamp
    ) {}

    public record AdminBikeDto(
            UUID id,
            String qrCode,
            UUID standId,
            String standName,
            String status,
            int batteryLevel,
            String lockState,
            String deviceId,
            boolean deviceOnline,
            Instant updatedAt
    ) {}

    public record AdminDeviceDto(
            UUID id,
            String deviceId,
            String transport,
            String address,
            boolean online,
            Instant lastSeen,
            UUID bikeId,
            String bikeQrCode,
            String bikeStatus,
            int batteryLevel,
            String lockState
    ) {}

    public record AdminStudentDto(
            UUID id,
            String name,
            String email,
            String role,
            boolean emailVerified,
            boolean restricted,
            Instant createdAt
    ) {}

    public record UpdateBikeStatusRequest(
            String status,
            String reason
    ) {}

    public record UpdateBikeBatteryRequest(
            int batteryLevel
    ) {}

    public record UpdateBikeStandRequest(
            UUID standId
    ) {}

    public record UpdateStandRequest(
            int capacity,
            BigDecimal returnRadiusMeters,
            boolean active
    ) {}

    public record DeviceCommandRequest(
            String commandType // UNLOCK, LOCK, PING
    ) {}

    public record RestrictStudentRequest(
            boolean restricted,
            String reason
    ) {}
}
