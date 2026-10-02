package com.fleetmate.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/** driverId = null unassigns the current driver of the vehicle. */
public record AssignmentRequest(
        @NotNull(message = "Vehicle is required") Long vehicleId,
        Long driverId,
        LocalDate startDate) {
}
