import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate replace to={user?.isAdmin ? "/admin" : "/"} />;
  }

  return children;
}
