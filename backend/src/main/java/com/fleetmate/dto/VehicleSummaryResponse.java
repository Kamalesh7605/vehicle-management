package com.fleetmate.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VehicleSummaryResponse(
        VehicleResponse vehicle,
        BigDecimal totalFuelCost,
        BigDecimal totalMaintenanceCost,
        BigDecimal totalOtherExpenses,
        BigDecimal totalExpenses,
        MileageInfo mileage,
        ServiceInfo service,
        LocalDate driverSince,
        LocalDate lastFuelDate,
        long expiredDocuments,
        long expiringDocuments) {
}
