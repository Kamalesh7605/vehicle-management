package com.fleetmate.dto;

import com.fleetmate.entity.DocumentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Vehicle documents require vehicleId; DRIVING_LICENCE requires driverId. */
public record DocumentRequest(
        @NotNull(message = "Document type is required") DocumentType documentType,
        Long vehicleId,
        Long driverId,
        @Size(max = 100) String documentNumber,
        LocalDate issueDate,
        @NotNull(message = "Expiry date is required") LocalDate expiryDate,
        @Size(max = 500) String notes) {
}
