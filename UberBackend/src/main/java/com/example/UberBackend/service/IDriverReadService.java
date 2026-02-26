package com.example.UberBackend.service;

import com.example.UberBackend.dto.DriverResponseDto;

import java.util.List;
import java.util.Optional;

/**
 * Interface for Driver read operations
 * Following Interface Segregation Principle
 */
public interface IDriverReadService {
    Optional<DriverResponseDto> findById(Long id);
    List<DriverResponseDto> findAll();
    Optional<DriverResponseDto> findByEmail(String email);
    List<DriverResponseDto> findAvailableDrivers();
}