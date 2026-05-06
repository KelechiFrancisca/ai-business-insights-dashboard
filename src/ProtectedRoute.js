import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  // Check if token exists in localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the protected page
  return children;
}

export default ProtectedRoute;
