import { useState, useEffect } from 'react';
import { useLocation as useWouterLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLocationContext } from '@/lib/location-context';
import { 
  Bars3Icon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Import shared menu items
import { 
  standaloneMenuItems, 
  clientMenuGroups, 
  adminMenuItems,
} from './MenuItems';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [routerLocation, navigate] = useWouterLocation();
  const { user, isAdmin, isClient, logout } = useAuth();
  const isMobile = useIsMobile();
  
  // Use location context instead of direct API call
  const { locations, isLoading: isLoadingLocations } = useLocationContext();
  
  // Close sidebar on mobile by default and handle sidebar state changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);
  
  // Fire custom event when sidebar state changes
  useEffect(() => {
    // Create and dispatch custom event
    const event = new CustomEvent('sidebarToggle', {
      detail: { isOpen }
    });
    window.dispatchEvent(event);
  }, [isOpen]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation should be handled by the logout function
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // Check if an item is active
  const isItemActive = (path: string) => {
    return routerLocation === path || routerLocation.includes(path);
  };
  
  // Handle posts navigation with location data
  const handleCreatePostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if we have locations data
    if (locations && locations.length > 0) {
      // Navigate to the first location's posts page
      const firstLocationId = locations[0].id;
      navigate(`/client/posts/${firstLocationId}`);
    } else {
      // If no locations or locations not loaded yet, just go to base posts page
      navigate('/client/posts');
    }
  };
  
  // Handle post scheduler navigation
  const handleSchedulerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if we have locations data
    if (locations && locations.length > 0) {
      // Navigate to the first location's post scheduler page
      const firstLocationId = locations[0].id;
      navigate(`/client/posts/scheduler/${firstLocationId}`);
    } else {
      // If no locations or locations not loaded yet, just go to base scheduler page
      navigate('/client/posts/scheduler');
    }
  };
  
  // Handle post analytics navigation
  const handleAnalyticsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if we have locations data
    if (locations && locations.length > 0) {
      // Navigate to the first location's post analytics page
      const firstLocationId = locations[0].id;
      navigate(`/client/posts/analytics/${firstLocationId}`);
    } else {
      // If no locations or locations not loaded yet, just go to base analytics page
      navigate('/client/posts/analytics');
    }
  };
  
  // Manage expanded state for collapsible groups - all start collapsed
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'reputation-management': false,
    'content-management': false,
    'local-ranking': false,
    'local-links': false,
    'admin': false
  });
  
  // Toggle group expansion
  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Variants for framer-motion animations - adjust width based on screen size
  const sidebarVariants = {
    open: { 
      width: isMobile ? '280px' : '300px', 
      x: 0 
    },
    closed: { 
      width: isMobile ? '0px' : '60px', 
      x: isMobile ? '-100%' : 0 
    },
  };
  
  // Animation variants for collapsible content
  const collapsibleVariants = {
    open: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    closed: { 
      height: 0, 
      opacity: 0,
      transition: { 
        duration: 0.3,
        when: "afterChildren",
      }
    }
  };
  
  // Animation variants for menu items within collapsible groups
  const itemVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -5 }
  };
  
  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isMobile && isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        className={cn(
          "sidebar fixed top-0 left-0 z-40 h-full bg-gradient-dark text-text-primary flex flex-col shadow-xl",
          isMobile && "shadow-2xl"
        )}
        initial={isMobile ? 'closed' : 'open'}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Logo and toggle */}
        <div className="flex items-center justify-between p-4">
          {isOpen && (
            <div className="flex items-center w-full justify-center mb-2">
              <div className="text-center font-bold text-2xl tracking-wider">
                <span className="text-[#F28C38]">AUTHORITY</span>
                <span className="text-white ml-1">LOCAL</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md hover:bg-orange-base/20 text-text-primary"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? 
              <XMarkIcon className="h-6 w-6" /> :
              <Bars3Icon className="h-6 w-6" />
            }
          </button>
        </div>
        
        {/* User profile */}
        {isOpen && user && (
          <div className="p-4 border-b border-text-secondary/20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="flex-shrink-0 h-10 w-10 bg-orange-base rounded-full flex items-center justify-center text-text-primary font-bold text-lg overflow-hidden hover-scale">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-dark-base"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate uppercase">
                  {user.username || "John Doe"}
                </p>
                <p className="text-xs bg-orange-base inline-block px-2 py-0.5 rounded-md uppercase">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          {isOpen ? (
            <div className="space-y-5 px-3">
              {isAdmin ? (
                // Admin menu items (not grouped)
                <ul className="space-y-1">
                  {adminMenuItems.map(item => {
                    const isActive = isItemActive(item.path);
                    const Icon = item.icon;
                    
                    return (
                      <li key={item.path}>
                        <Link 
                          to={item.path}
                          className={cn(
                            "flex items-center py-1 px-2 font-['Montserrat'] text-sm rounded-md transition-all whitespace-nowrap overflow-hidden",
                            isActive
                              ? "bg-orange-base/20 text-orange-base font-bold"
                              : "hover:bg-dark-darker hover:text-text-primary"
                          )}
                        >
                          <Icon className={cn(
                            "h-5 w-5", 
                            isActive && "text-orange-base"
                          )} />
                          <span className="ml-3">{item.label}</span>
                          {isActive && (
                            <motion.div
                              className="w-1 h-full bg-orange-base absolute right-0 rounded-l shadow-[0_0_8px_rgba(242,140,56,0.6)]"
                              layoutId="activeIndicator"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                // Client navigation with collapsible groups
                <div className="space-y-4">
                  {/* Standalone items (like Dashboard) */}
                  <ul className="space-y-4">
                    {standaloneMenuItems.map(item => {
                      const isActive = isItemActive(item.path);
                      const Icon = item.icon;
                      
                      return (
                        <li key={item.path}>
                          <Link 
                            to={item.path}
                            className={cn(
                              "flex items-center py-1 px-2 font-['Montserrat'] text-sm rounded-md transition-all whitespace-nowrap overflow-hidden",
                              isActive
                                ? "bg-orange-base/20 text-orange-base font-bold"
                                : "hover:bg-dark-darker hover:text-text-primary"
                            )}
                          >
                            <Icon className={cn(
                              "h-5 w-5", 
                              isActive && "text-orange-base"
                            )} />
                            <span className="ml-3">{item.label}</span>
                            {isActive && (
                              <motion.div
                                className="w-1 h-full bg-orange-base absolute right-0 rounded-l shadow-[0_0_8px_rgba(242,140,56,0.6)]"
                                layoutId="activeIndicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  
                  {/* Menu groups */}
                  {clientMenuGroups.map((group, idx) => {
                    // Check if any item in this group is active
                    const isGroupActive = group.items.some(item => isItemActive(item.path));
                    // Set default expanded state based on activity or previous state
                    const isExpanded = expandedGroups[group.id] !== undefined 
                      ? expandedGroups[group.id] 
                      : isGroupActive;
                    
                    // Add separator before Admin section
                    const isAdminGroup = group.id === 'admin';
                    
                    return (
                      <div key={group.id} className="space-y-4">
                        {/* Separator for Admin section */}
                        {isAdminGroup && (
                          <div className="h-px bg-gray-300/20 my-2" />
                        )}
                        
                        {/* Group header (clickable to expand/collapse) */}
                        <button
                          onClick={() => toggleGroupExpanded(group.id)}
                          className={cn(
                            "flex items-center justify-between w-full py-1 px-2 font-['Montserrat'] text-sm rounded-md transition-all whitespace-nowrap overflow-hidden",
                            isGroupActive
                              ? "bg-orange-base/20 text-orange-base font-bold"
                              : "hover:bg-dark-darker hover:text-text-primary"
                          )}
                        >
                          <div className="flex items-center">
                            <group.icon className={cn(
                              "h-5 w-5", 
                              isGroupActive && "text-orange-base"
                            )} />
                            <span className="ml-3">{group.label}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUpIcon className={cn(
                              "h-4 w-4",
                              "text-orange-base" // Always orange for the toggle arrow
                            )} />
                          ) : (
                            <ChevronDownIcon className={cn(
                              "h-4 w-4",
                              "text-orange-base" // Always orange for the toggle arrow
                            )} />
                          )}
                        </button>
                        
                        {/* Collapsible group content */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial="closed"
                              animate="open"
                              exit="closed"
                              variants={collapsibleVariants}
                              className="overflow-hidden"
                            >
                              <ul className="space-y-1 pl-4 mt-1">
                                {group.items.map(item => {
                                  const isActive = isItemActive(item.path);
                                  const Icon = item.icon;
                                  
                                  return (
                                    <motion.li 
                                      key={item.path}
                                      variants={itemVariants}
                                    >
                                      {item.special === 'create-post' ? (
                                        // Special handling for Create Post navigation
                                        <a 
                                          href="#"
                                          onClick={handleCreatePostClick}
                                          className={cn(
                                            "flex items-center py-1 px-2 font-['Montserrat'] text-sm rounded-md transition-all whitespace-nowrap overflow-hidden",
                                            isActive
                                              ? "bg-orange-base/20 text-orange-base font-bold"
                                              : "hover:bg-dark-darker hover:text-text-primary"
                                          )}
                                        >
                                          <Icon className={cn(
                                            "h-4 w-4", 
                                            isActive && "text-orange-base"
                                          )} />
                                          <span className="ml-3">{item.label}</span>
                                          {isActive && (
                                            <motion.div
                                              className="w-1 h-full bg-orange-base absolute right-0 rounded-l shadow-[0_0_8px_rgba(242,140,56,0.6)]"
                                              layoutId="activeIndicator"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.2 }}
                                            />
                                          )}
                                        </a>
                                      ) : item.special === 'post-scheduler' ? (
                                        // Special handling for Post Scheduler navigation
                                        <a 
                                          href="#"
                                          onClick={handleSchedulerClick}
                                          className={cn(
                                            "flex items-center py-1 px-2 font-['Montserrat'] text-sm rounded-md transition-all whitespace-nowrap overflow-hidden",
                                            isActive
                                              ? "bg-orange-base/20 text-orange-base font-bold"
                                              : "hover:bg-dark-darker hover:text-text-primary"
                                          )}
                                        >
                                          <Icon className={cn(
                                            "h-4 w-4", 
                                            isActive && "text-orange-base"
                                          )} />
                                          <span className="ml-3">{item.label}</span>
                                          {isActive && (
                                            <motion.div
                                              className="w-1 h-full bg-orange-base absolute right-0 rounded-l shadow-[0_0_8px_rgba(242,140,56,0.6)]"
                                              layoutId="activeIndicator"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.2 }}
                                            />
                                          )}
                                        </a>
                                      ) : item.special === 'post-analytics' ? (
                                        // Special handling for Post Analytics navigation
                                        <a 
                                          href="#"
                                          onClick={handleAnalyticsClick}
                                          className={cn(
                                            "flex items-center py-1 px-2 font-['Montserrat'] text-sm rounded-md transition-all whitespace-nowrap overflow-hidden",
                                            isActive
                                              ? "bg-orange-base/20 text-orange-base font-bold"
                                              : "hover:bg-dark-darker hover:text-text-primary"
                                          )}
                                        >
                                          <Icon className={cn(
                                            "h-4 w-4", 
                                            isActive && "text-orange-base"
                                          )} />
                                          <span className="ml-3">{item.label}</span>
                                          {isActive && (
                                            <motion.div
                                              className="w-1 h-full bg-orange-base absolute right-0 rounded-l shadow-[0_0_8px_rgba(242,140,56,0.6)]"
                                              layoutId="activeIndicator"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.2 }}
                                            />
                                          )}
                                        </a>
                                      ) : (
                                        // Standard navigation for other items
                                        <Link 
                                          to={item.path}
                                          className={cn(
                                            "flex items-center py-1 px-2 font-['Montserrat'] text-sm rounded-md transition-all whitespace-nowrap overflow-hidden",
                                            isActive
                                              ? "bg-orange-base/20 text-orange-base font-bold"
                                              : "hover:bg-dark-darker hover:text-text-primary"
                                          )}
                                        >
                                          <Icon className={cn(
                                            "h-4 w-4", 
                                            isActive && "text-orange-base"
                                          )} />
                                          <span className="ml-3">{item.label}</span>
                                          {isActive && (
                                            <motion.div
                                              className="w-1 h-full bg-orange-base absolute right-0 rounded-l shadow-[0_0_8px_rgba(242,140,56,0.6)]"
                                              layoutId="activeIndicator"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.2 }}
                                            />
                                          )}
                                        </Link>
                                      )}
                                    </motion.li>
                                  );
                                })}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Collapsed view of navigation
            <ul className="flex flex-col items-center space-y-4 mt-4">
              {isAdmin ? (
                // Admin menu items
                adminMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.path);
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          "p-2 rounded-md transition-all flex items-center justify-center hover-scale",
                          isActive 
                            ? "bg-orange-base/20 text-orange-base" 
                            : "hover:bg-dark-darker text-text-secondary hover:text-text-primary"
                        )}
                        title={item.label}
                      >
                        <Icon className="h-6 w-6" />
                      </Link>
                    </li>
                  );
                })
              ) : (
                // Client navigation in collapsed mode - display standalone items and groups as icons
                <>
                  {/* Standalone items */}
                  {standaloneMenuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.path);
                    
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={cn(
                            "p-2 rounded-md transition-all flex items-center justify-center hover-scale",
                            isActive 
                              ? "bg-orange-base/20 text-orange-base" 
                              : "hover:bg-dark-darker text-text-secondary hover:text-text-primary"
                          )}
                          title={item.label}
                        >
                          <Icon className="h-6 w-6" />
                        </Link>
                      </li>
                    );
                  })}
                  
                  {/* Group separators - display only group icons in collapsed mode */}
                  {clientMenuGroups.map((group, idx) => {
                    // Check if any item in the group is active
                    const isGroupActive = group.items.some(item => isItemActive(item.path));
                    const GroupIcon = group.icon;
                    
                    // First active item in group
                    const activeItem = group.items.find(item => isItemActive(item.path));
                    
                    // Add separator before Admin section in collapsed mode
                    const isAdminGroup = group.id === 'admin';
                    
                    return (
                      <li key={group.id}>
                        {isAdminGroup && (
                          <div className="h-px w-8 bg-gray-300/20 my-2" />
                        )}
                        {activeItem?.special === 'create-post' ? (
                          <a
                            href="#"
                            onClick={handleCreatePostClick}
                            className={cn(
                              "p-2 rounded-md transition-all flex items-center justify-center hover-scale",
                              isGroupActive 
                                ? "bg-orange-base/20 text-orange-base" 
                                : "hover:bg-dark-darker text-text-secondary hover:text-text-primary"
                            )}
                            title={group.label}
                          >
                            <GroupIcon className="h-6 w-6" />
                          </a>
                        ) : activeItem?.special === 'post-scheduler' ? (
                          <a
                            href="#"
                            onClick={handleSchedulerClick}
                            className={cn(
                              "p-2 rounded-md transition-all flex items-center justify-center hover-scale",
                              isGroupActive 
                                ? "bg-orange-base/20 text-orange-base" 
                                : "hover:bg-dark-darker text-text-secondary hover:text-text-primary"
                            )}
                            title={group.label}
                          >
                            <GroupIcon className="h-6 w-6" />
                          </a>
                        ) : activeItem?.special === 'post-analytics' ? (
                          <a
                            href="#"
                            onClick={handleAnalyticsClick}
                            className={cn(
                              "p-2 rounded-md transition-all flex items-center justify-center hover-scale",
                              isGroupActive 
                                ? "bg-orange-base/20 text-orange-base" 
                                : "hover:bg-dark-darker text-text-secondary hover:text-text-primary"
                            )}
                            title={group.label}
                          >
                            <GroupIcon className="h-6 w-6" />
                          </a>
                        ) : (
                          <Link
                            to={activeItem?.path || group.items[0].path}
                            className={cn(
                              "p-2 rounded-md transition-all flex items-center justify-center hover-scale",
                              isGroupActive 
                                ? "bg-orange-base/20 text-orange-base" 
                                : "hover:bg-dark-darker text-text-secondary hover:text-text-primary"
                            )}
                            title={group.label}
                          >
                            <GroupIcon className="h-6 w-6" />
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          )}
        </nav>
        
        {/* Settings and Logout */}
        <div className="mt-auto p-4 border-t border-text-secondary/20">
          {isOpen ? (
            <div className="space-y-2">
              <button
                onClick={handleLogout}
                className="flex items-center py-1 px-2 w-full text-left rounded-md hover:bg-dark-darker hover:text-orange-base transition-colors whitespace-nowrap overflow-hidden"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                <span className="ml-3 font-['Montserrat'] text-sm">LOGOUT</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-dark-darker text-text-secondary hover:text-orange-base transition-colors"
                title="LOGOUT"
              >
                <ArrowLeftOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>
      
      {/* Toggle button for mobile (outside sidebar) */}
      {isMobile && !isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-md bg-dark-base text-orange-base shadow-lg hover:bg-dark-darker hover:text-orange-light transition-colors"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Bars3Icon className="h-6 w-6" />
        </motion.button>
      )}
    </>
  );
};

export default Sidebar;