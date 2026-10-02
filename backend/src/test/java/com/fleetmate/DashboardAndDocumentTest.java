package com.fleetmate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class DashboardAndDocumentTest {

    @Test
    void dashboardAggregatesFuelMaintenanceAndExpenses() {
        int vehicle = ApiTestSupport.createVehicle();
        post("/api/fuel", Map.of("vehicleId", vehicle, "date", "2003-03-10", "quantity", 10, "pricePerLitre", 100));
        post("/api/maintenance", Map.of("vehicleId", vehicle, "date", "2003-03-11", "maintenanceType", "BRAKE",
                "cost", 500));
        post("/api/expenses", Map.of("vehicleId", vehicle, "date", "2003-03-12", "category", "TOLL", "amount", 100));
        post("/api/expenses", Map.of("vehicleId", vehicle, "date", "2003-03-13", "category", "FUEL", "amount", 200));
        post("/api/expenses", Map.of("vehicleId", vehicle, "date", "2003-03-14", "category", "REPAIR", "amount", 50));

        given().queryParam("from", "2003-01-01").queryParam("to", "2003-12-31")
                .get("/api/dashboard/summary").then().statusCode(200)
                .body("fuelExpense", equalTo(1200.0f))          // fuel record + FUEL expense
                .body("maintenanceExpense", equalTo(550.0f))    // maintenance record + REPAIR expense
                .body("otherExpense", equalTo(100.0f))
                .body("totalExpense", equalTo(1850.0f));

        given().queryParam("from", "2003-01-01").queryParam("to", "2003-12-31")
                .get("/api/dashboard/expense-breakdown").then()
                .body("total", equalTo(1850.0f)).body("items", hasSize(3))
                .body("items[0].key", equalTo("FUEL")).body("items[0].percentage", equalTo(64.9f));

        given().queryParam("year", 2003).get("/api/dashboard/monthly-expenses").then()
                .body("$", hasSize(12)).body("[2].label", equalTo("Mar")).body("[2].fuel", equalTo(1200.0f))
                .body("[2].total", equalTo(1850.0f)).body("[0].total", equalTo(0));

        given().queryParam("vehicleId", vehicle).queryParam("from", "2003-01-01").queryParam("to", "2003-12-31")
                .get("/api/reports/vehicle-expenses").then()
                .body("$", hasSize(1)).body("[0].toll", equalTo(100.0f)).body("[0].total", equalTo(1850.0f));
    }

    @Test
    void dashboardSummaryCountsVehiclesAndDrivers() {
        ApiTestSupport.createVehicle(ApiTestSupport.uniqueNumber(), "MAINTENANCE", 0);
        ApiTestSupport.createDriver("Counted");
        given().get("/api/dashboard/summary").then().statusCode(200)
                .body("totalVehicles", org.hamcrest.Matchers.greaterThanOrEqualTo(1))
                .body("inServiceVehicles", org.hamcrest.Matchers.greaterThanOrEqualTo(1))
                .body("totalDrivers", org.hamcrest.Matchers.greaterThanOrEqualTo(1));
    }

    @Test
    void documentStatusFollowsExpiryRules() {
        int vehicle = ApiTestSupport.createVehicle();
        LocalDate today = LocalDate.now();
        doc(vehicle, "INSURANCE", today.plusDays(31)).body("status", equalTo("VALID"));
        doc(vehicle, "RC", today.plusDays(30)).body("status", equalTo("EXPIRING_SOON"));
        doc(vehicle, "PERMIT", today).body("status", equalTo("EXPIRING_SOON")).body("daysRemaining", equalTo(0));
        doc(vehicle, "ROAD_TAX", today.minusDays(1)).body("status", equalTo("EXPIRED"));

        given().queryParam("vehicleId", vehicle).queryParam("status", "EXPIRED").get("/api/documents").then()
                .body("totalElements", equalTo(1)).body("content[0].documentType", equalTo("ROAD_TAX"));
    }

    @Test
    void documentOwnerIsValidatedByType() {
        int vehicle = ApiTestSupport.createVehicle();
        given().contentType(ContentType.JSON)
                .body(Map.of("documentType", "DRIVING_LICENCE", "vehicleId", vehicle, "expiryDate", "2030-01-01"))
                .post("/api/documents").then().statusCode(400).body("code", equalTo("DRIVER_REQUIRED"));
        given().contentType(ContentType.JSON)
                .body(Map.of("documentType", "INSURANCE", "expiryDate", "2030-01-01"))
                .post("/api/documents").then().statusCode(400).body("code", equalTo("VEHICLE_REQUIRED"));
    }

    @Test
    void expiredDocumentAppearsInAlertsUntilRenewed() {
        String number = ApiTestSupport.uniqueNumber();
        int vehicle = ApiTestSupport.createVehicle(number, "ACTIVE", 0);
        doc(vehicle, "FITNESS_CERTIFICATE", LocalDate.now().minusDays(5));
        given().get("/api/dashboard/alerts").then()
                .body("find { it.subject == '" + number + "' }.title", equalTo("Fitness certificate expired"))
                .body("find { it.subject == '" + number + "' }.severity", equalTo("DANGER"));
        doc(vehicle, "FITNESS_CERTIFICATE", LocalDate.now().plusYears(1));
        given().get("/api/dashboard/alerts").then().body("subject", not(hasItem(number)));
    }

    @Test
    void driverLicenceExpiryProducesAlert() {
        int driver = given().contentType(ContentType.JSON)
                .body(Map.of("name", "Expiring Ed", "phone", "9876543210", "licenceNumber", "DL-ED-1",
                        "licenceExpiry", LocalDate.now().plusDays(20).toString()))
                .post("/api/drivers").then().statusCode(201).body("licenceStatus", equalTo("EXPIRING_SOON"))
                .extract().path("id");
        given().get("/api/dashboard/alerts").then()
                .body("find { it.subject == 'Expiring Ed' }.title", equalTo("Driver licence expires in 20 days"));
        given().delete("/api/drivers/" + driver).then().statusCode(204);
    }

    @Test
    void documentFileIsStoredOutsideTheDatabase() throws IOException {
        int vehicle = ApiTestSupport.createVehicle();
        int id = doc(vehicle, "RC", LocalDate.now().plusYears(1)).extract().path("id");
        File pdf = File.createTempFile("rc-scan", ".pdf");
        Files.writeString(pdf.toPath(), "%PDF-1.4 test");
        given().multiPart("file", pdf, "application/pdf").post("/api/documents/" + id + "/file").then()
                .statusCode(200).body("hasFile", equalTo(true));
        given().get("/api/documents/" + id + "/file").then().statusCode(200)
                .contentType("application/pdf").body(equalTo("%PDF-1.4 test"));
        given().multiPart("file", pdf, "text/plain").post("/api/documents/" + id + "/file").then()
                .statusCode(400).body("code", equalTo("UNSUPPORTED_FILE_TYPE"));
        given().delete("/api/documents/" + id + "/file").then().body("hasFile", equalTo(false));
    }

    @Test
    void deletingVehicleOrDriverRemovesTheirDocumentsAndFiles() throws IOException {
        int vehicle = ApiTestSupport.createVehicle();
        int driver = ApiTestSupport.createDriver("Doc Owner");
        int vehicleDoc = doc(vehicle, "INSURANCE", LocalDate.now().plusDays(10)).extract().path("id");
        int driverDoc = given().contentType(ContentType.JSON)
                .body(Map.of("documentType", "DRIVING_LICENCE", "driverId", driver, "expiryDate", "2035-01-01"))
                .post("/api/documents").then().statusCode(201).extract().path("id");
        File pdf = File.createTempFile("cascade-scan", ".pdf");
        Files.writeString(pdf.toPath(), "%PDF-1.4 cascade");
        given().multiPart("file", pdf, "application/pdf").post("/api/documents/" + vehicleDoc + "/file").then().statusCode(200);

        given().delete("/api/vehicles/" + vehicle).then().statusCode(204);
        given().delete("/api/drivers/" + driver).then().statusCode(204);
        given().get("/api/documents/" + vehicleDoc).then().statusCode(404);
        given().get("/api/documents/" + driverDoc).then().statusCode(404);
    }

    private static io.restassured.response.ValidatableResponse doc(int vehicle, String type, LocalDate expiry) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("documentType", type, "vehicleId", vehicle, "expiryDate", expiry.toString()))
                .post("/api/documents").then().statusCode(201);
    }

    private static void post(String path, Map<String, Object> body) {
        given().contentType(ContentType.JSON).body(body).post(path).then().statusCode(201);
    }
}
