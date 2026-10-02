package com.fleetmate.mapper;

import com.fleetmate.dto.AssignmentResponse;
import com.fleetmate.entity.VehicleDriverAssignment;

public final class AssignmentMapper {

    private AssignmentMapper() {
    }

    public static AssignmentResponse toResponse(VehicleDriverAssignment a) {
        return new AssignmentResponse(a.id, a.vehicle.id, a.vehicle.vehicleNumber, a.driver.id, a.driver.name,
                a.startDate, a.endDate, a.endDate == null);
    }
}
