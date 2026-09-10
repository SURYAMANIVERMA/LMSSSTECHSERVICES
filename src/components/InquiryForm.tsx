import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { TRAINING_TRACKS } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Invalid email").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  course: z.string().min(1, "Select a course"),
  message: z.string().trim().max(800).optional(),
});

export default function InquiryForm({ defaultCourse }: { defaultCourse?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", course: defaultCourse ?? "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.from("inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      service: parsed.data.course,
      message: parsed.data.message?.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Could not send your inquiry",
        description: `${error.message} — please call +91 8808227885 instead.`,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Inquiry received", description: "Our team will contact you within 24 hours." });
    setForm({ name: "", email: "", phone: "", course: defaultCourse ?? "", message: "" });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9XXXXXXXXX" />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="service">Course Interested In</Label>
        <Select value={form.course} onValueChange={v => setForm({ ...form, course: v })}>
          <SelectTrigger id="service" aria-label="Service interested in"><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent className="max-h-72">
            {TRAINING_TRACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.course && <p className="text-xs text-destructive mt-1">{errors.course}</p>}
      </div>
      <div>
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea id="message" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your requirement" />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="bg-gradient-accent border-0 shadow-accent">
        {loading ? "Sending…" : "Submit Inquiry"}
      </Button>
    </form>
  );
}