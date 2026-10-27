package com.eflow.admin.controller;

import com.eflow.admin.dto.AdminDtos.*;
import com.eflow.admin.service.AdminService;
import com.eflow.audit.entity.AuditLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Operations", description = "Fleet management, stand balancing, device telemetry, and audit trail")
@SecurityRequirement(name = "Bearer")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Real-time fleet metrics, live alert feed, and stand occupancy")
    public ResponseEntity<AdminDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/bikes")
    @Operation(summary = "Get full fleet list of bikes with telemetry and stand locations")
    public ResponseEntity<List<AdminBikeDto>> getAllBikes() {
        return ResponseEntity.ok(adminService.getAllBikes());
    }

    @PutMapping("/bikes/{id}/status")
    @Operation(summary = "Update bike status (AVAILABLE, IN_USE, MAINTENANCE)")
    public ResponseEntity<AdminBikeDto> updateBikeStatus(
            @PathVariable UUID id,
            @RequestBody UpdateBikeStatusRequest req
    ) {
        return ResponseEntity.ok(adminService.updateBikeStatus(id, req));
    }

    @PutMapping("/bikes/{id}/battery")
    @Operation(summary = "Update or recharge bike battery level")
    public ResponseEntity<AdminBikeDto> updateBikeBattery(
            @PathVariable UUID id,
            @RequestBody UpdateBikeBatteryRequest req
    ) {
        return ResponseEntity.ok(adminService.updateBikeBattery(id, req));
    }

    @PutMapping("/bikes/{id}/stand")
    @Operation(summary = "Relocate bike to another campus stand")
    public ResponseEntity<AdminBikeDto> updateBikeStand(
            @PathVariable UUID id,
            @RequestBody UpdateBikeStandRequest req
    ) {
        return ResponseEntity.ok(adminService.updateBikeStand(id, req));
    }

    @GetMapping("/stands")
    @Operation(summary = "List campus stands with capacity and geofence radius")
    public ResponseEntity<List<StandOccupancyDto>> getAllStands() {
        return ResponseEntity.ok(adminService.getAllStands());
    }

    @PutMapping("/stands/{id}")
    @Operation(summary = "Update stand capacity, return geofence radius, or active state")
    public ResponseEntity<StandOccupancyDto> updateStand(
            @PathVariable UUID id,
            @RequestBody UpdateStandRequest req
    ) {
        return ResponseEntity.ok(adminService.updateStand(id, req));
    }

    @GetMapping("/devices")
    @Operation(summary = "List all smart lock devices and connection telemetry")
    public ResponseEntity<List<AdminDeviceDto>> getAllDevices() {
        return ResponseEntity.ok(adminService.getAllDevices());
    }

    @PostMapping("/devices/{id}/toggle-online")
    @Operation(summary = "Toggle device connection status between ONLINE and OFFLINE")
    public ResponseEntity<AdminDeviceDto> toggleDeviceOnline(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.toggleDeviceOnline(id));
    }

    @PostMapping("/devices/{id}/command")
    @Operation(summary = "Send command (UNLOCK, LOCK, PING) to device")
    public ResponseEntity<AdminDeviceDto> sendDeviceCommand(
            @PathVariable UUID id,
            @RequestBody DeviceCommandRequest req
    ) {
        return ResponseEntity.ok(adminService.sendDeviceCommand(id, req));
    }

    @GetMapping("/students")
    @Operation(summary = "List all registered student accounts")
    public ResponseEntity<List<AdminStudentDto>> getAllStudents() {
        return ResponseEntity.ok(adminService.getAllStudents());
    }

    @PutMapping("/students/{id}/restrict")
    @Operation(summary = "Restrict or unrestrict a student from renting bikes")
    public ResponseEntity<AdminStudentDto> restrictStudent(
            @PathVariable UUID id,
            @RequestBody RestrictStudentRequest req
    ) {
        return ResponseEntity.ok(adminService.restrictStudent(id, req));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get recent audit trail logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getRecentAuditLogs());
    }
}
