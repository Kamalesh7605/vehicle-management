package com.fleetmate.repository;

import com.fleetmate.entity.AlertRead;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class AlertReadRepository implements PanacheRepository<AlertRead> {

    public Set<String> keysFor(String username) {
        return list("username", username).stream().map(r -> r.alertKey).collect(Collectors.toSet());
    }

    /** Removes read markers for alerts that no longer exist, so the table does not grow forever. */
    public void deleteExcept(String username, Collection<String> liveKeys) {
        if (liveKeys.isEmpty()) {
            delete("username", username);
        } else {
            delete("username = ?1 and alertKey not in ?2", username, liveKeys);
        }
    }
}
