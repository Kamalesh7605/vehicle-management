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
@Table(name = "expenses")
public class Expense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    public Vehicle vehicle;

    @Column(name = "expense_date", nullable = false)
    public LocalDate expenseDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    public ExpenseCategory category;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal amount;

    @Column(length = 300)
    public String description;

    @Column(length = 500)
    public String notes;
}
