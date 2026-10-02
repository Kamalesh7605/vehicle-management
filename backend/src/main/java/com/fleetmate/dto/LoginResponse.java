package com.fleetmate.dto;

public record LoginResponse(String token, String username, long expiresInSeconds) {
}
