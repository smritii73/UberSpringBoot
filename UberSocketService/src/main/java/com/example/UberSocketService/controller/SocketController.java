package com.example.UberSocketService.controller;

import com.example.UberSocketService.dto.RideAcceptanceDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
@RequiredArgsConstructor
public class SocketController {

    @MessageMapping("/ride-acceptance")
    public void recieveRideAcceptance(RideAcceptanceDto rideAcceptanceDto) {
        //Todo : Send an api to booking service to update the booking status
    }
}