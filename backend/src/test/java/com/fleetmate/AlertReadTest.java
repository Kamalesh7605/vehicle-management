package com.fleetmate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fleetmate.dto.AlertResponse;
import com.fleetmate.service.AlertService;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class AlertReadTest {

    @Inject
    AlertService alertService;

    private static int expiringDoc(int vehicle, LocalDate expiry) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("documentType", "INSURANCE", "vehicleId", vehicle, "expiryDate", expiry.toString()))
                .post("/api/documents").then().statusCode(201).extract().path("id");
    }

    private static AlertResponse alertFor(List<AlertResponse> alerts, String subject) {
        return alerts.stream().filter(a -> a.subject().equals(subject)).findFirst().orElseThrow();
    }

    @Test
    void newAlertsAreUnreadAndMarkingReadClearsThem() {
        String number = ApiTestSupport.uniqueNumber();
        int vehicle = ApiTestSupport.createVehicle(number, "ACTIVE", 0);
        expiringDoc(vehicle, LocalDate.now().plusDays(7));

        given().get("/api/dashboard/alerts").then().statusCode(200)
                .body("find { it.subject == '" + number + "' }.read", equalTo(false));

        given().post("/api/dashboard/alerts/read").then().statusCode(204);

        given().get("/api/dashboard/alerts").then().statusCode(200).body("read", everyItem(equalTo(true)));
    }

    @Test
    void escalationBecomesUnreadAgain() {
        String number = ApiTestSupport.uniqueNumber();
        int vehicle = ApiTestSupport.createVehicle(number, "ACTIVE", 0);
        int doc = expiringDoc(vehicle, LocalDate.now().plusDays(7));
        given().post("/api/dashboard/alerts/read").then().statusCode(204);

        given().contentType(ContentType.JSON)
                .body(Map.of("documentType", "INSURANCE", "vehicleId", vehicle,
                        "expiryDate", LocalDate.now().minusDays(1).toString()))
                .put("/api/documents/" + doc).then().statusCode(200);

        given().get("/api/dashboard/alerts").then()
                .body("find { it.subject == '" + number + "' }.title", equalTo("Insurance expired"))
                .body("find { it.subject == '" + number + "' }.read", equalTo(false));
    }

    @Test
    void readStateIsPerUserAndMarkingIsIdempotent() {
        String number = ApiTestSupport.uniqueNumber();
        int vehicle = ApiTestSupport.createVehicle(number, "ACTIVE", 0);
        expiringDoc(vehicle, LocalDate.now().plusDays(3));

        alertService.markAllRead("alice");
        alertService.markAllRead("alice");

        assertTrue(alertFor(alertService.alerts("alice"), number).read());
        assertFalse(alertFor(alertService.alerts("bob"), number).read());
    }

    @Test
    void resolvedAlertsAreForgottenSoTheyReturnAsUnread() {
        String number = ApiTestSupport.uniqueNumber();
        int vehicle = ApiTestSupport.createVehicle(number, "ACTIVE", 0);
        int doc = expiringDoc(vehicle, LocalDate.now().plusDays(3));
        alertService.markAllRead("carol");
        assertTrue(alertFor(alertService.alerts("carol"), number).read());

        given().delete("/api/documents/" + doc).then().statusCode(204);
        alertService.markAllRead("carol"); // prunes the marker of the resolved alert
        expiringDoc(vehicle, LocalDate.now().plusDays(3)); // a new alert appears

        assertEquals(false, alertFor(alertService.alerts("carol"), number).read());
    }
}
