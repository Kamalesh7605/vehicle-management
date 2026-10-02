package com.fleetmate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "vehicle_driver_assignments")
public class VehicleDriverAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    public Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "driver_id", nullable = false)
    public Driver driver;

    @Column(name = "start_date", nullable = false)
    public LocalDate startDate;

    /** null while the assignment is still current. */
    @Column(name = "end_date")
    public LocalDate endDate;
}
