package com.example.UberBackend.service;

import com.example.UberBackend.dto.PassengerResponseDto;

import java.util.List;
import java.util.Optional;

/**
 * Interface for Passenger read operations
 * Following Interface Segregation Principle
 */
public interface IPassengerReadService {
    Optional<PassengerResponseDto> findById(Long id);
    List<PassengerResponseDto> findAll();
    Optional<PassengerResponseDto> findByEmail(String email);
}