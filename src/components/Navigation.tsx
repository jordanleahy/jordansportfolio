import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, Home, Briefcase, User, BookOpen, Mail, BarChart3, Calendar, LogIn, LogOut, Settings, ChevronDown, FileText, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
      
      // Calculate scroll progress
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (sectionId === "about") {
      // Open LinkedIn profile in new tab when About is clicked
      window.open("https://www.linkedin.com/in/jordanleahy/", "_blank");
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: "hero", label: "Home", icon: Home },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "about", label: "About", icon: User },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${scrollProgress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-1 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0"
            >
              <Link 
                to="/" 
                className="text-xl font-bold text-foreground hover:text-primary transition-colors"
              >
                Jordan Leahy
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <div className="flex items-center space-x-4">
                {/* Main Nav Items */}
                <div className="flex items-center space-x-6">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-accent/10 rounded-md"
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/sec")}
                  >
                    <BarChart3 size={16} className="mr-2" />
                    <span className="hidden xl:inline">Q2 Form D</span>
                    <span className="xl:hidden">SEC</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/blog")}
                  >
                    <BookOpen size={16} className="mr-2" />
                    Blog
                  </Button>

                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                    >
                      <LogOut size={16} className="mr-2" />
                      <span className="hidden xl:inline">Logout</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/auth")}
                    >
                      <LogIn size={16} className="mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tablet Navigation (md to lg) */}
            <div className="hidden md:block lg:hidden">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/sec")}
                >
                  <BarChart3 size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/blog")}
                >
                  <BookOpen size={16} />
                </Button>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <User size={16} />
                        <ChevronDown size={14} className="ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {navItems.map((item) => (
                        <DropdownMenuItem key={item.id} onClick={() => scrollToSection(item.id)}>
                          <item.icon size={16} className="mr-2" />
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/vendors/rcm")}>
                        <Building2 size={16} className="mr-2" />
                        Vendors
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/calendar")}>
                        <Calendar size={16} className="mr-2" />
                        Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/jobs")}>
                        <FileText size={16} className="mr-2" />
                        Jobs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/agents")}>
                        <Settings size={16} className="mr-2" />
                        AI Agents
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate("/admin-blog")}>
                          <Settings size={16} className="mr-2" />
                          Blog Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/auth")}
                  >
                    <LogIn size={16} />
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-md border-t border-border"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent/10 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-colors flex items-center gap-2"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/sec");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start mt-2"
                >
                  <BarChart3 size={16} className="mr-2" />
                  Q2 Form D
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/blog");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start mt-1"
                >
                  <BookOpen size={16} className="mr-2" />
                  Blog
                </Button>
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate("/vendors/rcm");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start mt-1"
                    >
                      <Building2 size={16} className="mr-2" />
                      Vendors
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate("/calendar");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start mt-1"
                    >
                      <Calendar size={16} className="mr-2" />
                      Calendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate("/jobs");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start mt-1"
                    >
                      <FileText size={16} className="mr-2" />
                      Jobs
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate("/agents");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start mt-1"
                    >
                      <Settings size={16} className="mr-2" />
                      AI Agents
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigate("/admin-blog");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start mt-1"
                      >
                        <Settings size={16} className="mr-2" />
                        Blog Admin
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start mt-1"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate("/auth");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start mt-1"
                  >
                    <LogIn size={16} className="mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navigation;
