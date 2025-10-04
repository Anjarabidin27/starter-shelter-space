import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { POSInterface } from "@/components/POS/POSInterface";
import { CartView } from "./pages/CartView";
import { ReportsPage } from "./pages/ReportsPage";
import { StoreSettings } from "./pages/StoreSettings";
import NotFound from "./pages/NotFound";
import { POSProvider } from "@/contexts/POSContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { BluetoothProvider } from "@/contexts/BluetoothContext";
import { LoginPage } from "@/components/Auth/LoginPage";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthProvider>
            <StoreProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <POSProvider>
                  <BluetoothProvider>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/" element={
                        <ProtectedRoute>
                          <POSInterface />
                        </ProtectedRoute>
                      } />
                      <Route path="/cart" element={
                        <ProtectedRoute>
                          <CartView />
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute>
                          <ReportsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <StoreSettings />
                        </ProtectedRoute>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BluetoothProvider>
                </POSProvider>
              </BrowserRouter>
            </StoreProvider>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
