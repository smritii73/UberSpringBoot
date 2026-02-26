package com.example.UberBackend.service;

import com.example.UberBackend.dto.DriverLocationDto;

import java.util.List;

public interface ILocationService {
    Boolean saveDriverLocation(Long driverId ,Double latitude , Double longitude);
    List<DriverLocationDto> getNearByDrivers(Double latitude , Double longtitude , Double radius);
}