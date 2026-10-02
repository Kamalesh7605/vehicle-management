package com.fleetmate.config;

import com.fleetmate.entity.Document;
import com.fleetmate.entity.DocumentType;
import com.fleetmate.entity.Driver;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.Expense;
import com.fleetmate.entity.ExpenseCategory;
import com.fleetmate.entity.FuelRecord;
import com.fleetmate.entity.FuelType;
import com.fleetmate.entity.MaintenanceRecord;
import com.fleetmate.entity.MaintenanceType;
import com.fleetmate.entity.User;
import com.fleetmate.entity.Vehicle;
import com.fleetmate.entity.VehicleDriverAssignment;
import com.fleetmate.entity.VehicleStatus;
import com.fleetmate.repository.AssignmentRepository;
import com.fleetmate.repository.DocumentRepository;
import com.fleetmate.repository.DriverRepository;
import com.fleetmate.repository.ExpenseRepository;
import com.fleetmate.repository.FuelRepository;
import com.fleetmate.repository.MaintenanceRepository;
import com.fleetmate.repository.UserRepository;
import com.fleetmate.repository.VehicleRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Loads demo data on first start (only when the database has no vehicles). Dates are relative to today so the
 * dashboard, charts and alerts always look populated.
 */
@ApplicationScoped
public class DemoDataSeeder {

    private static final Logger LOG = Logger.getLogger(DemoDataSeeder.class);

    @ConfigProperty(name = "fleetmate.seed.enabled", defaultValue = "true")
    boolean enabled;

    @Inject
    UserRepository users;
    @Inject
    VehicleRepository vehicles;
    @Inject
    DriverRepository drivers;
    @Inject
    AssignmentRepository assignments;
    @Inject
    FuelRepository fuel;
    @Inject
    MaintenanceRepository maintenance;
    @Inject
    ExpenseRepository expenses;
    @Inject
    DocumentRepository documents;

    private final Random random = new Random(42);

    @Transactional
    void onStart(@Observes StartupEvent event) {
        User owner = users.defaultOwner();
        if (!enabled || vehicles.count() > 0) {
            return;
        }
        LocalDate today = LocalDate.now();

        Vehicle v1 = vehicle(owner, "TN 50 AB 1234", "Truck", "Ashok Leyland", "Boss 1920", 2019, 245_320, VehicleStatus.ACTIVE, today.minusYears(6));
        Vehicle v2 = vehicle(owner, "TN 50 CD 5678", "Truck", "Tata", "Starbus", 2020, 180_450, VehicleStatus.ACTIVE, today.minusYears(5));
        Vehicle v3 = vehicle(owner, "TN 50 EF 9012", "Truck", "Eicher", "Pro 3015", 2018, 320_120, VehicleStatus.MAINTENANCE, today.minusYears(7));
        Vehicle v4 = vehicle(owner, "TN 50 GH 3456", "Truck", "Ashok Leyland", "Dost", 2021, 150_780, VehicleStatus.ACTIVE, today.minusYears(4));
        Vehicle v5 = vehicle(owner, "TN 50 IJ 7890", "Truck", "Volvo", "FM 370", 2015, 410_250, VehicleStatus.INACTIVE, today.minusYears(10));

        Driver kumar = driver(owner, "Kumar", "9876501234", "DL-0420190001", today.plusDays(20), DriverStatus.ACTIVE, 22_000);
        Driver raj = driver(owner, "Raj", "9876405678", "DL-0420190002", today.plusMonths(14), DriverStatus.ACTIVE, 21_000);
        Driver arun = driver(owner, "Arun", "9876309876", "DL-0420190003", today.plusMonths(20), DriverStatus.AVAILABLE, 20_000);
        Driver suresh = driver(owner, "Suresh", "9876123456", "DL-0420190004", today.plusMonths(9), DriverStatus.ACTIVE, 23_000);
        Driver mani = driver(owner, "Mani", "9876543210", "DL-0420190005", today.plusMonths(30), DriverStatus.INACTIVE, 19_000);
        Driver vijay = driver(owner, "Vijay", "9876000011", "DL-0420190006", today.plusMonths(16), DriverStatus.AVAILABLE, 20_500);
        Driver ganesh = driver(owner, "Ganesh", "9876000022", "DL-0420190007", today.plusMonths(11), DriverStatus.ACTIVE, 22_500);

        // Assignment history: Raj drove AB 1234 before Kumar took over.
        assign(v1, raj, today.minusYears(2), today.minusMonths(8));
        assign(v1, kumar, today.minusMonths(8), null);
        assign(v2, ganesh, today.minusYears(1), null);
        assign(v4, suresh, today.minusMonths(10), null);

        seedFuel(v1, 245_320, 7.8, today, 92.4);
        seedFuel(v2, 180_450, 7.2, today, 92.4);
        seedFuel(v3, 320_120, 6.9, today.minusDays(40), 91.8);
        seedFuel(v4, 150_780, 7.5, today, 92.4);

        seedMaintenance(v1, 245_320, 250_000, today);
        seedMaintenance(v2, 180_450, 180_950, today);   // 500 KM to go -> "service due" alert
        seedMaintenance(v3, 320_120, 321_800, today.minusDays(40));
        seedMaintenance(v4, 150_780, 153_980, today);

        seedExpenses(v1, today);
        seedExpenses(v2, today);
        seedExpenses(v4, today);
        expense(v3, today.minusDays(35), ExpenseCategory.REPAIR, 4_200, "Gearbox repair");
        expense(v1, today.minusDays(2), ExpenseCategory.TOLL, 650, "Highway toll");
        expense(v1, today.minusDays(1), ExpenseCategory.PARKING, 300, "Yard parking");
        expense(v2, today.minusDays(2), ExpenseCategory.DRIVER_ALLOWANCE, 800, "Night halt allowance");

        // Documents: some valid, one expiring soon, one expired.
        document(DocumentType.INSURANCE, v1, null, "INS-123456", today.minusYears(1).plusDays(10), today.plusDays(10));
        document(DocumentType.RC, v1, null, "RC-987654", today.minusYears(6), today.plusMonths(14));
        document(DocumentType.FITNESS_CERTIFICATE, v1, null, "FC-456789", today.minusMonths(4), today.plusMonths(20));
        document(DocumentType.POLLUTION_CERTIFICATE, v1, null, "PU-789012", today.minusMonths(2), today.plusMonths(4));
        document(DocumentType.INSURANCE, v2, null, "INS-223344", today.minusMonths(3), today.plusMonths(9));
        document(DocumentType.RC, v2, null, "RC-334455", today.minusYears(5), today.plusYears(10));
        document(DocumentType.FITNESS_CERTIFICATE, v3, null, "FC-778899", today.minusYears(2), today.minusDays(12));
        document(DocumentType.INSURANCE, v3, null, "INS-556677", today.minusMonths(5), today.plusMonths(7));
        document(DocumentType.INSURANCE, v4, null, "INS-998877", today.minusMonths(2), today.plusMonths(10));
        document(DocumentType.PERMIT, v4, null, "PER-112233", today.minusMonths(6), today.plusMonths(6));
        document(DocumentType.ROAD_TAX, v4, null, "TAX-445566", today.minusMonths(1), today.plusMonths(11));
        document(DocumentType.INSURANCE, v5, null, "INS-000111", today.minusYears(1), today.plusMonths(2));
        document(DocumentType.DRIVING_LICENCE, null, kumar, kumar.licenceNumber, today.minusYears(4), kumar.licenceExpiry);
        document(DocumentType.DRIVING_LICENCE, null, raj, raj.licenceNumber, today.minusYears(3), raj.licenceExpiry);
        document(DocumentType.DRIVING_LICENCE, null, suresh, suresh.licenceNumber, today.minusYears(2), suresh.licenceExpiry);

        LOG.info("Demo data loaded: 5 vehicles, 7 drivers, fuel, maintenance, expenses and documents");
    }

    private Vehicle vehicle(User owner, String number, String type, String make, String model, int year, long odometer,
                            VehicleStatus status, LocalDate registered) {
        Vehicle v = new Vehicle();
        v.owner = owner;
        v.vehicleNumber = number;
        v.vehicleType = type;
        v.manufacturer = make;
        v.model = model;
        v.manufacturingYear = year;
        v.fuelType = FuelType.DIESEL;
        v.registrationDate = registered;
        v.currentOdometer = odometer;
        v.status = status;
        vehicles.persist(v);
        return v;
    }

    private Driver driver(User owner, String name, String phone, String licence, LocalDate expiry,
                          DriverStatus status, int salary) {
        Driver d = new Driver();
        d.owner = owner;
        d.name = name;
        d.phone = phone;
        d.address = "Chennai, Tamil Nadu";
        d.licenceNumber = licence;
        d.licenceType = "HMV";
        d.licenceExpiry = expiry;
        d.joiningDate = LocalDate.now().minusYears(3);
        d.salary = BigDecimal.valueOf(salary);
        d.status = status;
        drivers.persist(d);
        return d;
    }

    private void assign(Vehicle vehicle, Driver driver, LocalDate start, LocalDate end) {
        VehicleDriverAssignment a = new VehicleDriverAssignment();
        a.vehicle = vehicle;
        a.driver = driver;
        a.startDate = start;
        a.endDate = end;
        assignments.persist(a);
        if (end == null) {
            vehicle.currentDriver = driver;
        }
    }

    /** A fill-up every ~15 days for the last ~14 months, walking the odometer backwards from its current value. */
    private void seedFuel(Vehicle v, long currentOdometer, double kmPerLitre, LocalDate latest, double latestPrice) {
        for (int k = 0; k < 28; k++) {
            LocalDate date = latest.minusDays(k * 15L + random.nextInt(3));
            long km = 380 + random.nextInt(140);
            BigDecimal litres = BigDecimal.valueOf(km / kmPerLitre).setScale(1, RoundingMode.HALF_UP);
            BigDecimal price = BigDecimal.valueOf(latestPrice - k * 0.15).setScale(2, RoundingMode.HALF_UP);
            FuelRecord f = new FuelRecord();
            f.vehicle = v;
            f.fuelDate = date;
            f.fuelType = FuelType.DIESEL;
            f.quantity = litres;
            f.pricePerLitre = price;
            f.totalAmount = litres.multiply(price).setScale(2, RoundingMode.HALF_UP);
            f.odometer = currentOdometer;
            f.fuelStation = k % 2 == 0 ? "Indian Oil - NH44" : "HP Petrol Bunk";
            fuel.persist(f);
            currentOdometer -= km;
        }
    }

    /** Quarterly service history; the newest record sets the "next service" target. */
    private void seedMaintenance(Vehicle v, long currentOdometer, long nextServiceKm, LocalDate latest) {
        MaintenanceType[] types = {MaintenanceType.GENERAL_SERVICE, MaintenanceType.ENGINE_OIL, MaintenanceType.BRAKE,
                MaintenanceType.TYRE, MaintenanceType.OIL_FILTER, MaintenanceType.AIR_FILTER};
        int[] costs = {5_000, 3_500, 4_800, 8_200, 1_400, 1_100};
        for (int k = 0; k < 6; k++) {
            MaintenanceRecord m = new MaintenanceRecord();
            m.vehicle = v;
            m.maintenanceDate = latest.minusDays(k * 45L + 3);
            m.maintenanceType = types[k];
            m.description = types[k].name().replace('_', ' ').toLowerCase() + " at authorised workshop";
            m.odometer = currentOdometer - k * 2_800L - 50;
            m.cost = BigDecimal.valueOf(costs[k] + random.nextInt(400));
            m.nextServiceKm = k == 0 ? nextServiceKm : m.odometer + 5_000;
            maintenance.persist(m);
        }
    }

    /** Small monthly costs so the "other expenses" slice of every chart has data. */
    private void seedExpenses(Vehicle v, LocalDate today) {
        ExpenseCategory[] categories = {ExpenseCategory.TOLL, ExpenseCategory.PARKING, ExpenseCategory.DRIVER_ALLOWANCE};
        List<String> descriptions = new ArrayList<>(List.of("Highway toll", "Yard parking", "Trip allowance"));
        for (int month = 0; month < 14; month++) {
            for (int c = 0; c < categories.length; c++) {
                int amount = switch (categories[c]) {
                    case TOLL -> 400 + random.nextInt(500);
                    case PARKING -> 100 + random.nextInt(250);
                    default -> 500 + random.nextInt(600);
                };
                expense(v, today.minusDays(month * 30L + 5 + c * 7L), categories[c], amount, descriptions.get(c));
            }
        }
    }

    private void expense(Vehicle v, LocalDate date, ExpenseCategory category, int amount, String description) {
        Expense e = new Expense();
        e.vehicle = v;
        e.expenseDate = date;
        e.category = category;
        e.amount = BigDecimal.valueOf(amount);
        e.description = description;
        expenses.persist(e);
    }

    private void document(DocumentType type, Vehicle v, Driver d, String number, LocalDate issued, LocalDate expiry) {
        Document doc = new Document();
        doc.documentType = type;
        doc.vehicle = v;
        doc.driver = d;
        doc.documentNumber = number;
        doc.issueDate = issued;
        doc.expiryDate = expiry;
        documents.persist(doc);
    }
}
