import { useState } from "react";
import { Link, useLocation } from "wouter";
import MobileMenu from "./MobileMenu";
import { useAuth } from "@/lib/auth";
import { Building, LogOut, User, Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [location, navigate] = useLocation();
  const { user, logout, isAdmin, isClient } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation should be handled by the logout function
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="bg-[#006039] text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/">
              <div className="text-xl font-bold mr-10 flex items-center">
                <Building className="h-6 w-6 mr-2 text-[#a37e2c]" />
                <span>Rolex Real Estate</span>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/" 
                    className={`${location === '/' ? 'text-[#c9c08f]' : 'hover:text-[#c9c08f]'} transition duration-200`}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/features" 
                    className={`${location === '/features' ? 'text-[#c9c08f]' : 'hover:text-[#c9c08f]'} transition duration-200`}
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/login-bypass" 
                    className="text-yellow-300 hover:text-yellow-500 transition duration-200"
                  >
                    Debug Login
                  </Link>
                </li>
                {user && isAdmin && (
                  <li>
                    <a 
                      href="/admin/dashboard" 
                      className={`${location === '/admin/dashboard' ? 'text-[#c9c08f]' : 'hover:text-[#c9c08f]'} transition duration-200`}
                    >
                      Admin Dashboard
                    </a>
                  </li>
                )}
                {user && isClient && (
                  <li>
                    <a 
                      href="/client/dashboard" 
                      className={`${location === '/client/dashboard' ? 'text-[#c9c08f]' : 'hover:text-[#c9c08f]'} transition duration-200`}
                    >
                      Dashboard
                    </a>
                  </li>
                )}
                <li>
                  <Link 
                    href="/documentation" 
                    className={`${location === '/documentation' ? 'text-[#c9c08f]' : 'hover:text-[#c9c08f]'} transition duration-200`}
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/api" 
                    className={`${location === '/api' ? 'text-[#c9c08f]' : 'hover:text-[#c9c08f]'} transition duration-200`}
                  >
                    API
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full h-10 w-10 p-0 border-[#c9c08f] bg-[#006039]">
                    <User className="h-5 w-5 text-[#c9c08f]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-[#c9c08f]">
                  <DropdownMenuLabel className="font-semibold">
                    <div className="flex items-center gap-2">
                      {isAdmin && <Shield className="h-4 w-4 text-[#a37e2c]" />}
                      {user.username}
                      {isAdmin && <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded">ADMIN</span>}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {isAdmin ? (
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => {
                        // Force navigation directly using window.location
                        window.location.href = "/admin/dashboard";
                      }}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => {
                        // Force navigation directly using window.location
                        window.location.href = "/client/dashboard";
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => {
                      // Force navigation directly using window.location
                      window.location.href = "/api-keys";
                    }}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    API Keys
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white transition duration-200"
                onClick={handleLogin}
              >
                Login
              </Button>
            )}
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white"
              onClick={toggleMobileMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <MobileMenu isVisible={mobileMenuVisible} />
      </div>
    </header>
  );
};

export default Header;
