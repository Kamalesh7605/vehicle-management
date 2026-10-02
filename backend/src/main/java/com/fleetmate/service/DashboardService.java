package com.fleetmate.service;

import com.fleetmate.dto.AlertResponse;
import com.fleetmate.dto.DashboardSummary;
import com.fleetmate.dto.ExpenseBreakdown;
import com.fleetmate.dto.ExpenseResponse;
import com.fleetmate.dto.FuelResponse;
import com.fleetmate.dto.MaintenanceResponse;
import com.fleetmate.dto.MonthlyExpense;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.VehicleStatus;
import com.fleetmate.repository.DriverRepository;
import com.fleetmate.repository.VehicleRepository;
import com.fleetmate.service.CostAggregationService.CostEntry;
import com.fleetmate.service.CostAggregationService.CostFilter;
import com.fleetmate.service.CostAggregationService.Totals;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class DashboardService {

    @Inject
    VehicleRepository vehicles;
    @Inject
    DriverRepository drivers;
    @Inject
    CostAggregationService costs;
    @Inject
    FuelService fuelService;
    @Inject
    MaintenanceService maintenanceService;
    @Inject
    ExpenseService expenseService;
    @Inject
    AlertService alertService;

    @Transactional
    public DashboardSummary summary(LocalDate from, LocalDate to) {
        LocalDate start = from == null ? YearMonth.now().atDay(1) : from;
        LocalDate end = to == null ? YearMonth.now().atEndOfMonth() : to;
        Totals totals = Totals.of(costs.entries(CostFilter.of(start, end)));
        long totalDrivers = drivers.count();
        long inactiveDrivers = drivers.count("status", DriverStatus.INACTIVE);
        return new DashboardSummary(
                vehicles.count(),
                vehicles.count("status", VehicleStatus.ACTIVE),
                vehicles.count("status", VehicleStatus.MAINTENANCE),
                vehicles.count("status", VehicleStatus.INACTIVE),
                totalDrivers, totalDrivers - inactiveDrivers, inactiveDrivers,
                totals.fuel(), totals.maintenance(), totals.otherIncludingToll(), totals.total(), start, end);
    }

    @Transactional
    public List<MonthlyExpense> monthlyExpenses(Integer year) {
        int y = year == null ? LocalDate.now().getYear() : year;
        List<CostEntry> entries = costs.entries(CostFilter.of(LocalDate.of(y, 1, 1), LocalDate.of(y, 12, 31)));
        List<MonthlyExpense> result = new ArrayList<>();
        for (Month month : Month.values()) {
            Totals t = Totals.of(entries.stream().filter(e -> e.date().getMonth() == month).toList());
            result.add(new MonthlyExpense(YearMonth.of(y, month).toString(),
                    month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    t.fuel(), t.maintenance(), t.otherIncludingToll(), t.total()));
        }
        return result;
    }

    @Transactional
    public ExpenseBreakdown expenseBreakdown(LocalDate from, LocalDate to) {
        DashboardSummary s = summary(from, to);
        BigDecimal total = s.totalExpense();
        return new ExpenseBreakdown(total, List.of(
                item("FUEL", "Fuel", s.fuelExpense(), total),
                item("MAINTENANCE", "Maintenance", s.maintenanceExpense(), total),
                item("OTHER", "Other", s.otherExpense(), total)));
    }

    public List<FuelResponse> recentFuel(int limit) {
        return fuelService.recent(limit);
    }

    public List<MaintenanceResponse> recentMaintenance(int limit) {
        return maintenanceService.recent(limit);
    }

    public List<ExpenseResponse> recentExpenses(int limit) {
        return expenseService.recent(limit);
    }

    public List<AlertResponse> alerts(String username) {
        return alertService.alerts(username);
    }

    public void markAlertsRead(String username) {
        alertService.markAllRead(username);
    }

    private static ExpenseBreakdown.Item item(String key, String name, BigDecimal amount, BigDecimal total) {
        double pct = total.signum() == 0 ? 0
                : amount.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP).doubleValue();
        return new ExpenseBreakdown.Item(key, name, amount, pct);
    }
}
