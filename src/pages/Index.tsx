
import React, { Suspense, lazy } from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import CompaniesSection from "@/components/CompaniesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ProjectCardsSection from "@/components/ProjectCardsSection";
import BlogTeaser from "@/components/BlogTeaser";
import ContactSection from "@/components/ContactSection";
import { ImageMigration } from "@/components/ImageMigration";

// Lazy load heavy HeroParallax component
const HeroParallaxDemo = lazy(() => import("@/components/HeroParallaxDemo"));

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth state management
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />
      
      {/* Admin Bar for authenticated users */}
      {user && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <div className="bg-card border rounded-lg p-3 shadow-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Logged in as: {user.email}
            </p>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
          <ImageMigration />
        </div>
      )}

      {/* Hero Parallax Section */}
      <Suspense fallback={
        <div className="h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading hero section...</p>
          </div>
        </div>
      }>
        <HeroParallaxDemo />
      </Suspense>
      
      {/* Portfolio Content */}
      <CompaniesSection />
      <TestimonialsSection />
      <ProjectCardsSection />
      <BlogTeaser />
      <ContactSection />

    </div>
  );
};

export default Index;
