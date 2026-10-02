package com.fleetmate.service;

import com.fleetmate.dto.AssignmentRequest;
import com.fleetmate.dto.AssignmentResponse;
import com.fleetmate.entity.Driver;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.entity.VehicleDriverAssignment;
import com.fleetmate.exception.ApiException;
import com.fleetmate.mapper.AssignmentMapper;
import com.fleetmate.repository.AssignmentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.Optional;

@ApplicationScoped
public class AssignmentService {

    @Inject
    AssignmentRepository assignments;
    @Inject
    VehicleService vehicleService;
    @Inject
    DriverService driverService;

    /**
     * Assigns a driver to a vehicle: closes the vehicle's previous assignment, opens a new one and updates the
     * vehicle's current driver. With driverId = null the vehicle is simply unassigned. History is never deleted.
     */
    @Transactional
    public AssignmentResponse assign(AssignmentRequest request) {
        Vehicle vehicle = vehicleService.require(request.vehicleId());
        LocalDate start = request.startDate() == null ? LocalDate.now() : request.startDate();
        Optional<VehicleDriverAssignment> previous = assignments.findActiveByVehicle(vehicle.id);

        if (request.driverId() == null) {
            VehicleDriverAssignment closed = previous.orElseThrow(() -> ApiException.conflict(
                    "VEHICLE_HAS_NO_DRIVER", "Vehicle " + vehicle.vehicleNumber + " has no driver assigned"));
            close(closed, start);
            releaseDriver(closed.driver);
            vehicle.currentDriver = null;
            return AssignmentMapper.toResponse(closed);
        }

        Driver driver = driverService.require(request.driverId());
        if (driver.status == DriverStatus.INACTIVE) {
            throw ApiException.conflict("DRIVER_INACTIVE", driver.name + " is inactive and cannot be assigned");
        }
        if (previous.isPresent() && previous.get().driver.id.equals(driver.id)) {
            throw ApiException.conflict("DRIVER_ALREADY_ASSIGNED_TO_VEHICLE",
                    driver.name + " is already assigned to " + vehicle.vehicleNumber);
        }
        assignments.findActiveByDriver(driver.id).ifPresent(active -> {
            throw ApiException.conflict("DRIVER_ALREADY_ASSIGNED", driver.name + " is already assigned to vehicle "
                    + active.vehicle.vehicleNumber + ". Unassign the driver from that vehicle first.");
        });

        previous.ifPresent(old -> {
            close(old, start);
            releaseDriver(old.driver);
        });

        VehicleDriverAssignment created = new VehicleDriverAssignment();
        created.vehicle = vehicle;
        created.driver = driver;
        created.startDate = start;
        assignments.persist(created);

        vehicle.currentDriver = driver;
        driver.status = DriverStatus.ACTIVE;
        return AssignmentMapper.toResponse(created);
    }

    private void close(VehicleDriverAssignment assignment, LocalDate end) {
        if (end.isBefore(assignment.startDate)) {
            throw ApiException.badRequest("INVALID_START_DATE", "Start date cannot be before the current assignment "
                    + "started on " + assignment.startDate);
        }
        assignment.endDate = end;
    }

    private void releaseDriver(Driver driver) {
        if (driver.status == DriverStatus.ACTIVE) {
            driver.status = DriverStatus.AVAILABLE;
        }
    }
}
