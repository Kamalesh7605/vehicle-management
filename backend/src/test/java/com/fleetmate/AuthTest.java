package com.fleetmate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
@TestProfile(AuthTest.AuthEnabled.class)
class AuthTest {

    public static class AuthEnabled implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of("fleetmate.auth.enabled", "true",
                    "fleetmate.auth.jwt-secret", "test-secret-test-secret-test-secret-1234");
        }
    }

    private static String login(String user, String password) {
        return given().contentType(ContentType.JSON).body(Map.of("username", user, "password", password))
                .post("/api/auth/login").then().statusCode(200).extract().path("token");
    }

    @Test
    void adminCanSignInWithTheDefaultCredentials() {
        given().contentType(ContentType.JSON).body(Map.of("username", "admin", "password", "admin"))
                .post("/api/auth/login").then().statusCode(200)
                .body("token", notNullValue()).body("username", equalTo("admin"))
                .body("expiresInSeconds", equalTo(28800));
    }

    @Test
    void wrongPasswordAndUnknownUserGetTheSameError() {
        for (Map<String, String> body : new Map[] {Map.of("username", "admin", "password", "nope"),
                Map.of("username", "ghost", "password", "admin")}) {
            given().contentType(ContentType.JSON).body(body).post("/api/auth/login")
                    .then().statusCode(401).body("code", equalTo("INVALID_CREDENTIALS"))
                    .body("message", equalTo("Invalid username or password"));
        }
    }

    @Test
    void loginRequiresBothFields() {
        given().contentType(ContentType.JSON).body(Map.of("username", "", "password", ""))
                .post("/api/auth/login").then().statusCode(400)
                .body("errors", hasKey("username")).body("errors", hasKey("password"));
    }

    @Test
    void apiRejectsRequestsWithoutAValidToken() {
        given().get("/api/vehicles").then().statusCode(401).body("code", equalTo("UNAUTHORIZED"));
        given().get("/api/dashboard/summary").then().statusCode(401);
        given().header("Authorization", "Bearer not-a-token").get("/api/vehicles").then().statusCode(401);
        given().header("Authorization", "Basic YWRtaW46YWRtaW4=").get("/api/vehicles").then().statusCode(401);
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = login("admin", "admin");
        String[] parts = token.split("\\.");
        String forged = parts[0] + "." + parts[1] + "." + "A".repeat(parts[2].length());
        given().header("Authorization", "Bearer " + forged).get("/api/vehicles").then().statusCode(401);
    }

    @Test
    void validTokenOpensTheApiAndIdentifiesTheUser() {
        String token = login("admin", "admin");
        given().header("Authorization", "Bearer " + token).get("/api/vehicles").then().statusCode(200);
        given().header("Authorization", "Bearer " + token).get("/api/auth/me").then().statusCode(200)
                .body("username", equalTo("admin"));
        given().get("/api/auth/me").then().statusCode(401);
    }

    @Test
    void apiDocumentationStaysReachable() {
        given().get("/q/openapi").then().statusCode(200);
    }
}
