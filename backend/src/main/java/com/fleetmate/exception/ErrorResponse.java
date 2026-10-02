package com.fleetmate.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String message, String code, Map<String, String> errors) {

    public ErrorResponse(String message, String code) {
        this(message, code, null);
    }
}
