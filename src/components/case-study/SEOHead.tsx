import { Helmet } from 'react-helmet-async';
import { generateSEOMetadata } from '@/utils/seoHelpers';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  path: string;
}

export const SEOHead = ({ title, description, image, path }: SEOHeadProps) => {
  const seoData = generateSEOMetadata({
    title,
    description,
    image,
    url: path,
    type: 'article'
  });

  return (
    <Helmet>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:image" content={seoData.image} />
      <meta property="og:url" content={seoData.url} />
      <meta property="og:type" content={seoData.type} />
      <meta property="og:site_name" content={seoData.siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={seoData.image} />
    </Helmet>
  );
};