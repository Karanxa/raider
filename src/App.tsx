import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ChatSupport } from "@/components/chat-support/ChatSupport";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Settings from "@/pages/Settings";
import "./App.css";

const queryClient = new QueryClient();
const supabase = createClient(
  "https://facextdabmrqllgdzkms.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhY2V4dGRhYm1ycWxsZ2R6a21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MjcyMjMsImV4cCI6MjA0NjIwMzIyM30.GouDaqFh1hacbylYiHDHtsjSwKYX6lCIl0chwX2y0gI"
);

const ConditionalChatSupport = () => {
  const location = useLocation();
  return location.pathname !== '/login' ? <ChatSupport /> : null;
};

const App: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key && typeof event.key === 'string') {
        const key = event.key.toLowerCase();
        if (key === 'escape') {
          // Handle escape key press
          console.log('Escape key pressed');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <SessionContextProvider supabaseClient={supabase}>
              <div className="min-h-screen bg-background transition-colors duration-300">
                <div className="w-full max-w-[100vw] mx-auto px-2 sm:px-6 lg:px-8 py-4">
                  <div className="w-full mx-auto">
                    <div className="flex justify-end mb-4">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to="/settings" className="hover:text-primary">
                          <SettingsIcon className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
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
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <Settings />
                            </div>
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                    <ConditionalChatSupport />
                    <Toaster />
                    <SonnerToaster 
                      position="top-right"
                      expand={true}
                      richColors
                      closeButton
                      className="sm:max-w-[420px] max-w-[85vw]"
                    />
                  </div>
                </div>
              </div>
            </SessionContextProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;