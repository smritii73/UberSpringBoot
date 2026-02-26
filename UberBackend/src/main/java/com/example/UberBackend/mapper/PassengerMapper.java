package com.example.UberBackend.mapper;

import com.example.UberBackend.dto.PassengerRequestDto;
import com.example.UberBackend.dto.PassengerResponseDto;
import com.example.UberBackend.entity.Passenger;
import org.springframework.stereotype.Component;

@Component
public class PassengerMapper {

    public Passenger toEntity(PassengerRequestDto request) {
        return Passenger.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .build();
    }

    public PassengerResponseDto toResponse(Passenger passenger) {
        return PassengerResponseDto.builder()
                .id(passenger.getId())
                .name(passenger.getName())
                .email(passenger.getEmail())
                .phoneNumber(passenger.getPhoneNumber())
                .createdAt(passenger.getCreatedAt())
                .updatedAt(passenger.getUpdatedAt())
                .build();
    }

    public void updateEntity(Passenger passenger, PassengerRequestDto request) {
        passenger.setName(request.getName());
        passenger.setEmail(request.getEmail());
        passenger.setPhoneNumber(request.getPhoneNumber());
    }
}