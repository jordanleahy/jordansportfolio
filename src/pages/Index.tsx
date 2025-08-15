import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import shipImage from "@/assets/story-ship-bg.png";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  // Generate SEO metadata for homepage
  const homeSEO = generateSEOMetadata({
    title: "Lead Healthcare Product Designer",
    description: "ex BCG, SmarterDx, Definitive Healthcare, PrescriberPoint and HTD Health",
    image: shipImage,
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
      
      <div className="min-h-screen bg-background">
        <section className="relative py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Jordan Leahy
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Every Thought is a Visual Journey
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;