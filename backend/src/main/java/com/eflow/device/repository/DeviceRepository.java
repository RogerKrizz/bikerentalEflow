package com.eflow.device.repository;

import com.eflow.bike.entity.Bike;
import com.eflow.device.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeviceRepository extends JpaRepository<Device, UUID> {
    Optional<Device> findByBike(Bike bike);
    Optional<Device> findByDeviceId(String deviceId);
    boolean existsByDeviceId(String deviceId);
    long countByOnlineTrue();
    long countByOnlineFalse();
    List<Device> findAllByOrderByDeviceIdAsc();
}
