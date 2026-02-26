package com.example.UberBackend.service;

import com.example.UberBackend.dto.DriverRequestDto;
import com.example.UberBackend.dto.DriverResponseDto;

/**
 * Interface for Driver write operations
 * Following Interface Segregation Principle
 */
public interface IDriverWriteService {
    DriverResponseDto create(DriverRequestDto request);
    DriverResponseDto update(Long id, DriverRequestDto request);
    void deleteById(Long id);
}