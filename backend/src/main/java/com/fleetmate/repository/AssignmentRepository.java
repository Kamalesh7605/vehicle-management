package com.fleetmate.repository;

import com.fleetmate.entity.VehicleDriverAssignment;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class AssignmentRepository implements PanacheRepository<VehicleDriverAssignment> {

    public Optional<VehicleDriverAssignment> findActiveByVehicle(Long vehicleId) {
        return find("vehicle.id = ?1 and endDate is null", vehicleId).firstResultOptional();
    }

    public Optional<VehicleDriverAssignment> findActiveByDriver(Long driverId) {
        return find("driver.id = ?1 and endDate is null", driverId).firstResultOptional();
    }

    public List<VehicleDriverAssignment> historyByVehicle(Long vehicleId) {
        return list("vehicle.id = ?1 order by startDate desc, id desc", vehicleId);
    }

    public List<VehicleDriverAssignment> historyByDriver(Long driverId) {
        return list("driver.id = ?1 order by startDate desc, id desc", driverId);
    }

    public long deleteByVehicle(Long vehicleId) {
        return delete("vehicle.id", vehicleId);
    }

    public long deleteByDriver(Long driverId) {
        return delete("driver.id", driverId);
    }
}
