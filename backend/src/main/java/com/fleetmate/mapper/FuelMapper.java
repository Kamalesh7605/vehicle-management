package com.fleetmate.mapper;

import com.fleetmate.dto.FuelResponse;
import com.fleetmate.entity.FuelRecord;

public final class FuelMapper {

    private FuelMapper() {
    }

    public static FuelResponse toResponse(FuelRecord f) {
        return new FuelResponse(f.id, f.vehicle.id, f.vehicle.vehicleNumber, f.fuelDate, f.fuelType, f.quantity,
                f.pricePerLitre, f.totalAmount, f.odometer, f.fuelStation, f.notes);
    }
}
