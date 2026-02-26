package com.example.UberBackend.service;

import com.example.UberBackend.dto.PassengerRequestDto;
import com.example.UberBackend.dto.PassengerResponseDto;

/**
 * Interface for Passenger write operations
 * Following Interface Segregation Principle
 */
public interface IPassengerWriteService {
    PassengerResponseDto create(PassengerRequestDto request);
    PassengerResponseDto update(Long id, PassengerRequestDto request);
    void deleteById(Long id);
}