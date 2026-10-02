package com.fleetmate.dto;

import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DocumentType;
import java.time.LocalDate;

public record DocumentResponse(
        Long id,
        DocumentType documentType,
        Long vehicleId,
        String vehicleNumber,
        Long driverId,
        String driverName,
        String documentNumber,
        LocalDate issueDate,
        LocalDate expiryDate,
        DocumentStatus status,
        long daysRemaining,
        String notes,
        String fileName,
        boolean hasFile) {
}
