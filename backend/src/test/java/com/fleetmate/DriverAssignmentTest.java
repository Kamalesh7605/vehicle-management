package com.fleetmate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

@QuarkusTest
class DriverAssignmentTest {

    @Test
    void createsDriverAndRejectsDuplicateLicence() {
        String licence = "DL-" + UUID.randomUUID();
        Map<String, Object> body = Map.of("name", "Test Driver", "phone", "9876543210", "licenceNumber", licence,
                "licenceExpiry", "2035-01-01");
        given().contentType(ContentType.JSON).body(body).post("/api/drivers")
                .then().statusCode(201).body("status", equalTo("AVAILABLE")).body("licenceStatus", equalTo("VALID"));
        given().contentType(ContentType.JSON).body(body).post("/api/drivers")
                .then().statusCode(409).body("code", equalTo("LICENCE_ALREADY_EXISTS"));
    }

    @Test
    void validatesPhoneAndLicence() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "X", "phone", "abc", "licenceNumber", "", "licenceExpiry", "2035-01-01"))
                .post("/api/drivers")
                .then().statusCode(400).body("errors.phone", equalTo("Enter a valid phone number"));
    }

    @Test
    void reassigningClosesPreviousAssignmentAndKeepsHistory() {
        int vehicle = ApiTestSupport.createVehicle();
        int first = ApiTestSupport.createDriver("First");
        int second = ApiTestSupport.createDriver("Second");

        assign(vehicle, first, "2025-01-01").statusCode(201).body("current", equalTo(true));
        assign(vehicle, second, "2026-09-01").statusCode(201);

        given().get("/api/vehicles/" + vehicle).then().body("assignedDriverId", equalTo(second));
        given().get("/api/vehicles/" + vehicle + "/driver-history").then()
                .body("$", hasSize(2))
                .body("[0].driverId", equalTo(second)).body("[0].endDate", nullValue())
                .body("[1].driverId", equalTo(first)).body("[1].endDate", equalTo("2026-09-01"));
        given().get("/api/drivers/" + first).then().body("status", equalTo("AVAILABLE"));
        given().get("/api/drivers/" + second).then()
                .body("status", equalTo("ACTIVE")).body("assignedVehicleId", equalTo(vehicle));
        given().get("/api/drivers/" + first + "/vehicle-history").then().body("$", hasSize(1));
    }

    @Test
    void driverCanOnlyHaveOneActiveVehicle() {
        int driver = ApiTestSupport.createDriver("Busy");
        assign(ApiTestSupport.createVehicle(), driver, null).statusCode(201);
        assign(ApiTestSupport.createVehicle(), driver, null).statusCode(409)
                .body("code", equalTo("DRIVER_ALREADY_ASSIGNED"));
    }

    @Test
    void deletingAVehicleFreesItsDriver() {
        int vehicle = ApiTestSupport.createVehicle();
        int driver = ApiTestSupport.createDriver("Orphan");
        assign(vehicle, driver, null).statusCode(201);
        given().delete("/api/vehicles/" + vehicle).then().statusCode(204);
        given().get("/api/drivers/" + driver).then()
                .body("status", equalTo("AVAILABLE")).body("assignedVehicleId", nullValue());
    }

    @Test
    void unassigningFreesTheVehicle() {
        int vehicle = ApiTestSupport.createVehicle();
        int driver = ApiTestSupport.createDriver("Leaver");
        assign(vehicle, driver, null).statusCode(201);
        given().contentType(ContentType.JSON).body(Map.of("vehicleId", vehicle))
                .post("/api/vehicle-driver-assignments").then().statusCode(201).body("current", equalTo(false));
        given().get("/api/vehicles/" + vehicle).then().body("assignedDriverId", nullValue());
    }

    private io.restassured.response.ValidatableResponse assign(int vehicleId, int driverId, String startDate) {
        Map<String, Object> body = startDate == null
                ? Map.of("vehicleId", vehicleId, "driverId", driverId)
                : Map.of("vehicleId", vehicleId, "driverId", driverId, "startDate", startDate);
        return given().contentType(ContentType.JSON).body(body).post("/api/vehicle-driver-assignments").then();
    }
}
