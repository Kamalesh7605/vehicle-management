package com.fleetmate.repository;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Small helper for building optional-filter HQL where clauses for Panache repositories. */
public class QueryFilter {

    private final List<String> clauses = new ArrayList<>();
    private final Map<String, Object> params = new HashMap<>();

    /** Adds the clause only when value is present (non-null, non-blank). */
    public QueryFilter and(String clause, String param, Object value) {
        if (value == null || (value instanceof String s && s.isBlank())) {
            return this;
        }
        clauses.add(clause);
        params.put(param, value);
        return this;
    }

    /** Adds a clause with no parameter (or one whose parameters were added manually). */
    public QueryFilter and(String clause) {
        clauses.add(clause);
        return this;
    }

    /** Adds a case-insensitive "contains" clause; the clause must reference :q. */
    public QueryFilter search(String clause, String text) {
        if (text == null || text.isBlank()) {
            return this;
        }
        clauses.add(clause);
        params.put("q", "%" + text.trim().toLowerCase(Locale.ROOT) + "%");
        return this;
    }

    public QueryFilter param(String name, Object value) {
        params.put(name, value);
        return this;
    }

    public String where() {
        return clauses.isEmpty() ? "1=1" : String.join(" and ", clauses);
    }

    public Map<String, Object> params() {
        return params;
    }

    public <E> List<E> list(PanacheRepository<E> repo, String orderBy) {
        return repo.find(where() + " order by " + orderBy, params).list();
    }

    public <E> PagedResult<E> page(PanacheRepository<E> repo, String orderBy, int page, int size) {
        PanacheQuery<E> query = repo.find(where() + " order by " + orderBy, params);
        long total = query.count();
        List<E> items = query.page(Page.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))).list();
        return new PagedResult<>(items, total);
    }

    public record PagedResult<E>(List<E> items, long total) {
    }
}
