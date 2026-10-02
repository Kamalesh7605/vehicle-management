package com.fleetmate.mapper;

import com.fleetmate.dto.VehicleResponse;
import com.fleetmate.entity.Vehicle;

public final class VehicleMapper {

    private VehicleMapper() {
    }

    public static VehicleResponse toResponse(Vehicle v) {
        return new VehicleResponse(v.id, v.vehicleNumber, v.vehicleType, v.manufacturer, v.model,
                v.manufacturingYear, v.fuelType, v.registrationDate, v.currentOdometer, v.status,
                v.currentDriver == null ? null : v.currentDriver.id,
                v.currentDriver == null ? null : v.currentDriver.name);
    }
}
