package com.eflow.bike.controller;

import com.eflow.bike.dto.BikeResponse;
import com.eflow.bike.service.BikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bikes")
@Tag(name = "Bikes", description = "Endpoints for bike status and details")
public class BikeController {

    private final BikeService bikeService;

    public BikeController(BikeService bikeService) {
        this.bikeService = bikeService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bike details and current status")
    public ResponseEntity<BikeResponse> getBike(@PathVariable UUID id) {
        return ResponseEntity.ok(bikeService.getBikeById(id));
    }
}
