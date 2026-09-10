import { ShieldAlert } from "lucide-react";
import { isAllowedLmsHost, OFFICIAL_LMS_HOST } from "@/lib/lmsDomain";

export default function DomainGuard({ children }: { children: React.ReactNode }) {
  if (isAllowedLmsHost()) return <>{children}</>;
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-background">
      <div className="max-w-md text-center">
        <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-4" />
        <h1 className="font-display text-2xl font-bold text-primary mb-2">Invalid LMS Domain</h1>
        <p className="text-sm text-muted-foreground">
          This LMS is available only at {OFFICIAL_LMS_HOST}.
        </p>
        <a
          href={`https://${OFFICIAL_LMS_HOST}`}
          className="inline-block mt-5 text-sm underline hover:text-accent"
        >
          Go to {OFFICIAL_LMS_HOST}
        </a>
      </div>
    </div>
  );
}
