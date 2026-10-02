package com.fleetmate.repository;

import com.fleetmate.entity.MaintenanceRecord;
import com.fleetmate.entity.MaintenanceType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class MaintenanceRepository implements PanacheRepository<MaintenanceRecord> {

    private static QueryFilter filter(String q, Long vehicleId, MaintenanceType type, LocalDate from, LocalDate to) {
        return new QueryFilter()
                .search("(lower(coalesce(description, '')) like :q or lower(coalesce(notes, '')) like :q"
                        + " or vehicle.id in (select v.id from Vehicle v where lower(v.vehicleNumber) like :q))", q)
                .and("vehicle.id = :vehicleId", "vehicleId", vehicleId)
                .and("maintenanceType = :type", "type", type)
                .and("maintenanceDate >= :from", "from", from)
                .and("maintenanceDate <= :to", "to", to);
    }

    public QueryFilter.PagedResult<MaintenanceRecord> search(String q, Long vehicleId, MaintenanceType type,
                                                             LocalDate from, LocalDate to, int page, int size) {
        return filter(q, vehicleId, type, from, to).page(this, "maintenanceDate desc, id desc", page, size);
    }

    public List<MaintenanceRecord> inRange(Long vehicleId, LocalDate from, LocalDate to) {
        return filter(null, vehicleId, null, from, to).list(this, "maintenanceDate, id");
    }

    public List<MaintenanceRecord> recent(int limit) {
        return find("order by maintenanceDate desc, id desc").page(0, limit).list();
    }

    /** The newest record for the vehicle that has a next-service target; this is the one that drives service alerts. */
    public Optional<MaintenanceRecord> latestWithNextService(Long vehicleId) {
        return find("vehicle.id = ?1 and nextServiceKm is not null order by maintenanceDate desc, id desc", vehicleId)
                .firstResultOptional();
    }

    public Optional<MaintenanceRecord> latestForVehicle(Long vehicleId) {
        return find("vehicle.id = ?1 order by maintenanceDate desc, id desc", vehicleId).firstResultOptional();
    }

    public long deleteByVehicle(Long vehicleId) {
        return delete("vehicle.id", vehicleId);
    }
}
