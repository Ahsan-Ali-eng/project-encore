import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-encore-background flex items-center justify-center">
        <p className="text-encore-text-secondary">
          Loading...
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}