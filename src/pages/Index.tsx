
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { generateSEOMetadata } from "@/utils/seoHelpers";

const Index = () => {
  // Generate SEO metadata for homepage redirect
  const homeSEO = generateSEOMetadata({
    title: "Jordan Leahy - AI Content Marketing Platform",
    description: "Create compelling marketing content with AI-powered stories and insights. Join Jordan Leahy's platform for healthcare technology content.",
    image: "/lovable-uploads/a3482ced-732a-40a0-95b4-3199495f0f4f.png",
    url: "/",
    type: "website"
  });

  // Redirect to stories immediately
  return (
    <>
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
      </Helmet>
      <Navigate to="/stories" replace />
    </>
  );
};

export default Index;
