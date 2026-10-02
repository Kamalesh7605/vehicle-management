package com.fleetmate.resource;

import com.fleetmate.dto.DriverReportRow;
import com.fleetmate.dto.MonthlyExpense;
import com.fleetmate.dto.VehicleExpenseRow;
import com.fleetmate.dto.VehicleSummaryRow;
import com.fleetmate.entity.DriverStatus;
import com.fleetmate.entity.ExpenseCategory;
import com.fleetmate.service.ReportService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/reports")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Reports")
public class ReportResource {

    @Inject
    ReportService service;

    @GET
    @Path("/vehicle-expenses")
    public List<VehicleExpenseRow> vehicleExpenses(@QueryParam("from") LocalDate from, @QueryParam("to") LocalDate to,
                                                   @QueryParam("vehicleId") Long vehicleId,
                                                   @QueryParam("driverId") Long driverId,
                                                   @QueryParam("category") ExpenseCategory category) {
        return service.vehicleExpenses(from, to, vehicleId, driverId, category);
    }

    @GET
    @Path("/monthly-expenses")
    public List<MonthlyExpense> monthlyExpenses(@QueryParam("from") LocalDate from, @QueryParam("to") LocalDate to,
                                                @QueryParam("vehicleId") Long vehicleId,
                                                @QueryParam("driverId") Long driverId,
                                                @QueryParam("category") ExpenseCategory category) {
        return service.monthlyExpenses(from, to, vehicleId, driverId, category);
    }

    @GET
    @Path("/drivers")
    public List<DriverReportRow> drivers(@QueryParam("driverId") Long driverId,
                                         @QueryParam("vehicleId") Long vehicleId,
                                         @QueryParam("status") DriverStatus status) {
        return service.drivers(driverId, vehicleId, status);
    }

    @GET
    @Path("/vehicle-summary")
    public List<VehicleSummaryRow> vehicleSummary(@QueryParam("from") LocalDate from, @QueryParam("to") LocalDate to,
                                                  @QueryParam("vehicleId") Long vehicleId,
                                                  @QueryParam("driverId") Long driverId,
                                                  @QueryParam("category") ExpenseCategory category) {
        return service.vehicleSummary(from, to, vehicleId, driverId, category);
    }
}
