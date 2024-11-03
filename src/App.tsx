import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import "./App.css";

const queryClient = new QueryClient();
const supabase = createClient(
  "https://facextdabmrqllgdzkms.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhY2V4dGRhYm1ycWxsZ2R6a21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MjcyMjMsImV4cCI6MjA0NjIwMzIyM30.GouDaqFh1hacbylYiHDHtsjSwKYX6lCIl0chwX2y0gI"
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <SessionContextProvider supabaseClient={supabase}>
              <div className="min-h-screen bg-background transition-colors duration-300">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                  <Routes>
                    <Route 
                      path="/login" 
                      element={
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <Login />
                        </div>
                      } 
                    />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Index />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                  <Toaster />
                  <SonnerToaster 
                    position="top-right"
                    expand={true}
                    richColors
                    closeButton
                  />
                </div>
              </div>
            </SessionContextProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;