package com.example.UberBackend.mapper;

import com.example.UberBackend.dto.DriverRequestDto;
import com.example.UberBackend.dto.DriverResponseDto;
import com.example.UberBackend.entity.Driver;
import org.springframework.stereotype.Component;

@Component
public class DriverMapper {

    public Driver toEntity(DriverRequestDto request) {
        return Driver.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .licenseNumber(request.getLicenseNumber())
                .vehicleModel(request.getVehicleModel())
                .vehiclePlateNumber(request.getVehiclePlateNumber())
                .isAvailable(request.getIsAvailable())
                .build();
    }

    public DriverResponseDto toResponse(Driver driver) {
        return DriverResponseDto.builder()
                .id(driver.getId())
                .name(driver.getName())
                .email(driver.getEmail())
                .phoneNumber(driver.getPhoneNumber())
                .licenseNumber(driver.getLicenseNumber())
                .vehicleModel(driver.getVehicleModel())
                .vehiclePlateNumber(driver.getVehiclePlateNumber())
                .isAvailable(driver.getIsAvailable())
                .createdAt(driver.getCreatedAt())
                .updatedAt(driver.getUpdatedAt())
                .build();
    }

    public void updateEntity(Driver driver, DriverRequestDto request) {
        driver.setName(request.getName());
        driver.setEmail(request.getEmail());
        driver.setPhoneNumber(request.getPhoneNumber());
        driver.setLicenseNumber(request.getLicenseNumber());
        driver.setVehicleModel(request.getVehicleModel());
        driver.setVehiclePlateNumber(request.getVehiclePlateNumber());
        driver.setIsAvailable(request.getIsAvailable());
    }
}