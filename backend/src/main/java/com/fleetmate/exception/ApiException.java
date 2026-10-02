package com.fleetmate.exception;

import jakarta.ws.rs.core.Response.Status;

/** Business/API error carrying the HTTP status and a stable machine-readable code. */
public class ApiException extends RuntimeException {

    private final int status;
    private final String code;

    public ApiException(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public static ApiException notFound(String entity, Object id) {
        return new ApiException(Status.NOT_FOUND.getStatusCode(), entity.toUpperCase() + "_NOT_FOUND",
                entity + " not found with id " + id);
    }

    public static ApiException conflict(String code, String message) {
        return new ApiException(Status.CONFLICT.getStatusCode(), code, message);
    }

    public static ApiException badRequest(String code, String message) {
        return new ApiException(Status.BAD_REQUEST.getStatusCode(), code, message);
    }
}
