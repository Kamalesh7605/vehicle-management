package com.fleetmate.mapper;

import com.fleetmate.dto.DriverResponse;
import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.Driver;
import com.fleetmate.entity.Vehicle;
import java.time.LocalDate;

public final class DriverMapper {

    private DriverMapper() {
    }

    public static DriverResponse toResponse(Driver d, Vehicle assignedVehicle, LocalDate today, int soonDays) {
        return new DriverResponse(d.id, d.name, d.phone, d.address, d.licenceNumber, d.licenceType, d.licenceExpiry,
                DocumentStatus.of(d.licenceExpiry, today, soonDays), d.joiningDate, d.salary, d.status,
                assignedVehicle == null ? null : assignedVehicle.id,
                assignedVehicle == null ? null : assignedVehicle.vehicleNumber);
    }
}
