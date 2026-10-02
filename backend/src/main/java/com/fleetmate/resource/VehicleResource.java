package com.fleetmate.resource;

import com.fleetmate.dto.AssignmentResponse;
import com.fleetmate.dto.VehicleRequest;
import com.fleetmate.dto.VehicleResponse;
import com.fleetmate.dto.VehicleSummaryResponse;
import com.fleetmate.entity.FuelType;
import com.fleetmate.entity.VehicleStatus;
import com.fleetmate.exception.ErrorResponse;
import com.fleetmate.service.VehicleService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Vehicles")
public class VehicleResource {

    @Inject
    VehicleService service;

    @GET
    public List<VehicleResponse> list(@QueryParam("q") String q, @QueryParam("status") VehicleStatus status,
                                      @QueryParam("fuelType") FuelType fuelType) {
        return service.list(q, status, fuelType);
    }

    @GET
    @Path("/{id}")
    @APIResponse(responseCode = "404", description = "Vehicle not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public VehicleResponse get(@PathParam("id") Long id) {
        return service.get(id);
    }

    @GET
    @Path("/{id}/summary")
    public VehicleSummaryResponse summary(@PathParam("id") Long id) {
        return service.summary(id);
    }

    @GET
    @Path("/{id}/driver-history")
    public List<AssignmentResponse> driverHistory(@PathParam("id") Long id) {
        return service.driverHistory(id);
    }

    @POST
    @APIResponse(responseCode = "201", description = "Vehicle created")
    @APIResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @APIResponse(responseCode = "409", description = "Vehicle number already exists",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public Response create(@Valid VehicleRequest request) {
        VehicleResponse created = service.create(request);
        return Response.created(URI.create("/api/vehicles/" + created.id())).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public VehicleResponse update(@PathParam("id") Long id, @Valid VehicleRequest request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    @APIResponse(responseCode = "204", description = "Vehicle and all its records deleted")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }
}
