import { Switch, Route, Router, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MobileApp from "@/pages/MobileApp";
import { useMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";

function AppRoutes() {
  const isMobile = useMobile();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to the appropriate view based on device
    if (location === "/" || location === "") {
      isMobile ? setLocation("/mobile") : setLocation("/dashboard");
    }
  }, [location, isMobile, setLocation]);

  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/mobile" component={MobileApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
