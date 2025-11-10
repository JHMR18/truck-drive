import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DirectusAuthProvider, useDirectusAuth } from "@/contexts/DirectusAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import VehicleTracking from "./pages/VehicleTracking";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Analytics from "./pages/Analytics";
import Missions from "./pages/Missions";
import NotificationsPage from "./pages/NotificationsPage";
import DriverDashboard from "./pages/DriverDashboard";
import DriverVehicleStatus from "./pages/DriverVehicleStatus";
import DriverCommunication from "./pages/DriverCommunication";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Root redirect component
const RootRedirect = () => {
  const { user, role, loading } = useDirectusAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (role === 'Driver') {
    return <Navigate to="/driver/dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DirectusAuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Dispatcher', 'Maintenance Officer']}>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Dispatcher']}>
                  <AppLayout>
                    <VehicleTracking />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Dispatcher', 'Maintenance Officer']}>
                  <AppLayout>
                    <Vehicles />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Dispatcher']}>
                  <AppLayout>
                    <Drivers />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/missions"
              element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Dispatcher']}>
                  <AppLayout>
                    <Missions />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Dispatcher']}>
                  <AppLayout>
                    <NotificationsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['Super Admin']}>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Driver Routes */}
            <Route
              path="/driver/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Driver']}>
                  <AppLayout>
                    <DriverDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/vehicle"
              element={
                <ProtectedRoute allowedRoles={['Driver']}>
                  <AppLayout>
                    <DriverVehicleStatus />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/communication"
              element={
                <ProtectedRoute allowedRoles={['Driver']}>
                  <AppLayout>
                    <DriverCommunication />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DirectusAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
