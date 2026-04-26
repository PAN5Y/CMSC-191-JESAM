import { Navigate, Outlet } from "react-router";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="size-8 border-3 border-[#3f4b7e]/20 border-t-[#3f4b7e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            Verifying credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → unauthorized
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
