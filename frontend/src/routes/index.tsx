import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/common/LoadingState';
import { AppLayout } from '../components/layout/AppLayout';
import { RequireAuth } from '../components/layout/RequireAuth';

// Each page is loaded on demand so the first paint only downloads what it needs.
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const VehiclesPage = lazy(() => import('../pages/Vehicles/VehiclesPage').then((m) => ({ default: m.VehiclesPage })));
const VehicleDetailsPage = lazy(() => import('../pages/Vehicles/VehicleDetailsPage').then((m) => ({ default: m.VehicleDetailsPage })));
const DriversPage = lazy(() => import('../pages/Drivers/DriversPage').then((m) => ({ default: m.DriversPage })));
const FuelPage = lazy(() => import('../pages/Fuel/FuelPage').then((m) => ({ default: m.FuelPage })));
const MaintenancePage = lazy(() => import('../pages/Maintenance/MaintenancePage').then((m) => ({ default: m.MaintenancePage })));
const ExpensesPage = lazy(() => import('../pages/Expenses/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const DocumentsPage = lazy(() => import('../pages/Documents/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const ReportsPage = lazy(() => import('../pages/Reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const LoginPage = lazy(() => import('../pages/Login/LoginPage').then((m) => ({ default: m.LoginPage })));
const NotFound = lazy(() => import('../pages/NotFound').then((m) => ({ default: m.NotFound })));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailsPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="fuel" element={<FuelPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
