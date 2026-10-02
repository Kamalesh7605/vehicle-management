package com.fleetmate.dto;

import com.fleetmate.entity.ExpenseCategory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Vehicle is required") Long vehicleId,
        @NotNull(message = "Date is required") LocalDate date,
        @NotNull(message = "Category is required") ExpenseCategory category,
        @NotNull(message = "Amount is required") @Positive(message = "Amount must be greater than 0") BigDecimal amount,
        @Size(max = 300) String description,
        @Size(max = 500) String notes) {
}
