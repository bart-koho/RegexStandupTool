import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import TeamPage from "@/pages/team-page";
import StandupPage from "@/pages/standup-page";
import ActivatePage from "@/pages/activate-page";
import TopNav from "@/components/layout/top-nav";
import MobileNav from "@/components/layout/mobile-nav";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/activate/:token" component={ActivatePage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <Route path="/standup/:id">
        {(params) => <ProtectedRoute path="/standup/:id" component={() => <StandupPage params={params} />} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <TopNav />
          <Router />
          <MobileNav />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;