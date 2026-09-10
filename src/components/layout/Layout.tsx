import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppFab from "../WhatsAppFab";
import PreviewBanner from "../lms/PreviewBanner";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col">
      <PreviewBanner />
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
