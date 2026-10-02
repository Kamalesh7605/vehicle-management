package com.fleetmate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "maintenance_records")
public class MaintenanceRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    public Vehicle vehicle;

    @Column(name = "maintenance_date", nullable = false)
    public LocalDate maintenanceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 30)
    public MaintenanceType maintenanceType;

    @Column(length = 500)
    public String description;

    public Long odometer;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal cost;

    @Column(name = "next_service_km")
    public Long nextServiceKm;

    @Column(length = 500)
    public String notes;
}
