import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JobApply from "./pages/JobApply";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import { Loader2 } from "lucide-react";

/**
 * A wrapper component for routes that require the user to be logged in.
 * If the auth state is still loading, it shows a loading spinner.
 * If the user is not authenticated, it redirects them to the login page.
 */
function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If user tries to access recruiter dashboard but is a candidate (or vice versa),
    // redirect them to their appropriate dashboard.
    return <Navigate to={user.role === "recruiter" ? "/recruiter" : "/candidate"} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Authentication pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/apply/:jobId" element={<JobApply />} />

          {/* Protected Portal Workspaces */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRole="candidate">
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRole="recruiter">
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
