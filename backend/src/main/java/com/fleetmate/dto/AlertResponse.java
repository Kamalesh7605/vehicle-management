package com.fleetmate.dto;

/** key identifies the alert for read tracking; read is true once the current user has opened the notifications. */
public record AlertResponse(
        String id,
        String type,
        String severity,
        String title,
        String subject,
        String link,
        String key,
        boolean read) {

    public AlertResponse(String id, String type, String severity, String title, String subject, String link) {
        this(id, type, severity, title, subject, link, id + ":" + type, false);
    }

    public AlertResponse withRead(boolean value) {
        return new AlertResponse(id, type, severity, title, subject, link, key, value);
    }
}
