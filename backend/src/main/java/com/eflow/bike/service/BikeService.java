package com.eflow.bike.service;

import com.eflow.bike.dto.BikeResponse;
import com.eflow.bike.entity.Bike;
import com.eflow.bike.repository.BikeRepository;
import com.eflow.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class BikeService {

    private final BikeRepository bikeRepository;

    public BikeService(BikeRepository bikeRepository) {
        this.bikeRepository = bikeRepository;
    }

    @Transactional(readOnly = true)
    public BikeResponse getBikeById(UUID id) {
        Bike bike = bikeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BIKE_NOT_FOUND", "Bike not found"));

        return new BikeResponse(
                bike.getId(),
                bike.getQrCode(),
                bike.getStand() != null ? bike.getStand().getId() : null,
                bike.getStand() != null ? bike.getStand().getName() : null,
                bike.getStatus().name(),
                bike.getBatteryLevel(),
                bike.getLockState().name()
        );
    }
}
