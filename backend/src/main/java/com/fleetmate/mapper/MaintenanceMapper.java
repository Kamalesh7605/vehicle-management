package com.fleetmate.mapper;

import com.fleetmate.dto.MaintenanceResponse;
import com.fleetmate.entity.MaintenanceRecord;

public final class MaintenanceMapper {

    private MaintenanceMapper() {
    }

    public static MaintenanceResponse toResponse(MaintenanceRecord m, Long currentKm, Long remainingKm) {
        return new MaintenanceResponse(m.id, m.vehicle.id, m.vehicle.vehicleNumber, m.maintenanceDate,
                m.maintenanceType, m.description, m.odometer, m.cost, m.nextServiceKm, currentKm, remainingKm,
                m.notes);
    }
}
