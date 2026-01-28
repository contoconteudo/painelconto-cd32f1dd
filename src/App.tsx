import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CompanyProvider } from "@/contexts/CompanyContext";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Estrategia from "./pages/Estrategia";
import CRM from "./pages/CRM";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CompanyProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute requiredModule="dashboard">
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estrategia"
              element={
                <ProtectedRoute requiredModule="strategy">
                  <Estrategia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crm"
              element={
                <ProtectedRoute requiredModule="crm">
                  <CRM />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute requiredModule="clients">
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute requiredModule="settings">
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredModule="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Redirect removed routes to home */}
            <Route path="/financeiro" element={<Navigate to="/" replace />} />
            <Route path="/projetos" element={<Navigate to="/" replace />} />
            <Route path="/relatorios" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
