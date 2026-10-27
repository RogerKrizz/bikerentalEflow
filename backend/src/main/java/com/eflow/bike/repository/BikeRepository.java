package com.eflow.bike.repository;

import com.eflow.bike.entity.Bike;
import com.eflow.stand.entity.Stand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BikeRepository extends JpaRepository<Bike, UUID> {
    List<Bike> findByStandAndStatus(Stand stand, Bike.Status status);
    List<Bike> findByStand(Stand stand);
    long countByStandAndStatus(Stand stand, Bike.Status status);
    long countByStatus(Bike.Status status);
    List<Bike> findAllByOrderByQrCodeAsc();
    Optional<Bike> findByQrCode(String qrCode);
    boolean existsByQrCode(String qrCode);
}
