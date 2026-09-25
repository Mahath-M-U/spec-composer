import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/brand-kit")({
  beforeLoad: () => {
    throw redirect({ to: "/design-kit", replace: true });
  },
});
