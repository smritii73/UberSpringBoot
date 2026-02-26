package com.example.UberSocketService.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RideRequestDto {

    private String pickUpLocationLatitude;
    private String pickUpLocationLongitude;
    private Long bookingId;
    private List<Long> driverIds;
}