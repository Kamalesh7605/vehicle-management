package com.fleetmate.dto;

import java.util.List;

public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> of(List<T> content, long total, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 200);
        return new PageResponse<>(content, Math.max(page, 0), safeSize, total, (int) Math.ceil(total / (double) safeSize));
    }
}
