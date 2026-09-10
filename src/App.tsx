import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import DomainGuard from "@/components/lms/DomainGuard";
import RequireRole from "@/components/lms/RequireRole";
import Index from "./pages/Index";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import ResetPassword from "./pages/ResetPassword";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEmailHealth from "./pages/AdminEmailHealth";
import NotFound from "./pages/NotFound";
import LmsAuth from "./pages/lms/LmsAuth";
import LmsHome from "./pages/lms/LmsHome";
import LmsCatalog from "./pages/lms/LmsCatalog";
import LmsCourse from "./pages/lms/LmsCourse";
import LmsManage from "./pages/lms/LmsManage";
import LmsCourseBuilder from "./pages/lms/LmsCourseBuilder";
import LmsActivity from "./pages/lms/LmsActivity";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import TrainerDashboard from "./pages/trainer/TrainerDashboard";
import ExternalRedirect from "@/components/ExternalRedirect";
import { LMS_URL } from "@/data/site";

const queryClient = new QueryClient();

function AuthHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    // Password recovery links must land on the reset page, never straight into a dashboard.
    if (hash.includes("type=recovery")) {
      window.location.replace(`/reset-password${hash}`);
      return;
    }
    if (hash.includes("access_token")) {
      supabase.auth.getSession().then(() => {
        window.location.replace("/lms");
      });
    }
  }, []);

  return null;
}

/** All LMS surfaces are locked to the official LMS hostname. */
function LmsArea() {
  return (
    <DomainGuard>
      <Outlet />
    </DomainGuard>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthHandler />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* public marketing site */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/internship" element={<ExternalRedirect to={LMS_URL} />} />
              <Route path="/placement" element={<ExternalRedirect to={LMS_URL} />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* LMS */}
              <Route element={<LmsArea />}>
                <Route path="/academy" element={<LmsCatalog />} />
                <Route path="/lms" element={<LmsHome />} />
                <Route path="/lms/auth" element={<LmsAuth />} />
                <Route path="/login" element={<Navigate to="/lms/auth" replace />} />
                <Route path="/lms/courses" element={<LmsCatalog />} />
                <Route path="/lms/course/:slug" element={<LmsCourse />} />
                <Route path="/course/:slug" element={<LmsCourse />} />

                {/* student */}
                <Route
                  path="/student/dashboard"
                  element={<RequireRole allow={["student"]}><StudentDashboard /></RequireRole>}
                />
                <Route
                  path="/student/profile"
                  element={<RequireRole allow={["student"]}><StudentProfile /></RequireRole>}
                />
                <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/dashboard" element={<Navigate to="/lms" replace />} />

                {/* trainer */}
                <Route
                  path="/trainer/dashboard"
                  element={<RequireRole allow={["trainer"]}><TrainerDashboard /></RequireRole>}
                />
                <Route path="/trainer" element={<Navigate to="/trainer/dashboard" replace />} />
                <Route path="/trainer-dashboard" element={<Navigate to="/trainer/dashboard" replace />} />

                {/* course management: admins and trainers (row security limits trainers to their own courses) */}
                <Route
                  path="/lms/manage"
                  element={<RequireRole allow={["admin", "trainer"]}><LmsManage /></RequireRole>}
                />
                <Route
                  path="/lms/manage/course/:id"
                  element={<RequireRole allow={["admin", "trainer"]}><LmsCourseBuilder /></RequireRole>}
                />
                <Route
                  path="/lms/activity"
                  element={<RequireRole allow={["admin"]}><LmsActivity /></RequireRole>}
                />

                {/* admin */}
                <Route
                  path="/admin/dashboard"
                  element={<RequireRole allow={["admin"]}><AdminDashboard /></RequireRole>}
                />
                <Route
                  path="/admin/users"
                  element={<RequireRole allow={["admin"]}><AdminUsers /></RequireRole>}
                />
                <Route
                  path="/admin/email-health"
                  element={<RequireRole allow={["admin"]}><AdminEmailHealth /></RequireRole>}
                />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/auth" element={<AdminAuth />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
