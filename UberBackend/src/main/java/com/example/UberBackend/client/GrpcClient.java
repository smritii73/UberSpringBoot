package com.example.UberBackend.client;
import com.example.UberSocketService.*;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import java.util.List;

@Component // when we want springboot to maintain its lifecycle
public class GrpcClient {
    @Value("${grpc.client.port:9091}")
    private int grpcClientPort;

    @Value("${grpc.client.host:localhost}")
    private String grpcClientHost;

    private ManagedChannel channel;
    private RideNotificationServiceGrpc.RideNotificationServiceBlockingStub rideNotificationServiceBlockingStub;

    @PostConstruct
    public void init(){
        channel = ManagedChannelBuilder.forAddress(grpcClientHost, grpcClientPort)
                                       .usePlaintext().build();
        rideNotificationServiceBlockingStub = RideNotificationServiceGrpc.newBlockingStub(channel);
    }
    public boolean notifyDriversForNewRide(String pickUpLocationLatitude , String pickUpLocationLongitude,
                                           Long bookingId , List<Long> driverIds){
        RideNotificationRequest request = RideNotificationRequest.newBuilder()
                .setPickUpLocationLatitude(pickUpLocationLatitude)
                .setPickUpLocationLongitude(pickUpLocationLongitude)
                .setBookingId(bookingId)
                .addAllDriverIds(driverIds)
                .build();
        RideNotificationResponse response = rideNotificationServiceBlockingStub.notifyDriversForNewRide(request);
        return response.getSuccess();
    }
}