package com.example.UberBackend.mapper;

import com.example.UberBackend.dto.BookingRequestDto;
import com.example.UberBackend.dto.BookingResponseDto;
import com.example.UberBackend.entity.Booking;
import com.example.UberBackend.entity.BookingStatus;
import com.example.UberBackend.entity.Driver;
import com.example.UberBackend.entity.Passenger;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public Booking toEntity(BookingRequestDto request, Passenger passenger, Driver driver) {
        BookingStatus status = driver != null ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

        return Booking.builder()
                .passenger(passenger)
                .driver(driver)
                .pickupLocationLongitude( Double.toString(request.getPickupLocationLongitude()))
                .pickupLocationLatitude(Double.toString(request.getPickupLocationLatitude()))
                .dropoffLocation(request.getDropoffLocation())
                .fare(request.getFare())
                .status(status)
                .scheduledPickupTime(request.getScheduledPickupTime())
                .build();
    }

    public BookingResponseDto toResponse(Booking booking) {
        return BookingResponseDto.builder()
                .id(booking.getId())
                .passengerId(booking.getPassenger() != null ? booking.getPassenger().getId() : null)
                .passengerName(booking.getPassenger() != null ? booking.getPassenger().getName() : null)
                .driverId(booking.getDriver() != null ? booking.getDriver().getId() : null)
                .driverName(booking.getDriver() != null ? booking.getDriver().getName() : null)

                .dropoffLocation(booking.getDropoffLocation())
                .status(booking.getStatus())
                .fare(booking.getFare())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .scheduledPickupTime(booking.getScheduledPickupTime())
                .actualPickupTime(booking.getActualPickupTime())
                .completedAt(booking.getCompletedAt())
                .build();
    }

    public void updateEntity(Booking booking, BookingRequestDto request, Passenger passenger, Driver driver) {
        booking.setPassenger(passenger);
        booking.setDriver(driver);
        booking.setPickupLocationLatitude(Double.toString(request.getPickupLocationLatitude()));
        booking.setPickupLocationLongitude(Double.toString(request.getPickupLocationLongitude()));
        booking.setDropoffLocation(request.getDropoffLocation());
        booking.setFare(request.getFare());
        booking.setScheduledPickupTime(request.getScheduledPickupTime());

        // Update status based on driver assignment
        if (driver != null && booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.CONFIRMED);
        }
    }
}