package com.fleetmate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** Remembers that a user has seen an alert. Alerts themselves are computed live and not stored. */
@Entity
@Table(name = "alert_reads", uniqueConstraints = @UniqueConstraint(name = "uk_alert_reads_user_key",
        columnNames = {"username", "alert_key"}))
public class AlertRead extends BaseEntity {

    @Column(nullable = false, length = 50)
    public String username;

    /** alert id + type, so an escalation (expiring -> expired) is a new, unread alert. */
    @Column(name = "alert_key", nullable = false, length = 150)
    public String alertKey;
}
