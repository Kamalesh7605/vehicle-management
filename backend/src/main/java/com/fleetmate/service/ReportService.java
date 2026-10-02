package com.fleetmate.service;

import com.fleetmate.config.AlertConfig;
import com.fleetmate.dto.DriverReportRow;
import com.fleetmate.dto.MonthlyExpense;
import com.fleetmate.dto.VehicleExpenseRow;
import com.fleetmate.dto.VehicleSummaryRow;
import com.fleetmate.dto.MileageInfo;
import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.ExpenseCategory;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.repository.AssignmentRepository;
import com.fleetmate.repository.DriverRepository;
import com.fleetmate.repository.QueryFilter;
import com.fleetmate.repository.VehicleRepository;
import com.fleetmate.service.CostAggregationService.CostEntry;
import com.fleetmate.service.CostAggregationService.CostFilter;
import com.fleetmate.service.CostAggregationService.Totals;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@ApplicationScoped
public class ReportService {

    @Inject
    VehicleRepository vehicles;
    @Inject
    DriverRepository drivers;
    @Inject
    AssignmentRepository assignments;
    @Inject
    CostAggregationService costs;
    @Inject
    MileageCalculator mileageCalculator;
    @Inject
    AlertConfig alertConfig;

    @Transactional
    public List<VehicleExpenseRow> vehicleExpenses(LocalDate from, LocalDate to, Long vehicleId, Long driverId,
                                                   ExpenseCategory category) {
        Map<Long, List<CostEntry>> byVehicle = costs.entries(new CostFilter(from, to, vehicleId, driverId, category))
                .stream().collect(Collectors.groupingBy(CostEntry::vehicleId));
        return vehiclesFor(vehicleId).stream().map(v -> {
            Totals t = Totals.of(byVehicle.getOrDefault(v.id, List.of()));
            return new VehicleExpenseRow(v.id, v.vehicleNumber, t.fuel(), t.maintenance(), t.toll(), t.other(),
                    t.total());
        }).toList();
    }

    @Transactional
    public List<MonthlyExpense> monthlyExpenses(LocalDate from, LocalDate to, Long vehicleId, Long driverId,
                                                ExpenseCategory category) {
        LocalDate end = to == null ? LocalDate.now() : to;
        LocalDate start = from == null ? end.withDayOfYear(1) : from;
        Map<YearMonth, List<CostEntry>> byMonth = costs.entries(new CostFilter(start, end, vehicleId, driverId,
                category)).stream().collect(Collectors.groupingBy(e -> YearMonth.from(e.date())));
        List<MonthlyExpense> rows = new ArrayList<>();
        for (YearMonth m = YearMonth.from(start); !m.isAfter(YearMonth.from(end)); m = m.plusMonths(1)) {
            Totals t = Totals.of(byMonth.getOrDefault(m, List.of()));
            rows.add(new MonthlyExpense(m.toString(),
                    m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + m.getYear(),
                    t.fuel(), t.maintenance(), t.otherIncludingToll(), t.total()));
        }
        return rows;
    }

    @Transactional
    public List<DriverReportRow> drivers(Long driverId, Long vehicleId, DriverStatus status) {
        Map<Long, Vehicle> assigned = vehicles.list("currentDriver is not null").stream()
                .collect(Collectors.toMap(v -> v.currentDriver.id, Function.identity()));
        LocalDate today = LocalDate.now();
        return new QueryFilter()
                .and("id = :id", "id", driverId)
                .and("status = :status", "status", status)
                .list(drivers, "name").stream()
                .filter(d -> vehicleId == null
                        || (assigned.get(d.id) != null && assigned.get(d.id).id.equals(vehicleId)))
                .map(d -> new DriverReportRow(d.id, d.name, d.phone,
                        assigned.get(d.id) == null ? null : assigned.get(d.id).vehicleNumber, d.status,
                        d.licenceNumber, d.licenceExpiry,
                        DocumentStatus.of(d.licenceExpiry, today, alertConfig.documentExpiryDays())))
                .toList();
    }

    @Transactional
    public List<VehicleSummaryRow> vehicleSummary(LocalDate from, LocalDate to, Long vehicleId, Long driverId,
                                                  ExpenseCategory category) {
        Map<Long, List<CostEntry>> byVehicle = costs.entries(new CostFilter(from, to, vehicleId, driverId, category))
                .stream().collect(Collectors.groupingBy(CostEntry::vehicleId));
        return vehiclesFor(vehicleId).stream().map(v -> {
            Totals t = Totals.of(byVehicle.getOrDefault(v.id, List.of()));
            MileageInfo mileage = mileageCalculator.calculate(v.id, from, to);
            return new VehicleSummaryRow(v.id, v.vehicleNumber, v.currentOdometer, t.fuel(), t.maintenance(),
                    t.total(), mileage.mileage(), mileage.message());
        }).toList();
    }

    private List<Vehicle> vehiclesFor(Long vehicleId) {
        return new QueryFilter().and("id = :id", "id", vehicleId).list(vehicles, "vehicleNumber");
    }
}
