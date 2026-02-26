package com.example.UberSocketService.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RideAcceptanceDto {
    private Long driverId;
    private Long bookingId;
}