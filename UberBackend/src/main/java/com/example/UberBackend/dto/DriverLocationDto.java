package com.example.UberBackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverLocationDto {
    @NotBlank(message = "driverId is required")
    private Long driverId;

    @NotNull(message="latitude is required")
    private Double latitude;

    @NotNull(message="longitude is required")
    private Double longitude;
}