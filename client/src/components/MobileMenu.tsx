import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut, Key, User, Shield } from "lucide-react";

interface MobileMenuProps {
  isVisible: boolean;
}

const MobileMenu = ({ isVisible }: MobileMenuProps) => {
  const [location, navigate] = useLocation();
  const { user, logout, isAdmin, isClient } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation should be handled by the logout function
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  return (
    <div className={`md:hidden ${isVisible ? 'block' : 'hidden'}`}>
      <nav className="mt-4 pb-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/" 
              className={`block ${location === '/' ? 'bg-[#a37e2c]' : 'hover:bg-[#a37e2c]'} px-3 py-2 rounded transition duration-200`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              href="/features" 
              className={`block ${location === '/features' ? 'bg-[#a37e2c]' : 'hover:bg-[#a37e2c]'} px-3 py-2 rounded transition duration-200`}
            >
              Features
            </Link>
          </li>
          {user && isAdmin && (
            <li>
              <a 
                href="/admin/dashboard" 
                className={`block ${location === '/admin/dashboard' ? 'bg-[#a37e2c]' : 'hover:bg-[#a37e2c]'} px-3 py-2 rounded transition duration-200 flex items-center`}
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </a>
            </li>
          )}
          {user && isClient && (
            <li>
              <a 
                href="/client/dashboard" 
                className={`block ${location === '/client/dashboard' ? 'bg-[#a37e2c]' : 'hover:bg-[#a37e2c]'} px-3 py-2 rounded transition duration-200 flex items-center`}
              >
                <User className="mr-2 h-4 w-4" />
                Dashboard
              </a>
            </li>
          )}
          {user && (
            <li>
              <a 
                href="/api-keys" 
                className={`block ${location === '/api-keys' ? 'bg-[#a37e2c]' : 'hover:bg-[#a37e2c]'} px-3 py-2 rounded transition duration-200 flex items-center`}
              >
                <Key className="mr-2 h-4 w-4" />
                API Keys
              </a>
            </li>
          )}
          <li>
            <Link 
              href="/documentation" 
              className={`block ${location === '/documentation' ? 'bg-[#a37e2c]' : 'hover:bg-[#a37e2c]'} px-3 py-2 rounded transition duration-200`}
            >
              Documentation
            </Link>
          </li>
          <li>
            <Link 
              href="/api" 
              className={`block ${location === '/api' ? 'bg-[#a37e2c]' : 'hover:bg-[#a37e2c]'} px-3 py-2 rounded transition duration-200`}
            >
              API
            </Link>
          </li>
          
          {/* Authentication actions */}
          <li className="mt-4 pt-4 border-t border-[#a37e2c]/30">
            {user ? (
              <div className="space-y-2">
                <div className="text-[#c9c08f] font-medium px-3 flex items-center gap-2">
                  {isAdmin && <Shield className="h-4 w-4 text-[#a37e2c]" />}
                  Signed in as: {user.username}
                  {isAdmin && <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded">ADMIN</span>}
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="destructive" 
                  className="w-full flex items-center justify-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                className="w-full bg-[#a37e2c] hover:bg-[#c9c08f] text-white"
              >
                Login / Register
              </Button>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MobileMenu;
