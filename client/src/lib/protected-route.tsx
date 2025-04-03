import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  requiresSubscription?: boolean;
};

export function ProtectedRoute({
  path,
  component: Component,
  requiresSubscription = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, isSubscribed } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check subscription status if this route requires a subscription
  if (requiresSubscription && !isSubscribed) {
    return (
      <Route path={path}>
        <Redirect to="/subscription" />
      </Route>
    );
  }

  // Render the component if all checks pass
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

// Admin-only route
export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

// Client-only route
export function ClientRoute({
  path,
  component: Component,
  requiresSubscription = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isClient, isSubscribed } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!isClient) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  if (requiresSubscription && !isSubscribed) {
    return (
      <Route path={path}>
        <Redirect to="/subscription" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}