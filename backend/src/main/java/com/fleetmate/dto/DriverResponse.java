package com.fleetmate.dto;

import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DriverStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DriverResponse(
        Long id,
        String name,
        String phone,
        String address,
        String licenceNumber,
        String licenceType,
        LocalDate licenceExpiry,
        DocumentStatus licenceStatus,
        LocalDate joiningDate,
        BigDecimal salary,
        DriverStatus status,
        Long assignedVehicleId,
        String assignedVehicleNumber) {
}
