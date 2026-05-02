import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminApplicationDetail from "./pages/AdminApplicationDetail";
import AdminCreateEnterpriseAccountPage from "./pages/AdminCreateEnterpriseAccountPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEnterpriseAccountDetailPage from "./pages/AdminEnterpriseAccountDetailPage";
import AdminEnterpriseAccountsPage from "./pages/AdminEnterpriseAccountsPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import LoginPage from "./pages/LoginPage";
import NewApplicationPage from "./pages/NewApplicationPage";
import { useAuth } from "./context/AuthContext";

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/enterprise" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/enterprise"
        element={
          <ProtectedRoute allowedRoles={["ENTERPRISE"]}>
            <EnterpriseDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enterprise/new"
        element={
          <ProtectedRoute allowedRoles={["ENTERPRISE"]}>
            <NewApplicationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enterprise/applications/:id"
        element={
          <ProtectedRoute allowedRoles={["ENTERPRISE"]}>
            <ApplicationFormPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications/:id"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminApplicationDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enterprise-accounts"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEnterpriseAccountsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enterprise-accounts/:id"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEnterpriseAccountDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enterprise-accounts/new"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminCreateEnterpriseAccountPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
