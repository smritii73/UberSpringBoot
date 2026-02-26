package com.example.UberBackend.service;

/**
 * Main service interface for Driver operations
 * Extends both read and write interfaces
 * Following Dependency Inversion Principle
 */
public interface IDriverService extends IDriverReadService, IDriverWriteService {
}