import { Link } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LmsLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="min-h-[50vh] grid place-items-center text-muted-foreground">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> {label}
      </div>
    </div>
  );
}

export function AccessDenied({
  title = "Access Denied",
  message,
  actionTo,
  actionLabel,
}: {
  title?: string;
  message: string;
  actionTo?: string;
  actionLabel?: string;
}) {
  return (
    <section className="min-h-[60vh] grid place-items-center container mx-auto container-px section-py">
      <div className="max-w-md text-center">
        <AlertTriangle className="h-9 w-9 mx-auto text-destructive mb-4" />
        <h1 className="font-display text-2xl font-bold text-primary mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {actionTo && (
          <Button asChild className="mt-5">
            <Link to={actionTo}>{actionLabel ?? "Continue"}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
