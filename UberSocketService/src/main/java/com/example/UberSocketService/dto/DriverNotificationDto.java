package com.example.UberSocketService.dto;

import lombok.*;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DriverNotificationDto {
    private String pickUpLocationLatitude;
    private String pickUpLocationLongitude;
    private Long bookingId;
}