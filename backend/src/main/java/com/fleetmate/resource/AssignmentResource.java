package com.fleetmate.resource;

import com.fleetmate.dto.AssignmentRequest;
import com.fleetmate.dto.AssignmentResponse;
import com.fleetmate.service.AssignmentService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/vehicle-driver-assignments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Assignments")
public class AssignmentResource {

    @Inject
    AssignmentService service;

    @POST
    @Operation(summary = "Assign a driver to a vehicle (driverId = null unassigns the current driver)")
    @APIResponse(responseCode = "201", description = "Assignment created (or closed, when unassigning)")
    @APIResponse(responseCode = "409", description = "Driver already assigned elsewhere / inactive")
    public Response assign(@Valid AssignmentRequest request) {
        AssignmentResponse response = service.assign(request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }
}
