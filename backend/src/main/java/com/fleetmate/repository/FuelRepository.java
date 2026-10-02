package com.fleetmate.repository;

import com.fleetmate.entity.FuelRecord;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class FuelRepository implements PanacheRepository<FuelRecord> {

    private static QueryFilter filter(String q, Long vehicleId, LocalDate from, LocalDate to) {
        return new QueryFilter()
                .search("(lower(coalesce(fuelStation, '')) like :q or lower(coalesce(notes, '')) like :q"
                        + " or vehicle.id in (select v.id from Vehicle v where lower(v.vehicleNumber) like :q))", q)
                .and("vehicle.id = :vehicleId", "vehicleId", vehicleId)
                .and("fuelDate >= :from", "from", from)
                .and("fuelDate <= :to", "to", to);
    }

    public QueryFilter.PagedResult<FuelRecord> search(String q, Long vehicleId, LocalDate from, LocalDate to,
                                                      int page, int size) {
        return filter(q, vehicleId, from, to).page(this, "fuelDate desc, id desc", page, size);
    }

    public List<FuelRecord> inRange(Long vehicleId, LocalDate from, LocalDate to) {
        return filter(null, vehicleId, from, to).list(this, "fuelDate, id");
    }

    public List<FuelRecord> recent(int limit) {
        return find("order by fuelDate desc, id desc").page(0, limit).list();
    }

    public long deleteByVehicle(Long vehicleId) {
        return delete("vehicle.id", vehicleId);
    }
}
