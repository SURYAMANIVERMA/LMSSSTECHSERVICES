import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppFab from "../WhatsAppFab";
<<<<<<< Updated upstream
import PreviewBanner from "../lms/PreviewBanner";
=======
>>>>>>> Stashed changes

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col">
<<<<<<< Updated upstream
      <PreviewBanner />
=======
>>>>>>> Stashed changes
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
