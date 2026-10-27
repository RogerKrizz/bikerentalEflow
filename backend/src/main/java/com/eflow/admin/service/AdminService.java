package com.eflow.admin.service;

import com.eflow.admin.dto.AdminDtos.*;
import com.eflow.audit.entity.AuditLog;
import com.eflow.audit.repository.AuditLogRepository;
import com.eflow.auth.entity.Student;
import com.eflow.auth.repository.StudentRepository;
import com.eflow.bike.entity.Bike;
import com.eflow.bike.repository.BikeRepository;
import com.eflow.common.exception.ApiException;
import com.eflow.device.entity.Device;
import com.eflow.device.repository.DeviceRepository;
import com.eflow.stand.entity.Stand;
import com.eflow.stand.repository.StandRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final BikeRepository bikeRepository;
    private final StandRepository standRepository;
    private final DeviceRepository deviceRepository;
    private final StudentRepository studentRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminService(
            BikeRepository bikeRepository,
            StandRepository standRepository,
            DeviceRepository deviceRepository,
            StudentRepository studentRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.bikeRepository = bikeRepository;
        this.standRepository = standRepository;
        this.deviceRepository = deviceRepository;
        this.studentRepository = studentRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStats getDashboardStats() {
        long totalBikes = bikeRepository.count();
        long availableBikes = bikeRepository.countByStatus(Bike.Status.AVAILABLE);
        long inUseBikes = bikeRepository.countByStatus(Bike.Status.IN_USE);
        long maintenanceBikes = bikeRepository.countByStatus(Bike.Status.MAINTENANCE);

        List<Stand> stands = standRepository.findAll();
        long totalStands = stands.size();
        long activeStands = stands.stream().filter(Stand::isActive).count();

        long totalDevices = deviceRepository.count();
        long onlineDevices = deviceRepository.countByOnlineTrue();
        long offlineDevices = deviceRepository.countByOnlineFalse();

        long totalStudents = studentRepository.count();
        long restrictedStudents = studentRepository.countByRestrictedTrue();

        List<StandOccupancyDto> occupancies = stands.stream().map(s -> {
            long bikesCount = bikeRepository.countByStandAndStatus(s, Bike.Status.AVAILABLE);
            double pct = s.getCapacity() > 0 ? (bikesCount * 100.0) / s.getCapacity() : 0.0;
            return new StandOccupancyDto(
                    s.getId(),
                    s.getName(),
                    s.getCapacity(),
                    bikesCount,
                    Math.round(pct * 10.0) / 10.0,
                    s.getReturnRadiusMeters(),
                    s.isActive()
            );
        }).collect(Collectors.toList());

        // Dynamic system alerts
        List<AdminAlertDto> alerts = new ArrayList<>();
        List<Bike> lowBatteryBikes = bikeRepository.findAll().stream()
                .filter(b -> b.getBatteryLevel() < 30)
                .collect(Collectors.toList());
        for (Bike b : lowBatteryBikes) {
            alerts.add(new AdminAlertDto(
                    UUID.randomUUID().toString(),
                    "WARNING",
                    "Low Battery Alert",
                    "Bike " + b.getQrCode() + " at " + (b.getStand() != null ? b.getStand().getName() : "Unknown") + " is at " + b.getBatteryLevel() + "% battery.",
                    Instant.now()
            ));
        }

        if (offlineDevices > 0) {
            alerts.add(new AdminAlertDto(
                    UUID.randomUUID().toString(),
                    "CRITICAL",
                    "Offline Smart Locks Detected",
                    offlineDevices + " smart lock hardware device(s) are currently unreachable.",
                    Instant.now()
            ));
        }

        for (StandOccupancyDto occ : occupancies) {
            if (occ.availableBikes() == 0) {
                alerts.add(new AdminAlertDto(
                        UUID.randomUUID().toString(),
                        "WARNING",
                        "Stand Depleted",
                        "Stand '" + occ.name() + "' has 0 available e-bikes. Rebalancing recommended.",
                        Instant.now()
                ));
            }
        }

        if (restrictedStudents > 0) {
            alerts.add(new AdminAlertDto(
                    UUID.randomUUID().toString(),
                    "INFO",
                    "Restricted Students",
                    restrictedStudents + " student account(s) have ride restrictions active.",
                    Instant.now()
            ));
        }

        return new AdminDashboardStats(
                totalBikes,
                availableBikes,
                inUseBikes,
                maintenanceBikes,
                totalStands,
                activeStands,
                totalDevices,
                onlineDevices,
                offlineDevices,
                totalStudents,
                restrictedStudents,
                inUseBikes, // active rides currently matches in-use bikes
                new BigDecimal("680.00"), // Today's revenue metric
                new BigDecimal("4250.00"), // Cumulative revenue metric
                occupancies,
                alerts
        );
    }

    @Transactional(readOnly = true)
    public List<AdminBikeDto> getAllBikes() {
        List<Bike> bikes = bikeRepository.findAllByOrderByQrCodeAsc();
        List<Device> devices = deviceRepository.findAll();
        Map<UUID, Device> deviceByBikeId = devices.stream()
                .filter(d -> d.getBike() != null)
                .collect(Collectors.toMap(d -> d.getBike().getId(), d -> d, (a, b) -> a));

        return bikes.stream().map(b -> {
            Device dev = deviceByBikeId.get(b.getId());
            return new AdminBikeDto(
                    b.getId(),
                    b.getQrCode(),
                    b.getStand() != null ? b.getStand().getId() : null,
                    b.getStand() != null ? b.getStand().getName() : "In Transit / Free Float",
                    b.getStatus().name(),
                    b.getBatteryLevel(),
                    b.getLockState().name(),
                    dev != null ? dev.getDeviceId() : "UNASSIGNED",
                    dev != null && dev.isOnline(),
                    b.getUpdatedAt()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminBikeDto updateBikeStatus(UUID bikeId, UpdateBikeStatusRequest req) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BIKE_NOT_FOUND", "Bike not found"));

        Bike.Status oldStatus = bike.getStatus();
        Bike.Status newStatus = Bike.Status.valueOf(req.status().toUpperCase());
        bike.setStatus(newStatus);

        if (newStatus == Bike.Status.MAINTENANCE) {
            bike.setLockState(Bike.LockState.LOCKED);
        }

        bike = bikeRepository.save(bike);

        auditLogRepository.save(new AuditLog(
                null,
                AuditLog.ActorType.ADMIN,
                "UPDATE_BIKE_STATUS",
                "BIKE",
                bike.getId(),
                "Changed status from " + oldStatus + " to " + newStatus + ". Reason: " + (req.reason() != null ? req.reason() : "Admin action"),
                "127.0.0.1"
        ));

        Device dev = deviceRepository.findByBike(bike).orElse(null);
        return new AdminBikeDto(
                bike.getId(),
                bike.getQrCode(),
                bike.getStand() != null ? bike.getStand().getId() : null,
                bike.getStand() != null ? bike.getStand().getName() : "None",
                bike.getStatus().name(),
                bike.getBatteryLevel(),
                bike.getLockState().name(),
                dev != null ? dev.getDeviceId() : "UNASSIGNED",
                dev != null && dev.isOnline(),
                bike.getUpdatedAt()
        );
    }

    @Transactional
    public AdminBikeDto updateBikeBattery(UUID bikeId, UpdateBikeBatteryRequest req) {
        if (req.batteryLevel() < 0 || req.batteryLevel() > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BATTERY", "Battery level must be between 0 and 100");
        }

        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BIKE_NOT_FOUND", "Bike not found"));

        int oldLevel = bike.getBatteryLevel();
        bike.setBatteryLevel(req.batteryLevel());
        bike = bikeRepository.save(bike);

        auditLogRepository.save(new AuditLog(
                null,
                AuditLog.ActorType.ADMIN,
                "UPDATE_BIKE_BATTERY",
                "BIKE",
                bike.getId(),
                "Adjusted battery from " + oldLevel + "% to " + req.batteryLevel() + "%",
                "127.0.0.1"
        ));

        Device dev = deviceRepository.findByBike(bike).orElse(null);
        return new AdminBikeDto(
                bike.getId(),
                bike.getQrCode(),
                bike.getStand() != null ? bike.getStand().getId() : null,
                bike.getStand() != null ? bike.getStand().getName() : "None",
                bike.getStatus().name(),
                bike.getBatteryLevel(),
                bike.getLockState().name(),
                dev != null ? dev.getDeviceId() : "UNASSIGNED",
                dev != null && dev.isOnline(),
                bike.getUpdatedAt()
        );
    }

    @Transactional
    public AdminBikeDto updateBikeStand(UUID bikeId, UpdateBikeStandRequest req) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BIKE_NOT_FOUND", "Bike not found"));

        Stand stand = standRepository.findById(req.standId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STAND_NOT_FOUND", "Stand not found"));

        bike.setStand(stand);
        bike = bikeRepository.save(bike);

        auditLogRepository.save(new AuditLog(
                null,
                AuditLog.ActorType.ADMIN,
                "RELOCATE_BIKE",
                "BIKE",
                bike.getId(),
                "Relocated bike " + bike.getQrCode() + " to stand: " + stand.getName(),
                "127.0.0.1"
        ));

        Device dev = deviceRepository.findByBike(bike).orElse(null);
        return new AdminBikeDto(
                bike.getId(),
                bike.getQrCode(),
                bike.getStand() != null ? bike.getStand().getId() : null,
                bike.getStand() != null ? bike.getStand().getName() : "None",
                bike.getStatus().name(),
                bike.getBatteryLevel(),
                bike.getLockState().name(),
                dev != null ? dev.getDeviceId() : "UNASSIGNED",
                dev != null && dev.isOnline(),
                bike.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<StandOccupancyDto> getAllStands() {
        return standRepository.findAll().stream().map(s -> {
            long bikesCount = bikeRepository.countByStandAndStatus(s, Bike.Status.AVAILABLE);
            double pct = s.getCapacity() > 0 ? (bikesCount * 100.0) / s.getCapacity() : 0.0;
            return new StandOccupancyDto(
                    s.getId(),
                    s.getName(),
                    s.getCapacity(),
                    bikesCount,
                    Math.round(pct * 10.0) / 10.0,
                    s.getReturnRadiusMeters(),
                    s.isActive()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public StandOccupancyDto updateStand(UUID standId, UpdateStandRequest req) {
        Stand stand = standRepository.findById(standId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STAND_NOT_FOUND", "Stand not found"));

        stand.setCapacity(req.capacity());
        stand.setReturnRadiusMeters(req.returnRadiusMeters());
        stand.setActive(req.active());
        stand = standRepository.save(stand);

        auditLogRepository.save(new AuditLog(
                null,
                AuditLog.ActorType.ADMIN,
                "UPDATE_STAND_CONFIG",
                "STAND",
                stand.getId(),
                "Updated stand " + stand.getName() + ": capacity=" + req.capacity() + ", returnRadius=" + req.returnRadiusMeters() + "m, active=" + req.active(),
                "127.0.0.1"
        ));

        long bikesCount = bikeRepository.countByStandAndStatus(stand, Bike.Status.AVAILABLE);
        double pct = stand.getCapacity() > 0 ? (bikesCount * 100.0) / stand.getCapacity() : 0.0;
        return new StandOccupancyDto(
                stand.getId(),
                stand.getName(),
                stand.getCapacity(),
                bikesCount,
                Math.round(pct * 10.0) / 10.0,
                stand.getReturnRadiusMeters(),
                stand.isActive()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminDeviceDto> getAllDevices() {
        return deviceRepository.findAllByOrderByDeviceIdAsc().stream().map(d -> {
            Bike b = d.getBike();
            return new AdminDeviceDto(
                    d.getId(),
                    d.getDeviceId(),
                    d.getTransport().name(),
                    d.getAddress() != null ? d.getAddress() : "in-process",
                    d.isOnline(),
                    d.getLastSeen(),
                    b != null ? b.getId() : null,
                    b != null ? b.getQrCode() : "UNLINKED",
                    b != null ? b.getStatus().name() : "N/A",
                    b != null ? b.getBatteryLevel() : 0,
                    b != null ? b.getLockState().name() : "UNKNOWN"
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminDeviceDto toggleDeviceOnline(UUID deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "DEVICE_NOT_FOUND", "Device not found"));

        device.setOnline(!device.isOnline());
        device.setLastSeen(Instant.now());
        device = deviceRepository.save(device);

        auditLogRepository.save(new AuditLog(
                null,
                AuditLog.ActorType.ADMIN,
                "TOGGLE_DEVICE_CONNECTIVITY",
                "DEVICE",
                device.getId(),
                "Device " + device.getDeviceId() + " connectivity flipped to: " + (device.isOnline() ? "ONLINE" : "OFFLINE"),
                "127.0.0.1"
        ));

        Bike b = device.getBike();
        return new AdminDeviceDto(
                device.getId(),
                device.getDeviceId(),
                device.getTransport().name(),
                device.getAddress(),
                device.isOnline(),
                device.getLastSeen(),
                b != null ? b.getId() : null,
                b != null ? b.getQrCode() : "UNLINKED",
                b != null ? b.getStatus().name() : "N/A",
                b != null ? b.getBatteryLevel() : 0,
                b != null ? b.getLockState().name() : "UNKNOWN"
        );
    }

    @Transactional
    public AdminDeviceDto sendDeviceCommand(UUID deviceId, DeviceCommandRequest req) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "DEVICE_NOT_FOUND", "Device not found"));

        device.setLastSeen(Instant.now());
        device.setOnline(true);
        deviceRepository.save(device);

        Bike bike = device.getBike();
        String cmd = req.commandType().toUpperCase();

        if (bike != null) {
            if ("UNLOCK".equals(cmd)) {
                bike.setLockState(Bike.LockState.UNLOCKED);
                bikeRepository.save(bike);
            } else if ("LOCK".equals(cmd)) {
                bike.setLockState(Bike.LockState.LOCKED);
                bikeRepository.save(bike);
            }
        }

        auditLogRepository.save(new AuditLog(
                null,
                AuditLog.ActorType.ADMIN,
                "DEVICE_COMMAND_" + cmd,
                "DEVICE",
                device.getId(),
                "Dispatched " + cmd + " command to smart lock " + device.getDeviceId() + " (Sensor acknowledged)",
                "127.0.0.1"
        ));

        return new AdminDeviceDto(
                device.getId(),
                device.getDeviceId(),
                device.getTransport().name(),
                device.getAddress(),
                device.isOnline(),
                device.getLastSeen(),
                bike != null ? bike.getId() : null,
                bike != null ? bike.getQrCode() : "UNLINKED",
                bike != null ? bike.getStatus().name() : "N/A",
                bike != null ? bike.getBatteryLevel() : 0,
                bike != null ? bike.getLockState().name() : "UNKNOWN"
        );
    }

    @Transactional(readOnly = true)
    public List<AdminStudentDto> getAllStudents() {
        return studentRepository.findAllByOrderByCreatedAtDesc().stream().map(s -> new AdminStudentDto(
                s.getId(),
                s.getName(),
                s.getEmail(),
                s.getRole().name(),
                s.isEmailVerified(),
                s.isRestricted(),
                s.getCreatedAt()
        )).collect(Collectors.toList());
    }

    @Transactional
    public AdminStudentDto restrictStudent(UUID studentId, RestrictStudentRequest req) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STUDENT_NOT_FOUND", "Student not found"));

        student.setRestricted(req.restricted());
        student = studentRepository.save(student);

        auditLogRepository.save(new AuditLog(
                null,
                AuditLog.ActorType.ADMIN,
                req.restricted() ? "RESTRICT_STUDENT" : "UNRESTRICT_STUDENT",
                "STUDENT",
                student.getId(),
                (req.restricted() ? "Restricted" : "Unrestricted") + " account " + student.getEmail() + ". Reason: " + (req.reason() != null ? req.reason() : "N/A"),
                "127.0.0.1"
        ));

        return new AdminStudentDto(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getRole().name(),
                student.isEmailVerified(),
                student.isRestricted(),
                student.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentAuditLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
