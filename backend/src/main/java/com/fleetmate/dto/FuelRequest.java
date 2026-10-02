package com.fleetmate.dto;

import com.fleetmate.entity.FuelType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/** totalAmount is optional: when omitted it is calculated as quantity x pricePerLitre. */
public record FuelRequest(
        @NotNull(message = "Vehicle is required") Long vehicleId,
        @NotNull(message = "Date is required") LocalDate date,
        FuelType fuelType,
        @NotNull(message = "Quantity is required") @Positive(message = "Quantity must be greater than 0") BigDecimal quantity,
        @NotNull(message = "Price per litre is required") @PositiveOrZero(message = "Price cannot be negative") BigDecimal pricePerLitre,
        @PositiveOrZero(message = "Amount cannot be negative") BigDecimal totalAmount,
        @PositiveOrZero(message = "Odometer cannot be negative") Long odometer,
        @Size(max = 150) String fuelStation,
        @Size(max = 500) String notes,
        Boolean allowInactive) {
}
