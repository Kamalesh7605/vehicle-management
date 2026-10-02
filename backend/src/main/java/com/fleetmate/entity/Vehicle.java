package com.fleetmate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;

@Entity
@Table(name = "vehicles", uniqueConstraints = @UniqueConstraint(name = "uk_vehicles_number", columnNames = "vehicle_number"))
public class Vehicle extends BaseEntity {

    @Column(name = "vehicle_number", nullable = false, length = 30)
    public String vehicleNumber;

    @Column(name = "vehicle_type", length = 50)
    public String vehicleType;

    @Column(length = 100)
    public String manufacturer;

    @Column(length = 100)
    public String model;

    @Column(name = "manufacturing_year")
    public Integer manufacturingYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 20)
    public FuelType fuelType;

    @Column(name = "registration_date")
    public LocalDate registrationDate;

    @Column(name = "current_odometer", nullable = false)
    public long currentOdometer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public VehicleStatus status = VehicleStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_driver_id")
    public Driver currentDriver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    public User owner;
}
