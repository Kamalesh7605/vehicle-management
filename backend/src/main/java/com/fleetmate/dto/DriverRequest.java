package com.fleetmate.dto;

import com.fleetmate.entity.DriverStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DriverRequest(
        @NotBlank(message = "Name is required") @Size(max = 100) String name,
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^[+]?[0-9][0-9 -]{6,18}[0-9]$", message = "Enter a valid phone number") String phone,
        @Size(max = 300) String address,
        @NotBlank(message = "Licence number is required") @Size(max = 50) String licenceNumber,
        @Size(max = 50) String licenceType,
        @NotNull(message = "Licence expiry is required") LocalDate licenceExpiry,
        LocalDate joiningDate,
        @PositiveOrZero(message = "Salary cannot be negative") BigDecimal salary,
        DriverStatus status) {
}
