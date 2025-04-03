import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [location] = useLocation();
  
  // Adjust sidebar width based on mobile/desktop and sidebar state
  const updateSidebarWidth = useCallback(() => {
    if (isMobile) {
      setSidebarWidth(0); // On mobile, content takes full width
    } else {
      setSidebarWidth(isSidebarOpen ? 300 : 60); // On desktop, collapsed is 60px
    }
  }, [isMobile, isSidebarOpen]);
  
  // Update sidebar width when mobile state or sidebar open state changes
  useEffect(() => {
    updateSidebarWidth();
  }, [isMobile, isSidebarOpen, updateSidebarWidth]);
  
  // Set up event listener to track sidebar state changes
  useEffect(() => {
    // Custom event handler for sidebar state changes
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };
    
    // Add event listener for sidebar toggle
    window.addEventListener('sidebarToggle' as any, handleSidebarToggle as EventListener);
    
    // Initial sidebar state
    setIsSidebarOpen(!isMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('sidebarToggle' as any, handleSidebarToggle as EventListener);
    };
  }, [isMobile]);
  
  // Determine the page title based on the current location
  const getPageTitle = () => {
    // Extract the second part of the path (/admin/dashboard -> dashboard)
    const pathParts = location.split('/');
    if (pathParts.length >= 3) {
      // Capitalize the first letter
      return pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1);
    }
    return 'Dashboard';
  };
  
  return (
    <div className="flex min-h-screen bg-[#f4f4f2]">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <motion.div
        className="flex flex-col flex-grow relative"
        initial={{ marginLeft: isMobile ? 0 : sidebarWidth }}
        animate={{ marginLeft: isMobile ? 0 : sidebarWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Top bar - fixed at the top of the content area */}
        <div className="fixed top-0 right-0 left-0 z-10" style={{ 
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`
        }}>
          <TopBar />
        </div>
        
        {/* Content */}
        <main className={cn(
          "flex-grow mt-16 transition-all duration-300", // margin-top to accommodate the top bar
          isMobile ? "px-4 py-4" : "py-6" // No horizontal padding to allow child components to set their own
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;