package com.example.UberBackend.service;

/**
 * Generic interface for write operations
 * Following Interface Segregation Principle
 */
public interface IWriteService<T, ID> {
    T create(T entity);
    T update(ID id, T entity);
    void deleteById(ID id);
}