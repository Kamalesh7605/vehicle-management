package com.fleetmate.repository;

import com.fleetmate.entity.FuelType;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.entity.VehicleStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class VehicleRepository implements PanacheRepository<Vehicle> {

    public Optional<Vehicle> findByNumber(String vehicleNumber) {
        return find("upper(vehicleNumber) = ?1", vehicleNumber.toUpperCase()).firstResultOptional();
    }

    public List<Vehicle> search(String q, VehicleStatus status, FuelType fuelType) {
        return new QueryFilter()
                .search("(lower(vehicleNumber) like :q or lower(coalesce(model, '')) like :q"
                        + " or lower(coalesce(manufacturer, '')) like :q)", q)
                .and("status = :status", "status", status)
                .and("fuelType = :fuelType", "fuelType", fuelType)
                .list(this, "vehicleNumber");
    }
}
