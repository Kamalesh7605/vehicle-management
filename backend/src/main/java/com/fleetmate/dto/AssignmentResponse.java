package com.fleetmate.dto;

import java.time.LocalDate;

public record AssignmentResponse(
        Long id,
        Long vehicleId,
        String vehicleNumber,
        Long driverId,
        String driverName,
        LocalDate startDate,
        LocalDate endDate,
        boolean current) {
}
