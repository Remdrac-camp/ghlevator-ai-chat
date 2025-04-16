
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  requiresAuth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, requiresAuth = false }) => {
  const { authState } = useAuth();
  const { isAuthenticated, isLoading } = authState;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-4">{children}</main>
      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        GHL Chatbot Integration &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Layout;
