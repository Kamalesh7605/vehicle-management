package com.fleetmate.resource;

import com.fleetmate.dto.LoginRequest;
import com.fleetmate.dto.LoginResponse;
import com.fleetmate.dto.MeResponse;
import com.fleetmate.exception.AuthFilter;
import com.fleetmate.service.AuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication")
public class AuthResource {

    @Inject
    AuthService service;

    @POST
    @Path("/login")
    @Operation(summary = "Sign in and receive a bearer token (send it as 'Authorization: Bearer <token>')")
    @APIResponse(responseCode = "401", description = "Invalid username or password")
    public LoginResponse login(@Valid LoginRequest request) {
        return service.login(request);
    }

    @GET
    @Path("/me")
    public MeResponse me(@Context ContainerRequestContext ctx) {
        return new MeResponse(AuthFilter.userOf(ctx));
    }
}
