import React, { useEffect, Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import CompaniesSection from "@/components/CompaniesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ProjectCardsSection from "@/components/ProjectCardsSection";
import ContactSection from "@/components/ContactSection";
import RecentBlogsSection from "@/components/RecentBlogsSection";

// Lazy load heavy HeroParallax component
const HeroParallaxDemo = lazy(() => import("@/components/HeroParallaxDemo"));

const Index = () => {
  const { user, loading } = useAuth();
  // Generate SEO metadata for homepage
  const homeSEO = generateSEOMetadata({
    title: "Lead Healthcare Product Designer",
    description: "ex BCG, SmarterDx, Definitive Healthcare, PrescriberPoint and HTD Health",
    image: "/lovable-uploads/a3482ced-732a-40a0-95b4-3199495f0f4f.png",
    url: "/",
    type: "website"
  });

  // Redirect authenticated users to stories
  if (!loading && user) {
    return <Navigate to="/stories" replace />;
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{homeSEO.title}</title>
        <meta name="description" content={homeSEO.description} />
        <meta property="og:title" content={homeSEO.ogTitle} />
        <meta property="og:description" content={homeSEO.ogDescription} />
        <meta property="og:image" content={homeSEO.image} />
        <meta property="og:url" content={homeSEO.url} />
        <meta property="og:type" content={homeSEO.type} />
        <meta property="og:site_name" content={homeSEO.siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={homeSEO.ogTitle} />
        <meta name="twitter:description" content={homeSEO.ogDescription} />
        <meta name="twitter:image" content={homeSEO.image} />
        <link rel="canonical" href="/" />
      </Helmet>
      
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
      <RecentBlogsSection />
      <ProjectCardsSection />
      <TestimonialsSection />
      <ContactSection />
    </AppLayout>
  );
};

export default Index;