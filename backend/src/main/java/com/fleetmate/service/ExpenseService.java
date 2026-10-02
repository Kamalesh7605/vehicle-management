package com.fleetmate.service;

import com.fleetmate.dto.ExpenseRequest;
import com.fleetmate.dto.ExpenseResponse;
import com.fleetmate.dto.PageResponse;
import com.fleetmate.entity.Expense;
import com.fleetmate.entity.ExpenseCategory;
import com.fleetmate.exception.ApiException;
import com.fleetmate.mapper.ExpenseMapper;
import com.fleetmate.repository.ExpenseRepository;
import com.fleetmate.repository.QueryFilter.PagedResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ExpenseService {

    @Inject
    ExpenseRepository expenses;
    @Inject
    VehicleService vehicleService;

    @Transactional
    public PageResponse<ExpenseResponse> list(String q, Long vehicleId, ExpenseCategory category, LocalDate from,
                                              LocalDate to, int page, int size) {
        PagedResult<Expense> result = expenses.search(q, vehicleId, category, from, to, page, size);
        return PageResponse.of(result.items().stream().map(ExpenseMapper::toResponse).toList(), result.total(), page,
                size);
    }

    @Transactional
    public List<ExpenseResponse> recent(int limit) {
        return expenses.recent(limit).stream().map(ExpenseMapper::toResponse).toList();
    }

    @Transactional
    public ExpenseResponse get(Long id) {
        return ExpenseMapper.toResponse(require(id));
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request) {
        Expense expense = new Expense();
        apply(expense, request);
        expenses.persist(expense);
        return ExpenseMapper.toResponse(expense);
    }

    @Transactional
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = require(id);
        apply(expense, request);
        return ExpenseMapper.toResponse(expense);
    }

    @Transactional
    public void delete(Long id) {
        expenses.delete(require(id));
    }

    private void apply(Expense expense, ExpenseRequest r) {
        expense.vehicle = vehicleService.require(r.vehicleId());
        expense.expenseDate = r.date();
        expense.category = r.category();
        expense.amount = r.amount();
        expense.description = VehicleService.blankToNull(r.description());
        expense.notes = VehicleService.blankToNull(r.notes());
    }

    private Expense require(Long id) {
        Expense expense = expenses.findById(id);
        if (expense == null) {
            throw ApiException.notFound("Expense", id);
        }
        return expense;
    }
}
