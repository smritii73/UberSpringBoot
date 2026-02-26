package com.example.UberSocketService.services;

import com.example.UberSocketService.dto.DriverNotificationDto;
import com.example.UberSocketService.dto.RideRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class SocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyDriversForNewRide(RideRequestDto rideRequestDto) {
        DriverNotificationDto driverNotificationDTO = DriverNotificationDto.builder()
                .pickUpLocationLongitude(rideRequestDto.getPickUpLocationLatitude())
                .pickUpLocationLatitude(rideRequestDto.getPickUpLocationLatitude())
                .bookingId(rideRequestDto.getBookingId())
                .build();

        for(Long driverId : rideRequestDto.getDriverIds()) {
            messagingTemplate.convertAndSend("/topic/new-ride/"+driverId,driverNotificationDTO);
        }
    }
}