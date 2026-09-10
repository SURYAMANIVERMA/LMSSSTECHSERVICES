import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";

export default function StudentProfile() {
  const { profile, user, effectiveRole } = useLmsAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setUsername(profile?.username ?? "");
    setMobile(profile?.mobile_number ?? "");
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: username.trim() ? username.trim().toLowerCase() : null,
        mobile_number: mobile.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      return toast({
        title: "Could not save",
        description: "That username or mobile number may already be in use.",
        variant: "destructive",
      });
    }
    toast({ title: "Profile updated" });
  }

  return (
    <>
      <Seo title="My Profile — SS TECH SERVICES LMS" description="Manage your LMS profile details." path="/student/profile" noindex />
      <section className="section-py container mx-auto container-px max-w-xl">
        <h1 className="font-display text-2xl font-bold text-primary mb-1">My profile</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Role: <Badge variant="secondary">{effectiveRole ?? "none"}</Badge>{" "}
          · Status: <Badge variant={profile?.status === "disabled" ? "destructive" : "secondary"}>{profile?.status ?? "active"}</Badge>
        </p>
        <Card className="p-6">
          <form className="grid gap-4" onSubmit={save}>
            <div>
              <Label htmlFor="p-name">Full name</Label>
              <Input id="p-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label htmlFor="p-username">Username</Label>
              <Input id="p-username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={40} placeholder="anjali.singh" />
            </div>
            <div>
              <Label htmlFor="p-mobile">Mobile number</Label>
              <Input id="p-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={16} placeholder="9876543210" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} readOnly disabled />
            </div>
            <Button disabled={saving} className="bg-gradient-accent border-0">{saving ? "Saving…" : "Save changes"}</Button>
          </form>
        </Card>
      </section>
    </>
  );
}
