package com.fleetmate;

import static io.restassured.RestAssured.given;

import io.restassured.http.ContentType;
import java.util.Map;
import java.util.UUID;

/** Helpers that create test data through the public REST API. */
final class ApiTestSupport {

    private ApiTestSupport() {
    }

    static String uniqueNumber() {
        return "TN " + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    static int createVehicle(String number, String status, int odometer) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("vehicleNumber", number, "fuelType", "DIESEL", "status", status,
                        "currentOdometer", odometer))
                .post("/api/vehicles").then().statusCode(201).extract().path("id");
    }

    static int createVehicle() {
        return createVehicle(uniqueNumber(), "ACTIVE", 1000);
    }

    static int createDriver(String name) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("name", name, "phone", "9876543210", "licenceNumber", "DL-" + UUID.randomUUID(),
                        "licenceExpiry", "2035-01-01"))
                .post("/api/drivers").then().statusCode(201).extract().path("id");
    }
}
