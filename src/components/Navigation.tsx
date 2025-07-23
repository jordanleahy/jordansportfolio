
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">Ascertain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/blog" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/blog') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Blog
            </Link>
            <Link 
              to="/comparison" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/comparison') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Comparisons
            </Link>
            <Link 
              to="/rcmcompanies" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/rcmcompanies') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              RCM Companies
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/home" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/home') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-b border-border">
            <Link
              to="/blog"
              className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary ${
                isActive('/blog') ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={closeMenu}
            >
              Blog
            </Link>
            <Link
              to="/comparison"
              className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary ${
                isActive('/comparison') ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={closeMenu}
            >
              Comparisons
            </Link>
            <Link
              to="/rcmcompanies"
              className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary ${
                isActive('/rcmcompanies') ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={closeMenu}
            >
              RCM Companies
            </Link>
            {user ? (
              <div className="space-y-1">
                <Link
                  to="/home"
                  className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary ${
                    isActive('/home') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Button 
                  onClick={() => { handleSignOut(); closeMenu(); }} 
                  variant="outline" 
                  size="sm"
                  className="mx-3"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth" onClick={closeMenu}>
                <Button variant="outline" size="sm" className="mx-3">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
