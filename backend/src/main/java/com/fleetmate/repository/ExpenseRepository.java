package com.fleetmate.repository;

import com.fleetmate.entity.Expense;
import com.fleetmate.entity.ExpenseCategory;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ExpenseRepository implements PanacheRepository<Expense> {

    private static QueryFilter filter(String q, Long vehicleId, ExpenseCategory category, LocalDate from,
                                      LocalDate to) {
        return new QueryFilter()
                .search("(lower(coalesce(description, '')) like :q or lower(coalesce(notes, '')) like :q"
                        + " or vehicle.id in (select v.id from Vehicle v where lower(v.vehicleNumber) like :q))", q)
                .and("vehicle.id = :vehicleId", "vehicleId", vehicleId)
                .and("category = :category", "category", category)
                .and("expenseDate >= :from", "from", from)
                .and("expenseDate <= :to", "to", to);
    }

    public QueryFilter.PagedResult<Expense> search(String q, Long vehicleId, ExpenseCategory category,
                                                   LocalDate from, LocalDate to, int page, int size) {
        return filter(q, vehicleId, category, from, to).page(this, "expenseDate desc, id desc", page, size);
    }

    public List<Expense> inRange(Long vehicleId, LocalDate from, LocalDate to) {
        return filter(null, vehicleId, null, from, to).list(this, "expenseDate, id");
    }

    public List<Expense> recent(int limit) {
        return find("order by expenseDate desc, id desc").page(0, limit).list();
    }

    public long deleteByVehicle(Long vehicleId) {
        return delete("vehicle.id", vehicleId);
    }
}
