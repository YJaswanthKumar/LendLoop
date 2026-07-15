import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";

/**
 * Pathless layout guarding all authenticated pages. The JWT lives in
 * localStorage, so the check is client-only (ssr disabled).
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { hydrated, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, isAuthenticated, navigate]);

  if (!hydrated || !isAuthenticated) return <Loader full label="Checking your session…" />;
  return <Outlet />;
}
