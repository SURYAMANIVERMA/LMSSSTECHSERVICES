import { useEffect } from "react";

export default function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <div className="min-h-[50vh] grid place-items-center container mx-auto container-px py-24 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Opening the Training Academy…</h1>
        <p className="mt-3 text-muted-foreground">
          Redirecting you to our learning platform.{" "}
          <a href={to} className="text-accent underline font-semibold">Click here</a> if it doesn't open automatically.
        </p>
      </div>
    </div>
  );
}
