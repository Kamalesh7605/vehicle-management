package com.fleetmate.resource;

import com.fleetmate.dto.DocumentRequest;
import com.fleetmate.dto.DocumentResponse;
import com.fleetmate.dto.PageResponse;
import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DocumentType;
import com.fleetmate.service.DocumentService;
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
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/documents")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Documents")
public class DocumentResource {

    @Inject
    DocumentService service;

    @GET
    public PageResponse<DocumentResponse> list(@QueryParam("q") String q, @QueryParam("type") DocumentType type,
                                               @QueryParam("vehicleId") Long vehicleId,
                                               @QueryParam("driverId") Long driverId,
                                               @QueryParam("status") DocumentStatus status,
                                               @QueryParam("page") @DefaultValue("0") int page,
                                               @QueryParam("size") @DefaultValue("10") int size) {
        return service.list(q, type, vehicleId, driverId, status, page, size);
    }

    @GET
    @Path("/{id}")
    public DocumentResponse get(@PathParam("id") Long id) {
        return service.get(id);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(@Valid DocumentRequest request) {
        DocumentResponse created = service.create(request);
        return Response.created(URI.create("/api/documents/" + created.id())).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public DocumentResponse update(@PathParam("id") Long id, @Valid DocumentRequest request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/file")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Operation(summary = "Upload (or replace) the scanned file for a document. PDF, JPG or PNG up to 10 MB.")
    public DocumentResponse upload(@PathParam("id") Long id, @RestForm("file") FileUpload file) {
        if (file == null) {
            throw com.fleetmate.exception.ApiException.badRequest("FILE_REQUIRED", "Attach a file in the 'file' field");
        }
        return service.attachFile(id, file.uploadedFile(), file.fileName(), file.contentType(), file.size());
    }

    @GET
    @Path("/{id}/file")
    @Produces(MediaType.WILDCARD)
    public Response download(@PathParam("id") Long id) {
        DocumentService.StoredFile stored = service.readFile(id);
        String safeName = stored.fileName().replace("\"", "");
        return Response.ok(stored.path().toFile(), stored.contentType())
                .header("Content-Disposition", "inline; filename=\"" + safeName + "\"")
                .build();
    }

    @DELETE
    @Path("/{id}/file")
    public DocumentResponse removeFile(@PathParam("id") Long id) {
        return service.removeFile(id);
    }
}
