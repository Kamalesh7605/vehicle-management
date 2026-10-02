package com.fleetmate.mapper;

import com.fleetmate.dto.ExpenseResponse;
import com.fleetmate.entity.Expense;

public final class ExpenseMapper {

    private ExpenseMapper() {
    }

    public static ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(e.id, e.vehicle.id, e.vehicle.vehicleNumber, e.expenseDate, e.category, e.amount,
                e.description, e.notes);
    }
}
