package com.fleetmate.repository;

import com.fleetmate.entity.Document;
import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DocumentType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class DocumentRepository implements PanacheRepository<Document> {

    public QueryFilter.PagedResult<Document> search(String q, DocumentType type, Long vehicleId, Long driverId,
                                                    DocumentStatus status, LocalDate today, int soonDays,
                                                    int page, int size) {
        QueryFilter filter = new QueryFilter()
                .search("(lower(coalesce(documentNumber, '')) like :q"
                        + " or vehicle.id in (select v.id from Vehicle v where lower(v.vehicleNumber) like :q)"
                        + " or driver.id in (select d.id from Driver d where lower(d.name) like :q))", q)
                .and("documentType = :type", "type", type)
                .and("vehicle.id = :vehicleId", "vehicleId", vehicleId)
                .and("driver.id = :driverId", "driverId", driverId);
        if (status != null) {
            LocalDate soon = today.plusDays(soonDays);
            switch (status) {
                case EXPIRED -> filter.and("expiryDate < :today").param("today", today);
                case EXPIRING_SOON -> filter.and("expiryDate >= :today and expiryDate <= :soon")
                        .param("today", today).param("soon", soon);
                case VALID -> filter.and("expiryDate > :soon").param("soon", soon);
            }
        }
        return filter.page(this, "expiryDate, id", page, size);
    }

    public List<Document> forVehicle(Long vehicleId) {
        return list("vehicle.id = ?1 order by expiryDate", vehicleId);
    }

}
