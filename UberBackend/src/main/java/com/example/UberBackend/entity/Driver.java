package com.example.UberBackend.entity;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver extends BaseModel{

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String licenseNumber;

    private String vehicleModel;

    private String vehiclePlateNumber;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

}