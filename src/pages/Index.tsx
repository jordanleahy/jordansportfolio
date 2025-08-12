
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import shipImage from "@/assets/story-ship-bg.png";

const Index = () => {
  // Generate SEO metadata for homepage redirect
  const homeSEO = generateSEOMetadata({
    title: "Story Ship — Every Thought is a Visual Journey",
    description: "Every Thought is a Visual Journey",
    image: shipImage,
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
        <link rel="canonical" href="/" />
      </Helmet>
      <Navigate to="/stories" replace />
    </>
  );
};

export default Index;
