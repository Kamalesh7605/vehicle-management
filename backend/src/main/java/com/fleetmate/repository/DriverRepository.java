package com.fleetmate.repository;

import com.fleetmate.entity.Driver;
import com.fleetmate.entity.DriverStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class DriverRepository implements PanacheRepository<Driver> {

    public Optional<Driver> findByLicenceNumber(String licenceNumber) {
        return find("upper(licenceNumber) = ?1", licenceNumber.toUpperCase()).firstResultOptional();
    }

    public List<Driver> search(String q, DriverStatus status) {
        return new QueryFilter()
                .search("(lower(name) like :q or phone like :q or lower(licenceNumber) like :q)", q)
                .and("status = :status", "status", status)
                .list(this, "name");
    }
}
