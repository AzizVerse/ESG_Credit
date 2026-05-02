import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === "ADMIN" ? "/admin" : "/enterprise";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
