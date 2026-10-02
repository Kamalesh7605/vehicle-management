package com.fleetmate.resource;

import com.fleetmate.dto.MaintenanceRequest;
import com.fleetmate.dto.MaintenanceResponse;
import com.fleetmate.dto.PageResponse;
import com.fleetmate.entity.MaintenanceType;
import com.fleetmate.service.MaintenanceService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
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
import java.time.LocalDate;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/maintenance")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Maintenance")
public class MaintenanceResource {

    @Inject
    MaintenanceService service;

    @GET
    public PageResponse<MaintenanceResponse> list(@QueryParam("q") String q, @QueryParam("vehicleId") Long vehicleId,
                                                  @QueryParam("type") MaintenanceType type,
                                                  @QueryParam("from") LocalDate from, @QueryParam("to") LocalDate to,
                                                  @QueryParam("page") @DefaultValue("0") int page,
                                                  @QueryParam("size") @DefaultValue("10") int size) {
        return service.list(q, vehicleId, type, from, to, page, size);
    }

    @GET
    @Path("/{id}")
    public MaintenanceResponse get(@PathParam("id") Long id) {
        return service.get(id);
    }

    @POST
    public Response create(@Valid MaintenanceRequest request) {
        MaintenanceResponse created = service.create(request);
        return Response.created(URI.create("/api/maintenance/" + created.id())).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public MaintenanceResponse update(@PathParam("id") Long id, @Valid MaintenanceRequest request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }
}
