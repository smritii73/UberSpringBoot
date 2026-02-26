package com.example.UberBackend.controller;

import com.example.UberBackend.dto.PassengerRequestDto;
import com.example.UberBackend.dto.PassengerResponseDto;
import com.example.UberBackend.service.IPassengerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/passengers")
@RequiredArgsConstructor
public class PassengerController {

    private final IPassengerService passengerService;

    @GetMapping
    public ResponseEntity<List<PassengerResponseDto>> getAllPassengers() {
        List<PassengerResponseDto> passengers = passengerService.findAll();
        return ResponseEntity.ok(passengers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> getPassengerById(@PathVariable Long id) {
        return passengerService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<PassengerResponseDto> getPassengerByEmail(@PathVariable String email) {
        return passengerService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PassengerResponseDto> createPassenger(@Valid @RequestBody PassengerRequestDto request) {
        try {
            PassengerResponseDto passenger = passengerService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(passenger);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> updatePassenger(
            @PathVariable Long id,
            @Valid @RequestBody PassengerRequestDto request) {
        try {
            PassengerResponseDto passenger = passengerService.update(id, request);
            return ResponseEntity.ok(passenger);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePassenger(@PathVariable Long id) {
        try {
            passengerService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}