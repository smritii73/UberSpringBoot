package com.example.UberBackend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.UberBackend.dto.DriverLocationDto;
import com.example.UberBackend.dto.NearByDriversRequestDto;
import com.example.UberBackend.service.ILocationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/location")
@RequiredArgsConstructor
public class LocationController {

    private final ILocationService locationService;

    @PostMapping("/driverLocation")
    public ResponseEntity<Boolean> saveDriverLocation(@RequestBody DriverLocationDto driverLocation) {
        Boolean saved = locationService.saveDriverLocation(driverLocation.getDriverId(), driverLocation.getLatitude(), driverLocation.getLongitude());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/nearbyDrivers")
    public ResponseEntity<List<DriverLocationDto>> getNearbyDrivers(@RequestBody NearByDriversRequestDto request) {
        List<DriverLocationDto> nearbyDrivers = locationService.getNearByDrivers(request.getLatitude(), request.getLongitude(), request.getRadius());
        return ResponseEntity.ok(nearbyDrivers);
    }


}