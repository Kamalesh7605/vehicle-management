package com.fleetmate.dto;

import com.fleetmate.entity.FuelType;
import com.fleetmate.entity.VehicleStatus;
import java.time.LocalDate;

public record VehicleResponse(
        Long id,
        String vehicleNumber,
        String vehicleType,
        String manufacturer,
        String model,
        Integer manufacturingYear,
        FuelType fuelType,
        LocalDate registrationDate,
        long currentOdometer,
        VehicleStatus status,
        Long assignedDriverId,
        String assignedDriverName) {
}
