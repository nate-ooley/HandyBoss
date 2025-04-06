import { Switch, Route, Router, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MobileApp from "@/pages/MobileApp";
import BossManDemo from "@/pages/BossManDemo";
import TranslationChat from "@/pages/TranslationChat";
import Calendar from "@/pages/Calendar-simple";
import SocketTest from "@/pages/SocketTest";
import TeamProgress from "@/pages/TeamProgress";
import Checkout from "@/pages/Checkout";
import Subscribe from "@/pages/Subscribe";
import VoiceCommands from "@/pages/VoiceCommands";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
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
      <Route path="/boss-demo" component={BossManDemo} />
      <Route path="/translate" component={TranslationChat} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/socket-test" component={SocketTest} />
      <Route path="/team-progress" component={TeamProgress} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/voice-commands" component={VoiceCommands} />
      <Route path="/payment-success" component={Checkout} />
      <Route path="/subscription-success" component={Subscribe} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <VoiceProvider>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
        </VoiceProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
