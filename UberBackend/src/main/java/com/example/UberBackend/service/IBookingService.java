package com.example.UberBackend.service;

/**
 * Main service interface for Booking operations
 * Extends both read and write interfaces
 * Following Dependency Inversion Principle
 */
public interface IBookingService extends IBookingReadService, IBookingWriteService {
}