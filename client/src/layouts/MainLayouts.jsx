import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/SideBar";
import Navbar from "../components/Navbar";
import FloatingChatWidget from "../components/FloatingChatWidget";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const contentAreaRef = useRef(null);

  // Automatically close sidebar when navigating to a new route on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Strict Mode: Scroll page content to top on route change
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Mobile Slide-Over Backdrop */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Component - Strictly Pinned */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="dashboard-main">
        {/* Navbar - Strictly Pinned at Top */}
        <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Dedicated Scrollable Content Area - ONLY this area scrolls */}
        <div className="dashboard-content-scrollable" ref={contentAreaRef}>
          <Outlet />
        </div>

        {/* Global Floating Staff Chat for Quick Employee/Admin Messaging */}
        <FloatingChatWidget />
      </main>
    </div>
  );
}

export default MainLayout;
