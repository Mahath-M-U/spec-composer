import { cn } from "@/lib/utils";

export function AppIcon({ className }: { className?: string }) {
  return (
    <span className={cn("app-icon", className)} aria-hidden="true">
      <img className="app-icon-light" src="/light-team.svg" alt="" />
      <img className="app-icon-dark" src="/dark-team.svg" alt="" />
    </span>
  );
}
