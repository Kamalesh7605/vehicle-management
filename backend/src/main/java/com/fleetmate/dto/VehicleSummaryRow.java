package com.fleetmate.dto;

import java.math.BigDecimal;

public record VehicleSummaryRow(Long vehicleId, String vehicleNumber, long currentOdometer, BigDecimal totalFuel,
                                BigDecimal totalMaintenance, BigDecimal totalExpenses, BigDecimal mileage,
                                String mileageNote) {
}
