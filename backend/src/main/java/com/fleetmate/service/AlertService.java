package com.fleetmate.service;

import com.fleetmate.config.AlertConfig;
import com.fleetmate.dto.AlertResponse;
import com.fleetmate.dto.ServiceInfo;
import com.fleetmate.entity.AlertRead;
import com.fleetmate.entity.Document;
import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DocumentType;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.VehicleStatus;
import com.fleetmate.repository.AlertReadRepository;
import com.fleetmate.repository.DocumentRepository;
import com.fleetmate.repository.DriverRepository;
import com.fleetmate.repository.VehicleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class AlertService {

    static final String WARNING = "WARNING";
    static final String DANGER = "DANGER";

    @Inject
    DocumentRepository documents;
    @Inject
    DriverRepository drivers;
    @Inject
    VehicleRepository vehicles;
    @Inject
    ServiceStatusCalculator serviceStatus;
    @Inject
    AlertConfig alertConfig;

    @Inject
    AlertReadRepository alertReads;

    /** Active alerts, each flagged with whether this user has already seen it. */
    @Transactional
    public List<AlertResponse> alerts(String username) {
        Set<String> read = alertReads.keysFor(username);
        return compute().stream().map(a -> a.withRead(read.contains(a.key()))).toList();
    }

    /** Marks every currently active alert as seen by this user. */
    @Transactional
    public void markAllRead(String username) {
        List<AlertResponse> current = compute();
        Set<String> already = alertReads.keysFor(username);
        for (AlertResponse alert : current) {
            if (!already.contains(alert.key())) {
                AlertRead marker = new AlertRead();
                marker.username = username;
                marker.alertKey = alert.key();
                alertReads.persist(marker);
            }
        }
        alertReads.flush();
        alertReads.deleteExcept(username, current.stream().map(AlertResponse::key).toList());
    }

    private List<AlertResponse> compute() {
        LocalDate today = LocalDate.now();
        int soon = alertConfig.documentExpiryDays();
        List<Ranked> alerts = new ArrayList<>();
        Set<Long> driversAlerted = new HashSet<>();

        // Driver licences (from the driver record, so they are always covered).
        drivers.list("status <> ?1", DriverStatus.INACTIVE).forEach(d -> {
            DocumentStatus status = DocumentStatus.of(d.licenceExpiry, today, soon);
            if (status != DocumentStatus.VALID) {
                driversAlerted.add(d.id);
                alerts.add(expiry("LICENCE", "licence-" + d.id, "Driver licence", d.name, "/drivers?q=" + d.name,
                        d.licenceExpiry, today, status));
            }
        });

        // Vehicle documents (and licence documents of drivers not already covered above).
        for (Document doc : DocumentService.latestPerType(documents.listAll())) {
            DocumentStatus status = DocumentStatus.of(doc.expiryDate, today, soon);
            if (status == DocumentStatus.VALID) {
                continue;
            }
            if (doc.documentType == DocumentType.DRIVING_LICENCE) {
                if (driversAlerted.contains(doc.driver.id) || doc.driver.status == DriverStatus.INACTIVE) {
                    continue;
                }
                alerts.add(expiry("LICENCE", "doc-" + doc.id, "Driver licence", doc.driver.name, "/documents",
                        doc.expiryDate, today, status));
            } else {
                alerts.add(expiry("DOCUMENT", "doc-" + doc.id, label(doc.documentType), doc.vehicle.vehicleNumber,
                        "/documents", doc.expiryDate, today, status));
            }
        }

        // Services that are due or overdue.
        vehicles.list("status <> ?1", VehicleStatus.INACTIVE).forEach(v -> {
            ServiceInfo info = serviceStatus.forVehicle(v);
            if (info.due()) {
                boolean overdue = info.remainingKm() <= 0;
                String title = overdue
                        ? String.format("Service overdue by %,d KM", -info.remainingKm())
                        : String.format("Service due in %,d KM", info.remainingKm());
                alerts.add(new Ranked(new AlertResponse("service-" + v.id, overdue ? "SERVICE_OVERDUE" : "SERVICE_DUE",
                        overdue ? DANGER : WARNING, title, v.vehicleNumber, "/vehicles/" + v.id),
                        overdue ? 0 : 1, info.remainingKm()));
            }
        });

        return alerts.stream()
                .sorted(Comparator.comparingInt(Ranked::rank).thenComparingLong(Ranked::urgency))
                .map(Ranked::alert)
                .toList();
    }

    private Ranked expiry(String kind, String id, String label, String subject, String link, LocalDate expiry,
                          LocalDate today, DocumentStatus status) {
        long days = ChronoUnit.DAYS.between(today, expiry);
        boolean expired = status == DocumentStatus.EXPIRED;
        String title = expired ? label + " expired"
                : days == 0 ? label + " expires today"
                : label + " expires in " + days + (days == 1 ? " day" : " days");
        return new Ranked(new AlertResponse(id, kind + (expired ? "_EXPIRED" : "_EXPIRING"),
                expired ? DANGER : WARNING, title, subject, link), expired ? 0 : 1, days);
    }

    private static String label(DocumentType type) {
        return switch (type) {
            case RC -> "RC";
            case INSURANCE -> "Insurance";
            case FITNESS_CERTIFICATE -> "Fitness certificate";
            case POLLUTION_CERTIFICATE -> "Pollution certificate";
            case PERMIT -> "Permit";
            case ROAD_TAX -> "Road tax";
            case DRIVING_LICENCE -> "Driver licence";
        };
    }

    private record Ranked(AlertResponse alert, int rank, long urgency) {
    }
}
