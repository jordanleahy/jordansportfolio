
import { Helmet } from 'react-helmet-async';
import { SEO_CONFIG, getFullUrl, getOgImageUrl } from '@/config/seo';

interface OGMetadataProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  heroImage16_9?: string;
  heroImage?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  author?: string;
}

export const OGMetadata = ({
  title,
  description,
  path,
  image,
  heroImage16_9,
  heroImage,
  type = 'website',
  publishedTime,
  modifiedTime,
  keywords,
  author = SEO_CONFIG.author
}: OGMetadataProps) => {
  const fullUrl = getFullUrl(path);
  const ogImageUrl = getOgImageUrl(image, heroImage16_9, heroImage);
  const fullTitle = `${title} | ${SEO_CONFIG.siteName}`;

  // Debug metadata generation
  console.log('OG Metadata generation:', {
    title,
    fullTitle,
    description,
    fullUrl,
    ogImageUrl,
    type,
    publishedTime
  });

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SEO_CONFIG.siteName} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:site" content={SEO_CONFIG.twitterHandle} />
      
      {/* Article specific metadata */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && (
        <meta property="article:author" content={author} />
      )}
      
      {/* SEO improvements */}
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
};
