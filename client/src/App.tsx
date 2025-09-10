import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { createElement } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Privacy from "@/pages/privacy";
import Subscribe from "@/pages/subscribe";
import History from "@/pages/history";
import Reports from "@/pages/reports";

// Protected Route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!user) {
    return createElement(Login);
  }
  
  return createElement(Component);
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => createElement(ProtectedRoute, { component: Dashboard })} />
      <Route path="/dashboard" component={() => createElement(ProtectedRoute, { component: Dashboard })} />
      <Route path="/profile" component={() => createElement(ProtectedRoute, { component: Profile })} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/subscribe" component={() => createElement(ProtectedRoute, { component: Subscribe })} />
      <Route path="/history" component={() => createElement(ProtectedRoute, { component: History })} />
      <Route path="/reports" component={() => createElement(ProtectedRoute, { component: Reports })} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
