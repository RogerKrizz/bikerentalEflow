package com.eflow.stand.service;

import com.eflow.bike.dto.BikeResponse;
import com.eflow.bike.entity.Bike;
import com.eflow.bike.repository.BikeRepository;
import com.eflow.common.exception.ApiException;
import com.eflow.common.util.HaversineUtil;
import com.eflow.stand.dto.StandResponse;
import com.eflow.stand.entity.Stand;
import com.eflow.stand.repository.StandRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StandService {

    private final StandRepository standRepository;
    private final BikeRepository bikeRepository;

    public StandService(StandRepository standRepository, BikeRepository bikeRepository) {
        this.standRepository = standRepository;
        this.bikeRepository = bikeRepository;
    }

    @Transactional(readOnly = true)
    public List<StandResponse> getAllStands(Double userLat, Double userLng) {
        List<Stand> stands = standRepository.findByActiveTrue();

        return stands.stream().map(stand -> {
            long available = bikeRepository.countByStandAndStatus(stand, Bike.Status.AVAILABLE);
            long inUse = bikeRepository.countByStandAndStatus(stand, Bike.Status.IN_USE);
            long maintenance = bikeRepository.countByStandAndStatus(stand, Bike.Status.MAINTENANCE);

            Double distance = null;
            if (userLat != null && userLng != null) {
                distance = HaversineUtil.distanceMeters(
                        userLat, userLng,
                        stand.getLatitude().doubleValue(),
                        stand.getLongitude().doubleValue()
                );
            }

            return new StandResponse(
                    stand.getId(),
                    stand.getName(),
                    stand.getLatitude(),
                    stand.getLongitude(),
                    stand.getCapacity(),
                    stand.getReturnRadiusMeters(),
                    stand.isActive(),
                    available,
                    inUse,
                    maintenance,
                    distance
            );
        }).sorted((s1, s2) -> {
            if (s1.distanceMeters() != null && s2.distanceMeters() != null) {
                return Double.compare(s1.distanceMeters(), s2.distanceMeters());
            }
            return s1.name().compareToIgnoreCase(s2.name());
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StandResponse getStandById(UUID id, Double userLat, Double userLng) {
        Stand stand = standRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STAND_NOT_FOUND", "Stand not found"));

        long available = bikeRepository.countByStandAndStatus(stand, Bike.Status.AVAILABLE);
        long inUse = bikeRepository.countByStandAndStatus(stand, Bike.Status.IN_USE);
        long maintenance = bikeRepository.countByStandAndStatus(stand, Bike.Status.MAINTENANCE);

        Double distance = null;
        if (userLat != null && userLng != null) {
            distance = HaversineUtil.distanceMeters(
                    userLat, userLng,
                    stand.getLatitude().doubleValue(),
                    stand.getLongitude().doubleValue()
            );
        }

        return new StandResponse(
                stand.getId(),
                stand.getName(),
                stand.getLatitude(),
                stand.getLongitude(),
                stand.getCapacity(),
                stand.getReturnRadiusMeters(),
                stand.isActive(),
                available,
                inUse,
                maintenance,
                distance
        );
    }

    @Transactional(readOnly = true)
    public List<BikeResponse> getBikesAtStand(UUID standId) {
        Stand stand = standRepository.findById(standId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STAND_NOT_FOUND", "Stand not found"));

        List<Bike> bikes = bikeRepository.findByStandAndStatus(stand, Bike.Status.AVAILABLE);

        return bikes.stream().map(b -> new BikeResponse(
                b.getId(),
                b.getQrCode(),
                stand.getId(),
                stand.getName(),
                b.getStatus().name(),
                b.getBatteryLevel(),
                b.getLockState().name()
        )).collect(Collectors.toList());
    }
}
