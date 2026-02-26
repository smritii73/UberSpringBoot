package com.example.UberBackend.service.impl;

import com.example.UberBackend.dto.DriverRequestDto;
import com.example.UberBackend.dto.DriverResponseDto;
import com.example.UberBackend.entity.Driver;
import com.example.UberBackend.mapper.DriverMapper;
import com.example.UberBackend.repository.DriverRepository;
import com.example.UberBackend.service.IDriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DriverServiceImpl implements IDriverService {

    private final DriverRepository driverRepository;
    private final DriverMapper driverMapper;

    @Override
    @Transactional(readOnly = true)
    public Optional<DriverResponseDto> findById(Long id) {
        return driverRepository.findById(id)
                .map(driverMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverResponseDto> findAll() {
        return driverRepository.findAll().stream()
                .map(driverMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DriverResponseDto> findByEmail(String email) {
        return driverRepository.findByEmail(email)
                .map(driverMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverResponseDto> findAvailableDrivers() {
        return driverRepository.findAll().stream()
                .filter(Driver::getIsAvailable)
                .map(driverMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DriverResponseDto create(DriverRequestDto request) {
        if (driverRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Driver with email " + request.getEmail() + " already exists");
        }
        if (driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new IllegalArgumentException("Driver with license number " + request.getLicenseNumber() + " already exists");
        }

        Driver driver = driverMapper.toEntity(request);
        Driver savedDriver = driverRepository.save(driver);
        return driverMapper.toResponse(savedDriver);
    }

    @Override
    public DriverResponseDto update(Long id, DriverRequestDto request) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found with id: " + id));

        // Check if email is being changed and if new email already exists
        if (!driver.getEmail().equals(request.getEmail()) &&
                driverRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Driver with email " + request.getEmail() + " already exists");
        }

        // Check if license number is being changed and if new license already exists
        if (!driver.getLicenseNumber().equals(request.getLicenseNumber()) &&
                driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new IllegalArgumentException("Driver with license number " + request.getLicenseNumber() + " already exists");
        }

        driverMapper.updateEntity(driver, request);
        Driver updatedDriver = driverRepository.save(driver);
        return driverMapper.toResponse(updatedDriver);
    }

    @Override
    public void deleteById(Long id) {
        if (!driverRepository.existsById(id)) {
            throw new IllegalArgumentException("Driver not found with id: " + id);
        }
        driverRepository.deleteById(id);
    }
}