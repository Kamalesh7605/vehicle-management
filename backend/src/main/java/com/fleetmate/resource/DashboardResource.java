package com.fleetmate.resource;

import com.fleetmate.dto.AlertResponse;
import com.fleetmate.dto.DashboardSummary;
import com.fleetmate.dto.ExpenseBreakdown;
import com.fleetmate.dto.ExpenseResponse;
import com.fleetmate.dto.FuelResponse;
import com.fleetmate.dto.MaintenanceResponse;
import com.fleetmate.dto.MonthlyExpense;
import com.fleetmate.service.DashboardService;
import com.fleetmate.exception.AuthFilter;
import jakarta.inject.Inject;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Dashboard")
public class DashboardResource {

    @Inject
    DashboardService service;

    @GET
    @Path("/summary")
    public DashboardSummary summary(@QueryParam("from") LocalDate from, @QueryParam("to") LocalDate to) {
        return service.summary(from, to);
    }

    @GET
    @Path("/monthly-expenses")
    public List<MonthlyExpense> monthlyExpenses(@QueryParam("year") Integer year) {
        return service.monthlyExpenses(year);
    }

    @GET
    @Path("/expense-breakdown")
    public ExpenseBreakdown expenseBreakdown(@QueryParam("from") LocalDate from, @QueryParam("to") LocalDate to) {
        return service.expenseBreakdown(from, to);
    }

    @GET
    @Path("/recent-fuel")
    public List<FuelResponse> recentFuel(@QueryParam("limit") @DefaultValue("5") int limit) {
        return service.recentFuel(clamp(limit));
    }

    @GET
    @Path("/recent-maintenance")
    public List<MaintenanceResponse> recentMaintenance(@QueryParam("limit") @DefaultValue("5") int limit) {
        return service.recentMaintenance(clamp(limit));
    }

    @GET
    @Path("/recent-expenses")
    public List<ExpenseResponse> recentExpenses(@QueryParam("limit") @DefaultValue("5") int limit) {
        return service.recentExpenses(clamp(limit));
    }

    @GET
    @Path("/alerts")
    @Operation(summary = "Active alerts for the signed-in user, each with a read flag")
    public List<AlertResponse> alerts(@Context ContainerRequestContext ctx) {
        return service.alerts(AuthFilter.userOf(ctx));
    }

    @POST
    @Path("/alerts/read")
    @Operation(summary = "Mark all current alerts as read for the signed-in user")
    @APIResponse(responseCode = "204", description = "Alerts marked as read")
    public Response markAlertsRead(@Context ContainerRequestContext ctx) {
        service.markAlertsRead(AuthFilter.userOf(ctx));
        return Response.noContent().build();
    }

    private static int clamp(int limit) {
        return Math.min(Math.max(limit, 1), 50);
    }
}
