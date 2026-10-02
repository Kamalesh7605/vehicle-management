package com.fleetmate.dto;

import java.math.BigDecimal;

public record MonthlyExpense(String month, String label, BigDecimal fuel, BigDecimal maintenance, BigDecimal other,
                             BigDecimal total) {
}
