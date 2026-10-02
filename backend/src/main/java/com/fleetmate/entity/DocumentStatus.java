package com.fleetmate.entity;

import java.time.LocalDate;

public enum DocumentStatus {
    VALID, EXPIRING_SOON, EXPIRED;

    /** expired: expiry &lt; today; expiring soon: expiry &lt;= today + soonDays; otherwise valid. */
    public static DocumentStatus of(LocalDate expiry, LocalDate today, int soonDays) {
        if (expiry == null) {
            return VALID;
        }
        if (expiry.isBefore(today)) {
            return EXPIRED;
        }
        if (!expiry.isAfter(today.plusDays(soonDays))) {
            return EXPIRING_SOON;
        }
        return VALID;
    }
}
