
import { SEO_CONFIG, getFullUrl, getOgImageUrl } from '@/config/seo';

interface JSONLDSchemaProps {
  type: 'Article' | 'WebPage';
  title: string;
  description: string;
  path: string;
  image?: string;
  heroImage16_9?: string;
  heroImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
  wordCount?: number;
  readTime?: number;
  keywords?: string[];
}

export const JSONLDSchema = ({
  type,
  title,
  description,
  path,
  image,
  heroImage16_9,
  heroImage,
  publishedTime,
  modifiedTime,
  wordCount,
  readTime,
  keywords
}: JSONLDSchemaProps) => {
  const fullUrl = getFullUrl(path);
  const ogImageUrl = getOgImageUrl(image, heroImage16_9, heroImage);

  const baseSchema = {
    "@context": "https://schema.org",
    "@type": type,
    "headline": title,
    "description": description,
    "image": ogImageUrl,
    "url": fullUrl,
    "author": {
      "@type": "Person",
      "name": SEO_CONFIG.author,
      "url": SEO_CONFIG.baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": SEO_CONFIG.siteName,
      "url": SEO_CONFIG.baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": getFullUrl(SEO_CONFIG.logoUrl)
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    }
  };

  // Add article-specific fields
  const articleSchema = type === 'Article' ? {
    ...baseSchema,
    ...(publishedTime && { "datePublished": publishedTime }),
    ...(modifiedTime && { "dateModified": modifiedTime }),
    ...(wordCount && { "wordCount": wordCount }),
    ...(readTime && { "timeRequired": `PT${readTime}M` }),
    ...(keywords && { "keywords": keywords.join(', ') })
  } : baseSchema;

  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(articleSchema)
      }} 
    />
  );
};
