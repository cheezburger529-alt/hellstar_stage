import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "./pages/Landing";
import Stage from "./pages/Stage";
import Admin from "./pages/Admin";
import NotFound from "@/pages/not-found";
import { useStore } from "./lib/store";

function Router() {
  const { currentUser } = useStore();

  return (
    <Switch>
      <Route path="/">
        {currentUser ? <Stage /> : <Landing />}
      </Route>
      <Route path="/stage">
        {currentUser ? <Stage /> : <Landing />}
      </Route>
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
