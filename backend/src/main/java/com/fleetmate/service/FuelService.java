package com.fleetmate.service;

import com.fleetmate.dto.FuelRequest;
import com.fleetmate.dto.FuelResponse;
import com.fleetmate.dto.PageResponse;
import com.fleetmate.entity.FuelRecord;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.exception.ApiException;
import com.fleetmate.mapper.FuelMapper;
import com.fleetmate.repository.FuelRepository;
import com.fleetmate.repository.QueryFilter.PagedResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class FuelService {

    @Inject
    FuelRepository fuelRecords;
    @Inject
    VehicleService vehicleService;

    @Transactional
    public PageResponse<FuelResponse> list(String q, Long vehicleId, LocalDate from, LocalDate to, int page,
                                           int size) {
        PagedResult<FuelRecord> result = fuelRecords.search(q, vehicleId, from, to, page, size);
        return PageResponse.of(result.items().stream().map(FuelMapper::toResponse).toList(), result.total(), page,
                size);
    }

    @Transactional
    public List<FuelResponse> recent(int limit) {
        return fuelRecords.recent(limit).stream().map(FuelMapper::toResponse).toList();
    }

    @Transactional
    public FuelResponse get(Long id) {
        return FuelMapper.toResponse(require(id));
    }

    @Transactional
    public FuelResponse create(FuelRequest request) {
        Vehicle vehicle = vehicleService.require(request.vehicleId());
        vehicleService.assertAcceptsNewRecords(vehicle, request.allowInactive());
        FuelRecord record = new FuelRecord();
        apply(record, vehicle, request);
        fuelRecords.persist(record);
        return FuelMapper.toResponse(record);
    }

    @Transactional
    public FuelResponse update(Long id, FuelRequest request) {
        FuelRecord record = require(id);
        Vehicle vehicle = vehicleService.require(request.vehicleId());
        if (!vehicle.id.equals(record.vehicle.id)) {
            vehicleService.assertAcceptsNewRecords(vehicle, request.allowInactive());
        }
        apply(record, vehicle, request);
        return FuelMapper.toResponse(record);
    }

    @Transactional
    public void delete(Long id) {
        fuelRecords.delete(require(id));
    }

    /** Total = litres x price per litre, unless the caller supplies a manual total. */
    public static BigDecimal calculateTotal(BigDecimal quantity, BigDecimal pricePerLitre, BigDecimal manualTotal) {
        if (manualTotal != null) {
            return manualTotal.setScale(2, RoundingMode.HALF_UP);
        }
        return quantity.multiply(pricePerLitre).setScale(2, RoundingMode.HALF_UP);
    }

    private void apply(FuelRecord record, Vehicle vehicle, FuelRequest r) {
        record.vehicle = vehicle;
        record.fuelDate = r.date();
        record.fuelType = r.fuelType() == null ? vehicle.fuelType : r.fuelType();
        record.quantity = r.quantity();
        record.pricePerLitre = r.pricePerLitre();
        record.totalAmount = calculateTotal(r.quantity(), r.pricePerLitre(), r.totalAmount());
        record.odometer = r.odometer();
        record.fuelStation = VehicleService.blankToNull(r.fuelStation());
        record.notes = VehicleService.blankToNull(r.notes());
        vehicleService.applyOdometerReading(vehicle, r.odometer());
    }

    private FuelRecord require(Long id) {
        FuelRecord record = fuelRecords.findById(id);
        if (record == null) {
            throw ApiException.notFound("Fuel record", id);
        }
        return record;
    }
}
