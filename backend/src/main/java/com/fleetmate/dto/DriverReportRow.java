package com.fleetmate.dto;

import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DriverStatus;
import java.time.LocalDate;

public record DriverReportRow(Long driverId, String driverName, String phone, String vehicleNumber,
                              DriverStatus status, String licenceNumber, LocalDate licenceExpiry,
                              DocumentStatus licenceStatus) {
}
