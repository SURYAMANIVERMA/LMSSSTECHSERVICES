import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";
import Seo from "@/components/Seo";

type LoginResponse = { access_token?: string; refresh_token?: string; error?: string };

export default function LmsAuth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/lms";
  const mode = params.get("mode") === "signup" ? "signup" : "signin";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [signupData, setSignupData] = useState({ name: "", email: "", mobile: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav(next, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<LoginResponse>("lms-login", {
      body: { identifier: identifier.trim(), password },
    });
    if (error || !data?.access_token || !data.refresh_token) {
      setLoading(false);
      const message =
        (data as LoginResponse | null)?.error ??
        ((error as unknown as { context?: { error?: string } })?.context?.error ?? "Invalid login credentials.");
      return toast({ title: "Login failed", description: message, variant: "destructive" });
    }
    const { error: sessionErr } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    setLoading(false);
    if (sessionErr) {
      return toast({ title: "Login failed", description: "Invalid login credentials.", variant: "destructive" });
    }
    nav(next, { replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signupData.email.trim().toLowerCase(),
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/student/dashboard`,
        data: {
          display_name: signupData.name.trim(),
          username: signupData.username.trim().toLowerCase(),
          mobile_number: signupData.mobile.trim(),
        },
      },
    });
    setLoading(false);
    if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    if (data.session) return nav("/student/dashboard", { replace: true });
    toast({
      title: "Check your email",
      description: "Confirm your address to activate your student account.",
    });
  }

  async function forgotPassword() {
    const email = identifier.includes("@") ? identifier.trim() : signupData.email.trim();
    if (!email.includes("@")) {
      return toast({
        title: "Enter your email",
        description: "Type your registered email address in the field above, then tap Forgot Password again.",
        variant: "destructive",
      });
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast({ title: "Could not send reset link", description: error.message, variant: "destructive" });
    toast({ title: "Reset link sent", description: "Check your inbox and spam folder." });
  }

  return (
    <>
      <Seo
        title="LMS Login — SS TECH SERVICES Training Academy"
        description="Sign in to the SS TECH SERVICES Training Academy LMS with your email, mobile number or username."
        path="/lms/auth"
        noindex
      />
      <section className="min-h-[calc(100vh-160px)] grid place-items-center section-py container mx-auto container-px">
        <Card className="w-full max-w-md p-6 sm:p-8 shadow-elegant">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-6 w-6 text-accent" />
            <h1 className="font-display text-xl sm:text-2xl font-bold text-primary">SS TECH SERVICES LMS</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Students, trainers and administrators all sign in here — you will land on your own dashboard.
          </p>

          <Tabs defaultValue={mode}>
            <TabsList className="grid grid-cols-2 w-full mb-5">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Student Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="grid gap-4" onSubmit={signIn}>
                <div>
                  <Label htmlFor="lms-id">Email / Mobile Number / Username</Label>
                  <Input
                    id="lms-id"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com, 9876543210 or username"
                  />
                </div>
                <div>
                  <Label htmlFor="lms-pass">Password</Label>
                  <Input
                    id="lms-pass"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button disabled={loading} className="bg-gradient-accent border-0 shadow-accent">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
                </Button>
                <button
                  type="button"
                  onClick={forgotPassword}
                  disabled={loading}
                  className="text-xs text-muted-foreground hover:text-accent underline justify-self-center"
                >
                  Forgot Password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="grid gap-4" onSubmit={signUp}>
                <div>
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" required value={signupData.name} onChange={(e) => setSignupData({ ...signupData, name: e.target.value })} placeholder="Anjali Singh" />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="su-mobile">Mobile number</Label>
                  <Input id="su-mobile" required value={signupData.mobile} onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })} placeholder="9876543210" />
                </div>
                <div>
                  <Label htmlFor="su-username">Username</Label>
                  <Input id="su-username" value={signupData.username} onChange={(e) => setSignupData({ ...signupData, username: e.target.value })} placeholder="anjali.singh" />
                </div>
                <div>
                  <Label htmlFor="su-pass">Password (min 6)</Label>
                  <Input id="su-pass" type="password" required minLength={6} value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} />
                </div>
                <Button disabled={loading} className="bg-gradient-accent border-0 shadow-accent">
                  {loading ? "Creating…" : "Create student account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Trainer and admin accounts are created by an administrator.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-accent">← Back to site</Link>
          </div>
        </Card>
      </section>
    </>
  );
}
