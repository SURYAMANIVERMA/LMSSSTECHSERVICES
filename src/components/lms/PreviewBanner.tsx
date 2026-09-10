import { useLmsAuth, stopPreview } from "@/hooks/useLmsAuth";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

/** Shown while an admin is previewing the LMS as a specific student or trainer. */
export default function PreviewBanner() {
  const { preview } = useLmsAuth();
  const nav = useNavigate();
  if (!preview) return null;
  return (
    <div className="bg-primary text-primary-foreground text-sm">
      <div className="container mx-auto container-px py-2 flex flex-wrap items-center gap-3">
        <Eye className="h-4 w-4" />
        <span>
          Preview mode — viewing the LMS as <strong>{preview.label}</strong> ({preview.role}).
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto"
          onClick={() => {
            stopPreview();
            nav("/admin/users");
          }}
        >
          Exit preview
        </Button>
      </div>
    </div>
  );
}
