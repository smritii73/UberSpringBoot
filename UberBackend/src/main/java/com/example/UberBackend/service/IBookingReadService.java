package com.example.UberBackend.service;

import com.example.UberBackend.dto.BookingResponseDto;

import java.util.List;
import java.util.Optional;

/**
 * Interface for Booking read operations
 * Following Interface Segregation Principle
 */
public interface IBookingReadService {
    Optional<BookingResponseDto> findById(Long id);
    List<BookingResponseDto> findAll();
    List<BookingResponseDto> findByPassengerId(Long passengerId);
    List<BookingResponseDto> findByDriverId(Long driverId);
}