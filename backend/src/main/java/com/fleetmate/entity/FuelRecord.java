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
@Table(name = "fuel_records")
public class FuelRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    public Vehicle vehicle;

    @Column(name = "fuel_date", nullable = false)
    public LocalDate fuelDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", length = 20)
    public FuelType fuelType;

    @Column(nullable = false, precision = 10, scale = 2)
    public BigDecimal quantity;

    @Column(name = "price_per_litre", nullable = false, precision = 10, scale = 2)
    public BigDecimal pricePerLitre;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    public BigDecimal totalAmount;

    public Long odometer;

    @Column(name = "fuel_station", length = 150)
    public String fuelStation;

    @Column(length = 500)
    public String notes;
}
