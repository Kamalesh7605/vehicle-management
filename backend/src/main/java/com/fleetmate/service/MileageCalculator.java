package com.fleetmate.service;

import com.fleetmate.dto.MileageInfo;
import com.fleetmate.entity.FuelRecord;
import com.fleetmate.repository.FuelRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Approximate mileage using the odometer readings on fuel records:
 * distance = last reading - first reading, fuel used = litres of every fill-up after the first one.
 */
@ApplicationScoped
public class MileageCalculator {

    @Inject
    FuelRepository fuelRepository;

    @Transactional
    public MileageInfo calculate(Long vehicleId, LocalDate from, LocalDate to) {
        List<FuelRecord> records = fuelRepository.inRange(vehicleId, from, to).stream()
                .filter(r -> r.odometer != null)
                .sorted(Comparator.comparing((FuelRecord r) -> r.odometer).thenComparing(r -> r.id))
                .toList();
        return calculate(records);
    }

    public static MileageInfo calculate(List<FuelRecord> sortedByOdometer) {
        if (sortedByOdometer.size() < 2) {
            return new MileageInfo(null, null, null, "Add at least two fuel entries with odometer readings");
        }
        long distance = sortedByOdometer.get(sortedByOdometer.size() - 1).odometer - sortedByOdometer.get(0).odometer;
        BigDecimal fuelUsed = sortedByOdometer.stream().skip(1).map(r -> r.quantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (distance <= 0 || fuelUsed.signum() <= 0) {
            return new MileageInfo(null, distance, fuelUsed, "Odometer readings do not show any distance travelled");
        }
        BigDecimal mileage = BigDecimal.valueOf(distance).divide(fuelUsed, 2, RoundingMode.HALF_UP);
        return new MileageInfo(mileage, distance, fuelUsed, null);
    }
}
