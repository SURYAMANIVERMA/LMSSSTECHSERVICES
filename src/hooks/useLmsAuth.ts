import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "engineer" | "student" | "trainer";

export type LmsProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  username: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  status: string;
};

export type PreviewTarget = { userId: string; role: "student" | "trainer"; label: string };

const PREVIEW_KEY = "lms:preview-role";

export function readPreview(): PreviewTarget | null {
  try {
    const raw = sessionStorage.getItem(PREVIEW_KEY);
    return raw ? (JSON.parse(raw) as PreviewTarget) : null;
  } catch {
    return null;
  }
}

export function startPreview(t: PreviewTarget) {
  sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(t));
  window.dispatchEvent(new Event("lms-preview-change"));
}

export function stopPreview() {
  sessionStorage.removeItem(PREVIEW_KEY);
  window.dispatchEvent(new Event("lms-preview-change"));
}

export function useLmsAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<LmsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [preview, setPreview] = useState<PreviewTarget | null>(() => readPreview());

  useEffect(() => {
    const onChange = () => setPreview(readPreview());
    window.addEventListener("lms-preview-change", onChange);
    return () => window.removeEventListener("lms-preview-change", onChange);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s) {
        setRoles([]);
        setProfile(null);
        setRolesLoaded(true);
        stopPreview();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (!data.session) setRolesLoaded(true);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: roleRows }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("id, display_name, email, username, mobile_number, avatar_url, status")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      if (!active) return;
      setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
      setProfile((prof as LmsProfile | null) ?? null);
      setRolesLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const realIsAdmin = roles.includes("admin");
  const realIsTrainer = roles.includes("trainer");
  const realIsStudent = roles.includes("student");

  // Admin preview mode: the admin keeps their own permissions, but the UI is
  // rendered exactly as the previewed student/trainer would see it.
  const previewing = realIsAdmin ? preview : null;
  const effectiveRole: AppRole | null = previewing
    ? previewing.role
    : realIsAdmin
      ? "admin"
      : realIsTrainer
        ? "trainer"
        : realIsStudent
          ? "student"
          : null;

  const signOut = useCallback(async () => {
    stopPreview();
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user,
    roles,
    profile,
    loading,
    rolesLoaded,
    /** id whose data the dashboards should show (admin preview aware) */
    subjectId: previewing ? previewing.userId : (user?.id ?? null),
    preview: previewing,
    effectiveRole,
    isAdmin: realIsAdmin && !previewing,
    isTrainer: previewing ? previewing.role === "trainer" : realIsTrainer,
    isStudent: previewing ? previewing.role === "student" : realIsStudent,
    realIsAdmin,
    canManage: realIsAdmin || realIsTrainer,
    disabled: profile?.status === "disabled",
    signOut,
  };
}

export function dashboardPathFor(role: AppRole | null): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "trainer") return "/trainer/dashboard";
  if (role === "student") return "/student/dashboard";
  return "/lms/no-access";
}
