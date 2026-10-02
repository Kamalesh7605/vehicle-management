package com.fleetmate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fleetmate.dto.MileageInfo;
import com.fleetmate.entity.FuelRecord;
import com.fleetmate.service.FuelService;
import com.fleetmate.service.MileageCalculator;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class FuelMaintenanceExpenseTest {

    @Test
    void fuelTotalIsQuantityTimesPriceUnlessOverridden() {
        assertEquals(new BigDecimal("4500.00"),
                FuelService.calculateTotal(new BigDecimal("50"), new BigDecimal("90"), null));
        assertEquals(new BigDecimal("4400.00"),
                FuelService.calculateTotal(new BigDecimal("50"), new BigDecimal("90"), new BigDecimal("4400")));
    }

    @Test
    void fuelRecordCalculatesTotalAndAdvancesOdometer() {
        int vehicle = ApiTestSupport.createVehicle(ApiTestSupport.uniqueNumber(), "ACTIVE", 1000);
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleId", vehicle, "date", "2001-02-01", "quantity", 40, "pricePerLitre", 92.5,
                        "odometer", 1500))
                .post("/api/fuel").then().statusCode(201)
                .body("totalAmount", equalTo(3700.0f)).body("fuelType", equalTo("DIESEL"));
        given().get("/api/vehicles/" + vehicle).then().body("currentOdometer", equalTo(1500));
    }

    @Test
    void inactiveVehicleNeedsExplicitPermissionForNewRecords() {
        int vehicle = ApiTestSupport.createVehicle(ApiTestSupport.uniqueNumber(), "INACTIVE", 1000);
        Map<String, Object> body = Map.of("vehicleId", vehicle, "date", "2001-02-01", "quantity", 10,
                "pricePerLitre", 90);
        given().contentType(ContentType.JSON).body(body).post("/api/fuel")
                .then().statusCode(409).body("code", equalTo("VEHICLE_INACTIVE"));
        given().contentType(ContentType.JSON).body(Map.of("vehicleId", vehicle, "date", "2001-02-01", "quantity", 10,
                        "pricePerLitre", 90, "allowInactive", true))
                .post("/api/fuel").then().statusCode(201);
    }

    @Test
    void fuelListIsPagedAndFiltered() {
        int vehicle = ApiTestSupport.createVehicle();
        for (int i = 1; i <= 3; i++) {
            given().contentType(ContentType.JSON)
                    .body(Map.of("vehicleId", vehicle, "date", "2001-03-0" + i, "quantity", 10, "pricePerLitre", 90))
                    .post("/api/fuel").then().statusCode(201);
        }
        given().queryParam("vehicleId", vehicle).queryParam("size", 2).get("/api/fuel").then()
                .body("content", hasSize(2)).body("totalElements", equalTo(3)).body("totalPages", equalTo(2))
                .body("content[0].date", equalTo("2001-03-03"));
        given().queryParam("vehicleId", vehicle).queryParam("from", "2001-03-02").get("/api/fuel").then()
                .body("totalElements", equalTo(2));
    }

    @Test
    void mileageUsesDistanceAndFuelAfterTheFirstFill() {
        FuelRecord first = fill(240_000, "100");
        FuelRecord last = fill(245_320, "680");
        MileageInfo info = MileageCalculator.calculate(List.of(first, last));
        assertEquals(new BigDecimal("7.82"), info.mileage());
        assertEquals(5320L, info.distanceKm());
    }

    @Test
    void mileageIsNullWhenDataIsInsufficient() {
        MileageInfo info = MileageCalculator.calculate(List.of(fill(1000, "50")));
        assertNull(info.mileage());
        assertEquals("Add at least two fuel entries with odometer readings", info.message());
    }

    @Test
    void vehicleSummaryReportsMileageOnlyWhenPossible() {
        int vehicle = ApiTestSupport.createVehicle();
        given().get("/api/vehicles/" + vehicle + "/summary").then().body("mileage.mileage", nullValue());
        for (int[] fill : new int[][] {{1000, 40}, {1400, 50}, {1800, 50}}) {
            given().contentType(ContentType.JSON)
                    .body(Map.of("vehicleId", vehicle, "date", "2001-04-01", "quantity", fill[1], "pricePerLitre", 100,
                            "odometer", fill[0]))
                    .post("/api/fuel").then().statusCode(201);
        }
        given().get("/api/vehicles/" + vehicle + "/summary").then()
                .body("mileage.mileage", equalTo(8.0f)).body("totalFuelCost", equalTo(14000.0f));
    }

    @Test
    void maintenanceReportsRemainingKmOnLatestTargetOnly() {
        int vehicle = ApiTestSupport.createVehicle(ApiTestSupport.uniqueNumber(), "ACTIVE", 245_320);
        int older = maintenance(vehicle, "2001-01-01", 240_000);
        int latest = maintenance(vehicle, "2001-06-01", 250_000);
        given().get("/api/maintenance/" + latest).then()
                .body("currentKm", equalTo(245_320)).body("remainingKm", equalTo(4_680));
        given().get("/api/maintenance/" + older).then().body("remainingKm", nullValue());
    }

    @Test
    void serviceDueProducesAlert() {
        String number = ApiTestSupport.uniqueNumber();
        int vehicle = ApiTestSupport.createVehicle(number, "ACTIVE", 179_900);
        maintenance(vehicle, "2001-01-01", 180_400);
        given().get("/api/dashboard/alerts").then()
                .body("find { it.subject == '" + number + "' }.title", equalTo("Service due in 500 KM"))
                .body("find { it.subject == '" + number + "' }.severity", equalTo("WARNING"));
    }

    @Test
    void expenseCrud() {
        int vehicle = ApiTestSupport.createVehicle();
        int id = given().contentType(ContentType.JSON)
                .body(Map.of("vehicleId", vehicle, "date", "2001-07-01", "category", "TOLL", "amount", 650,
                        "description", "Toll plaza"))
                .post("/api/expenses").then().statusCode(201).extract().path("id");
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleId", vehicle, "date", "2001-07-02", "category", "PARKING", "amount", 300))
                .put("/api/expenses/" + id).then().statusCode(200).body("category", equalTo("PARKING"));
        given().contentType(ContentType.JSON)
                .body(Map.of("vehicleId", vehicle, "date", "2001-07-02", "category", "PARKING", "amount", 0))
                .post("/api/expenses").then().statusCode(400).body("errors.amount", equalTo("Amount must be greater than 0"));
        given().delete("/api/expenses/" + id).then().statusCode(204);
        given().get("/api/expenses/" + id).then().statusCode(404);
    }

    private static int maintenance(int vehicle, String date, int nextServiceKm) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("vehicleId", vehicle, "date", date, "maintenanceType", "GENERAL_SERVICE", "cost", 5000,
                        "nextServiceKm", nextServiceKm))
                .post("/api/maintenance").then().statusCode(201).extract().path("id");
    }

    private static FuelRecord fill(long odometer, String litres) {
        FuelRecord r = new FuelRecord();
        r.odometer = odometer;
        r.quantity = new BigDecimal(litres);
        return r;
    }
}
