package com.fleetmate.dto;

import com.fleetmate.entity.ExpenseCategory;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseResponse(
        Long id,
        Long vehicleId,
        String vehicleNumber,
        LocalDate date,
        ExpenseCategory category,
        BigDecimal amount,
        String description,
        String notes) {
}
