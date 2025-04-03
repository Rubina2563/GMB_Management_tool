import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Define the sub-menu items for various main menu items
const subMenus: Record<string, Array<{ id: string; label: string }>> = {
  '/client/optimization': [
    { id: 'ai-suggestions', label: 'AI Suggestions' },
    { id: 'category-optimization', label: 'Category Optimization' },
    { id: 'page-speed', label: 'Page Speed' },
    { id: 'content-analysis', label: 'Content Analysis' },
  ],
  '/client/campaigns': [
    { id: 'all', label: 'All Campaigns' },
    { id: 'active', label: 'Active Campaigns' },
    { id: 'setup', label: 'Campaign Setup' },
    { id: 'analysis', label: 'Campaign Analysis' },
  ],
  '/client/rankings': [
    { id: 'overview', label: 'Overview' },
    { id: 'local', label: 'Local Rankings' },
    { id: 'national', label: 'National Rankings' },
    { id: 'history', label: 'Ranking History' },
  ],
  // Updated paths to match the actual route paths in App.tsx
  '/client/review-management': [
    { id: 'all-reviews', label: 'All Reviews' },
    { id: 'pending', label: 'Pending Reviews' },
    { id: 'replied', label: 'Replied Reviews' },
    { id: 'settings', label: 'Review Settings' },
  ],
  '/client/request-reviews': [
    { id: 'new-request', label: 'New Request' },
    { id: 'history', label: 'Request History' },
    { id: 'templates', label: 'Email Templates' },
    { id: 'settings', label: 'Request Settings' },
  ],
  '/client/sentiment-analysis': [
    { id: 'overview', label: 'Sentiment Overview' },
    { id: 'trends', label: 'Sentiment Trends' },
    { id: 'keywords', label: 'Keyword Analysis' },
    { id: 'reports', label: 'Sentiment Reports' },
  ],
  '/client/posts': [
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Drafts' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'create', label: 'Create Post' },
  ],
  '/client/reports': [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'custom', label: 'Custom' },
  ],
  '/client/citations': [
    { id: 'directory', label: 'Directory' },
    { id: 'audit', label: 'Audit' },
    { id: 'builder', label: 'Builder' },
    { id: 'monitor', label: 'Monitor' },
  ],
  '/client/competitors': [
    { id: 'tracking', label: 'Tracking' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'benchmarking', label: 'Benchmarking' },
    { id: 'insights', label: 'AI Insights' },
  ],
  '/client/keywords': [
    { id: 'research', label: 'Research' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'trends', label: 'Trends' },
  ],
  '/admin/users': [
    { id: 'all', label: 'All Users' },
    { id: 'admins', label: 'Admins' },
    { id: 'clients', label: 'Clients' },
    { id: 'pending', label: 'Pending' },
  ],
  '/admin/subscriptions': [
    { id: 'active', label: 'Active' },
    { id: 'expired', label: 'Expired' },
    { id: 'pending', label: 'Pending' },
    { id: 'plans', label: 'Manage Plans' },
  ],
  '/admin/api-keys': [
    { id: 'active', label: 'Active Keys' },
    { id: 'usage', label: 'Usage Analytics' },
    { id: 'settings', label: 'API Settings' },
  ],
  // Removed menu for /client/dashboard
  '/admin/dashboard': [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'system', label: 'System Status' },
  ],
};

interface SubMenuProps {
  sidebarWidth: number;
}

const SubMenu = ({ sidebarWidth }: SubMenuProps) => {
  const [location] = useLocation();
  const [activeSubItem, setActiveSubItem] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Get the base path (e.g., /client/optimization)
  const basePath = '/' + location.split('/').slice(1, 3).join('/');
  
  // Get submenu items for current path
  const subMenuItems = subMenus[basePath] || [];
  
  // Reset active submenu item when path changes
  useEffect(() => {
    if (subMenuItems.length > 0) {
      setActiveSubItem(subMenuItems[0].id);
    } else {
      setActiveSubItem(null);
    }
  }, [basePath, subMenuItems]);
  
  // If no submenu items, don't render
  if (subMenuItems.length === 0) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        className="bg-[#c9c08f] text-[#006039] h-12 shadow-sm flex items-center pl-4 pr-4 fixed top-0 right-0 z-10 overflow-x-auto"
        style={{ left: `${sidebarWidth}px` }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        key={basePath}
      >
        <ul className="flex space-x-6 min-w-max">
          {subMenuItems.map((item) => (
            <motion.li key={item.id}>
              <motion.button
                className={cn(
                  "py-1 px-2 text-[#006039] font-['Montserrat'] text-base font-medium relative",
                  activeSubItem === item.id && "font-bold"
                )}
                onClick={() => {
                  setActiveSubItem(item.id);
                  // Dispatch a custom event that the ReviewsPage can listen for
                  window.dispatchEvent(new CustomEvent('submenuClicked', {
                    detail: { id: item.id }
                  }));
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {item.label}
                {activeSubItem === item.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a37e2c]"
                    layoutId="submenu-underline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubMenu;