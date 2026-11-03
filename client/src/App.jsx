import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayouts";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomDesk from "./pages/RoomDesk";
import FoodDesk from "./pages/FoodDesk";
import Rooms from "./pages/Rooms";
import FoodManagement from "./pages/FoodManagement";
import FoodOrders from "./pages/FoodOrders";
import Customers from "./pages/Customers";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";
import StaffChat from "./pages/StaffChat";
import "./App.css";
import "./synaptix-theme.css";

// Dynamic landing router based on assigned RBAC role
function RoleDefaultRedirect() {
  const { admin } = useAuth();
  if (admin?.role === "Room Manager" || admin?.role === "Receptionist") {
    return <Navigate to="/room-desk" replace />;
  }
  if (admin?.role === "Food Manager") {
    return <Navigate to="/food-desk" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

// Role Guard Component: Restricts access to routes strictly by authorized roles
function RoleGuard({ allowedRoles, children }) {
  const { admin } = useAuth();
  const role = admin?.role || "Super Admin";

  if (!allowedRoles.includes(role)) {
    if (role === "Room Manager" || role === "Receptionist") {
      return <Navigate to="/room-desk" replace />;
    }
    if (role === "Food Manager") {
      return <Navigate to="/food-desk" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Hotel Management Application */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<RoleDefaultRedirect />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin"]}>
                        <Dashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/staff"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin"]}>
                        <Staff />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/payments"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin"]}>
                        <Payments />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/room-desk"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin", "Room Manager", "Receptionist"]}>
                        <RoomDesk />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/rooms"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin", "Room Manager", "Receptionist"]}>
                        <Rooms />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/bookings"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin", "Room Manager", "Receptionist"]}>
                        <Bookings />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin", "Room Manager", "Receptionist"]}>
                        <Customers />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/food-desk"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin", "Food Manager"]}>
                        <FoodDesk />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/food"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin", "Food Manager"]}>
                        <FoodManagement />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/food-orders"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin", "Food Manager"]}>
                        <FoodOrders />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <RoleGuard
                        allowedRoles={[
                          "Super Admin",
                          "Admin",
                          "Room Manager",
                          "Receptionist",
                          "Food Manager",
                        ]}
                      >
                        <StaffChat />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RoleGuard allowedRoles={["Super Admin", "Admin"]}>
                        <Settings />
                      </RoleGuard>
                    }
                  />
                </Route>
              </Route>

              {/* Fallback to Role Default */}
              <Route path="*" element={<RoleDefaultRedirect />} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
