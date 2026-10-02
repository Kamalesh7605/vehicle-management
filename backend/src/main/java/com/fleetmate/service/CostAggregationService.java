package com.fleetmate.service;

import com.fleetmate.entity.ExpenseCategory;
import com.fleetmate.entity.VehicleDriverAssignment;
import com.fleetmate.repository.AssignmentRepository;
import com.fleetmate.repository.ExpenseRepository;
import com.fleetmate.repository.FuelRepository;
import com.fleetmate.repository.MaintenanceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Single source of truth for "how much did we spend": merges fuel records, maintenance records and general
 * expenses into one list of cost entries so the dashboard, vehicle pages and reports always agree.
 */
@ApplicationScoped
public class CostAggregationService {

    public enum Bucket { FUEL, MAINTENANCE, TOLL, OTHER }

    public record CostEntry(Long vehicleId, String vehicleNumber, LocalDate date, ExpenseCategory category,
                            BigDecimal amount) {

        /** Repair and maintenance expenses count as maintenance; fuel expenses count as fuel. */
        public Bucket bucket() {
            return switch (category) {
                case FUEL -> Bucket.FUEL;
                case MAINTENANCE, REPAIR -> Bucket.MAINTENANCE;
                case TOLL -> Bucket.TOLL;
                default -> Bucket.OTHER;
            };
        }
    }

    public record CostFilter(LocalDate from, LocalDate to, Long vehicleId, Long driverId, ExpenseCategory category) {

        public static CostFilter of(LocalDate from, LocalDate to) {
            return new CostFilter(from, to, null, null, null);
        }
    }

    public record Totals(BigDecimal fuel, BigDecimal maintenance, BigDecimal toll, BigDecimal other) {

        public static Totals of(Collection<CostEntry> entries) {
            BigDecimal fuel = BigDecimal.ZERO;
            BigDecimal maintenance = BigDecimal.ZERO;
            BigDecimal toll = BigDecimal.ZERO;
            BigDecimal other = BigDecimal.ZERO;
            for (CostEntry e : entries) {
                switch (e.bucket()) {
                    case FUEL -> fuel = fuel.add(e.amount());
                    case MAINTENANCE -> maintenance = maintenance.add(e.amount());
                    case TOLL -> toll = toll.add(e.amount());
                    case OTHER -> other = other.add(e.amount());
                }
            }
            return new Totals(fuel, maintenance, toll, other);
        }

        /** Everything that is neither fuel nor maintenance (tolls included). */
        public BigDecimal otherIncludingToll() {
            return toll.add(other);
        }

        public BigDecimal total() {
            return fuel.add(maintenance).add(toll).add(other);
        }
    }

    @Inject
    FuelRepository fuel;
    @Inject
    MaintenanceRepository maintenance;
    @Inject
    ExpenseRepository expenses;
    @Inject
    AssignmentRepository assignments;

    @Transactional
    public List<CostEntry> entries(CostFilter f) {
        List<CostEntry> all = new ArrayList<>();
        fuel.inRange(f.vehicleId(), f.from(), f.to()).forEach(r -> all.add(new CostEntry(r.vehicle.id,
                r.vehicle.vehicleNumber, r.fuelDate, ExpenseCategory.FUEL, r.totalAmount)));
        maintenance.inRange(f.vehicleId(), f.from(), f.to()).forEach(r -> all.add(new CostEntry(r.vehicle.id,
                r.vehicle.vehicleNumber, r.maintenanceDate, ExpenseCategory.MAINTENANCE, r.cost)));
        expenses.inRange(f.vehicleId(), f.from(), f.to()).forEach(r -> all.add(new CostEntry(r.vehicle.id,
                r.vehicle.vehicleNumber, r.expenseDate, r.category, r.amount)));

        List<CostEntry> result = all.stream()
                .filter(e -> f.category() == null || e.category() == f.category())
                .toList();
        if (f.driverId() == null) {
            return result;
        }
        // Driver filter: keep only costs booked on a vehicle while that driver was assigned to it.
        List<VehicleDriverAssignment> periods = assignments.historyByDriver(f.driverId());
        return result.stream().filter(e -> periods.stream().anyMatch(a -> a.vehicle.id.equals(e.vehicleId())
                && !e.date().isBefore(a.startDate) && (a.endDate == null || !e.date().isAfter(a.endDate)))).toList();
    }
}
