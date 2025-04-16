
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User } from 'lucide-react';

const Navbar = () => {
  const { authState, logout } = useAuth();
  const { user, isAuthenticated } = authState;

  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-2xl font-bold">
          GHL Chatbot
        </Link>
        
        {isAuthenticated && (
          <div className="ml-6 space-x-4 hidden md:flex">
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary">
              Dashboard
            </Link>
            <Link to="/chatbots" className="text-sm font-medium hover:text-primary">
              Chatbots
            </Link>
            <Link to="/integrations" className="text-sm font-medium hover:text-primary">
              Integrations
            </Link>
            <Link to="/settings" className="text-sm font-medium hover:text-primary">
              Settings
            </Link>
          </div>
        )}
      </div>
      
      <div>
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <User className="h-4 w-4 mr-2" />
                {user?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/api-keys">API Keys</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-x-2">
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
