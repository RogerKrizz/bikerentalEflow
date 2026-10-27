package com.eflow.stand.controller;

import com.eflow.bike.dto.BikeResponse;
import com.eflow.stand.dto.StandResponse;
import com.eflow.stand.service.StandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stands")
@Tag(name = "Stands", description = "Endpoints for discovering stands and checking live bike availability")
public class StandController {

    private final StandService standService;

    public StandController(StandService standService) {
        this.standService = standService;
    }

    @GetMapping
    @Operation(summary = "Get all active stands with live bike counts (optionally sorted by distance)")
    public ResponseEntity<List<StandResponse>> getStands(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        return ResponseEntity.ok(standService.getAllStands(lat, lng));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stand details by ID")
    public ResponseEntity<StandResponse> getStand(
            @PathVariable UUID id,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        return ResponseEntity.ok(standService.getStandById(id, lat, lng));
    }

    @GetMapping("/{id}/bikes")
    @Operation(summary = "Get available bikes currently at a stand")
    public ResponseEntity<List<BikeResponse>> getBikesAtStand(@PathVariable UUID id) {
        return ResponseEntity.ok(standService.getBikesAtStand(id));
    }
}
