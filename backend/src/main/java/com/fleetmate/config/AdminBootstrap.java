package com.fleetmate.config;

import com.fleetmate.entity.User;
import com.fleetmate.repository.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/** Makes sure the admin account exists and matches ADMIN_USERNAME / ADMIN_PASSWORD on every start. */
@ApplicationScoped
public class AdminBootstrap {

    private static final Logger LOG = Logger.getLogger(AdminBootstrap.class);

    @Inject
    UserRepository users;
    @Inject
    AuthConfig config;

    @Transactional
    void onStart(@Observes StartupEvent event) {
        User admin = users.defaultOwner();
        admin.username = config.adminUsername().trim();
        admin.active = true;
        if (admin.passwordHash == null || !BcryptUtil.matches(config.adminPassword(), admin.passwordHash)) {
            admin.passwordHash = BcryptUtil.bcryptHash(config.adminPassword());
        }
        if (config.enabled() && "admin".equals(config.adminPassword())) {
            LOG.warn("The admin password is the default 'admin'. Set ADMIN_PASSWORD before exposing this app.");
        }
    }
}
