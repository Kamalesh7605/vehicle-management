package com.fleetmate.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardSummary(
        long totalVehicles,
        long activeVehicles,
        long inServiceVehicles,
        long inactiveVehicles,
        long totalDrivers,
        long activeDrivers,
        long inactiveDrivers,
        BigDecimal fuelExpense,
        BigDecimal maintenanceExpense,
        BigDecimal otherExpense,
        BigDecimal totalExpense,
        LocalDate from,
        LocalDate to) {
}
