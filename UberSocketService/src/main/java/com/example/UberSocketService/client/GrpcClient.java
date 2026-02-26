package com.example.UberSocketService.client;

import com.example.UberSocketService.RideAcceptanceRequest;
import com.example.UberSocketService.RideAcceptanceResponse;
import com.example.UberSocketService.RideServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component // when we want springboot to maintain its lifecycle
public class GrpcClient {

    @Value("${grpc.server.port:9090}")
    private int grpcServerPort;

    @Value("${grpc.server.host:localhost}")
    private String grpcServerHost;

    private ManagedChannel channel;

    private RideServiceGrpc.RideServiceBlockingStub blockingStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder.forAddress(grpcServerHost, grpcServerPort)
                .usePlaintext().build();
        blockingStub = RideServiceGrpc.newBlockingStub(channel);
    }

    public boolean acceptRide(Long bookingId, Long driverId){
        RideAcceptanceRequest request = RideAcceptanceRequest.newBuilder()
                .setBookingId(bookingId)
                .setDriverId(driverId)
                .build();

        RideAcceptanceResponse response = blockingStub.acceptRide(request);
        return response.getSuccess();
    }

}