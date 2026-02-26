package com.example.UberBackend.service.impl;

import com.example.UberBackend.service.IBookingService;
import com.example.UberSocketService.RideAcceptanceRequest;
import com.example.UberSocketService.RideAcceptanceResponse;
import com.example.UberSocketService.RideServiceGrpc;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RideServiceImpl extends RideServiceGrpc.RideServiceImplBase {

    private final IBookingService bookingService;

    public void acceptRide(RideAcceptanceRequest rideAcceptanceRequest, StreamObserver<RideAcceptanceResponse> responseObserver) {

        boolean success = bookingService.acceptRide(rideAcceptanceRequest.getBookingId(), rideAcceptanceRequest.getDriverId());

        RideAcceptanceResponse response = RideAcceptanceResponse
                .newBuilder()
                .setSuccess(success)
                .build();
        responseObserver.onNext(response);
        responseObserver.onCompleted();

    }
}
