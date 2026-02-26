package com.example.UberBackend.dto;

import com.example.UberBackend.entity.BookingStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponseDto {
    private Long id;
    private Long passengerId;
    private String passengerName;
    private Long driverId;
    private String driverName;
    private Double pickupLocationLatitude;
    private Double pickupLocationLongitude;
    private String dropoffLocation;
    private BookingStatus status;
    private BigDecimal fare;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime scheduledPickupTime;
    private LocalDateTime actualPickupTime;
    private LocalDateTime completedAt;
}