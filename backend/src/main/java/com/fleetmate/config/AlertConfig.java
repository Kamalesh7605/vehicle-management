package com.fleetmate.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "fleetmate.alerts")
public interface AlertConfig {

    /** Documents expiring within this many days are "expiring soon". */
    @WithDefault("30")
    int documentExpiryDays();

    /** A service is "due" when the remaining kilometres fall to this value or below. */
    @WithDefault("1000")
    int serviceDueKm();
}
