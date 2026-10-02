package com.fleetmate.exception;

import com.fleetmate.service.TokenService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/** Requires a valid bearer token on every /api endpoint except login. */
@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {

    public static final String USER_PROPERTY = "fleetmate.user";

    // Plain property (not the config mapping): this filter is created during REST deployment.
    @ConfigProperty(name = "fleetmate.auth.enabled", defaultValue = "true")
    boolean enabled;
    @Inject
    TokenService tokens;

    /** The signed-in username, or "anonymous" when authentication is switched off. */
    public static String userOf(ContainerRequestContext ctx) {
        Object user = ctx.getProperty(USER_PROPERTY);
        return user == null ? "anonymous" : user.toString();
    }

    @Override
    public void filter(ContainerRequestContext ctx) {
        if (!enabled || "OPTIONS".equals(ctx.getMethod())) {
            return;
        }
        String path = ctx.getUriInfo().getPath();
        path = path.startsWith("/") ? path.substring(1) : path;
        if (!path.startsWith("api/") || path.equals("api/auth/login")) {
            return;
        }
        String header = ctx.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            reject(ctx, "Authentication required");
            return;
        }
        Optional<String> user = tokens.verify(header.substring(7).trim());
        if (user.isEmpty()) {
            reject(ctx, "Your session has expired. Please sign in again.");
            return;
        }
        ctx.setProperty(USER_PROPERTY, user.get());
    }

    private static void reject(ContainerRequestContext ctx, String message) {
        ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorResponse(message, "UNAUTHORIZED"))
                .build());
    }
}
