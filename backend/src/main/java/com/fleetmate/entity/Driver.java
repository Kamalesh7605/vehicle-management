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
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "drivers", uniqueConstraints = @UniqueConstraint(name = "uk_drivers_licence", columnNames = "licence_number"))
public class Driver extends BaseEntity {

    @Column(nullable = false, length = 100)
    public String name;

    @Column(nullable = false, length = 20)
    public String phone;

    @Column(length = 300)
    public String address;

    @Column(name = "licence_number", nullable = false, length = 50)
    public String licenceNumber;

    @Column(name = "licence_type", length = 50)
    public String licenceType;

    @Column(name = "licence_expiry", nullable = false)
    public LocalDate licenceExpiry;

    @Column(name = "joining_date")
    public LocalDate joiningDate;

    @Column(precision = 12, scale = 2)
    public BigDecimal salary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public DriverStatus status = DriverStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    public User owner;
}
