package com.fleetmate.service;

import com.fleetmate.dto.MaintenanceRequest;
import com.fleetmate.dto.MaintenanceResponse;
import com.fleetmate.dto.PageResponse;
import com.fleetmate.entity.MaintenanceRecord;
import com.fleetmate.entity.MaintenanceType;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.exception.ApiException;
import com.fleetmate.mapper.MaintenanceMapper;
import com.fleetmate.repository.MaintenanceRepository;
import com.fleetmate.repository.QueryFilter.PagedResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class MaintenanceService {

    @Inject
    MaintenanceRepository maintenanceRecords;
    @Inject
    VehicleService vehicleService;

    @Transactional
    public PageResponse<MaintenanceResponse> list(String q, Long vehicleId, MaintenanceType type, LocalDate from,
                                                  LocalDate to, int page, int size) {
        PagedResult<MaintenanceRecord> result = maintenanceRecords.search(q, vehicleId, type, from, to, page, size);
        return PageResponse.of(toResponses(result.items()), result.total(), page, size);
    }

    @Transactional
    public List<MaintenanceResponse> recent(int limit) {
        return toResponses(maintenanceRecords.recent(limit));
    }

    @Transactional
    public MaintenanceResponse get(Long id) {
        return toResponses(List.of(require(id))).get(0);
    }

    @Transactional
    public MaintenanceResponse create(MaintenanceRequest request) {
        Vehicle vehicle = vehicleService.require(request.vehicleId());
        vehicleService.assertAcceptsNewRecords(vehicle, request.allowInactive());
        MaintenanceRecord record = new MaintenanceRecord();
        apply(record, vehicle, request);
        maintenanceRecords.persist(record);
        return toResponses(List.of(record)).get(0);
    }

    @Transactional
    public MaintenanceResponse update(Long id, MaintenanceRequest request) {
        MaintenanceRecord record = require(id);
        Vehicle vehicle = vehicleService.require(request.vehicleId());
        if (!vehicle.id.equals(record.vehicle.id)) {
            vehicleService.assertAcceptsNewRecords(vehicle, request.allowInactive());
        }
        apply(record, vehicle, request);
        return toResponses(List.of(record)).get(0);
    }

    @Transactional
    public void delete(Long id) {
        maintenanceRecords.delete(require(id));
    }

    /**
     * Remaining KM = next service KM - current vehicle KM. Only the vehicle's newest record with a service target
     * carries the figure; older records would otherwise look overdue forever.
     */
    private List<MaintenanceResponse> toResponses(List<MaintenanceRecord> records) {
        maintenanceRecords.getEntityManager().flush();
        Map<Long, Long> latestTargetByVehicle = new HashMap<>();
        return records.stream().map(m -> {
            Long currentKm = null;
            Long remaining = null;
            if (m.nextServiceKm != null) {
                Long latestId = latestTargetByVehicle.computeIfAbsent(m.vehicle.id, vid ->
                        maintenanceRecords.latestWithNextService(vid).map(r -> r.id).orElse(-1L));
                if (latestId.equals(m.id)) {
                    currentKm = m.vehicle.currentOdometer;
                    remaining = m.nextServiceKm - currentKm;
                }
            }
            return MaintenanceMapper.toResponse(m, currentKm, remaining);
        }).toList();
    }

    private void apply(MaintenanceRecord record, Vehicle vehicle, MaintenanceRequest r) {
        record.vehicle = vehicle;
        record.maintenanceDate = r.date();
        record.maintenanceType = r.maintenanceType();
        record.description = VehicleService.blankToNull(r.description());
        record.odometer = r.odometer();
        record.cost = r.cost();
        record.nextServiceKm = r.nextServiceKm();
        record.notes = VehicleService.blankToNull(r.notes());
        vehicleService.applyOdometerReading(vehicle, r.odometer());
    }

    private MaintenanceRecord require(Long id) {
        MaintenanceRecord record = maintenanceRecords.findById(id);
        if (record == null) {
            throw ApiException.notFound("Maintenance record", id);
        }
        return record;
    }
}
