package com.fleetmate.resource;

import com.fleetmate.dto.AssignmentResponse;
import com.fleetmate.dto.DriverRequest;
import com.fleetmate.dto.DriverResponse;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.service.DriverService;
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
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/drivers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Drivers")
public class DriverResource {

    @Inject
    DriverService service;

    @GET
    public List<DriverResponse> list(@QueryParam("q") String q, @QueryParam("status") DriverStatus status) {
        return service.list(q, status);
    }

    @GET
    @Path("/{id}")
    public DriverResponse get(@PathParam("id") Long id) {
        return service.get(id);
    }

    @GET
    @Path("/{id}/vehicle-history")
    public List<AssignmentResponse> vehicleHistory(@PathParam("id") Long id) {
        return service.vehicleHistory(id);
    }

    @POST
    @APIResponse(responseCode = "201", description = "Driver created")
    @APIResponse(responseCode = "409", description = "Licence number already exists")
    public Response create(@Valid DriverRequest request) {
        DriverResponse created = service.create(request);
        return Response.created(URI.create("/api/drivers/" + created.id())).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public DriverResponse update(@PathParam("id") Long id, @Valid DriverRequest request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }
}
