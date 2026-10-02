package com.fleetmate.repository;

import com.fleetmate.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {

    public static final String DEFAULT_EMAIL = "admin@fleetmate.local";

    /** The application has no login yet, so all data belongs to one default owner. */
    public User defaultOwner() {
        return find("email", DEFAULT_EMAIL).firstResultOptional().orElseGet(() -> {
            User user = new User();
            user.name = "Admin";
            user.email = DEFAULT_EMAIL;
            persist(user);
            return user;
        });
    }
}
