import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { RoleProvider } from "./context/RoleContext";
import { AuthProvider } from "./context/AuthContext";
import { WellProvider } from "./context/WellContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";

import AppLayout from "./layouts/AppLayout";
import RoleRoute from "./components/RoleRoute";

import AuthPage from "./pages/AuthPage";
import WellSelectPage from "./pages/WellSelectPage";
import DashboardPage from "./pages/DashboardPage";
import NearbyWellsPage from "./pages/NearbyWellsPage";
import SimilarWellsPage from "./pages/SimilarWellsPage";
import KnowledgeRepositoryPage from "./pages/KnowledgeRepositoryPage";
import DecisionLogPage from "./pages/DecisionLogPage";
import ContributorsPage from "./pages/ContributorsPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <AuthProvider>
          <WellProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  {/* ROOT DIRECT ENTRY: Opens immediately into Operations Workstation without login barrier */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="operations" element={<DashboardPage />} />
                    <Route path="nearby" element={<NearbyWellsPage />} />
                    <Route path="similar" element={<SimilarWellsPage />} />
                    <Route path="knowledge" element={<KnowledgeRepositoryPage />} />
                    <Route path="decision-log" element={<DecisionLogPage />} />
                    <Route path="contributors" element={<ContributorsPage />} />
                    <Route path="account" element={<AccountPage />} />
                  </Route>

                  {/* Standard /app/* nested routes for existing link compatibility */}
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/operations" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="operations" element={<DashboardPage />} />
                    <Route path="nearby" element={<NearbyWellsPage />} />
                    <Route path="similar" element={<SimilarWellsPage />} />
                    <Route path="knowledge" element={<KnowledgeRepositoryPage />} />
                    <Route path="decision-log" element={<DecisionLogPage />} />
                    <Route path="contributors" element={<ContributorsPage />} />
                    <Route path="account" element={<AccountPage />} />
                  </Route>

                  {/* Optional Authentication Route */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/select-well" element={<WellSelectPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </WellProvider>
        </AuthProvider>
      </RoleProvider>
    </ThemeProvider>
  );
}
