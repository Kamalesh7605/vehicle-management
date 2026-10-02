package com.fleetmate.dto;

import com.fleetmate.entity.MaintenanceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceRequest(
        @NotNull(message = "Vehicle is required") Long vehicleId,
        @NotNull(message = "Date is required") LocalDate date,
        @NotNull(message = "Maintenance type is required") MaintenanceType maintenanceType,
        @Size(max = 500) String description,
        @PositiveOrZero(message = "Odometer cannot be negative") Long odometer,
        @NotNull(message = "Cost is required") @PositiveOrZero(message = "Cost cannot be negative") BigDecimal cost,
        @PositiveOrZero(message = "Next service KM cannot be negative") Long nextServiceKm,
        @Size(max = 500) String notes,
        Boolean allowInactive) {
}
