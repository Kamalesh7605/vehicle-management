package com.fleetmate.service;

import com.fleetmate.config.AlertConfig;
import com.fleetmate.dto.ServiceInfo;
import com.fleetmate.entity.MaintenanceRecord;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.repository.MaintenanceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Optional;

/** Remaining KM = next service KM - current vehicle KM, based on the newest record with a service target. */
@ApplicationScoped
public class ServiceStatusCalculator {

    @Inject
    MaintenanceRepository maintenanceRepository;
    @Inject
    AlertConfig alertConfig;

    public ServiceInfo forVehicle(Vehicle vehicle) {
        Optional<MaintenanceRecord> target = maintenanceRepository.latestWithNextService(vehicle.id);
        var lastDate = maintenanceRepository.latestForVehicle(vehicle.id).map(m -> m.maintenanceDate).orElse(null);
        if (target.isEmpty()) {
            return new ServiceInfo(null, null, lastDate, false);
        }
        long next = target.get().nextServiceKm;
        long remaining = next - vehicle.currentOdometer;
        return new ServiceInfo(next, remaining, lastDate, remaining <= alertConfig.serviceDueKm());
    }
}
