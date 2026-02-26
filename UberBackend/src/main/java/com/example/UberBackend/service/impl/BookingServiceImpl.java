package com.example.UberBackend.service.impl;

import com.example.UberBackend.client.GrpcClient;
import com.example.UberBackend.dto.BookingRequestDto;
import com.example.UberBackend.dto.BookingResponseDto;
import com.example.UberBackend.dto.DriverLocationDto;
import com.example.UberBackend.entity.Booking;
import com.example.UberBackend.entity.BookingStatus;
import com.example.UberBackend.entity.Driver;
import com.example.UberBackend.entity.Passenger;
import com.example.UberBackend.mapper.BookingMapper;
import com.example.UberBackend.repository.BookingRepository;
import com.example.UberBackend.repository.DriverRepository;
import com.example.UberBackend.repository.PassengerRepository;
import com.example.UberBackend.service.IBookingService;
import com.example.UberBackend.service.ILocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements IBookingService {

    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;
    private final DriverRepository driverRepository;
    private final ILocationService locationService;
    private final BookingMapper bookingMapper;
    private final GrpcClient grpcClient;

    @Override
    @Transactional(readOnly = true)
    public Optional<BookingResponseDto> findById(Long id) {
        return bookingRepository.findById(id)
                .map(bookingMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDto> findAll() {
        return bookingRepository.findAll().stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDto> findByPassengerId(Long passengerId) {
        Passenger passenger = passengerRepository.findById(passengerId)
                .orElseThrow(() -> new IllegalArgumentException("Passenger not found with id: " + passengerId));
        return bookingRepository.findByPassenger(passenger).stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDto> findByDriverId(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found with id: " + driverId));
        return bookingRepository.findByDriver(driver).stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponseDto create(BookingRequestDto request) {
        // Validate and fetch passenger.
        Passenger passenger = passengerRepository.findById(request.getPassengerId())
                .orElseThrow(() -> new IllegalArgumentException("Passenger not found with id: " + request.getPassengerId()));

        //Handle driver assignment if provided
        Driver driver = null;
        BookingStatus bookingStatus = BookingStatus.PENDING;


        if(request.getDriverId() != null) {
            driver = driverRepository.findById(request.getDriverId())
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found with id: " + request.getDriverId()));

            // Check if driver is avaialable
            if(!driver.getIsAvailable()) {
                throw new IllegalArgumentException("Driver with id "+ request.getDriverId() +" is not available");
            }

            //Assign driver and mark as unavailable
            driver.setIsAvailable(false);
            driverRepository.save(driver);
            bookingStatus = BookingStatus.CONFIRMED;
        }

        // Convert latitude/longitude from Double to String
        String pickupLat = request.getPickupLocationLatitude() != null ?
                request.getPickupLocationLatitude().toString() : null ;

        String pickupLng = request.getPickupLocationLongitude() != null ?
                request.getPickupLocationLongitude().toString() : null;

        // Set default fare if not provided
        BigDecimal fare = request.getFare();
        if(fare == null) {
            fare = BigDecimal.ZERO;
        }

        // Create booking
        Booking booking = Booking.builder()
                .passenger(passenger)
                .driver(driver)
                .pickupLocationLongitude(pickupLat)
                .pickupLocationLatitude(pickupLng)
                .dropoffLocation(request.getDropoffLocation())
                .status(bookingStatus)
                .fare(fare)
                .scheduledPickupTime(request.getScheduledPickupTime())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // Find the nearby drivers and then trigger an rpc to ubersocketservice to notify them
        List<DriverLocationDto> nearByDrivers = locationService.getNearByDrivers(Double.parseDouble(pickupLat),
                Double.parseDouble(pickupLng),10.0);

        grpcClient.notifyDriversForNewRide(pickupLat,pickupLng,savedBooking.getId(),nearByDrivers.stream()
                  .map(DriverLocationDto::getDriverId).collect(Collectors.toList()));
        return bookingMapper.toResponse(savedBooking);
    }

    @Override
    public BookingResponseDto update(Long id, BookingRequestDto request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + id));

        Passenger passenger = passengerRepository.findById(request.getPassengerId())
                .orElseThrow(() -> new IllegalArgumentException("Passenger not found with id: " + request.getPassengerId()));

        Driver driver = null;
        if (request.getDriverId() != null) {
            driver = driverRepository.findById(request.getDriverId())
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found with id: " + request.getDriverId()));
        }

        // Handle driver availability when updating
        Driver previousDriver = booking.getDriver();
        if (previousDriver != null && !previousDriver.equals(driver)) {
            previousDriver.setIsAvailable(true);
            driverRepository.save(previousDriver);
        }

        if (driver != null && !driver.equals(previousDriver)) {
            if (!driver.getIsAvailable()) {
                throw new IllegalArgumentException("Driver with id " + request.getDriverId() + " is not available");
            }
            driver.setIsAvailable(false);
            driverRepository.save(driver);
        }

        bookingMapper.updateEntity(booking, request, passenger, driver);
        Booking updatedBooking = bookingRepository.save(booking);
        return bookingMapper.toResponse(updatedBooking);
    }

    @Override
    public BookingResponseDto updateStatus(Long id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + id));

        booking.setStatus(status);

        // Handle status-specific logic
        if (status == BookingStatus.IN_PROGRESS && booking.getActualPickupTime() == null) {
            booking.setActualPickupTime(LocalDateTime.now());
        } else if (status == BookingStatus.COMPLETED) {
            booking.setCompletedAt(LocalDateTime.now());
            // Release driver
            if (booking.getDriver() != null) {
                Driver driver = booking.getDriver();
                driver.setIsAvailable(true);
                driverRepository.save(driver);
            }
        } else if (status == BookingStatus.CANCELLED) {
            // Release driver
            if (booking.getDriver() != null) {
                Driver driver = booking.getDriver();
                driver.setIsAvailable(true);
                driverRepository.save(driver);
            }
        }

        Booking updatedBooking = bookingRepository.save(booking);
        return bookingMapper.toResponse(updatedBooking);
    }

    @Override
    public Boolean acceptRide(Long id, Long driverId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + id));

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(()-> new IllegalArgumentException("Driver not found with id: " + driverId));

        booking.setDriver(driver);
        driver.setIsAvailable(false);
        driverRepository.save(driver);
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);
        return true;
    }

    @Override
    public void deleteById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + id));

        // Release driver if assigned
        if (booking.getDriver() != null) {
            Driver driver = booking.getDriver();
            driver.setIsAvailable(true);
            driverRepository.save(driver);
        }

        bookingRepository.deleteById(id);
    }
}