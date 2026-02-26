package com.example.UberSocketService.config;


import com.example.UberSocketService.services.RideNotificationServiceImpl;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
@RequiredArgsConstructor
public class GrpcServerConfig {


    @Value("${grpc.server.port:9091}")
    private int grpcServerPort;

    private final RideNotificationServiceImpl rideNotificationServiceImpl;
    private Server server;


    @PostConstruct
    public void startGrpcServer() throws IOException {
        server=ServerBuilder
                .forPort(grpcServerPort)
                .addService(rideNotificationServiceImpl) // register the service
                .build()
                .start();

        System.out.println("gRPC Server started on port "+  grpcServerPort);

        new Thread(()-> {
            try {
                if(server!=null) server.awaitTermination();
            }
            catch(InterruptedException e){
                Thread.currentThread().interrupt();
                System.err.println("gRPC Server interrupted");
            }
        }).start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.err.println("shutting down gRPC Server");
            if(server!=null) server.shutdown();
        }));
    }


}