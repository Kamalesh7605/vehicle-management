package com.fleetmate.dto;

import java.math.BigDecimal;

public record VehicleExpenseRow(Long vehicleId, String vehicleNumber, BigDecimal fuel, BigDecimal maintenance,
                                BigDecimal toll, BigDecimal other, BigDecimal total) {
}
