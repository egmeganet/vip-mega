import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { I18nProvider } from "@/lib/i18n";
import { AppLayout } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Subscribers from "@/pages/subscribers/index";
import SubscriberDetail from "@/pages/subscribers/detail";
import PackagesHub from "@/pages/packages/index";
import FinanceHub from "@/pages/finance/index";
import SettingsHub from "@/pages/settings/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes wrapped in AppLayout */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/subscribers">
        <ProtectedRoute component={Subscribers} />
      </Route>
      <Route path="/subscribers/:id">
        <ProtectedRoute component={SubscriberDetail} />
      </Route>
      <Route path="/packages">
        <ProtectedRoute component={PackagesHub} />
      </Route>
      <Route path="/finance">
        <ProtectedRoute component={FinanceHub} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsHub} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
