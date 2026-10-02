package com.fleetmate.resource;

import com.fleetmate.dto.FuelRequest;
import com.fleetmate.dto.FuelResponse;
import com.fleetmate.dto.PageResponse;
import com.fleetmate.service.FuelService;
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

@Path("/api/fuel")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Fuel")
public class FuelResource {

    @Inject
    FuelService service;

    @GET
    public PageResponse<FuelResponse> list(@QueryParam("q") String q, @QueryParam("vehicleId") Long vehicleId,
                                           @QueryParam("from") LocalDate from, @QueryParam("to") LocalDate to,
                                           @QueryParam("page") @DefaultValue("0") int page,
                                           @QueryParam("size") @DefaultValue("10") int size) {
        return service.list(q, vehicleId, from, to, page, size);
    }

    @GET
    @Path("/{id}")
    public FuelResponse get(@PathParam("id") Long id) {
        return service.get(id);
    }

    @POST
    public Response create(@Valid FuelRequest request) {
        FuelResponse created = service.create(request);
        return Response.created(URI.create("/api/fuel/" + created.id())).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public FuelResponse update(@PathParam("id") Long id, @Valid FuelRequest request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }
}
