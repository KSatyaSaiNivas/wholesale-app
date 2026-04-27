import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/admin-login" />;
  }

  if (!user?.isAdmin) {
    return <Navigate replace to="/" />;
  }

  return children;
}
