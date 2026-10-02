package com.fleetmate.dto;

import com.fleetmate.entity.FuelType;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FuelResponse(
        Long id,
        Long vehicleId,
        String vehicleNumber,
        LocalDate date,
        FuelType fuelType,
        BigDecimal quantity,
        BigDecimal pricePerLitre,
        BigDecimal totalAmount,
        Long odometer,
        String fuelStation,
        String notes) {
}
