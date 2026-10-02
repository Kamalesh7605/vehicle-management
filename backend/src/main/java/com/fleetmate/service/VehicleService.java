package com.fleetmate.service;

import com.fleetmate.config.AlertConfig;
import com.fleetmate.dto.AssignmentResponse;
import com.fleetmate.dto.VehicleRequest;
import com.fleetmate.dto.VehicleResponse;
import com.fleetmate.dto.VehicleSummaryResponse;
import com.fleetmate.entity.Document;
import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.FuelType;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.entity.VehicleStatus;
import com.fleetmate.exception.ApiException;
import com.fleetmate.mapper.AssignmentMapper;
import com.fleetmate.mapper.VehicleMapper;
import com.fleetmate.repository.AssignmentRepository;
import com.fleetmate.repository.DocumentRepository;
import com.fleetmate.repository.ExpenseRepository;
import com.fleetmate.repository.FuelRepository;
import com.fleetmate.repository.MaintenanceRepository;
import com.fleetmate.repository.UserRepository;
import com.fleetmate.repository.VehicleRepository;
import com.fleetmate.service.CostAggregationService.CostFilter;
import com.fleetmate.service.CostAggregationService.Totals;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class VehicleService {

    @Inject
    VehicleRepository vehicles;
    @Inject
    UserRepository users;
    @Inject
    AssignmentRepository assignments;
    @Inject
    FuelRepository fuelRecords;
    @Inject
    MaintenanceRepository maintenanceRecords;
    @Inject
    ExpenseRepository expenses;
    @Inject
    DocumentRepository documents;
    @Inject
    DocumentService documentService;
    @Inject
    CostAggregationService costs;
    @Inject
    MileageCalculator mileageCalculator;
    @Inject
    ServiceStatusCalculator serviceStatus;
    @Inject
    AlertConfig alertConfig;

    @Transactional
    public List<VehicleResponse> list(String q, VehicleStatus status, FuelType fuelType) {
        return vehicles.search(q, status, fuelType).stream().map(VehicleMapper::toResponse).toList();
    }

    @Transactional
    public VehicleResponse get(Long id) {
        return VehicleMapper.toResponse(require(id));
    }

    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        String number = normalizeNumber(request.vehicleNumber());
        assertNumberAvailable(number, null);
        Vehicle vehicle = new Vehicle();
        apply(vehicle, request, number);
        vehicle.currentOdometer = request.currentOdometer() == null ? 0 : request.currentOdometer();
        vehicle.owner = users.defaultOwner();
        vehicles.persist(vehicle);
        return VehicleMapper.toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request) {
        Vehicle vehicle = require(id);
        String number = normalizeNumber(request.vehicleNumber());
        assertNumberAvailable(number, id);
        if (request.currentOdometer() != null && request.currentOdometer() < vehicle.currentOdometer) {
            throw ApiException.badRequest("ODOMETER_CANNOT_DECREASE",
                    "Odometer cannot be lower than the current reading of " + vehicle.currentOdometer + " KM");
        }
        apply(vehicle, request, number);
        if (request.currentOdometer() != null) {
            vehicle.currentOdometer = request.currentOdometer();
        }
        return VehicleMapper.toResponse(vehicle);
    }

    /** Deletes the vehicle together with everything recorded against it. */
    @Transactional
    public void delete(Long id) {
        Vehicle vehicle = require(id);
        if (vehicle.currentDriver != null && vehicle.currentDriver.status == DriverStatus.ACTIVE) {
            vehicle.currentDriver.status = DriverStatus.AVAILABLE;
        }
        fuelRecords.deleteByVehicle(id);
        maintenanceRecords.deleteByVehicle(id);
        expenses.deleteByVehicle(id);
        documentService.deleteByVehicle(id);
        assignments.deleteByVehicle(id);
        vehicles.delete(vehicle);
    }

    @Transactional
    public VehicleSummaryResponse summary(Long id) {
        Vehicle vehicle = require(id);
        Totals totals = Totals.of(costs.entries(new CostFilter(null, null, id, null, null)));
        LocalDate today = LocalDate.now();
        var lastFuel = fuelRecords.find("vehicle.id = ?1 order by fuelDate desc, id desc", id).firstResultOptional();
        List<Document> latestDocs = DocumentService.latestPerType(documents.forVehicle(id));
        int soon = alertConfig.documentExpiryDays();
        long expired = latestDocs.stream()
                .filter(d -> DocumentStatus.of(d.expiryDate, today, soon) == DocumentStatus.EXPIRED).count();
        long expiring = latestDocs.stream()
                .filter(d -> DocumentStatus.of(d.expiryDate, today, soon) == DocumentStatus.EXPIRING_SOON).count();
        return new VehicleSummaryResponse(
                VehicleMapper.toResponse(vehicle),
                totals.fuel(), totals.maintenance(), totals.otherIncludingToll(), totals.total(),
                mileageCalculator.calculate(id, null, null),
                serviceStatus.forVehicle(vehicle),
                assignments.findActiveByVehicle(id).map(a -> a.startDate).orElse(null),
                lastFuel.map(f -> f.fuelDate).orElse(null),
                expired, expiring);
    }

    @Transactional
    public List<AssignmentResponse> driverHistory(Long id) {
        require(id);
        return assignments.historyByVehicle(id).stream().map(AssignmentMapper::toResponse).toList();
    }

    // ---- helpers shared with fuel / maintenance services ----

    public Vehicle require(Long id) {
        Vehicle vehicle = vehicles.findById(id);
        if (vehicle == null) {
            throw ApiException.notFound("Vehicle", id);
        }
        return vehicle;
    }

    /** Inactive vehicles do not get new fuel/maintenance records unless the caller explicitly allows it. */
    public void assertAcceptsNewRecords(Vehicle vehicle, Boolean allowInactive) {
        if (vehicle.status == VehicleStatus.INACTIVE && !Boolean.TRUE.equals(allowInactive)) {
            throw ApiException.conflict("VEHICLE_INACTIVE", "Vehicle " + vehicle.vehicleNumber
                    + " is inactive. Confirm that you want to add a record for an inactive vehicle.");
        }
    }

    /** The odometer only ever moves forward. */
    public void applyOdometerReading(Vehicle vehicle, Long odometer) {
        if (odometer != null && odometer > vehicle.currentOdometer) {
            vehicle.currentOdometer = odometer;
        }
    }

    private void assertNumberAvailable(String number, Long selfId) {
        vehicles.findByNumber(number).ifPresent(existing -> {
            if (!existing.id.equals(selfId)) {
                throw ApiException.conflict("VEHICLE_ALREADY_EXISTS", "Vehicle number already exists");
            }
        });
    }

    private static String normalizeNumber(String raw) {
        return raw.trim().replaceAll("\\s+", " ").toUpperCase();
    }

    private static void apply(Vehicle vehicle, VehicleRequest r, String number) {
        vehicle.vehicleNumber = number;
        vehicle.vehicleType = blankToNull(r.vehicleType());
        vehicle.manufacturer = blankToNull(r.manufacturer());
        vehicle.model = blankToNull(r.model());
        vehicle.manufacturingYear = r.manufacturingYear();
        vehicle.fuelType = r.fuelType();
        vehicle.registrationDate = r.registrationDate();
        vehicle.status = r.status() == null ? VehicleStatus.ACTIVE : r.status();
    }

    static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
