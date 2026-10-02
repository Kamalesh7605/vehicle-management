package com.fleetmate.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "fleetmate.storage")
public interface StorageConfig {

    @WithDefault("./uploads")
    String dir();
}
