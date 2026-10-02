package com.fleetmate.dto;

import java.math.BigDecimal;

/** mileage is null when it cannot be calculated reliably; message then explains why. */
public record MileageInfo(BigDecimal mileage, Long distanceKm, BigDecimal fuelUsedLitres, String message) {
}
