import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

export default function AdminAuth() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav("/admin/tickets"); });
  }, [nav]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast({ title: "Login failed", description: error.message, variant: "destructive" });
    nav("/admin/tickets");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin/tickets`, data: { display_name: name } },
    });
    setLoading(false);
    if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    toast({ title: "Account created", description: "First account becomes Admin. Other accounts have NO access until an Admin grants a role." });
  }

  return (
    <section className="min-h-[calc(100vh-200px)] grid place-items-center section-py container mx-auto container-px">
      <Card className="w-full max-w-md p-7 shadow-elegant">
        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-6 w-6 text-accent" /><h1 className="font-display text-2xl font-bold text-primary">Staff Portal</h1></div>
        <p className="text-sm text-muted-foreground mb-5">Admin & engineer login for the support ticket dashboard.</p>
        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form className="grid gap-4" onSubmit={signIn}>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
              <Button disabled={loading} className="bg-gradient-accent border-0 shadow-accent">{loading ? "Signing in…" : "Sign in"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form className="grid gap-4" onSubmit={signUp}>
              <div><Label>Display name</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Rohit Verma" /></div>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Password (min 6)</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
              <Button disabled={loading} className="bg-gradient-accent border-0 shadow-accent">{loading ? "Creating…" : "Create account"}</Button>
              <p className="text-xs text-muted-foreground text-center">Only the first signup becomes Admin. Later signups receive no access until an Admin assigns them an Engineer role from the dashboard.</p>
            </form>
          </TabsContent>
        </Tabs>
        <div className="text-center mt-5 text-xs text-muted-foreground"><Link to="/" className="hover:text-accent">← Back to site</Link></div>
      </Card>
    </section>
  );
}