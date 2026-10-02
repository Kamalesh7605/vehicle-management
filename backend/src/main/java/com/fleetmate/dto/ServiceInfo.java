package com.fleetmate.dto;

import java.time.LocalDate;

/** remainingKm is negative when the service is overdue; all fields are null when no service target is set. */
public record ServiceInfo(Long nextServiceKm, Long remainingKm, LocalDate lastServiceDate, boolean due) {
}
