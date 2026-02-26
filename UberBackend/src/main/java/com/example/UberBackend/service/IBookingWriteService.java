package com.example.UberBackend.service;

import com.example.UberBackend.dto.BookingRequestDto;
import com.example.UberBackend.dto.BookingResponseDto;
import com.example.UberBackend.entity.BookingStatus;

/**
 * Interface for Booking write operations
 * Following Interface Segregation Principle
 */
public interface IBookingWriteService {
    BookingResponseDto create(BookingRequestDto request);
    BookingResponseDto update(Long id, BookingRequestDto request);
    BookingResponseDto updateStatus(Long id, BookingStatus status);
    Boolean acceptRide(Long id,Long driverId);
    void deleteById(Long id);
}