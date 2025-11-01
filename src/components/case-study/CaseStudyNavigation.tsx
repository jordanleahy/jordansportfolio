import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
}

interface CaseStudyNavigationProps {
  problemTitle: string;
  teamTitle: string;
  processTitle: string;
  solutionTitle: string;
  outcomesTitle: string;
  reflectionTitle: string;
}

export const CaseStudyNavigation = ({
  problemTitle,
  teamTitle,
  processTitle,
  solutionTitle,
  outcomesTitle,
  reflectionTitle,
}: CaseStudyNavigationProps) => {
  const [activeSection, setActiveSection] = useState<string>("context");
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const navItems: NavItem[] = [
    { id: "context", label: "CONTEXT" },
    { id: "problem", label: problemTitle.toUpperCase() },
    { id: "team", label: teamTitle.toUpperCase() },
    { id: "process", label: processTitle.toUpperCase() },
    { id: "solution", label: solutionTitle.toUpperCase() },
    { id: "impact", label: outcomesTitle.toUpperCase() },
    { id: "reflection", label: reflectionTitle.toUpperCase() },
  ];

  useEffect(() => {
    // Check if we've scrolled past the context section
    const handleScroll = () => {
      const contextSection = document.getElementById("context");
      if (contextSection) {
        const rect = contextSection.getBoundingClientRect();
        // Show navigation when context section is mostly out of view
        setIsVisible(rect.bottom < window.innerHeight * 0.3);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    navItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav 
      className={`hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-background/95 backdrop-blur-sm rounded-lg px-6 py-8 shadow-lg border">
        <ul className="space-y-6">
        {navItems.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <li key={id}>
              <button
                onClick={() => handleClick(id)}
                className="group flex items-center gap-3 text-left"
              >
                <div className="relative">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive ? "bg-primary scale-150" : "bg-muted-foreground/30"
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 w-2 h-2 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-medium tracking-wider transition-colors duration-300 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      </div>
    </nav>
  );
};
