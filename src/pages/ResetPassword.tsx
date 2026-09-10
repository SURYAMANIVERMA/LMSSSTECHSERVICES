import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";

export default function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      return toast({ title: "Passwords do not match", variant: "destructive" });
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast({ title: "Could not update password", description: error.message, variant: "destructive" });
    toast({ title: "Password updated", description: "You can now use your new password." });
    nav("/lms", { replace: true });
  }

  return (
    <>
      <Seo title="Reset Password — SS TECH SERVICES LMS" description="Set a new password for your LMS account." path="/reset-password" noindex />
      <section className="min-h-[60vh] grid place-items-center section-py container mx-auto container-px">
        <Card className="w-full max-w-md p-7">
          <h1 className="font-display text-2xl font-bold text-primary mb-1">Set a new password</h1>
          <p className="text-sm text-muted-foreground mb-5">Choose a password of at least 6 characters.</p>
          <form className="grid gap-4" onSubmit={submit}>
            <div>
              <Label htmlFor="rp-pass">New password</Label>
              <Input id="rp-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="rp-confirm">Confirm password</Label>
              <Input id="rp-confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button disabled={saving} className="bg-gradient-accent border-0">{saving ? "Saving…" : "Update password"}</Button>
          </form>
        </Card>
      </section>
    </>
  );
}
