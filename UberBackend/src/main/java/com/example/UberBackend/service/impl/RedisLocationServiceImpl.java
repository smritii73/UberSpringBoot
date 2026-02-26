package com.example.UberBackend.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResult;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.connection.RedisGeoCommands.GeoLocation;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.example.UberBackend.dto.DriverLocationDto;
import com.example.UberBackend.service.ILocationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RedisLocationServiceImpl implements ILocationService{

    private static final String DRIVER_GEO_OPS_KEY = "driver:geo";

    private final StringRedisTemplate stringRedisTemplate;


    @Override
    public Boolean saveDriverLocation(Long driverId, Double latitude, Double longitude) {
        GeoOperations<String, String> geoOperations = stringRedisTemplate.opsForGeo();

        // FIX: Point expects (longitude, latitude) - longitude first!
        geoOperations.add(DRIVER_GEO_OPS_KEY,
                new RedisGeoCommands.GeoLocation<>(driverId.toString(), new Point(longitude, latitude))
        );
        return true;
    }

    @Override
    public List<DriverLocationDto> getNearByDrivers(Double latitude, Double longitude, Double radius) {
        GeoOperations<String, String> geoOperations = stringRedisTemplate.opsForGeo();

        Distance circleRadius = new Distance(radius, Metrics.KILOMETERS);

        // FIX: Point expects (longitude, latitude) - longitude first!
        Circle circle = new Circle(new Point(longitude, latitude), circleRadius);

        GeoResults<GeoLocation<String>> results = geoOperations.radius(DRIVER_GEO_OPS_KEY, circle);

        List<DriverLocationDto> driverLocations = new ArrayList<>();

        for(GeoResult<GeoLocation<String>> result : results) {
            Point point = geoOperations.position(DRIVER_GEO_OPS_KEY, result.getContent().getName()).getFirst();

            DriverLocationDto driverLocation = DriverLocationDto.builder()
                    .driverId(Long.parseLong(result.getContent().getName()))
                    .latitude(point.getY())   // Y is latitude
                    .longitude(point.getX())  // X is longitude
                    .build();

            driverLocations.add(driverLocation);
        }

        return driverLocations;
    }
}

/**
 * - Booking creation flow
 *
 *  1. User requests a booking with their lat and long coordinate
 *  2. System should create a booking with pending status
 *  3. System should search for nearby drivers within a radius of X kilometers
 *  4. Once found we will raise a request to the drivers UI to check if they want to accept the booking
 *  5. Which ever driver accepts the booking, we will allot that driver to the booking and update the status to confirmed.
 *
 *  Note: During this process, while the drivers are checking the booking, the user should not be blocked, they will get a response
 * of booking is pending.
 */