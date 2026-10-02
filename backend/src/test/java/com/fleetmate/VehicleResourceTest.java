package com.fleetmate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class VehicleResourceTest {

    @Test
    void createsVehicleAndNormalisesNumber() {
        String number = ApiTestSupport.uniqueNumber();
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleNumber", " " + number.toLowerCase() + " ", "fuelType", "PETROL",
                        "manufacturer", "Tata", "currentOdometer", 500))
                .post("/api/vehicles")
                .then().statusCode(201)
                .header("Location", containsString("/api/vehicles/"))
                .body("vehicleNumber", equalTo(number))
                .body("status", equalTo("ACTIVE"))
                .body("currentOdometer", equalTo(500));
    }

    @Test
    void rejectsDuplicateVehicleNumber() {
        String number = ApiTestSupport.uniqueNumber();
        ApiTestSupport.createVehicle(number, "ACTIVE", 0);
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleNumber", number, "fuelType", "DIESEL"))
                .post("/api/vehicles")
                .then().statusCode(409)
                .body("code", equalTo("VEHICLE_ALREADY_EXISTS"))
                .body("message", equalTo("Vehicle number already exists"));
    }

    @Test
    void validatesRequiredFields() {
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleNumber", "", "manufacturingYear", 1800))
                .post("/api/vehicles")
                .then().statusCode(400)
                .body("code", equalTo("VALIDATION_ERROR"))
                .body("errors", hasKey("vehicleNumber"))
                .body("errors", hasKey("fuelType"))
                .body("errors", hasKey("manufacturingYear"));
    }

    @Test
    void odometerCannotDecrease() {
        String number = ApiTestSupport.uniqueNumber();
        int id = ApiTestSupport.createVehicle(number, "ACTIVE", 5000);
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleNumber", number, "fuelType", "DIESEL", "currentOdometer", 4000))
                .put("/api/vehicles/" + id)
                .then().statusCode(400)
                .body("code", equalTo("ODOMETER_CANNOT_DECREASE"));
    }

    @Test
    void returnsNotFoundForUnknownVehicle() {
        given().get("/api/vehicles/999999").then().statusCode(404).body("code", equalTo("VEHICLE_NOT_FOUND"));
    }

    @Test
    void deletesVehicleWithItsRecords() {
        int id = ApiTestSupport.createVehicle();
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleId", id, "date", "2001-05-01", "category", "TOLL", "amount", 100))
                .post("/api/expenses").then().statusCode(201);
        given().delete("/api/vehicles/" + id).then().statusCode(204);
        given().get("/api/vehicles/" + id).then().statusCode(404);
        given().queryParam("vehicleId", id).get("/api/expenses").then().statusCode(200).body("totalElements", equalTo(0));
    }
}
