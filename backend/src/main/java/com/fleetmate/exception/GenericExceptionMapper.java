package com.fleetmate.exception;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

/** Last-resort mapper so the client always receives a JSON error body. */
@Provider
public class GenericExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOG = Logger.getLogger(GenericExceptionMapper.class);

    @Override
    public Response toResponse(Throwable e) {
        if (e instanceof WebApplicationException web) {
            int status = web.getResponse().getStatus();
            String message = status == 400 ? "Malformed or invalid request" : web.getMessage();
            return Response.status(status)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse(message, "HTTP_" + status))
                    .build();
        }
        LOG.error("Unhandled exception", e);
        return Response.serverError()
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorResponse("Unexpected server error", "INTERNAL_ERROR"))
                .build();
    }
}
