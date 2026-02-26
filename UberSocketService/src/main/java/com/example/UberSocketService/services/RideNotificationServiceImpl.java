package com.example.UberSocketService.services;

import com.example.UberSocketService.RideNotificationRequest;
import com.example.UberSocketService.RideNotificationResponse;
import com.example.UberSocketService.RideNotificationServiceGrpc;
import com.example.UberSocketService.dto.RideRequestDto;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class RideNotificationServiceImpl extends RideNotificationServiceGrpc.RideNotificationServiceImplBase {

    private final SocketService socketService;

    @Override
    public void notifyDriversForNewRide(RideNotificationRequest request, StreamObserver<RideNotificationResponse> responseObserver) {
        RideRequestDto rideRequestDto = RideRequestDto.builder()
                .pickUpLocationLatitude(request.getPickUpLocationLatitude())
                .pickUpLocationLongitude(request.getPickUpLocationLongitude())
                .bookingId(request.getBookingId())
                .driverIds(request.getDriverIdsList())
                .build();



        socketService.notifyDriversForNewRide(rideRequestDto);
        responseObserver.onNext(RideNotificationResponse.newBuilder().setSuccess(true).build());
        responseObserver.onCompleted();

    }

}
