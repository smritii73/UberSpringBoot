package com.example.UberBackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NearByDriversRequestDto {

    private Double latitude;
    private Double longitude;
    private Double radius;
}