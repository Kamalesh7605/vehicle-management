package com.fleetmate.dto;

import com.fleetmate.entity.MaintenanceType;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * currentKm and remainingKm are only filled on the vehicle's latest record that has a next-service target,
 * so older records do not show a misleading "overdue".
 */
public record MaintenanceResponse(
        Long id,
        Long vehicleId,
        String vehicleNumber,
        LocalDate date,
        MaintenanceType maintenanceType,
        String description,
        Long odometer,
        BigDecimal cost,
        Long nextServiceKm,
        Long currentKm,
        Long remainingKm,
        String notes) {
}
