package com.fleetmate.dto;

import java.math.BigDecimal;
import java.util.List;

public record ExpenseBreakdown(BigDecimal total, List<Item> items) {

    public record Item(String key, String name, BigDecimal amount, double percentage) {
    }
}
