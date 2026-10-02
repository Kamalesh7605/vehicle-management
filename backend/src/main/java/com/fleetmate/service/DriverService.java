package com.fleetmate.service;

import com.fleetmate.config.AlertConfig;
import com.fleetmate.dto.AssignmentResponse;
import com.fleetmate.dto.DriverRequest;
import com.fleetmate.dto.DriverResponse;
import com.fleetmate.entity.Driver;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.exception.ApiException;
import com.fleetmate.mapper.AssignmentMapper;
import com.fleetmate.mapper.DriverMapper;
import com.fleetmate.repository.AssignmentRepository;
import com.fleetmate.repository.DriverRepository;
import com.fleetmate.repository.UserRepository;
import com.fleetmate.repository.VehicleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DriverService {

    @Inject
    DriverRepository drivers;
    @Inject
    VehicleRepository vehicles;
    @Inject
    UserRepository users;
    @Inject
    AssignmentRepository assignments;
    @Inject
    DocumentService documentService;
    @Inject
    AlertConfig alertConfig;

    @Transactional
    public List<DriverResponse> list(String q, DriverStatus status) {
        Map<Long, Vehicle> assigned = assignedVehicles();
        return drivers.search(q, status).stream().map(d -> toResponse(d, assigned.get(d.id))).toList();
    }

    @Transactional
    public DriverResponse get(Long id) {
        Driver driver = require(id);
        return toResponse(driver, assignedVehicles().get(id));
    }

    @Transactional
    public DriverResponse create(DriverRequest request) {
        String licence = normalizeLicence(request.licenceNumber());
        assertLicenceAvailable(licence, null);
        Driver driver = new Driver();
        apply(driver, request, licence);
        driver.owner = users.defaultOwner();
        drivers.persist(driver);
        return toResponse(driver, null);
    }

    @Transactional
    public DriverResponse update(Long id, DriverRequest request) {
        Driver driver = require(id);
        String licence = normalizeLicence(request.licenceNumber());
        assertLicenceAvailable(licence, id);
        apply(driver, request, licence);
        return toResponse(driver, assignedVehicles().get(id));
    }

    @Transactional
    public void delete(Long id) {
        Driver driver = require(id);
        vehicles.update("currentDriver = null where currentDriver.id = ?1", id);
        assignments.deleteByDriver(id);
        documentService.deleteByDriver(id);
        drivers.delete(driver);
    }

    @Transactional
    public List<AssignmentResponse> vehicleHistory(Long id) {
        require(id);
        return assignments.historyByDriver(id).stream().map(AssignmentMapper::toResponse).toList();
    }

    public Driver require(Long id) {
        Driver driver = drivers.findById(id);
        if (driver == null) {
            throw ApiException.notFound("Driver", id);
        }
        return driver;
    }

    private Map<Long, Vehicle> assignedVehicles() {
        Map<Long, Vehicle> map = new HashMap<>();
        vehicles.list("currentDriver is not null").forEach(v -> map.put(v.currentDriver.id, v));
        return map;
    }

    private DriverResponse toResponse(Driver driver, Vehicle assigned) {
        return DriverMapper.toResponse(driver, assigned, LocalDate.now(), alertConfig.documentExpiryDays());
    }

    private void assertLicenceAvailable(String licence, Long selfId) {
        drivers.findByLicenceNumber(licence).ifPresent(existing -> {
            if (!existing.id.equals(selfId)) {
                throw ApiException.conflict("LICENCE_ALREADY_EXISTS", "Licence number already exists");
            }
        });
    }

    private static String normalizeLicence(String raw) {
        return raw.trim().toUpperCase();
    }

    private static void apply(Driver driver, DriverRequest r, String licence) {
        driver.name = r.name().trim();
        driver.phone = r.phone().trim();
        driver.address = VehicleService.blankToNull(r.address());
        driver.licenceNumber = licence;
        driver.licenceType = VehicleService.blankToNull(r.licenceType());
        driver.licenceExpiry = r.licenceExpiry();
        driver.joiningDate = r.joiningDate();
        driver.salary = r.salary();
        driver.status = r.status() == null ? DriverStatus.AVAILABLE : r.status();
    }
}
