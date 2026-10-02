package com.fleetmate.dto;

import com.fleetmate.entity.FuelType;
import com.fleetmate.entity.VehicleStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record VehicleRequest(
        @NotBlank(message = "Vehicle number is required") @Size(max = 30) String vehicleNumber,
        @Size(max = 50) String vehicleType,
        @Size(max = 100) String manufacturer,
        @Size(max = 100) String model,
        @Min(value = 1950, message = "Year must be 1950 or later") @Max(value = 2100, message = "Invalid year") Integer manufacturingYear,
        @NotNull(message = "Fuel type is required") FuelType fuelType,
        LocalDate registrationDate,
        @PositiveOrZero(message = "Odometer cannot be negative") Long currentOdometer,
        VehicleStatus status) {
}
