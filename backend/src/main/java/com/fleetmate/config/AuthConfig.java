package com.fleetmate.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;
import java.util.Optional;

@ConfigMapping(prefix = "fleetmate.auth")
public interface AuthConfig {

    /** When false every endpoint is open (used by the automated tests). */
    @WithDefault("true")
    boolean enabled();

    Optional<String> jwtSecret();

    @WithDefault("8")
    int tokenHours();

    @WithDefault("admin")
    String adminUsername();

    @WithDefault("admin")
    String adminPassword();
}
