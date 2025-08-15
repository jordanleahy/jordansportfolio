import React from "react";
import { Helmet } from "react-helmet-async";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import shipImage from "@/assets/story-ship-bg.png";
import AppLayout from "@/components/layout/AppLayout";

const Index = () => {
  // Generate SEO metadata for homepage
  const homeSEO = generateSEOMetadata({
    title: "Jordan Leahy — Every Thought is a Visual Journey",
    description: "Every Thought is a Visual Journey",
    image: shipImage,
    url: "/",
    type: "website"
  });

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