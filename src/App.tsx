import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import QuickSupport from "./pages/QuickSupport";
import Academy from "./pages/Academy";
import LMS from "./pages/LMS";
import Internship from "./pages/Internship";
import Placement from "./pages/Placement";
import Projects from "./pages/Projects";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import TrackTicket from "./pages/TrackTicket";
import AdminAuth from "./pages/AdminAuth";
import AdminTickets from "./pages/AdminTickets";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import LMSAdmin from "./pages/LMSAdmin";

const queryClient = new QueryClient();

function AuthHandler() {
  useEffect(() => {
    const hash = window.location.hash;

    // Supabase password reset / magic link callback
    if (hash.includes("access_token")) {
      console.log("Supabase auth callback detected");

      // Let Supabase read session
      supabase.auth.getSession().then(({ data }) => {
        console.log("Session:", data.session);

        // Redirect to LMS page after auth
        window.location.replace("/#/lms");
      });
    }
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthHandler />
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/quick-support" element={<QuickSupport />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/lms" element={<LMS />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
            <Route path="/internship" element={<Internship />} />
            <Route path="/placement" element={<Placement />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/track" element={<TrackTicket />} />
            <Route path="/track/:ref" element={<TrackTicket />} />
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/lms" element={<LMSAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
