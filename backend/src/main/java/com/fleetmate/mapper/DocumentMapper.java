package com.fleetmate.mapper;

import com.fleetmate.dto.DocumentResponse;
import com.fleetmate.entity.Document;
import com.fleetmate.entity.DocumentStatus;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class DocumentMapper {

    private DocumentMapper() {
    }

    public static DocumentResponse toResponse(Document d, LocalDate today, int soonDays) {
        return new DocumentResponse(d.id, d.documentType,
                d.vehicle == null ? null : d.vehicle.id, d.vehicle == null ? null : d.vehicle.vehicleNumber,
                d.driver == null ? null : d.driver.id, d.driver == null ? null : d.driver.name,
                d.documentNumber, d.issueDate, d.expiryDate, DocumentStatus.of(d.expiryDate, today, soonDays),
                ChronoUnit.DAYS.between(today, d.expiryDate), d.notes, d.fileName, d.filePath != null);
    }
}
